"use strict";

const { of, forkJoin } = require("rxjs");
const { tap, mergeMap, catchError, map, mapTo, delay, filter } = require("rxjs/operators");
const broker = require("../../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";
const Event = require("@nebulae/event-store").Event;
const eventSourcing = require("../../tools/EventSourcing")();
const uuidv4 = require("uuid/v4");
const WalletDA = require("./data-access/ManagementDashboardDA");

/**
 * Singleton instance
 */
let instance;

class ManagementDashboardCQRS {
  constructor() {

  }

  handleHelloWorld$({aid, data, user}){
    return of(aid);
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
