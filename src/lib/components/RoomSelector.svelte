<script lang="ts">
    import { currentTabViews, dashboardConfig, editMode } from "$lib/stores";
    import { saveConfig } from "$lib/config";
    import MdiIcon from "./MdiIcon.svelte";

    interface Props {
        onSelect: (roomId: string, roomName: string) => void;
    }

    let { onSelect }: Props = $props();

    // Favorite rooms = those with isFavorite flag
    let favouriteRooms = $derived($currentTabViews.filter((v) => v.isFavorite));
    // All rooms alphabetically (excluding favorites)
    let otherRooms = $derived(
        [...$currentTabViews]
            .filter((v) => !v.isFavorite)
            .sort((a, b) => a.name.localeCompare(b.name)),
    );

    function toggleFavorite(viewId: string) {
        dashboardConfig.update((config) => {
            const view = config.views.find((v) => v.id === viewId);
            if (view) {
                view.isFavorite = !view.isFavorite;
            }
            saveConfig(config);
            return { ...config };
        });
    }
</script>

<div class="rooms-page">
    <div class="rooms-heading">
        <span class="rooms-subtitle">ZUHAUSE</span>
        <h1 class="rooms-title">Räume</h1>
    </div>

    {#if favouriteRooms.length > 0}
        <section class="rooms-section">
            <h3 class="section-label">Favoriten</h3>
            <div class="room-grid">
                {#each favouriteRooms as room}
                    <button
                        class="room-card"
                        onclick={() => onSelect(room.id, room.name)}
                    >
                        <div
                            class="room-icon"
                            style="color: {room.color || '#888'}"
                        >
                            <MdiIcon
                                name={room.icon}
                                size={48}
                                color={room.color || "#888"}
                            />
                        </div>
                        <span class="room-name">{room.name}</span>
                        {#if $editMode}
                            <!-- svelte-ignore node_invalid_placement_ssr -->
                            <div
                                class="fav-toggle active"
                                role="button"
                                tabindex="0"
                                onclick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(room.id);
                                }}
                                onkeydown={(e) => {
                                    if (e.key === "Enter") {
                                        e.stopPropagation();
                                        toggleFavorite(room.id);
                                    }
                                }}
                                title="Aus Favoriten entfernen"
                            >
                                <MdiIcon
                                    name="mdi:star"
                                    size={16}
                                    color="#e8c840"
                                />
                            </div>
                        {/if}
                    </button>
                {/each}
            </div>
        </section>
    {/if}

    <section class="rooms-section">
        <h3 class="section-label">Alle</h3>
        <div class="room-list">
            {#each otherRooms as room}
                <button
                    class="room-list-item"
                    onclick={() => onSelect(room.id, room.name)}
                >
                    <div
                        class="room-list-icon"
                        style="color: {room.color || '#888'}"
                    >
                        <MdiIcon
                            name={room.icon}
                            size={24}
                            color={room.color || "#888"}
                        />
                    </div>
                    <span class="room-list-name">{room.name}</span>
                    {#if $editMode}
                        <!-- svelte-ignore node_invalid_placement_ssr -->
                        <div
                            class="fav-toggle"
                            role="button"
                            tabindex="0"
                            onclick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(room.id);
                            }}
                            onkeydown={(e) => {
                                if (e.key === "Enter") {
                                    e.stopPropagation();
                                    toggleFavorite(room.id);
                                }
                            }}
                            title="Zu Favoriten hinzufügen"
                        >
                            <MdiIcon
                                name="mdi:star-outline"
                                size={16}
                                color="#555"
                            />
                        </div>
                    {/if}
                </button>
            {/each}
        </div>
    </section>
</div>

<style>
    .rooms-page {
        padding: var(--space-md) var(--space-md)
            calc(var(--bottombar-height) + var(--space-lg));
    }

    .rooms-heading {
        margin-bottom: var(--space-lg);
    }

    .rooms-subtitle {
        font-size: var(--font-2xs);
        font-weight: 600;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        text-transform: uppercase;
    }

    .rooms-title {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 2px 0 0;
    }

    .rooms-section {
        margin-bottom: var(--space-xl);
    }

    .section-label {
        font-size: var(--font-xs);
        font-weight: 500;
        color: var(--text-muted);
        margin-bottom: var(--space-sm);
    }

    /* ── Grid Cards (Favourites) ── */
    .room-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-sm);
    }

    .room-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-sm);
        padding: var(--space-lg) var(--space-md);
        background: var(--bg-surface);
        border: 1px solid var(--border-tile);
        border-radius: var(--radius-lg);
        transition: all var(--transition-fast);
        aspect-ratio: 1 / 0.85;
        cursor: pointer;
    }

    .room-card:hover {
        background: var(--bg-surface-hover);
        border-color: rgba(255, 255, 255, 0.1);
    }

    .room-card:active {
        transform: scale(0.97);
    }

    .room-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
    }

    .room-name {
        font-size: var(--font-sm);
        font-weight: 500;
        color: var(--text-primary);
        text-align: center;
    }

    /* ── All List ── */
    .room-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
    }

    .room-list-item {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-sm) var(--space-md);
        background: var(--bg-surface);
        border: 1px solid var(--border-tile);
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);
        cursor: pointer;
        text-align: left;
    }

    .room-list-item:hover {
        background: var(--bg-surface-hover);
    }

    .room-list-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
    }

    .room-list-name {
        font-size: var(--font-sm);
        font-weight: 500;
        color: var(--text-primary);
        flex: 1;
    }

    /* Favorite toggle button */
    .fav-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        flex-shrink: 0;
        transition: all var(--transition-fast);
    }

    .fav-toggle:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    @media (min-width: 768px) {
        .room-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (min-width: 1024px) {
        .room-grid {
            grid-template-columns: repeat(4, 1fr);
        }

        .rooms-page {
            max-width: 900px;
            margin: 0 auto;
        }
    }
</style>
