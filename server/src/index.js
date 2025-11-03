import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { errorHandler, notFound } from './middlewares/error.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Healthcheck
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'OK' }));

// TODO: montar rutas: users, productos, categorias, carrito, ordenes, resenas
// para http://localhost:4000
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'API Parcial2-BDD corriendo', docs: '/api/health' });
});

app.use(notFound);
app.use(errorHandler);
app.use('/api/usuarios', userRoutes);

const { PORT = 4000, MONGO_URI } = process.env;
mongoose.connect(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
});
