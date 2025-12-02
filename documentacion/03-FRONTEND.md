# Frontend Documentation - Quincho Alto Bonito

## 📋 Tabla de Contenidos
1. [Arquitectura Frontend](#arquitectura-frontend)
2. [Componentes Principales](#componentes-principales)
3. [Context API y Estado Global](#context-api-y-estado-global)
4. [Servicios y API](#servicios-y-api)
5. [Rutas y Navegación](#rutas-y-navegación)
6. [Utilidades y Validadores](#utilidades-y-validadores)
7. [Estilos y Theming](#estilos-y-theming)

---

## 🏗️ Arquitectura Frontend

### Stack Tecnológico
- **Framework:** React 19.0 (functional components + hooks)
- **Build Tool:** Vite 6.0
- **Router:** React Router DOM 7.0
- **UI Framework:** TailwindCSS 3.4
- **Animaciones:** Framer Motion 11.1
- **Iconos:** React Icons 5.2
- **HTTP Client:** Axios 1.7

### Estructura de Carpetas
```
frontend/src/
├── components/          # Componentes reutilizables
│   ├── auth/           # Login, Register, ProtectedRoute
│   ├── home/           # Carousel, Chatbot, Nosotros, Servicios, Galería
│   ├── reserva/        # SlotPicker, QuickReserveModal, MisReservas
│   ├── recursos/       # RecursosGrid
│   ├── usuario/        # GoogleCalendarCard
│   ├── google/         # GoogleCalendarConnect
│   ├── navbar.tsx      # Header principal
│   └── footer.tsx      # Footer del sitio
├── pages/              # Páginas de la aplicación
│   ├── home.tsx        # Página principal
│   ├── recursos/       # Catálogo de recursos
│   ├── admin/          # Dashboard administrativo
│   ├── usuario/        # Perfil de usuario
│   └── pago/           # Resultados de pago
├── context/            # React Context
│   ├── authcontext.tsx # Autenticación global
│   └── cartcontext.tsx # Carrito de reservas
├── services/           # Servicios API
│   ├── api.ts          # Cliente Axios configurado
│   ├── auth.service.ts # Endpoints de autenticación
│   ├── recursos.service.ts
│   ├── reservas.service.ts
│   ├── tbk.service.ts
│   └── google.service.ts
├── routes/             # Configuración de rutas
│   └── routesconfig.tsx
├── utils/              # Utilidades
│   ├── validators.ts   # Validación de formularios
│   └── formatters.ts   # Formateo de datos
├── lib/                # Configuraciones
│   └── axiosinstance.ts
├── App.tsx             # Componente raíz
└── main.tsx            # Entry point
```

---

## 🧩 Componentes Principales

### 1. Navbar (`components/navbar.tsx`)

**Descripción:** Header responsivo con navegación principal y estado de autenticación.

**Props:** Ninguna (consume AuthContext)

**Funcionalidades:**
- Muestra logo y links de navegación
- Botón "Cerrar sesión" cuando usuario autenticado
- Menú hamburguesa en móvil
- Indicador de rol (ADMIN/CLIENTE)

**Ejemplo de uso:**
```tsx
import Header from "@/components/navbar";

function Layout() {
  return (
    <>
      <Header />
      {/* Contenido */}
    </>
  );
}
```

**Estados internos:**
- `menuOpen`: Boolean para menú móvil
- Consume `user` y `logout` de AuthContext

---

### 2. Chatbot (`components/home/chatbot.tsx`)

**Descripción:** Chatbot interactivo con sistema de opciones basado en árbol de decisiones.

**Props:**
```typescript
interface OptionChatbotProps {
  tree: ChatTree;              // Árbol de conversación
  title?: string;              // Título del chat
  brand?: BrandColors;         // Colores personalizados
  floating?: boolean;          // Modo flotante (default: true)
  storageKey?: string;         // Key para localStorage
  onEvent?: (event: string, payload?: any) => void;
}
```

**ChatTree Structure:**
```typescript
type ChatTree = {
  startId: string;
  nodes: Record<string, ChatNode>;
};

type ChatNode = {
  id: string;
  message: string;
  options?: ChatOption[];
  isEnd?: boolean;
};

type ChatOption = {
  id: string;
  label: string;
  next?: string;             // ID del siguiente nodo
  action?: ChatAction;       // Acción a ejecutar
  description?: string;
};

type ChatAction =
  | { type: "open_url"; url: string }
  | { type: "copy"; text: string }
  | { type: "emit"; event: string; payload?: any };
```

**Funcionalidades:**
- Navegación por opciones con historial
- Persistencia en localStorage
- Acciones: abrir URL, copiar texto, emitir eventos
- Eventos personalizados: `go_to`, `scroll_to`, `open_url`, `copy`
- Botón "Inicio" para resetear conversación
- **Siempre muestra mensaje inicial al cargar** (modificación reciente)

**Ejemplo de uso:**
```tsx
import OptionChatbot from "@/components/home/chatbot";
import { chatTree } from "@/services/chatbot.service";

function HomePage() {
  const handleChatEvent = (event: string, payload?: any) => {
    if (event === "go_to") {
      navigate(payload.path);
    } else if (event === "scroll_to") {
      document.getElementById(payload.target)?.scrollIntoView();
    }
  };

  return (
    <OptionChatbot
      tree={chatTree}
      title="Asistente Quincho Alto Bonito"
      storageKey="qab-option-chatbot"
      onEvent={handleChatEvent}
      floating={true}
    />
  );
}
```

**Theming:**
```typescript
const DEFAULT_BRAND = {
  primary: "#c14421",
  primaryText: "#ffffff",
  bubbleBot: "#1e1e1e",
  bubbleUser: "#f7efe1",
  border: "#e5d0ac",
  surface: "#ffffff",
  accent: "#e5d0ac",
  gradientDark: "#8e2a12",
};
```

---

### 3. SlotPicker (`components/reserva/slotpicker.tsx`)

**Descripción:** Selector de slots horarios para reservas.

**Props:**
```typescript
interface SlotPickerProps {
  recursoId: string;
  fecha: Date;
  onSlotSelect: (inicio: Date, fin: Date) => void;
  duracionMin?: number; // Duración mínima en minutos
}
```

**Funcionalidades:**
- Obtiene slots disponibles desde API
- Visualiza disponibilidad por hora
- Selección de rango horario
- Validación de tiempo mínimo/máximo
- Indicadores visuales: disponible, ocupado, seleccionado

**Ejemplo de uso:**
```tsx
import SlotPicker from "@/components/reserva/slotpicker";

function ReservaPage() {
  const handleSlotSelect = (inicio: Date, fin: Date) => {
    console.log("Reserva:", inicio, fin);
  };

  return (
    <SlotPicker
      recursoId="uuid-quincho"
      fecha={new Date()}
      onSlotSelect={handleSlotSelect}
      duracionMin={60}
    />
  );
}
```

---

### 4. QuickReserveModal (`components/reserva/quickreservemodal.tsx`)

**Descripción:** Modal de reserva rápida con formulario.

**Props:**
```typescript
interface QuickReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: string;
}
```

**Funcionalidades:**
- Formulario de reserva con validación
- Selección de recurso
- Selector de fecha y hora
- Cálculo de precio en tiempo real
- Confirmación y creación de reserva

**Estados:**
- `recursos`: Lista de recursos disponibles
- `selectedRecurso`: Recurso seleccionado
- `fecha`, `horaInicio`, `horaFin`: Datos del formulario
- `precio`: Precio calculado
- `loading`, `error`: Estados de carga/error

---

### 5. MisReservas (`components/reserva/misreservas.tsx`)

**Descripción:** Vista de reservas del usuario autenticado.

**Props:** Ninguna (consume AuthContext)

**Funcionalidades:**
- Lista de reservas ordenadas por fecha
- Filtros por estado: PENDIENTE, CONFIRMADA, CANCELADA
- Detalle de cada reserva (recursos, precio, pagos)
- Acciones: Ver detalle, Pagar (si pendiente)
- Indicadores de estado con colores

**Estados:**
- `reservas`: Array de reservas
- `filtroEstado`: Estado seleccionado
- `loading`, `error`

**Ejemplo de uso:**
```tsx
import MisReservas from "@/components/reserva/misreservas";

function PerfilPage() {
  return (
    <div>
      <h1>Mis Reservas</h1>
      <MisReservas />
    </div>
  );
}
```

---

### 6. RecursosGrid (`components/recursos/recursosgrid.tsx`)

**Descripción:** Grid responsivo de tarjetas de recursos.

**Props:**
```typescript
interface RecursosGridProps {
  recursos: Recurso[];
  onRecursoClick?: (id: string) => void;
}
```

**Funcionalidades:**
- Grid adaptable (1 columna móvil, 2-3 en desktop)
- Tarjetas con imagen, nombre, tipo, capacidad, precio
- Hover effects con Framer Motion
- Botón "Reservar"

**Ejemplo de uso:**
```tsx
import RecursosGrid from "@/components/recursos/recursosgrid";

function RecursosPage() {
  const { data } = useRecursos();

  return <RecursosGrid recursos={data?.items || []} />;
}
```

---

### 7. GoogleCalendarConnect (`components/google/GoogleCalendarConnect.tsx`)

**Descripción:** Componente para conectar/desconectar Google Calendar.

**Props:** Ninguna (consume AuthContext)

**Funcionalidades:**
- Verifica estado de conexión
- Botón "Conectar Google Calendar" (OAuth popup)
- Muestra email conectado y avatar
- Botón "Desconectar"

**Estados:**
- `connected`: Boolean
- `googleEmail`, `avatarUrl`: Datos de Google
- `loading`

**Flujo de conexión:**
1. Usuario hace clic en "Conectar"
2. Se abre popup con URL OAuth (`/api/auth/google/start-calendar`)
3. Usuario autoriza en Google
4. Callback cierra popup y actualiza estado
5. Frontend muestra email conectado

---

### 8. Carousel (`components/home/carousel.tsx`)

**Descripción:** Slider de imágenes hero con autoplay.

**Props:**
```typescript
interface CarouselProps {
  images: string[];      // URLs de imágenes
  autoplay?: boolean;    // Default: true
  interval?: number;     // Milisegundos (default: 5000)
}
```

**Funcionalidades:**
- Slider automático con indicadores
- Navegación manual (flechas izq/der)
- Transiciones suaves con Framer Motion
- Responsive

---

### 9. ProtectedRoute (`components/auth/ProtectedRoute.tsx`)

**Descripción:** HOC para proteger rutas que requieren autenticación.

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Funcionalidad:**
- Verifica token en localStorage
- Redirige a `/login` si no autenticado
- Útil para rutas de perfil, admin, reservas

**Ejemplo de uso:**
```tsx
import ProtectedRoute from "@/components/auth/ProtectedRoute";

<Route
  path="/usuario"
  element={
    <ProtectedRoute>
      <UsuarioPage />
    </ProtectedRoute>
  }
/>
```

---

### 10. RedirectIfAuthenticated (`components/auth/RedirectIfAuthenticated.tsx`)

**Descripción:** Redirige a home si usuario ya está autenticado.

**Props:** Igual que ProtectedRoute

**Funcionalidad:**
- Evita que usuarios autenticados accedan a `/login` o `/register`
- Redirige a `/` si ya tienen token

**Ejemplo de uso:**
```tsx
<Route
  path="/login"
  element={
    <RedirectIfAuthenticated>
      <LoginPage />
    </RedirectIfAuthenticated>
  }
/>
```

---

## 🌐 Context API y Estado Global

### AuthContext (`context/authcontext.tsx`)

**Descripción:** Manejo global de autenticación.

**Estado:**
```typescript
interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  login: (correo: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<Usuario>) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}
```

**Funcionalidades:**
- `login()`: Autentica usuario, guarda token en localStorage
- `register()`: Registra nuevo usuario
- `logout()`: Limpia token y redirige a home
- `updateUser()`: Actualiza perfil del usuario
- `isAuthenticated`: Boolean calculado

**Persistencia:**
- Token en `localStorage.getItem('token')`
- Al montar, verifica token y obtiene perfil (`GET /auth/me`)

**Ejemplo de uso:**
```tsx
import { useAuth } from "@/context/authcontext";

function ProfilePage() {
  const { user, logout, updateUser } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div>
      <p>Bienvenido, {user?.nombre}</p>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
}
```

---

### CartContext (`context/cartcontext.tsx`)

**Descripción:** Carrito de reservas temporal.

**Estado:**
```typescript
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
}

interface CartItem {
  recursoId: string;
  recursoNombre: string;
  inicio: Date;
  fin: Date;
  precio: number;
}
```

**Funcionalidades:**
- `addItem()`: Agrega recurso al carrito
- `removeItem()`: Elimina por ID
- `clearCart()`: Vacía carrito
- `total`: Suma de precios

**Persistencia:** No persiste (solo en memoria durante sesión)

---

## 🛠️ Servicios y API

### Cliente Axios (`lib/axiosinstance.ts`)

**Configuración base:**
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: agrega token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: maneja errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

### Auth Service (`services/auth.service.ts`)

**Funciones:**
```typescript
export const authService = {
  register: (data: RegisterData) => api.post("/auth/register", data),
  login: (correo: string, password: string) => api.post("/auth/login", { correo, password }),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data: Partial<Usuario>) => api.patch("/auth/profile", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};
```

---

### Recursos Service (`services/recursos.service.ts`)

**Funciones:**
```typescript
export const recursosService = {
  getAll: (params?: RecursoFilters) => api.get("/recursos", { params }),
  getById: (id: string) => api.get(`/recursos/${id}`),
  getSlots: (id: string, fecha: string) => 
    api.get(`/recursos/${id}/slots`, { params: { fecha } }),
  getAvailability: (id: string, inicio: string, fin: string) =>
    api.get(`/recursos/${id}/availability`, { params: { inicio, fin } }),
};
```

**Nota:** `getAll()` retorna estructura paginada:
```typescript
{
  items: Recurso[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
```

---

### Reservas Service (`services/reservas.service.ts`)

**Funciones:**
```typescript
export const reservasService = {
  create: (data: CreateReservaDTO) => api.post("/reservas", data),
  getMias: (userId: string) => api.get(`/reservas/mias?userId=${userId}`),
  getById: (id: string) => api.get(`/reservas/${id}`),
};
```

---

### Transbank Service (`services/tbk.service.ts`)

**Funciones:**
```typescript
export const tbkService = {
  createTransaction: (data: CreateTxDTO) => api.post("/tbk/tx", data),
};
```

---

### Google Service (`services/google.service.ts`)

**Funciones:**
```typescript
export const googleService = {
  getStatus: () => api.get("/auth/google/status"),
  disconnect: () => api.post("/auth/google/disconnect"),
};
```

---

## 🗺️ Rutas y Navegación

### Configuración de Rutas (`routes/routesconfig.tsx`)

**Rutas principales:**
```tsx
const routes = [
  { path: "/", element: <HomePage /> },
  { path: "/recursos", element: <RecursosPage /> },
  { path: "/recursos/:id", element: <RecursoDetailPage /> },
  
  // Auth
  {
    path: "/login",
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: "/register",
    element: (
      <RedirectIfAuthenticated>
        <RegisterPage />
      </RedirectIfAuthenticated>
    ),
  },
  
  // Protected
  {
    path: "/usuario",
    element: (
      <ProtectedRoute>
        <UsuarioPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminPage />
      </ProtectedRoute>
    ),
  },
  
  // Pago
  { path: "/pago/ok", element: <PagoResultPage /> },
];
```

**Navegación programática:**
```tsx
import { useNavigate } from "react-router-dom";

function Component() {
  const navigate = useNavigate();

  const goToRecursos = () => {
    navigate("/recursos");
  };
}
```

---

## 🔧 Utilidades y Validadores

### Validators (`utils/validators.ts`)

**Funciones:**
```typescript
export const validators = {
  isValidEmail: (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  isValidPhoneCL: (phone: string): boolean => {
    // +56912345678
    const regex = /^\+569\d{8}$/;
    return regex.test(phone);
  },

  isValidPassword: (password: string): boolean => {
    // Min 8 chars, 1 uppercase, 1 number
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password)
    );
  },

  isValidRUT: (rut: string): boolean => {
    // 12345678-9
    const regex = /^\d{7,8}-[\dkK]$/;
    if (!regex.test(rut)) return false;
    
    // Validar dígito verificador
    const [numero, dv] = rut.split("-");
    let suma = 0;
    let multiplicador = 2;
    for (let i = numero.length - 1; i >= 0; i--) {
      suma += parseInt(numero[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    const dvCalculado = 11 - (suma % 11);
    const dvFinal = dvCalculado === 11 ? "0" : dvCalculado === 10 ? "k" : dvCalculado.toString();
    return dv.toLowerCase() === dvFinal;
  },
};
```

---

### Formatters (`utils/formatters.ts`)

**Funciones:**
```typescript
export const formatters = {
  formatCLP: (amount: number): string => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  },

  formatDate: (date: Date | string): string => {
    return new Intl.DateTimeFormat("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  },

  formatDateTime: (date: Date | string): string => {
    return new Intl.DateTimeFormat("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  },

  formatTime: (date: Date | string): string => {
    return new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  },
};
```

---

## 🎨 Estilos y Theming

### TailwindCSS Config (`tailwind.config.js`)

**Colores personalizados:**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "#c14421",
        primaryDark: "#8e2a12",
        accent: "#e5d0ac",
        surface: "#f7efe1",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
};
```

**Uso en componentes:**
```tsx
<button className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg">
  Reservar
</button>
```

---

### Animaciones con Framer Motion

**Ejemplo fade-in:**
```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Contenido
</motion.div>
```

**Ejemplo hover scale:**
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Botón
</motion.button>
```

---

## 📝 Mejores Prácticas Implementadas

### ✅ Componentes Funcionales
- Uso exclusivo de hooks (`useState`, `useEffect`, `useContext`)
- Código más limpio y testeable

### ✅ TypeScript
- Tipado estricto en props e interfaces
- Autocompletado y detección de errores

### ✅ Separación de Responsabilidades
- Componentes: Solo UI
- Services: Lógica de API
- Context: Estado global
- Utils: Funciones puras

### ✅ Manejo de Errores
- Try-catch en llamadas async
- Mensajes de error amigables
- Estados de loading

### ✅ Accesibilidad (a11y)
- Labels en formularios
- ARIA attributes en componentes interactivos
- Navegación por teclado

### ✅ Responsive Design
- Mobile-first approach
- Breakpoints de TailwindCSS
- Grid y Flexbox adaptables

---

## 🔄 Mejoras Futuras Sugeridas

### Seguridad
1. ⚠️ Migrar tokens a httpOnly cookies
2. ⚠️ Implementar CSRF protection
3. ⚠️ Sanitización de inputs con DOMPurify

### Performance
1. Lazy loading de rutas con `React.lazy()`
2. Memoización con `useMemo` y `React.memo`
3. Optimización de imágenes (WebP, responsive images)
4. Service Worker para PWA

### UX
1. Skeleton loaders
2. Notificaciones toast (react-hot-toast)
3. Confirmación de acciones destructivas
4. Modo offline básico

### Testing
1. Unit tests con Vitest
2. Component tests con React Testing Library
3. Coverage mínimo del 70%

---

**Documentación generada:** Diciembre 2025  
**Equipo:** Katherine Pereira, Leonardo Hernández, Jeanfranco Sánchez
