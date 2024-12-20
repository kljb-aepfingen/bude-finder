<script lang="ts">
	import snarkdown from 'snarkdown';
	import type { Bude } from '$lib/server/db';
	import { getContext } from '$lib/context';
	import { goto, afterNavigate } from '$app/navigation';

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
		<div class="text-lg ml-4 mt-1 description">{@html snarkdown(bude.description)}</div>
		{#if bude.links.length > 0}
			<h2 class="text-2xl mt-2">Links</h2>
			<ul class="ml-4 mt-1">
				{#each bude.links as link (link.link_id)}
					{@const { origin } = new URL(link.url)}
					<li>
						<img
							class="inline-block"
							alt="icon of {link.value ?? origin}"
							src="https://s2.googleusercontent.com/s2/favicons?domain={encodeURIComponent(origin)}"
						/>
						<a target="_blank" href={link.url} class="underline">{link.value ?? origin}</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{:else}
	<div class="flex">
		<a class="border-r border-white p-4" href="/info">Info</a>
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

<style lang="postcss">
	.description :global(ul) {
		@apply list-disc list-inside;
	}
	.description :global(ol) {
		@apply list-decimal list-inside;
	}
	.description :global(h2) {
		@apply text-xl;
	}
</style>
