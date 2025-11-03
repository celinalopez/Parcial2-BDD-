import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { errorHandler, notFound } from './milddlewares/error.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Healthcheck
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'OK' }));

// TODO: montar rutas: users, productos, categorias, carrito, ordenes, resenas

app.use(notFound);
app.use(errorHandler);

const { PORT = 4000, MONGO_URI } = process.env;
mongoose.connect(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
});
