/*
evanet is:
-a library dedicated to neuro evolution
-uses neuralnet.js for the neural networked inputs => actions
-will use neuraltest.js for the actions => L7 and U scores
-gpu accelerated
-performs evolutionary concepts such as:
    -elitism
    -tournaments
    -forking/mutating
    -creativity(behaviour) preservation
    -crossover
DEBUG::
// market slice
*/

import chalk from 'chalk';
import neuralNet from './evolution/neuralnet.js';
import marketSlice from './evolution/marketslice.js';
import { GPU } from 'gpu.js';
const gpu = new GPU(); // separate gpu instance from neuralnet
const gpuConfig = {
    "1d": {
        pipeline: true,
        dynamicOutput: true,
        output: [1],
    },
    "2d": {
        pipeline: true,
        dynamicOutput: true,
        output: [1, 1],
    },
    "3d": {
        pipeline: true,
        dynamicOutput: true,
        output: [1, 1, 1],
    },
};
const moduleName = "evaNet";
const version = 1;



// -------------------------- textures --------------------------
let tTrainCards, tValCards;
let tSelectionMask = [];
let trefCardsAll = {};


// -------------------------- init --------------------------
const init = (initParams) => {
    return new Promise(async (resolve, reject) => {
        /* -------------------------- description --------------------------
        example initParams:
        --
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
        the reason kernels are defined in init is because they actually need to wait until data has been given to
        neuralnet, otherwise the kernel tries to do stuff without that stuff being 'defined'
        */


        // -------------------------- def kernels --------------------------
        const loadCardsIntoMemoryKernelFn = function(array2d){
            return(array2d[this.thread.y][this.thread.x]);
        };
        const loadCardsIntoMemoryKernel = {
            train: gpu.createKernel(loadCardsIntoMemoryKernelFn, gpuConfig["2d"]),
            val: gpu.createKernel(loadCardsIntoMemoryKernelFn, gpuConfig["2d"]),
        };
        
        
        // -------------------------- continue init() --------------------------
        // call market slice, regular 2d arrays
        let [trainingCards2d, valCards2d] = await marketSlice.getTrainingCards("eth", initParams.numCards, initParams.debugMode);
        //console.table(trainingCards2d[0].length);

        // retrieve feature height
        let numFeatures = trainingCards2d[0].length;
   
        // send initParams to neuralnet for metadata
        // this will also trigger a make new grid
        neuralNet.init(initParams, gpuConfig, numFeatures);

        // load to gpu tref which dont have the train and val keys yet
        loadCardsIntoMemoryKernel.train.setOutput([numFeatures, initParams.numCards]);
        loadCardsIntoMemoryKernel.val.setOutput([numFeatures, initParams.numCards]);
        trefCardsAll["train"] = loadCardsIntoMemoryKernel.train(trainingCards2d);
        trefCardsAll["val"] = loadCardsIntoMemoryKernel.val(valCards2d);
        //console.log(trefCards.train.toArray());

        // init size for getting a single card
        getTrainingCardOnIndexKernel.train.setOutput([numFeatures]);
        getTrainingCardOnIndexKernel.val.setOutput([numFeatures]);


        resolve();
    });
};


// -------------------------- step --------------------------
// -------------------------- def kernels --------------------------
const getTrainingCardOnIndexKernelFn = function(texture2d, index){
    return(texture2d[index][this.thread.x]);
};
const getTrainingCardOnIndexKernel = {
    train: gpu.createKernel(getTrainingCardOnIndexKernelFn, gpuConfig["1d"]),
    val: gpu.createKernel(getTrainingCardOnIndexKernelFn, gpuConfig["1d"]),
};


// -------------------------- continue step() --------------------------
const step = (marketSliceIndex) => {
    return new Promise(async (resolve, reject) => {
        /* -------------------------- description --------------------------
        step once thru network run thru, creativity scoring, action-space behavior scoring, and evolution
        -
        the reason kernel functions are not in here is because they only need to be defined once
        */

        // take the market slice index and return a single card for ea
        // this is local since it won't be needed anywhere else
        let trefSingleCard = {
            train: getTrainingCardOnIndexKernel.train(trefCardsAll.train, marketSliceIndex),
            val: getTrainingCardOnIndexKernel.val(trefCardsAll.val, marketSliceIndex),
        };
        //console.log(trefSingleCard.train.toArray());

        // send it to network director for a network run-thru w/ simultaneous market sim



        // add to Unique score texture

        // add to L7 score texture

        // evolution time

        // the upper loop will decide whether or not to export simulation, e.g. every 10 evo steps

        resolve(); 
    });
};


// -------------------------- analysis / utils --------------------------
const exportSimulation = neuralNet.exportSimulation;
const importSimulation = neuralNet.importSimulation;
const deleteAllSimulations = neuralNet.deleteAllSimulations;
const networkDirector = neuralNet.networkDirector;


// -------------------------- debug --------------------------
const evaTest = () => {
    
};



// -------------------------- GPU mass selection methods --------------------------



// -------------------------- vault --------------------------
    

export default {
    moduleName,
    version,
    gpu, // export gpu context
    init,
    step,
    exportSimulation,
    importSimulation,
    deleteAllSimulations,
};