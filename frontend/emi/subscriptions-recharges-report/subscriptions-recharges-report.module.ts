import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../core/modules/shared.module';
import { DatePipe } from '@angular/common';
import { FuseWidgetModule } from '../../../core/components/widget/widget.module';

import { SubscriptionsRechargesReportService } from './subscriptions-recharges-report.service';
import { SubscriptionsRechargesReportComponent } from './subscriptions-recharges-report.component';
import { ChartsModule } from 'ng2-charts';

const routes: Routes = [
  {
    path: '',
    component: SubscriptionsRechargesReportComponent,
  }
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FuseWidgetModule,
    ChartsModule
  ],
  declarations: [
    SubscriptionsRechargesReportComponent    
  ],
  providers: [ SubscriptionsRechargesReportService, DatePipe]
})

export class SubscriptionsRechargesReportModule {}