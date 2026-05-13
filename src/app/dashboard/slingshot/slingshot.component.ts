import { Component, OnInit, OnDestroy } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { HttpService } from '../../services/http.service';
import { HelperService } from '../../services/helper.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-slingshot',
  templateUrl: './slingshot.component.html',
  styleUrls: ['./slingshot.component.css'],
})
export class SlingshotComponent implements OnInit, OnDestroy {
  selectedType = 'scrum';
  selectedTab = 'slingshot';
  subscriptions: Subscription[] = [];
  dynamicKpis: any[] = [];
  kpiLoader = new Set();
  kpiTrendsObj = {};
  kpiStatusCodeArr = {};
  kpiChartData = {};
  trendBoxColorObj = {};
  showChart = 'chart';

  selectedProject: any = null;
  selectedSprint: any = null;
  filterApplyData: any = {};
  filterData: any = [];
  colorObj: any = {};

  topTilesData = [
    {
      category: 'Active Projects',
      value: '12',
      icon: 'pi-users',
      iconColor: '#6366f1',
      average: 'N/A',
    },
    {
      category: 'Avg. Score',
      value: '85%',
      icon: 'pi-gauge',
      iconColor: '#10b981',
      average: 'N/A',
    },
    {
      category: 'Critical Projects',
      value: '3',
      icon: 'pi-exclamation-triangle',
      iconColor: '#ef4444',
      average: '25%',
    },
    {
      category: 'Healthy Projects',
      value: '9',
      icon: 'pi-heart-fill',
      iconColor: '#10b981',
      average: '75%',
    },
  ];

  kpiWidgets = [
    {
      id: 1,
      title: 'New Cycle Time',
      data: [
        { label: 'Current Sprint', value: '45 SP', color: '#6366f1' },
        { label: 'Average Velocity', value: '42 SP', color: '#10b981' },
        { label: 'Target', value: '50 SP', color: '#f59e0b' },
      ],
    },
  ];

  bottomTilesData = [
    {
      category: 'Top 4 Risks this Quarter',
      value: [
        { property: 'Project Alpha', value: '45%' },
        { property: 'Project Beta', value: '52%' },
        { property: 'Project Gamma', value: '58%' },
        { property: 'Project Delta', value: '61%' },
      ],
      icon: false,
      color: '#cdba38',
    },
    {
      category: 'Positive Trends',
      value: [
        { property: 'Code Quality', value: '12.5%' },
        { property: 'Test Coverage', value: '8.3%' },
        { property: 'Deployment Frequency', value: '15.7%' },
        { property: 'Team Velocity', value: '6.2%' },
      ],
      icon: 'pi-arrow-up',
      color: '#15ba40',
    },
    {
      category: 'Negative Trends',
      value: [
        { property: 'Bug Rate', value: '9.1%' },
        { property: 'Lead Time', value: '7.5%' },
        { property: 'Technical Debt', value: '11.2%' },
        { property: 'Defect Density', value: '5.8%' },
      ],
      icon: 'pi-arrow-down',
      color: '#eb3d4b',
    },
  ];

  constructor(
    private sharedService: SharedService,
    private httpService: HttpService,
    private helperService: HelperService,
  ) {}

  ngOnInit(): void {
    this.selectedType = this.sharedService.getSelectedType() || 'scrum';
    this.selectedTab = this.sharedService.getSelectedTab() || 'slingshot';

    // Ensure global state is updated on refresh
    this.sharedService.setSelectedBoard(this.selectedTab);
    this.sharedService.setScrumKanban(this.selectedType);

    this.subscriptions.push(
      this.sharedService.onTabSwitch.subscribe((data) => {
        this.selectedTab = data.selectedBoard;
        this.updateDynamicKpis();
      }),
    );

    this.subscriptions.push(
      this.sharedService.globalDashConfigData.subscribe((globalConfig) => {
        this.dashConfigData = globalConfig;
        this.updateDynamicKpis();
      }),
    );

    this.subscriptions.push(
      this.sharedService.passDataToDashboard.subscribe((sharedobject) => {
        if (sharedobject?.filterData?.length) {
          this.filterData = sharedobject.filterData;
          this.filterApplyData = sharedobject.filterApplyData;
        }
      }),
    );

    this.subscriptions.push(
      this.sharedService.mapColorToProject.subscribe((colorObj) => {
        this.colorObj = colorObj;
        this.trendBoxColorObj = { ...colorObj };
      }),
    );
  }

  dashConfigData: any;

  updateDynamicKpis(): void {
    if (!this.dashConfigData) return;

    const allBoards = [
      ...(this.dashConfigData[this.selectedType] || []),
      ...(this.dashConfigData['others'] || []),
    ];

    const currentBoard = allBoards.find(
      (board) =>
        board.boardSlug?.toLowerCase() === this.selectedTab?.toLowerCase() ||
        board.boardName?.toLowerCase() === this.selectedTab?.toLowerCase(),
    );

    if (currentBoard && currentBoard.kpis) {
      this.dynamicKpis = currentBoard.kpis.filter((kpi) => kpi.shown);
    } else {
      this.dynamicKpis = [];
    }
  }

  onProjectChange(event: any): void {
    console.log('Project changed:', event.value);
    // Reset sprint selection when project changes
    this.selectedSprint = null;
    // Here you would typically fetch sprints for the selected project
  }

  onSprintChange(event: any): void {
    console.log('Sprint changed:', event.value);
    // Here you would typically fetch KPI data for the selected sprint
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
