const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Sales', 'Finance', 'Compliance'], default: 'Sales' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 12);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.passwordHash; return ret; }
});

module.exports = mongoose.model('User', userSchema);
