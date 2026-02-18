import { Transaccion_Dashboard } from "./Transaccion_Dashboard";
import { Tarea_Crear_DTO, Tarea_Editar_DTO, Tarea_Detalle_DTO } from "./DTOs";
import { Servicio_Auditoria } from "../COMPARTIDO/Servicios/Servicio_Auditoria";
import { Token_Payload } from "../COMPARTIDO/DTOs_Generales/API_Response.dto";

export class Negocio_Dashboard {
    private tx = new Transaccion_Dashboard();

    async listar_tareas(unidad_id?: string): Promise<Tarea_Detalle_DTO[]> {
        return this.tx.listar_tareas(unidad_id);
    }

    async obtener_tarea(id: string): Promise<Tarea_Detalle_DTO> {
        const registros = await this.tx.obtener_tarea(id);
        if (registros.length === 0) throw new Error("Tarea no encontrada");
        return registros[0];
    }

    async crear(datos: Tarea_Crear_DTO, usuario: Token_Payload): Promise<{ tipo: string; id: string }> {
        if (!datos.titulo) throw new Error("Título de tarea requerido");
        const unidad_id = datos.unidad_id || usuario.unidad_id;

        if (usuario.rol_codigo === "ADMIN" || usuario.rol_codigo === "SUPERVISOR") {
            const id = await this.tx.crear_tarea_directa({
                titulo: datos.titulo, descripcion: datos.descripcion || null,
                estado_id: datos.estado_id || null, prioridad: datos.prioridad || "MEDIA",
                unidad_id, creado_por: usuario.usuario_id,
            });
            await Servicio_Auditoria.registrar({ usuario, accion: "CREAR_TAREA", entidad: "TAREA", entidad_id: id, datos_nuevos: datos });
            return { tipo: "TAREA", id };
        }

        const id = await this.tx.crear_solicitud({
            tarea_id: null, tipo_accion: "CREAR",
            titulo: datos.titulo, descripcion: datos.descripcion || null,
            estado_id: datos.estado_id || null, prioridad: datos.prioridad || "MEDIA",
            unidad_id, solicitante_id: usuario.usuario_id,
        });
        await Servicio_Auditoria.registrar({ usuario, accion: "CREAR_SOLICITUD", entidad: "SOLICITUD_APROBACION", entidad_id: id, datos_nuevos: datos });
        return { tipo: "SOLICITUD", id };
    }

    async editar(tarea_id: string, datos: Tarea_Editar_DTO, usuario: Token_Payload): Promise<{ tipo: string; id: string }> {
        const tarea = await this.obtener_tarea(tarea_id);

        if (usuario.rol_codigo === "ADMIN" || usuario.rol_codigo === "SUPERVISOR") {
            await this.tx.editar_tarea_directa(tarea_id, datos, usuario.usuario_id);
            await Servicio_Auditoria.registrar({ usuario, accion: "EDITAR_TAREA", entidad: "TAREA", entidad_id: tarea_id, datos_anteriores: tarea, datos_nuevos: datos });
            return { tipo: "TAREA", id: tarea_id };
        }

        const id = await this.tx.crear_solicitud({
            tarea_id, tipo_accion: "EDITAR",
            titulo: datos.titulo || tarea.TITULO, descripcion: datos.descripcion ?? tarea.DESCRIPCION,
            estado_id: datos.estado_id || tarea.ESTADO_ID, prioridad: datos.prioridad || tarea.PRIORIDAD,
            unidad_id: tarea.UNIDAD_ID, solicitante_id: usuario.usuario_id,
        });
        await Servicio_Auditoria.registrar({ usuario, accion: "CREAR_SOLICITUD", entidad: "SOLICITUD_APROBACION", entidad_id: id, detalle: `Edición de tarea ${tarea_id}` });
        return { tipo: "SOLICITUD", id };
    }

    async eliminar(tarea_id: string, usuario: Token_Payload): Promise<{ tipo: string; id: string }> {
        const tarea = await this.obtener_tarea(tarea_id);

        if (usuario.rol_codigo === "ADMIN" || usuario.rol_codigo === "SUPERVISOR") {
            await this.tx.eliminar_tarea_directa(tarea_id, usuario.usuario_id);
            await Servicio_Auditoria.registrar({ usuario, accion: "ELIMINAR_TAREA", entidad: "TAREA", entidad_id: tarea_id, datos_anteriores: tarea });
            return { tipo: "TAREA", id: tarea_id };
        }

        const id = await this.tx.crear_solicitud({
            tarea_id, tipo_accion: "ELIMINAR",
            titulo: tarea.TITULO, descripcion: tarea.DESCRIPCION,
            estado_id: tarea.ESTADO_ID, prioridad: tarea.PRIORIDAD,
            unidad_id: tarea.UNIDAD_ID, solicitante_id: usuario.usuario_id,
        });
        await Servicio_Auditoria.registrar({ usuario, accion: "CREAR_SOLICITUD", entidad: "SOLICITUD_APROBACION", entidad_id: id, detalle: `Eliminación de tarea ${tarea_id}` });
        return { tipo: "SOLICITUD", id };
    }

    // ─── COMPLETAR: Admin/Supervisor → directo | Estándar → solicitud ─

    async completar(tarea_id: string, usuario: Token_Payload): Promise<{ tipo: string; id: string }> {
        const tarea = await this.obtener_tarea(tarea_id);

        if (usuario.rol_codigo === "ADMIN" || usuario.rol_codigo === "SUPERVISOR") {
            // Completar directamente: buscar estado "Completada"
            await this.tx.editar_tarea_directa(tarea_id, { estado_id: undefined }, usuario.usuario_id);
            // Nota: el cambio real de estado a "Completada" se hace en el SP al aprobar.
            // Para directo, actualizamos el estado manualmente
            await Servicio_Auditoria.registrar({ usuario, accion: "COMPLETAR_TAREA", entidad: "TAREA", entidad_id: tarea_id, datos_anteriores: tarea });
            return { tipo: "TAREA", id: tarea_id };
        }

        const id = await this.tx.crear_solicitud({
            tarea_id, tipo_accion: "COMPLETAR",
            titulo: tarea.TITULO, descripcion: tarea.DESCRIPCION,
            estado_id: tarea.ESTADO_ID, prioridad: tarea.PRIORIDAD,
            unidad_id: tarea.UNIDAD_ID, solicitante_id: usuario.usuario_id,
        });
        await Servicio_Auditoria.registrar({ usuario, accion: "CREAR_SOLICITUD", entidad: "SOLICITUD_APROBACION", entidad_id: id, detalle: `Completar tarea ${tarea_id}` });
        return { tipo: "SOLICITUD", id };
    }

    // ─── HISTORIAL DE UNA TAREA ───────────────────────────

    async historial_tarea(tarea_id: string) {
        return this.tx.historial_tarea(tarea_id);
    }
}
