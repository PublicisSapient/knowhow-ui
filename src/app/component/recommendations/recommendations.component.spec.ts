import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { RecommendationsComponent } from './recommendations.component';
import { HttpService } from 'src/app/services/http.service';
import { MessageService } from 'primeng/api';
import { SharedService } from 'src/app/services/shared.service';
import { of, throwError } from 'rxjs';

describe('RecommendationsComponent', () => {
  let component: RecommendationsComponent;
  let fixture: ComponentFixture<RecommendationsComponent>;
  let httpService: jasmine.SpyObj<HttpService>;
  let messageService: jasmine.SpyObj<MessageService>;
  let sharedService: jasmine.SpyObj<SharedService>;

  beforeEach(async () => {
    const httpSpy = jasmine.createSpyObj('HttpService', ['getRecommendations']);
    const messageSpy = jasmine.createSpyObj('MessageService', ['add']);
    const sharedSpy = jasmine.createSpyObj('SharedService', [
      'getSprintForRnR',
      'getCurrentProjectSprints',
    ]);

    await TestBed.configureTestingModule({
      declarations: [RecommendationsComponent],
      providers: [
        { provide: HttpService, useValue: httpSpy },
        { provide: MessageService, useValue: messageSpy },
        { provide: SharedService, useValue: sharedSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationsComponent);
    component = fixture.componentInstance;
    httpService = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
    messageService = TestBed.inject(
      MessageService,
    ) as jasmine.SpyObj<MessageService>;
    sharedService = TestBed.inject(
      SharedService,
    ) as jasmine.SpyObj<SharedService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.displayModal).toBeFalse();
    expect(component.recommendationsData).toEqual([]);
    expect(component.tabs).toEqual([]);
    expect(component.maturities).toEqual([]);
    expect(component.noRecommendations).toBeFalse();
    expect(component.isLoading).toBeFalse();
    expect(component.isReportGenerated).toBeFalse();
  });

  it('should return correct dialog header', () => {
    component.aiRecommendations = true;
    component.isReportGenerated = false;
    expect(component.getDialogHeader()).toBe('Generate AI Recommendation');

    component.isReportGenerated = true;
    expect(component.getDialogHeader()).toBe('AI Recommendations Report');

    component.aiRecommendations = false;
    expect(component.getDialogHeader()).toBe(
      'Recommendations for Optimising KPIs',
    );
  });

  it('should clean recommendation type', () => {
    expect(component.getCleanRecommendationType('"type"')).toBe('type');
    expect(component.getCleanRecommendationType("'type'")).toBe('type');
    expect(component.getCleanRecommendationType(null)).toBe('');
  });

  it('should reset selections on dialog close', () => {
    component.selectedRole = 'someRole';
    component.selectedSprints = ['sprint1'];
    component.selectedCurrentProjectSprintsCode = ['code1'];
    component.isRoleSelected = true;
    component.isSprintSelected = true;
    component.isReportGenerated = true;

    component.onDialogClose();

    expect(component.selectedRole).toBeNull();
    expect(component.selectedSprints).toEqual([]);
    expect(component.selectedCurrentProjectSprintsCode).toEqual([]);
    expect(component.isRoleSelected).toBeFalse();
    expect(component.isSprintSelected).toBeFalse();
  });

  it('should update role on role change', () => {
    const event = { value: 'executive_sponsor' };
    component.onRoleChange(event);

    expect(component.selectedRole).toBe('executive_sponsor');
    expect(component.isRoleSelected).toBeTrue();
  });

  it('should update selected sprints on selection', () => {
    const selectedItems = [{ code: 'sprint1' }, { code: 'sprint2' }];
    component.onSprintsSelection(selectedItems);

    expect(component.selectedCurrentProjectSprintsCode).toEqual([
      'sprint1',
      'sprint2',
    ]);
    expect(component.isSprintSelected).toBeTrue();
  });

  it('should generate sprint report', fakeAsync(() => {
    // Arrange
    component.selectedRole = 'executive_sponsor';
    component.selectedCurrentProjectSprintsCode = ['sprint1'];
    component.kpiFilterData = { selectedMap: {} };

    const mockResponse = { data: [{ projectScore: 85, recommendations: [] }] };
    httpService.getRecommendations.and.returnValue(of(mockResponse));

    // Act
    component.generateSprintReport();
    tick(); // Simulate async completion

    // Assert
    expect(httpService.getRecommendations).toHaveBeenCalledWith(
      component.kpiFilterData,
    );
    expect(component.isLoading).toBeFalse();
    expect(component.isReportGenerated).toBeTrue();
    expect(component.projectScore).toBe(85);
    expect(component.recommendationsList).toEqual([]);
  }));

  it('should format current date correctly', () => {
    const date = new Date();
    const expectedDate = `${String(date.getDate()).padStart(2, '0')}/${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}/${date.getFullYear()}`;
    expect(component.getCurrentDateFormatted()).toBe(expectedDate);
  });

  it('should handle click and set up data', () => {
    const sprint = {
      nodeId: '1',
      nodeDisplayName: 'Sprint 1',
      parentId: 'Project 1',
    };
    sharedService.getSprintForRnR.and.returnValue(sprint);
    sharedService.getCurrentProjectSprints.and.returnValue([sprint]);
    localStorage.setItem(
      'selectedTrend',
      JSON.stringify([{ nodeDisplayName: 'Project Name' }]),
    );

    const mockResponse = [
      {
        sprintId: '1',
        recommendations: [
          {
            maturity: 3,
            recommendationType: 'Type1',
            recommendationDetails: 'Details1',
          },
        ],
      },
    ];

    httpService.getRecommendations.and.returnValue(of(mockResponse));

    component.handleClick();

    expect(component.selectedSprint).toEqual(sprint);
    expect(component.currentProjectName).toBe('Project Name');
    expect(component.sprintOptions).toEqual([{ name: 'Sprint 1', code: '1' }]);
    expect(component.displayModal).toBeTrue();
    expect(component.isTemplateLoading).toBeFalse();
    expect(component.recommendationsData.length).toBeGreaterThan(0);
    expect(component.noRecommendations).toBeFalse();
  });

  it('should handle click and show no recommendations', () => {
    const sprint = {
      nodeId: '1',
      nodeDisplayName: 'Sprint 1',
      parentId: 'Project 1',
    };
    sharedService.getSprintForRnR.and.returnValue(sprint);
    sharedService.getCurrentProjectSprints.and.returnValue([sprint]);
    localStorage.setItem(
      'selectedTrend',
      JSON.stringify([{ nodeDisplayName: 'Project Name' }]),
    );

    const mockResponse = [
      {
        sprintId: '1',
        recommendations: [],
      },
    ];

    httpService.getRecommendations.and.returnValue(of(mockResponse));

    component.handleClick();

    expect(component.noRecommendations).toBeTrue();
  });

  it('should handle click and manage error', () => {
    const sprint = {
      nodeId: '1',
      nodeDisplayName: 'Sprint 1',
      parentId: 'Project 1',
    };
    sharedService.getSprintForRnR.and.returnValue(sprint);
    sharedService.getCurrentProjectSprints.and.returnValue([sprint]);
    localStorage.setItem(
      'selectedTrend',
      JSON.stringify([{ nodeDisplayName: 'Project Name' }]),
    );

    httpService.getRecommendations.and.returnValue(throwError({ status: 500 }));

    component.handleClick();

    expect(component.isTemplateLoading).toBeFalse();
    expect(component.aiRecommendations).toBeFalse();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error in Kpi Column Configurations. Please try after sometime!',
    });
  });
});
