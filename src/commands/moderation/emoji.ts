import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../functions/handleCommands';

const EmojiCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('emoji')
        .setDescription('Manage server emojis.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all emojis in the server.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new emoji to the server.')
                .addStringOption(option => option.setName('name').setDescription('Name of the emoji').setRequired(true))
                .addStringOption(option => option.setName('url').setDescription('URL of the emoji image').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove an emoji from the server.')
                .addStringOption(option => option.setName('name').setDescription('Name of the emoji').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('run')
                .setDescription('Run a specific emoji (send it as a reaction).')
                .addStringOption(option => option.setName('emoji').setDescription('Emoji to run').setRequired(true))
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'list':
                const emojis = interaction.guild?.emojis.cache.map(emoji => emoji.toString()).join(' ') || 'No emojis found in this server.';
                const embedList = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Server Emojis')
                    .setDescription(emojis);
                await interaction.reply({ embeds: [embedList] });
                break;

            case 'add':
                const name = interaction.options.getString('name')!;
                const url = interaction.options.getString('url')!;
                
                try {
                    const emoji = await interaction.guild?.emojis.create({
                        name,
                        attachment: url,
                    });
                    const embedAdd = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('Emoji Added')
                        .setDescription(`Successfully added the emoji: ${emoji?.toString()}`);
                    await interaction.reply({ embeds: [embedAdd] });
                } catch (error) {
                    await interaction.reply({ content: 'Failed to add the emoji. Make sure the URL is valid.', ephemeral: true });
                }
                break;

            case 'remove':
                const emojiName = interaction.options.getString('name')!;
                const emojiToRemove = interaction.guild?.emojis.cache.find(e => e.name === emojiName);

                if (emojiToRemove) {
                    await emojiToRemove.delete();
                    const embedRemove = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Emoji Removed')
                        .setDescription(`Successfully removed the emoji: ${emojiName}`);
                    await interaction.reply({ embeds: [embedRemove] });
                } else {
                    await interaction.reply({ content: 'Emoji not found.', ephemeral: true });
                }
                break;

            case 'run':
                const emojiToRun = interaction.options.getString('emoji')!;
                try {
                    const message = await interaction.fetchReply();
                    await message.react(emojiToRun);
                    await interaction.reply({ content: `Reacted with ${emojiToRun}` });
                } catch (error) {
                    await interaction.reply({ content: 'Failed to react with the emoji. Please check if it\'s a valid emoji.', ephemeral: true });
                }
                break;

            default:
                await interaction.reply({ content: 'Invalid subcommand.', ephemeral: true });
                break;
        }
    },
};

export default EmojiCommand;
