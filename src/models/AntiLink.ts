import { Schema, model, Document } from 'mongoose';

export interface IAntiLink extends Document {
    identifier: string;
    guildId: string;
    guildName: string;
    enabled: boolean;
    allowedChannels: string[];
    createdAt: Date;
    updatedAt: Date;
    isAllowedInChannel(channelId: string): Boolean;
}

const AntiLinkSchema = new Schema<IAntiLink>({
    identifier: { type: String, required: true, unique: true },
    guildId: { type: String, required: true, unique: true },
    guildName: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    allowedChannels: { type: [String], default: [] },
}, { timestamps: true });

AntiLinkSchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

AntiLinkSchema.methods.isAllowedInChannel = function (channelId: string): boolean {
    return this.allowedChannels.includes(channelId);
};

export const AntiLink = model<IAntiLink>('AntiLink', AntiLinkSchema);
