# Publicar la app en Netlify

La app vive en Netlify y los datos siguen en tu Google Sheets. Apps Script hace de puente entre las dos.

## 1. Preparar Apps Script (una sola vez)

1. En tu hoja de Google: *Extensiones → Apps Script*. Debe tener el archivo `Code.gs` del paquete.
2. *Configuración del proyecto (engranaje) → Propiedades del script → Agregar propiedad*:
   - Propiedad: `API_TOKEN`
   - Valor: una clave larga y difícil de adivinar, por ejemplo de 30 caracteres. Guárdala, la usarás en cada celular.
3. *Implementar → Nueva implementación → Aplicación web*:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario** (sin cuenta). Es necesario para que Netlify pueda llamar al servicio; el token es lo que protege los datos.
4. Copia la URL que termina en `/exec`.

> Si tu cuenta es de Google Workspace y no aparece la opción *Cualquier usuario*, el administrador la tiene bloqueada. En ese caso usa una cuenta Gmail personal para la hoja y el script.

## 2. Subir el proyecto a GitHub

La variable de entorno solo se aplica cuando Netlify *construye* el sitio, y eso no ocurre con arrastrar y soltar (Netlify Drop). Por eso el sitio se conecta a un repositorio:

1. Crea un repositorio en GitHub, por ejemplo `efectivo-app` (puede ser privado).
2. Sube el contenido de la carpeta `netlify` a la raíz del repositorio: `index.html`, `config.js`, `build-config.js`, `netlify.toml`, `sw.js`, `manifest.webmanifest` e `icons/`.
3. En Netlify: *Add new site → Import an existing project → GitHub* y elige el repositorio. Deja los campos de compilación como vienen: `netlify.toml` ya indica el comando `node build-config.js` y el directorio `.`.

## 3. Crear la variable APPS_SCRIPT_URL

1. En tu sitio de Netlify: *Site configuration → Environment variables → Add a variable → Add a single variable*.
2. Llena:
   - **Key:** `APPS_SCRIPT_URL`
   - **Value:** la URL de Apps Script, por ejemplo `https://script.google.com/macros/s/AKfycb…/exec`
   - **Scopes:** deja *All scopes* (o al menos *Builds*).
   - **Deploy contexts:** *Same value for all deploy contexts*.
3. Pulsa *Create variable*.
4. Ve a *Deploys → Trigger deploy → Deploy site* para que el cambio se aplique.

En el registro del despliegue debe aparecer `✔ config.js generado con la URL de Apps Script`. Si la variable falta o tiene otro formato, el despliegue se detiene con un mensaje que lo explica, y el sitio anterior sigue en línea.

**Con la terminal (opcional):** instala Netlify CLI (`npm install -g netlify-cli`), entra a la carpeta y ejecuta:

```
netlify login
netlify link
netlify env:set APPS_SCRIPT_URL "https://script.google.com/macros/s/XXXXXXXX/exec"
netlify deploy --build --prod
```

**Cuándo cambiarla:** solo si creas una implementación *nueva* en Apps Script (la URL cambia). Si editas una implementación existente con *Nueva versión*, la URL se mantiene y no hay que tocar nada. Tras cambiar la variable, vuelve a desplegar.

**Sobre el token:** no lo guardes como variable de Netlify. `config.js` se descarga en el navegador de cualquiera que abra el sitio, así que todo lo que entre ahí es visible. La URL puede ser pública; el token se escribe en cada equipo.

## 4. Abrir en cada equipo

1. Abre tu dirección de Netlify.
2. Escribe el token en la pantalla de conexión y pulsa *Probar y conectar*. Queda guardado en ese navegador.
3. En el celular: Chrome → menú → *Instalar app* (Android), o Safari → Compartir → *Agregar a inicio* (iPhone). Queda con su ícono y se abre a pantalla completa.

Para quitar el acceso de un equipo: *Conexión → Cerrar sesión en este equipo*. Si pierdes un celular, cambia el valor de `API_TOKEN` en Apps Script; todos los equipos tendrán que escribir el token nuevo.

## Qué incluye la carpeta

| Archivo | Función |
|---|---|
| `index.html` | La app |
| `config.js` | URL del servicio; se genera en cada despliegue |
| `build-config.js` | Lee `APPS_SCRIPT_URL` y escribe `config.js` |
| `manifest.webmanifest`, `icons/` | Permiten instalarla como app en el celular |
| `sw.js` | Abre la app rápido aunque la señal sea débil (los datos siempre se piden en vivo) |
| `netlify.toml` | Cabeceras de seguridad: la página solo puede comunicarse con Google Apps Script y Google Fonts |

## Si algo falla

- **Token no válido:** el token escrito no coincide con `API_TOKEN`, o falta la propiedad.
- **Failed to fetch / no conecta:** la implementación no está como *Cualquier usuario*, o la URL no termina en `/exec`.
- **El despliegue falla con «Falta la variable»:** revisa que la clave sea exactamente `APPS_SCRIPT_URL` y que su alcance incluya *Builds*.
- **Cambié Code.gs y no se nota:** en Apps Script, *Implementar → Gestionar implementaciones → Editar → Nueva versión*. La URL se mantiene.
