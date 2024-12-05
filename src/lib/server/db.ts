import postgres from 'postgres';
import { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } from '$env/static/private';

export const sql = postgres({
	host: PGHOST,
	database: PGDATABASE,
	username: PGUSER,
	password: PGPASSWORD,
	port: 5432
});
export default sql;

export type Bude = {
	bude_id: string;
	name: string;
	description: string;
	lat: number;
	lng: number;
	links: Link[];
};

export type Link = {
	link_id: string;
	bude_id: string;
	value: string;
};

export type Admin = {
	admin_id: string;
	email: string;
};

export type Session = {
	admin_id: string;
	value: string;
	expires_in: number;
};

function createFirst(s: typeof sql) {
	return async <T extends object>(
		template: TemplateStringsArray,
		...parameters: readonly postgres.ParameterOrFragment<never>[]
	): Promise<T | undefined> => {
		const [result] = await s<Array<T | undefined>>(template, ...parameters);
		return result;
	};
}
export const first = createFirst(sql);

function createMany(s: typeof sql) {
	return <T extends object | undefined>(
		template: TemplateStringsArray,
		...parameters: readonly postgres.ParameterOrFragment<never>[]
	) => {
		return s<T[]>(template, ...parameters);
	};
}
export const many = createMany(sql);

export function transaction<T>(
	cb: (sql: { first: typeof first; many: typeof many }) => T | Promise<T>
) {
	return sql.begin((sql) => {
		const first = createFirst(sql);
		const many = createMany(sql);
		return cb({ first, many });
	});
}
