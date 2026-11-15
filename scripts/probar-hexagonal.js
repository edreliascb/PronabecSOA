"use strict";

const assert = require("assert");
const ConsultarPronabecUseCase = require("../src/hexagonal/pronabec/application/consultarPronabec.usecase");
const { RECURSOS_PRONABEC } = require("../src/hexagonal/pronabec/domain/pronabec.resources");

class FakeAdapter {
    constructor(nombre, fn) {
        this._nombre = nombre;
        this.fn = fn;
        this.llamadas = [];
    }
    nombre() { return this._nombre; }
    async consultar(recurso, parametros, contexto) {
        this.llamadas.push({ recurso, parametros, contexto });
        return this.fn(recurso, parametros, contexto, this.llamadas.length);
    }
}

function titulo(n, t) { console.log(`\n${n}) ${t}`); }
function ok(t) { console.log(`✅ ${t}`); }

(async () => {
    console.log("\n==============================================");
    console.log(" EDUPERÚ - PRUEBA HEXAGONAL PRONABEC V2 HIGH");
    console.log("==============================================");

    try {
        titulo(1, "Contrato de puerto y camino primario");
        const primario = new FakeAdapter("PronabecApiAdapter", async r => ({ recurso: r, datos: [1] }));
        const alterno = new FakeAdapter("PortalNacionalAdapter", async () => ({ datos: [2] }));
        const u1 = new ConsultarPronabecUseCase({ primario, alterno });
        const r1 = await u1.ejecutar(RECURSOS_PRONABEC[0], { page: 1 }, { traceId: "hex-v2-primary" });
        assert.equal(r1.adapter, "PronabecApiAdapter");
        assert.equal(r1.fallback, false);
        assert.equal(alterno.llamadas.length, 0);
        assert.equal(primario.llamadas[0].contexto.traceId, "hex-v2-primary");
        ok("Primario usado sin fallback y traceId propagado.");

        titulo(2, "Fallback solo ante fallo recuperable");
        const apiFalla = new FakeAdapter("PronabecApiAdapter", async () => {
            const e = new Error("DNS temporalmente no disponible");
            e.codigo = "API_PRONABEC_ERROR";
            e.codigoTecnico = "ENOTFOUND";
            throw e;
        });
        const portalOk = new FakeAdapter("PortalNacionalAdapter", async r => ({ recurso: r, oficial: true }));
        const u2 = new ConsultarPronabecUseCase({ primario: apiFalla, alterno: portalOk, logger: { warn() {} } });
        const r2 = await u2.ejecutar(RECURSOS_PRONABEC[0], {}, { traceId: "hex-v2-fallback" });
        assert.equal(r2.fallback, true);
        assert.equal(r2.adapter, "PortalNacionalAdapter");
        assert.equal(r2.errorPrimario.codigoTecnico, "ENOTFOUND");
        ok("Fallback oficial activado y causa primaria preservada.");

        titulo(3, "No ocultar errores no recuperables");
        const apiNoRec = new FakeAdapter("PronabecApiAdapter", async () => {
            const e = new Error("Error de negocio");
            e.code = "ERROR_NEGOCIO_NO_RECUPERABLE";
            throw e;
        });
        const portalNoDebe = new FakeAdapter("PortalNacionalAdapter", async () => ({ indebido: true }));
        const u3 = new ConsultarPronabecUseCase({ primario: apiNoRec, alterno: portalNoDebe, logger: { warn() {} } });
        let noRecuperable = false;
        try { await u3.ejecutar(RECURSOS_PRONABEC[0]); } catch (e) { noRecuperable = e.code === "ERROR_NEGOCIO_NO_RECUPERABLE"; }
        assert.equal(noRecuperable, true);
        assert.equal(portalNoDebe.llamadas.length, 0);
        ok("Un error de negocio no se disfraza usando fallback.");

        titulo(4, "Validación de recursos permitidos");
        let recursoBloqueado = false;
        try { await u1.ejecutar("RecursoInventado"); } catch (e) { recursoBloqueado = e.code === "RECURSO_PRONABEC_NO_PERMITIDO"; }
        assert.equal(recursoBloqueado, true);
        ok(`Allowlist activa: ${RECURSOS_PRONABEC.length} recursos reales del proyecto.`);

        titulo(5, "Error agregado cuando ambas fuentes fallan");
        const f1 = new FakeAdapter("PronabecApiAdapter", async () => { const e = new Error("API caída"); e.codigo = "API_PRONABEC_ERROR"; throw e; });
        const f2 = new FakeAdapter("PortalNacionalAdapter", async () => { const e = new Error("Portal caído"); e.code = "ETIMEDOUT"; throw e; });
        const u5 = new ConsultarPronabecUseCase({ primario: f1, alterno: f2, logger: { warn() {} } });
        let agregado;
        try { await u5.ejecutar(RECURSOS_PRONABEC[0]); } catch (e) { agregado = e; }
        assert.equal(agregado.code, "PRONABEC_FUENTES_NO_DISPONIBLES");
        assert.ok(agregado.causas.primario);
        assert.ok(agregado.causas.alterno);
        ok("Se conservan ambas causas para diagnóstico.");

        titulo(6, "Inversión de dependencias");
        const custom = new FakeAdapter("AdapterDePrueba", async () => ({ desacoplado: true }));
        const u6 = new ConsultarPronabecUseCase({ primario: custom });
        const r6 = await u6.ejecutar(RECURSOS_PRONABEC[1]);
        assert.equal(r6.adapter, "AdapterDePrueba");
        assert.equal(r6.resultado.desacoplado, true);
        ok("El caso de uso cambia de infraestructura sin modificar su lógica.");

        console.log("\n==============================================");
        console.log(" PRUEBA COMPLETADA");
        console.log("==============================================");
        console.log("Puerto + caso de uso + adapters + fallback selectivo + traceId + allowlist: OK\n");
    } catch (error) {
        console.error("\n❌ PRUEBA FALLIDA");
        console.error(error.stack || error);
        process.exitCode = 1;
    }
})();
