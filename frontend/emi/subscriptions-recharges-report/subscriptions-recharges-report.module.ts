import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../core/modules/shared.module';
import { DatePipe } from '@angular/common';
import { FuseWidgetModule } from '../../../core/components/widget/widget.module';

import { DateSelectorDialogComponent } from './dialogs/date-selector-dialog/date-selector-dialog.component';
import { SubscriptionsRechargesReportService } from './subscriptions-recharges-report.service';
import { SubscriptionsRechargesReportComponent } from './subscriptions-recharges-report.component';
import { ChartsModule } from 'ng2-charts';
import { WeekSelectorDialogComponent } from './dialogs/week-selector-dialog/week-selector-dialog.component';
import {NgxMaskModule, IConfig} from 'ngx-mask';

export const options: Partial<IConfig> | (() => Partial<IConfig>) = null;

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
    ChartsModule,
    NgxMaskModule.forRoot(options)
  ],
  declarations: [
    DateSelectorDialogComponent,
    SubscriptionsRechargesReportComponent,
    WeekSelectorDialogComponent
  ],
  providers: [ SubscriptionsRechargesReportService, DatePipe],
  entryComponents: [DateSelectorDialogComponent, WeekSelectorDialogComponent],
})

export class SubscriptionsRechargesReportModule {}
