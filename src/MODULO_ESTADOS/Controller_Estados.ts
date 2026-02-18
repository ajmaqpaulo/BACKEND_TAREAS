import { Router, Request, Response } from "express";
import { Negocio_Estados } from "./Negocio_Estados";
import { Middleware_Auth } from "../COMPARTIDO/Middlewares/Middleware_Autenticacion";
import { respuesta } from "../COMPARTIDO/DTOs_Generales/API_Response.dto";

const router = Router();
const negocio = new Negocio_Estados();

router.get("/", Middleware_Auth, async (_req: Request, res: Response) => {
    try { res.json(respuesta(true, "Estados obtenidos", await negocio.listar())); }
    catch (e: any) { res.status(500).json(respuesta(false, e.message)); }
});

router.post("/", Middleware_Auth, async (req: Request, res: Response) => {
    try {
        const id = await negocio.crear(req.body, req.usuario!);
        res.status(201).json(respuesta(true, "Estado creado", { id }));
    } catch (e: any) { res.status(400).json(respuesta(false, e.message)); }
});

router.put("/:id", Middleware_Auth, async (req: Request, res: Response) => {
    try { await negocio.editar(req.params.id, req.body, req.usuario!); res.json(respuesta(true, "Estado actualizado")); }
    catch (e: any) { res.status(400).json(respuesta(false, e.message)); }
});

router.delete("/:id", Middleware_Auth, async (req: Request, res: Response) => {
    try { await negocio.eliminar(req.params.id, req.usuario!); res.json(respuesta(true, "Estado eliminado")); }
    catch (e: any) { res.status(400).json(respuesta(false, e.message)); }
});

export default router;
