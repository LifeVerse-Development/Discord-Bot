import { Schema, model, Document } from 'mongoose';

export interface IWarn extends Document {
    identifier: string;
    userId: string;
    guildId: string;
    reason: string;
    moderatorId: string;
    createdAt: Date;
    updatedAt: Date;
}

const WarnSchema = new Schema<IWarn>({
    identifier: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    reason: { type: String, required: true },
    moderatorId: { type: String, required: true },
}, { timestamps: true });

WarnSchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

export const Warn = model<IWarn>('Warn', WarnSchema);
