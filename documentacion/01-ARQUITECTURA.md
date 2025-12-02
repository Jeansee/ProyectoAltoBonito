# Documentación de Arquitectura - Quincho Alto Bonito

## 📋 Información del Proyecto

**Sistema de Gestión de Reservas para Quincho Alto Bonito**

**Equipo de Desarrollo:**
- Katherine Pereira
- Leonardo Hernández
- Jeanfranco Sánchez

**Fecha de Documentación:** Diciembre 2025

---

## 🏗️ Arquitectura General

### Patrón Arquitectónico
**Cliente-Servidor con API REST**

```
┌─────────────────┐         HTTP/REST         ┌──────────────────┐
│                 │◄──────────────────────────►│                  │
│   Frontend      │     JSON API Calls         │     Backend      │
│   React 19 +    │                            │   NestJS 10 +    │
│   Vite          │                            │   Prisma ORM     │
│                 │                            │                  │
└─────────────────┘                            └──────────────────┘
                                                        │
                                                        │
                                                        ▼
                                                ┌──────────────┐
                                                │  PostgreSQL  │
                                                │   Database   │
                                                └──────────────┘
```

---

## 🔧 Stack Tecnológico

### Backend
- **Framework:** NestJS 10+ (TypeScript)
- **ORM:** Prisma 5+
- **Base de Datos:** PostgreSQL 15+
- **Autenticación:** JWT + Passport.js
- **Encriptación:** bcrypt para contraseñas, AES-256-GCM para tokens OAuth
- **Validación:** class-validator + class-transformer
- **Pagos:** Transbank Webpay Plus SDK
- **Calendario:** Google Calendar API v3
- **Email:** Nodemailer con plantillas HTML

### Frontend
- **Framework:** React 19.0
- **Bundler:** Vite 6.0
- **Enrutamiento:** React Router DOM 7.0
- **UI/Estilos:** TailwindCSS 3.4
- **Animaciones:** Framer Motion 11.1
- **Iconos:** React Icons 5.2
- **HTTP Client:** Axios 1.7

### Testing
- **E2E/API:** Playwright 1.49
- **Cobertura:** 27 tests automatizados

### DevOps
- **Contenedores:** Docker + Docker Compose
- **Control de Versiones:** Git + GitHub

---

## 📁 Estructura del Proyecto

```
ProyectoAltoBonito/
├── backend/                    # Servidor NestJS
│   ├── src/
│   │   ├── common/            # Código compartido
│   │   │   ├── guards/        # Guards de autenticación/autorización
│   │   │   └── prisma/        # Módulo de Prisma
│   │   ├── modules/           # Módulos funcionales
│   │   │   ├── auth/          # Autenticación JWT
│   │   │   ├── account/       # Gestión de cuentas
│   │   │   ├── recursos/      # Recursos disponibles
│   │   │   ├── reservas/      # Sistema de reservas
│   │   │   ├── admin/         # Panel administrador
│   │   │   ├── tbk/           # Integración Transbank
│   │   │   ├── google/        # Google Calendar OAuth
│   │   │   └── mailer/        # Servicio de email
│   │   ├── app.module.ts      # Módulo raíz
│   │   └── main.ts            # Entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Esquema de base de datos
│   │   └── seed.ts            # Datos iniciales
│   └── Dockerfile
│
├── frontend/                   # Cliente React
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   │   ├── auth/          # Componentes de autenticación
│   │   │   ├── home/          # Homepage (carousel, chatbot, etc.)
│   │   │   ├── reserva/       # Componentes de reserva
│   │   │   └── google/        # Integración Google Calendar
│   │   ├── pages/             # Páginas de la aplicación
│   │   │   ├── home.tsx       # Página principal
│   │   │   ├── recursos/      # Catálogo de recursos
│   │   │   ├── admin/         # Dashboard administrativo
│   │   │   ├── usuario/       # Perfil de usuario
│   │   │   └── pago/          # Resultado de pagos
│   │   ├── context/           # React Context (Auth, Cart)
│   │   ├── services/          # Servicios API
│   │   ├── routes/            # Configuración de rutas
│   │   └── utils/             # Utilidades
│   └── Dockerfile
│
├── tests/                      # Tests automatizados E2E
│   ├── admin.*.spec.js        # Tests de administración
│   ├── auth.*.spec.js         # Tests de autenticación
│   ├── chatbot.*.spec.js      # Tests de chatbot
│   ├── recursos.*.spec.js     # Tests de recursos
│   ├── reservas.*.spec.js     # Tests de reservas
│   ├── pagos.*.spec.js        # Tests de pagos
│   └── README.md              # Documentación de tests
│
├── documentacion/              # Documentación del proyecto
├── docker-compose.yml          # Orquestación de contenedores
└── README.md                   # README principal
```

---

## 🔐 Seguridad

### Autenticación y Autorización
- **JWT Tokens:** 7 días de expiración
- **Almacenamiento:** localStorage en cliente (consideración: migrar a httpOnly cookies)
- **Guards:** JwtAuthGuard, AdminOnlyGuard
- **Roles:** CLIENTE, ADMIN

### Encriptación
- **Contraseñas:** bcrypt con salt rounds = 10
- **OAuth Tokens:** AES-256-GCM con IV aleatorio
- **Clave maestra:** Variable de entorno CRYPTO_SECRET_KEY

### Validación
- **Backend:** DTOs con class-validator
- **Frontend:** Validadores personalizados (email, teléfono, password)
- **Sanitización:** Prisma ORM previene SQL Injection

### Recomendaciones de Mejora
1. ⚠️ Implementar rate limiting (evitar fuerza bruta)
2. ⚠️ Migrar tokens a httpOnly cookies
3. ⚠️ Agregar Helmet.js para headers de seguridad
4. ⚠️ Implementar CSP (Content Security Policy)
5. ⚠️ Rotación de JWT secret keys

---

## 🔄 Flujo de Datos Principal

### Flujo de Reserva Completa

```
┌─────────┐
│ Usuario │
└────┬────┘
     │
     ▼
1. Browse Recursos (/recursos)
     │
     ▼
2. Selecciona Recurso + Fecha/Hora
     │
     ▼
3. Crea Reserva (POST /reservas)
     │
     ├──► Backend valida disponibilidad
     │    └──► Consulta Prisma: solapamientos
     │         └──► Verifica bloqueos admin
     │
     ▼
4. Crea Transacción Transbank (POST /tbk/tx)
     │
     ├──► Backend genera token PKCE
     │    └──► Reserva queda PENDIENTE
     │
     ▼
5. Redirección a Webpay
     │
     ▼
6. Usuario completa pago en Transbank
     │
     ▼
7. Callback (POST /tbk/return)
     │
     ├──► Backend confirma transacción
     │    └──► Actualiza estado: CONFIRMADA
     │         └──► Envia email confirmación
     │              └──► Crea evento Google Calendar (si conectado)
     │
     ▼
8. Redirección a /pago/ok?status=APPROVED
```

---

## 📊 Modelo de Datos Simplificado

### Entidades Principales

```prisma
model Usuario {
  id              String
  correo          String   @unique
  password        String
  nombre          String
  apellido        String
  telefono        String?
  rol             Rol      @default(CLIENTE)
  reservas        Reserva[]
  googleEmail     String?
  googleTokens    String?  // Encriptado AES-256-GCM
}

model Recurso {
  id              String
  nombre          String
  tipo            TipoRecurso
  descripcion     String
  capacidad       Int
  precioHoraCLP   Int
  precioDiaCLP    Int
  activo          Boolean
  horarios        Horario[]
  turnos          Turno[]
}

model Reserva {
  id              String
  usuarioId       String
  estado          EstadoReserva
  modalidad       Modalidad
  inicio          DateTime
  fin             DateTime
  montoTotalCLP   Int
  recursos        ReservaRecurso[]
  pagos           Pago[]
}

model Pago {
  id                      String
  reservaId               String
  montoCLP                Int
  metodoPago              String
  estado                  String
  tbkAuthorizationCode    String?
  tbkBuyOrder             String?
}

model Bloqueo {
  id              String
  recursoId       String
  motivo          String
  inicio          DateTime
  fin             DateTime
  createdBy       String
}
```

---

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login JWT
- `GET /api/auth/me` - Perfil usuario actual
- `PATCH /api/auth/me` - Actualizar perfil

### Recursos
- `GET /api/recursos` - Listar recursos (paginado)
- `GET /api/recursos/:id` - Detalle de recurso
- `GET /api/recursos/:id/slots` - Slots disponibles por hora
- `GET /api/recursos/:id/availability` - Disponibilidad por rango de fechas

### Reservas
- `POST /api/reservas` - Crear reserva
- `GET /api/reservas/mias?userId=X` - Mis reservas
- `GET /api/reservas/:id` - Detalle de reserva

### Pagos Transbank
- `POST /api/tbk/tx` - Crear transacción
- `POST /api/tbk/return` - Callback de Transbank
- `GET /api/tbk/return` - Callback alternativo GET

### Google Calendar
- `GET /api/auth/google/start-calendar` - Iniciar OAuth
- `GET /api/auth/google/callback` - Callback OAuth
- `GET /api/auth/google/status` - Estado de conexión
- `POST /api/auth/google/disconnect` - Desconectar cuenta

### Admin
- `GET /api/admin/metrics` - Métricas del sistema
- `GET /api/admin/recent-reservas` - Reservas recientes
- `GET /api/admin/bloqueos` - Listar bloqueos
- `POST /api/admin/bloqueos` - Crear bloqueo de fechas
- `DELETE /api/admin/bloqueos/:id` - Eliminar bloqueo
- `PATCH /api/admin/reservas/:id/cancel` - Cancelar reserva

---

## 🎨 Características Destacadas

### 1. Chatbot Interactivo
- Sistema de árbol de decisiones
- Persistencia en localStorage
- Navegación por eventos emit
- Acciones: scroll_to, go_to, open_url, copy

### 2. Sistema de Slots Dinámicos
- Cálculo en tiempo real de disponibilidad
- Considera horarios, turnos, bloqueos y reservas existentes
- Soporte para modalidades: POR_HORA, DIA_COMPLETO, BLOQUE

### 3. Integración Transbank
- Webpay Plus con PKCE
- Manejo de callbacks POST/GET
- Detección de cancelación usuario
- Estados de pago: PENDING, APPROVED, REJECTED

### 4. Google Calendar Sync
- OAuth 2.0 con refresh tokens
- Creación automática de eventos
- Sincronización bidireccional
- Encriptación de tokens

### 5. Panel Admin
- Dashboard con métricas en tiempo real
- Gestión de bloqueos de fechas
- Cancelación de reservas con validación
- Vista de reservas recientes

---

## 🚀 Despliegue

### Desarrollo
```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Producción (Docker)
```bash
docker-compose up -d
```

### Variables de Entorno Críticas
```env
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=...
CRYPTO_SECRET_KEY=...
TBK_COMMERCE_CODE=...
TBK_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MAILER_HOST=...
```

---

## 📈 Buenas Prácticas Implementadas

### Backend
✅ Separación por módulos (feature-based)
✅ DTOs para validación de entrada
✅ Guards para autenticación/autorización
✅ Manejo de errores centralizado
✅ Logging estructurado
✅ Migraciones de base de datos versionadas
✅ Seeds para datos iniciales

### Frontend
✅ Context API para estado global
✅ Componentes funcionales con hooks
✅ Código splitting con lazy loading
✅ Validación de formularios
✅ Manejo de errores con try-catch
✅ Feedback visual (loading, success, error)

### Testing
✅ Tests E2E con Playwright
✅ Cobertura de flujos críticos
✅ Utilidades reutilizables (_utils.js)
✅ Documentación de tests (README.md)

---

## 🔄 Mejoras Futuras Sugeridas

### Seguridad
1. Implementar rate limiting en endpoints críticos
2. Migrar JWT a httpOnly cookies
3. Agregar Helmet.js y CSP
4. Auditoría de dependencias (npm audit)

### Rendimiento
1. Implementar caché Redis
2. Optimizar queries Prisma con índices
3. Lazy loading de imágenes
4. Service Worker para PWA

### Funcionalidades
1. Notificaciones push
2. Sistema de reviews/calificaciones
3. Reportes en PDF
4. Multi-idioma (i18n)
5. Modo oscuro

### DevOps
1. CI/CD con GitHub Actions
2. Monitoreo con Sentry/LogRocket
3. Backups automatizados de BD
4. Métricas de performance (New Relic)

---

## 📞 Contacto y Soporte

Para consultas técnicas o contribuciones, contactar al equipo de desarrollo.

**Licencia:** Privado - Quincho Alto Bonito © 2025
