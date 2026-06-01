// Recordset SQL Server (UPPERCASE) — el código que lo consume ya accede así.
export interface Solicitud_Detalle_DTO {
    ID: string;
    TAREA_ID: string | null;
    TIPO_ACCION: string;
    TITULO: string;
    DESCRIPCION: string | null;
    PRIORIDAD: string;
    UNIDAD_ID: string;
    SOLICITANTE_ID: string;
    ESTADO_SOLICITUD: string;
    CREADO_EN: string;
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
