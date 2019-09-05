"use strict";

const uuidv4 = require("uuid/v4");
const { of, interval, throwError } = require("rxjs");
const { take, mergeMap, catchError, map, toArray, tap } = require('rxjs/operators');
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
    console.log({...args});
    const { businessId } = authToken;
    const {  type, timestampType, initDate, endDate } = args;

    const initDateParsed = Crosscutting.decomposeTime(initDate);
    const endDateParsed = Crosscutting.decomposeTime(endDate);

    return ManagementDashboardDA.getReportByDay$(businessId, timestampType, initDateParsed, endDateParsed)
    .pipe(

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
