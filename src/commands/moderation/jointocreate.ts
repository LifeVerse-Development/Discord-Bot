import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, VoiceChannel, CategoryChannel } from 'discord.js';
import { Command } from '../../functions/handleCommands';
import { JoinToCreate } from '../../models/JoinToCreate';
import { LogService } from '../../services/logService';

const JoinToCreateCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('jointocreate')
        .setDescription('Manage channels for ticket creation')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-channel')
                .setDescription('Set the voice channel users need to join in order to create a ticket')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The voice channel users need to join')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildVoice),
                )
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('The category in which the user’s private voice channel will be created')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildCategory),
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Shows all channels and users who have created a ticket in them'),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel from which the user should be removed')
                        .setRequired(true),
                )
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to be removed')
                        .setRequired(true),
                ),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({
                content: '⚠️ This command can only be used on a server.',
                ephemeral: true,
            });
            return;
        }

        await interaction.deferReply({ ephemeral: false });

        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'set-channel') {
                const channel = interaction.options.getChannel('channel');
                const category = interaction.options.getChannel('category');

                if (!channel || channel.type !== ChannelType.GuildVoice) {
                    await interaction.editReply({ content: '❌ You can only set a voice channel!' });
                    return;
                }

                if (!category || category.type !== ChannelType.GuildCategory) {
                    await interaction.editReply({ content: '❌ You must select a valid category!' });
                    return;
                }

                const voiceChannel = channel as VoiceChannel;
                const categoryChannel = category as CategoryChannel;

                await JoinToCreate.create({
                    identifier: Math.random().toString(36).substring(2, 15),
                    guildId: interaction.guild.id,
                    channelId: voiceChannel.id,
                    categoryId: categoryChannel.id,
                    userIds: [],
                });

                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('✅ Voice Channel and Category Set!')
                    .setDescription(`The voice channel **${voiceChannel.name}** has been set as the entry channel for ticket creation.\n` +
                        `Tickets will be created in the **${categoryChannel.name}** category.`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'list') {
                const entries = await JoinToCreate.find({ guildId: interaction.guild.id });

                const embed = new EmbedBuilder()
                    .setColor('Yellow')
                    .setTitle('📋 Channel and User List')
                    .setDescription(entries.map(entry => {
                        const users = entry.userIds.join(', ') || 'No users';
                        return `**Channel:** ${entry.channelId} | **Category:** ${entry.categoryId} | **Users:** ${users}`;
                    }).join('\n'))
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'remove') {
                const channel = interaction.options.getChannel('channel');
                const user = interaction.options.getUser('user');

                if (!user) {
                    await interaction.editReply({ content: '❌ You must provide a valid user!' });
                    return;
                }

                if (!channel || channel.type !== ChannelType.GuildVoice) {
                    await interaction.editReply({ content: '❌ You can only remove a user from a voice channel!' });
                    return;
                }

                const voiceChannel = channel as VoiceChannel;

                const entry = await JoinToCreate.findOne({ channelId: voiceChannel.id });
                if (entry) {
                    entry.userIds = entry.userIds.filter(userId => userId !== user.id);
                    await entry.save();

                    await voiceChannel.permissionOverwrites.edit(user.id, {
                        ViewChannel: false,
                    });

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('✅ User Removed!')
                        .setDescription(`The user **${user.username}** has been removed from the voice channel **${voiceChannel.name}**.`)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                } else {
                    await interaction.editReply({ content: '❌ No ticket entry found for this channel.' });
                }
            }
        } catch (error) {
            LogService.error('Error with JoinToCreate command:', error);
            await interaction.editReply({
                content: '❌ An error occurred. Please try again later.',
            });
        }
    },
};

export default JoinToCreateCommand;
