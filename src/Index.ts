import dotenv from "dotenv"; dotenv.config();
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import Conexion_BD from "./CONFIGURACION/Conexion_Base_Datos";
import { crear_servidor } from "./Server";

const PUERTO = parseInt(process.env.PUERTO || "5000");
const USAR_HTTPS = process.env.USAR_HTTPS === "true";

async function iniciar() {
    try {
        await Conexion_BD.obtener().conectar();

        const app = crear_servidor();
        let servidor: http.Server | https.Server;

        if (USAR_HTTPS) {
            const ruta_cert = process.env.SSL_CERT || path.join(__dirname, "../certs/cert.pem");
            const ruta_key = process.env.SSL_KEY || path.join(__dirname, "../certs/key.pem");

            if (!fs.existsSync(ruta_cert) || !fs.existsSync(ruta_key)) {
                console.error("[TAREAS] Certificados SSL no encontrados. Generarlos con:");
                console.error("  mkdir -p certs && openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj '/CN=localhost'");
                process.exit(1);
            }

            const opciones_ssl: https.ServerOptions = {
                cert: fs.readFileSync(ruta_cert),
                key: fs.readFileSync(ruta_key),
            };
            servidor = https.createServer(opciones_ssl, app);
            console.log("[TAREAS] HTTPS habilitado");
        } else {
            servidor = http.createServer(app);
            console.log("[TAREAS] HTTP (desarrollo) — Para HTTPS: USAR_HTTPS=true");
        }

        servidor.listen(PUERTO, () => {
            const protocolo = USAR_HTTPS ? "https" : "http";
            console.log(`[TAREAS] Backend corriendo en ${protocolo}://localhost:${PUERTO}`);
            console.log(`[TAREAS] Auth Service: ${process.env.AUTH_SERVICE_URL}`);
            console.log("[TAREAS] Rutas:");
            console.log("  GET    /api/tareas/dashboard/tareas");
            console.log("  GET    /api/tareas/dashboard/tareas/:id");
            console.log("  POST   /api/tareas/dashboard/tareas");
            console.log("  PUT    /api/tareas/dashboard/tareas/:id");
            console.log("  DELETE /api/tareas/dashboard/tareas/:id");
            console.log("  GET    /api/tareas/estados");
            console.log("  POST   /api/tareas/estados");
            console.log("  PUT    /api/tareas/estados/:id");
            console.log("  DELETE /api/tareas/estados/:id");
            console.log("  GET    /api/tareas/aprobaciones");
            console.log("  GET    /api/tareas/aprobaciones/contadores");
            console.log("  POST   /api/tareas/aprobaciones/:id/aprobar");
            console.log("  POST   /api/tareas/aprobaciones/:id/rechazar");
            console.log("  GET    /api/tareas/reportes/contadores");
            console.log("  GET    /api/tareas/reportes/ejecutar/:codigo");
        });
    } catch (e) { console.error("[TAREAS] Error fatal:", e); process.exit(1); }
}

process.on("SIGINT", async () => { await Conexion_BD.obtener().desconectar(); process.exit(0); });
process.on("SIGTERM", async () => { await Conexion_BD.obtener().desconectar(); process.exit(0); });
iniciar();
