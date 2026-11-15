const readline = require("readline");

const BASE_URL = process.env.EDUPERU_URL || "http://localhost:3000";

function preguntar(rl, texto) {
    return new Promise(resolve => rl.question(texto, respuesta => resolve(respuesta.trim())));
}

async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

    try {
        const respuesta = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        const texto = await respuesta.text();
        let data = null;
        try {
            data = texto ? JSON.parse(texto) : null;
        } catch {
            data = { mensaje: texto };
        }

        if (!respuesta.ok) {
            throw new Error(data?.mensaje || `HTTP ${respuesta.status}`);
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
}

(async () => {
    console.log("\n==============================================");
    console.log(" EDUPerú - PRUEBA SIMULADOR DE BECAS");
    console.log("==============================================\n");
    console.log(`Servidor: ${BASE_URL}\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    try {
        const email = (await preguntar(rl, "Correo de prueba [usuario@eduperu.pe]: ")) || "usuario@eduperu.pe";
        const password = await preguntar(rl, "Contraseña del usuario de prueba: ");

        if (!password) {
            throw new Error("La contraseña es obligatoria.");
        }

        console.log("\n1) Iniciando sesión...");
        const login = await request(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        const token = login?.resultado?.token || login?.token;
        if (!token) {
            throw new Error("El login no devolvió un token JWT.");
        }
        console.log("✅ Autenticación correcta");

        console.log("\n2) Ejecutando preevaluación con el perfil guardado...");
        const inicio = Date.now();
        const simulacion = await request(`${BASE_URL}/api/elegibilidad/simular`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({})
        });

        const r = simulacion?.resultado || {};
        console.log(`✅ Estado: ${r.estado || "SIN_ESTADO"}`);
        console.log(`   Tiempo: ${Date.now() - inicio} ms`);
        console.log(`   Oportunidades analizadas: ${r.total ?? 0}`);
        console.log(`   Cumple preevaluación: ${r.resumen?.cumplePreevaluacion ?? 0}`);
        console.log(`   Requiere validación: ${r.resumen?.requiereValidacion ?? 0}`);
        console.log(`   No determinable: ${r.resumen?.noDeterminable ?? 0}`);
        console.log(`   No cumple preevaluación: ${r.resumen?.noCumplePreevaluacion ?? 0}`);

        const primeras = (r.oportunidades || []).slice(0, 5);
        if (primeras.length) {
            console.log("\nPrimeros resultados:");
            for (const item of primeras) {
                const score = item.puntajeOrientativo === null || item.puntajeOrientativo === undefined
                    ? "N/D"
                    : `${item.puntajeOrientativo}%`;
                console.log(` - ${item.nombre}: ${item.estado} (${score})`);
            }
        } else {
            console.log("\n⚠️ No se encontraron oportunidades oficiales para evaluar.");
        }

        console.log("\nFuentes:");
        console.log(` - Oportunidades: ${r.fuentes?.oportunidades || r.fuente || "N/D"}`);
        console.log(` - Requisitos: ${r.fuentes?.requisitos || "N/D"}`);
        console.log(` - Reglas estructuradas: ${r.fuentes?.requisitosEstructurados ?? 0}`);
        if (r.diagnostico) {
            console.log("\nDiagnóstico de fuentes:");
            console.log(` - Timeout convocatorias: ${Boolean(r.diagnostico.convocatoriasTimeout)}`);
            console.log(` - Timeout requisitos: ${Boolean(r.diagnostico.requisitosTimeout)}`);
            console.log(` - Requisitos disponibles: ${Boolean(r.diagnostico.requisitosDisponibles)}`);
            if (r.diagnostico.motivoRequisitos) {
                console.log(` - Motivo requisitos: ${r.diagnostico.motivoRequisitos}`);
            }
        }

        console.log("\n==============================================");
        console.log(" PRUEBA COMPLETADA");
        console.log("==============================================");
        console.log("El resultado es informativo; PRONABEC mantiene la decisión oficial de elegibilidad.\n");
    } catch (error) {
        console.error(`\n❌ ${error.message}\n`);
        process.exitCode = 1;
    } finally {
        rl.close();
    }
})();
