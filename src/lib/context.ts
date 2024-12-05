import * as svelte from 'svelte';
import type { Bude } from '$lib/server/db';

type Contexts = {
	budes: () => Bude[];
	map: () => google.maps.Map;
	markers: Map<string, google.maps.marker.AdvancedMarkerElement>;
	clearListeners: () => void;
	setListeners: (select: (bude: Bude) => void, deselect: () => void) => void;
};

export function setContext<TKey extends keyof Contexts>(key: TKey, value: Contexts[TKey]) {
	return svelte.setContext(key, value);
}

export function getContext<TKey extends keyof Contexts>(key: TKey) {
	return svelte.getContext(key) as Contexts[TKey];
}