document.addEventListener("DOMContentLoaded", init);

var rod = null;
var rod2 = null;
var colors = ["blue", "red", "black"];

function toDegrees(rad) {
    return rad * 180.0/Math.PI;
}

var g = new Vector3([0, 10, 0]); // gravitational acceleration vector. multiply by mass for Fg
var nodes = [];

function updateSVG(num) {
    var obj = null;
    if (num==1)
        obj = rod;
    else if (num==2)
        obj = rod2;
    var svg = d3.select("#graph");
    // update rod
    var rodshape = d3.select("#therod" + num);
    var x1 = obj.node1.getX();
    var y1 = obj.node1.getY();
    var x2 = obj.node2.getX();
    var y2 = obj.node2.getY();
    rodshape.attr("d", "M " + x1 + "," + y1 + " L" + x2 + "," + y2);
    // update angvel
    var angvel = d3.select("#angvel" + num);
    x1 = 50;
    y1 = 250;
    // using relative coordinates
    var dy = obj.angVel.xyz[2];
    var dx = 0;
    angvel.attr("d", "M " + x1 + "," + y1 + " l 0," + dy);
    
    // Display the text.
    var text = d3.select("#angVecText" + num);
    text.text("ω=" + obj.angVel.getLength().toFixed(1) + " rad/s");
    text.attr("x", x1 + 10).attr("y", y1 + 6);
    
    // update velocity
    var vel = d3.select("#linvel" + num);
    if (obj.node1.isFixed && obj.node2.isFixed) {
        // if both ends are fixed, velocity is zero.
        vel.attr("d","");
    }
    else if (!obj.node1.isFixed && !obj.node2.isFixed) {
        // if both ends are free, draw velocity in the middle.
        var midp = getMidpoint(obj.node1.position, obj.node2.position);
        x1 = midp.xyz[0];
        y1 = midp.xyz[1];
        dx = obj.velocity.xyz[0];
        dy = obj.velocity.xyz[1];
        vel.attr("d", "M" + x1 + "," + y1 + " l" + dx + "," + dy);
    }
    else {
        var endp = null;
        var r = null;
        if (obj.node1.isFixed) {
            endp = obj.node2.getXYZ();
            r = obj.node2.position.subtract(obj.node1.position);
        }
        else {
            endp = obj.node1.getXYZ();
            r = obj.node1.position.subtract(obj.node2.position);
        }
        x1 = endp[0];
        y1 = endp[1];
        var linvel = obj.angVel.cross(r).multiplyBy(timestep);
        dx = linvel.xyz[0];
        dy = linvel.xyz[1];
        vel.attr("d", "M" + x1 + "," + y1 + " l" + dx + "," + dy);
        
        // put linear vector text
        var linText = d3.select("#linVecText" + num);
        linText.text("v=" + linvel.getLength().toFixed(1) + " m/s");
        linText.attr("x", x1 + 0).attr("y", y1 + 20);
    }
}

function stepsim() {
    rod.applyForceToCoM(g.multiply(10));
    rod2.applyForceToCoM(g.multiply(10));
    rod.step();
    rod2.step();
    updateSVG(1);
    updateSVG(2);
    setTimeout(stepsim, 25);
}

function init() {
    // set up the canvas
    var svg = d3.select("#graphdiv").append("svg").attr("id","graph").attr("width",500).attr("height",500);
    // set up markers.
    svg.selectAll("marker").data(colors).enter().append("marker").attr("id",function(d){ return d + "Arrow"; }).attr("markerWidth",7).attr("markerHeight",7).attr("refX",1).attr("refY",3).attr("orient","auto").append("path").attr("d", "M1,1 L1,5 L5,3 L1,1").attr("fill",function(d){ return d;});
    svg.append("marker").attr("id","endpoint").attr("viewbox","0 0 4 4").attr("markerWidth",4).attr("markerHeight",4).attr("refX",1).attr("refY",1).append("circle").attr("cx",1).attr("cy",1).attr("r",1);
    
    var node1 = new Node(250, 50, true);
    var node2 = new Node(350, 50, true);
    var node3 = new Node(350, 50, true);
    var node4 = new Node(450, 50, true);
    nodes[0] = node1;
    nodes[1] = node2;
    nodes[2] = node3;
    nodes[3] = node4;
    node2.isFixed = false;
    node4.isFixed = false;
    rod = new Rod(node1, node2, 10);
    rod.calcInertia();
    rod2 = new Rod(node3, node4, 10);
    rod2.calcInertia();
    rod.link2 = rod2;
    rod2.link1 = rod;
    // put the rod
    svg.append("path").attr("class","rod").attr("id","therod1");   
    svg.append("path").attr("class","rod").attr("id","therod2"); 
    // put velocity vectors
    svg.append("path").attr("class","vector blueVect").attr("id","angvel1");
    svg.append("path").attr("class","vector redVect").attr("id","linvel1");
    svg.append("path").attr("class","vector blueVect").attr("id","angvel2");
    svg.append("path").attr("class","vector redVect").attr("id","linvel2");
    svg.append("text").attr("class","unit").attr("id","angVecText1");
    svg.append("text").attr("class","unit").attr("id","linVecText1");
    svg.append("text").attr("class","unit").attr("id","angVecText2");
    svg.append("text").attr("class","unit").attr("id","linVecText2");

    stepsim();
}
