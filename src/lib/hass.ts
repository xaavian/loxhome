import {
    createConnection,
    createLongLivedTokenAuth,
    getAuth,
    subscribeEntities,
    callService,
    type HassEntities,
    type Connection
} from 'home-assistant-js-websocket';
import { hassConnected, entityStates } from './stores';
import type { EntityState, HAArea, HADevice, HAEntityRegistryEntry, DiscoveryResult } from './types';

let connection: Connection | null = null;

/** Expose the current connection for direct WS commands */
export function getConnection(): Connection | null {
    return connection;
}

/** Subscribe to entity updates (shared between connect methods) */
function subscribeToEntities(conn: Connection): void {
    subscribeEntities(conn, (entities: HassEntities) => {
        const states: Record<string, EntityState> = {};
        for (const [entityId, entity] of Object.entries(entities)) {
            states[entityId] = {
                entity_id: entityId,
                state: entity.state,
                attributes: entity.attributes as Record<string, unknown>,
                last_changed: entity.last_changed,
                last_updated: entity.last_updated
            };
        }
        entityStates.set(states);
    });
}

/**
 * Connect as HA panel — receives auth token from parent loxhome-panel.js
 * via postMessage. Only works when loaded inside HA as panel_custom.
 */
export async function connectAsPanel(): Promise<void> {
    // Only attempt if we're inside an iframe (panel context)
    if (window.parent === window) {
        throw new Error('Not inside an iframe');
    }

    return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            window.removeEventListener('message', handleMessage);
            reject(new Error('Panel auth timeout — no auth received from HA'));
        }, 5000);

        function handleMessage(event: MessageEvent) {
            if (event.data?.type !== 'loxhome-auth') return;

            clearTimeout(timeout);
            window.removeEventListener('message', handleMessage);

            const { accessToken, hassUrl } = event.data;
            if (!accessToken || !hassUrl) {
                reject(new Error('Invalid auth data from panel'));
                return;
            }

            const auth = createLongLivedTokenAuth(hassUrl, accessToken);
            createConnection({ auth })
                .then((conn) => {
                    connection = conn;
                    hassConnected.set(true);
                    subscribeToEntities(connection);
                    console.log('Connected to Home Assistant (panel auth)');
                    resolve();
                })
                .catch((error) => {
                    console.error('Panel auth connection failed:', error);
                    reject(error);
                });
        }

        window.addEventListener('message', handleMessage);

        // Request auth from parent (loxhome-panel.js)
        try {
            window.parent.postMessage({ type: 'loxhome-auth-request' }, '*');
        } catch {
            // Cross-origin, parent will send auth on iframe load anyway
        }
    });
}

/**
 * Connect to Home Assistant via WebSocket (token-based, standalone mode)
 */
export async function connectToHA(url: string, token: string): Promise<void> {
    try {
        const auth = createLongLivedTokenAuth(url, token);
        connection = await createConnection({ auth });
        hassConnected.set(true);
        subscribeToEntities(connection);
        console.log('Connected to Home Assistant');
    } catch (error) {
        console.error('Failed to connect to Home Assistant:', error);
        hassConnected.set(false);
        throw error;
    }
}

/**
 * Connect to HA via OAuth flow (URL only, no token needed).
 * Uses getAuth() which will redirect to HA login if needed.
 */
export async function connectWithUrl(url: string): Promise<void> {
    try {
        const auth = await getAuth({ hassUrl: url });
        connection = await createConnection({ auth });
        hassConnected.set(true);
        subscribeToEntities(connection);
        console.log('Connected to Home Assistant (OAuth)');
    } catch (error) {
        console.error('OAuth connection failed:', error);
        hassConnected.set(false);
        throw error;
    }
}

/**
 * Call a HA service
 */
export async function callHAService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: { entity_id: string | string[] }
): Promise<void> {
    if (!connection) {
        console.error('Not connected to Home Assistant');
        return;
    }
    try {
        await callService(connection, domain, service, data, target);
    } catch (error) {
        console.error(`Failed to call service ${domain}.${service}:`, error);
    }
}

/**
 * Toggle an entity
 */
export async function toggleEntity(entityId: string): Promise<void> {
    const domain = entityId.split('.')[0];
    const serviceDomain = ['light', 'switch', 'fan', 'input_boolean', 'automation'].includes(domain)
        ? domain
        : 'homeassistant';
    await callHAService(serviceDomain, 'toggle', undefined, { entity_id: entityId });
}

/**
 * Disconnect from HA
 */
export function disconnectHA(): void {
    if (connection) {
        connection.close();
        connection = null;
        hassConnected.set(false);
    }
}

// ── Auto-Discovery ──────────────────────────────────────────────

/** Fetch all areas from HA area registry */
export async function fetchAreas(): Promise<HAArea[]> {
    if (!connection) throw new Error('Not connected to Home Assistant');
    const result = await connection.sendMessagePromise<HAArea[]>({
        type: 'config/area_registry/list'
    });
    return result;
}

/** Fetch all devices from HA device registry */
export async function fetchDevices(): Promise<HADevice[]> {
    if (!connection) throw new Error('Not connected to Home Assistant');
    const result = await connection.sendMessagePromise<HADevice[]>({
        type: 'config/device_registry/list'
    });
    return result;
}

/** Fetch all entity registry entries */
export async function fetchEntityRegistry(): Promise<HAEntityRegistryEntry[]> {
    if (!connection) throw new Error('Not connected to Home Assistant');
    const result = await connection.sendMessagePromise<HAEntityRegistryEntry[]>({
        type: 'config/entity_registry/list'
    });
    return result;
}

/**
 * Discover all entities and group them by HA area.
 * Resolution order: entity.area_id → device.area_id → unassigned
 */
export async function discoverEntities(): Promise<DiscoveryResult> {
    const [areas, devices, entityRegistry] = await Promise.all([
        fetchAreas(),
        fetchDevices(),
        fetchEntityRegistry()
    ]);

    // Build a device → area lookup
    const deviceAreaMap = new Map<string, string>();
    for (const device of devices) {
        if (device.area_id) {
            deviceAreaMap.set(device.id, device.area_id);
        }
    }

    // Supported domains for dashboard tiles
    const supportedDomains = new Set([
        'light', 'switch', 'climate', 'cover', 'sensor', 'media_player',
        'camera', 'fan', 'lock', 'alarm_control_panel', 'input_boolean', 'automation'
    ]);

    // Group entities by area_id
    const areaEntities = new Map<string, string[]>();
    const unassigned: string[] = [];
    const favoriteEntities: string[] = [];
    const centralEntities: string[] = [];

    for (const entry of entityRegistry) {
        // Skip disabled/hidden entities
        if (entry.disabled_by || entry.hidden_by) continue;

        const domain = entry.entity_id.split('.')[0];
        if (!supportedDomains.has(domain)) continue;

        // Check for HA "Favorit" label (stored as lowercase slug)
        if (entry.labels?.some(l => l.toLowerCase() === 'favorit')) {
            favoriteEntities.push(entry.entity_id);
        }

        // Check for HA "Zentral" label
        if (entry.labels?.some(l => l.toLowerCase() === 'zentral')) {
            centralEntities.push(entry.entity_id);
        }

        // Resolve area: entity-level override > device-level
        const areaId = entry.area_id || (entry.device_id ? deviceAreaMap.get(entry.device_id) : undefined);

        if (areaId) {
            if (!areaEntities.has(areaId)) areaEntities.set(areaId, []);
            areaEntities.get(areaId)!.push(entry.entity_id);
        } else {
            unassigned.push(entry.entity_id);
        }
    }

    // Build result with area metadata
    const result: DiscoveryResult = {
        areas: areas
            .filter(a => areaEntities.has(a.area_id))
            .map(a => ({
                area: a,
                entities: areaEntities.get(a.area_id)!
            })),
        unassigned,
        favoriteEntities,
        centralEntities
    };

    return result;
}
