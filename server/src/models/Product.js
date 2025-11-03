import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  brand: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);
