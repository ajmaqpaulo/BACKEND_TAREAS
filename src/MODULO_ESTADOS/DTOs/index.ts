export interface Estado_Crear_DTO {
    nombre: string;
    color: string;
}

export interface Estado_Editar_DTO {
    nombre?: string;
    color?: string;
}

// Forma real del recordset SQL Server (UPPERCASE).
// El frontend recibe los campos tal cual.
export interface Estado_Detalle_DTO {
    ID: string;
    NOMBRE: string;
    COLOR: string;
    ORDEN: number;
    ES_DEFECTO: boolean;
    ESTA_ACTIVO: boolean;
    CREADO_EN: string;
}
