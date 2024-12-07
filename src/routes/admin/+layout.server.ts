import { redirect } from '@sveltejs/kit';
import { many, type Internal } from '$lib/server/db';

export async function load({ locals }) {
	if (!locals.is_admin) {
		throw redirect(303, '/admin/login');
	}

	return {
		internals: many<Internal>`select * from bude_internal`
	};
}
