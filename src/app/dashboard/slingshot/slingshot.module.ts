import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlingshotComponent } from './slingshot.component';

// PrimeNG imports
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';

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
    RouterModule.forChild(routes),
  ],
  exports: [SlingshotComponent],
})
export class SlingshotModule {}
