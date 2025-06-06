import { Component, Input, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
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
  @Input() aiRecommendations: boolean = true;

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

  handleClick() {
    this.selectedSprint = this.service.getSprintForRnR();
    this.allSprints = this.service.getCurrentProjectSprints();
    this.currentProjectName = JSON.parse(
      localStorage.getItem('selectedTrend'),
    )[0].nodeDisplayName;
    this.sprintOptions = this.allSprints.map((x) => ({
      name: x['nodeDisplayName'],
      code: x['nodeId'],
    }));
    this.currentDate = this.getCurrentDateFormatted();

    this.displayModal = true;
    this.kpiFilterData = JSON.parse(JSON.stringify(this.filterData));
    this.kpiFilterData['kpiIdList'] = [...this.kpiList];
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
    /* this.httpService.getRecommendations(this.kpiFilterData).subscribe(
      (response: Array<object>) => {
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
                      { name: 'M' + item['maturity'], value: item['maturity'] },
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
      },
      (error) => {
        console.log(error);
        this.messageService.add({
          severity: 'error',
          summary:
            'Error in Kpi Column Configurations. Please try after sometime!',
        });
        this.loading = false;
      },
    ); */
  }

  focusDialogHeader() {}

  onDialogClose() {
    this.resetSelections();
  }

  onRoleChange(event) {
    this.selectedRole = event.value;
    this.isRoleSelected = !!this.selectedRole && this.selectedRole !== '';
    this.formattedPersona = this.roleOptions.map((x) => {
      if (x.value === this.selectedRole) {
        return x.label;
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
    this.kpiFilterData['recommendationFor'] = this.selectedRole;
    this.kpiFilterData['selectedMap']['sprint'] =
      this.selectedCurrentProjectSprintsCode;

    this.isReportGenerated = false;
    this.isLoading = true;

    // --- send request body to backend to get sprint data response
    this.getSprintData(this.kpiFilterData);
  }

  getSprintData(reqBody) {
    this.httpService
      .getRecommendations(reqBody)
      .subscribe((response: Array<object>) => {
        this.isLoading = false;
        this.isReportGenerated = true;
        console.log('response => ', response);
        const resp: object = response[0];
        console.log('resp => ', resp);
        this.projectScore = +resp['projectScore'];
        this.recommendationsList = resp['recommendations'];
      });
  }

  resetSelections() {
    this.selectedRole = null;
    this.selectedSprints = [];
    this.selectedCurrentProjectSprintsCode = [];
    this.isRoleSelected = false;
    this.isSprintSelected = false;
    this.isReportGenerated = false;
  }

  getCurrentDateFormatted(): string {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
