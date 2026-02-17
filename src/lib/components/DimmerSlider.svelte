<script lang="ts">
    import MdiIcon from "./MdiIcon.svelte";
    import { entityStates } from "$lib/stores";
    import { callHAService } from "$lib/hass";

    interface Props {
        entityId: string;
        onClose: () => void;
    }

    let { entityId, onClose }: Props = $props();

    let entity = $derived($entityStates[entityId]);
    let isOn = $derived(
        entity
            ? !["off", "unavailable", "unknown"].includes(entity.state)
            : false,
    );
    let brightness = $derived(
        entity?.attributes?.brightness
            ? Math.round(((entity.attributes.brightness as number) / 255) * 100)
            : 0,
    );

    let displayName = $derived(
        (entity?.attributes?.friendly_name as string) ||
            entityId.split(".")[1]?.replace(/_/g, " ") ||
            entityId,
    );

    let dragging = $state(false);
    let localBrightness = $state(0);

    $effect(() => {
        if (!dragging) {
            localBrightness = brightness;
        }
    });

    function handleSliderInput(e: Event) {
        const target = e.target as HTMLInputElement;
        localBrightness = parseInt(target.value);
    }

    function handleSliderChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const value = parseInt(target.value);
        dragging = false;
        if (value === 0) {
            callHAService("light", "turn_off", {}, { entity_id: entityId });
        } else {
            callHAService(
                "light",
                "turn_on",
                {
                    brightness_pct: value,
                },
                { entity_id: entityId },
            );
        }
    }

    function toggleLight() {
        if (isOn) {
            callHAService("light", "turn_off", {}, { entity_id: entityId });
        } else {
            callHAService("light", "turn_on", {}, { entity_id: entityId });
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="dimmer-overlay" onclick={onClose} onkeydown={() => {}}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="dimmer-card"
        onclick={(e) => e.stopPropagation()}
        onkeydown={() => {}}
    >
        <div class="dimmer-header">
            <span class="dimmer-name">{displayName}</span>
            <span class="dimmer-pct">{localBrightness} %</span>
            <button
                class="dimmer-toggle"
                class:on={isOn}
                onclick={toggleLight}
                aria-label={isOn ? "Ausschalten" : "Einschalten"}
            >
                <div class="toggle-knob"></div>
            </button>
        </div>

        <div class="dimmer-slider-row">
            <MdiIcon
                name="mdi:brightness-5"
                size={18}
                color="var(--text-muted)"
            />
            <div class="slider-container">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={localBrightness}
                    class="dimmer-range"
                    style="--pct: {localBrightness}%"
                    oninput={handleSliderInput}
                    onchange={handleSliderChange}
                    onpointerdown={() => (dragging = true)}
                />
            </div>
            <MdiIcon
                name="mdi:brightness-7"
                size={22}
                color="var(--text-secondary)"
            />
        </div>
    </div>
</div>

<style>
    .dimmer-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        z-index: 500;
        padding: var(--space-lg);
    }

    .dimmer-card {
        background: #1c1c24;
        border-radius: var(--radius-xl);
        padding: var(--space-lg) var(--space-xl);
        width: 100%;
        max-width: 480px;
        margin-bottom: calc(var(--bottombar-height) + var(--space-md));
    }

    .dimmer-header {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        margin-bottom: var(--space-lg);
    }

    .dimmer-name {
        flex: 1;
        font-size: var(--font-md);
        font-weight: 600;
        color: var(--text-primary);
    }

    .dimmer-pct {
        font-size: var(--font-md);
        font-weight: 500;
        color: var(--text-secondary);
    }

    .dimmer-toggle {
        width: 44px;
        height: 26px;
        border-radius: 13px;
        background: var(--color-off);
        position: relative;
        transition: background var(--transition-fast);
        flex-shrink: 0;
    }

    .dimmer-toggle.on {
        background: var(--accent);
    }

    .toggle-knob {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #888;
        transition: all var(--transition-fast);
    }

    .dimmer-toggle.on .toggle-knob {
        left: 21px;
        background: white;
    }

    .dimmer-slider-row {
        display: flex;
        align-items: center;
        gap: var(--space-md);
    }

    .slider-container {
        flex: 1;
        position: relative;
    }

    .dimmer-range {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        outline: none;
        cursor: pointer;
        background: linear-gradient(
            to right,
            #888 0%,
            #888 var(--pct),
            #e8c840 var(--pct),
            #e8c840 100%
        );
    }

    .dimmer-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        cursor: pointer;
    }

    .dimmer-range::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        border: none;
    }
</style>
