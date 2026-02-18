export interface Reporte_Parametros_DTO {
    fecha_desde?: string;
    fecha_hasta?: string;
    unidad_id?: string;
}

export interface Contadores_Reportes_DTO {
    reportes_aprobados: number;
    reportes_productividad: number;
    reportes_criticidad: number;
    reportes_auditoria: number;
}

export interface Reporte_Resultado_DTO {
    codigo: string;
    nombre_sp: string;
    registros: number;
    datos: any;
}
