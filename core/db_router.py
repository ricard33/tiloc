class Router:
    """
    A router to control all database operations on models.
    """

    route_app_labels = {
        "legacy",
    }

    def db_for_read(self, model, **hints):
        """
        Attempts to read legacy models go to legacy.
        """
        if model._meta.app_label in self.route_app_labels:
            return "legacy"
        return None

    def db_for_write(self, model, **hints):
        """
        Attempts to write legacy models go to legacy.
        """
        if model._meta.app_label in self.route_app_labels:
            return "legacy"
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if a model in the legacy apps is
        involved.
        """
        if obj1._meta.app_label in self.route_app_labels or obj2._meta.app_label in self.route_app_labels:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the legacy apps only appear in the
        'legacy' database.
        """
        if app_label in self.route_app_labels:
            return db == "legacy"
        return None
