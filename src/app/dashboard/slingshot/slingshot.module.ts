import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SlingshotComponent } from './slingshot.component';
import { KpiCardV2Component } from '../../dashboardv2/kpi-card-v2/kpi-card-v2.component';
import { SharedModuleModule } from '../../shared-module/shared-module.module';

const routes: Routes = [
  {
    path: '',
    component: SlingshotComponent,
  },
];

@NgModule({
  declarations: [SlingshotComponent],
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    DropdownModule,
    KpiCardV2Component,
    SharedModuleModule,
    RouterModule.forChild(routes),
  ],
  exports: [SlingshotComponent],
})
export class SlingshotModule {}
