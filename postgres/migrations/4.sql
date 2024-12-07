create table bude_internal (
	bude_id uuid primary key references bude(bude_id) on delete cascade on update cascade,
	info    text not null
);