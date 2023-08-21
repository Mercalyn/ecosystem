/*
date stuff
useage:
-
UNIX
eco.date.refresh() THEN console.log(eco.date.ts.now);
eco.date.typeOf(1610000000); // returns sec or ms for type of unix
eco.date.toUnixType("sec", Date.now()); // types: "sec", or "ms"
eco.date.toIsoString(Date.now()); // returns UTC string
eco.date.toIsoDate(Date.now()); // this returns a date object instead
eco.date.toUnix("2021-08-27T01:30:40.086Z"); // takes UTC, has a "Z" at end, returns sec
-
CONVENIENCE
eco.date.getUTCMethod("dayWeek", 1630900467674); // methods: monthYear, dayWeek, hourDay
eco.date.toOneHotArray("dayWeek", 3); 
*/

const moduleName = "date";

// -------------------------- unix, time storage --------------------------
const typeOf = (unknownUnix) => {
    let length = String(unknownUnix).length;
    if(length === 10){
        return("sec");
    }else if(length === 13){
        return("ms");
    }else{
        return("eco.date.typeOf invalid length");
    };
};
const toUnixType = (type, unix) => {
    if(type === "sec"){
        if(typeOf(unix) === "sec"){
            // sec => sec
            return(unix);
        }else{
            // ms => sec
            return(Math.floor(unix / 1000));
        };
    }else if(type === "ms"){
        if(typeOf(unix) === "ms"){
            // ms => ms
            return(unix);
        }else{
            // sec => ms
            return(unix * 1000);
        };
    }else{
        return("invalid type");
    };
};
const toIsoString = (unix) => {
    unix = toUnixType("ms", unix);
    unix = new Date(unix);
    return(unix.toISOString()); // this is a different, built in date function btw
};
const toIsoDate = (unix) => {
    unix = toUnixType("ms", unix);
    unix = new Date(unix);
    return(unix);
};
const toUnixFromIso = (isoUTC, type) => {
    isoUTC = new Date(isoUTC);
    isoUTC = isoUTC.getTime();
    return(toUnixType(type, isoUTC));
};
const getWeekNumber = (unix) => {
    unix = toUnixType("sec", unix);
    return(Math.floor(unix / 604800));
};
const weekNumberToUnixMs = (weekNum) => {
    return(Math.floor(weekNum * 604800000));
};
const getDayNumber = (unix) => {
    unix = toUnixType("sec", unix);
    return(Math.floor(unix / 86400));
};
const dayNumberToUnixMs = (weekNum) => {
    return(Math.floor(weekNum * 86400000));
};


// -------------------------- utils --------------------------
const getUTCMethod = (UTCMethod, unix) => {
    unix = toIsoDate(unix);
    
    if(UTCMethod === "dayWeek"){
        return(unix.getUTCDay()); // 0=sun 1=mon 2=tue 3=wed 4=thu 5=fri 6=sat 
    }else if(UTCMethod === "monthYear"){
        return(unix.getUTCMonth()); // 0=jan 1=feb 2=mar 3=apr 4=may 5=jun 6=jul 7=aug 8=sep 9=oct 10=nov 11=dec
    }else if(UTCMethod === "hourDay"){
        return(unix.getUTCHours()); // hour: 0-23
    }else{
        return("eco.date.getUTCMethod() ran into an invalid UTCMethod");
    };
};
const toOneHotArray = (UTCMethod, specificValue, customMaxValueNumber) => {
    let maxValuePoss;
    if(UTCMethod === "dayWeek"){
        maxValuePoss = 6;
    }else if(UTCMethod === "monthYear"){
        maxValuePoss = 11;
    }else if(UTCMethod === "hourDay"){
        maxValuePoss = 23;
    }else if(UTCMethod === "custom"){
        maxValuePoss = customMaxValueNumber;
    }else{
        console.log(chalk.red("eco.date.toOneHotArray() invalid UTCMethod!: " + UTCMethod));
    };

    // start array loop difference
    let retArray = [];
    for(let i = 0; i < (specificValue - 0); i++){
        retArray.push(0);
    };

    // middle
    retArray.push(1);

    //end
    for(let i = 0; i < (maxValuePoss - specificValue); i++){
        retArray.push(0);
    };

    return(retArray);
};


export default {
    moduleName,
    typeOf,
    toUnixType,
    toIsoString,
    toIsoDate,
    toUnixFromIso,
    getWeekNumber,
    weekNumberToUnixMs,
    getDayNumber,
    dayNumberToUnixMs,
    getUTCMethod,
    toOneHotArray,
};