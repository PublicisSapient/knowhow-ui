import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportContainerComponent } from './report-container/report-container.component';
import { ReportsRoutingModule } from './reports.routes';

import { KpiHelperService } from 'src/app/services/kpi-helper.service';
import { SharedModuleModule } from 'src/app/shared-module/shared-module.module';

@NgModule({
  declarations: [
    ReportContainerComponent,
    // StackedBarChartComponent,
    // BarchartComponent,
    // StackedBarComponent,
    // SemiCircleDonutChartComponent,
    // TabularKpiV2Component,
    // GroupedBarChartComponent,
    // TabularKpiWithDonutChartComponent
  ],
  imports: [CommonModule, ReportsRoutingModule, SharedModuleModule],
  providers: [KpiHelperService],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ReportsModuleModule {}
