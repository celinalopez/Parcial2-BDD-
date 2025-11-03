import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { notFound, errorHandler } from './middlewares/error.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// opcional: logger de rutas para debug
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });

// home y health
app.get('/', (_req, res) => res.json({ success: true, message: 'API Parcial2-BDD corriendo', docs: '/api/health' }));
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'OK' }));

// monta rutas ANTES de notFound
app.use('/api/usuarios', userRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/carrito', cartRoutes);

app.use(notFound);
app.use(errorHandler);

const { PORT = 4000, MONGO_URI } = process.env;
mongoose.connect(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
});
