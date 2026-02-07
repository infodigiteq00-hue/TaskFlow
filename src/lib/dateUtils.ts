/**
 * Format a date in IST (India Standard Time) for display.
 */
export function formatIST(date: Date): string {
  return (
    date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'short',
      timeStyle: 'short',
    }) + ' IST'
  );
}
