import { Client, EmbedBuilder, PermissionFlagsBits, ChannelType, VoiceState, CategoryChannel, VoiceChannel } from 'discord.js';
import { LogService } from '../services/logService';
import { JoinToCreate } from '../models/JoinToCreate';

export const handleVoiceStateUpdate = (client: Client) => {
    client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
        try {
            if (!newState.channel || oldState.channel?.id === newState.channel.id) return;

            const guildId = newState.guild.id;
            const userId = newState.member?.id;

            const joinData = await JoinToCreate.findOne({ guildId, channelId: newState.channel.id });

            if (!joinData || newState.channel.id !== joinData.channelId) return;

            const categoryChannel = await newState.guild.channels.cache.get(joinData.categoryId) as CategoryChannel;

            if (!categoryChannel) {
                LogService.error('No valid category found for the private channel.');
                return;
            }

            const existingChannel = newState.guild.channels.cache.find(
                (channel) => 
                    channel.name === `private-${newState.member?.user.tag}` && 
                    channel.type === ChannelType.GuildVoice
            ) as VoiceChannel | undefined;
            
            if (existingChannel) {
                await newState.member?.voice.setChannel(existingChannel);
                LogService.info(`User ${newState.member?.user.tag} was moved to their existing private channel.`);
                return;
            }

            const privateChannel = await newState.guild.channels.create({
                name: `private-${newState.member?.user.tag}`,
                type: ChannelType.GuildVoice,
                parent: categoryChannel.id,
                permissionOverwrites: [
                    {
                        id: newState.guild.id,
                        deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
                    },
                    {
                        id: userId!,
                        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
                    },
                ],
            });

            await newState.member?.voice.setChannel(privateChannel);

            const welcomeMessage = `A private channel has been created for you, ${newState.member?.user.tag}! You can invite others by sending them the invite link.`;

            const privateChannelEmbed = new EmbedBuilder()
                .setColor('Random')
                .setTitle(`Private Channel Created`)
                .setDescription(welcomeMessage)
                .setTimestamp(new Date())
                .setFooter({ text: `Enjoy your private space, ${newState.member?.user.tag}!` });

            const channel = newState.guild.channels.cache.get(joinData.channelId);
            if (channel && channel.isTextBased()) {
                await channel.send({ embeds: [privateChannelEmbed] });
            } else {
                LogService.error('No text channel found or the channel is invalid.');
            }

            const invite = await privateChannel.createInvite({
                maxAge: 0,
                maxUses: 0,
            });

            const dmEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('Your Private Channel')
                .setDescription(
                    `Hey **${newState.member?.user.username}**! 🎉\n\n` +
                        `A private voice channel has been created for you.\n\n` +
                        `🔑 Invite others to join your space using the following link:\n\n` +
                        `🔗 [Join your private channel](${invite.url})`
                )
                .setFooter({
                    text: 'We hope you enjoy your private space!',
                })
                .setTimestamp();

            await newState.member?.send({ embeds: [dmEmbed] });
            LogService.info(`Sent DM to ${newState.member?.user.tag} with private channel invite.`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            LogService.error(`Error in voiceStateUpdate event: ${errorMessage}`);
        }
    });
};
