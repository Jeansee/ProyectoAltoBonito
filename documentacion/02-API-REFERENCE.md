# API Reference - Quincho Alto Bonito

## 📋 Tabla de Contenidos
1. [Autenticación](#autenticación)
2. [Recursos](#recursos)
3. [Reservas](#reservas)
4. [Pagos Transbank](#pagos-transbank)
5. [Google Calendar](#google-calendar)
6. [Administración](#administración)
7. [Cuenta de Usuario](#cuenta-de-usuario)
8. [Estructuras de Datos](#estructuras-de-datos)

**Base URL:** `http://localhost:3000/api` (desarrollo)

**Headers Requeridos:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>" // Requerido en endpoints protegidos
}
```

---

## 🔐 Autenticación

### POST /auth/register
Registro de nuevo usuario en el sistema.

**Acceso:** Público

**Request Body:**
```json
{
  "correo": "usuario@example.com",
  "password": "Password123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "+56912345678"
}
```

**Validaciones:**
- `correo`: Email válido, único en el sistema
- `password`: Mínimo 8 caracteres, 1 mayúscula, 1 número
- `telefono`: Formato +56912345678
- `nombre/apellido`: Mínimo 2 caracteres

**Response (201):**
```json
{
  "id": "uuid",
  "correo": "usuario@example.com",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "+56912345678",
  "rol": "CLIENTE",
  "activo": true,
  "createdAt": "2025-12-20T10:30:00.000Z"
}
```

**Errores:**
- `400`: Validación fallida (correo duplicado, password débil)
- `500`: Error interno

---

### POST /auth/login
Autenticación de usuario existente.

**Acceso:** Público

**Request Body:**
```json
{
  "correo": "usuario@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "correo": "usuario@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "CLIENTE",
    "googleEmail": null
  }
}
```

**JWT Payload:**
```json
{
  "sub": "uuid",
  "correo": "usuario@example.com",
  "rol": "CLIENTE",
  "iat": 1703080200,
  "exp": 1703685000 // Expira en 7 días
}
```

**Errores:**
- `401`: Credenciales inválidas
- `403`: Usuario inactivo

---

### GET /auth/me
Obtener perfil del usuario autenticado.

**Acceso:** Protegido (JWT)

**Response (200):**
```json
{
  "id": "uuid",
  "correo": "usuario@example.com",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "+56912345678",
  "rol": "CLIENTE",
  "activo": true,
  "googleEmail": "juan@gmail.com",
  "googleAvatarUrl": "https://...",
  "ultimoAcceso": "2025-12-20T10:30:00.000Z",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### PATCH /auth/profile
Actualizar perfil del usuario autenticado.

**Acceso:** Protegido (JWT)

**Request Body (todos los campos opcionales):**
```json
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez González",
  "telefono": "+56987654321"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "correo": "usuario@example.com",
  "nombre": "Juan Carlos",
  "apellido": "Pérez González",
  "telefono": "+56987654321",
  "rol": "CLIENTE"
}
```

---

### POST /auth/change-password
Cambiar contraseña del usuario autenticado.

**Acceso:** Protegido (JWT)

**Request Body:**
```json
{
  "currentPassword": "Password123",
  "newPassword": "NewPassword456"
}
```

**Response (200):**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

**Errores:**
- `401`: Contraseña actual incorrecta
- `400`: Nueva contraseña no cumple requisitos

---

## 🏢 Recursos

### GET /recursos
Listar recursos disponibles con paginación.

**Acceso:** Público

**Query Parameters:**
- `page` (default: 1): Número de página
- `limit` (default: 10): Elementos por página
- `tipo`: Filtro por tipo (`QUINCHO`, `PISCINA`, `CANCHA`)
- `search`: Búsqueda por nombre
- `activo`: Filtro por estado (`true`/`false`)

**Ejemplo Request:**
```
GET /recursos?page=1&limit=5&tipo=QUINCHO&activo=true
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "nombre": "Quincho Principal",
      "tipo": "QUINCHO",
      "descripcion": "Quincho amplio con parrilla y mesón",
      "capacidad": 50,
      "precioHoraCLP": 15000,
      "precioDiaCLP": 120000,
      "activo": true,
      "horarios": [
        {
          "id": "uuid",
          "diaSemana": 6,
          "abreMin": 480,
          "cierraMin": 1320
        }
      ],
      "turnos": []
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 5,
  "pages": 3
}
```

---

### GET /recursos/:id
Obtener detalle completo de un recurso.

**Acceso:** Público

**Response (200):**
```json
{
  "id": "uuid",
  "nombre": "Quincho Principal",
  "tipo": "QUINCHO",
  "descripcion": "Quincho amplio con parrilla y mesón",
  "capacidad": 50,
  "ubicacion": "Sector Norte",
  "precioHoraCLP": 15000,
  "precioDiaCLP": 120000,
  "precioBaseCLP": 10000,
  "tiempoMinimo": 60,
  "tiempoMaximo": 480,
  "diasAnticipacion": 30,
  "activo": true,
  "horarios": [...],
  "turnos": [...],
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Errores:**
- `404`: Recurso no encontrado

---

### GET /recursos/:id/slots
Obtener slots disponibles por hora para un recurso en una fecha específica.

**Acceso:** Público

**Query Parameters:**
- `fecha` (requerido): Formato `YYYY-MM-DD`

**Ejemplo Request:**
```
GET /recursos/uuid-123/slots?fecha=2025-12-25
```

**Response (200):**
```json
{
  "fecha": "2025-12-25",
  "slots": [
    {
      "inicio": "2025-12-25T08:00:00.000Z",
      "fin": "2025-12-25T09:00:00.000Z",
      "disponible": true,
      "precio": 15000,
      "duracionMin": 60
    },
    {
      "inicio": "2025-12-25T09:00:00.000Z",
      "fin": "2025-12-25T10:00:00.000Z",
      "disponible": false,
      "motivo": "Reservado",
      "duracionMin": 60
    }
  ]
}
```

**Errores:**
- `400`: Fecha inválida o fuera de rango
- `404`: Recurso no encontrado

---

### GET /recursos/:id/availability
Obtener disponibilidad de un recurso en un rango de fechas.

**Acceso:** Público

**Query Parameters:**
- `inicio` (requerido): Formato `YYYY-MM-DD`
- `fin` (requerido): Formato `YYYY-MM-DD`

**Ejemplo Request:**
```
GET /recursos/uuid-123/availability?inicio=2025-12-20&fin=2025-12-31
```

**Response (200):**
```json
{
  "recursoId": "uuid-123",
  "inicio": "2025-12-20",
  "fin": "2025-12-31",
  "disponibilidad": [
    {
      "fecha": "2025-12-20",
      "disponible": true,
      "motivo": null
    },
    {
      "fecha": "2025-12-21",
      "disponible": false,
      "motivo": "Mantenimiento programado"
    }
  ]
}
```

---

## 📅 Reservas

### POST /reservas
Crear una nueva reserva (sin pago).

**Acceso:** Protegido (JWT)

**Request Body:**
```json
{
  "recursos": [
    {
      "recursoId": "uuid-recurso-1",
      "precioFinalCLP": 15000
    }
  ],
  "modalidad": "POR_HORA",
  "inicio": "2025-12-25T10:00:00.000Z",
  "fin": "2025-12-25T14:00:00.000Z",
  "montoTotalCLP": 60000,
  "notas": "Evento familiar"
}
```

**Validaciones:**
- `recursos`: Array con al menos 1 recurso
- `modalidad`: `POR_HORA`, `DIA_COMPLETO`, `BLOQUE`
- `inicio/fin`: Dentro de horarios permitidos
- `montoTotalCLP`: Coincide con suma de recursos
- Valida solapamientos y bloqueos

**Response (201):**
```json
{
  "id": "uuid-reserva",
  "usuarioId": "uuid-usuario",
  "modalidad": "POR_HORA",
  "estado": "PENDIENTE",
  "inicio": "2025-12-25T10:00:00.000Z",
  "fin": "2025-12-25T14:00:00.000Z",
  "montoTotalCLP": 60000,
  "montoAbonoCLP": 0,
  "recursos": [
    {
      "id": "uuid-reserva-recurso",
      "recursoId": "uuid-recurso-1",
      "precioBaseCLP": 15000,
      "precioFinalCLP": 15000,
      "recurso": {
        "nombre": "Quincho Principal",
        "tipo": "QUINCHO"
      }
    }
  ],
  "pagos": [],
  "createdAt": "2025-12-20T10:30:00.000Z"
}
```

**Errores:**
- `400`: Validación fallida (solapamiento, horario inválido)
- `404`: Recurso no encontrado
- `409`: Conflicto con reserva existente

---

### GET /reservas/mias
Obtener reservas del usuario autenticado.

**Acceso:** Protegido (JWT)

**Query Parameters:**
- `userId` (requerido): UUID del usuario (debe coincidir con JWT)

**Ejemplo Request:**
```
GET /reservas/mias?userId=uuid-usuario
```

**Response (200):**
```json
[
  {
    "id": "uuid-reserva",
    "estado": "CONFIRMADA",
    "modalidad": "POR_HORA",
    "inicio": "2025-12-25T10:00:00.000Z",
    "fin": "2025-12-25T14:00:00.000Z",
    "montoTotalCLP": 60000,
    "montoAbonoCLP": 60000,
    "recursos": [
      {
        "recurso": {
          "nombre": "Quincho Principal",
          "tipo": "QUINCHO"
        }
      }
    ],
    "pagos": [
      {
        "id": "uuid-pago",
        "montoCLP": 60000,
        "estado": "APPROVED",
        "metodoPago": "TRANSBANK",
        "tbkAuthorizationCode": "123456",
        "createdAt": "2025-12-20T10:35:00.000Z"
      }
    ],
    "createdAt": "2025-12-20T10:30:00.000Z"
  }
]
```

**Errores:**
- `400`: userId no proporcionado
- `403`: userId no coincide con usuario autenticado

---

### GET /reservas/:id
Obtener detalle completo de una reserva.

**Acceso:** Protegido (JWT - solo propietario o admin)

**Response (200):**
```json
{
  "id": "uuid-reserva",
  "usuarioId": "uuid-usuario",
  "modalidad": "POR_HORA",
  "estado": "CONFIRMADA",
  "inicio": "2025-12-25T10:00:00.000Z",
  "fin": "2025-12-25T14:00:00.000Z",
  "montoTotalCLP": 60000,
  "montoAbonoCLP": 60000,
  "descuentoCLP": 0,
  "notas": "Evento familiar",
  "gcalEventId": "abc123xyz",
  "usuario": {
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo": "usuario@example.com",
    "telefono": "+56912345678"
  },
  "recursos": [...],
  "pagos": [...],
  "createdAt": "2025-12-20T10:30:00.000Z",
  "updatedAt": "2025-12-20T10:35:00.000Z"
}
```

**Errores:**
- `404`: Reserva no encontrada
- `403`: Sin permisos para ver esta reserva

---

## 💳 Pagos Transbank

### POST /tbk/tx
Crear transacción de pago con Transbank Webpay Plus.

**Acceso:** Protegido (JWT)

**Request Body:**
```json
{
  "reservaId": "uuid-reserva",
  "montoCLP": 60000,
  "returnUrl": "http://localhost:5173/pago/return"
}
```

**Response (201):**
```json
{
  "token": "e9d555262db0f989e49d724b4db0b0af367cc415cde41f500a776550fc5fddd4",
  "url": "https://webpay3gint.transbank.cl/webpayserver/initTransaction"
}
```

**Frontend debe redirigir a:**
```javascript
const form = document.createElement('form');
form.method = 'POST';
form.action = response.url;

const input = document.createElement('input');
input.type = 'hidden';
input.name = 'token_ws';
input.value = response.token;
form.appendChild(input);

document.body.appendChild(form);
form.submit();
```

**Errores:**
- `404`: Reserva no encontrada
- `400`: Reserva ya pagada o cancelada
- `500`: Error al crear transacción en Transbank

---

### POST /tbk/return (Callback Transbank)
Endpoint de retorno después de pagar en Transbank.

**Acceso:** Público (llamado por Transbank)

**Request Body (enviado por Transbank):**
```
token_ws=e9d555262db0f989e49d724b4db0b0af367cc415cde41f500a776550fc5fddd4
```

**Flujo Backend:**
1. Recibe `token_ws` de Transbank
2. Confirma transacción con `WebpayPlus.Transaction.commit(token_ws)`
3. Actualiza estado de Pago a `APPROVED` o `REJECTED`
4. Si aprobado:
   - Cambia Reserva a `CONFIRMADA`
   - Envía email de confirmación
   - Crea evento en Google Calendar (si conectado)
5. Redirecciona a frontend con query params

**Redirección (303):**
```
http://localhost:5173/pago/ok?status=APPROVED&buyOrder=abc123&authCode=123456&amount=60000
```

**Query Parameters de Redirección:**
- `status`: `APPROVED`, `REJECTED`, `CANCELED`
- `buyOrder`: Orden de compra
- `authCode`: Código autorización (solo si aprobado)
- `amount`: Monto pagado en CLP

---

### GET /tbk/return (Callback alternativo)
Endpoint GET para manejar cancelación de usuario en Webpay.

**Acceso:** Público

**Query Parameters:**
```
TBK_TOKEN=token_ws
TBK_ORDEN_COMPRA=abc123
TBK_ID_SESION=session123
```

**Response (303):**
```
Redirect → http://localhost:5173/pago/ok?status=CANCELED
```

---

## 🗓️ Google Calendar

### GET /auth/google/start-calendar
Iniciar flujo OAuth 2.0 para conectar Google Calendar.

**Acceso:** Protegido (JWT)

**Response (302):**
```
Redirect → https://accounts.google.com/o/oauth2/v2/auth?
  client_id=...
  &redirect_uri=http://localhost:3000/api/auth/google/callback
  &response_type=code
  &scope=openid email profile https://www.googleapis.com/auth/calendar
  &access_type=offline
  &prompt=consent
  &state=uuid-usuario
```

**Frontend debe abrir en nueva ventana o iframe.**

---

### GET /auth/google/callback
Callback OAuth 2.0 de Google.

**Acceso:** Público (llamado por Google)

**Query Parameters (enviados por Google):**
- `code`: Código de autorización temporal
- `state`: UUID del usuario (validación CSRF)

**Flujo Backend:**
1. Intercambia `code` por `access_token` y `refresh_token`
2. Obtiene info del usuario de Google (`sub`, `email`, `picture`)
3. Encripta `refresh_token` con AES-256-GCM
4. Guarda en base de datos:
   - `googleSub`, `googleEmail`, `googleAvatarUrl`
   - `googleRefreshCipher`, `googleAccessToken`, `googleAccessExpAt`
5. Redirecciona a frontend

**Response (302):**
```
Redirect → http://localhost:5173/usuario?google=success
```

---

### GET /auth/google/status
Verificar estado de conexión con Google Calendar.

**Acceso:** Protegido (JWT)

**Response (200):**
```json
{
  "connected": true,
  "email": "juan@gmail.com",
  "avatarUrl": "https://lh3.googleusercontent.com/a/...",
  "accessTokenValid": true,
  "expiresAt": "2025-12-20T11:30:00.000Z"
}
```

**Si no conectado:**
```json
{
  "connected": false
}
```

---

### POST /auth/google/disconnect
Desconectar Google Calendar del usuario.

**Acceso:** Protegido (JWT)

**Response (200):**
```json
{
  "message": "Google Calendar desconectado exitosamente"
}
```

**Backend limpia campos:**
- `googleSub`, `googleEmail`, `googleAvatarUrl`
- `googleRefreshCipher`, `googleAccessToken`, `googleAccessExpAt`

---

## 🔧 Administración

### GET /admin/metrics
Obtener métricas del sistema.

**Acceso:** Admin Only (JWT + rol ADMIN)

**Response (200):**
```json
{
  "totalReservas": 150,
  "reservasActivas": 45,
  "reservasCanceladas": 12,
  "totalUsuarios": 80,
  "usuariosActivos": 75,
  "ingresosTotalesCLP": 12500000,
  "ingresosEsteMesCLP": 1800000,
  "recursoMasReservado": {
    "nombre": "Quincho Principal",
    "reservas": 60
  }
}
```

---

### GET /admin/recent-reservas
Obtener reservas recientes (últimas 50).

**Acceso:** Admin Only

**Response (200):**
```json
[
  {
    "id": "uuid-reserva",
    "usuario": {
      "nombre": "Juan",
      "apellido": "Pérez",
      "correo": "usuario@example.com"
    },
    "estado": "CONFIRMADA",
    "inicio": "2025-12-25T10:00:00.000Z",
    "fin": "2025-12-25T14:00:00.000Z",
    "montoTotalCLP": 60000,
    "recursos": [...],
    "createdAt": "2025-12-20T10:30:00.000Z"
  }
]
```

---

### GET /admin/bloqueos
Listar todos los bloqueos de fechas.

**Acceso:** Admin Only

**Response (200):**
```json
[
  {
    "id": "uuid-bloqueo",
    "recursoId": "uuid-recurso",
    "recurso": {
      "nombre": "Quincho Principal",
      "tipo": "QUINCHO"
    },
    "motivo": "Mantenimiento programado",
    "inicio": "2025-12-20T00:00:00.000Z",
    "fin": "2025-12-22T23:59:59.000Z",
    "createdBy": "uuid-admin",
    "createdAt": "2025-12-15T10:00:00.000Z"
  }
]
```

---

### POST /admin/bloqueos
Crear un nuevo bloqueo de fechas.

**Acceso:** Admin Only

**Request Body:**
```json
{
  "recursoId": "uuid-recurso",
  "motivo": "Mantenimiento anual",
  "inicio": "2025-12-20",
  "fin": "2025-12-22"
}
```

**⚠️ IMPORTANTE:** Fechas en formato `YYYY-MM-DD` (no ISO string con hora).

**Response (201):**
```json
{
  "id": "uuid-bloqueo",
  "recursoId": "uuid-recurso",
  "motivo": "Mantenimiento anual",
  "inicio": "2025-12-20T00:00:00.000Z",
  "fin": "2025-12-22T23:59:59.000Z",
  "createdBy": "uuid-admin",
  "createdAt": "2025-12-20T10:30:00.000Z"
}
```

**Errores:**
- `400`: Validación fallida (fechas inválidas, fin antes de inicio)
- `404`: Recurso no encontrado

---

### DELETE /admin/bloqueos/:id
Eliminar un bloqueo existente.

**Acceso:** Admin Only

**Response (200):**
```json
{
  "message": "Bloqueo eliminado exitosamente"
}
```

**Errores:**
- `404`: Bloqueo no encontrado

---

### PATCH /admin/reservas/:id/cancel
Cancelar una reserva desde panel admin.

**Acceso:** Admin Only

**Response (200):**
```json
{
  "id": "uuid-reserva",
  "estado": "CANCELADA",
  "updatedAt": "2025-12-20T10:30:00.000Z"
}
```

**Validaciones:**
- Solo puede cancelar reservas en estado `PENDIENTE` o `CONFIRMADA`
- No se puede cancelar reservas ya `CANCELADA` o `PAGADA`

**Errores:**
- `404`: Reserva no encontrada
- `400`: Reserva no puede ser cancelada (estado inválido)

---

## 👤 Cuenta de Usuario

### GET /account/me
Obtener información completa del usuario autenticado.

**Acceso:** Protegido (JWT)

**Response:** Igual que `/auth/me`

---

### PATCH /account/profile
Actualizar perfil del usuario.

**Acceso:** Protegido (JWT)

**Response:** Igual que `/auth/profile`

---

### POST /account/change-password
Cambiar contraseña.

**Acceso:** Protegido (JWT)

**Response:** Igual que `/auth/change-password`

---

## 📊 Estructuras de Datos

### Usuario
```typescript
interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: 'CLIENTE' | 'ADMIN';
  activo: boolean;
  ultimoAcceso?: Date;
  whatsapp?: string;
  googleSub?: string;
  googleEmail?: string;
  googleAvatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Recurso
```typescript
interface Recurso {
  id: string;
  nombre: string;
  tipo: 'QUINCHO' | 'PISCINA' | 'CANCHA';
  descripcion?: string;
  activo: boolean;
  capacidad: number;
  ubicacion?: string;
  precioHoraCLP: number;
  precioDiaCLP: number;
  precioBaseCLP: number;
  tiempoMinimo: number;
  tiempoMaximo: number;
  diasAnticipacion: number;
  horarios: Horario[];
  turnos: Turno[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Reserva
```typescript
interface Reserva {
  id: string;
  usuarioId: string;
  modalidad: 'POR_HORA' | 'DIA_COMPLETO' | 'BLOQUE';
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'PAGADA' | 'CANCELADA';
  inicio: Date;
  fin: Date;
  montoTotalCLP: number;
  montoAbonoCLP: number;
  descuentoCLP: number;
  notas?: string;
  gcalEventId?: string;
  recursos: ReservaRecurso[];
  pagos: Pago[];
  usuario?: Usuario;
  createdAt: Date;
  updatedAt: Date;
}
```

### Pago
```typescript
interface Pago {
  id: string;
  reservaId: string;
  estado: 'INITIATED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'CANCELED' | 'CHARGED_BACK';
  montoCLP: number;
  metodoPago: 'TRANSBANK';
  tbkToken?: string;
  tbkBuyOrder?: string;
  tbkSessionId?: string;
  tbkStatus?: string;
  tbkAuthorizationCode?: string;
  comprobante?: string;
  procesadoPor?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Bloqueo
```typescript
interface Bloqueo {
  id: string;
  recursoId: string;
  motivo: string;
  inicio: Date;
  fin: Date;
  createdBy: string;
  recurso?: Recurso;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔄 Respuestas Paginadas

Endpoints que retornan listas usan esta estructura:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
```

**Ejemplo:**
```json
{
  "items": [...],
  "total": 50,
  "page": 2,
  "limit": 10,
  "pages": 5
}
```

---

## ⚠️ Códigos de Error HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `204 No Content`: Operación exitosa sin contenido
- `400 Bad Request`: Validación fallida o parámetros inválidos
- `401 Unauthorized`: Token JWT inválido o expirado
- `403 Forbidden`: Sin permisos para esta operación
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto con estado actual (ej: solapamiento)
- `500 Internal Server Error`: Error interno del servidor

---

## 📝 Notas Adicionales

### Timezone
- Todas las fechas se almacenan en UTC
- Frontend debe convertir a timezone local del usuario
- Backend espera fechas en formato ISO 8601

### Rate Limiting
⚠️ **No implementado actualmente** - Se recomienda agregar en producción.

### CORS
Backend permite requests desde:
- `http://localhost:5173` (desarrollo frontend)
- Configurar dominios de producción en variables de entorno

### Logs
Backend registra:
- Errores críticos en `console.error`
- Operaciones importantes (pagos, reservas) en logs estructurados
- Se recomienda implementar Winston o Pino para producción

---

**Documentación generada:** Diciembre 2025  
**Versión API:** 1.0  
**Equipo:** Katherine Pereira, Leonardo Hernández, Jeanfranco Sánchez
