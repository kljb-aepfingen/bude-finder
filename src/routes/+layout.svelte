<script lang="ts">
	import '../app.css';
	import * as pkg from '@googlemaps/js-api-loader';
	import { PUBLIC_MAPS_KEY } from '$env/static/public';
	import { browser } from '$app/environment';
	import { setContext } from '$lib/context';
	import type { Bude } from '$lib/server/db';
	import Toaster, { toast } from '$lib/Toaster.svelte';

	let { children, data } = $props();

	let loaded = $state(false);
	let markersSet = $state(false);
	let div = $state<HTMLElement | null>(null);

	let map = $state<google.maps.Map | null>(null);
	setContext('map', () => {
		if (map == null) {
			throw new Error('Map was not initialized.');
		}
		return map;
	});

	let budes = $state<Bude[] | null>(null);
	setContext('budes', () => {
		if (budes == null) {
			throw new Error('Budes were not initialized.');
		}
		return budes;
	});

	const markers = new Map<string, google.maps.marker.AdvancedMarkerElement>();
	setContext('markers', markers);

	const listeners: {
		select: ((bude: Bude) => void) | null;
		deselect: (() => void) | null;
	} = { select: null, deselect: null };
	setContext('clearListeners', () => {
		listeners.select = null;
		listeners.deselect = null;
	});
	setContext('setListeners', (select, deselect) => {
		(listeners.select = select), (listeners.deselect = deselect);
	});

	$effect(() => {
		if (div == null || !loaded || map != null) {
			return;
		}

		map = new google.maps.Map(div, {
			center: { lat: 50, lng: 10.2 },
			zoom: 7,
			mapId: 'b457a56d65f3205b',
			disableDefaultUI: true,
			clickableIcons: false,
			zoomControl: true,
			zoomControlOptions: {
				position: google.maps.ControlPosition.RIGHT_TOP
			},
			mapTypeControl: true,
			mapTypeId: 'hybrid'
		});
		map.addListener('click', () => listeners.deselect?.());
	});

	$effect(() => {
		data.budes.then((bs) => (budes = bs));
	});

	$effect(() => {
		if (budes == null || map == null || markersSet) {
			return;
		}

		budes.forEach((bude) => {
			const img = document.createElement('img');
			img.src = '/bude.svg';
			img.width = 26;

			const marker = new google.maps.marker.AdvancedMarkerElement({
				map,
				position: { lat: bude.lat, lng: bude.lng },
				title: bude.name,
				content: img
			});
			markers.set(bude.bude_id, marker);
			marker.addListener('click', () => listeners.select?.(bude));
		});

		markersSet = true;
	});

	if (browser) {
		const loader = new pkg.Loader({
			apiKey: PUBLIC_MAPS_KEY,
			version: 'weekly'
		});
		Promise.all([loader.importLibrary('maps'), loader.importLibrary('marker')]).then(
			() => (loaded = true)
		);
	}
</script>

<div class="grid h-full">
	<div class="col-start-1 row-start-1" bind:this={div}></div>
	<div class="relative isolate pointer-events-none flex flex-col-reverse col-start-1 row-start-1">
		<div
			class="info-container scroll-p-4 pointer-events-auto max-w-2xl bg-slate-800 w-full mx-auto overflow-auto"
		>
			{#if budes != null && map != null && markersSet}
				{@render children()}
			{/if}
		</div>
	</div>
</div>

<Toaster />
