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
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { HttpService } from './http.service';
import { SharedService } from './shared.service';

@Injectable()
export class Logged implements Resolve<any> {
  constructor(
    private router: Router,
    private sharedService: SharedService,
    private httpService: HttpService,
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const currentUserDetails = this.sharedService.currentUserDetails;
    if (currentUserDetails && currentUserDetails['authorities']) {
      this.router.navigate(['/dashboard']);
    }
    return false;
  }
}
