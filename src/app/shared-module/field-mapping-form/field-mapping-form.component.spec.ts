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
import { SharedService } from 'src/app/services/shared.service';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpService } from 'src/app/services/http.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AppConfig, APP_CONFIG } from 'src/app/services/app.config';
import { environment } from 'src/environments/environment';
import { FieldMappingFormComponent } from './field-mapping-form.component';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

const fakeKpiFieldMappingConfigList = require('../../../test/resource/fakeMappingFieldConfig.json');
const baseUrl = environment.baseUrl;
const dropDownMetaData = require('../../../test/resource/KPIConfig.json');
const completeHierarchyData = {
  kanban: [
    {
      id: '63244d35d1d9f4caf85056f7',
      level: 1,
      hierarchyLevelId: 'corporate',
      hierarchyLevelName: 'Corporate Name',
    },
    {
      id: '63244d35d1d9f4caf85056f8',
      level: 2,
      hierarchyLevelId: 'business',
      hierarchyLevelName: 'Business Name',
    },
    {
      id: '63244d35d1d9f4caf85056f9',
      level: 3,
      hierarchyLevelId: 'dummy',
      hierarchyLevelName: 'dummy Name',
    },
    {
      id: '63244d35d1d9f4caf85056fa',
      level: 4,
      hierarchyLevelId: 'subdummy',
      hierarchyLevelName: 'Subdummy',
    },
    {
      level: 5,
      hierarchyLevelId: 'project',
      hierarchyLevelName: 'Project',
    },
    {
      level: 6,
      hierarchyLevelId: 'sqd',
      hierarchyLevelName: 'Squad',
    },
  ],
  scrum: [
    {
      id: '63244d35d1d9f4caf85056f7',
      level: 1,
      hierarchyLevelId: 'corporate',
      hierarchyLevelName: 'Corporate Name',
    },
    {
      id: '63244d35d1d9f4caf85056f8',
      level: 2,
      hierarchyLevelId: 'business',
      hierarchyLevelName: 'Business Name',
    },
    {
      id: '63244d35d1d9f4caf85056f9',
      level: 3,
      hierarchyLevelId: 'dummy',
      hierarchyLevelName: 'dummy Name',
    },
    {
      id: '63244d35d1d9f4caf85056fa',
      level: 4,
      hierarchyLevelId: 'subdummy',
      hierarchyLevelName: 'Subdummy',
    },
    {
      level: 5,
      hierarchyLevelId: 'project',
      hierarchyLevelName: 'Project',
    },
    {
      level: 6,
      hierarchyLevelId: 'sprint',
      hierarchyLevelName: 'Sprint',
    },
    {
      level: 7,
      hierarchyLevelId: 'sqd',
      hierarchyLevelName: 'Squad',
    },
  ],
};

const fakeSelectedFieldMapping = [
  {
    fieldName: 'f1',
    originalValue: 'value1',
  },
  {
    fieldName: 'f2',
    originalValue: ['abc'],
  },
  {
    fieldName: 'f2',
  },
  {
    fieldName: 'f3',
    originalValue: ['abcd'],
    history: [
      {
        'Chenge From': ['abc'],
      },
    ],
  },
  {
    fieldName: 'jiraDefectRejectionStatusDIRtest1',
    history: [
      {
        'Chenge From': ['abc'],
      },
    ],
  },

  {
    fieldName: 'jiraDefectRejectionStatusDIR23',
    originalValue: ['abcd'],
    history: [
      {
        'Chenge From': ['abc'],
      },
    ],
  },
];

const successResponse = {
  message: 'field mappings added successfully',
  success: true,
  data: {
    id: '63282cbaf5c740241aff32a1',
    projectToolConfigId: '63282ca6487eff1e8b70b1bb',
    basicProjectConfigId: '63282c82487eff1e8b70b1b9',
    sprintName: 'customfield_12700',
    jiradefecttype: ['Defect'],
    defectPriority: [],
    jiraIssueTypeNames: [
      'Story',
      'Enabler Story',
      'Change request',
      'Defect',
      'Epic',
    ],
    storyFirstStatus: 'Open',
    rootCause: 'customfield_19121',
    jiraStatusForDevelopment: ['Implementing', 'In Development', 'In Analysis'],
    jiraIssueEpicType: ['Epic'],
    jiraStatusForQa: ['In Testing'],
    jiraDefectInjectionIssueType: ['Story', 'Enabler Story', 'Change request'],
    jiraDod: ['Closed', 'Ready for Delivery'],
    jiraDefectCreatedStatus: 'Open',
    issueStatusExcluMissingWork: ['Open'],
    jiraTechDebtIssueType: ['Story', 'Enabler Story', 'Change request'],
    jiraTechDebtIdentification: '',
    jiraTechDebtCustomField: '',
    jiraTechDebtValue: [],
    jiraDefectRejectionStatus: 'Closed',
    jiraBugRaisedByIdentification: '',
    jiraBugRaisedByValue: [],
    jiraDefectSeepageIssueType: ['Story', 'Enabler Story', 'Change request'],
    jiraBugRaisedByCustomField: '',
    jiraDefectRemovalStatus: ['Closed', 'Ready for Delivery'],
    jiraDefectRemovalIssueType: ['Story', 'Enabler Story', 'Change request'],
    jiraStoryPointsCustomField: 'customfield_20803',
    jiraTestAutomationIssueType: ['Story', 'Enabler Story', 'Change request'],
    jiraCanNotAutomatedTestValue: [],
    jiraSprintVelocityIssueType: ['Story', 'Enabler Story', 'Change request'],
    jiraSprintCapacityIssueType: ['Story', 'Enabler Story', 'Change request'],
    jiraDefectRejectionlIssueType: ['Story', 'Enabler Story', 'Change request'],
    jiraDefectCountlIssueType: ['Story', 'Enabler Story', 'Change request'],
    jiraIssueDeliverdStatus: ['Closed', 'Resolved'],

    jiraBugRaisedByQACustomField: '',
    jiraBugRaisedByQAIdentification: '',
    jiraBugRaisedByQAValue: [],
    jiraDefectDroppedStatus: [],
    epicCostOfDelay: 'customfield_58102',
    epicRiskReduction: 'customfield_58101',
  },
};

const routerMock = {
  navigate: jasmine.createSpy('navigate'),
};

describe('FieldMappingFormComponent', () => {
  let component: FieldMappingFormComponent;
  let fixture: ComponentFixture<FieldMappingFormComponent>;
  let httpMock;
  let sharedService: SharedService;
  let httpService: HttpService;
  let messageService: MessageService;
  let confirmationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldMappingFormComponent],
      imports: [HttpClientTestingModule, ReactiveFormsModule],
      providers: [
        SharedService,
        HttpService,
        MessageService,
        ConfirmationService,
        { provide: APP_CONFIG, useValue: AppConfig },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldMappingFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    httpService = TestBed.inject(HttpService);
    sharedService = TestBed.inject(SharedService);
    messageService = TestBed.inject(MessageService);
    confirmationService = TestBed.inject(ConfirmationService);

    localStorage.setItem(
      'completeHierarchyData',
      JSON.stringify(completeHierarchyData),
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form', () => {
    component.fieldMappingConfig =
      fakeKpiFieldMappingConfigList.data.fieldConfiguration;
    component.formData = fakeSelectedFieldMapping;
    component.initializeForm();
    expect(component.form).toBeDefined();
  });

  it('should create group configurations based on section', () => {
    component.fieldMappingConfig =
      fakeKpiFieldMappingConfigList.data.fieldConfiguration;
    component.formData = fakeSelectedFieldMapping;
    component.generateFieldMappingConfiguration();
    expect(component.fieldMappingSectionList).toBeDefined();
  });

  xit('should select values from popup', () => {
    component.fieldMappingConfig =
      fakeKpiFieldMappingConfigList.data.fieldConfiguration;
    component.formData = fakeSelectedFieldMapping;
    component.singleSelectionDropdown = false;
    component.selectedField = 'jiraIssueDeliverdStatus';
    component.fieldMappingMultiSelectValues = [
      {
        key: 'New',
        data: 'New',
      },
      {
        key: 'Active',
        data: 'Active',
      },
      {
        key: 'Resolved',
        data: 'Resolved',
      },
      {
        key: 'Closed',
        data: 'Closed',
      },
      {
        key: 'Removed',
        data: 'Removed',
      },
    ];
    component.ngOnInit();
    component.form.controls[component.selectedField].setValue([]);
    fixture.detectChanges();
    component.selectedMultiValue = [
      {
        key: 'Resolved',
        data: 'Resolved',
      },
      {
        key: 'Closed',
        data: 'Closed',
      },
      {
        key: 'Removed',
        data: 'Removed',
      },
    ];
    component.saveDialog();
    fixture.detectChanges();
    expect(component.form.controls[component.selectedField].value).toEqual([
      'Resolved',
      'Closed',
      'Removed',
    ]);
    expect(component.populateDropdowns).toBeFalsy();
    expect(component.displayDialog).toBeFalsy();
  });

  it('should check for template info popup', () => {
    component.fieldMappingConfig =
      fakeKpiFieldMappingConfigList.data.fieldConfiguration;
    component.formData = fakeSelectedFieldMapping;
    component.selectedConfig = { id: '123' };
    component.selectedToolConfig = [{ id: '123', toolName: 'JIRA' }];
    spyOn(httpService, 'getMappingTemplateFlag').and.returnValue(
      of(successResponse),
    );
    component.ngOnInit();
    component.save();
    expect(component.form.valid).toBeTruthy();
  });

  it('should save field mapping', () => {
    component.fieldMappingConfig =
      fakeKpiFieldMappingConfigList.data.fieldConfiguration;
    component.formData = fakeSelectedFieldMapping;
    component.selectedConfig = { id: '123' };
    component.selectedToolConfig = [{ id: '123', toolName: 'JIRA' }];
    spyOn(httpService, 'setFieldMappings').and.returnValue(of(successResponse));
    component.ngOnInit();
    const mappingObj = [{ jiraconfig: '123' }];
    component.saveFieldMapping(mappingObj);
    expect(component.form.valid).toBeTruthy();
  });

  it('should populate value on import', () => {
    component.fieldMappingConfig =
      fakeKpiFieldMappingConfigList.data.fieldConfiguration;
    component.formData = fakeSelectedFieldMapping;
    component.selectedConfig = { id: '1233' };
    component.selectedToolConfig = [{ id: '1233', toolName: 'JIRA' }];
    component.ngOnInit();
    const spyFun = spyOn(component, 'saveFieldMapping');
    component.setControlValueOnImport(fakeSelectedFieldMapping);
    expect(spyFun).toBeDefined();
  });

  it('should close dialog', () => {
    component.cancelDialog();
    expect(component.displayDialog).toBeFalsy();
  });

  it('should open/close the dropdown dialog and set values', () => {
    component.selectedField = 'jiraDefectRejectionStatusDIR';
    component.fieldMappingConfig =
      fakeKpiFieldMappingConfigList.data.fieldConfiguration;
    component.formData = fakeSelectedFieldMapping;
    component.selectedConfig = { id: '1233' };
    component.selectedToolConfig = [{ id: '1233', toolName: 'JIRA' }];
    component.ngOnInit();
    component.form.controls['jiraDefectRejectionStatusDIR'].setValue(
      'fake value',
    );
    component.fieldMappingMetaData = dropDownMetaData.data;
    component.showDialogToAddValue({
      isSingle: true,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'fields',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();

    component.fieldMappingMetaData = dropDownMetaData;
    component.showDialogToAddValue({
      isSingle: true,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'fields',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();

    component.fieldMappingMetaData = dropDownMetaData.data;
    component.showDialogToAddValue({
      isSingle: true,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'workflow',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();

    component.fieldMappingMetaData = dropDownMetaData;
    component.showDialogToAddValue({
      isSingle: true,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'workflow',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();

    component.fieldMappingMetaData = dropDownMetaData.data;
    component.showDialogToAddValue({
      isSingle: true,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'Issue_Link',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();

    component.fieldMappingMetaData = dropDownMetaData;
    component.showDialogToAddValue({
      isSingle: true,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'Issue_Link',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();

    component.fieldMappingMetaData = dropDownMetaData.data;
    component.showDialogToAddValue({
      isSingle: true,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'Issue_Type',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();

    component.fieldMappingMetaData = dropDownMetaData;
    component.showDialogToAddValue({
      isSingle: true,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'Issue_Type',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();

    component.fieldMappingMetaData = dropDownMetaData;
    component.showDialogToAddValue({
      isSingle: true,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'releases',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();

    component.fieldMappingMetaData = dropDownMetaData.data;
    component.showDialogToAddValue({
      isSingle: true,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'releases',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();

    component.fieldMappingMetaData = dropDownMetaData;
    component.showDialogToAddValue({
      isSingle: true,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'default',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();

    component.fieldMappingMetaData = dropDownMetaData.data;
    component.showDialogToAddValue({
      isSingle: false,
      fieldName: 'jiraDefectRejectionStatusDIR',
      type: 'fields',
    });
    expect(component.fieldMappingMultiSelectValues).not.toBeNull();
  });

  it('should select values from popup', () => {
    component.singleSelectionDropdown = false;
    component.selectedField = 'jiraDefectRejectionStatusDIR';
    component.fieldMappingConfig =
      fakeKpiFieldMappingConfigList.data.fieldConfiguration;
    component.formData = fakeSelectedFieldMapping;
    component.selectedConfig = { id: '1233' };
    component.selectedToolConfig = [{ id: '1233', toolName: 'JIRA' }];
    component.fieldMappingMultiSelectValues = [
      {
        key: 'New',
        data: 'New',
      },
      {
        key: 'Active',
        data: 'Active',
      },
      {
        key: 'Resolved',
        data: 'Resolved',
      },
      {
        key: 'Closed',
        data: 'Closed',
      },
      {
        key: 'Removed',
        data: 'Removed',
      },
    ];
    component.ngOnInit();
    component.form.controls[component.selectedField].setValue([]);
    component.selectedMultiValue = [
      {
        key: 'Resolved',
        data: 'Resolved',
      },
      {
        key: 'Closed',
        data: 'Closed',
      },
      {
        key: 'Removed',
        data: 'Removed',
      },
    ];
    component.saveDialog();
    expect(component.form.controls[component.selectedField].value).toEqual([
      'Resolved',
      'Closed',
      'Removed',
    ]);
    expect(component.populateDropdowns).toBeFalsy();
    expect(component.displayDialog).toBeFalsy();
  });

  it('should save data with showing popup', () => {
    component.formData = [
      {
        fieldName: 'jiraDefectCreatedStatusKPI14',
        originalValue: 'Open',
      },
      {
        fieldName: 'jiraDefectDroppedStatusKPI127',
        originalValue: ['Dropped', 'Canceled'],
      },
    ];

    component.selectedConfig = {
      id: 'XXXXXXXXXXXXXXXXXXXXXXXX',
    };
    component.form = new FormGroup({
      jiraDefectCreatedStatusKPI14: new FormControl([]),
      jiraDefectDroppedStatusKPI127: new FormControl(['done']),
    });
    component.selectedToolConfig = [
      {
        toolName: 'Jira',
      },
    ];
    const response = {
      success: true,
      data: null,
    };
    component.metaDataTemplateCode = '1';
    spyOn(httpService, 'getMappingTemplateFlag').and.returnValue(of(response));
    const spy = spyOn(component, 'saveFieldMapping');
    component.save();

    spyOn<any>(confirmationService, 'confirm').and.callFake((params: any) => {
      params.accept();
      expect(spy).toHaveBeenCalled();
    });
  });

  it('should save data for non jira tool', () => {
    component.formData = [
      {
        fieldName: 'jiraDefectCreatedStatusKPI14',
        originalValue: 'Open',
      },
      {
        fieldName: 'jiraDefectDroppedStatusKPI127',
        originalValue: ['Dropped', 'Canceled'],
      },
    ];

    component.selectedConfig = {
      id: 'XXXXXXXXXXXXXXXXXXXXXXXX',
    };
    component.form = new FormGroup({
      jiraDefectCreatedStatusKPI14: new FormControl([]),
      jiraDefectDroppedStatusKPI127: new FormControl(['done']),
    });
    component.selectedToolConfig = [
      {
        toolName: 'nonJira',
      },
    ];
    const response = {
      success: true,
      data: null,
    };
    component.metaDataTemplateCode = '1';
    spyOn(httpService, 'getMappingTemplateFlag').and.returnValue(of(response));
    const spy = spyOn(component, 'saveFieldMapping');
    component.save();
    expect(spy).toHaveBeenCalled();
  });

  it('should save data without showing popup', () => {
    component.formData = [
      {
        fieldName: 'jiraDefectCreatedStatusKPI14',
        originalValue: 'Open',
      },
      {
        fieldName: 'jiraDefectDroppedStatusKPI127',
        originalValue: ['Dropped', 'Canceled'],
      },
    ];

    component.selectedConfig = {
      id: 'XXXXXXXXXXXXXXXXXXXXXXXX',
    };
    component.form = new FormGroup({
      jiraDefectCreatedStatusKPI14: new FormControl([]),
      jiraDefectDroppedStatusKPI127: new FormControl(['done']),
    });
    component.selectedToolConfig = [
      {
        toolName: 'Jira',
      },
    ];
    const response = {
      success: true,
      data: null,
    };
    component.metaDataTemplateCode = '9';
    spyOn(httpService, 'getMappingTemplateFlag').and.returnValue(of(response));
    const spy = spyOn(component, 'saveFieldMapping');
    component.save();
    expect(spy).toHaveBeenCalled();
  });

  it('should handle error on save field filed mapping api call', () => {
    const mappingData = [
      {
        id: 'xxxxxxxxxxxxx',
        basicProjectConfigId: 'xxxxxxxxxxxxxxxxxx',
      },
    ];
    const errResponse = {
      error: 'Something went wrong',
      success: false,
    };
    component.selectedToolConfig = [
      {
        toolName: 'Jira',
        id: 'xxxxxxxxxxxxx',
      },
    ];
    spyOn(httpService, 'setFieldMappings').and.returnValue(of(errResponse));
    const spy = spyOn(messageService, 'add');
    component.saveFieldMapping(mappingData);
    expect(spy).toHaveBeenCalled();
  });

  it('should save dialog when selected value has value', () => {
    component.singleSelectionDropdown = true;
    component.selectedValue = ['Open'];
    component.selectedField = 'jiraIterationIssuetypeKPI120';
    component.form = new FormGroup({
      jiraIterationIssuetypeKPI120: new FormControl([]),
    });
    component.saveDialog();
    expect(component.form.controls[component.selectedField].value).toEqual([
      'Open',
    ]);
  });

  it('should save dialog when selected multi value has value', () => {
    component.singleSelectionDropdown = false;
    component.selectedMultiValue = [
      {
        key: 'Open',
        data: 'Open',
      },
      {
        key: 'In Progress',
        data: 'In Progress',
      },
    ];
    component.selectedField = 'jiraIterationIssuetypeKPI120';
    component.form = new FormGroup({
      jiraIterationIssuetypeKPI120: new FormControl(['Open']),
    });
    component.fieldMappingMultiSelectValues = [
      {
        key: 'Open',
        data: 'Open',
      },
      {
        key: 'In Progress',
        data: 'In Progress',
      },
    ];
    component.saveDialog();
    expect(
      component.form.controls[component.selectedField].value.length,
    ).toEqual(2);
  });

  it('should preapare field mapping history', () => {
    component.isHistoryPopup = {
      field1: false,
      field2: false,
    };
    component.historyList = [
      {
        fieldName: 'field2',
        originalValue: ['abcd'],
        history: [
          {
            'change From': ['abc'],
          },
        ],
      },
    ];
    component.handleBtnClick('field2');
    expect(component.showSpinner).toBeFalsy();
  });

  it('should refresh history and values one field mapping value saved', () => {
    component.fieldMappingConfig =
      fakeKpiFieldMappingConfigList.data.fieldConfiguration;
    component.formData = fakeSelectedFieldMapping;
    component.selectedToolConfig = [{ id: 'testId' }];
    component.kpiId = 'dummyId';
    // Initialize the form before calling refresh
    component.ngOnInit();
    const spyObj = spyOn(sharedService, 'setSelectedFieldMapping');
    spyOn(httpService, 'getFieldMappingsWithHistory').and.returnValue(
      of({
        success: true,
        data: {
          metaTemplateCode: 12,
          fieldMappingResponses: [],
        },
      }),
    );
    component.refreshFieldMapppingValueANDHistory();

    expect(spyObj).toHaveBeenCalled();
  });

  it('should close history popup on mouse out', () => {
    component.isHistoryPopup = {
      f1: true,
    };
    component.onMouseOut('f1');
    expect(component.isHistoryPopup['f1']).toBeFalse();
  });

  it('should scroll based on position ', () => {
    component.bodyScrollPosition = 400;
    component.scrollToPosition();
    expect(component.populateDropdowns).toBeFalsy();
  });

  it('should compare field mapping whn value is object', () => {
    const re1 = component.compareValues({ key1: 'value2' }, { key1: 'value1' });
    expect(re1).toBeFalsy();

    const re2 = component.compareValues(
      { key1: 'value2' },
      { key1: 'value1', key2: 'value2' },
    );
    expect(re2).toBeFalsy();

    const re3 = component.compareValues({ key1: 'value1' }, { key1: 'value1' });
    expect(re3).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should reinitialize form when formData changes after initial load', () => {
      component.fieldMappingConfig =
        fakeKpiFieldMappingConfigList.data.fieldConfiguration;
      component.formData = fakeSelectedFieldMapping;
      component.ngOnInit();

      const initSpy = spyOn(component, 'initializeForm');
      const generateSpy = spyOn(component, 'generateFieldMappingConfiguration');

      const newFormData = [...fakeSelectedFieldMapping];
      const changes = {
        formData: {
          currentValue: newFormData,
          previousValue: fakeSelectedFieldMapping,
          firstChange: false,
          isFirstChange: () => false,
        },
      };

      component.ngOnChanges(changes);

      expect(initSpy).toHaveBeenCalled();
      expect(generateSpy).toHaveBeenCalled();
      expect(component.form.pristine).toBeTruthy();
    });

    it('should not reinitialize on first change', () => {
      const initSpy = spyOn(component, 'initializeForm');

      const changes = {
        formData: {
          currentValue: fakeSelectedFieldMapping,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      };

      component.ngOnChanges(changes);

      expect(initSpy).not.toHaveBeenCalled();
    });

    it('should not reinitialize if form is not defined', () => {
      component.form = null;
      const initSpy = spyOn(component, 'initializeForm');

      const changes = {
        formData: {
          currentValue: fakeSelectedFieldMapping,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      };

      component.ngOnChanges(changes);

      expect(initSpy).not.toHaveBeenCalled();
    });
  });

  describe('Dynamic Workflow Fields', () => {
    beforeEach(() => {
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraWorkflowGroupsKPI202',
          fieldLabel: 'Workfow groups',
          fieldType: 'chips',
          fieldCategory: 'workflow',
          section: 'WorkFlow Status Mapping',
        },
      ];
      component.formData = [];
      component.kpiId = 'kpi202';
    });

    it('should update dynamic workflow fields for kpi202', () => {
      component.ngOnInit();

      const selectedGroups = ['In Progress', 'Done'];
      component.updateDynamicWorkflowFields(selectedGroups);

      expect(component.formConfig['WorkFlow Status Mapping']).toBeDefined();
      const dynamicFields = component.formConfig[
        'WorkFlow Status Mapping'
      ].filter((f) => f.isDynamic);
      expect(dynamicFields.length).toBe(2);
      expect(dynamicFields[0].fieldName).toBe('jiraStatusForInProgress');
      expect(dynamicFields[1].fieldName).toBe('jiraStatusForDone');
    });

    it('should update dynamic workflow fields for kpi206', () => {
      component.kpiId = 'kpi206';
      component.fieldMappingConfig[0].fieldName = 'jiraWorkflowGroupsKPI206';
      component.ngOnInit();

      const selectedGroups = ['To Do', 'In Review'];
      component.updateDynamicWorkflowFields(selectedGroups);

      expect(component.formConfig['WorkFlow Status Mapping']).toBeDefined();
      const dynamicFields = component.formConfig[
        'WorkFlow Status Mapping'
      ].filter((f) => f.isDynamic);
      expect(dynamicFields.length).toBe(2);
      expect(dynamicFields[0].fieldName).toBe('jiraStatusForToDo');
      expect(dynamicFields[1].fieldName).toBe('jiraStatusForInReview');
    });

    it('should update dynamic workflow fields for kpi311', () => {
      component.kpiId = 'kpi311';
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraFieldsSelectionKPI311',
          fieldLabel: 'Fields to write prompts',
          fieldType: 'chips',
          fieldCategory: 'workflow',
          section: undefined,
        },
      ];
      component.ngOnInit();

      const selectedGroups = ['Summary', 'Description'];
      component.updateDynamicWorkflowFields(selectedGroups);

      const targetSection = 'jiraFieldsSelectionKPI311';
      expect(component.formConfig[targetSection]).toBeDefined();
      const dynamicFields = component.formConfig[targetSection].filter(
        (f) => f.isDynamic,
      );
      expect(dynamicFields.length).toBe(2);
      expect(dynamicFields[0].fieldLabel).toBe('Summary');
      expect(dynamicFields[1].fieldLabel).toBe('Description');
    });

    it('should remove dynamic fields when groups are deselected', () => {
      component.ngOnInit();

      // First add some groups
      component.updateDynamicWorkflowFields(['Group1', 'Group2']);
      let dynamicFields = component.formConfig[
        'WorkFlow Status Mapping'
      ].filter((f) => f.isDynamic);
      expect(dynamicFields.length).toBe(2);

      // Now remove one group
      component.updateDynamicWorkflowFields(['Group1']);
      dynamicFields = component.formConfig['WorkFlow Status Mapping'].filter(
        (f) => f.isDynamic,
      );
      expect(dynamicFields.length).toBe(1);
      expect(dynamicFields[0].fieldName).toBe('jiraStatusForGroup1');
    });

    it('should handle array trigger value in generateFromControlBasedOnFieldType', () => {
      component.formData = [
        {
          fieldName: 'jiraWorkflowGroupsKPI202',
          originalValue: [
            { label: 'In Progress', statuses: ['Implementing'] },
            { label: 'Done', statuses: ['Closed'] },
          ],
        },
      ];
      component.ngOnInit();

      const control = component.form.get('jiraWorkflowGroupsKPI202');
      expect(control.value).toEqual(['In Progress', 'Done']);
    });

    it('should handle object trigger value in generateFromControlBasedOnFieldType', () => {
      component.formData = [
        {
          fieldName: 'jiraWorkflowGroupsKPI202',
          originalValue: {
            'In Progress': ['Implementing'],
            Done: ['Closed'],
          },
        },
      ];
      component.ngOnInit();

      const control = component.form.get('jiraWorkflowGroupsKPI202');
      expect(control.value).toEqual(['In Progress', 'Done']);
    });

    it('should add form control for each dynamic field', () => {
      component.ngOnInit();

      component.updateDynamicWorkflowFields(['Group1', 'Group2']);

      expect(component.form.contains('jiraStatusForGroup1')).toBeTruthy();
      expect(component.form.contains('jiraStatusForGroup2')).toBeTruthy();
    });
  });

  describe('Save with Dynamic Fields', () => {
    beforeEach(() => {
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraWorkflowGroupsKPI202',
          fieldLabel: 'Workfow groups',
          fieldType: 'chips',
          fieldCategory: 'workflow',
          section: 'WorkFlow Status Mapping',
        },
      ];
      component.formData = [
        {
          fieldName: 'jiraWorkflowGroupsKPI202',
          originalValue: [],
        },
      ];
      component.kpiId = 'kpi202';
      component.selectedToolConfig = [{ id: '123', toolName: 'JIRA' }];
      component.metaDataTemplateCode = '9';
    });

    it('should save dynamic workflow fields for kpi202', () => {
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      // Setup dynamic fields
      component.updateDynamicWorkflowFields(['In Progress', 'Done']);
      component.form.get('jiraStatusForInProgress').setValue(['Implementing']);
      component.form.get('jiraStatusForDone').setValue(['Closed']);

      component.save();

      expect(saveSpy).toHaveBeenCalled();
      const savedData = saveSpy.calls.argsFor(0)[0];
      const triggerField = savedData.find(
        (f) => f.fieldName === 'jiraWorkflowGroupsKPI202',
      );
      expect(triggerField).toBeDefined();
      expect(triggerField.originalValue).toEqual([
        { label: 'In Progress', statuses: ['Implementing'] },
        { label: 'Done', statuses: ['Closed'] },
      ]);
    });

    it('should save dynamic workflow fields for kpi311', () => {
      component.kpiId = 'kpi311';
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraFieldsSelectionKPI311',
          fieldLabel: 'Fields to write prompts',
          fieldType: 'chips',
          fieldCategory: 'workflow',
          section: undefined,
        },
      ];
      component.formData = [
        {
          fieldName: 'jiraFieldsSelectionKPI311',
          originalValue: [],
        },
      ];
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      // Setup dynamic fields with all required values
      component.updateDynamicWorkflowFields(['Summary', 'Description']);
      component.form.get('jiraStatusForSummary').setValue('Prompt for summary');
      component.form
        .get('jiraFieldNameForSummary')
        .setValue('customfield_10001');
      component.form.get('jiraWeightageForSummary').setValue(50);
      component.form
        .get('jiraStatusForDescription')
        .setValue('Prompt for description');
      component.form
        .get('jiraFieldNameForDescription')
        .setValue('customfield_10002');
      component.form.get('jiraWeightageForDescription').setValue(30);

      component.save();

      expect(saveSpy).toHaveBeenCalled();
      const savedData = saveSpy.calls.argsFor(0)[0];
      const triggerField = savedData.find(
        (f) => f.fieldName === 'jiraFieldsSelectionKPI311',
      );
      expect(triggerField).toBeDefined();
      expect(triggerField.originalValue).toEqual([
        {
          label: 'Summary',
          fieldName: 'customfield_10001',
          weightage: 50,
          prompt: 'Prompt for summary',
        },
        {
          label: 'Description',
          fieldName: 'customfield_10002',
          weightage: 30,
          prompt: 'Prompt for description',
        },
      ]);
    });

    it('should not save empty mapping values', () => {
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      component.updateDynamicWorkflowFields([]);
      component.save();

      // Should still be called but with empty or minimal data
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('fieldMappingLabel getter', () => {
    it('should return correct label for kpi202', () => {
      component.kpiId = 'kpi202';
      expect(component.fieldMappingLabel).toBe('Workfow groups');
    });

    it('should return correct label for kpi206', () => {
      component.kpiId = 'kpi206';
      expect(component.fieldMappingLabel).toBe('Workfow groups');
    });

    it('should return correct label for kpi311', () => {
      component.kpiId = 'kpi311';
      expect(component.fieldMappingLabel).toBe('Fields to write prompts');
    });

    it('should return empty string for unknown kpiId', () => {
      component.kpiId = 'kpi999';
      expect(component.fieldMappingLabel).toBe('');
    });
  });

  describe('getStaticFields and getDynamicFields', () => {
    beforeEach(() => {
      component.formConfig = {
        'Test Section': [
          { fieldName: 'field1', isDynamic: false },
          { fieldName: 'field2', isDynamic: true },
          { fieldName: 'field3', isDynamic: false },
        ],
      };
    });

    it('should return only static fields', () => {
      const staticFields = component.getStaticFields('Test Section');
      expect(staticFields.length).toBe(2);
      expect(staticFields[0].fieldName).toBe('field1');
      expect(staticFields[1].fieldName).toBe('field3');
    });

    it('should return only dynamic fields', () => {
      const dynamicFields = component.getDynamicFields('Test Section');
      expect(dynamicFields.length).toBe(1);
      expect(dynamicFields[0].fieldName).toBe('field2');
    });

    it('should return empty array for non-existent section', () => {
      const staticFields = component.getStaticFields('Non Existent');
      const dynamicFields = component.getDynamicFields('Non Existent');
      expect(staticFields).toEqual([]);
      expect(dynamicFields).toEqual([]);
    });
  });

  describe('generateFieldMappingConfiguration with kpi311', () => {
    it('should use fieldName as section for kpi311 trigger field with undefined section', () => {
      component.kpiId = 'kpi311';
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraFieldsSelectionKPI311',
          fieldLabel: 'Fields to write prompts',
          fieldType: 'chips',
          section: undefined,
        },
        {
          fieldName: 'otherField',
          fieldLabel: 'Other',
          section: 'Custom Fields Mapping',
        },
      ];
      component.generateFieldMappingConfiguration();

      expect(component.formConfig['jiraFieldsSelectionKPI311']).toBeDefined();
      expect(
        component.formConfig['jiraFieldsSelectionKPI311'].length,
      ).toBeGreaterThan(0);
      expect(
        component.fieldMappingSectionList.includes('jiraFieldsSelectionKPI311'),
      ).toBeTruthy();
    });

    it('should default to Field Mapping for undefined section when not kpi311 trigger', () => {
      component.kpiId = 'kpi100';
      component.fieldMappingConfig = [
        {
          fieldName: 'someField',
          fieldLabel: 'Some Field',
          section: undefined,
        },
      ];
      component.generateFieldMappingConfiguration();

      expect(component.formConfig['Field Mapping']).toBeDefined();
      expect(
        component.fieldMappingSectionList.includes('Field Mapping'),
      ).toBeTruthy();
    });
  });

  describe('Dialog focus management', () => {
    beforeEach(() => {
      // Reset scroll to 0 before each test
      document.documentElement.scrollTop = 0;
    });

    it('should record scroll position and focus dialog header', () => {
      // Set scroll position just before the test
      document.documentElement.scrollTop = 200;
      const currentScroll = document.documentElement.scrollTop;

      const mockHeader = document.createElement('div');
      mockHeader.id = 'addValuesDialogTitle';
      mockHeader.focus = jasmine.createSpy('focus');
      spyOn(document, 'getElementById').and.returnValue(mockHeader);

      component.addValueDialog = {
        contentViewChild: {},
      } as any;

      component.recordScrollPosition();

      // Verify that scroll position was captured (use actual current scroll value)
      expect(component.bodyScrollPosition).toBe(currentScroll);
      expect(mockHeader.focus).toHaveBeenCalled();
    });

    it('should record scroll position even if dialog header is not found', () => {
      // Set a specific scroll position
      document.documentElement.scrollTop = 300;
      const currentScroll = document.documentElement.scrollTop;

      spyOn(document, 'getElementById').and.returnValue(null);
      component.addValueDialog = {
        contentViewChild: {},
      } as any;

      component.recordScrollPosition();

      // Verify that bodyScrollPosition was updated to current scroll position
      expect(component.bodyScrollPosition).toBe(currentScroll);
      // Should not throw error even if element is null
    });
  });

  describe('ngOnChanges', () => {
    it('should reinitialize form when formData changes after initial load', () => {
      component.fieldMappingConfig =
        fakeKpiFieldMappingConfigList.data.fieldConfiguration;
      component.formData = fakeSelectedFieldMapping;
      component.ngOnInit();

      const initSpy = spyOn(component, 'initializeForm').and.callThrough();
      const generateSpy = spyOn(
        component,
        'generateFieldMappingConfiguration',
      ).and.callThrough();

      const newFormData = [
        ...fakeSelectedFieldMapping,
        { fieldName: 'newField', originalValue: 'newValue' },
      ];
      const changes = {
        formData: {
          currentValue: newFormData,
          previousValue: fakeSelectedFieldMapping,
          firstChange: false,
          isFirstChange: () => false,
        },
      };

      component.ngOnChanges(changes);

      expect(initSpy).toHaveBeenCalled();
      expect(generateSpy).toHaveBeenCalled();
      expect(component.form.pristine).toBeTruthy();
      expect(component.form.untouched).toBeTruthy();
    });

    it('should not reinitialize on first change', () => {
      const initSpy = spyOn(component, 'initializeForm');

      const changes = {
        formData: {
          currentValue: fakeSelectedFieldMapping,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      };

      component.ngOnChanges(changes);

      expect(initSpy).not.toHaveBeenCalled();
    });

    it('should not reinitialize if form is not defined', () => {
      component.form = null;
      const initSpy = spyOn(component, 'initializeForm');

      const changes = {
        formData: {
          currentValue: fakeSelectedFieldMapping,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      };

      component.ngOnChanges(changes);

      expect(initSpy).not.toHaveBeenCalled();
    });

    it('should not reinitialize if formData did not change', () => {
      component.fieldMappingConfig =
        fakeKpiFieldMappingConfigList.data.fieldConfiguration;
      component.formData = fakeSelectedFieldMapping;
      component.ngOnInit();

      const initSpy = spyOn(component, 'initializeForm');

      const changes = {
        someOtherInput: {
          currentValue: 'new',
          previousValue: 'old',
          firstChange: false,
          isFirstChange: () => false,
        },
      };

      component.ngOnChanges(changes);

      expect(initSpy).not.toHaveBeenCalled();
    });
  });

  describe('kpi311 Dynamic Workflow Fields', () => {
    beforeEach(() => {
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraFieldsSelectionKPI311',
          fieldLabel: 'Fields to write prompts',
          fieldType: 'chips',
          fieldCategory: 'workflow',
          section: undefined,
        },
      ];
      component.formData = [];
      component.kpiId = 'kpi311';
    });

    it('should create dynamic fields with text inputs for kpi311', () => {
      component.ngOnInit();

      const selectedGroups = ['Summary', 'Description'];
      component.updateDynamicWorkflowFields(selectedGroups);

      const targetSection = 'jiraFieldsSelectionKPI311';
      expect(component.formConfig[targetSection]).toBeDefined();
      const dynamicFields = component.formConfig[targetSection].filter(
        (f) => f.isDynamic,
      );
      expect(dynamicFields.length).toBe(2);
      expect(dynamicFields[0].fieldLabel).toBe('Summary');
      expect(dynamicFields[0].fieldType).toBe('text');
      expect(dynamicFields[1].fieldLabel).toBe('Description');
      expect(dynamicFields[1].fieldType).toBe('text');
    });

    it('should create fieldNameControlName for kpi311 dynamic fields', () => {
      component.ngOnInit();

      const selectedGroups = ['Summary'];
      component.updateDynamicWorkflowFields(selectedGroups);

      const targetSection = 'jiraFieldsSelectionKPI311';
      const dynamicFields = component.formConfig[targetSection].filter(
        (f) => f.isDynamic,
      );
      expect(dynamicFields[0].fieldNameControlName).toBe(
        'jiraFieldNameForSummary',
      );
    });

    it('should create weightageControlName for kpi311 dynamic fields', () => {
      component.ngOnInit();

      const selectedGroups = ['Summary'];
      component.updateDynamicWorkflowFields(selectedGroups);

      const targetSection = 'jiraFieldsSelectionKPI311';
      const dynamicFields = component.formConfig[targetSection].filter(
        (f) => f.isDynamic,
      );
      expect(dynamicFields[0].weightageControlName).toBe(
        'jiraWeightageForSummary',
      );
    });

    it('should add weightage form controls with min validator', () => {
      component.ngOnInit();

      const selectedGroups = ['Summary'];
      component.updateDynamicWorkflowFields(selectedGroups);

      const weightageControl = component.form.get('jiraWeightageForSummary');
      expect(weightageControl).toBeDefined();

      // Test min validator
      weightageControl.setValue(5);
      expect(weightageControl.valid).toBeFalse();

      weightageControl.setValue(10);
      expect(weightageControl.valid).toBeTrue();
    });

    it('should restore previous values for kpi311 dynamic fields', () => {
      component.formData = [
        {
          fieldName: 'jiraFieldsSelectionKPI311',
          originalValue: [
            {
              label: 'Summary',
              fieldName: 'customfield_10001',
              weightage: 50,
              prompt: 'Write summary',
            },
          ],
        },
      ];
      component.ngOnInit();

      const selectedGroups = ['Summary'];
      component.updateDynamicWorkflowFields(selectedGroups);

      expect(component.form.get('jiraStatusForSummary').value).toBe(
        'Write summary',
      );
      expect(component.form.get('jiraFieldNameForSummary').value).toBe(
        'customfield_10001',
      );
      expect(component.form.get('jiraWeightageForSummary').value).toBe(50);
    });

    it('should use fieldName as section for kpi311 trigger field', () => {
      component.generateFieldMappingConfiguration();

      expect(component.formConfig['jiraFieldsSelectionKPI311']).toBeDefined();
      expect(
        component.fieldMappingSectionList.includes('jiraFieldsSelectionKPI311'),
      ).toBeTruthy();
    });
  });

  describe('Save with kpi311 Dynamic Fields', () => {
    beforeEach(() => {
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraFieldsSelectionKPI311',
          fieldLabel: 'Fields to write prompts',
          fieldType: 'chips',
          fieldCategory: 'workflow',
          section: undefined,
        },
      ];
      component.formData = [
        {
          fieldName: 'jiraFieldsSelectionKPI311',
          originalValue: [],
        },
      ];
      component.kpiId = 'kpi311';
      component.selectedToolConfig = [{ id: '123', toolName: 'JIRA' }];
      component.metaDataTemplateCode = '9';
    });

    it('should save kpi311 dynamic fields with correct payload structure', () => {
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      // Setup dynamic fields
      component.updateDynamicWorkflowFields(['Summary', 'Description']);
      component.form.get('jiraStatusForSummary').setValue('Write a summary');
      component.form
        .get('jiraFieldNameForSummary')
        .setValue('customfield_10001');
      component.form.get('jiraWeightageForSummary').setValue(50);
      component.form
        .get('jiraStatusForDescription')
        .setValue('Write description');
      component.form
        .get('jiraFieldNameForDescription')
        .setValue('customfield_10002');
      component.form.get('jiraWeightageForDescription').setValue(30);

      component.save();

      expect(saveSpy).toHaveBeenCalled();
      const savedData = saveSpy.calls.argsFor(0)[0];
      const triggerField = savedData.find(
        (f) => f.fieldName === 'jiraFieldsSelectionKPI311',
      );

      expect(triggerField).toBeDefined();
      expect(triggerField.originalValue).toEqual([
        {
          label: 'Summary',
          fieldName: 'customfield_10001',
          weightage: 50,
          prompt: 'Write a summary',
        },
        {
          label: 'Description',
          fieldName: 'customfield_10002',
          weightage: 30,
          prompt: 'Write description',
        },
      ]);
    });

    it('should handle null weightage for kpi311', () => {
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      component.updateDynamicWorkflowFields(['Summary']);
      component.form.get('jiraStatusForSummary').setValue('Write summary');
      component.form
        .get('jiraFieldNameForSummary')
        .setValue('customfield_10001');
      component.form.get('jiraWeightageForSummary').setValue(null);

      component.save();

      const savedData = saveSpy.calls.argsFor(0)[0];
      const triggerField = savedData.find(
        (f) => f.fieldName === 'jiraFieldsSelectionKPI311',
      );

      expect(triggerField.originalValue[0].weightage).toBeNull();
    });

    it('should not include individual dynamic field entries in finalList', () => {
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      component.updateDynamicWorkflowFields(['Summary']);
      component.form.get('jiraStatusForSummary').setValue('Write summary');

      component.save();

      const savedData = saveSpy.calls.argsFor(0)[0];
      const dynamicFieldEntry = savedData.find(
        (f) => f.fieldName === 'jiraStatusForSummary',
      );

      expect(dynamicFieldEntry).toBeUndefined();
    });
  });

  describe('fieldMappingLabel getter', () => {
    it('should return correct label for kpi202', () => {
      component.kpiId = 'kpi202';
      expect(component.fieldMappingLabel).toBe('Workfow groups');
    });

    it('should return correct label for kpi206', () => {
      component.kpiId = 'kpi206';
      expect(component.fieldMappingLabel).toBe('Workfow groups');
    });

    it('should return correct label for kpi311', () => {
      component.kpiId = 'kpi311';
      expect(component.fieldMappingLabel).toBe('Fields to write prompts');
    });

    it('should return empty string for unknown kpiId', () => {
      component.kpiId = 'kpi999';
      expect(component.fieldMappingLabel).toBe('');
    });
  });

  describe('getStaticFields and getDynamicFields', () => {
    beforeEach(() => {
      component.formConfig = {
        'Test Section': [
          { fieldName: 'field1', isDynamic: false },
          { fieldName: 'field2', isDynamic: true },
          { fieldName: 'field3', isDynamic: false },
        ],
      };
    });

    it('should return only static fields', () => {
      const staticFields = component.getStaticFields('Test Section');
      expect(staticFields.length).toBe(2);
      expect(staticFields[0].fieldName).toBe('field1');
      expect(staticFields[1].fieldName).toBe('field3');
    });

    it('should return only dynamic fields', () => {
      const dynamicFields = component.getDynamicFields('Test Section');
      expect(dynamicFields.length).toBe(1);
      expect(dynamicFields[0].fieldName).toBe('field2');
    });

    it('should return empty array for non-existent section', () => {
      const staticFields = component.getStaticFields('Non Existent');
      const dynamicFields = component.getDynamicFields('Non Existent');
      expect(staticFields).toEqual([]);
      expect(dynamicFields).toEqual([]);
    });
  });

  describe('recordScrollPosition with focus management', () => {
    beforeEach(() => {
      document.documentElement.scrollTop = 0;
    });

    it('should record scroll position and focus dialog header', () => {
      document.documentElement.scrollTop = 200;
      const currentScroll = document.documentElement.scrollTop;

      const mockHeader = document.createElement('div');
      mockHeader.id = 'addValuesDialogTitle';
      mockHeader.focus = jasmine.createSpy('focus');
      spyOn(document, 'getElementById').and.returnValue(mockHeader);

      component.addValueDialog = {
        contentViewChild: {},
      } as any;

      component.recordScrollPosition();

      expect(component.bodyScrollPosition).toBe(currentScroll);
      expect(mockHeader.focus).toHaveBeenCalled();
    });

    it('should record scroll position even if dialog header is not found', () => {
      document.documentElement.scrollTop = 300;
      const currentScroll = document.documentElement.scrollTop;

      spyOn(document, 'getElementById').and.returnValue(null);
      component.addValueDialog = {
        contentViewChild: {},
      } as any;

      component.recordScrollPosition();

      expect(component.bodyScrollPosition).toBe(currentScroll);
      // Should not throw error even if element is null
    });

    it('should not throw error when contentViewChild is undefined', () => {
      document.documentElement.scrollTop = 150;
      const currentScroll = document.documentElement.scrollTop;

      component.addValueDialog = {} as any;

      expect(() => component.recordScrollPosition()).not.toThrow();
      expect(component.bodyScrollPosition).toBe(currentScroll);
    });
  });

  describe('kpi312 Epic Readiness Dimensions Field Mapping', () => {
    beforeEach(() => {
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraFieldsSelectionKPI312',
          fieldLabel: 'Epic readiness dimensions',
          fieldType: 'chips',
          fieldCategory: 'fields',
          section: 'Custom Fields Mapping',
        },
      ];
      component.formData = [];
      component.kpiId = 'kpi312';
    });

    it('should return correct label for kpi312', () => {
      expect(component.fieldMappingLabel).toBe('Epic readiness dimensions');
    });

    it('should create dynamic fields with text inputs for kpi312', () => {
      component.ngOnInit();

      const selectedGroups = ['Story Point', 'Priority'];
      component.updateDynamicWorkflowFields(selectedGroups);

      const targetSection = 'Custom Fields Mapping';
      expect(component.formConfig[targetSection]).toBeDefined();
      const dynamicFields = component.formConfig[targetSection].filter(
        (f: any) => f.isDynamic,
      );
      expect(dynamicFields.length).toBe(2);
      expect(dynamicFields[0].fieldLabel).toBe('Story Point');
      expect(dynamicFields[0].fieldType).toBe('text');
      expect(dynamicFields[1].fieldLabel).toBe('Priority');
      expect(dynamicFields[1].fieldType).toBe('text');
    });

    it('should create fieldNameControlName for kpi312 dynamic fields', () => {
      component.ngOnInit();

      const selectedGroups = ['Story Point'];
      component.updateDynamicWorkflowFields(selectedGroups);

      const targetSection = 'Custom Fields Mapping';
      const dynamicFields = component.formConfig[targetSection].filter(
        (f: any) => f.isDynamic,
      );
      expect(dynamicFields[0].fieldNameControlName).toBe(
        'jiraFieldNameForStoryPoint',
      );
    });

    it('should create weightageControlName for kpi312 dynamic fields', () => {
      component.ngOnInit();

      const selectedGroups = ['Priority'];
      component.updateDynamicWorkflowFields(selectedGroups);

      const targetSection = 'Custom Fields Mapping';
      const dynamicFields = component.formConfig[targetSection].filter(
        (f: any) => f.isDynamic,
      );
      expect(dynamicFields[0].weightageControlName).toBe(
        'jiraWeightageForPriority',
      );
    });

    it('should add weightage form controls with min validator for kpi312', () => {
      component.ngOnInit();

      const selectedGroups = ['Story Point'];
      component.updateDynamicWorkflowFields(selectedGroups);

      const weightageControl = component.form.get('jiraWeightageForStoryPoint');
      expect(weightageControl).toBeDefined();

      // Test min validator
      weightageControl.setValue(5);
      expect(weightageControl.valid).toBeFalse();

      weightageControl.setValue(10);
      expect(weightageControl.valid).toBeTrue();
    });

    it('should restore previous values for kpi312 dynamic fields', () => {
      component.formData = [
        {
          fieldName: 'jiraFieldsSelectionKPI312',
          originalValue: [
            {
              label: 'Story Point',
              fieldName: 'customfield_20803',
              weightage: 40,
              prompt: 'Enter story point description',
            },
            {
              label: 'Priority',
              fieldName: 'customfield_30901',
              weightage: 60,
              prompt: 'Enter priority level',
            },
          ],
        },
      ];
      component.ngOnInit();

      const selectedGroups = ['Story Point', 'Priority'];
      component.updateDynamicWorkflowFields(selectedGroups);

      // Check Story Point values
      expect(component.form.get('jiraStatusForStoryPoint').value).toBe(
        'Enter story point description',
      );
      expect(component.form.get('jiraFieldNameForStoryPoint').value).toBe(
        'customfield_20803',
      );
      expect(component.form.get('jiraWeightageForStoryPoint').value).toBe(40);

      // Check Priority values
      expect(component.form.get('jiraStatusForPriority').value).toBe(
        'Enter priority level',
      );
      expect(component.form.get('jiraFieldNameForPriority').value).toBe(
        'customfield_30901',
      );
      expect(component.form.get('jiraWeightageForPriority').value).toBe(60);
    });

    it('should use Custom Fields Mapping section for kpi312 when section is provided', () => {
      component.generateFieldMappingConfiguration();

      expect(component.formConfig['Custom Fields Mapping']).toBeDefined();
      expect(
        component.fieldMappingSectionList.includes('Custom Fields Mapping'),
      ).toBeTruthy();
    });

    it('should use jiraFieldsSelectionKPI312 as section when undefined', () => {
      component.fieldMappingConfig[0].section = undefined;
      component.generateFieldMappingConfiguration();

      expect(component.formConfig['jiraFieldsSelectionKPI312']).toBeDefined();
      expect(
        component.fieldMappingSectionList.includes('jiraFieldsSelectionKPI312'),
      ).toBeTruthy();
    });
  });

  describe('Save with kpi312 Dynamic Fields', () => {
    beforeEach(() => {
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraFieldsSelectionKPI312',
          fieldLabel: 'Epic readiness dimensions',
          fieldType: 'chips',
          fieldCategory: 'fields',
          section: 'Custom Fields Mapping',
        },
      ];
      component.formData = [
        {
          fieldName: 'jiraFieldsSelectionKPI312',
          originalValue: [],
        },
      ];
      component.kpiId = 'kpi312';
      component.selectedToolConfig = [{ id: '123', toolName: 'JIRA' }];
      component.metaDataTemplateCode = '9';
    });

    it('should save kpi312 dynamic fields with correct payload structure', () => {
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      // Setup dynamic fields
      component.updateDynamicWorkflowFields([
        'Business clarity',
        'Scope definition',
      ]);
      component.form
        .get('jiraStatusForBusinessclarity')
        .setValue('Describe business clarity');
      component.form
        .get('jiraFieldNameForBusinessclarity')
        .setValue('customfield_10001');
      component.form.get('jiraWeightageForBusinessclarity').setValue(30);
      component.form
        .get('jiraStatusForScopedefinition')
        .setValue('Define scope clearly');
      component.form
        .get('jiraFieldNameForScopedefinition')
        .setValue('customfield_10002');
      component.form.get('jiraWeightageForScopedefinition').setValue(25);

      component.save();

      expect(saveSpy).toHaveBeenCalled();
      const savedData = saveSpy.calls.argsFor(0)[0];
      const triggerField = savedData.find(
        (f: any) => f.fieldName === 'jiraFieldsSelectionKPI312',
      );

      expect(triggerField).toBeDefined();
      expect(triggerField.originalValue).toEqual([
        {
          label: 'Business clarity',
          fieldName: 'customfield_10001',
          weightage: 30,
          prompt: 'Describe business clarity',
        },
        {
          label: 'Scope definition',
          fieldName: 'customfield_10002',
          weightage: 25,
          prompt: 'Define scope clearly',
        },
      ]);
    });

    it('should handle null weightage for kpi312', () => {
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      component.updateDynamicWorkflowFields(['Risk readiness']);
      component.form.get('jiraStatusForRiskreadiness').setValue('Assess risks');
      component.form
        .get('jiraFieldNameForRiskreadiness')
        .setValue('customfield_50001');
      component.form.get('jiraWeightageForRiskreadiness').setValue(null);

      component.save();

      const savedData = saveSpy.calls.argsFor(0)[0];
      const triggerField = savedData.find(
        (f: any) => f.fieldName === 'jiraFieldsSelectionKPI312',
      );

      expect(triggerField.originalValue[0].weightage).toBeNull();
    });

    it('should not include individual dynamic field entries in finalList for kpi312', () => {
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      component.updateDynamicWorkflowFields(['Dependency readiness']);
      component.form
        .get('jiraStatusForDependencyreadiness')
        .setValue('Check dependencies');

      component.save();

      const savedData = saveSpy.calls.argsFor(0)[0];
      const dynamicFieldEntry = savedData.find(
        (f: any) => f.fieldName === 'jiraStatusForDependencyreadiness',
      );

      expect(dynamicFieldEntry).toBeUndefined();
    });

    it('should handle empty prompt with optional fieldName and weightage for kpi312', () => {
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      component.updateDynamicWorkflowFields(['Solution readiness']);
      component.form.get('jiraStatusForSolutionreadiness').setValue('');
      component.form.get('jiraFieldNameForSolutionreadiness').setValue('');
      component.form.get('jiraWeightageForSolutionreadiness').setValue('');

      component.save();

      const savedData = saveSpy.calls.argsFor(0)[0];
      const triggerField = savedData.find(
        (f: any) => f.fieldName === 'jiraFieldsSelectionKPI312',
      );

      expect(triggerField.originalValue[0].prompt).toBe('');
      expect(triggerField.originalValue[0].fieldName).toBeFalsy();
    });

    it('should handle multiple epic readiness dimensions for kpi312', () => {
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      const dimensions = [
        'Business clarity',
        'Scope definition',
        'Solution readiness',
        'Dependency readiness',
        'Risk readiness',
      ];
      component.updateDynamicWorkflowFields(dimensions);

      dimensions.forEach((dim, index) => {
        const cleanDim = dim.replace(/\s+/g, '');
        component.form
          .get(`jiraStatusFor${cleanDim}`)
          .setValue(`Prompt for ${dim}`);
        component.form
          .get(`jiraFieldNameFor${cleanDim}`)
          .setValue(`customfield_${1000 + index}`);
        component.form
          .get(`jiraWeightageFor${cleanDim}`)
          .setValue((index + 1) * 10);
      });

      component.save();

      const savedData = saveSpy.calls.argsFor(0)[0];
      const triggerField = savedData.find(
        (f: any) => f.fieldName === 'jiraFieldsSelectionKPI312',
      );

      expect(triggerField.originalValue.length).toBe(5);
      expect(triggerField.originalValue[0].label).toBe('Business clarity');
      expect(triggerField.originalValue[4].label).toBe('Risk readiness');
    });
  });

  describe('kpi312 vs kpi311 comparison', () => {
    it('should behave identically to kpi311 for dynamic field creation', () => {
      // Test kpi311
      component.kpiId = 'kpi311';
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraFieldsSelectionKPI311',
          fieldLabel: 'Fields to write prompts',
          fieldType: 'chips',
          section: undefined,
        },
      ];
      component.formData = [];
      component.ngOnInit();
      component.updateDynamicWorkflowFields(['Field1']);
      const kpi311DynamicFields = component.getDynamicFields(
        'jiraFieldsSelectionKPI311',
      );

      // Test kpi312
      component.kpiId = 'kpi312';
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraFieldsSelectionKPI312',
          fieldLabel: 'Epic readiness dimensions',
          fieldType: 'chips',
          section: undefined,
        },
      ];
      component.formData = [];
      component.ngOnInit();
      component.updateDynamicWorkflowFields(['Field1']);
      const kpi312DynamicFields = component.getDynamicFields(
        'jiraFieldsSelectionKPI312',
      );

      // Compare structure
      expect(kpi311DynamicFields.length).toBe(kpi312DynamicFields.length);
      expect(kpi311DynamicFields[0].fieldType).toBe(
        kpi312DynamicFields[0].fieldType,
      );
      expect(kpi311DynamicFields[0].isDynamic).toBe(
        kpi312DynamicFields[0].isDynamic,
      );
    });
  });

  describe('kpi312 edge cases', () => {
    beforeEach(() => {
      component.fieldMappingConfig = [
        {
          fieldName: 'jiraFieldsSelectionKPI312',
          fieldLabel: 'Epic readiness dimensions',
          fieldType: 'chips',
          section: undefined,
        },
      ];
      component.formData = [];
      component.kpiId = 'kpi312';
    });

    it('should handle dimension names with special characters', () => {
      component.ngOnInit();
      const specialDimensions = ['Risk/Issue Readiness', 'Scope & Definition'];
      component.updateDynamicWorkflowFields(specialDimensions);

      const targetSection = 'jiraFieldsSelectionKPI312';
      const dynamicFields = component.getDynamicFields(targetSection);
      expect(dynamicFields.length).toBe(2);
    });

    it('should remove dynamic fields when all dimensions are deselected', () => {
      component.ngOnInit();
      component.updateDynamicWorkflowFields(['Dimension1', 'Dimension2']);
      let dynamicFields = component.getDynamicFields(
        'jiraFieldsSelectionKPI312',
      );
      expect(dynamicFields.length).toBe(2);

      component.updateDynamicWorkflowFields([]);
      dynamicFields = component.getDynamicFields('jiraFieldsSelectionKPI312');
      expect(dynamicFields.length).toBe(0);
    });

    it('should maintain form control values when dimensions are reselected', () => {
      component.formData = [
        {
          fieldName: 'jiraFieldsSelectionKPI312',
          originalValue: [
            {
              label: 'Business clarity',
              fieldName: 'customfield_10001',
              weightage: 50,
              prompt: 'Initial prompt',
            },
          ],
        },
      ];
      component.ngOnInit();

      // Select the dimension again
      component.updateDynamicWorkflowFields(['Business clarity']);

      expect(component.form.get('jiraStatusForBusinessclarity').value).toBe(
        'Initial prompt',
      );
      expect(component.form.get('jiraFieldNameForBusinessclarity').value).toBe(
        'customfield_10001',
      );
      expect(component.form.get('jiraWeightageForBusinessclarity').value).toBe(
        50,
      );
    });
  });
});
