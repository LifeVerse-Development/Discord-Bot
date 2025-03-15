import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../functions/handleCommands';
import { Activity } from '../../models/Activity';

const ActivityCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('activity')
        .setDescription('Displays activity data.')
        .addSubcommand(subcommand =>
            subcommand.setName('me').setDescription('Shows your activity.')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('leaderboard').setDescription('Shows the most active users.')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'me') {
            const now = new Date();
            const past30Days = new Date();
            past30Days.setDate(now.getDate() - 30);

            const activities = await Activity.find({
                userId,
                createdAt: { $gte: past30Days }
            });

            if (!activities.length) {
                interaction.reply({ embeds: [new EmbedBuilder().setColor('Random').setDescription('You have no activity records in the last 30 days!')], ephemeral: true });
                return;
            }

            // Count activities per day
            const dailyActivity: Record<string, number> = {};
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(now.getDate() - i);
                const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
                dailyActivity[dateString] = 0;
            }

            activities.forEach(a => {
                const date = new Date(a.createdAt).toISOString().split('T')[0];
                if (dailyActivity[date] !== undefined) {
                    dailyActivity[date]++;
                }
            });

            // Generate chart using QuickChart
            const labels = Object.keys(dailyActivity).reverse();
            const dataPoints = Object.values(dailyActivity).reverse();

            const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Activity',
                        data: dataPoints,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    }
                }
            }))}`;

            const embed = new EmbedBuilder()
                .setColor('Random')
                .setTitle(`${interaction.user.username}'s Activity in the Last 30 Days`)
                .setImage(chartUrl)
                .setThumbnail(interaction.user.displayAvatarURL());

            interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (subcommand === 'leaderboard') {
            const leaderboard = await Activity.aggregate([
                { $group: { _id: '$userId', username: { $first: '$username' }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            if (!leaderboard.length) {
                interaction.reply({ embeds: [new EmbedBuilder().setColor('Random').setDescription('No activity records on the server yet!')], ephemeral: true });
                return;
            }

            const leaderboardList = leaderboard.map((user, i) => `**${i + 1}.** <@${user._id}> - **${user.count}** activities`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('Random')
                .setTitle('🏆 Activity Leaderboard')
                .setDescription(leaderboardList);

            interaction.reply({ embeds: [embed] });
            return;
        }
    },
};

export default ActivityCommand;
