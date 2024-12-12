<script lang="ts">
	import type { Bude } from '$lib/server/db';
	import { getContext } from '$lib/context';
	import { goto, afterNavigate } from '$app/navigation';

	const usableClasses = ['list-disc', 'ml-2'];

	let { data } = $props();

	let bude = $state<Bude | null>(null);

	const setListeners = getContext('setListeners');
	const clearListeners = getContext('clearListeners');
	const map = getContext('map')();
	const budes = getContext('budes')();
	const geolocation = getContext('geolocation');

	let selected: Bude | null = null;

	if (data.bid != null) {
		findBude(data.bid);
	}

	function selectBude(info: Bude) {
		bude = info;
		map.setCenter(info);
		const zoom = map.getZoom();
		if (zoom === 19) {
			map.setZoom(19.1);
		} else {
			map.setZoom(19);
		}
	}

	function findBude(bid: string) {
		const match = budes.find((bude) => bude.bude_id == bid);
		if (match == undefined) {
			goto('/');
			return;
		}
		selectBude(match);
	}

	afterNavigate(({ to }) => {
		if (to == null) {
			return;
		}

		if (selected != null) {
			selectBude(selected);
			selected = null;
			return;
		}

		const bid = to.url.searchParams.get('bid');
		if (bid == null) {
			bude = null;
			return;
		}

		findBude(bid);
	});

	$effect(() => {
		setListeners(
			(b) => {
				selected = b;
				goto(`/?bid=${b.bude_id}`);
				// m.setCenter(bude);
				// const zoom = m.getZoom();
				// if (zoom === 19) {
				// 	m.setZoom(19.1);
				// } else {
				// 	m.setZoom(19);
				// }
			},
			() => {
				goto('/');
			}
		);

		return clearListeners;
	});
</script>

{#if bude != null}
	<div class="p-4">
		<h1 class="text-4xl">{bude.name}</h1>
		<div class="text-lg ml-4 mt-1">{@html bude.description}</div>
		{#if bude.links.length > 0}
			<h2 class="text-2xl mt-2">Links</h2>
			<ul class="ml-4 mt-1">
				{#each bude.links as link (link.link_id)}
					<li><a target="_blank" href={link.value} class="underline">{link.value}</a></li>
				{/each}
			</ul>
		{/if}
	</div>
{:else}
	<div class="flex">
		<a class="border-r border-white p-4" href="/kontakt">Kontakt und Impressum</a>
		<button
			disabled={geolocation.status === 'denied'}
			onclick={geolocation.handle}
			class="border-l border-white p-4 ml-auto disabled:opacity-40"
		>
			{#if geolocation.status === 'denied'}
				Standort wurde blockiert
			{:else}
				Mein Standort anzeigen
			{/if}
		</button>
	</div>
{/if}
