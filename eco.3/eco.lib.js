/*
Ecosystem makes library management easier by separating it into groups of functions
both general top level, and specific convenience level
-
its goal hopes to achieve modularity, reuseability, and ease of process to test ideas
-
require this lib with 
> const eco = require('./eco.x/eco.lib.js') // x = version
useage examples
> eco.db.setTable("main");
> eco.num.rsi([45, 2, -4, 12], 2); 
> eco.date.toUnix("2021-08-27T01:30:40.086Z");
> eco.num.fixedFloor(0.6666666666667, 3); // .667
> console.log(eco.api.moduleName);
-
VSCode shortcut to expand all: Ctrl+(K,J), to contract to level 2: Ctrl+(K,2)
*/

/*
const test = () => {
    return 4;
};
*/

import loop from './modules/loop.js';
import num from './modules/numerical.js';
import db from './modules/db.js';
import api from './modules/api.js';
import date from './modules/date.js';


export default {
    loop,
    num,
    db,
    api,
    date,
};
