'use strict'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const eventSourcing = require('./tools/EventSourcing')();
const eventStoreService = require('./services/event-store/EventStoreService')();
const mongoDB = require('./data/MongoDB').singleton();
const graphQlService = require('./services/emi-gateway/GraphQlService')();
const ManagementDashboard = require("./domain/dashboard");
const { concat, forkJoin } = require('rxjs');

const start = () => {
    concat(
        eventSourcing.eventStore.start$(),
        eventStoreService.start$(),
        mongoDB.start$(),
        forkJoin(
            ManagementDashboard.start$
        ),
        graphQlService.start$()
    ).subscribe(
        (evt) => {
            // console.log(evt)
        },
        (error) => {
            console.error('Failed to start', error);
            process.exit(1);
        },
        () => console.log('management-report started')
    );
};


start();



