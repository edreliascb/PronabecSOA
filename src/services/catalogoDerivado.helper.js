/* =========================================================
   EDUPERÚ SOA
   HELPER PARA CATÁLOGOS DERIVADOS

   Regla:
   - Solo transforma información realmente recuperada.
   - No inventa becas, carreras, modalidades, sedes o beneficios.
========================================================= */

function normalizarTexto(texto) {
    return String(texto ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim()
        .toUpperCase();
}


function normalizarClave(texto) {
    return normalizarTexto(texto)
        .replace(/\s+/g, "");
}


function extraerArreglo(respuesta) {
    if (Array.isArray(respuesta)) {
        return respuesta;
    }

    if (!respuesta || typeof respuesta !== "object") {
        return [];
    }

    const clavesPreferidas = [
        "datos",
        "data",
        "rows",
        "records",
        "items",
        "resultado",
        "result",
        "instituciones",
        "convocatorias",
        "postulaciones",
        "documentos",
        "convenios"
    ];

    for (const clave of clavesPreferidas) {
        const valor = respuesta[clave];

        if (Array.isArray(valor)) {
            return valor;
        }

        if (valor && typeof valor === "object") {
            const interno = extraerArreglo(valor);

            if (interno.length > 0) {
                return interno;
            }
        }
    }

    for (const valor of Object.values(respuesta)) {
        if (Array.isArray(valor)) {
            return valor;
        }
    }

    return [];
}


function obtenerCampo(objeto, aliases = []) {
    if (!objeto || typeof objeto !== "object") {
        return null;
    }

    const mapa = new Map(
        Object.keys(objeto).map(clave => [
            normalizarClave(clave),
            clave
        ])
    );

    for (const alias of aliases) {
        const real = mapa.get(
            normalizarClave(alias)
        );

        if (real !== undefined) {
            const valor = objeto[real];

            if (
                valor !== null &&
                valor !== undefined &&
                String(valor).trim() !== ""
            ) {
                return valor;
            }
        }
    }

    return null;
}


function valorTexto(objeto, aliases = []) {
    const valor = obtenerCampo(
        objeto,
        aliases
    );

    if (
        valor === null ||
        valor === undefined
    ) {
        return null;
    }

    if (Array.isArray(valor)) {
        return valor
            .map(item => String(item).trim())
            .filter(Boolean)
            .join(", ");
    }

    if (typeof valor === "object") {
        return JSON.stringify(valor);
    }

    return String(valor).trim() || null;
}


function contenidoRegistro(registro) {
    try {
        return normalizarTexto(
            JSON.stringify(registro)
        );
    } catch {
        return normalizarTexto(
            String(registro ?? "")
        );
    }
}


function buscarEnRegistros(
    registros,
    texto
) {
    const buscado =
        normalizarTexto(texto);

    if (!buscado) {
        return registros;
    }

    return registros.filter(
        registro =>
            contenidoRegistro(registro)
                .includes(buscado)
    );
}


function crearId(registro, indice) {
    const aliases = [
        "id",
        "id_convocatoria",
        "idconvocatoria",
        "codigo",
        "cod",
        "codigo_convocatoria",
        "id_institucion",
        "idinstitucion"
    ];

    const idFuente =
        valorTexto(
            registro,
            aliases
        );

    return idFuente || String(indice + 1);
}


function unicosPorClave(
    registros,
    construirClave
) {
    const mapa =
        new Map();

    registros.forEach(
        (registro, indice) => {
            const claveBruta =
                construirClave(
                    registro,
                    indice
                );

            const clave =
                normalizarTexto(
                    claveBruta
                );

            if (
                clave &&
                !mapa.has(clave)
            ) {
                mapa.set(
                    clave,
                    registro
                );
            }
        }
    );

    return [
        ...mapa.values()
    ];
}


function dividirValores(texto) {
    if (
        texto === null ||
        texto === undefined
    ) {
        return [];
    }

    if (Array.isArray(texto)) {
        return texto
            .flatMap(dividirValores)
            .filter(Boolean);
    }

    const valor =
        String(texto)
            .trim();

    if (!valor) {
        return [];
    }

    return valor
        .split(/\s*[|;]\s*|\s*\/\s*(?=[A-ZÁÉÍÓÚÑ])/)
        .map(item => item.trim())
        .filter(Boolean);
}


module.exports = {
    normalizarTexto,
    extraerArreglo,
    obtenerCampo,
    valorTexto,
    contenidoRegistro,
    buscarEnRegistros,
    crearId,
    unicosPorClave,
    dividirValores
};
