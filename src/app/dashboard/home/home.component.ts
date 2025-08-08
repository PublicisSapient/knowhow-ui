import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { SharedService } from 'src/app/services/shared.service';
import { HttpService } from 'src/app/services/http.service';
import { HelperService } from 'src/app/services/helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription, throwError } from 'rxjs';
import { catchError, distinctUntilChanged } from 'rxjs/operators';
import { MaturityComponent } from '../maturity/maturity.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  listOfMaturityData: Array<object> = [];

  columns = [];

  rows = [];
  menuItems: MenuItem[] | undefined;
  refreshCounter: number = 0;
  selectedTab = 'Overall';
  queryParamsSubscription!: Subscription;
  subscription = [];
  @ViewChild('maturityComponent')
  maturityComponent: MaturityComponent;

  constructor(
    private service: SharedService,
    private httpService: HttpService,
    private helperService: HelperService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
  ) {}

  ngOnInit(): void {
    this.menuItems = [
      {
        label: 'Settings',
        icon: 'fas fa-cog',
        command: () => {},
        disabled: false,
      },
      {
        label: 'List View',
        icon: 'pi pi-align-justify',
        command: ($event) => {},
        disabled: false,
      },
    ];

    this.listOfMaturityData = [
      {
        category: 'Critical Project',
        value: 100,
        icon: 'Watch.svg',
        totalIssues: 100,
      },
      {
        category: 'Active Project',
        value: 0.43,
        icon: 'visibility_on.svg',
        totalIssues: 100,
      },
      {
        category: 'Health Project',
        value: 12,
        icon: 'Check.svg',
        totalIssues: 100,
      },
      {
        category: 'Efficiency',
        value: 15,
        icon: 'Warning.svg',
        totalIssues: 100,
      },
      {
        category: 'Pass Rate',
        value: 15,
        icon: 'Warning.svg',
        totalIssues: 100,
      },
    ];

    this.columns = [
      { field: 'name', header: 'Project name' },
      { field: 'date', header: 'Date' },
      { field: 'manager', header: 'Manager' },
      { field: 'completion', header: 'Complete(%)' },
      { field: 'health', header: 'Overall health' },
      { field: 'speed', header: 'Speed' },
      { field: 'quality', header: 'Quality' },
      { field: 'value', header: 'Value' },
      { field: 'action', header: 'Action' },
    ];

    this.rows = [
      {
        name: 'Retail 3',
        date: '12 Apr - 23 Oct 2023',
        manager: { name: 'Deepti M', image: 'deepti.png' },
        completion: '73%',
        health: 'Healthy',
        speed: 'M1',
        quality: 'M3',
        value: 'M2',
      },
      {
        name: 'Retail 4',
        date: '30 Apr - 12 Dec 2023',
        manager: { name: 'Lakshmi Nayyar', image: 'lakshmi.png' },
        completion: '56%',
        health: 'Healthy',
        speed: 'M4',
        quality: 'M2',
        value: 'M2',
      },
      {
        name: 'Retail 2',
        date: '23 Apr - 21 Nov 2023',
        manager: { name: 'Avinash Rao', image: 'avinash.png' },
        completion: '86%',
        health: 'Critical',
        speed: 'M5',
        quality: 'M3',
        value: 'M5',
      },
    ];

    // this.route.queryParams.subscribe((params) => {
    //   if (!this.refreshCounter) {
    //     let stateFiltersParam = params['stateFilters'];
    //     let kpiFiltersParam = params['kpiFilters'];
    //     let tabParam = params['selectedTab'];
    //     if (!tabParam) {
    //       if (!this.service.getSelectedTab()) {
    //         let selectedTab = decodeURIComponent(this.location.path());
    //         selectedTab = selectedTab?.split('/')[2]
    //           ? selectedTab?.split('/')[2]
    //           : 'iteration';
    //         selectedTab = selectedTab?.split(' ').join('-').toLowerCase();
    //         this.selectedTab = selectedTab.split('?statefilters=')[0];
    //         this.service.setSelectedBoard(this.selectedTab);
    //       } else {
    //         this.selectedTab = this.service.getSelectedTab();
    //         this.service.setSelectedBoard(this.selectedTab);
    //       }
    //     } else {
    //       this.selectedTab = tabParam;
    //       this.service.setSelectedBoard(this.selectedTab);
    //     }
    //     if (stateFiltersParam?.length) {
    //       if (stateFiltersParam?.length <= 8 && kpiFiltersParam?.length <= 8) {
    //         this.httpService
    //           .handleRestoreUrl(stateFiltersParam, kpiFiltersParam)
    //           .pipe(
    //             catchError((error) => {
    //               this.router.navigate(['/dashboard/Error']); // Redirect to the error page
    //               setTimeout(() => {
    //                 this.service.raiseError({
    //                   status: 900,
    //                   message: error.message || 'Invalid URL.',
    //                 });
    //               });

    //               return throwError(error); // Re-throw the error so it can be caught by a global error handler if needed
    //             }),
    //           )
    //           .subscribe((response: any) => {
    //             if (response.success) {
    //               const longKPIFiltersString =
    //                 response.data['longKPIFiltersString'];
    //               const longStateFiltersString =
    //                 response.data['longStateFiltersString'];
    //               stateFiltersParam = atob(longStateFiltersString);

    //               if (longKPIFiltersString) {
    //                 const kpiFilterParamDecoded = atob(longKPIFiltersString);

    //                 const kpiFilterValFromUrl =
    //                   kpiFilterParamDecoded && JSON.parse(kpiFilterParamDecoded)
    //                     ? JSON.parse(kpiFilterParamDecoded)
    //                     : this.service.getKpiSubFilterObj();
    //                 this.service.setKpiSubFilterObj(kpiFilterValFromUrl);
    //               }

    //               this.urlRedirection(stateFiltersParam);
    //               this.refreshCounter++;
    //             }
    //           });
    //       } else {
    //         try {
    //           stateFiltersParam = atob(stateFiltersParam);
    //           if (kpiFiltersParam) {
    //             const kpiFilterParamDecoded = atob(kpiFiltersParam);
    //             const kpiFilterValFromUrl =
    //               kpiFilterParamDecoded && JSON.parse(kpiFilterParamDecoded)
    //                 ? JSON.parse(kpiFilterParamDecoded)
    //                 : this.service.getKpiSubFilterObj();
    //             this.service.setKpiSubFilterObj(kpiFilterValFromUrl);
    //           }

    //           this.urlRedirection(stateFiltersParam);
    //           this.refreshCounter++;
    //         } catch (error) {
    //           this.router.navigate(['/dashboard/Error']); // Redirect to the error page
    //           setTimeout(() => {
    //             this.service.raiseError({
    //               status: 900,
    //               message: 'Invalid URL.',
    //             });
    //           }, 100);
    //         }
    //       }
    //     }
    //   }
    // });

    this.subscription.push(
      this.service.passDataToDashboard
        .pipe(distinctUntilChanged())
        .subscribe((sharedobject) => {
          this.maturityComponent.receiveSharedData({
            masterData: sharedobject.masterData,
            filterdata: sharedobject.filterdata,
            filterApplyData: sharedobject.filterApplyData,
            dashConfigData: sharedobject.dashConfigData,
          });
        }),
    );
  }

  urlRedirection(decodedStateFilters) {
    const stateFiltersObjLocal = JSON.parse(decodedStateFilters);
    const currentUserProjectAccess = JSON.parse(
      localStorage.getItem('currentUserDetails'),
    )?.projectsAccess?.length
      ? JSON.parse(localStorage.getItem('currentUserDetails'))
          ?.projectsAccess[0]?.projects
      : [];
    const ifSuperAdmin = JSON.parse(
      localStorage.getItem('currentUserDetails'),
    )?.authorities?.includes('ROLE_SUPERADMIN');
    let stateFilterObj = [];
    let projectLevelSelected = false;
    if (
      typeof stateFiltersObjLocal['parent_level'] === 'object' &&
      stateFiltersObjLocal['parent_level'] &&
      Object.keys(stateFiltersObjLocal['parent_level']).length > 0
    ) {
      stateFilterObj = [stateFiltersObjLocal['parent_level']];
    } else {
      stateFilterObj = stateFiltersObjLocal['primary_level'];
    }

    projectLevelSelected =
      stateFilterObj?.length &&
      stateFilterObj[0]?.labelName?.toLowerCase() === 'project';

    // Check if user has access to all project in stateFiltersObjLocal['primary_level']
    const hasAllProjectAccess = stateFilterObj?.every((filter) =>
      currentUserProjectAccess?.some(
        (project) => project.projectId === filter.basicProjectConfigId,
      ),
    );

    // Superadmin have all project access hence no need to check project for superadmin
    const hasAccessToAll = ifSuperAdmin || hasAllProjectAccess;

    if (projectLevelSelected) {
      if (hasAccessToAll) {
        this.service.setBackupOfFilterSelectionState(stateFiltersObjLocal);
      } else {
        this.service.setBackupOfFilterSelectionState(null);
        this.queryParamsSubscription?.unsubscribe();
        this.router.navigate(['/dashboard/Error']);
        setTimeout(() => {
          this.service.raiseError({
            status: 901,
            message: 'No project access.',
          });
        }, 100);
      }
    }
  }

  getMClass(value: string) {
    const v = (value || '').toLowerCase();
    return {
      m1: 'm1',
      m2: 'm2',
      m3: 'm3',
      m4: 'm4',
      m5: 'm5',
      healthy: 'healthy',
      critical: 'critical',
    }[v];
  }

  ngOnDestroy() {
    this.subscription.forEach((subscription) => subscription.unsubscribe());
  }
}
