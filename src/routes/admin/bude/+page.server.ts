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
		name?: string;
		description?: string;
		links?: Array<string | undefined>;
	};
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

		let hasError = false;
		const err: Fail['error'] = {};

		if (name.length === 0) {
			err.name = 'Name ist leer.';
			hasError = true;
		}

		if (name.length > caps.bude.name) {
			err.name = 'Name ist zu lang.';
			hasError = true;
		}

		if (description.length === 0) {
			err.description = 'Description ist leer.';
			hasError = true;
		}

		if (description.length > caps.bude.description) {
			err.description = 'Description ist zu lang.';
			hasError = true;
		}

		for (let i = 0; i < links.length; i++) {
			const linksErr = err.links ?? [];
			if (links[i].length === 0) {
				linksErr[i] = 'Link ist leer.';
				err.links = linksErr;
				hasError = true;
			}
			if (links[i].length > caps.link.value) {
				linksErr[i] = 'Link ist zu lang.';
				err.links = linksErr;
				hasError = true;
			}
		}

		if (hasError) {
			return fail(400, { error: err });
		}

		const lat = Number(latStr);
		const lng = Number(lngStr);

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
			throw error(500);
		}

		return { bude: updated };
	}
};
