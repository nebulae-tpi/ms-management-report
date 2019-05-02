"use strict";

const { of, forkJoin } = require("rxjs");
const { tap, mergeMap, catchError, map, mapTo, delay, filter } = require("rxjs/operators");
const broker = require("../../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";
const Event = require("@nebulae/event-store").Event;
const eventSourcing = require("../../tools/EventSourcing")();
const uuidv4 = require("uuid/v4");
const gregorian = require('weeknumber');
const DashboardDA = require("./data-access/ManagementDashboardDA");
const SUBSCRIPTION_TYPE_PRICES = { WEEK: 12000 };

/**
 * Singleton instance
 */
let instance;

class ManagementDashboardCQRS {
  constructor() {
    // of({})
    // .pipe(
    //   delay(3000),
    //   mergeMap(() => eventSourcing.eventStore.emitEvent$(
    //     new Event({
    //       eventType: "VehicleSubscriptionPaid",
    //       eventTypeVersion: 1,
    //       aggregateType: "Vehicle",
    //       aggregateId: uuidv4(),
    //       data: {
    //         licensePlate: 'TKM909',
    //         packProduct: 'WEEK',
    //         quantity: 3,
    //         amount: 36000,
    //         businessId: 'q1w2e3-r4t5-y6u7',
    //         daysPaid: 21
    //       },
    //       user: 'juan.santa'
    //     })
    //   ),      
    //   )
    // )
    // .subscribe(ok => {}, e => console.log(e), () => {})
  }

  handleVehicleSubscriptionPaid$({ et, etv, at, aid, user, timestamp, av, data }){
    console.log({ et, etv, at, aid, user, timestamp, av, data });
    const { licensePlate, packProduct, quantity, amount, daysPaid } = data;
    let businessId = data.businessId;
    const { year, monthStr, month, week, dayOfWeek, dayOfWeekStr, dayOfYear, dayOfMonth, hourOfDay, minute, second } = this.decomposeTime(timestamp);

    const fieldsToSet = [['lastUpdate', Date.now()]];
    const fieldsToInc = [];
    
    // TEMPORAL FIX 
    const nebulaPlates = ['FQX351', 'DSV006', 'DER596', 'MNP137', 'IEY523', 'FQX252', 'TSZ705', 'RTF752', 'IHR821'];
    if(!businessId){
      businessId = nebulaPlates.includes(licensePlate) 
        ? "bf2807e4-e97f-43eb-b15d-09c2aff8b2ab" // Nebula
        : "75cafa6d-0f27-44be-aa27-c2c82807742d" // TXPlus
    }
    // TEMPORAL FIX
    
    fieldsToInc.push([`subscription.payment.count`, 1]);
    fieldsToInc.push([`subscription.payment.days`, daysPaid]);
    fieldsToInc.push([`subscription.payment.value`, amount ? amount : SUBSCRIPTION_TYPE_PRICES[packProduct] ]);

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
