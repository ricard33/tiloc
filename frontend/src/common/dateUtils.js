import { format } from 'date-fns'
import { enGB, fr } from 'date-fns/locale'
import { getLanguage } from "./intlUtils";

const locales = {enGB, fr}

// by providing a default string of 'PP' or any of its variants for `formatStr`
// it will format dates in whichever way is appropriate to the locale
export function formatDate(date, formatStr = 'PP') {
  return format(date, formatStr, {
    locale: locales[getLanguage()]
  })
}
