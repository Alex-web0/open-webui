<script lang="ts">
    import { onMount, tick, getContext } from 'svelte';
    import { chatCompletion } from '$lib/apis/openai';
    import { WEBUI_BASE_URL } from '$lib/constants';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { user } from '$lib/stores';
    import type { Writable } from 'svelte/store';

    const i18n: Writable<any> = getContext('i18n');

    let messages: { role: string; content: string }[] = [];
    let message = '';
    let loading = false;
    let selectedModel = 'UOM-AI';
    let messagesContainer: HTMLDivElement;

    // Update selected model from query parameter if provided
    $: selectedModel = $page.url.searchParams.get('model') ?? 'UOM-AI';

    const scrollToBottom = async () => {
        await tick();
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const sendMessage = async () => {
        if (!message) return;
        messages.push({ role: 'user', content: message });
        message = '';
        loading = true;
        await scrollToBottom();

        const [res] = await chatCompletion('', {
            model: selectedModel,
            stream: false,
            messages
        }, `${WEBUI_BASE_URL}/api`);

        if (res && res.ok) {
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content ?? '';
            messages.push({ role: 'assistant', content });
        } else {
            messages.push({ role: 'assistant', content: $i18n.t('Error') });
        }
        loading = false;
        await scrollToBottom();
    };

    const login = () => {
        goto('/auth?redirect=/guest');
    };

    onMount(() => {
        if ($user) {
            goto('/');
        }
    });
</script>

<div class="h-screen flex flex-col items-center bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100">
    <div class="w-full flex justify-between items-center p-4">
        <div class="text-sm">
            <label class="mr-2">{$i18n.t('Model')}:</label>
            <select class="border border-gray-300 dark:border-gray-700 rounded-lg p-1" bind:value={selectedModel}>
                <option value="UOM-AI">UOM-AI</option>
            </select>
        </div>
        <div>
            <button class="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black" on:click={login}>
                {$i18n.t('Login')}
            </button>
        </div>
    </div>
    <div class="flex-1 w-full max-w-xl mx-auto px-4 overflow-y-auto" bind:this={messagesContainer}>
        {#each messages as m, idx}
            <div class="my-2">
                <div class="text-xs text-gray-500 mb-1">{m.role}</div>
                <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap">{m.content}</div>
            </div>
        {/each}
    </div>
    <div class="w-full max-w-xl mx-auto px-4 py-4">
        <textarea class="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 mb-2 resize-none bg-transparent" rows="3" bind:value={message} />
        <button class="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black w-full disabled:opacity-50" on:click={sendMessage} disabled={loading || message === ''}>
            {loading ? $i18n.t('Loading...') : $i18n.t('Send')}
        </button>
    </div>
</div>
