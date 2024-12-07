import { redirect, fail } from '@sveltejs/kit';
import { first } from '$lib/server/db';

export function load({ locals }) {
	if (!locals.is_admin) {
		throw redirect(303, '/admin/login');
	}
}

export const actions = {
	async signout({ cookies, locals }) {
		if (!locals.is_admin) {
			throw redirect(303, '/');
		}

		const session = cookies.get('jid');

		if (session == undefined) {
			throw redirect(303, '/');
		}

		await first`delete from session where value = ${session}`;
		cookies.delete('jid', { path: '/' });
		throw redirect(303, '/');
	},
	async remove({ request, locals }) {
		if (!locals.is_admin) {
			throw redirect(303, '/admin');
		}

		const data = await request.formData();
		const bude_id = data.get('bude_id');

		if (bude_id == null || typeof bude_id !== 'string') {
			return fail(400);
		}

		await first`delete from bude where bude_id = ${bude_id}`;
		return { removed: bude_id };
	}
};
