document.addEventListener("DOMContentLoaded", init);
var drag = d3.behavior.drag().on("drag", dragged);

var width=0;
var height=0;
var area1 = undefined;
var area2 = undefined;

var defaultnum = 100;
var radius = 4;
// The number of circles in each side.
var num1 = 0;
var num2 = 0;

function init() {
    width = Math.floor(document.getElementById("graph").offsetWidth * 0.95);
    console.log(document.getElementById("graph").offsetWidth);
    height = width;
    area1 = d3.select("#graph").append("svg").attr("id", "area1").attr("width", width).attr("height", height).append("g").attr("class", "left");
    area2 = d3.select("#graph2").append("svg").attr("id", "area2").attr("width", width).attr("height", height).attr("class", "right");
    redraw();
    d3.select("#show").on("click", function(){ toggleAnswers(this); });
    d3.select("#redraw").on("click", function(){ redraw(); });
    d3.select("#submit").on("click", function(){ update(this.form); });
}

function redraw() {
    
    resetAnswers();
    area1.selectAll("*").remove();
    area2.selectAll("*").remove();
    // Since according to Weber's difference threshold vision must be 8% different...
    // First decide whether to have more than the threshold or less than the threshold (4% or 10%)
    var side = Math.floor(Math.random() * 2); // 0 or 1.
    var threshold = Math.floor(Math.random() * 2);
    var percent = 0;
    if (threshold == 0) // generate less
        percent = 0.04;
    else if (threshold == 1)
        percent = 0.10;
    
    num1 = defaultnum;
    num2 = defaultnum;
    if (side == 0) // area1 is normal
        num2 = defaultnum * (1 + percent);
    else if (side == 1)
        num1 = defaultnum * (1 + percent);
    
    num1 = Math.floor(num1);
    num2 = Math.floor(num2);
    
    genNumber(area2, num1);
    genNumber(area1, num2);
    
    // Next, write the answers in the spoiler tag
    var answers = d3.select("#answers");
    answers.selectAll("*").remove();
    answers.append("p").html("The left side has: <em>" + num1 + "</em> circles.<br>The right side has: <em>" + num2 + "</em> circles.");
    
}

// Change the circle radius.
function update(form) {
    radius = parseInt(form.r.value);
    redraw();
}

// Generate randomly placed circles
function genNumber(area, number) {
    var bounds = {x:0, y:0, width:width, height:height};    
    for (var i = 0; i < number; i++) {
        var cx = Math.floor(Math.random()*(width-8)) + 4;
        var cy = Math.floor(Math.random()*(height-8)) + 4;   
        // Must not be outside of boundary. Radius 4
        area.append("circle").attr("cx", cx)
                             .attr("cy", cy)
                             .attr("r", radius)
                             .call(drag);  
    }
}

function toggleAnswers(button) {
    var content = d3.select(button).text();
    if (content == "Show answers") {
        d3.select(button).text("Hide answers");
        d3.select("#answers").attr("class", "shownAnswers");
    }
    else if (content == "Hide answers") {
        d3.select(button).text("Show answers");
        d3.select("#answers").attr("class", "hiddenAnswers");
    }
}

function resetAnswers() {
    d3.select("#show").text("Show answers");
    d3.select("#answers").attr("class", "hiddenAnswers");
}

function dragged(d) {
    d3.select(this).attr("cx", d3.event.x).attr("cy", d3.event.y);
}
