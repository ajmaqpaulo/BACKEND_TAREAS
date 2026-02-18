import { Router, Request, Response } from "express";
import { Negocio_Aprobaciones } from "./Negocio_Aprobaciones";
import { Middleware_Auth } from "../COMPARTIDO/Middlewares/Middleware_Autenticacion";
import { Requiere_Permiso } from "../COMPARTIDO/Middlewares/Middleware_Permisos";
import { respuesta } from "../COMPARTIDO/DTOs_Generales/API_Response.dto";

const router = Router();
const negocio = new Negocio_Aprobaciones();

// ═══════════════════════════════════════════════════════
// SUPERVISOR / ADMIN
// ═══════════════════════════════════════════════════════

router.get("/contadores", Middleware_Auth, Requiere_Permiso("APROBAR_SOLICITUDES"), async (req: Request, res: Response) => {
    try { res.json(respuesta(true, "Contadores obtenidos", await negocio.contadores(req.query.unidad_id as string))); }
    catch (e: any) { res.status(500).json(respuesta(false, e.message)); }
});

// Listar solicitudes (con filtros: estado_solicitud, prioridad, tipo_accion)
router.get("/", Middleware_Auth, Requiere_Permiso("APROBAR_SOLICITUDES"), async (req: Request, res: Response) => {
    try {
        const datos = await negocio.listar(req.usuario!, {
            unidad_id: req.query.unidad_id as string,
            estado_solicitud: req.query.estado_solicitud as string,
            prioridad: req.query.prioridad as string,
            tipo_accion: req.query.tipo_accion as string,
            busqueda: req.query.busqueda as string,
        });
        res.json(respuesta(true, "Solicitudes obtenidas", datos));
    } catch (e: any) { res.status(500).json(respuesta(false, e.message)); }
});

// Detalle de una solicitud
router.get("/:id", Middleware_Auth, async (req: Request, res: Response) => {
    try { res.json(respuesta(true, "Detalle obtenido", await negocio.obtener_detalle(req.params.id))); }
    catch (e: any) { res.status(404).json(respuesta(false, e.message)); }
});

// Aprobar (con observación opcional)
router.post("/:id/aprobar", Middleware_Auth, Requiere_Permiso("APROBAR_SOLICITUDES"), async (req: Request, res: Response) => {
    try {
        const resultado = await negocio.aprobar(req.params.id, req.usuario!, req.body.observacion);
        res.json(respuesta(true, resultado.mensaje, resultado));
    } catch (e: any) { res.status(400).json(respuesta(false, e.message)); }
});

// Rechazar (motivo obligatorio, mínimo 10 caracteres)
router.post("/:id/rechazar", Middleware_Auth, Requiere_Permiso("RECHAZAR_SOLICITUDES"), async (req: Request, res: Response) => {
    try {
        const resultado = await negocio.rechazar(req.params.id, req.body.motivo, req.usuario!);
        res.json(respuesta(true, resultado.mensaje, resultado));
    } catch (e: any) { res.status(400).json(respuesta(false, e.message)); }
});

// ═══════════════════════════════════════════════════════
// USUARIO ESTÁNDAR — Mis solicitudes
// ═══════════════════════════════════════════════════════

// Ver mis solicitudes (todas o filtrado por estado)
router.get("/mis-solicitudes/listar", Middleware_Auth, async (req: Request, res: Response) => {
    try {
        const datos = await negocio.mis_solicitudes(req.usuario!, req.query.estado_solicitud as string);
        res.json(respuesta(true, "Mis solicitudes obtenidas", datos));
    } catch (e: any) { res.status(500).json(respuesta(false, e.message)); }
});

// Reenviar solicitud rechazada (con correcciones)
router.post("/:id/reenviar", Middleware_Auth, async (req: Request, res: Response) => {
    try {
        const resultado = await negocio.reenviar(req.params.id, req.body, req.usuario!);
        res.status(201).json(respuesta(true, "Solicitud reenviada a aprobación", resultado));
    } catch (e: any) { res.status(400).json(respuesta(false, e.message)); }
});

export default router;
