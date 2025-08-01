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

import { Injectable, NgModule } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
  HttpResponse,
  HTTP_INTERCEPTORS,
  HttpEvent,
} from '@angular/common/http';
import { GetAuthService } from '../services/getauth.service';
import { SharedService } from '../services/shared.service';
import { catchError, tap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import * as uuid from 'uuid';
import { HttpService } from '../services/http.service';
declare let $: any;

@Injectable()
export class HttpsRequestInterceptor implements HttpInterceptor {
  constructor(
    private getAuth: GetAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private service: SharedService,
    private httpService: HttpService,
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const httpErrorHandler = req.headers.get('httpErrorHandler') || 'global';
    const requestArea = req.headers.get('requestArea') || 'internal';

    if (environment.AUTHENTICATION_SERVICE) {
      let cookie = document.cookie?.split(';');
      let authCookie_EXPIRY = cookie?.find((x) =>
        x.includes('authCookie_EXPIRY'),
      );
      authCookie_EXPIRY = authCookie_EXPIRY?.split('=')[1];
      if (!authCookie_EXPIRY) {
        this.redirectToLogin();
      }
    }

    if (req.headers.get('httpErrorHandler')) {
      req = req.clone({ headers: req.headers.delete('httpErrorHandler') });
    }

    req = req.clone({ withCredentials: true });

    if (req.headers.get('requestArea')) {
      req = req.clone({ headers: req.headers.delete('requestArea') });
    }

    if (
      req.url.indexOf('upload') === -1 &&
      req.url.indexOf('emm-feed') === -1 &&
      !req.headers.has('Content-Type')
    ) {
      req = req.clone({
        headers: req.headers.set('Content-Type', ['application/json']),
      });
    } else if (req.url.indexOf('emm-feed') !== -1) {
      req = req.clone({
        headers: req.headers.set('Content-Type', ['text/csv']),
      });
    }
    const requestId = uuid.v4();
    const reqUrl = req.url;
    req = req.clone({ headers: req.headers.set('request-Id', requestId) });

    const redirectExceptions = [
      environment.baseUrl + '/api/jenkins/kpi',
      environment.baseUrl + '/api/zypher/kpi',
      environment.baseUrl + '/api/jira/kpi',
      environment.baseUrl + '/api/bitbucket/kpi',
      environment.baseUrl + '/api/sonar/kpi',
      environment.baseUrl + '/api/newrelic/kpi',
      environment.baseUrl + '/api/jirakanban/kpi',
      environment.baseUrl + '/api/sonarkanban/kpi',
      environment.baseUrl + '/api/jenkinskanban/kpi',
      environment.baseUrl + '/api/zypherkanban/kpi',
      environment.baseUrl + '/api/bitbucketkanban/kpi',
      environment.baseUrl + '/api/auth-types',
    ];

    const partialRedirectExceptions = [
      environment.baseUrl + '/api/sonar/project',
      environment.baseUrl + '/api/userinfo',
      environment.baseUrl + '/api/jenkins/jobName',
      environment.baseUrl + '/api/reports?createdBy=',
    ];

    // handling error response
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          /**Todo: Not autochanging the user role on role change. User will have to manually logout when his/her role is changed.
           * Currently commiting this code as per comment on ticket DTS-30823 */
          // if(!event?.url?.includes('api/authdetails') &&
          // ((event.headers.has('auth-details-updated') &&  event.headers.get('auth-details-updated') === 'true')  || (event.headers.has('Auth-Details-Updated') &&  event.headers.get('Auth-Details-Updated') === 'true')) && this.service.getCurrentUserDetails('authorities')){
          //     this.httpService.getAuthDetails();
          // }
        }
      }),
      catchError((err) => {
        if (
          reqUrl.indexOf('kpiRecommendation') !== -1 ||
          reqUrl.indexOf('notifications') !== -1 ||
          reqUrl.indexOf('kpisearch') !== -1
        ) {
          // Return error as successful response instead of throwing
          return of(
            new HttpResponse({
              body: {
                error: true,
                message: err.error.message,
                status: err.error.status,
                originalError: err.error,
              },
              status: 200, // Return as successful response
              url: req.url,
            }),
          );
        }
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            if (requestArea === 'internal') {
              if (environment?.['SSO_LOGIN']) {
                this.httpService.setCurrentUserDetails({});
                console.log('SSO_LOGIN', true);
                let redirect_uri = window.location.href;
                window.location.href =
                  environment.CENTRAL_LOGIN_URL +
                  '?redirect_uri=' +
                  redirect_uri;
              } else {
                if (environment.AUTHENTICATION_SERVICE) {
                  this.redirectToLogin();
                } else {
                  this.httpService.setCurrentUserDetails({});
                  this.router.navigate(['./authentication/login'], {
                    queryParams: this.route.snapshot.queryParams,
                  });
                }
              }
            }

            if (environment?.['SSO_LOGIN']) {
              this.router
                .navigate(['./dashboard/my-knowhow'])
                .then((success) => {
                  window.location.reload();
                });
            }
          } else if (err.status === 403 && environment?.['SSO_LOGIN']) {
            this.httpService.unauthorisedAccess = true;
            this.router.navigate(['/dashboard/unauthorized-access']);
          } else {
            if (
              err?.status === 0 &&
              err?.statusText === 'Unknown Error' &&
              environment.SSO_LOGIN
            ) {
              this.service.clearAllCookies();
              this.router
                .navigate(['./dashboard/my-knowhow'])
                .then((success) => {
                  window.location.reload();
                });
            } else {
              if (httpErrorHandler !== 'local') {
                if (requestArea === 'internal') {
                  if (
                    !redirectExceptions.includes(req.url) &&
                    !this.checkForPartialRedirectExceptions(
                      req.url,
                      partialRedirectExceptions,
                    )
                  ) {
                    if (
                      !environment?.['SSO_LOGIN'] ||
                      (environment.SSO_LOGIN && !req.url.includes('api/sso/'))
                    ) {
                      this.router.navigate(['./dashboard/Error']);
                    }
                  }
                }
              }
            }
          }
        }
        // error thrown here needs to catch in  error block of subscribe
        return throwError(err);
      }),
    );
  }

  checkForPartialRedirectExceptions(url, exceptionsArr) {
    let result = false;
    exceptionsArr.forEach((element) => {
      if (url.indexOf(element) !== -1) {
        result = true;
      }
    });
    return result;
  }

  redirectToLogin() {
    /** redirect to central login url*/
    let redirect_uri = window.location.href;
    localStorage.setItem('redirect_uri', JSON.stringify(redirect_uri));
    if (environment.CENTRAL_LOGIN_URL) {
      window.location.href =
        environment.CENTRAL_LOGIN_URL + '?redirect_uri=' + redirect_uri;
    }
  }
}

@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpsRequestInterceptor,
      multi: true,
    },
  ],
})
export class InterceptorModule {}
