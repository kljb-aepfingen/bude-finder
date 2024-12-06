import { fail, redirect, error } from '@sveltejs/kit';
import { caps } from '$lib/caps';
import { transaction, type Bude } from '$lib/server/db';

export function load({ locals }) {
	if (!locals.is_admin) {
		throw redirect(303, '/admin');
	}
}

type Fail = {
	error: {
		messages: string[];
		name?: true;
		description?: true;
		links: Array<true | undefined>;
	};
};

const serverFail: Fail['error'] = {
	links: [],
	messages: ['Ein unerwarteter Server Fehler ist aufgetreten']
};

export const actions = {
	async default({ request, locals }) {
		if (!locals.is_admin) {
			throw redirect(303, '/admin');
		}

		const data = await request.formData();

		const bude_id = data.get('bude_id');
		const name = data.get('name');
		const description = data.get('description');
		const latStr = data.get('lat');
		const lngStr = data.get('lng');
		const links = data.getAll('links');

		if (
			(bude_id != null && typeof bude_id !== 'string') ||
			name == null ||
			description == null ||
			latStr == null ||
			lngStr == null ||
			typeof name !== 'string' ||
			typeof description !== 'string' ||
			typeof latStr !== 'string' ||
			typeof lngStr !== 'string' ||
			!links.every((link) => typeof link === 'string')
		) {
			throw error(400);
		}

		const err: Fail['error'] = {
			messages: [],
			links: []
		};

		if (name.length === 0) {
			err.messages.push('Name ist leer.');
			err.name = true;
		}

		if (name.length > caps.bude.name) {
			err.messages.push('Name ist zu lang.');
			err.name = true;
		}

		if (description.length === 0) {
			err.messages.push('Beschreibung ist leer.');
			err.description = true;
		}

		if (description.length > caps.bude.description) {
			err.messages.push('Beschreibung ist zu lang.');
			err.description = true;
		}

		for (let i = 0; i < links.length; i++) {
			if (links[i].length === 0) {
				err.messages.push('Link ist leer.');
				err.links[i] = true;
			}
			if (links[i].length > caps.link.value) {
				err.messages.push('Link ist zu lang.');
				err.links[i] = true;
			}
		}

		if (err.messages.length > 0) {
			return fail(400, { error: err });
		}

		const lat = Number(latStr);
		const lng = Number(lngStr);

		if (isNaN(lat) || isNaN(lng)) {
			throw error(400);
		}

		try {
			const updated = await transaction(async ({ first }) => {
				let id = bude_id;
				if (id == null) {
					const result = await first<Bude>`insert into bude
						(name, description, lat, lng) values
						(${name}, ${description}, ${lat}, ${lng}) returning *`;
					if (result == undefined) {
						throw new Error('Unexpected database error');
					}
					id = result.bude_id;
				} else {
					await first`update bude set
						name = ${name},
						description = ${description},
						lat = ${lat},
						lng = ${lng}
						where bude_id = ${id}`;
				}

				if (bude_id != null) {
					await first`delete from link where bude_id = ${bude_id}`;
				}
				for (const link of links) {
					await first`insert into link (bude_id, value) values (${id}, ${link})`;
				}

				return first<Bude>`
					select bude.bude_id, bude.name, bude.description, bude.lat, bude.lng, json_arrayagg(link.*) as links
					from bude
					natural left join link
					where bude.bude_id = ${id}
					group by bude.bude_id`;
			});

			if (updated == undefined) {
				return fail<Fail>(500, {
					error: serverFail
				});
			}

			return { bude: updated };
		} catch {
			return fail<Fail>(500, {
				error: serverFail
			});
		}
	}
};
