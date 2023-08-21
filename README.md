my node library that wraps:
- looping and locking
- numerical and maths
- db ops, sqlite3
- web api
- date formats, since I loooove working with unix timestamps

it also contains some neural network scripts


------------------------------------------------------------------------------


importing:

node:

import eco from './eco.3/eco.lib.js';

import evaNet from './eco.3/evanet.lib.js';


------------------------------------------------------------------------------


useage examples(more in their respective scripts):

- eco.num.gaussian(2, 0, 1);
- await eco.db.createRow(["m_bool", "u_id", "a_string"], [true, 10, "sum text"]);
- eco.date.typeOf(1610000000);
- eco.loop.nforever(mainLoop, 300);
- await evaNet.step(marketSliceIndex);


------------------------------------------------------------------------------


html client for the chart js wrapper, put it in head:

<script src="/chartWrap"></script>

if serving client in node, node will need:

app.get('/chartWrap', function(req, res) {
    res.sendFile(path.join(__dirname + '/eco.2/chartjswrapper.js'));
});


------------------------------------------------------------------------------


note to self:

latest version found in Deskie, S:/Goldrush/eco.3
