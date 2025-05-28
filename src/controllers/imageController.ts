import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import Image from '../models/image';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const uploadImage = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;

    if (!req.file) {
        res.status(400).json({ error: 'Nenhuma imagem válida foi enviada ou o tipo de arquivo não é suportado.' });
        return
    }

    const { description, tags } = req.body;
    const uploaderId = authReq.user?.id;

    if (!uploaderId) {
        res.status(401).json({ error: 'Usuário não autenticado corretamente.' });
        return
    }

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
        originalname: req.file.originalname, 
        path: req.file.path, 
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploader: uploaderId,
        description: description?.trim() || '',
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
    });

    await image.save();
    res.status(201).json({ message: 'Upload realizado com sucesso!', image });
};

export const getImages = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page <= 0 || limit <= 0 || limit > 100) { 
        res.status(400).json({ error: 'Parâmetros de paginação inválidos.' });
        return
    }

    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
        Image.find()
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit)
            .populate('uploader', 'name'), 
        Image.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
        page,
        limit,
        totalItems: total,
        totalPages,
        data: images
    });
};

export const getImageById = async (req: Request, res: Response) => {
    const imageId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
        res.status(400).json({ error: 'ID de imagem inválido.' });

    }

    const image = await Image.findById(imageId)
        .populate('uploader', 'name') 
        .populate('comments.user', 'name'); 

    if (!image) {
        res.status(404).json({ error: 'Imagem não encontrada.' });
    }

    res.json(image);
};

export const getUserImages = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado corretamente.' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    if (page <= 0 || limit <= 0 || limit > 100) {
        res.status(400).json({ error: 'Parâmetros de paginação inválidos.' });
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
};

export const getLikedImages = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado corretamente.' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    if (page <= 0 || limit <= 0 || limit > 100) {
        res.status(400).json({ error: 'Parâmetros de paginação inválidos.' });
    }
    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
        Image.find({ likes: userId })
            .sort({ createdAt: -1 })
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
};
