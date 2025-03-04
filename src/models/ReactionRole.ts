import { Schema, model, Document } from 'mongoose';

export interface IReactionRoleLog {
    identifier: string;
    userId: string;
    userName: string;
    roleId: string;
    roleName: string;
    action: 'added' | 'removed';
    createdAt: Date;
    updatedAt: Date;
}

export interface IReactionRole extends Document {
    identifier: string;
    guildId: string;
    messageId: string;
    channelId: string;
    roles: Array<{
        emoji: string;
        roleId: string;
    }>;
    title: string;
    description: string;
    logs: IReactionRoleLog[];
    createdAt: Date;
    updatedAt: Date;
}

const reactionRoleSchema: Schema = new Schema<IReactionRole>(
    {
        identifier: { type: String, required: true, unique: true },
        guildId: { type: String, required: true },
        messageId: { type: String, required: true },
        channelId: { type: String, required: true },
        roles: [
            {
                emoji: { type: String, required: true },
                roleId: { type: String, required: true },
            },
        ],
        title: { type: String, required: true },
        description: { type: String, required: true },
        logs: [
            {
                identifier: { type: String, required: true },
                userId: { type: String, required: true },
                userName: { type: String },
                roleId: { type: String, required: true },
                roleName: { type: String },
                action: { type: String, enum: ['added', 'removed'], required: true },
                createdAt: { type: Date, default: Date.now },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

export const ReactionRole = model<IReactionRole>('ReactionRole', reactionRoleSchema);
