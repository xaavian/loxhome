<script lang="ts">
    import { editingTileId, dashboardConfig } from "$lib/stores";
    import { saveConfig } from "$lib/config";
    import MdiIcon from "./MdiIcon.svelte";

    // Find the tile being edited across all views
    let tileData = $derived(() => {
        if (!$editingTileId) return undefined;
        for (const view of $dashboardConfig.views) {
            const tile = view.tiles.find((t) => t.id === $editingTileId);
            if (tile) return { tile, viewId: view.id };
        }
        return undefined;
    });

    let tile = $derived(tileData()?.tile);

    let editName = $state("");
    let editIcon = $state("");
    let editColor = $state("");

    // Sync form fields when tile changes
    $effect(() => {
        if ($editingTileId && tile) {
            editName = tile.name || "";
            editIcon = tile.icon || "";
            editColor = tile.color || "";
        }
    });

    function handleSave() {
        if (!$editingTileId || !tile) return;

        dashboardConfig.update((config) => {
            for (const view of config.views) {
                const t = view.tiles.find((t) => t.id === $editingTileId);
                if (t) {
                    t.name = editName || undefined;
                    t.icon = editIcon || undefined;
                    t.color = editColor || undefined;
                    break;
                }
            }
            saveConfig(config);
            return { ...config };
        });

        close();
    }

    function close() {
        editingTileId.set(null);
        editName = "";
        editIcon = "";
        editColor = "";
    }

    function handleOverlayClick(e: MouseEvent) {
        if ((e.target as HTMLElement).classList.contains("dialog-overlay"))
            close();
    }

    const commonIcons = [
        "mdi:lightbulb",
        "mdi:flash",
        "mdi:thermometer",
        "mdi:window-shutter",
        "mdi:lock",
        "mdi:music",
        "mdi:television",
        "mdi:gamepad-variant",
        "mdi:chart-bar",
        "mdi:weather-partly-cloudy",
        "mdi:water",
        "mdi:fire",
        "mdi:snowflake",
        "mdi:shower",
        "mdi:bed",
        "mdi:stove",
        "mdi:sofa",
        "mdi:home",
        "mdi:star",
        "mdi:weather-night",
        "mdi:white-balance-sunny",
        "mdi:bell",
        "mdi:camera",
        "mdi:leaf",
    ];

    const presetColors = [
        "#69b34c",
        "#e8c840",
        "#4aa8d8",
        "#e85050",
        "#ab47bc",
        "#8d6e63",
        "#26c6da",
        "#e84898",
        "#ff9800",
        "#607d8b",
        "#f5f5f5",
        "",
    ];
</script>

{#if $editingTileId && tile}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        class="dialog-overlay"
        onclick={handleOverlayClick}
        onkeydown={(e) => e.key === "Escape" && close()}
    >
        <div class="dialog animate-scale-in">
            <div class="dialog-header">
                <span class="dialog-title">Kachel bearbeiten</span>
                <button class="close-btn" onclick={close} aria-label="Close">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="dialog-body">
                <!-- Entity ID (read-only) -->
                <div class="field-group">
                    <span class="field-label">Entität</span>
                    <span class="entity-id">{tile.entityId}</span>
                </div>

                <!-- Custom Name -->
                <div class="field-group">
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label class="field-label">Eigener Name</label>
                    <input
                        type="text"
                        class="field-input"
                        placeholder="Leer lassen für Entitätsname"
                        bind:value={editName}
                    />
                </div>

                <!-- Custom Icon -->
                <div class="field-group">
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label class="field-label">Icon</label>
                    <div class="icon-row">
                        <input
                            type="text"
                            class="field-input icon-input"
                            placeholder="z.B. mdi:lightbulb"
                            bind:value={editIcon}
                        />
                        {#if editIcon}
                            <span class="icon-preview"
                                ><MdiIcon name={editIcon} size={24} /></span
                            >
                        {/if}
                    </div>
                    <div class="emoji-grid">
                        {#each commonIcons as icon}
                            <button
                                class="emoji-btn"
                                class:selected={editIcon === icon}
                                onclick={() => (editIcon = icon)}
                            >
                                <MdiIcon name={icon} size={18} />
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Icon Color -->
                <div class="field-group">
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label class="field-label">Iconfarbe</label>
                    <div class="color-grid">
                        {#each presetColors as color}
                            <button
                                class="color-swatch"
                                class:selected={editColor === color}
                                class:clear={!color}
                                style={color ? `background: ${color}` : ""}
                                onclick={() => (editColor = color)}
                                title={color || "Standard"}
                            >
                                {#if !color}✕{/if}
                            </button>
                        {/each}
                    </div>
                    <div class="custom-color-row">
                        <input
                            type="color"
                            class="color-picker"
                            bind:value={editColor}
                        />
                        <span class="color-value"
                            >{editColor || "Standard"}</span
                        >
                    </div>
                </div>
            </div>

            <div class="dialog-footer">
                <button class="btn-cancel" onclick={close}>Abbrechen</button>
                <button class="btn-save" onclick={handleSave}>Speichern</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .dialog-overlay {
        position: fixed;
        inset: 0;
        background: var(--bg-overlay);
        z-index: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-lg);
    }

    .dialog {
        width: 100%;
        max-width: 420px;
        max-height: 85vh;
        background: var(--bg-surface);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-tile);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-lg);
        border-bottom: 1px solid var(--border-subtle);
    }

    .dialog-title {
        font-size: var(--font-lg);
        font-weight: 600;
    }

    .close-btn {
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
    }

    .close-btn:hover {
        color: var(--text-primary);
        background: var(--bg-surface-hover);
    }

    .dialog-body {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-lg);
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
    }

    /* ── Fields ── */
    .field-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
    }

    .field-label {
        font-size: var(--font-xs);
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .entity-id {
        font-size: var(--font-xs);
        color: var(--text-muted);
        font-family: monospace;
    }

    .field-input {
        width: 100%;
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-subtle);
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: var(--font-sm);
    }

    .field-input:focus {
        outline: none;
        border-color: var(--accent);
    }

    /* ── Icon ── */
    .icon-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }

    .icon-input {
        flex: 1;
    }

    .icon-preview {
        font-size: 28px;
        line-height: 1;
        min-width: 36px;
        text-align: center;
    }

    .emoji-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: var(--space-xs);
    }

    .emoji-btn {
        width: 34px;
        height: 34px;
        font-size: 18px;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--transition-fast);
        background: var(--bg-primary);
    }

    .emoji-btn:hover {
        background: var(--bg-surface-hover);
        transform: scale(1.1);
    }

    .emoji-btn.selected {
        background: var(--accent-subtle);
        box-shadow: 0 0 0 2px var(--accent);
    }

    /* ── Color ── */
    .color-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: var(--space-xs);
    }

    .color-swatch {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        transition: all var(--transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: var(--text-muted);
    }

    .color-swatch.clear {
        background: var(--bg-primary);
        border: 2px dashed var(--border-tile);
    }

    .color-swatch:hover {
        transform: scale(1.15);
    }

    .color-swatch.selected {
        border-color: white;
        box-shadow: 0 0 0 2px var(--accent);
    }

    .custom-color-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-top: var(--space-xs);
    }

    .color-picker {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        padding: 0;
        background: none;
    }

    .color-value {
        font-size: var(--font-xs);
        color: var(--text-muted);
        font-family: monospace;
    }

    /* ── Footer ── */
    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-sm);
        padding: var(--space-lg);
        border-top: 1px solid var(--border-subtle);
    }

    .btn-cancel {
        padding: var(--space-sm) var(--space-lg);
        border-radius: var(--radius-sm);
        font-size: var(--font-sm);
        color: var(--text-secondary);
    }

    .btn-cancel:hover {
        color: var(--text-primary);
    }

    .btn-save {
        padding: var(--space-sm) var(--space-lg);
        border-radius: var(--radius-sm);
        font-size: var(--font-sm);
        font-weight: 600;
        background: var(--accent);
        color: white;
        transition: all var(--transition-fast);
    }

    .btn-save:hover {
        background: var(--accent-hover);
    }
</style>
