import os
import py_compile
import re
import sys
from os.path import join

base_dirs = map(
    lambda x: join(".", x),
    (
        "core",
        "django_auth_ldap",
    ),
)
verbose = "-v" in sys.argv
delete_py = "--delete-py" in sys.argv
excludes = []  # don't visit .svn directories
exclude = re.compile("(/[.]svn)|(/nolimit)|(/commands)|(settings.py)")


def clean_pyc_files(base_dir):
    for root, dirs, files in os.walk(base_dir):
        for name in files:
            if name.endswith(".pyc") or name.endswith(".pyo"):
                fullpath = join(root, name)
                print("Deleting '%s'... " % fullpath),
                os.remove(fullpath)
                print("Ok")
        for name in (".svn", ".git", ".hg"):
            if name in dirs:
                dirs.remove(name)  # don't visit .svn, .git and .hg directories


def compile_python(base_dir):
    errors = []
    for root, dirs, files in os.walk(base_dir):
        for name in files:
            if name.endswith(".py"):
                fullpath = join(root, name).replace("\\", "/")
                if exclude.search(fullpath):
                    continue
                if verbose:
                    print("Compiling '%s'... " % fullpath),
                try:
                    py_compile.compile(fullpath)
                    if delete_py:
                        os.remove(fullpath)
                    if verbose:
                        print("Ok")
                except Exception:
                    if verbose:
                        print("ERROR: %s" % str(Exception))
                    print("ERROR compiling '%s': %s" % (fullpath, str(Exception)), file=sys.stderr)
                    errors.append((fullpath, Exception))
        for d in excludes:
            if d in dirs:
                dirs.remove(d)
    return errors


if __name__ == "__main__":
    if "-c" in sys.argv:
        print("Removing all .pyc files...")
        for dir in base_dirs:
            clean_pyc_files(dir)
    else:
        errors = []
        for dir in base_dirs:
            errors.append(compile_python(dir))
        print()
        if len(errors):
            print("%d error(s) found!" % len(errors), file=sys.stderr)
        else:
            print("Application's files successfully compiled!")

        import compileall

        print("Compiling Python Libraries...")
        compileall.compile_path(True, 10)
        print("Finished!")
