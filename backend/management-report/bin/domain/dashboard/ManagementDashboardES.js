"use strict";

const { of, forkJoin } = require("rxjs");
const { tap, mergeMap, catchError, map, mapTo, delay, filter } = require("rxjs/operators");
const broker = require("../../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";
const Event = require("@nebulae/event-store").Event;
const eventSourcing = require("../../tools/EventSourcing")();
const uuidv4 = require("uuid/v4");
const DashboardDA = require("./data-access/ManagementDashboardDA");

/**
 * Singleton instance
 */
let instance;

class ManagementDashboardCQRS {
  constructor() {

  }

  handleVehicleSubscriptionPaid$({ et, etv, at, aid, user, timestamp, av, data }){
    const { licensePlate, packProduct, quantity, amount, daysPaid } = data;
    const { year, monthStr, month, week, dayOfWeek, dayOfWeekStr, dayOfYear, dayOfMonth, hourOfDay, minute, second } = this.decomposeTime(timestamp);

    const fieldsToSet = [['lastUpdate', Date.now()]];
    const fieldsToInc = [];
    
    fieldsToInc.push([`subscription.payment.count`, 1]);
    fieldsToInc.push([`subscription.payment.days`, daysPaid]);
    fieldsToInc.push([`subscription.payment.value`, amount ]);

    return forkJoin(
      // YEAR
      DashboardDA.updateTimeBox$(
        [ ['businessId', businessId], ['timespanType', 'YEAR'], ['YEAR', year] ], fieldsToSet, fieldsToInc
      ),
      // MONTH
      DashboardDA.updateTimeBox$(
        [ ['businessId', businessId], ['timespanType', 'MONTH'], ['YEAR', year], ['MONTH', month] ],
        fieldsToSet, fieldsToInc, [['MONTH_NAME', monthStr]]
      ),
      // WEEK
      DashboardDA.updateTimeBox$(
        [ ['businessId', businessId], ['timespanType', 'WEEK'], ['YEAR', year], ['MONTH', month], ['WEEK', week] ],
        fieldsToSet, fieldsToInc
      ),
      // DAY
      DashboardDA.updateTimeBox$(
        [ ['businessId', businessId], ['timespanType', 'DAY'], ['YEAR', year], ['MONTH', month], ['DAY', dayOfMonth] ],
        fieldsToSet, fieldsToInc,
        [ ['WEEK', week], ['DAY_OF_YEAR', dayOfYear], ['DAY_NAME', dayOfWeekStr], ['DAY_OF_WEEK', dayOfWeek] ]
      ),
    );
  }

  decomposeTime(ts) {
    //2018-12-4 17:12:05
    const date = new Date(new Date(ts).toLocaleString('es-CO', { timeZone: 'America/Bogota' }));
    const { year, week, day } = gregorian.weekNumberYear(date);
    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRY', 'SAT', 'SUN'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',];
    return {
        year,
        monthStr: months[date.getMonth()],
        month: date.getMonth() + 1,
        week,
        dayOfWeek: day,
        dayOfWeekStr: daysOfWeek[day - 1],
        dayOfYear: gregorian.dayOfYear(date),
        dayOfMonth: date.getDate(),
        hourOfDay: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds()
    };
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