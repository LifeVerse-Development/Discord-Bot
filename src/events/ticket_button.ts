import { ButtonBuilder, TextChannel, CategoryChannel, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonInteraction, ButtonStyle, ChannelType, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';
import * as discordTranscripts from "discord-html-transcripts";
import { Ticket } from '../models/Ticket';
import { UuidUtil } from '../utils/uuidUtil';
import { LogService } from '../services/logService';

// Handle Ticket Creation
export const handleCreateTicketButton = async (interaction: ButtonInteraction) => {
    if (!interaction.guild) return;

    if (interaction.customId !== 'create_ticket') return;

    try {
        const ticketSettings = await Ticket.findOne({ guildId: interaction.guild.id });

        if (!ticketSettings) {
            await interaction.reply({ content: `❌ The ticket system is not set up for this server.`, ephemeral: true });
            return;
        }

        const ticketCategory = interaction.guild.channels.cache.get(ticketSettings.category) as CategoryChannel;
        const supportRole = interaction.guild.roles.cache.get(ticketSettings.role);
        const advisorRole = interaction.guild.roles.cache.get(ticketSettings.advisorRole);

        if (!supportRole || !advisorRole) {
            await interaction.reply({ content: `❌ The required roles for the ticket system are missing.`, ephemeral: true });
            return;
        }

        const ticketChannel = await interaction.guild.channels.create({
            name: `┠${interaction.user.username}-ticket-${UuidUtil.generateId().substring(0, 5)}`,
            type: ChannelType.GuildText,
            parent: ticketCategory.id,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks,
                    ],
                },
                {
                    id: supportRole.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ManageChannels,
                    ],
                },
                {
                    id: advisorRole.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ],
        });

        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(`🎟️ Ticket Created`)
            .setDescription(`Please wait, the staff team will assist you shortly.\n\nIn the meantime, please explain your issue in detail.`)
            .addFields(
                { name: 'Identifier', value: `||${ticketSettings.identifier}||`, inline: true },
                { name: 'Claimed by:', value: 'No one yet.', inline: true },
                { name: 'Claim Reason:', value: 'Not provided yet.', inline: true }
            )
            .setTimestamp();

        const claimButton = new ButtonBuilder()
            .setCustomId('claim_ticket')
            .setLabel('🎯 Claim Ticket')
            .setStyle(ButtonStyle.Primary);

        const archiveButton = new ButtonBuilder()
            .setCustomId('archive_ticket')
            .setLabel('📦 Archive Ticket')
            .setStyle(ButtonStyle.Secondary);

        const closeButton = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('🚪 Close Ticket')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(claimButton, archiveButton, closeButton);

        if (ticketChannel instanceof TextChannel) {
            await ticketChannel.send({
                content: `${advisorRole}`,
                embeds: [embed],
                components: [row],
            });
        }

        const newTicket = new Ticket({
            identifier: Math.random().toString(36).substring(2, 15),
            guildId: interaction.guild.id,
            category: ticketSettings.category,
            archiveCategory: ticketSettings.archiveCategory,
            channel: ticketChannel.id,
            role: ticketSettings.role,
            advisorRole: ticketSettings.advisorRole,
            logsId: ticketSettings.logsId,
            ownerId: interaction.user.id
        });
        
        await newTicket.save();

        await interaction.reply({ content: `✅ Ticket has been created: ${ticketChannel}`, ephemeral: true });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        LogService.error(`Error creating ticket: ${errorMessage}`);
        await interaction.reply({ content: `❌ There was an error creating a ticket. Please try again later.`, ephemeral: true });
    }
};

// Handle ticket claim
export const handleClaimTicketButton = async (interaction: ButtonInteraction) => {
    if (!interaction.guild) return;

    if (interaction.customId !== 'claim_ticket') return;

    try {
        const ticketSettings = await Ticket.findOne({ guildId: interaction.guild.id });
        if (!ticketSettings) {
            if (!interaction.replied) {
                await interaction.reply({ content: `❌ The ticket system is not set up for this server.`, ephemeral: true });
            }
            return;
        }

        const ticketChannel = interaction.channel as TextChannel;
        const supportRole = interaction.guild.roles.cache.get(ticketSettings.role);
        const advisorRole = interaction.guild.roles.cache.get(ticketSettings.advisorRole);

        if (!supportRole || !advisorRole) {
            if (!interaction.replied) {
                await interaction.reply({ content: `❌ The required roles for the ticket system are missing.`, ephemeral: true });
            }
            return;
        }

        const member = interaction.guild.members.cache.get(interaction.user.id);
        const userRoles = member?.roles.cache;

        const hasPermission = userRoles?.some(role => role.position >= advisorRole.position);

        if (!hasPermission) {
            if (!interaction.replied) {
                await interaction.reply({ content: `❌ You need a role equal to or higher than Customer Advisor to claim this ticket.`, ephemeral: true });
            }
            return;
        }

        const userHasClaimed = ticketChannel.permissionOverwrites.cache.has(interaction.user.id);
        if (userHasClaimed) {
            if (!interaction.replied) {
                await interaction.reply({ content: `❌ You have already claimed this ticket.`, ephemeral: true });
            }
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('claim_ticket_modal')
            .setTitle('📝 Reason for Claim')
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('claim_reason')
                        .setLabel('Why are you claiming this ticket?')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                )
            );

        try {
            await interaction.showModal(modal);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            LogService.error(`Error showing modal: ${errorMessage}`);
            if (!interaction.replied) {
                await interaction.reply({ content: `❌ There was an error showing the modal. Please try again later.`, ephemeral: true });
            }
            return;
        }

        const filter = (i: ModalSubmitInteraction) => i.user.id === interaction.user.id;
        let modalInteraction: ModalSubmitInteraction | null = null;
        try {
            modalInteraction = await interaction.awaitModalSubmit({ filter, time: 60000 });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            LogService.error(`Error awaiting modal submit: ${errorMessage}`);
        }

        if (!modalInteraction) {
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ You did not provide a reason in time.', ephemeral: true });
            }
            return;
        }

        const claimReason = modalInteraction.fields.getTextInputValue('claim_reason');

        try {
            await ticketChannel.permissionOverwrites.edit(interaction.user.id, {
                SendMessages: true,
                ViewChannel: true,
            });

            const claimedRole = ticketChannel.permissionOverwrites.cache.find(perm => perm.id === supportRole.id && perm.allow.has(PermissionFlagsBits.SendMessages));

            if (!claimedRole) {
                await ticketChannel.permissionOverwrites.edit(supportRole.id, {
                    SendMessages: false,
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            LogService.error(`Error updating permissions: ${errorMessage}`);
            if (!interaction.replied) {
                await interaction.reply({ content: `❌ There was an error updating permissions. Please try again later.`, ephemeral: true });
            }
            return;
        }

        const existingMessages = await ticketChannel.messages.fetch({ limit: 1 });
        const existingEmbedMessage = existingMessages.first();

        const currentTime = new Date().toLocaleString();

        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(`🎟️ Ticket Claimed`)
            .setDescription(`Please wait, the staff team will assist you shortly.\n\nIn the meantime, please explain your issue in detail.`)
            .addFields(
                { name: 'Identifier', value: `||${ticketSettings.identifier}||`, inline: true },
                { name: 'Claimed by:', value: `${interaction.user.username}`, inline: true },
                { name: 'Claim Reason:', value: claimReason, inline: true },
                { name: 'Claim Time:', value: currentTime, inline: true }
            )
            .setTimestamp();

        try {
            if (existingEmbedMessage && existingEmbedMessage.embeds.length > 0) {
                const existingEmbed = existingEmbedMessage.embeds[0];
                const claimTimeField = existingEmbed.fields?.find(field => field.name === 'Claim Time:');

                if (!claimTimeField) {
                    await existingEmbedMessage.edit({ embeds: [embed] });
                }
            } else {
                await ticketChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            LogService.error(`Error updating embed message: ${errorMessage}`);
            if (!interaction.replied) {
                await interaction.reply({ content: `❌ There was an error updating the ticket embed. Please try again later.`, ephemeral: true });
            }
            return;
        }

        try {
            await modalInteraction.deferUpdate();
            if (!interaction.replied) {
                await interaction.reply({ content: `✅ You have successfully claimed the ticket: ${ticketChannel}`, ephemeral: true });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            LogService.error(`Error closing modal: ${errorMessage}`);
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        LogService.error(`Error claiming ticket: ${errorMessage}`);
        if (!interaction.replied) {
            await interaction.reply({ content: `❌ There was an error claiming the ticket. Please try again later.`, ephemeral: true });
        }
    }
};

// Handle archive ticket button
export const handleArchiveTicketButton = async (interaction: ButtonInteraction) => {
    if (!interaction.guild) return;

    if (interaction.customId !== 'archive_ticket') return;

    try {
        if (interaction.replied || interaction.deferred) return;

        await interaction.deferReply();

        const ticketSettings = await Ticket.findOne({ guildId: interaction.guild.id });
        if (!ticketSettings) {
            await interaction.followUp({ content: `❌ The ticket system is not set up for this server.`, ephemeral: true });
            return;
        }

        const ticketChannel = interaction.channel as TextChannel;
        const archiveCategory = interaction.guild.channels.cache.get(ticketSettings.archiveCategory) as CategoryChannel;

        if (!archiveCategory) {
            await interaction.followUp({ content: `❌ Archive category not found. Please contact an admin.`, ephemeral: true });
            return;
        }

        await ticketChannel.setParent(archiveCategory.id);

        await ticketChannel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, {
            ViewChannel: false,
        });

        const supportRole = interaction.guild.roles.cache.get(ticketSettings.role);
        const advisorRole = interaction.guild.roles.cache.get(ticketSettings.advisorRole);

        if (supportRole) {
            await ticketChannel.permissionOverwrites.edit(supportRole.id, {
                ViewChannel: true,
            });
        }

        if (advisorRole) {
            await ticketChannel.permissionOverwrites.edit(advisorRole.id, {
                ViewChannel: true,
            });
        }

        await interaction.followUp({ content: `✅ This ticket has been archived and is now only visible to authorized staff.`, ephemeral: true });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        LogService.error(`Error archiving ticket: ${errorMessage}`);
        await interaction.followUp({ content: `❌ There was an error archiving the ticket. Please try again later.`, ephemeral: true });
    }
};

// Handle Ticket Closure
export const handleCloseTicketButton = async (interaction: ButtonInteraction) => {
    if (!interaction.guild) return;

    if (interaction.customId !== 'close_ticket') return;

    try {
        if (interaction.replied || interaction.deferred) return;

        await interaction.deferReply();

        const ticketSettings = await Ticket.findOne({ guildId: interaction.guild.id });
        if (!ticketSettings) {
            await interaction.followUp({ content: `❌ The ticket system is not set up for this server.`, ephemeral: true });
            return;
        }

        const ticketChannel = interaction.channel as TextChannel;
        const logsChannel = interaction.guild.channels.cache.get(ticketSettings?.logsId) as TextChannel;

        if (!logsChannel) {
            await interaction.followUp({ content: `❌ Logs channel not found. Please contact an admin.`, ephemeral: true });
            return;
        }

        await interaction.followUp({
            content: `⚠️ This ticket will be closed in 5 seconds. Please make sure to save any important information.`,
            ephemeral: true,
        });

        setTimeout(async () => {
            try {
                const transcript = await discordTranscripts.createTranscript(ticketChannel);

                await logsChannel.send({
                    content: `📝 Transcript for the ticket: ${ticketChannel.name}`,
                    files: [transcript],
                });

                await ticketChannel.delete();
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                LogService.error(`Error closing ticket after 5 seconds: ${errorMessage}`);
                await interaction.followUp({
                    content: `❌ There was an error closing the ticket. Please try again later.`,
                    ephemeral: true,
                });
            }
        }, 5000);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        LogService.error(`Error closing ticket: ${errorMessage}`);
        await interaction.followUp({
            content: `❌ There was an error closing the ticket. Please try again later.`,
            ephemeral: true,
        });
    }
};
