import express, { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../utils/fileUpload';
import { uploadImage, getImages, getImageById, getUserImages, getLikedImages } from '../controllers/imageController';
import { toggleLike } from '../controllers/likeController';
import { addComment } from '../controllers/commentController';

const router: Router = express.Router();

router.post('/upload', authenticate, upload.single('image'), uploadImage);
router.post('/images/:id/like', authenticate, toggleLike);
router.post('/images/:id/comment', authenticate, addComment);
router.get('/images', getImages);
router.get('/images/:id', getImageById);
router.get('/user/my-images', authenticate, getUserImages);
router.get('/user/liked-images', authenticate, getLikedImages);

export default router;
