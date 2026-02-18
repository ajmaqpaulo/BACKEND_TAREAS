import { Transaccion_Aprobaciones } from "./Transaccion_Aprobaciones";
import { Servicio_Auditoria } from "../COMPARTIDO/Servicios/Servicio_Auditoria";
import { Token_Payload } from "../COMPARTIDO/DTOs_Generales/API_Response.dto";

export class Negocio_Aprobaciones {
    private tx = new Transaccion_Aprobaciones();

    async contadores(unidad_id?: string) {
        return this.tx.contadores(unidad_id);
    }

    // ─── LISTAR (Supervisor: su unidad | Admin: todo) ─────

    async listar(usuario: Token_Payload, filtros: {
        unidad_id?: string; estado_solicitud?: string; prioridad?: string;
        tipo_accion?: string; busqueda?: string;
    }) {
        const unidad_id = usuario.rol_codigo === "ADMIN" ? filtros.unidad_id : usuario.unidad_id;
        return this.tx.listar({ ...filtros, unidad_id });
    }

    // ─── DETALLE DE UNA SOLICITUD ─────────────────────────

    async obtener_detalle(solicitud_id: string) {
        const detalle = await this.tx.obtener_detalle(solicitud_id);
        if (!detalle) throw new Error("Solicitud no encontrada");
        return detalle;
    }

    // ─── MIS SOLICITUDES (usuario estándar ve las suyas) ──

    async mis_solicitudes(usuario: Token_Payload, estado_solicitud?: string) {
        return this.tx.mis_solicitudes(usuario.usuario_id, estado_solicitud);
    }

    // ─── APROBAR ──────────────────────────────────────────
    // Validaciones:
    //   1. La solicitud debe estar PENDIENTE
    //   2. El supervisor debe pertenecer a la MISMA UNIDAD (excepto Admin)
    //   3. No puede aprobar sus propias solicitudes (anti auto-aprobación)

    async aprobar(solicitud_id: string, usuario: Token_Payload, observacion?: string) {
        // Verificar que la solicitud existe y pertenece a la misma unidad
        const unidad_solicitud = await this.tx.obtener_unidad_solicitud(solicitud_id);
        if (!unidad_solicitud) throw new Error("Solicitud no encontrada o ya fue procesada");

        // Validar misma unidad (Supervisor solo su unidad, Admin puede cualquiera)
        if (usuario.rol_codigo !== "ADMIN" && unidad_solicitud !== usuario.unidad_id) {
            await Servicio_Auditoria.registrar({
                usuario, accion: "APROBAR_SOLICITUD", entidad: "SOLICITUD_APROBACION",
                entidad_id: solicitud_id, resultado: "DENEGADO", detalle: "Unidad diferente a la del supervisor",
            });
            throw new Error("No puede aprobar solicitudes de otra unidad organizacional");
        }

        // Validar anti auto-aprobación
        const detalle = await this.tx.obtener_detalle(solicitud_id);
        if (detalle && detalle.SOLICITANTE_ID === usuario.usuario_id) {
            await Servicio_Auditoria.registrar({
                usuario, accion: "APROBAR_SOLICITUD", entidad: "SOLICITUD_APROBACION",
                entidad_id: solicitud_id, resultado: "DENEGADO", detalle: "Intento de auto-aprobación",
            });
            throw new Error("No puede aprobar sus propias solicitudes");
        }

        const resultado = await this.tx.aprobar(solicitud_id, usuario.usuario_id, observacion);
        if (resultado.EXITO !== 1) throw new Error(resultado.MENSAJE);

        await Servicio_Auditoria.registrar({
            usuario, accion: "APROBAR_SOLICITUD", entidad: "SOLICITUD_APROBACION",
            entidad_id: solicitud_id,
            detalle: `Tipo: ${detalle?.TIPO_ACCION} | Tarea: ${resultado.TAREA_ID}${observacion ? ` | Obs: ${observacion}` : ""}`,
        });
        return { exito: resultado.EXITO, mensaje: resultado.MENSAJE, tarea_id: resultado.TAREA_ID };
    }

    // ─── RECHAZAR ─────────────────────────────────────────
    // Validaciones iguales que aprobar + motivo obligatorio

    async rechazar(solicitud_id: string, motivo: string, usuario: Token_Payload) {
        if (!motivo || motivo.trim().length < 10) throw new Error("El motivo de rechazo debe tener al menos 10 caracteres");

        const unidad_solicitud = await this.tx.obtener_unidad_solicitud(solicitud_id);
        if (!unidad_solicitud) throw new Error("Solicitud no encontrada o ya fue procesada");

        if (usuario.rol_codigo !== "ADMIN" && unidad_solicitud !== usuario.unidad_id) {
            await Servicio_Auditoria.registrar({
                usuario, accion: "RECHAZAR_SOLICITUD", entidad: "SOLICITUD_APROBACION",
                entidad_id: solicitud_id, resultado: "DENEGADO", detalle: "Unidad diferente",
            });
            throw new Error("No puede rechazar solicitudes de otra unidad organizacional");
        }

        const detalle = await this.tx.obtener_detalle(solicitud_id);
        if (detalle && detalle.SOLICITANTE_ID === usuario.usuario_id) {
            throw new Error("No puede rechazar sus propias solicitudes");
        }

        const resultado = await this.tx.rechazar(solicitud_id, usuario.usuario_id, motivo);
        if (resultado.EXITO !== 1) throw new Error(resultado.MENSAJE);

        await Servicio_Auditoria.registrar({
            usuario, accion: "RECHAZAR_SOLICITUD", entidad: "SOLICITUD_APROBACION",
            entidad_id: solicitud_id, detalle: `Motivo: ${motivo}`,
        });
        return { exito: resultado.EXITO, mensaje: resultado.MENSAJE };
    }

    // ─── REENVIAR SOLICITUD RECHAZADA ─────────────────────
    // Usuario estándar puede corregir y reenviar una solicitud rechazada

    async reenviar(solicitud_original_id: string, datos: {
        titulo: string; descripcion?: string; prioridad?: string;
    }, usuario: Token_Payload) {
        const original = await this.tx.obtener_detalle(solicitud_original_id);
        if (!original) throw new Error("Solicitud original no encontrada");
        if (original.ESTADO_SOLICITUD !== "RECHAZADA") throw new Error("Solo se pueden reenviar solicitudes rechazadas");
        if (original.SOLICITANTE_ID !== usuario.usuario_id) throw new Error("Solo puede reenviar sus propias solicitudes");

        const nuevo_id = await this.tx.reenviar_solicitud(solicitud_original_id, {
            titulo: datos.titulo || original.TITULO,
            descripcion: datos.descripcion !== undefined ? datos.descripcion : original.DESCRIPCION,
            estado_id: original.ESTADO_ID,
            prioridad: datos.prioridad || original.PRIORIDAD,
            solicitante_id: usuario.usuario_id,
        });

        await Servicio_Auditoria.registrar({
            usuario, accion: "REENVIAR_SOLICITUD", entidad: "SOLICITUD_APROBACION",
            entidad_id: nuevo_id, detalle: `Reenvío de solicitud rechazada ${solicitud_original_id}`,
        });
        return { solicitud_id: nuevo_id };
    }
}
