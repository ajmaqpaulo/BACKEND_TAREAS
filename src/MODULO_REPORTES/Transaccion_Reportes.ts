import sql from "mssql";
import Conexion_BD from "../CONFIGURACION/Conexion_Base_Datos";

export class Transaccion_Reportes {
    private async pool() { return Conexion_BD.obtener().obtener_pool(); }

    async contadores() {
        const p = await this.pool();
        const r = await p.request().query(`EXEC sp_CONTADORES_REPORTES`);
        return r.recordset[0];
    }

    async ejecutar_reporte(nombre_sp: string, parametros: {
        fecha_desde?: string; fecha_hasta?: string; unidad_id?: string;
    }) {
        const p = await this.pool();
        const req = p.request();

        if (parametros.fecha_desde) req.input("FECHA_DESDE", sql.DateTime2, parametros.fecha_desde);
        if (parametros.fecha_hasta) req.input("FECHA_HASTA", sql.DateTime2, parametros.fecha_hasta);
        if (parametros.unidad_id) req.input("UNIDAD_ID", sql.UniqueIdentifier, parametros.unidad_id);

        // Construir llamada dinámica al SP
        const params_sp: string[] = [];
        if (parametros.fecha_desde) params_sp.push("@FECHA_DESDE = @FECHA_DESDE");
        if (parametros.fecha_hasta) params_sp.push("@FECHA_HASTA = @FECHA_HASTA");
        if (parametros.unidad_id) params_sp.push("@UNIDAD_ID = @UNIDAD_ID");

        const call = params_sp.length > 0
            ? `EXEC ${nombre_sp} ${params_sp.join(", ")}`
            : `EXEC ${nombre_sp}`;

        const r = await req.query(call);

        // Algunos SPs retornan múltiples recordsets
        if (r.recordsets.length === 1) return r.recordset;
        return r.recordsets;
    }
}
