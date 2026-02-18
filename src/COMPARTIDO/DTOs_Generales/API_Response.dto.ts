export interface API_Respuesta<T> { exito: boolean; mensaje: string; datos: T | null; errores?: string[]; marca_tiempo: string; }
export interface Paginado<T> { registros: T[]; total: number; pagina: number; por_pagina: number; total_paginas: number; }

export interface Token_Payload {
    usuario_id: string; correo: string; nombre_completo: string;
    rol_codigo: string; rol_id: string; unidad_id: string; unidad_codigo: string;
    permisos: string[]; pantallas: string[]; jti: string;
}

export function respuesta<T>(exito: boolean, mensaje: string, datos: T | null = null, errores?: string[]): API_Respuesta<T> {
    return { exito, mensaje, datos, errores, marca_tiempo: new Date().toISOString() };
}
