"use strict";

require("datejs");
let mongoDB = undefined;
//const mongoDB = require('./MongoDB')();
const COLLECTION_NAME = "TimeBox";
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

  static updateTimeBox$(keys, fieldsToSet, fieldsToInc, secondaryKeys = []) {
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    const _id = keys.map(([k, v]) => v).join('_');
    const [query, update,opt] = [
      { _id },
      {
        '$setOnInsert': { 
          timestamp: Date.now(),
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

    return defer(() => collection.update(query, update,opt)).pipe(
      tap(x => { if (x.result.ok !== 1) throw (new Error(`timeBox(id:${id}) updated failed`)); }),
    );
  }

  
}
/**
 * @returns {ManagementDashboardDA}
 */
module.exports = ManagementDashboardDA;