<script lang="ts">
	import { setContext } from '$lib/context';
	import Spinner from '$lib/svg/Spinner.svelte';
	import { toast } from '$lib/Toaster.svelte';

	const { children, data } = $props();

	let internals = $state<Map<string, string> | null>(null);
	setContext('admin/internals', () => {
		if (internals == null) {
			throw new Error('Internals were not initialized.');
		}
		return internals;
	});

	$effect(() => {
		data.internals
			.then((is) => {
				internals = new Map(is.map((internal) => [internal.bude_id, internal.info]));
			})
			.catch(() => toast.error('Bude Info konnte nicht geladen werden'));
	});
</script>

{#if internals == null}
	<div class="p-4 h-dfull">
		<div class="mx-auto"><Spinner /></div>
	</div>
{:else}
	{@render children()}
{/if}
