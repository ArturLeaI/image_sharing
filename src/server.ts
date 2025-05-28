import mongoose from 'mongoose';
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = 'mongodb://localhost:27017/image_sharing';

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado ao MongoDB');

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Erro ao conectar no MongoDB:', err);
    process.exit(1);
  }
}

startServer();
