import dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';
import { config } from '../config/config';
import { LogService } from '../services/logService';

import EconomyCommand from '../commands/general/economy';
import LevelCommand from '../commands/general/level';
import ServerInfoCommand from '../commands/general/serverinfo';
import UserInfoCommand from '../commands/general/userinfo';
import LifeVerseInfoCommand from '../commands/lifeverse/lifeverseinfo';
import VerificationCommand from '../commands/lifeverse/verification';
import FriendCommand from '../commands/lifeverse/friend';
import KickCommand from '../commands/moderation/kick';
import BanCommand from '../commands/moderation/ban';
import MuteCommand from '../commands/moderation/mute';
import ClearCommand from '../commands/moderation/clear';
import TimeoutCommand from '../commands/moderation/timeout';
import ReportCommand from '../commands/moderation/report';
import WelcomeCommand from '../commands/moderation/welcome';
import RoleCommand from '../commands/moderation/role';
import AntiLinkCommand from '../commands/moderation/antilink';
import WarnCommand from '../commands/moderation/warn';
import PollCommand from '../commands/moderation/poll';
import AutoModerationCommand from '../commands/moderation/automod';
import ReactionRoleCommand from '../commands/moderation/reactionrole';
import TicketCommand from '../commands/moderation/ticket';
import JoinToCreateCommand from '../commands/moderation/jointocreate';
import EvalCommand from '../commands/owner/eval';
import LogoutCommand from '../commands/owner/logout';
import PingCommand from '../commands/utility/ping';
import InviteCommand from '../commands/utility/invite';
import HelpCommand from '../commands/utility/help';
import ActivityCommand from '../commands/general/activity';
import StatsCommand from '../commands/moderation/stats';
import AnnouncementCommand from '../commands/moderation/announcement';
import EmojiCommand from '../commands/moderation/emoji';

dotenv.config();

const token: string = config.application.TOKEN;
const clientId = config.application.CLIENT_ID;
const guildId = config.application.TEST_GUILD_ID;

const commandFiles = [
    // General Commands
    EconomyCommand,
    LevelCommand,
    ServerInfoCommand,
    UserInfoCommand,
    ActivityCommand,
    // LifeVerse Commands
    LifeVerseInfoCommand,
    VerificationCommand,
    FriendCommand,
    // Moderation Commands
    KickCommand,
    BanCommand,
    MuteCommand,
    ClearCommand,
    TimeoutCommand,
    ReportCommand,
    WelcomeCommand,
    RoleCommand,
    AntiLinkCommand,
    WarnCommand,
    PollCommand,
    AutoModerationCommand,
    ReactionRoleCommand,
    TicketCommand,
    JoinToCreateCommand,
    StatsCommand,
    AnnouncementCommand,
    EmojiCommand,
    // Owner Commands
    EvalCommand,
    LogoutCommand,
    // Utility Commands
    PingCommand,
    InviteCommand,
    HelpCommand,
];

const commands: any[] = [];

for (const command of commandFiles) {
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        LogService.info(`The command is missing a required 'data' or 'execute' property.`);
    }
}

const rest = new REST({ version: '9' }).setToken(token);

export const registerCommands = async () => {
    try {
        LogService.info(`Started refreshing ${commands.length} application (/) commands.`);

        const data: any = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: commands,
        });

        LogService.info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        LogService.error(`${error}`);
    }
};
