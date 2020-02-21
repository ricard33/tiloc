from rest_framework import viewsets

# Create your views here.
from core.serializers import DossierSerializer
from legacy.models import Dossier


class DossierViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Dossier.objects.all().order_by('-date_debut')
    serializer_class = DossierSerializer
