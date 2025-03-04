import { ChatInputCommandInteraction, TextChannel, DMChannel } from 'discord.js';
import { CommandUsage } from '../models/CommandUsage';
import { CommandName } from '../models/CommandName';
import { LogService } from '../services/logService';

export const commandUsageEvent = async (interaction: ChatInputCommandInteraction) => {
    try {
        const { commandName, user, channel } = interaction;

        if (!channel) {
            throw new Error('Channel is null');
        }

        let channelName: string;

        if (channel instanceof TextChannel) {
            channelName = channel.name;
        } else if (channel instanceof DMChannel) {
            channelName = `DM Channel (${channel.id})`;
        } else {
            channelName = `Unknown Channel (${channel.id})`;
        }

        let command = await CommandName.findOne({ commandName });

        if (command) {
            if (!command.users.some(existingUser => existingUser.userId === user.id)) {
                command.users.push({
                    identifier: Math.random().toString(36).substring(2, 15),
                    userId: user.id,
                    username: user.username,
                    timestamp: new Date(),
                });
                await command.save();
            }
        } else {
            command = new CommandName({
                identifier: Math.random().toString(36).substring(2, 15),
                commandName: commandName,
                users: [{
                    identifier: Math.random().toString(36).substring(2, 15),
                    userId: user.id,
                    username: user.username,
                    timestamp: new Date(),
                }],
            });
            await command.save();
        }

        let commandUsage = await CommandUsage.findOne({ userId: user.id });

        if (commandUsage) {
            commandUsage.commands.push({
                identifier: Math.random().toString(36).substring(2, 15),
                commandName: commandName,
                timestamp: new Date(),
            });
            await commandUsage.save();
        } else {
            commandUsage = new CommandUsage({
                identifier: Math.random().toString(36).substring(2, 15),
                userId: user.id,
                username: user.username,
                channelId: channel.id,
                commands: [{
                    identifier: Math.random().toString(36).substring(2, 15),
                    commandName: commandName,
                    timestamp: new Date(),
                }],
            });
            await commandUsage.save();
        }

        console.info(`Command '${commandName}' executed by ${user.username} in channel ${channelName} at ${new Date().toISOString()}.`);
    } catch (error) {
        LogService.error('Error logging command usage:', error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'There was an error executing the command.',
            });
        } else if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error executing the command.',
            });
        }
    }
};
