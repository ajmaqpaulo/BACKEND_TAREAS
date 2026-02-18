import { Request, Response, NextFunction } from "express";
import { respuesta } from "../DTOs_Generales/API_Response.dto";

export function Middleware_Errores(error: Error, _req: Request, res: Response, _next: NextFunction): void {
    console.error("[TAREAS-ERROR]", error.message);
    const dev = process.env.NODE_ENV === "development";
    res.status(500).json(respuesta(false, "Error interno", null, dev ? [error.message] : undefined));
}
