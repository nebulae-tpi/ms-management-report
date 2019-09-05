import { SubscriptionsRechargesReportService } from './subscriptions-recharges-report.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { fuseAnimations } from '../../../core/animations';
import { Subscription } from 'rxjs/Subscription';
import * as Rx from 'rxjs/Rx';
import { Subject } from 'rxjs/Rx';
import { tap, map, mergeMap, filter } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as moment from 'moment';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'subscriptions-recharges-report',
  templateUrl: './subscriptions-recharges-report.component.html',
  styleUrls: ['./subscriptions-recharges-report.component.scss'],
  animations: fuseAnimations
})
export class SubscriptionsRechargesReportComponent implements OnInit, OnDestroy {

  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();
  totalAmount = 0;
  dateFiltersForm: FormGroup;
  secondaryFilterForm: FormGroup;

  minInitDate;
  maxInitDate;

  minEndDate;
  maxEndDate;

  weekOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  monthOptions = ['JAN', 'FEB', 'MARCH', 'APRIL']

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
          return 'Día ' + data.labels[tooltipItem[0].index];
        },
        label: function (tooltipItems, data) {
          return 'Total: $' + tooltipItems.yLabel;
        },
        footer: function (tooltipItem, data) {
          return '';
        }
      }
    }
  };

  // Day's label
  barChartLabels = [];
  // public barChartLabels = ['01', '02', '03', '04', '05', ]
  barChartType = 'bar';
  barChartLegend = true;
  barChartData = [
    { data: [65, 59, 50, 80, 81, 56, 55, 40, 0 ], label: 'mes' }
  ];

  barChartColors = [
    { backgroundColor: '#00000' },
  ];



  constructor(
    private subscriptionsRechargesReportService: SubscriptionsRechargesReportService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    ) {

  }


  ngOnInit() {

    this.initForms();

    this.listenDateFilters();
    this.listenSecondaryFilters();
    this.updateData(null, null, null);


  }

  initForms(){
    this.minInitDate = moment('2019-01-01').startOf('month');
    this.maxInitDate = moment().add(1, 'months').endOf('day');

    const startOfMonth = moment().startOf('month');
    const initTimeStampValue = moment().subtract(1, 'day').startOf('day');
    const endOfMonth = moment().endOf('day');
    this.minEndDate = startOfMonth;
    this.maxEndDate = endOfMonth;

    this.dateFiltersForm = new FormGroup({
      initTimestamp: new FormControl(initTimeStampValue, [Validators.required]),
      endTimestamp: new FormControl(endOfMonth, [Validators.required]),
    });

    this.secondaryFilterForm = new FormGroup({
      type: new FormControl('SUBSCRIPTION_PAYMENT'),
      month: new FormControl(null),
      week: new FormControl(null)
    });
  }

  listenDateFilters(){
    this.dateFiltersForm.valueChanges
    .pipe(
      tap(filtersValue => console.log('FILTRO DE DIAS ==> ', filtersValue)),
      map( filtersValue => ({
        initTimestamp: filtersValue.initTimestamp.valueOf(),
        endTimestamp: filtersValue.endTimestamp.valueOf(),
        })
      )
    ).subscribe(
      (filters => {
        const { initTimestamp, endTimestamp} = filters;
        this.updateData('', initTimestamp, endTimestamp);
      })
    );
  }

  onInitDateChange(){

  }

  onEndDateChange(){

  }


  listenSecondaryFilters(){
    this.secondaryFilterForm.valueChanges
    .pipe(
      tap(filtersValue => console.log('FILTROS SECUNDARIOS ==> ', filtersValue))
    ).subscribe();

  }

  listenFilterChanges(){
    
  }

  updateData(type, dateInit, dateEnd){
    this.subscriptionsRechargesReportService.getReportByDays$(type, 'DAY',  dateInit, dateEnd)
      .pipe(
        // mergeMap(response => this.graphQlAlarmsErrorHandler$(response)),
        // map(result => (result.data || {}).managementReportSubscriptionRecharge),
        // filter(dataResult => dataResult ),
        tap((result) => {
          console.log('RESULT ==> ', result);

          this.barChartLabels = [];
          this.barChartData[0].data = [];
          this.totalAmount = 0;
          result.forEach((v, i) => {
            this.barChartLabels.push(v.date);
            this.barChartData[0].data.push(v.amountValue);
            this.totalAmount = this.totalAmount + v.amountValue;
          });

        })
      ).subscribe();
  }
  printData(){
    console.log('printing data');
  }

  graphQlAlarmsErrorHandler$(response) {
    return of(JSON.parse(JSON.stringify(response))).pipe(
      tap((resp: any) => {
        if (response && Array.isArray(response.errors)) {
          response.errors.forEach(error => {
            this.showMessageSnackbar('ERRORS.' + ((error.extensions||{}).code || 1) )
          });
        }
        return resp;
      })
    );
  }

  /**
   * Shows a message snackbar on the bottom of the page
   * @param messageKey Key of the message to i18n
   * @param detailMessageKey Key of the detail message to i18n
   */
  showMessageSnackbar(messageKey, detailMessageKey?) {
    const translationData = [];
    if (messageKey) {
      translationData.push(messageKey);
    }

    if (detailMessageKey) {
      translationData.push(detailMessageKey);
    }

    this.translate.get(translationData).subscribe(data => {
      this.snackBar.open(
        messageKey ? data[messageKey] : '',
        detailMessageKey ? data[detailMessageKey] : '',
        {
          duration: 2000
        }
      );
    });
  }


  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
