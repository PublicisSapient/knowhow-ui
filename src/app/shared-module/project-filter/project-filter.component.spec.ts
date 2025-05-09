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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectFilterComponent } from './project-filter.component';
import { HttpService } from '../../services/http.service';
import { SharedService } from '../../services/shared.service';
import { MessageService } from 'primeng/api';
import { HelperService } from 'src/app/services/helper.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('ProjectFilterComponent', () => {
  let component: ProjectFilterComponent;
  let fixture: ComponentFixture<ProjectFilterComponent>;
  let httpServiceMock: jasmine.SpyObj<HttpService>;
  let sharedServiceMock: jasmine.SpyObj<SharedService>;
  let messageServiceMock: jasmine.SpyObj<MessageService>;
  let helperMock: jasmine.SpyObj<HelperService>;

  beforeEach(async () => {
    httpServiceMock = jasmine.createSpyObj('HttpService', [
      'getAllProjects',
      'getOrganizationHierarchy',
      'getAllHierarchyLevels',
    ]);
    sharedServiceMock = jasmine.createSpyObj('SharedService', [
      'sendProjectData',
    ]);
    messageServiceMock = jasmine.createSpyObj('MessageService', ['add']);
    helperMock = jasmine.createSpyObj('HelperService', ['sortByField']);

    httpServiceMock.getAllProjects.and.returnValue(
      of({
        data: [
          {
            id: 'P1',
            hierarchy: [
              {
                hierarchyLevel: { hierarchyLevelId: 'Level1' },
                value: 'Node 1',
              },
            ],
          },
        ],
      }),
    );

    await TestBed.configureTestingModule({
      declarations: [ProjectFilterComponent],
      providers: [
        { provide: HttpService, useValue: httpServiceMock },
        { provide: SharedService, useValue: sharedServiceMock },
        { provide: MessageService, useValue: messageServiceMock },
        { provide: HelperService, useValue: helperMock },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ clone: 'false' }) },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call getProjects() on init', () => {
    spyOn(component, 'getProjects');
    component.ngOnInit();
    expect(component.getProjects).toHaveBeenCalled();
  });

  // -- this test case needs a look -- //
  xit('should fetch projects and set data in getProjects()', () => {
    const mockProjectData = {
      data: [
        {
          id: 'P1',
          hierarchy: [
            { hierarchyLevel: { hierarchyLevelId: 'Level1' }, value: 'Node 1' },
          ],
        },
      ],
      error: false,
    };

    httpServiceMock.getAllProjects.and.returnValue(of(mockProjectData));

    component.getProjects();

    expect(component.data.length).toBe(1);
    expect(component.hierarchyArray).toEqual(['Level1']);
    expect(sharedServiceMock.sendProjectData).toHaveBeenCalledWith(
      mockProjectData.data,
    );
  });

  it('should show error message when getProjects() fails', () => {
    httpServiceMock.getAllProjects.and.returnValue(of({ error: true }));

    component.getProjects();
    expect(messageServiceMock.add).toHaveBeenCalledWith({
      severity: 'error',
      summary:
        'User needs to be assigned a project for the access to work on dashboards.',
    });
  });

  it('should clear all filters in clearFilters()', () => {
    component.selectedVal = {};
    component.projects = [{ id: 'P1', hierarchy: [] }];

    component.clearFilters();

    expect(component.selectedVal).toEqual({});
    expect(component.projects.length).toBe(1);
  });

  it('should sort selectedVal in sortFilters()', () => {
    component.selectedVal = {
      Level2: [{ name: 'Node 2', code: 'L2' }],
      Level1: [{ name: 'Node 1', code: 'L1' }],
    };
    component.hierarchyArray = ['Level1', 'Level2'];

    component.sortFilters();

    expect(Object.keys(component.selectedVal)).toEqual(['Level1', 'Level2']);
  });

  it('should emit project selection event in projectSelected()', () => {
    spyOn(component.projectSelectedEvent, 'emit');

    component.hierarchyArray = ['Level1'];
    component.selectedVal['Level1'] = [{ name: 'Node 1', code: 'L1' }];
    component.valueRemoved = { removedKey: 'Some Value' };

    component.projectSelected();

    expect(component.projectSelectedEvent.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        accessType: 'Level1',
        value: [{ itemId: 'L1', itemName: 'Node 1' }],
        hierarchyArr: ['Level1'],
        valueRemoved: { removedKey: 'Some Value' },
      }),
    );
  });

  it('should return selected template values in getSelectedValTemplateValue()', () => {
    component.selectedVal['Level1'] = [{ name: 'Node 1' }, { name: 'Node 2' }];

    const result = component.getSelectedValTemplateValue('Level1');

    expect(result).toBe('Node 1, Node 2');
  });

  describe('lookForCompletHierarchyData', () => {
    it('should call getHierarchy if completeHierarchyData is found in localStorage', () => {
      const mockHierarchyData = {
        scrum: [
          {
            id: '1',
            hierarchyLevelId: 'Level1',
            hierarchyLevelName: 'Level 1',
          },
        ],
      };
      spyOn(localStorage, 'getItem').and.returnValue(
        JSON.stringify(mockHierarchyData),
      );
      spyOn(component, 'getHierarchy');

      component.lookForCompletHierarchyData();

      expect(component.getHierarchy).toHaveBeenCalled();
    });

    it('should fetch hierarchy levels and call getHierarchy if completeHierarchyData is not found', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      spyOn(localStorage, 'setItem');
      spyOn(component, 'getHierarchy');
      const mockApiResponse = {
        data: {
          scrum: [
            {
              id: '1',
              hierarchyLevelId: 'Level1',
              hierarchyLevelName: 'Level 1',
            },
          ],
        },
      };
      httpServiceMock.getAllHierarchyLevels.and.returnValue(
        of(mockApiResponse),
      );

      component.lookForCompletHierarchyData();

      expect(httpServiceMock.getAllHierarchyLevels).toHaveBeenCalled();
      expect(component.completeHierarchyData).toEqual(mockApiResponse.data);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'completeHierarchyData',
        JSON.stringify(mockApiResponse.data),
      );
      expect(component.getHierarchy).toHaveBeenCalled();
    });
  });

  describe('getHierarchy', () => {
    it('should process and store hierarchy data when API call is successful', () => {
      const mockCompleteHierarchyData = {
        scrum: [
          {
            id: '1',
            hierarchyLevelId: 'Level1',
            hierarchyLevelName: 'Level 1',
          },
          {
            id: '2',
            hierarchyLevelId: 'Level2',
            hierarchyLevelName: 'Level 2',
          },
        ],
      };
      const mockFormFieldData = {
        success: true,
        data: [
          {
            hierarchyLevelId: 'Level1',
            nodeId: 'N1',
            nodeName: 'Node 1',
            nodeDisplayName: 'Node 1 Display',
            parentId: null,
          },
          {
            hierarchyLevelId: 'Level2',
            nodeId: 'N2',
            nodeName: 'Node 2',
            nodeDisplayName: 'Node 2 Display',
            parentId: 'N1',
          },
        ],
      };

      component.completeHierarchyData = mockCompleteHierarchyData;
      httpServiceMock.getOrganizationHierarchy.and.returnValue(
        of(mockFormFieldData),
      );
      spyOn(localStorage, 'setItem');

      component.getHierarchy();

      expect(httpServiceMock.getOrganizationHierarchy).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'hierarchyData',
        jasmine.any(String),
      );
    });

    it('should handle API call failure gracefully', () => {
      const mockCompleteHierarchyData = {
        scrum: [
          {
            id: '1',
            hierarchyLevelId: 'Level1',
            hierarchyLevelName: 'Level 1',
          },
        ],
      };
      const mockErrorResponse = {
        success: false,
        message: 'Error fetching data',
      };

      component.completeHierarchyData = mockCompleteHierarchyData;
      httpServiceMock.getOrganizationHierarchy.and.returnValue(
        of(mockErrorResponse),
      );

      component.getHierarchy();

      expect(httpServiceMock.getOrganizationHierarchy).toHaveBeenCalled();
      expect(messageServiceMock.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error fetching data',
      });
    });
  });

  describe('getNodeDisplayNameById', () => {
    beforeEach(() => {
      component.formData = [
        {
          level: 1,
          list: [
            { nodeId: 'N1', nodeDisplayName: 'Node 1 Display' },
            { nodeId: 'N2', nodeDisplayName: 'Node 2 Display' },
          ],
        },
        {
          level: 2,
          list: [{ nodeId: 'N3', nodeDisplayName: 'Node 3 Display' }],
        },
      ];
    });

    it('should return null if parentId is null', () => {
      const result = component.getNodeDisplayNameById(null, { level: 2 });
      expect(result).toBeNull();
    });

    it('should return null if parentLevel is not found', () => {
      const result = component.getNodeDisplayNameById('N1', { level: 3 });
      expect(result).toBeNull();
    });

    it('should return null if parentLevel list is empty', () => {
      component.formData[0].list = [];
      const result = component.getNodeDisplayNameById('N1', { level: 2 });
      expect(result).toBeNull();
    });

    it('should return the display name of the parent node if found', () => {
      const result = component.getNodeDisplayNameById('N1', { level: 2 });
      expect(result).toBe('(Node 1 Display)');
    });

    it('should return null if parentNode is not found', () => {
      const result = component.getNodeDisplayNameById('N4', { level: 2 });
      expect(result).toBeNull();
    });
  });

  describe('ProjectFilterComponent - Hierarchy Filtering', () => {
    beforeEach(() => {
      component.formData = [
        {
          level: 1,
          hierarchyLevelId: 'bu',
          list: [{ nodeId: 'BU1' }, { nodeId: 'BU2' }],
        },
        {
          level: 2,
          hierarchyLevelId: 'ver',
          list: [
            { nodeId: 'VER1', parentId: 'BU1' },
            { nodeId: 'VER2', parentId: 'BU2' },
          ],
        },
        {
          level: 3,
          hierarchyLevelId: 'acc',
          list: [
            { nodeId: 'ACC1', parentId: 'VER1' },
            { nodeId: 'ACC2', parentId: 'VER2' },
          ],
        },
      ];

      component.selectedItems = {
        bu: [{ nodeId: 'BU1' }],
        ver: [],
        acc: [],
      };

      component.filteredSuggestions = {};
    });

    it('should filter children recursively when selecting a parent (onSelectionOfOptions)', () => {
      const currentField = { hierarchyLevelId: 'bu', level: 1 };
      const event = {}; // event not used internally
      component.onSelectionOfOptions(event, currentField);

      expect(component.filteredSuggestions['ver'].length).toBe(1);
      expect(component.filteredSuggestions['ver'][0].nodeId).toBe('VER1');

      expect(component.filteredSuggestions['acc'].length).toBe(1);
      expect(component.filteredSuggestions['acc'][0].nodeId).toBe('ACC1');
    });

    it('should filter children recursively (filterChildrenRecursively)', () => {
      component.filterChildrenRecursively(2, ['BU1']);

      expect(component.filteredSuggestions['ver'].length).toBe(1);
      expect(component.filteredSuggestions['ver'][0].nodeId).toBe('VER1');

      expect(component.filteredSuggestions['acc'].length).toBe(1);
      expect(component.filteredSuggestions['acc'][0].nodeId).toBe('ACC1');
    });

    it('should stop recursion if no child level exists (filterChildrenRecursively)', () => {
      component.filterChildrenRecursively(4, ['non-existing']);
      // nothing should happen
      expect(Object.keys(component.filteredSuggestions).length).toBe(0);
    });

    it('should filter parents recursively (filterParentRecursively)', () => {
      component.filterParentRecursively(2, ['ACC1']);

      expect(component.filteredSuggestions['ver'].length).toBe(0);
      // expect(component.filteredSuggestions['ver'][0].nodeId).toBe('VER1');

      expect(component.filteredSuggestions['bu'].length).toBe(0);
      // expect(component.filteredSuggestions['bu'][0].nodeId).toBe('BU1');
    });

    it('should stop recursion if no parent level exists (filterParentRecursively)', () => {
      component.filterParentRecursively(0, ['non-existing']);
      expect(Object.keys(component.filteredSuggestions).length).toBe(0);
    });
  });
});
