/*
api utils
-
examples
let [rawData, statusCode, headers] = await eco.api.getNoSig(bc.baseUrl.live, bc.endpointsPublic.historicalCandles, addQuery);
*/

import crypto from 'crypto';
import axios from 'axios';
const moduleName = "api";


const getNoSig = (baseUrl, endpointUrl, additionalQueryArgs) => {
    return new Promise(async (resolve, reject) => {
        /*
        covers GET requests w/o signature
        e.g.
        await flib.binanceGetNoSig("/api/v3/ticker/price");
        or
        await flib.binanceGetNoSig("/api/v3/ticker/price", "&symbol=ETHBTC");
        */
        // get undefined queryArgs
        if(additionalQueryArgs == undefined){
            additionalQueryArgs = "";
        }else if(additionalQueryArgs[0] === "&"){
            // as per my doc additionalQueryArgs always starts with &, but here no sig
            // so set first it to ? 
            additionalQueryArgs = "?" + additionalQueryArgs.slice(1, additionalQueryArgs.length);
        };
        //console.log(additionalQueryArgs);

        // get 
        let getString = "" + baseUrl + endpointUrl + additionalQueryArgs;
        //console.log(getString);
        axios.get(getString).then(response => {

            resolve([response.data, response.status, response.headers]);
        }).catch(error => {
            
            console.log(error.response);
            resolve();
        });
    });
};
const createSignature = (baseUrl, endpointUrl, secret, additionalQueryArgs) => {
    return new Promise((resolve, reject) => {
        /*
        endpointUrl e.g: "/sapi/v1/accountSnapshot"
        additionalQueryArgs e.g: "&recvWindow=5000&type=SPOT" (prepend all args with &)
        timestamp included by default
        */

        // catch empty endpoint
        if(endpointUrl == undefined){
            resolve(false);
        }else{
            // catch empty query
            if(additionalQueryArgs == undefined){
                additionalQueryArgs = "";
            };

            // time string stuff
            let timestamp = Date.now(); // ms
            timestamp = "timestamp=" + timestamp;
            let postQuery = timestamp + additionalQueryArgs;
            //console.log(postQuery); // message to encrypt

            // sha256 hmac
            let encrypted = crypto
                .createHmac("sha256", secret)
                .update(postQuery)
                .digest("hex");

            // url stuff
            let reqUrl = "" + baseUrl + endpointUrl;
            let reqBody = postQuery + "&signature=" + encrypted;
            //console.log(reqUrl); // absolute full query url
            
            resolve([reqUrl, reqBody]);
        };
    });
};
const getWithSig = (baseUrl, endpointUrl, key, secret, additionalQueryArgs) => {
    return new Promise(async (resolve, reject) => {
        // get undefined queryArgs
        if(additionalQueryArgs == undefined){
            additionalQueryArgs = "";
        };

        // sig and concat to one string for GET
        let sig = await createSignature(baseUrl, endpointUrl, secret, additionalQueryArgs);
        sig = sig[0] + "?" + sig[1];
        //console.log(sig);

        // get with headers
        axios.get(sig, {
            headers: {
                "X-MBX-APIKEY": key,
            },
        }).then(response => {

            //console.log(response);
            // [statusCode, .data]
            resolve([response.data, response.status, response.headers]);
        }).catch(error => {
            
            console.log(error.response);
            resolve();
        });

    });
};
const postWithSig = (baseUrl, endpointUrl, key, secret, additionalQueryArgs) => {
    return new Promise(async (resolve, reject) => {
        // get undefined queryArgs
        if(additionalQueryArgs == undefined){
            additionalQueryArgs = "";
        };

        // sig and concat to one string for GET
        let sig = await createSignature(baseUrl, endpointUrl, secret, additionalQueryArgs);
        //sig = sig[0] + "?" + sig[1];
        //console.log(sig);

        // post req with headers
        axios.post(sig[0], sig[1], {
            headers: {
                "X-MBX-APIKEY": key,
            },
        }).then(response => {

            //console.log(response);
            // [statusCode, .data]
            resolve([response.data, response.status, response.headers]);
        }).catch(error => {
            
            console.log(error.response);
            resolve();
        });

    });
};


export default {
    moduleName,
};