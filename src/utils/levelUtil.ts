import { Level } from "../models/Level";

export class LevelUtil {
    static calculateLevel(xp: number): number {
        return Math.floor(xp / 100);
    }

    static calculateNextLevelXp(level: number): number {
        return (level + 1) * 100;
    }

    static async getUserLevelData(userId: string) {
        const userData = await Level.findOne({ userId });
        if (!userData) return null;

        const level = this.calculateLevel(userData.xp ?? 0);
        const nextLevelXp = this.calculateNextLevelXp(level);

        return {
            level,
            xp: userData.xp ?? 0,
            nextLevelXp,
            levelUpCount: userData.levelUpCount ?? 0,
            xpHistory: userData.xpHistory,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
        };
    }

    static async giveUserXP(userId: string, xp: number) {
        let userData = await Level.findOne({ userId });

        if (!userData) {
            userData = new Level({
                userId,
                xp: 0,
                level: 0,
                levelUpCount: 0,
                xpHistory: []
            });
        }

        userData.xp += xp;
        const previousLevel = userData.level;
        const newLevel = this.calculateLevel(userData.xp);

        if (newLevel > previousLevel) {
            userData.levelUpCount += 1;
        }

        userData.level = newLevel;
        userData.xpHistory.push({
            date: new Date(),
            xpEarned: xp
        });

        await userData.save();
    }

    static async getLeaderboardData() {
        const leaderboard = await Level.find()
            .sort({ level: -1, xp: -1 })
            .limit(10);

        return leaderboard.map(user => ({
            userId: user.userId,
            level: user.level,
            xp: user.xp,
            levelUpCount: user.levelUpCount,
            xpHistory: user.xpHistory,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
    }
}
