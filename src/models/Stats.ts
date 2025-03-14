import { Schema, model, Document } from 'mongoose';

export interface IStat extends Document {
    identifier: string;
    guildId: string;
    type: string;
    channelId: string;
    createdAt: Date;
    updatedAt: Date;
}

const statSchema = new Schema<IStat>({
    identifier: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    type: { type: String, required: true, unique: true },
    channelId: { type: String, required: true }
}, { timestamps: true });

statSchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

export const Stat = model<IStat>('Stat', statSchema);
