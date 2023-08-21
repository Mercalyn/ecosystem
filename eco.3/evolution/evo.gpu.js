/*
evolution:
single running simulation evolution with districts to enforce member creativity
-
this is the lightning-fast, gpu version that stores as textures, and processes everything in parallel on GPU
-
const eg = require('./eco.x/evo.gpu.js');
-
gpu texture for members:
[
    [
        0th index is reserved for score,
        1st for district,
        2nd and beyond will list params
    ],
    [],
    [],
    ...
]
separate array for min and max so as not to duplicate it for every member
decimals is not needed, as 32 bit float stores as its most efficient manner
designation not available until very last minute, possibly convert in client
-
another difference from the CPU version is that it doesn't build new member arrays and sets
the main array to that, instead the GPU version will apply lightning-fast matrix transformations
*/


const chalk = require('chalk');
const fs = require('fs');
const { GPU } = require('gpu.js');
const gpu = new GPU();



module.exports = {
    moduleName: "evolution.GPU",
    version: 1, // single running simulation evolution, no vault
    gpu, // in order to get the same context, this exports gpu object so that the test function closure can pass the kernel in


    // -------------------------- setup --------------------------
    populationTexture: [], // all textures are stored as references to VRAM in the GPU
    tempPopulationTexture : [],
    popWidth: -1,
    popHeight: -1, // these 2 are used to store x, y sizes so we can set any kernel to output size
    createPopulation: gpu.createKernel(function(min, max){
        // catch first two indices holding other info
        if(this.thread.x === 0){
            // score
            return(-1);
        }else if(this.thread.x === 1){
            // district
            return(-1);
        }else{
            // remainder: params
    
            // by using this.thread.x as the accessor to min and max arrays, you can access
            // *that position for its position in the member array
            let value = (Math.random() * (max[this.thread.x - 2] - min[this.thread.x - 2])) + min[this.thread.x - 2];
            
            return(value);
        };
    }).setOptimizeFloatMemory(true).setPipeline(true).setDynamicOutput(true).setOutput([1, 1]), // setOutput here will be set to real size at time of need
    createPopulationFromLoad: gpu.createKernel(function(file2dArray, numMembers, min, max){
        // catch first two indices holding other info
        if(this.thread.x === 0){
            // score
            return(-1);
        }else if(this.thread.x === 1){
            // district
            return(-1);
        }else{
            // remainder: params
    
            // scroll thru select from eliteMembers
            let value = 0;
            if(this.thread.y < numMembers){
                value = file2dArray[this.thread.y][this.thread.x];
            }else{
                value = (Math.random() * (max[this.thread.x - 2] - min[this.thread.x - 2])) + min[this.thread.x - 2];
            };
            
            return(value);
        };
    }).setOptimizeFloatMemory(true).setPipeline(true).setDynamicOutput(true).setOutput([1, 1]),


    // -------------------------- math utils --------------------------
    randomInt(minIncl, maxExcl){ // min inclusive, max exclusive
        return(Math.floor((Math.random() * (maxExcl - minIncl)) + minIncl));
    },


    // -------------------------- analysis / utils --------------------------
    popDims(){
        /*
        outputs array size in 
        1D [width]
        2D [width, height]
        3D [depth, width, height]
        */

        // check dim
        let regArray = this.populationTexture.toArray();
        if(regArray[0].length == undefined){
            // 1D
            console.log([regArray.length]);
        }else if(regArray[0][0].length == undefined){
            // 2D
            console.log([regArray.length, regArray[0].length]);
        }else if(regArray[0][0][0].length == undefined){
            // 3D
            console.log([regArray.length, regArray[0].length, regArray[0][0].length]);
        }else{
            // max supported 4D
        };
    },
    samplePopMember(){
        /*
        samples the first member to see what is inside
        */

        // check dim
        let regArray = this.populationTexture.toArray();
        if(regArray[0].length == undefined){
            // 1D
            console.log(regArray);
        }else if(regArray[0][0].length == undefined){
            // 2D
            console.log(regArray[0]);
        }else if(regArray[0][0][0].length == undefined){
            // 3D
            console.log(regArray[0][0]);
        }else{
            // max supported 4D
        };
        
        
    },
    outputDestMask(){
        /*
        samples the first member to see what is inside
        */
        /*
        let regArray = this.destinationMask.toArray();
        console.log(regArray);
        */
        console.log(this.destinationMask);
    },
    listAllMembers(){
        /*
        list everything
        */
        let regArray = this.populationTexture.toArray();
        console.log(regArray);
    },


    // -------------------------- GPU mass selection methods --------------------------
    destinationMask: [], // used to set the destination member to the selection method, see simulationStep() for more
    assignDistricts: gpu.createKernel(function(populationTexture, leaderIndices, numLeaders, numParams){
        // catch first two indices holding other info

        // leaderIndices = [5, 7] for example for 2 leaders
        if(this.thread.x === 1){
            // district
            
            // for every leader
            let lowestValue = -1;
            let lowestIndex = -1;
            for(let i = 0; i < numLeaders; i++){
                
                // retrieve distance for every param
                let acc = 0;
                for(let ii = 0; ii < numParams; ii++){
                    let localLeaderIndex = leaderIndices[i];
                    acc += (populationTexture[this.thread.y][ii] - populationTexture[localLeaderIndex][ii]) ** 2;
                };
                acc = Math.sqrt(acc);

                if(i === 0){
                    // 0th index set lowest
                    lowestValue = acc;
                    lowestIndex = i; // leaderIndices[i] for global district // try just i for an ordered index of districts
                }else if(acc < lowestValue){
                    // lowest value broken
                    lowestValue = acc;
                    lowestIndex = i;
                };
            };

            return(lowestIndex);
        }else{
            // params set to params
            return(populationTexture[this.thread.y][this.thread.x]);
        };
    }).setOptimizeFloatMemory(true).setPipeline(true).setImmutable(true).setOutput([1, 1]),
    destinationElite: gpu.createKernel(function(populationTexture, popWidth, numReps){
        // outputs to destinationMask 1d
        // no need to process elites, as they stay the same but need the destination mask to update

        let ownHighScore = 10;
        for(let i = 0; i < popWidth; i++){
            // access district populationTexture[this.thread.y + i][1]
            // 
            if((populationTexture[this.thread.x][1] === populationTexture[i][1]) && (this.thread.x !== i)){
                // the compared district is the same as this district, but not itself
                // check if this still has highest score
                if(populationTexture[this.thread.x][0] <= populationTexture[i][0]){
                    // highest score overtaken
                    // every occurrence decrement so we know what position the member is
                    ownHighScore--;
                };
            };
        };

        // number of representatives per district allowed to be 1-10
        let dynamicHighScoreCheck = 0;
        if(numReps === 1){
            // only 1 rep
            dynamicHighScoreCheck = 10;
        }else{
            // higher than 1
            dynamicHighScoreCheck = 10.9 - numReps;
        };

        // if at the end, this thread still has highest score, 
        // not exact score, proceed
        if(ownHighScore === 10){
            // yes to highest score return itself as a 0
            return(0);
        }else if((ownHighScore < 10) && (ownHighScore > dynamicHighScoreCheck)){
            // float catch
            // > 8.9 = 9, include 2nd highest score
            // > 7.9 = 8, include 3rd highest score
            
            // also return 0
            return(0);
        }else{
            // not highest or 2nd highest score in district
            return(-1);
        };
        //return(-1);

    }).setOptimizeFloatMemory(true).setPipeline(true).setImmutable(true).setOutput([1]),
    processTournament: gpu.createKernel(function(populationTexture, destinationMask, popWidth){
        // move from populationTexture (old) and tournament into members
        // where member in destinationMask === 1
        if(destinationMask[this.thread.y] === 1){
            // find 2 pairs
            let winners = [-1, -1];
            for(let i = 0; i < 2; i++){
                // random index
                let randomA = Math.floor(Math.random() * popWidth);
                let randomB = Math.floor(Math.random() * popWidth);

                // compare scores
                if(populationTexture[randomA][0] > populationTexture[randomB][0]){
                    // A won
                    winners[i] = randomA;
                }else{
                    // B won
                    winners[i] = randomB;
                };
            };

            // at this point both winners are 2 indices that need to cross
            if(this.thread.x === 0){
                // score
                return(-1);
            }else if(this.thread.x === 1){
                // district, 0 or 1 is inclusive of 1, so Math.round
                // return a random parents' district, not that it really matters since it will 
                // be rescored with new districts anyways
                return(populationTexture[winners[Math.round(Math.random() * 1)]][1]);
            }else{
                // params ++
                // return a random parent' parameter, for every param
                return(populationTexture[winners[Math.round(Math.random() * 1)]][this.thread.x]);
            };
        }else{
            // otherwise return old
            return(populationTexture[this.thread.y][this.thread.x]);
        };

    }).setOptimizeFloatMemory(true).setPipeline(true).setImmutable(true).setOutput([1, 1]),
    processCross: gpu.createKernel(function(populationTexture, tempPopulationTexture, destinationMask, popWidth){
        // move from populationTexture (old) and cross into members
        // where member in destinationMask === 2, or 4 since 4 is cross fork
        if((destinationMask[this.thread.y] === 2) || (destinationMask[this.thread.y] === 4)){
            // find 2 pairs
            let crossMembers = [
                Math.floor(Math.random() * popWidth), 
                Math.floor(Math.random() * popWidth)
            ];

            // at this point both crossMembers are 2 indices that need to cross
            if(this.thread.x === 0){
                // score
                return(-1);
            }else if(this.thread.x === 1){
                // district, 0 or 1 is inclusive of 1, so Math.round
                // return a random parents' district, not that it really matters since it will 
                // be rescored with new districts anyways
                return(populationTexture[crossMembers[Math.round(Math.random() * 1)]][1]);
            }else{
                // params ++
                // return a random parent' parameter, for every param
                return(populationTexture[crossMembers[Math.round(Math.random() * 1)]][this.thread.x]);
            };
        }else{
            // otherwise return from temp texture, this is different from processTournament, that returns old since it doesn't matter but this does not want to overwrite
            return(tempPopulationTexture[this.thread.y][this.thread.x]);
        };

    }).setOptimizeFloatMemory(true).setPipeline(true).setImmutable(true).setOutput([1, 1]),
    processFork: gpu.createKernel(function(populationTexture, tempPopulationTexture, destinationMask, min, max, mutateRate, extremeMutateRate){
        // move from populationTexture (old) and fork/mutate
        // where member in destinationMask === 3, or 4 since 4 is cross fork
        if((destinationMask[this.thread.y] === 3) || (destinationMask[this.thread.y] === 4)){
            // get thread x
            if(this.thread.x === 0){
                // score reset since new member
                return(-1);
            }else if(this.thread.x === 1){
                // district of original member
                return(populationTexture[this.thread.y][1]);
            }else{
                // params ++, return its forked

                // check if it should mutate at all
                if(Math.random() < extremeMutateRate){
                    // yes to extreme mutation

                    // only get a new reroll single stat
                    let randomStat = (Math.random() * (max[this.thread.x - 2] - min[this.thread.x - 2])) + min[this.thread.x - 2];

                    return(randomStat);
                }else if(Math.random() < mutateRate){
                    // yes to normal mutation

                    // start by getting a new reroll single stat
                    let randomStat = (Math.random() * (max[this.thread.x - 2] - min[this.thread.x - 2])) + min[this.thread.x - 2];
    
                    /*
                    roll a percentage to move from original to new stat
                    this makes it so the new stat is definitely still within the bounds
                    */
                    let randomAmount = Math.random() * .01;
                    randomStat = (randomAmount * randomStat) + ((1 - randomAmount) * populationTexture[this.thread.y][this.thread.x]);
    
                    return(randomStat);
                }else{
                    // no to mutation
                    return(populationTexture[this.thread.y][this.thread.x]);
                };
            };
        }else{
            // otherwise return from temp texture, this is different from processTournament, that returns old since it doesn't matter but this does not want to overwrite
            return(tempPopulationTexture[this.thread.y][this.thread.x]);
        };

    }).setOptimizeFloatMemory(true).setPipeline(true).setImmutable(true).setOutput([1, 1]),
    processReroll: gpu.createKernel(function(populationTexture, tempPopulationTexture, destinationMask, min, max){
        // move from populationTexture (old) and totally reroll members stats
        // where member in destinationMask === 5
        if(destinationMask[this.thread.y] === 5){
            // get thread x
            if(this.thread.x === 0){
                // score
                return(-1);
            }else if(this.thread.x === 1){
                // district of original member
                return(populationTexture[this.thread.y][1]);
            }else{
                // params ++, return its forked

                // reroll single stat
                let randomStat = (Math.random() * (max[this.thread.x - 2] - min[this.thread.x - 2])) + min[this.thread.x - 2];
                return(randomStat);
            };
        }else{
            // otherwise return from temp texture, this is different from processTournament, that returns old since it doesn't matter but this does not want to overwrite
            return(tempPopulationTexture[this.thread.y][this.thread.x]);
        };

    }).setOptimizeFloatMemory(true).setPipeline(true).setImmutable(true).setOutput([1, 1]),


    // -------------------------- CPU mass selection methods --------------------------
    assignRemainderDestinations(config, popWidth){
        // convert texture to array
        let innerDestinationMask = this.destinationMask.toArray();
        //console.log(innerDestinationMask);
        let num = [-1];

        // set amounts
        // 0 == exact amount for elite, only happens when scores are high and tend to be pretty exacting
        //num[0] = Math.floor(config.eliteDistrict[0] * popWidth);

        // 1 == tourney cross
        num[1] = Math.floor(config.tournament[0] * popWidth);

        // 2 == cross
        num[2] = Math.floor(config.cross[0] * popWidth);

        // 3 == fork + extreme fork
        num[3] = Math.floor(config.fork[0] * popWidth);

        // 4 == cross fork
        num[4] = Math.floor(config.crossFork[0] * popWidth);

        // 5 == reroll, always remainder

        for(let i = 0; i < popWidth; i++){
            
            // for every mask item, read value
            if(innerDestinationMask[i] === -1){
                // available to modify

                if(num[1] > 0){
                    // tourney cross still has members left to insert
                    innerDestinationMask[i] = 1;
                    num[1]--;
                }else if(num[2] > 0){
                    // cross
                    innerDestinationMask[i] = 2;
                    num[2]--;
                }else if(num[3] > 0){
                    // fork
                    innerDestinationMask[i] = 3;
                    num[3]--;
                }else if(num[4] > 0){
                    // cross fork
                    innerDestinationMask[i] = 4;
                    num[4]--;
                }else{
                    // otherwise, remainder reroll
                    innerDestinationMask[i] = 5;
                };
            };
        };

        // set mask
        this.destinationMask = innerDestinationMask;
    },


    // -------------------------- file store --------------------------
    graphObj: -1,
    getDistrictEliteReps: gpu.createKernel(function(populationTexture, destinationMask, popWidth, indexOfMaxScore){
        // this is a 1d array that is as wide as num Districts, returns array full of just the scores of reps
        // note that if number of reps is higher than 1, say 3 reps per district, the script will only return 1 from that district, but it is often pretty indicative of that districts best score nearby
        // the main reason for 2+ reps / dis is to help fill the random chance that tourneys and forks happen on elite members

        let member = -1;
        let hiIndex = 0;
        let hiScore = 0;
        if(this.thread.y === indexOfMaxScore){
            // search for highest alltime score, inserted into the +1 added onto the y
            for(let i = 0; i < popWidth; i++){
                // check dest mask is rep AND popText district is this thread
                if(populationTexture[i][0] > hiScore){
                    // higher
                    hiIndex = i;
                    hiScore = populationTexture[i][0];
                };
            };
            member = populationTexture[hiIndex][this.thread.x];

        }else{

            // ea thread scroll thru each member
            for(let i = 0; i < popWidth; i++){
                // check dest mask is rep AND popText district is this thread
                if((destinationMask[i] === 0) && (populationTexture[i][1] === this.thread.y)){
                    // only one member fits description and can be output
                    member = populationTexture[i][this.thread.x];
                };
            };
        };
        
        //return(populationTexture[this.thread.y][this.thread.x]);
        return(member);
    }).setOptimizeFloatMemory(true).setPipeline(false).setDynamicOutput(true).setImmutable(true).setOutput([1, 1]),
    saveElitesToFileAndGraph(){
        // try to make dir
        const dir = "../evolution"
        try{
            // first check if directory already exists
            if(!fs.existsSync(dir)){
                fs.mkdirSync(dir);
                //console.log("Directory is created.");
            }else{
                //console.log("Directory already exists.");
            };
        }catch(err){
            console.log(err);
        };

        // because the GPU allows us to spool millions of members, we need to only save district elite reps
        let eliteReps = this.getDistrictEliteReps(this.tempPopulationTexture, this.destinationMask, this.popWidth, this.destinationMask.length);
        //console.log(this.destinationMask);

        // remap because float32 array saves to disk weirdly
        // remember index 0 = score, 1 = district, 2+ = params
        // filter here takes out the -1 graphing out bug
        eliteReps = eliteReps.filter(item => item[0] !== -1).map((item, index) => {
            let pushItem = [];
            for(let i = 0; i < item.length; i++){
                // push its 32 bit equivalent
                pushItem.push(Math.fround(item[i]));
            };
            return(pushItem);
        });
        eliteReps = eliteReps.sort((a, b) => (b[0] - a[0]));

        // limit array size for both graphing and saving
        eliteReps = eliteReps.splice(0, this.config.maxGraphOut);
        //console.log(eliteReps);


        // construct graphObj that goes to HTML client, it should be a regular 2d array here
        this.graphObj = {
            eliteRepArray: eliteReps,
        };

        // write to dir
        fs.writeFile("../evolution/eliteMembers.json", JSON.stringify(eliteReps), (err) => {
            if(err){
                console.log(err);
            };
        });
    },
    saveAllToFile(){
        return new Promise(async (resolve, reject) => {
            // try to make dir
            const dir = "../evolution"
            try{
                // first check if directory already exists
                if(!fs.existsSync(dir)){
                    fs.mkdirSync(dir);
                    //console.log("Directory is created.");
                }else{
                    //console.log("Directory already exists.");
                };
            }catch(err){
                console.log(err);
            };

            // write to dir
            let eliteReps = this.populationTexture.toArray();

            // remap because float32 array saves to disk weirdly
            // remember index 0 = score, 1 = district, 2+ = params
            eliteReps = eliteReps.map((item, index) => {
                let pushItem = [];
                for(let i = 0; i < item.length; i++){
                    // push its 32 bit equivalent
                    pushItem.push(Math.fround(item[i]));
                };
                return(pushItem);
            });

            fs.writeFile("../evolution/populationMembers.json", JSON.stringify(eliteReps), (err) => {
                if(err){
                    console.log(err);
                };
            });
            resolve();
        });
    },
    loadFromFile(load){
        return new Promise((resolve, reject) => {
            // load here will either be "all"/true or "elites"
            let path;
            if(load === "elites"){
                // elites
                path = "../evolution/eliteMembers.json";
            }else{
                // all
                path = "../evolution/populationMembers.json";
            };

            // this uses a promise for read sync
            let parsedJson;
            fs.readFile(path, (err, data) => {
                if(err){
                    console.log(err);
                };
    
                // jsonify
                parsedJson = JSON.parse(data);
                resolve(parsedJson);
            });
        });
    },


    // -------------------------- helpers / total sim --------------------------
    testFunction: [], // no longer optional
    additionalArgs: [],
    config: {
        eliteDistrict: [.02, 3], // % of pop to make into numDistricts, num of representative per district, 1-10
        tournament: [.4], // % pop, aka tourneycross
        cross: [.2], // % pop
        fork: [.1, .1, .05], // % pop, mutateRate, extremeMutateRate
        crossFork: [.08],
        reRoll: [-1], // always remainder
        maxGraphOut: 200, // maximum to push to client
        /*
        // debug:: diff selection method testing
        eliteDistrict: [0.1], // % of pop to make into numDistricts, forced 1 representative per district
        tournament: [0], // % pop, aka tourneycross
        cross: [0], // % pop
        fork: [1], // % pop
        crossFork: [0],
        */
    },
    min: -1,
    max: -1,
    numDistricts: -1,
    simulationInit({
        load, // true / false whether or not to load from ../evolution/populationMembers.json
        min, // array by index of min boundary
        max, // array by index of max boundary
        popSize, // population size, duh
        testFunctions, // eg.gpu context, gpu kernel function closure, an array of test functions in order, if only one test still place in array [test] or [test1, test2] etc
        config, // optional selction overwrite, see this.config above
        outputs,
        additionalArgs,
    }){
        /*
        simulation functions are handy wrappers for kernels
        -
        const testFunction = gpu.createKernel(function(populationTexture){
            // test function boilerplate, remember params start at index [2] ++
            if(this.thread.x === 0){
                // -------- SCORE START --------


                return(-1);
                // -------- SCORE END --------
            }else if(this.thread.x === 1){
                // district
                return(-1);
            }else{
                // params set to params
                return(populationTexture[this.thread.y][this.thread.x]);
            };
        }).setOptimizeFloatMemory(true).setPipeline(true).setOutput([1, 1]);
        */

        return new Promise(async (resolve, reject) => {
            // initialise
    
            // set dimension sizes
            this.popWidth = popSize;
            this.popHeight = min.length + 2; // score + district + params
    
            // set reuseable min and max arrays
            this.min = min;
            this.max = max;
    
            // set GPU output, the reason min.length has 2 extra is because the first indices hold score and district info
            this.createPopulationFromLoad.setOutput([this.popHeight, this.popWidth]);
            this.createPopulation.setOutput([this.popHeight, this.popWidth]);

            // check load
            if(load == false){
                // new from random
                this.populationTexture = this.createPopulation(min, max);
            }else{
                // load from file
                let file2dArray = await this.loadFromFile(load);
                this.populationTexture = this.createPopulationFromLoad(file2dArray, file2dArray.length, min, max);
            };
            
            //this.popDims();
            //this.listAllMembers();
            
            // set test
            this.testFunction = testFunctions;
            this.additionalArgs = additionalArgs;
            
            // perform first test
            for(let i = 0; i < this.testFunction.length; i++){
                this.testFunction[i].setOutput(outputs[i]);
                this.populationTexture = this.testFunction[i](this.populationTexture, this.additionalArgs[i]);
            };
    
            // set other sizes
            this.assignDistricts.setOutput([this.popHeight, this.popWidth]);
            this.destinationElite.setOutput([this.popWidth]);
            this.processTournament.setOutput([this.popHeight, this.popWidth]);
            this.processCross.setOutput([this.popHeight, this.popWidth]);
            this.processFork.setOutput([this.popHeight, this.popWidth]);
            this.processReroll.setOutput([this.popHeight, this.popWidth]);
    
    
            // config if defined
            if(config != undefined){
    
                // overwrite
                this.config = config;
            };

            resolve();
        });
    },
    simulationStep(){
        /*
        this will perform 1 generation step of evolution
        in order, gpu:
        assign districts
        selection methods + pressure
        test
        push stats to client
        file store
        -
        client:
        sort
        designation
        chart
        -
        build a destination mask, so the gpu knows what to do to what
        mask:
        0 elite (from districts)
        1 tourney cross
        2 cross (no tourney just random)
        3 fork, includes extreme fork
        4 cross fork
        5 stat reroll (different from extreme fork in that all stats are rerolled, not just %)
        */


        // assign districts, needs an array of randomly picked leaders
        let leaderIndices = [];
        for(let i = 0; i < Math.floor(this.config.eliteDistrict[0] * this.popWidth); i++){
            leaderIndices.push(this.randomInt(0, this.popWidth));
        };
        //console.log(leaderIndices.length); // stays same

        // kernels are limited and cant push to arrays or take .length, so provide it to gpu
        let numLeaders = leaderIndices.length;
        let numParams = this.popHeight - 2;

        
        // execute
        this.populationTexture = this.assignDistricts(this.populationTexture, leaderIndices, numLeaders, numParams);
        
        // destination mask same size as population
        this.destinationMask = new Array(this.popWidth).fill(-1);
        
        // execution of destinationMask's elite
        this.destinationMask = this.destinationElite(this.populationTexture, this.popWidth, this.config.eliteDistrict[1]);
        //console.log(this.destinationMask.toArray());
        
        // for use later in fileStorePop and graph
        this.numDistricts = numLeaders;
        
        // start setting destination mask to destinations 1-5 so that the gpu knows who is assigned to what
        this.assignRemainderDestinations(this.config, this.popWidth);
        
        // here destination mask is no longer a texture, but a regular array
        // duplicate population to temp so we can modify stuff without pulling from already processed members
        this.tempPopulationTexture = this.populationTexture;
        
        
        // process different selection methods into temp
        // tourney
        this.tempPopulationTexture = this.processTournament(this.populationTexture, this.destinationMask, this.popWidth);
        // cross and crossfork
        this.tempPopulationTexture = this.processCross(this.populationTexture, this.tempPopulationTexture, this.destinationMask, this.popWidth);
        // fork and crossfork
        this.tempPopulationTexture = this.processFork(this.populationTexture, this.tempPopulationTexture, this.destinationMask, this.min, this.max, this.config.fork[1], this.config.fork[2]);
        // reroll
        this.tempPopulationTexture = this.processReroll(this.populationTexture, this.tempPopulationTexture, this.destinationMask, this.min, this.max);
        
        
        // set new to old
        this.populationTexture.delete();
        this.populationTexture = this.tempPopulationTexture;
        
        
        // perform test, already set output
        for(let i = 0; i < this.testFunction.length; i++){
            this.populationTexture = this.testFunction[i](this.populationTexture, this.additionalArgs[i]);
        };
        
        
        // this one gets set to width of num districts
        this.getDistrictEliteReps.setOutput([this.popHeight, Math.floor(this.numDistricts + 1)]);
        
        // right here is where we call save to file and graph
        this.saveElitesToFileAndGraph();


        // clean up texture
        // comment this out, it was having recurring emptiness problems
        this.tempPopulationTexture.delete();
    },
    simulationGraph(){
        // retrieve info to graph, need to run simimulationStep() first
        return(this.graphObj);
    },
};