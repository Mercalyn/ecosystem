/*
neuralnet is:
-one-stop shop for your neural network needs
-modular
-reuseable
-gpu accelerated
-version 1: fixed grid sizes
-multiple discrete networks built-in for ease of use in evolution
-does not actually do evolution(use this script for feature INPUTS => labelled OUTPUTS)
*/

import chalk from 'chalk';
import { GPU } from 'gpu.js';
import num from '../modules/numerical.js';
import db from '../modules/db.js';
const gpu = new GPU(); // separate gpu instance from evanet
const moduleName = "neuralnet";
const version = 1;


// -------------------------- textures --------------------------
/*
only export get/set methods, since directly editing exported var seems to duplicate
or have weird bugs + its bad practice yo
-
*/
let trefWeights = {};
let trefBiases = {};
let trefSquashFns = {};
let trefCurrentValues = {}; // temp storage of inputs thru to outputs


// -------------------------- init --------------------------
let initConfig, gpuConfig; // stores metadata for easy access to array sizing
const init = (initParams, gpuConfigParams, numFeatures) => {
    // start her up!!
    initConfig = initParams;
    gpuConfig = gpuConfigParams;
    initConfig["numFeatures"] = numFeatures; // numFeatures not init yet
    initConfig.hiddenNeuronDepth = Math.max(1, initConfig.hiddenNeuronDepth); // min: 1
    //console.log(initConfig.hiddenNeuronDepth);

    // make new grid, must pass in neuronHeight
    makeNewGrid(initConfig);
};


// -------------------------- new --------------------------
const makeNewGrid = (initConfig) => {
    /* -------------------------- description --------------------------
    internal utility
    -
    has access to initConfig:
    popSize: 2,
    numCards: numCards, // num cards to slice from market for each train and val
    //numFeatures, // determined by debug mode in evanet.lib
    numActions: 2,
    neuronHeight: 8, // def: 8
    hiddenNeuronDepth: 2, // min: 1, def: 8
    hiddenNeurons: {
        passThru: true, // locked at true for v1, false = random
    },
    featureNeurons: {
        weightsMinMax: [-2, 2], // randomFloat [min, max] for
        biasesMinMax: [-1, 1], // random weight assignment
    },
    actionNeurons: {
        weightsMinMax: [-2, 2], // randomFloat [min, max] for
        biasesMinMax: [-1, 1], // random weight assignment
    },
    euclidPatternMatch: {
        use: false, // locked false for v1
    },
    debugMode: true,
    -
    makeNewGrid will create an entirely new simulation from scratch based on params
    remember that kernels cannot share data, must be unique kernels
    */


    // -------------------------- def kernels --------------------------
    // -------------------------- weights --------------------------
    const returnWeightsRandomKernelFn = function(scale, offset){
        // weights, random
        return((Math.random() * scale) + offset);
    };
    const returnWeightsPassthruKernelFn = function(neuronHeight){
        // weights, passthru
        let mod = this.thread.x % (neuronHeight + 1); // doing this instead of thousands of if() clauses
        mod = Math.min(mod, 1);
        mod = 1 - mod;
        return(mod);
    };
    let wKernels = {};
    wKernels["w_f"] = gpu.createKernel(returnWeightsRandomKernelFn, gpuConfig["1d"]);
    // dynamic hidden depth kernel assignment
    for(let i = 0; i < (initConfig.hiddenNeuronDepth - 1); i++){
        // hiddenNeuronDepth of 1 will not run this script
        wKernels[("w_h_" + i)] = gpu.createKernel(returnWeightsPassthruKernelFn, gpuConfig["1d"]);
    };
    wKernels["w_a"] = gpu.createKernel(returnWeightsRandomKernelFn, gpuConfig["1d"]);
    console.log(Object.keys(wKernels)); // debug:: return just the names of functions


    // -------------------------- biases --------------------------
    const returnBiasesRandomKernelFn = function(scale, offset){
        // biases, random
        return((Math.random() * scale) + offset);
    };
    const returnBiasesNeutralKernelFn = function(){
        // biases, 0 / neutral
        return(0);
    };
    let bKernels = {};
    bKernels["b_f"] = gpu.createKernel(returnBiasesRandomKernelFn, gpuConfig["1d"]);
    // dynamic hidden depth kernel assignment
    for(let i = 0; i < (initConfig.hiddenNeuronDepth - 1); i++){
        // hiddenNeuronDepth of 1 would not run this script
        bKernels[("b_h_" + i)] = gpu.createKernel(returnBiasesNeutralKernelFn, gpuConfig["1d"]);
    };
    bKernels["b_a"] = gpu.createKernel(returnBiasesRandomKernelFn, gpuConfig["1d"]);
    console.log(Object.keys(bKernels)); // debug:: return just the names of functions


    // -------------------------- squash fns --------------------------
    const returnSquashRandomKernelFn = function(){
        // squash, random
        return(Math.floor((Math.random() * 5) - .0001));
    };
    const returnSquashPassthruKernelFn = function(){
        // squash, 0 passthru "linear" type
        return(0);
    };
    let sKernels = {};
    sKernels["s_f"] = gpu.createKernel(returnSquashRandomKernelFn, gpuConfig["1d"]);
    // dynamic hidden depth kernel assignment
    for(let i = 0; i < (initConfig.hiddenNeuronDepth - 1); i++){
        // hiddenNeuronDepth of 1 would not run this script
        sKernels[("s_h_" + i)] = gpu.createKernel(returnSquashPassthruKernelFn, gpuConfig["1d"]);
    };
    sKernels["s_a"] = gpu.createKernel(returnSquashRandomKernelFn, gpuConfig["1d"]);
    console.log(Object.keys(sKernels)); // debug:: return just the names of functions


    // -------------------------- continue makeNewGrid() --------------------------
    // now it's time to actually use those kernels and assign some textures

    // random scale and offset from minmax
    let scale, offset;

    // weights
    // w_f   -- numFeatures * neuronHeight, random
    wKernels.w_f.setOutput([(initConfig.numFeatures * initConfig.neuronHeight)]);
    scale = initConfig.featureNeurons.weightsMinMax[1] - initConfig.featureNeurons.weightsMinMax[0];
    offset = initConfig.featureNeurons.weightsMinMax[0];
    trefWeights["w_f"] = wKernels.w_f(scale, offset);

    // w_h dynamic  -- neuronHeight * neuronHeight, passthru
    for(let i = 0; i < (initConfig.hiddenNeuronDepth - 1); i++){
        // hiddenNeuronDepth of 1 would not run this script
    };

    // w_a   -- neuronHeight * numActions, random
    wKernels.w_a.setOutput([(initConfig.neuronHeight * initConfig.numActions)]);


    // neurons
    // biases
    // b_f

    // b_h dynamic

    // b_a


    // squash fns
    // s_f

    // s_h dynamic

    // s_a
};


// -------------------------- run thru --------------------------
const networkDirector = (input2dArray) => {
    // network run-thru given a set of inputs thru to all pop members' actions

    // assign input features
    tNeuronValues = input2dArray;
    console.log(tWeights);

    // ----------------------------- features to n[0] -----------------------------
    // call accMH

    // --------------------------- grid, n[0] to n[last-1] -------------------------

    // --------------------------- n[last-1] to n[last] ----------------------------
};


// -------------------------- activation / squash functions --------------------------
const squashFnMassHandler = () => {};


// -------------------------- accumulation --------------------------
const accumulationMassHandler = () => {};


// -------------------------- simulation state --------------------------
const exportSimulation = (name) => {
    console.log("exporting...");

    // must have a db and table named "state", name is the string under col name
    db.setDb("db/state.db");
    db.setTable("state");

    // jsonify
    const exportObject = JSON.stringify({
        metaData,
        tWeights,
        tBiases,
        tSquashFunctions,
        tAccumulationTypes,
    });

    db.begin();
    db.createRow([
        "name", 
        "data",
    ], [
        name,
        exportObject,
    ]);
    db.commit();
};
const importSimulation = async (name) => {
    console.log("importing...");

    // must have a db and table named "state", name is the string under col name
    db.setDb("db/state.db");
    db.setTable("state");

    // read db and get the part you want
    let rowData = await db.readAsync("*", "name = '" + name + "'");
    rowData = JSON.parse(rowData[0].data);

    // set working textures
    metaData = rowData.metaData;
    tWeights = rowData.tWeights;
    tBiases = rowData.tBiases;
    tSquashFunctions = rowData.tSquashFunctions;
    tAccumulationTypes = rowData.tAccumulationTypes;

    num.arrayDims(tWeights, tBiases);
};
const deleteAllSimulations = async _ => {
    console.log("deleting all simulations...");

    // must have a db and table named "state", name is the string under col name
    db.setDb("db/state.db");
    db.setTable("state");

    db.begin();
    db.deleteFrom("true")
    db.commit();
};


export default {
    moduleName,
    version,
    init,
    exportSimulation,
    importSimulation,
    deleteAllSimulations,
    networkDirector,
};