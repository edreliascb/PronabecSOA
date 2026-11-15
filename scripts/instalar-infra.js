const fs = require('fs');
const path = require('path');

const raiz = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const packagePath = path.join(raiz, 'package.json');
const gitignorePath = path.join(raiz, '.gitignore');

if (!fs.existsSync(packagePath)) {
  throw new Error(`No existe package.json en ${raiz}`);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8').replace(/^\uFEFF/, ''));
pkg.scripts = pkg.scripts || {};
pkg.scripts['infra:verificar'] = 'node scripts/verificar-infra.js';
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

let gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
const lineas = gitignore.split(/\r?\n/).map(x => x.trim());
if (!lineas.includes('.env.docker')) {
  if (gitignore && !gitignore.endsWith('\n')) gitignore += '\n';
  gitignore += '.env.docker\n';
}
fs.writeFileSync(gitignorePath, gitignore, 'utf8');

console.log('✅ package.json actualizado: infra:verificar');
console.log('✅ .gitignore protege .env.docker');
