from django.http import Http404
from django.utils.translation import gettext_lazy as _
from django.views.generic import TemplateView


class IndexPage(TemplateView):
    def get(self, request, *args, **kwargs):
        accept = request.META.get('HTTP_ACCEPT')

        if 'text/html' not in accept:
            raise Http404(_('"%(path)s" does not exist') % {'path': request.path})
        return super().get(request, *args, **kwargs)


