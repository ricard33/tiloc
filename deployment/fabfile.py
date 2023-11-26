import os
import subprocess
from datetime import datetime

from fabric import task
from invoke import Exit, Failure
from patchwork import files
from patchwork.transfers import rsync

# c = Connection('ssh-crd.alwaysdata.net')
FAB_PATH = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.normpath(os.path.join(FAB_PATH, ".."))


@task
def disk_free(c):
    uname = c.run("uname -s", hide=True)
    if "Linux" in uname.stdout:
        command = "df -h / | tail -n1 | awk '{print $5}'"
        free = c.run(command, hide=True).stdout.strip()
        print(free)
        return free
    err = "No idea how to get disk space on {}!".format(uname)
    raise Exit(err)


@task
def most_recent_modified(c, path):
    print(get_most_recent_modified(path, ["node_modules"]))


def get_most_recent_modified(path, excludes=None):
    if excludes is None:
        excludes = []
    excludes.extend([".DS_Store"])

    def not_in_pattern(name):
        return (not name.startswith("webpack-stats")) and not name in excludes

    list_of_files = []
    for root, dirs, files in os.walk(path, topdown=True):
        list_of_files.extend([os.path.join(root, name) for name in files if not_in_pattern(name)])
        for name in excludes:
            if name in dirs:
                dirs.remove(name)

    if list_of_files:
        latest_file = max(list_of_files, key=os.path.getctime)
        print(latest_file, os.path.getctime(latest_file))
        return latest_file, os.path.getctime(latest_file)
    print("Empty path")
    return 0


def write_version_properties(version):
    with open(os.path.join(WORKSPACE, "location", "version.properties"), "wt") as f:
        f.write("VERSION=%s\n" % version)
        # f.write("DATE=%s\n" % datetime.utcnow().strftime("%Y-%m-%d"))
        f.write("DATE=%s\n" % datetime.utcnow().isoformat())
        import socket

        f.write("BUILDER=%s\n" % socket.gethostname())


@task
def get_version(c):
    # Get the version using "git describe".
    cmd = "git describe --tags --match [0-9]*"
    try:
        version = c.local(cmd).stdout.strip()
    except Failure:
        print("Unable to get version number from git tags")
        raise

    # PEP 386 compatibility
    if "-" in version:
        version = ".post".join(version.split("-")[:2])

    # Don't declare a version "dirty" merely because a time stamp has
    # changed. If it is dirty, append a ".dev1" suffix to indicate a
    # development revision after the release.
    c.local("git status", hide="both")

    cmd = "git diff-index --name-only HEAD"
    try:
        dirty = c.local(cmd, hide=True).stdout.strip()
    except Failure:
        print("Unable to get git index status")
        raise

    if dirty != "":
        version += ".dev1"

    return version


def inc_version(version, pos):
    def safe_int(s):
        try:
            return int(s)
        except ValueError:
            return 0

    # major, minor, release, build, *ignored = map(safe_int, [*version.split('.'), '0', '0', '0'])
    values = list(map(safe_int, [*version.split(".")[: pos + 1], "0", "0", "0"][:3]))
    values[pos] += 1
    # while values[-1] == 0:
    #     values.pop()
    return ".".join(map(str, values))


@task
def increment_version(c):
    version = get_version(c)
    print("Last version was %s" % version)
    result = hasattr(c, "VERSION_INC") and c.VERSION_INC or ""

    while result not in ["0", "1", "2", "3"]:
        print()
        print("-------------------------------------")
        print("Please choose the new version number:")
        print("-------------------------------------")
        print(" 0) No change        : %s" % version)
        print(" 1) New major version: %s" % inc_version(version, 0))
        print(" 2) New minor version: %s" % inc_version(version, 1))
        print(" 3) New release      : %s" % inc_version(version, 2))
        # print(" 4) New build        : %s" % inc_version(version, 3))
        result = input("Select a value between 0 to 3 (default=3): ")
        if result == "":
            result = "3"

    if result == "0":
        return version
    new_version = inc_version(version, int(result) - 1)

    cmd = 'git tag -a %(version)s -m "Version %(version)s"' % {"version": new_version}
    try:
        c.local(cmd)
    except Failure:
        print("Unable to create version git tag")
        raise

    return new_version


@task
def prepare_python_env(c):
    with c.cd(WORKSPACE):
        c.run("pip install pip -U")
        c.run("pip install -U -r deployment/requirements/dev.txt")


@task
def build_python(c):
    with c.cd(WORKSPACE):
        # subprocess.check_call('find . -name "*.py[co]" -delete')
        # subprocess.check_call(['python', 'deployment/compile.py', '-c'], cwd=WORKSPACE)
        c.run("python deployment/compile.py -c")

        c.run("python manage.py migrate --noinput")
        c.run("python manage.py migrate --noinput --prune core")
        c.run("python manage.py compilemessages --no-color")
        # subprocess.check_call(['python', 'manage.py', 'migrate', '--noinput'], cwd=WORKSPACE)
        # subprocess.check_call(['python', 'manage.py', 'compilemessages', '--no-color'], cwd=WORKSPACE)


@task
def build(c):
    version = get_version(c)
    write_version_properties(version)
    build_python(c)
    build_frontend(c)
    # build_package()


@task
def prepare_frontend_env(c):
    with c.cd(os.path.join(WORKSPACE, "frontend")):
        c.local("yarn install --pure-lockfile")
        # c.local("npm rebuild node-sass")


@task
def update_browserlist(c):
    with c.cd(os.path.join(WORKSPACE, "frontend")):
        c.local("npx browserslist@latest --update-db")


@task
def build_frontend(c, only_sources=False):
    if not only_sources:
        prepare_frontend_env(c)
        update_browserlist(c)
    with c.cd(os.path.join(WORKSPACE, "frontend")):
        # print(os.environ)
        # c.local('env', replace_env=False)
        c.local("yarn run build", replace_env=False)
        # c.local('yarn run test')


@task
def test(c):
    run_python_tests(c)
    run_frontend_tests(c)


@task
def run_python_tests(c):
    # with settings(user=APIDAE_USER):
    with c.cd(WORKSPACE):
        c.local("coverage run --source=. manage.py test")
        c.local("coverage report")


@task
def run_frontend_tests(c):
    # with settings(user=APIDAE_USER):
    with c.cd(os.path.join(WORKSPACE, "frontend")):
        c.local("yarn run test")


# @task
# def build_package():
#     with lcd(os.path.join(WORKSPACE)):
#         subprocess.check_call(['find', '.', '-name', '"*.py[co]"', '-delete'], cwd=WORKSPACE)
#         subprocess.check_call(['python', 'deployment/compile.py', '-c'], cwd=WORKSPACE)
#
#         for fname in glob.glob(os.path.join(WORKSPACE, "build_apidae-*.tar.gz")):
#             os.remove(fname)
#         archive_name = 'build_location-%(VERSION)s.tar.gz' % {'VERSION': get_version()}
#         subprocess.check_call(['tar', '-czf', archive_name,
#                                # '--exclude=frontend/static_src',
#                                'assets', 'config/logging-location.default.py', 'core',
#                                'legacy', 'locale', 'location', 'templates', 'static', 'manage.py',
#                                'requirements-prod.txt', 'deployment',
#                                ],
#                               cwd=WORKSPACE)
#         puts("Archive '%s' created" % archive_name)


def compile_python_files(c):
    with c.cd(c.TARGET_PATH):
        c.run("python -O deployment/compile.py")


@task
def need_to_rebuild(c):
    newer_files = (
        get_most_recent_modified(os.path.join(WORKSPACE, "frontend"), ["node_modules", "build"])[1]
        > get_most_recent_modified(os.path.join(WORKSPACE, "frontend", "build"))[1]
    )
    print(newer_files and "Frontend build is needed" or "Frontend build already up-to-date")
    return newer_files


@task
def sync_sources(c, test_only=False):
    if need_to_rebuild(c):
        build_frontend(c, only_sources=True)

    rsync(
        c,
        WORKSPACE + "/",
        c.TARGET_PATH,
        delete=True,
        rsync_opts='-ci --filter=". %s"' % os.path.join(FAB_PATH, "rsync_filter") + (test_only and " --dry-run" or ""),
    )


def clean_compiled_files(c):
    # cleanup *.pyc / *.pyo files
    with c.cd(c.TARGET_PATH):
        c.run("python deployment/compile.py -c")


@task
def empty_folder(c):
    # with settings(warn_only=True, user=APIDAE_USER):
    with c.cd(c.TARGET_PATH):
        c.run("find . -type f -name '*.tar.gz' | xargs rm -rf")
        c.run(
            "rm -rf app assets authentication core deployment frontend legacy locale location static staticfiles templates "
        )


# def untar_archive():
#     tar_gz_build_files = glob.glob(os.path.join(WORKSPACE, 'build_apidae-*.tar.gz'))
#     if not len(tar_gz_build_files):
#         raise IOError("Can't find Archive!")
#     tar_gz_build_file = tar_gz_build_files[0]
#     tar_gz_file_name = tar_gz_build_file.split(os.path.sep)[-1]
#
#     with cd(c.TARGET_PATH):
#         put(tar_gz_build_file, c.TARGET_PATH)
#         run('tar -xzvf ' + tar_gz_file_name)


@task
def deploy_location(c):
    c.run("mkdir -p %s" % c.TARGET_PATH)
    subprocess.check_call(
        ["poetry", "export", "-o", os.path.join(WORKSPACE, "requirements-prod.txt"), "--without-hashes"]
    )
    sync_sources(c)
    clean_compiled_files(c)
    # compile_python_files(c)

    with c.cd(c.TARGET_PATH):
        if files.exists(c, ".env/bin/python") and not c.run(".env/bin/python -V").stdout.strip().startswith(
            "Python %s" % c.PYTHON_VERSION
        ):
            c.run("rm -rf .env")
        if not files.exists(c, ".env/bin/python"):
            print("create virtual env")
            c.run("python%s -m venv .env" % c.PYTHON_VERSION)

        with c.prefix(". .env/bin/activate"):
            c.run("pip install pip --upgrade")
            c.run("pip install -r requirements-prod.txt --upgrade")

            c.run("python manage.py dbbackup --clean --noinput")
            c.run("python manage.py mediabackup --clean --noinput")

            c.run("python manage.py migrate --noinput")
            c.run("python manage.py loaddata default-groups")
            c.run("python manage.py collectstatic --clear --noinput -v 0")


# @task
# def load_initial_data():
#     with settings(user=APIDAE_USER),\
#          cd(c.TARGET_PATH):
#         with prefix('. .env/bin/activate'):
#             run("python ./manage.py loaddata deployment/fixtures/initial_data.json")
#             run('python manage.py createsuperuser')


@task
def create_superuser(c):
    with c.cd(c.TARGET_PATH):
        with c.prefix(". .env/bin/activate"):
            c.run("python manage.py createsuperuser", pty=True)


# @task
# def rsync_deploy():
#     stop()
#
#     nginx_setup()
#     create_supervisord_config()
#
#     deploy_gestion(with_rsync=True)
#
#     start()
#
#


@task
def restart(c):
    c.local(
        "curl --basic --user \"%(API_KEY)s account=%(ACCOUNT)s:\" --data ''"
        " --request POST https://api.alwaysdata.com/v1/site/%(SITE_ID)s/restart/"
        % {"API_KEY": c.API_KEY, "ACCOUNT": c.ACCOUNT, "SITE_ID": c.SITE_ID}
    )


@task(default=True)
def deploy(c):
    version = increment_version(c)
    write_version_properties(version)
    deploy_location(c)
    restart(c)


@task
def dump_db(c):
    with c.cd(c.TARGET_PATH):
        with c.prefix(". .env/bin/activate"):
            fname = "dump-%s.json" % datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
            c.run("python manage.py dumpdata --exclude auth.permission --exclude contenttypes --output %s" % fname)
            c.get(fname)


@task
def load_db(c, fname):
    print(os.getcwd())
    # fname = os.path.abspath(fname)
    print(fname)
    if os.path.exists(fname):
        with c.cd(c.TARGET_PATH), c.prefix(". .env/bin/activate"):
            c.put(fname, os.path.join(c.TARGET_PATH, fname))
            c.run("python manage.py loaddata %s" % fname)
    else:
        print("'%s' not found" % fname)


# @task
# def create_supervisord_config():
#     """
#     create the supervisord config files for Apidae jobs
#     @return:
#     """
#     with settings(user='root'):
#         put(os.path.join(WORKSPACE, 'deployment', 'supervisord', 'apidae.conf'), "/etc/supervisor/conf.d/")
#         put(os.path.join(WORKSPACE, 'deployment', 'supervisord', 'celery.conf'), "/etc/supervisor/conf.d/")
#         put(os.path.join(WORKSPACE, 'deployment', 'supervisord', 'celerybeat.conf'), "/etc/supervisor/conf.d/")
#         run('mkdir -p /var/log/celery/')
#
#         run("supervisorctl reread")
#         run("supervisorctl update")
#
#
# @task
# def nginx_setup():
#     """
#     Configure NGINX for use with Apidae
#     """
#     with settings(user='root'):
#         # upload_template(os.path.join(WORKSPACE, 'deployment', 'nginx', 'nginx.conf'), '/etc/nginx/nginx.conf')
#         upload_template(os.path.join(WORKSPACE, 'deployment', 'nginx', 'default'),
#                         '/etc/nginx/sites-available/default',
#                         context={
#                             'IP': env.host
#                         },
#                         backup=False,
#                         )
#         run('service nginx restart')
#
# @task
# def pip_freeze():
#     with settings(user=APIDAE_USER),\
#          cd(c.TARGET_PATH):
#         with prefix('. .env/bin/activate'):
#             run("pip freeze")


@task
def debug(c):
    print(c.run("uname -a"))
    print(c.TARGET_PATH)
