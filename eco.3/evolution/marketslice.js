/*
marketslice will grab a training and val chunk from ccf_norm_data.db and return training cards
*/

import chalk from 'chalk';
import num from '../modules/numerical.js';
import db from '../modules/db.js';
import dydx from '../../dydx.config.js';
const moduleName = "marketslice";
const version = 1;

// DEBUG::
/*
const numMins = 120; // 120 // number refers to amount inside a single window
const numHours = 72; // 72
const numDays = 30; // 30
*/
// remap Min, Hour, Day in getValidChunk comment out unix
// getTrainingCards DEBUG selection comment out
// getValidChunk for loop needs flat() uncomment out


// -------------------------- internal utils --------------------------
const dataGrab = (pair, windowDepth, uppermostMinute, numMins, numHours, numDays) => {
    return new Promise(async (resolve, reject) => {
        /*
        uppermostMinute is the highest unix divisible by day(86400) that is the highest unix that will be grabbed
        in minute candles, the min candles comprise the totality of the data that was requested.
        hour and day candles will just grab extra of, and then the division and pushing into new windows will happen afterwards outside of this fn
        */

        // DEBUG::
        const minsInHour = 60; // 60 // debug purely for oboe's
        const minsInDay = 1440; // 1440

        // get totals
        const totalMins = numMins + windowDepth - 1; // total as in length
        const totalHours = numHours + Math.ceil(windowDepth / minsInHour); // ceil is the buffer for extra hours
        const totalDays = numDays + Math.ceil(windowDepth / minsInDay);

        // set db
        db.setDb("db/ccf_norm_data.db");

        // min read
        let lowermostMinute = uppermostMinute - (60 * (totalMins - 1)); // - 1 here because between is inclusive
        let minRows = await db.readAndOrderFromTable(
            dydx.markets[pair].tableName + "_1MIN",
            "unix, o_n, h_n, l_n, c_n, v_n, minhour", 
            "unix DESC", 
            "unix BETWEEN " + lowermostMinute + " AND " + uppermostMinute
        );
        //console.log(minRows.length);

        // hour read
        let uppermostHour = uppermostMinute - 3600; // increment it down by a full hour so it doesn't have access to information that hasn't happened yet
        let lowermostHour = uppermostHour - (3600 * (totalHours - 1)); // - 1 here because between is inclusive
        let hourRows = await db.readAndOrderFromTable(
            dydx.markets[pair].tableName + "_1HOUR",
            "unix, o_n, h_n, l_n, c_n, v_n, tpv, opint_n, nfund_n, oracle_n", 
            "unix DESC", 
            "unix BETWEEN " + lowermostHour + " AND " + uppermostHour
        );
        //console.log(hourRows);

        // day read
        let uppermostDay = uppermostMinute - 86400; // increment it down by a full day so it doesn't have access to information that hasn't happened yet
        let lowermostDay = uppermostDay - (86400 * (totalDays - 1)); // - 1 here because between is inclusive
        let dayRows = await db.readAndOrderFromTable(
            dydx.markets[pair].tableName + "_1DAY",
            "unix, o_n, h_n, l_n, c_n, v_n, tpv", 
            "unix DESC", 
            "unix BETWEEN " + lowermostDay + " AND " + uppermostDay
        );

        resolve([minRows, hourRows, dayRows]);
    });
};

const testOrder = () => {
    let sm = [[0],1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    let md = ["a","b","c","d","e","f"];
    let lg = ["j","k","l"];

    md.shift();
    lg.shift();
    let final = sm.map((item, index) => {
        return([
            item,
            md[Math.floor(index / 4)],
            lg[Math.floor(index / 8)]
        ].flat());
    });
    console.log(final);
};

const debugUnixCount = (firstUnix, secondUnix) => {
    let numMins = ((secondUnix - firstUnix) / 60) + 1;
    let numHours = ((secondUnix - firstUnix) / 3600) + 1;
    let numDays = ((secondUnix - firstUnix) / 86400 + 1);
    console.log(chalk.red("inclusive range count -- mins: " + numMins + " -- hours: " + numHours + " -- days: " + numDays));
};

const getValidChunk = (pair, windowDepth, unixSelection, numMins, numHours, numDays) => {
    return new Promise(async (resolve, reject) => {
        /*
        for the pair find a valid chunk for train or val depending on mode
        windowDepth refers to the number of training cards
        e.g. 2 would return 2 different training cards with data almost totally overlapping except offset by one 1min bar sequentially, and 1hour and 1day bars if/when they changeover
        pair = "eth", etc
        -
        this is the actual slicing function
        */

       
        // db read
        let [minuteRows, hourRows, dayRows] = await dataGrab(pair, windowDepth, unixSelection, numMins, numHours, numDays);
        // here we have access to the db read which has all of the data needed for slicing
        /*
        console.table(minuteRows); // the minutes have exactly the necessary amount
        console.table(hourRows); // hour and day rows have a buffer of necessary +1
        console.table(dayRows);
        */


        // remap to separate minhour from mins, and also strip the array of objects into just a 2d array
        let remapMinhour = minuteRows.map((item, index) => { // minutes minhour
            return(item.minhour);
        });
        let remapMin = minuteRows.map((item, index) => { // minutes ohlcv, qty 5
            return([
                //item.unix, // DEBUG
                item.o_n,
                item.h_n,
                item.l_n,
                item.c_n,
                item.v_n
            ]);
        });
        let remapHour = hourRows.map((item, index) => { // hours ohlcv tpv opint nfund oracle, qty 9
            return([
                //item.unix, // DEBUG
                item.o_n,
                item.h_n,
                item.l_n,
                item.c_n,
                item.v_n,
                item.tpv,
                item.opint_n,
                item.nfund_n,
                item.oracle_n
            ]);
        });
        let remapDay = dayRows.map((item, index) => { // days ohlcv tpv, qty 6
            return([
                //item.unix, // DEBUG
                item.o_n,
                item.h_n,
                item.l_n,
                item.c_n,
                item.v_n,
                item.tpv
            ]);
        });
        //console.log(remapDay);


        // windowDepth is the array height, so for loop it
        let trainingCards2d = []; // final 2d array full of training cards
        for(let i = 0; i < windowDepth; i++){
            let innerWindowArray = [];

            // push its top index minhour
            innerWindowArray.push(remapMinhour[i]);

            // push slice of mins
            innerWindowArray.push(...remapMin.slice(i, i + numMins));

            // push slice of hours
            let hourStartIndex = Math.floor(i / 60); // 60
            innerWindowArray.push(...remapHour.slice(hourStartIndex, hourStartIndex + numHours));

            // push slice of days
            let dayStartIndex = Math.floor(i / 1440); // 1440
            innerWindowArray.push(...remapDay.slice(dayStartIndex, dayStartIndex + numDays));

            // push qty8 filled with 0s for memory bits
            innerWindowArray.push(new Array(8).fill(0));

            // flatten, the reason ...spread array isn't just pushed direct is for debug reasons
            innerWindowArray = innerWindowArray.flat();

            // verify length is minhour + (ohlcv * mins) + (ohlcv tpv opint nfund oracle * hours) + 
            // (ohlcv tpv * days)
            const verifyLength = 1 + (5 * numMins) + (9 * numHours) + (6 * numDays);
            /*
            console.log(verifyLength);
            console.log(innerWindowArray.length);
            */
            //console.table(innerWindowArray);

            trainingCards2d.push(innerWindowArray);
        };

        resolve(trainingCards2d);
    });
};

const debugTester = (array2d) => {
    let debugArray = [];
    for(let i = 0; i < array2d.length; i++){
        // minhour diff
        //debugArray.push(array2d[i][0]);

        // min ohlc
        //debugArray.push(array2d[i][1][0]);

        // hour ohlc
        //debugArray.push(array2d[i][121][0]);

        // day ohlc
        //debugArray.push(array2d[i][200][0]);

        // min-to-hour diff
        //debugArray.push(array2d[i][1][0] - array2d[i][121][0]);

        // min-to-day diff
        debugArray.push(array2d[i][1][0] - array2d[i][200][0]);
    };

    let finalArray = []
    let count = 0;
    for(let i = 0; i < debugArray.length - 1; i++){
        /* //minhour
        let minhourDiff = debugArray[i + 1] - debugArray[i];
        (minhourDiff === -59) ? minhourDiff = 1 : false;
        (minhourDiff !== 1) ? finalArray.push("err") : false;
        */

        // everything else uses diff
        let diff = debugArray[i] - debugArray[i + 1];

        // // min ohlc
        //(diff !== 60) ? finalArray.push("err") : false;

        // hour ohlc
        //(diff !== 0) ? finalArray.push(diff) : false;

        // day ohlc
        //(diff !== 0) ? finalArray.push(diff) : false;

        // min-to-hour diff
        //(debugArray[i] < 60) ? finalArray.push("err") : false;
        //(diff !== 60) ? finalArray.push(diff) : false;

        // min-to-day diff
        (debugArray[i] < 60) ? finalArray.push("err") : false;
        (diff !== 60) ? finalArray.push(diff) : false;
        
    };
    console.table(finalArray);
};


// -------------------------- external utils --------------------------
const getTrainingCards = (pair, windowDepth, debugMode) => {
    return new Promise(async (resolve, reject) => {
        /*
        only method that is exposed, everything else is internal to the script
        */
        

        // check if debug mode
        let trainSelection, valSelection, numMins, numHours, numDays;
        if(debugMode){

            // debug set to true, set to preset selection values
            [trainSelection, valSelection] = [1642636800, 1677978000];

            // set debug number of each candles
            numMins = 1; // 120 // number refers to amount inside a single window
            numHours = 1; // 72
            numDays = 1; // 30
        }else{

            // debug set to false, continue to find the valid ranges and get random from those ranges
            const buffer = 4; // safety buffer

            // set possible ranges
            const trainRange = [
                dydx.markets[pair].marketStart + (86400 * (31 + buffer)), // start marketStart + 31 days
                dydx.markets[pair].valStart - (60 * (buffer)) // end valStart - buffer
            ];
            const valRange = [
                dydx.markets[pair].valStart + (86400 * (31 + buffer)), // start valStart + 31 days
                dydx.markets.allMarketsEnd - (60 * (buffer)) // end allMarketsEnd - buffer
            ]; // the 2nd number represents the highest unix and most recent, working backwards

            // select random within range and divisible by day
            trainSelection = Math.floor(num.randomInt(trainRange[0], trainRange[1]) / 86400) * 86400;
            valSelection = Math.floor(num.randomInt(valRange[0], valRange[1]) / 86400) * 86400;

            // set real number of each candles
            numMins = 120; // 120 // number refers to amount inside a single window
            numHours = 72; // 72
            numDays = 30; // 30
        };
        //console.log(trainSelection);


        // now call the actual slicer for each training and val
        // first for training
        let trainingCards2d = await getValidChunk(pair, windowDepth, trainSelection, numMins, numHours, numDays);

        // second for validating data, same length as train
        let valCards2d = await getValidChunk(pair, windowDepth, valSelection, numMins, numHours, numDays);


        // DEBUG::test that all the unix differences are correct, unflat and have unix push in maps
        //debugTester(trainingCards2d);
        //console.log(trainingCards2d.length);
        //console.log(trainingCards2d[0].length);

        //testOrder();
        resolve([trainingCards2d, valCards2d]);
    });
};



export default {
    moduleName,
    version,
    getTrainingCards,
};