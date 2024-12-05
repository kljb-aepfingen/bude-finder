create table bude (
	bude_id			uuid primary key default gen_random_uuid(),
	name			  varchar(100) not null,
	description varchar(400) not null,
	lat 				decimal,
	lng					decimal,
	created_at	timestamp default now(),
	updated_at	timestamp default now()
);

create function set_updated_column() returns trigger as $updated_column$
	begin
		new.updated_at = now();
		return new;
	end;
$updated_column$ language plpgsql;

create trigger bude_set_updated_at
	before update on bude
	for each row execute procedure set_updated_column();