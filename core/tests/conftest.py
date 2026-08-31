import pytest
from django.core.management import call_command


@pytest.fixture
def default_groups(db):
    """Load the ``default-groups`` fixture (groups + permissions) used by the user factories."""
    call_command("loaddata", "default-groups")
