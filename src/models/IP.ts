import { Schema, model, Document } from 'mongoose';

export interface IIPTrackingDocument extends Document {
    identifier: string;
    userId: string;
    ip: string;
    isBanned: boolean;
    timestamps: Date[];
}

const ipTrackingSchema = new Schema<IIPTrackingDocument>({
    identifier: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    ip: { type: String, required: true },
    isBanned: { type: Boolean, required: false },
    timestamps: { type: [Date], default: [] },
});

ipTrackingSchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

ipTrackingSchema.index({ userId: 1, ip: 1 }, { unique: true });

export const IPTracking = model<IIPTrackingDocument>('IPTracking', ipTrackingSchema);
