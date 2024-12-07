<script lang="ts">
	import type { Bude } from '$lib/server/db';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getContext } from '$lib/context';
	import Left from '$lib/svg/Left.svelte';
	import Right from '$lib/svg/Right.svelte';
	import { caps } from '$lib/caps.js';
	import { toast } from '$lib/Toaster.svelte';
	import { enhance } from '$app/forms';

	const { data, form } = $props();

	$effect(() => {
		if (form?.bude != undefined) {
			const match = budes.find((bude) => bude.bude_id === form.bude.bude_id);

			internals.delete(form.bude.bude_id);
			if (form.bude.internal != null) {
				internals.set(form.bude.bude_id, form.bude.internal);
			}

			if (match == undefined) {
				budes.push(form.bude);
				goto('/admin');
				return;
			}

			match.name = form.bude.name;
			match.description = form.bude.description;
			match.lat = form.bude.lat;
			match.lng = form.bude.lng;
			match.links = form.bude.links;

			if (marker != undefined) {
				markers.set(match.bude_id, marker);
			}
			goto('/admin');
		}
	});

	$effect.pre(() => {
		if (form?.error?.messages != undefined) {
			while (form.error.messages.length > 0) {
				toast.error(form.error.messages.pop()!);
			}
		}
	});

	// setup ------------------------------------------------------------------
	const markers = getContext('markers');
	const budes = getContext('budes')();
	const map = getContext('map')();
	const internals = getContext('admin/internals')();
	let originalPosition: google.maps.marker.AdvancedMarkerElement['position'] | null = null;
	let marker: google.maps.marker.AdvancedMarkerElement | null = null;
	let listener: google.maps.MapsEventListener | null = null;

	// setup ---------------------------------
	$effect(() => {
		if (data.bude_id == null) {
			createBude(map);
			return;
		}

		const match = budes.find((bude) => bude.bude_id === data.bude_id);
		if (match == undefined) {
			goto($page.url.pathname, { replaceState: true });
			return;
		}

		map.setCenter(match);
		map.setZoom(19);
		setBude(match, map);
	});

	function createBude(map: google.maps.Map) {
		setMarker(null, map);
	}

	function setBude(bude: Bude, map: google.maps.Map) {
		setMarker(bude, map);
		bude_id = bude.bude_id;
		name = bude.name;
		description = bude.description;
		position = {
			lat: bude.lat,
			lng: bude.lng
		};
		links = bude.links.map((link) => link.value);
		internal = internals.get(bude.bude_id) ?? '';
	}

	function setMarker(bude: Bude | null, map: google.maps.Map) {
		if (marker != undefined) {
			return;
		}

		marker = bude == null ? null : markers.get(bude.bude_id) ?? null;
		if (marker != undefined) {
			(marker.content as HTMLImageElement).src = '/editingBude.svg';
			originalPosition = marker.position;
		}

		listener = map.addListener('click', ({ latLng }: google.maps.MapMouseEvent) => {
			if (latLng == undefined) {
				toast.error('Ein unerwarteter Fehler is aufgetreten.');
				return;
			}

			position = {
				lat: latLng.lat(),
				lng: latLng.lng()
			};

			if (marker != undefined) {
				marker.position = latLng;
				return;
			}

			marker = new google.maps.marker.AdvancedMarkerElement({
				map,
				position: latLng,
				title: 'Neue Bude',
				content: createImg()
			});
		});
	}

	function createImg() {
		const img = document.createElement('img');
		img.src = '/editingBude.svg';
		img.width = 26;
		return img;
	}

	$effect(() => {
		return () => {
			listener?.remove();
			if (marker != null) {
				(marker.content as HTMLImageElement).src = '/bude.svg';
			}
		};
	});

	// navigation -----------------------------------------
	function handleBack() {
		if (stage === 'info') {
			stage = 'position';
			return;
		}
		if (data.bude_id == null && marker != null) {
			marker.map = null;
		}
		if (marker != null && originalPosition != null) {
			marker.position = originalPosition;
		}

		goto('/admin');
	}

	function handleNext() {
		stage = 'info';
	}

	// data ------------------------------------------------------
	let stage = $state<'position' | 'info'>('position');
	let bude_id = $state('');
	let name = $state('');
	let description = $state('');
	let position = $state<{ lat: number; lng: number } | null>(null);
	let links = $state<string[]>([]);
	let internal = $state('');

	function addLink() {
		links.push('');
	}

	function removeLink(index: number) {
		return () => {
			links.splice(index, 1);
		};
	}
</script>

{#if stage == 'position'}
	<div class="text-xl p-4">Klicke auf die Karte</div>
	{@render navbar(position == null)}
{:else}
	<form method="post" use:enhance class="h-dfull grid grid-rows-[1fr_auto]">
		{#if data.bude_id != null}
			<input type="hidden" name="bude_id" id="bude_id" value={bude_id} />
		{/if}
		{#if position != null}
			<input type="hidden" name="lat" id="lat" value={position.lat} />
			<input type="hidden" name="lng" id="lng" value={position.lng} />
		{/if}
		<div class="p-4 flex flex-col overflow-y-auto">
			<label for="name" class="flex gap-1 items-center">
				Name der Bude/Landjugend
				<span class="text-sm opacity-70">({name.length}/{caps.bude.name})</span>
			</label>
			<input
				type="text"
				name="name"
				id="name"
				bind:value={name}
				class="{form?.error?.name
					? 'border-red-600'
					: 'border-slate-600'} bg-transparent border rounded-md px-2 py-1"
			/>
			<div class="p-1"></div>

			<label for="description" class="flex gap-1 items-center">
				Beschreibt euch ein wenig
				<span class="text-sm opacity-70">({description.length}/{caps.bude.description})</span>
			</label>
			<textarea
				name="description"
				rows={6}
				id="description"
				bind:value={description}
				class="{form?.error?.description
					? 'border-red-600'
					: 'border-slate-600'} bg-transparent border rounded-md px-2 py-1 resize-none"
			></textarea>
			<div class="p-1"></div>

			<label for="internal" class="flex gap-1 items-center">
				Interne Informationen wie zum Beispiel Kontakt Daten.
			</label>
			<textarea
				name="internal"
				rows={6}
				id="internal"
				bind:value={internal}
				class="border-slate-600 bg-transparent border rounded-md px-2 py-1 resize-none"
			></textarea>
			<div class="p-1"></div>

			<div>
				Links
				<button type="button" onclick={addLink} class="border-slate-600 border rounded-md px-2 py-1"
					>Neu</button
				>
			</div>
			<div class="p-1"></div>
			<ul class="flex flex-col gap-1">
				{#each links as link, index}
					<li class="flex gap-1 items-center">
						<input
							type="text"
							name="links"
							id="link-{index}"
							bind:value={links[index]}
							class="{form?.error?.links[index]
								? 'border-red-600'
								: 'border-slate-600'} bg-transparent border rounded-md px-2 py-1 w-full"
						/>
						<span class="text-sm opacity-70">({link.length}/{caps.link.value})</span>
						<button
							type="button"
							onclick={removeLink(index)}
							class="border-slate-600 border rounded-md px-2 py-1">Löschen</button
						>
					</li>
				{/each}
			</ul>
		</div>
		{@render navbar()}
	</form>
{/if}

{#snippet navbar(disabled = false)}
	<div class="h-16 grid grid-cols-2 items-center text-xl">
		<button type="button" onclick={handleBack} class="flex items-center">
			<Left />
			<span class="-translate-y-0.5">Zurück</span>
		</button>
		<button
			{disabled}
			onclick={handleNext}
			class="flex justify-end items-center disabled:opacity-40"
		>
			<span class="-translate-y-0.5">{stage == 'info' ? 'Speichern' : 'Weiter'}</span>
			<Right />
		</button>
	</div>
{/snippet}
