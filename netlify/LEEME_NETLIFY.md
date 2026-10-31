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


**Si un formulario aparece en solo lectura:** el mensaje indica el motivo. *Tu usuario no tiene permiso…* significa que el rol o los permisos del usuario no incluyen esa acción (por ejemplo `bancos.editar`, «Registrar transferencias y movimientos de banco»); un administrador lo activa en *Mi cuenta → Usuarios*. *Este período está cerrado…* significa que hay que abrir el período en *Períodos*. La app **refresca los permisos del usuario** desde el servidor al abrirse y cada 10 minutos, así que un permiso nuevo se aplica sin volver a entrar (aparece el aviso «Tus permisos se actualizaron»). El botón **+** solo se muestra si tienes permiso para lo que abre.
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

## Tipo de cambio por período: compra y venta

En *Períodos* cada mes tiene dos tasas (C$ por US$ 1):

- **T/C compra** (columna `Tipo_Cambio`): lo que pagas por cada dólar cuando **compras dólares**, es decir, cuando pasas de córdobas a dólares (por ejemplo 37.15). Se usa en las transferencias de una cuenta en córdobas o del efectivo hacia la cuenta en dólares o el efectivo en dólares.
- **T/C venta** (columna `Tipo_Cambio_Venta`): lo que recibes por cada dólar cuando **cambias dólares a córdobas** (por ejemplo 36.40). Se usa en las transferencias de dólares a córdobas, en los retiros de la cuenta en dólares recibidos en córdobas, y para valorar en córdobas los gastos, depósitos y saldos en dólares (el «≈ C$» de las tarjetas de Bancos).

Cada formulario propone la tasa que corresponde y lo indica en su etiqueta («Tipo de cambio de compra» o «de venta»). En una transferencia la tasa cambia sola al elegir la dirección, salvo que hayas escrito una tasa a mano. Si el período no tiene una de las tasas, se usa la última registrada; los períodos que solo tenían una tasa la usan para las dos.

## Fecha y hora en cada movimiento

Gastos, retiros, ingresos, llenados de combustible, movimientos de banco y tarjetas se registran con la **fecha y hora en que ocurrió el movimiento**, que tú eliges: un campo para la fecha y otro para la hora, más los atajos *Ahora*, *Hace 1 h*, *Hace 3 h* y *Ayer*. Si lo anotas horas después, cambia la fecha y la hora antes de guardar. Si la fecha queda en el futuro, el formulario avisa.

Aparte, el servidor guarda en `Fecha_Registro` el momento exacto en que lo anotaste (en ingresos, `Fecha_Registro` es la fecha del ingreso que eliges). Los registros antiguos de Access quedan solo con fecha.

## Códigos de cuenta automáticos

Al agregar una cuenta en *Catálogos → Cuentas* el código se asigna solo: el siguiente número libre (C033, C034…). El servidor lo calcula al guardar, así dos personas no pueden recibir el mismo código.

## Cuentas, efectivo y dinero disponible

El dinero se lleva como en la realidad, por **cuenta**: Avanz Córdobas, BAC Córdobas, BAC Dólares y **Efectivo en mano**. Los saldos no dependen del período.

- **Saldos actuales:** la primera vez, en *Inicio* o *Bancos*, usa **Escribir saldos actuales**: lo que tienes ahora en cada cuenta (míralo en la app del banco) y el efectivo. Desde ese momento la app suma y resta sola. Ese aviso solo aparece mientras no hayas escrito los saldos; después, los saldos cambian únicamente con ingresos, retiros, gastos, transferencias y depósitos de efectivo. Los ingresos «Saldo de Mes Anterior» que registraste con la app en octubre ya no hacen falta: la misma ventana ofrece quitarlos (solo esos; los de Access no se tocan). Si una versión anterior alcanzó a borrar alguno de Access, el servidor los restaura solo, o en la hoja con *Efectivo → Restaurar saldos de Access borrados*.
- **Qué mueve cada cuenta:**
  - *Ingreso:* sube la cuenta donde se depositó (o el efectivo).
  - *Retiro:* solo retiro de cajero o retiro sin tarjeta; baja la cuenta y sube el efectivo.
  - *Gasto en efectivo:* baja el efectivo. Solo se puede si tienes ese efectivo; si no, la app ofrece registrar primero el retiro o pagar con débito.
  - *Gasto con débito o pago directo* (tarjeta de débito, pago en línea, transferencia a terceros): baja la cuenta directamente. No es un retiro.
  - *Transferencia entre tus cuentas* (también depositar efectivo o pasar de dólares a córdobas): baja una y sube la otra; no es ingreso ni gasto.
- **Dinero disponible** = cuentas en córdobas + efectivo. La cuenta en dólares se muestra aparte, con su equivalente al T/C del período.

**Movimientos por período:** la lista de movimientos de *Bancos* (de cada cuenta y del efectivo) muestra solo los del **período elegido arriba** (del 20 al 19), y dice cuántos son. Cambia el período con el selector del encabezado, o activa **Mostrar todos los meses** para ver también los anteriores (hasta los 250 más recientes). El saldo que aparece en cada movimiento es siempre el acumulado real de la cuenta, no solo del período.

**Movimientos anteriores a los saldos:** en *Bancos*, cada cuenta muestra también los movimientos (depósitos, transferencias, ingresos, retiros, gastos con débito) que se hicieron **antes** de la fecha y hora de los saldos actuales. Salen atenuados con la nota «Anterior a los saldos» y no cambian el saldo, porque el saldo que escribiste ya los incluye. Los depósitos de versiones anteriores se pueden abrir, corregir o eliminar.

**Presupuesto del período en curso:** además de los *Ingresos del período* (lo depositado entre las fechas del período), muestra el **Dinero para el período** = lo que tienes hoy en cuentas en córdobas y efectivo + lo que ya gastaste en el período. Ese dinero incluye los saldos con que empezaste, y es con el que se calcula **Sin asignar** (dinero − presupuestado).

**Saldo disponible al registrar:** en los formularios de retiro, gasto y transferencia, debajo de la cuenta aparece el **saldo disponible** y cuánto quedaría con el monto escrito (en US$ para la cuenta en dólares; el efectivo en mano para gastos en efectivo). Un retiro o una transferencia que supera el saldo no se puede guardar. Mientras no escribas los saldos actuales, solo se muestra el saldo sin bloquear.

## Agregar, editar o quitar cuentas de banco

En *Bancos* hay dos botones: **Agregar cuenta** y **Editar esta cuenta** (para administradores y supervisores).

- **Agregar cuenta:** escribes el banco, la moneda (córdobas o dólares), el número (opcional) y el **saldo inicial** con su fecha y hora (por defecto, este momento). El nombre se sugiere solo, por ejemplo *Lafise Córdobas* o *Avanz Dólares*. La cuenta aparece de inmediato en Bancos, en el Inicio y en todos los formularios (depósitos, retiros, transferencias, gastos con débito). Las cuentas en córdobas suman al dinero disponible; las cuentas en dólares van aparte, cada una con su saldo en US$.
- **Editar:** cambia el nombre, el número, el saldo inicial o el orden.
- **Quitar:** una cuenta con movimientos **no se elimina**, se **desactiva** (interruptor *Activa*). Antes de desactivarla, su saldo debe estar en cero: transfiérelo a otra cuenta. La cuenta desactivada desaparece de las listas, sus movimientos se conservan y se puede reactivar desde el enlace *cuentas desactivadas* de Bancos (*Catálogos → Cuentas de banco*). Solo una cuenta sin ningún movimiento se puede eliminar del todo.

## Retirar de la cuenta en dólares: en córdobas o en dólares

Al registrar un retiro desde la cuenta en dólares aparece **Recibo el efectivo en**:

- **Córdobas** (lo habitual): escribes los **córdobas que recibes** y el tipo de cambio. Se descuenta de la cuenta su equivalente en dólares: C$ 730 ÷ T/C 36.5 = **US$ 20**. El efectivo en córdobas sube C$ 730.
- **Dólares**: escribes los US$ y **no hay conversión**. Se descuentan de la cuenta y suben el **Efectivo en dólares**, un bolsillo aparte del efectivo en córdobas (no cuenta en el dinero disponible en córdobas, igual que la cuenta en dólares).

Los retiros desde cuentas en córdobas son siempre en córdobas.

**Efectivo en dólares:** aparece como una tarjeta en *Bancos* (con sus movimientos y su saldo) y como una línea aparte en el *Inicio*. Su saldo inicial se escribe en *Escribir saldos actuales* (campo *Efectivo en dólares*).

**Mover el efectivo en dólares:** el efectivo en dólares también aparece como opción en *Transferir o depositar* (campos *Desde* y *Hacia*, y como destino de un *Depósito de efectivo*). En *Bancos → Efectivo en dólares* hay atajos:
- **Depositar en la cuenta en dólares:** pasa dólares en efectivo a *BAC Dólares*. Es la misma moneda, así que no hay tipo de cambio.
- **Cambiar a córdobas:** escribes los córdobas que recibes (en el efectivo en córdobas o en una cuenta en córdobas) y el tipo de cambio; se descuentan los dólares equivalentes (C$ 365 ÷ T/C 36.5 = US$ 10). No se registra como ingreso.
- **Comprar dólares en efectivo** (con *Transferir o depositar*: desde *Efectivo en mano* o una cuenta en córdobas hacia *Efectivo en dólares*): como esos córdobas salen de lo que puedes gastar, se registra también como **gasto** (por defecto en *Ahorros*), igual que cuando compras dólares para la cuenta en dólares.
- **Recibir dólares en efectivo** (por ejemplo, te pagan en dólares): *Depósito de efectivo* con destino *Efectivo en dólares*; cuenta como ingreso por su equivalente en córdobas (pide el tipo de cambio).

**Gastos en dólares:** en *Forma de pago* hay dos formas de efectivo: **Efectivo en córdobas** (la de siempre) y **Efectivo en dólares (US$)**. Con la segunda escribes el monto en US$ y el tipo de cambio; el gasto cuenta en córdobas para el presupuesto (US$ 10 × 36.5 = C$ 365) y se descuenta de tu efectivo en dólares. Si no tienes suficientes dólares, la app avisa y no deja guardar.

## Cuenta en dólares: comprar y depositar

- **Comprar dólares** (transferir de una cuenta en córdobas, o del efectivo, a *BAC Dólares*): en *Bancos → BAC Dólares → Comprar dólares* (o *Transferir o depositar*) eliges la cuenta de origen, escribes **cuánto entra a la cuenta destino** (por ejemplo US$ 20) y el tipo de cambio; la app calcula lo que sale del origen (US$ 20 × 36.5 = C$ 730). En todas las transferencias el monto que escribes es el que **entra al destino**. Baja la cuenta de córdobas, suben los dólares y, como ese dinero sale de lo que puedes gastar, se registra **también como gasto** en la cuenta que elijas (por defecto *Ahorros*), en el período activo. Ese gasto queda ligado a la transferencia: se edita o se elimina desde ella.
- **Depositar dólares recibidos** (por ejemplo, te pagan en dólares en efectivo y los depositas): en *Bancos → BAC Dólares → Transferir o depositar → Tipo: Depósito de efectivo*. Escribes los US$ y el tipo de cambio; suben los dólares de la cuenta y cuenta como ingreso por su equivalente en córdobas. No cambia lo que tienes en córdobas ni en efectivo.
- **Depósito de efectivo** (en *Bancos → Transferir o depositar → Tipo: Depósito de efectivo*; el destino es la cuenta que estás viendo): suma dinero a una cuenta en córdobas, a la cuenta en dólares o al efectivo en mano. **Solo suma**; para restar se usan los retiros, las transferencias o los gastos. Por defecto **cuenta como ingreso del período** (interruptor «Cuenta como ingreso del período»): aparece en *Ingresos*, en el *Inicio*, en *Presupuesto* y en el corte. Si es un depósito en dólares, pide el tipo de cambio para valorarlo en córdobas. Desactiva el interruptor solo si registras un saldo que ya tenías. Los depósitos anteriores sin esa marca cuentan como ingreso, excepto los que dicen «saldo» en la nota.
- **Los ingresos se registran solo como depósitos**, desde la cuenta de banco (*Bancos → Transferir o depositar → Depósito de efectivo*) o con los accesos directos *Depósito en cuenta* de *Inicio* e *Ingresos* y el botón **+**, que abren ese mismo formulario. No existe otra forma de registrar un ingreso: la pantalla *Ingresos* muestra los depósitos que cuentan como ingreso y los ingresos anteriores de Access, que se pueden abrir y corregir. En el depósito, el campo *Concepto* (salario, bono, pago recibido…) identifica el ingreso.
- Pasar de dólares a córdobas (retiro o transferencia desde la cuenta en dólares) mueve el saldo pero **no** se registra como ingreso.
- Las transferencias que superan el saldo de la cuenta de origen no se pueden guardar (una vez escritos los saldos actuales).

## Qué controlan los períodos

Los períodos (del 20 al 19) solo agrupan **gastos y presupuesto**: los sobres, lo gastado contra lo presupuestado y los cortes. **Ingresos y retiros** no se abren ni se cierran por período: cada uno se asigna solo al período que corresponde a su fecha, así el resumen de un período muestra los ingresos y retiros que hubo entre sus fechas.

## Gastos vinculados a las partidas del presupuesto

Al registrar un gasto, debajo de *Cuenta* aparece **Partida del presupuesto**, con las partidas de esa cuenta en el período y lo que queda de cada una (por ejemplo, *Mercado · queda C$ 3,000.00*). Así la relación entre lo presupuestado y lo gastado no depende de que las descripciones coincidan.

- **Elegir una partida:** si la descripción está vacía, se llena con la de la partida. Debajo del formulario se ve cuánto está presupuestado y gastado, y cómo queda la partida con este gasto (o cuánto se excede; solo avisa, no bloquea).
- **Si no eliges:** el gasto se vincula solo a la partida con la misma descripción, si existe.
- **Sin partida:** esa opción deja el gasto fuera de toda partida aunque la descripción coincida.
- **Presupuesto:** la columna *Gastado* de cada partida suma los gastos vinculados y muestra cuántos son. Lo que no está vinculado aparece como *Otros gastos sin partida*, con su monto y cuántos son: **tócalo** para ver la lista de esos gastos y abrir cada uno para vincularlo a una partida. Al tocar el monto se abre la lista de esos gastos (que se pueden abrir para corregir). Lo que no está vinculado aparece como *Otros gastos sin partida*. Los gastos anteriores sin vínculo siguen contando por descripción igual.
- **En Gastos:** cada gasto vinculado muestra «partida …».
- **Al cambiar de período** un gasto, se quita el vínculo (la partida pertenece al otro período) y se vuelve a vincular por descripción si coincide. Si **reemplazas el presupuesto** al importar desde Excel, los gastos vinculados se vuelven a ligar por cuenta y descripción.
- El vínculo se guarda en la columna `ID_Partida` de Gastos_Detalle (se agrega sola; `0` = sin partida a propósito).

## Análisis por cuenta

En *Más → Análisis por cuenta* eliges la cuenta, el **año** (*Todos los años* o uno en particular) y el **período**: *Último mes*, *6 meses*, *12 meses*, *24 meses* o *Todo* (*Todo el año* si elegiste un año). Con *Todos los años* los períodos cuentan hacia atrás desde el último mes; con un año elegido, desde el último mes de ese año. Debajo de los filtros una línea dice qué estás viendo (por ejemplo, «Abril 2026 a Septiembre 2026, 6 meses»). El eje del gráfico muestra el mes y, en una segunda línea, el año al empezar y cuando cambia; si hay más de 36 meses, el gráfico se agrupa por año. El mismo formato de etiquetas se usa en *Últimos 12 meses* del Inicio.

## Resumen automático del período: un corte por movimiento

El corte ya no se guarda a mano: **cada gasto, retiro, depósito, transferencia o cambio del presupuesto deja su propio corte** en la hoja *Resumen* (columna `Auto` = TRUE), con los totales en ese momento y, en la columna `Motivo`, el movimiento que lo generó (por ejemplo *Retiro: C$ 700.00 de Avanz Córdobas*, *Gasto: Mercado C$ 500.00*, *Eliminado · Gasto: Pan C$ 100.00*, *Corregido · …*). Así se puede seguir paso a paso cómo cambió el efectivo en mano: retiro 700 → 810, gasto 500 → 310, gasto 100 → 210, gasto 10 → 200.

- Si un movimiento no cambia ningún total del resumen (por ejemplo, una transferencia entre dos cuentas de banco), no se agrega corte.
- Cada corte también actualiza la hoja *Consolidado* del período.
- **Solo efectivo en mano:** se quitaron «Efectivo con Jerson» y «Efectivo con Mariela»; en los cortes automáticos esas columnas quedan en 0. Los cortes anteriores se conservan.
- **Efectivo en mano:** en el período en curso es el efectivo de hoy; en un período de Access es ingresos − gastos como siempre.
- **Quién lo dispara:** cualquier usuario que haga la acción.
- **Períodos cerrados:** si un período está cerrado en *Períodos → Resumen*, ya no se le agregan cortes.
- **Pantallas:** en el *Inicio*, *Resumen del mes* muestra los últimos cortes con su movimiento; **Ver resumen** abre los totales con **Actualizar ahora**. En *Cortes de resumen* se ve el último corte de cada mes y, con **+**, todos los del mes con la columna *Movimiento*.

## Datos del hogar

En *Mi cuenta → Hogar* los **administradores** tienen el botón **Editar** para cambiar el nombre del hogar, la dirección, el teléfono y el celular. El cambio se guarda en la hoja *Empresa* y llega a los demás equipos con la sincronización. Como el nombre es la llave de esa fila, al cambiarlo se renombra la misma fila (no se crea otra) y se conservan la configuración y los saldos iniciales. Los supervisores pueden seguir cambiando la configuración (por ejemplo, el bloqueo de saldos negativos), pero no los datos del hogar.

## Barra inferior en el celular

La barra de abajo tiene, en este orden, **Inicio, Bancos, Retiros, Gastos, Presupuesto y Combustible**, y se **desliza** hacia la derecha para ver las que no caben; un desvanecido en el borde indica que hay más. **Más** queda fijo a la derecha y lleva a las demás secciones (Ingresos, Histórico, Análisis por cuenta, Tarjetas, Cortes, Catálogos, Períodos y Mi cuenta). La sección en la que estás siempre queda a la vista y resaltada.

## Registrar sin conexión

Sin señal puedes **registrar, corregir y eliminar** gastos, retiros, ingresos, depósitos y transferencias, llenados de combustible, movimientos de tarjeta y partidas del presupuesto. Se guardan primero en el teléfono, se ven al instante (saldos, presupuesto y tarjetas incluidos) y quedan en una **bandeja de salida** que sobrevive aunque cierres la app o se apague el teléfono.

- **Indicador:** arriba dice *Sin conexión · N pendientes*; al volver la señal, *Enviando…*, y desaparece cuando todo se envió. En *Mi cuenta → Envíos* ves cuántos hay y puedes tocar **Enviar ahora**.
- **Al volver la conexión** se envían solos y en el orden en que los hiciste. Los registros nuevos usan un número provisional que se cambia por el real al enviarse; si mientras tanto los corregiste, los vinculaste (por ejemplo, un gasto a una partida creada sin conexión) o los eliminaste, todo se resuelve bien. Si eliminas algo que nunca se envió, simplemente no se envía.
- **Sin duplicados:** cada envío lleva un código; si la respuesta del servidor se pierde y la app reintenta, el servidor no lo guarda dos veces.
- **Gastos automáticos:** el del pago de tarjeta y el de la compra de dólares se calculan en el teléfono de forma provisional y se reemplazan por los del servidor al enviarse. Los **cortes del resumen** se envían con la hora en que hiciste cada movimiento.
- **Pendientes con problema:** si al enviarse el servidor no acepta un registro (por ejemplo, alguien cerró el período mientras estabas sin señal), se deshace en el teléfono y aparece un aviso *N registros no se pudieron enviar → Revisar*: puedes **Corregir** (abre el formulario con lo que habías escrito) o **Descartar**.
- **Necesitan conexión:** iniciar sesión, contraseña, usuarios y permisos, datos del hogar, configuración, catálogos (cuentas, tarjetas, vehículos, bancos), abrir o cerrar períodos y tipos de cambio, importar o copiar el presupuesto, mover registros de período, saldos actuales y reparar. Sin señal avisan «Esta acción necesita internet».
- **Ten en cuenta:** sin señal ves lo último sincronizado; si otra persona registró algo desde otro equipo, los saldos se completan al sincronizar. Si cierras sesión con registros sin enviar, la app avisa porque se perderían.

**Catálogos:** cada fila de cada sección (tarjetas de crédito, cuentas de banco, cuentas, conceptos de gastos y presupuesto, conceptos de ingresos, unidades, vehículos y movimientos de retiros) tiene al final dos botones: **lápiz** para editar y **papelera** para eliminar (pide confirmar y no deja eliminar lo que está en uso, por ejemplo una tarjeta o cuenta con movimientos: en ese caso se desactiva). Tocar la fila también abre el formulario. En el celular los botones quedan siempre a la vista a la derecha. **Ordenar:** toca el título de cualquier columna para ordenar de menor a mayor (▲); otra vez, de mayor a menor (▼); una tercera vez vuelve al orden original. Los montos se ordenan como números, las fechas por fecha, las cuentas y unidades por su nombre, y cada sección recuerda su orden mientras usas la app.

## Abrir y actualizar sin saltos de tamaño

- El **tema** (claro u oscuro) se aplica antes del primer dibujo, sin parpadeo. La pantalla *Cargando datos…* espera a que cargue la letra de la app (hasta 1,5 s) para que el texto no se reacomode al mostrarse, y la letra queda guardada en el teléfono para abrir al instante después de cada actualización.
- En la computadora, el ancho de la página ya no se mueve cuando aparece o desaparece la barra de desplazamiento; en el celular se usa la altura real de la pantalla (sin saltos por la barra del navegador).
- El indicador de envíos de arriba es compacto en el celular: un punto y, si hay registros **por enviar**, su número (rojo si no hay conexión); el texto completo está en *Mi cuenta → Envíos*. Ya no empuja el año y el mes fuera de la pantalla, y el nombre del mes se acorta con «…» si no cabe.

## Ventanas en el celular

Todas las ventanas de captura y consulta (gastos, retiros, depósitos y transferencias, partidas, combustible, tarjetas, catálogos, saldos, usuarios, resumen, importar presupuesto, etc.) comparten las mismas reglas y caben en la pantalla del celular, probadas desde 320 hasta 430 px de ancho:

- **Teclado en pantalla:** la ventana se ajusta a la parte de la pantalla que sí se ve (también en iPhone), así que los botones **Cancelar** y **Guardar** y el campo que escribes no quedan tapados por el teclado; al tocar un campo se acerca a la vista. En el celular el teclado ya no se abre solo al abrir una ventana; solo en la computadora se enfoca el primer campo.
- **Título:** el nombre de la ventana se acomoda en dos líneas si hace falta y la **×** queda siempre a la derecha.
- **Listas y campos de media columna** (por ejemplo *Tipo*, *Desde* y *Hacia*): muestran su texto en hasta dos líneas en lugar de cortarlo.
- **Importar presupuesto:** la vista previa ya no es una tabla ancha: cada partida es una fila con su descripción, cuenta y monto.
- Los botones de abajo quedan fijos y la ventana se desplaza por dentro cuando el contenido es largo.

## Consultar y editar registros

**Las ventanas no se cierran al tocar fuera.** Para no perder lo que estás escribiendo, tocar el fondo oscuro alrededor de una ventana ya no la cierra (la ventana hace un pequeño rebote). Se cierra con **×**, **Cancelar** o **Cerrar**, o con la tecla Escape en la computadora.

Al tocar un gasto, retiro, depósito, transferencia, partida del presupuesto, llenado o consumo con tarjeta, se abre **en modo consulta**: se ven todos los datos sin poder cambiarlos, con los botones **Cerrar** y **Editar**. *Editar* aparece solo si el período del registro está abierto para ese módulo y tu usuario tiene permiso; al tocarlo, el formulario pasa a modo edición (con *Guardar cambios* y *Eliminar*). Si el período está cerrado, se ve el aviso correspondiente y no hay botón *Editar*. Los catálogos (cuentas, unidades, vehículos, cuentas de banco) se siguen abriendo directamente para editar.

**Listas compactas en toda la app:** todas las listas desplegables (los campos de selección de cada formulario, los filtros de año y mes de *Análisis por cuenta*, *Combustible* y *Cortes*, el filtro de cuenta de *Gastos*, el día de inicio en *Períodos*, el rol de usuario, mover de período y el año y período del encabezado) usan la misma lista propia, igual en computadora y celular: filas bajas, la opción actual resaltada, títulos de grupo cuando aplica (por ejemplo en *Pagado con*) y un buscador cuando hay más de 8 opciones (al escribir se filtran; **Enter** elige la primera; si no hay coincidencias dice *Sin resultados*). Si no hay espacio abajo, la lista se abre hacia arriba. En la computadora también se usan las flechas ↑ ↓ y Enter, y Escape la cierra. Se cierra al elegir o al tocar fuera.

**Sugerencias al escribir:** los campos de texto que tienen catálogo usan la misma lista compacta (ya no la del teléfono): *Descripción* en Gastos y Presupuesto (de **Conceptos de gastos y presupuesto** de esa cuenta, más lo que ya escribiste antes), *Concepto* de los depósitos e ingresos (de **Conceptos de ingresos**), *Tipo de retiro* (de **Movimientos de retiros**, los marcados «Mostrar en lista», más Retiro de Cajero Automático y Retiro sin tarjeta), y Banco y los campos de tarjetas. Al tocar el campo aparecen las sugerencias; al escribir se filtran; al tocar una se completa. Se puede escribir un texto que no esté en la lista. En la computadora también funcionan ↓ y Enter.

## Eliminar con advertencia y bloqueo de saldos negativos

Al tocar **Eliminar** en un registro, la app muestra antes, dentro del formulario, **qué saldos cambian** (por ejemplo, *Avanz Córdobas +C$ 1,000 · queda C$ 20,567.69* y *Efectivo en mano −C$ 1,000 · queda −C$ 790*) y pide confirmar. Si el registro es anterior a los saldos actuales, dice que no cambia ningún saldo.

Si eliminar un retiro, depósito o transferencia dejaría una cuenta, el efectivo en mano o el efectivo en dólares **en negativo** (porque ese dinero ya se gastó o se movió), la app **no deja eliminarlo** y explica cuál quedaría en negativo: primero hay que corregir o eliminar esos gastos o movimientos. Eliminar un gasto nunca se bloquea (sube el saldo).

El bloqueo se cambia en *Mi cuenta → Configuración → Bloquear eliminaciones que dejan saldos en negativo* (activo por defecto; lo cambian administradores y supervisores). Desactivado, la app solo avisa y ofrece *Eliminar de todos modos*. Se guarda en la columna `Bloquear_Negativos` de la hoja Empresa (vacío = activo) y aplica a todos los usuarios.

## Tarjetas de crédito

El módulo *Tarjetas* lleva cada **tarjeta de crédito** asociada a un banco. Cada tarjeta tiene **dos deudas**, una en **córdobas** y otra en **dólares**, y un **límite de crédito en dólares** que comparten las dos.

- **Las tarjetas:** se crearon solas a partir de las que usabas en Access (GasCard VISA, BAC American Express, LAFISE D'TODO, BAC Mariela), con su banco y su % de descuento. Con **Editar tarjeta** escribes los últimos 4 dígitos, el **límite (US$)**, el **día de corte**, el **día límite de pago**, la cuenta desde la que se paga y la **deuda actual en córdobas y en dólares** (con su fecha y hora). Las que ya no uses, desactívalas. Hojas `Tarjetas_Credito` y `Movimientos_Tarjeta`.
- **Movimientos** (*Registrar movimiento*), cada uno en **córdobas o en dólares**:
  - **Compra:** sube la deuda de esa moneda por el monto menos el descuento de la tarjeta (editable; negativo si es un recargo).
  - **Retiro de efectivo:** entra al efectivo en mano (o al efectivo en dólares) y la deuda sube por el retiro **más el cargo**.
  - **Cargo (intereses o comisión):** sube la deuda, como lo cobró el banco. No es gasto al momento: se cuenta al pagar la tarjeta.
  - **Reembolso o bonificación:** baja la deuda sin mover ninguna cuenta ni el efectivo (por ejemplo *Reembolso Rebate Local* o *Bonificación pago saldo local*).
  - **Al recibir el estado de cuenta**, agrega sus cargos (por ejemplo los *intereses corrientes* si no pagaste el contado a tiempo) y sus reembolsos y bonificaciones, para que la deuda de la app coincida con la del banco.
  - **Pago:** en *Registrar movimiento* eliges **Pago de la tarjeta**: propone lo que falta pagar de la deuda en córdobas (o la de dólares si es la única pendiente) y el concepto «Estado de cuenta al …»; al cambiar la moneda propone lo que falta de esa deuda, salvo que ya hayas escrito un monto. Eliges de qué cuenta sale; si es de otra moneda, pide el tipo de cambio.
- **Combustible:** el llenado tiene **Pagado con**, una lista compacta agrupada en *Tarjetas de crédito*, *Cuentas de banco* (en córdobas), *Efectivo* y *Otro*:
  - **Con tarjeta:** aparece **Descuento de la tarjeta (%)** (propone el de la tarjeta; puedes poner 4, 0, etc.). El costo menos ese descuento suma a la deuda en córdobas de la tarjeta; no es gasto ahora, se cuenta al pagar la tarjeta.
  - **Con una cuenta de banco o con efectivo en mano:** el costo sale de esa cuenta o del efectivo (la app avisa si no alcanza) y se registra como **gasto** en la cuenta **Combustible** del período de la fecha del llenado. Ese gasto queda ligado al llenado: se cambia o elimina desde Combustible.
  - **Otro medio:** no se registra en ninguna cuenta ni tarjeta.
  - El **Total pagado** se calcula solo con la cantidad y el precio por litro (en litros o galones); si escribes el total, se calcula el precio por litro.
- **Las compras no son gasto al hacerlas**: el gasto se registra al pagar la tarjeta.
- **Estado de cuenta** (tabla con columnas *Córdobas* y *Dólares*): deuda total, saldo al último corte, **por pagar antes de** la fecha límite (en rojo si faltan 5 días o menos o si venció), consumos y pagos desde el corte. Debajo, el **disponible del límite** en dólares (lo que debes en córdobas se convierte al T/C de compra).
- **Inicio:** en *Dinero disponible* aparece cada tarjeta con su deuda en C$ y US$ y cuánto pagar antes de qué fecha.
- **Historial de Access:** los consumos anteriores siguen en la misma pantalla (*Mostrar el historial de Access*).

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
- **Varios vehículos:** arriba de Combustible eliges el vehículo (por ejemplo *Camioneta* y *Sedán*). El registro de cada vehículo es independiente: los kilómetros recorridos se calculan con el llenado anterior **del mismo vehículo**, y los rendimientos, gráficos, promedios, aditivo y odómetro no se mezclan. Con *Agregar vehículo* creas uno nuevo (nombre, placa y detalle opcionales) y con *Editar vehículo* cambias su nombre o lo **desactivas** cuando ya no lo uses: su historial se conserva y no se puede eliminar mientras tenga llenados. Con más de un vehículo, el formulario del llenado muestra el campo *Vehículo* (por defecto, el que tienes en pantalla). Los llenados que ya existían quedan asignados al primer vehículo, *Camioneta*, y se pueden renombrar. Los vehículos también se ven en *Catálogos → Vehículos* (hoja `Vehiculos`; el vehículo de cada llenado está en la columna `ID_Vehiculo`).
- **Filtros:** arriba de la sección Combustible eliges el **año** (por defecto el actual; también *Todos los años* o un año anterior) y el **período**: *Todo el año*, *Últimos 6 meses* o *Un mes en específico*. Las cifras, los gráficos y la lista se calculan con lo filtrado. «Últimos 6 meses» cuenta los 6 meses que terminan en el mes en curso (en un año anterior, los últimos 6 de ese año).
- **Gráficos de kilómetros:** *Kilómetros recorridos* (por mes; por año si ves todos los años; por llenado si eliges un mes). La cifra *Km recorridos* suma los km de los llenados filtrados, y el odómetro actual aparece en la línea de resumen.
- **Aditivo y nota:** el formulario tiene el interruptor **Se agregó aditivo de combustible** (apagado por defecto) y una **Nota** opcional. Los llenados con aditivo llevan la etiqueta *Aditivo* en la lista y en el resultado, y arriba se muestra **cuándo fue el último aditivo** y hace cuántos días. Se guardan en las columnas `Aditivo` y `Nota` de Consumo_Combustible (se agregan solas).
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
