<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { enhance } from '$app/forms';
	import { getContext } from '$lib/context';

	const { form } = $props();

	const budes = getContext('budes')();
	let search = $state('');
	let filtered = $derived(filter());
	let open = new SvelteSet<string>();

	const markers = getContext('markers');
	const internals = getContext('admin/internals')();

	function filter() {
		if (search == '') {
			return budes;
		}
		return budes.filter((bude) => bude.name.toLowerCase().includes(search.toLowerCase()));
	}

	$effect(() => {
		if (form?.removed != undefined) {
			const index = budes.findIndex((bude) => bude.bude_id === form.removed);
			if (index === -1) {
				return;
			}
			budes.splice(index, 1);
			const marker = markers.get(form.removed);
			if (marker != undefined) {
				marker.map = null;
			}
			markers.delete(form.removed);
		}
	});

	function toggle(bude_id: string) {
		return () => {
			if (open.has(bude_id)) {
				open.delete(bude_id);
			} else {
				open.add(bude_id);
			}
		};
	}
</script>

<div class="p-4 h-dfull">
	<div class="flex items-center">
		<h1 class="text-4xl">Admin Konsole</h1>
		<form class="ml-auto" method="post" action="/admin?/signout" use:enhance>
			<button class="text-center text-lg border border-slate-600 rounded-xl px-4 py-2"
				>Ausloggen</button
			>
		</form>
	</div>

	<div class="flex gap-2 items-center mt-4 mb-1">
		<div class="text-lg">Suche</div>
		<input
			bind:value={search}
			class="bg-transparent border border-slate-600 rounded-md px-2 py-1"
			type="text"
		/>
		<a href="/admin/bude" class="border border-slate-600 rounded-md px-2 py-1">Neue Bude</a>
	</div>
	<form method="post" action="/admin?/remove" use:enhance>
		<ul>
			{#each filtered as bude (bude.bude_id)}
				{@const internal = internals.get(bude.bude_id)}
				<li class="[&:nth-of-type(2n+1)]:bg-slate-600 p-1">
					<div class="flex gap-1">
						<button class="flex-1 text-start" onclick={toggle(bude.bude_id)}>{bude.name}</button>
						<a href="/admin/bude?bid={bude.bude_id}">Bearbeiten</a>
						<button name="bude_id" value={bude.bude_id} class="ml-2 hover:underline">Löschen</button
						>
					</div>
					{#if open.has(bude.bude_id)}
						<div class="ml-2">{internal ?? 'Es gibt keine genaueren Infos.'}</div>
					{/if}
				</li>
			{/each}
		</ul>
	</form>
</div>
