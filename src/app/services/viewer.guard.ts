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

import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { GetAuthorizationService } from './get-authorization.service';
import { SharedService } from './shared.service';

@Injectable()
export class ViewerGuard implements CanActivate {
  hasAccess = <boolean>false;
  constructor(
    private router: Router,
    private getAuthorization: GetAuthorizationService,
    private sharedService: SharedService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (
      this.sharedService
        .getCurrentUserDetails('authorities')
        ?.includes('ROLE_VIEWER') == false &&
      this.sharedService
        .getCurrentUserDetails('authorities')
        ?.includes('ROLE_PROJECT_VIEWER') == false
    ) {
      this.hasAccess = true;
      return this.hasAccess;
    } else if (
      this.sharedService
        .getCurrentUserDetails('authorities')
        ?.includes('ROLE_PROJECT_VIEWER') == true ||
      this.sharedService
        .getCurrentUserDetails('authorities')
        ?.includes('ROLE_PROJECT_ADMIN') == true
    ) {
      this.hasAccess = true;
      return this.hasAccess;
    }

    this.router.navigate(['./dashboard/Config/Profile']);
    return this.hasAccess;
  }
}
