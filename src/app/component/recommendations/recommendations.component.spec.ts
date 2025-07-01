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
  let httpSpy;

  beforeEach(async () => {
    httpSpy = jasmine.createSpyObj('HttpService', [
      'getRecommendations',
      'shareViaEmail',
    ]);
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

    // Mock the DOM element
    const element = document.createElement('div');
    element.id = 'generatedReport';
    document.body.appendChild(element);
  });

  afterEach(() => {
    httpSpy.getRecommendations.calls.reset();
    httpSpy.shareViaEmail.calls.reset();
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

  it('should call getRecommendations and handle success response', () => {
    const reqBody = {
      level: 5,
      label: 'project',
      selectedMap: {
        bu: [],
        ver: [],
        acc: [],
        port: [],
        project: ['a4fbe170-8667-4878-a877-a1b1300d8b16'],
        sprint: [
          '54130_a4fbe170-8667-4878-a877-a1b1300d8b16',
          '54131_a4fbe170-8667-4878-a877-a1b1300d8b16',
        ],
        release: [],
        sqd: [],
      },
      ids: ['a4fbe170-8667-4878-a877-a1b1300d8b16'],
      sprintIncluded: ['CLOSED'],
      kpiIdList: ['kpi14', 'kpi82', 'kpi111'],
      recommendationFor: 'agile_program_manager',
    };
    const response = {
      data: [
        {
          projectScore: 10,
          recommendations: [
            { recommendationType: 'rec1' },
            { recommendationType: 'rec2' },
          ],
        },
      ],
    };
    httpSpy.getRecommendations.and.returnValue(of(response));

    component.getSprintData(reqBody);

    expect(component.isLoading).toBe(false);
    expect(component.projectScore).toBe(10);
    expect(component.recommendationsList).toEqual([
      { recommendationType: 'rec1' },
      { recommendationType: 'rec2' },
    ]);
  });

  it('should call getRecommendations and handle error response', () => {
    const reqBody = {
      /* mock request body */
    };
    const error = { error: 'Mock error' };
    httpSpy.getRecommendations.and.returnValue(throwError(error));

    component.getSprintData(reqBody);

    expect(component.isLoading).toBe(false);
    expect(component.isError).toBe(true);
    expect(component.projectScore).toBe(0);
    expect(component.recommendationsList).toEqual([]);
  });

  it('should cancel ongoing request when component is destroyed', () => {
    const reqBody = {
      /* mock request body */
    };
    httpSpy.getRecommendations.and.returnValue(of({}));

    component.getSprintData(reqBody);
    component.ngOnDestroy();

    // expect(component.cancelCurrentRequest$.closed).toBe(true);
  });

  // ==========================================================

  it('should toggle toShareViaEmail when openShareEmailField is called', () => {
    component.toShareViaEmail = false;
    component.openShareEmailField();
    expect(component.toShareViaEmail).toBeTrue();

    component.openShareEmailField();
    expect(component.toShareViaEmail).toBeFalse();
  });

  // -- TODO: will look into it later - due time
  xit('should validate email and update invalidEmails list', () => {
    const validEmailEvent = {
      value: '<a href="mailto:test@example.com">test@example.com</a>',
    };
    const invalidEmailEvent = { value: 'invalid-email' };

    component.validateEmail(validEmailEvent);
    expect(component.invalidEmails).not.toContain(validEmailEvent.value);

    component.validateEmail(invalidEmailEvent);
    expect(component.invalidEmails).toContain(invalidEmailEvent.value);
  });

  it('should remove email from invalidEmails list on onEmailRemove', () => {
    const emailEvent = {
      value: '<a href="mailto:test@example.com">test@example.com</a>',
    };
    component.invalidEmails = [
      '<a href="mailto:test@example.com">test@example.com</a>',
    ];

    component.onEmailRemove(emailEvent);
    expect(component.invalidEmails).not.toContain(emailEvent.value);
  });

  it('should call shareViaEmail and show success message on successful email share', () => {
    httpService.shareViaEmail.and.returnValue(of({ success: true, data: {} }));

    component.shareRecommendationViaEmail('pdfData');
    expect(httpService.shareViaEmail).toHaveBeenCalled();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'PDF uploaded successfully.',
    });
  });

  it('should show error message on failed email share', () => {
    httpService.shareViaEmail.and.returnValue(throwError({ message: 'Error' }));

    component.shareRecommendationViaEmail('pdfData');
    expect(httpService.shareViaEmail).toHaveBeenCalled();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
    });
  });

  // -- TODO: will look into it later - due time
  xit('should export as PDF and call shareRecommendationViaEmail if not toDownload', fakeAsync(() => {
    spyOn(component, 'shareRecommendationViaEmail');
    component.exportAsPDF(false);
    tick(1000); // Simulate async completion

    expect(component.shareRecommendationViaEmail).toHaveBeenCalled();
  }));
});
