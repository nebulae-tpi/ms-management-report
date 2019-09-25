import { SubscriptionsRechargesReportService } from './subscriptions-recharges-report.service';
import { DateSelectorDialogComponent } from './dialogs/date-selector-dialog/date-selector-dialog.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { fuseAnimations } from '../../../core/animations';
import { Subscription } from 'rxjs/Subscription';
import * as Rx from 'rxjs/Rx';
import { Subject } from 'rxjs/Rx';
import { tap, map, mergeMap, filter, startWith } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as moment from 'moment';
import { of, combineLatest, BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WeekSelectorDialogComponent } from './dialogs/week-selector-dialog/week-selector-dialog.component';

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
  private daysFilters$ = new BehaviorSubject(null);
  private weekFilters$ = new BehaviorSubject(null);
  totalAmount = 0;
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
    scales: {
      xAxes: [{
        gridLines: {
          color: "rgba(0, 0, 0, 0)",
        },
      }],
      /*yAxes: [{
        gridLines: {
          color: "rgba(0, 0, 0, 0)",
        },
      }],*/
    },
    tooltips: {
      displayColors: false,
      mode: 'single',
      callbacks: {
        title: function (tooltipItem, data) {
          return 'Día ' + data.labels[tooltipItem[0].index];
        },
        label: function (tooltipItems, data) {
          return 'Total: $' + new Intl.NumberFormat(["ban", "id"]).format(tooltipItems.yLabel);
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
    { 
      data: [65.50, 59, 50, 80, 81, 56, 55, 40, 0 ], 
      label: 'mes'
    }
  ];

  barChartColors =  [
    { 
      hoverBackgroundColor: '#1d9dd3',
      backgroundColor:'silver',
     },
  ];

  // MatPaginator Inputs
  length = 100;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 100];
 
  constructor(
    private subscriptionsRechargesReportService: SubscriptionsRechargesReportService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    ) {

  }


  ngOnInit() {

    this.initForms();

    this.listenAllFilters();
    this.updateData(null, null, null);


  }

  initForms(){

    this.secondaryFilterForm = new FormGroup({
      type: new FormControl('SUBSCRIPTION_PAYMENT')
    });
  }


  listenAllFilters(){

    combineLatest(
      this.secondaryFilterForm.valueChanges.pipe(
        startWith(this.secondaryFilterForm.get('type').value)
      ),
      this.daysFilters$,
      this.weekFilters$
    ).pipe(
      mergeMap(([paymentOrRecharge, daysFilters, weekFilters]) => {
        
        const initTimestamp = 0;
        const endTimestamp = 0;

        console.log({ daysFilters, weekFilters })


        const filters = {
          type: paymentOrRecharge,
          initTimestamp,
          endTimestamp          
        }

        return of(filters);

      }),
      tap(filtersValue => console.log('FILTROS SECUNDARIOS ==> ', filtersValue))

    ).subscribe()



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
            //console.log(new Intl.NumberFormat('ban', { style: 'currency', currency: 'USD' }).format(v.amountValue).toString());
            this.totalAmount = this.totalAmount + v.amountValue
          });

        })
      ).subscribe();
  }


  openDateSelectorDialog(): void {
    const dialogRef = this.dialog.open(DateSelectorDialogComponent, {
      width: '250px'
    });

    dialogRef.afterClosed() 
    .subscribe(result => {
      console.log('The dialog was closed', result);
      this.daysFilters$.next(result)
    });
  }

  openWeekSelectorDialog(): void {
    const dialogRef = this.dialog.open(WeekSelectorDialogComponent, {
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
    });
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
