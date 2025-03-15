import { Client, Message, EmbedBuilder, DMChannel } from 'discord.js';
import { Warn } from '../models/Warn';

const toxicKeywords = [
    'Arschloch',
    'Asshole',
    '4sshole',
    '4ssho1e',
    'Assho1e',
    'asshole',
    'Hurensohn',
    'Hoeson',
    'Bastard',
    'Wixxer',
    'Nuttensohn',
    'Slutson',
    'Schlappschwanz',
    'Cuckoo',
    'Fick dich',
    'Fuck you',
    'Bitch',
    'Shithead',
    'Dickhead',
    'Cocksucker',
    'Motherfucker',
    'Fucker',
    'Pussy',
    'Dummkopf',
    'Faggot',
    'Retard',
    'Shitface',
    'Asswipe',
    'Dipshit',
    'Twat',
    'Tosser',
    'Wanker',
    'Bimbo',
    'Cunt',
    'Chav',
    'Gaylord',
    'Douchbag',
    'Pedo',
    'Pedophile',
    'Sexual predator',
    'Cockroach',
    'Lick my balls',
    'Suck my dick',
    'Suck my balls',
    'Faggot',
    'Gay',
    'Queer',
    'Dyke',
    'Bastards',
    'Dildo',
    'Fuckface',
    'Asshat',
    'Twink',
    'Scumbag',
    'Asslicker',
    'Bastard',
    'Cocksucker',
    'Cumdumpster',
    'Whore',
    'Slut',
    'Skank',
    'Ho',
    'Tramp',
    'Bitchass',
    'Cuck',
    'Shitbag',
    'Faggot',
    'Assmonkey',
    'Shithead',
    'Douche',
    'Prick',
    'Knobhead',
    'Twatface',
    'Pissflap',
    'Mongoloid',
    'Spaz',
    'Retard',
    'Spastic',
    'Cuntface',
    'Dickwod',
    'Jerkoff',
    'Asswipe',
    'Bastard',
    'Troll',
    'Bumhole',
    'Chode',
    'Fatass',
    'Pillock',
    'Wanker',
    'Assclown',
    'Shithead',
    'Freaking idiot',
    'Muppet'
];

export const detectToxicBehavior = (client: Client) => {
    client.on('messageCreate', async (message: Message) => {
        if (message.author.bot) return;

        if (!message.guild) return;

        const content = message.content.toLowerCase();

        const containsToxicBehavior = toxicKeywords.some(keyword => content.includes(keyword));

        if (containsToxicBehavior) {
            try {
                const moderatorId = message.author.id;

                const warn = new Warn({
                    identifier: Math.random().toString(36).substring(2, 15),
                    userId: message.author.id,
                    guildId: message.guild.id,
                    reason: 'Toxic behavior detected in message',
                    moderatorId: moderatorId,
                });

                await warn.save();
                console.log(`Warning issued to user ${message.author.tag} for toxic behavior.`);

                await message.delete();

                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Warning Issued')
                    .setDescription(`You have been warned for toxic behavior in **${message.guild.name}**.`)
                    .addFields([
                        { name: 'Reason', value: 'Toxic behavior detected in your message.' },
                        { name: 'Moderator', value: message.author.tag }
                    ])
                    .setFooter({ text: 'Please be mindful of your behavior in the server.' })
                    .setTimestamp();

                let dmChannel = message.author.dmChannel;

                if (!dmChannel) {
                    dmChannel = await message.author.createDM();
                }

                if (dmChannel instanceof DMChannel) {
                    try {
                        await dmChannel.send({ embeds: [embed] });
                    } catch (dmError) {
                        console.error('Could not send DM to the user:', dmError);
                    }
                } else {
                    console.error('Failed to retrieve a valid DM channel.');
                }

            } catch (error) {
                console.error('Error creating warning:', error);
            }
        }
    });
};
