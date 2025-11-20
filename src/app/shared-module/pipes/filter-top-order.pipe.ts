import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterTopOrder',
})
export class FilterTopOrderPipe implements PipeTransform {
  transform(items: any[]): any[] {
    if (!items) {
      return [];
    }
    return items
      .filter((item) => item.order >= 1 && item.order <= 4)
      .sort((a, b) => a.order - b.order);
  }
}
