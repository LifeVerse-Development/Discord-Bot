import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Guild } from 'discord.js';
import { Command } from '../../functions/handleCommands';
import { Stat } from '../../models/Stats';
import { updateStats } from '../../events/stats';

const validTypes = [
    'members', 'online', 'boosts', 'voice', 
    'text-activity', 'roles', 'emojis', 
    'shards', 'bot-usage', 'active-polls',
    'total-channels', 'server-tier', 'members-by-role'
];

const StatsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Manage server statistics.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set a statistic channel.')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The statistic type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Total Members', value: 'members' },
                            { name: 'Online Members', value: 'online' },
                            { name: 'Server Boosts', value: 'boosts' },
                            { name: 'In Voice Channels', value: 'voice' },
                            { name: 'Text Activity', value: 'text-activity' },
                            { name: 'Roles', value: 'roles' },
                            { name: 'Emojis', value: 'emojis' },
                            { name: 'Shards', value: 'shards' },
                            { name: 'Bot Usage', value: 'bot-usage' },
                            { name: 'Active Polls', value: 'active-polls' },
                            { name: 'Total Channels', value: 'total-channels' },
                            { name: 'Server Tier', value: 'server-tier' },
                            { name: 'Members by Role', value: 'members-by-role' }
                        )
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to display the statistic')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a statistic channel.')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The statistic type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Total Members', value: 'members' },
                            { name: 'Online Members', value: 'online' },
                            { name: 'Server Boosts', value: 'boosts' },
                            { name: 'In Voice Channels', value: 'voice' },
                            { name: 'Text Activity', value: 'text-activity' },
                            { name: 'Roles', value: 'roles' },
                            { name: 'Emojis', value: 'emojis' },
                            { name: 'Shards', value: 'shards' },
                            { name: 'Bot Usage', value: 'bot-usage' },
                            { name: 'Active Polls', value: 'active-polls' },
                            { name: 'Total Channels', value: 'total-channels' },
                            { name: 'Server Tier', value: 'server-tier' },
                            { name: 'Members by Role', value: 'members-by-role' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all active statistic channels.')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild as Guild;
        const guildId = guild.id;

        if (subcommand === 'set') {
            const type = interaction.options.getString('type', true);
            const channel = interaction.options.getChannel('channel', true);

            console.log('Subcommand "set" ausgeführt');
            console.log(`Typ: ${type}, Kanal: ${channel.id}`);

            if (!validTypes.includes(type)) {
                interaction.reply({ content: `⚠️ Invalid statistic type!`, ephemeral: true });
                console.log('Fehler: Ungültiger statistischer Typ');
                return;
            }

            const existing = await Stat.findOne({ guildId, type });
            if (existing) {
                interaction.reply({ content: `⚠️ A channel for **${type}** is already set!`, ephemeral: true });
                console.log('Fehler: Es ist bereits ein Kanal für diesen Typ gesetzt');
                return;
            }

            await Stat.create({ identifier: Math.random().toString(36).substring(2, 15), guildId, type, channelId: channel.id });

            await updateStats(interaction.client);

            interaction.reply({ content: `✅ **${type}** statistics will now be displayed in <#${channel.id}>.`, ephemeral: true });
            console.log(`Erfolg: **${type}** Statistik wird nun in <#${channel.id}> angezeigt`);
            return;
        }

        if (subcommand === 'remove') {
            const type = interaction.options.getString('type', true);

            if (!validTypes.includes(type)) {
                interaction.reply({ content: `⚠️ Invalid statistic type!`, ephemeral: true });
                return;
            }

            const existing = await Stat.findOneAndDelete({ guildId, type });
            if (!existing) {
                interaction.reply({ content: `⚠️ No channel is set for **${type}**.`, ephemeral: true });
                return;
            }

            await updateStats(interaction.client);

            interaction.reply({ content: `🗑️ Removed **${type}** statistics channel.`, ephemeral: true });
            return;
        }

        if (subcommand === 'list') {
            const stats = await Stat.find({ guildId });
            if (!stats.length) {
                interaction.reply({ content: '⚠️ No statistic channels are set.', ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('📊 Active Statistic Channels')
                .setDescription(stats.map(stat => {
                    const channel = interaction.guild?.channels.cache.get(stat.channelId);
                    return `**${stat.type}** → <#${stat.channelId}> (${channel?.name || 'Deleted Channel'})`;
                }).join('\n'));

            interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
    }
};

export default StatsCommand;
