# Critical Test Patches for Component Changes

This file contains the specific test code that needs to be added to ensure all recent changes are covered.

## 1. executive-v2.component.spec.ts - Critical Updates

### Add these test cases after the existing resetToDefaults tests:

```typescript
  describe('resetToDefaults - KPI-specific resets', () => {
    it('should reset kpi205-specific properties', () => {
      // Setup
      component.kpi205OriginalData = { some: 'data' };
      component.selectedKpi205DataType = { name: 'By Story Points', code: 'STORY_POINTS' };
      component.kpi205YAxisLabel = 'Story Points';
      component.filterByTimeOptions = [{ name: 'Weekly', value: 'Weekly' }];
      component.selectedFilterByTimeOption = { name: 'Weekly', value: 'Weekly' };

      // Execute
      component.resetToDefaults();

      // Assert
      expect(component.kpi205OriginalData).toBeNull();
      expect(component.selectedKpi205DataType).toEqual({ name: 'By Count', code: 'COUNT' });
      expect(component.kpi205YAxisLabel).toEqual('Count');
      expect(component.filterByTimeOptions).toEqual([]);
      expect(component.selectedFilterByTimeOption).toBeNull();
    });

    it('should reset kpi211 stacked chart data', () => {
      // Setup
      component.kpi211StackedChartData = [{ some: 'data' }];

      // Execute
      component.resetToDefaults();

      // Assert
      expect(component.kpi211StackedChartData).toEqual([]);
    });

    it('should reset kpi311 view properties', () => {
      // Setup
      component.kpi311SelectedView = 'Details';
      component.kpi311SelectedSprint = 'Sprint 5';

      // Execute
      component.resetToDefaults();

      // Assert
      expect(component.kpi311SelectedView).toEqual('Overall');
      expect(component.kpi311SelectedSprint).toEqual('');
    });
  });

  describe('getChartData - KPI205 Filter Handling', () => {
    beforeEach(() => {
      component.allKpiArray = [];
      component.updatedConfigGlobalData = [
        {
          kpiId: 'kpi205',
          kpiDetail: {
            chartType: 'grouped_column_plus_line',
            aggregationCriteria: 'average'
          }
        }
      ];
      component.colorObj = {};
    });

    it('should populate filterByTimeOptions for kpi205', () => {
      const mockTrendValueList = [
        {
          filter: 'Weekly',
          value: [{ data: 'Project1', value: [{ data: '10', value: 10 }] }]
        },
        {
          filter: 'Monthly',
          value: [{ data: 'Project1', value: [{ data: '20', value: 20 }] }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi205',
        trendValueList: mockTrendValueList
      });

      component.getChartData('kpi205', 0, 'average');

      expect(component.filterByTimeOptions.length).toBe(2);
      expect(component.filterByTimeOptions[0]).toEqual({ name: 'Weekly', value: 'Weekly' });
      expect(component.filterByTimeOptions[1]).toEqual({ name: 'Monthly', value: 'Monthly' });
    });

    it('should set default selectedFilterByTimeOption for kpi205', () => {
      const mockTrendValueList = [
        {
          filter: 'Weekly',
          value: [{ data: 'Project1', value: [{ data: '10', value: 10 }] }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi205',
        trendValueList: mockTrendValueList
      });
      component.filterByTimeOptions = [];
      component.selectedFilterByTimeOption = null;

      component.getChartData('kpi205', 0, 'average');

      expect(component.selectedFilterByTimeOption).toEqual({ name: 'Weekly', value: 'Weekly' });
    });

    it('should filter kpi205 data based on selectedFilterByTimeOption', () => {
      const mockTrendValueList = [
        {
          filter: 'Weekly',
          value: [{ data: 'Project1', value: [{ data: '10', value: 10 }] }]
        },
        {
          filter: 'Monthly',
          value: [{ data: 'Project1', value: [{ data: '20', value: 20 }] }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi205',
        trendValueList: mockTrendValueList
      });
      component.selectedFilterByTimeOption = { name: 'Monthly', value: 'Monthly' };
      component.filterByTimeOptions = [
        { name: 'Weekly', value: 'Weekly' },
        { name: 'Monthly', value: 'Monthly' }
      ];

      component.getChartData('kpi205', 0, 'average');

      expect(component.kpiChartData['kpi205']).toBeDefined();
      expect(component.kpiChartData['kpi205'][0].data).toEqual('Project1');
    });

    it('should store original data for kpi205', () => {
      const mockTrendValueList = [
        {
          filter: 'Weekly',
          value: [{ data: 'Project1', value: [{ data: '10', value: 10, hoverValue: { 'Story Points': 20 } }] }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi205',
        trendValueList: mockTrendValueList
      });

      component.getChartData('kpi205', 0, 'average');

      expect(component.kpi205OriginalData).toBeDefined();
      expect(component.kpi205OriginalData).not.toBeNull();
    });

    it('should call computeKpi205LineChartData for kpi205', () => {
      const spy = spyOn(component, 'computeKpi205LineChartData');
      const mockTrendValueList = [
        {
          filter: 'Weekly',
          value: [{ data: 'Project1', value: [{ data: '10', value: 10 }] }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi205',
        trendValueList: mockTrendValueList
      });

      component.getChartData('kpi205', 0, 'average');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getChartData - KPI206 Filter Handling', () => {
    beforeEach(() => {
      component.allKpiArray = [];
      component.updatedConfigGlobalData = [
        {
          kpiId: 'kpi206',
          kpiDetail: {
            chartType: 'line',
            aggregationCriteria: 'average'
          }
        }
      ];
      component.colorObj = {};
      component.kpiSelectedFilterObj = {};
      spyOn(component.service, 'setKpiSubFilterObj');
    });

    it('should populate kpi206FilterOptions', () => {
      const mockTrendValueList = [
        {
          filter: 'Status',
          value: [{ date: '2024-01-01', value: { 'To Do': 5 } }]
        },
        {
          filter: 'Group',
          value: [{ date: '2024-01-01', value: { 'Development': 3 } }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi206',
        trendValueList: mockTrendValueList
      });

      component.getChartData('kpi206', 0, 'average');

      expect(component.kpi206FilterOptions.length).toBe(2);
      expect(component.kpi206FilterOptions[0]).toEqual({ name: 'Status', value: 'Status' });
      expect(component.kpi206FilterOptions[1]).toEqual({ name: 'Group', value: 'Group' });
    });

    it('should set default selectedKpi206FilterOption', () => {
      const mockTrendValueList = [
        {
          filter: 'Status',
          value: [{ date: '2024-01-01', value: { 'To Do': 5 } }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi206',
        trendValueList: mockTrendValueList
      });
      component.kpi206FilterOptions = [];
      component.selectedKpi206FilterOption = null;

      component.getChartData('kpi206', 0, 'average');

      expect(component.selectedKpi206FilterOption).toEqual({ name: 'Status', value: 'Status' });
      expect(component.kpiSelectedFilterObj['kpi206']).toEqual({ filter: 'Status' });
    });

    it('should filter kpi206 data based on selected filter', () => {
      const mockTrendValueList = [
        {
          filter: 'Status',
          value: [{ date: '2024-01-01', value: { 'To Do': 5, 'Done': 3 } }]
        },
        {
          filter: 'Group',
          value: [{ date: '2024-01-01', value: { 'Development': 4, 'Testing': 2 } }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi206',
        trendValueList: mockTrendValueList
      });
      component.selectedKpi206FilterOption = { name: 'Group', value: 'Group' };
      component.kpi206FilterOptions = [
        { name: 'Status', value: 'Status' },
        { name: 'Group', value: 'Group' }
      ];

      component.getChartData('kpi206', 0, 'average');

      expect(component.kpiChartData['kpi206']).toBeDefined();
      expect(component.kpiChartData['kpi206'][0].value).toEqual({ 'Development': 4, 'Testing': 2 });
    });

    it('should restore previous kpi206 filter selection from kpiSelectedFilterObj', () => {
      const mockTrendValueList = [
        {
          filter: 'Status',
          value: [{ date: '2024-01-01', value: { 'To Do': 5 } }]
        },
        {
          filter: 'Group',
          value: [{ date: '2024-01-01', value: { 'Development': 3 } }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi206',
        trendValueList: mockTrendValueList
      });
      component.kpiSelectedFilterObj['kpi206'] = { filter: 'Group' };
      component.kpi206FilterOptions = [];

      component.getChartData('kpi206', 0, 'average');

      expect(component.selectedKpi206FilterOption).toEqual({ name: 'Group', value: 'Group' });
    });
  });

  describe('getChartData - KPI211 Stacked Chart Trigger', () => {
    beforeEach(() => {
      component.allKpiArray = [];
      component.updatedConfigGlobalData = [
        {
          kpiId: 'kpi211',
          kpiDetail: {
            chartType: 'scatter',
            aggregationCriteria: 'average'
          }
        }
      ];
      component.colorObj = {};
    });

    it('should call computeKpi211StackedChartData after chart data is set', () => {
      const spy = spyOn(component, 'computeKpi211StackedChartData');
      const mockTrendValueList = [
        {
          filter: 'Overall',
          value: [{ data: 'Project1', value: [{ x: 1, y: 2 }] }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi211',
        trendValueList: mockTrendValueList
      });

      component.getChartData('kpi211', 0, 'average');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('computeKpi205LineChartData', () => {
    it('should compute line chart data when kpi205OriginalData exists', () => {
      component.kpi205OriginalData = [
        {
          data: 'Project1',
          value: [
            { data: '10', value: 10, hoverValue: { 'Story Points': 20 } },
            { data: '15', value: 15, hoverValue: { 'Story Points': 30 } }
          ]
        },
        {
          data: 'Project2',
          value: [
            { data: '20', value: 20, hoverValue: { 'Story Points': 40 } },
            { data: '25', value: 25, hoverValue: { 'Story Points': 50 } }
          ]
        }
      ];
      component.selectedKpi205DataType = { name: 'By Count', code: 'COUNT' };

      component.computeKpi205LineChartData();

      expect(component.kpi205AvgChartData).toBeDefined();
      // Should create an Average line data structure
    });

    it('should handle STORY_POINTS data type', () => {
      component.kpi205OriginalData = [
        {
          data: 'Project1',
          value: [
            { data: '10', value: 10, hoverValue: { 'Story Points': 20 } },
            { data: '15', value: 15, hoverValue: { 'Story Points': 30 } }
          ]
        }
      ];
      component.selectedKpi205DataType = { name: 'By Story Points', code: 'STORY_POINTS' };

      component.computeKpi205LineChartData();

      expect(component.kpi205AvgChartData).toBeDefined();
      // Average should be calculated from Story Points values
    });

    it('should handle null kpi205OriginalData', () => {
      component.kpi205OriginalData = null;

      expect(() => component.computeKpi205LineChartData()).not.toThrow();
    });

    it('should handle empty kpi205OriginalData', () => {
      component.kpi205OriginalData = [];

      component.computeKpi205LineChartData();

      expect(component.kpi205AvgChartData).toBeDefined();
    });
  });

  describe('computeKpi211StackedChartData', () => {
    it('should compute stacked chart data when kpi211 chart data exists', () => {
      component.kpiChartData = {
        kpi211: [
          {
            data: 'Project1',
            value: [
              { x: 'Sprint1', y: 10, dataValue: { 'Category1': 5, 'Category2': 5 } },
              { x: 'Sprint2', y: 20, dataValue: { 'Category1': 10, 'Category2': 10 } }
            ]
          }
        ]
      };

      component.computeKpi211StackedChartData();

      expect(component.kpi211StackedChartData).toBeDefined();
      expect(component.kpi211StackedChartData.length).toBeGreaterThan(0);
    });

    it('should handle empty kpi211 chart data', () => {
      component.kpiChartData = { kpi211: [] };

      component.computeKpi211StackedChartData();

      expect(component.kpi211StackedChartData).toEqual([]);
    });

    it('should handle missing kpi211 in kpiChartData', () => {
      component.kpiChartData = {};

      expect(() => component.computeKpi211StackedChartData()).not.toThrow();
    });
  });

  describe('getChartDataForBacklog - KPI206/KPI207 Filter Structure', () => {
    beforeEach(() => {
      component.allKpiArray = [];
      component.updatedConfigGlobalData = [
        {
          kpiId: 'kpi206',
          kpiDetail: {
            chartType: 'line',
            aggregationCriteria: 'average'
          }
        }
      ];
      component.colorObj = {};
      component.kpiSelectedFilterObj = {};
      spyOn(component.service, 'setKpiSubFilterObj');
    });

    it('should use correct filter structure for kpi206', () => {
      const mockTrendValueList = [
        {
          filter: 'Status',
          value: [{ date: '2024-01-01', value: { 'To Do': 5 } }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi206',
        trendValueList: mockTrendValueList
      });

      component.getChartDataForBacklog('kpi206', 0, 'average');

      // Should use { filter: "Status" } not { filter1: ["Status"] }
      expect(component.kpiSelectedFilterObj['kpi206']).toEqual({ filter: 'Status' });
    });

    it('should correct legacy filter1 structure for kpi206', () => {
      const mockTrendValueList = [
        {
          filter: 'Status',
          value: [{ date: '2024-01-01', value: { 'To Do': 5 } }]
        }
      ];

      component.allKpiArray.push({
        kpiId: 'kpi206',
        trendValueList: mockTrendValueList
      });
      
      // Simulate legacy cache with incorrect structure
      component.kpiSelectedFilterObj['kpi206'] = { filter1: ['Status'] };
      component.kpiDropdowns = {
        kpi206: [{ options: ['Status', 'Group'] }]
      };

      component.getChartDataForBacklog('kpi206', 0, 'average');

      // Should be corrected to { filter: "Status" }
      expect(component.kpiSelectedFilterObj['kpi206']).toEqual({ filter: 'Status' });
      expect(component.kpiSelectedFilterObj['kpi206'].filter1).toBeUndefined();
    });
  });
```

---

## 2. field-mapping-form.component.spec.ts - Critical Updates

### Add these test cases after the existing ngOnInit tests:

```typescript
  describe('ngOnChanges', () => {
    it('should reinitialize form when formData changes after initial load', () => {
      component.fieldMappingConfig = fakeKpiFieldMappingConfigList.data.fieldConfiguration;
      component.formData = fakeSelectedFieldMapping;
      component.ngOnInit();

      const initSpy = spyOn(component, 'initializeForm').and.callThrough();
      const generateSpy = spyOn(component, 'generateFieldMappingConfiguration').and.callThrough();

      const newFormData = [...fakeSelectedFieldMapping, { fieldName: 'newField', originalValue: 'newValue' }];
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
      component.fieldMappingConfig = fakeKpiFieldMappingConfigList.data.fieldConfiguration;
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
      const dynamicFields = component.formConfig[targetSection].filter((f) => f.isDynamic);
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
      const dynamicFields = component.formConfig[targetSection].filter((f) => f.isDynamic);
      expect(dynamicFields[0].fieldNameControlName).toBe('jiraFieldNameForSummary');
    });

    it('should create weightageControlName for kpi311 dynamic fields', () => {
      component.ngOnInit();

      const selectedGroups = ['Summary'];
      component.updateDynamicWorkflowFields(selectedGroups);

      const targetSection = 'jiraFieldsSelectionKPI311';
      const dynamicFields = component.formConfig[targetSection].filter((f) => f.isDynamic);
      expect(dynamicFields[0].weightageControlName).toBe('jiraWeightageForSummary');
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
              prompt: 'Write summary'
            }
          ],
        },
      ];
      component.ngOnInit();

      const selectedGroups = ['Summary'];
      component.updateDynamicWorkflowFields(selectedGroups);

      expect(component.form.get('jiraStatusForSummary').value).toBe('Write summary');
      expect(component.form.get('jiraFieldNameForSummary').value).toBe('customfield_10001');
      expect(component.form.get('jiraWeightageForSummary').value).toBe(50);
    });

    it('should use fieldName as section for kpi311 trigger field', () => {
      component.generateFieldMappingConfiguration();

      expect(component.formConfig['jiraFieldsSelectionKPI311']).toBeDefined();
      expect(component.fieldMappingSectionList.includes('jiraFieldsSelectionKPI311')).toBeTruthy();
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
      component.form.get('jiraFieldNameForSummary').setValue('customfield_10001');
      component.form.get('jiraWeightageForSummary').setValue(50);
      component.form.get('jiraStatusForDescription').setValue('Write description');
      component.form.get('jiraFieldNameForDescription').setValue('customfield_10002');
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
          prompt: 'Write a summary'
        },
        { 
          label: 'Description', 
          fieldName: 'customfield_10002',
          weightage: 30,
          prompt: 'Write description'
        },
      ]);
    });

    it('should handle null weightage for kpi311', () => {
      const saveSpy = spyOn(component, 'saveFieldMapping');
      component.ngOnInit();

      component.updateDynamicWorkflowFields(['Summary']);
      component.form.get('jiraStatusForSummary').setValue('Write summary');
      component.form.get('jiraFieldNameForSummary').setValue('customfield_10001');
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

      component.addValueDialog = {} as any;

      expect(() => component.recordScrollPosition()).not.toThrow();
      expect(component.bodyScrollPosition).toBe(150);
    });
  });
```

---

## Implementation Instructions

### For executive-v2.component.spec.ts:

1. Find the section with existing `resetToDefaults` tests
2. Add the new `describe` block for "KPI-specific resets" after existing tests
3. Add the `getChartData - KPI205 Filter Handling` describe block
4. Add the `getChartData - KPI206 Filter Handling` describe block
5. Add the new computation method tests
6. Add the `getChartDataForBacklog` tests for KPI206/207

### For field-mapping-form.component.spec.ts:

1. Add the `ngOnChanges` tests after the `ngOnInit` tests
2. Add the `kpi311 Dynamic Workflow Fields` describe block
3. Add the `Save with kpi311 Dynamic Fields` tests
4. Add the getter and helper method tests at the end

### Running the Tests:

```bash
# Run all tests
npm test

# Run only executive-v2 tests
npm test -- --include='**/executive-v2.component.spec.ts'

# Run only field-mapping-form tests
npm test -- --include='**/field-mapping-form.component.spec.ts'

# Run with coverage
npm test -- --coverage
```

### Expected Coverage Improvement:

- **executive-v2.component.spec.ts**: +8-10% coverage
- **field-mapping-form.component.spec.ts**: +5-7% coverage

---

## Validation Checklist

- [ ] All new tests pass
- [ ] All existing tests still pass
- [ ] No regressions introduced
- [ ] Coverage targets met (>95%)
- [ ] Tests follow existing patterns
- [ ] Test descriptions are clear
- [ ] Edge cases covered
- [ ] Mock data is realistic
- [ ] Spies used appropriately
- [ ] Async operations handled correctly
