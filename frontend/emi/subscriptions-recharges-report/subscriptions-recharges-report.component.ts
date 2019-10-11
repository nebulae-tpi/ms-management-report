import { SubscriptionsRechargesReportService } from './subscriptions-recharges-report.service';
import { DateSelectorDialogComponent } from './dialogs/date-selector-dialog/date-selector-dialog.component';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { fuseAnimations } from '../../../core/animations';
// tslint:disable-next-line: import-blacklist
import { Subject } from 'rxjs/Rx';
import { tap, map, mergeMap, filter, startWith, takeUntil } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as moment from 'moment';
import { of, combineLatest, BehaviorSubject, defer } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatPaginator } from '@angular/material';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WeekSelectorDialogComponent } from './dialogs/week-selector-dialog/week-selector-dialog.component';
import { ToolbarService } from '../../toolbar/toolbar.service';
import { KeycloakService } from 'keycloak-angular';

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


  minDateSelected;
  minDateAsString = '';
  maxDateSelected;
  maxDateAsString = '';



  weekOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  monthOptions = ['JAN', 'FEB', 'MARCH', 'APRIL'];

  barChartOptions = {
    scaleShowVerticalLines: false,
    responsive: true,
    legend: {
      display: false
    },
    scales: {
      xAxes: [{
        gridLines: {
          color: 'rgba(0, 0, 0, 0)',
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
          return 'Total: $' + new Intl.NumberFormat(['ban', 'id']).format(tooltipItems.yLabel);
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
      data: [65.50, 59, 50, 80, 81, 56, 55, 40, 0],
      label: 'mes'
    }
  ];

  barChartColors = [
    {
      hoverBackgroundColor: '#1d9dd3',
      backgroundColor: 'silver',
    },
  ];

  // MatPaginator Inputs
  tableLength = 100;
  tablePageSize = 10;
  tablePageIndex = 0;
  tablePageSizeOptions: number[] = [5, 10, 25, 100];

  @ViewChild('paginator') paginator: MatPaginator;

  usersSummary = [];
  rawResult = [];
  resultToShow = [];

  totalDays = 0;

  currentDate = '';

  businessIdSelected = null;

  summaryPerDayCompleted: any[] = [];
  summaryPerDayOnPage = [];

  constructor(
    private subscriptionsRechargesReportService: SubscriptionsRechargesReportService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private toolbarService: ToolbarService,
    private keyCloakService: KeycloakService
  ) {

  }


  ngOnInit() {

    this.minDateSelected = moment().startOf('week').valueOf();
    this.minDateAsString = moment(this.minDateSelected).locale('es').format('DD MMMM').toString();
    this.maxDateSelected = moment().endOf('day').valueOf();
    this.maxDateAsString = moment(this.maxDateSelected).locale('es').format('DD MMMM').toString();


    this.initForms();

    this.listenAllFilters();

    // this.listenBuinessUnitChanges();

    this.listenTypeFilterChanges();
    this.listenPaginatorChanges();

  }


  // listenBuinessUnitChanges(){
  //   this.toolbarService.onSelectedBusiness$
  //   .pipe()
  //   .subscribe( buSelected => {
  //     this.businessUnitSelected = (buSelected || {}).id;
  //   })
  // }

  makeFirstQuery(){
    const initDate = moment().startOf('week');
    const endDate = moment();

    defer(() => this.keyCloakService.loadUserProfile())
    .pipe(
      takeUntil(this.ngUnsubscribe)
    )
    .subscribe(
      (userProfile: any) => {
        this.businessIdSelected = ((userProfile || {}).business).id;
        console.log(' ====> ' , userProfile.business.id);
      // this.updateData(null, initDate.valueOf(), endDate.valueOf());
      }
    );

  }


  initForms() {
    this.secondaryFilterForm = new FormGroup({
      type: new FormControl('SUBSCRIPTION_PAYMENT')
    });
  }


  listenPaginatorChanges(){
    this.paginator.page
    .pipe(
      takeUntil(this.ngUnsubscribe)
    )
    .subscribe(
      ({ pageIndex, pageSize }) => {
        this.tablePageIndex = pageIndex;
        this.tablePageSize = pageSize;

        const start = this.tablePageSize * this.tablePageIndex;
        const end = start + this.tablePageSize;

        this.summaryPerDayOnPage = this.summaryPerDayCompleted.slice( start, end );
      }
    );

  }



  /**
   * Listen the filters and send request to fetch data
   */
  listenAllFilters() {
    combineLatest(
      this.daysFilters$,
      this.weekFilters$,
      this.toolbarService.onSelectedBusiness$
    ).pipe(
      filter(([daysFilters, weekFilters, business]) => {

        return business != null && business.id != null;

      } ),
      mergeMap(([daysFilters, weekFilters, business]) => {

        this.businessIdSelected = business.id;

        console.log({ daysFilters, weekFilters, business });

        const initTimestamp = daysFilters ? daysFilters.initDate : this.minDateSelected;
        const endTimestamp = daysFilters ? daysFilters.endDate : this.maxDateSelected;

        return of({
          businessId: business.id,
          timestampType: 'DAY',
          initDate: initTimestamp,
          endDate: endTimestamp
        });

      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(
      (filters: any) => {
        this.updateData(filters.businessId , filters.initDate, filters.endDate);
    });

  }

  listenTypeFilterChanges(){
    this.secondaryFilterForm.get('type').valueChanges
    .pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(typeSelected => {

      // reset table paginator configuration
      this.tablePageSize = 10;
      this.tablePageIndex = 0;


      this.barChartLabels = [];
      this.barChartData[0].data = [];
      this.totalAmount = 0;
      this.totalDays = 0;
      this.usersSummary = [];
      this.summaryPerDayCompleted = [];

      this.resultToShow = this.rawResult.filter(e => e.type === typeSelected);

      this.tableLength = this.resultToShow.length;


      this.resultToShow.forEach((v: any, i) => {



        // console.log('ITEM TO SHOW => ', v);
        const summaryItem = this.extractSummarryItem(v, typeSelected);
        this.summaryPerDayCompleted.push(summaryItem);
        this.totalDays  += typeSelected === 'SUBSCRIPTION_PAYMENT' ? v.days : v.count;
        this.barChartLabels.push(moment(v.timestamp).format('DD MMM').toString());
        this.barChartData[0].data.push(v.amountValue);
        this.totalAmount = this.totalAmount + v.amountValue;

        v.users.forEach(user => {
          const userFound = this.usersSummary.find(u => u.username === user.username);
          if (userFound) {
            userFound.count += user.count;
            userFound.value += user.value;
            if ( typeSelected === 'SUBSCRIPTION_PAYMENT'){
              userFound.days +=  user.days;
            }

          } else {
            this.usersSummary.push(user);
          }
        });

      });

      const start = this.tablePageSize * this.tablePageIndex;
      const end = start + this.tablePageSize;

      this.summaryPerDayOnPage = this.summaryPerDayCompleted.slice( start, end );




      // console.log(this.resultToShow);




    });
  }


  /**
   *
   * @param businessId business id
   * @param dateInit date init
   * @param dateEnd date end
   */
  updateData(businessId, dateInit, dateEnd) {
    this.subscriptionsRechargesReportService.getReportByDays$(businessId, 'DAY', dateInit, dateEnd)
      .pipe(
        map((result: any) => (result.data || {}).managementReportSubscriptionRecharge || []),
        map(rawResponse => JSON.parse(JSON.stringify(rawResponse))),
        takeUntil(this.ngUnsubscribe)
      ).subscribe((result: any[]) => {

        // reset table paginator configuration
        this.tablePageSize = 10;
        this.tablePageIndex = 0;


        // console.log({ RESULTADO: result });
        this.rawResult = result;
        const filterType = this.secondaryFilterForm.get('type').value;
        this.resultToShow = result.filter(e => e.type === filterType );
        this.tableLength = this.resultToShow.length;




        this.barChartLabels = [];
        this.barChartData[0].data = [];
        this.totalAmount = 0;
        this.totalDays = 0;
        this.usersSummary = [];
        this.summaryPerDayCompleted = [];

        this.resultToShow.forEach((v: any, i) => {

          const summaryItem = this.extractSummarryItem(v, filterType);
          this.summaryPerDayCompleted.push(summaryItem);

          this.totalDays += filterType === 'SUBSCRIPTION_PAYMENT' ? v.days : v.count;
          this.barChartLabels.push(moment(v.timestamp).format('DD MMM').toString());
          this.barChartData[0].data.push(v.amountValue);
          this.totalAmount = this.totalAmount + v.amountValue;


          v.users.forEach(user => {
            const userFound = this.usersSummary.find(u => u.username === user.username);
            if (userFound) {
              userFound.count += user.count;
              userFound.value += user.value;
              userFound.days += user.days || 0;
            } else {
              this.usersSummary.push(user);
            }
          });

        });

        const start = this.tablePageSize * this.tablePageIndex;
        const end = start + this.tablePageSize;

        this.summaryPerDayOnPage = this.summaryPerDayCompleted.slice( start, end );



      });
  }

  extractSummarryItem(value: any, filterType: string){

    return ({
      date: moment(value.timestamp).format('DD MMM').toString(),
      count: filterType === 'SUBSCRIPTION_PAYMENT' ? value.days : value.count,
      totalCash: value.amountValue
    });

  }


  openDateSelectorDialog(): void {
    const dialogRef = this.dialog.open(DateSelectorDialogComponent, {
      width: '250px',
      data: {
        minDateSelected: this.minDateSelected,
        maxDateSelected: this.maxDateSelected
      }

    });

    dialogRef.afterClosed()
      .pipe(
        filter((result: any) => result),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(result => {


        console.log('DIALOG RESPONSE ==> ', {...result});
        this.minDateSelected = result.initDate;
        this.minDateAsString = moment(result.initDate).locale('es').format('DD MMMM').toString();
        this.maxDateSelected = result.endDate;
        this.maxDateAsString = moment(result.endDate).locale('es').format('DD MMMM').toString();

        // console.log("%%%%%%%%%%%%%%%%%%%55", this.minDateAsString, this.maxDateAsString);

        // console.log('The dialog was closed', result);

        this.daysFilters$.next(result);

      });
  }

  openWeekSelectorDialog(): void {
    const dialogRef = this.dialog.open(WeekSelectorDialogComponent, {
      width: '250px'
    });

    dialogRef.afterClosed().pipe(takeUntil(this.ngUnsubscribe)).subscribe(result => {

    });
  }

  graphQlAlarmsErrorHandler$(response) {
    return of(JSON.parse(JSON.stringify(response))).pipe(
      tap((resp: any) => {
        if (response && Array.isArray(response.errors)) {
          response.errors.forEach(error => {
            this.showMessageSnackbar('ERRORS.' + ((error.extensions || {}).code || 1));
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

    this.translate.get(translationData).pipe(takeUntil(this.ngUnsubscribe)).subscribe(data => {
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
