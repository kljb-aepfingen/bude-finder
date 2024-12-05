export function load({ url }) {
	return {
		bude_id: url.searchParams.get('bid')
	};
}
