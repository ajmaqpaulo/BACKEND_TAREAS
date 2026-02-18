export interface Tarea_Crear_DTO {
    titulo: string;
    descripcion?: string;
    estado_id?: string;
    prioridad?: string;
    unidad_id?: string;
}

export interface Tarea_Editar_DTO {
    titulo?: string;
    descripcion?: string;
    estado_id?: string;
    prioridad?: string;
}

export interface Tarea_Detalle_DTO {
    ID: string;
    TITULO: string;
    DESCRIPCION: string | null;
    PRIORIDAD: string;
    UNIDAD_ID: string;
    CREADO_POR: string;
    FECHA_CREACION: string;
    ESTADO_ID: string;
    ESTADO_NOMBRE: string;
    ESTADO_COLOR: string;
}

export interface Solicitud_Crear_DTO {
    tarea_id: string | null;
    tipo_accion: string;
    titulo: string;
    descripcion: string | null;
    estado_id: string | null;
    prioridad: string;
    unidad_id: string;
    solicitante_id: string;
}
