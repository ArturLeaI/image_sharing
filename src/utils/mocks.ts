import { Types } from 'mongoose';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const mockUser = {
  _id: new Types.ObjectId(),
  id: new Types.ObjectId().toString(),
  name: 'Test User',
  email: 'test@example.com',
  password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
};

export const mockImage = {
  _id: new Types.ObjectId(),
  filename: 'test-image-123456.jpg',
  originalname: 'test-image.jpg',
  path: 'uploads/test-image-123456.jpg',
  mimetype: 'image/jpeg',
  size: 1024,
  uploader: mockUser._id,
  description: 'Test image description',
  tags: ['test', 'image'],
  likes: [],
  comments: [],
  createdAt: new Date(),
};

export const mockFile = {
  fieldname: 'image',
  originalname: 'test-image.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: 'uploads/',
  filename: 'test-image-123456.jpg',
  path: 'uploads/test-image-123456.jpg',
  size: 1024,
};

export const mockAuthRequest = (overrides = {}) => {
  const req = {
    user: {
      id: mockUser.id,
      email: mockUser.email,
    },
    headers: {
      authorization: `Bearer test-token`,
    },
    ...overrides,
  } as unknown as AuthenticatedRequest;
  return req;
};

export const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = jest.fn();
