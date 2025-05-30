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
import { Router } from '@angular/router';

@Component({
  selector: 'app-sso-auth-failure',
  templateUrl: './sso-auth-failure.component.html',
  styleUrls: ['./sso-auth-failure.component.css'],
})
export class SsoAuthFailureComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  reloadApp() {
    console.log('Reload App Called');
    this.router.navigate(['./dashboard/my-knowhow']).then((success) => {
      this.clearAllCookies();
      window.location.reload();
    });
  }

  clearAllCookies() {
    console.log('clear all cookie Called');
    const cookies = document.cookie.split(';');
    // set past expiry to all cookies
    for (const cookie of cookies) {
      document.cookie = cookie + '=; expires=' + new Date(0).toUTCString();
    }
  }
}
