/*
marketslice will grab a training and val chunk from ccf_data.db and return training cards
*/

import chalk from 'chalk';
import { GPU } from 'gpu.js';
import num from '../modules/numerical.js';
import dbMin from '../modules/db.js';
import dbHour from '../modules/db.js';
import dbDay from '../modules/db.js';
import dydx from '../../dydx.config.js';
const gpu = new GPU(); // separate gpu instance from evanet
const moduleName = "marketslice";
const version = 1;


// -------------------------- internal utils --------------------------
const dataGrab = () => {
    return new Promise((resolve, reject) => {
        //
    });
};

const debugUnixCount = (firstUnix, secondUnix) => {
    let numMins = ((secondUnix - firstUnix) / 60) + 1;
    let numHours = ((secondUnix - firstUnix) / 3600) + 1;
    let numDays = ((secondUnix - firstUnix) / 86400 + 1);
    console.log(chalk.red("inclusive range count -- mins: " + numMins + " -- hours: " + numHours + " -- days: " + numDays));
};

const getValidChunk = (pair, overwriteSelection) => {
    return new Promise(async (resolve, reject) => {
        /*
        for the pair find a valid chunk for both train and val
        windowDepth refers to the number of training cards for each train and val
        e.g. 2 would return 2 different training cards with data almost totally overlapping except offset by one 1min bar sequentially, and 1hour and 1day bars if/when they changeover
        -
        pair = "eth", etc
        overwriteSelection = [train, val] e.g. = [1631404800, 1676592000]
        */

        const windowDepth = 2;
        const buffer = {
            small: 2,
            big: 4,
        }; // buffer is there in case start or ending card needs more data due to possibility of selection not being divisible by 86400 (day) and therefore needing more or less data by 1 bar

        // set possible ranges
        const trainRange = [
            dydx.markets[pair].marketStart + (86400 * (31 + buffer.big)), // start marketStart + 31 days
            dydx.markets[pair].valStart - (60 * (windowDepth + buffer.big)) // end valStart - windowDepth in mins
        ];
        const valRange = [
            dydx.markets[pair].valStart + (86400 * (31 + buffer.big)), // start valStart + 31 days
            dydx.markets.allMarketsEnd - (60 * (windowDepth + buffer.big)) // end allMarketsEnd - windowDepth in mins
        ];
        //console.log(trainRange);

        // get overwriteSelection mode
        let trainSelection, valSelection;
        if(overwriteSelection != undefined){
            // overwrite with values
            [trainSelection, valSelection] = overwriteSelection;
        }else{
            // set with random, divisible by minute
            trainSelection = Math.floor(num.randomInt(trainRange[0], trainRange[1]) / 60) * 60;
            valSelection = Math.floor(num.randomInt(valRange[0], valRange[1]) / 60) * 60;
        };
        //console.log(trainSelection);


        /*
        get unix range for min, hour, day 
        should be range needed for a single training card + windowDepth + buffer
        db reads are *expensive* so make sure to only have to call it 3 times
        then slice it
        */

        // reference unix' are the starting point reference for the 0-th index to go back from inclusive
        const refMinute = {
            train: trainSelection,
            val: valSelection,
        };
        const refHour = {
            train: (Math.floor(refMinute.train / 3600) - 1) * 3600,
            val: (Math.floor(refMinute.val / 3600) - 1) * 3600,
        };
        const refDay = {
            train: (Math.floor(refMinute.train / 86400) - 1) * 86400,
            val: (Math.floor(refMinute.val / 86400) - 1) * 86400,
        };
        //console.log(refDay.val);

        // minutes
        let minuteUnixRange = {
            train: {
                start: refMinute.train - ((120 - 1) * 60), // 120 - 1 mins, 60 unix per min
                end: refMinute.train + ((windowDepth - 1) * 60), // num windows - 1 mins
            },
            val: {
                start: refMinute.val - ((120 - 1) * 60),
                end: refMinute.val + ((windowDepth - 1) * 60),
            },
        };
        //debugUnixCount(minuteUnixRange.val.start, minuteUnixRange.val.end);

        // hours
        let hourUnixRange = {
            train: {
                start: 0, //
                end: 0,
            },
            val: {
                start: 0,
                end: 0,
            },
        };

        // async threaded data grab
        //db.setDb("db/ccf_data.db");
        //db.setTable(dydx.markets[pair].tableName + "_1MIN");


        
        resolve();
    });
};


// -------------------------- external utils --------------------------
const getTrainingCards = (pair, overwriteSelection) => {
    return new Promise(async (resolve, reject) => {
        getValidChunk(pair, overwriteSelection);
        resolve();
    });
};



export default {
    moduleName,
    version,
    getTrainingCards,
};