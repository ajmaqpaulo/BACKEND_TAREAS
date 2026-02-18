import { Request, Response, NextFunction } from "express";
import { respuesta } from "../DTOs_Generales/API_Response.dto";

export function Requiere_Permiso(...permisos: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.usuario) { res.status(401).json(respuesta(false, "No autenticado")); return; }
        if (!permisos.some(p => req.usuario!.permisos.includes(p))) {
            res.status(403).json(respuesta(false, "Permiso insuficiente"));
            return;
        }
        next();
    };
}

export function Requiere_Rol(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.usuario) { res.status(401).json(respuesta(false, "No autenticado")); return; }
        if (!roles.includes(req.usuario.rol_codigo)) { res.status(403).json(respuesta(false, "Rol insuficiente")); return; }
        next();
    };
}
