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
 *******************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { QualityDashboardComponent } from './quality-dashboard.component';
import { SonarQubeService } from '../../services/sonarqube.service';

describe('QualityDashboardComponent', () => {
  let component: QualityDashboardComponent;
  let fixture: ComponentFixture<QualityDashboardComponent>;
  let sonarQubeService: jasmine.SpyObj<SonarQubeService>;

  beforeEach(async () => {
    const sonarQubeServiceSpy = jasmine.createSpyObj('SonarQubeService', [
      'getConfig',
      'getAllComponents',
      'getQualityGateStatus',
      'buildComponentTree',
      'filterComponentsByHealth',
    ]);

    await TestBed.configureTestingModule({
      declarations: [QualityDashboardComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [{ provide: SonarQubeService, useValue: sonarQubeServiceSpy }],
    }).compileComponents();

    sonarQubeService = TestBed.inject(
      SonarQubeService,
    ) as jasmine.SpyObj<SonarQubeService>;
  });

  beforeEach(() => {
    sonarQubeService.getConfig.and.returnValue({
      serverUrl: 'https://sonarqube.example.com',
      projectKey: 'ENGINEERING.KPIDASHBOARD.UI',
    });
    sonarQubeService.getAllComponents.and.returnValue(of([]));
    sonarQubeService.getQualityGateStatus.and.returnValue(of(null));
    sonarQubeService.buildComponentTree.and.returnValue([]);

    fixture = TestBed.createComponent(QualityDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init when config is available', () => {
    fixture.detectChanges();
    expect(sonarQubeService.getAllComponents).toHaveBeenCalled();
    expect(sonarQubeService.getQualityGateStatus).toHaveBeenCalled();
  });

  it('should show config dialog when no server URL is configured', () => {
    sonarQubeService.getConfig.and.returnValue({
      serverUrl: '',
      projectKey: 'ENGINEERING.KPIDASHBOARD.UI',
    });
    component.ngOnInit();
    expect(component.showConfigDialog).toBe(true);
  });

  it('should calculate health distribution correctly', () => {
    const mockComponents = [
      { healthStatus: 'excellent', healthScore: 95 } as any,
      { healthStatus: 'good', healthScore: 80 } as any,
      { healthStatus: 'fair', healthScore: 65 } as any,
    ];
    component.components = mockComponents;
    component.calculateHealthDistribution();
    expect(component.healthDistribution.length).toBe(5);
  });

  it('should filter components by health status', () => {
    const mockComponents = [
      { healthStatus: 'excellent' } as any,
      { healthStatus: 'poor' } as any,
    ];
    component.components = mockComponents;
    component.selectedHealthFilter = 'excellent';
    sonarQubeService.filterComponentsByHealth.and.returnValue([
      mockComponents[0],
    ]);
    const filtered = component.getFilteredComponents();
    expect(sonarQubeService.filterComponentsByHealth).toHaveBeenCalledWith(
      mockComponents,
      'excellent',
    );
  });

  it('should export data to CSV', () => {
    const createElementSpy = spyOn(document, 'createElement').and.returnValue({
      click: jasmine.createSpy('click'),
      href: '',
      download: '',
    } as any);

    component.components = [
      {
        component: { name: 'Test', path: 'src/test' },
        healthScore: 85,
        healthStatus: 'good',
        metrics: {
          bugs: 0,
          vulnerabilities: 0,
          codeSmells: 5,
          coverage: 80,
          duplicatedLinesDensity: 2,
          lines: 100,
        },
      } as any,
    ];

    component.exportToCSV();
    expect(createElementSpy).toHaveBeenCalledWith('a');
  });
});
