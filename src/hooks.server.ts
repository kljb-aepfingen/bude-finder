import { first, type Session, type Admin } from '$lib/server/db';

export async function handle({ event, resolve }) {
	const session = event.cookies.get('jid');
	event.locals.is_admin = false;
	if (session != undefined) {
		const result = await first<
			Session & Admin
		>`select * from session natural join admin where session.value = ${session}`;
		if (result != undefined && new Date(result.expires_in) > new Date()) {
			event.locals.is_admin = true;
		}
	}

	return resolve(event);
}
