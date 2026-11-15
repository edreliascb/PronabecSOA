/* =========================================================
   EDUPERÚ SOA
   DATABASE DUAL: SQL SERVER LOCAL + POSTGRESQL RENDER
========================================================= */

require("dotenv").config();

const mssql = require("mssql");
const { Pool: PgPool } = require("pg");

/* =========================================================
   MOTOR
========================================================= */

const DB_ENGINE = String(
    process.env.DB_ENGINE || "sqlserver"
).trim().toLowerCase();

const ES_POSTGRES = [
    "postgres",
    "postgresql",
    "pg"
].includes(DB_ENGINE);

/* =========================================================
   UTILIDADES COMUNES
========================================================= */

function errorCompatible(error) {
    if (!error || typeof error !== "object") return error;

    // PostgreSQL unique_violation -> códigos esperados por servicios antiguos MSSQL.
    if (error.code === "23505" && error.number == null) {
        error.number = 2627;
    }

    return error;
}

function splitTopLevelComma(text) {
    const parts = [];
    let current = "";
    let quote = false;
    let depth = 0;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (ch === "'") {
            current += ch;

            if (quote && text[i + 1] === "'") {
                current += text[++i];
                continue;
            }

            quote = !quote;
            continue;
        }

        if (!quote) {
            if (ch === "(") depth++;
            if (ch === ")") depth = Math.max(0, depth - 1);

            if (ch === "," && depth === 0) {
                parts.push(current.trim());
                current = "";
                continue;
            }
        }

        current += ch;
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
}

function splitSqlStatements(text) {
    const statements = [];
    let current = "";
    let quote = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (ch === "'") {
            current += ch;

            if (quote && text[i + 1] === "'") {
                current += text[++i];
                continue;
            }

            quote = !quote;
            continue;
        }

        if (!quote && ch === ";") {
            if (current.trim()) statements.push(current.trim());
            current = "";
            continue;
        }

        current += ch;
    }

    if (current.trim()) statements.push(current.trim());
    return statements;
}

function reemplazarParametros(text, inputs) {
    const valores = [];
    const indices = new Map();
    const inputMap = new Map();

    for (const item of inputs) {
        inputMap.set(
            String(item.name).toLowerCase(),
            item.value
        );
    }

    let out = "";
    let quote = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (ch === "'") {
            out += ch;

            if (quote && text[i + 1] === "'") {
                out += text[++i];
                continue;
            }

            quote = !quote;
            continue;
        }

        if (!quote && ch === "@") {
            let j = i + 1;
            let name = "";

            while (
                j < text.length &&
                /[A-Za-z0-9_]/.test(text[j])
            ) {
                name += text[j++];
            }

            if (name) {
                const key = name.toLowerCase();

                if (!inputMap.has(key)) {
                    // Casos de variables SQL del sistema se procesan antes.
                    out += "@" + name;
                    i = j - 1;
                    continue;
                }

                if (!indices.has(key)) {
                    valores.push(inputMap.get(key));
                    indices.set(key, valores.length);
                }

                out += `$${indices.get(key)}`;
                i = j - 1;
                continue;
            }
        }

        out += ch;
    }

    return { text: out, values: valores };
}

function convertirBooleanos(text) {
    const columnas = [
        "activo",
        "activa",
        "leida",
        "usado",
        "email_verificado"
    ];

    for (const col of columnas) {
        const r1 = new RegExp(`\\b${col}\\b\\s*=\\s*1\\b`, "gi");
        const r0 = new RegExp(`\\b${col}\\b\\s*=\\s*0\\b`, "gi");
        text = text.replace(r1, `${col} = TRUE`);
        text = text.replace(r0, `${col} = FALSE`);
    }

    return text;
}

function convertirBooleanosInsert(text) {
    const boolCols = new Set([
        "activo",
        "activa",
        "leida",
        "usado",
        "email_verificado"
    ]);

    const re = /INSERT\s+INTO\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([\s\S]*?)\)\s*(?:RETURNING[\s\S]*?)?\s*VALUES\s*\(([\s\S]*?)\)/i;
    const m = text.match(re);

    if (!m) return text;

    const cols = splitTopLevelComma(m[2])
        .map(x => x.replace(/["\[\]]/g, "").trim().toLowerCase());

    const vals = splitTopLevelComma(m[3]);

    if (cols.length !== vals.length) return text;

    let changed = false;

    for (let i = 0; i < cols.length; i++) {
        if (!boolCols.has(cols[i])) continue;

        if (/^1$/.test(vals[i])) {
            vals[i] = "TRUE";
            changed = true;
        } else if (/^0$/.test(vals[i])) {
            vals[i] = "FALSE";
            changed = true;
        }
    }

    if (!changed) return text;

    return text.replace(
        m[3],
        vals.join(", ")
    );
}

function convertirOutput(text) {
    const m = text.match(
        /\bOUTPUT\s+([\s\S]*?)(?=\bVALUES\b|\bWHERE\b)/i
    );

    if (!m) return text;

    let retorno = m[1]
        .replace(/\bINSERTED\./gi, "")
        .replace(/\bDELETED\./gi, "")
        .replace(/\s+/g, " ")
        .trim();

    text = text.replace(m[0], "");

    text = text.trim().replace(/;+\s*$/, "");

    return `${text} RETURNING ${retorno}`;
}

function convertirOuterApply(text) {
    return text.replace(
        /OUTER\s+APPLY\s*\(\s*SELECT\s+TOP\s+1\s+([\s\S]*?)\)\s+([A-Za-z_][A-Za-z0-9_]*)/gi,
        (_, body, alias) =>
            `LEFT JOIN LATERAL (SELECT ${body.trim()} LIMIT 1) ${alias} ON TRUE`
    );
}

function convertirTop(text) {
    const m = text.match(
        /^\s*SELECT\s+TOP\s+(\d+)\s+/i
    );

    if (!m) return text;

    const n = Number(m[1]);

    text = text.replace(
        /^\s*SELECT\s+TOP\s+\d+\s+/i,
        "SELECT "
    );

    text = text.trim().replace(/;+\s*$/, "");

    if (!/\bLIMIT\s+\d+\s*$/i.test(text)) {
        text += ` LIMIT ${n}`;
    }

    return text;
}

function convertirDateAdd(text) {
    return text.replace(
        /DATEADD\s*\(\s*MINUTE\s*,\s*(@[A-Za-z_][A-Za-z0-9_]*)\s*,\s*CURRENT_TIMESTAMP\s*\)/gi,
        `CURRENT_TIMESTAMP + ($1 * INTERVAL '1 minute')`
    );
}

function limpiezaComun(text) {
    return text
        .replace(/\bdbo\./gi, "")
        .replace(/\[([A-Za-z_][A-Za-z0-9_]*)\]/g, "$1")
        .replace(/\bSYSDATETIME\s*\(\s*\)/gi, "CURRENT_TIMESTAMP")
        .replace(/\bGETDATE\s*\(\s*\)/gi, "CURRENT_TIMESTAMP")
        .replace(/\bDB_NAME\s*\(\s*\)/gi, "current_database()")
        .replace(/\bISNULL\s*\(/gi, "COALESCE(")
        .replace(/\bWITH\s*\(\s*UPDLOCK\s*,\s*ROWLOCK\s*\)/gi, "")
        .replace(/\bWITH\s*\(\s*ROWLOCK\s*,\s*UPDLOCK\s*\)/gi, "")
        .replace(/\bWITH\s*\(\s*NOLOCK\s*\)/gi, "");
}

/* =========================================================
   POSTGRES - CASOS ESPECIALES DEL PROYECTO
========================================================= */

function especialPerfil(text) {
    if (
        !/\bIF\s+EXISTS\b/i.test(text) ||
        !/\bPerfilesUsuario\b/i.test(text)
    ) {
        return null;
    }

    return `
        INSERT INTO PerfilesUsuario
        (
            id_usuario,
            departamento,
            provincia,
            distrito,
            carrera_interes,
            nivel_estudio,
            institucion,
            fecha_actualizacion
        )
        VALUES
        (
            @idUsuario,
            @departamento,
            @provincia,
            @distrito,
            @carreraInteres,
            @nivelEstudio,
            @institucion,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id_usuario)
        DO UPDATE SET
            departamento = EXCLUDED.departamento,
            provincia = EXCLUDED.provincia,
            distrito = EXCLUDED.distrito,
            carrera_interes = EXCLUDED.carrera_interes,
            nivel_estudio = EXCLUDED.nivel_estudio,
            institucion = EXCLUDED.institucion,
            fecha_actualizacion = CURRENT_TIMESTAMP
        RETURNING
            id_perfil,
            id_usuario,
            departamento,
            provincia,
            distrito,
            carrera_interes,
            nivel_estudio,
            institucion,
            fecha_actualizacion
    `;
}

function especialConfiguracion(text) {
    if (
        !/\bMERGE\s+(?:dbo\.)?ConfiguracionSistema\b/i.test(text)
    ) {
        return null;
    }

    return `
        INSERT INTO ConfiguracionSistema
        (
            clave,
            valor,
            descripcion,
            fecha_actualizacion
        )
        VALUES
        (
            @clave,
            @valor,
            @descripcion,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (clave)
        DO UPDATE SET
            valor = EXCLUDED.valor,
            descripcion = COALESCE(
                EXCLUDED.descripcion,
                ConfiguracionSistema.descripcion
            ),
            fecha_actualizacion = CURRENT_TIMESTAMP
        RETURNING *
    `;
}

function especialEstadoEmail(text) {
    if (!/\bUsuarioEmailEstado\b/i.test(text)) return null;

    if (/\bIF\s+NOT\s+EXISTS\b/i.test(text)) {
        return `
            INSERT INTO UsuarioEmailEstado
            (
                id_usuario,
                email_verificado,
                fecha_actualizacion
            )
            VALUES
            (
                @idUsuario,
                FALSE,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id_usuario)
            DO NOTHING
        `;
    }

    if (
        /\bIF\s+EXISTS\b/i.test(text) &&
        /\bemail_verificado\b/i.test(text)
    ) {
        return `
            INSERT INTO UsuarioEmailEstado
            (
                id_usuario,
                email_verificado,
                fecha_verificacion,
                fecha_actualizacion
            )
            VALUES
            (
                @idUsuario,
                TRUE,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (id_usuario)
            DO UPDATE SET
                email_verificado = TRUE,
                fecha_verificacion = CURRENT_TIMESTAMP,
                fecha_actualizacion = CURRENT_TIMESTAMP
        `;
    }

    return null;
}

function especialSeguimiento(text) {
    if (
        /OBJECT_ID\s*\(\s*'dbo\.HistorialSeguimientos'/i.test(text) &&
        /\bAS\s+existe\b/i.test(text) &&
        !/\bSeguimientosPostulacion\b/i.test(text)
    ) {
        return `
            SELECT
                CASE
                    WHEN to_regclass('public.historialseguimientos') IS NULL
                    THEN 0
                    ELSE 1
                END AS existe
        `;
    }

    if (
        /\bFROM\s+sys\.indexes\b/i.test(text) &&
        /\bHistorialSeguimientos\b/i.test(text)
    ) {
        return `
            SELECT
                CASE WHEN EXISTS
                (
                    SELECT 1
                    FROM pg_indexes
                    WHERE schemaname = 'public'
                      AND indexname = 'ix_historialseguimientos_seguimiento'
                )
                THEN 1
                ELSE 0
                END AS existe
        `;
    }

    if (
        /\bFROM\s+sys\.check_constraints\b/i.test(text)
    ) {
        return `
            SELECT
                NULL::text AS name,
                NULL::text AS definition
            WHERE FALSE
        `;
    }

    if (
        /\bFROM\s+sys\.columns\b/i.test(text) &&
        /\bSeguimientosPostulacion\b/i.test(text)
    ) {
        return `
            SELECT
                column_name AS name,
                data_type AS tipo,
                character_maximum_length AS max_length,
                CASE
                    WHEN is_nullable = 'YES' THEN 1
                    ELSE 0
                END AS is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'seguimientospostulacion'
            ORDER BY ordinal_position
        `;
    }

    if (
        /OBJECT_ID\s*\(\s*'dbo\.SeguimientosPostulacion'/i.test(text) &&
        /\bpuede_crear_tabla\b/i.test(text)
    ) {
        return `
            SELECT
                CASE
                    WHEN to_regclass('public.seguimientospostulacion') IS NULL
                    THEN 0
                    ELSE 1
                END AS seguimientos,
                CASE
                    WHEN to_regclass('public.historialseguimientos') IS NULL
                    THEN 0
                    ELSE 1
                END AS historial,
                1 AS puede_crear_tabla
        `;
    }

    if (
        /\bEXEC\s*\(\s*N?'\s*CREATE\s+TABLE\s+dbo\.HistorialSeguimientos/i.test(text)
    ) {
        return `
            CREATE TABLE IF NOT EXISTS HistorialSeguimientos
            (
                id_historial BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                id_seguimiento INTEGER NOT NULL,
                id_usuario INTEGER NOT NULL,
                accion VARCHAR(60) NOT NULL,
                estado_anterior VARCHAR(50) NULL,
                estado_nuevo VARCHAR(50) NULL,
                detalle VARCHAR(500) NULL,
                fecha_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `;
    }

    return null;
}

function reescrituraEspecial(text) {
    return (
        especialPerfil(text) ||
        especialConfiguracion(text) ||
        especialEstadoEmail(text) ||
        especialSeguimiento(text) ||
        null
    );
}

function traducirSql(text, inputs) {
    let q = String(text || "").trim();

    const especial = reescrituraEspecial(q);
    if (especial) q = especial;

    q = limpiezaComun(q);
    q = convertirDateAdd(q);
    q = convertirOuterApply(q);
    q = convertirOutput(q);
    q = convertirBooleanos(q);
    q = convertirBooleanosInsert(q);
    q = convertirTop(q);

    const params = reemplazarParametros(q, inputs);

    return params;
}

/* =========================================================
   POSTGRES - ADAPTADOR API MSSQL
========================================================= */

let pgPool = null;

function obtenerPgPoolReal() {
    if (pgPool) return pgPool;

    const connectionString =
        process.env.DATABASE_URL ||
        process.env.RENDER_DATABASE_URL;

    if (!connectionString) {
        throw new Error(
            "DB_ENGINE=postgres requiere DATABASE_URL o RENDER_DATABASE_URL."
        );
    }

    pgPool = new PgPool({
        connectionString,
        ssl:
            String(process.env.PG_SSL || "true")
                .toLowerCase() !== "false"
                ? { rejectUnauthorized: false }
                : false,
        max: Number(process.env.PG_POOL_MAX || 10),
        idleTimeoutMillis: Number(
            process.env.PG_IDLE_TIMEOUT_MS || 30000
        ),
        connectionTimeoutMillis: Number(
            process.env.PG_CONNECTION_TIMEOUT_MS || 15000
        )
    });

    pgPool.on("error", error => {
        console.error(
            "PostgreSQL Pool Error:",
            error.message
        );
    });

    return pgPool;
}

class PgCompatPool {
    constructor() {
        this._pgPool = obtenerPgPoolReal();
    }

    request() {
        return new PgCompatRequest(this);
    }

    async close() {
        // Los servicios comparten el pool durante toda la vida del proceso.
        // Se mantiene por compatibilidad; no se cierra aquí.
        return true;
    }
}

class PgCompatTransaction {
    constructor(pool) {
        this.pool = pool;
        this.client = null;
        this.active = false;
    }

    async begin(level = null) {
        if (this.active) return;

        this.client =
            await this.pool._pgPool.connect();

        await this.client.query("BEGIN");

        if (
            String(level || "")
                .toUpperCase() === "SERIALIZABLE"
        ) {
            await this.client.query(
                "SET TRANSACTION ISOLATION LEVEL SERIALIZABLE"
            );
        }

        this.active = true;
    }

    async commit() {
        if (!this.active || !this.client) return;

        try {
            await this.client.query("COMMIT");
        } finally {
            this.client.release();
            this.client = null;
            this.active = false;
        }
    }

    async rollback() {
        if (!this.active || !this.client) return;

        try {
            await this.client.query("ROLLBACK");
        } finally {
            this.client.release();
            this.client = null;
            this.active = false;
        }
    }
}

class PgCompatRequest {
    constructor(target) {
        this.target = target;
        this.inputs = [];
    }

    input(name, typeOrValue, maybeValue) {
        const value =
            arguments.length >= 3
                ? maybeValue
                : typeOrValue;

        this.inputs.push({
            name,
            value
        });

        return this;
    }

    async _ejecutar(text, values) {
        if (
            this.target instanceof PgCompatTransaction
        ) {
            if (
                !this.target.active ||
                !this.target.client
            ) {
                throw new Error(
                    "La transacción PostgreSQL no está iniciada."
                );
            }

            return await this.target.client.query(
                text,
                values
            );
        }

        return await this.target._pgPool.query(
            text,
            values
        );
    }

    async query(sqlText) {
        try {
            let source = String(sqlText || "").trim();

            // Reescrituras que contienen control T-SQL deben suceder
            // antes de partir el batch.
            const special = reescrituraEspecial(source);

            if (special) {
                source = special;
            }

            let statements = splitSqlStatements(source)
                .filter(Boolean);

            const recordsets = [];
            const rowsAffected = [];
            let lastRowCount = 0;

            for (let statement of statements) {
                if (
                    /^\s*SET\s+NOCOUNT\s+ON\s*$/i
                        .test(statement)
                ) {
                    continue;
                }

                if (
                    /^\s*SELECT\s+@@ROWCOUNT\s+AS\s+([A-Za-z_][A-Za-z0-9_]*)/i
                        .test(statement)
                ) {
                    const alias =
                        statement.match(
                            /^\s*SELECT\s+@@ROWCOUNT\s+AS\s+([A-Za-z_][A-Za-z0-9_]*)/i
                        )[1];

                    recordsets.push([
                        {
                            [alias]:
                                lastRowCount
                        }
                    ]);

                    rowsAffected.push(0);
                    continue;
                }

                const translated =
                    traducirSql(
                        statement,
                        this.inputs
                    );

                const result =
                    await this._ejecutar(
                        translated.text,
                        translated.values
                    );

                lastRowCount =
                    Number(result.rowCount || 0);

                rowsAffected.push(
                    lastRowCount
                );

                if (
                    Array.isArray(result.rows) &&
                    result.fields?.length
                ) {
                    recordsets.push(
                        result.rows
                    );
                }
            }

            return {
                recordset:
                    recordsets[0] || [],
                recordsets,
                rowsAffected
            };

        } catch (error) {
            throw errorCompatible(error);
        }
    }
}

function tipoDummy() {
    return tipoDummy;
}

const pgCompatSql = {
    Int: tipoDummy,
    BigInt: tipoDummy,
    Bit: tipoDummy,
    Date: tipoDummy,
    DateTime: tipoDummy,
    DateTime2: tipoDummy,
    Float: tipoDummy,
    Numeric: tipoDummy,
    Decimal: tipoDummy,
    SmallInt: tipoDummy,
    TinyInt: tipoDummy,
    NVarChar: tipoDummy,
    VarChar: tipoDummy,
    Char: tipoDummy,
    Text: tipoDummy,
    MAX: -1,
    Request: PgCompatRequest,
    Transaction: PgCompatTransaction,
    ISOLATION_LEVEL: {
        SERIALIZABLE: "SERIALIZABLE"
    }
};

/* =========================================================
   SQL SERVER
========================================================= */

const databaseConfig = {
    server:
        process.env.DB_SERVER ||
        "localhost",

    user:
        process.env.DB_USER,

    password:
        process.env.DB_PASSWORD,

    database:
        process.env.DB_NAME ||
        "EduPeruDB",

    options: {
        encrypt:
            String(
                process.env.DB_ENCRYPT ||
                "false"
            ).toLowerCase() === "true",

        trustServerCertificate:
            String(
                process.env.DB_TRUST_SERVER_CERTIFICATE ||
                "true"
            ).toLowerCase() === "true"
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },

    connectionTimeout: 15000,
    requestTimeout: 15000
};

if (process.env.DB_INSTANCE) {
    databaseConfig.options.instanceName =
        process.env.DB_INSTANCE;
} else {
    const puerto =
        Number(process.env.DB_PORT);

    if (
        Number.isFinite(puerto) &&
        puerto > 0
    ) {
        databaseConfig.port =
            puerto;
    }
}

let sqlServerPoolPromise = null;

async function conectarSqlServer() {
    if (sqlServerPoolPromise) {
        return sqlServerPoolPromise;
    }

    try {
        const pool =
            new mssql.ConnectionPool(
                databaseConfig
            );

        pool.on("error", error => {
            console.error(
                "SQL Pool Error:",
                error.message
            );

            sqlServerPoolPromise = null;
        });

        sqlServerPoolPromise =
            pool.connect();

        const conexion =
            await sqlServerPoolPromise;

        console.log(
            "SQL Server conectado correctamente."
        );

        return conexion;

    } catch (error) {
        sqlServerPoolPromise = null;

        console.error(
            "Error conectando con SQL Server:",
            error.message
        );

        throw error;
    }
}

/* =========================================================
   API PÚBLICA
========================================================= */

let pgCompatPoolSingleton = null;

async function conectarDB() {
    if (!ES_POSTGRES) {
        return await conectarSqlServer();
    }

    if (!pgCompatPoolSingleton) {
        pgCompatPoolSingleton =
            new PgCompatPool();

        const client =
            await pgCompatPoolSingleton
                ._pgPool
                .connect();

        client.release();

        console.log(
            "PostgreSQL conectado correctamente."
        );
    }

    return pgCompatPoolSingleton;
}

async function obtenerPool() {
    return await conectarDB();
}

async function probarConexion() {
    if (!ES_POSTGRES) {
        const pool =
            await obtenerPool();

        const resultado =
            await pool
                .request()
                .query(`
                    SELECT
                        DB_NAME() AS baseDatos,
                        SYSDATETIME() AS fechaServidor
                `);

        return (
            resultado.recordset[0] ||
            {}
        );
    }

    const pool =
        await obtenerPool();

    const resultado =
        await pool
            .request()
            .query(`
                SELECT
                    current_database() AS "baseDatos",
                    CURRENT_TIMESTAMP AS "fechaServidor"
            `);

    return (
        resultado.recordset[0] ||
        {}
    );
}

function obtenerMotor() {
    return ES_POSTGRES
        ? "postgres"
        : "sqlserver";
}

module.exports = {
    sql:
        ES_POSTGRES
            ? pgCompatSql
            : mssql,

    conectarDB,
    obtenerPool,
    probarConexion,
    obtenerMotor,
    esPostgres:
        () => ES_POSTGRES
};
