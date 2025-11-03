import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String,
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false }, // select:false para no devolverla por defecto
  role: { type: String, enum: ['client','admin'], default: 'client' },
  phone: String,
  addresses: [AddressSchema],
}, { timestamps: true });

// Hash antes de guardar si fue modificada
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método de instancia p/ comparar
UserSchema.methods.matchPassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', UserSchema);
