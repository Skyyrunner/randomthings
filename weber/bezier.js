var drag = d3.behavior.drag().on("drag", dragged);
var names = "abcdefghijklmnopqrstuvwxyz";
var size = 5;
var rawcolor = "0000EE";

document.addEventListener("DOMContentLoaded", init);


var width = 100;
var height = 100;

function getNewDimensions() {
    width = document.getElementById("graph").offsetWidth;
    height = document.getElementById("graph").offsetHeight;
}

function init() {
    // Needs double initialization for some reason, or else the graph will clip.
    // Too lazy to fix this for good.
    getNewDimensions();
    initSVG();
    d3.select("#submit").on("click", function() { checkSize(this.form); });
    d3.select("window").on("resize", getNewDimensions);
    getNewDimensions();
    initSVG();
}

function checkSize(form) {
    var newsize = parseInt(form.num.value)
    if (newsize < 3) newsize = 3;
    else if (newsize > 26) newsize = "26";
    d3.select("#numf").attr("value", newsize);
    
    size = parseInt(form.num.value); 
    rawcolor = form.color.value;
    initSVG();
}

function interp(t) {
    var difference = 0.3 / size;
    var R = rawcolor[0] + rawcolor[1];
    var G = rawcolor[2] + rawcolor[3];
    var B = rawcolor[4] + rawcolor[5];
    R = parseInt(R, 16);
    G = parseInt(G, 16);
    B = parseInt(B, 16);
    console.log(R,G,B);
    var nR = Math.floor((difference * (size - t) + 0.7) * R);
    var nG = Math.floor((difference * (size - t) + 0.7) * G);
    var nB = Math.floor((difference * (size - t) + 0.7) * B);
    nR = nR.toString(16);
    nG = nG.toString(16);
    nB = nB.toString(16);  
    if (nR.length == 1) nR = "0" + nR;
    if (nG.length == 1) nG = "0" + nG;
    if (nB.length == 1) nB = "0" + nB;
    
    return "#" + nR + nG + nB;
}

function initSVG() {
    d3.select("#graph").selectAll("*").remove();
    d3.select("#graph").append("svg").attr("id","beziersvg");
    
    var graph = d3.select("#beziersvg").attr("width",width).attr("height",height);
    
    // Draw all the paths. 
    var paths = graph.append("g").attr("id", "paths");
    
    // Gradually darken the color.    
    for (var i = 0; i < Math.floor(size/2.0) - 1; i++) {
        var color = interp(i);
        paths.append("path").attr("id", names.substring(i*2, i*2+3))
             .attr("stroke", color);
    }
    
    var color = interp(size);    
    if (size % 2 == 0) {

        paths.append("path").attr("id", names.substring(size-2, size))
             .attr("stroke", color);
    }
    else if (size %2 == 1) {
        paths.append("path").attr("id", names.substring(size-3, size))
             .attr("stroke", color);
    }
    
    var circles = [];
    for (var i = 0; i < size; i++) {
        circles[i] = [Math.random()*(width - 20) + 20, Math.random()*(height - 20) + 20];
    }
    
    graph.append("g").attr("id", "circles").selectAll("circle").data(circles).enter().append("circle").attr("cx", function(d){ return d[0]; }).attr("cy", function(d){ return d[1]; }).attr("r", 15).attr("id", function(d, i) { return names[i]; }).call(drag);  

    updateCurves();
}

function dragged(d) {
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    updateCurves();
}

// Input: 3 coordinates representing knots, and the previous section's B'(1).
//        K is the node between the start and the end of the curve.
// Output: 2 coordinates representing the control points, and the final slope.
function findControlPoints(P0, K, P3, prevslope) {
    // P1, P2 are the control points.
    // If the curve we are finding is Bi(t), prevslop === B(i-1)'(1)
    var P1x = P0[0] + (1.0/3.0) * prevslope[0];
    var P1y = P0[1] + (1.0/3.0) * prevslope[1];
    var P2x = (1.0/3.0) * (8 * K[0] - P0[0] - 3 * P1x - P3[0]);
    var P2y = (1.0/3.0) * (8 * K[1] - P0[1] - 3 * P1y - P3[1]);
    
    // Now let's find B'(1), which will be the next curve section's prevslope.
    var slopeX = 3 * (P3[0] - P2x);
    var slopeY = 3 * (P3[1] - P2y);
    
    return [P0, [P1x, P1y], [P2x, P2y], P3, [slopeX, slopeY]];
}

function findFinalPoint(P0, P3, prevslope) {
    // P1, P2 are the control points.
    var P1x = (1.0/3.0) * (P0[0] + prevslope[0]);
    var P1y = (1.0/3.0) * (P0[1] + prevslope[1]);
    var P2x = P3[0];
    var P2y = P3[0];
    
    var slopeX = 0;
    var slopeY = 0;
    
    return [P0, [P1x, P1y], [P2x, P2y], P3, [slopeX, slopeY]];
}

function getPathDetails(points) {
    return "M " + points[0][0] + "," + points[0][1] + " C " + points[1][0] + "," + points[1][1] + " " + points[2][0] + "," + points[2][1] + " " + points[3][0] + "," + points[3][1];
}

function floatify(point) {
    return [parseFloat(point[0]), parseFloat(point[1])];
}



function updateCurves() {
    var i_max = Math.floor(size/2.0);
    var slope = [0.0, 0.0];
    for (var i = 0; i < i_max - 1; i++) {
        var id1 = names[i*2];
        var id2 = names[i*2+1];
        var id3 = names[i*2+2];
        slope = updateCurve(id1, id2, id3, slope);
    }
    if (size % 2 == 1) {
        var id1 = names[size-3];
        var id2 = names[size-2];
        var id3 = names[size-1];
        slope = updateCurve(id1, id2, id3, slope);
    }
    else if (size % 2 == 0) {
        var id1 = names[size-2];
        var id2 = names[size-1];
        slope = updateFinalCurve(id1, id2, slope);
    }
}

function updateCurve(id1, id2, id3, slope) {
    var path = d3.select("#" + id1 + id2 + id3);
    var node1 = d3.select("#" + id1);
    var node2 = d3.select("#" + id2);
    var node3 = d3.select("#" + id3);
    var P0 = [node1.attr("cx"), node1.attr("cy")];
    var K = [node2.attr("cx"), node2.attr("cy")];
    var P3 = [node3.attr("cx"), node3.attr("cy")];
    P0 = floatify(P0);
    K = floatify(K);
    P3 = floatify(P3);
    var result = findControlPoints(P0, K, P3, slope);
    path.attr("d", getPathDetails(result)); 
    return result[4];
}

function updateFinalCurve(id1, id2, slope) {
    var path = d3.select("#" + id1 + id2);
    var node1 = d3.select("#" + id1);
    var node2 = d3.select("#" + id2);
    var P0 = [node1.attr("cx"), node1.attr("cy")];
    var P3 = [node2.attr("cx"), node2.attr("cy")];
    P0 = floatify(P0);
    P3 = floatify(P3);
    var result = findFinalPoint(P0, P3, slope);
    path.attr("d", getPathDetails(result)); 
    return result[4]; 
}
