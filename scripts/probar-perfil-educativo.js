const readline = require('readline');

const BASE_URL = process.env.EDUPERU_URL || 'http://localhost:3000';

function preguntar(rl, texto, defecto = '') {
  return new Promise(resolve => rl.question(`${texto}${defecto ? ` [${defecto}]` : ''}: `, r => resolve((r || defecto).trim())));
}

async function req(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const e = new Error(data.mensaje || `HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return data;
}

(async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\n==============================================');
  console.log(' EDUPERÚ - PRUEBA PERFIL EDUCATIVO V1');
  console.log('==============================================\n');
  console.log(`Servidor: ${BASE_URL}\n`);

  try {
    const email = await preguntar(rl, 'Correo de prueba', 'usuario@eduperu.pe');
    const password = await preguntar(rl, 'Contraseña del usuario de prueba', 'EduPeru2026!');

    console.log('\n1) Iniciando sesión...');
    const login = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const token = login.token || login.resultado?.token || login.accessToken || login.resultado?.accessToken;
    if (!token) throw new Error('Login correcto, pero no se recibió JWT.');
    console.log('✅ Autenticación correcta');

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    console.log('\n2) Consultando perfil educativo...');
    const actual = await req('/api/perfil', { headers });
    const p = actual.resultado || {};
    console.log(`✅ Usuario: ${[p.nombres,p.apellidos].filter(Boolean).join(' ') || p.email || 'OK'}`);
    console.log(`   Región: ${[p.departamento,p.provincia,p.distrito].filter(Boolean).join(' / ') || 'Sin completar'}`);
    console.log(`   Nivel: ${p.nivel_estudio || 'Sin completar'}`);
    console.log(`   Carrera de interés: ${p.carrera_interes || 'Sin completar'}`);
    console.log(`   Institución: ${p.institucion || 'Sin completar'}`);

    console.log('\n3) Verificando actualización sin alterar tus datos...');
    const payload = {
      departamento: p.departamento || '',
      provincia: p.provincia || '',
      distrito: p.distrito || '',
      carrera_interes: p.carrera_interes || '',
      nivel_estudio: p.nivel_estudio || '',
      institucion: p.institucion || ''
    };
    const guardado = await req('/api/perfil', { method: 'PUT', headers, body: JSON.stringify(payload) });
    console.log(`✅ ${guardado.mensaje || 'Perfil actualizado correctamente'}`);

    console.log('\n4) Calculando completitud...');
    const q = guardado.resultado || payload;
    const campos = [q.departamento,q.provincia,q.distrito,q.carrera_interes,q.nivel_estudio,q.institucion];
    const completos = campos.filter(v => String(v || '').trim()).length;
    const porcentaje = Math.round((completos / campos.length) * 100);
    console.log(`✅ Perfil completado: ${porcentaje}% (${completos}/${campos.length} campos)`);

    console.log('\n==============================================');
    console.log(' PRUEBA COMPLETADA');
    console.log('==============================================');
    console.log('El perfil queda disponible para recomendaciones y simulador de elegibilidad.\n');
  } catch (e) {
    console.error(`\n❌ No se pudo completar la operación: ${e.message}\n`);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
})();
