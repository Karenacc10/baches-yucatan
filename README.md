# 🚧 Baches Yucatán - API Backend

Sistema de gestión de baches para el estado de Yucatán, México.

## 📋 Descripción

API REST desarrollada con Node.js, Express y TypeScript para la gestión integral de reportes de baches, vehículos, trabajadores y asignaciones de trabajo.

## 🚀 Características

- **Autenticación JWT** con roles (admin, supervisor, worker)
- **CRUD completo** para reportes, vehículos, trabajadores y asignaciones
- **Base de datos PostgreSQL** con Prisma ORM
- **Validación de datos** con Zod
- **Seguridad** con helmet, cors y rate limiting
- **API RESTful** con 30+ endpoints

## 🛠️ Tecnologías

- **Backend**: Node.js, Express.js, TypeScript
- **Base de datos**: PostgreSQL (Neon.tech)
- **ORM**: Prisma
- **Autenticación**: JWT + bcryptjs
- **Validación**: Zod
- **Desarrollo**: ts-node-dev

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/baches-yucatan.git
cd baches-yucatan
```

2. Instala dependencias:
```bash
npm install
```

3. Configura variables de entorno:
```bash
cp .env.example .env
```

4. Configura la base de datos:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Ejecuta el servidor:
```bash
npm run dev
```

## 🌐 Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login

### Reportes
- `GET /api/reports` - Listar reportes
- `POST /api/reports` - Crear reporte
- `GET /api/reports/:id` - Obtener reporte
- `PUT /api/reports/:id` - Actualizar reporte
- `DELETE /api/reports/:id` - Eliminar reporte

### Vehículos
- `GET /api/vehicles` - Listar vehículos
- `POST /api/vehicles` - Crear vehículo
- `GET /api/vehicles/:id` - Obtener vehículo
- `PUT /api/vehicles/:id` - Actualizar vehículo
- `DELETE /api/vehicles/:id` - Eliminar vehículo

### Trabajadores
- `GET /api/workers` - Listar trabajadores
- `POST /api/workers` - Crear trabajador
- `GET /api/workers/:id` - Obtener trabajador
- `PUT /api/workers/:id` - Actualizar trabajador
- `DELETE /api/workers/:id` - Eliminar trabajador

### Asignaciones
- `GET /api/assignments` - Listar asignaciones
- `POST /api/assignments` - Crear asignación
- `GET /api/assignments/:id` - Obtener asignación
- `PUT /api/assignments/:id` - Actualizar asignación
- `DELETE /api/assignments/:id` - Eliminar asignación

## 🔒 Autenticación

El sistema utiliza JWT tokens. Incluye el token en el header:
```
Authorization: Bearer <tu-token>
```

## 📝 Variables de Entorno

```env
DATABASE_URL="postgresql://usuario:password@host:puerto/base_datos"
JWT_SECRET="tu_jwt_secret"
PORT=3001
NODE_ENV="development"
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autor

**Karen** - Desarrolladora Backend

---

⭐ Si te gusta este proyecto, ¡dale una estrella!