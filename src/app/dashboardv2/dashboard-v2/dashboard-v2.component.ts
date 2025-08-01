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
  ChangeDetectorRef,
  AfterContentInit,
  ViewChild,
} from '@angular/core';
import { GetAuthService } from '../../services/getauth.service';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';
import { HttpService } from 'src/app/services/http.service';
import { NavNewComponent } from '../nav-v2/nav-new.component';

@Component({
  selector: 'app-dashboard-v2',
  templateUrl: './dashboard-v2.component.html',
  styleUrls: ['./dashboard-v2.component.css'],
})

/**
 Route the path from app-route and redirect to dashboard
 */
export class DashboardV2Component implements AfterContentInit {
  displayModal = false;
  modalDetails = {
    header: 'User Request Approved',
    content:
      'Click on "Continue" to reflect the changes happened from requested Role change.',
  };

  authorized = true;
  isApply = false;
  headerStyle;
  sideNavStyle;
  goToTopButton: HTMLElement;
  selectedTab;
  refreshCounter: number = 0;

  @ViewChild('kpiSearchQuery') navNewComponent!: NavNewComponent;

  constructor(
    public cdRef: ChangeDetectorRef,
    public router: Router,
    private getAuth: GetAuthService,
    public service: SharedService,
    public httpService: HttpService,
  ) {
    this.sideNavStyle = { toggled: this.isApply };
    this.authorized = this.getAuth.checkAuth();

    this.service.onTabSwitch.subscribe((data) => {
      if (data?.selectedBoard) {
        this.selectedTab = data.selectedBoard;
      }
    });

    this.httpService.getAllProjects().subscribe((projectsData) => {
      if (
        projectsData[0] !== 'error' &&
        !projectsData.error &&
        projectsData?.data
      ) {
        localStorage.setItem(
          'projectWithHierarchy',
          JSON.stringify(projectsData?.data),
        );
      }
    });
  }

  ngAfterContentInit() {
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this.isApply = false;
  }

  /**
   * Update the KPISearchQuery data in navNewComponent and send the searchDataQuery to shared service
   * @param searchDataQuery KPISearchQuery data from navNewComponent
   */
  receiveKPISearchQuery(searchDataQuery) {
    if (this.navNewComponent) {
      this.navNewComponent.updateDataDirectly(searchDataQuery);
      this.service.updateValue(searchDataQuery);
    }
  }
}
