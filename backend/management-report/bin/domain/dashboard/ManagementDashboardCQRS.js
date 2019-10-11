"use strict";

const uuidv4 = require("uuid/v4");
const { of, interval, throwError, from } = require("rxjs");
const { take, mergeMap, catchError, map, toArray, tap, reduce } = require('rxjs/operators');
const Event = require("@nebulae/event-store").Event;
const eventSourcing = require("../../tools/EventSourcing")();
const ManagementDashboardDA = require('./data-access/ManagementDashboardDA');
const broker = require("../../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";
const GraphqlResponseTools = require('../../tools/GraphqlResponseTools');
const RoleValidator = require("../../tools/RoleValidator");
const Crosscutting = require("../../tools/Crosscutting");
const {
  CustomError,
  DefaultError,
  INTERNAL_SERVER_ERROR_CODE,
  PERMISSION_DENIED,
  PERMISSION_DENIED_ERROR
} = require("../../tools/customError");

/**
 * Singleton instance
 */
let instance;

class ManagementDashboardCQRS {
  constructor() {
  }

  managementReportSubscriptionRecharge$({ args }, authToken){
    console.log( "managementReportSubscriptionRecharge args", {...args});
    
    const { timestampType, initDate, endDate } = args;
    let { businessId } = args;
    if(!businessId){
      businessId = authToken.businessId;
    }

    return ManagementDashboardDA.getBusinessSummaryReport$(businessId, timestampType, initDate, endDate)
    .pipe(
      // tap(r => console.log("precarga", JSON.stringify(r))),
      mergeMap(result => from(result)
        .pipe(
          filter(report => report.pos),
          map(value => {
            value.pos.subscriptionSale = value.pos.subscriptionSale || { count: 0, days: 0, value: 0 }
            const usersOfSubscriptionSale = Object.keys(value.pos.subscriptionSale)
              .filter(atr => !['count', 'days', 'value'].includes(atr));

            value.pos.walletRecharge = value.pos.walletRecharge || { count: 0, value: 0 }
            const usersOfWalletRecharge = Object.keys(value.pos.walletRecharge)
              .filter(atr => !['count', 'days', 'value'].includes(atr));

            return [
              {
                timestampType,
                timestamp: value.timestamp,
                type: 'SUBSCRIPTION_PAYMENT',
                count: value.pos.subscriptionSale.count,
                amountValue: value.pos.subscriptionSale.value,
                days: value.pos.subscriptionSale.days,
                users: usersOfSubscriptionSale.map(user => ({username: user.replace(/\-/g, "."), ...value.pos.subscriptionSale[user]}))
              },
              {
                timestampType,
                timestamp: value.timestamp,
                type: 'WALLET_RECHARGES',
                count: value.pos.walletRecharge.count,
                amountValue: value.pos.walletRecharge.value,
                users: usersOfWalletRecharge.map(user => ({ username: user.replace(/\-/g, "."), ...value.pos.walletRecharge[user] }))
              }
            ]
        }),
          toArray()
        )
      ),
      map(result => {
        const finalRaw = [];
        result.forEach(item => {
          finalRaw.push(...item)
        });
        return finalRaw;
      }),
      // tap(r => {
      //   console.log('RESULTADO FINAL');
      //   r.forEach(e => {
      //     console.log(e.users)
      //   })
      // }),
      mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),
      catchError(error => GraphqlResponseTools.buildErrorResponse$(error) )
    )



  }


}

/**
 * @returns {ManagementDashboardCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new ManagementDashboardCQRS();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
