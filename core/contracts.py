from datetime import date
import logging
from typing import List

from babel.dates import format_date as babel_format_date
from babel.numbers import format_decimal as babel_format_decimal
from django.conf import settings

from core.models import BookedService, Booking, Contract

logger = logging.getLogger("api")


def format_decimal(value, locale=settings.LANGUAGE_CODE):
    return babel_format_decimal(value or 0, locale=locale)


def format_date(value, format="medium", locale=settings.LANGUAGE_CODE):
    return babel_format_date(value, format, locale=locale)


def format_services(services: List[BookedService], booking):
    return "<br>".join(
        map(
            lambda option: "&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; - "
            + option.service.designation
            + " : "
            + format_decimal(option.unit_price * (option.is_flat_rate and 1 or booking.duration))
            + " €",
            services,
        )
    )


def make_context(booking, url_server):
    signature_img = (
        booking.lodging.owner.signature
        and (
            '<img style="max-width: 200px; max-height: 100px" '
            'src="%s" alt="Signature"' % (url_server + booking.lodging.owner.signature.url)
        )
        or ""
    )

    page_break = '<div style="display: block; page-break-before: always;"></div>'
    return {
        # Old context
        "booking": booking,
        "lodging": booking.lodging,
        "owner": booking.lodging.owner,
        "options": booking.id and list(booking.bookedservice_set.all()) or [],
        "included_options": booking.id and booking.bookedservice_set.filter(service__not_included_in_price=False) or [],
        "third_party_options": booking.id
        and booking.bookedservice_set.filter(service__not_included_in_price=True)
        or [],
        "url_server": url_server,
        "date": date.today(),
        "signature": signature_img,
        "page_break": page_break,
        # New context
        "DATE": format_date(date.today()),
        "Propriétaire_NOM": booking.lodging.owner.last_name,
        "Propriétaire_PRENOM": booking.lodging.owner.first_name,
        "Propriétaire_ADRESSE_POSTALE": booking.lodging.owner.address,
        "Propriétaire_TELEPHONE": booking.lodging.owner.phone,
        "Propriétaire_EMAIL": booking.lodging.owner.email,
        "Voyageur_NOM_COMPLET": booking.guest_name,
        "Voyageur_ADRESSE_POSTALE": booking.guest_address,
        "Voyageur_CONTACT": booking.guest_contact,
        "Logement_NOM": booking.lodging.name,
        # "Logement_PAGE_WEB_ANNONCE",
        "Logement_ADRESSE_POSTALE": booking.lodging.address,
        # "Logement_GPS": booking.lodging.,
        # "Logement_TYPE": booking.lodging.,
        # "Logement_NBS_CHAMBRES": booking,
        # "Logement_SURFACE": booking,
        # "Logement_CLASSEMENT": booking,
        "Logement_CAPACITE": booking.lodging.capacity,
        # "Logement_DESCRIPTIF": booking,
        "Logement_DEPOT_GARANTIE": booking.lodging.guaranty,
        # "Logement_HORAIRE_ARRIVEE": booking,
        # "Logement_HORAIRE_DEPART": booking,
        "Logement_MODALITE_PAIEMENT": booking.lodging.owner.payment,
        # "Logement_METHODE_PAIEMENT": booking,
        # "Logement_DEPOT_G_MONTANT": booking,
        # "Logement_DEPOT_G_DELAI": booking,
        "Réservation_DATE_ARRIVEE": format_date(booking.begin_date, "full"),
        "Réservation_DATE_DEPART": format_date(booking.end_date, "full"),
        "Réservation_NB_NUITS": booking.duration,
        "Réservation_MONTANT": format_decimal(booking.price),
        "Réservation_MONTANT_AVEC_OPTIONS": format_decimal(booking.price_with_options),
        "Réservation_ARRHES": format_decimal(booking.deposit),
        "Réservation_SOLDE_APRES_ARRHES": format_decimal(booking.price_with_options - (booking.deposit or 0)),
        "Réservation_NB_VOYAGEURS": booking.adults + booking.children + booking.babies,
        "Réservation_NB_ADULTES": booking.adults,
        "Réservation_NB_ENFANTS": booking.children,
        "Réservation_NB_BEBES": booking.babies,
        "Réservation_DATE": format_date(booking.created, "full"),
        "Réservation_SERVICES_INCLUS": format_services(
            booking.id and booking.bookedservice_set.filter(service__not_included_in_price=False) or [],
            booking
        ),
        "Réservation_SERVICES_ADDITIONELS": format_services(
            booking.id and booking.bookedservice_set.filter(service__not_included_in_price=True) or [],
            booking
        ),
        # "Signature_LOCATAIRE": booking,
        "Signature_BAILLEUR": signature_img,
    }


def generate_contract(booking, url_server="http://127.0.0.1:8000", save=True):
    if not booking.lodging:
        logger.warning("Lodging not set, can't generate a contract")
        return None
    if not Contract.objects.filter(booking=booking).exists():
        booking.contract = Contract(booking=booking)
    if booking.lodging.contract_template:
        from core.jinja2_tools import render_template

        content = render_template(
            booking.lodging.contract_template.content,
            make_context(booking, url_server),
        ).replace('"placeholder"', '"variable"')  # To avoid problems with CKEditor Placeholder plugin
        page_break = '<div style="display: block; page-break-before: always;"></div>'
        if booking.lodging.description:
            content += page_break + booking.lodging.description
        booking.contract.content = content
    else:
        logger.warning("Contract template not set for lodging '%s', can't generate a contract", booking.lodging)
        booking.contract.content = ""
    if save:
        booking.contract.save()
    return booking.contract


def generate_empty_contract(lodging, url_server="http://127.0.0.1:8000"):
    booking = Booking(
        lodging=lodging,
        guest_name="........................................",
        guest_contact="email: .................................@.................... - tel: ...................................",
        guest_address="........................................\n........................................\n........................................",
        guaranty=lodging.guaranty,
        duration=0,
        adults=0,
        price=0,
    )
    return generate_contract(booking, url_server=url_server, save=False).content
