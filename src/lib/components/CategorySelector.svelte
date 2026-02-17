<script lang="ts">
    import { dashboardConfig, entityStates } from "$lib/stores";
    import { DEFAULT_CATEGORIES } from "$lib/types";
    import MdiIcon from "./MdiIcon.svelte";

    interface Props {
        onSelect: (categoryId: string, categoryName: string) => void;
    }

    let { onSelect }: Props = $props();

    // Count entities per category across ALL rooms
    let categoriesWithCounts = $derived(
        DEFAULT_CATEGORIES.map((cat) => {
            let count = 0;
            for (const view of $dashboardConfig.views) {
                for (const tile of view.tiles) {
                    const domain = tile.entityId.split(".")[0];
                    if (cat.domains.includes(domain)) count++;
                }
            }
            return { ...cat, count };
        }).filter((cat) => cat.count > 0),
    );

    // First 2 non-empty as favourites
    let favouriteCategories = $derived(categoriesWithCounts.slice(0, 2));
    let allCategories = $derived(
        [...categoriesWithCounts].sort((a, b) => a.name.localeCompare(b.name)),
    );
</script>

<div class="categories-page">
    <div class="categories-heading">
        <span class="categories-subtitle">ZUHAUSE</span>
        <h1 class="categories-title">Kategorien</h1>
    </div>

    {#if favouriteCategories.length > 0}
        <section class="categories-section">
            <h3 class="section-label">Favoriten</h3>
            <div class="category-grid">
                {#each favouriteCategories as cat}
                    <button
                        class="category-card"
                        onclick={() => onSelect(cat.id, cat.name)}
                    >
                        <div class="category-icon" style="color: {cat.color}">
                            <MdiIcon
                                name={cat.icon}
                                size={48}
                                color={cat.color}
                            />
                        </div>
                        <span class="category-name">{cat.name}</span>
                        <span class="category-count">{cat.count}</span>
                    </button>
                {/each}
            </div>
        </section>
    {/if}

    <section class="categories-section">
        <h3 class="section-label">Alle</h3>
        <div class="category-list">
            {#each allCategories as cat}
                <button
                    class="category-list-item"
                    onclick={() => onSelect(cat.id, cat.name)}
                >
                    <div class="category-list-icon" style="color: {cat.color}">
                        <MdiIcon name={cat.icon} size={28} color={cat.color} />
                    </div>
                    <span class="category-list-name">{cat.name}</span>
                    <span class="category-list-count">{cat.count}</span>
                </button>
            {/each}
        </div>
    </section>
</div>

<style>
    .categories-page {
        padding: var(--space-md) var(--space-md)
            calc(var(--bottombar-height) + var(--space-lg));
    }

    .categories-heading {
        margin-bottom: var(--space-lg);
    }

    .categories-subtitle {
        font-size: var(--font-2xs);
        font-weight: 600;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        text-transform: uppercase;
    }

    .categories-title {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 2px 0 0;
    }

    .categories-section {
        margin-bottom: var(--space-xl);
    }

    .section-label {
        font-size: var(--font-xs);
        font-weight: 500;
        color: var(--text-muted);
        margin-bottom: var(--space-sm);
    }

    /* ── Grid Cards ── */
    .category-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-sm);
    }

    .category-card {
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

    .category-card:hover {
        background: var(--bg-surface-hover);
        border-color: rgba(255, 255, 255, 0.1);
    }

    .category-card:active {
        transform: scale(0.97);
    }

    .category-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
    }

    .category-name {
        font-size: var(--font-sm);
        font-weight: 500;
        color: var(--text-primary);
        text-align: center;
    }

    .category-count {
        font-size: var(--font-2xs);
        color: var(--text-muted);
    }

    /* ── All List ── */
    .category-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
    }

    .category-list-item {
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

    .category-list-item:hover {
        background: var(--bg-surface-hover);
    }

    .category-list-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
    }

    .category-list-name {
        font-size: var(--font-sm);
        font-weight: 500;
        color: var(--text-primary);
        flex: 1;
    }

    .category-list-count {
        font-size: var(--font-xs);
        color: var(--text-muted);
    }

    @media (min-width: 768px) {
        .category-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (min-width: 1024px) {
        .category-grid {
            grid-template-columns: repeat(4, 1fr);
        }

        .categories-page {
            max-width: 900px;
            margin: 0 auto;
        }
    }
</style>
