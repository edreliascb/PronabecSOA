const { HermesBus } = require("../src/hermes/core/hermes.bus");

async function main() {
    console.log("");
    console.log("==============================================");
    console.log(" EDUPERÚ - PRUEBA HERMES / EVENTOS V1");
    console.log("==============================================");

    const bus = new HermesBus({ maxHistorial: 20 });
    const llamadas = [];

    bus.suscribir("edu.test", "AuditoriaFake", async (evento) => {
        llamadas.push(`AUD:${evento.event_id}`);
        return { auditado: true };
    });

    bus.suscribir("edu.test", "NotificacionFake", async (evento) => {
        llamadas.push(`NOTIF:${evento.trace_id}`);
        return { notificado: true };
    });

    console.log("\n1) Publicando evento con dos suscriptores...");
    const r1 = await bus.publicar("edu.test", { mensaje: "ok" }, {
        traceId: "trace-hermes-001",
        idUsuario: 1,
        source: "TestHermes"
    });
    if (r1.suscriptores !== 2 || r1.errores !== 0 || llamadas.length !== 2) {
        throw new Error("No se ejecutaron correctamente los suscriptores.");
    }
    console.log("✅ Evento procesado por 2 suscriptores.");

    console.log("\n2) Verificando propagación de TraceId...");
    if (r1.trace_id !== "trace-hermes-001") {
        throw new Error("El TraceId no fue preservado.");
    }
    console.log("✅ TraceId preservado: trace-hermes-001");

    console.log("\n3) Verificando aislamiento de fallos...");
    let segundoEjecutado = false;
    bus.suscribir("edu.error", "FallaFake", async () => {
        throw new Error("fallo controlado");
    });
    bus.suscribir("edu.error", "ContinuaFake", async () => {
        segundoEjecutado = true;
        return { ok: true };
    });
    const r2 = await bus.publicar("edu.error", {}, {});
    if (r2.errores !== 1 || !segundoEjecutado) {
        throw new Error("Hermes no aisló correctamente el fallo de un suscriptor.");
    }
    console.log("✅ Un suscriptor falló y el siguiente continuó.");

    console.log("\n4) Verificando suscripción idempotente...");
    const duplicado = bus.suscribir("edu.test", "AuditoriaFake", async () => null);
    if (duplicado !== false) {
        throw new Error("Se permitió una suscripción duplicada.");
    }
    console.log("✅ Suscripción duplicada rechazada sin duplicar eventos.");

    console.log("\n5) Verificando métricas e historial...");
    const estado = bus.obtenerEstado();
    if (estado.metricas.publicados !== 2 || estado.historial.length !== 2) {
        throw new Error("Las métricas o el historial no son consistentes.");
    }
    console.log(`✅ Publicados: ${estado.metricas.publicados} | Errores suscriptor: ${estado.metricas.erroresSuscriptor}`);

    console.log("\n==============================================");
    console.log(" PRUEBA COMPLETADA");
    console.log("==============================================");
    console.log("Productor + Bus + Suscriptores + TraceId + aislamiento de fallos operativos.");
    console.log("");
}

main().catch((error) => {
    console.error("\n❌ No se pudo completar la prueba.");
    console.error(error);
    process.exitCode = 1;
});
