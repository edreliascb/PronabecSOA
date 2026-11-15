const readline = require('readline');
const BASE = process.env.EDUPERU_URL || 'http://localhost:3000';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(resolve => rl.question(q, resolve));

async function jsonFetch(url, options = {}) {
    const response = await fetch(url, options);
    let data = null;
    try { data = await response.json(); } catch {}
    if (!response.ok) {
        const error = new Error(data?.mensaje || `HTTP ${response.status}`);
        error.data = data;
        throw error;
    }
    return data;
}

(async () => {
    console.log('\n==============================================');
    console.log(' EDUPERÚ - PRUEBA CHECKLIST DOCUMENTAL');
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

    console.log('\n2) Registrando documento temporal...');
    const creado = await jsonFetch(`${BASE}/api/mis-documentos`, {
        method: 'POST', headers,
        body: JSON.stringify({
            tipo_documento: 'CERTIFICADO_PRUEBA',
            nombre_archivo: `certificado-prueba-${Date.now()}.pdf`,
            descripcion: 'Registro temporal para validar el checklist documental.',
            fecha_emision: new Date().toISOString().slice(0,10)
        })
    });
    const id = creado?.resultado?.id_documento_usuario;
    if (!id) throw new Error('No se recibió id_documento_usuario.');
    console.log(`✅ Documento #${id} registrado - estado PENDIENTE`);

    console.log('\n3) Validando metadatos...');
    const validado = await jsonFetch(`${BASE}/api/validacion-documentos/${id}`, { method: 'POST', headers });
    console.log(`✅ Estado: ${validado?.resultado?.estado || 'N/D'} | ${validado?.resultado?.observacion || ''}`);

    console.log('\n4) Consultando checklist...');
    const listado = await jsonFetch(`${BASE}/api/mis-documentos`, { headers });
    const encontrado = (listado?.resultado || []).find(d => Number(d.id_documento_usuario) === Number(id));
    if (!encontrado) throw new Error('El documento temporal no apareció en el listado.');
    console.log(`✅ Total personal: ${listado.total} | Registro temporal encontrado`);

    console.log('\n5) Limpiando registro temporal...');
    await jsonFetch(`${BASE}/api/mis-documentos/${id}`, { method: 'DELETE', headers });
    console.log('✅ Registro temporal eliminado');

    console.log('\n==============================================');
    console.log(' PRUEBA COMPLETADA');
    console.log('==============================================');
    console.log('El checklist documental es personal y no envía documentos a PRONABEC.\n');
})().catch(error => {
    console.error(`\n❌ ${error.message}`);
    console.error('Revisa también la terminal donde está ejecutándose npm start.');
    process.exitCode = 1;
}).finally(() => rl.close());
