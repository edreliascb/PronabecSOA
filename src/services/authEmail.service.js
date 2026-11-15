/* =========================================================
   EDUPERÚ SOA
   AUTH EMAIL SERVICE V1
   Verificación de correo + recuperación de contraseña
========================================================= */

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { obtenerPool, sql } = require("../config/database");
const authService = require("./auth.service");
const emailService = require("./email.service");

const BCRYPT_ROUNDS = 12;

function crearError(mensaje, statusCode, codigo = null) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    if (codigo) error.codigo = codigo;
    return error;
}

function normalizarEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function generarTokenPlano() {
    return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
    return crypto.createHash("sha256").update(String(token || ""), "utf8").digest("hex");
}

function minutosEnv(nombre, defecto) {
    const n = Number(process.env[nombre]);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : defecto;
}

async function invalidarTokens(pool, idUsuario, tipo, transaction = null) {
    const request = transaction ? new sql.Request(transaction) : pool.request();
    await request
        .input("idUsuario", sql.Int, Number(idUsuario))
        .input("tipo", sql.NVarChar(30), tipo)
        .query(`
            UPDATE dbo.AuthTokens
            SET usado = 1, fecha_uso = COALESCE(fecha_uso, SYSDATETIME())
            WHERE id_usuario = @idUsuario AND tipo = @tipo AND usado = 0;
        `);
}

async function crearTokenPersistente(idUsuario, tipo, ttlMinutos, ipSolicitud = null) {
    const token = generarTokenPlano();
    const tokenHash = hashToken(token);
    const pool = await obtenerPool();

    await invalidarTokens(pool, idUsuario, tipo);

    await pool.request()
        .input("idUsuario", sql.Int, Number(idUsuario))
        .input("tipo", sql.NVarChar(30), tipo)
        .input("tokenHash", sql.Char(64), tokenHash)
        .input("ttl", sql.Int, ttlMinutos)
        .input("ip", sql.NVarChar(64), String(ipSolicitud || "").slice(0, 64) || null)
        .query(`
            INSERT INTO dbo.AuthTokens
                (id_usuario, tipo, token_hash, expira_en, ip_solicitud)
            VALUES
                (@idUsuario, @tipo, @tokenHash, DATEADD(MINUTE, @ttl, SYSDATETIME()), @ip);
        `);

    return token;
}

async function obtenerEstadoEmailPorUsuario(idUsuario) {
    const pool = await obtenerPool();
    const r = await pool.request()
        .input("idUsuario", sql.Int, Number(idUsuario))
        .query(`
            SELECT TOP 1 id_usuario, email_verificado, fecha_verificacion, fecha_actualizacion
            FROM dbo.UsuarioEmailEstado
            WHERE id_usuario = @idUsuario;
        `);

    // Cuentas anteriores a esta mejora se consideran verificadas para no romper accesos existentes.
    if (!r.recordset[0]) {
        return {
            id_usuario: Number(idUsuario),
            email_verificado: true,
            fecha_verificacion: null,
            legacy: true
        };
    }

    return { ...r.recordset[0], email_verificado: Boolean(r.recordset[0].email_verificado), legacy: false };
}

async function asegurarEstadoNuevoUsuario(idUsuario) {
    const pool = await obtenerPool();
    await pool.request()
        .input("idUsuario", sql.Int, Number(idUsuario))
        .query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.UsuarioEmailEstado WHERE id_usuario = @idUsuario)
            BEGIN
                INSERT INTO dbo.UsuarioEmailEstado (id_usuario, email_verificado)
                VALUES (@idUsuario, 0);
            END
        `);
}

async function registrarConVerificacion(datos, meta = {}) {
    const resultadoRegistro = await authService.registrarUsuario(datos);
    const usuario = resultadoRegistro.usuario;

    await asegurarEstadoNuevoUsuario(usuario.id_usuario);

    const token = await crearTokenPersistente(
        usuario.id_usuario,
        "VERIFICAR_EMAIL",
        minutosEnv("EMAIL_VERIFICATION_TTL_MINUTES", 1440),
        meta.ip
    );

    let correo;
    try {
        correo = await emailService.enviarVerificacion({
            email: usuario.email,
            nombres: usuario.nombres,
            token
        });
    } catch (error) {
        console.error("[AuthEmailService] No se pudo enviar verificación:", error.message);
        correo = { enviado: false, simulado: false, error: true };
    }

    return {
        usuario,
        requiereVerificacion: true,
        correo
    };
}

async function validarEmailAntesDeLogin(email) {
    const normalizado = normalizarEmail(email);
    if (!normalizado) return;

    const usuario = await authService.buscarPorEmail(normalizado);
    if (!usuario) return;

    const estado = await obtenerEstadoEmailPorUsuario(usuario.id_usuario);
    if (!estado.email_verificado) {
        throw crearError(
            "Debes verificar tu correo electrónico antes de iniciar sesión.",
            403,
            "EMAIL_NO_VERIFICADO"
        );
    }
}

async function reenviarVerificacion(email, meta = {}) {
    const normalizado = normalizarEmail(email);
    const respuestaGenerica = {
        mensaje: "Si existe una cuenta pendiente de verificación, enviaremos un nuevo enlace."
    };

    if (!normalizado) return respuestaGenerica;

    const usuario = await authService.buscarPorEmail(normalizado);
    if (!usuario || !Boolean(usuario.activo)) return respuestaGenerica;

    const estado = await obtenerEstadoEmailPorUsuario(usuario.id_usuario);
    if (estado.email_verificado) return respuestaGenerica;

    const token = await crearTokenPersistente(
        usuario.id_usuario,
        "VERIFICAR_EMAIL",
        minutosEnv("EMAIL_VERIFICATION_TTL_MINUTES", 1440),
        meta.ip
    );

    await emailService.enviarVerificacion({ email: usuario.email, nombres: usuario.nombres, token });
    return respuestaGenerica;
}

async function verificarEmail(tokenPlano) {
    const tokenHash = hashToken(tokenPlano);
    if (!tokenPlano || tokenHash.length !== 64) {
        throw crearError("El enlace de verificación no es válido.", 400, "TOKEN_INVALIDO");
    }

    const pool = await obtenerPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
        const request = new sql.Request(transaction);
        const r = await request
            .input("tokenHash", sql.Char(64), tokenHash)
            .query(`
                SELECT TOP 1 t.id_token, t.id_usuario, t.expira_en, t.usado
                FROM dbo.AuthTokens t WITH (UPDLOCK, ROWLOCK)
                WHERE t.token_hash = @tokenHash
                  AND t.tipo = 'VERIFICAR_EMAIL'
                  AND t.usado = 0
                  AND t.expira_en > SYSDATETIME();
            `);

        const item = r.recordset[0];
        if (!item) {
            throw crearError("El enlace de verificación es inválido, expiró o ya fue utilizado.", 400, "TOKEN_NO_DISPONIBLE");
        }

        await new sql.Request(transaction)
            .input("idUsuario", sql.Int, item.id_usuario)
            .query(`
                IF EXISTS (SELECT 1 FROM dbo.UsuarioEmailEstado WHERE id_usuario = @idUsuario)
                    UPDATE dbo.UsuarioEmailEstado
                    SET email_verificado = 1, fecha_verificacion = SYSDATETIME(), fecha_actualizacion = SYSDATETIME()
                    WHERE id_usuario = @idUsuario;
                ELSE
                    INSERT INTO dbo.UsuarioEmailEstado (id_usuario, email_verificado, fecha_verificacion)
                    VALUES (@idUsuario, 1, SYSDATETIME());
            `);

        await new sql.Request(transaction)
            .input("idToken", sql.BigInt, item.id_token)
            .query(`UPDATE dbo.AuthTokens SET usado = 1, fecha_uso = SYSDATETIME() WHERE id_token = @idToken;`);

        await transaction.commit();
        return { verificado: true };
    } catch (error) {
        try { await transaction.rollback(); } catch {}
        throw error;
    }
}

async function solicitarRecuperacion(email, meta = {}) {
    const normalizado = normalizarEmail(email);
    const respuestaGenerica = {
        mensaje: "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."
    };

    if (!normalizado) return respuestaGenerica;

    const usuario = await authService.buscarPorEmail(normalizado);
    if (!usuario || !Boolean(usuario.activo)) return respuestaGenerica;

    const token = await crearTokenPersistente(
        usuario.id_usuario,
        "RESET_PASSWORD",
        minutosEnv("PASSWORD_RESET_TTL_MINUTES", 30),
        meta.ip
    );

    await emailService.enviarRecuperacion({ email: usuario.email, nombres: usuario.nombres, token });
    return respuestaGenerica;
}

function validarNuevaPassword(password) {
    const value = String(password || "");
    if (value.length < 8) throw crearError("La nueva contraseña debe tener al menos 8 caracteres.", 400, "PASSWORD_CORTA");
    if (Buffer.byteLength(value, "utf8") > 72) throw crearError("La contraseña es demasiado larga.", 400, "PASSWORD_LARGA");
    return value;
}

async function restablecerPassword(tokenPlano, nuevaPassword) {
    const password = validarNuevaPassword(nuevaPassword);
    const tokenHash = hashToken(tokenPlano);

    const pool = await obtenerPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
        const r = await new sql.Request(transaction)
            .input("tokenHash", sql.Char(64), tokenHash)
            .query(`
                SELECT TOP 1 id_token, id_usuario, expira_en, usado
                FROM dbo.AuthTokens WITH (UPDLOCK, ROWLOCK)
                WHERE token_hash = @tokenHash
                  AND tipo = 'RESET_PASSWORD'
                  AND usado = 0
                  AND expira_en > SYSDATETIME();
            `);

        const item = r.recordset[0];
        if (!item) {
            throw crearError("El enlace para restablecer la contraseña es inválido, expiró o ya fue utilizado.", 400, "TOKEN_NO_DISPONIBLE");
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        await new sql.Request(transaction)
            .input("idUsuario", sql.Int, item.id_usuario)
            .input("passwordHash", sql.NVarChar(255), passwordHash)
            .query(`
                UPDATE dbo.Usuarios
                SET password_hash = @passwordHash, fecha_actualizacion = SYSDATETIME()
                WHERE id_usuario = @idUsuario AND activo = 1;
            `);

        await new sql.Request(transaction)
            .input("idUsuario", sql.Int, item.id_usuario)
            .query(`
                UPDATE dbo.AuthTokens
                SET usado = 1, fecha_uso = COALESCE(fecha_uso, SYSDATETIME())
                WHERE id_usuario = @idUsuario AND tipo = 'RESET_PASSWORD' AND usado = 0;
            `);

        await transaction.commit();
        return { restablecida: true };
    } catch (error) {
        try { await transaction.rollback(); } catch {}
        throw error;
    }
}

async function estadoEmail(idUsuario) {
    return obtenerEstadoEmailPorUsuario(idUsuario);
}

module.exports = {
    registrarConVerificacion,
    validarEmailAntesDeLogin,
    reenviarVerificacion,
    verificarEmail,
    solicitarRecuperacion,
    restablecerPassword,
    estadoEmail
};
