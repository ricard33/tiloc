import { format,
  formatDistanceToNow as _formatDistanceToNow,
  Locale
} from 'date-fns'
import { enGB, fr } from 'date-fns/locale'
import { getLanguage } from "./intlUtils";

const locales: Record<string, Locale> = {enGB, fr}

export function isValidDate(d: any) {
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

export function formatISODate(date: number | Date) {
  if(!isValidDate(date))
    return "";
  return format(date, "yyyy/MM/dd")
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

export function getMonthName(date: number | Date) {
  return format(date, "MMMM", { locale: locales[getLanguage()] })
}

export function getWeekdayName(date: number | Date) {
  return format(date, "EEEEE", { locale: locales[getLanguage()] })
}

