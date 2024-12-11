<script lang="ts">
	import '../app.css';
	import * as pkg from '@googlemaps/js-api-loader';
	import { PUBLIC_MAPS_KEY } from '$env/static/public';
	import { setContext, type Contexts } from '$lib/context';
	import type { Bude } from '$lib/server/db';
	import Toaster, { toast } from '$lib/Toaster.svelte';
	import Spinner from '$lib/svg/Spinner.svelte';

	let { children, data } = $props();

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

	let geoStatus = $state<Contexts['geolocation']>({ status: 'prompt', handle: handleGeolocation });
	setContext('geolocation', geoStatus);
	let geoMarker: google.maps.marker.AdvancedMarkerElement | null = null;
	let watchId = -1;

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
		if (div == null || map != null) {
			return;
		}

		const currentDiv = div;
		const loader = new pkg.Loader({
			apiKey: PUBLIC_MAPS_KEY,
			version: 'weekly'
		});
		Promise.all([loader.importLibrary('maps'), loader.importLibrary('marker')])
			.then(() => loadMap(currentDiv))
			.catch(() => toast.error('Google Maps konnte nicht geladen werden.'));
	});

	function loadValue(key: string, fallback: number): number {
		const str = localStorage.getItem(key);
		if (str == null) {
			return fallback;
		}
		const value = Number(str);
		return isNaN(value) ? fallback : value;
	}

	function loadMap(element: HTMLElement) {
		const zoom = loadValue('zoom', 9);
		const lat = loadValue('lat', 48.4);
		const lng = loadValue('lng', 10.2);

		map = new google.maps.Map(element, {
			center: { lat, lng },
			zoom,
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

		const m = map;
		map.addListener('drag', () => {
			const center = m.getCenter();
			if (center != undefined) {
				localStorage.setItem('lat', center.lat().toString());
				localStorage.setItem('lng', center.lng().toString());
			}
		});
		map.addListener('zoom_changed', () => {
			const zoom = m.getZoom();
			if (zoom != undefined) {
				localStorage.setItem('zoom', zoom.toString());
			}
		});
	}

	$effect(() => {
		data.budes
			.then((bs) => (budes = bs))
			.catch(() => toast.error('Buden konnten nicht geladen werden.'));
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

	$effect(() => {
		if ('permissions' in navigator && 'geolocation' in navigator) {
			navigator.permissions.query({ name: 'geolocation' }).then((result) => {
				geoStatus.status = result.state;
				result.addEventListener('change', () => {
					geoStatus.status = result.state;
				});
			});
		}
	});

	function handleGeolocation() {
		if (!('geolocation' in navigator)) {
			toast.error('Das unterstützt dein Gerät leider nicht.');
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				geoStatus.status = 'granted';
				const position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
				focusOnGeolocation(position);
			},
			() => {
				geoStatus.status = 'denied';
			}
		);
	}

	function focusOnGeolocation(position: { lat: number; lng: number }) {
		if (map == null) {
			return;
		}

		map.setCenter(position);
		map.setZoom(18);
	}

	$effect(() => {
		if (map == null) {
			return;
		}

		navigator.geolocation.clearWatch(watchId);
		if (geoStatus.status === 'granted') {
			if (geoMarker == null) {
				geoMarker = new google.maps.marker.AdvancedMarkerElement({
					map
				});
			}
			navigator.geolocation.getCurrentPosition((pos) => {
				if (geoMarker != null) {
					const position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
					geoMarker.position = position;
					focusOnGeolocation(position);
				}
			});
			watchId = navigator.geolocation.watchPosition((pos) => {
				if (geoMarker != null) {
					geoMarker.position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
				}
			});
			return;
		}

		if (geoMarker != null) {
			geoMarker.map = null;
			geoMarker = null;
		}
	});
</script>

<div class="grid h-full">
	<div class="col-start-1 row-start-1" bind:this={div}>
		<div class="fixed inset-0 grid place-content-center place-items-center gap-4 text-2xl">
			<Spinner />
			<div>Lade Google Maps</div>
		</div>
	</div>
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
