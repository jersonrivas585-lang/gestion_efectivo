/**
 * Se ejecuta en cada despliegue de Netlify.
 * Lee la variable de entorno APPS_SCRIPT_URL y genera config.js con ella.
 * Configúrala en: Site configuration → Environment variables.
 */
const fs = require('fs');
const path = require('path');

const url = (process.env.APPS_SCRIPT_URL || '').trim();

if (!url) {
  console.error('\n✖ Falta la variable de entorno APPS_SCRIPT_URL.');
  console.error('  Agrégala en Netlify: Site configuration → Environment variables,');
  console.error('  con el valor de tu implementación de Apps Script (termina en /exec).\n');
  process.exit(1);
}
if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) {
  console.error('\n✖ APPS_SCRIPT_URL no tiene el formato esperado:');
  console.error('  https://script.google.com/macros/s/<ID>/exec');
  console.error('  Valor recibido: ' + url + '\n');
  process.exit(1);
}

const out = `/* Archivo generado en el despliegue a partir de APPS_SCRIPT_URL. No editar a mano. */
window.APP_CONFIG = {
  API_URL: ${JSON.stringify(url)}
};
`;
fs.writeFileSync(path.join(__dirname, 'config.js'), out);
console.log('✔ config.js generado con la URL de Apps Script (' + url.slice(0, 45) + '…)');
