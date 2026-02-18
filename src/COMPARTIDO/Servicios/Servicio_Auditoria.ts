// ============================================================
// Servicio de Auditoría — Registra TODOS los movimientos
// Tabla: AUDITORIA_TAREAS en BD_GESTION_TAREAS
// ============================================================
// Nunca rompe el flujo principal (try-catch silencioso)
// ============================================================

import sql from "mssql";
import Conexion_BD from "../../CONFIGURACION/Conexion_Base_Datos";
import { Token_Payload } from "../DTOs_Generales/API_Response.dto";

export interface Datos_Auditoria {
    usuario?: Token_Payload | null;
    accion: string;
    entidad: string;
    entidad_id?: string | null;
    datos_anteriores?: any;
    datos_nuevos?: any;
    ip?: string | null;
    agente?: string | null;
    resultado?: string;
    detalle?: string | null;
}

export class Servicio_Auditoria {

    static async registrar(datos: Datos_Auditoria): Promise<void> {
        try {
            const pool = await Conexion_BD.obtener().obtener_pool();
            await pool.request()
                .input("UID",         sql.UniqueIdentifier, datos.usuario?.usuario_id || null)
                .input("NOMBRE",      sql.NVarChar,         datos.usuario?.nombre_completo || null)
                .input("ROL",         sql.NVarChar,         datos.usuario?.rol_codigo || null)
                .input("UNIDAD",      sql.UniqueIdentifier, datos.usuario?.unidad_id || null)
                .input("ACCION",      sql.NVarChar,         datos.accion)
                .input("ENTIDAD",     sql.NVarChar,         datos.entidad)
                .input("EID",         sql.NVarChar,         datos.entidad_id || null)
                .input("ANTERIORES",  sql.NVarChar,         datos.datos_anteriores ? JSON.stringify(datos.datos_anteriores) : null)
                .input("NUEVOS",      sql.NVarChar,         datos.datos_nuevos ? JSON.stringify(datos.datos_nuevos) : null)
                .input("IP",          sql.NVarChar,         datos.ip || null)
                .input("AGENTE",      sql.NVarChar,         datos.agente || null)
                .input("RESULTADO",   sql.NVarChar,         datos.resultado || "EXITOSO")
                .input("DETALLE",     sql.NVarChar,         datos.detalle || null)
                .query(`
                    INSERT INTO AUDITORIA_TAREAS
                        (USUARIO_ID, USUARIO_NOMBRE, ROL_CODIGO, UNIDAD_ID, ACCION, ENTIDAD, ENTIDAD_ID,
                         DATOS_ANTERIORES, DATOS_NUEVOS, DIRECCION_IP, AGENTE_USUARIO, RESULTADO, DETALLE)
                    VALUES
                        (@UID, @NOMBRE, @ROL, @UNIDAD, @ACCION, @ENTIDAD, @EID,
                         @ANTERIORES, @NUEVOS, @IP, @AGENTE, @RESULTADO, @DETALLE)
                `);
        } catch (e) {
            // Auditoría NUNCA rompe el flujo principal
            console.error("[AUDITORIA-TAREAS]", e);
        }
    }
}
