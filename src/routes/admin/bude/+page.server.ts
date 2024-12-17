import { fail, redirect, error } from '@sveltejs/kit';
import { caps } from '$lib/caps';
import { transaction, type Bude } from '$lib/server/db';

export function load({ locals }) {
	if (!locals.is_admin) {
		throw redirect(303, '/admin/login');
	}
}

type Fail = {
	error: {
		messages: string[];
		name?: true;
		description?: true;
		linksUrl: Array<true | undefined>;
		linksValue: Array<true | undefined>;
	};
};

const serverFail: Fail['error'] = {
	linksUrl: [],
	linksValue: [],
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
		const linksUrl = data.getAll('linksUrl');
		const linksValue = data.getAll('linksValue');
		const internal = data.get('internal');

		if (
			(bude_id != null && typeof bude_id !== 'string') ||
			name == null ||
			description == null ||
			latStr == null ||
			lngStr == null ||
			internal == null ||
			typeof name !== 'string' ||
			typeof description !== 'string' ||
			typeof latStr !== 'string' ||
			typeof lngStr !== 'string' ||
			typeof internal !== 'string' ||
			!linksUrl.every((linkUrl) => typeof linkUrl === 'string') ||
			!linksValue.every((linkValue) => typeof linkValue === 'string') ||
			linksUrl.length !== linksValue.length
		) {
			throw error(400);
		}

		const err: Fail['error'] = {
			messages: [],
			linksUrl: [],
			linksValue: []
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

		for (let i = 0; i < linksUrl.length; i++) {
			if (linksUrl[i].length === 0) {
				err.messages.push('Url ist leer.');
				err.linksUrl[i] = true;
			}
			if (linksUrl[i].length > caps.link.url) {
				err.messages.push('Url ist zu lang.');
				err.linksUrl[i] = true;
			}
			if (linksValue[i].length > caps.link.value) {
				err.messages.push('Url Name ist zu lang.');
				err.linksValue[i] = true;
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
						(${name}, ${description.replaceAll('\r', '')}, ${lat}, ${lng}) returning *`;
					if (result == undefined) {
						throw new Error('Unexpected database error');
					}
					id = result.bude_id;
				} else {
					await first`update bude set
						name = ${name},
						description = ${description.replaceAll('\r', '')},
						lat = ${lat},
						lng = ${lng}
						where bude_id = ${id}`;
				}

				if (bude_id != null) {
					await first`delete from link where bude_id = ${bude_id}`;
					await first`delete from bude_internal where bude_id = ${bude_id}`;
				}
				for (let i = 0; i < linksUrl.length; i++) {
					if (linksValue[i] === '') {
						await first`insert into link (bude_id, url) values (${id}, ${linksUrl[i]})`;
					} else {
						await first`insert into link (bude_id, url, value) values (${id}, ${linksUrl[i]}, ${linksValue[i]})`;
					}
				}
				if (internal.length > 0) {
					await first`insert into bude_internal (bude_id, info) values(${id}, ${internal})`;
				}

				return first<Bude & { internal: string | null }>`
					select
						bude.bude_id,	bude.name, bude.description,
						bude.lat, bude.lng,
						bude_internal.info as interal,
						json_arrayagg(link.*) as links
					from bude
					natural left join bude_internal
					natural left join link
					where bude.bude_id = ${id}
					group by bude.bude_id, bude_internal.info`;
			});

			if (updated == undefined) {
				return fail<Fail>(500, {
					error: serverFail
				});
			}

			return { bude: updated };
		} catch (e) {
			console.log(e);
			return fail<Fail>(500, {
				error: serverFail
			});
		}
	}
};
