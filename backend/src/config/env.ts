import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT || 3000);
const mongodbUri = process.env.MONGODB_URI || '';
const jwtSecret = process.env.JWT_SECRET || '';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';

if (!mongodbUri) {
  throw new Error('MONGODB_URI is required');
}
if (!jwtSecret) {
  throw new Error('JWT_SECRET is required');
}

export const env = {
  port,
  mongodbUri,
  jwtSecret,
  jwtExpiresIn
};
