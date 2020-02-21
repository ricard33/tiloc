# Dev dependencies

This project is designed to be deployed on Heroku.

## Buildpacks

Gettext is needed for compiling translations

    $ heroku create --buildpack https://github.com/grauwoelfchen/heroku-buildpack-gettext.git

# Development commands

## Run any command remotely

    $ heroku run ....
    
Example, running a shell:

    $ heroku run bash
     
## View logs

In Heroku (limited to 1500 lines):

    $ heroku logs --tail

With papertail addon:

    $ heroku addons:open papertrail

# Release on Heroku

## Variables

Some settings are stored as environment variables and should be set on Heroku:

* DJANGO_DEBUG
