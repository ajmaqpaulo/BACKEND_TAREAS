export interface Estado_Crear_DTO {
    nombre: string;
    color: string;
}

export interface Estado_Editar_DTO {
    nombre?: string;
    color?: string;
}

export interface Estado_Detalle_DTO {
    id: string;
    nombre: string;
    color: string;
    orden: number;
    es_defecto: boolean;
    esta_activo: boolean;
    creado_en: string;
}
