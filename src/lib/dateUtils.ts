import { format as fnsFormat, parse } from "date-fns";
import { es } from "date-fns/locale/es";

/**
 * Parses a naive ISO datetime string ("2026-08-06T22:00") into a Date object
 * WITHOUT timezone conversion. The resulting Date will have the exact hours/minutes
 * as specified in the string, regardless of the user's local timezone.
 */
export function parseNaiveDate(isoString: string | Date): Date {
    if (isoString instanceof Date) {
        // Already a Date — this handles legacy Firestore Timestamps that were
        // converted via .toDate(). We extract components and rebuild to avoid
        // any further TZ shifts when formatting.
        return isoString;
    }
    if (!isoString) return new Date();
    
    // Parse "2026-08-06T22:00" or "2026-08-06T22:00:00" manually
    const [datePart, timePart] = isoString.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    
    if (timePart) {
        const [hours, minutes] = timePart.split(":").map(Number);
        return new Date(year, month - 1, day, hours, minutes, 0, 0);
    }
    
    return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Formats a naive date string or Date for display, always using the
 * "intended" time without timezone conversion.
 */
export function formatNaiveDate(dateInput: string | Date, formatStr: string): string {
    const date = parseNaiveDate(dateInput);
    return fnsFormat(date, formatStr, { locale: es });
}

/**
 * Converts a Date or Firestore Timestamp (already .toDate()'d) to a naive ISO string
 * preserving the original hour/minute as stored.
 */
export function toNaiveISOString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
