<script lang="ts">
    import * as mdiIcons from "@mdi/js";

    interface Props {
        name: string; // e.g. "mdi:sofa" or "mdi:bed-double"
        size?: number; // px, default 24
        color?: string; // CSS color, default currentColor
    }

    let { name, size = 24, color = "currentColor" }: Props = $props();

    /**
     * Convert "mdi:bed-double" → "mdiBedDouble" to match @mdi/js exports.
     */
    function mdiNameToKey(mdiName: string): string {
        const raw = mdiName.replace(/^mdi:/, "");
        return (
            "mdi" +
            raw
                .split("-")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join("")
        );
    }

    let pathData = $derived(
        (() => {
            if (!name || !name.startsWith("mdi:")) return "";
            const key = mdiNameToKey(name);
            return (mdiIcons as Record<string, string>)[key] || "";
        })(),
    );

    // Fallback: first letter of the icon name
    let fallbackLetter = $derived(
        name ? name.replace("mdi:", "").charAt(0).toUpperCase() : "?",
    );
</script>

{#if pathData}
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color}
        aria-hidden="true"
    >
        <path d={pathData} />
    </svg>
{:else}
    <span
        class="mdi-fallback"
        style="width:{size}px;height:{size}px;font-size:{Math.round(
            size * 0.55,
        )}px;color:{color}"
    >
        {fallbackLetter}
    </span>
{/if}

<style>
    svg {
        display: inline-block;
        vertical-align: middle;
        flex-shrink: 0;
    }

    .mdi-fallback {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        opacity: 0.7;
        flex-shrink: 0;
    }
</style>
