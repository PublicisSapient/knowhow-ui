import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dashToBullets',
})
export class DashToBulletsPipe implements PipeTransform {
  transform(value: string): string[] {
    if (!value) return [];
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => line.substring(2).trim());
  }
}
