import { Component, OnInit, Inject} from '@angular/core';
import { SubscriptionsRechargesReportService } from '../../subscriptions-recharges-report.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as moment from 'moment';
import { tap, map, mergeMap, filter } from 'rxjs/operators';



@Component({
  selector: 'week-selector-dialog',
  templateUrl: './week-selector-dialog.component.html',
  styleUrls: ['./week-selector-dialog.component.scss']
})
export class WeekSelectorDialogComponent implements OnInit {
  yearOptions = [];
  monthOptions = [];
  weekOptions = [];

  constructor(
    private subscriptionsRechargesReportService: SubscriptionsRechargesReportService,
    private dialogRef: MatDialogRef<WeekSelectorDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any)
    {

  }

  dateFiltersForm: FormGroup;

  ngOnInit() {
    //this.updateData(null, null, null);
    this.initForms();
  }

  initForms(){

    this.dateFiltersForm = new FormGroup({
      year: new FormControl(''),
      month: new FormControl(''),
      week: new FormControl(''),

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

  updateData(type, dateInit, dateEnd){
    // this.subscriptionsRechargesReportService.getReportByDays$(type, 'DAY',  dateInit, dateEnd)
  }

  onInitDateChange(){
    console.log("La fecha inicial ha cambiado");

  }
  onEndDateChange(){
    console.log("La fecha final ha cambiado");
  }

  pushButton(okButton: Boolean) {
    this.updateData;
    this.dialogRef.close(okButton);
  }

}
