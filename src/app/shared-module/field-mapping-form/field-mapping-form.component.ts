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
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SharedService } from '../../services/shared.service';
import { HttpService } from '../../services/http.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-field-mapping-form',
  templateUrl: './field-mapping-form.component.html',
  styleUrls: ['./field-mapping-form.component.css'],
})
export class FieldMappingFormComponent implements OnInit, OnChanges {
  @Input() fieldMappingMetaData;
  @Input() fieldMappingConfig;
  @Input() formData;
  @Input() selectedConfig;
  @Input() selectedToolConfig;
  @Input() thresholdUnit;
  @Output() reloadKPI = new EventEmitter();
  populateDropdowns = true;
  selectedField = '';
  singleSelectionDropdown = false;
  fieldMappingMultiSelectValues: any = [];
  selectedValue = [];
  selectedMultiValue = [];
  displayDialog = false;
  selectedFieldMapping: any = {};
  bodyScrollPosition = 0;
  uploadedFileName = '';

  filterHierarchy: any = [];
  form: FormGroup;
  fieldMappingSectionList = [];
  formConfig: any;
  //isFormDirty : boolean = false;
  historyList = [];
  showSpinner = false;
  isHistoryPopup: any = {};
  @Input() kpiId: string;
  individualFieldHistory = [];
  @Input() metaDataTemplateCode: any;
  @Input() parentComp: string;
  nestedFieldANDParent = {};
  @Input() nodeId = '';

  private readonly kpiTriggerFieldLabelMap: Record<string, string> = {
    kpi202: 'Workfow groups',
    kpi206: 'Workfow groups',
    kpi217: 'fields to write prompts',
  };

  get fieldMappingLabel(): string {
    return this.kpiTriggerFieldLabelMap[this.kpiId] || '';
  }

  readonly workFlowStatusMappingSection: string = 'WorkFlow Status Mapping';

  @ViewChild('addValueDialog') addValueDialog!: Dialog;

  constructor(
    private readonly sharedService: SharedService,
    private readonly http: HttpService,
    private readonly messenger: MessageService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  /**
   * React to @Input changes, particularly formData
   * When formData is updated (e.g., dialog reopened with new data),
   * reinitialize the form to display the latest values
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Only reinitialize if formData changed and it's NOT the initial value
    // (ngOnInit will handle the first initialization)
    if (
      changes['formData'] &&
      changes['formData'].currentValue &&
      !changes['formData'].firstChange &&
      this.form
    ) {
      // formData has changed after initial load - reinitialize form with new data
      this.initializeForm();
      this.generateFieldMappingConfiguration();
      // Mark form as pristine since it's now freshly loaded
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  ngOnInit(): void {
    this.historyList = [];
    this.filterHierarchy = JSON.parse(
      localStorage.getItem('completeHierarchyData'),
    ).scrum;
    this.initializeForm();
    this.generateFieldMappingConfiguration();
    if (
      this.kpiId === 'kpi202' ||
      this.kpiId === 'kpi206' ||
      this.kpiId === 'kpi217'
    ) {
      const triggerField = this.fieldMappingConfig.find(
        (field) => field.fieldLabel === this.fieldMappingLabel,
      );
      if (triggerField) {
        const initialVal = this.form.get(triggerField.fieldName)?.value;
        this.updateDynamicWorkflowFields(initialVal);
        this.form
          .get(triggerField.fieldName)
          .valueChanges.subscribe((selectedGroups) => {
            this.updateDynamicWorkflowFields(selectedGroups);
          });
      }
    }
    this.form.valueChanges.subscribe(() => {});
  }

  getStaticFields(section: string) {
    return this.formConfig[section]?.filter((f) => !f.isDynamic) || [];
  }

  getDynamicFields(section: string) {
    return this.formConfig[section]?.filter((f) => f.isDynamic) || [];
  }

  updateDynamicWorkflowFields(selectedGroups: string[] | string) {
    if (!this.formConfig) {
      return;
    }

    const triggerField = this.fieldMappingConfig.find(
      (f) => f.fieldLabel === this.fieldMappingLabel,
    );

    if (!triggerField) {
      return;
    }

    // Find the actual key in formConfig where the trigger field lives.
    // This is robust against fields that have section:undefined from the backend
    // (which generateFieldMappingConfiguration normalises to 'Field Mapping').
    const targetSection =
      Object.keys(this.formConfig).find((key) =>
        this.formConfig[key]?.some(
          (f) => f.fieldName === triggerField.fieldName,
        ),
      ) || this.workFlowStatusMappingSection;

    if (!this.formConfig[targetSection]) {
      this.formConfig[targetSection] = [];
    }

    const groups = Array.isArray(selectedGroups)
      ? selectedGroups
      : typeof selectedGroups === 'object' && selectedGroups !== null
      ? Object.keys(selectedGroups)
      : selectedGroups
      ? [selectedGroups]
      : [];

    // Remove existing dynamic fields from formConfig
    this.formConfig[targetSection] = this.formConfig[targetSection].filter(
      (field) => !field.isDynamic,
    );

    const currentDynamicFieldNames = groups.map(
      (it) => `jiraStatusFor${it.replace(/\s+/g, '')}`,
    );

    // Sync formData: keep non-dynamic fields or current dynamic fields
    this.formData = this.formData.filter((d) => {
      if (!d.fieldName.startsWith('jiraStatusFor')) {
        return true;
      }
      return currentDynamicFieldNames.includes(d.fieldName);
    });

    const maxDisplayOrder = Math.max(
      ...this.formConfig[targetSection].map((f) => f.fieldDisplayOrder || 0),
      0,
    );

    groups.forEach((group, index) => {
      const dynamicFieldName = `jiraStatusFor${group.replace(/\s+/g, '')}`;
      const capitalizedGroup = group;
      const dynamicField = {
        fieldName: dynamicFieldName,
        fieldLabel:
          this.kpiId !== 'kpi217'
            ? `Status to identify ${capitalizedGroup}`
            : capitalizedGroup,
        fieldType: this.kpiId === 'kpi217' ? 'text' : 'chips',
        fieldCategory: 'workflow',
        section: targetSection,
        processorCommon: false,
        isDynamic: true,
        fieldDisplayOrder: maxDisplayOrder + index + 1,
        originalGroupName: group, // Store for payload construction
        tooltip: { definition: `Status mapping for ${group}` },
      };

      this.formConfig[targetSection].push(dynamicField);

      // Add to form group if not already present
      if (!this.form.contains(dynamicFieldName)) {
        // Try to find if we already have a value for this in the original trigger field value
        const triggerField = this.fieldMappingConfig.find(
          (f) => f.fieldLabel === this.fieldMappingLabel,
        );
        const triggerValue =
          this.formData.find((d) => d.fieldName === triggerField?.fieldName)
            ?.originalValue || {};
        let initialValue = [];
        if (Array.isArray(triggerValue)) {
          if (
            triggerValue.length > 0 &&
            typeof triggerValue[0] === 'object' &&
            triggerValue[0] !== null
          ) {
            if ('label' in triggerValue[0]) {
              const matchedGroup = triggerValue.find(
                (item: any) => item.label === group,
              );
              // For kpi217, the value is stored as 'prompt', for kpi202/206 it's 'statuses'
              if (this.kpiId === 'kpi217') {
                initialValue = matchedGroup ? matchedGroup.prompt : '';
              } else {
                initialValue = matchedGroup ? matchedGroup.statuses : [];
              }
            } else {
              initialValue = triggerValue[0][group] || [];
            }
          }
        } else if (typeof triggerValue === 'object' && triggerValue !== null) {
          initialValue = triggerValue[group] || [];
        }

        const control = new FormControl(initialValue);
        this.form.addControl(dynamicFieldName, control);

        // Bug fix: if this control previously had chips and is now completely cleared, delete its group!
        let previousLength = Array.isArray(initialValue)
          ? initialValue.length
          : 0;
        control.valueChanges.subscribe((val) => {
          const currentLength = Array.isArray(val) ? val.length : 0;
          if (currentLength === 0 && previousLength > 0) {
            // Delete this group from the trigger field to trigger removal of the dynamic row
            if (triggerField) {
              const triggerCtrl = this.form.get(triggerField.fieldName);
              if (triggerCtrl) {
                const currentGroups = triggerCtrl.value || [];
                triggerCtrl.setValue(
                  currentGroups.filter((g: string) => g !== group),
                );
              }
            }
          }
          previousLength = currentLength;
        });

        // Ensure it's in formData so it gets tracked
        if (!this.formData.find((d) => d.fieldName === dynamicFieldName)) {
          this.formData.push({
            fieldName: dynamicFieldName,
            originalValue: initialValue,
          });
        }
      }
    });

    // Re-sort to ensure dynamic fields are at the bottom
    this.formConfig[targetSection].sort(
      (a, b) => (a.fieldDisplayOrder || 0) - (b.fieldDisplayOrder || 0),
    );

    // Spread to create a new formConfig reference so Angular's change detection
    // picks up the mutation and re-evaluates getDynamicFields() in the template.
    this.formConfig = { ...this.formConfig };

    console.log(
      '[kpi217 debug] After update — targetSection:',
      targetSection,
      '| dynamic fields:',
      this.formConfig[targetSection]
        ?.filter((f) => f.isDynamic)
        .map((f) => f.fieldName),
    );
  }

  generateFieldMappingConfiguration() {
    const fieldMappingSections = [];
    const fieldMappingConfigration = {};
    this.fieldMappingConfig.forEach((field) => {
      // Normalise missing section (undefined):
      // - For kpi217 with fieldName 'jiraFieldsSelectionKPI217', use fieldName as section key
      //   so trigger and dynamic fields render in the same accordion section.
      // - Otherwise, default to 'Field Mapping'.
      let sectionKey = field.section;
      if (!sectionKey) {
        if (
          this.kpiId === 'kpi217' &&
          field.fieldName === 'jiraFieldsSelectionKPI217'
        ) {
          sectionKey = field.fieldName; // Use 'jiraFieldsSelectionKPI217' as section key
        } else {
          sectionKey = 'Field Mapping'; // Default fallback
        }
      }
      fieldMappingSections.push(sectionKey);
      if (!fieldMappingConfigration[sectionKey]) {
        fieldMappingConfigration[sectionKey] = [field];
      } else {
        fieldMappingConfigration[sectionKey].push(field);
      }
    });
    const sectionsInCorrectOrder = [
      'Custom Fields Mapping',
      'Issue Types Mapping',
      'Defects Mapping',
      this.workFlowStatusMappingSection,
      'Additional Filter Identifier',
      'Project Level Threshold',
      'jiraFieldsSelectionKPI217', // kpi217-specific section (no backend section defined)
    ];
    const sectionsList = [...new Set(fieldMappingSections)].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
    this.fieldMappingSectionList = this.getSectionsInCorrectOrder(
      sectionsList,
      sectionsInCorrectOrder,
    );
    this.formConfig = this.sortingOfFieldMapping(fieldMappingConfigration);
  }

  sortingOfFieldMapping(data) {
    const sortedData = {};
    for (const category in data) {
      if (data.hasOwnProperty(category)) {
        sortedData[category] = data[category].sort(
          (a, b) => a?.fieldDisplayOrder - b?.fieldDisplayOrder,
        );
      }
    }
    return sortedData;
  }

  getSectionsInCorrectOrder(incorrectOrder, correctOrder) {
    const orderMap = new Map();

    // Create a map with the correct order
    correctOrder.forEach((item, index) => {
      orderMap.set(item, index);
    });

    // Sort the incorrect order list based on the correct order map
    return incorrectOrder.sort((a, b) => orderMap.get(a) - orderMap.get(b));
  }

  initializeForm() {
    const formObj = {};
    for (const field of this.fieldMappingConfig) {
      this.isHistoryPopup[field.fieldName] = false;
      formObj[field.fieldName] =
        this.generateFromControlBasedOnFieldType(field);
      if (field.hasOwnProperty('nestedFields')) {
        for (const nField of field.nestedFields) {
          this.nestedFieldANDParent[nField.fieldName] = field.fieldName;
          this.isHistoryPopup[nField.fieldName] = false;
          formObj[nField.fieldName] =
            this.generateFromControlBasedOnFieldType(nField);
        }
      }
    }
    this.form = new FormGroup(formObj);
  }

  /** This method is taking config as parameter, creating form control and assigning initial value based on fieldtype */
  generateFromControlBasedOnFieldType(config) {
    const fieldMapping = this.formData.find(
      (data) => data.fieldName === config.fieldName,
    );
    if (fieldMapping?.history?.length) {
      this.historyList.push({
        fieldName: fieldMapping.fieldName,
        history: fieldMapping.history,
      });
    }
    if (
      (fieldMapping &&
        (fieldMapping?.originalValue ||
          fieldMapping?.originalValue === false)) ||
      (!isNaN(fieldMapping?.originalValue) && fieldMapping?.originalValue >= 0)
    ) {
      let initialVal = fieldMapping.originalValue;

      // Extract keys for dynamic "Workflow groups" trigger field
      // Since originalValue has a nested structure but chips component expects string array
      if (config.fieldLabel === this.fieldMappingLabel && initialVal) {
        if (Array.isArray(initialVal)) {
          if (
            initialVal.length > 0 &&
            typeof initialVal[0] === 'object' &&
            initialVal[0] !== null
          ) {
            if ('label' in initialVal[0]) {
              initialVal = initialVal.map((item: any) => item.label);
            } else {
              initialVal = Object.keys(initialVal[0]);
            }
          }
        } else if (typeof initialVal === 'object') {
          initialVal = Object.keys(initialVal);
        }
      }

      return new FormControl(
        initialVal,
        config.mandatory ? Validators.required : [],
      );
    } else {
      switch (config.fieldType) {
        case 'text':
        case 'radiobutton':
          return new FormControl(
            '',
            config.mandatory ? Validators.required : [],
          );
        case 'toggle':
          return new FormControl(false);
        case 'number':
          return new FormControl('');
        default:
          return new FormControl(
            [],
            config.mandatory ? Validators.required : [],
          );
      }
    }
  }

  /** When user import mapping template this method will set values in form */
  setControlValueOnImport(values) {
    this.selectedFieldMapping = values;
    if (
      this.selectedFieldMapping &&
      Object.keys(this.selectedFieldMapping).length
    ) {
      for (const obj in this.selectedFieldMapping) {
        if (this.form?.controls[obj]) {
          this.form.controls[obj].setValue(this.selectedFieldMapping[obj]);
        }
      }
    }
    // if (!this.form.invalid) { // removingMandatoryValidationAsPartOfDTS-43148
    const finalList = [];

    Object.keys(this.selectedFieldMapping).forEach((fieldName) => {
      const originalVal = this.selectedFieldMapping[fieldName];
      finalList.push({ fieldName: fieldName, originalValue: originalVal });
    });
    this.saveFieldMapping(finalList, true);
    // }
  }

  /** once user will click on search btn, assign the search options based on field category */
  showDialogToAddValue({ fieldName, type, isSingle }) {
    this.populateDropdowns = true;
    this.selectedField = fieldName;

    if (isSingle) {
      this.singleSelectionDropdown = true;
    } else {
      this.singleSelectionDropdown = false;
    }

    switch (type) {
      case 'fields':
        if (this.fieldMappingMetaData?.fields) {
          this.fieldMappingMultiSelectValues = this.fieldMappingMetaData.fields;
        } else {
          this.fieldMappingMultiSelectValues = [];
        }
        break;
      case 'workflow':
        if (this.fieldMappingMetaData?.workflow) {
          this.fieldMappingMultiSelectValues =
            this.fieldMappingMetaData.workflow;
        } else {
          this.fieldMappingMultiSelectValues = [];
        }
        break;
      case 'Issue_Link':
        if (this.fieldMappingMetaData?.Issue_Link) {
          this.fieldMappingMultiSelectValues =
            this.fieldMappingMetaData.Issue_Link;
        } else {
          this.fieldMappingMultiSelectValues = [];
        }
        break;
      case 'Issue_Type':
        if (this.fieldMappingMetaData?.Issue_Type) {
          this.fieldMappingMultiSelectValues =
            this.fieldMappingMetaData.Issue_Type;
        } else {
          this.fieldMappingMultiSelectValues = [];
        }
        break;
      case 'releases':
        if (this.fieldMappingMetaData?.releases) {
          // Set the 'disabled' property and segregate items in a single pass
          const { enabledItems, disabledItems } =
            this.fieldMappingMetaData.releases.reduce(
              (acc: any, item: any) => {
                item['disabled'] = item.data.includes('duration - days');
                if (item['disabled']) {
                  acc.disabledItems.push(item);
                } else {
                  acc.enabledItems.push(item);
                }
                return acc;
              },
              { enabledItems: [], disabledItems: [] },
            );

          // Concatenate the non-disabled items with the disabled items
          this.fieldMappingMetaData.releases = [
            ...enabledItems,
            ...disabledItems,
          ];
          this.fieldMappingMultiSelectValues =
            this.fieldMappingMetaData.releases;
        } else {
          this.fieldMappingMultiSelectValues = [];
        }
        break;
      default:
        this.fieldMappingMultiSelectValues = [];
        break;
    }

    if (isSingle) {
      if (this.form.controls[this.selectedField].value) {
        this.selectedValue = this.fieldMappingMultiSelectValues.filter(
          (fieldMappingMultiSelectValue: any) =>
            fieldMappingMultiSelectValue.data ===
            this.form.controls[this.selectedField].value,
        );
        if (this.selectedValue && this.selectedValue.length) {
          if (this.selectedValue[0].data) {
            this.selectedValue = this.selectedValue[0].data;
          }
        }
      }
    } else {
      if (this.form.controls[this.selectedField].value) {
        // Fix: Compare against 'key' property to properly match selected values
        // The form control stores labels (keys), so we need to check against the 'key' property
        this.selectedMultiValue = this.fieldMappingMultiSelectValues.filter(
          (fieldMappingMultiSelectValue: any) =>
            this.form.controls[this.selectedField].value.includes(
              fieldMappingMultiSelectValue.key,
            ),
        );
      }
    }

    this.displayDialog = true;
  }

  /** close search dialog */
  cancelDialog() {
    this.populateDropdowns = false;
    this.displayDialog = false;
  }

  /** Once user select value and click on save then selected option will be populated on chip/textbox */
  saveDialog() {
    const preSaveFormValueList = {
      ...this.form.controls[this.selectedField].value,
    };
    if (this.singleSelectionDropdown) {
      if (this.selectedValue.length) {
        this.form.controls[this.selectedField].setValue(this.selectedValue);
      }
    } else {
      const selectedMultiValueLabels = [];
      if (this.selectedMultiValue.length) {
        if (this.form.controls[this.selectedField].value) {
          for (const index in this.selectedMultiValue) {
            selectedMultiValueLabels.push(this.selectedMultiValue[index].key);
          }
          const allMultiValueLabels = [];
          for (const index in this.fieldMappingMultiSelectValues) {
            allMultiValueLabels.push(
              this.fieldMappingMultiSelectValues[index].key,
            );
          }

          if (
            !selectedMultiValueLabels.includes(
              this.form.controls[this.selectedField].value,
            )
          ) {
            for (const selectedFieldIndex in this.form.controls[
              this.selectedField
            ].value) {
              if (
                !allMultiValueLabels.includes(
                  this.form.controls[this.selectedField].value[
                    selectedFieldIndex
                  ],
                )
              ) {
                selectedMultiValueLabels.push(
                  this.form.controls[this.selectedField].value[
                    selectedFieldIndex
                  ],
                );
              }
            }
          }
        }
      }

      this.form.controls[this.selectedField].setValue(
        Array.from(new Set(selectedMultiValueLabels)),
      );
    }
    //#region  DTS-39044 fix
    const afterSaveFormValueList = {
      ...this.form.controls[this.selectedField].value,
    };
    if (
      JSON.stringify(preSaveFormValueList) !=
      JSON.stringify(afterSaveFormValueList)
    ) {
      this.form.markAsDirty();
      this.form.markAsTouched();
      this.form.updateValueAndValidity();
    }
    //#endregion
    this.populateDropdowns = false;
    this.displayDialog = false;
  }

  recordScrollPosition() {
    this.bodyScrollPosition = document.documentElement.scrollTop;

    // --- focus on dialog header
    if (this.addValueDialog.contentViewChild) {
      const headerEl = document.getElementById('addValuesDialogTitle');
      headerEl.focus();
    }
  }

  scrollToPosition() {
    this.populateDropdowns = false;
    document.documentElement.scrollTop = this.bodyScrollPosition;
  }

  /** Responsible for handle template popup */
  save() {
    const finalList = [];

    this.formData.forEach((element) => {
      const formValue = this.form.value[element.fieldName];
      const isChangedFromPreviousOne = this.compareValues(
        element?.originalValue,
        formValue,
      );
      if (!isChangedFromPreviousOne) {
        finalList.push({
          fieldName: element.fieldName,
          originalValue: formValue,
          previousValue: element.originalValue,
        });
        /** Adding parent field value if nested field changes */
        if (this.nestedFieldANDParent.hasOwnProperty(element.fieldName)) {
          finalList.push({
            fieldName: this.nestedFieldANDParent[element.fieldName],
            originalValue:
              this.form.value[this.nestedFieldANDParent[element.fieldName]],
          });
        }
      }
    });

    if (
      this.kpiId === 'kpi202' ||
      this.kpiId === 'kpi206' ||
      this.kpiId === 'kpi217'
    ) {
      const triggerField = this.fieldMappingConfig.find(
        (f) => f.fieldLabel === this.fieldMappingLabel,
      );
      if (triggerField) {
        const mappingValue = [];
        let dynamicFieldChanged = false;

        // Find the section where the trigger field is stored in formConfig.
        // This handles cases where triggerField.section is undefined (e.g., kpi217).
        const targetSection =
          Object.keys(this.formConfig).find((key) =>
            this.formConfig[key]?.some(
              (f) => f.fieldName === triggerField.fieldName,
            ),
          ) || this.workFlowStatusMappingSection;

        // Build mappingValue from ALL dynamic fields currently in the form
        this.formConfig[targetSection]?.forEach((config) => {
          if (config.isDynamic) {
            if (this.kpiId === 'kpi217') {
              mappingValue.push({
                label: config.fieldLabel,
                prompt: this.form.value[config.fieldName] || '',
              });
            } else {
              mappingValue.push({
                label: config.originalGroupName,
                statuses: this.form.value[config.fieldName] || [],
              });
            }
          }
        });

        console.log(
          '[kpi217 debug save] targetSection:',
          targetSection,
          'mappingValue:',
          mappingValue,
        );

        // Remove dynamic fields from finalList so they aren't sent directly
        for (let i = finalList.length - 1; i >= 0; i--) {
          if (finalList[i].fieldName.startsWith('jiraStatusFor')) {
            dynamicFieldChanged = true;
            finalList.splice(i, 1);
          }
        }

        // Update or Add the trigger field in finalList
        const triggerIndex = finalList.findIndex(
          (f) => f.fieldName === triggerField.fieldName,
        );
        if (triggerIndex !== -1) {
          finalList[triggerIndex].originalValue = mappingValue;
        } else if (dynamicFieldChanged || mappingValue.length > 0) {
          // Add trigger field if any dynamic field was changed
          // OR if we have mapping values (even if trigger field itself didn't change,
          // dynamic fields were created, so we need to save the mapping)
          finalList.push({
            fieldName: triggerField.fieldName,
            originalValue: mappingValue,
          });
        }
      }
    }

    const checkForErr = this.checkedEmptyValue(finalList);

    if (checkForErr) {
      this.messenger.add({
        key: 'key1',
        severity: 'error',
        summary:
          'One of the values is missing. Please fill all the values and try again!',
      });
      return;
    }

    if (
      this.selectedToolConfig[0].toolName.toLowerCase() === 'jira' ||
      this.selectedToolConfig[0].toolName.toLowerCase() === 'azure'
    ) {
      if (
        !(
          (this.metaDataTemplateCode && this.metaDataTemplateCode === '9') ||
          this.metaDataTemplateCode === '10'
        )
      ) {
        this.confirmationService.confirm({
          message: `Please note that change in mappings is a deviation from initially configured template.
              If you continue with the change in mappings then these changes will be mapped to a
              Custom template in project configurations which cannot be changed again to a initially configured template.`,
          header: 'Template Change Info',
          key: 'templateInfoDialog',
          accept: () => {
            this.saveFieldMapping(finalList);
          },
          reject: () => {},
        });
      } else {
        this.saveFieldMapping(finalList);
      }
    } else {
      this.saveFieldMapping(finalList);
    }
  }

  checkedEmptyValue(arr: any[]) {
    for (const element of arr) {
      if (element?.originalValue) {
        for (let j = 0; j < element.originalValue.length; j++) {
          for (const prop in element.originalValue[j].structuredValue) {
            if (!element.originalValue[j].structuredValue[prop]) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  /** Responsible for handle save */
  saveFieldMapping(mappingData, isImport?) {
    const mappingObj = {
      releaseNodeId: this.nodeId || null,
      fieldMappingRequests: [...mappingData],
    };
    this.http
      .setFieldMappings(
        this.selectedToolConfig[0].id,
        mappingObj,
        this.kpiId,
        isImport,
      )
      .subscribe((response) => {
        if (response && response['success']) {
          this.messenger.add({
            severity: 'success',
            summary: 'Field Mappings submitted!',
          });
          //#region Bug:39044
          this.form.markAsPristine();
          this.form.markAsUntouched();
          this.form.updateValueAndValidity();
          //#endregion
          this.uploadedFileName = '';
          if (this.parentComp === 'kpicard') {
            this.reloadKPI.emit();
          } else {
            this.refreshFieldMapppingValueANDHistory();
          }
        } else {
          this.messenger.add({
            severity: 'error',
            summary: response['message'],
          });
        }
      });
  }

  compareValues(originalValue: any, previousValue: any): boolean {
    if (typeof originalValue !== typeof previousValue) {
      return false; // Different types, not equal
    }

    if (Array.isArray(originalValue)) {
      if (
        !Array.isArray(previousValue) ||
        originalValue.length !== previousValue.length
      ) {
        return false; // Arrays are of different lengths
      }

      // Compare array elements recursively
      for (let i = 0; i < originalValue.length; i++) {
        if (!this.compareValues(originalValue[i], previousValue[i])) {
          return false; // Arrays contain different values
        }
      }
      return true; // Arrays are equal
    } else if (typeof originalValue === 'object' && originalValue !== null) {
      // Compare objects recursively
      const keys1 = Object.keys(originalValue);
      const keys2 = Object.keys(previousValue);
      if (keys1.length !== keys2.length) {
        return false; // Objects have different number of keys
      }

      for (const key of keys1) {
        if (!this.compareValues(originalValue[key], previousValue[key])) {
          return false; // Objects have different values for same keys
        }
      }
      return true; // Objects are equal
    } else {
      // For strings, numbers, and other primitive types, use simple comparison
      return originalValue === previousValue;
    }
  }

  handleBtnClick(fieldName) {
    this.individualFieldHistory = [];
    Object.keys(this.isHistoryPopup).forEach((key) => {
      if (key !== fieldName) {
        this.isHistoryPopup[key] = false;
      }
    });
    this.isHistoryPopup[fieldName] = true;
    this.showSpinner = true;
    if (this.isHistoryPopup[fieldName]) {
      const fieldHistory = this.historyList.find(
        (ele) => ele.fieldName === fieldName,
      );
      if (fieldHistory) {
        this.individualFieldHistory = fieldHistory.history;
      }
    }
    this.showSpinner = false;
  }

  onMouseOut(fieldName) {
    this.individualFieldHistory = [];
    this.isHistoryPopup[fieldName] = false;
  }

  refreshFieldMapppingValueANDHistory() {
    const obj = {
      releaseNodeId: this.nodeId || null,
    };
    this.http
      .getFieldMappingsWithHistory(
        this.selectedToolConfig[0].id,
        this.kpiId,
        obj,
      )
      .subscribe((mappings) => {
        if (mappings && mappings['success']) {
          this.formData = mappings['data'].fieldMappingResponses;
          this.metaDataTemplateCode = mappings['data'].metaTemplateCode;
          this.ngOnInit();
          // After reinitializing the form and dynamic fields, mark the form as pristine
          // so the UI reflects the loaded state. Dynamic field controls have been recreated
          // with proper values from the mapping structure.
          this.form.markAsPristine();
          this.form.markAsUntouched();
          this.form.updateValueAndValidity();
          this.sharedService.setSelectedFieldMapping(mappings['data']);
        }
      });
  }
}
