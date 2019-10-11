const withFilter = require("graphql-subscriptions").withFilter;
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const { of } = require("rxjs");
const { map, mergeMap, catchError } = require('rxjs/operators');
const broker = require("../../broker/BrokerFactory")();
const RoleValidator = require('../../tools/RoleValidator');
const {handleError$} = require('../../tools/GraphqlResponseTools');

const INTERNAL_SERVER_ERROR_CODE = 1;
const PERMISSION_DENIED_ERROR_CODE = 2;



function getResponseFromBackEnd$(response) {
    return of(response)
    .pipe(
        map(resp => {
            if (resp.result.code != 200) {
                const err = new Error();
                err.name = 'Error';
                err.message = resp.result.error;
                // this[Symbol()] = resp.result.error;
                Error.captureStackTrace(err, 'Error');
                throw err;
            }
            return resp.data;
        })
    );
}



module.exports = {

    //// QUERY ///////
    Query: {
        getHelloWorldFromManagementReport(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles, 'ms-'+'ManagementReport', 'getHelloWorldFromManagementReport', PERMISSION_DENIED_ERROR_CODE, 'Permission denied', [])
            .pipe(
                mergeMap(() =>
                    broker
                    .forwardAndGetReply$(
                        "HelloWorld",
                        "emi-gateway.graphql.query.getHelloWorldFromManagementReport",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "getHelloWorldFromManagementReport")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        managementReportSubscriptionRecharge(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles, 'ms-'+'ManagementReport',
                'managementReportSubscriptionRecharge', PERMISSION_DENIED_ERROR_CODE, 'Permission denied', [])
            .pipe(
                mergeMap(() =>
                    broker
                    .forwardAndGetReply$(
                        "SummaryReport",
                        "emigateway.graphql.query.managementReportSubscriptionRecharge",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "managementReportSubscriptionRecharge")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
    },

    //// MUTATIONS ///////


    //// SUBSCRIPTIONS ///////
    Subscription: {
        ManagementReportHelloWorldSubscription: {
            subscribe: withFilter(
                (payload, variables, context, info) => {
                    return pubsub.asyncIterator("ManagementReportHelloWorldSubscription");
                },
                (payload, variables, context, info) => {
                    return true;
                }
            )
        }

    }
};



//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
    {
        backendEventName: 'ManagementReportHelloWorldEvent',
        gqlSubscriptionName: 'ManagementReportHelloWorldSubscription',
        dataExtractor: (evt) => evt.data,// OPTIONAL, only use if needed
        onError: (error, descriptor) => console.log(`Error processing ${descriptor.backendEventName}`),// OPTIONAL, only use if needed
        onEvent: (evt, descriptor) => console.log(`Event of type  ${descriptor.backendEventName} arraived`),// OPTIONAL, only use if needed
    },
];


/**
 * Connects every backend event to the right GQL subscription
 */
eventDescriptors.forEach(descriptor => {
    broker
        .getMaterializedViewsUpdates$([descriptor.backendEventName])
        .subscribe(
            evt => {
                if (descriptor.onEvent) {
                    descriptor.onEvent(evt, descriptor);
                }
                const payload = {};
                payload[descriptor.gqlSubscriptionName] = descriptor.dataExtractor ? descriptor.dataExtractor(evt) : evt.data
                pubsub.publish(descriptor.gqlSubscriptionName, payload);
            },

            error => {
                if (descriptor.onError) {
                    descriptor.onError(error, descriptor);
                }
                console.error(
                    `Error listening ${descriptor.gqlSubscriptionName}`,
                    error
                );
            },

            () =>
                console.log(
                    `${descriptor.gqlSubscriptionName} listener STOPED`
                )
        );
});


