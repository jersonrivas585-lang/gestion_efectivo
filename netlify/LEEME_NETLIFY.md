# Publicar la app en Netlify con usuario y contraseña

La app vive en Netlify, los datos en tu Google Sheets y Apps Script hace de puente. Cada persona entra con su propio usuario y contraseña.

## 1. Actualizar Apps Script

1. En tu hoja de Google: *Extensiones → Apps Script*.
2. Reemplaza todo el contenido de `Código.gs` por el nuevo `Code.gs` del paquete.
3. Guarda (ícono de disco).
4. *Implementar → Gestionar implementaciones → Editar (lápiz) → Versión: Nueva versión → Implementar*. Confirma que siga con *Ejecutar como: Yo* y *Acceso: Cualquier usuario*. La URL `/exec` no cambia.
5. Si antes creaste la propiedad `API_TOKEN`, ya puedes borrarla en *Configuración del proyecto → Propiedades del script*. Ya no se usa.

## 2. La hoja Usuarios

La hoja tiene la misma estructura que usas en tus otras apps:

| Columna | Contenido |
|---|---|
| Usuario | Nombre para entrar, en minúsculas (ej. `jrivas`, `jessy.rivas`) |
| Nombre | Nombre completo que muestra la app |
| Rol | `admin`, `supervisor`, `registrador` o `consulta` |
| Activo | TRUE / FALSE. FALSE bloquea la entrada y cierra sus sesiones |
| DebeCambiarClave | TRUE obliga a crear una contraseña propia al entrar |
| ClaveHash / ClaveSal | Contraseña cifrada (encabezado rojo). No editar |
| UltimoAcceso / Alta | Fecha y hora en formato ISO (UTC) |
| AltaPor | Quién creó el usuario (`plantilla` si fue desde la hoja) |
| PermisosPersonalizados | JSON que ajusta permisos de ese usuario, ej. `{"gastos.editar":true}`. `[]` = sin ajustes |

**Crear el primer administrador:** recarga la hoja, ve a *Efectivo → Crear o restablecer usuario* y autoriza el script la primera vez. Si ya tenías la hoja Usuarios de la versión anterior, se convierte sola a esta estructura la primera vez que alguien entra (o con *Efectivo → Preparar hoja Usuarios*).

Los demás usuarios se crean desde la app: *Mi cuenta → Usuarios → Agregar usuario*. Ahí eliges el rol, marcas o desmarcas permisos y decides si debe cambiar la contraseña al entrar.

## 3. Netlify

La variable `APPS_SCRIPT_URL` se mantiene igual. En GitHub reemplaza o agrega estos archivos (los demás no cambian):

| Archivo | Cambio |
|---|---|
| `index.html` | Bancos, dólares, importación de presupuesto, corrección de períodos |
| `build-config.js` | Genera también `assetlinks.json` para la app Android |
| `manifest.webmanifest` | Ajustes para la app instalada |
| `netlify.toml` | Cabecera para `assetlinks.json` |
| `sw.js` | Nueva versión de caché |
| `vendor/xlsx.full.min.js` | **Nuevo**: lector de Excel. Créalo en la carpeta `vendor` |

Netlify despliega solo. Si en Apps Script tenías un archivo HTML llamado `Index`, puedes borrarlo: ya no se usa.

## 4. Usar la app

- Abre tu dirección de Netlify, escribe usuario y contraseña, y pulsa *Entrar*. La sesión dura 30 días en ese equipo.
- En el celular: Chrome → *Instalar app* (Android) o Safari → Compartir → *Agregar a inicio* (iPhone).
- *Mi cuenta* permite cambiar tu contraseña y cerrar sesión. Al cambiarla se cierran tus sesiones en otros equipos.

## Roles y permisos

| Permiso | admin | supervisor | registrador | consulta |
|---|:-:|:-:|:-:|:-:|
| `ingresos.editar` | ✓ | ✓ | ✓ | |
| `presupuesto.editar` | ✓ | ✓ | | |
| `gastos.editar` | ✓ | ✓ | ✓ | |
| `retiros.editar` | ✓ | ✓ | ✓ | |
| `tarjetas.editar` | ✓ | ✓ | ✓ | |
| `combustible.editar` | ✓ | ✓ | ✓ | |
| `bancos.editar` | ✓ | ✓ | ✓ | |
| `cortes.guardar` | ✓ | ✓ | | |
| `catalogos.editar` | ✓ | ✓ | | |
| `periodos.gestionar` | ✓ | ✓ | | |
| `usuarios.gestionar` | ✓ | | | |

Todos los roles pueden consultar toda la información. Un rol que no exista aquí (por ejemplo `cobrador`, copiado de otra app) se trata como `consulta`. Las llaves de PermisosPersonalizados que pertenecen a otras apps (como `auditoria.ver`) se conservan intactas.

**Importante si copias usuarios de otra app:** las contraseñas solo funcionarán si esa app cifra con el mismo método (función `hash_` en `Code.gs`). Si no es así, copia las filas, pon una contraseña temporal a cada uno desde *Mi cuenta → Usuarios* y deja marcado *Pedir que cree su propia contraseña*.

## App Android sin barra del navegador (PWABuilder)

La APK de PWABuilder es una *Trusted Web Activity*. Android solo la abre a pantalla completa si el sitio demuestra que la app es suya con el archivo `/.well-known/assetlinks.json`. Sin ese archivo, o si no coincide, la abre como pestaña de Chrome con la barra de dirección.

1. En el ZIP que descargaste de PWABuilder hay un archivo **assetlinks.json** (y un *signing key info*). Ábrelo con el Bloc de notas y copia:
   - `package_name`, por ejemplo `app.netlify.efectivo_rivas.twa`
   - el valor de `sha256_cert_fingerprints`, del tipo `AB:CD:12:…` (32 pares separados por dos puntos)
2. En Netlify, *Site configuration → Environment variables*, crea dos variables:
   - `ANDROID_PACKAGE_ID` = el package_name
   - `ANDROID_SHA256` = la huella. Si subes la app a Google Play, agrega también la huella de *Play Console → Configuración → Integridad de la app → Firma de apps*, separadas por coma.
3. *Deploys → Trigger deploy → Deploy site*. En el registro debe aparecer `✔ .well-known/assetlinks.json generado`.
4. Comprueba que abre: `https://TU-SITIO.netlify.app/.well-known/assetlinks.json`
5. En el celular, desinstala la app, borra los datos de Chrome para ese sitio (o reinicia el teléfono) e instala la APK otra vez.

Guarda bien el archivo `signing.keystore` y su contraseña que vienen en el ZIP de PWABuilder: los necesitas para publicar actualizaciones con la misma huella.

## Cuentas de banco y dólares

La sección **Bancos** muestra el saldo de cada cuenta. Al conectar por primera vez se crean solas: *Avanz Córdobas*, *BAC Córdobas* y *BAC Dólares*.

1. **Saldo inicial:** en *Bancos → Saldo inicial y datos* escribe lo que tiene cada cuenta hoy y la fecha. Solo cuentan los movimientos desde esa fecha, así el historial de Access no altera los saldos.
2. **Ingresos:** al registrar un ingreso eliges en qué cuenta se depositó (o *Efectivo, sin banco*). Así la suma de ingresos en córdobas coincide con lo depositado en los bancos.
3. **Retiros:** eliges desde qué cuenta sale. Si es la cuenta en dólares, escribes el monto en US$ y el tipo de cambio; la app calcula los córdobas, descuenta los dólares y registra un **ingreso automático** por la conversión.
4. **Transferir entre cuentas:** botón en Bancos. Entre cuentas en córdobas solo mueve el saldo. De dólares a córdobas convierte con el tipo de cambio y registra el ingreso automático. De córdobas a dólares es compra de dólares: no cuenta como gasto ni como retiro de efectivo.
5. **Depósito o ajuste:** un depósito en dólares entra solo a la cuenta en US$; un depósito en córdobas se registra también como ingreso. El ajuste corrige un saldo sin tocar ingresos ni retiros.

Los ingresos automáticos se editan o eliminan desde el retiro o la transferencia que los generó. El tipo de cambio que uses queda como sugerencia para la próxima vez.

## Importar el presupuesto desde Excel

En **Presupuesto** usa *Descargar plantilla* (trae el presupuesto del mes o del mes anterior) o el archivo `Plantilla_Presupuesto.xlsx` del paquete. Llénalo y usa *Importar desde Excel*.

- Columnas que reconoce: **Cuenta** (código como `C014`, o el nombre de la cuenta), **Descripción**, **Monto**; opcionales **Cantidad** y **Unidad**. También entiende encabezados como Código, Concepto, Partida, Valor, Total o Importe, y el encabezado puede estar en cualquiera de las primeras 20 filas.
- Todo lo que esté después de la fila **TOTAL** se ignora.
- Antes de importar ves el resumen, las filas con error (por ejemplo una cuenta que no existe) y eliges si **reemplazas** el presupuesto del mes o lo **sumas** al existente.

## Períodos que aparecían como fecha

Google Sheets convertía textos como `SEPTIEMBRE-2026` en fechas al guardarlos, por eso el selector mostraba "2026 09" y el mes salía en cero. Ahora todo texto se guarda tal cual. La primera vez que alguien entra, el servicio repara solo los períodos ya convertidos y une los encabezados mensuales duplicados. También puedes hacerlo a mano en la hoja (*Efectivo → Revisar hojas y reparar períodos*) o en la app (*Períodos → Revisar y reparar períodos*).

## Seguridad

- Tras 5 intentos fallidos, ese usuario queda bloqueado 15 minutos.
- Si pierdes un celular: desactiva el usuario en *Mi cuenta → Usuarios*, o en la hoja usa *Efectivo → Cerrar todas las sesiones*.
- ¿Olvidaste la contraseña? Otro administrador la cambia desde la app, o en la hoja con *Efectivo → Crear o restablecer usuario* (escribiendo el mismo usuario).

## Si algo falla

- **«Aún no hay usuarios»:** crea el primero con el menú Efectivo de la hoja (paso 2).
- **No aparece el menú Efectivo:** recarga la hoja; si sigue sin aparecer, confirma que guardaste `Code.gs`.
- **«Acción desconocida: login»:** Apps Script sigue con la versión anterior. Repite el paso 1.4 (*Nueva versión*).
- **«Falta la dirección del servicio»:** la variable `APPS_SCRIPT_URL` no llegó al despliegue; revisa el Deploy log.
- **«No hay conexión con el servidor»:** revisa el internet, o que la implementación esté con acceso *Cualquier usuario*.
