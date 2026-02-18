import sql from "mssql";
import Conexion_BD from "../CONFIGURACION/Conexion_Base_Datos";

export class Transaccion_Dashboard {
    private async pool() { return Conexion_BD.obtener().obtener_pool(); }

    // ─── TAREAS (tabla principal — solo aprobadas) ────────

    async listar_tareas(unidad_id?: string) {
        const p = await this.pool();
        let w = "T.ELIMINADO_EN IS NULL";
        const req = p.request();
        if (unidad_id) { w += " AND T.UNIDAD_ID = @UNIDAD"; req.input("UNIDAD", sql.UniqueIdentifier, unidad_id); }
        const r = await req.query(`
            SELECT T.ID, T.TITULO, T.DESCRIPCION, T.PRIORIDAD, T.UNIDAD_ID, T.CREADO_POR, T.FECHA_CREACION,
                   ET.ID AS ESTADO_ID, ET.NOMBRE AS ESTADO_NOMBRE, ET.COLOR AS ESTADO_COLOR
            FROM TAREA T
            INNER JOIN ESTADO_TAREA ET ON ET.ID = T.ESTADO_ID
            WHERE ${w}
            ORDER BY T.FECHA_CREACION DESC
        `);
        return r.recordset;
    }

    async obtener_tarea(id: string) {
        const p = await this.pool();
        const r = await p.request().input("ID", sql.UniqueIdentifier, id).query(`
            SELECT T.*, ET.NOMBRE AS ESTADO_NOMBRE, ET.COLOR AS ESTADO_COLOR
            FROM TAREA T INNER JOIN ESTADO_TAREA ET ON ET.ID = T.ESTADO_ID
            WHERE T.ID = @ID AND T.ELIMINADO_EN IS NULL
        `);
        return r.recordset;
    }

    // ─── SOLICITUDES DE APROBACIÓN ────────────────────────

    async crear_solicitud(datos: {
        tarea_id: string | null; tipo_accion: string; titulo: string; descripcion: string | null;
        estado_id: string | null; prioridad: string; unidad_id: string; solicitante_id: string;
    }): Promise<string> {
        const p = await this.pool();
        const r = await p.request()
            .input("TAREA", sql.UniqueIdentifier, datos.tarea_id)
            .input("TIPO", sql.NVarChar, datos.tipo_accion)
            .input("TIT", sql.NVarChar, datos.titulo)
            .input("DESC", sql.NVarChar, datos.descripcion)
            .input("EST", sql.UniqueIdentifier, datos.estado_id)
            .input("PRI", sql.NVarChar, datos.prioridad)
            .input("UNI", sql.UniqueIdentifier, datos.unidad_id)
            .input("SOL", sql.UniqueIdentifier, datos.solicitante_id)
            .query(`
                DECLARE @NID UNIQUEIDENTIFIER = NEWID();
                INSERT INTO SOLICITUD_APROBACION (ID, TAREA_ID, TIPO_ACCION, TITULO, DESCRIPCION, ESTADO_ID, PRIORIDAD, UNIDAD_ID, SOLICITANTE_ID)
                VALUES (@NID, @TAREA, @TIPO, @TIT, @DESC, @EST, @PRI, @UNI, @SOL);
                SELECT @NID AS ID;
            `);
        return r.recordset[0].ID;
    }

    // ─── CREAR TAREA DIRECTA (Admin/Supervisor) ──────────

    async crear_tarea_directa(datos: {
        titulo: string; descripcion: string | null; estado_id: string | null;
        prioridad: string; unidad_id: string; creado_por: string;
    }): Promise<string> {
        const p = await this.pool();
        let estado_id = datos.estado_id;
        if (!estado_id) {
            const def = await p.request().query(`SELECT ID FROM ESTADO_TAREA WHERE ES_DEFECTO = 1 AND ELIMINADO_EN IS NULL`);
            estado_id = def.recordset[0]?.ID;
        }
        const r = await p.request()
            .input("TIT", sql.NVarChar, datos.titulo).input("DESC", sql.NVarChar, datos.descripcion)
            .input("EST", sql.UniqueIdentifier, estado_id).input("PRI", sql.NVarChar, datos.prioridad)
            .input("UNI", sql.UniqueIdentifier, datos.unidad_id).input("POR", sql.UniqueIdentifier, datos.creado_por)
            .query(`DECLARE @NID UNIQUEIDENTIFIER = NEWID();
                INSERT INTO TAREA (ID, TITULO, DESCRIPCION, ESTADO_ID, PRIORIDAD, UNIDAD_ID, CREADO_POR) VALUES (@NID, @TIT, @DESC, @EST, @PRI, @UNI, @POR);
                INSERT INTO HISTORIAL_TAREA (TAREA_ID, ACCION, DATOS_NUEVOS, REALIZADO_POR) VALUES (@NID, 'CREADA', CONCAT('{"titulo":"', @TIT, '"}'), @POR);
                SELECT @NID AS ID;`);
        return r.recordset[0].ID;
    }

    // ─── EDITAR / ELIMINAR DIRECTA (Admin/Supervisor) ────

    async editar_tarea_directa(id: string, datos: { titulo?: string; descripcion?: string; estado_id?: string; prioridad?: string }, por: string) {
        const p = await this.pool();
        const campos: string[] = ["ACTUALIZADO_EN = SYSUTCDATETIME()", "ACTUALIZADO_POR = @POR"];
        const req = p.request().input("ID", sql.UniqueIdentifier, id).input("POR", sql.UniqueIdentifier, por);
        if (datos.titulo) { campos.push("TITULO = @T"); req.input("T", sql.NVarChar, datos.titulo); }
        if (datos.descripcion !== undefined) { campos.push("DESCRIPCION = @D"); req.input("D", sql.NVarChar, datos.descripcion); }
        if (datos.estado_id) { campos.push("ESTADO_ID = @E"); req.input("E", sql.UniqueIdentifier, datos.estado_id); }
        if (datos.prioridad) { campos.push("PRIORIDAD = @P"); req.input("P", sql.NVarChar, datos.prioridad); }
        await req.query(`UPDATE TAREA SET ${campos.join(", ")} WHERE ID = @ID AND ELIMINADO_EN IS NULL`);
        await p.request().input("TID", sql.UniqueIdentifier, id).input("POR2", sql.UniqueIdentifier, por)
            .query(`INSERT INTO HISTORIAL_TAREA (TAREA_ID, ACCION, REALIZADO_POR) VALUES (@TID, 'EDITADA', @POR2)`);
    }

    async eliminar_tarea_directa(id: string, por: string) {
        const p = await this.pool();
        await p.request().input("ID", sql.UniqueIdentifier, id).input("POR", sql.UniqueIdentifier, por)
            .query(`UPDATE TAREA SET ELIMINADO_EN = SYSUTCDATETIME(), ACTUALIZADO_POR = @POR WHERE ID = @ID AND ELIMINADO_EN IS NULL`);
        await p.request().input("TID", sql.UniqueIdentifier, id).input("POR2", sql.UniqueIdentifier, por)
            .query(`INSERT INTO HISTORIAL_TAREA (TAREA_ID, ACCION, REALIZADO_POR) VALUES (@TID, 'ELIMINADA', @POR2)`);
    }

    // ─── HISTORIAL DE UNA TAREA ───────────────────────────

    async historial_tarea(tarea_id: string) {
        const p = await this.pool();
        const r = await p.request().input("TID", sql.UniqueIdentifier, tarea_id).query(`
            SELECT HT.ID, HT.ACCION, HT.DATOS_ANTERIORES, HT.DATOS_NUEVOS,
                   HT.SOLICITUD_ID, HT.REALIZADO_POR, HT.CREADO_EN
            FROM HISTORIAL_TAREA HT WHERE HT.TAREA_ID = @TID ORDER BY HT.CREADO_EN DESC
        `);
        return r.recordset;
    }
}
