import { Schema, model, Document } from 'mongoose';

export interface ITimeout extends Document {
    identifier: string;
    userId: string;
    username: string;
    reason: string;
    duration: number;
    createdAt: Date;
    updatedAt: Date;
}

const timeoutSchema = new Schema<ITimeout>({
    identifier: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    reason: { type: String, required: true },
    duration: { type: Number, required: true },
}, { timestamps: true });

timeoutSchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

export const Timeout = model<ITimeout>('Timeout', timeoutSchema);
