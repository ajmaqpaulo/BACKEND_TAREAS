import sql from "mssql";

const configuracion: sql.config = {
    server: process.env.BD_SERVIDOR || "",
    port: parseInt(process.env.BD_PUERTO || ""),
    database: process.env.BD_NOMBRE || "",
    user: process.env.BD_USUARIO || "",
    password: process.env.BD_CONTRASENA || "",
    options: {
        encrypt: process.env.BD_ENCRIPTAR === "true",
        trustServerCertificate: process.env.BD_CONFIAR_CERTIFICADO === "true",
    },
    pool: { max: 20, min: 5, idleTimeoutMillis: 30000 },
};

class Conexion_BD {
    private static instancia: Conexion_BD;
    private pool: sql.ConnectionPool | null = null;
    private constructor() {}

    static obtener(): Conexion_BD {
        if (!Conexion_BD.instancia) Conexion_BD.instancia = new Conexion_BD();
        return Conexion_BD.instancia;
    }

    async conectar(): Promise<sql.ConnectionPool> {
        if (!this.pool) {
            this.pool = await new sql.ConnectionPool(configuracion).connect();
            console.log("[TAREAS-BD] Conexión establecida con BD_GESTION_TAREAS");
        }
        return this.pool;
    }

    async obtener_pool(): Promise<sql.ConnectionPool> {
        return this.pool ? this.pool : this.conectar();
    }

    async desconectar(): Promise<void> {
        if (this.pool) { await this.pool.close(); this.pool = null; }
    }
}

export default Conexion_BD;
