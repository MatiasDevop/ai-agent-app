import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Formats a date into a localized string, optionally in UTC.
 * @param date - The date to format (Date, string, or number).
 * @param options - Formatting options (optional).
 * @param useUTC - Whether to use UTC (default: false).
 * @returns The formatted date string.
 * @throws TypeError if the date is invalid.
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  useUTC: boolean = false
): string {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new TypeError("Invalid date.");
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  if (useUTC) {
    mergedOptions.timeZone = "UTC";
  }

  return new Intl.DateTimeFormat(undefined, mergedOptions).format(dateObj);
}

/**
 * Formats a date into a localized UTC string.
 * @param date - The date to format.
 * @param options - Formatting options (optional).
 * @returns The formatted UTC date string.
 * @throws TypeError if the date is invalid.
 */
export function formatUTCDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  return formatDate(date, options, true);
}
