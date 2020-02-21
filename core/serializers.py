from rest_framework import serializers
from legacy import models as legacy_models


class DossierSerializer(serializers.ModelSerializer):
    class Meta:
        model = legacy_models.Dossier
        fields = '__all__'
