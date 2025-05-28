import mongoose, { Schema, Document } from 'mongoose';

interface IImage extends Document {
  filename: string;
  originalname: string;
  uploader: mongoose.Types.ObjectId | null;
  description?: string;
  tags?: string[];
  likes: mongoose.Types.Array<mongoose.Types.ObjectId>;
  comments: {
    user: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];
  createdAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    uploader: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    description: String,
    tags: [String],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<IImage>('Image', ImageSchema);
