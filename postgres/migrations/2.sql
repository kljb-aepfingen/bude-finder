create table admin (
	admin_id uuid primary key default gen_random_uuid(),
	email		 text not null unique
);

create table session (
	admin_id	 uuid references admin(admin_id) on delete cascade on update cascade,
	value			 uuid not null default gen_random_uuid(),
	expires_in timestamp not null,

	constraint session_primary_key primary key (admin_id, value)
);