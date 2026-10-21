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

## Tipo de cambio por período

En *Períodos*, la columna **T/C** guarda el tipo de cambio (C$ por US$) de cada mes. Al registrar un retiro, una compra con débito o una transferencia con la cuenta en dólares, se propone el T/C del período (puedes cambiarlo en el formulario). Si el período no tiene T/C, se usa el último que registraste. Se guarda en la hoja Mes_Anio, columna `Tipo_Cambio`.

## Fecha y hora en cada movimiento

Gastos, retiros, ingresos, llenados de combustible, movimientos de banco y tarjetas se registran con la **fecha y hora en que ocurrió el movimiento**, que tú eliges: un campo para la fecha y otro para la hora, más los atajos *Ahora*, *Hace 1 h*, *Hace 3 h* y *Ayer*. Si lo anotas horas después, cambia la fecha y la hora antes de guardar. Si la fecha queda en el futuro, el formulario avisa.

Aparte, el servidor guarda en `Fecha_Registro` el momento exacto en que lo anotaste (en ingresos, `Fecha_Registro` es la fecha del ingreso que eliges). Los registros antiguos de Access quedan solo con fecha.

## Códigos de cuenta automáticos

Al agregar una cuenta en *Catálogos → Cuentas* el código se asigna solo: el siguiente número libre (C033, C034…). El servidor lo calcula al guardar, así dos personas no pueden recibir el mismo código.

## Cuentas, efectivo y dinero disponible

El dinero se lleva como en la realidad, por **cuenta**: Avanz Córdobas, BAC Córdobas, BAC Dólares y **Efectivo en mano**. Los saldos no dependen del período.

- **Saldos actuales:** la primera vez, en *Inicio* o *Bancos*, usa **Escribir saldos actuales**: lo que tienes ahora en cada cuenta (míralo en la app del banco) y el efectivo. Desde ese momento la app suma y resta sola. Puedes **Ajustar saldos actuales** cuando quieras, por ejemplo al conciliar con el banco. Los ingresos «Saldo de Mes Anterior» que registraste con la app en octubre ya no hacen falta: la misma ventana ofrece quitarlos (solo esos; los de Access no se tocan). Si una versión anterior alcanzó a borrar alguno de Access, el servidor los restaura solo, o en la hoja con *Efectivo → Restaurar saldos de Access borrados*.
- **Qué mueve cada cuenta:**
  - *Ingreso:* sube la cuenta donde se depositó (o el efectivo).
  - *Retiro:* solo retiro de cajero o retiro sin tarjeta; baja la cuenta y sube el efectivo.
  - *Gasto en efectivo:* baja el efectivo. Solo se puede si tienes ese efectivo; si no, la app ofrece registrar primero el retiro o pagar con débito.
  - *Gasto con débito o pago directo* (tarjeta de débito, pago en línea, transferencia a terceros): baja la cuenta directamente. No es un retiro.
  - *Transferencia entre tus cuentas* (también depositar efectivo o pasar de dólares a córdobas): baja una y sube la otra; no es ingreso ni gasto.
- **Dinero disponible** = cuentas en córdobas + efectivo. La cuenta en dólares se muestra aparte, con su equivalente al T/C del período.

**Saldo disponible al registrar:** en los formularios de retiro, gasto y transferencia, debajo de la cuenta aparece el **saldo disponible** y cuánto quedaría con el monto escrito (en US$ para la cuenta en dólares; el efectivo en mano para gastos en efectivo). Un retiro o una transferencia que supera el saldo no se puede guardar. Mientras no escribas los saldos actuales, solo se muestra el saldo sin bloquear.

## Qué controlan los períodos

Los períodos (del 20 al 19) solo agrupan **gastos y presupuesto**: los sobres, lo gastado contra lo presupuestado y los cortes. **Ingresos y retiros** no se abren ni se cierran por período: cada uno se asigna solo al período que corresponde a su fecha, así el resumen de un período muestra los ingresos y retiros que hubo entre sus fechas.

## Importar el presupuesto desde Excel

En **Presupuesto** usa *Descargar plantilla* (trae el presupuesto del mes o del mes anterior) o el archivo `Plantilla_Presupuesto.xlsx` del paquete. Llénalo y usa *Importar desde Excel*.

- Columnas que reconoce: **Cuenta** (código como `C014`, o el nombre de la cuenta), **Descripción**, **Monto**; opcionales **Cantidad** y **Unidad**. También entiende encabezados como Código, Concepto, Partida, Valor, Total o Importe, y el encabezado puede estar en cualquiera de las primeras 20 filas.
- Todo lo que esté después de la fila **TOTAL** se ignora.
- Antes de importar ves el resumen, las filas con error (por ejemplo una cuenta que no existe) y eliges si **reemplazas** el presupuesto del mes o lo **sumas** al existente.

## Períodos del 20 al 19

Cada período empieza el día de pago y termina el día anterior del mes siguiente: **Octubre 2026 va del 20 de octubre al 19 de noviembre**. El día se cambia en *Períodos → El período empieza el día* (se guarda en la hoja Empresa, columna `Dia_Inicio_Periodo`).

- **Período activo:** es el último mes con *Abierto* activado en Períodos (hoy, Octubre 2026). La app lo selecciona por defecto en todas las secciones y lo marca como *(activo)* en el selector.
- Puedes consultar otro mes con el selector. Si ese mes está cerrado, verás un aviso y **lo que registres quedará en el período activo**: al tocar *Registrar*, la app cambia sola a ese período y te lo indica.
- Si cambias los períodos directamente en la hoja de Google, la app lo toma en la siguiente sincronización (cada minuto o al volver a abrirla).
- Inicio, Presupuesto y Períodos muestran las fechas de cada período.
- Si registras un gasto, retiro o ingreso con una fecha que pertenece a otro período, el formulario te avisa y ofrece cambiar al período correcto.

**Para cargar el presupuesto de un período nuevo (por ejemplo Octubre 2026):**
1. En *Períodos*, deja **Abierto** y **Presupuesto** activados para Octubre.
2. Arriba, en el selector de período, elige **Octubre 2026** (o toca *Ver* en la fila de Octubre).
3. En *Presupuesto* aparecen las opciones: **Importar desde Excel**, **Copiar las partidas de Septiembre**, **Descargar plantilla** o **Agregar partida**.

## Períodos que aparecían como fecha

Google Sheets convertía textos como `SEPTIEMBRE-2026` en fechas al guardarlos, por eso el selector mostraba "2026 09" y el mes salía en cero. Ahora todo texto se guarda tal cual. La primera vez que alguien entra, el servicio repara solo los períodos ya convertidos y une los encabezados mensuales duplicados. También puedes hacerlo a mano en la hoja (*Efectivo → Revisar hojas y reparar períodos*) o en la app (*Períodos → Revisar y reparar períodos*).

**Si un mes aparecía repetido** (por ejemplo dos "Agosto 2026" y faltaba Octubre): algunos períodos convertidos en fecha se leían corridos un mes por la zona horaria (1/9 como 31/8). Ahora:
- En la hoja Mes_Anio, el período se toma siempre de las columnas **Mes** y **Anio**, que Sheets no convierte.
- La reparación automática corrige Mes_Anio en todas las hojas. Si hay encabezados mensuales repetidos, elimina los vacíos y, en gastos, retiros e ingresos, devuelve su nombre al mes que corresponde según las fechas de sus movimientos. Nunca junta dos meses con datos: si no puede decidir, lo informa para que lo revises.

**Selector de período por año:** junto al período hay un filtro de **año** (por defecto el del período elegido). Elige *Todos* para ver todos los períodos o un año anterior para ver solo sus meses.

## Combustible: costo y rendimiento

- Al registrar un llenado escribe el **precio por litro** (se sugiere el último que usaste) o el **total pagado**; la app calcula lo otro.
- **Fecha y hora:** el llenado se registra con fecha y hora (por defecto, el momento actual; el botón *Ahora* la vuelve a poner). Se guarda en la columna `Fecha` de Consumo_Combustible como fecha con hora. Los registros antiguos quedan solo con fecha.
- Al guardar aparece el cálculo: kilómetros recorridos desde el llenado anterior, litros y galones, **km/L y km/GL**, un medidor comparado con tu historial, el costo y el costo por km. Con los botones km/L y km/GL eliges cuál ver en grande, en el medidor y en el gráfico; la app recuerda tu elección.
- km/GL se calcula a partir de km/L (1 galón = 3.78541 litros), así ambas cifras siempre coinciden, también en el historial.
- Toca cualquier llenado de la lista para ver su cálculo; desde ahí puedes editarlo.
- **Llenados sin precio:** si hay llenados sin precio, la sección Combustible muestra *Completar precio*: escribes el precio por litro y desde qué fecha, y se calcula el costo de cada uno.
- **Millas:** `Horometro_Millas` y `Millas_Recorrido` ahora se calculan como km ÷ 1.60934. En Access guardaban el mismo número que los km; el servidor corrige el historial la primera vez que se conecta, y también los litros que Access había truncado a 2 decimales (por ejemplo 41.628 en vez de 41.62), recalculando km/L y km/GL.
- El costo se guarda en la hoja **Consumo_Combustible** (columnas `Precio_Litro` y `Costo`, que se agregan solas). **No se registra en Gastos**, porque se paga con tarjeta de crédito; el gasto real aparece cuando registras el pago de la tarjeta.

## Velocidad: cómo carga y guarda la app

- **Abre al instante:** la app guarda una copia de los datos en el equipo y la muestra de inmediato. Después pide al servidor solo los cambios nuevos, no toda la base. La primera vez en cada equipo (o tras cerrar sesión) sí descarga todo, comprimido.
- **Guardado inmediato:** al registrar un gasto, retiro, ingreso, partida, movimiento de banco, tarjeta o combustible, el registro aparece enseguida y se envía en segundo plano. Arriba se ve *Guardando…* mientras tanto. Si el envío falla, el cambio se deshace y el formulario se abre de nuevo con lo que escribiste.
- **Varios equipos:** cada minuto, y cada vez que vuelves a la app, se traen los cambios hechos desde otros celulares.
- **Hoja oculta _Cambios:** el servidor anota ahí cada cambio para poder enviar solo lo nuevo. No la borres ni la edites; se limpia sola.
- **Si editas directamente en Google Sheets:** esos cambios llegan a la app con *Mi cuenta → Recargar datos*, o solos una vez al día.
- Al cerrar sesión se borra la copia guardada en el equipo.

## Actualizaciones de la app

La página se pide siempre primero a Netlify, así se usa la versión publicada; si no hay señal se abre la copia guardada en el equipo. En *Mi cuenta* (y en el menú lateral) se ve el **número de versión**, para comprobar que tienes la última.

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
