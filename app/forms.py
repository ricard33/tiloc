from django import forms

from core import models


class BookingForm(forms.ModelForm):

    class Meta:
        model = models.Booking
        # fields = ['lodging', 'guest_name', 'guest_contact', 'guest_address', 'duration', 'status', 'source',
        #           'begin_date', 'end_date', 'adults']
        exclude = []

    # lodging = forms.ChoiceField()
    # guest_name = forms.CharField()
    guest_contact = forms.CharField(widget=forms.Textarea({'rows': 2}))
    guest_address = forms.CharField(widget=forms.Textarea({'rows': 5}))
    duration = forms.ChoiceField(choices=map(lambda x: (x, x), range(1, 31)))
    begin_date = forms.DateField()
    end_date = forms.DateField()
