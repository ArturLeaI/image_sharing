import dotenv from 'dotenv';


dotenv.config();


export const JWT_SECRET = process.env.JWT_SECRET || '';
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapp';
export const PORT = process.env.PORT || 3000;
export const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
export const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';


if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}
