import { SKINS } from '../constants.js';

const STORAGE_KEY = 'battle_royale_save';

export class ProgressionManager {
    constructor() {
        this.data = this.load();
    }

    getDefault() {
        return {
            selectedSkin: 'default_blue',
            unlockedSkins: ['default_blue'],
            stats: {
                gamesPlayed: 0,
                wins: 0,
                totalKills: 0,
                bestKillsInMatch: 0,
                totalDamageDealt: 0,
                totalSurvivalTimeSec: 0
            }
        };
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const defaults = this.getDefault();
                return {
                    ...defaults,
                    ...parsed,
                    stats: { ...defaults.stats, ...(parsed.stats || {}) }
                };
            }
            return this.getDefault();
        } catch {
            return this.getDefault();
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch {
            // localStorage not available
        }
    }

    recordMatch(result) {
        this.data.stats.gamesPlayed++;
        if (result.won) this.data.stats.wins++;
        this.data.stats.totalKills += result.kills;
        this.data.stats.bestKillsInMatch = Math.max(this.data.stats.bestKillsInMatch, result.kills);
        this.data.stats.totalDamageDealt += result.damageDealt;
        this.data.stats.totalSurvivalTimeSec += result.survivalTimeSec;
        this.save();
    }

    checkUnlocks() {
        const newUnlocks = [];
        for (const skin of SKINS) {
            if (this.data.unlockedSkins.includes(skin.id)) continue;
            if (!skin.condition) continue;
            let met = false;
            switch (skin.condition.type) {
                case 'games_played': met = this.data.stats.gamesPlayed >= skin.condition.value; break;
                case 'wins':         met = this.data.stats.wins >= skin.condition.value; break;
                case 'kills_total':  met = this.data.stats.totalKills >= skin.condition.value; break;
                case 'kills_single': met = this.data.stats.bestKillsInMatch >= skin.condition.value; break;
            }
            if (met) {
                this.data.unlockedSkins.push(skin.id);
                newUnlocks.push(skin);
            }
        }
        if (newUnlocks.length > 0) this.save();
        return newUnlocks;
    }

    setSelectedSkin(skinId) {
        this.data.selectedSkin = skinId;
        this.save();
    }
}
