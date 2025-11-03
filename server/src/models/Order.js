import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty:      { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:         { type: [OrderItemSchema], default: [] },
  total:         { type: Number, required: true, min: 0 },
  status:        { type: String, enum: ['pending','paid','shipped','cancelled'], default: 'pending' },
  paymentMethod: { type: String, default: 'unselected' }
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);
