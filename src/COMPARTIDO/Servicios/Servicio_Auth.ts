// ============================================================
// Cliente HTTP/HTTPS al Microservicio Auth
// Resuelve USUARIO_ID → nombre, UNIDAD_ID → nombre/color
// Soporta HTTPS con certificados autofirmados (desarrollo)
// ============================================================

import https from "https";

const AUTH_URL = () => process.env.AUTH_SERVICE_URL || "http://localhost:4000";

// Agente HTTPS que acepta certificados autofirmados en desarrollo
const agente_https = new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === "production" });

async function hacer_peticion(ruta: string, token: string): Promise<any> {
    const url = `${AUTH_URL()}${ruta}`;
    const opciones: RequestInit = {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    };

    if (url.startsWith("https") && process.env.NODE_ENV !== "production") {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    const res = await fetch(url, opciones);
    if (!res.ok) return null;
    
    const json = (await res.json()) as { datos: any };
    
    return json.datos;
}

export class Servicio_Auth {
    private static cache_unidades: Map<string, any> = new Map();
    private static cache_usuarios: Map<string, any> = new Map();

    static async obtener_unidades(token: string): Promise<any[]> {
        if (this.cache_unidades.size > 0) return Array.from(this.cache_unidades.values());
        const datos = await hacer_peticion("/api/auth/unidades", token);
        if (datos) datos.forEach((u: any) => this.cache_unidades.set(u.ID, u));
        return datos || [];
    }

    static async obtener_nombre_unidad(unidad_id: string, token: string): Promise<{ nombre: string; codigo: string; color: string }> {
        if (this.cache_unidades.has(unidad_id)) {
            const u = this.cache_unidades.get(unidad_id);
            return { nombre: u.NOMBRE, codigo: u.CODIGO, color: u.COLOR };
        }
        await this.obtener_unidades(token);
        const u = this.cache_unidades.get(unidad_id);
        return u ? { nombre: u.NOMBRE, codigo: u.CODIGO, color: u.COLOR } : { nombre: "Desconocida", codigo: "?", color: "#6B7280" };
    }

    static async obtener_nombre_usuario(usuario_id: string, token: string): Promise<string> {
        if (this.cache_usuarios.has(usuario_id)) return this.cache_usuarios.get(usuario_id);
        const datos = await hacer_peticion("/api/auth/identidad/usuarios?pagina=1&por_pagina=100", token);
        if (datos?.registros) datos.registros.forEach((u: any) => this.cache_usuarios.set(u.ID, u.NOMBRE_COMPLETO));
        return this.cache_usuarios.get(usuario_id) || "Usuario desconocido";
    }

    static limpiar_cache() { this.cache_unidades.clear(); this.cache_usuarios.clear(); }
}
