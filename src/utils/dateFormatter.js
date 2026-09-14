/**
 * Formats an ISO or datetime string into a readable event date/time string.
 * Example: '2026-09-15T10:00:00' -> '15 SEPTEMBER 2026 • 10:00 AM'
 */
export function formatEventDateTime(dateStr, defaultFallback = '15 SEPTEMBER 2026 • 10:00 AM') {
  if (!dateStr) return defaultFallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return defaultFallback;

    const day = d.getDate();
    const monthNames = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];
    const month = monthNames[d.getMonth()] || 'SEPTEMBER';
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');

    return `${day} ${month} ${year} • ${hoursStr}:${minutes} ${ampm}`;
  } catch {
    return defaultFallback;
  }
}
