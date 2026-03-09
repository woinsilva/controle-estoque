import mongoose, { Schema } from 'mongoose';

export type UserRole = 'OPERATOR' | 'MANAGER' | 'ADMIN';

export type UserDocument = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  locale?: string;
  theme?: 'light' | 'dark';
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['OPERATOR', 'MANAGER', 'ADMIN'], required: true },
    active: { type: Boolean, default: true },
    locale: { type: String, default: 'pt' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>('User', userSchema);
