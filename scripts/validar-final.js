const { spawnSync } = require('child_process');
const fs = require('fs');

const BASE_URL = process.env.FINAL_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.FINAL_TEST_EMAIL || 'usuario@eduperu.pe';
const TEST_PASSWORD = process.env.FINAL_TEST_PASSWORD || 'EduPeru2026!';

const results = [];
let token = null;

function line(char='=', n=66) {
  console.log(char.repeat(n));
}

function push(name, status, detail='') {
  results.push({ name, status, detail });
  const icon = status === 'OK' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${name}${detail ? ' — ' + detail : ''}`);
}

async function request(path, options={}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE_URL + path, {
    ...options,
    headers,
    signal: AbortSignal.timeout(15000)
  });

  const raw = await res.text();
  let data;
  try { data = raw ? JSON.parse(raw) : {}; }
  catch { data = { raw }; }
  return { res, data };
}

async function endpointCheck(name, path, options={}, okStatuses=[200], warnStatuses=[]) {
  try {
    const { res, data } = await request(path, options);

    if (okStatuses.includes(res.status)) {
      push(name, 'OK', `HTTP ${res.status}`);
      return data;
    }

    if (warnStatuses.includes(res.status)) {
      push(name, 'WARN', `HTTP ${res.status}`);
      return data;
    }

    push(
      name,
      'FAIL',
      `HTTP ${res.status}: ${data?.mensaje || data?.message || JSON.stringify(data).slice(0,180)}`
    );
    return null;
  } catch (e) {
    push(name, 'FAIL', e.message);
    return null;
  }
}

function readPackage() {
  const raw = fs.readFileSync('package.json', 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function runCommandWindows(command, input) {
  const comspec = process.env.ComSpec || process.env.COMSPEC || 'cmd.exe';
  return spawnSync(comspec, ['/d', '/s', '/c', command], {
    cwd: process.cwd(),
    encoding: 'utf8',
    input,
    timeout: 180000,
    maxBuffer: 20 * 1024 * 1024,
    windowsHide: true,
    env: {
      ...process.env,
      FINAL_TEST_EMAIL: TEST_EMAIL,
      FINAL_TEST_PASSWORD: TEST_PASSWORD
    }
  });
}

function runCommandUnix(command, input) {
  return spawnSync('/bin/sh', ['-lc', command], {
    cwd: process.cwd(),
    encoding: 'utf8',
    input,
    timeout: 180000,
    maxBuffer: 20 * 1024 * 1024,
    env: {
      ...process.env,
      FINAL_TEST_EMAIL: TEST_EMAIL,
      FINAL_TEST_PASSWORD: TEST_PASSWORD
    }
  });
}

function runCommand(command, input='') {
  return process.platform === 'win32'
    ? runCommandWindows(command, input)
    : runCommandUnix(command, input);
}

function printTail(label, value, maxChars=7000) {
  if (!value) return;
  const text = String(value).trim();
  if (!text) return;
  console.log(`\n--- ${label} ---`);
  console.log(text.length > maxChars ? text.slice(-maxChars) : text);
}

function runNpmScript(scriptName, critical=false) {
  const pkg = readPackage();
  const scripts = pkg.scripts || {};

  if (!scripts[scriptName]) {
    push(`npm run ${scriptName}`, 'WARN', 'script no presente; se omite');
    return;
  }

  console.log(`\n▶ npm run ${scriptName}`);

  // Muchos scripts EduPerú preguntan correo/contraseña.
  // Mandamos Enter suficientes veces para aceptar sus valores por defecto.
  const defaultInput = '\n'.repeat(30);

  const r = runCommand(`npm run ${scriptName}`, defaultInput);

  printTail('stdout', r.stdout);
  printTail('stderr', r.stderr, 4000);

  if (r.error) {
    const code = r.error.code || r.error.name || 'ERROR';
    const message = r.error.message || String(r.error);

    if (code === 'ETIMEDOUT') {
      push(`npm run ${scriptName}`, critical ? 'FAIL' : 'WARN', 'tiempo de espera agotado');
    } else {
      push(`npm run ${scriptName}`, critical ? 'FAIL' : 'WARN', `${code}: ${message}`);
    }
    return;
  }

  if (typeof r.status !== 'number') {
    push(`npm run ${scriptName}`, critical ? 'FAIL' : 'WARN', 'proceso sin código de salida');
    return;
  }

  if (r.status === 0) {
    push(`npm run ${scriptName}`, 'OK');
  } else {
    push(
      `npm run ${scriptName}`,
      critical ? 'FAIL' : 'WARN',
      `código de salida ${r.status}`
    );
  }
}

function checkDocker() {
  console.log('\n4) DOCKER');
  const r = runCommand('docker compose ps');

  printTail('docker compose ps', r.stdout, 4000);
  printTail('docker stderr', r.stderr, 2000);

  if (r.error || r.status !== 0) {
    push('Docker Compose', 'WARN', r.error?.message || `código ${r.status}`);
    return;
  }

  const out = String(r.stdout || '');
  if (/healthy/i.test(out)) {
    push('Docker Compose', 'OK', 'contenedor healthy');
  } else if (/\bUp\b/i.test(out)) {
    push('Docker Compose', 'WARN', 'contenedor activo, health no confirmado');
  } else {
    push('Docker Compose', 'WARN', 'no se detectó contenedor activo');
  }
}

(async () => {
  console.log('');
  line();
  console.log(' EDUPERÚ - VALIDACIÓN FINAL INTEGRAL V3');
  line();
  console.log(`Servidor : ${BASE_URL}`);
  console.log(`Usuario  : ${TEST_EMAIL}`);
  console.log('');

  console.log('1) NÚCLEO / INFRAESTRUCTURA');
  await endpointCheck('API Health', '/api/health');
  await endpointCheck('SQL Server / EduPeruDB', '/api/database/health');
  await endpointCheck('OpenAPI / Swagger JSON', '/api-docs.json');

  console.log('\n2) AUTENTICACIÓN / JWT');
  try {
    const { res, data } = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });

    if (res.ok && data?.success !== false) {
      token = data?.resultado?.token || data?.token || null;
      push('Login real', 'OK', token ? 'JWT recibido' : 'login OK (token no detectado)');
    } else {
      push('Login real', 'FAIL', data?.mensaje || `HTTP ${res.status}`);
    }
  } catch (e) {
    push('Login real', 'FAIL', e.message);
  }

  if (token) {
    const headers = { Authorization: `Bearer ${token}` };
    await endpointCheck('Perfil protegido', '/api/perfil', { headers }, [200], [404]);
    await endpointCheck('Favoritos protegidos', '/api/favoritos', { headers });
    await endpointCheck('Notificaciones protegidas', '/api/notificaciones', { headers });
    await endpointCheck('Observabilidad', '/api/observabilidad/resumen', { headers }, [200], [401,403]);
    await endpointCheck('Hermes / estado', '/api/hermes/estado', { headers }, [200], [404]);
    await endpointCheck('Hexagonal / recursos', '/api/hexagonal/pronabec/recursos', { headers }, [200], [404]);
  } else {
    push('Endpoints protegidos', 'WARN', 'sin JWT no se pudieron validar');
  }

  console.log('\n3) PRUEBAS AUTOMÁTICAS EXISTENTES');

  const scripts = [
    ['saga:probar', true],
    ['orquestacion:probar', true],
    ['simulador:probar', false],
    ['comparador:probar', false],
    ['calendario:probar', false],
    ['seguimiento:probar', false],
    ['documentos:probar', false],
    ['notificaciones:probar', false],
    ['recomendaciones:probar', false],
    ['perfil-educativo:probar', false],
    ['resiliencia:probar', true],
    ['observabilidad:probar', false],
    ['hexagonal:probar', true],
    ['hermes:probar', true],
    ['infra:verificar', true],
    ['correo:probar', true]
  ];

  for (const [script, critical] of scripts) {
    runNpmScript(script, critical);
  }

  checkDocker();

  console.log('\n5) RESUMEN');
  line('-');

  const ok = results.filter(r => r.status === 'OK').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  const fail = results.filter(r => r.status === 'FAIL').length;

  console.log(`✅ OK       : ${ok}`);
  console.log(`⚠️ Avisos   : ${warn}`);
  console.log(`❌ Fallos   : ${fail}`);
  line('-');

  if (fail === 0) {
    console.log('RESULTADO FINAL: APROBADO ✅');
    if (warn > 0) {
      console.log('Hay avisos no críticos que conviene revisar antes del push final.');
    }
    process.exit(0);
  }

  console.log('RESULTADO FINAL: REVISAR ❌');
  console.log('Ahora los fallos muestran el código/error real del proceso.');
  process.exit(1);
})().catch(err => {
  console.error('\n❌ Error inesperado en validación final V3:', err);
  process.exit(1);
});
