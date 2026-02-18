import sql from "mssql";
import Conexion_BD from "../CONFIGURACION/Conexion_Base_Datos";

export class Transaccion_Aprobaciones {
    private async pool() { return Conexion_BD.obtener().obtener_pool(); }

    async contadores(unidad_id?: string) {
        const p = await this.pool();
        const req = p.request();
        if (unidad_id) req.input("UNI", sql.UniqueIdentifier, unidad_id);
        const r = await req.query(`EXEC sp_CONTADORES_APROBACIONES ${unidad_id ? "@UNIDAD_ID = @UNI" : ""}`);
        return r.recordset[0];
    }

    // ─── LISTAR SOLICITUDES (pendientes, aprobadas, rechazadas) ───

    async listar(filtros: {
        unidad_id?: string; estado_solicitud?: string; prioridad?: string;
        tipo_accion?: string; busqueda?: string;
    }) {
        const p = await this.pool();
        const f: string[] = ["1=1"];
        const req = p.request();
        if (filtros.unidad_id) { f.push("SA.UNIDAD_ID = @UNI"); req.input("UNI", sql.UniqueIdentifier, filtros.unidad_id); }
        if (filtros.estado_solicitud) { f.push("SA.ESTADO_SOLICITUD = @EST"); req.input("EST", sql.NVarChar, filtros.estado_solicitud); }
        else { f.push("SA.ESTADO_SOLICITUD = 'PENDIENTE'"); }
        if (filtros.prioridad) { f.push("SA.PRIORIDAD = @PRI"); req.input("PRI", sql.NVarChar, filtros.prioridad); }
        if (filtros.tipo_accion) { f.push("SA.TIPO_ACCION = @TIPO"); req.input("TIPO", sql.NVarChar, filtros.tipo_accion); }
        if (filtros.busqueda) { f.push("(SA.TITULO LIKE @BUS)"); req.input("BUS", sql.NVarChar, `%${filtros.busqueda}%`); }
        const w = f.join(" AND ");
        const r = await req.query(`
            SELECT SA.ID, SA.TAREA_ID, SA.TIPO_ACCION, SA.TITULO, SA.DESCRIPCION, SA.PRIORIDAD,
                   SA.UNIDAD_ID, SA.SOLICITANTE_ID, SA.ESTADO_SOLICITUD, SA.APROBADO_POR,
                   SA.MOTIVO_RECHAZO, SA.FECHA_RESOLUCION, SA.CREADO_EN,
                   ET.NOMBRE AS ESTADO_TAREA_NOMBRE, ET.COLOR AS ESTADO_TAREA_COLOR
            FROM SOLICITUD_APROBACION SA
            LEFT JOIN ESTADO_TAREA ET ON ET.ID = SA.ESTADO_ID
            WHERE ${w} ORDER BY SA.CREADO_EN DESC
        `);
        return r.recordset;
    }

    // ─── DETALLE DE UNA SOLICITUD ─────────────────────────

    async obtener_detalle(solicitud_id: string) {
        const p = await this.pool();
        const r = await p.request().input("SID", sql.UniqueIdentifier, solicitud_id).query(`
            SELECT SA.*, ET.NOMBRE AS ESTADO_TAREA_NOMBRE, ET.COLOR AS ESTADO_TAREA_COLOR
            FROM SOLICITUD_APROBACION SA
            LEFT JOIN ESTADO_TAREA ET ON ET.ID = SA.ESTADO_ID
            WHERE SA.ID = @SID
        `);
        return r.recordset[0] || null;
    }

    // ─── MIS SOLICITUDES (para usuario estándar) ──────────

    async mis_solicitudes(solicitante_id: string, estado_solicitud?: string) {
        const p = await this.pool();
        const f: string[] = ["SA.SOLICITANTE_ID = @SOL"];
        const req = p.request().input("SOL", sql.UniqueIdentifier, solicitante_id);
        if (estado_solicitud) { f.push("SA.ESTADO_SOLICITUD = @EST"); req.input("EST", sql.NVarChar, estado_solicitud); }
        const w = f.join(" AND ");
        const r = await req.query(`
            SELECT SA.ID, SA.TAREA_ID, SA.TIPO_ACCION, SA.TITULO, SA.PRIORIDAD,
                   SA.ESTADO_SOLICITUD, SA.MOTIVO_RECHAZO, SA.FECHA_RESOLUCION, SA.CREADO_EN
            FROM SOLICITUD_APROBACION SA WHERE ${w} ORDER BY SA.CREADO_EN DESC
        `);
        return r.recordset;
    }

    // ─── VERIFICAR UNIDAD DE LA SOLICITUD ─────────────────

    async obtener_unidad_solicitud(solicitud_id: string): Promise<string | null> {
        const p = await this.pool();
        const r = await p.request().input("SID", sql.UniqueIdentifier, solicitud_id)
            .query(`SELECT UNIDAD_ID FROM SOLICITUD_APROBACION WHERE ID = @SID AND ESTADO_SOLICITUD = 'PENDIENTE'`);
        return r.recordset[0]?.UNIDAD_ID || null;
    }

    // ─── APROBAR / RECHAZAR (ejecutan SPs transaccionales) ─

    async aprobar(solicitud_id: string, aprobado_por: string, observacion?: string) {
        const p = await this.pool();
        const r = await p.request()
            .input("SID", sql.UniqueIdentifier, solicitud_id)
            .input("POR", sql.UniqueIdentifier, aprobado_por)
            .query(`EXEC sp_APROBAR_SOLICITUD @SOLICITUD_ID = @SID, @APROBADO_POR = @POR`);
        return r.recordset[0];
    }

    async rechazar(solicitud_id: string, rechazado_por: string, motivo: string) {
        const p = await this.pool();
        const r = await p.request()
            .input("SID", sql.UniqueIdentifier, solicitud_id)
            .input("POR", sql.UniqueIdentifier, rechazado_por)
            .input("MOT", sql.NVarChar, motivo)
            .query(`EXEC sp_RECHAZAR_SOLICITUD @SOLICITUD_ID = @SID, @RECHAZADO_POR = @POR, @MOTIVO = @MOT`);
        return r.recordset[0];
    }

    // ─── REENVÍO (solicitud rechazada → nueva solicitud) ──

    async reenviar_solicitud(solicitud_original_id: string, datos: {
        titulo: string; descripcion: string | null; estado_id: string | null;
        prioridad: string; solicitante_id: string;
    }): Promise<string> {
        const p = await this.pool();
        // Obtener datos de la solicitud original
        const orig = await this.obtener_detalle(solicitud_original_id);
        if (!orig || orig.ESTADO_SOLICITUD !== "RECHAZADA") throw new Error("Solo se pueden reenviar solicitudes rechazadas");

        const r = await p.request()
            .input("TAREA", sql.UniqueIdentifier, orig.TAREA_ID)
            .input("TIPO", sql.NVarChar, orig.TIPO_ACCION)
            .input("TIT", sql.NVarChar, datos.titulo)
            .input("DESC", sql.NVarChar, datos.descripcion)
            .input("EST", sql.UniqueIdentifier, datos.estado_id || orig.ESTADO_ID)
            .input("PRI", sql.NVarChar, datos.prioridad)
            .input("UNI", sql.UniqueIdentifier, orig.UNIDAD_ID)
            .input("SOL", sql.UniqueIdentifier, datos.solicitante_id)
            .query(`
                DECLARE @NID UNIQUEIDENTIFIER = NEWID();
                INSERT INTO SOLICITUD_APROBACION (ID, TAREA_ID, TIPO_ACCION, TITULO, DESCRIPCION, ESTADO_ID, PRIORIDAD, UNIDAD_ID, SOLICITANTE_ID)
                VALUES (@NID, @TAREA, @TIPO, @TIT, @DESC, @EST, @PRI, @UNI, @SOL);
                SELECT @NID AS ID;
            `);
        return r.recordset[0].ID;
    }
}
