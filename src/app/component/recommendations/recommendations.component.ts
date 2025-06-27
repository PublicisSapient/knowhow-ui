import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { HttpService } from 'src/app/services/http.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css'],
})
export class RecommendationsComponent implements OnInit {
  displayModal: boolean = false;
  modalDetails = {
    tableHeadings: [],
    tableValues: [],
    kpiId: '',
  };
  recommendationsData: Array<object> = [];
  tabs: Array<string> = [];
  tabsContent: object = {};
  maturities: Array<object> = [];
  filteredMaturity;
  @Input() filterData = {};
  @Input() kpiList = [];
  noRecommendations: boolean = false;
  selectedSprint: object = {};
  loading: boolean = false;
  aiRecommendations: boolean = true;

  selectedRole: any = null;
  isRoleSelected: boolean = false;
  roleOptions = [
    { label: 'Executive Sponsor', value: 'executive_sponsor' },
    { label: 'Agile Program Manager', value: 'agile_program_manager' },
    { label: 'Engineering Lead', value: 'engineering_lead' },
  ];

  sprintOptions = [];
  selectedSprints: any[] = [];
  selectedCurrentProjectSprintsCode: any[] = [];
  isSprintSelected: boolean = false;
  allSprints: any;
  kpiFilterData: any;
  isLoading: boolean = false;
  isReportGenerated: boolean = false;
  currentProjectName: string;
  projectScore: number = 0;
  recommendationsList: object[] = [];
  currentDate: string = '';
  recommendationType: any;
  formattedPersona: any;
  isError: boolean = false;
  isTemplateLoading: boolean = false;

  @ViewChild('loadingScreen') loadingScreen: ElementRef;
  @ViewChild('generatedReport') generatedReport: ElementRef;

  private destroy$ = new Subject<void>();
  private cancelCurrentRequest$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    private messageService: MessageService,
    public service: SharedService,
  ) {}

  ngOnInit(): void {}

  getDialogHeader(): string {
    if (this.aiRecommendations) {
      return this.isReportGenerated
        ? 'AI Recommendations Report'
        : 'Generate AI Recommendation';
    } else {
      return 'Recommendations for Optimising KPIs';
    }
  }

  getCleanRecommendationType(rec: any): string {
    return rec?.replace(/^["']|["']$/g, '') || '';
  }

  handleClick() {
    this.selectedSprint = this.service.getSprintForRnR();
    this.allSprints = this.service.getCurrentProjectSprints();
    this.currentProjectName = JSON.parse(
      localStorage.getItem('selectedTrend'),
    )[0]?.nodeDisplayName;
    this.sprintOptions = this.allSprints.map((x) => ({
      name: x['nodeDisplayName'],
      code: x['nodeId'],
    }));
    this.currentDate = this.getCurrentDateFormatted();

    this.displayModal = true;
    this.kpiFilterData = JSON.parse(JSON.stringify(this.filterData));
    this.kpiFilterData['kpiIdList'] = [...this.kpiList];
    this.kpiFilterData['selectedMap'] = this.kpiFilterData['selectedMap'] || {};
    this.kpiFilterData['selectedMap']['project'] = [
      Array.isArray(this.selectedSprint?.['parentId'])
        ? this.selectedSprint?.['parentId']?.[0]
        : this.selectedSprint?.['parentId'],
    ];
    this.kpiFilterData['selectedMap']['sprint'] = [
      this.selectedSprint?.['nodeId'],
    ];
    this.loading = true;
    this.maturities = [];
    this.tabs = [];
    this.tabsContent = {};
    this.isTemplateLoading = true;
    this.isReportGenerated = false;
    this.httpService.getRecommendations(this.kpiFilterData).subscribe(
      (response: any) => {
        this.aiRecommendations = false;
        this.isTemplateLoading = false;
        if (response.message === 'AiRecommendation')
          this.aiRecommendations = true;
        else {
          this.aiRecommendations = false;
          if (response?.length > 0) {
            response.forEach((recommendation) => {
              if (this.selectedSprint['nodeId'] == recommendation['sprintId']) {
                if (recommendation?.['recommendations']?.length > 0) {
                  this.recommendationsData = recommendation['recommendations'];
                  this.recommendationsData.forEach((item) => {
                    let idx = this.maturities?.findIndex(
                      (x) => x['value'] == item['maturity'],
                    );
                    if (idx == -1 && item['maturity']) {
                      this.maturities = [
                        ...this.maturities,
                        {
                          name: 'M' + item['maturity'],
                          value: item['maturity'],
                        },
                      ];
                    } else {
                      this.maturities = [...this.maturities];
                    }
                    this.tabs = !this.tabs.includes(item['recommendationType'])
                      ? [...this.tabs, item['recommendationType']]
                      : [...this.tabs];
                    this.tabsContent[item['recommendationType']] = [];
                  });

                  this.recommendationsData.forEach((item) => {
                    this.tabsContent[item['recommendationType']] = [
                      ...this.tabsContent[item['recommendationType']],
                      item,
                    ];
                  });
                  this.noRecommendations = false;
                } else {
                  this.noRecommendations = true;
                }
              }
            });
          } else {
            this.noRecommendations = true;
          }
          this.loading = false;
        }
      },
      (error) => {
        console.error(error);
        this.isTemplateLoading = false;
        if (error.msg === 'AiRecommendation') this.aiRecommendations = true;
        else {
          this.aiRecommendations = false;
          this.messageService.add({
            severity: 'error',
            summary:
              'Error in Kpi Column Configurations. Please try after sometime!',
          });
          this.loading = false;
        }
      },
    );
  }

  selectAllSprints() {
    this.selectedSprints = [...this.sprintOptions];
    this.onSprintsSelection(this.selectedSprints);
  }

  focusDialogHeader() {
    setTimeout(() => {
      this.selectAllSprints();
    }, 300);
  }

  onDialogClose() {
    this.resetSelections();
    this.cancelCurrentRequest$.next();
  }

  onRoleChange(event) {
    this.selectedRole = event.value;
    this.isRoleSelected = !!this.selectedRole && this.selectedRole !== '';
    this.formattedPersona = this.roleOptions.filter((x) => {
      if (x.value === this.selectedRole) {
        return x;
      }
    });
  }

  onSprintsSelection(selectedItems: any[]) {
    this.selectedCurrentProjectSprintsCode = (selectedItems || [])
      .filter((item) => item && item.code)
      .map((item) => item.code);
    this.isSprintSelected = this.selectedCurrentProjectSprintsCode.length > 0;
  }

  generateSprintReport() {
    if (this.kpiFilterData) {
      this.kpiFilterData['recommendationFor'] = this.selectedRole;
      this.kpiFilterData['selectedMap']['sprint'] =
        this.selectedCurrentProjectSprintsCode;

      this.isReportGenerated = false;
      this.isLoading = true;
      if (this.isLoading && this.loadingScreen) {
        this.loadingScreen.nativeElement.focus();
      }
      this.isError = false;

      // --- send request body to backend to get sprint data response
      this.getSprintData(this.kpiFilterData);
    }
  }

  getSprintData(reqBody: any): void {
    this.isReportGenerated = false;
    this.cancelCurrentRequest$.next();
    this.httpService
      .getRecommendations(reqBody)
      .pipe(
        takeUntil(this.cancelCurrentRequest$),
        takeUntil(this.destroy$), // Also cancel on component destroy
        finalize(() => {
          // This runs whether completed, errored, or cancelled
          this.isLoading = false;
          this.onDialogClose();
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.isReportGenerated = true;
          if (!this.isLoading && this.generatedReport) {
            this.generatedReport.nativeElement.focus();
          }
          if (!this.isLoading && this.generatedReport) {
          this.generatedReport.nativeElement.focus();
        }
        this.isError = false;

          const resp = response?.data[0];
          this.projectScore = +resp?.projectScore || 0;
          this.recommendationsList = resp?.recommendations || [];
        },
        error: (err) => {
          console.error('Failed to fetch sprint recommendations:', err);
          this.isError = true;
          this.isLoading = false;
          this.isReportGenerated = false;
          this.projectScore = 0;
          this.recommendationsList = [];
          // Optionally: show a toast/alert to the user
        },
      });
  }

  resetSelections() {
    this.selectedRole = null;
    this.selectedSprints = [];
    this.selectedCurrentProjectSprintsCode = [];
    this.isRoleSelected = false;
    this.isSprintSelected = false;
    this.isError = false;
  }

  closeCancelLabel() {
    if (this.isReportGenerated) {
      return 'Close';
    }
    return 'Cancel';
  }

  getCurrentDateFormatted(): string {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.cancelCurrentRequest$.complete();
  }
}
