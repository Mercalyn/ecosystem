/*
looping and locking functions
-
PM2 commands(only needed for live scripts, for local programming use nodemon):
pm2 monit - monitor
pm2 ls - list
pm2 delete <id>
pm2 start <scriptName>
pm2 logs <id>||NULL
pm2 logs --lines numLines <id>
pm2 restart <id>
pm2 start -c cronSchedule <script>
-
cron examples(but reverse the slash):
"*\20 * * * *" - every 20 minutes
"*\1 * * * *" - every min
*/


import chalk from 'chalk';
const moduleName = "loop";

// -------------------------- locking --------------------------
let threadLock = false;
let verbose = true;
const lock = () => {
    threadLock = true;
    if(verbose){
        console.log(chalk.yellow("WARN: ----------------------------------> thread locked" + " @ " + Date.now()));
    };
};
const unlock = () => {
    threadLock = false;
    if(verbose){
        console.log(chalk.greenBright("INFO: ----------------------------------> thread released" + " @ " + Date.now()));
    };
};
const changeVerbosity = (bool) => {
    verbose = bool;
};

// -------------------------- looping --------------------------
const once = funcName => {
    // no loop
    lock();
    funcName();
};
const nforever = once; // convenient alias for "once"
const forever = (funcName, msLoop) => {
    /*
    calling loop with the function name will allow it to loop when lock is free
    -
    example:
    const main_loop = async _ => {
        // release
        slib.unlock();
    };
    slib.loop(main_loop);
    */

    if(msLoop == undefined){
        // if not defined, default of 400ms
        msLoop = 400;
    };

    // call lock to prevent run on
    lock();
    
    // run passed func once right at start
    funcName();

    // repeater
    const repeater = _ => {
        if(!threadLock){
            // immediately lock it again
            lock();

            // run only if lock is free
            funcName();

        }else{
            // still locked, do nothing
        };
    };
    setInterval(repeater, msLoop);
};


export default {
    moduleName,
    changeVerbosity,
    lock,
    unlock,
    once,
    nforever,
    forever,
};