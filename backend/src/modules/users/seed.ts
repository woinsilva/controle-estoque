import bcrypt from 'bcryptjs';
import { connectDb } from '../../config/db.js';
import { env } from '../../config/env.js';
import { User } from './model.js';

const email = process.env.ADMIN_EMAIL || 'admin@empresa.com';
const password = process.env.ADMIN_PASSWORD || 'Admin123!';

async function seedAdmin(): Promise<void> {
  await connectDb(env.mongodbUri);
  const passwordHash = await bcrypt.hash(password, 10);

  await User.updateOne(
    { email },
    {
      $set: {
        name: 'Administrador',
        email,
        passwordHash,
        role: 'ADMIN',
        active: true
      }
    },
    { upsert: true }
  );

  await User.db.close();
  console.log('Admin seed completed.');
}

seedAdmin().catch((error) => {
  console.error('Admin seed failed:', error);
  process.exit(1);
});
