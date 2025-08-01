import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'namePipe',
})
export class NamePipePipe implements PipeTransform {
  transform(value: string, ...args: unknown[]): unknown {
    if (value.toLowerCase() !== 'project') {
      const hierarchyData =
        JSON.parse(localStorage.getItem('hierarchyData')) ||
        JSON.parse(localStorage.getItem('completeHierarchyData'))?.['scrum'];
      value = hierarchyData?.filter((h) => h.hierarchyLevelId === value).length
        ? hierarchyData.filter((h) => h.hierarchyLevelId === value)[0]
            .hierarchyLevelName ||
          hierarchyData.filter((h) => h.hierarchyLevelId === value)[0]
            .hierarchyLevelIdName
        : value;
    } else {
      value = 'Project';
    }
    return value;
  }
}
