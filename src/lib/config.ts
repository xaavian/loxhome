import type { DashboardConfig } from './types';
import { DEFAULT_DASHBOARD } from './types';
import { dashboardConfig } from './stores';
import { getConnection } from './hass';

const CONFIG_KEY = 'loxhome-config';
const HA_STORAGE_KEY = 'loxhome';

/**
 * Load dashboard config — tries HA user data first, falls back to localStorage
 */
export async function loadConfig(): Promise<DashboardConfig> {
    // Try HA backend storage first (syncs across devices)
    const haConfig = await loadFromHA();
    if (haConfig) {
        dashboardConfig.set(haConfig);
        // Also update localStorage as cache
        saveToLocalStorage(haConfig);
        return haConfig;
    }

    // Fallback to localStorage (dev mode or HA not connected yet)
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(CONFIG_KEY);
        if (stored) {
            try {
                const config = JSON.parse(stored) as DashboardConfig;
                dashboardConfig.set(config);
                return config;
            } catch {
                // Invalid JSON, use default
            }
        }
    }

    dashboardConfig.set(DEFAULT_DASHBOARD);
    return DEFAULT_DASHBOARD;
}

/**
 * Save dashboard config — saves to HA user data + localStorage
 */
export async function saveConfig(config: DashboardConfig): Promise<void> {
    dashboardConfig.set(config);

    // Save to HA backend (primary, syncs across devices)
    await saveToHA(config);

    // Also save to localStorage as cache/fallback
    saveToLocalStorage(config);
}

/**
 * Load config from HA's frontend/get_user_data WebSocket API
 */
async function loadFromHA(): Promise<DashboardConfig | null> {
    const conn = getConnection();
    if (!conn) return null;

    try {
        const result = await conn.sendMessagePromise<{ value: DashboardConfig | null }>({
            type: 'frontend/get_user_data',
            key: HA_STORAGE_KEY,
        });
        return result?.value ?? null;
    } catch (e) {
        console.warn('LoxHome: failed to load config from HA user data', e);
        return null;
    }
}

/**
 * Save config to HA's frontend/set_user_data WebSocket API
 */
async function saveToHA(config: DashboardConfig): Promise<void> {
    const conn = getConnection();
    if (!conn) return;

    try {
        await conn.sendMessagePromise({
            type: 'frontend/set_user_data',
            key: HA_STORAGE_KEY,
            value: config,
        });
    } catch (e) {
        console.warn('LoxHome: failed to save config to HA user data', e);
    }
}

/**
 * Save to localStorage as fallback/cache
 */
function saveToLocalStorage(config: DashboardConfig): void {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        } catch {
            // localStorage might be full or disabled
        }
    }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}
