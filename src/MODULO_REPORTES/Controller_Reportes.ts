import { Router, Request, Response } from "express";
import { Negocio_Reportes } from "./Negocio_Reportes";
import { Middleware_Auth } from "../COMPARTIDO/Middlewares/Middleware_Autenticacion";
import { Requiere_Permiso } from "../COMPARTIDO/Middlewares/Middleware_Permisos";
import { respuesta } from "../COMPARTIDO/DTOs_Generales/API_Response.dto";

const router = Router();
const negocio = new Negocio_Reportes();

router.get("/contadores", Middleware_Auth, Requiere_Permiso("VER_REPORTES"), async (_req: Request, res: Response) => {
    try { res.json(respuesta(true, "Contadores obtenidos", await negocio.contadores())); }
    catch (e: any) { res.status(500).json(respuesta(false, e.message)); }
});

router.get("/ejecutar/:codigo", Middleware_Auth, Requiere_Permiso("VER_REPORTES"), async (req: Request, res: Response) => {
    try {
        const resultado = await negocio.ejecutar(req.params.codigo, {
            fecha_desde: req.query.fecha_desde as string,
            fecha_hasta: req.query.fecha_hasta as string,
            unidad_id: req.query.unidad_id as string,
        }, req.usuario!);
        res.json(respuesta(true, `Reporte ${resultado.codigo} generado`, resultado));
    } catch (e: any) { res.status(400).json(respuesta(false, e.message)); }
});

export default router;
