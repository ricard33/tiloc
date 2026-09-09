import pytest


class PytestTestRunner:
    """A custom test runner that redirects Django to Pytest."""
    def __init__(self, **kwargs):
        pass

    def run_tests(self, test_labels, extra_tests=None, **kwargs):
        # Launch pytest and pass it the necessary arguments
        # You can add default arguments like ['-x'] here if needed
        return pytest.main(test_labels or [])
