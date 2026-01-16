import mongoose, { Schema } from 'mongoose';

export type UserRole = 'OPERATOR' | 'MANAGER' | 'ADMIN';

export type UserDocument = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['OPERATOR', 'MANAGER', 'ADMIN'], required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>('User', userSchema);
