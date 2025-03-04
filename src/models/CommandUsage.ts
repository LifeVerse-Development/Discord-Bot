import { Schema, model, Document } from 'mongoose';

export interface ICommandUsage extends Document {
    identifier: string;
    userId: string;
    username: string;
    channelId: string;
    commands: {
        identifier: string;
        commandName: string;
        timestamp: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const commandUsageSchema = new Schema<ICommandUsage>({
    identifier: { type: String, required: true, unique: true },
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    channelId: { type: String, required: true },
    commands: [{
        identifier: { type: String, required: true, unique: true },
        commandName: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    }],
}, { timestamps: true });

commandUsageSchema.pre('save', function(next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

commandUsageSchema.pre('save', function (next) {
    this.commands.forEach((command) => {
        if (!command.identifier) {
            command.identifier = Math.random().toString(36).substring(2, 15);
        }
    });
    next();
});

export const CommandUsage = model<ICommandUsage>('CommandUsage', commandUsageSchema);
