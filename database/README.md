# CPS MySQL Database

Files:
- `schema.sql` — creates the `cps_management` database, tables, constraints, indexes, foreign keys, and reporting views.
- `seed.sql` — inserts 924 linked demo rows across authentication, clients, suppliers, projects, quotations, purchase orders, shipments, inventory, finance, smart cost estimation, alerts, and email logs.
- `demo_credentials.txt` — demo role accounts and passwords.

## Import order

```sql
SOURCE /path/to/schema.sql;
SOURCE /path/to/seed.sql;
```

Or in MySQL Workbench:
1. Open and run `schema.sql`.
2. Open and run `seed.sql`.
3. Refresh Schemas and open `cps_management`.

Designed for MySQL 8.0+.
