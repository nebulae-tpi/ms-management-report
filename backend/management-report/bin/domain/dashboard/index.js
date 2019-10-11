"use strict";

const { concat } = require('rxjs');
const ManagementDashboardCQRS = require("./ManagementDashboardCQRS")();
const ManagementDashboardES = require("./ManagementDashboardES")();



const WalletDA = require("./data-access/ManagementDashboardDA");

module.exports = {
  /**
   * domain start workflow ---
   */
  start$: concat(WalletDA.start$()),
  /**
   * @returns {ManagementDashboardCQRS}
   */
  ManagementDashboardCQRS,
  /**
   * @returns {ManagementDashboardES}
   */
  ManagementDashboardES
};

