[![Django CI](https://github.com/ricard33/tiloc/actions/workflows/django.yml/badge.svg)](https://github.com/ricard33/tiloc/actions/workflows/django.yml)
[![React CI](https://github.com/ricard33/tiloc/actions/workflows/react.yml/badge.svg)](https://github.com/ricard33/tiloc/actions/workflows/react.yml)

# Development commands
React
## Install requirements

Python server (backend) :

```shell
poetry install
```

React app (frontend) :

```shell
cd frontend
yarn install
```

## Start development servers

Python server (backend) :

```shell
poetry run python manage.py run server 0.0.0.0:8000 --nostatic
```

React app (frontend) :

```shell
cd frontend
yarn start
```

Then open browser on http://localhost:3000/

## Deploying

on staging server

```shell
poetry run fab -H alwaysdata -f staging.yml deploy
```

on production server

```shell
poetry run fab -H alwaysdata -f prod.yml deploy
```

## Upgrading Python environment 

In order to get the latest versions of the dependencies and to update the poetry.lock file, you should use the update command.

```shell
poetry update
```
``
This will resolve all dependencies of the project and write the exact versions into poetry.lock.

If you just want to update a few packages and not all, you can list them as such:

```shell
poetry update requests toml
```

Note that this will not update versions for dependencies outside their version constraints specified in the pyproject.toml file.

To add a new package :

```shell
poetry add requests pendulum
```

To add a package with constraints (or update constraints) :

```shell
# Allow >=2.0.5, <3.0.0 versions
poetry add pendulum@^2.0.5
    
# Allow >=2.0.5, <2.1.0 versions
poetry add pendulum@~2.0.5

# Allow >=2.0.5 versions, without upper bound
poetry add "pendulum>=2.0.5"

# Allow only 2.0.5 version
poetry add pendulum==2.0.5
```

If you want to get the latest version of an already present dependency, you can use the special latest constraint:

```shell
poetry add pendulum@latest
```

You can also add git dependencies:

```shell
poetry add git+https://github.com/sdispater/pendulum.git
```
