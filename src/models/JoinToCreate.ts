import { Schema, model, Document } from 'mongoose';

interface IJoinToCreate extends Document {
    identifier: string;
    guildId?: string;
    categoryId: string;
    channelId: string;
    userIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

const JoinToCreateSchema = new Schema<IJoinToCreate>({
    identifier: { type: String, required: true, unique: true },
    guildId: { type: String, required: false },
    categoryId: { type: String, required: true },
    channelId: { type: String, required: true },
    userIds: { type: [String], required: true, default: [] },
}, { timestamps: true });

JoinToCreateSchema.methods.addUser = async function(userId: string) {
    if (!this.userIds.includes(userId)) {
        this.userIds.push(userId);
        await this.save();
    }
};

JoinToCreateSchema.methods.getUsersByChannel = async function(channelId: string) {
    const channel = await JoinToCreate.findOne({ channelId });
    if (channel) {
        return channel.userIds;
    }
    return [];
};

export const JoinToCreate = model<IJoinToCreate>('JoinToCreate', JoinToCreateSchema);
