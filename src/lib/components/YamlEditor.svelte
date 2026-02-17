<script lang="ts">
    import { showYamlEditor, dashboardConfig } from "$lib/stores";
    import { saveConfig } from "$lib/config";
    import yaml from "js-yaml";
    import type { DashboardConfig } from "$lib/types";

    let yamlText = $state("");
    let errorMsg = $state("");
    let copied = $state(false);

    // Sync YAML text when dialog opens
    $effect(() => {
        if ($showYamlEditor) {
            yamlText = yaml.dump($dashboardConfig, {
                indent: 2,
                lineWidth: 120,
                noRefs: true,
                sortKeys: false,
            });
            errorMsg = "";
            copied = false;
        }
    });

    function handleSave() {
        errorMsg = "";
        try {
            const parsed = yaml.load(yamlText) as DashboardConfig;

            // Basic validation
            if (!parsed || typeof parsed !== "object") {
                errorMsg = "Invalid config: must be an object";
                return;
            }
            if (!Array.isArray(parsed.views)) {
                errorMsg = "Invalid config: 'views' must be an array";
                return;
            }
            if (!parsed.settings || typeof parsed.settings !== "object") {
                errorMsg = "Invalid config: 'settings' is required";
                return;
            }

            // Ensure version
            if (!parsed.version) parsed.version = 1;
            if (!parsed.title) parsed.title = "My Home";

            saveConfig(parsed);
            close();
        } catch (e) {
            if (e instanceof yaml.YAMLException) {
                errorMsg = `YAML Error: ${e.message}`;
            } else {
                errorMsg = `Error: ${e instanceof Error ? e.message : String(e)}`;
            }
        }
    }

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(yamlText);
            copied = true;
            setTimeout(() => (copied = false), 2000);
        } catch {
            // Fallback
            const textarea = document.createElement("textarea");
            textarea.value = yamlText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            copied = true;
            setTimeout(() => (copied = false), 2000);
        }
    }

    function close() {
        showYamlEditor.set(false);
        errorMsg = "";
    }

    function handleOverlayClick(e: MouseEvent) {
        if ((e.target as HTMLElement).classList.contains("dialog-overlay"))
            close();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") close();
        // Tab support inside textarea
        if (e.key === "Tab") {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            yamlText =
                yamlText.substring(0, start) + "  " + yamlText.substring(end);
            // Restore cursor after Svelte re-renders
            requestAnimationFrame(() => {
                target.selectionStart = target.selectionEnd = start + 2;
            });
        }
    }

    let lineCount = $derived(yamlText.split("\n").length);
</script>

{#if $showYamlEditor}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="dialog-overlay" onclick={handleOverlayClick}>
        <div class="editor-dialog animate-scale-in">
            <div class="editor-header">
                <div class="editor-title-row">
                    <span class="editor-title">YAML Config</span>
                    <span class="editor-badge">{lineCount} lines</span>
                </div>
                <div class="editor-actions">
                    <button
                        class="action-btn"
                        onclick={handleCopy}
                        title="Copy to clipboard"
                    >
                        {#if copied}
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="var(--accent)"
                                stroke-width="2"
                            >
                                <path d="M5 13l4 4L19 7" />
                            </svg>
                        {:else}
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <rect
                                    x="9"
                                    y="9"
                                    width="13"
                                    height="13"
                                    rx="2"
                                />
                                <path
                                    d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                />
                            </svg>
                        {/if}
                    </button>
                    <button
                        class="close-btn"
                        onclick={close}
                        aria-label="Close"
                    >
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
            </div>

            {#if errorMsg}
                <div class="error-bar">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {errorMsg}
                </div>
            {/if}

            <div class="editor-body">
                <textarea
                    class="yaml-textarea"
                    bind:value={yamlText}
                    onkeydown={handleKeydown}
                    spellcheck="false"
                    autocomplete="off"
                ></textarea>
            </div>

            <div class="editor-footer">
                <button class="btn-cancel" onclick={close}>Cancel</button>
                <button class="btn-save" onclick={handleSave}
                    >Save Config</button
                >
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
        padding: var(--space-md);
    }

    .editor-dialog {
        width: 100%;
        max-width: 640px;
        height: 85vh;
        background: var(--bg-surface);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-tile);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    /* ── Header ── */
    .editor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--border-subtle);
    }

    .editor-title-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }

    .editor-title {
        font-size: var(--font-lg);
        font-weight: 600;
        color: var(--text-primary);
    }

    .editor-badge {
        font-size: var(--font-2xs);
        color: var(--text-muted);
        background: var(--bg-primary);
        padding: 2px 8px;
        border-radius: var(--radius-full);
    }

    .editor-actions {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
    }

    .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: var(--radius-sm);
        color: var(--text-muted);
        transition: all var(--transition-fast);
    }

    .action-btn:hover {
        color: var(--text-primary);
        background: var(--bg-surface-hover);
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

    /* ── Error ── */
    .error-bar {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-lg);
        background: rgba(232, 80, 80, 0.1);
        color: var(--color-error);
        font-size: var(--font-xs);
        border-bottom: 1px solid rgba(232, 80, 80, 0.2);
    }

    /* ── Body ── */
    .editor-body {
        flex: 1;
        overflow: hidden;
        position: relative;
    }

    .yaml-textarea {
        width: 100%;
        height: 100%;
        resize: none;
        padding: var(--space-md) var(--space-lg);
        font-family: "SF Mono", "Fira Code", "Cascadia Code", "JetBrains Mono",
            monospace;
        font-size: 13px;
        line-height: 1.6;
        background: var(--bg-primary);
        color: var(--text-primary);
        border: none;
        outline: none;
        tab-size: 2;
        white-space: pre;
        overflow: auto;
    }

    .yaml-textarea::placeholder {
        color: var(--text-muted);
    }

    .yaml-textarea:focus {
        box-shadow: inset 0 0 0 1px var(--accent);
    }

    /* ── Footer ── */
    .editor-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-sm);
        padding: var(--space-md) var(--space-lg);
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
