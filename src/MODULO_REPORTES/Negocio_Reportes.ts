import { Transaccion_Reportes } from "./Transaccion_Reportes";
import { Reporte_Parametros_DTO, Contadores_Reportes_DTO, Reporte_Resultado_DTO } from "./DTOs";
import { Servicio_Auditoria } from "../COMPARTIDO/Servicios/Servicio_Auditoria";
import { Token_Payload } from "../COMPARTIDO/DTOs_Generales/API_Response.dto";

const SP_PERMITIDOS: Record<string, string> = {
    "RPT_SOLICITUDES_APROBADAS":    "sp_REPORTE_SOLICITUDES_APROBADAS",
    "RPT_PRODUCTIVIDAD_UNIDAD":     "sp_REPORTE_PRODUCTIVIDAD_UNIDAD",
    "RPT_PRIORIDAD_CRITICIDAD":     "sp_REPORTE_PRIORIDAD_CRITICIDAD",
    "RPT_AUDITORIA_SISTEMA":        "sp_REPORTE_AUDITORIA_SISTEMA",
    "RPT_SOLICITUDES_RECHAZADAS":   "sp_REPORTE_SOLICITUDES_RECHAZADAS",
};

export class Negocio_Reportes {
    private tx = new Transaccion_Reportes();

    async contadores(): Promise<Contadores_Reportes_DTO> {
        return this.tx.contadores();
    }

    async ejecutar(codigo: string, parametros: Reporte_Parametros_DTO, usuario: Token_Payload): Promise<Reporte_Resultado_DTO> {
        const codigo_upper = codigo.toUpperCase();
        const nombre_sp = SP_PERMITIDOS[codigo_upper];
        if (!nombre_sp) throw new Error(`Reporte '${codigo}' no encontrado`);

        const datos: any = await this.tx.ejecutar_reporte(nombre_sp, parametros);
        const registros = Array.isArray(datos[0]) ? (datos as any[][]).reduce((acc: number, rs: any[]) => acc + rs.length, 0) : datos.length;

        await Servicio_Auditoria.registrar({
            usuario, accion: "EJECUTAR_REPORTE", entidad: "REPORTE",
            entidad_id: codigo_upper, detalle: `SP: ${nombre_sp}, Registros: ${registros}`,
            datos_nuevos: parametros,
        });

        return { codigo: codigo_upper, nombre_sp, registros, datos };
    }
}