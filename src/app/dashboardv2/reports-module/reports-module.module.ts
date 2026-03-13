import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportContainerComponent } from './report-container/report-container.component';
import { ReportsRoutingModule } from './reports.routes';

import { KpiHelperService } from 'src/app/services/kpi-helper.service';
import { SharedModuleModule } from 'src/app/shared-module/shared-module.module';
import { RecommDetailsComponent } from 'src/app/component/recomm-details/recomm-details.component';

@NgModule({
  declarations: [ReportContainerComponent],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    SharedModuleModule,
    RecommDetailsComponent,
  ],
  providers: [KpiHelperService],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ReportsModuleModule {}
