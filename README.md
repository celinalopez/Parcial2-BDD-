# Parcial2-API — Backend MERN (Bases de Datos 2)

API REST en **Node.js + Express + MongoDB (Mongoose)** con autenticación **JWT**.  
Incluye **CRUD**, **agregaciones**, **validaciones**, **Yargs + File System** para seed de datos y **middleware** de errores.

> Proyecto: **Parcial2-API**  
> Materia: **Bases de Datos 2**  
> Alumna: **Celina López**

---

## ⚙️ Stack & requisitos

- Node.js 18+ (probado con v22)
- MongoDB Community (local). *Para transacciones, activar **Replica Set** (ver Notas de Órdenes).*
- Postman para pruebas
- Git 

Extensiones VS Code recomendadas: ESLint, Prettier, DotENV.

---

## 📁 Estructura (resumen)

```
Parcial2-API/
├── server/
│   ├── .env
│   ├── package.json
│   ├── nodemon.json
│   ├── data/
│   │   ├── users.json
│   │   ├── categories.json
│   │   └── products.json
│   ├── scripts/
│   │   └── seed.mjs
│   └── src/
│       ├── index.js
│       ├── models/ (User, Category, Product, Cart, Order, Review)
│       ├── controllers/ (...Controller.js)
│       ├── routes/ (userRoutes.js, categoryRoutes.js, productRoutes.js, cartRoutes.js, orderRoutes.js, reviewRoutes.js)
│       ├── middlewares/ (auth.js, error.js)
│       └── utils/ (jwt.js)
└── client/ 
```

---

## 🚀 Instalación y ejecución

### 1) Backend
```bash
cd server
npm install
```

### 2) Variables de entorno (`server/.env`)
```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/parcial2_bdd
JWT_SECRET=supersecret
JWT_EXPIRES_IN=1d
```

> **Importante:** No uses comillas en los valores del `.env`.

### 3) Correr en desarrollo
```bash
npm run dev
# http://localhost:4000/api/health  ->  { "success": true, "message": "OK" }
```

---

## 🌱 Seed de datos (Yargs + File System)

El script `scripts/seed.mjs` demuestra **File System (fs)**, **Yargs**, **dotenv** y **Mongoose** leyendo JSON desde `/data` y cargando usuarios, categorías y productos.

### Archivos de datos
- `server/data/users.json`
- `server/data/categories.json`
- `server/data/products.json`

### Comandos
Desde `server/`:
```bash
# Insertar todo (users, categories, products)
node scripts/seed.mjs

# Vaciar colecciones y volver a insertar
node scripts/seed.mjs --reset

# Insertar solo una colección
node scripts/seed.mjs --only=users
node scripts/seed.mjs --only=categories
node scripts/seed.mjs --only=products
```

### Salida esperada
```
✅ Conectado a MongoDB
🗑️ Colecciones vaciadas         # si usás --reset
👤 2 usuarios insertados
📂 2 categorías insertadas
📦 2 productos insertados
🌱 Seed completado con éxito
🔌 Desconectado de MongoDB
```

---

## 🔐 Autenticación

- Registro y login devuelven un **token JWT**.
- Rutas protegidas exigen `Authorization: Bearer <TOKEN>`.
- Rutas “admin” requieren usuario con `role: "admin"`.

Ejemplo header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
```

---

## 📚 Endpoints

> Base URL: `http://localhost:4000`

### Healthcheck
```
GET /api/health
200 -> { "success": true, "message": "OK" }
```

---

### 👤 Usuarios — `/api/usuarios`

**Registro**
```
POST /api/usuarios/register
Body JSON: { "name":"Celina", "email":"celina@test.com", "password":"123456" }
```

**Login**
```
POST /api/usuarios/login
Body JSON: { "email":"celina@test.com", "password":"123456" }
-> data.token (JWT)
```

**Mi perfil (autenticado)**
```
GET /api/usuarios/me
Headers: Authorization: Bearer <TOKEN>
```

**Actualizar mi perfil (autenticado)**
```
PATCH /api/usuarios/me
Headers: Authorization: Bearer <TOKEN>
Body JSON: { "phone":"+54 9 11 5555-5555" }
```

**Listar (admin)**
```
GET /api/usuarios
Headers: Authorization: Bearer <TOKEN_ADMIN>
```

**Buscar con paginación (admin)**
```
GET /api/usuarios/search?q=cel&page=1&limit=10
Headers: Authorization: Bearer <TOKEN_ADMIN>
```

**Obtener por id (admin)**
```
GET /api/usuarios/:id
Headers: Authorization: Bearer <TOKEN_ADMIN>
```

**Actualizar por id (admin)**
```
PATCH /api/usuarios/:id
Headers: Authorization: Bearer <TOKEN_ADMIN>
Body JSON: { "role":"admin" }
```

**Eliminar por id (admin)**
```
DELETE /api/usuarios/:id
Headers: Authorization: Bearer <TOKEN_ADMIN>
# Elimina también el carrito del usuario
```

---

### 📂 Categorías — `/api/categorias`

**Listar (público)**
```
GET /api/categorias
```

**Detalle (público)**
```
GET /api/categorias/:id
```

**Crear/Actualizar/Eliminar (admin)**
```
POST   /api/categorias
PATCH  /api/categorias/:id
DELETE /api/categorias/:id
Headers: Authorization: Bearer <TOKEN_ADMIN>
Body JSON (POST/PATCH): { "name":"Notebooks","description":"..." }
```

**Stats: productos por categoría (admin)**
```
GET /api/categorias/stats
Headers: Authorization: Bearer <TOKEN_ADMIN>
```

---

### 📦 Productos — `/api/productos`

**Listar (público) con filtros y paginación**
```
GET /api/productos?q=note&brand=lenovo&minPrice=1000&maxPrice=3000&category=<ID>&page=1&limit=10
```

**Top reseñados / mejor rating (público)**
```
GET /api/productos/top?limit=5
```

**Detalle (público)**
```
GET /api/productos/:id
```

**Crear/Actualizar/Eliminar (admin)**
```
POST   /api/productos
PATCH  /api/productos/:id
DELETE /api/productos/:id
Headers: Authorization: Bearer <TOKEN_ADMIN>
Body JSON (POST): { "name":"Notebook X","brand":"Lenovo","category":"<ID>","price":1500,"stock":10 }
```

**Modificar stock (admin)**
```
PATCH /api/productos/:id/stock
Headers: Authorization: Bearer <TOKEN_ADMIN>
Body JSON (dos formas):
- { "delta": -2 }   # relativo: descuenta 2 del stock actual
- { "stock": 20 }   # absoluto: fija el stock en 20
```

---

### 🛒 Carrito — `/api/carrito` (owner o admin)

> Todas requieren `Authorization: Bearer <TOKEN>` y ser **dueña del carrito** o **admin**.

**Obtener mi carrito**
```
GET /api/carrito/:userId
```

**Totales**
```
GET /api/carrito/:userId/total
-> { "subtotal": 1234, "itemsCount": 3 }
```

**Agregar item**
```
POST /api/carrito/:userId/items
Body JSON: { "productId":"<ID_PRODUCTO>", "qty":2 }
```

**Actualizar cantidad**
```
PATCH /api/carrito/:userId/items/:productId
Body JSON: { "qty": 3 }   # si qty <= 0 elimina
```

**Eliminar item**
```
DELETE /api/carrito/:userId/items/:productId
```

**Vaciar carrito**
```
DELETE /api/carrito/:userId
```

---

### 🧾 Órdenes — `/api/ordenes`

**Crear desde carrito (owner o admin)**
```
POST /api/ordenes
Headers: Authorization: Bearer <TOKEN>
Body: { "userId":"<ID_DEL_USUARIO>", "paymentMethod":"tarjeta" }
```
> Descuenta stock, crea la orden con los precios históricos del carrito y vacía el carrito.

**Listar todas (admin)**
```
GET /api/ordenes
Headers: Authorization: Bearer <TOKEN_ADMIN>
```

**Listar por usuario (owner o admin)**
```
GET /api/ordenes/user/:userId
Headers: Authorization: Bearer <TOKEN> (owner) o <TOKEN_ADMIN>
```

**Detalle (owner o admin)**
```
GET /api/ordenes/:id
Headers: Authorization: Bearer <TOKEN> (owner) o <TOKEN_ADMIN>
```

**Cambiar estado (admin)**
```
PATCH /api/ordenes/:id/status
Headers: Authorization: Bearer <TOKEN_ADMIN>
Body JSON: { "status":"paid" }  # pending|paid|shipped|cancelled
```

**Stats por estado (admin)**
```
GET /api/ordenes/stats/summary
Headers: Authorization: Bearer <TOKEN_ADMIN>
```

#### 🔎 Nota sobre transacciones
- La versión pro usa **transacciones (session.startTransaction)** ⇒ requiere **Replica Set** local:
  - Editar `mongod.cfg`:  
    ```yaml
    replication:
      replSetName: "rs0"
    ```
  - `mongosh` → `rs.initiate()`  
  - `.env`: `MONGO_URI=mongodb://127.0.0.1:27017/mern_ecom?replicaSet=rs0`
- Alternativa rápida sin transacciones: implementación que usa `bulkWrite` y checks por documento.

---

### ⭐ Reseñas — `/api/resenas`

**Crear reseña (solo si compró)**
```
POST /api/resenas
Headers: Authorization: Bearer <TOKEN>
Body JSON: { "product":"<ID_PRODUCTO>", "rating":5, "comment":"Excelente" }
```

**Actualizar mi reseña (owner o admin)**
```
PATCH /api/resenas/:id
Headers: Authorization: Bearer <TOKEN>
Body JSON: { "rating": 4, "comment":"Muy buena" }
```

**Eliminar mi reseña (owner o admin)**
```
DELETE /api/resenas/:id
Headers: Authorization: Bearer <TOKEN>
```

**Listar por producto (público)**
```
GET /api/resenas/product/:productId?page=1&limit=10
```

**Ver mi reseña para un producto**
```
GET /api/resenas/me/product/:productId
Headers: Authorization: Bearer <TOKEN>
```

**TOP productos por rating & count (agregaciones)**
```
GET /api/resenas/top?limit=5
```

> Cada alta/edición/baja de reseñas recalcula `avgRating` y `ratingsCount` en el `Product`.

---

## 🧯 Errores y formato de respuesta

- Respuesta OK: `{ "success": true, "data": ... }`
- Respuesta Error: `{ "success": false, "error": "mensaje" }`
- El middleware captura validaciones de Mongoose y key duplicadas (`E11000`) con 409.

---

## 🧪 Pruebas rápidas (curl)

**Register → Login → Me**
```bash
curl -X POST http://localhost:4000/api/usuarios/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Celina","email":"celina@test.com","password":"123456"}'

curl -X POST http://localhost:4000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"celina@test.com","password":"123456"}'

# usar el token devuelto
curl http://localhost:4000/api/usuarios/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

## ✍️ Créditos
- Alumna: **Celina López**
- Materia: **Bases de Datos 2**
- Año: **2025**
