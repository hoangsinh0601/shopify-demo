export function formatDate(date: string | Date, locale = "vi-VN"): string {
  return new Date(date).toLocaleDateString(locale);
}

export function formatDateTime(date: string | Date, locale = "vi-VN"): string {
  return new Date(date).toLocaleString(locale);
}

export function formatCurrency(amount: string, currencyCode: string): string {
  return `${amount} ${currencyCode}`;
}
