import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs';
import { GatewayService } from '../../../api/gateway.service';
import {
  managementReportSubscriptionRecharge
} from './gql/subscriptionsRechargesReport';

@Injectable()
export class SubscriptionsRechargesReportService {
  constructor(private gateway: GatewayService) { }

  /**
   * Hello World sample, please remove
   */
  getReportByDays$(businessId, timestampType = 'DAY', initDate, endDate) {

    return this.gateway.apollo
      .query<any>({
        query: managementReportSubscriptionRecharge,
        variables: { businessId, timestampType, initDate, endDate },
        fetchPolicy: 'network-only'
      });
  }

}
