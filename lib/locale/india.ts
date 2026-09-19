export const INDIA_LOCALE = "en-IN"
export const INDIA_TIME_ZONE = "Asia/Kolkata"
export const INDIA_CURRENCY = "INR"

const currencyFormatter = new Intl.NumberFormat(INDIA_LOCALE, {
  style: "currency",
  currency: INDIA_CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatINR(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—"
  const amount = Number(value)
  return Number.isFinite(amount) ? currencyFormatter.format(amount) : "—"
}

function parseDate(value: Date | string | null | undefined) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+05:30` : value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatIndianDate(value: Date | string | null | undefined) {
  const date = parseDate(value)
  return date ? new Intl.DateTimeFormat(INDIA_LOCALE, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: INDIA_TIME_ZONE }).format(date) : "—"
}

export function formatIndianTime(value: Date | string | null | undefined) {
  if (!value) return "—"
  const date = typeof value === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(value)
    ? new Date(`2000-01-01T${value}+05:30`)
    : parseDate(value)
  return date ? new Intl.DateTimeFormat(INDIA_LOCALE, { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: INDIA_TIME_ZONE }).format(date).toUpperCase() : "—"
}

export function formatIndianDateTime(value: Date | string | null | undefined) {
  const date = parseDate(value)
  return date ? `${formatIndianDate(date)}, ${formatIndianTime(date)}` : "—"
}

export interface IndianAddress {
  organisation?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  district?: string | null
  state?: string | null
  pinCode?: string | null
}

export function validateIndianPinCode(value: string | null | undefined) {
  return !!value && /^[1-9]\d{5}$/.test(value.trim())
}

export function formatIndianAddress(address: IndianAddress | null | undefined) {
  if (!address) return "—"
  const locality = [address.city, address.district].filter(Boolean).join(", ")
  const region = [address.state, address.pinCode].filter(Boolean).join(" ")
  const lines = [address.organisation, address.addressLine1, address.addressLine2, locality, region, "India"]
    .map((value) => value?.trim()).filter(Boolean)
  return lines.length > 1 ? lines.join("\n") : "—"
}
