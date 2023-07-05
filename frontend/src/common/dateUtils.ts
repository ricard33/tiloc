import { format,
  formatDistanceToNow as _formatDistanceToNow,
  Locale
} from 'date-fns'
import { enGB, fr } from 'date-fns/locale'
import { getLanguage } from "./intlUtils";

const locales: Record<string, Locale> = {enGB, fr}

function isValidDate(d: any) {
  return d instanceof Date && !isNaN(d as never);
}

// by providing a default string of 'PP' or any of its variants for `formatStr`
// it will format dates in whichever way is appropriate to the locale
export function formatDate(date: number | Date, formatStr = 'PP') {
  if(!isValidDate(date))
    return "";
  return format(date, formatStr, {
    locale: locales[getLanguage()]
  })
}


export function formatDistanceToNow(date: number | Date, options = {}) {
  if(!isValidDate(date))
    return "";
  return _formatDistanceToNow(date, {
    locale: locales[getLanguage()],
    addSuffix: true,
    ...options,
  })
}
