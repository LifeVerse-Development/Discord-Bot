import { Schema, model, Document } from 'mongoose';

export interface IRequest extends Document {
    identifier: string;
    url: string;
    type: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const requestSchema = new Schema<IRequest>({
    identifier: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, required: true },
}, { timestamps: true });

requestSchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

export const Request = model<IRequest>('Request', requestSchema);
