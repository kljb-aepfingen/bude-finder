import { json } from '@sveltejs/kit';
import { many, type Bude } from '$lib/server/db';

export async function GET() {
	const budes = await many<Bude>`
		select bude.bude_id, bude.name, bude.description, bude.lat, bude.lng, json_arrayagg(link.*) as links
		from bude
		natural left join link
		group by bude.bude_id`;

	return json(budes);
}
