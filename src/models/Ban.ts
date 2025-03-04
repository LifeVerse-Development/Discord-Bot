import { Schema, model, Document } from 'mongoose';

export interface IBan extends Document {
    identifier: string;
    userId: string;
    username: string;
    reason: string;
    createdAt: Date;
    updatedAt: Date;
}

const BanSchema = new Schema<IBan>({
    identifier: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    reason: { type: String, required: true },
}, { timestamps: true });

BanSchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

export const Ban = model<IBan>('Ban', BanSchema);
