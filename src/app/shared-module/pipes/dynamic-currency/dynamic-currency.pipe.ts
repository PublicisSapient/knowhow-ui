import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dynamicCurrency',
})
export class DynamicCurrencyPipe implements PipeTransform {
  transform(value: number, currency: string = 'EUR', locale?: string): string {
    if (value == null) return '';

    // Use the provided locale or fallback to browser's default
    const userLocale = locale || navigator.language || 'en-US';

    const absFormatted = Math.abs(value).toLocaleString(userLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Split currency symbol and number
    const SAFE_PATTERN = /^(\D*)([\d.,]+)$/;
    const parts = absFormatted.match(SAFE_PATTERN);
    if (!parts) return absFormatted;

    const symbol = parts[1].trim(); // currency symbol
    const number = parts[2]; // numeric value

    // Leading space for positive numbers to align with negative ones
    return value < 0
      ? `-${symbol}\u00A0${number}`
      : `\u00A0${symbol}\u00A0${number}`;
  }
}
