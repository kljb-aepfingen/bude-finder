alter table link
rename column value to url;

alter table link
add value varchar(50);