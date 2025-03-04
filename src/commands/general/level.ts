import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../functions/handleCommands';
import { LevelUtil } from '../../utils/levelUtil';

const LevelCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Check your level and XP stats.')
        .addSubcommand(subcommand =>
            subcommand.setName('current').setDescription('Check your current level and XP.')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('progress').setDescription('Check your progress towards the next level.')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('leaderboard').setDescription('View the leaderboard of top-level users in the server.')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'current') {
            const levelData = await LevelUtil.getUserLevelData(userId);
            if (!levelData) {
                interaction.reply({ embeds: [new EmbedBuilder().setColor('Random').setDescription('No level data found.')] });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('Random')
                .setTitle(`${interaction.user.username}'s Level`)
                .setDescription(`Your current level is **${levelData.level}**`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields({ name: 'XP', value: `${levelData.xp} / ${levelData.nextLevelXp}`, inline: true });

            interaction.reply({ embeds: [embed] });
            return;
        }

        if (subcommand === 'progress') {
            const levelData = await LevelUtil.getUserLevelData(userId);
            if (!levelData) {
                interaction.reply({ embeds: [new EmbedBuilder().setColor('Random').setDescription('No level data found.')] });
                return;
            }

            const xpNeeded = levelData.nextLevelXp - levelData.xp;
            const progress = Math.floor((levelData.xp / levelData.nextLevelXp) * 100);
            const embed = new EmbedBuilder()
                .setColor('Random')
                .setTitle(`${interaction.user.username}'s Progress`)
                .addFields(
                    { name: 'Current Level', value: `${levelData.level}`, inline: true },
                    { name: 'XP to Next Level', value: `${xpNeeded}`, inline: true },
                    { name: 'Progress', value: `${progress}%`, inline: true }
                );

            interaction.reply({ embeds: [embed] });
            return;
        }

        if (subcommand === 'leaderboard') {
            const leaderboard = await LevelUtil.getLeaderboardData();
            if (!leaderboard.length) {
                interaction.reply({ embeds: [new EmbedBuilder().setColor('Random').setDescription('No leaderboard data found.')] });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('Random')
                .setTitle('Leaderboard: Top Users')
                .setDescription(leaderboard.map((user, index) => `**${index + 1}.** <@${user.userId}> - Level: **${user.level}**, XP: **${user.xp}**`).join('\n'));

            interaction.reply({ embeds: [embed] });
            return;
        }
    },
};

export default LevelCommand;
