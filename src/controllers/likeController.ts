import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import Image from '../models/image';
import { AuthenticatedRequest } from '../middleware/authMiddleware';


export const toggleLike = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const imageId = req.params.id;
    const userId = authReq.user?.id; 
    if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado corretamente.' });
        return
    }

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
        res.status(400).json({ error: 'ID de imagem inválido.' });
        return
    }

    const image = await Image.findById(imageId);
    if (!image) {
        res.status(404).json({ error: 'Imagem não encontrada.' });
        return
    }

    const alreadyLikedIndex = image.likes.findIndex(likeId => likeId.equals(userId));

    if (alreadyLikedIndex > -1) {
        image.likes.splice(alreadyLikedIndex, 1);
    } else {
        image.likes.push(userId);
    }

    await image.save();
    res.json({ liked: alreadyLikedIndex === -1, totalLikes: image.likes.length });
};