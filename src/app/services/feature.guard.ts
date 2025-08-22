import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
  CanLoad,
  CanActivateChild,
} from '@angular/router';
import { FeatureFlagsService } from './feature-toggle.service';

@Injectable({
  providedIn: 'root',
})
export class FeatureGuard implements CanLoad, CanActivateChild {
  constructor(
    private featureFlagsService: FeatureFlagsService,
    private router: Router,
  ) {}

  async canLoad(
    route: Route,
    segments: UrlSegment[],
  ): Promise<boolean | UrlTree> {
    const {
      data: { feature }, // <-- Get the module name from route data
    } = route;
    if (feature) {
      const isEnabled = await this.featureFlagsService.isFeatureEnabled(
        feature,
      );
      if (isEnabled) {
        return true;
      }
    } else {
      return true;
    }
    this.router.navigate(['/']);
    return false;
  }

  async canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    const {
      data: { feature }, // <-- Get the module name from route data
    } = childRoute;
    if (feature) {
      const isEnabled = await this.featureFlagsService.isFeatureEnabled(
        feature,
      );
      if (isEnabled) {
        return true;
      }
    } else {
      return true;
    }
    this.router.navigate(['/']);
    return false;
  }
}
