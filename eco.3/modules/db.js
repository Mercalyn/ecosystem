/*
database ops
shorthand examples:
- 
SET
eco.db.setDb("db/Test"); // exclude beginning / in path
eco.db.setTable("main_index");
- 
TABLE
await eco.db.createTable({
    tableName: "hh", 
    primaryKey: "lid", 
    uniqueConstraint: "lunique", 
    argArray: ["targ STRING", "farg REAL"] // cannot start with number
});
await eco.db.createCol("p_id INT"); // types: INT, FLOAT, STRING, BOOLEAN // once per col to add
- 
ROW
await eco.db.createRow(["m_bool", "u_id", "a_string"], [true, 10, "sum text"]); // strings auto '' wrap
await eco.db.readAsync("u_id, high, low", "lunique = 10"); // fast read async, when order does not matter
await eco.db.readAndOrder("unix, high, low, volume", "unix ASC"); // when order does matter
await eco.db.updateOne("p_scale", "normal", "u_id = 1"); // strings auto '' wrap
await eco.db.delete("unix = " + obj[i].unix);
-
CONVENIENCE
await eco.db.getMax("unix", "type = SELL"); returns a single no. with max where type = SELL, can leave blank too
await eco.db.getMin("unix");
await eco.db.getCount("basket");
*/

//const sql = require('sqlite3').verbose();
import sql from 'sqlite3';
const moduleName = "db";


// -------------------------- db, table, connection --------------------------
let db = null;
let table = null;
const setDb = (dbFilename) => {
    
    // check if last 3 characters is ".db"
    let testString = dbFilename.slice(-3, dbFilename.length);
    if(testString === ".db"){
        // it has .db, do nothing
    }else{
        // it needs .db added
        dbFilename = dbFilename + ".db";
    };

    // connect
    let innerDb = new sql.Database(dbFilename, (err) => {
        if(err){
            return console.error(err.message);
        };
        // connected
    });
    db = innerDb;
};
const setTable = (tableName) => {
    table = tableName;
};


// -------------------------- utils --------------------------
const createDatabase = _ => {
    console.log("please run > sqlite3 <dbName.db> in the terminal");
    console.log("or use sqlitestudio");
};
const createTable = ({tableName, primaryKey, uniqueConstraint, argArray}) => {
    // the reason this single function is obj cause one may not want a primaryKey or unique identifier
    return new Promise((resolve, reject) => {

        // catch non existent tableName
        if(tableName == undefined){
            console.log(chalk.redBright("tableName not set!"));
            resolve(false);
        }else{
            // tableName exists

            // if exist ternaries
            let array = [];
            (primaryKey !== undefined) ? array.push(primaryKey + " INT PRIMARY KEY") : 0;
            (uniqueConstraint !== undefined) ? array.push(uniqueConstraint + " INT UNIQUE") : 0;
            (argArray.length > 0) ? array.push(...argArray) : 0;

            // join all
            let joinString = array.join(", ");
            let runCommand = "CREATE TABLE " + tableName + " (" + joinString + ")";

            // actual db op
            db.run(runCommand, (err, data) => {
                if(err){console.log(err)};
                resolve(true);
            });
        };
    });
};
const createCol = (name_TYPE) => {
    return new Promise((resolve, reject) => {
        db.run("ALTER TABLE " + table + " ADD COLUMN " + name_TYPE, (err, data) => {
            if(err){console.log(err)};
            resolve(true);
        });
    });
};
const deleteCol = (name) => {
    return new Promise((resolve, reject) => {
        db.run("ALTER TABLE " + table + " DROP COLUMN " + name, (err, data) => {
            if(err){console.log(err)};
            resolve(true);
        });
    });
};
// row
const createRow = (colNameArray, valueArray) => {
    // await slib.
    return new Promise((resolve, reject) => {
        // loop thru values
        for(let i = 0; i < valueArray.length; i++){
            // if string, wrap a pair of ''
            if(typeof(valueArray[i]) == 'string'){
                valueArray[i] = "'" + valueArray[i] + "'";
            };
        };

        // join with commas
        let colString = colNameArray.join(", ");
        let valString = valueArray.join(", ");
        let commandString = "INSERT INTO " + table + " (" + colString + ") VALUES (" + valString + ")";
        //console.log(commandString);

        // db op
        db.run(commandString, (err, data) => {
            if(err){console.log(err);}
            resolve(true);
        });
    });
};
const readAsync = (selectCols, whereClause) => {
    // random order, unordered
    return new Promise(resolve => {
        // if whereClause is undefined
        if(whereClause == undefined){
            // set it to true
            whereClause = true;
        };

        let commandString = "SELECT " + selectCols + " FROM " + table + " WHERE " + whereClause;
        
        // db read
        db.all(commandString, (err, data) => {
            if(err){console.log(err);}
            resolve(data);
        });
    });
};
const readAndOrder = (selectCols, orderCol_ASC_DESC, whereClause) => {
    return new Promise(resolve => {
        // if whereClause is undefined
        if(whereClause == undefined){
            // set it to true
            whereClause = true;
        };

        let commandString = "SELECT " + selectCols + " FROM " + table + " WHERE " + whereClause + " ORDER BY " + orderCol_ASC_DESC;
        //console.log(commandString);

        // db read
        db.all(commandString, (err, data) => {
            if(err){
                resolve(err);
            }else{
                resolve(data);
            };
        });
    });
};
const readAndOrderFromTable = (table, selectCols, orderCol_ASC_DESC, whereClause) => {
    return new Promise(resolve => {
        // if whereClause is undefined
        if(whereClause == undefined){
            // set it to true
            whereClause = true;
        };

        let commandString = "SELECT " + selectCols + " FROM " + table + " WHERE " + whereClause + " ORDER BY " + orderCol_ASC_DESC;
        //console.log(commandString);

        // db read
        db.all(commandString, (err, data) => {
            if(err){
                console.log("err triggered at readAndOrderFromTable()");
                console.log(err);
            };
            resolve(data);
        });
    });
};
const updateOne = (setCol, value, whereClause) => {
    return new Promise((resolve, reject) => {
        //console.log(setCol);
        // if whereClause is undefined
        if(whereClause == undefined){
            // set it to true
            whereClause = true;
        };

        // if string, wrap a pair of ''
        if(typeof(value) == 'string'){
            value = "'" + value + "'";
        };

        // db op
        db.run("UPDATE " + table + " SET " + setCol + " = " + value + " WHERE " + whereClause, (err, data) => {
            if(err){
                console.log(setCol);
                console.log(value);
                console.log("err triggered at updateOne()");
                console.log(err);
            };
            resolve(true);
        });
    });
};
const deleteFrom = whereClause => {
    return new Promise((resolve, reject) => {
        // catch if no whereClause
        if(whereClause == undefined){
            // this is destructive so fail it, simply specify (true) to delete all
            console.log("eco.db.deleteFrom() did not specify a where clause!");
            console.log("nothing was done.");
            resolve(false);
        }else{
            
            // db delete
            db.run("DELETE FROM " + table + " WHERE " + whereClause, (err, data) => {
                resolve(true);
            });
        };

    });
};
const vacuum = _ => {
    return new Promise((resolve, reject) => {
        // db vacuum / aka defrag
        db.run("VACUUM", (err, data) => {
            if(err){console.log(err)};
            resolve(true);
        });

    });
};


// transactions for performance, begin before write, and commit after write block end
const begin = _ => {
    db.run("BEGIN TRANSACTION");
};
const commit = _ => {
    return new Promise((resolve, reject) => {
        db.run("COMMIT", () => {
            resolve();
        });
    });
};


// convenience
const getMax = (colToFindMax, whereClause) => {
    return new Promise(async (resolve, reject) => {
        // if whereClause is undefined
        if(whereClause == undefined){
            // set it to true
            whereClause = true;
        };

        let data = await readAsync("MAX(" + colToFindMax + ")", whereClause);
        data = data[0];
        data = data['MAX(' + colToFindMax + ')'];
        resolve(data);
    });
};
const getMin = (colToFindMin, whereClause) => {
    return new Promise(async (resolve, reject) => {
        // if whereClause is undefined
        if(whereClause == undefined){
            // set it to true
            whereClause = true;
        };

        let data = await readAsync("MIN(" + colToFindMin + ")", whereClause);
        data = data[0];
        data = data['MIN(' + colToFindMin + ')'];
        resolve(data);
    });
};
const getCount = (colToFindCount, whereClause) => {
    return new Promise(async (resolve, reject) => {
        // if whereClause is undefined
        if(whereClause == undefined){
            // set it to true
            whereClause = true;
        };

        let data = await readAsync("COUNT(" + colToFindCount + ")", whereClause);
        data = data[0];
        data = data['COUNT(' + colToFindCount + ')'];
        resolve(data);
    });
};


export default {
    moduleName,
    setDb,
    setTable,
    createDatabase,
    createTable,
    createCol,
    createRow,
    readAsync,
    readAndOrder,
    readAndOrderFromTable,
    updateOne,
    deleteFrom,
    deleteCol,
    begin,
    commit,
    getMax,
    getMin,
    getCount,
    vacuum,
};