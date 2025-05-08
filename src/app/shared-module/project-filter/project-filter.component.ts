/*******************************************************************************
 * Copyright 2014 CapitalOne, LLC.
 * Further development Copyright 2022 Sapient Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { SharedService } from '../../services/shared.service';
import { HelperService } from 'src/app/services/helper.service';
import { MessageService } from 'primeng/api';
import { MultiSelect } from 'primeng/multiselect';

@Component({
  selector: 'app-project-filter',
  templateUrl: './project-filter.component.html',
  styleUrls: ['./project-filter.component.css'],
})
export class ProjectFilterComponent implements OnInit {
  @Output() projectSelectedEvent = new EventEmitter<string>();
  data = <any>[];
  filteredData = <any>[];
  projects = <any>[];
  filtersApplied = <boolean>false;
  filters = {};
  hierarchyArray = [];
  resetDropdowns = <boolean>false;
  selectedValProjects = <any>[];
  hierarchyData = <any>{};
  selectedVal = <any>{};
  selectedHierarchy = <any>[];
  selectedValTemplateValue = <any>[];
  selectedValueIsStillThere: any = {};
  valueRemoved: any = {};
  formData: any;
  parentNodeName: string = '';
  completeHierarchyData: any;
  selectedItems: { [hierarchyLevelId: string]: any[] } = {};
  filteredSuggestions: { [hierarchyLevelId: string]: any[] } = {};

  constructor(
    private httpService: HttpService,
    private service: SharedService,
    private messageService: MessageService,
    private helper: HelperService,
  ) { }

  ngOnInit(): void {
    this.getProjects();
  }

  // fetches all projects
  getProjects() {
    this.lookForCompletHierarchyData();
    this.resetDropdowns = true;
    this.httpService.getAllProjects().subscribe((projectsData) => {
      if (
        projectsData[0] !== 'error' &&
        !projectsData.error &&
        projectsData?.data
      ) {
        this.data = projectsData.data;
        this.hierarchyArray = this.data[0].hierarchy.map(
          (elem) => elem.hierarchyLevel.hierarchyLevelId,
        );

        let formFieldData = JSON.parse(localStorage.getItem('hierarchyData'));
        this.formData = JSON.parse(JSON.stringify(formFieldData));

        console.log(this.formData, 'this.formData');
        for(const level of this.formData) {
          this.filteredSuggestions[level.hierarchyLevelId] = level.list || [];
        }

        this.service.sendProjectData(this.data);
        // this.populateDataLists(projectsData.data, 'all');
      } else {
        // show error message
        this.messageService.add({
          severity: 'error',
          summary:
            'User needs to be assigned a project for the access to work on dashboards.',
        });
      }
    });
  }

  // populateDataLists(data, filterType, projectFilter = null) {
  //   if (data.length) {
  //     if (data[0].hierarchy && data[0].hierarchy.length) {
  //       let selectedFilterValues = [];
  //       if (filterType !== 'all') {
  //         selectedFilterValues = this.hierarchyData[filterType];
  //       }

  //       this.hierarchyArray.forEach((h) => {
  //         if (h !== filterType) {
  //           this.hierarchyData[h] = [];
  //         }
  //       });

  //       data.forEach((dataElem) => {
  //         dataElem.hierarchy.forEach((hierarchyElem, index) => {
  //           if (filterType === 'all') {
  //             if (
  //               !this.hierarchyData[
  //                 hierarchyElem.hierarchyLevel.hierarchyLevelId
  //               ] ||
  //               !this.hierarchyData[
  //                 hierarchyElem.hierarchyLevel.hierarchyLevelId
  //               ].length
  //             ) {
  //               this.hierarchyData[
  //                 hierarchyElem.hierarchyLevel.hierarchyLevelId
  //               ] = [];
  //             }

  //             this.hierarchyData[
  //               hierarchyElem.hierarchyLevel.hierarchyLevelId
  //             ].push({
  //               name: hierarchyElem.value,
  //               code: hierarchyElem.orgHierarchyNodeId,
  //               parent:
  //                 index >= 1 ? `(${dataElem.hierarchy[index - 1].value})` : '',
  //             });
  //           } else {
  //             if (
  //               hierarchyElem.hierarchyLevel.hierarchyLevelId === filterType
  //             ) {
  //               // do nothing
  //             } else {
  //               if (
  //                 !this.hierarchyData[
  //                   hierarchyElem.hierarchyLevel.hierarchyLevelId
  //                 ] ||
  //                 !this.hierarchyData[
  //                   hierarchyElem.hierarchyLevel.hierarchyLevelId
  //                 ].length
  //               ) {
  //                 this.hierarchyData[
  //                   hierarchyElem.hierarchyLevel.hierarchyLevelId
  //                 ] = [];
  //               }

  //               this.hierarchyData[
  //                 hierarchyElem.hierarchyLevel.hierarchyLevelId
  //               ].push({
  //                 name: hierarchyElem.value,
  //                 code: hierarchyElem.orgHierarchyNodeId,
  //                 parent:
  //                   index >= 1
  //                     ? `(${dataElem.hierarchy[index - 1].value})`
  //                     : '',
  //               });
  //             }
  //           }
  //         });
  //       });
  //     }
  //     Object.keys(this.hierarchyData).forEach((key) => {
  //       this.hierarchyData[key] = this.findUniques(this.hierarchyData[key], [
  //         'name',
  //         'code',
  //         'parent',
  //       ]);
  //     });
  //     if (!projectFilter) {
  //       this.projects = Object.assign([], data);
  //     }

  //     const dataIdMap = data.map((d) => d.id);
  //     const selectedValProjectsIdMap = this.selectedValProjects.map(
  //       (d) => d.id,
  //     );
  //     this.selectedValProjects = [];
  //     dataIdMap.forEach((element) => {
  //       if (selectedValProjectsIdMap.includes(element)) {
  //         this.selectedValProjects.push(data.filter((d) => d.id === element));
  //       }
  //     });
  //   }
  // }

  // fillLevelBefore(filterType) {
  //   this.hierarchyData[filterType] = [];
  //   this.filteredData.forEach(element => {
  //     let hier = element.hierarchy.map((h) => {
  //       return {
  //         level: h.hierarchyLevel.hierarchyLevelId,
  //         value: h.value
  //       }
  //     });
  //     let requiredHier = hier.filter(h => h.level === filterType);
  //     this.hierarchyData[filterType].push({
  //       name: requiredHier[0].value,
  //       code: requiredHier[0].value
  //     })
  //   });
  // }

  // fillLevel(filterType) {
  //   let data = JSON.parse(JSON.stringify(this.data));
  //   let self = this;
  //   Object.keys(this.selectedVal).forEach((key, index) => {
  //     if (index < Object.keys(self.selectedVal).length - 1) {
  //       this.fillLevelBefore(key);
  //       data = data.filter(d => {
  //         if (d.hierarchy.filter(h => h.hierarchyLevel.hierarchyLevelId === key).length) {
  //           if (self.selectedVal[key].map(v => v.code).includes(d.hierarchy.filter(h => h.hierarchyLevel.hierarchyLevelId === key)[0].value)) {
  //             return d;
  //           }
  //         }
  //       });
  //     }
  //   });
  //   this.hierarchyData[filterType] = [];
  //   data.forEach(element => {
  //     let hier = element.hierarchy.map((h) => {
  //       return {
  //         level: h.hierarchyLevel.hierarchyLevelId,
  //         value: h.value
  //       }
  //     });
  //     let requiredHier = hier.filter(h => h.level === filterType);
  //     this.hierarchyData[filterType].push({
  //       name: requiredHier[0].value,
  //       code: requiredHier[0].value
  //     })
  //   });
  // }

  // findUniques(data, propertyArray) {
  //   data = this.helper.sortByField(data, ['name']);
  //   const seen = Object.create(null);
  //   return data
  //     ?.filter((o) => {
  //       const key = propertyArray.map((k) => o[k]).join('|');
  //       if (!seen[key]) {
  //         seen[key] = true;
  //         return true;
  //       }
  //     })
  //     .map((proj) => {
  //       const obj = {};
  //       propertyArray.forEach((element) => {
  //         obj[element] = proj[element];
  //       });
  //       return obj;
  //     });
  // }

  // filterData(
  //   event,
  //   filterType,
  //   filterValueCode,
  //   filterValueName,
  //   filterValueParent,
  // ) {
  //   this.valueRemoved = {};
  //   event.stopPropagation();
  //   this.filteredData = JSON.parse(JSON.stringify(this.data));
  //   if (!this.selectedVal[filterType]) {
  //     this.selectedVal[filterType] = [];
  //   }
  //   if (
  //     !this.selectedVal[filterType] ||
  //     !this.selectedVal[filterType].filter((f) => f.code === filterValueCode)
  //       .length
  //   ) {
  //     const obj = {
  //       name: filterValueName,
  //       code: filterValueCode,
  //       parent: filterValueParent,
  //     };
  //     this.selectedVal[filterType].push(obj);
  //   } else {
  //     this.valueRemoved['val'] = this.selectedVal[filterType].splice(
  //       this.selectedVal[filterType].indexOf(
  //         this.selectedVal[filterType].filter(
  //           (f) => f.code === filterValueCode,
  //         )[0],
  //       ),
  //       1,
  //     );
  //     if (!this.selectedVal[filterType].length) {
  //       delete this.selectedVal[filterType];
  //     }
  //   }

  //   this.sortFilters();
  //   let newFilteredData = [];
  //   if (Object.keys(this.selectedVal).length) {
  //     Object.keys(this.selectedVal).forEach((filterType) => {
  //       if (
  //         this.selectedVal[filterType] &&
  //         this.selectedVal[filterType].length
  //       ) {
  //         this.selectedValTemplateValue[filterType] = this.selectedVal[
  //           filterType
  //         ]
  //           ?.map((s) => s.name)
  //           .join(', ');
  //         this.filteredData.forEach((proj) => {
  //           if (proj.hierarchy.length) {
  //             if (this.hierarchyMatch(proj)) {
  //               newFilteredData.push(proj);
  //             }
  //           }
  //         });
  //       }
  //     });

  //     newFilteredData = this.findUniques(newFilteredData, [
  //       'id',
  //       'projectDisplayName',
  //       'hierarchy',
  //       'projectNodeId',
  //     ]);
  //     this.filteredData = newFilteredData;
  //     if (Object.keys(this.selectedVal).length) {
  //       this.filtersApplied = true;
  //     } else {
  //       this.filtersApplied = false;
  //     }
  //     this.populateDataLists(this.filteredData, filterType);

  //     // refine selectedVal as per the filtered data
  //     this.hierarchyArray.forEach((level) => {
  //       const levelData = this.hierarchyData[level].map((m) => m.code);
  //       if (this.selectedVal[level] && this.selectedVal[level].length) {
  //         const selectedLevelData = this.selectedVal[level].map((m) => m.code);
  //         selectedLevelData.forEach((element) => {
  //           if (levelData.indexOf(element) === -1) {
  //             this.selectedVal[level] = this.selectedVal[level].filter(
  //               (f) => f.code !== element,
  //             );
  //           }
  //         });
  //       }
  //     });

  //     this.projectSelected();
  //   } else {
  //     this.clearFilters();
  //   }
  // }

  // hierarchyMatch(project) {
  //   let result = false;

  //   let projHieararchy = project.hierarchy.reduce((acc, item) => {
  //     const key = item.hierarchyLevel.hierarchyLevelId; // Extract hierarchyLevelId as key
  //     acc[key] = {
  //       code: item.orgHierarchyNodeId,
  //       value: item.value,
  //     };
  //     return acc;
  //   }, {});

  //   Object.keys(this.selectedVal).forEach((key) => {
  //     if (projHieararchy[key]) {
  //       if (
  //         this.selectedVal[key]
  //           .map((x) => x.code)
  //           .includes(projHieararchy[key].code)
  //       ) {
  //         result = true;
  //       }
  //     }
  //   });

  //   return result;
  // }

  sortFilters() {
    const sortedFilter = {};
    this.hierarchyArray.forEach((filterType) => {
      if (this.selectedVal[filterType]) {
        sortedFilter[filterType] = this.selectedVal[filterType];
      }
    });
    this.selectedVal = sortedFilter;
  }

  clearFilters() {
    this.valueRemoved['val'] = JSON.parse(JSON.stringify(this.selectedVal));
    this.filtersApplied = false;
    Object.keys(this.hierarchyData).forEach((key) => {
      delete this.selectedVal[key];
    });
    this.selectedValProjects = [];
    this.projects = JSON.parse(JSON.stringify(this.data));
    // this.populateDataLists(this.data, 'all');
    this.projectSelected();
  }

  projectSelected() {
    const obj: any = {};
    if (!this.selectedValProjects || !this.selectedValProjects.length) {
      this.hierarchyArray.forEach((hierarchy) => {
        if (this.selectedVal[hierarchy] && this.selectedVal[hierarchy].length) {
          obj['accessType'] = hierarchy;
          obj['value'] = [];
          const selectedHierarchyArr = this.selectedVal[hierarchy].map(
            (item) => ({
              itemId: item.code,
              itemName: item.name,
            }),
          );
          obj['value'] = [...selectedHierarchyArr];
        }
      });
    } else {
      obj['accessType'] = 'project';
      obj['value'] = this.selectedValProjects.map((item) => ({
        itemId: item.projectNodeId,
        itemName: item.projectDisplayName,
      }));
    }
    obj['hierarchyArr'] = this.hierarchyArray;
    obj['valueRemoved'] = this.valueRemoved;
    this.projectSelectedEvent.emit(obj);
  }

  getSelectedValTemplateValue(hierarchyLevelId) {
    return this.selectedVal[hierarchyLevelId]?.map((s) => s.name).join(', ');
  }

  lookForCompletHierarchyData() {
    this.completeHierarchyData = JSON.parse(
      localStorage.getItem('completeHierarchyData'),
    );
    if (!this.completeHierarchyData) {
      this.httpService.getAllHierarchyLevels().subscribe((res) => {
        if (res.data) {
          this.completeHierarchyData = res.data;
          localStorage.setItem(
            'completeHierarchyData',
            JSON.stringify(res.data),
          );
          this.getHierarchy();
        }
      });
    } else {
      this.getHierarchy();
    }
    // console.log(this.completeHierarchyData, 'completeHierarchyData');
  }

  getHierarchy() {
    const filteredHierarchyData = this.completeHierarchyData?.scrum.filter(
      (item) => item.id,
    );
    const hierarchyMap = filteredHierarchyData?.reduce((acc, item) => {
      acc[item.hierarchyLevelId] = item.hierarchyLevelName;
      return acc;
    }, {});
    if (hierarchyMap) {
      hierarchyMap['project'] = 'Project';
    }
    this.httpService.getOrganizationHierarchy()?.subscribe((formFieldData) => {
      if (formFieldData?.success === false) {
        this.messageService.add({
          severity: 'error',
          summary: formFieldData.message,
        });

      } else {
        const flatData = formFieldData?.data;

        const transformedData =
          typeof hierarchyMap === 'object'
            ? Object.entries(hierarchyMap)?.map(
              ([hierarchyLevelId, hierarchyLevelIdName], index) => {
                return {
                  hierarchyLevelId,
                  hierarchyLevelIdName,
                  level: index + 1,
                  list: flatData
                    ?.filter(
                      (item) => item.hierarchyLevelId === hierarchyLevelId,
                    )
                    .map(
                      ({
                        id,
                        nodeId,
                        nodeName,
                        nodeDisplayName,
                        hierarchyLevelId,
                        parentId,
                        createdDate,
                        modifiedDate,
                      }) => ({
                        level: index + 1,
                        hierarchyLevelName: hierarchyLevelIdName,
                        id,
                        nodeId,
                        nodeName,
                        nodeDisplayName,
                        hierarchyLevelId,
                        parentId,
                        createdDate,
                        ...(modifiedDate && { modifiedDate }),
                      }),
                    ),
                };
              },
            )
            : [];

        localStorage.setItem(
          'hierarchyData',
          JSON.stringify(transformedData, null, 2),
        );
        // console.log(transformedData, 'transformedData');
      }
    });
  }

  getNodeDisplayNameById(parentId: string, currentField: any): string | null {
    if (!parentId) return null;

    // Find the level just above the current one
    const parentLevel = this.formData.find(
      (level) => level.level === currentField.level - 1
    );

    if (!parentLevel || !parentLevel.list) return null;

    // Find the parent node
    const parentNode = parentLevel.list.find(
      (item) => item.nodeId === parentId
    );

    return parentNode ? `(${parentNode.nodeDisplayName})` : null;
  }

  onSelectionOfOptions(event: any, currentField: any): void {
    // console.log(event, currentField);
    const currentLevel = currentField.level;
    const currentLevelId = currentField.hierarchyLevelId;
    const selected = this.selectedItems[currentLevelId] || [];

    // -- Filter Child level -- //
    this.filterChildrenRecursively(currentLevel + 1, selected.map((item) => item.nodeId));
    /* const childField = this.formData.find(
      (level) => level.level === currentLevel + 1
    );
    if (childField) {
      const childList = childField.list || [];
      const parentNodeIds = selected.map((item) => item.nodeId);

      const filteredChildList = childList.filter((child: any) =>
        parentNodeIds.includes(child.parentId)
      );

      this.filteredSuggestions[childField.hierarchyLevelId] = filteredChildList;  */

    // -- Filter parent level -- //
    this.filterParentRecursively(currentLevel - 1, selected.map((item) => item.parentId));
      /* const parentField = this.formData.find(
        (level) => level.level === currentLevel - 1
      );
      if (parentField) {
        const parentList = parentField.list || [];
        const childParentIds = selected.map((item) => item.parentId);

        const filteredParentList = parentList.filter((parent: any) =>
          childParentIds.includes(parent.nodeId)
        );

        this.filteredSuggestions[parentField.hierarchyLevelId] =
          filteredParentList;
      }

    } */
  }

  filterChildrenRecursively(level: number, parentNodeIds: string[]): void {
    const childField = this.formData.find((item) => item.level === level);

    if (!childField) return;

    const childList = childField.list || [];

    // Filter the child list based on the parent node IDs
    const filteredChildList = childList.filter((child: any) =>
      parentNodeIds.includes(child.parentId)
    );

    this.filteredSuggestions[childField.hierarchyLevelId] = filteredChildList;

    // Recursively filter the next level's children
    const nextLevel = level + 1;
    const nextParentNodeIds = filteredChildList.map((child: any) => child.nodeId);
    this.filterChildrenRecursively(nextLevel, nextParentNodeIds);
  }

  filterParentRecursively(level: number, childNodeIds: string[]): void {
    const parentField = this.formData.find((item) => item.level === level);

    if (!parentField) return;

    const parentList = parentField.list || [];

    // Filter the parent list based on the child node IDs
    const filteredParentList = parentList.filter((parent: any) =>
      childNodeIds.includes(parent.nodeId)
    );

    this.filteredSuggestions[parentField.hierarchyLevelId] = filteredParentList;

    // Recursively filter the next level's parents
    const nextLevel = level - 1;
    const nextChildNodeIds = filteredParentList.map((parent: any) => parent.parentId);
    this.filterParentRecursively(nextLevel, nextChildNodeIds);
  }
}
