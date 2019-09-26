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
    console.log( "managementReportSubscriptionRecharge", {...args});
    
    const { type, timestampType, initDate, endDate } = args;
    const { businessId } = authToken;

    // const { year, dayOfYear } = Crosscutting.decomposeTime(initDate);
    // const {  } = Crosscutting.decomposeTime(endDate);


    return ManagementDashboardDA.getBusinessSummaryReport$('75cafa6d-0f27-44be-aa27-c2c82807742d', timestampType, initDate, endDate)
    .pipe(
      
      mergeMap(result => from(result)
        .pipe(
          map(value => {

            const usersOfSubscriptionSale = Object.keys(value.pos.subscriptionSale)
              .filter(atr => !['count', 'days', 'value'].includes(atr));

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
