import logging
import random
import re
from datetime import date
from decimal import Decimal
from typing import List

import arrow
from babel.dates import format_date as babel_format_date
from babel.numbers import format_decimal as babel_format_decimal
from django.conf import settings
from django.utils.translation import gettext as _
from faker import Faker

from core.models import BookedService, Booking, Contract
from core.pricing import compute_quote

logger = logging.getLogger("api")

# Engine-emitted labels for the length-of-stay discount, rendered in French on contracts.
_LOS_LABELS_FR = {
    "Weekly discount": "Remise à la semaine",
    "Monthly discount": "Remise au mois",
}


def format_decimal(value, locale=settings.LANGUAGE_CODE):
    value = value or 0
    return babel_format_decimal(value, format=value == round(value) and "#,##0;-#" or "#,##0.00;-#", locale=locale)


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


def _group_nights(nights):
    """Collapse consecutive nights sharing a season / rate / weekend flag into blocks."""
    groups = []
    for night in nights:
        key = (night["season"], night["applied_rate"], night["is_weekend"])
        if groups and groups[-1]["key"] == key:
            groups[-1]["count"] += 1
            groups[-1]["end"] = night["date"]
        else:
            groups.append(
                {
                    "key": key,
                    "count": 1,
                    "begin": night["date"],
                    "end": night["date"],
                    "rate": Decimal(night["applied_rate"]),
                    "season": night["season"],
                    "is_weekend": night["is_weekend"],
                }
            )
    return groups


def format_price_breakdown(price_details, locale=settings.LANGUAGE_CODE):
    """Render a ``Booking.price_details`` quote snapshot as an HTML price breakdown.

    Falls back to an empty string when there is nothing to show.
    """
    if not price_details or not price_details.get("lodgings"):
        return ""

    multi = len(price_details["lodgings"]) > 1
    lines = []
    for quote_lodging in price_details["lodgings"]:
        if multi:
            lines.append("<strong>%s</strong>" % quote_lodging["lodging_name"])
        for group in _group_nights(quote_lodging.get("nights", [])):
            label = "%d nuit%s du %s au %s" % (
                group["count"],
                "s" if group["count"] > 1 else "",
                format_date(date.fromisoformat(group["begin"]), "short", locale),
                format_date(date.fromisoformat(group["end"]), "short", locale),
            )
            if group["season"]:
                label += " — %s" % group["season"]
            if group["is_weekend"]:
                label += " (week-end)"
            amount = group["rate"] * group["count"]
            lines.append("%s : %s €" % (label, format_decimal(amount, locale)))
        for adjustment in quote_lodging.get("adjustments", []):
            if adjustment["type"] == "flat_rate":
                lines.append("Forfait : %s €" % format_decimal(Decimal(adjustment["amount"]), locale))
                continue
            name = _LOS_LABELS_FR.get(adjustment["label"], adjustment["label"])
            lines.append("%s : %s €" % (name, format_decimal(Decimal(adjustment["amount"]), locale)))

    lines.append("<strong>Total : %s €</strong>" % format_decimal(Decimal(price_details["total_price"]), locale))
    return "<br>".join(lines)


def _price_details_for(booking, lodgings):
    """Return the stored breakdown, or compute one on the fly for an unsaved/legacy booking."""
    if booking.price_details:
        return booking.price_details
    if not lodgings or not booking.begin_date or not booking.end_date:
        return None
    booking_date = booking.created.date() if getattr(booking, "created", None) else date.today()
    try:
        return compute_quote(
            lodgings=list(lodgings),
            begin_date=booking.begin_date,
            end_date=booking.end_date,
            booking_date=booking_date,
            is_flat_rate=booking.is_flat_rate,
            flat_price=booking.price if booking.is_flat_rate else None,
        ).as_dict()
    except (ValueError, ZeroDivisionError):
        return None


def make_context(booking, lodgings, url_server):
    signature_img = (
        lodgings[0].owner.signature
        and (
            '<img style="max-width: 200px; max-height: 100px" '
            'src="%s" alt="Signature"' % (url_server + lodgings[0].owner.signature.url)
        )
        or ""
    )
    emails = re.findall(r"[a-z0-9\.\-+_]+@[a-z0-9\.\-+_]+\.[a-z]+", booking.guest_contact)
    phones = re.findall(r"([+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[0-9][-\s./0-9]{6,12}[0-9])", booking.guest_contact)

    page_break = '<div style="display: block; page-break-before: always;"></div>'
    return {
        # Old context
        "booking": booking,
        "lodging": lodgings[0],
        "owner": lodgings[0].owner,
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
        "Propriétaire_NOM": lodgings[0].owner.last_name,
        "Propriétaire_PRENOM": lodgings[0].owner.first_name,
        "Propriétaire_ADRESSE_POSTALE": ", ".join((lodgings[0].owner.address or "").splitlines()),
        "Propriétaire_TELEPHONE": lodgings[0].owner.phone,
        "Propriétaire_EMAIL": lodgings[0].owner.email,
        "Voyageur_NOM_COMPLET": booking.guest_name,
        "Voyageur_ADRESSE_POSTALE": " - ".join((booking.guest_address or "").splitlines()),
        "Voyageur_CONTACT": " - ".join(booking.guest_contact.splitlines()),
        "Voyageur_TELEPHONE": len(phones) > 0 and phones[0] or "",
        "Voyageur_EMAIL": len(emails) > 0 and emails[0] or "",
        "Logement_NOM": " + ".join([lodging.name for lodging in lodgings]),
        # "Logement_PAGE_WEB_ANNONCE",
        "Logement_ADRESSE_POSTALE": ", ".join((lodgings[0].address or "").splitlines()),
        # "Logement_GPS": lodgings[0].,
        # "Logement_TYPE": lodgings[0].,
        # "Logement_NBS_CHAMBRES": booking,
        # "Logement_SURFACE": booking,
        # "Logement_CLASSEMENT": booking,
        "Logement_CAPACITE": sum([lodging.capacity for lodging in lodgings]),
        # "Logement_DESCRIPTIF": booking,
        "Logement_DEPOT_GARANTIE": format_decimal(lodgings[0].guaranty),
        # "Logement_HORAIRE_ARRIVEE": booking,
        # "Logement_HORAIRE_DEPART": booking,
        "Logement_MODALITE_PAIEMENT": lodgings[0].owner.payment or "",
        # "Logement_METHODE_PAIEMENT": booking,
        # "Logement_DEPOT_G_MONTANT": booking,
        # "Logement_DEPOT_G_DELAI": booking,
        "Réservation_DATE_ARRIVEE": format_date(booking.begin_date, "full"),
        "Réservation_DATE_DEPART": format_date(booking.end_date, "full"),
        "Réservation_NB_NUITS": booking.duration,
        "Réservation_MONTANT": format_decimal(booking.price),
        "Réservation_DETAIL_TARIF": format_price_breakdown(_price_details_for(booking, lodgings)),
        "Réservation_MONTANT_AVEC_OPTIONS": format_decimal(booking.price_with_options),
        "Réservation_ARRHES": format_decimal(booking.deposit),
        "Réservation_SOLDE_APRES_ARRHES": format_decimal(booking.price_with_options_and_taxes - (booking.deposit or 0)),
        "Réservation_NB_VOYAGEURS": booking.adults + booking.children + booking.babies,
        "Réservation_NB_ADULTES": booking.adults,
        "Réservation_NB_ENFANTS": booking.children,
        "Réservation_NB_BEBES": booking.babies,
        "Réservation_DATE": format_date(booking.created, "full"),
        "Réservation_SERVICES_INCLUS": format_services(
            booking.id and booking.bookedservice_set.filter(service__not_included_in_price=False) or [], booking
        ),
        "Réservation_SERVICES_ADDITIONELS": format_services(
            booking.id and booking.bookedservice_set.filter(service__not_included_in_price=True) or [], booking
        ),
        "Réservation_TAXE_DE_SEJOUR_PAR_NUIT_PAR_PERSONNE": format_decimal(booking.daily_tourist_tax_per_adult),
        "Réservation_TAXE_DE_SEJOUR": format_decimal(booking.tourist_tax),
        "Réservation_ECHEANCE_DU_SOLDE": booking.begin_date
        and format_date(arrow.get(booking.begin_date).shift(days=-lodgings[0].balance_due_date).date(), "short")
        or "___/___/______",
        # "Signature_LOCATAIRE": booking,
        "Signature_BAILLEUR": signature_img,
    }


def generate_contract(booking, url_server="http://127.0.0.1:8000", save=True, template_content=None, lodgings=None):
    if not lodgings:
        lodgings = booking.lodgings
    if not lodgings:
        logger.warning("Lodging not set, can't generate a contract")
        return None
    if not isinstance(lodgings, (list, tuple)):
        lodgings = lodgings.all()
    lodging = lodgings[0]
    # An unsaved booking (contract preview) has no persisted Contract; guard on pk so we
    # never pass a pk-less instance to the related filter (a hard error in Django 5.0).
    if not (booking.pk and Contract.objects.filter(booking=booking).exists()):
        booking.contract = Contract(booking=booking)
    if lodging.contract_template or template_content:
        from core.jinja2_tools import render_template

        content = render_template(
            template_content or lodging.contract_template.content,
            make_context(booking, lodgings, url_server),
        ).replace(
            '"placeholder"', '"variable"'
        )  # To avoid problems with CKEditor Placeholder plugin
        page_break = '<div style="display: block; page-break-before: always;"></div>'
        for lodging in lodgings:
            if lodging.description:
                content += page_break + lodging.description
        booking.contract.content = content
    else:
        logger.warning("Contract template not set for lodging '%s', can't generate a contract", lodging)
        booking.contract.content = _(
            "Contract template not set for lodging '%(lodging)s', can't generate a contract"
        ) % {"lodging": lodging.name}
    if save:
        booking.contract.save()
    return booking.contract


def generate_preview_contract(template_content, lodging, url_server="http://127.0.0.1:8000"):
    fake = Faker("fr_FR")
    begin_date = fake.date_between(start_date="+1m", end_date="+1y")
    duration = random.randint(7, 21)
    end_date = arrow.get(begin_date).shift(days=duration).date()
    quote = compute_quote(lodgings=[lodging], begin_date=begin_date, end_date=end_date)
    booking = Booking(
        begin_date=begin_date,
        end_date=end_date,
        duration=duration,
        guest_name=fake.name(),
        guest_contact="%s\n%s" % (fake.phone_number(), fake.email()),
        guest_address=fake.address(),
        guests_distribution={
            lodging.id: {
                "adults": random.randrange(2, lodging.capacity + 1),
                "children": random.choices([0, 1, 2], weights=(10, 1, 1))[0],
                "babies": random.choices([0, 1], weights=(10, 1))[0],
            }
        },
        price=Decimal(quote.total_price),
        deposit=Decimal(quote.total_deposit),
        price_details=quote.as_dict(),
        guaranty=lodging.guaranty,
    )
    booking.lodging = lodging
    return generate_contract(
        booking, lodgings=[lodging], url_server=url_server, save=False, template_content=template_content
    ).content
