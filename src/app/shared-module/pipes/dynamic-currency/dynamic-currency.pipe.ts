import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dynamicCurrency',
})
export class DynamicCurrencyPipe implements PipeTransform {
  // Map countries to currencies
  private currencyMap: Record<string, string> = {
    US: 'USD',
    CA: 'CAD',
    GB: 'GBP',
    DE: 'EUR',
    FR: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    BE: 'EUR',
    NL: 'EUR',
    AU: 'AUD',
    JP: 'JPY',
    IN: 'INR',
    CN: 'CNY',
    // add more as needed
  };

  transform(
    value: number,
    returnType: 'symbol' | 'value' | 'both' = 'both',
    currency?: string,
    locale?: string,
  ): string {
    if (value == null) {
      return '';
    }

    // Detect locale
    const userLocale = locale || navigator.language || 'en-US';

    // Extract country: "en-US" → "US"
    const country = userLocale.split('-')[1]?.toUpperCase();

    // Automatic currency detection if not provided
    const autoCurrency = currency || this.currencyMap[country] || 'USD';

    // Format the value using detected currency
    const absFormatted = Math.abs(value).toLocaleString(userLocale, {
      style: 'currency',
      currency: autoCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Extract symbol + number
    const SAFE_PATTERN = /^(\D*)([\d.,]+)$/;
    const parts = absFormatted.match(SAFE_PATTERN);
    if (!parts) {
      return absFormatted;
    }

    const symbol = parts[1].trim();
    const number = parts[2];

    // Return ONLY symbol
    if (returnType === 'symbol') {
      return symbol;
    }

    // Return ONLY value
    if (returnType === 'value') {
      return value < 0 ? `-${number}` : number;
    }

    // Default → return both
    return value < 0 ? `-${symbol}\u00A0${number}` : `${symbol}\u00A0${number}`;
  }
}
