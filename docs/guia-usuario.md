# Guía de usuario — Club360

Manual práctico para el personal del club (recepción, administración y entrenadores). Los nombres de menú y pantallas coinciden con la aplicación web de gestión.

---

## 1. Antes de empezar

### Quién puede usar qué

| Rol | Acceso |
|-----|--------|
| **Administrador** | Gestión completa: socios, cobros, ventas, rutinas, configuración vía instalación. |
| **Staff** | Gestión operativa (socios asignados según reglas del club, cobros, ventas, entrenamiento, etc.). |
| **Socio (member)** | Solo el **portal del socio** (consulta de dieta y rutina en solo lectura), no el menú de gestión. |

### Entrar al sistema

1. Abrí la URL del club (en local: **http://localhost:5173**).
2. Si es la **primera vez** en el servidor, aparecerá el **asistente de instalación**: conectá la base de datos, elegí usuario y contraseña del administrador y completá el proceso. Al terminar, **reiniciá el servicio de la API** si te lo indica el asistente.
3. En instalaciones ya hechas, usá **Iniciar sesión** con tu usuario y contraseña.

### Menú lateral

Tras iniciar sesión verás el menú a la izquierda. Los bloques principales son:

- **Dashboard** — resumen del negocio.
- **Afiliación** — miembros, equipo, planes y cobros.
- **Venta y Stock** — punto de venta e inventario.
- **Ejercicios** — catálogo de actividades.
- **Rutinas de entrenamiento** — crear rutinas y asignarlas a socios.
- **Nutrición** — planes alimentarios por socio.
- **Control de acceso** — validar entrada en recepción y consultar historial.

Podés **ocultar el menú** con el botón junto al logo del club.

---

## 2. Dashboard

**Menú → Dashboard**

Ves indicadores del club: cantidad de socios y staff, ventas del punto de venta, deuda de membresías, y gráficos de ventas y accesos recientes.

Sirve para una vista rápida al abrir el día; el detalle de cada área está en su módulo.

---

## 3. Afiliación

### 3.1 Dar de alta a un socio (cliente)

**Menú → Afiliación → Miembros →** botón para **añadir** / ir a **nuevo socio**

1. Completá los datos obligatorios (nombre, contacto, documento según el formulario).
2. Elegí el **plan de membresía** si ya existe en el sistema.
3. Definí **usuario y contraseña** si el socio debe entrar al portal (opcional según cómo gestionéis el alta).
4. Guardá el formulario.

Tras guardar podés:

- Ver la **ficha** del socio (detalle).
- **Editar** datos desde la ficha o desde la lista.
- Abrir la **tabla física** (medidas corporales) si el club las usa.

**Consejo:** Antes de dar de altas masivas, creá los **planes de membresía** (apartado 3.2).

---

### 3.2 Crear un plan de membresía

**Menú → Afiliación → Lista de membresías →** crear nuevo plan

Indicá, entre otros:

- Nombre del plan (ej. «Plan básico», «Plan completo»).
- Importe y periodicidad (días del período).
- Cuota de inscripción si aplica.

Los planes aparecen luego al dar de alta socios y al **registrar cobros**.

---

### 3.3 Registrar un cobro de membresía

Hay dos formas habituales:

#### A) Cobro manual (alta de un pago nuevo)

**Menú → Afiliación → Cobro de membresías → Registrar cobro manual**

1. Elegí el **socio**.
2. Elegí la **membresía** (plan); el importe total puede rellenarse solo según el plan.
3. Indicá **importe cobrado** (puede ser parcial o total).
4. Definí **fecha desde** y **fecha hasta** de vigencia.
5. Confirmá el registro.

Volverás a la lista de cobros del mes.

#### B) Marcar como pagado un cobro pendiente

**Menú → Afiliación → Cobro de membresías**

La pantalla muestra los cobros del período (p. ej. vencimientos del mes). Para cada fila con saldo pendiente:

1. Revisá socio, plan e importe adeudado.
2. Usá la acción para **registrar el pago** / marcar como pagado (según el botón de la fila).

Podés **buscar** por nombre de socio o plan en el cuadro de búsqueda.

---

### 3.4 Alta de personal (staff / entrenador)

**Menú → Afiliación → Miembro del equipo →** nuevo

Completá datos del empleado, rol interno del club y credenciales de acceso. El personal con rol **staff** usa el mismo panel de gestión (con los permisos que tenga el sistema).

---

## 4. Venta y stock (punto de venta)

### 4.1 Cargar productos e inventario

**Menú → Venta y Stock → Control stock**

- **Nuevo producto:** nombre, SKU opcional, precio, stock inicial → **Añadir producto**.
- En **Inventario**, ajustá la cantidad y pulsá **Guardar** en cada fila.
- Podés **desactivar** o **eliminar** productos (si tienen ventas asociadas, el sistema puede desactivarlos en lugar de borrarlos).

### 4.2 Vender en mostrador

**Menú → Venta y Stock → Vender un producto**

1. Elegí productos y cantidades del catálogo.
2. Revisá el total del ticket.
3. Confirmá la venta (método de pago según pantalla).

El stock se descuenta automáticamente.

### 4.3 Consultar ventas

**Menú → Venta y Stock → Registro de ventas**

Filtrá por **fecha desde** y **fecha hasta** para ver el listado. Podés exportar según las opciones de la pantalla.

---

## 5. Ejercicios

Antes de armar rutinas, el catálogo de ejercicios debe existir.

### 5.1 Añadir un ejercicio

**Menú → Ejercicios → Añadir ejercicio** (o desde la lista)

- Título y descripción.
- **Categoría** (podés crear categorías nuevas).
- Nivel de dificultad (baja / media / alta).
- Vídeos de referencia (URLs), si los usáis.

### 5.2 Lista y detalle

**Menú → Ejercicios → Lista de ejercicios**

Consultá, editá o eliminá ejercicios. El detalle muestra la información y vínculos asociados.

---

## 6. Rutinas de entrenamiento

### 6.1 Crear una rutina

**Menú → Rutinas de entrenamiento → Crear entrenamiento (rutina)**

1. **Título** y descripción de la rutina.
2. Añadí **ejercicios** del catálogo (uno o varios).
3. Por cada ejercicio podés indicar:
   - **Peso** sugerido (kg).
   - **Días de la semana** en los que aplica (Lun–Dom).
4. El sistema puede mostrar una **dificultad** de la rutina según los ejercicios elegidos.
5. Guardá la rutina.

Para cambios posteriores: entrá a la rutina desde la lista y **editá**.

### 6.2 Asignar una rutina a un socio

**Menú → Rutinas de entrenamiento → Asignar entrenamiento**

1. Elegí la **rutina**.
2. Elegí el o los **socios** que la seguirán.
3. Elegí el o los **entrenadores** responsables (miembros del equipo).
4. Confirmá la asignación.

El socio verá su rutina en el **portal del socio** (sección rutina semanal), según la configuración del club.

---

## 7. Nutrición

**Menú → Nutrición → Planes por socio**

1. En el listado, elegí un socio o creá un plan nuevo.
2. Definí el **horario de comidas** (franjas horarias y alimentos).
3. Guardá el plan.

El socio puede consultar su **dieta semanal** en el portal.

---

## 8. Control de acceso

### 8.1 Validar entrada (recepción)

**Menú → Control de acceso → Validar entrada**

Se abre en **otra pestaña**, sin menú lateral, pensada para un PC en recepción.

1. Escribí el **identificador del socio**: ID numérico, código de socio o DNI.
2. Pulsá **Validar y registrar**.

Verás si el acceso es **válido** o no (membresía vencida, socio inexistente, etc.). El intento queda guardado en el registro.

### 8.2 Historial de accesos

**Menú → Control de acceso → Registro de accesos**

Filtrá por **fecha desde** y **fecha hasta** para revisar entradas permitidas y denegadas, con datos del socio y del personal que registró el intento.

---

## 9. Portal del socio

Los socios con usuario **member** entran por la misma URL de login y acceden a **Nutrición y ejercicio** (portal), no al menú de gestión.

Desde ahí pueden **consultar** (solo lectura, sin guardar ni editar):

- **Dieta** — plan nutricional asignado por el club.
- **Rutina** — entrenamiento de la semana según la asignación del personal.

Los cambios los realiza el **staff** o el **administrador** desde Gestión → Nutrición y Rutinas de entrenamiento. El portal del socio no expone acciones de escritura.

El personal de gestión no usa este portal para operar el club; es solo para el cliente final.

---

## 10. Usuarios de prueba (instalación demo)

Si el club se instaló con datos de demostración, suelen existir:

| Usuario | Contraseña (demo) | Rol |
|---------|-------------------|-----|
| `admin` | La que definiste en el **asistente** | Administrador |
| `staff` | `staff` (cambiar en producción) | Staff |
| `ana_member` | `member123` | Socio |
| `luis_member` | `member123` | Socio |

En producción, **cambiá todas las contraseñas** y no dejéis estas credenciales activas.

---

## 11. Flujo recomendado para un socio nuevo

Orden sugerido la primera vez que incorporás a alguien al club:

1. Crear o verificar el **plan de membresía**.
2. **Dar de alta al socio** en Miembros.
3. **Registrar el cobro** (manual o marcar pago) con fechas de vigencia.
4. (Opcional) **Asignar rutina** y **plan de nutrición**.
5. En recepción, usar **Validar entrada** con su DNI o código.

---

## 12. Problemas frecuentes

| Situación | Qué hacer |
|-----------|-----------|
| No carga la app / error de API | Comprobá que el **backend** esté en marcha y que la URL del front apunte bien al API. |
| Tras instalar, no puedo iniciar sesión | Reiniciá el proceso del backend; verificá usuario/contraseña del wizard. |
| El socio no puede entrar al portal | Revisá que tenga `role` socio, usuario activo y contraseña; que tenga rutina o dieta si esperáis ver contenido. |
| Acceso denegado en recepción | Revisá vigencia de membresía y estado del socio en su ficha / cobros. |
| No hay ejercicios al crear rutina | Creá ejercicios antes en **Ejercicios → Añadir ejercicio**. |

---

## 13. Más información técnica

- [Documentación del proyecto](./README.md) — índice de guías.
- [Despliegue en servidor](./despliegue.md).
- [Desarrollo local](./desarrollo.md) — `npm run api` y `npm run web` desde la raíz del repo.

---

*Club360 — Guía de usuario. Actualizada según el menú y módulos del MVP de gestión.*
