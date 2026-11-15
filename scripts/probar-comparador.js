const BASE_URL =
    process.env.EDUPERU_URL ||
    "http://localhost:3000";


function extraerRegistros(respuesta) {

    const raiz =
        respuesta?.resultado ||
        respuesta ||
        {};

    if (Array.isArray(raiz)) {
        return raiz;
    }

    if (Array.isArray(raiz.datos)) {
        return raiz.datos;
    }

    return [];
}


function valor(registro, campos, defecto = "") {

    for (const campo of campos) {
        const dato = registro?.[campo];
        if (
            dato !== undefined &&
            dato !== null &&
            String(dato).trim()
        ) {
            return String(dato).trim();
        }
    }

    return defecto;
}


function preparar(registro, indice) {

    return {
        idCliente: indice,
        carrera:
            valor(
                registro,
                [
                    "carrera", "CARRERA",
                    "nombreCarrera", "NOMBRE_CARRERA",
                    "programa", "PROGRAMA",
                    "nombre", "NOMBRE"
                ],
                `Oportunidad ${indice + 1}`
            ),
        institucion:
            valor(
                registro,
                [
                    "institucion", "INSTITUCION",
                    "nombreInstitucion", "NOMBRE_INSTITUCION",
                    "universidad", "UNIVERSIDAD",
                    "instituto", "INSTITUTO"
                ],
                "N/D"
            ),
        region:
            valor(
                registro,
                [
                    "departamento", "DEPARTAMENTO",
                    "region", "REGION",
                    "sede", "SEDE",
                    "provincia", "PROVINCIA"
                ],
                "N/D"
            ),
        convocatoria:
            valor(
                registro,
                [
                    "convocatoria", "CONVOCATORIA",
                    "beca", "BECA",
                    "concurso", "CONCURSO"
                ],
                ""
            ),
        estado:
            valor(
                registro,
                ["estado", "ESTADO"],
                "No publicado"
            ),
        fuente:
            "CarreraService"
    };
}


async function main() {

    console.log("\n==============================================");
    console.log(" EDUPERÚ - PRUEBA COMPARADOR");
    console.log("==============================================\n");
    console.log(`Servidor: ${BASE_URL}\n`);

    const carrerasResponse =
        await fetch(
            `${BASE_URL}/api/carreras`,
            {
                headers: {
                    Accept: "application/json"
                }
            }
        );

    if (!carrerasResponse.ok) {
        throw new Error(
            `CarreraService HTTP ${carrerasResponse.status}`
        );
    }

    const carrerasJson =
        await carrerasResponse.json();

    const registros =
        extraerRegistros(carrerasJson);

    if (registros.length < 2) {
        throw new Error(
            "CarreraService no devolvió al menos dos registros para la prueba."
        );
    }

    const selecciones =
        registros
            .slice(0, 2)
            .map(preparar);

    console.log("Selecciones:");
    selecciones.forEach(
        (item, i) =>
            console.log(
                ` ${i + 1}. ${item.carrera} | ${item.institucion} | ${item.region}`
            )
    );

    console.log("\nConsultando ComparadorOportunidadesService...");

    const response =
        await fetch(
            `${BASE_URL}/api/comparador-oportunidades`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    selecciones
                })
            }
        );

    const json =
        await response.json();

    if (!response.ok) {
        throw new Error(
            json?.mensaje ||
            `HTTP ${response.status}`
        );
    }

    const resultado =
        json.resultado;

    console.log("\n✅ Comparación completada");
    console.log(`   Estado: ${resultado.estado}`);
    console.log(`   Tiempo: ${resultado.tiempoMs} ms`);
    console.log(`   Comparadas: ${resultado.totalComparadas}`);

    console.log("\nResultados:");

    resultado.comparacion.forEach(
        (item, i) => {
            console.log(`\n ${i + 1}. ${item.carrera}`);
            console.log(`    Institución: ${item.institucion}`);
            console.log(`    Región: ${item.region}`);
            console.log(`    Convocatoria: ${item.convocatoria || "N/D"}`);
            console.log(`    Fechas oficiales: ${item.becaRelacionada?.fechas?.length || 0}`);
            console.log(`    Beneficios relacionados: ${item.beneficios.length}`);
            console.log(`    Requisitos relacionados: ${item.requisitos.length}`);
        }
    );

    console.log("\nDiagnóstico de fuentes:");
    resultado.diagnosticoFuentes.forEach(
        item =>
            console.log(
                ` - ${item.servicio}: ${item.ok ? "OK" : "NO DISPONIBLE"} (${item.tiempoMs} ms)`
            )
    );

    console.log("\n==============================================");
    console.log(" PRUEBA COMPLETADA");
    console.log("==============================================\n");
}


main().catch(error => {
    console.error("\n❌ Comparador:", error.message);
    process.exitCode = 1;
});
