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

## 🔐 Autenticación

- Registro y login devuelven un **token JWT**.
- Rutas protegidas exigen `Authorization: Bearer <TOKEN>`.
- Rutas “admin” requieren user con `role: "admin"`.

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

### 👤 users — `/api/users`

**Registro**
```
POST /api/users/register
Body JSON: { "name":"Celina", "email":"celina@test.com", "password":"123456" }
```

**Login**
```
POST /api/users/login
Body JSON: { "email":"celina@test.com", "password":"123456" }
-> data.token (JWT)
```

**Mi perfil (autenticado)**
```
GET /api/users/me
Headers: Authorization: Bearer <TOKEN>
```

**Actualizar mi perfil (autenticado)**
```
PATCH /api/users/me
Headers: Authorization: Bearer <TOKEN>
Body JSON: { "phone":"+54 9 11 5555-5555" }
```

**Listar (admin)**
```
GET /api/users
Headers: Authorization: Bearer <TOKEN_ADMIN>
```

**Buscar con paginación (admin)**
```
GET /api/users/search?q=cel&page=1&limit=10
Headers: Authorization: Bearer <TOKEN_ADMIN>
```

**Obtener por id (admin)**
```
GET /api/users/:id
Headers: Authorization: Bearer <TOKEN_ADMIN>
```

**Actualizar por id (admin)**
```
PATCH /api/users/:id
Headers: Authorization: Bearer <TOKEN_ADMIN>
Body JSON: { "role":"admin" }
```

**Eliminar por id (admin)**
```
DELETE /api/users/:id
Headers: Authorization: Bearer <TOKEN_ADMIN>
# Elimina también el cart del user
```

---

### 📂 Categorías — `/api/categories`

**Listar (público)**
```
GET /api/categories
```

**Detalle (público)**
```
GET /api/categories/:id
```

**Crear/Actualizar/Eliminar (admin)**
```
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id
Headers: Authorization: Bearer <TOKEN_ADMIN>
Body JSON (POST/PATCH): { "name":"Notebooks","description":"..." }
```

**Stats: products por categoría (admin)**
```
GET /api/categories/stats
Headers: Authorization: Bearer <TOKEN_ADMIN>
```

---

### 📦 Productos — `/api/products`

**Listar (público) con filtros y paginación**
```
GET /api/products?q=note&brand=lenovo&minPrice=1000&maxPrice=3000&category=<ID>&page=1&limit=10
```

**Top reviewdos / mejor rating (público)**
```
GET /api/products/top?limit=5
```

**Detalle (público)**
```
GET /api/products/:id
```

**Crear/Actualizar/Eliminar (admin)**
```
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id
Headers: Authorization: Bearer <TOKEN_ADMIN>
Body JSON (POST): { "name":"Notebook X","brand":"Lenovo","category":"<ID>","price":1500,"stock":10 }
```

**Modificar stock (admin)**
```
PATCH /api/products/:id/stock
Headers: Authorization: Bearer <TOKEN_ADMIN>
Body JSON (dos formas):
- { "delta": -2 }   # relativo: descuenta 2 del stock actual
- { "stock": 20 }   # absoluto: fija el stock en 20
```

---

### 🛒 Carrito — `/api/cart` (owner o admin)

> Todas requieren `Authorization: Bearer <TOKEN>` y ser **dueña del cart** o **admin**.

**Obtener mi cart**
```
GET /api/cart/:userId
```

**Totales**
```
GET /api/cart/:userId/total
-> { "subtotal": 1234, "itemsCount": 3 }
```

**Agregar item**
```
POST /api/cart/:userId/items
Body JSON: { "productId":"<ID_PRODUCTO>", "qty":2 }
```

**Actualizar cantidad**
```
PATCH /api/cart/:userId/items/:productId
Body JSON: { "qty": 3 }   # si qty <= 0 elimina
```

**Eliminar item**
```
DELETE /api/cart/:userId/items/:productId
```

**Vaciar cart**
```
DELETE /api/cart/:userId
```

---

### 🧾 Órdenes — `/api/orders`

**Crear desde cart (owner o admin)**
```
POST /api/orders
Headers: Authorization: Bearer <TOKEN>
Body: { "userId":"<ID_DEL_user>", "paymentMethod":"tarjeta" }
```
> Descuenta stock, crea la orden con los precios históricos del cart y vacía el cart.

**Listar todas (admin)**
```
GET /api/orders
Headers: Authorization: Bearer <TOKEN_ADMIN>
```

**Listar por user (owner o admin)**
```
GET /api/orders/user/:userId
Headers: Authorization: Bearer <TOKEN> (owner) o <TOKEN_ADMIN>
```

**Detalle (owner o admin)**
```
GET /api/orders/:id
Headers: Authorization: Bearer <TOKEN> (owner) o <TOKEN_ADMIN>
```

**Cambiar estado (admin)**
```
PATCH /api/orders/:id/status
Headers: Authorization: Bearer <TOKEN_ADMIN>
Body JSON: { "status":"paid" }  # pending|paid|shipped|cancelled
```

**Stats por estado (admin)**
```
GET /api/orders/stats/summary
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

### ⭐ Reseñas — `/api/reviews`

**Crear review (solo si compró)**
```
POST /api/reviews
Headers: Authorization: Bearer <TOKEN>
Body JSON: { "product":"<ID_PRODUCTO>", "rating":5, "comment":"Excelente" }
```

**Actualizar mi review (owner o admin)**
```
PATCH /api/reviews/:id
Headers: Authorization: Bearer <TOKEN>
Body JSON: { "rating": 4, "comment":"Muy buena" }
```

**Eliminar mi review (owner o admin)**
```
DELETE /api/reviews/:id
Headers: Authorization: Bearer <TOKEN>
```

**Listar por product (público)**
```
GET /api/reviews/product/:productId?page=1&limit=10
```

**Ver mi review para un product**
```
GET /api/reviews/me/product/:productId
Headers: Authorization: Bearer <TOKEN>
```

**TOP products por rating & count (agregaciones)**
```
GET /api/reviews/top?limit=5
```

> Cada alta/edición/baja de reviews recalcula `avgRating` y `ratingsCount` en el `Product`.

---

## 🧯 Errores y formato de respuesta

- Respuesta OK: `{ "success": true, "data": ... }`
- Respuesta Error: `{ "success": false, "error": "mensaje" }`
- El middleware captura validaciones de Mongoose y key duplicadas (`E11000`) con 409.

---

## 🧪 Pruebas rápidas (curl)

**Register → Login → Me**
```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Celina","email":"celina@test.com","password":"123456"}'

curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"celina@test.com","password":"123456"}'

# usar el token devuelto
curl http://localhost:4000/api/users/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

## ✍️ Créditos
- Alumna: **Celina López**
- Materia: **Bases de Datos 2**
- Año: **2025**
