import { Client, Message, EmbedBuilder, VoiceState } from "discord.js";
import { LevelUtil } from "../utils/levelUtil";
import { Level } from "../models/Level";
import { LogService } from '../services/logService';

export const handleXPListener = (client: Client) => {
    client.on('messageCreate', async (message: Message) => {
        if (message.author.bot) return;

        try {
            const userId = message.author.id;
            const xpEarned = Math.floor(Math.random() * 10) + 5;

            await LevelUtil.giveUserXP(userId, xpEarned);

            let userData = await Level.findOne({ userId });
            if (!userData) {
                userData = new Level({
                    userId,
                    xp: xpEarned,
                    level: 0,
                    levelUpCount: 0,
                    xpHistory: [{
                        date: new Date(),
                        xpEarned
                    }],
                });

                await userData.save();
            } else {
                userData.xp += xpEarned;
                userData.xpHistory.push({
                    date: new Date(),
                    xpEarned
                });
                await userData.save();
            }

            if (Math.random() < 0.1) {
                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('🎉 **XP Earned!** 🎉')
                    .setDescription(
                        `💪 **You’ve earned** **${xpEarned}** XP! 🎯\n\n` +
                        `Keep chatting and leveling up! 🚀\n\n` +
                        `Level up and unlock new features! 🔓`
                    )
                    .setFooter({ text: 'Keep going and level up! 🏅' })
                    .setTimestamp();

                const replyMessage = await message.reply({ embeds: [embed] });

                setTimeout(() => {
                    replyMessage.delete();
                }, 5000);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            LogService.error(`Error: ${errorMessage}`);
        }
    });

    client.on('interactionCreate', async (interaction: any) => {
        if (!interaction.isCommand() || interaction.user.bot) return;

        try {
            const userId = interaction.user.id;
            const xpEarned = Math.floor(Math.random() * 10) + 5;

            await LevelUtil.giveUserXP(userId, xpEarned);

            let userData = await Level.findOne({ userId });
            if (!userData) {
                userData = new Level({
                    userId,
                    xp: xpEarned,
                    level: 0,
                    levelUpCount: 0,
                    xpHistory: [{
                        date: new Date(),
                        xpEarned
                    }],
                });

                await userData.save();
            } else {
                userData.xp += xpEarned;
                userData.xpHistory.push({
                    date: new Date(),
                    xpEarned
                });
                await userData.save();
            }

            if (Math.random() < 0.1) {
                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('🎉 **XP Earned!** 🎉')
                    .setDescription(
                        `💪 **You’ve earned** **${xpEarned}** XP! 🎯\n\n` +
                        `Keep interacting and leveling up! 🚀\n\n` +
                        `Level up and unlock new features! 🔓`
                    )
                    .setFooter({ text: 'Keep going and level up! 🏅' })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            LogService.error(`Error: ${errorMessage}`);
        }
    });

    client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
        if (oldState.channelId === newState.channelId) return;

        if (newState.member && !newState.member.user.bot && newState.channelId) {
            try {
                const userId = newState.member.id;
                const xpEarned = Math.floor(Math.random() * 10) + 5;

                await LevelUtil.giveUserXP(userId, xpEarned);

                let userData = await Level.findOne({ userId });
                if (!userData) {
                    userData = new Level({
                        userId,
                        xp: xpEarned,
                        level: 0,
                        levelUpCount: 0,
                        xpHistory: [{
                            date: new Date(),
                            xpEarned
                        }],
                    });

                    await userData.save();
                } else {
                    userData.xp += xpEarned;
                    userData.xpHistory.push({
                        date: new Date(),
                        xpEarned
                    });
                    await userData.save();
                }

                if (Math.random() < 0.1) {
                    const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('🎉 **XP Earned!** 🎉')
                        .setDescription(
                            `💪 **You’ve earned** **${xpEarned}** XP! 🎯\n\n` +
                            `Keep engaging in voice chats and leveling up! 🚀\n\n` +
                            `Level up and unlock new features! 🔓`
                        )
                        .setFooter({ text: 'Keep going and level up! 🏅' })
                        .setTimestamp();

                    const channel = newState.guild.channels.cache.get(newState.channelId);
                    if (channel && channel.isTextBased()) {
                        await channel.send({ embeds: [embed] });
                    }
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                LogService.error(`Error: ${errorMessage}`);
            }
        }
    });
};
