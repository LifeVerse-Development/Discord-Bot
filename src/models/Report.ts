import { Schema, model, Document } from 'mongoose';

export interface IReport extends Document {
    identifier: string;
    userId: string;
    username: string;
    reportedUser: string;
    reason: 'Abuse' | 'Spam' | 'Cheating' | 'Toxicity' | string;
    description: string;
    mediaUrl?: string;
    reporter: string;
    createdAt: Date;
    updatedAt: Date;
}

const reportSchema = new Schema<IReport>({
    identifier: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    reportedUser: { type: String, required: true },
    reason: {
        type: String,
        enum: ['Abuse', 'Spam', 'Cheating', 'Toxicity'],
        required: true,
    },
    description: { type: String, required: true },
    mediaUrl: { type: String, required: false },
    reporter: { type: String, required: true },
}, { timestamps: true });

reportSchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

export const Report = model<IReport>('Report', reportSchema);
