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

import { Component, OnInit } from '@angular/core';
import { GetAuthorizationService } from '../../services/get-authorization.service';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';

declare let $: any;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  isSuperAdmin = false;
  isProjectAdmin = false;
  changePswdDisabled = false;
  loginType = '';
  menuItems = [
    {
      label: 'My Profile',
      icon: 'fas fa-user-circle',
      routerLink: ['/dashboard/Config/Profile/MyProfile'],
      routerLinkActiveOptions: { exact: true },
    },
    {
      label: 'Grant Project Access',
      icon: 'fa fa-user-plus',
      routerLink: ['/dashboard/Config/Profile/GrantRequests'],
      routerLinkActiveOptions: { exact: true },
      visible: this.isSuperAdmin || this.isProjectAdmin,
    },
    {
      label: 'Grant User Access',
      icon: 'fa fa-unlock-alt',
      routerLink: ['/dashboard/Config/Profile/GrantNewUserAuthRequests'],
      routerLinkActiveOptions: { exact: true },
      visible: this.isSuperAdmin,
    },
    {
      label: 'Manage Access',
      icon: 'fa fa-universal-access',
      routerLink: ['/dashboard/Config/Profile/AccessMgmt'],
      routerLinkActiveOptions: { exact: true },
      visible: this.isSuperAdmin,
    },
    {
      label: 'Raise Request',
      icon: 'fa fa-unlock-alt',
      routerLink: ['/dashboard/Config/Profile/RaiseRequest'],
      routerLinkActiveOptions: { exact: true },
      visible: !this.isSuperAdmin,
    },
    {
      label: 'My Requests',
      icon: 'fa fa-address-card',
      routerLink: ['/dashboard/Config/Profile/RequestStatus'],
      routerLinkActiveOptions: { exact: true },
      visible: !this.isSuperAdmin,
    },
    {
      label: 'Change Password',
      icon: 'fa fa-key',
      routerLink: ['/dashboard/Config/Profile/UserSettings'],
      routerLinkActiveOptions: { exact: true },
      visible: this.loginType?.toLowerCase() === 'standard',
      disabled: this.changePswdDisabled,
    },
    {
      label: 'Auto Approve',
      icon: 'fas fa-check-circle',
      routerLink: ['/dashboard/Config/Profile/AutoApprove'],
      routerLinkActiveOptions: { exact: true },
      visible: this.isSuperAdmin,
    },
  ];

  constructor(
    private getAuthorizationService: GetAuthorizationService,
    public router: Router,
    private sharedService: SharedService,
  ) {}

  ngOnInit() {
    if (this.getAuthorizationService.checkIfSuperUser()) {
      // logged in as SuperAdmin
      this.isSuperAdmin = true;
    }

    if (this.getAuthorizationService.checkIfProjectAdmin()) {
      this.isProjectAdmin = true;
    }
    // this.sharedService.currentUserDetailsObs.subscribe(details=>{
    if (
      this.sharedService.getCurrentUserDetails() &&
      !this.sharedService.getCurrentUserDetails('user_email')
    ) {
      this.changePswdDisabled = true;
    }
    //   })

    this.loginType = this.sharedService.getCurrentUserDetails('authType');
  }
}
