import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'UtcToLocalUserTimeZone',
})
export class UtcToLocalUserPipe implements PipeTransform {
  transform(utcDate: string | Date, formatOptions?: string): string {
    if (!utcDate) {
      return '';
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
