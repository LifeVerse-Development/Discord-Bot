import { Schema, model, Document } from 'mongoose';

export interface ILevelDocument extends Document {
    userId: string;
    xp: number;
    level: number;
    levelUpCount: number;
    xpHistory: {
        date: Date;
        xpEarned: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const levelSchema: Schema = new Schema<ILevelDocument>({
    userId: { type: String, required: true, unique: true },
    xp: { type: Number, required: true, default: 0 },
    level: { type: Number, required: true, default: 0 },
    levelUpCount: { type: Number, required: true, default: 0 },
    xpHistory: [
        {
            date: { type: Date, required: true },
            xpEarned: { type: Number, required: true },
        }
    ]
}, { timestamps: true });

export const Level = model<ILevelDocument>('Level', levelSchema);
