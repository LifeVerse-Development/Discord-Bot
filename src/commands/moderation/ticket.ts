import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, CategoryChannel, Role, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType, Message, MessageComponentInteraction } from 'discord.js';
import { Command } from '../../functions/handleCommands';
import { Ticket } from '../../models/Ticket';

const TicketCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Setup the ticket system.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the ticket system for this server.')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel where the ticket panel will be sent.')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option
                        .setName('category')
                        .setDescription('The category where tickets will be created.')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role that will be pinged when a ticket is created.')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('advisorrole')
                        .setDescription('The role that can claim and resolve tickets.')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option
                        .setName('logs')
                        .setDescription('The channel where ticket transcripts will be sent.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option
                        .setName('archivecategory')
                        .setDescription('The category where archived tickets will be moved.')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('Send a custom ticket panel.')
                .addStringOption(option =>
                    option
                        .setName('embed_title')
                        .setDescription('The title of the embed.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('embed_description')
                        .setDescription('The description of the embed.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('embed_image')
                        .setDescription('The URL of the image for the embed.')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('embed_thumbnail')
                        .setDescription('The label for the button.')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('button_text')
                        .setDescription('The text on the button')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('button_emoji')
                        .setDescription('The emoji for the button')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('button_color')
                        .setDescription('The color of the button')
                        .addChoices(
                            { name: 'Primary', value: 'Primary' },
                            { name: 'Danger', value: 'Danger' },
                            { name: 'Secondary', value: 'Secondary' },
                            { name: 'Success', value: 'Success' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists all open ticket channels.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deletes a ticket message.')
                .addStringOption(option =>
                    option
                        .setName('ticket_id')
                        .setDescription('The message ID of the ticket to delete.')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            if (!interaction.guild) {
                await interaction.reply({ content: `This command can only be used in a server.`, ephemeral: true });
                return;
            }

            const guildId = interaction.guild.id;
            const ticketChannel = interaction.options.getChannel('channel') as TextChannel;
            const ticketCategory = interaction.options.getChannel('category') as CategoryChannel;
            const ticketRole = interaction.options.getRole('role') as Role;
            const advisorRole = interaction.options.getRole('advisorrole') as Role;
            const logsChannel = interaction.options.getChannel('logs') as TextChannel;
            const archiveCategory = interaction.options.getChannel('archivecategory') as CategoryChannel;

            try {
                const existingTicket = await Ticket.findOne({ guildId });

                if (existingTicket) {
                    await interaction.reply({ content: `The ticket system is already setup for this server.`, ephemeral: true });
                    return;
                }

                const newTicketSettings = new Ticket({
                    identifier: Math.random().toString(36).substring(2, 15),
                    guildId,
                    category: ticketCategory.id,
                    channel: ticketChannel.id,
                    role: ticketRole.id,
                    advisorRole: advisorRole.id,
                    logsId: logsChannel.id,
                    archiveCategory: archiveCategory.id
                });

                await newTicketSettings.save();

                await interaction.reply({ content: `Ticket system has been set up!\n\n**Panel Channel**: ${ticketChannel}\n**Ticket Category**: ${ticketCategory.name}\n**Support Role**: ${ticketRole.name}\n**Advisor Role**: ${advisorRole.name}\n**Logs Channel**: ${logsChannel}\n**Archive Channel**: ${archiveCategory}`, ephemeral: true });

            } catch (error) {
                console.error(`Error setting up ticket system: `, error);
                await interaction.reply({ content: `There was an error setting up the ticket system. Please try again later.`, ephemeral: true });
            }
        } 
        
        if (subcommand === 'panel') {
            const guildId = interaction.guild?.id;

            const ticketSettings = await Ticket.findOne({ guildId });

            if (!ticketSettings) {
                await interaction.reply({ content: `The ticket system is not setup for this server.`, ephemeral: true });
                return;
            }

            const ticketChannelId = ticketSettings?.channel || '';
            const ticketChannel = interaction.guild!.channels.cache.get(ticketChannelId) as TextChannel;

            const embedTitle = interaction.options.getString('embed_title')!;
            const embedDescription = interaction.options.getString('embed_description')!;
            const embedImage = interaction.options.getString('embed_image')!;
            const embedThumbnail = interaction.options.getString('embed_thumbnail')!;
            const buttonText = interaction.options.getString('button_text')!;
            const buttonEmoji = interaction.options.getString('button_emoji')!;
            const buttonColor = interaction.options.getString('button_color') || 'Primary';

            const embed = new EmbedBuilder()
                .setTitle(embedTitle)
                .setDescription(embedDescription)
                .setTimestamp();

            if (embedImage) embed.setImage(embedImage);
            if (embedThumbnail) embed.setThumbnail(embedThumbnail);

            const button = new ButtonBuilder()
                .setLabel(buttonText || 'Create Ticket')
                .setStyle(ButtonStyle[buttonColor.toUpperCase() as keyof typeof ButtonStyle] ?? ButtonStyle.Primary)
                .setCustomId('create_ticket');

            if (buttonEmoji) {
                button.setEmoji(buttonEmoji);
            }

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

            if (!ticketChannel.permissionsFor(interaction.client.user!)?.has(PermissionFlagsBits.SendMessages)) {
                console.error('Bot does not have permission to send messages in the ticket channel.');
                await interaction.reply({ content: `I don't have permission to send messages in the ticket channel.`, ephemeral: true });
                return;
            }

            try {
                await interaction.deferReply({ ephemeral: true });
                await ticketChannel.send({ embeds: [embed], components: [row] });
                await interaction.followUp({ content: `Ticket panel has been sent to ${ticketChannel}.`, ephemeral: true });
            } catch (error) {
                console.error(`Error sending ticket panel:`, error);
                await interaction.followUp({ content: `There was an error sending the ticket panel. Please try again later.`, ephemeral: true });
            }
        }
        
        if (subcommand === 'list') {
            try {
                if (!interaction.guild) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error')
                        .setDescription('This command can only be used in a server.')
                        .setTimestamp();
            
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return;
                }
        
                const ticketSettings = await Ticket.findOne({ guildId: interaction.guild.id });
        
                if (!ticketSettings) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error')
                        .setDescription('The ticket system is not set up for this server.')
                        .setTimestamp();
        
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return;
                }
        
                const ticketCategory = interaction.guild.channels.cache.get(ticketSettings.category) as CategoryChannel;
        
                if (!ticketCategory) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error')
                        .setDescription('Ticket category not found. Please check the configuration.')
                        .setTimestamp();
        
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return;
                }
        
                const ticketChannels = Array.from(ticketCategory.children.cache.values()).filter((channel): channel is TextChannel => channel.type === ChannelType.GuildText);
        
                if (ticketChannels.length === 0) {
                    const embed = new EmbedBuilder()
                        .setColor('Yellow')
                        .setTitle('No Tickets Found')
                        .setDescription('There are no ticket channels in the category.')
                        .setTimestamp();
        
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return;
                }
        
                let ticketList = '';
                let ticketIdCounter = 1;
        
                for (const channel of ticketChannels) {
                    const messages = await channel.messages.fetch({ limit: 10 });
        
                    const embedMessage = messages.find(msg => msg.embeds.length > 0);
                    if (embedMessage) {
                        const embedTitle = embedMessage.embeds[0]?.title || 'No Title';
                        ticketList += `• ${embedTitle} (Message ID: ${embedMessage.id})\n`;
                    }
        
                    ticketIdCounter++;
                }
        
                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('Open Tickets')
                    .setDescription(ticketList || 'No tickets with valid embeds found in the category.')
                    .setTimestamp();
        
                await interaction.reply({ embeds: [embed], ephemeral: true });
        
            } catch (error) {
                console.error('Error fetching tickets:', error);
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error')
                    .setDescription('An error occurred while fetching the tickets. Please try again later.')
                    .setTimestamp();
        
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
        
        if (subcommand === 'delete') {
            const ticketId = interaction.options.getString('ticket_id');
            const deleteReason = interaction.options.getString('reason')!;
        
            if (!ticketId) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error')
                    .setDescription('Please provide a valid ticket ID to delete.')
                    .setTimestamp();
        
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
        
            if (!interaction.guild) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error')
                    .setDescription('This command can only be used in a server.')
                    .setTimestamp();
        
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
        
            const ticketSettings = await Ticket.findOne({ guildId: interaction.guild.id });
        
            if (!ticketSettings) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error')
                    .setDescription('The ticket system is not set up for this server.')
                    .setTimestamp();
        
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
        
            const logsChannel = interaction.guild.channels.cache.get(ticketSettings.logsId) as TextChannel;
        
            if (!logsChannel) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error')
                    .setDescription('Logs channel not found. Please contact an admin.')
                    .setTimestamp();
        
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
        
            const ticketMessage = await logsChannel.messages.fetch(ticketId).catch(() => null);
        
            if (!ticketMessage) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error')
                    .setDescription('Ticket message not found. Please check the message ID.')
                    .setTimestamp();
        
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
        
            const confirmButton = new ButtonBuilder()
                .setCustomId('confirmDelete')
                .setLabel('Confirm Deletion')
                .setStyle(ButtonStyle.Danger);
        
            const cancelButton = new ButtonBuilder()
                .setCustomId('cancelDelete')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary);
        
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);
        
            const embed = new EmbedBuilder()
                .setColor('Random')
                .setTitle('Confirmation Required')
                .setDescription(`Are you sure you want to delete the ticket with ID **${ticketId}**?`)
                .setFooter({ text: `Executed by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
        
            const replyMessage = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true, fetchReply: true });
        
            if (replyMessage && replyMessage instanceof Message) {
                const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
                const collector = replyMessage.createMessageComponentCollector({ filter, time: 15000 });
        
                collector.on('collect', async (i) => {
                    if (i.customId === 'confirmDelete') {
                        try {
                            await ticketMessage.delete();
        
                            const successEmbed = new EmbedBuilder()
                                .setColor('Random')
                                .setTitle('Ticket Deleted')
                                .setDescription(`The ticket with ID **${ticketId}** has been successfully deleted. Reason: ${deleteReason}`)
                                .setFooter({ text: `Executed by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                                .setTimestamp();
        
                            await i.update({ embeds: [successEmbed], components: [] });
        
                            const logChannel = interaction.guild?.channels.cache.find(ch => ch.name === 'logging');
                            if (logChannel && logChannel.isTextBased()) {
                                const logEmbed = new EmbedBuilder()
                                    .setColor('Random')
                                    .setTitle('Ticket Deleted')
                                    .addFields(
                                        { name: 'Ticket ID', value: ticketId },
                                        { name: 'Deleted by', value: interaction.user.tag },
                                        { name: 'Reason', value: deleteReason }
                                    )
                                    .setFooter({ text: `Ticket deleted at`, iconURL: interaction.user.displayAvatarURL() })
                                    .setTimestamp();
                                await logChannel.send({ embeds: [logEmbed] });
                            }
        
                        } catch (error) {
                            console.error('Error deleting the ticket:', error);
                            const errorEmbed = new EmbedBuilder()
                                .setColor('Random')
                                .setTitle('Error')
                                .setDescription('An error occurred while deleting the ticket. Please try again later.')
                                .setFooter({ text: `Executed by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                                .setTimestamp();
                            await i.update({ embeds: [errorEmbed], components: [] });
                        }
                    } else if (i.customId === 'cancelDelete') {
                        const cancelEmbed = new EmbedBuilder()
                            .setColor('Random')
                            .setTitle('Deletion Cancelled')
                            .setDescription('The ticket deletion has been cancelled.')
                            .setFooter({ text: `Executed by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                            .setTimestamp();
        
                        await i.update({ embeds: [cancelEmbed], components: [] });
                    }
                });
        
                collector.on('end', (collected) => {
                    if (collected.size === 0) {
                        const timeoutEmbed = new EmbedBuilder()
                            .setColor('Random')
                            .setTitle('Timeout')
                            .setDescription('The ticket deletion was not confirmed and has been cancelled.')
                            .setFooter({ text: `Executed by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                            .setTimestamp();
        
                        interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                    }
                });
            }
        }
    }
};

export default TicketCommand;
