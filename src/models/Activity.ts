import { Schema, model, Document } from 'mongoose';

export interface IActivity extends Document {
    identifier: string;
    userId: string;
    username: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
    identifier: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    type: { type: String, required: true },
}, { timestamps: true });

ActivitySchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

export const Activity = model<IActivity>('Activity', ActivitySchema);
