'use strict'

const uuidv4 = require("uuid/v4");
const GMT_OFFSET = ((parseInt(process.env.GMT_TO_SERVE.replace('GMT', '') * 60)) + new Date().getTimezoneOffset()) * 60000;
const gregorian = require('weeknumber');

class Crosscutting{

    /**
     * Generates an uuid based on the uuid/v4 library and at the end 
     * of this uuid concatenates the month and the year. 
     * This is useful for cases where the info will be stored in collections by month.
     * 
     * @param {*} date Date with which will be generated the suffix of the uuid.
     */
    static generateHistoricalUuid(date) {
        const dateGMT = new Date(date.getTime() + GMT_OFFSET)
        const sufixUuid = this.getMonthYear(dateGMT);
        const uuId = `${uuidv4()}-${sufixUuid}`;
        return uuId;
    }

    /**
     * Generates a suffix (MMyy) according to the date.
     * Format: MMyy
     * 
     * @example
     * month: 06
     * year: 2018
     * // returns 0618
     * 
     * @param {*} date 
     */
    static getMonthYear(date){
        let month = date.getMonth()+1;
        let year = date.getFullYear() + '';
        month = (month.length == 1 ? '0': '') + month;
        year = year.substr(year.length - 2)

        return `${month}${year}`;
    }

    static decomposeTime(ts) {
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
 * @returns {Crosscutting}
 */
module.exports = Crosscutting;