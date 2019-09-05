import { SubscriptionsRechargesReportService } from './subscriptions-recharges-report.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { fuseAnimations } from '../../../core/animations';
import { Subscription } from 'rxjs/Subscription';
import * as Rx from 'rxjs/Rx';
import { Subject } from 'rxjs/Rx';
import { tap } from 'rxjs/operators';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'subscriptions-recharges-report',
  templateUrl: './subscriptions-recharges-report.component.html',
  styleUrls: ['./subscriptions-recharges-report.component.scss'],
  animations: fuseAnimations
})
export class SubscriptionsRechargesReportComponent implements OnInit, OnDestroy {

  //Subject to unsubscribe
  private ngUnsubscribe = new Subject();
  totalAmount = 0;

  barChartOptions = {
    scaleShowVerticalLines: false,
    responsive: true,
    legend: {
      display: false
    },
    tooltips: {
      mode: 'single',
      callbacks: {
        title: function (tooltipItem, data) {
          return "Día " + data.labels[tooltipItem[0].index];
        },
        label: function (tooltipItems, data) {
          return "Total: $" + tooltipItems.yLabel;
        },
        footer: function (tooltipItem, data) { 
          return ""; 
        }
      }
    }
  };

  // Day's label
  barChartLabels = [];
  //public barChartLabels = ['01', '02', '03', '04', '05', ]
  barChartType = 'bar';
  barChartLegend = true;
  barChartData = [
    { data: [65, 59, 50, 80, 81, 56, 55, 40, 0 ], label: 'mes' }
  ];

  barChartColors = [
    { backgroundColor: '#00000' },
  ];



  constructor(private subscriptionsRechargesReportService: SubscriptionsRechargesReportService  ) {    

  }
    

  ngOnInit() {

    this.listenDayFilters();
    this.listenSecondaryFilters();
    this.updateData('','','');


  }

  listenDayFilters(){

  }

  listenSecondaryFilters(){

  }

  updateData(type, dateInit, dateEnd){
    this.subscriptionsRechargesReportService.getReportByDays$(type, dateInit, dateEnd)
      .pipe(
        tap((result) => {
          console.log("RESULT ==> ", result);

          this.barChartLabels = [];
          this.barChartData[0].data = [];
          this.totalAmount = 0;
          result.forEach((v, i) => {
            this.barChartLabels.push(v.date);
            this.barChartData[0].data.push(v.amountValue);
            this.totalAmount = this.totalAmount + v.amountValue;
          });

        })
      ).subscribe()
  }
  printData(){
    console.log('printing data');
  }


  
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
