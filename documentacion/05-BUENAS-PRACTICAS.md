# Buenas Prácticas y Recomendaciones - Quincho Alto Bonito

## 📋 Tabla de Contenidos
1. [Seguridad](#seguridad)
2. [Arquitectura y Código](#arquitectura-y-código)
3. [Base de Datos](#base-de-datos)
4. [API Design](#api-design)
5. [Frontend](#frontend)
6. [Testing](#testing)
7. [DevOps y Deployment](#devops-y-deployment)
8. [Performance](#performance)

---

## 🔐 Seguridad

### Implementadas ✅

#### 1. Encriptación de Contraseñas
```typescript
// backend/src/modules/auth/auth.service.ts
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async validatePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
```

**✅ Buena práctica:** Uso de bcrypt con salt rounds = 10.

---

#### 2. JWT Autenticación
```typescript
// backend/src/modules/auth/auth.service.ts
const payload = {
  sub: user.id,
  correo: user.correo,
  rol: user.rol,
};

return {
  access_token: this.jwtService.sign(payload, {
    expiresIn: '7d', // 7 días de expiración
  }),
  user: { ...user, password: undefined },
};
```

**✅ Buena práctica:** Token con expiración definida.  
**⚠️ Recomendación:** Reducir a 1-2 días y agregar refresh tokens.

---

#### 3. Guards de Autorización
```typescript
// backend/src/common/guards/admin-only.guard.ts
@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user?.rol === 'ADMIN';
  }
}
```

**✅ Buena práctica:** Separación clara de roles (CLIENTE vs ADMIN).

---

#### 4. Validación de DTOs
```typescript
// backend/src/modules/auth/dto/register.dto.ts
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password debe tener al menos 1 mayúscula y 1 número',
  })
  password: string;

  @IsString()
  @MinLength(2)
  nombre: string;

  @Matches(/^\+569\d{8}$/, {
    message: 'Teléfono debe tener formato +56912345678',
  })
  telefono: string;
}
```

**✅ Buena práctica:** Validación automática con decoradores `class-validator`.

---

#### 5. Encriptación de Tokens OAuth
```typescript
// backend/src/modules/google/crypto.util.ts
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.CRYPTO_SECRET_KEY; // 32 bytes

export function encryptToken(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}
```

**✅ Buena práctica:** AES-256-GCM con IV aleatorio.

---

### Recomendaciones de Mejora 🔴

#### 1. Rate Limiting

**Problema actual:**
No hay protección contra ataques de fuerza bruta en login.

**Solución recomendada:**
```typescript
// backend/src/main.ts
import * as rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Demasiadas peticiones, intenta más tarde',
});

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos de login cada 15 min
}));

app.use('/api/', limiter);
```

---

#### 2. Migrar Tokens a httpOnly Cookies

**Problema actual:**
JWT almacenado en `localStorage` es vulnerable a XSS.

**Solución recomendada:**
```typescript
// Backend
@Post('login')
async login(@Res() res: Response, @Body() dto: LoginDto) {
  const { access_token, user } = await this.authService.login(dto);
  
  res.cookie('token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });
  
  return res.json({ user });
}
```

```typescript
// Frontend - Axios interceptor ya no necesita leer localStorage
api.interceptors.request.use((config) => {
  // Cookie se envía automáticamente
  return config;
});
```

---

#### 3. Helmet.js para Headers de Seguridad

**Instalación:**
```bash
npm install helmet
```

**Implementación:**
```typescript
// backend/src/main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

---

#### 4. Sanitización de Inputs

**Problema:**
Aunque Prisma previene SQL injection, inputs pueden contener HTML/scripts.

**Solución:**
```typescript
// Backend
import * as sanitizeHtml from 'sanitize-html';

@Post('reservas')
async create(@Body() dto: CreateReservaDto) {
  // Sanitizar campos de texto libre
  dto.notas = sanitizeHtml(dto.notas || '', {
    allowedTags: [],
    allowedAttributes: {},
  });
  
  return this.reservasService.create(dto);
}
```

---

#### 5. CORS Estricto

**Configuración actual:**
```typescript
// backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:5173', // Solo desarrollo
  credentials: true,
});
```

**Mejora para producción:**
```typescript
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://altobonito.cl',
      'https://www.altobonito.cl',
      'http://localhost:5173', // Solo en dev
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});
```

---

## 🏗️ Arquitectura y Código

### Backend - NestJS

#### 1. Estructura Modular ✅

```
backend/src/
├── common/              # Código compartido
│   ├── guards/         # Guards reutilizables
│   └── prisma/         # Módulo Prisma
├── modules/            # Módulos funcionales
│   ├── auth/
│   ├── reservas/
│   ├── recursos/
│   └── admin/
└── main.ts             # Bootstrap
```

**✅ Buena práctica:** Organización por features (feature-based).

---

#### 2. Dependency Injection ✅

```typescript
@Controller('reservas')
export class ReservasController {
  constructor(
    private readonly reservasService: ReservasService,
    private readonly recursosService: RecursosService,
  ) {}
}
```

**✅ Buena práctica:** DI facilita testing y desacoplamiento.

---

#### 3. DTOs para Validación ✅

```typescript
export class CreateReservaDto {
  @IsArray()
  @ArrayMinSize(1)
  recursos: ReservaRecursoDto[];

  @IsEnum(ModalidadReserva)
  modalidad: ModalidadReserva;

  @IsDateString()
  inicio: string;

  @IsDateString()
  fin: string;

  @IsInt()
  @Min(1000)
  montoTotalCLP: number;
}
```

**✅ Buena práctica:** Validación automática + documentación implícita.

---

#### 4. Separación de Responsabilidades

**Controller:**
```typescript
@Post()
async create(@Body() dto: CreateReservaDto, @Req() req) {
  return this.reservasService.create(dto, req.user.id);
}
```

**Service:**
```typescript
async create(dto: CreateReservaDto, usuarioId: string) {
  // Validar disponibilidad
  await this.validateAvailability(dto);
  
  // Crear reserva
  const reserva = await this.prisma.reserva.create({...});
  
  // Enviar email
  await this.mailerService.sendConfirmation(reserva);
  
  return reserva;
}
```

**✅ Buena práctica:** Controller solo maneja HTTP, Service tiene lógica de negocio.

---

### Frontend - React

#### 1. Componentes Funcionales ✅

```tsx
export default function MisReservas() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = async () => {
    try {
      const res = await reservasService.getMias(user.id);
      setReservas(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;
  
  return <ReservasList reservas={reservas} />;
}
```

**✅ Buena práctica:** Hooks para estado, código limpio y testeable.

---

#### 2. Context API para Estado Global ✅

```tsx
// context/authcontext.tsx
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const login = async (correo: string, password: string) => {
    const res = await authService.login(correo, password);
    setToken(res.data.access_token);
    setUser(res.data.user);
    localStorage.setItem('token', res.data.access_token);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, ... }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**✅ Buena práctica:** Estado compartido sin necesidad de Redux.

---

#### 3. Custom Hooks

**Recomendación:**
```tsx
// hooks/useReservas.ts
export function useReservas(usuarioId: string) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        setLoading(true);
        const res = await reservasService.getMias(usuarioId);
        setReservas(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();
  }, [usuarioId]);

  return { reservas, loading, error, refetch: fetchReservas };
}
```

**Uso:**
```tsx
function MisReservas() {
  const { user } = useAuth();
  const { reservas, loading, error } = useReservas(user.id);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return <ReservasList reservas={reservas} />;
}
```

---

## 🗄️ Base de Datos

### Prisma ORM - Buenas Prácticas

#### 1. Migraciones Versionadas ✅

```bash
npx prisma migrate dev --name add_google_calendar_fields
```

**✅ Buena práctica:** Historial de cambios de schema.

---

#### 2. Seeds para Datos Iniciales ✅

```typescript
// prisma/seed.ts
async function main() {
  // Usuario admin
  await prisma.usuario.create({
    data: {
      correo: 'admin1@alto-bonito.cl',
      password: await bcrypt.hash('Admin12345', 10),
      nombre: 'Admin',
      apellido: 'Principal',
      rol: 'ADMIN',
    },
  });

  // Recursos
  await prisma.recurso.create({
    data: {
      nombre: 'Quincho Principal',
      tipo: 'QUINCHO',
      capacidad: 50,
      precioHoraCLP: 15000,
      precioDiaCLP: 120000,
    },
  });
}
```

---

#### 3. Índices Optimizados

```prisma
model Reserva {
  id String @id @default(uuid())
  // ...

  @@index([estado], name: "reserva_estado_idx")
  @@index([inicio, fin], name: "reserva_periodo_idx")
  @@index([usuarioId], name: "reserva_usuario_idx")
}
```

**✅ Buena práctica:** Índices en campos de búsqueda frecuente.

---

#### 4. Transacciones para Operaciones Críticas

```typescript
async createReservaWithPayment(dto: CreateReservaDto, pagoDto: CreatePagoDto) {
  return this.prisma.$transaction(async (tx) => {
    // Crear reserva
    const reserva = await tx.reserva.create({
      data: { ...dto },
    });

    // Crear pago
    const pago = await tx.pago.create({
      data: {
        ...pagoDto,
        reservaId: reserva.id,
      },
    });

    // Si cualquier operación falla, rollback automático
    return { reserva, pago };
  });
}
```

**✅ Buena práctica:** Atomicidad en operaciones relacionadas.

---

## 🌐 API Design

### REST Best Practices

#### 1. Nomenclatura de Endpoints ✅

```
GET    /api/recursos          # Listar recursos
GET    /api/recursos/:id      # Detalle de recurso
POST   /api/recursos          # Crear recurso (admin)
PATCH  /api/recursos/:id      # Actualizar recurso (admin)
DELETE /api/recursos/:id      # Eliminar recurso (admin)

GET    /api/reservas/mias     # Mis reservas
POST   /api/reservas          # Crear reserva
```

**✅ Buena práctica:** Nombres en plural, verbos HTTP semánticos.

---

#### 2. Respuestas Consistentes

**Éxito:**
```json
{
  "id": "uuid",
  "nombre": "Quincho Principal",
  "tipo": "QUINCHO"
}
```

**Error:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "correo",
      "message": "Email inválido"
    }
  ]
}
```

---

#### 3. Paginación Estándar ✅

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
```

**Query params:**
```
GET /api/recursos?page=2&limit=10&tipo=QUINCHO
```

---

## 🎨 Frontend

### 1. Lazy Loading de Rutas

**Recomendación:**
```tsx
import { lazy, Suspense } from 'react';

const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const RecursosPage = lazy(() => import('./pages/recursos/RecursosPage'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/recursos" element={<RecursosPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Beneficio:** Reduce bundle inicial, mejora time-to-interactive.

---

### 2. Memoización

```tsx
import { useMemo, memo } from 'react';

// Memoizar cálculos costosos
function RecursosGrid({ recursos }: Props) {
  const recursosFiltrados = useMemo(() => {
    return recursos
      .filter(r => r.activo)
      .sort((a, b) => a.precioHoraCLP - b.precioHoraCLP);
  }, [recursos]);

  return <Grid items={recursosFiltrados} />;
}

// Memoizar componentes
export default memo(RecursosGrid);
```

---

### 3. Error Boundaries

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado:', error, errorInfo);
    // Enviar a Sentry/LogRocket
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage />;
    }
    return this.props.children;
  }
}
```

---

## 🧪 Testing

### 1. Test Naming Convention

```javascript
// ✅ Bueno
test('Login con credenciales correctas - debe retornar token', async () => {});

// ❌ Malo
test('test1', async () => {});
```

---

### 2. AAA Pattern (Arrange, Act, Assert)

```javascript
test('Crear reserva - debe retornar 201', async ({ request }) => {
  // Arrange
  const { token, user } = await apiLogin(request, 'user@example.com', 'Pass123');
  const reservaData = {
    recursos: [{ recursoId: 'uuid', precioFinalCLP: 15000 }],
    modalidad: 'POR_HORA',
    inicio: '2025-12-25T10:00:00Z',
    fin: '2025-12-25T14:00:00Z',
    montoTotalCLP: 60000,
  };

  // Act
  const res = await request.post('/api/reservas', {
    headers: { Authorization: `Bearer ${token}` },
    data: reservaData,
  });

  // Assert
  expect(res.status()).toBe(201);
  const data = await res.json();
  expect(data).toHaveProperty('id');
  expect(data.usuarioId).toBe(user.id);
});
```

---

### 3. Utilidades Reutilizables ✅

```javascript
// tests/_utils.js
export async function apiLogin(request, correo, password) {
  const res = await request.post('/api/auth/login', {
    data: { correo, password },
  });
  const { access_token, user } = await res.json();
  return { token: access_token, user };
}
```

**✅ Buena práctica:** DRY (Don't Repeat Yourself) en tests.

---

## 🚀 DevOps y Deployment

### 1. Variables de Entorno

**Backend `.env`:**
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/altobonito"

# JWT
JWT_SECRET="your-secret-key-change-in-production"

# Transbank
TBK_COMMERCE_CODE="597055555532"
TBK_API_KEY="579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C"
TBK_ENV="TEST" # o PRODUCTION

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"

# Email
MAILER_HOST="smtp.gmail.com"
MAILER_PORT=587
MAILER_USER="noreply@altobonito.cl"
MAILER_PASSWORD="your-app-password"

# Crypto
CRYPTO_SECRET_KEY="your-32-byte-hex-key"
```

**⚠️ Nunca comitear `.env` al repositorio.**

---

### 2. Docker Compose (Desarrollo) ✅

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: altobonito
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: altobonito_db
    ports:
      - "5432:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://altobonito:password123@postgres:5432/altobonito_db
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000/api
```

---

### 3. CI/CD con GitHub Actions

**Recomendación:**
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password123
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Backend Dependencies
        run: cd backend && npm ci
      
      - name: Run Backend Tests
        run: cd backend && npm test
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E Tests
        run: npx playwright test
```

---

## ⚡ Performance

### 1. Optimización de Queries

**❌ N+1 Problem:**
```typescript
// Malo: 1 query + N queries por reserva
const reservas = await prisma.reserva.findMany();
for (const reserva of reservas) {
  reserva.recursos = await prisma.reservaRecurso.findMany({
    where: { reservaId: reserva.id },
  });
}
```

**✅ Solución con `include`:**
```typescript
const reservas = await prisma.reserva.findMany({
  include: {
    recursos: {
      include: {
        recurso: true,
      },
    },
    pagos: true,
    usuario: {
      select: {
        nombre: true,
        correo: true,
        password: false, // Nunca incluir password
      },
    },
  },
});
```

---

### 2. Caché con Redis

**Recomendación:**
```typescript
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  private redis = new Redis({
    host: process.env.REDIS_HOST,
    port: 6379,
  });

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }
}
```

**Uso:**
```typescript
async getRecursos() {
  const cached = await this.cache.get('recursos:all');
  if (cached) return cached;

  const recursos = await this.prisma.recurso.findMany();
  await this.cache.set('recursos:all', recursos, 60 * 5); // 5 min
  
  return recursos;
}
```

---

### 3. Compresión de Responses

```typescript
// backend/src/main.ts
import * as compression from 'compression';

app.use(compression());
```

---

### 4. Lazy Loading de Imágenes (Frontend)

```tsx
<img
  src="/img/quincho.jpg"
  alt="Quincho"
  loading="lazy"
  decoding="async"
/>
```

---

## 📚 Documentación

### 1. Comentarios JSDoc

```typescript
/**
 * Crea una nueva reserva validando disponibilidad.
 * 
 * @param dto - Datos de la reserva
 * @param usuarioId - ID del usuario autenticado
 * @returns Reserva creada con recursos y pagos
 * @throws {BadRequestException} Si hay solapamiento o recurso no disponible
 * @throws {NotFoundException} Si recurso no existe
 */
async create(dto: CreateReservaDto, usuarioId: string): Promise<Reserva> {
  // ...
}
```

---

### 2. README.md Descriptivos

**Estructura recomendada:**
```markdown
# Módulo de Reservas

## Descripción
Sistema de reservas con validación de disponibilidad, solapamientos y bloqueos.

## Instalación
\`\`\`bash
npm install
\`\`\`

## Uso
\`\`\`typescript
import { ReservasService } from './reservas.service';
\`\`\`

## Endpoints
- POST /reservas - Crear reserva
- GET /reservas/mias - Mis reservas

## Tests
\`\`\`bash
npm test
\`\`\`
```

---

## 🎯 Checklist de Producción

### Antes de Deploy

- [ ] Variables de entorno configuradas
- [ ] Secrets de producción rotados
- [ ] HTTPS habilitado (Let's Encrypt)
- [ ] CORS configurado para dominio de producción
- [ ] Rate limiting activado
- [ ] Helmet.js instalado
- [ ] Logs centralizados (Winston/Pino)
- [ ] Monitoring activado (Sentry, New Relic)
- [ ] Backups automatizados de BD
- [ ] Tests pasando al 95%+
- [ ] Performance optimizado (Lighthouse > 90)
- [ ] SEO básico (meta tags, sitemap)
- [ ] Políticas de privacidad y términos
- [ ] Email de confirmación configurado
- [ ] Transbank en modo producción
- [ ] Google OAuth en producción

---

**Documentación generada:** Diciembre 2025  
**Equipo:** Katherine Pereira, Leonardo Hernández, Jeanfranco Sánchez
