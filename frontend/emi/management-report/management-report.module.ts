import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../core/modules/shared.module';
import { DatePipe } from '@angular/common';
import { FuseWidgetModule } from '../../../core/components/widget/widget.module';

import { ManagementReportService } from './management-report.service';
import { ManagementReportComponent } from './management-report.component';

const routes: Routes = [
  {
    path: '',
    component: ManagementReportComponent,
  }
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FuseWidgetModule
  ],
  declarations: [
    ManagementReportComponent    
  ],
  providers: [ ManagementReportService, DatePipe]
})

export class ManagementReportModule {}