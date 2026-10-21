/**
 * Se ejecuta en cada despliegue de Netlify.
 *  1) APPS_SCRIPT_URL  → genera config.js (obligatoria).
 *  2) ANDROID_PACKAGE_ID y ANDROID_SHA256 → genera /.well-known/assetlinks.json,
 *     que permite que la app Android (APK de PWABuilder) se abra sin la barra del navegador.
 * Configúralas en: Site configuration → Environment variables.
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
fs.writeFileSync(path.join(__dirname, 'config.js'),
`/* Archivo generado en el despliegue a partir de APPS_SCRIPT_URL. No editar a mano. */
window.APP_CONFIG = {
  API_URL: ${JSON.stringify(url)}
};
`);
console.log('✔ config.js generado con la URL de Apps Script (' + url.slice(0, 45) + '…)');

// ---- App Android (Trusted Web Activity)
const pkg = (process.env.ANDROID_PACKAGE_ID || '').trim();
const shaRaw = (process.env.ANDROID_SHA256 || '').trim();
if (!pkg || !shaRaw) {
  console.log('ℹ Sin ANDROID_PACKAGE_ID / ANDROID_SHA256: no se genera assetlinks.json (la APK mostraría la barra del navegador).');
} else {
  const shas = shaRaw.split(/[\s,;]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
  const bad = shas.filter(s => !/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  if (!/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(pkg)) { console.error('\n✖ ANDROID_PACKAGE_ID no es un nombre de paquete válido (ej. app.netlify.efectivo.twa): ' + pkg + '\n'); process.exit(1); }
  if (bad.length) { console.error('\n✖ ANDROID_SHA256 debe ser la huella SHA-256 con dos puntos (AB:CD:…, 32 pares). No válidas: ' + bad.join(', ') + '\n'); process.exit(1); }
  const dir = path.join(__dirname, '.well-known');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'assetlinks.json'), JSON.stringify([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: shas }
  }], null, 2));
  console.log('✔ .well-known/assetlinks.json generado para ' + pkg + ' (' + shas.length + ' huella' + (shas.length > 1 ? 's' : '') + ')');
}
