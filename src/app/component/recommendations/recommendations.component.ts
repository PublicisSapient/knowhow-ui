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
    { label: 'Manager', value: 'manager' },
    { label: 'Analyst', value: 'analyst' },
    { label: 'Developer', value: 'developer' },
    { label: 'Other', value: 'other' },
  ];

  periodOptions = [
    { label: '1 week', value: 'one_week' },
    { label: '2 weeks', value: 'two_week' },
    { label: '4 weeks', value: 'four_week' },
    { label: '6 weeks', value: 'six_week' },
  ];
  selectedPeriod: any = null;
  isPeriodSelected: boolean = false;

  constructor(
    private httpService: HttpService,
    private messageService: MessageService,
    public service: SharedService,
  ) {}

  ngOnInit(): void {}

  handleClick() {
    this.selectedSprint = this.service.getSprintForRnR();
    this.displayModal = true;
    let kpiFilterData = JSON.parse(JSON.stringify(this.filterData));
    kpiFilterData['kpiIdList'] = [...this.kpiList];
    kpiFilterData['selectedMap']['project'] = [
      Array.isArray(this.selectedSprint?.['parentId'])
        ? this.selectedSprint?.['parentId']?.[0]
        : this.selectedSprint?.['parentId'],
    ];
    kpiFilterData['selectedMap']['sprint'] = [this.selectedSprint?.['nodeId']];
    this.loading = true;
    this.maturities = [];
    this.tabs = [];
    this.tabsContent = {};
    this.httpService.getRecommendations(kpiFilterData).subscribe(
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
    );
  }

  focusDialogHeader() {}

  onDialogClose() {}

  onRoleChange(event) {
    this.selectedRole = event.value;
    this.isRoleSelected = !!this.selectedRole && this.selectedRole !== '';
  }

  onPeriodSelection(event) {
    this.selectedPeriod = event.value;
    this.isPeriodSelected = !!this.selectedPeriod && this.selectedPeriod !== '';
  }

  generateSprintReport() {
    this.selectedRole = null;
    this.selectedPeriod = null;

    const requestSprintDataBody = {
      selectedRole: this.selectedRole,
      selectedPeriod: this.selectedPeriod,
    };

    // --- send request body to backend to get sprint data response
    const sprintData = this.getSprintData(requestSprintDataBody);

    // --- transform the sprint data into acceptable request body for ai-recommendations api

    // --- send request to ai-recommendations api

    // --- handle the response
  }

  async getSprintData(reqBody) {
    const response = await fetch('http://localhost:3000/api/getSprintData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reqBody),
    });
    const data = await response.json();
    console.log(data);
    return data;
  }
}
