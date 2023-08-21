/*
evolution stuff
single running simulation evolution, no vault
individuals are called members
try using evolution first on small datasets, only graduate to larger, more diverse datasets 
when it has overfit the small
-
you might want to import as 
const evo = require('./eco.x/evo.js');
to cut down on verbosity
-
member obj: {
    designation: "Daily Corn Fountain",
    score,
    data: [{
        param,
        min,
        max,
        decimals
    },{},{},....]
}
-

*/


const chalk = require('chalk');
const fs = require('fs');
const wordList = require('./designation.js');
module.exports = {
    moduleName: "evolution",
    version: 1, // single running simulation evolution, no vault


    // -------------------------- maths utils --------------------------
    fixedDecimal(float, decimalPlaces){ // this exists because .toFixed creates a freaking string
        float = float.toFixed(decimalPlaces);
        return(parseFloat((float)));
    },
    randomFloat(minIncl, maxIncl, decimalPlaces){ // min and max inclusive
        return(this.fixedDecimal((Math.random() * (maxIncl - minIncl)) + minIncl, decimalPlaces));
    },
    randomInt(minIncl, maxExcl){ // min inclusive, max exclusive
        return(Math.floor((Math.random() * (maxExcl - minIncl)) + minIncl));
    },


    // -------------------------- setup --------------------------
    populationMembers: [], // the actual place where the members are stored
    createPopulation(paramArray, popSize){
        // create a population from scratch, random init
        this.populationMembers = [];

        
        // loop thru pop size and push
        for(let i = 0; i < popSize; i++){
            // remap parameters to include a random init value
            paramArray = paramArray.map((item, index) => ({
                param: this.randomFloat(item.min, item.max, item.decimals),
                min: item.min,
                max: item.max,
                decimals: item.decimals,
            }));

            // debug:: what each members params are
            //console.log(paramArray);
            
            // remap simple array for the designation
            const desArray = paramArray.map(item => item.param);
            
            this.populationMembers.push({
                designation: this.paramDesignation({
                    version: 1,
                    scale: 1,
                    data: desArray,
                }),
                score: -1,
                district: -1,
                path: {
                    elite: 0,
                    tournament: 0,
                    cross: 0,
                    fork: 0,
                },
                data: paramArray,
            });
        };
    },


    // -------------------------- utils --------------------------


    // -------------------------- analysis / utils --------------------------
    paramRandomDesignation(){
        // only for quick, human readability on members, not for anything else
        let ranAdj = wordList.adjectives[this.randomInt(0, wordList.adjectives.length)];
        let ranMat = wordList.materials[this.randomInt(0, wordList.materials.length)];
        let ranNoun = wordList.nouns[this.randomInt(0, wordList.nouns.length)];
        return(ranAdj + " " + ranMat + " " + ranNoun);
    },
    paramDesignation(objArrayParams){
        /*
        objArrayParams = {
            version: 1, // int/float
            scale: 1, // if small adjustments aren't making big enough changes
            data: [], // simple array of numbers that are the params
        }
        */

        // setup 
        let arrayParams = objArrayParams.data;
        if(objArrayParams.scale == undefined){
            objArrayParams.scale = 2;
        };

        // version check, which allows for different versions and also updates
        if(objArrayParams.version === 1){
            // starting base of repeatable difference, adjectives, materials, nouns
            let values = [1, 21000, 78];
    
            // check num parameters
            if(arrayParams.length < 3){
                // 2 params and below, right now unsupported
                return("unsupported: number of parameters must be 3 or higher");
                
            }else{
                // regular
    
                // multiply into base value
                for(let i = 0; i < arrayParams.length; i++){
                    // 0 catch
                    if(arrayParams[i] === 0){
                        arrayParams[i] = 1;
                    };
    
                    // multiply remainder-index
                    values[i % 3] *= Math.abs(arrayParams[i]) * objArrayParams.scale;
                };
    
                // check if above 7,000,000
                for(let i = 0; i < values.length; i++){
                    if(values[i] > 7000000){
                        values[i] /= 356;
                    }else if((values[i] > 400000) && (values[i] < 7000000)){
                        values[i] *= 7;
                    }else{
                        values[i] *= 9410;
                    };
                    values[i] = this.fixedDecimal(values[i], 0);
                };
    
                // compile string
                let adjective = wordList.adjectives[values[0] % wordList.adjectives.length];
                let material = wordList.materials[values[2] % wordList.materials.length];
                let noun = wordList.nouns[values[1] % wordList.nouns.length];
                return(adjective + " " + material + " " + noun);
            };
        }else{
            return("there is not a version installed for: " + objArrayParams.version);
        };
    },
    paramDistance(firstArray, secondArray){
        // x-dim pythag distance

        // both arrays must equal same length
        if(firstArray.length !== secondArray.length){
            return("the arrays must be of same length!");
        }else{
            // now we loop distance
            let acc = 0;
            for(let i = 0; i < firstArray.length; i++){
                acc += ((firstArray[i] - secondArray[i])**2);
            };
            return(Math.sqrt(acc));
        };
    },
    memberToParamArray(index){
        /*
        grab a member by index and return a new array of just its params, useful for sending to paramDistance
        */

        let innerArray = [];
        innerArray = this.populationMembers[index].data.map(item => item.param);
        return(innerArray);
    },
    sortMembersScoreDesc(representatives){
        /*
        sort populationMembers in descending by their score
        -
        additionally returns a graph output of [10%tile ave, whole ave], use like this:
        pushToClient("graph", evo.sortMembersScoreDesc());
        */

        this.populationMembers.sort((a, b) => {
            return(b.score - a.score);
        });

        /*
        // return [r0, 90%_tile, 80%, 50%]
        let num = this.populationMembers.length;
        let hi = this.populationMembers[Math.floor(num * .1)].score;
        let med = this.populationMembers[Math.floor(num * .2)].score;
        let lo = this.populationMembers[Math.floor(num * .5)].score;
        */

        if(representatives !== undefined){
            return([
                this.populationMembers[0].score, 
                this.populationMembers[Math.floor(representatives * 1)].score, 
                this.populationMembers[Math.floor(representatives * 2)].score, 
                this.populationMembers[Math.floor(representatives * 3)].score
            ]);
        };
    },
    clearPopulation(){
        this.populationMembers = [];
    },
    pushToPopulation(array){
        /*
        useage:
        eco.evo.pushToPopulation([crossMember]); // for a single member
        eco.evo.pushToPopulation(eliteMembers); // for multiple, already in array
        */
        this.populationMembers.push(...array);
    },


    // -------------------------- mass selection methods / helpers --------------------------
    districtStats: -1,
    elitism(percentPts){
        /*
        performs on population
        returns x num elite members
        -
        elitism is a form of selection pressure that helps keep top solutions in memory, keep this low
        as low as 1-5%
        */

        // grab actual number need to return
        let num = Math.floor(percentPts * this.populationMembers.length);

        // sort again just in case it was forgot
        this.sortMembersScoreDesc();
        let slice = this.populationMembers.slice(0, num);

        for(let i = 0; i < slice.length; i++){
            slice[i].path.elite++;
        };
        //console.log(slice);
        return(slice);
    },
    elitismByDistrict(numDistrictsPerc, representativesPerDistrictInt){
        /*
        modified elitism that draws arbitrary boundaries, and groups all members into those districts by shortest distance
        popSize / numDistrictsPerc is the number of elites per district allowed
        this will give the simulation global variety, but local competition
        -
        representativesPerDistrictInt must be equal or greater than numDistrictsPerc since you need at least 1 member to represent a district
        -
        you aren't totally guaranteed a set number of districts, it may be lower due to duplicates, but should be fine
        -
        over time, some districts will become dense and small, and clump around major score centers
        leaving the desert of non score as a rural area, that will still have districts
        -
        this is a better form of selection pressure that incentivises maximum score but allows uniqueness to persist
        -
        this probably wasn't written super well, but it does work...
        */

        // grab actual number need to return
        let num = Math.floor(numDistrictsPerc * this.populationMembers.length);

        // grab num number of district leaders to compete for distances
        let districtLeaderIndices = [];
        for(let i = 0; i < num; i++){
            // push random, this is an array of indices, not actual members
            let innerRandom = this.randomInt(0, this.populationMembers.length);
            districtLeaderIndices.push(innerRandom);

            // set district for district leader
            // there is no special attr for leaders, just the leader array above
            this.populationMembers[innerRandom].district = i;

            // doubles exist, but with high popSize it is very unlikely to matter as duplicates will be caught later
        };

        // loop thru all members
        for(let i = 0; i < this.populationMembers.length; i++){

            // reloop thru district leaders now that they have been set

            // init lowest values to first leader
            let lowestDistance = this.paramDistance(this.memberToParamArray(districtLeaderIndices[0]), this.memberToParamArray(i));
            let lowestLeaderIndex = districtLeaderIndices[0];
            for(let ii = 0; ii < districtLeaderIndices.length; ii++){
                // grab distance from test member to every leader
                let innerDistance = this.paramDistance(this.memberToParamArray(districtLeaderIndices[ii]), this.memberToParamArray(i));
                //console.log(innerDistance);

                // check against lowest values
                if(innerDistance < lowestDistance){
                    // new lower leader
                    lowestDistance = innerDistance;
                    lowestLeaderIndex = districtLeaderIndices[ii];
                };
            };

            // now that we have lowest values, set its district
            this.populationMembers[i].district = lowestLeaderIndex;
        };

        // get count
        let remap = this.populationMembers.map(item => item.district);
        let counts = new Array(districtLeaderIndices.length).fill(0);
        for(let i = 0; i < remap.length; i++){
            counts[districtLeaderIndices.indexOf(remap[i])]++;
        };

        // debug::array of district leaders and members' districts
        /*
        console.log(districtLeaderIndices);
        console.log(remap);
        // debug::array of count inside ea district, 0 means duplicate
        console.log(counts);
        */

        // combine separate arrays together, do not include counts of 0 which are duplicate districts
        let combined = counts.map((item, index) => ({
            district: districtLeaderIndices[index],
            count: item,
            reps: representativesPerDistrictInt,
            actualMemberList: [],
        }));
        // filter has to be after map or it sometimes doesn't count unique districts = ??
        combined = combined.filter(item => item.count !== 0); 0

        // get a new index array for indexOf purposes
        let districtIndexArray = combined.map(item => item.district);

        // go thru remap and push to combined a list of indices of all of its district members
        for(let i = 0; i < remap.length; i++){
            let innerIndex = districtIndexArray.indexOf(remap[i]);
            combined[innerIndex].actualMemberList.push(this.populationMembers[i]);
        };

        /*
        // rename districts in order
        combined = combined.map((item, index) => ({
            district: index,
            count: item.count,
            actualMemberList: item.actualMemberList,
        }));
        */

        // sort inside districts score descending
        for(let i = 0; i < combined.length; i++){
            //console.log(chalk.red(combined[i].district));
            combined[i].actualMemberList.sort((a, b) => {
                return(b.score - a.score);
            });
        };

        // now sort districts num members descendings
        combined.sort((a, b) => {
            return(b.count - a.count);
        });

        // update stats
        this.districtStats = combined;

        /*
        combined example right here:
        [{
            district: 0,
            count: 7,
            actualMemberList: [{
                data: [{param,min,max,decimal},{}...],
                score: 9.23,
                all other accessible properties of a member
            },{},{}..],
        },{},{},...]
        */


        // now we slice districts up equally
        let returnMemberArray = [];
        for(let i = 0; i < combined.length; i++){
            // push a slice, slicing works since they are score-descending ordered
            let innerSlice = combined[i].actualMemberList.slice(0, Math.round(representativesPerDistrictInt));
            returnMemberArray.push(...innerSlice);
        };
        //console.log(returnMemberArray);
        //console.log(representativesPerDistrictInt);

        return(returnMemberArray);
    },
    tournament(percentPts, randomChancePercPts){
        /*
        on population random tournament, randomChancePercPts is that chance to choose a random tourney winner
        so randomChancePercPts = .2 means 20% chance to choose a random and not enforce selection pressure
        -
        performs on population
        returns x num new members
        -
        tournament is a type of selection pressure that helps to create offspring with population-wide good 
        performing members, though with random chance to not have pressure at all
        */
       
        // grab actual number need to return
        let num = Math.floor(percentPts * this.populationMembers.length);
        
        // for actual number of members needed to return
        let tourneyWinners = [];
        for(let i = 0; i < num; i++){
            // every tourney has x chance to be random here
            if(this.randomFloat(0, 1, 2) > randomChancePercPts){
                // regular tourney

                // grab 4 random members to compete for 2 slots
                let tourneyAIndex = [];
                let tourneyBIndex = [];
                for(let ii = 0; ii < 2; ii++){
                    tourneyAIndex.push(this.randomInt(0, this.populationMembers.length));
                    tourneyBIndex.push(this.randomInt(0, this.populationMembers.length));
                };

                // tourney
                if(this.populationMembers[tourneyAIndex[0]].score > this.populationMembers[tourneyAIndex[1]].score){
                    // 0-th index won
                    tourneyAIndex = tourneyAIndex[0];
                }else{
                    // 1-th index won
                    tourneyAIndex = tourneyAIndex[1];
                };
                if(this.populationMembers[tourneyBIndex[0]].score > this.populationMembers[tourneyBIndex[1]].score){
                    // 0-th index won
                    tourneyBIndex = tourneyBIndex[0];
                }else{
                    // 1-th index won
                    tourneyBIndex = tourneyBIndex[1];
                };

                // cross
                let crossMember = this.crossover(tourneyAIndex, tourneyBIndex); // pre push tourn

                // increment tournament
                //console.log(crossMember);
                crossMember.path.tournament++;

                tourneyWinners.push(crossMember);


            }else{
                // random tourney

                // grab 2 random members for crossover
                let newIndices = [];
                for(let ii = 0; ii < 2; ii++){
                    newIndices.push(this.randomInt(0, this.populationMembers.length));
                };

                // cross
                let crossMember = this.crossover(newIndices[0], newIndices[1]);
                //console.log(crossMember);
                tourneyWinners.push(crossMember);
            };
        };

        return(tourneyWinners);
    },
    massMutate(percentPts, regularMutateChance, extremeMutateChance, reRollRate){
        /*
        performs on population
        returns number of pop from random that have been mutated
        */

        // grab actual number need to return
        let num = Math.floor(percentPts * this.populationMembers.length);
        
        // for each in num
        let mutatedArray = [];
        for(let i = 0; i < num; i++){
            // grab random index
            let randomIndex = this.randomInt(0, this.populationMembers.length);
            mutatedArray.push(this.mutate(randomIndex, regularMutateChance, extremeMutateChance, reRollRate));
        };
        
        //console.log(mutatedArray);
        return(mutatedArray);
    },
    massCrossMutate(percentPts, regularMutateChance, extremeMutateChance, reRollRate){
        /*
        performs on population
        grabs twice the amount then crossovers, then mutates
        -
        having a 20-40% population-wide reRoll is good for searching for other diverse solutions
        */

        // grab actual number need to return
        let num = Math.floor(percentPts * this.populationMembers.length);
        
        // for each in num
        let crossedArray = [];
        for(let i = 0; i < num; i++){
            // cross 2 random indices
            let randomIndexA = this.randomInt(0, this.populationMembers.length);
            let randomIndexB = this.randomInt(0, this.populationMembers.length);
            crossedArray.push(this.crossover(randomIndexA, randomIndexB));
        };

        let mutatedArray = [];
        for(let i = 0; i < crossedArray.length; i++){
            // mutate every item in crossedArray
            mutatedArray.push(this.mutateActualMember(crossedArray[i], regularMutateChance, extremeMutateChance, reRollRate));
        };
        
        //console.log(mutatedArray);
        return(mutatedArray);
    },


    // -------------------------- crossover / child --------------------------
    crossover(indexA, indexB){
        /*
        simply chooses a half and half random for each param ea parent
        returns new child offspring
        */

        // sort again just in case it was forgot
        this.sortMembersScoreDesc();

        // craft new genes from parents
        let newMemberData = this.populationMembers[indexA].data.map((item, i) => {
            let randomChoice = (this.randomFloat(0, 1, 2) > .5 ? indexA : indexB);
            return({
                param: this.populationMembers[randomChoice].data[i].param,
                min: item.min,
                max: item.max,
                decimals: item.decimals
            });
        });
        let desigData = newMemberData.map(item => item.param);

        // rebuild a whole member from genes
        let newMemberWhole = {
            designation: this.paramDesignation({
                version: 1,
                scale: 1,
                data: desigData,
            }),
            path: { // average both parents, round up
                elite: Math.min(this.populationMembers[indexA].path.elite, this.populationMembers[indexB].path.elite),
                tournament: Math.min(this.populationMembers[indexA].path.tournament, this.populationMembers[indexB].path.tournament),
                cross: Math.min(this.populationMembers[indexA].path.cross, this.populationMembers[indexB].path.cross),
                fork: Math.min(this.populationMembers[indexA].path.fork, this.populationMembers[indexB].path.fork),
            },
            district: this.populationMembers[indexA].district,
            score: -1,
            data: newMemberData,
        };

        // increment cross
        newMemberWhole.path.cross++
        //console.log(newMemberWhole);

        return(newMemberWhole);
    },


    // -------------------------- mutations / forked --------------------------
    mutate(memberIndex, normalMutateRate, extremeMutateRate, reRollRate){
        /*
        normalMutate: a small nudge/offset in some direction, it makes very small moves, so should be *fairly* common
        extremeMutate: a completely new gene
        -
        every gene has an individual rate chance to obtain a mutation
        */

        // decide if mode is going to totally re roll every gene
        let newMemberData;
        if(this.randomFloat(0, 1, 2) < reRollRate){

            // reroll everything
            newMemberData = this.populationMembers[memberIndex].data.map((item, i) => {
                return({
                    // having out of bounds issues, so re-affirm bounds here
                    param: Math.max(Math.min(this.randomFloat(item.min, item.max, item.decimals), item.max), item.min),
                    min: item.min,
                    max: item.max,
                    decimals: item.decimals
                });
            });
        }else{
            
            // dont go into reroll mode, instead go thru individual genes and decide whether or not to modify
            newMemberData = this.populationMembers[memberIndex].data.map((item, i) => {
                // check random chances
                let innerGene;
                if(this.randomFloat(0, 1, 2) < extremeMutateRate){
                    // extreme, takes priority over normal if it catches
                    innerGene = this.randomFloat(item.min, item.max, item.decimals);
                }else if(this.randomFloat(0, 1, 2) < normalMutateRate){
                    // normal, get a direction of extreme gene then move 1% of that
                    // this is an easier way to get a valid number and nudge towards that
                    let newDirection = this.randomFloat(item.min, item.max, item.decimals);
                    // random direction
                    if(this.randomFloat(0, 1, 2) > .5){
                        // positive nudge
                        innerGene = this.fixedDecimal(item.param + (newDirection * .01), item.decimals);
                    }else{
                        // negative nudge
                        innerGene = this.fixedDecimal(item.param - (newDirection * .01), item.decimals);
                    };
                }else{
                    // none
                    innerGene = item.param;
                };
                return({
                    // having out of bounds issues, so re-affirm bounds here
                    param: Math.max(Math.min(innerGene, item.max), item.min),
                    min: item.min,
                    max: item.max,
                    decimals: item.decimals
                });
            });
        };


        // help get designation
        let desigData = newMemberData.map(item => item.param);

        // rebuild a whole member from genes
        let newMemberWhole = {
            designation: this.paramDesignation({
                version: 1,
                scale: 1,
                data: desigData,
            }),
            path: { // average both parents
                elite: this.populationMembers[memberIndex].path.elite,
                tournament: this.populationMembers[memberIndex].path.tournament,
                cross: this.populationMembers[memberIndex].path.cross,
                fork: this.populationMembers[memberIndex].path.fork,
            },
            district: this.populationMembers[memberIndex].district,
            score: -1,
            data: newMemberData,
        };

        // increment fork
        newMemberWhole.path.fork++

        return(newMemberWhole);
    },
    mutateActualMember(memberObj, normalMutateRate, extremeMutateRate, reRollRate){
        /*
        mutateActualMember is useful when you are trying to mutate a new object not already listed in the populationMembers
        -
        normalMutate: a small nudge/offset in some direction, it makes very small moves, so should be *fairly* common
        extremeMutate: a completely new gene
        -
        every gene has an individual rate chance to obtain a mutation
        */

        // decide if mode is going to totally re roll every gene
        let newMemberData;
        if(this.randomFloat(0, 1, 2) < reRollRate){

            // reroll everything
            newMemberData = memberObj.data.map((item, i) => {
                return({
                    // having out of bounds issues, so re-affirm bounds here
                    param: Math.max(Math.min(this.randomFloat(item.min, item.max, item.decimals), item.max), item.min),
                    min: item.min,
                    max: item.max,
                    decimals: item.decimals
                });
            });
        }else{
            
            // dont go into reroll mode, instead go thru individual genes and decide whether or not to modify
            newMemberData = memberObj.data.map((item, i) => {
                // check random chances
                let innerGene;
                if(this.randomFloat(0, 1, 2) < extremeMutateRate){
                    // extreme, takes priority over normal if it catches
                    innerGene = this.randomFloat(item.min, item.max, item.decimals);
                }else if(this.randomFloat(0, 1, 2) < normalMutateRate){
                    // normal, get a direction of extreme gene then move 1% of that
                    // this is an easier way to get a valid number and nudge towards that
                    let newDirection = this.randomFloat(item.min, item.max, item.decimals);
                    // random direction
                    if(this.randomFloat(0, 1, 2) > .5){
                        // positive nudge
                        innerGene = this.fixedDecimal(item.param + (newDirection * .01), item.decimals);
                    }else{
                        // negative nudge
                        innerGene = this.fixedDecimal(item.param - (newDirection * .01), item.decimals);
                    };
                }else{
                    // none
                    innerGene = item.param;
                };
                return({
                    // having out of bounds issues, so re-affirm bounds here
                    param: Math.max(Math.min(innerGene, item.max), item.min),
                    min: item.min,
                    max: item.max,
                    decimals: item.decimals
                });
            });
        };

        // help get designation
        let desigData = newMemberData.map(item => item.param);

        // rebuild a whole member from genes
        let newMemberWhole = {
            designation: this.paramDesignation({
                version: 1,
                scale: 1,
                data: desigData,
            }),
            path: { // average both parents
                elite: memberObj.path.elite,
                tournament: memberObj.path.tournament,
                cross: memberObj.path.cross,
                fork: memberObj.path.fork,
            },
            district: memberObj.district,
            score: -1,
            data: newMemberData,
        };

        // increment fork
        newMemberWhole.path.fork++

        return(newMemberWhole);
    },


    // -------------------------- file store --------------------------
    fileStorePopulation(){
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
        fs.writeFile("../evolution/populationMembers.json", JSON.stringify(this.populationMembers), (err) => {
            if(err){
                console.log(err);
            };
        });
        fs.writeFile("../evolution/elite.json", JSON.stringify(this.populationMembers[0]), (err) => {
            if(err){
                console.log(err);
            };
        });
    },


    // -------------------------- helpers / total sim --------------------------
    testFunction: -1, // -1 means assignment mode
    config: {
        remainderAmount: -1, // good idea to make the last selection method a remainder
        eliteDistrict: [.1, 2],
        tournament: [.5, .1],
        massMutate: [.2, .1, .05, 0],
        massCrossMutate: [.1, .1, .05, .01],
        reRoll: [this.remainderAmount, 0, 0, 1], 
    },
    simulationInit({
        paramArray, // an array of objects including {min,max,decimals} that is to be optimised, 
        // .. or a string "load" to load from ../evolution/populationMembers.json
        popSize, // population size, duh
        testFunction, // optional, puts into test function mode with this function
        config, // optional selction overwrite, see this.config above
    }){
        /*
        this function will be a complete starter package with easy defaults
        -
        the testFunction should be written referencing like normal, e.g:
        evo.populationMembers.length
        */

        // initialise
        if(typeof(paramArray) == "string"){
            // string so load
            console.log(chalk.red("paramArray was string, but loading is not supported yet!"));
        }else{
            // not a string, either array or object, create from new or random
            this.createPopulation(paramArray, popSize);
        };

        // test mode
        if(testFunction != undefined){
            // function mode, pass a function in and let it assign scores *PREFERRED METHOD*

            // set test
            this.testFunction = testFunction;

            // perform first test
            this.testFunction();

            // sort
            this.sortMembersScoreDesc();

        }else{
            // assignment mode, you will externally provide scores
            console.log(chalk.red("testFunction was not defined, and assignment mode is not supported yet!"));
        };

        // config if defined
        if(config != undefined){

            // overwrite
            this.config = config;
        };
    },
    simulationStep(){
        /*
        this will perform 1 generation step of evolution
        */
        
        // build a new array of members
        let newMembers = [];
        newMembers.push(...this.elitismByDistrict(...this.config.eliteDistrict));
        newMembers.push(...this.tournament(...this.config.tournament));
        newMembers.push(...this.massMutate(...this.config.massMutate));
        newMembers.push(...this.massCrossMutate(...this.config.massCrossMutate));

        // remainder
        this.config.remainderAmount = (this.populationMembers.length - newMembers.length) / this.populationMembers.length;
        newMembers.push(...this.massCrossMutate(...this.config.reRoll));

        // clear old
        this.clearPopulation();

        // push new
        this.pushToPopulation(newMembers);

        // test if testing method
        if(this.testFunction != undefined){

            // perform first test
            this.testFunction();

            // sort
            this.sortMembersScoreDesc();
        }else{
            // assignment mode, you will externally provide scores
            console.log(chalk.red("initTestFunction was not defined, and assignment mode is not supported yet!"));
        };

        // file store it
        this.fileStorePopulation();
    },
    simulationGraph(){
        // retrieve population to graph, should be [membersArray, districtStats]
        return([this.populationMembers, this.districtStats]);
    },
    


    // -------------------------- deprecated --------------------------
    dropWorstMembers(){}, // this seems like a bad idea, use tournament instead
};