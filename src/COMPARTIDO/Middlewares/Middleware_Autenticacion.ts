import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Token_Payload, respuesta } from "../DTOs_Generales/API_Response.dto";

declare global { namespace Express { interface Request { usuario?: Token_Payload; } } }

export async function Middleware_Auth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith("Bearer ")) {
            res.status(401).json(respuesta(false, "Token de acceso requerido"));
            return;
        }
        const token = header.split(" ")[1];
        // Verifica localmente con el mismo secreto JWT compartido
        const payload = jwt.verify(token, process.env.JWT_SECRETO || "") as Token_Payload;
        req.usuario = payload;
        next();
    } catch {
        res.status(401).json(respuesta(false, "Token inválido o expirado"));
    }
}
