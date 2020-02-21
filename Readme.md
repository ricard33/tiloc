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
