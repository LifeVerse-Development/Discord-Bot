import { Schema, model, Document } from 'mongoose';

export interface ITicketSchema extends Document {
    identifier: string;
    guildId: string;
    category: string;
    channel: string;
    role: string;
    advisorRole: string;
    logsId: string;
    ownerId: string;
    archiveCategory: string;
    createdAt: Date;
    updatedAt: Date;
}

const ticketSchema = new Schema<ITicketSchema>({
    identifier: { type: String, required: true, unique: true },
    guildId: { type: String, default: '' },
    category: { type: String, required: true },
    channel: { type: String, required: true },
    role: { type: String, required: true },
    advisorRole: { type: String, required: false },
    logsId: { type: String, required: true },
    ownerId: { type: String },
    archiveCategory: { type: String, required: true },
}, { timestamps: true });

ticketSchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

export const Ticket = model<ITicketSchema>('Ticket', ticketSchema);
