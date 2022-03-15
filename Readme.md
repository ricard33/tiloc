[![Django CI](https://github.com/ricard33/tiloc/actions/workflows/django.yml/badge.svg)](https://github.com/ricard33/tiloc/actions/workflows/django.yml)
[![React CI](https://github.com/ricard33/tiloc/actions/workflows/react.yml/badge.svg)](https://github.com/ricard33/tiloc/actions/workflows/react.yml)

# Development commands

## Start development servers

Python server (backend) :

    python manage.py run server 0.0.0.0:8000 --nostatic

React app (frontend) :

    cd frontend
    yarn start

Then open browser on http://localhost:3000/

## Deploying

on staging server

    fab -H alwaysdata -f staging.yml deploy

on production server

    fab -H alwaysdata -f prod.yml deploy

