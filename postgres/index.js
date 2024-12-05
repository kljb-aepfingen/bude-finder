import fs from 'fs/promises';
import path from 'path';
import postgres from 'postgres';
import { loadEnv } from 'vite';

const migrations = await Promise.all(
	(await fs.readdir(path.resolve('postgres', 'migrations')))
		.map((file) => path.parse(file))
		.filter((file) => file.ext === '.sql' && !isNaN(parseInt(file.name)))
		.sort((a, b) => parseInt(a.name) - parseInt(b.name))
		.map((file) => fs.readFile(path.resolve('postgres', 'migrations', path.format(file)), 'utf-8'))
);

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = loadEnv('', '', '');
const sql = postgres({
	host: PGHOST,
	database: PGDATABASE,
	username: PGUSER,
	password: PGPASSWORD,
	port: 5432
});

await sql`
create table if not exists _version_budefinder (
  current int default 0 not null
)`;
const result = await sql`select * from _version_budefinder`;
let version = 0;
if (result.length === 0) {
	await sql`insert into _version_budefinder default values`;
} else {
	version = result[0].current;
}

sql.begin(async (sql) => {
	for (let i = version; i < migrations.length; i++) {
		await sql.unsafe(migrations[i]);
	}

	await sql.unsafe(`update _version_budefinder set current = ${migrations.length}`);
});

await sql.end();
