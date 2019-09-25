import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import  { of } from 'rxjs';
import { GatewayService } from '../../../api/gateway.service';
import {
  getHelloWorld,
  managementReportSubscriptionRecharge,
  ManagementReportHelloWorldSubscription
} from './gql/subscriptionsRechargesReport';

@Injectable()
export class SubscriptionsRechargesReportService {
  constructor(private gateway: GatewayService) {}

  /**
   * Hello World sample, please remove
   */
  getReportByDays$(type, timestampType='DAY', initDate, endDate) {
    // return this.gateway.apollo
    //   .query<any>({
    //     query: managementReportSubscriptionRecharge,
    //     variables: { type, timestampType, initDate, endDate },
    //     fetchPolicy: "network-only"
    //   })
      // map(resp => resp.data.getHelloWorldFromManagementReport.sn);

    const millisOnDay = 1000 * 60 * 24;
    const firstDate = Date.now() - ( millisOnDay * 32 );

    const result = new Array(15).fill('')
      .map((element, index) => ({
        timestamp: firstDate + ( millisOnDay * index ),
        date: new Date(firstDate + ( millisOnDay * index )).toDateString(),
        amountValue: Math.floor(Math.random() * 100 ) * 1000,
        days: Math.floor(Math.random() * 100 ),
        })
      );
    
    return of(result);
  }

  /**
   * Hello World subscription sample, please remove
   */
  getEventSourcingMonitorHelloWorldSubscription$(): Observable<any> {
    return this.gateway.apollo
      .subscribe({
        query: ManagementReportHelloWorldSubscription
      })
      .map(resp => resp.data.EventSourcingMonitorHelloWorldSubscription.sn);
  }


  
}
