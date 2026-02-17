import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { DashboardConfig, EntityState, ViewConfig } from './types';
import { DEFAULT_DASHBOARD } from './types';

// ── HA Connection ──
export const hassConnected: Writable<boolean> = writable(false);
export const entityStates: Writable<Record<string, EntityState>> = writable({});

// ── Dashboard Config ──
export const dashboardConfig: Writable<DashboardConfig> = writable(DEFAULT_DASHBOARD);

// ── UI State ──
export const editMode: Writable<boolean> = writable(false);
export const activeViewId: Writable<string> = writable('favourites');
export const activeTab: Writable<'favourites' | 'central' | 'rooms' | 'categories'> = writable('favourites');

// ── Sidebar ──
export const sidebarOpen: Writable<boolean> = writable(true);

// ── Modals / Dialogs ──
export const modalEntityId: Writable<string | null> = writable(null);
export const showAddTileDialog: Writable<boolean> = writable(false);
export const showViewEditor: Writable<boolean> = writable(false);
export const showAutoSetup: Writable<boolean> = writable(false);
export const showOnboarding: Writable<boolean> = writable(false);
export const showYamlEditor: Writable<boolean> = writable(false);
export const editingTileId: Writable<string | null> = writable(null);

// ── Time ──
export const currentTime: Writable<Date> = writable(new Date());

// ── Derived: views for the current tab ──
export const currentTabViews = derived(
    [dashboardConfig],
    ([$config]): ViewConfig[] => {
        return $config.views;
    }
);

// ── Derived: the currently selected view ──
export const activeView = derived(
    [currentTabViews, activeViewId],
    ([$views, $viewId]): ViewConfig | undefined => {
        return $views.find((v) => v.id === $viewId) || $views[0];
    }
);

export const allEntityIds = derived(entityStates, ($states) => {
    return Object.keys($states);
});
