import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { notFound, errorHandler } from './middlewares/error.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';

//Swagger setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDoc = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger', 'openapi.json'), 'utf-8')
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// logger de rutas para debug
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });
//logger de rutas swagger
app.get('/swagger.json', (_req, res) => res.json(swaggerDoc));

// home 
app.get('/', (_req, res) => res.json({ success: true, message: 'API Parcial2-BDD corriendo', docs: '/api/home' }));
app.get('/api/home', (_req, res) => res.json({ success: true, message: 'OK' }));

// monta rutas ANTES de notFound
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

//Swagger setup
app.use(
  '/swagger',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    explorer: true,
    swaggerOptions: { url: '/swagger.json' }
  })
);

app.use(notFound);
app.use(errorHandler);

const { PORT = 4000, MONGO_URI } = process.env;
mongoose.connect(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
});

