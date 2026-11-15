const readline = require('readline');
const BASE = process.env.EDUPERU_URL || 'http://localhost:3000';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function jsonFetch(url, options = {}) {
    const r = await fetch(url, options);
    let data = null;
    try { data = await r.json(); } catch {}
    if (!r.ok) {
        const partes = [data?.mensaje || `HTTP ${r.status}`];
        if (data?.detalle) partes.push(`Detalle: ${data.detalle}`);
        if (data?.codigo_sql !== undefined) partes.push(`SQL: ${data.codigo_sql}`);
        const e = new Error(partes.join(' | '));
        e.status = r.status;
        e.data = data;
        throw e;
    }
    return data;
}

(async () => {
    console.log('\n==============================================');
    console.log(' EDUPERÚ - PRUEBA SEGUIMIENTO VISUAL V2');
    console.log('==============================================\n');
    console.log(`Servidor: ${BASE}\n`);

    const email = (await ask('Correo de prueba [usuario@eduperu.pe]: ')).trim() || 'usuario@eduperu.pe';
    const password = (await ask('Contraseña del usuario de prueba: ')).trim();

    console.log('\n1) Iniciando sesión...');
    const login = await jsonFetch(`${BASE}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    const token = login?.resultado?.token;
    if (!token) throw new Error('No se recibió JWT.');
    console.log('✅ Autenticación correcta');

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    console.log('\n2) Revisando esquema de seguimiento...');
    const diag = await jsonFetch(`${BASE}/api/seguimiento-postulaciones/diagnostico`, { headers });
    const d = diag.resultado || {};
    console.log(`   Tabla SeguimientosPostulacion: ${d.seguimientos ? 'OK' : 'NO EXISTE'}`);
    console.log(`   Tabla HistorialSeguimientos: ${d.historial_preparado ? 'OK' : 'NO DISPONIBLE'}`);
    console.log(`   Permiso CREATE TABLE: ${d.puede_crear_tabla === 1 ? 'SI' : d.puede_crear_tabla === 0 ? 'NO' : 'N/D'}`);
    if (Array.isArray(d.restricciones) && d.restricciones.length) {
        console.log('   Restricciones CHECK detectadas:');
        for (const c of d.restricciones) console.log(`   - ${c.name}: ${c.definition}`);
    }

    const ref = `PRUEBA-VISUAL-${Date.now()}`;
    console.log('\n3) Creando seguimiento de prueba...');
    const creado = await jsonFetch(`${BASE}/api/seguimiento-postulaciones`, {
        method: 'POST', headers,
        body: JSON.stringify({ id_postulacion: ref, titulo: 'Beca de prueba visual', estado: 'IDENTIFICADA', notas: 'Registro temporal para validar el módulo visual.' })
    });
    const id = creado.resultado.id_seguimiento;
    console.log(`✅ Seguimiento #${id} creado - ${creado.resultado.progreso}%`);

    const pasos = ['REQUISITOS_REVISADOS', 'DOCUMENTOS_EN_PROCESO', 'POSTULADA', 'EN_EVALUACION'];
    for (const estado of pasos) {
        const r = await jsonFetch(`${BASE}/api/seguimiento-postulaciones/${id}/estado`, {
            method: 'PATCH', headers, body: JSON.stringify({ estado })
        });
        console.log(`✅ ${r.resultado.estado_etiqueta} - ${r.resultado.progreso}%`);
    }

    console.log('\n4) Consultando historial...');
    const hist = await jsonFetch(`${BASE}/api/seguimiento-postulaciones/${id}/historial`, { headers });
    console.log(`✅ Movimientos registrados: ${hist.total}`);
    if (hist.total === 0) console.log('⚠️ El seguimiento funciona, pero la tabla de historial no está disponible.');

    console.log('\n5) Consultando resumen...');
    const resumen = await jsonFetch(`${BASE}/api/seguimiento-postulaciones/resumen`, { headers });
    console.log(`✅ Total: ${resumen.resultado.total} | Activos: ${resumen.resultado.activos} | Postulados: ${resumen.resultado.postulados}`);

    console.log('\n6) Limpiando registro de prueba...');
    await jsonFetch(`${BASE}/api/seguimiento-postulaciones/${id}`, { method: 'DELETE', headers });
    console.log('✅ Registro temporal eliminado');

    console.log('\n==============================================');
    console.log(' PRUEBA COMPLETADA');
    console.log('==============================================');
    console.log('El seguimiento es personal y no modifica una postulación oficial de PRONABEC.\n');
})().catch((e) => {
    console.error(`\n❌ ${e.message}`);
    console.error('Revisa también la terminal donde está ejecutándose npm start; ahora mostrará la causa SQL exacta.');
    process.exitCode = 1;
}).finally(() => rl.close());
