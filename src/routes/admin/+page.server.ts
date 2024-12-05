import { redirect, fail } from '@sveltejs/kit';
import { GOOGLE_CLIENT_ID } from '$env/static/private';
import { first } from '$lib/server/db';

export async function load({ cookies, url, locals }) {
	if (!locals.is_admin) {
		const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth ');

		const state = crypto.randomUUID();
		cookies.set('auth_state', state, { path: '/' });

		auth.searchParams.set('response_type', 'code');
		auth.searchParams.set('client_id', GOOGLE_CLIENT_ID);
		auth.searchParams.set('scope', 'email');
		auth.searchParams.set('redirect_uri', `${url.origin}/admin/auth`);
		auth.searchParams.set('state', state);

		throw redirect(303, auth.href);
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
