create table link (
	link_id uuid primary key default gen_random_uuid(),
	bude_id uuid not null references bude(bude_id) on delete cascade on update cascade,
	value   varchar(200) not null
);