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
import { ExportExcelComponent } from './export-excel.component';
import { ExcelService } from 'src/app/services/excel.service';
import { HelperService } from 'src/app/services/helper.service';
import { SharedService } from 'src/app/services/shared.service';
import { HttpService } from 'src/app/services/http.service';
import { MessageService } from 'primeng/api';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

describe('ExportExcelComponent - Frozen Column Changes', () => {
  let component: ExportExcelComponent;
  let fixture: ComponentFixture<ExportExcelComponent>;
  let excelServiceMock: jasmine.SpyObj<ExcelService>;
  let helperServiceMock: jasmine.SpyObj<HelperService>;
  let sharedServiceMock: jasmine.SpyObj<SharedService>;
  let httpServiceMock: jasmine.SpyObj<HttpService>;
  let messageServiceMock: jasmine.SpyObj<MessageService>;

  const mockColumnConfig = [
    { columnName: 'Issue Id', order: 0, isDefault: true, isShown: true },
    { columnName: 'Week', order: 1, isDefault: true, isShown: true },
    { columnName: 'Status', order: 2, isDefault: false, isShown: true },
    { columnName: 'Priority', order: 3, isDefault: false, isShown: true },
  ];

  const mockExcelData = [
    {
      'Issue Id': 'JIRA-123',
      Week: 'Week 1',
      Status: 'Done',
      Priority: 'High',
    },
    {
      'Issue Id': 'JIRA-124',
      Week: 'Week 2',
      Status: 'In Progress',
      Priority: 'Medium',
    },
  ];

  beforeEach(async () => {
    excelServiceMock = jasmine.createSpyObj('ExcelService', [
      'generateExcelModalData',
      'generateExcel',
    ]);
    helperServiceMock = jasmine.createSpyObj('HelperService', [
      'downloadExcel',
      'getFormatedDateBasedOnType',
    ]);
    sharedServiceMock = jasmine.createSpyObj('SharedService', [], {
      kpiExcelSubject: of({}),
      selectedTab: 'iteration',
      selectedTrends: [{ basicProjectConfigId: 'test-project' }],
    });
    httpServiceMock = jasmine.createSpyObj('HttpService', [
      'postkpiColumnsConfig',
    ]);
    messageServiceMock = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      declarations: [ExportExcelComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [
        { provide: ExcelService, useValue: excelServiceMock },
        { provide: HelperService, useValue: helperServiceMock },
        { provide: SharedService, useValue: sharedServiceMock },
        { provide: HttpService, useValue: httpServiceMock },
        { provide: MessageService, useValue: messageServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportExcelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Frozen Column Logic', () => {
    it('should initialize with "issue id" as default frozen column', () => {
      expect(component.forzenColumns).toEqual(['issue id']);
    });

    it('should set frozen column to "week" for kpi205 in dataTransformForIterationTableWidget', () => {
      const markerInfo = [];
      const excludeColumns = [];
      const kpiName = 'Test KPI 205';
      const kpiId = 'kpi205';

      spyOn<any>(component, 'makeWeekColumnOnFirstOrder').and.returnValue(
        mockColumnConfig,
      );
      spyOn<any>(component, 'dataTransformatin');

      component.dataTransformForIterationTableWidget(
        markerInfo,
        excludeColumns,
        [...mockColumnConfig],
        mockExcelData,
        kpiName,
        kpiId,
      );

      expect(component.forzenColumns).toEqual(['week']);
      expect(component['makeWeekColumnOnFirstOrder']).toHaveBeenCalled();
    });

    it('should set frozen column to "issue id" for non-kpi205 in dataTransformForIterationTableWidget', () => {
      const markerInfo = [];
      const excludeColumns = [];
      const kpiName = 'Test KPI 202';
      const kpiId = 'kpi202';

      spyOn<any>(component, 'makeIssueIDOnFirstOrder').and.returnValue(
        mockColumnConfig,
      );
      spyOn<any>(component, 'dataTransformatin');

      component.dataTransformForIterationTableWidget(
        markerInfo,
        excludeColumns,
        [...mockColumnConfig],
        mockExcelData,
        kpiName,
        kpiId,
      );

      expect(component.forzenColumns).toEqual(['issue id']);
      expect(component['makeIssueIDOnFirstOrder']).toHaveBeenCalled();
    });

    it('should set frozen column to "week" for kpi205 in dataTransformatin', () => {
      const kpiName = 'Test KPI 205';
      component.modalDetails['kpiId'] = 'kpi205';

      spyOn<any>(component, 'makeWeekColumnOnFirstOrder').and.returnValue(
        mockColumnConfig,
      );
      excelServiceMock.generateExcelModalData.and.returnValue({
        headerNames: [],
        excelData: mockExcelData,
      });
      spyOn<any>(component, 'generateAddRemoveData');
      spyOn<any>(component, 'formatDate');
      spyOn<any>(component, 'generateColumnFilterData');

      component.dataTransformatin(
        [...mockColumnConfig],
        mockExcelData,
        '',
        kpiName,
      );

      expect(component.forzenColumns).toEqual(['week']);
      expect(component['makeWeekColumnOnFirstOrder']).toHaveBeenCalled();
    });

    it('should set frozen column to "issue id" for non-kpi205 in dataTransformatin', () => {
      const kpiName = 'Test KPI 202';
      component.modalDetails['kpiId'] = 'kpi202';

      spyOn<any>(component, 'makeIssueIDOnFirstOrder').and.returnValue(
        mockColumnConfig,
      );
      excelServiceMock.generateExcelModalData.and.returnValue({
        headerNames: [],
        excelData: mockExcelData,
      });
      spyOn<any>(component, 'generateAddRemoveData');
      spyOn<any>(component, 'formatDate');
      spyOn<any>(component, 'generateColumnFilterData');

      component.dataTransformatin(
        [...mockColumnConfig],
        mockExcelData,
        '',
        kpiName,
      );

      expect(component.forzenColumns).toEqual(['issue id']);
      expect(component['makeIssueIDOnFirstOrder']).toHaveBeenCalled();
    });

    it('should reset frozen column to "issue id" when modal is closed', () => {
      component.forzenColumns = ['week'];
      component.displayModal = true;

      component.clearModalDataOnClose();

      expect(component.forzenColumns).toEqual(['issue id']);
      expect(component.displayModal).toBeFalsy();
    });
  });

  describe('makeWeekColumnOnFirstOrder', () => {
    it('should move Week column to first position', () => {
      const columns = [
        { columnName: 'Issue Id', order: 0, isDefault: true, isShown: true },
        { columnName: 'Status', order: 1, isDefault: false, isShown: true },
        { columnName: 'Week', order: 2, isDefault: true, isShown: true },
        { columnName: 'Priority', order: 3, isDefault: false, isShown: true },
      ];

      const result = component.makeWeekColumnOnFirstOrder(columns);

      expect(result[0].columnName).toBe('Week');
      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
      expect(result[2].order).toBe(2);
      expect(result[3].order).toBe(3);
    });

    it('should handle case-insensitive Week column search', () => {
      const columns = [
        { columnName: 'Issue Id', order: 0, isDefault: true, isShown: true },
        { columnName: 'WEEK', order: 1, isDefault: true, isShown: true },
        { columnName: 'Status', order: 2, isDefault: false, isShown: true },
      ];

      const result = component.makeWeekColumnOnFirstOrder(columns);

      expect(result[0].columnName).toBe('WEEK');
      expect(result[0].order).toBe(0);
    });

    it('should return original columns if Week column is not found', () => {
      const columns = [
        { columnName: 'Issue Id', order: 0, isDefault: true, isShown: true },
        { columnName: 'Status', order: 1, isDefault: false, isShown: true },
        { columnName: 'Priority', order: 2, isDefault: false, isShown: true },
      ];

      const result = component.makeWeekColumnOnFirstOrder(columns);

      expect(result).toEqual(columns);
    });

    it('should maintain the relative order of other columns after moving Week', () => {
      const columns = [
        { columnName: 'Issue Id', order: 0, isDefault: true, isShown: true },
        { columnName: 'Status', order: 1, isDefault: false, isShown: true },
        { columnName: 'Week', order: 2, isDefault: true, isShown: true },
        { columnName: 'Priority', order: 3, isDefault: false, isShown: true },
        { columnName: 'Assignee', order: 4, isDefault: false, isShown: true },
      ];

      const result = component.makeWeekColumnOnFirstOrder(columns);

      expect(result[0].columnName).toBe('Week');
      expect(result[1].columnName).toBe('Issue Id');
      expect(result[2].columnName).toBe('Status');
      expect(result[3].columnName).toBe('Priority');
      expect(result[4].columnName).toBe('Assignee');
    });
  });

  describe('makeIssueIDOnFirstOrder', () => {
    it('should move Issue Id column to first position', () => {
      const columns = [
        { columnName: 'Status', order: 0, isDefault: false, isShown: true },
        { columnName: 'Issue Id', order: 1, isDefault: true, isShown: true },
        { columnName: 'Priority', order: 2, isDefault: false, isShown: true },
      ];

      const result = component.makeIssueIDOnFirstOrder(columns);

      expect(result[0].columnName).toBe('Issue Id');
      expect(result[0].order).toBe(0);
    });

    it('should handle case-insensitive Issue Id column search', () => {
      const columns = [
        { columnName: 'Status', order: 0, isDefault: false, isShown: true },
        { columnName: 'issue id', order: 1, isDefault: true, isShown: true },
        { columnName: 'Priority', order: 2, isDefault: false, isShown: true },
      ];

      const result = component.makeIssueIDOnFirstOrder(columns);

      expect(result[0].columnName).toBe('issue id');
      expect(result[0].order).toBe(0);
    });

    it('should return original columns if Issue Id column is not found', () => {
      const columns = [
        { columnName: 'Status', order: 0, isDefault: false, isShown: true },
        { columnName: 'Priority', order: 1, isDefault: false, isShown: true },
        { columnName: 'Week', order: 2, isDefault: true, isShown: true },
      ];

      const result = component.makeIssueIDOnFirstOrder(columns);

      expect(result).toEqual(columns);
    });
  });

  describe('Integration Tests', () => {
    it('should properly handle kpi205 end-to-end with Week as frozen column', () => {
      const kpiId = 'kpi205';
      const kpiName = 'Quality Status';
      const markerInfo = [];
      const excludeColumns = [];

      const columnConfig = [
        { columnName: 'Issue Id', order: 0, isDefault: true, isShown: true },
        { columnName: 'Week', order: 1, isDefault: true, isShown: true },
        { columnName: 'Status', order: 2, isDefault: false, isShown: true },
      ];

      component.modalDetails['kpiId'] = kpiId;

      excelServiceMock.generateExcelModalData.and.returnValue({
        headerNames: [],
        excelData: mockExcelData,
      });

      component.dataTransformForIterationTableWidget(
        markerInfo,
        excludeColumns,
        columnConfig,
        mockExcelData,
        kpiName,
        kpiId,
      );

      expect(component.forzenColumns).toEqual(['week']);
      expect(component.tableColumns[0].columnName).toBe('Week');
    });

    it('should properly handle non-kpi205 end-to-end with Issue Id as frozen column', () => {
      const kpiId = 'kpi202';
      const kpiName = 'Unit Test Coverage';
      const markerInfo = [];
      const excludeColumns = [];

      const columnConfig = [
        { columnName: 'Week', order: 0, isDefault: true, isShown: true },
        { columnName: 'Issue Id', order: 1, isDefault: true, isShown: true },
        { columnName: 'Status', order: 2, isDefault: false, isShown: true },
      ];

      component.modalDetails['kpiId'] = kpiId;

      excelServiceMock.generateExcelModalData.and.returnValue({
        headerNames: [],
        excelData: mockExcelData,
      });

      component.dataTransformForIterationTableWidget(
        markerInfo,
        excludeColumns,
        columnConfig,
        mockExcelData,
        kpiName,
        kpiId,
      );

      expect(component.forzenColumns).toEqual(['issue id']);
      expect(component.tableColumns[0].columnName).toBe('Issue Id');
    });

    it('should switch frozen column when kpiId changes from kpi205 to another', () => {
      // First call with kpi205
      component.modalDetails['kpiId'] = 'kpi205';
      const columnConfig1 = [
        { columnName: 'Issue Id', order: 0, isDefault: true, isShown: true },
        { columnName: 'Week', order: 1, isDefault: true, isShown: true },
      ];

      excelServiceMock.generateExcelModalData.and.returnValue({
        headerNames: [],
        excelData: mockExcelData,
      });

      component.dataTransformatin(columnConfig1, mockExcelData, '', 'KPI 205');
      expect(component.forzenColumns).toEqual(['week']);

      // Second call with different kpi
      component.modalDetails['kpiId'] = 'kpi202';
      const columnConfig2 = [
        { columnName: 'Issue Id', order: 0, isDefault: true, isShown: true },
        { columnName: 'Week', order: 1, isDefault: true, isShown: true },
      ];

      component.dataTransformatin(columnConfig2, mockExcelData, '', 'KPI 202');
      expect(component.forzenColumns).toEqual(['issue id']);
    });

    it('should handle missing Week column for kpi205 gracefully', () => {
      const kpiId = 'kpi205';
      const columnConfig = [
        { columnName: 'Issue Id', order: 0, isDefault: true, isShown: true },
        { columnName: 'Status', order: 1, isDefault: false, isShown: true },
      ];

      component.modalDetails['kpiId'] = kpiId;

      excelServiceMock.generateExcelModalData.and.returnValue({
        headerNames: [],
        excelData: mockExcelData,
      });

      component.dataTransformatin(columnConfig, mockExcelData, '', 'KPI 205');

      // Should still set week as frozen column even if not found
      expect(component.forzenColumns).toEqual(['week']);
      // Columns should remain unchanged if Week is not found
      expect(component.tableColumns).toEqual(columnConfig);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty column configuration', () => {
      const columns = [];
      const result = component.makeWeekColumnOnFirstOrder(columns);
      expect(result).toEqual([]);
    });

    it('should handle column configuration with only Week column', () => {
      const columns = [
        { columnName: 'Week', order: 0, isDefault: true, isShown: true },
      ];
      const result = component.makeWeekColumnOnFirstOrder(columns);
      expect(result[0].columnName).toBe('Week');
      expect(result[0].order).toBe(0);
    });

    it('should handle column configuration with duplicate Week columns', () => {
      const columns = [
        { columnName: 'Week', order: 0, isDefault: true, isShown: true },
        { columnName: 'Issue Id', order: 1, isDefault: true, isShown: true },
        { columnName: 'week', order: 2, isDefault: true, isShown: true },
      ];
      const result = component.makeWeekColumnOnFirstOrder(columns);
      // Should find the first match (case-insensitive)
      expect(result[0].columnName).toBe('Week');
      expect(result.length).toBe(3);
    });

    it('should preserve other column properties when reordering', () => {
      const columns = [
        {
          columnName: 'Issue Id',
          order: 0,
          isDefault: true,
          isShown: true,
          customProp: 'test',
        },
        {
          columnName: 'Week',
          order: 1,
          isDefault: true,
          isShown: false,
          customProp: 'week-prop',
        },
      ];

      const result = component.makeWeekColumnOnFirstOrder(columns);

      expect(result[0].columnName).toBe('Week');
      expect(result[0]['customProp']).toBe('week-prop');
      expect(result[0].isShown).toBe(false);
      expect(result[1]['customProp']).toBe('test');
    });
  });
});
