const {
    obtenerPool,
    sql
} = require("../config/database");

const cronogramaService =
    require("./cronogramaConvocatoria.service");


function fechaISODesdeTexto(valor) {
    if (!valor) return null;

    if (valor instanceof Date) {
        return Number.isNaN(valor.getTime())
            ? null
            : valor.toISOString();
    }

    const texto = String(valor).trim();
    if (!texto) return null;

    const peru = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto);
    if (peru) {
        const [, dia, mes, anio] = peru;
        return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}T00:00:00.000Z`;
    }

    const isoCorto = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(texto);
    if (isoCorto) {
        const [, anio, mes, dia] = isoCorto;
        return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}T00:00:00.000Z`;
    }

    const fecha = new Date(texto);
    return Number.isNaN(fecha.getTime())
        ? null
        : fecha.toISOString();
}


function ordenarEventos(eventos) {
    return [...eventos].sort((a, b) => {
        const fa = a.fecha ? new Date(a.fecha).getTime() : Number.MAX_SAFE_INTEGER;
        const fb = b.fecha ? new Date(b.fecha).getTime() : Number.MAX_SAFE_INTEGER;
        return fa - fb;
    });
}


function diasHasta(fecha, ahora = new Date()) {
    if (!fecha) return null;

    const objetivo = new Date(fecha);
    if (Number.isNaN(objetivo.getTime())) return null;

    const inicioHoy = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
    );

    const inicioObjetivo = new Date(
        objetivo.getUTCFullYear(),
        objetivo.getUTCMonth(),
        objetivo.getUTCDate()
    );

    return Math.ceil(
        (inicioObjetivo.getTime() - inicioHoy.getTime()) /
        86400000
    );
}


function estadoTemporal(fecha) {
    const dias = diasHasta(fecha);
    if (dias === null) return "SIN_FECHA";
    if (dias < 0) return "PASADO";
    if (dias === 0) return "HOY";
    return "PROXIMO";
}


function claveEvento(evento) {
    return [
        evento.tipo || "",
        evento.origen || "",
        evento.titulo || "",
        evento.detalle || "",
        evento.fecha || ""
    ]
        .map(v => String(v).trim().toLowerCase())
        .join("|");
}


function deduplicar(eventos) {
    const mapa = new Map();

    for (const evento of eventos) {
        const key = claveEvento(evento);
        if (!mapa.has(key)) mapa.set(key, evento);
    }

    return [...mapa.values()];
}


async function obtenerDatosLocales(idUsuario) {
    const pool = await obtenerPool();

    const [alertas, seguimientos] = await Promise.all([
        pool
            .request()
            .input("idUsuario", sql.Int, Number(idUsuario))
            .query(`
                SELECT TOP 100 *
                FROM dbo.Alertas
                WHERE id_usuario = @idUsuario
                ORDER BY id_alerta DESC
            `),

        pool
            .request()
            .input("idUsuario", sql.Int, Number(idUsuario))
            .query(`
                SELECT TOP 100
                    id_seguimiento,
                    id_postulacion,
                    titulo,
                    estado,
                    fecha_creacion,
                    fecha_actualizacion
                FROM dbo.SeguimientosPostulacion
                WHERE id_usuario = @idUsuario
                ORDER BY fecha_actualizacion DESC
            `)
    ]);

    return {
        alertas: alertas.recordset || [],
        seguimientos: seguimientos.recordset || []
    };
}


function filtrarPeriodo(eventos, opciones = {}) {
    const anio = Number(opciones.anio);
    const mes = Number(opciones.mes);

    if (!Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) {
        return eventos;
    }

    return eventos.filter(evento => {
        if (!evento.fecha) return false;
        const fecha = new Date(evento.fecha);
        return fecha.getUTCFullYear() === anio &&
            fecha.getUTCMonth() + 1 === mes;
    });
}


async function obtenerCalendario(idUsuario, opciones = {}) {
    const [cronogramaSettled, localSettled] = await Promise.allSettled([
        cronogramaService.listarCronogramas(),
        obtenerDatosLocales(idUsuario)
    ]);

    const cronogramas =
        cronogramaSettled.status === "fulfilled"
            ? cronogramaSettled.value
            : {
                disponible: false,
                fuenteOficial: true,
                fuente: "PRONABEC - Fuentes oficiales",
                motivo: cronogramaSettled.reason?.message || "Fuente oficial no disponible.",
                datos: []
            };

    const datosLocales =
        localSettled.status === "fulfilled"
            ? localSettled.value
            : { alertas: [], seguimientos: [] };

    const eventos = [];

    for (const item of cronogramas.datos || []) {
        if (item.fechaInicio) {
            eventos.push({
                tipo: "CONVOCATORIA_INICIO",
                categoria: "OFICIAL",
                origen: "CronogramaConvocatoriaService",
                titulo: item.convocatoria || "Convocatoria",
                detalle: item.etapa || "Inicio de etapa",
                fecha: fechaISODesdeTexto(item.fechaInicio),
                fechaOriginal: item.fechaInicio,
                fuente: cronogramas.fuente || "PRONABEC - Fuentes oficiales",
                fuenteOficial: true,
                bases: item.bases || null,
                documentacionCronograma: item.documentacionCronograma || null
            });
        }

        if (item.fechaFin) {
            eventos.push({
                tipo: "CONVOCATORIA_FIN",
                categoria: "OFICIAL",
                origen: "CronogramaConvocatoriaService",
                titulo: item.convocatoria || "Convocatoria",
                detalle: item.etapa || "Fin de etapa",
                fecha: fechaISODesdeTexto(item.fechaFin),
                fechaOriginal: item.fechaFin,
                fuente: cronogramas.fuente || "PRONABEC - Fuentes oficiales",
                fuenteOficial: true,
                bases: item.bases || null,
                documentacionCronograma: item.documentacionCronograma || null
            });
        }
    }

    for (const alerta of datosLocales.alertas || []) {
        eventos.push({
            tipo: "ALERTA",
            categoria: "PERSONAL",
            origen: "AlertaService",
            id: alerta.id_alerta,
            titulo: alerta.titulo || alerta.nombre || alerta.tipo || "Alerta",
            detalle: alerta.descripcion || alerta.mensaje || alerta.criterio || null,
            fecha: fechaISODesdeTexto(
                alerta.fecha_alerta ||
                alerta.fecha_envio ||
                alerta.fecha_creacion ||
                alerta.fecha_actualizacion
            ),
            activa: alerta.activa ?? null,
            fuente: "EduPeruDB",
            fuenteOficial: false
        });
    }

    for (const seguimiento of datosLocales.seguimientos || []) {
        eventos.push({
            tipo: "SEGUIMIENTO_POSTULACION",
            categoria: "PERSONAL",
            origen: "SeguimientoPostulacionService",
            id: seguimiento.id_seguimiento,
            titulo: seguimiento.titulo || "Seguimiento de postulación",
            detalle: seguimiento.estado || null,
            fecha: fechaISODesdeTexto(
                seguimiento.fecha_actualizacion ||
                seguimiento.fecha_creacion
            ),
            idPostulacion: seguimiento.id_postulacion,
            fuente: "EduPeruDB",
            fuenteOficial: false
        });
    }

    let datos = deduplicar(eventos)
        .map(evento => ({
            ...evento,
            estadoTemporal: estadoTemporal(evento.fecha),
            diasHasta: diasHasta(evento.fecha)
        }));

    datos = ordenarEventos(datos);

    const datosFiltrados = filtrarPeriodo(datos, opciones);

    const proximos = datos
        .filter(item => item.fecha && ["HOY", "PROXIMO"].includes(item.estadoTemporal))
        .slice(0, 12);

    const fuenteOficialDisponible = cronogramas.disponible !== false;

    return {
        servicio: "CalendarioEducativoService",
        estado: fuenteOficialDisponible
            ? "OPERATIVO"
            : "OPERATIVO_CON_FUENTE_OFICIAL_NO_DISPONIBLE",
        periodo: {
            anio: Number(opciones.anio) || null,
            mes: Number(opciones.mes) || null
        },
        total: datosFiltrados.length,
        totalGeneral: datos.length,
        resumen: {
            oficiales: datosFiltrados.filter(x => x.categoria === "OFICIAL").length,
            personales: datosFiltrados.filter(x => x.categoria === "PERSONAL").length,
            proximos: datosFiltrados.filter(x => ["HOY", "PROXIMO"].includes(x.estadoTemporal)).length,
            sinFecha: datosFiltrados.filter(x => !x.fecha).length
        },
        proximos,
        datos: datosFiltrados,
        fuentes: {
            cronograma: {
                servicio: "CronogramaConvocatoriaService",
                disponible: fuenteOficialDisponible,
                fuente: cronogramas.fuente || "PRONABEC - Fuentes oficiales",
                fuenteOficial: cronogramas.fuenteOficial !== false,
                motivo: cronogramas.motivo || null
            },
            alertas: {
                servicio: "AlertaService",
                disponible: localSettled.status === "fulfilled",
                fuente: "EduPeruDB"
            },
            seguimientos: {
                servicio: "SeguimientoPostulacionService",
                disponible: localSettled.status === "fulfilled",
                fuente: "EduPeruDB"
            }
        },
        observacion:
            "Las fechas de convocatorias se muestran solo cuando provienen de información oficial disponible. Alertas y seguimientos son datos personales almacenados en EduPeruDB."
    };
}


module.exports = {
    obtenerCalendario,
    fechaISODesdeTexto
};
