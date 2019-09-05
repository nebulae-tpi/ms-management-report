"use strict";

require("datejs");
let mongoDB = undefined;
//const mongoDB = require('./MongoDB')();
const COLLECTION_NAME = "BusinessUnitSummary";
const { CustomError } = require("../../../tools/customError");
const { map, mergeMap, reduce, tap } = require("rxjs/operators");
const { of, Observable, defer, from, range } = require("rxjs");

class ManagementDashboardDA {
  static start$(mongoDbInstance) {
    return Observable.create(observer => {
      if (mongoDbInstance) {
        mongoDB = mongoDbInstance;
        observer.next("using given mongo instance");
      } else {
        mongoDB = require("../../../data/MongoDB").singleton();
        observer.next(" -------------using singleton system-wide mongo instance");
      }
      observer.complete();
    });
  }

  static updateTimeBox$(timestamp, keys, fieldsToSet, fieldsToInc, secondaryKeys = []) {
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    const _id = keys.map(([k, v]) => v).join('_');
    const [query, update, opt] = [
      { _id },
      {
        '$setOnInsert': { 
          timestamp,
          ...keys.reduce((obj, [key, value]) => { obj[key] = value; return obj; }, {}),
          ...secondaryKeys.reduce((obj, [key, value]) => { obj[key] = value; return obj; }, {})
        },
      },
      { 'multi': false, upsert: true }
    ];
    if( fieldsToInc.length > 0){      
      update['$inc'] = fieldsToInc.reduce((obj, [key, value]) => { obj[key] = value; return obj; }, {});
    }
    if( fieldsToSet.length > 0){
      update['$set'] = fieldsToSet.reduce((obj, [key, value]) => { obj[key] = value; return obj; }, {});
    }

    return defer(() => collection.update(query, update, opt)).pipe(
      tap(x => { if (x.result.ok !== 1) throw (new Error(`BusinessUnitSummary(id:${id}) updated failed`)); }),
    );
  }

  static getReportByDay$(businessId, timestampType, initDateParsed, endDateParsed){
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    const query = { businessId, timestampType: timestampType};
    switch (timestampType) {
      case 'DAY':
        query.DAY_OF_YEAR = { $gte: initDateParsed.dayOfYear , $lte: endDateParsed.dayOfYear }  
        break;
      case 'WEEK':
          query.WEEK = { $gte: initDateParsed.week , $lte: endDateParsed.week }
          break;
      case 'MONTH':
        query.MONTH = { $gte: initDateParsed.month , $lte: endDateParsed.month }
        break;
    
      default:
        break;
    }

    return defer(() => collection.find(query).toArray())
  }

  
}
/**
 * @returns {ManagementDashboardDA}
 */
module.exports = ManagementDashboardDA;
