import { redirect } from '@sveltejs/kit';
import { GOOGLE_CLIENT_ID } from '$env/static/private';

export function GET({ url, cookies }) {
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
