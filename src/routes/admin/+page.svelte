<script lang="ts">
	import { enhance } from '$app/forms';
	import { getContext } from '$lib/context';

	const { form } = $props();

	let search = $state('');
	let budes = getContext('budes')();
	let filtered = $derived(filter());

	const markers = getContext('markers');

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
				<li class="[&:nth-of-type(2n)]:bg-slate-600 p-1 flex gap-1">
					<div>{bude.name}</div>
					<a class="ml-auto hover:underline" href="/admin/bude?bid={bude.bude_id}">Bearbeiten</a>
					<button name="bude_id" value={bude.bude_id} class="ml-2 hover:underline">Löschen</button>
				</li>
			{/each}
		</ul>
	</form>
</div>
