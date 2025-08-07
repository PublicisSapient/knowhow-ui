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

  it('should clear selected filters, reset suggestions and projects, and call projectSelected', () => {
    // Arrange - setup mock formData, selectedItems, filteredSuggestions, and data
    component.formData = [
      {
        hierarchyLevelId: 'bu',
        list: [{ nodeId: '1', nodeDisplayName: 'BU1' }],
      },
      {
        hierarchyLevelId: 'vertical',
        list: [{ nodeId: '2', parentId: '1', nodeDisplayName: 'Vertical1' }],
      },
    ];

    component.selectedItems = {
      bu: [{ nodeId: '1', nodeDisplayName: 'BU1' }],
      vertical: [{ nodeId: '2', nodeDisplayName: 'Vertical1' }],
    };

    component.filteredSuggestions = {
      bu: [],
      vertical: [],
    };

    component.data = [{ id: 'P1', name: 'Project 1' }];
    component.projects = [];

    // Spy on projectSelected
    spyOn(component, 'projectSelected');

    // Act
    component.clearFilters();

    // Assert - selected items cleared
    expect(component.selectedItems.bu).toEqual([]);
    expect(component.selectedItems.vertical).toEqual([]);

    // Assert - filteredSuggestions reset to full list
    expect(component.filteredSuggestions.bu).toEqual(
      component.formData[0].list,
    );
    expect(component.filteredSuggestions.vertical).toEqual(
      component.formData[1].list,
    );

    // Assert - projects deep copied from data
    expect(component.projects).toEqual(component.data);
    expect(component.projects).not.toBe(component.data); // different reference

    // Assert - projectSelected called
    expect(component.projectSelected).toHaveBeenCalled();
  });

  it('should emit project selection event in projectSelected()', () => {
    spyOn(component.projectSelectedEvent, 'emit');

    component.hierarchyArray = ['Level1'];
    component.selectedVal['Level1'] = [{ name: 'Node 1', code: 'L1' }];
    component.valueRemoved = { removedKey: 'Some Value' };

    component.projectSelected();

    expect(component.projectSelectedEvent.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        hierarchyArr: ['Level1'],
        valueRemoved: { removedKey: 'Some Value' },
      }),
    );
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

  describe('resetLevelsFrom', () => {
    beforeEach(() => {
      component.formData = [
        {
          level: 1,
          hierarchyLevelId: 'Level1',
          list: [{ nodeId: '1' }, { nodeId: '2' }],
        },
        {
          level: 2,
          hierarchyLevelId: 'Level2',
          list: [
            { nodeId: '3', parentId: '1' },
            { nodeId: '4', parentId: '2' },
          ],
        },
      ];

      component.selectedItems = {
        Level1: [{ nodeId: '1' }],
        Level2: [{ nodeId: '3' }],
      };

      component.filteredSuggestions = {
        Level1: [],
        Level2: [],
      };
    });

    it('should reset filteredSuggestions and selectedItems from specified level', () => {
      component.resetLevelsFrom(1);

      expect(component.filteredSuggestions['Level1']).toEqual(
        component.formData[0].list,
      );
      expect(component.filteredSuggestions['Level2']).toEqual(
        component.formData[1].list,
      );

      expect(component.selectedItems['Level1']).toEqual([]);
      expect(component.selectedItems['Level2']).toEqual([]);
    });

    it('should not reset levels above the specified level', () => {
      component.resetLevelsFrom(2);

      expect(component.filteredSuggestions['Level1']).toEqual([]); // unchanged
      expect(component.filteredSuggestions['Level2']).toEqual(
        component.formData[1].list,
      );

      expect(component.selectedItems['Level1']).toEqual([{ nodeId: '1' }]); // unchanged
      expect(component.selectedItems['Level2']).toEqual([]);
    });
  });

  it('should reset filteredSuggestions to include all items from each level in formData', () => {
    // Arrange - set up formData with mock levels
    component.formData = [
      {
        hierarchyLevelId: 'bu',
        list: [{ nodeId: '1', nodeDisplayName: 'BU1' }],
      },
      {
        hierarchyLevelId: 'vertical',
        list: [{ nodeId: '2', nodeDisplayName: 'Vertical1' }],
      },
    ];

    // Initialize filteredSuggestions with some existing data
    component.filteredSuggestions = {
      bu: [],
      vertical: [],
    };

    // Act - call the method
    component.resetFiltersSuggestionsToAll();

    // Assert - filteredSuggestions should now match the lists from formData
    expect(component.filteredSuggestions.bu).toEqual(
      component.formData[0].list,
    );
    expect(component.filteredSuggestions.vertical).toEqual(
      component.formData[1].list,
    );
  });

  describe('clearSelectionsFrom', () => {
    beforeEach(() => {
      component.formData = [
        { level: 1, hierarchyLevelId: 'Level1' },
        { level: 2, hierarchyLevelId: 'Level2' },
        { level: 3, hierarchyLevelId: 'Level3' },
      ];

      component.selectedItems = {
        Level1: [{ nodeId: '1' }],
        Level2: [{ nodeId: '2' }],
        Level3: [{ nodeId: '3' }],
      };
    });

    it('should clear selections from specified level downward', () => {
      component.clearSelectionsFrom(2);

      expect(component.selectedItems['Level1']).toEqual([{ nodeId: '1' }]); // unchanged
      expect(component.selectedItems['Level2']).toEqual([]);
      expect(component.selectedItems['Level3']).toEqual([]);
    });

    it('should clear all selections when starting from level 1', () => {
      component.clearSelectionsFrom(1);

      expect(component.selectedItems['Level1']).toEqual([]);
      expect(component.selectedItems['Level2']).toEqual([]);
      expect(component.selectedItems['Level3']).toEqual([]);
    });
  });

  describe('onSelectionOfOptions', () => {
    beforeEach(() => {
      component.formData = [
        { level: 1, hierarchyLevelId: 'bu', list: [{ nodeId: 'BU1' }] },
        {
          level: 2,
          hierarchyLevelId: 'ver',
          list: [{ nodeId: 'VER1', parentId: 'BU1' }],
        },
        {
          level: 3,
          hierarchyLevelId: 'acc',
          list: [{ nodeId: 'ACC1', parentId: 'VER1' }],
        },
      ];

      component.filteredSuggestions = {
        bu: [...component.formData[0].list],
        ver: [...component.formData[1].list],
        acc: [...component.formData[2].list],
      };
    });

    it('should call resetLevelsFrom and clearSelectionsFrom if nothing is selected', () => {
      const currentField = { level: 1, hierarchyLevelId: 'bu' };
      component.selectedItems = { bu: [] }; // nothing selected

      spyOn(component, 'resetLevelsFrom');
      spyOn(component, 'clearSelectionsFrom');

      component.onSelectionOfOptions({}, currentField);

      expect(component.resetLevelsFrom).toHaveBeenCalledWith(1);
      expect(component.clearSelectionsFrom).toHaveBeenCalledWith(2);
    });

    it('should filter children and parents if there is a selection', () => {
      const currentField = { level: 1, hierarchyLevelId: 'bu' };
      component.selectedItems = { bu: [{ nodeId: 'BU1', parentId: null }] };

      spyOn(component, 'filterChildrenRecursively');
      spyOn(component, 'filterParentRecursively');

      component.onSelectionOfOptions({}, currentField);

      expect(component.filterChildrenRecursively).toHaveBeenCalledWith(2, [
        'BU1',
      ]);
      expect(component.filterParentRecursively).toHaveBeenCalledWith(0, [null]);
    });
  });
});
