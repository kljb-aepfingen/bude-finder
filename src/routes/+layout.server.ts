import { many, type Bude } from '$lib/server/db';

export function load() {
	const budes = many<Bude>`
		select bude.bude_id, bude.name, bude.description, bude.lat, bude.lng, json_arrayagg(link.*) as links
		from bude
		natural left join link
		group by bude.bude_id`;

	return { budes };
}
