import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { ReactionRole, IReactionRoleLog } from '../models/ReactionRole';
import { LogService } from '../services/logService';

export const handleReactionButtonInteraction = async (interaction: ButtonInteraction) => {
    if (interaction.user.bot || !interaction.guild) return;

    const emoji = interaction.customId.split('_')[2];
    if (!emoji) return;

    try {
        const reactionRole = await ReactionRole.findOne({ messageId: interaction.message.id });
        if (!reactionRole) {
            await interaction.reply({ content: '⚠️ No reaction roles found for this message.', ephemeral: true });
            return;
        }

        const roleData = reactionRole.roles.find(r => r.emoji === emoji);
        if (!roleData) {
            await interaction.reply({ content: `⚠️ No role found for emoji: ${emoji}`, ephemeral: true });
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member) return;

        const role = interaction.guild.roles.cache.get(roleData.roleId);
        const hasRole = member.roles.cache.has(roleData.roleId);

        const logEntry: IReactionRoleLog = {
            identifier: Math.random().toString(36).substring(2, 15),
            userId: member.user.id,
            userName: member.user.tag,
            roleId: roleData.roleId,
            roleName: role?.name || roleData.roleId,
            action: hasRole ? 'removed' : 'added' as 'added' | 'removed',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (hasRole) {
            await member.roles.remove(roleData.roleId);
            LogService.info(`Removed role ${role?.name || roleData.roleId} from user ${member.user.tag}.`);

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`❌ Role Removed: ${reactionRole.title}`)
                .setDescription(`You have been removed from the role associated with this emoji:\n${roleData.emoji} -> <@&${roleData.roleId}>\n\n${reactionRole.description}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            await member.roles.add(roleData.roleId);
            LogService.info(`Added role ${role?.name || roleData.roleId} to user ${member.user.tag}.`);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`✅ Role Added: ${reactionRole.title}`)
                .setDescription(`You have been assigned the role associated with this emoji:\n${roleData.emoji} -> <@&${roleData.roleId}>\n\n${reactionRole.description}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        reactionRole.logs.push(logEntry);
        await reactionRole.save();
    } catch (error) {
        LogService.error(`Error handling button interaction: ${error instanceof Error ? error.message : String(error)}`);
        await interaction.reply({ content: '⚠️ There was an error adding or removing the role. Please try again later.', ephemeral: true });
    }
};

