<script lang="ts">
    import { dashboardConfig, showOnboarding, entityStates } from "$lib/stores";
    import { discoverEntities } from "$lib/hass";
    import { saveConfig, generateId } from "$lib/config";
    import type { DiscoveryResult, TileType, ViewConfig } from "$lib/types";
    import MdiIcon from "./MdiIcon.svelte";

    type Step =
        | "welcome"
        | "discover"
        | "review"
        | "zentrale"
        | "weather"
        | "done";
    let step = $state<Step>("welcome");
    let discovery = $state<DiscoveryResult | null>(null);
    let errorMsg = $state("");
    let brandTitle = $state("LoxHome");
    let selectedCentralId = $state<string | null>(null);
    /** track which discovered rooms to include */
    let enabledAreas = $state<Set<string>>(new Set());

    /** weather entity selection */
    let selectedWeatherEntity = $state("weather.home");

    const roomColors = [
        "#69b34c",
        "#e8c840",
        "#4aa8d8",
        "#e85050",
        "#ab47bc",
        "#8d6e63",
        "#26c6da",
        "#e84898",
    ];

    /** Return the area's MDI icon or a sensible fallback */
    function resolveAreaIcon(icon: string | undefined): string {
        if (icon && icon.startsWith("mdi:")) return icon;
        return "mdi:home";
    }

    function detectTileType(entityId: string): TileType {
        const domain = entityId.split(".")[0];
        const typeMap: Record<string, TileType> = {
            light: "light",
            switch: "switch",
            climate: "climate",
            cover: "cover",
            sensor: "sensor",
            media_player: "media",
            camera: "camera",
        };
        return typeMap[domain] || "generic";
    }

    async function runDiscovery() {
        step = "discover";
        errorMsg = "";
        try {
            discovery = await discoverEntities();
            // Enable all areas by default
            enabledAreas = new Set(discovery.areas.map((a) => a.area.area_id));
            step = "review";
        } catch (e) {
            errorMsg =
                e instanceof Error ? e.message : "Erkennung fehlgeschlagen";
            step = "discover"; // stay on discover with error
        }
    }

    function toggleArea(areaId: string) {
        const next = new Set(enabledAreas);
        if (next.has(areaId)) next.delete(areaId);
        else next.add(areaId);
        enabledAreas = next;
    }

    function goToZentrale() {
        step = "zentrale";
    }

    function goToWeather() {
        step = "weather";
    }

    /** Discover all weather.* entities from current HA states */
    let weatherEntities = $derived(
        Object.keys($entityStates).filter((id) => id.startsWith("weather.")),
    );

    function finish() {
        if (!discovery) return;

        // Build views from selected areas
        const selectedAreas = discovery.areas.filter((a) =>
            enabledAreas.has(a.area.area_id),
        );
        const views: ViewConfig[] = selectedAreas.map((item, i) => ({
            id: generateId(),
            name: item.area.name,
            icon: resolveAreaIcon(item.area.icon),
            color: roomColors[i % roomColors.length],
            order: i,
            tiles: item.entities.map((entityId, j) => ({
                id: generateId(),
                type: detectTileType(entityId),
                entityId,
                size: "1x1" as const,
                order: j,
                dimmable: entityId.startsWith("light."),
            })),
        }));

        // Favoriten — only entities with HA "Favorit" label
        if (discovery.favoriteEntities.length > 0) {
            views.unshift({
                id: "favourites",
                name: "Favoriten",
                icon: "mdi:star",
                color: "#e8c840",
                order: -1,
                tiles: discovery.favoriteEntities
                    .slice(0, 30)
                    .map((entityId, j) => ({
                        id: generateId(),
                        type: detectTileType(entityId),
                        entityId,
                        size: "1x1" as const,
                        order: j,
                        dimmable: entityId.startsWith("light."),
                    })),
            });
        }

        // Zentrale — only entities with HA "Zentral" label
        if (discovery.centralEntities.length > 0) {
            views.unshift({
                id: "central",
                name: "Zentrale",
                icon: "mdi:home",
                color: "#69b34c",
                order: -2,
                tiles: discovery.centralEntities
                    .slice(0, 50)
                    .map((entityId, j) => ({
                        id: generateId(),
                        type: detectTileType(entityId),
                        entityId,
                        size: "1x1" as const,
                        order: j,
                        dimmable: entityId.startsWith("light."),
                    })),
            });
        }

        views.forEach((v, i) => (v.order = i));

        dashboardConfig.update((config) => {
            config.views = views;
            config.title = brandTitle || "Mein Zuhause";
            config.settings = {
                ...config.settings,
                brandTitle: brandTitle || "LoxHome",
                centralViewId:
                    (discovery?.centralEntities?.length ?? 0) > 0
                        ? "central"
                        : "",
                weatherEntityId: selectedWeatherEntity || "weather.home",
            };
            saveConfig(config);
            return { ...config };
        });

        localStorage.setItem("loxhome-onboarding-done", "true");
        step = "done";
    }

    function closeDone() {
        showOnboarding.set(false);
    }

    let totalEntities = $derived(
        discovery
            ? discovery.areas
                  .filter((a) => enabledAreas.has(a.area.area_id))
                  .reduce((sum, a) => sum + a.entities.length, 0) +
                  (discovery.favoriteEntities.length || 0)
            : 0,
    );

    let selectedAreaCount = $derived(enabledAreas.size);

    const STEPS: Step[] = [
        "welcome",
        "discover",
        "review",
        "zentrale",
        "weather",
        "done",
    ];
</script>

{#if $showOnboarding}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="wizard-overlay">
        <div class="wizard animate-scale-in">
            <!-- ── Progress bar ── -->
            <div class="wizard-progress">
                {#each STEPS as s, i}
                    <div
                        class="progress-dot {step === s
                            ? 'active'
                            : ''} {STEPS.indexOf(step) > i ? 'completed' : ''}"
                    ></div>
                    {#if i < STEPS.length - 1}<div
                            class="progress-line {STEPS.indexOf(step) > i
                                ? 'completed'
                                : ''}"
                        ></div>{/if}
                {/each}
            </div>

            <div class="wizard-body">
                <!-- ═══ STEP 1: Welcome ═══ -->
                {#if step === "welcome"}
                    <div class="step-section">
                        <div class="step-icon">
                            <MdiIcon
                                name="mdi:home"
                                size={56}
                                color="var(--accent)"
                            />
                        </div>
                        <h2 class="step-title">Willkommen bei LoxHome</h2>
                        <p class="step-desc">
                            Richte dein Dashboard in wenigen Schritten ein. Wir
                            erkennen automatisch deine Räume und Geräte aus Home
                            Assistant.
                        </p>

                        <div class="form-field">
                            <label for="brand-title">Dashboard-Name</label>
                            <input
                                id="brand-title"
                                type="text"
                                bind:value={brandTitle}
                                placeholder="LoxHome"
                            />
                            <p class="field-hint">
                                Wird oben im Header angezeigt
                            </p>
                        </div>

                        <button class="btn-primary" onclick={runDiscovery}>
                            Einrichtung starten
                        </button>
                    </div>

                    <!-- ═══ STEP 2: Discovering ═══ -->
                {:else if step === "discover"}
                    <div class="step-section">
                        {#if errorMsg}
                            <div class="step-icon">
                                <MdiIcon
                                    name="mdi:alert"
                                    size={56}
                                    color="var(--color-error)"
                                />
                            </div>
                            <h2 class="step-title">Fehler bei der Erkennung</h2>
                            <p class="step-error">{errorMsg}</p>
                            <button
                                class="btn-secondary"
                                onclick={runDiscovery}
                            >
                                Erneut versuchen
                            </button>
                        {:else}
                            <div class="spinner"></div>
                            <p class="loading-text">
                                Bereiche & Entitäten werden gescannt...
                            </p>
                        {/if}
                    </div>

                    <!-- ═══ STEP 3: Review ═══ -->
                {:else if step === "review"}
                    <div class="step-section compact">
                        <h2 class="step-title-sm">Erkannte Räume</h2>
                        <p class="step-desc-sm">
                            Wähle die Räume, die im Dashboard angezeigt werden
                            sollen.
                        </p>

                        <div class="summary-bar">
                            <span class="summary-stat">
                                <strong>{selectedAreaCount}</strong> Räume
                            </span>
                            <span class="summary-divider">·</span>
                            <span class="summary-stat">
                                <strong>{totalEntities}</strong> Entitäten
                            </span>
                        </div>

                        <div class="room-list">
                            {#each discovery?.areas || [] as item, i}
                                <button
                                    class="room-row {enabledAreas.has(
                                        item.area.area_id,
                                    )
                                        ? 'enabled'
                                        : 'disabled'}"
                                    onclick={() =>
                                        toggleArea(item.area.area_id)}
                                >
                                    <span class="room-check">
                                        {#if enabledAreas.has(item.area.area_id)}
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="var(--accent)"
                                                stroke-width="3"
                                            >
                                                <polyline
                                                    points="20 6 9 17 4 12"
                                                />
                                            </svg>
                                        {:else}
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="var(--text-muted)"
                                                stroke-width="2"
                                            >
                                                <rect
                                                    x="3"
                                                    y="3"
                                                    width="18"
                                                    height="18"
                                                    rx="3"
                                                />
                                            </svg>
                                        {/if}
                                    </span>
                                    <span class="room-icon-sm"
                                        ><MdiIcon
                                            name={resolveAreaIcon(
                                                item.area.icon,
                                            )}
                                            size={20}
                                        /></span
                                    >
                                    <span class="room-name-text"
                                        >{item.area.name}</span
                                    >
                                    <span class="room-count"
                                        >{item.entities.length}</span
                                    >
                                </button>
                            {/each}
                            {#if (discovery?.favoriteEntities.length || 0) > 0}
                                <div class="room-row unassigned-row">
                                    <span class="room-check"></span>
                                    <span class="room-icon-sm"
                                        ><MdiIcon
                                            name="mdi:star"
                                            size={20}
                                            color="#e8c840"
                                        /></span
                                    >
                                    <span class="room-name-text"
                                        >Favoriten (mit Label)</span
                                    >
                                    <span class="room-count"
                                        >{discovery?.favoriteEntities
                                            .length}</span
                                    >
                                </div>
                            {/if}
                        </div>

                        <div class="step-actions">
                            <button
                                class="btn-secondary"
                                onclick={() => (step = "welcome")}
                                >Zurück</button
                            >
                            <button
                                class="btn-primary"
                                onclick={goToZentrale}
                                disabled={selectedAreaCount === 0}
                            >
                                Weiter
                            </button>
                        </div>
                    </div>

                    <!-- ═══ STEP 4: Zentrale ═══ -->
                {:else if step === "zentrale"}
                    <div class="step-section compact">
                        <h2 class="step-title-sm">Zentrale einrichten</h2>
                        <p class="step-desc-sm">
                            Wähle einen Raum für den „Zentrale"-Tab. Dieser wird
                            als Startseite angezeigt.
                        </p>

                        <div class="zentrale-list">
                            {#each discovery?.areas.filter( (a) => enabledAreas.has(a.area.area_id), ) || [] as item, i}
                                <button
                                    class="zentrale-row {selectedCentralId ===
                                    item.area.area_id
                                        ? 'selected'
                                        : ''}"
                                    onclick={() =>
                                        (selectedCentralId =
                                            selectedCentralId ===
                                            item.area.area_id
                                                ? null
                                                : item.area.area_id)}
                                >
                                    <span class="room-icon-sm"
                                        ><MdiIcon
                                            name={resolveAreaIcon(
                                                item.area.icon,
                                            )}
                                            size={20}
                                        /></span
                                    >
                                    <span class="room-name-text"
                                        >{item.area.name}</span
                                    >
                                    {#if selectedCentralId === item.area.area_id}
                                        <span class="zentrale-badge"
                                            >Zentrale</span
                                        >
                                    {/if}
                                </button>
                            {/each}
                        </div>

                        <p class="field-hint zentrale-hint">
                            Optional — du kannst dies auch später ändern.
                        </p>

                        <div class="step-actions">
                            <button
                                class="btn-secondary"
                                onclick={() => (step = "review")}>Zurück</button
                            >
                            <button class="btn-primary" onclick={goToWeather}>
                                Weiter
                            </button>
                        </div>
                    </div>

                    <!-- ═══ STEP 5: Weather ═══ -->
                {:else if step === "weather"}
                    <div class="step-section compact">
                        <h2 class="step-title-sm">Wetter-Entität</h2>
                        <p class="step-desc-sm">
                            Wähle eine Wetter-Entität für die Anzeige im Header.
                        </p>

                        {#if weatherEntities.length > 0}
                            <div class="zentrale-list">
                                {#each weatherEntities as entity}
                                    <button
                                        class="zentrale-row {selectedWeatherEntity ===
                                        entity
                                            ? 'selected'
                                            : ''}"
                                        onclick={() =>
                                            (selectedWeatherEntity = entity)}
                                    >
                                        <span class="room-icon-sm"
                                            ><MdiIcon
                                                name="mdi:weather-partly-cloudy"
                                                size={20}
                                            /></span
                                        >
                                        <span class="room-name-text"
                                            >{entity}</span
                                        >
                                        {#if selectedWeatherEntity === entity}
                                            <span class="zentrale-badge"
                                                >Ausgewählt</span
                                            >
                                        {/if}
                                    </button>
                                {/each}
                            </div>
                        {:else}
                            <div class="form-field">
                                <label for="weather-entity"
                                    >Wetter Entity-ID</label
                                >
                                <input
                                    id="weather-entity"
                                    type="text"
                                    bind:value={selectedWeatherEntity}
                                    placeholder="weather.home"
                                />
                                <p class="field-hint">
                                    Keine Wetter-Entitäten gefunden. Manuell
                                    eingeben.
                                </p>
                            </div>
                        {/if}

                        <p class="field-hint zentrale-hint">
                            Optional — du kannst dies auch später ändern.
                        </p>

                        <div class="step-actions">
                            <button
                                class="btn-secondary"
                                onclick={() => (step = "zentrale")}
                                >Zurück</button
                            >
                            <button class="btn-primary" onclick={finish}>
                                Dashboard erstellen
                            </button>
                        </div>
                    </div>

                    <!-- ═══ STEP 6: Done ═══ -->
                {:else if step === "done"}
                    <div class="step-section">
                        <div class="step-icon done-icon">
                            <MdiIcon
                                name="mdi:check-circle"
                                size={56}
                                color="var(--accent)"
                            />
                        </div>
                        <h2 class="step-title">Fertig!</h2>
                        <p class="step-desc">
                            Dein Dashboard wurde mit
                            <strong>{selectedAreaCount}</strong> Räumen und
                            <strong>{totalEntities}</strong> Entitäten eingerichtet.
                        </p>
                        <button class="btn-primary" onclick={closeDone}>
                            Dashboard starten
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .wizard-overlay {
        position: fixed;
        inset: 0;
        background: var(--bg-overlay);
        z-index: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-lg);
    }

    .wizard {
        width: 100%;
        max-width: 480px;
        max-height: 90vh;
        background: var(--bg-surface);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-tile);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    /* ── Progress ── */
    .wizard-progress {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-lg) var(--space-xl);
        gap: 0;
    }

    .progress-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--border-tile);
        transition: all 0.3s ease;
        flex-shrink: 0;
    }

    .progress-dot.active {
        background: var(--accent);
        box-shadow: 0 0 8px var(--accent);
        transform: scale(1.2);
    }

    .progress-dot.completed {
        background: var(--accent);
    }

    .progress-line {
        flex: 1;
        height: 2px;
        background: var(--border-tile);
        max-width: 40px;
        transition: background 0.3s ease;
    }

    .progress-line.completed {
        background: var(--accent);
    }

    /* ── Body ── */
    .wizard-body {
        flex: 1;
        overflow-y: auto;
        padding: 0 var(--space-xl) var(--space-xl);
    }

    .step-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--space-md);
    }

    .step-section.compact {
        text-align: left;
        align-items: stretch;
    }

    .step-icon {
        font-size: 56px;
        margin-bottom: var(--space-sm);
    }

    .done-icon {
        animation: popIn 0.4s ease;
    }

    @keyframes popIn {
        0% {
            transform: scale(0);
        }
        80% {
            transform: scale(1.15);
        }
        100% {
            transform: scale(1);
        }
    }

    .step-title {
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary);
    }

    .step-title-sm {
        font-size: var(--font-lg);
        font-weight: 600;
        color: var(--text-primary);
        text-align: center;
    }

    .step-desc {
        font-size: var(--font-sm);
        color: var(--text-secondary);
        max-width: 340px;
        line-height: 1.6;
    }

    .step-desc-sm {
        font-size: var(--font-sm);
        color: var(--text-secondary);
        line-height: 1.5;
        text-align: center;
        margin-bottom: var(--space-sm);
    }

    .step-error {
        color: var(--color-error);
        font-size: var(--font-sm);
    }

    /* ── Form fields ── */
    .form-field {
        width: 100%;
        max-width: 300px;
        text-align: left;
    }

    .form-field label {
        display: block;
        font-size: var(--font-xs);
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: var(--space-xs);
    }

    .form-field input {
        width: 100%;
        padding: var(--space-sm) var(--space-md);
        background: var(--bg-primary);
        border: 1px solid var(--border-tile);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-size: var(--font-sm);
    }

    .form-field input:focus {
        border-color: var(--accent);
        outline: none;
    }

    .field-hint {
        font-size: var(--font-xs);
        color: var(--text-muted);
        margin-top: 4px;
    }

    /* ── Spinner ── */
    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-tile);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .loading-text {
        color: var(--text-secondary);
        font-size: var(--font-sm);
    }

    /* ── Summary bar ── */
    .summary-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-sm);
        padding: var(--space-sm);
        background: var(--accent-subtle);
        border-radius: var(--radius-sm);
        font-size: var(--font-sm);
        color: var(--text-primary);
    }

    .summary-divider {
        color: var(--text-muted);
    }

    /* ── Room list (review) ── */
    .room-list {
        display: flex;
        flex-direction: column;
        gap: 3px;
        max-height: 280px;
        overflow-y: auto;
    }

    .room-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-sm);
        background: var(--bg-primary);
        cursor: pointer;
        transition: all var(--transition-fast);
        border: none;
        color: inherit;
        font: inherit;
        text-align: left;
        width: 100%;
    }

    .room-row:hover {
        background: var(--bg-surface-hover);
    }

    .room-row.disabled {
        opacity: 0.4;
    }

    .room-row.unassigned-row {
        border: 1px dashed var(--border-tile);
        background: transparent;
        cursor: default;
    }

    .room-check {
        width: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .room-icon-sm {
        font-size: 16px;
        width: 24px;
        text-align: center;
    }

    .room-name-text {
        flex: 1;
        font-size: var(--font-sm);
        font-weight: 500;
    }

    .room-count {
        font-size: var(--font-xs);
        color: var(--text-muted);
        min-width: 20px;
        text-align: right;
    }

    /* ── Zentrale list ── */
    .zentrale-list {
        display: flex;
        flex-direction: column;
        gap: 3px;
        max-height: 280px;
        overflow-y: auto;
    }

    .zentrale-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-sm);
        background: var(--bg-primary);
        cursor: pointer;
        transition: all var(--transition-fast);
        border: 2px solid transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        width: 100%;
    }

    .zentrale-row:hover {
        background: var(--bg-surface-hover);
    }

    .zentrale-row.selected {
        border-color: var(--accent);
        background: rgba(105, 179, 76, 0.08);
    }

    .zentrale-badge {
        font-size: var(--font-xs);
        font-weight: 600;
        color: var(--accent);
        background: rgba(105, 179, 76, 0.15);
        padding: 2px 8px;
        border-radius: 10px;
    }

    .zentrale-hint {
        text-align: center;
        margin-top: var(--space-sm);
    }

    /* ── Action buttons ── */
    .step-actions {
        display: flex;
        justify-content: space-between;
        gap: var(--space-sm);
        margin-top: var(--space-md);
    }

    .btn-primary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-sm);
        padding: var(--space-md) var(--space-xl);
        border-radius: var(--radius-sm);
        font-size: var(--font-sm);
        font-weight: 600;
        background: var(--accent);
        color: white;
        transition: all var(--transition-fast);
        margin-top: var(--space-sm);
    }

    .btn-primary:hover {
        background: var(--accent-hover);
    }
    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-secondary {
        padding: var(--space-md) var(--space-lg);
        border-radius: var(--radius-sm);
        font-size: var(--font-sm);
        color: var(--text-secondary);
        transition: all var(--transition-fast);
    }

    .btn-secondary:hover {
        color: var(--text-primary);
    }
</style>
