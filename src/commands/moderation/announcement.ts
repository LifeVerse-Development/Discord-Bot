import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../functions/handleCommands';

const AnnouncementCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription('Manage server announcements.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('news')
                .setDescription('Display the latest news or updates.')
                .addStringOption(option => option.setName('title').setDescription('Title of the news').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('Description of the news').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('changelog')
                .setDescription('Display the latest changes in the server.')
                .addStringOption(option => option.setName('title').setDescription('Title of the changelog').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('Description of the changes').setRequired(true))
                .addStringOption(option => option.setName('version').setDescription('Version of the update').setRequired(true))
                .addStringOption(option => option.setName('details').setDescription('Details of the changes').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('economy')
                .setDescription('Display economy system information.')
                .addStringOption(option => option.setName('title').setDescription('Title of the economy info').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('Description of the economy info').setRequired(true))
                .addStringOption(option => option.setName('currency').setDescription('Currency in the server').setRequired(true))
                .addStringOption(option => option.setName('shop').setDescription('Shop details').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('team')
                .setDescription('Introduce the team members.')
                .addStringOption(option => option.setName('title').setDescription('Title for team introduction').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('Description of the team').setRequired(true))
                .addStringOption(option => option.setName('leader').setDescription('Team leader').setRequired(true))
                .addStringOption(option => option.setName('members').setDescription('Other team members').setRequired(true))
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;
        
        let embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTimestamp()
            .setFooter({ text: 'Server Announcement' });

        embed.setThumbnail(guild?.iconURL() || 'https://example.com/default-thumbnail.jpg');

        const title = interaction.options.getString('title')!;
        const description = interaction.options.getString('description')!;

        switch (subcommand) {
            case 'news':
                embed.setTitle(title)
                     .setDescription(description)
                     .addFields(
                         { name: 'Important Update', value: 'Stay tuned for more exciting news!', inline: true }
                     );
                break;

            case 'changelog':
                const changelogVersion = interaction.options.getString('version')!;
                const changelogDetails = interaction.options.getString('details')!;
                
                embed.setTitle(title)
                     .setDescription(description)
                     .addFields(
                         { name: `Version: ${changelogVersion}`, value: changelogDetails, inline: true }
                     );
                break;

            case 'economy':
                const economyCurrency = interaction.options.getString('currency')!;
                const economyShop = interaction.options.getString('shop')!;
                
                embed.setTitle(title)
                     .setDescription(description)
                     .addFields(
                         { name: 'Currency', value: economyCurrency, inline: true },
                         { name: 'Shop', value: economyShop, inline: true }
                     );
                break;

            case 'team':
                const teamLeader = interaction.options.getString('leader')!;
                const teamMembers = interaction.options.getString('members')!;
                
                embed.setTitle(title)
                     .setDescription(description)
                     .addFields(
                         { name: 'Leader', value: teamLeader, inline: true },
                         { name: 'Team Members', value: teamMembers, inline: true }
                     );
                break;

            default:
                embed.setDescription('Invalid subcommand.');
                break;
        }

        await interaction.reply({ embeds: [embed] });
    },
};

export default AnnouncementCommand;
