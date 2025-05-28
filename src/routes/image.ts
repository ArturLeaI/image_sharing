// Importações Essenciais
import express, { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid'; // Para gerar nomes de arquivo únicos
import path from 'path';
import mongoose, { Types } from 'mongoose';

// Importações de Módulos Locais
import Image from '../models/image'; // Modelo Mongoose para Imagem
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware'; // Middleware de autenticação e tipo de request

// --- Configuração do Multer para Upload --- 

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads'; // Diretório de uploads (idealmente do .env)

// Configuração de armazenamento do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Garante que o diretório exista (pode ser feito na inicialização do app também)
    // fs.mkdirSync(UPLOAD_DIR, { recursive: true }); 
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Gera um nome de arquivo único usando UUID e mantém a extensão original
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});

// Filtro de arquivo (exemplo: aceitar apenas imagens)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo inválido. Apenas imagens são permitidas.'));
    // Ou cb(null, false) se preferir rejeitar silenciosamente
  }
};

// Instância do Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // Exemplo: Limite de 5MB
});

// --- Inicialização do Roteador --- 
const router: Router = express.Router();

// --- Rotas de Imagem ---

// POST /api/upload - Upload de uma nova imagem
// Usando o tipo Request do Express para compatibilidade com o middleware
router.post('/upload', authenticate, upload.single('image'), async (req: Request, res: Response) => {
  // Convertendo para AuthenticatedRequest para acessar req.user
  const authReq = req as AuthenticatedRequest;

  if (!req.file) {
    // Isso pode acontecer se o filtro rejeitar ou nenhum arquivo for enviado
    res.status(400).json({ error: 'Nenhuma imagem válida foi enviada ou o tipo de arquivo não é suportado.' });
    return
  }

  const { description, tags } = req.body;
  const uploaderId = authReq.user?.id; // ID do usuário vem do TOKEN autenticado

  if (!uploaderId) {
    // Segurança extra, embora 'authenticate' deva garantir isso
    res.status(401).json({ error: 'Usuário não autenticado corretamente.' });
    return
  }

  // Validação simples (pode ser melhorada com Joi/Zod)
  if (description && typeof description !== 'string') {
    res.status(400).json({ error: 'Descrição inválida.' });
    return
  }
  if (tags && typeof tags !== 'string') {
    res.status(400).json({ error: 'Tags inválidas.' });
    return
  }

  const image = new Image({
    filename: req.file.filename,
    originalname: req.file.originalname, // Pode ser útil para referência, mas não para exibição direta
    path: req.file.path, // Caminho onde o arquivo foi salvo
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploader: uploaderId,
    description: description?.trim() || '',
    // Processa as tags: string separada por vírgula -> array de strings sem espaços extras
    tags: tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
  });

  await image.save();
  res.status(201).json({ message: 'Upload realizado com sucesso!', image });
});

// POST /api/images/:id/like - Curtir/Descurtir uma imagem
router.post('/images/:id/like', authenticate, async (req: Request, res: Response) => {
  // Convertendo para AuthenticatedRequest para acessar req.user
  const authReq = req as AuthenticatedRequest;
  const imageId = req.params.id;
  const userId = authReq.user?.id; // ID do usuário vem do TOKEN autenticado

  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado corretamente.' });
    return
  }

  // Validação do ID da imagem (formato ObjectId do Mongoose)
  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    res.status(400).json({ error: 'ID de imagem inválido.' });
    return
  }

  const image = await Image.findById(imageId);
  if (!image) {
    res.status(404).json({ error: 'Imagem não encontrada.' });
    return
  }

  // Verifica se o usuário já curtiu
  const alreadyLikedIndex = image.likes.findIndex(likeId => likeId.equals(userId));

  if (alreadyLikedIndex > -1) {
    // Já curtiu -> Descurtir (remover o ID do array)
    image.likes.splice(alreadyLikedIndex, 1);
  } else {
    // Não curtiu -> Curtir (adicionar o ID ao array)
    image.likes.push(userId);
  }

  await image.save();
  res.json({ liked: alreadyLikedIndex === -1, totalLikes: image.likes.length });
});

// POST /api/images/:id/comment - Adicionar um comentário a uma imagem
router.post('/images/:id/comment', authenticate, async (req: Request, res: Response) => {
  // Convertendo para AuthenticatedRequest para acessar req.user
  const authReq = req as AuthenticatedRequest;
  const imageId = req.params.id;
  const userId = authReq.user?.id; // ID do usuário vem do TOKEN autenticado
  const { text } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado corretamente.' });
    return
  }

  // Validação do ID da imagem
  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    res.status(400).json({ error: 'ID de imagem inválido.' });
    return
  }

  // Validação do texto do comentário
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'O texto do comentário não pode estar vazio.' });
    return
  }
  if (text.length > 500) { // Exemplo de limite de tamanho
    res.status(400).json({ error: 'O comentário excede o limite de 500 caracteres.' });
    return
  }

  const image = await Image.findById(imageId);
  if (!image) {
    res.status(404).json({ error: 'Imagem não encontrada.' });
    return
  }

  // Adiciona o comentário ao array

  const userObjectId = new Types.ObjectId(userId);
  image.comments.push({ 
    user: userObjectId, // Usando ObjectId em vez de string
    text: text.trim(), 
    createdAt: new Date() 
  });
  await image.save();

  // Popula o último comentário adicionado para retornar o nome do usuário
  const populatedImage = await Image.findById(imageId).populate('comments.user', 'name');
  const newComment = populatedImage?.comments[populatedImage.comments.length - 1];

  res.status(201).json({ message: 'Comentário adicionado!', comment: newComment });
});

// GET /api/images - Buscar imagens com paginação
router.get('/images', async (req: Request, res: Response) => { // Não requer autenticação para ver todas as imagens
  // Validação e parse da paginação
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (page <= 0 || limit <= 0 || limit > 100) { // Adicionar limites razoáveis
    res.status(400).json({ error: 'Parâmetros de paginação inválidos.' });
    return
  }

  const skip = (page - 1) * limit;

  // Busca imagens e contagem total em paralelo
  const [images, total] = await Promise.all([
    Image.find()
      .sort({ createdAt: -1 }) // Ordena pelas mais recentes
      .skip(skip)
      .limit(limit)
      .populate('uploader', 'name'), // Popula o nome do uploader
    Image.countDocuments() // Conta o total de documentos na coleção
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    page,
    limit,
    totalItems: total,
    totalPages,
    data: images
  });
});

// GET /api/images/:id - Buscar uma imagem específica por ID
router.get('/images/:id', async (req: Request, res: Response) => { // Não requer autenticação para ver uma imagem
  const imageId = req.params.id;

  // Validação do ID da imagem
  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    res.status(400).json({ error: 'ID de imagem inválido.' });
    return
  }

  const image = await Image.findById(imageId)
    .populate('uploader', 'name') // Popula nome do uploader
    .populate('comments.user', 'name'); // Popula nome dos usuários nos comentários

  if (!image) {
    res.status(404).json({ error: 'Imagem não encontrada.' });
    return
  }

  res.json(image);
});


// --- Rotas Específicas do Usuário Autenticado ---

// GET /api/user/my-images - Buscar imagens enviadas pelo usuário autenticado
router.get('/user/my-images', authenticate, async (req: Request, res: Response) => {
  // Convertendo para AuthenticatedRequest para acessar req.user
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado corretamente.' });
    return
  }

  // Paginação opcional para esta rota também
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  if (page <= 0 || limit <= 0 || limit > 100) {
    res.status(400).json({ error: 'Parâmetros de paginação inválidos.' });
    return
  }
  const skip = (page - 1) * limit;

  const [images, total] = await Promise.all([
    Image.find({ uploader: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Image.countDocuments({ uploader: userId })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    page,
    limit,
    totalItems: total,
    totalPages,
    data: images
  });
});

// GET /api/user/liked-images - Buscar imagens curtidas pelo usuário autenticado
router.get('/user/liked-images', authenticate, async (req: Request, res: Response) => {
  // Convertendo para AuthenticatedRequest para acessar req.user
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado corretamente.' });
    return
  }

  // Paginação opcional
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  if (page <= 0 || limit <= 0 || limit > 100) {
    res.status(400).json({ error: 'Parâmetros de paginação inválidos.' });
    return
  }
  const skip = (page - 1) * limit;

  const [images, total] = await Promise.all([
    Image.find({ likes: userId })
      .sort({ createdAt: -1 }) // Ou ordenar por quando foi curtida? Requer schema change.
      .skip(skip)
      .limit(limit)
      .populate('uploader', 'name'),
    Image.countDocuments({ likes: userId })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    page,
    limit,
    totalItems: total,
    totalPages,
    data: images
  });
});


// --- Exportar o Roteador --- 
export default router;
