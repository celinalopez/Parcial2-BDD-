// === scripts/seed.mjs ===
// Demuestra uso de File System, Yargs, Variables de entorno y Mongoose.

import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import mongoose from 'mongoose';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

// Importar modelos
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';

// === CLI arguments con Yargs ===
const argv = yargs(hideBin(process.argv))
  .option('reset', {
    type: 'boolean',
    describe: 'Elimina los documentos existentes antes de insertar',
    default: false
  })
  .option('only', {
    type: 'string',
    describe: 'Sembrar solo una colección: users | categories | products'
  })
  .help()
  .argv;

// === Conexión a Mongo ===
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_ecom';
await mongoose.connect(MONGO_URI);
console.log('✅ Conectado a MongoDB');

// === Helper para leer JSON desde /data ===
const readJSON = (file) => {
  const fullPath = path.resolve('data', file);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(raw);
};

// === Funciones de seed ===
const seedUsers = async () => {
  const users = readJSON('users.json');
  for (const u of users) {
    const salt = await bcrypt.genSalt(10);
    u.password = await bcrypt.hash(u.password, salt);
  }
  await User.insertMany(users);
  console.log(`👤 ${users.length} usuarios insertados`);
};

const seedCategories = async () => {
  const cats = readJSON('categories.json');
  await Category.insertMany(cats);
  console.log(`📂 ${cats.length} categorías insertadas`);
};

const seedProducts = async () => {
  const products = readJSON('products.json');
  const categories = await Category.find();
  if (!categories.length) throw new Error('Primero debes cargar categorías');

  // asignar categorías aleatorias si no tienen
  for (const p of products) {
    if (!p.category) {
      const randomCat = categories[Math.floor(Math.random() * categories.length)];
      p.category = randomCat._id;
    }
  }
  await Product.insertMany(products);
  console.log(`📦 ${products.length} productos insertados`);
};

// === Reset de colecciones si se pide --reset ===
if (argv.reset) {
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({})
  ]);
  console.log('🗑️ Colecciones vaciadas');
}

// === Insertar según argumentos ===
try {
  if (argv.only === 'users') await seedUsers();
  else if (argv.only === 'categories') await seedCategories();
  else if (argv.only === 'products') await seedProducts();
  else {
    await seedUsers();
    await seedCategories();
    await seedProducts();
  }
  console.log('🌱 Seed completado con éxito');
} catch (err) {
  console.error('❌ Error en seed:', err.message);
}

await mongoose.disconnect();
console.log('🔌 Desconectado de MongoDB');
process.exit(0);
