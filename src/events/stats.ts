import { Client, TextChannel } from 'discord.js';
import { Stat } from '../models/Stats';
import { Poll } from '../models/Poll';
import { CommandUsage } from '../models/CommandUsage';

let isUpdating = false;

export async function updateStats(client: Client) {
    if (isUpdating) {
        console.log('updateStats is already running...');
        return;
    }

    isUpdating = true;

    try {
        const stats = await Stat.find();

        for (const stat of stats) {
            console.log(`Updating stat: ${stat.type} in Guild: ${stat.guildId}`);

            const guild = client.guilds.cache.get(stat.guildId);
            if (!guild) {
                console.log(`❌ Guild not found: ${stat.guildId}`);
                continue;
            }

            const channel = guild.channels.cache.get(stat.channelId);
            if (!channel) {
                console.log(`❌ Channel not found: ${stat.channelId}`);
                continue;
            }

            let newName: string | null = null;

            switch (stat.type) {
                case 'members':
                    newName = `👥 Members: ${guild.memberCount}`;
                    break;
                case 'online':
                    newName = `🟢 Online: ${guild.members.cache.filter(m => m.presence?.status === 'online').size}`;
                    break;
                case 'boosts':
                    newName = `🚀 Boosts: ${guild.premiumSubscriptionCount}`;
                    break;
                case 'voice':
                    newName = `🎙️ In Voice: ${guild.members.cache.filter(m => m.voice.channel).size}`;
                    break;
                case 'text-activity':
                    const textActivity = guild.channels.cache
                        .filter(c => c instanceof TextChannel)
                        .reduce((total, channel) => total + channel.messages.cache.size, 0);
                    newName = `💬 Text Activity: ${textActivity}`;
                    break;
                case 'roles':
                    const rolesCount = guild.roles.cache.size;
                    newName = `🔑 Roles: ${rolesCount}`;
                    break;
                case 'emojis':
                    newName = `😊 Emojis: ${guild.emojis.cache.size}`;
                    break;
                case 'shards':
                    newName = `🌐 Shards: ${guild.shard?.id ?? 'N/A'}`;
                    break;
                case 'bot-usage':
                    const commandUsageCount = await CommandUsage.countDocuments({
                        'commands.timestamp': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                    });
                    newName = `🤖 Bot Usage: ${commandUsageCount} Commands`;
                    break;
                case 'active-polls':
                    const activePolls = await Poll.countDocuments({ guildId: stat.guildId, active: true });
                    newName = `📊 Active Polls: ${activePolls}`;
                    break;
                case 'total-channels':
                    newName = `📑 Channels: ${guild.channels.cache.size}`;
                    break;
                case 'server-tier':
                    newName = `🏅 Server Tier: ${guild.premiumTier}`;
                    break;
                case 'members-by-role':
                    const role = guild.roles.cache.find(r => r.name === 'Member');
                    const membersInRole = role ? guild.members.cache.filter(m => m.roles.cache.has(role.id)).size : 0;
                    newName = `🧑‍🤝‍🧑 Members in Role: ${membersInRole}`;
                    break;
            }

            if (newName && channel.name !== newName) {
                await channel.setName(newName);
            }
        }
    } catch (error) {
        console.error('Error in updateStats:', error);
    } finally {
        isUpdating = false;
    }
}
