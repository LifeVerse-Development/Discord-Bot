import { Client, Message, VoiceState, Interaction, GuildMember, PartialGuildMember } from 'discord.js';
import { Activity } from '../models/Activity';
import { LogService } from '../services/logService';

export const handleActivityTracking = (client: Client) => {
    client.on('messageCreate', async (message: Message) => {
        try {
            if (message.author.bot) return;

            await Activity.create({ identifier: Math.random().toString(36).substring(2, 15), userId: message.author.id, username: message.author.username, type: 'message' });
            LogService.info(`📨 Message activity logged for ${message.author.tag}`);
        } catch (error) {
            LogService.error(`❌ Error logging message activity: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
        try {
            if (!newState.member) return;
            const userId = newState.member.user.id;
            const username = newState.member.user.username;

            if (!oldState.channel && newState.channel) {
                await Activity.create({ identifier: Math.random().toString(36).substring(2, 15), userId, username, type: 'voice_join' });
                LogService.info(`🎤 ${username} joined a voice channel.`);
            } else if (oldState.channel && !newState.channel) {
                await Activity.create({ identifier: Math.random().toString(36).substring(2, 15), userId, username, type: 'voice_leave' });
                LogService.info(`🎤 ${username} left a voice channel.`);
            }
        } catch (error) {
            LogService.error(`❌ Error logging voice activity: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    client.on('interactionCreate', async (interaction: Interaction) => {
        try {
            if (!interaction.isChatInputCommand() || interaction.user.bot) return;

            await Activity.create({ identifier: Math.random().toString(36).substring(2, 15), userId: interaction.user.id, username: interaction.user.username, type: `command:${interaction.commandName}` });
            LogService.info(`🔧 Command ${interaction.commandName} used by ${interaction.user.tag}`);
        } catch (error) {
            LogService.error(`❌ Error logging command activity: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    client.on('guildMemberUpdate', async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
        try {
            if (oldMember.nickname !== newMember.nickname) {
                await Activity.create({ identifier: Math.random().toString(36).substring(2, 15), userId: newMember.id, username: newMember.user.username, type: 'nickname_change' });
                LogService.info(`🔄 ${newMember.user.tag} changed their nickname.`);
            }
        } catch (error) {
            LogService.error(`❌ Error logging nickname change: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
};
