import mongoose, { Schema } from 'mongoose';

export type UserRole = 'OPERATOR' | 'MANAGER' | 'ADMIN' | 'CLIENT';

export type UserDocument = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  clientId?: string;
  isProfessional: boolean;
  emailConfirmed: boolean;
  passwordResetRequired: boolean;
  activationTokenHash?: string;
  activationTokenExpiresAt?: Date;
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
    role: { type: String, enum: ['OPERATOR', 'MANAGER', 'ADMIN', 'CLIENT'], required: true },
    active: { type: Boolean, default: true },
    clientId: { type: String, index: true },
    isProfessional: { type: Boolean, default: false, index: true },
    emailConfirmed: { type: Boolean, default: false },
    passwordResetRequired: { type: Boolean, default: false },
    activationTokenHash: { type: String },
    activationTokenExpiresAt: { type: Date },
    locale: { type: String, default: 'pt' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>('User', userSchema);
