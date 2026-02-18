import sql from "mssql";
import Conexion_BD from "../CONFIGURACION/Conexion_Base_Datos";

export class Transaccion_Estados {
    private async pool() { return Conexion_BD.obtener().obtener_pool(); }

    async listar() {
        const p = await this.pool();
        const r = await p.request().query(`SELECT ID, NOMBRE, COLOR, ORDEN, ES_DEFECTO, ESTA_ACTIVO, CREADO_EN FROM ESTADO_TAREA WHERE ELIMINADO_EN IS NULL ORDER BY ORDEN`);
        return r.recordset;
    }

    async crear(nombre: string, color: string, por: string): Promise<string> {
        const p = await this.pool();
        const max = await p.request().query(`SELECT ISNULL(MAX(ORDEN), 0) + 1 AS NEXT_ORDEN FROM ESTADO_TAREA WHERE ELIMINADO_EN IS NULL`);
        const orden = max.recordset[0].NEXT_ORDEN;
        const r = await p.request()
            .input("N", sql.NVarChar, nombre).input("C", sql.NVarChar, color)
            .input("O", sql.Int, orden).input("P", sql.UniqueIdentifier, por)
            .query(`DECLARE @NID UNIQUEIDENTIFIER = NEWID();
                INSERT INTO ESTADO_TAREA (ID, NOMBRE, COLOR, ORDEN, CREADO_POR) VALUES (@NID, @N, @C, @O, @P);
                SELECT @NID AS ID;`);
        return r.recordset[0].ID;
    }

    async editar(id: string, datos: { nombre?: string; color?: string }) {
        const p = await this.pool();
        const campos: string[] = ["ACTUALIZADO_EN = SYSUTCDATETIME()"];
        const req = p.request().input("ID", sql.UniqueIdentifier, id);
        if (datos.nombre) { campos.push("NOMBRE = @N"); req.input("N", sql.NVarChar, datos.nombre); }
        if (datos.color) { campos.push("COLOR = @C"); req.input("C", sql.NVarChar, datos.color); }
        await req.query(`UPDATE ESTADO_TAREA SET ${campos.join(", ")} WHERE ID = @ID AND ELIMINADO_EN IS NULL`);
    }

    async eliminar(id: string) {
        const p = await this.pool();
        await p.request().input("ID", sql.UniqueIdentifier, id)
            .query(`UPDATE ESTADO_TAREA SET ELIMINADO_EN = SYSUTCDATETIME() WHERE ID = @ID AND ES_DEFECTO = 0 AND ELIMINADO_EN IS NULL`);
    }
}
