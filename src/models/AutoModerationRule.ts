import { Schema, model, Document } from 'mongoose';

interface IAutoModerationRule extends Document {
    identifier: string;
    guildId: string;
    ruleType: 'badWords' | 'spam' | 'massMentions' | 'capsLock' | string;
    data: string[] | Number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AutoModerationRuleSchema = new Schema<IAutoModerationRule>({
    identifier: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    ruleType: { type: String, required: true, enum: ['badWords', 'spam', 'massMentions', 'capsLock'] },
    data: { type: Schema.Types.Mixed, required: true },
    enabled: { type: Boolean, default: true },
}, { timestamps: true });

AutoModerationRuleSchema.pre('save', function (next) {
    if (!this.identifier) {
        this.identifier = Math.random().toString(36).substring(2, 15);
    }
    next();
});

export const AutoModerationRule = model<IAutoModerationRule>('AutoModerationRule', AutoModerationRuleSchema);
