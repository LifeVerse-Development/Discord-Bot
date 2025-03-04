import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageComponentInteraction } from 'discord.js';
import { Command } from '../../functions/handleCommands';
import fs from 'fs';
import path from 'path';

const categoryEmojis: { [key: string]: string } = {
    fun: '🎉',
    games: '🎮',
    general: '📋',
    lifeverse: '🧬',
    moderation: '🔨',
    owner: '👑',
    utility: '🛠️',
};

const HelpCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays all available commands categorized with pagination.'),

    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const commandsPath = path.join(__dirname, '../../commands');
            const categories = fs.readdirSync(commandsPath).filter((folder) =>
                fs.statSync(path.join(commandsPath, folder)).isDirectory()
            );

            const categoryData = categories.map((category) => {
                const commandsInCategory = fs
                    .readdirSync(path.join(commandsPath, category))
                    .filter((file) => file.endsWith('.ts'))
                    .map((file) => {
                        const command = require(path.join(commandsPath, category, file)).default;
                        return `**/${command.data.name}** - ${command.data.description}`;
                    });

                return {
                    category,
                    emoji: categoryEmojis[category.toLowerCase()] || '📁',
                    commands: commandsInCategory,
                };
            });

            let currentPage = 0;

            const createEmbed = (page: number) => {
                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('🛠️ Help: Available Commands')
                    .setDescription('Navigate through the categories using the buttons below.')
                    .setFooter({ text: `Page ${page + 1} of ${categoryData.length}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                const currentCategory = categoryData[page];
                const categoryTitle = `${currentCategory.emoji} **${currentCategory.category.charAt(0).toUpperCase() + currentCategory.category.slice(1)}** Commands`;
                embed.addFields({
                    name: categoryTitle,
                    value: currentCategory.commands.join('\n') || 'No commands available.',
                });

                return embed;
            };

            const createButtons = (page: number) => {
                return new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('⬅️ Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('➡️ Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === categoryData.length - 1)
                );
            };

            const embed = createEmbed(currentPage);
            const buttons = createButtons(currentPage);

            const message = await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });

            const filter = (i: MessageComponentInteraction) =>
                ['prev', 'next'].includes(i.customId) && i.user.id === interaction.user.id;

            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.customId === 'prev') {
                    currentPage = Math.max(currentPage - 1, 0);
                } else if (buttonInteraction.customId === 'next') {
                    currentPage = Math.min(currentPage + 1, categoryData.length - 1);
                }

                const newEmbed = createEmbed(currentPage);
                const newButtons = createButtons(currentPage);

                await buttonInteraction.update({ embeds: [newEmbed], components: [newButtons] });
            });

            collector.on('end', async () => {
                const disabledButtons = createButtons(currentPage).components.map((btn) => btn.setDisabled(true));
                await message.edit({ components: [new ActionRowBuilder<ButtonBuilder>().addComponents(...disabledButtons)] });
            });
        } catch (error) {
            console.error('Error displaying help:', error);
            await interaction.reply({
                content: 'An error occurred while generating the help. Please try again later.',
                ephemeral: true,
            });
        }
    },
};

export default HelpCommand;
