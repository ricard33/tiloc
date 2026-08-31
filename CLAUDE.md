# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Tiloc is a vacation-rental management SaaS (bookings, lodgings, payments, contracts, calendar
sync, subscriptions). This repository is the **Django backend** at the root; the **React/TypeScript
frontend** lives in `frontend/` and has its own `frontend/CLAUDE.md` — read that when working on
frontend code. In production the backend also serves the built frontend.

## Commands

Backend uses **Poetry** (Python ^3.12). Run everything through `poetry run`.

- `poetry install` — install dependencies
- `poetry run python manage.py runserver 0.0.0.0:8000 --nostatic` — dev server
- `poetry run pytest` — run the test suite (`DJANGO_SETTINGS_MODULE=location.settings` via `pytest.ini`; tests live in `core/tests/`)
- `poetry run pytest core/tests/test_bookings.py` — single test file
- `poetry run pytest core/tests/test_bookings.py -k test_name` — single test by name
- `poetry run pytest --cov=core` — with coverage
- `poetry run flake8 core location` — lint (CI runs exactly this; config in `.flake8`)
- `poetry run black . && poetry run isort .` — format (line length 120; `pyproject.toml`; `black`/`isort` exclude `frontend`, `backup`, `files`, etc.)
- `poetry run python runtests.py` — wrapper that runs pytest + flake8 + isort together (`--fast`, `--nolint`, `--lintonly` flags)
- `poetry run python manage.py runcrons` — execute due cron jobs (see `CRON_CLASSES`)
- `poetry run python manage.py make_demo` — populate the `__demo__` account with faked data
- `poetry run python manage.py compilemessages` — compile `fr`/`en` translations under `locale/`

CI (`.github/workflows/django.yml`) runs pytest with coverage then `flake8 core location`.
The frontend has a separate workflow (`react.yml`).

## Architecture

### Apps

- `location/` — Django project package: `settings.py`, `urls.py`, `wsgi.py`/`asgi.py`. Version is
  read from `location/version.properties` (written at deploy time) by `location/__init__.py` →
  `__version__` / `__date__`.
- `core/` — the entire business domain (models, API, serializers, sync, contracts, billing, cron).
- `notifier/` — a self-contained, reusable notification app: pluggable delivery backends selected by
  `NOTIFIER_BACKENDS` (`notifier.backends.EmailBackend` + `core.notifier_backend.NoopBackend`).
  In-app notifications are `notifier.SentNotification` rows.

### Multi-tenancy (important)

Every tenant is an `Account`. Data isolation is enforced in querysets, not middleware:

- Account-scoped models define `_account_qs_path` (ORM lookup path to their `account`), and
  optionally `_lodging_qs_path` / `_user_qs_path`.
- `ForUserQuerySet.for_user(user)` (`core/models.py`) uses those paths to filter objects visible to
  a user: their account's rows, plus lodgings they own/can access, plus global rows (null account).
- ViewSets call `.for_user(request.user)` in `get_queryset()`. When adding a model that belongs to a
  tenant, set `_account_qs_path` and route its queryset through `for_user`.
- `core.permissions.TilocPermissions` (subclass of DRF `DjangoObjectPermissions`) adds: model + object
  permission checks, rows with `account=None` are editable only by superusers, and a request from a
  user whose account `is_active=False` triggers logout. Permissions are group-based — the
  `administrator` group and defaults come from the `default-groups` fixture (`loaddata default-groups`).

### API

- `core/api.py` holds all DRF ViewSets and APIViews; they are registered on a `DefaultRouter` in
  `location/urls.py` under `/api/`. Serializers in `core/serializers.py`, filters in `core/filters.py`.
- Auth: custom `AUTH_USER_MODEL = core.User` with **email login** (`core.auth_backend.EmailBackend`).
  Token auth via `django-rest-knox` under `/api/auth/`, plus session auth. Signup goes through
  `django-email-verification` (`/api/signup/`, `/api/auth/resend_verification/`).
  `django-loginas` enables admin user impersonation.
- `core/parsers.py::MultiPartJSONParser` is the default multipart parser — it lets a single request
  mix JSON fields and file uploads (the frontend relies on this).
- Pagination: `core.pagination.StandardResultsSetPagination` (PAGE_SIZE 100); some endpoints use
  `LargeResultsSetPagination`. Exception formatting: `core.views.exception_handler`.

### Calendar sync

- `BookingChannelSync` links a `Lodging` to a `BookingChannel` (Airbnb, Booking.com, …) by iCal URL.
- `core/sync.py::retrieve_and_synchronize_bookings` pulls the remote iCal, reconciles it against
  `Booking` rows (matching on `source_uid`), and records externally-removed bookings in
  `SyncRemovedByExternal`. Parsing uses a **forked `ics` library** (`ics-py` `more-permissive-parsing`
  branch, pinned in `pyproject.toml`) because OTAs emit non-conformant iCal.
- `core/cron.py::SyncBookingsJob` runs it every 5 minutes for active, subscribed, non-demo accounts.
- Outbound: `core/views.py::export_calendar` / `export_calendar_for_lodgings_list` serve `.ics` at
  `/calendar/<uuid>/`.

### Cron jobs (`django-cron`)

Registered in `settings.CRON_CLASSES`, run via `manage.py runcrons`:
`SyncBookingsJob` (every 5 min), `ExportBookingsJob` (02:00, dumps model xlsx to `backup/` via
django-import-export resources in `core/imp_exp_resources.py`), `PurgeNotificationsJob` (00:30).

### Billing (Stripe)

`core/subscriptions.py` + Stripe endpoints in `core/api.py` (`SubscriptionViewSet`, `StripeConfig`,
`Prices`, `stripe_webhook` at `/api/stripe_webhook/`). Models: `Plan`, `Subscription`, `Invoice`.
`STRIPE_*` settings come from `config.ini`; test mode is auto-detected from the secret key prefix.

### Contracts

`core/contracts.py` renders a `ContractTemplate` (Jinja2, see `core/jinja2_tools.py`) for a `Booking`
into a `Contract`, then to PDF via `core/pdf_tools.py` (`pdfkit` → `wkhtmltopdf`, path from config).

### Cross-cutting

- **History**: `django-simple-history` (`HistoricalRecords`) tracks changes on key models; deploy runs
  `migrate --prune core`.
- **Signals**: `core/apps.py` loads `core/signals.py`, which turns model changes (post_save,
  m2m_changed) into notifications via `notifier.shortcuts.send_notification`.
- **Config**: `config/config.ini` (parsed by `smartconfigparser`) holds environment-specific values
  and secrets — `SECRET_KEY`, `[DATABASE]`, `[EMAIL]`, `[STRIPE]`, `[SECURITY] ALLOWED_HOSTS`. A
  missing `SECRET_KEY` is generated and written back. Environment variables: `APP_ENV`
  (`dev`/`prod`), `DJANGO_DEBUG`. Runtime-editable settings use `django-constance` (DB-backed:
  `DEBUG`, `CAN_SIGNUP`).
- **Database**: SQLite by default (`db.sqlite3`), PostgreSQL in production. `core/db_router.py` exists
  for an optional secondary `legacy` DB (currently disabled).
- **Tests**: pytest + `pytest-django`, `factory_boy` factories in `core/tests/factories.py`, helpers
  (e.g. `force_login`) in `core/tests/helpers.py`. Uploads use in-memory storage under test.
- **Logging**: JSON formatter + Loggly, configured via `my_django_tweaks.logging_config`. `/loggly/`
  is a proxy so the browser frontend can ship logs through the backend.
- **Demo mode**: `settings.IS_DEMO` / `DEMO_ACCOUNT_NAME = "__demo__"` disables sync and other
  side-effecting behavior.

### Serving the frontend

`frontend/build/` (Vite output) is served by Django through WhiteNoise + `location/serve_static_file.py`;
a catch-all route returns `index.html`. `DJANGO_VITE_*` settings point at the build + manifest. When
`settings.ENV == "dev"`, `location/urls.py` additionally mounts `MEDIA_URL` and every file in
`frontend/public/` as passthrough routes.

## Deployment

Fabric 3 (`deployment/fabfile.py`), hosted on alwaysdata:

```shell
poetry run fab -H alwaysdata -f deployment/staging.yml deploy   # staging
poetry run fab -H alwaysdata -f deployment/prod.yml deploy      # production
```

`deploy` prompts for a version bump, creates a git tag, writes `location/version.properties`, rsyncs
the tree (filter in `deployment/rsync_filter`), then remotely runs `dbbackup`/`mediabackup`,
`migrate`, `loaddata default-groups`, `collectstatic`, and restarts the site via the alwaysdata API.
New Relic config is `config/newrelic.ini`.

## Conventions
 
- Mandatory type hints on all public code
- Tests: pytest-django + factory_boy, never `setUp()` style unittest
- Import order: stdlib, third-party, local
 
## Non-negotiable rules
- Never commit without `poetry run python runtests.py` passing
- All migration must be reversible (test `migrate <app> <previous>`)
- Secrets go in `.env.local`, never in the code
- Stripe Webhooks: always verify the signature before processing
 
## Anti-patterns to avoid
 
- `User.objects.get()` without try/except: use `get_object_or_404` or a service
- Migration data + schema migration in the same file: separate them
- Circular imports between apps: go through signals or dispatch
