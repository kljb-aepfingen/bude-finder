<script lang="ts">
	import type { Bude } from '$lib/server/db';
	import { getContext } from '$lib/context';
	import { goto, afterNavigate } from '$app/navigation';

	let { data } = $props();

	let bude = $state<Bude | null>(null);

	if (data.bid != null) {
		findBude(data.bid);
	}

	const setListeners = getContext('setListeners');
	const clearListeners = getContext('clearListeners');
	const map = getContext('map')();
	const budes = getContext('budes')();

	let selected: Bude | null = null;

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
	<div class="col-start-1 row-start-1 p-4">
		<h1 class="text-4xl">{bude.name}</h1>
		<div class="text-lg ml-4 mt-1">{bude.description}</div>
		{#if bude.links.length > 0}
			<h2 class="text-2xl mt-2">Links</h2>
			<ul class="ml-4 mt-1">
				{#each bude.links as link (link.link_id)}
					<li><a target="_blank" href={link.value} class="underline">{link.value}</a></li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}
