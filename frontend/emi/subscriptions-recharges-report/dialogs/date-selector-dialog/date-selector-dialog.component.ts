import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as moment from 'moment';
import { tap, map, mergeMap, filter } from 'rxjs/operators';



@Component({
  // tslint:disable-next-line: component-selector
  selector: 'date-selector-dialog',
  templateUrl: './date-selector-dialog.component.html',
  styleUrls: ['./date-selector-dialog.component.scss']
})
export class DateSelectorDialogComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<DateSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

  }

  minInitDate;
  maxInitDate;

  minEndDate;
  maxEndDate;

  dateFiltersForm: FormGroup;

  ngOnInit() {
    this.initForms();
    console.log(this.data);
  }

  initForms() {
    this.minInitDate = moment('2019-01-01').startOf('month').valueOf();
    this.maxInitDate = moment().endOf('day');



    // const startOfMonth = moment().startOf('month');
    // const initTimeStampValue = moment().subtract(1, 'day').startOf('day');

    this.minEndDate = this.minInitDate;
    this.maxEndDate = this.maxInitDate;

    this.dateFiltersForm = new FormGroup({
      initTimestamp: new FormControl(this.data.minDateSelected),
      endTimestamp: new FormControl(this.data.maxDateSelected),
    });
  }

  // listenDateFilters() {
  //   this.dateFiltersForm.valueChanges
  //     .pipe(
  //       tap(filtersValue => console.log('FILTRO DE DIAS ==> ', filtersValue)),
  //       map(filtersValue => ({
  //         initTimestamp: filtersValue.initTimestamp.valueOf(),
  //         endTimestamp: filtersValue.endTimestamp.valueOf(),
  //       })
  //       )
  //     ).subscribe(
  //       (filters => {
  //         const { initTimestamp, endTimestamp } = filters;
  //         this.updateData('', initTimestamp, endTimestamp);
  //       })
  //     );
  // }

  // updateData(type, dateInit, dateEnd) {
  //   // this.subscriptionsRechargesReportService.getReportByDays$(this.business type, 'DAY', dateInit, dateEnd)
  // }

  onInitDateChange() {
    this.minEndDate = this.dateFiltersForm.get('initTimestamp').value;
  }
  onEndDateChange() {
    this.maxInitDate = this.dateFiltersForm.get('endTimestamp').value;
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
