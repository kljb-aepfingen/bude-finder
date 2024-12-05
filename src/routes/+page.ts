export async function load({ url }) {
	const bid = url.searchParams.get('bid');
	return { bid };
}
