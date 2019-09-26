import { Component, OnInit, Inject } from '@angular/core';
import { SubscriptionsRechargesReportService } from '../../subscriptions-recharges-report.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as moment from 'moment';
import { tap, map, mergeMap, filter } from 'rxjs/operators';



@Component({
  selector: 'date-selector-dialog',
  templateUrl: './date-selector-dialog.component.html',
  styleUrls: ['./date-selector-dialog.component.scss']
})
export class DateSelectorDialogComponent implements OnInit {

  constructor(
    private subscriptionsRechargesReportService: SubscriptionsRechargesReportService,
    private dialogRef: MatDialogRef<DateSelectorDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {

  }

  minInitDate;
  maxInitDate;

  minEndDate;
  maxEndDate;

  dateFiltersForm: FormGroup;

  ngOnInit() {
    //this.updateData(null, null, null);
    this.initForms();
  }

  initForms() {
    this.minInitDate = moment('2019-01-01').startOf('month');
    this.maxInitDate = moment().add(1, 'months').endOf('day');

    const startOfMonth = moment().startOf('month');
    const initTimeStampValue = moment().subtract(1, 'day').startOf('day');
    const endOfMonth = moment().endOf('day');
    this.minEndDate = startOfMonth;
    this.maxEndDate = endOfMonth;

    this.dateFiltersForm = new FormGroup({
      initTimestamp: new FormControl(moment().startOf('week')),
      endTimestamp: new FormControl(moment().endOf('day')),
    });
  }

  listenDateFilters() {
    this.dateFiltersForm.valueChanges
      .pipe(
        tap(filtersValue => console.log('FILTRO DE DIAS ==> ', filtersValue)),
        map(filtersValue => ({
          initTimestamp: filtersValue.initTimestamp.valueOf(),
          endTimestamp: filtersValue.endTimestamp.valueOf(),
        })
        )
      ).subscribe(
        (filters => {
          const { initTimestamp, endTimestamp } = filters;
          this.updateData('', initTimestamp, endTimestamp);
        })
      );
  }

  updateData(type, dateInit, dateEnd) {
    this.subscriptionsRechargesReportService.getReportByDays$(type, 'DAY', dateInit, dateEnd)
  }

  onInitDateChange() {
    console.log("La fecha inicial ha cambiado");
  }
  onEndDateChange() {
    console.log("La fecha final ha cambiado");
  }

  closeButton(okButton: Boolean) {

    const { initTimestamp, endTimestamp } = this.dateFiltersForm.getRawValue();

    const answer = okButton
      ? {
          initDate: initTimestamp ? initTimestamp.valueOf() : moment().startOf('week').valueOf(),
          endDate: endTimestamp ? endTimestamp.valueOf() : moment().endOf('week').valueOf()
        }
      : undefined;

    this.dialogRef.close(answer);
  }

}
