#!/bin/bash
psql -h postgresql-crd.alwaysdata.net -U crd_tiloc-staging crd_tiloc-staging -f drop_all_table.sql
pg_dump -h postgresql-crd.alwaysdata.net -U crd_location --no-owner --no-privileges crd_location | psql -h postgresql-crd.alwaysdata.net -U crd_tiloc-staging crd_tiloc-staging