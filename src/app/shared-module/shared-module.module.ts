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

import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';

import { AccordionModule } from 'primeng/accordion';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CarouselModule } from 'primeng/carousel';
import { ChipsModule } from 'primeng/chips';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TabMenuModule } from 'primeng/tabmenu';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { KpiHelperService } from '../services/kpi-helper.service';

import { BarchartComponent } from '../component/barchart/barchart.component';
import { BarWithYAxisGroupComponent } from '../component/bar-with-y-axis-group/bar-with-y-axis-group.component';
import { ChartWithFiltersComponent } from '../component/chart-with-filters/chart-with-filters.component';
import { CollapsiblePanelComponent } from '../component/collapsible-panel/collapsible-panel.component';
import { CumulativeLineChartComponent } from '../component/cumulative-line-chart/cumulative-line-chart.component';
import { GroupBarChartComponent } from '../component/group-bar-chart/group-bar-chart.component';
import { GroupedBarChartComponent } from '../component/grouped-bar-chart/grouped-bar-chart.component';
import { GroupedColumnPlusLineChartV2Component } from '../component/grouped-column-plus-line-chart-v2/grouped-column-plus-line-chart-v2.component';
import { GroupstackchartComponentv2 } from '../component/groupedstackchart-v2/groupstackchart-v2.component';
import { HorizontalPercentBarChartv2Component } from '../component/horizontal-percent-bar-chartv2/horizontal-percent-bar-chartv2.component';
import { KpiAdditionalFilterComponent } from '../component/kpi-additional-filter/kpi-additional-filter.component';
import { PsKpiCardChartRendererComponent } from '../component/kpi-card-v3/ps-kpi-card-chart-renderer/ps-kpi-card-chart-renderer.component';
import { PsKpiCardFilterComponent } from '../component/kpi-card-v3/ps-kpi-card-filter/ps-kpi-card-filter.component';
import { PsKpiCardHeaderComponent } from '../component/kpi-card-v3/ps-kpi-card-header/ps-kpi-card-header.component';
import { MultilineComponent } from '../component/multiline/multiline.component';
import { MultilineStyleV2Component } from '../component/multiline-style-v2/multiline-style-v2.component';
import { MultilineV2Component } from '../component/multiline-v2/multiline-v2.component';
import { PiechartComponent } from '../component/piechart/piechart.component';
import { ProgressChartComponent } from '../component/progress-chart/progress-chart.component';
import { RecentCommentsComponent } from '../component/recent-comments/recent-comments.component';
import { ScatterPlotChartComponent } from '../component/scatter-plot-chart/scatter-plot-chart.component';
import { SemiCircleDonutChartComponent } from '../component/semi-circle-donut-chart/semi-circle-donut-chart.component';
import { StackedAreaChartComponent } from '../component/stacked-area-chart/stacked-area-chart.component';
import { StackedBarComponent } from '../component/stacked-bar/stacked-bar.component';
import { StackedBarChartComponent } from '../component/stacked-bar-chart/stacked-bar-chart.component';
import { TableComponent } from '../component/table/table.component';
import { TabularKpiV2Component } from '../component/tabular-kpi-v2/tabular-kpi-v2.component';
import { TabularKpiWithDonutChartComponent } from '../component/tabular-kpi-with-donut-chart/tabular-kpi-with-donut-chart.component';
import { TooltipV2Component } from '../component/tooltip-v2/tooltip-v2.component';

import { HeaderComponent } from '../dashboardv2/header-v2/header.component';
import { ReportKpiCardComponent } from '../dashboardv2/reports-module/report-kpi-card/report-kpi-card.component';
import { TrendIndicatorV2Component } from '../dashboardv2/trend-indicator-v2/trend-indicator-v2.component';

import { AdditionalFilterFieldComponent } from './additional-filter-field/additional-filter-field.component';
import { ConditionalInputComponent } from './conditional-input/conditional-input.component';
import { ConditionalInputV2Component } from './conditional-input-v2/conditional-input-v2.component';
import { FeatureFlagDirective } from './custom-directives/feature-flag.directive';
import { FieldMappingFieldComponent } from './field-mapping-field/field-mapping-field.component';
import { FieldMappingFormComponent } from './field-mapping-form/field-mapping-form.component';
import { FooterComponent } from './footer/footer.component';
import { KpiFilterComponent } from './kpi-filter/kpi-filter.component';
import { NamePipePipe } from './name-pipe.pipe';
import { PageLoaderComponent } from './page-loader/page-loader.component';
import { DashToBulletsPipe } from './pipes/dash-to-bullets/dash-to-bullets.pipe';
import { IsoDateFormatPipe } from './pipes/iso-date-format.pipe';
import { UtcToLocalUserPipe } from './pipes/utc-to-local-user/utc-to-local-user.pipe';
import { ProjectFilterComponent } from './project-filter/project-filter.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    NgSelectModule,
    MultiSelectModule,
    DropdownModule,
    DialogModule,
    ConfirmDialogModule,
    AccordionModule,
    ReactiveFormsModule,
    ToastModule,
    TooltipModule,
    InputTextModule,
    ButtonModule,
    ChipsModule,
    RadioButtonModule,
    InputSwitchModule,
    CarouselModule,
    InputNumberModule,
    OverlayPanelModule,
    SelectButtonModule,
    MenuModule,
    TabMenuModule,
    TableModule,
    ToastModule,
    NgOptimizedImage,
  ],
  exports: [
    NgSelectModule,
    ProjectFilterComponent,
    NamePipePipe,
    PageLoaderComponent,
    CalendarModule,
    FooterComponent,
    KpiFilterComponent,
    FieldMappingFormComponent,
    FeatureFlagDirective,
    CarouselModule,
    ConditionalInputComponent,
    IsoDateFormatPipe,
    StackedBarChartComponent,
    PsKpiCardHeaderComponent,
    PsKpiCardFilterComponent,
    PsKpiCardChartRendererComponent,
    StackedBarComponent,
    SemiCircleDonutChartComponent,
    TabularKpiV2Component,
    GroupedBarChartComponent,
    TabularKpiWithDonutChartComponent,
    BarchartComponent,
    MultilineComponent,
    MultilineV2Component,
    GroupstackchartComponentv2,
    GroupBarChartComponent,
    ToastModule,
    StackedAreaChartComponent,
    PiechartComponent,
    TrendIndicatorV2Component,
    GroupedColumnPlusLineChartV2Component,
    MultilineStyleV2Component,
    TooltipV2Component,
    HorizontalPercentBarChartv2Component,
    ChartWithFiltersComponent,
    HeaderComponent,
    RecentCommentsComponent,
    CumulativeLineChartComponent,
    ReportKpiCardComponent,
    BarWithYAxisGroupComponent,
    CollapsiblePanelComponent,
    TableComponent,
    UtcToLocalUserPipe,
    ProgressChartComponent,
    ScatterPlotChartComponent,
  ],
  declarations: [
    ProjectFilterComponent,
    NamePipePipe,
    PageLoaderComponent,
    FooterComponent,
    KpiFilterComponent,
    FieldMappingFormComponent,
    FieldMappingFieldComponent,
    AdditionalFilterFieldComponent,
    FeatureFlagDirective,
    ConditionalInputComponent,
    IsoDateFormatPipe,
    StackedBarChartComponent,
    PsKpiCardHeaderComponent,
    PsKpiCardFilterComponent,
    PsKpiCardChartRendererComponent,
    StackedBarComponent,
    SemiCircleDonutChartComponent,
    TabularKpiV2Component,
    GroupedBarChartComponent,
    TabularKpiWithDonutChartComponent,
    BarchartComponent,
    ChartWithFiltersComponent,
    KpiAdditionalFilterComponent,
    MultilineComponent,
    MultilineV2Component,
    StackedAreaChartComponent,
    GroupstackchartComponentv2,
    GroupBarChartComponent,
    PiechartComponent,
    TrendIndicatorV2Component,
    GroupedColumnPlusLineChartV2Component,
    MultilineStyleV2Component,
    TooltipV2Component,
    HorizontalPercentBarChartv2Component,
    HeaderComponent,
    RecentCommentsComponent,
    CumulativeLineChartComponent,
    ReportKpiCardComponent,
    BarWithYAxisGroupComponent,
    CollapsiblePanelComponent,
    TableComponent,
    UtcToLocalUserPipe,
    DashToBulletsPipe,
    ConditionalInputV2Component,
    ProgressChartComponent,
    ScatterPlotChartComponent,
  ],
  providers: [ConfirmationService, KpiHelperService],
  schemas: [NO_ERRORS_SCHEMA],
})
export class SharedModuleModule {}
