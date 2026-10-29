import { DatePipe } from '@angular/common';
import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'UtcToLocalUserTimeZone',
})
@Injectable({ providedIn: 'root' })
export class UtcToLocalUserPipe implements PipeTransform {
  transform(utcDate: string, formatOptions?: string): string {
    if (!utcDate) {
      return '';
    }

    if (utcDate === '-') {
      return '-';
    }

    // Safe regex with bounded quantifiers to prevent ReDoS
    // Validates ISO 8601 datetime format: YYYY-MM-DDTHH (minimum pattern)
    // Uses only fixed-length quantifiers {4}, {2} - no variable length or nested patterns
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}/;
    if (!iso8601Pattern.test(utcDate)) {
      return utcDate;
    }

    try {
      return new DatePipe('en-US').transform(
        utcDate,
        formatOptions || 'dd-MMM-yyyy',
      );
    } catch (error) {
      console.error('Error in utcToLocal pipe:', error);
      return '';
    }
  }
}
