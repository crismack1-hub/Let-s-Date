import {
  getCountries,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

const supportedCountries = new Set<string>(getCountries());

export function getDevicePhoneCountry(): CountryCode {
  if (typeof navigator === "undefined") return "US";

  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const locale of locales) {
    const region = locale.split("-").slice(1).find((part) => /^[A-Z]{2}$/i.test(part));
    const country = region?.toUpperCase();
    if (country && supportedCountries.has(country)) return country as CountryCode;
  }

  return "US";
}

export const DEVICE_PHONE_COUNTRY = getDevicePhoneCountry();

export function normalizePhoneNumber(value: string): string | null {
  const input = value.trim();
  if (!input) return null;

  const parsed = input.startsWith("+")
    ? parsePhoneNumberFromString(input)
    : parsePhoneNumberFromString(input, DEVICE_PHONE_COUNTRY);

  return parsed?.isValid() ? parsed.number : null;
}
