import { EventEmitter, Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SharelinkService {
  private baseUrl = environment.baseUrl; // Servers Env
  private urlRestore = this.baseUrl + '/api/stringShortener/longString';
  private http: HttpClient;
  currentUserDetails = null;
  public passErrorToErrorPage;

  constructor(private router: Router) {
    this.passErrorToErrorPage = new EventEmitter();
  }

  // url shortening redirection logic
  urlShorteningRedirection() {
    const shared_link = localStorage.getItem('shared_link');
    let currentUserProjectAccess = JSON.parse(
      localStorage.getItem('currentUserDetails'),
    )?.projectsAccess?.length
      ? JSON.parse(localStorage.getItem('currentUserDetails'))?.projectsAccess
      : [];
    currentUserProjectAccess = currentUserProjectAccess.flatMap(
      (row) => row.projects,
    );
    if (shared_link) {
      // Extract query parameters
      const queryParams = new URLSearchParams(shared_link.split('?')[1]);
      const stateFilters = queryParams.get('stateFilters');
      const kpiFilters = queryParams.get('kpiFilters');
      const selectedTab = queryParams.get('selectedTab');
      if (stateFilters) {
        let decodedStateFilters: string = '';

        if (stateFilters?.length <= 8) {
          this.handleRestoreUrl(stateFilters, kpiFilters)
            .pipe(
              catchError((error) => {
                this.router.navigate(['/dashboard/Error']); // Redirect to the error page
                setTimeout(() => {
                  this.raiseError({
                    status: 900,
                    message: error.message || 'Invalid URL.',
                  });
                });
                return throwError(error); // Re-throw the error so it can be caught by a global error handler if needed
              }),
            )
            .subscribe((response: any) => {
              localStorage.removeItem('last_link');
              if (response.success) {
                const longStateFiltersString =
                  response.data['longStateFiltersString'];
                decodedStateFilters = atob(longStateFiltersString);
                this.urlRedirection(
                  decodedStateFilters,
                  currentUserProjectAccess,
                  shared_link,
                );
              }
            });
        } else {
          decodedStateFilters = atob(stateFilters);
          this.urlRedirection(
            decodedStateFilters,
            currentUserProjectAccess,
            shared_link,
          );
        }
      } else {
        this.router.navigate(['./dashboard/iteration']);
      }
    } else {
      this.navigateToLastVisitedURL('/dashboard/iteration');
    }
  }

  urlRedirection(decodedStateFilters, currentUserProjectAccess, url) {
    url = decodeURIComponent(url);
    const stateFiltersObjLocal = JSON.parse(decodedStateFilters);

    let stateFilterObj = [];

    if (
      typeof stateFiltersObjLocal['parent_level'] === 'object' &&
      stateFiltersObjLocal['parent_level'] &&
      Object.keys(stateFiltersObjLocal['parent_level']).length > 0
    ) {
      stateFilterObj = [stateFiltersObjLocal['parent_level']];
    } else {
      stateFilterObj = stateFiltersObjLocal['primary_level'];
    }

    // Check if user has access to all project in stateFiltersObjLocal['primary_level']
    const hasAllProjectAccess = stateFilterObj?.every((filter) =>
      currentUserProjectAccess?.some(
        (project) => project.projectId === filter.basicProjectConfigId,
      ),
    );

    // Superadmin have all project access hence no need to check project for superadmin
    const getAuthorities = this.getCurrentUserDetails('authorities');
    const hasAccessToAll =
      (Array.isArray(getAuthorities) &&
        getAuthorities?.includes('ROLE_SUPERADMIN')) ||
      hasAllProjectAccess;

    if (hasAccessToAll) {
      this.router.navigate([url]);
      localStorage.removeItem('shared_link');
    } else {
      this.router.navigate(['/dashboard/Error']);
      setTimeout(() => {
        this.raiseError({
          status: 901,
          message: 'No project access.',
        });
      }, 100);
    }
  }

  handleRestoreUrl(stateFilterData, kpiFilterData) {
    return this.http?.get<any>(
      `${this.urlRestore}?stateFilters=${stateFilterData}&kpiFilters=${kpiFilterData}`,
    );
  }

  setUserDetailsAsBlankObj() {
    this.currentUserDetails = {};
  }

  raiseError(error) {
    this.passErrorToErrorPage.emit(error);
  }

  getCurrentUserDetails(key = null) {
    this.currentUserDetails = JSON.parse(
      localStorage.getItem('currentUserDetails'),
    );
    if (key) {
      if (
        this.currentUserDetails &&
        this.currentUserDetails.hasOwnProperty(key)
      ) {
        return this.currentUserDetails[key];
      }
    } else if (this.currentUserDetails) {
      return this.currentUserDetails;
    }
    return false;
  }

  navigateToLastVisitedURL(fallbackURL) {
    const lastURL = localStorage.getItem('last_link');
    if (lastURL && !this.checkStateFilterLength(lastURL)) {
      this.router.navigateByUrl(lastURL);
    } else if (fallbackURL) {
      if (!this.checkStateFilterLength(fallbackURL)) {
        this.router.navigateByUrl(fallbackURL);
      } else {
        this.urlShorteningRedirection();
      }
    } else {
      this.router.navigateByUrl('/dashboard/iteration');
    }
    localStorage.removeItem('shared_link');
  }

  checkStateFilterLength(url: string): boolean {
    const parsedUrl = new URL(url, window.location.origin);
    const stateFilters = parsedUrl.searchParams.get('stateFilters');

    if (!stateFilters) {
      console.warn('stateFilters param not found.');
      return false; // or true, depending on your use case when param is missing
    }

    return stateFilters.length <= 8;
  }
}
