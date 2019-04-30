import { ManagementReportService } from './management-report.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { fuseAnimations } from '../../../core/animations';
import { Subscription } from 'rxjs/Subscription';
import * as Rx from 'rxjs/Rx';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'management-report',
  templateUrl: './management-report.component.html',
  styleUrls: ['./management-report.component.scss'],
  animations: fuseAnimations
})
export class ManagementReportComponent implements OnInit, OnDestroy {
  
  helloWorld: String = 'Hello World static';
  helloWorldLabelQuery$: Rx.Observable<any>;
  helloWorldLabelSubscription$: Rx.Observable<any>;

  constructor(private ManagementReportervice: ManagementReportService  ) {    

  }
    

  ngOnInit() {
    this.helloWorldLabelQuery$ = this.ManagementReportervice.getHelloWorld$();
    this.helloWorldLabelSubscription$ = this.ManagementReportervice.getEventSourcingMonitorHelloWorldSubscription$();
  }

  
  ngOnDestroy() {
  }

}
