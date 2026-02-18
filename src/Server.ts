import express from "express";
import cors from "cors";
import Controller_Dashboard from "./MODULO_DASHBOARD/Controller_Dashboard";
import Controller_Estados from "./MODULO_ESTADOS/Controller_Estados";
import Controller_Aprobaciones from "./MODULO_APROBACIONES/Controller_Aprobaciones";
import Controller_Reportes from "./MODULO_REPORTES/Controller_Reportes";
import { Middleware_Errores } from "./COMPARTIDO/Middlewares/Middleware_Errores";
import { configurar_swagger } from "./CONFIGURACION/Swagger";

export function crear_servidor(): express.Application {
    const app = express();
    app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
    app.use(express.json({ limit: "10mb" }));

    // ─── HEALTH CHECK ─────────────────────────────────
    app.get("/api/tareas/health", (_r, res) => res.json({
        estado: "OK", servicio: "BACKEND_TAREAS", marca_tiempo: new Date().toISOString(),
    }));

    // ─── SWAGGER ──────────────────────────────────────
    configurar_swagger(app);

    // ─── RUTAS ────────────────────────────────────────
    app.use("/api/tareas/dashboard", Controller_Dashboard);
    app.use("/api/tareas/estados", Controller_Estados);
    app.use("/api/tareas/aprobaciones", Controller_Aprobaciones);
    app.use("/api/tareas/reportes", Controller_Reportes);

    // ─── ERRORES ──────────────────────────────────────
    app.use(Middleware_Errores);
    return app;
}
