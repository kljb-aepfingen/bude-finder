import { redirect } from '@sveltejs/kit';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';

import { first, transaction, type Admin, type Session } from '$lib/server/db';

export async function GET({ url, cookies }) {
	const state = url.searchParams.get('state');

	if (state == null || state != cookies.get('auth_state')) {
		throw redirect(303, '/');
	}
	cookies.delete('auth_state', { path: '/' });

	const error = url.searchParams.get('error');
	if (error != null) {
		throw redirect(303, '/');
	}

	const code = url.searchParams.get('code');
	if (code == null) {
		throw redirect(303, '/');
	}

	const token = await getToken(code, url.origin);
	const profile = await getProfile(token.access_token);

	const admin = await first<Admin>`select * from admin where email = ${profile.email}`;

	if (admin == undefined) {
		throw redirect(303, '/');
	}

	const session = await transaction(async ({ first }) => {
		await first`delete from session where expires_in < now() and admin_id = ${admin.admin_id}`;
		return first<Session>`insert into session
      (admin_id, expires_in) values
      (${admin.admin_id}, to_timestamp(${Date.now() / 1000 + 60 * 60 * 24})) returning *`;
	});

	if (session == undefined) {
		throw redirect(303, '/');
	}

	cookies.set('jid', session.value, { path: '/' });

	throw redirect(303, '/admin');
}

type Token = {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	id_token: string;
	token_type: 'Bearer';
};
async function getToken(code: string, origin: string) {
	const data = new URLSearchParams({
		code,
		grant_type: 'authorization_code',
		redirect_uri: `${origin}/admin/auth`,
		client_id: GOOGLE_CLIENT_ID,
		client_secret: GOOGLE_CLIENT_SECRET
	});

	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: data.toString()
	});

	if (!response.ok) {
		throw redirect(303, '/');
	}

	const json = await response.json();
	if (json.error) {
		throw redirect(303, '/');
	}

	return json as Token;
}

type Profile = {
	family_name: string;
	name: string;
	picture: string;
	email: string;
	given_name: string;
	id: string;
	verified_email: boolean;
};
async function getProfile(access_token: string) {
	const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: {
			Authorization: `Bearer ${access_token}`
		}
	});

	if (!response.ok) {
		throw redirect(303, '/');
	}
	const profile = await response.json();
	return profile as Profile;
}
