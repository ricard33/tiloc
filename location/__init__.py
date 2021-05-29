import datetime
import os

version_build_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'version.properties')


def get_current_version():
    version = "0.0.1"
    build_date = ""
    build_host = ""
    if os.path.exists(version_build_file):
        with open(version_build_file, 'r') as init_file:
            for line in init_file:
                if line.startswith("VERSION"):
                    version = line.split("=")[1].strip()
                if line.startswith("DATE"):
                    build_date = datetime.datetime.fromisoformat(line.split("=")[1].strip())
                if line.startswith("BUILDER"):
                    build_host = line.split("=")[1].strip()
    return version, build_date, build_host


__version__, __date__, __builder__ = get_current_version()
