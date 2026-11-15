const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const requeridos = [
  'Dockerfile',
  '.dockerignore',
  '.env.docker.example',
  'docker-compose.yml',
  path.join('.github', 'workflows', 'ci.yml')
];

console.log('\n==============================================');
console.log(' EDUPERÚ - VERIFICACIÓN DOCKER + CI');
console.log('==============================================\n');

let ok = true;
for (const rel of requeridos) {
  const existe = fs.existsSync(path.join(raiz, rel));
  console.log(`${existe ? '✅' : '❌'} ${rel}`);
  if (!existe) ok = false;
}

if (!ok) process.exit(1);

const dockerfile = fs.readFileSync(path.join(raiz, 'Dockerfile'), 'utf8');
const dockerignore = fs.readFileSync(path.join(raiz, '.dockerignore'), 'utf8');
const compose = fs.readFileSync(path.join(raiz, 'docker-compose.yml'), 'utf8');
const workflow = fs.readFileSync(path.join(raiz, '.github', 'workflows', 'ci.yml'), 'utf8');

const checks = [
  ['Node 24 en Docker', /FROM\s+node:24/i.test(dockerfile)],
  ['Usuario no root', /USER\s+node/i.test(dockerfile)],
  ['Healthcheck Docker', /HEALTHCHECK/i.test(dockerfile)],
  ['.env excluido de imagen', /(^|\n)\.env(\n|$)/.test(dockerignore)],
  ['Compose usa archivo de entorno', /env_file:/i.test(compose) && /\.env\.docker/i.test(compose)],
  ['Acceso al SQL Server host', /host\.docker\.internal/i.test(compose)],
  ['GitHub Actions usa npm ci', /npm ci/i.test(workflow)],
  ['CI no contiene credenciales', !/DB_PASSWORD\s*[:=]\s*[^\s$]+/i.test(workflow) && !/JWT_SECRET\s*[:=]\s*[^\s$]+/i.test(workflow)]
];

console.log('');
for (const [nombre, pasa] of checks) {
  console.log(`${pasa ? '✅' : '❌'} ${nombre}`);
  if (!pasa) ok = false;
}

const gitignorePath = path.join(raiz, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  const reglas = gitignore.split(/\r?\n/).map(x => x.trim());
  const protegeEnv = reglas.includes('.env') || reglas.includes('.env*') || reglas.includes('.env.*');
  const protegeDockerEnv = reglas.includes('.env.docker') || reglas.includes('.env*') || reglas.includes('.env.*');
  console.log(`${protegeEnv ? '✅' : '❌'} .env protegido por .gitignore`);
  console.log(`${protegeDockerEnv ? '✅' : '⚠️'} .env.docker protegido por .gitignore`);
  if (!protegeEnv || !protegeDockerEnv) ok = false;
}

console.log('\n==============================================');
if (!ok) {
  console.log(' VERIFICACIÓN CON OBSERVACIONES');
  console.log('==============================================\n');
  process.exit(1);
}
console.log(' PRUEBA COMPLETADA');
console.log('==============================================');
console.log('Docker + GitHub Actions listos para usar.\n');
