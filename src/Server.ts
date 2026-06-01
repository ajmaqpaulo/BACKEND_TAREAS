import express from "express";
import cors from "cors";
import Conexion_BD from "./CONFIGURACION/Conexion_Base_Datos";
import Controller_Dashboard from "./MODULO_DASHBOARD/Controller_Dashboard";
import Controller_Estados from "./MODULO_ESTADOS/Controller_Estados";
import Controller_Aprobaciones from "./MODULO_APROBACIONES/Controller_Aprobaciones";
import Controller_Reportes from "./MODULO_REPORTES/Controller_Reportes";
import { Middleware_Errores } from "./COMPARTIDO/Middlewares/Middleware_Errores";
import { configurar_swagger } from "./CONFIGURACION/Swagger";

export function crear_servidor(): express.Application {
    const app = express();
    const origenes = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176")
        .split(",").map((s) => s.trim()).filter(Boolean);
    app.use(cors({
        origin: (origin, cb) => (!origin || origenes.includes(origin)) ? cb(null, true) : cb(new Error("CORS bloqueado")),
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));
    app.use(express.json({ limit: "10mb" }));

    // ─── HEALTH CHECK ─────────────────────────────────
    app.get("/api/tareas/health", async (_r, res) => {
        try {
            const pool = await Conexion_BD.obtener().obtener_pool();
            await pool.request().query("SELECT 1");
            res.json({ estado: "OK", db: "OK", servicio: "BACKEND_TAREAS", marca_tiempo: new Date().toISOString() });
        } catch (e: any) {
            res.status(503).json({ estado: "FAIL", db: e.message, servicio: "BACKEND_TAREAS", marca_tiempo: new Date().toISOString() });
        }
    });

    // ─── SWAGGER ──────────────────────────────────────
    configurar_swagger(app);

    // ─── RUTAS ────────────────────────────────────────
    app.use("/api/tareas/dashboard", Controller_Dashboard);
    app.use("/api/tareas/estados", Controller_Estados);
    app.use("/api/tareas/aprobaciones", Controller_Aprobaciones);
    app.use("/api/tareas/reportes", Controller_Reportes);

    // ─── 404 ──────────────────────────────────────────
    app.use((req, res) => res.status(404).json({ exito: false, mensaje: `Ruta no encontrada: ${req.method} ${req.path}`, datos: null, marca_tiempo: new Date().toISOString() }));

    // ─── ERRORES ──────────────────────────────────────
    app.use(Middleware_Errores);
    return app;
}
