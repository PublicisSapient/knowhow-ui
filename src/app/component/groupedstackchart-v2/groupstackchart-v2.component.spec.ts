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
import { GroupstackchartComponentv2 } from './groupstackchart-v2.component';
import { SharedService } from 'src/app/services/shared.service';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';

describe('GroupstackchartComponentv2', () => {
  let component: GroupstackchartComponentv2;
  let fixture: ComponentFixture<GroupstackchartComponentv2>;
  let sharedService: jasmine.SpyObj<SharedService>;
  let mockResizeObserver: jasmine.SpyObj<ResizeObserver>;

  beforeEach(async () => {
    const sharedServiceSpy = jasmine.createSpyObj('SharedService', [
      'getSelectedDateFilter',
    ]);

    // Mock ResizeObserver globally
    mockResizeObserver = jasmine.createSpyObj('ResizeObserver', [
      'observe',
      'unobserve',
      'disconnect',
    ]);

    (window as any).ResizeObserver = jasmine
      .createSpy('ResizeObserver')
      .and.returnValue(mockResizeObserver);

    await TestBed.configureTestingModule({
      declarations: [GroupstackchartComponentv2],
      providers: [{ provide: SharedService, useValue: sharedServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    sharedService = TestBed.inject(
      SharedService,
    ) as jasmine.SpyObj<SharedService>;
    fixture = TestBed.createComponent(GroupstackchartComponentv2);
    component = fixture.componentInstance;

    // Properly initialize the component to avoid ResizeObserver errors
    component.elem = document.createElement('div');
    component.data = [];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('renderSprintsLegend', () => {
    it('should render legend with correct structure', () => {
      const mockElem = document.createElement('div');
      component.elem = mockElem;

      const legendData = [
        { sprintNumber: 1, sprintLabel: 'Sprint 1' },
        { sprintNumber: 2, sprintLabel: 'Sprint 2' },
      ];
      const xAxisCaption = 'Sprint';

      component.renderSprintsLegend(legendData, xAxisCaption);

      const legendContainer = mockElem.querySelector(
        '.sprint-legend-container',
      );
      expect(legendContainer).toBeTruthy();
    });

    it('should not render if elem is null', () => {
      component.elem = null;
      const legendData = [{ sprintNumber: 1, sprintLabel: 'Sprint 1' }];

      expect(() =>
        component.renderSprintsLegend(legendData, 'Sprint'),
      ).not.toThrow();
    });

    it('should not render if data is null', () => {
      const mockElem = document.createElement('div');
      component.elem = mockElem;

      expect(() => component.renderSprintsLegend(null, 'Sprint')).not.toThrow();
    });
  });
});
