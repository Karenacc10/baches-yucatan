# 📚 Documentación Técnica - Baches Yucatán API

## 📋 Índice

1. [Arquitectura General](#-arquitectura-general)
2. [Estructura del Proyecto](#-estructura-del-proyecto)
3. [Configuración](#-configuración)
4. [Base de Datos](#-base-de-datos)
5. [Autenticación](#-autenticación)
6. [Controladores](#-controladores)
7. [Rutas](#-rutas)
8. [Middleware](#-middleware)
9. [Utilidades](#-utilidades)
10. [Endpoints Detallados](#-endpoints-detallados)

---

## 🏗️ Arquitectura General

La API sigue el patrón **MVC (Model-View-Controller)** adaptado para APIs REST:

- **Model**: Esquemas de Prisma (`prisma/schema.prisma`)
- **Controller**: Lógica de negocio (`src/controllers/`)
- **Routes**: Definición de endpoints (`src/routes/`)
- **Middleware**: Funciones intermedias (`src/middleware/`)

### Stack Tecnológico

- **Runtime**: Node.js
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL (Neon.tech)
- **Autenticación**: JWT
- **Validación**: Zod
- **Seguridad**: Helmet, CORS, Rate Limiting

---

## 📁 Estructura del Proyecto

```
baches-yucatan/
├── 📄 package.json              # Dependencias y scripts del proyecto
├── 📄 tsconfig.json             # Configuración de TypeScript
├── 📄 README.md                 # Documentación básica
├── 📄 DOCUMENTATION.md          # Documentación técnica (este archivo)
├── 📄 .gitignore               # Archivos ignorados por Git
├── 📄 .env.example             # Ejemplo de variables de entorno
├── 📄 .env                     # Variables de entorno (no en Git)
│
├── 📂 prisma/                   # Configuración de base de datos
│   ├── 📄 schema.prisma        # Esquema de la base de datos
│   └── 📂 migrations/          # Migraciones de BD
│       ├── 📄 migration_lock.toml
│       └── 📂 20251012043022_init_baches_yucatan/
│           └── 📄 migration.sql
│
└── 📂 src/                     # Código fuente principal
    ├── 📄 index.ts             # Punto de entrada de la aplicación
    │
    ├── 📂 controllers/         # Lógica de negocio
    │   ├── 📄 authController.ts
    │   ├── 📄 reportController.ts
    │   ├── 📄 vehicleController.ts
    │   ├── 📄 workerController.ts
    │   └── 📄 assignmentController.ts
    │
    ├── 📂 routes/              # Definición de rutas
    │   ├── 📄 index.ts
    │   ├── 📄 authRoutes.ts
    │   ├── 📄 reportRoutes.ts
    │   ├── 📄 vehicleRoutes.ts
    │   ├── 📄 workerRoutes.ts
    │   └── 📄 assignmentRoutes.ts
    │
    ├── 📂 middleware/          # Funciones intermedias
    │   ├── 📄 auth.ts
    │   └── 📄 validation.ts
    │
    ├── 📂 types/               # Tipos TypeScript
    │   └── 📄 index.ts
    │
    ├── 📂 utils/               # Utilidades y helpers
    │   ├── 📄 prisma.ts
    │   ├── 📄 helpers.ts
    │   ├── 📄 validations.ts
    │   └── 📄 seed.ts
    │
    └── 📂 generated/           # Archivos generados por Prisma
        └── 📂 prisma/
            └── ... (cliente de Prisma)
```

---

## ⚙️ Configuración

### 📄 `package.json`
Define las dependencias, scripts y metadatos del proyecto:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**Dependencias principales:**
- `express`: Framework web
- `prisma`: ORM y cliente de BD
- `jsonwebtoken`: Autenticación JWT
- `bcryptjs`: Hash de contraseñas
- `zod`: Validación de esquemas
- `cors`, `helmet`: Seguridad

### 📄 `tsconfig.json`
Configuración de TypeScript para el proyecto:
- Target: ES2020
- Module: CommonJS
- Strict mode habilitado
- Decorators experimentales
- Resolución de módulos Node

### 📄 `.env.example`
Plantilla de variables de entorno necesarias:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="secreto_seguro"
PORT=3001
NODE_ENV="development"
```

---

## 🗄️ Base de Datos

### 📄 `prisma/schema.prisma`

Define el esquema completo de la base de datos con 4 modelos principales:

#### **🚨 Model: Report**
Gestiona los reportes de baches:
```prisma
model Report {
  id                   String        @id @default(uuid())
  latitude             Float         # Coordenadas GPS
  longitude            Float
  street               String?       # Dirección opcional
  neighborhood         String?
  city                 String?
  state                String?
  postalCode           String?
  description          String?       # Descripción del bache
  date                 DateTime      # Fecha del reporte
  status               ReportStatus  @default(reported)
  reportedByVehicleId  String?       # Vehículo que reportó
  reportedByWorkerId   String?       # Trabajador que reportó
  severity             Severity      # Gravedad: low/medium/high
  comments             String?       # Comentarios adicionales
  images               String[]      # URLs de imágenes
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt
  assignments          Assignment[]  # Asignaciones relacionadas
}
```

#### **🚗 Model: Vehicle**
Gestiona los vehículos del sistema:
```prisma
model Vehicle {
  id               String         @id @default(uuid())
  licensePlate     String         @unique  # Placa única
  model            String?        # Modelo del vehículo
  year             Int?           # Año
  color            String?        # Color
  corporation      String?        # Corporación/empresa
  status           VehicleStatus  @default(active)
  assignedWorkerId String?        # Trabajador asignado
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  reports          Report[]       # Reportes hechos por este vehículo
  assignments      Assignment[]   # Asignaciones
}
```

#### **👷 Model: Worker**
Gestiona los trabajadores del sistema:
```prisma
model Worker {
  id               String       @id @default(uuid())
  role             Role         # admin/supervisor/worker
  email            String       @unique
  passwordHash     String       # Contraseña hasheada
  name             String       # Nombre
  secondName       String?      # Segundo nombre (opcional)
  lastname         String       # Apellido paterno
  secondLastname   String?      # Apellido materno (opcional)
  badgeNumber      String?      # Número de placa/credencial
  rank             String?      # Rango/puesto
  status           WorkerStatus @default(active)
  photoUrl         String?      # URL de foto de perfil
  yearsOfService   Int?         # Años de servicio
  specialization   String[]     # Especializaciones
  languagesSpoken  String[]     # Idiomas que habla
  certifications   String[]     # Certificaciones
  awards           String[]     # Premios/reconocimientos
  notes            String?      # Notas adicionales
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  reports          Report[]     # Reportes hechos por este trabajador
  assignments      Assignment[] # Asignaciones
  vehicles         Vehicle[]    # Vehículos asignados
}
```

#### **📋 Model: Assignment**
Gestiona las asignaciones de trabajo:
```prisma
model Assignment {
  id             String           @id @default(uuid())
  workerId       String           # Trabajador asignado
  vehicleId      String?          # Vehículo asignado (opcional)
  reportId       String?          # Reporte asignado (opcional)
  teamId         Int?             # ID del equipo
  progressStatus ProgressStatus   @default(not_started)
  priority       Priority?        @default(medium)
  notes          String?          # Notas de la asignación
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  completedAt    DateTime?        # Fecha de completado
}
```

#### **🏷️ Enums**
```prisma
enum ReportStatus {
  reported     # Reportado
  in_progress  # En progreso
  resolved     # Resuelto
}

enum Severity {
  low     # Baja
  medium  # Media
  high    # Alta
}

enum VehicleStatus {
  active      # Activo
  inactive    # Inactivo
  maintenance # En mantenimiento
}

enum Role {
  admin      # Administrador
  supervisor # Supervisor
  worker     # Trabajador
}

enum WorkerStatus {
  active    # Activo
  inactive  # Inactivo
  suspended # Suspendido
}

enum ProgressStatus {
  not_started  # No iniciado
  in_progress  # En progreso
  completed    # Completado
  on_hold      # En pausa
}

enum Priority {
  low    # Baja
  medium # Media
  high   # Alta
}
```

---

## 🔐 Autenticación

### 📄 `src/middleware/auth.ts`

**Funciones principales:**

#### `authenticateToken(req, res, next)`
- **Propósito**: Verificar que el usuario esté autenticado
- **Funcionamiento**: 
  1. Extrae el token del header `Authorization: Bearer <token>`
  2. Verifica el token JWT con el secret
  3. Decodifica y agrega la información del usuario a `req.user`
- **Uso**: Proteger rutas que requieren autenticación

#### `authorizeRoles(...roles)`
- **Propósito**: Verificar que el usuario tenga el rol adecuado
- **Parámetros**: Array de roles permitidos (`admin`, `supervisor`, `worker`)
- **Funcionamiento**: Comprueba si `req.user.role` está en los roles permitidos
- **Uso**: Proteger rutas específicas por rol

**Ejemplo de uso:**
```typescript
// Solo usuarios autenticados
router.get('/protected', authenticateToken, handler);

// Solo admins y supervisores
router.delete('/delete', authenticateToken, authorizeRoles('admin', 'supervisor'), handler);
```

---

## 🎮 Controladores

### 📄 `src/controllers/authController.ts`

#### `register(req, res)`
- **Propósito**: Registrar nuevos usuarios
- **Validación**: Email único, contraseña segura, rol válido
- **Proceso**:
  1. Valida los datos con Zod
  2. Verifica que el email no exista
  3. Hashea la contraseña con bcrypt
  4. Crea el usuario en la BD
  5. Genera token JWT
  6. Retorna usuario y token

#### `login(req, res)`
- **Propósito**: Autenticar usuarios existentes
- **Proceso**:
  1. Busca usuario por email
  2. Compara contraseña con bcrypt
  3. Genera token JWT
  4. Retorna token y datos del usuario

### 📄 `src/controllers/reportController.ts`

#### `getAllReports(req, res)`
- **Propósito**: Listar todos los reportes con filtros opcionales
- **Filtros soportados**:
  - `status`: por estado del reporte
  - `severity`: por gravedad
  - `city`: por ciudad
  - `page` y `limit`: paginación
- **Respuesta**: Array de reportes con metadatos de paginación

#### `getReportById(req, res)`
- **Propósito**: Obtener un reporte específico por ID
- **Validación**: UUID válido
- **Respuesta**: Objeto reporte completo

#### `createReport(req, res)`
- **Propósito**: Crear nuevo reporte de bache
- **Validación**: Coordenadas GPS, severidad, datos opcionales
- **Proceso**:
  1. Valida datos de entrada
  2. Crea reporte en BD
  3. Retorna reporte creado

#### `updateReport(req, res)`
- **Propósito**: Actualizar reporte existente
- **Permisos**: Solo admin/supervisor pueden cambiar status
- **Proceso**:
  1. Verifica existencia del reporte
  2. Valida permisos según rol
  3. Actualiza campos permitidos

#### `deleteReport(req, res)`
- **Propósito**: Eliminar reporte (soft delete)
- **Permisos**: Solo admin
- **Proceso**: Marca como eliminado o elimina físicamente

### 📄 `src/controllers/vehicleController.ts`

#### `getAllVehicles(req, res)`
- **Propósito**: Listar vehículos con filtros
- **Filtros**: status, corporation, paginación
- **Relaciones**: Incluye trabajador asignado

#### `createVehicle(req, res)`
- **Propósito**: Registrar nuevo vehículo
- **Validación**: Placa única, datos opcionales válidos
- **Características**: Asignación automática de trabajador

#### `updateVehicle(req, res)`
- **Propósito**: Actualizar información del vehículo
- **Validaciones**: Placa única, trabajador válido

#### `deleteVehicle(req, res)`
- **Propósito**: Eliminar vehículo del sistema
- **Verificaciones**: No debe tener asignaciones activas

### 📄 `src/controllers/workerController.ts`

#### `getAllWorkers(req, res)`
- **Propósito**: Listar trabajadores del sistema
- **Filtros**: role, status, paginación
- **Seguridad**: No incluye passwords en respuesta

#### `createWorker(req, res)`
- **Propósito**: Registrar nuevo trabajador
- **Validación**: Email único, contraseña segura
- **Características**: Hash automático de contraseña

#### `updateWorker(req, res)`
- **Propósito**: Actualizar información del trabajador
- **Restricciones**: Solo admin puede cambiar roles
- **Seguridad**: Re-hash de contraseña si se cambia

#### `deleteWorker(req, res)`
- **Propósito**: Desactivar/eliminar trabajador
- **Verificaciones**: No debe tener asignaciones activas

### 📄 `src/controllers/assignmentController.ts`

#### `getAllAssignments(req, res)`
- **Propósito**: Listar asignaciones con filtros
- **Filtros**: workerId, status, priority, paginación
- **Relaciones**: Incluye worker, vehicle, y report

#### `createAssignment(req, res)`
- **Propósito**: Crear nueva asignación de trabajo
- **Validaciones**: Worker existe, vehicle válido, report válido
- **Lógica**: Verificar disponibilidad del trabajador

#### `updateAssignment(req, res)`
- **Propósito**: Actualizar progreso de asignación
- **Características**: Auto-completado cuando status = completed
- **Notificaciones**: Logging de cambios de estado

#### `deleteAssignment(req, res)`
- **Propósito**: Cancelar asignación
- **Restricciones**: Solo si no está completada

---

## 🛣️ Rutas

### 📄 `src/routes/index.ts`
**Router principal** que combina todas las rutas:
```typescript
router.use('/auth', authRoutes);        // /api/auth/*
router.use('/reports', reportRoutes);   // /api/reports/*
router.use('/vehicles', vehicleRoutes); // /api/vehicles/*
router.use('/workers', workerRoutes);   // /api/workers/*
router.use('/assignments', assignmentRoutes); // /api/assignments/*
```

### 📄 `src/routes/authRoutes.ts`
```typescript
POST   /api/auth/register  # Registro de usuarios
POST   /api/auth/login     # Login de usuarios
```

### 📄 `src/routes/reportRoutes.ts`
```typescript
GET    /api/reports        # Listar reportes (público)
POST   /api/reports        # Crear reporte (autenticado)
GET    /api/reports/:id    # Obtener reporte (público)
PUT    /api/reports/:id    # Actualizar reporte (supervisor+)
DELETE /api/reports/:id    # Eliminar reporte (admin)
```

### 📄 `src/routes/vehicleRoutes.ts`
```typescript
GET    /api/vehicles       # Listar vehículos (autenticado)
POST   /api/vehicles       # Crear vehículo (supervisor+)
GET    /api/vehicles/:id   # Obtener vehículo (autenticado)
PUT    /api/vehicles/:id   # Actualizar vehículo (supervisor+)
DELETE /api/vehicles/:id   # Eliminar vehículo (admin)
```

### 📄 `src/routes/workerRoutes.ts`
```typescript
GET    /api/workers        # Listar trabajadores (supervisor+)
POST   /api/workers        # Crear trabajador (admin)
GET    /api/workers/:id    # Obtener trabajador (autenticado)
PUT    /api/workers/:id    # Actualizar trabajador (supervisor+)
DELETE /api/workers/:id    # Eliminar trabajador (admin)
```

### 📄 `src/routes/assignmentRoutes.ts`
```typescript
GET    /api/assignments    # Listar asignaciones (autenticado)
POST   /api/assignments    # Crear asignación (supervisor+)
GET    /api/assignments/:id # Obtener asignación (autenticado)
PUT    /api/assignments/:id # Actualizar asignación (asignado o supervisor+)
DELETE /api/assignments/:id # Eliminar asignación (supervisor+)
```

---

## 🛡️ Middleware

### 📄 `src/middleware/auth.ts`

#### `authenticateToken`
```typescript
// Uso en rutas
router.get('/protected', authenticateToken, controller);

// Agrega a req.user:
{
  id: string,
  email: string,
  role: 'admin' | 'supervisor' | 'worker',
  name: string,
  lastname: string
}
```

#### `authorizeRoles`
```typescript
// Ejemplos de uso
router.delete('/admin-only', authenticateToken, authorizeRoles('admin'), controller);
router.put('/supervisors', authenticateToken, authorizeRoles('admin', 'supervisor'), controller);
```

### 📄 `src/middleware/validation.ts`

#### `validateBody(schema)`
```typescript
// Valida body de request con esquema Zod
router.post('/create', validateBody(createReportSchema), controller);

// Si falla validación:
{
  "error": "Datos de entrada inválidos",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 🔧 Utilidades

### 📄 `src/utils/prisma.ts`
```typescript
// Cliente singleton de Prisma
export const prisma = new PrismaClient();

// Configuración:
// - Logging en desarrollo
// - Conexión automática
// - Manejo de errores
```

### 📄 `src/utils/helpers.ts`

#### `hashPassword(password: string)`
- **Propósito**: Hashear contraseñas de forma segura
- **Uso**: bcrypt con salt rounds = 10
- **Retorna**: Hash string

#### `comparePassword(password: string, hash: string)`
- **Propósito**: Comparar contraseña con hash
- **Uso**: Login y verificación
- **Retorna**: boolean

#### `generateToken(payload: object)`
- **Propósito**: Generar JWT token
- **Configuración**: Expira en 24h
- **Retorna**: Token string

#### `validateUUID(id: string)`
- **Propósito**: Validar formato UUID
- **Uso**: Validación de parámetros
- **Retorna**: boolean

### 📄 `src/utils/validations.ts`

**Esquemas Zod para validación:**

#### `createReportSchema`
```typescript
{
  latitude: number(-90 to 90),
  longitude: number(-180 to 180),
  street?: string,
  description?: string,
  severity: 'low' | 'medium' | 'high',
  // ... más campos
}
```

#### `createWorkerSchema`
```typescript
{
  email: string(email format),
  password: string(min 6 chars),
  name: string(required),
  lastname: string(required),
  role: 'admin' | 'supervisor' | 'worker',
  // ... más campos
}
```

### 📄 `src/utils/seed.ts`

#### `createAdminUser()`
- **Propósito**: Crear usuario administrador inicial
- **Datos**:
  ```typescript
  {
    email: "admin@bachesyucatan.com",
    password: "Admin123456!",
    name: "Administrador",
    lastname: "Sistema",
    role: "admin"
  }
  ```
- **Uso**: `npx ts-node src/utils/seed.ts`

---

## 🌐 Endpoints Detallados

### **Autenticación**

#### `POST /api/auth/register`
```json
// Request
{
  "email": "usuario@ejemplo.com",
  "password": "Password123!",
  "name": "Juan",
  "lastname": "Pérez",
  "role": "worker"
}

// Response 201
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "name": "Juan",
    "lastname": "Pérez",
    "role": "worker"
  },
  "token": "jwt.token.here"
}
```

#### `POST /api/auth/login`
```json
// Request
{
  "email": "usuario@ejemplo.com",
  "password": "Password123!"
}

// Response 200
{
  "message": "Login successful",
  "user": { /* datos usuario */ },
  "token": "jwt.token.here"
}
```

### **Reportes**

#### `GET /api/reports?status=reported&page=1&limit=10`
```json
// Response 200
{
  "reports": [
    {
      "id": "uuid",
      "latitude": 20.9674,
      "longitude": -89.5926,
      "street": "Calle 60",
      "description": "Bache grande en intersección",
      "status": "reported",
      "severity": "high",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### `POST /api/reports`
```json
// Request (autenticado)
{
  "latitude": 20.9674,
  "longitude": -89.5926,
  "street": "Calle 60 x 57",
  "description": "Bache profundo",
  "severity": "high",
  "date": "2024-01-01T12:00:00.000Z"
}

// Response 201
{
  "message": "Report created successfully",
  "report": { /* reporte completo */ }
}
```

### **Vehículos**

#### `GET /api/vehicles` (requiere autenticación)
```json
// Response 200
{
  "vehicles": [
    {
      "id": "uuid",
      "licensePlate": "ABC-123",
      "model": "Toyota Hilux",
      "year": 2020,
      "color": "Blanco",
      "status": "active",
      "assignedWorker": {
        "id": "uuid",
        "name": "Juan Pérez"
      }
    }
  ]
}
```

### **Trabajadores**

#### `GET /api/workers` (requiere supervisor+)
```json
// Response 200
{
  "workers": [
    {
      "id": "uuid",
      "email": "trabajador@ejemplo.com",
      "name": "María",
      "lastname": "González",
      "role": "worker",
      "status": "active",
      "badgeNumber": "W001"
    }
  ]
}
```

### **Asignaciones**

#### `POST /api/assignments` (requiere supervisor+)
```json
// Request
{
  "workerId": "worker-uuid",
  "vehicleId": "vehicle-uuid",
  "reportId": "report-uuid",
  "priority": "high",
  "notes": "Reparación urgente"
}

// Response 201
{
  "message": "Assignment created successfully",
  "assignment": {
    "id": "uuid",
    "progressStatus": "not_started",
    "priority": "high",
    "worker": { /* datos trabajador */ },
    "vehicle": { /* datos vehículo */ },
    "report": { /* datos reporte */ }
  }
}
```

---

## 🎯 Punto de Entrada

### 📄 `src/index.ts`

**Servidor principal** que configura:

1. **Middleware de seguridad**:
   - `helmet()`: Headers de seguridad
   - `cors()`: Control de CORS
   - `rateLimit()`: Límite de requests

2. **Middleware de parsing**:
   - `express.json()`: Parseo JSON
   - `express.urlencoded()`: Parseo form data

3. **Rutas**:
   - `/api/health`: Health check
   - `/api/*`: Todas las rutas de la aplicación

4. **Manejo de errores**:
   - Error 404 para rutas no encontradas
   - Error handler global

5. **Servidor**:
   - Puerto configurable (env.PORT o 3001)
   - Logging de inicio
   - Conexión a base de datos

**Flujo de inicio:**
```
1. Cargar variables de entorno
2. Configurar middleware
3. Registrar rutas
4. Configurar manejo de errores
5. Iniciar servidor en puerto especificado
6. Conectar a base de datos
7. Mostrar información de endpoints disponibles
```

---

## 🚀 Scripts de Desarrollo

### NPM Scripts disponibles:

```bash
# Desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar en producción
npm start

# Base de datos
npx prisma migrate dev      # Aplicar migraciones
npx prisma generate         # Generar cliente
npx prisma studio          # Interfaz visual de BD
npx ts-node src/utils/seed.ts  # Crear usuario admin
```

---

## 📊 Resumen de Funcionalidades

### ✅ **Implementado:**
- 🔐 **Autenticación completa** con JWT y roles
- 📝 **CRUD completo** para 4 entidades principales
- 🗄️ **Base de datos** PostgreSQL con Prisma ORM
- 🛡️ **Seguridad** con middleware especializado
- ✅ **Validación** robusta con Zod
- 📄 **Documentación** completa del código
- 🧪 **API testeable** con 30+ endpoints
- 📦 **Estructura modular** y mantenible

### 🎯 **Características técnicas:**
- **Escalabilidad**: Arquitectura modular
- **Seguridad**: JWT + bcrypt + helmet + CORS
- **Performance**: Paginación + indexado BD
- **Mantenibilidad**: TypeScript + documentación
- **Testabilidad**: Separación de responsabilidades

---

*📚 Esta documentación cubre todos los aspectos técnicos del proyecto Baches Yucatán API. Para más detalles sobre el uso de endpoints específicos, consulta los archivos de controladores individuales.*