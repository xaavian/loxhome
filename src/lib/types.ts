// Tile types supported by the dashboard
export type TileType = 'light' | 'switch' | 'climate' | 'cover' | 'sensor' | 'media' | 'camera' | 'generic';

// Size of a tile in the grid
export type TileSize = '1x1' | '2x1' | '1x2' | '2x2';

// A single tile configuration
export interface TileConfig {
    id: string;
    type: TileType;
    entityId: string;
    name?: string;
    icon?: string;
    size: TileSize;
    order: number;
    color?: string;
    dimmable?: boolean;
}

// A view (room/page) in the dashboard
export interface ViewConfig {
    id: string;
    name: string;
    icon: string;
    color: string;
    tiles: TileConfig[];
    order: number;
    isFavorite?: boolean;
}

// Overall dashboard configuration
export interface DashboardConfig {
    version: number;
    title: string;
    views: ViewConfig[];
    settings: DashboardSettings;
}

export interface DashboardSettings {
    weatherEntityId: string;
    showHeader: boolean;
    showSidebar: boolean;
    sidebarCollapsed: boolean;
    columns: number;
    centralViewId?: string;
    brandTitle?: string;
}

// HA entity state (simplified)
export interface EntityState {
    entity_id: string;
    state: string;
    attributes: Record<string, unknown>;
    last_changed: string;
    last_updated: string;
}

// ── HA Registry Types (Auto-Discovery) ──

export interface HAArea {
    area_id: string;
    name: string;
    icon?: string;
    picture?: string;
}

export interface HADevice {
    id: string;
    area_id?: string;
    name_by_user?: string;
    name?: string;
}

export interface HAEntityRegistryEntry {
    entity_id: string;
    device_id?: string;
    area_id?: string;
    platform: string;
    name?: string;
    disabled_by?: string | null;
    hidden_by?: string | null;
    labels?: string[];
}

export interface DiscoveryResult {
    areas: { area: HAArea; entities: string[] }[];
    unassigned: string[];
    favoriteEntities: string[];
    centralEntities: string[];
}

// Category groupings for sidebar
export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    domains: string[];
}

export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'lighting', name: 'Beleuchtung', icon: 'mdi:lightbulb', color: '#f5c542', domains: ['light'] },
    { id: 'climate', name: 'Klima', icon: 'mdi:thermometer', color: '#42a5f5', domains: ['climate', 'fan'] },
    { id: 'shading', name: 'Beschattung', icon: 'mdi:window-shutter', color: '#8d6e63', domains: ['cover'] },
    { id: 'security', name: 'Sicherheit', icon: 'mdi:lock', color: '#ef5350', domains: ['alarm_control_panel', 'lock', 'binary_sensor'] },
    { id: 'media', name: 'Medien', icon: 'mdi:music', color: '#ab47bc', domains: ['media_player'] },
    { id: 'switches', name: 'Schalter', icon: 'mdi:flash', color: '#66bb6a', domains: ['switch', 'input_boolean', 'automation'] },
    { id: 'sensors', name: 'Sensoren', icon: 'mdi:chart-bar', color: '#26c6da', domains: ['sensor'] },
];

// Default dashboard config
export const DEFAULT_DASHBOARD: DashboardConfig = {
    version: 1,
    title: 'Mein Zuhause',
    views: [
        {
            id: 'home',
            name: 'Zuhause',
            icon: 'mdi:home',
            color: '#69b34c',
            tiles: [],
            order: 0
        }
    ],
    settings: {
        weatherEntityId: 'weather.home',
        showHeader: true,
        showSidebar: true,
        sidebarCollapsed: false,
        columns: 4,
        centralViewId: '',
        brandTitle: 'LoxHome'
    }
};
