const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  photo: { type: String, default: 'default.jpg' },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, '  email'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Password must be provided'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false,
  },
  confirmedPassword: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return this.password === el;
      },
      message: "Password doesn't match",
    },
  },
  changedPasswordAt: Date,
  passwordResetToken: String,
  resetTokenExpire: Date,
  active: {
    type: Boolean,
    default: true,
  },
});

userSchema.pre('save', async function (next) {
  // Not to encrypt when password is not modified
  if (!this.isModified('password')) return next();

  // Encrypt the password using cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete confirmed password field;
  this.confirmedPassword = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.changedPasswordAt = Date.now() + 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.active = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedCheck = async function (changedPwdTimeStamp) {
  if (this.changedPasswordAt) {
    const timePasswordChanged =
      parseInt(this.changedPasswordAt.getTime() / 1000, 10) - 10;
    return changedPwdTimeStamp < timePasswordChanged;
  }

  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetTokenExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
