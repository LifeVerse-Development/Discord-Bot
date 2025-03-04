import { Schema, model, Document } from 'mongoose';

export interface IKick extends Document {
    identifier: string;
    userId: string;
    moderatorId: string;
    reason: string;
    createdAt: Date;
    updatedAt: Date;
}

const KickSchema = new Schema<IKick>({
    identifier: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
}, { timestamps: true });

KickSchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

export const Kick = model<IKick>('Kick', KickSchema);
