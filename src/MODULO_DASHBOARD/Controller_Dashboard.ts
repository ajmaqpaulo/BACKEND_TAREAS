import { Router, Request, Response } from "express";
import { Negocio_Dashboard } from "./Negocio_Dashboard";
import { Middleware_Auth } from "../COMPARTIDO/Middlewares/Middleware_Autenticacion";
import { respuesta } from "../COMPARTIDO/DTOs_Generales/API_Response.dto";

const router = Router();
const negocio = new Negocio_Dashboard();

// ─── LISTAR TAREAS ────────────────────────────────────
router.get("/tareas", Middleware_Auth, async (req: Request, res: Response) => {
    try {
        const unidad_id = req.query.unidad_id as string || undefined;
        res.json(respuesta(true, "Tareas obtenidas", await negocio.listar_tareas(unidad_id)));
    } catch (e: any) { res.status(500).json(respuesta(false, e.message)); }
});

// ─── OBTENER TAREA ────────────────────────────────────
router.get("/tareas/:id", Middleware_Auth, async (req: Request, res: Response) => {
    try { res.json(respuesta(true, "Tarea obtenida", await negocio.obtener_tarea(req.params.id))); }
    catch (e: any) { res.status(404).json(respuesta(false, e.message)); }
});

// ─── CREAR TAREA ──────────────────────────────────────
router.post("/tareas", Middleware_Auth, async (req: Request, res: Response) => {
    try {
        const resultado = await negocio.crear(req.body, req.usuario!);
        const mensaje = resultado.tipo === "TAREA" ? "Tarea creada" : "Solicitud de creación enviada a aprobación";
        res.status(201).json(respuesta(true, mensaje, resultado));
    } catch (e: any) { res.status(400).json(respuesta(false, e.message)); }
});

// ─── EDITAR TAREA ─────────────────────────────────────
router.put("/tareas/:id", Middleware_Auth, async (req: Request, res: Response) => {
    try {
        const resultado = await negocio.editar(req.params.id, req.body, req.usuario!);
        const mensaje = resultado.tipo === "TAREA" ? "Tarea actualizada" : "Solicitud de edición enviada a aprobación";
        res.json(respuesta(true, mensaje, resultado));
    } catch (e: any) { res.status(400).json(respuesta(false, e.message)); }
});

// ─── ELIMINAR TAREA ───────────────────────────────────
router.delete("/tareas/:id", Middleware_Auth, async (req: Request, res: Response) => {
    try {
        const resultado = await negocio.eliminar(req.params.id, req.usuario!);
        const mensaje = resultado.tipo === "TAREA" ? "Tarea eliminada" : "Solicitud de eliminación enviada a aprobación";
        res.json(respuesta(true, mensaje, resultado));
    } catch (e: any) { res.status(400).json(respuesta(false, e.message)); }
});

// ─── COMPLETAR TAREA ──────────────────────────────────
router.post("/tareas/:id/completar", Middleware_Auth, async (req: Request, res: Response) => {
    try {
        const resultado = await negocio.completar(req.params.id, req.usuario!);
        const mensaje = resultado.tipo === "TAREA" ? "Tarea completada" : "Solicitud de completar enviada a aprobación";
        res.json(respuesta(true, mensaje, resultado));
    } catch (e: any) { res.status(400).json(respuesta(false, e.message)); }
});

// ─── HISTORIAL DE UNA TAREA ───────────────────────────
router.get("/tareas/:id/historial", Middleware_Auth, async (req: Request, res: Response) => {
    try { res.json(respuesta(true, "Historial obtenido", await negocio.historial_tarea(req.params.id))); }
    catch (e: any) { res.status(500).json(respuesta(false, e.message)); }
});

export default router;
