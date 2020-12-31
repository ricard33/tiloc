import os
import pdfkit
from django.conf import settings


def generate_pdf(content, full_path):
    os.makedirs(os.path.split(full_path)[0], exist_ok=True)
    config = pdfkit.configuration(wkhtmltopdf=settings.WKHTMLTOPDF_PATH)
    options = {
        'encoding': "UTF-8",
    }
    pdfkit.from_string(content, full_path, configuration=config, options=options)
