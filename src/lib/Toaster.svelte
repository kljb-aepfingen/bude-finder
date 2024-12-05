<script lang="ts" module>
	let toast_: typeof toast | null = null;

	export const toast = {
		success(message: string) {
			toast_?.success(message);
		},
		error(message: string) {
			toast_?.error(message);
		}
	};
</script>

<script lang="ts">
	import { flip } from 'svelte/animate';
	import { scale } from 'svelte/transition';
	let globalId = 0;
	type Message = {
		id: number;
		value: string;
		type: 'success' | 'error';
	};
	const messages = $state<Message[]>([]);

	function addMessage(value: string, type: Message['type']) {
		const id = globalId++;
		messages.push({ id, value, type });
		setTimeout(() => {
			const index = messages.findIndex((message) => message.id === id);
			if (index !== -1) {
				messages.splice(index, 1);
			}
		}, 2000);
	}

	$effect(() => {
		toast_ = {
			success(message) {
				addMessage(message, 'success');
			},
			error(message) {
				addMessage(message, 'error');
			}
		};
		return () => {
			toast_ = null;
		};
	});
</script>

<div class="fixed inset-4 z-[9999] pointer-events-none">
	<div class="h-full max-w-64 w-max mx-auto flex flex-col justify-end gap-2 items-center">
		{#each messages as { id, value, type } (id)}
			<div
				transition:scale={{ duration: 200 }}
				animate:flip={{ duration: 200 }}
				class="bg-white text-slate-800 pr-4 pl-2 py-2 rounded-full flex items-center gap-2"
			>
				{#if type === 'success'}
					{@render checkmark()}
				{:else if type === 'error'}
					{@render error()}
				{/if}
				{value}
			</div>
		{/each}
	</div>
</div>

{#snippet checkmark()}
	<div
		class="
			bg-green-500 w-6 h-6 rounded-full relative
			before:absolute before:w-2 before:h-3 before:border-r-2 before:border-b-2 before:border-white
			before:translate-x-[0.48rem] before:translate-y-[0.28rem] before:rotate-[40deg]"
	></div>
{/snippet}

{#snippet error()}
	<div
		class="
			bg-red-500 w-6 h-6 rounded-full relative
			before:absolute before:h-3 before:border-x before:border-white
			before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-45
			after:absolute after:h-3 after:border-x after:border-white
			after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:-rotate-45"
	></div>
{/snippet}
