/*
mathematic stuff
-
useage:
-
PRECISION
eco.num.fixedDecimal(0.6666666666667, 3); // digit absolute: 3 means .000 precision
eco.num.fixedFloor(0.6666666666667, 3); // fixedFloor rounds down and is digit relative
- 
INDICATORS all are in order of past to present
eco.num.rsi([2,5,23,0,9,23]); // relative strength index, 
eco.num.smaSi([2,5,23,0,9,23]); // sma but strength indexed
eco.num.smaFromSmaSi(); // unprogrammed, but converts back to its non-strength-indexed sma value
eco.num.mfi([1, 2, 3, 4], [7, 7, 7, 7], 4); // modified money flow index
*/

import chalk from 'chalk';
const moduleName = "numerical";


// -------------------------- precision --------------------------
let toFixedAmount = 8; // default fixed places
const fixedDecimal = (float, decimalPlaces) => {
    if(decimalPlaces == undefined){
        decimalPlaces = this.toFixedAmount;
    };
    float = float.toFixed(decimalPlaces);
    return parseFloat((float));
};
const fixedFloor = (float, decimalPlaces) => {
    if(decimalPlaces == undefined){
        decimalPlaces = this.toFixedAmount;
    };
    let digits = 10**decimalPlaces;
    float *= digits;
    float = Math.floor(float);
    float /= digits;
    return float;
};


// -------------------------- util --------------------------
const progressBar = (positionOfWorkInt, maxPositionInt) => {
    // !! this should move to loop eventually
    let percent = this.fixedFloor((positionOfWorkInt / maxPositionInt) * 100, 0);
    //percent = 33; // debug

    // push to an array with | for done percents, and . for not done
    let stringArray = Array(percent).fill("|");
    stringArray.push(...Array(100 - percent).fill("."));

    // join into a string then return
    stringArray = stringArray.join("");
    return stringArray;
};
const randomInt = (minInclusive, maxExclusive) => {
    return(Math.floor((Math.random() * (maxExclusive - minInclusive)) + minInclusive));
};
const randomFloat = (min, max) => {
    return((Math.random() * (max - min)) + min);
};
const arrayDims = (weights, biases) => {
    const outputIndex = weights.length - 1;
    const outputBiasIndex = biases.length - 1;
    console.log(chalk.cyan("dim-0:   ") + chalk.red(weights.length) + chalk.gray(" // layer depth total"));
    console.log(chalk.cyan("dim-1:   ") + chalk.red(weights[0].length) + chalk.gray(" // popSize"));
    console.log("neurons");
    console.log(chalk.cyan("dim-2_i: ") + chalk.red(weights[0][0].length / biases[0][0].length) + chalk.gray(" // width, input"));
    console.log(chalk.cyan("dim-2_n: ") + chalk.red(biases[0][0].length) + chalk.gray(" // width, neuron grid"));
    console.log(chalk.cyan("dim-2_o: ") + chalk.red(biases[outputBiasIndex][0].length) + chalk.gray(" // width, output"));
    console.log("weights");
    console.log(chalk.cyan("dim-2_i: ") + chalk.red(weights[0][0].length) + chalk.gray(" // width, input"));
    console.log(chalk.cyan("dim-2_n: ") + chalk.red(weights[1][0].length) + chalk.gray(" // width, neuron grid"));
    console.log(chalk.cyan("dim-2_o: ") + chalk.red(weights[outputIndex][0].length) + chalk.gray(" // width, output"));
};


// -------------------------- minmax, standardisation --------------------------
const toSigma = (float, offset, sigma) => {
    // take a float and its shift index
    return new Promise((resolve, reject) => {

        let value = this.precise((float - offset) / sigma);
        resolve(value);
    });
};
const fromSigma = (standardised, offset, sigma) => {
    // take a standardised and return its unnormalised float
    return new Promise((resolve, reject) => {

        let value = this.precise((standardised * sigma) + offset);
        resolve(value);
    });
};
const standardize = (mode, value, divisible, offset) => {
    // check mode
    if(mode === "minmax"){
        // minmax
        return(this.fixedFloor(value / divisible, 6));

    }else if(mode === "sigma" || mode === "deviation"){
        // mean 0 deviance 1
        return(this.fixedFloor((value - offset) / divisible, 6));
    };
};


// -------------------------- activation fn --------------------------
const gaussian = (value, mean, variance, normalizedToOne) => {
    /*
    variance * 4 is about the entire width of the start of activation
    so variance .5 mean 0 would mean -1 to 1
    -
    setting value to mean for given varianc will give you max value
    */
    let expTo = -((value - mean) ** 2) / (2 * (variance ** 2));
    let base = (1 / (variance * Math.sqrt(2 * Math.PI)));
    let returnValue = (base * Math.exp(expTo));

    if(normalizedToOne == undefined){
        return(returnValue);
    }else{
        let maxValue = -((mean - mean) ** 2) / (2 * (variance ** 2));
        return(returnValue / (base * Math.exp(maxValue)));
    };
};


export default {
    moduleName,
    toFixedAmount,
    fixedDecimal,
    fixedFloor,
    progressBar,
    randomInt,
    randomFloat,
    toSigma,
    fromSigma,
    standardize,
    gaussian,
    arrayDims,
};
