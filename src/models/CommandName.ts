import { Schema, model, Document } from 'mongoose';

export interface ICommandName extends Document {
    identifier: string;
    commandName: string;
    users: {
        identifier: string;
        userId: string;
        username: string;
        timestamp: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const commandNameSchema = new Schema<ICommandName>({
    identifier: { type: String, required: true, unique: true },
    commandName: { type: String, required: true, unique: true },
    users: [{
        identifier: { type: String, required: true, unique: true },
        userId: { type: String, required: true },
        username: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

commandNameSchema.pre('save', function(next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

commandNameSchema.pre('save', function (next) {
    this.users.forEach((user) => {
        if (!user.identifier) {
            user.identifier = Math.random().toString(36).substring(2, 15);
        }
    });

    const userIds = this.users.map(user => user.userId);
    this.users = this.users.filter((user, index) => userIds.indexOf(user.userId) === index);
    next();
});

export const CommandName = model<ICommandName>('CommandName', commandNameSchema);
