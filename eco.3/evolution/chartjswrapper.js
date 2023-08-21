/*
html client for the chart js wrapper:
<script src="/chartWrap"></script>

node that is serving html client:
app.get('/chartWrap', function(req, res) {
    res.sendFile(path.join(__dirname + '/eco.2/chartjswrapper.js'));
});
-
the reason this wrapper exists is because I'm tired of rewriting and nesting and unnesting
code for days just to add and delete datastreams for charting
-
sample useage:
let chartRsi = chartNew("chartRsi", 16, "line", [{
    label: "RSI",
    color: "maroon",
}], "rsi");
-
chartLabel(chartRsi, "line", rowData.index_id, .5);
chartData(chartRsi, "line", [rowData.rsi]); // last is an array so you can pass multiple
chartAddOne(chartRsi, "MFI", "danger", rowData.mfi);
-
chartAddMany(chartRsi, [{
    label: "MFI",
    color: "danger",
    data: rowData.mfi,
},{
    label: "Histogram",
    color: "wheat",
    data: rowData.histogram,
}]);
*/


// pre determined colours for ease of use
const colors = {
    white: "rgb(255,255,255)",
    maroon: "rgb(128,0,0)",
    firebrick: "rgb(178,34,34)",
    crimson: "rgb(220,20,60)",
    tomato: "rgb(255,99,71)",
    coral: "rgb(255,127,80)",
    salmon: "rgb(250,128,114)",
    danger: "rgb(255,69,0)",
    construction: "rgb(255,140,0)",
    orange: "rgb(255,165,0)",
    gold: "rgb(255,215,0)",
    paleGold: "rgb(238,232,170)",
    canvas: "rgb(189,183,107)",
    khaki: "rgb(240,230,140)",
    olive: "rgb(128,128,0)",
    army: "rgb(85,107,47)",
    oliveDrab: "rgb(107,142,35)",
    yellowGreen: "rgb(154,205,50)",
    green: "rgb(0,128,0)",
    forestGreen: "rgb(34,139,34)",
    limeGreen: "rgb(50,205,50)",
    paleGreen: "rgb(152,251,152)",
    darkSeaGreen: "rgb(143,188,143)",
    seaGreen: "rgb(46,139,87)",
    aquaMarine: "rgb(102,205,170)",
    slate: "rgb(47,79,79)",
    teal: "rgb(0,128,128)",
    darkTurquoise: "rgb(0,206,209)",
    powderBlue: "rgb(176,224,230)",
    cadetBlue: "rgb(95,158,160)",
    cornflower: "rgb(30,144,255)",
    steelBlue: "rgb(70,130,180)",
    deepSky: "rgb(0,191,255)",
    sky: "rgb(135,206,235)",
    midnight: "rgb(25,25,112)",
    royal: "rgb(65,105,225)",
    indigo: "rgb(75,0,130)",
    darkSlate: "rgb(72,61,139)",
    magenta: "rgb(255,0,255)",
    darkMagenta: "rgb(139,0,139)",
    thistle: "rgb(216,191,216)",
    orchid: "rgb(218,112,214)",
    paleViolet: "rgb(219,112,147)",
    hotPink: "rgb(255,105,180)",
    mediumViolet: "rgb(199,21,133)",
    violet: "rgb(238,130,238)",
    beige: "rgb(245,245,220)",
    bisque: "rgb(255,228,196)",
    wheat: "rgb(245,222,179)",
    chiffon: "rgb(255,250,205)",
    chocolate: "rgb(210,105,30)",
    sienna: "rgb(160,82,45)",
    tan: "rgb(210,180,140)",
    rosyBrown: "rgb(188,143,143)",
    mint: "rgb(245,255,250)",
    lavender: "rgb(230,230,250)",
    honeydew: "rgb(240,255,240)",
    azure: "rgb(240,255,255)",
    snow: "rgb(255,250,250)",
};


// pre determined options profiles, not the best use of space, but whatever
const optionProfiles = {
    rsi: {
        elements: {
            line: {
                tension: 0
            },
            point: {
                radius: 0
            }
        },
        animation: {
            duration: 0
        },
        hover: {
            animationDuration: 0
        },
        responsiveAnimationDuration: 0,
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                gridLines: {
                    color: 'rgba(255, 255, 255, .2)',
                    zeroLineColor: 'rgba(255, 255, 255, .6)'
                },
                ticks: {
                    display: false,
                    beginAtZero: false,
                    fontColor: 'white'
                }
            }],
            xAxes: [{
                gridLines: {
                    color: 'rgba(255, 255, 255, .2)'
                },
                ticks: {
                    fontColor: 'rgba(255, 255, 255, .6)'
                },
                display: true
            }]
        }
    },
    price: {
        elements: {
            line: {
                tension: 0
            },
            point: {
                radius: 0
            }
        },
        animation: {
            duration: 0
        },
        hover: {
            animationDuration: 0
        },
        responsiveAnimationDuration: 0,
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                gridLines: {
                    color: 'rgba(255, 255, 255, .2)',
                    zeroLineColor: 'rgba(255, 255, 255, .6)'
                },
                ticks: {
                    display: false,
                    beginAtZero: false,
                    fontColor: 'white'
                }
            }],
            xAxes: [{
                gridLines: {
                    color: 'rgba(255, 255, 255, .2)'
                },
                ticks: {
                    fontColor: 'rgba(255, 255, 255, .6)'
                },
                display: false
            }]
        }
    },
    volume: {
        elements: {
            line: {
                tension: 0
            },
            point: {
                radius: 0
            }
        },
        animation: {
            duration: 0
        },
        hover: {
            animationDuration: 0
        },
        responsiveAnimationDuration: 0,
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                gridLines: {
                    color: 'rgba(255, 255, 255, .2)',
                    zeroLineColor: 'rgba(255, 255, 255, .6)'
                },
                ticks: {
                    display: false,
                    beginAtZero: false,
                    fontColor: 'white'
                }
            }],
            xAxes: [{
                gridLines: {
                    color: 'rgba(255, 255, 255, .2)'
                },
                ticks: {
                    fontColor: 'rgba(255, 255, 255, .6)'
                },
                display: false
            }]
        }
    },
    binary: {
        elements: {
            line: {
                tension: 0
            },
            point: {
                radius: 0
            }
        },
        animation: {
            duration: 0
        },
        hover: {
            animationDuration: 0
        },
        responsiveAnimationDuration: 0,
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                gridLines: {
                    color: 'rgba(255, 255, 255, .2)',
                    zeroLineColor: 'rgba(255, 255, 255, .6)'
                },
                ticks: {
                    display: false,
                    beginAtZero: false,
                    fontColor: 'white'
                }
            }],
            xAxes: [{
                gridLines: {
                    color: 'rgba(255, 255, 255, .2)'
                },
                ticks: {
                    fontColor: 'rgba(255, 255, 255, .6)'
                },
                display: false
            }]
        }
    },
    bar: {
        elements: {
            line: {
                tension: 0
            },
            point: {
                radius: 0
            }
        },
        animation: {
            duration: 0
        },
        hover: {
            animationDuration: 0
        },
        responsiveAnimationDuration: 0,
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                gridLines: {
                    color: 'rgba(255, 255, 255, .2)',
                    zeroLineColor: 'rgba(255, 255, 255, .6)'
                },
                ticks: {
                    display: false,
                    beginAtZero: false,
                    fontColor: 'white'
                },
                stacked: true,
            }],
            xAxes: [{
                stacked: true,
            }]
        }
    },
};


const chartNew = (chartName, styleString, type, itemArray, optionProfile, stepped) => {
    // append HTML to body in a somewhat roundabout way
    let div = document.createElement("div");
    div.className = "chart-container";
    div.style = styleString;
    div.innerHTML = "<canvas id='" + chartName + "'></canvas>"
    document.body.appendChild(div);

    // the following created a bug where it would only create one chart, only have for reference what not to do
    //document.body.innerHTML += "<div class='chart-container' style='" + styleString + "'><canvas id='" + chartName + "'></canvas></div>";
    
    // context
    let chartContext = document.getElementById(chartName).getContext('2d');
    if(type === "line"){
        // new line chart, other charts are arranged differently
        return new Chart(chartContext, {
            type: 'line',
            data: {
                labels: [0,1,2,3,4,5],
                datasets: itemArray.map((item, index) => ({
                    label: item.label,
                    data: [12, 19, 0, 8, 2, 21],
                    fill: false,
                    borderWidth: 1,
                    steppedLine: (() => {
                        if(stepped === undefined){
                            return(false);
                        }else if(stepped === false){
                            return(false);
                        }else{
                            return(stepped);
                        };
                    })(),
                    borderColor: colors[item.color],
                })),
            },
            options: optionProfiles[optionProfile],
        });
    }else if(type === "bar"){
        // new bar chart
        return new Chart(chartContext, {
            type: 'bar',
            data: {
                labels: [0,1,2,3,4,5,6],
                datasets: itemArray.map((item, index) => ({
                    label: item.label,
                    data: [12, -19, 0, 8, -2, 21, 6],
                    fill: true,
                    borderWidth: 1,
                    barPercentage: 1.0,
                    borderColor: colors[item.color],
                    backgroundColor: colors[item.color],
                })),
            },
            options: optionProfiles[optionProfile],
        });
    };
};


const chartLabel = (chartObj, type, labelArray, scale) => {
    if(type === "line"){
        //chartObj.canvas.parentNode.style.width = (labelArray.length * scale) + "px";
        chartObj.data.labels = labelArray;
        chartObj.update();
    }else if(type === "bar"){
        chartObj.data.labels = labelArray;
        chartObj.update();
    };
};

const chartPush = (chartObj, labelItem, dataArray) => {
    chartObj.data.labels.push(labelItem);
    for(let i = 0; i < chartObj.data.datasets.length; i++){
        chartObj.data.datasets[i].data.push(dataArray[i]);
    };
    chartObj.update();
};

const chartData = (chartObj, type, dataArray) => {
    if(type === "line" || type === "bar"){
        for(let i = 0; i < dataArray.length; i++){
            chartObj.data.datasets[i].data = dataArray[i];
        };
        chartObj.update();
    };
};


// bugged
const chartAddOne = (chartObj, labelName, color, dataPoint) => {
    // only do chartAdd after chartLabel
    chartObj.data.datasets.push({
        label: labelName,
        data: dataPoint,
        fill: false,
        borderWidth: 1,
        steppedLine: false,
        borderColor: colors[color],
    });
    chartObj.update();
};

// bugged
const chartAddMany = (chartObj, inputArrayOfObj) => {
    // this currently has a bug where refresh will just continue adding on data, so preferrably init with all the needed data points
    // remap
    inputArrayOfObj = inputArrayOfObj.map((item, index) => ({
        label: item.label,
        data: item.data,
        fill: false,
        borderWidth: 1,
        steppedLine: false,
        borderColor: colors[item.color],
    }));


    // push and update
    chartObj.data.datasets.push(...inputArrayOfObj);
    chartObj.update();
};