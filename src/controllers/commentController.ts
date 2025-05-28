import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import Image from '../models/image';
import { AuthenticatedRequest } from '../middleware/authMiddleware';


export const addComment = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const imageId = req.params.id;
    const userId = authReq.user?.id;
    const { text } = req.body;

    if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado corretamente.' });
        return
    }

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
        res.status(400).json({ error: 'ID de imagem inválido.' });
        return
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        res.status(400).json({ error: 'O texto do comentário não pode estar vazio.' });
        return
    }
    if (text.length > 500) {
        res.status(400).json({ error: 'O comentário excede o limite de 500 caracteres.' });
        return
    }

    const image = await Image.findById(imageId);
    if (!image) {
        res.status(404).json({ error: 'Imagem não encontrada.' });
        return
    }

    const userObjectId = new Types.ObjectId(userId);
    image.comments.push({
        user: userObjectId,
        text: text.trim(),
        createdAt: new Date()
    });
    await image.save();

    const populatedImage = await Image.findById(imageId).populate('comments.user', 'name');
    const newComment = populatedImage?.comments[populatedImage.comments.length - 1];

    res.status(201).json({ message: 'Comentário adicionado!', comment: newComment });
};