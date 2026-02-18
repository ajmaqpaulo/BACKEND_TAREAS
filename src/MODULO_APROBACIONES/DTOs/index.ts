export interface Solicitud_Detalle_DTO {
    id: string;
    tarea_id: string | null;
    tipo_accion: string;
    titulo: string;
    descripcion: string | null;
    prioridad: string;
    unidad_id: string;
    solicitante_id: string;
    estado_solicitud: string;
    creado_en: string;
}

export interface Contadores_Aprobacion_DTO {
    total_pendientes: number;
    total_aprobadas: number;
    total_rechazadas: number;
}

export interface Rechazar_Request_DTO {
    motivo: string;
}

export interface Resultado_Aprobacion_DTO {
    exito: number;
    mensaje: string;
    tarea_id?: string;
}
