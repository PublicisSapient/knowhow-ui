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
  ) {}

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

        for (const level of this.formData) {
          this.filteredSuggestions[level.hierarchyLevelId] = level.list || [];
        }

        this.service.sendProjectData(this.data);
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

  resetFiltersSuggestionsToAll() {
    for (const level of this.formData) {
      this.filteredSuggestions[level.hierarchyLevelId] = level.list || [];
    }
  }

  clearFilters() {
    for (const key in this.selectedItems) {
      if (Array.isArray(this.selectedItems[key])) {
        this.selectedItems[key] = [];
      }
    }
    this.resetFiltersSuggestionsToAll();
    this.projects = JSON.parse(JSON.stringify(this.data));
    this.projectSelected();
  }

  projectSelected() {
    const obj: any = {};
    this.selectedValProjects = this.selectedItems['project'];
    if (!this.selectedValProjects || !this.selectedValProjects.length) {
      this.hierarchyArray.forEach((hierarchy) => {
        if (
          this.selectedItems[hierarchy] &&
          this.selectedItems[hierarchy].length
        ) {
          obj['accessType'] = hierarchy;
          obj['value'] = [];
          const selectedHierarchyArr = this.selectedItems[hierarchy].map(
            (item) => {
              return {
                itemId: item.nodeId,
                itemName: item.nodeDisplayName,
              };
            },
          );
          obj['value'] = [...selectedHierarchyArr];
        }
      });
    } else {
      obj['accessType'] = 'project';
      obj['value'] = this.selectedValProjects.map((item) => {
        return {
          itemId: item.nodeId,
          itemName: item.nodeDisplayName,
        };
      });
    }
    obj['hierarchyArr'] = this.hierarchyArray;
    obj['valueRemoved'] = this.valueRemoved;
    this.projectSelectedEvent.emit(obj);
  }

  // getSelectedValTemplateValue(hierarchyLevelId) {
  //   return this.selectedVal[hierarchyLevelId]?.map((s) => s.name).join(', ');
  // }

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
  }

  getHierarchy() {
    const filteredHierarchyData = this.completeHierarchyData?.scrum?.filter(
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
      }
    });
  }

  getNodeDisplayNameById(parentId: string, currentField: any): string | null {
    if (!parentId) return null;

    // Find the level just above the current one
    const parentLevel = this.formData.find(
      (level) => level.level === currentField.level - 1,
    );

    if (!parentLevel || !parentLevel.list) return null;

    // Find the parent node
    const parentNode = parentLevel.list.find(
      (item) => item.nodeId === parentId,
    );

    return parentNode ? `(${parentNode.nodeDisplayName})` : null;
  }

  // -- Resets dropdown options from a given level downwards: -- //
  resetLevelsFrom(level: number): void {
    for (const levelObj of this.formData) {
      if (levelObj.level >= level) {
        const levelId = levelObj.hierarchyLevelId;

        // Reset the filtered suggestions to the full list
        this.filteredSuggestions[levelId] = [...(levelObj.list || [])];

        // Also reset selection (optional, but often needed)
        if (this.selectedItems[levelId]) {
          this.selectedItems[levelId] = [];
        }
      }
    }
  }

  // -- Clears selected items from a given level downwards: -- //
  clearSelectionsFrom(level: number): void {
    for (const levelObj of this.formData) {
      if (levelObj.level >= level) {
        this.selectedItems[levelObj.hierarchyLevelId] = [];
      }
    }
  }

  onSelectionOfOptions(event: any, currentField: any): void {
    this.projectSelected();
    const currentLevel = currentField.level;
    const currentLevelId = currentField.hierarchyLevelId;
    const selected = this.selectedItems[currentLevelId] || [];

    // --- IF NOTHING is selected in this field --- //
    if (selected.length === 0) {
      this.filtersApplied = false;
      // Case 1: If a parent level is deselected (levels 1, 2, 3, or 4)
      this.resetLevelsFrom(currentLevel); // Resets this level and all below
      this.clearSelectionsFrom(currentLevel + 1); // Clears selections below
    } else {
      this.filtersApplied = true;
      // Case 2: Normal bi-directional filtering
      this.filterChildrenRecursively(
        currentLevel + 1,
        selected.map((item) => item.nodeId),
      );
      this.filterParentRecursively(
        currentLevel - 1,
        selected.map((item) => item.parentId),
      );
    }
  }

  filterChildrenRecursively(level: number, parentNodeIds: string[]): void {
    const childField = this.formData.find((item) => item.level === level);

    if (!childField) return;

    const childList = childField.list || [];

    // Filter the child list based on the parent node IDs
    const filteredChildList = childList.filter((child: any) =>
      parentNodeIds.includes(child.parentId),
    );

    this.filteredSuggestions[childField.hierarchyLevelId] = filteredChildList;

    // Recursively filter the next level's children
    const nextLevel = level + 1;
    const nextParentNodeIds = filteredChildList.map(
      (child: any) => child.nodeId,
    );
    this.filterChildrenRecursively(nextLevel, nextParentNodeIds);
  }

  filterParentRecursively(level: number, childNodeIds: string[]): void {
    const parentField = this.formData.find((item) => item.level === level);

    if (!parentField) return;

    const parentList = parentField.list || [];

    // Filter the parent list based on the child node IDs
    const filteredParentList = parentList.filter((parent: any) =>
      childNodeIds.includes(parent.nodeId),
    );

    this.filteredSuggestions[parentField.hierarchyLevelId] = filteredParentList;

    // Recursively filter the next level's parents
    const nextLevel = level - 1;
    const nextChildNodeIds = filteredParentList.map(
      (parent: any) => parent.parentId,
    );
    this.filterParentRecursively(nextLevel, nextChildNodeIds);
  }
}
