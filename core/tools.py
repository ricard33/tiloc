import math
from decimal import Decimal


def round_half_up(n, decimals=0):
    multiplier = 10**decimals
    return Decimal(math.floor(Decimal(n) * multiplier + Decimal(0.5))) / multiplier
