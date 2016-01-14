
// Dimensions of the svg screen
var WIDTH = 100;
var HEIGHT = 100;
var UPDATE_TICK = 50; // How many milliseconds between screen redraws.
var LOGIC_TICK = 0.5;
var ALIGNMENT_RADIUS = 6;
var SEPARATION_RADIUS = 5;
var COHESION_RADIUS = 6;
var COHESION_MAGIC_NUM = 5;
var BOID_NUM = 80; // # of boids to generate
var MAX_ACCELERATION = 0.3;
var SOFT_MAX = true; // if false, any acceleration above MAX_ACCELERATION is cut off. 
// If true, acceleration above MAX is squared if under 1 or sqrted if over 1.
var MIN_SPEED = 0.5;
var MAX_SPEED = 1;
var EDGE_CURRENT = false; // have a weak current along the edges.
var EDGE_CURRENT_WIDTH = 0.1;
var EDGE_CURRENT_STRENGTH = 0.1;
var USE_SOFT_BOUNDARIES = true;
var SOFT_BOUNDARY_STRENGTH = 0.2;
var SEPARATION_MAGIC = 1.0;
var FOOD_RADIUS = 10;
var FOOD_MAGIC_NUM = 100;
var FOOD_MAX_ACC = 0.1;

document.addEventListener("DOMContentLoaded", init);

function randBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function radians(degrees) {
    return degrees * Math.PI / 180;
}

// Conserves speed.
function accelerateBoid(boid, a, t) {
    var L = boid.velocity.length();
    // Change the velocity by acceleration
    boid.velocity.add(boid.acceleration.multiply(Victor(t, t)));
    // If the velocity is larger than the max, limit it.
    if (L > boid.maxSpeed) {
        boid.velocity.norm().multiply(Victor(boid.maxSpeed, boid.maxSpeed));
    }
}

var boids = [];
var fishfood = [];

function createFishfood(x, y) {
    var food = {};
    food.x = x;
    food.y = y;
    food.eaten = false;
    fishfood.push(food);
}

// Generate boids.
function generate(num) {
    for (var i = 0; i < num; i++) {
        var boid = {};
        boid.id = i;
        boid.x = randBetween(0.0, 100.0);
        boid.y = randBetween(0.0, 100.0);
        boid.velocity = new Victor(randBetween(0.01, 2), randBetween(0.01, 2));
        boid.acceleration = new Victor(0, 0);
        boid.maxSpeed = boid.velocity.length();

        if (boid.maxSpeed < MIN_SPEED) {
            boid.velocity.norm().multiply(Victor(MIN_SPEED, MIN_SPEED));
            boid.maxSpeed = MIN_SPEED;
        } else if (boid.maxSpeed > MAX_SPEED) {
            boid.velocity.norm().multiply(Victor(MAX_SPEED, MAX_SPEED));
            boid.maxSpeed = MAX_SPEED;
        }

        boids.push(boid);
    }

    // also place them on the screen.
    d3.select("#boids").selectAll("path").data(boids)
      .enter().append("path").attr("class", "boid").attr("d", function(d){
        return "M " + d.x + " " + d.y + " l " + d.velocity.x + " " + d.velocity.y;
       })
      .attr("marker-end", "url(#yellowArrow)");
}

// Rerandomize all boid speeds.
function resetSpeed() {
    for (var i = 0; i < BOID_NUM; i++) {
        var newSpeed = randBetween(MIN_SPEED, MAX_SPEED);
        boids[i].velocity.norm().multiply(Victor(newSpeed, newSpeed));
        boids[i].maxSpeed = newSpeed;
    }
}

// Update the boids.
function update() {
    t = LOGIC_TICK;
    var num = boids.length;    
    var numfood = fishfood.length;
    // Do swarm behaviour!
    // To make it make sense, the new accelerations are temporarily saved as a 
    // separate variable from the current ones, then copied over later.
    for (var i = 0; i < num; i++) {
        var alignment = new Victor(0, 0);
        var separation = new Victor(0, 0);
        var cohesion = new Victor(0, 0);
        var cohesionAccel = new Victor(0, 0); // the actual acceleration towards cohesion.
        var foodDirection = new Victor(0, 0);
        var foodDistance2 = FOOD_RADIUS * FOOD_RADIUS;

        var count_ali = 0; // alignment
        var count_sep = 0; // separation
        var count_coh = 0;

        for (var j = 0; j < num; j++) {         
            /*if (boids[i].id == boids[j].id)
                continue;*/

            // Rule One: alignment. Steer towards average heading of mates.
            var dX = boids[i].x - boids[j].x;
            var dY = boids[i].y - boids[j].y;
            var distance2 = dX * dX + dY * dY;
            if (distance2 < ALIGNMENT_RADIUS * ALIGNMENT_RADIUS) {
                count_ali++;
                alignment.add(boids[j].velocity);
            }

            // Rule two: cohesion. Steer towards center of local flockmates.
            if (distance2 < COHESION_RADIUS * COHESION_RADIUS) {
                count_coh++;
                // Find the center of local flockmates.
                cohesion.add(Victor(boids[j].x, boids[j].y));
            }

            // Rule three: separation. Steer away from close mates
            if (distance2 < SEPARATION_RADIUS * SEPARATION_RADIUS) {
                count_sep++;
                // Find a vector that points away from the neighbor.
                var away = new Victor(boids[i].x - boids[j].x, boids[i].y - boids[j].y);
                // Weigh it by distance: the further the weaker.
                var distance = Math.sqrt(distance2)
                var magic = distance * SEPARATION_MAGIC + 0.001;
                away.divide(Victor(magic, magic));
                separation.add(away);
            }
        }

        // Attract fish towards closest fish food
        for (var f = 0; f < numfood; f++) {
            if (fishfood[f].eaten) {
                continue;
            }

            var x = fishfood[f].x - boids[i].x;
            var y = fishfood[f].y - boids[i].y;            
            var distance2 = x * x + y * y;
            if (distance2 < foodDistance2) {
                foodDirection = Victor(x, y);
                foodDistance2 = distance2;
            }

            if (distance2 < 1) {
                fishfood[f].eaten = true;
            }
        }

        if (count_ali > 0)
            alignment.divide(Victor(count_ali, count_ali));
        if (count_sep > 0)
            separation.divide(Victor(count_sep, count_sep));
        if (count_coh > 0) {
            cohesion.divide(Victor(count_coh, count_coh));
            // Next find a vector that points towards the center.
            // the cohesion vector is representing a coordinate.
            cohesionAccel = cohesion.subtract(Victor(boids[i].x, boids[i].y));
            // Weaken the vector -- it shouldn't be larger than sep.
            cohesionAccel.norm().divide(Victor(COHESION_MAGIC_NUM, COHESION_MAGIC_NUM));
        }
        // If there is food in detection radius.
        if (foodDistance2 < FOOD_RADIUS) {
            var factor = foodDistance2 * FOOD_MAGIC_NUM;
            foodDirection.norm();
        }

        var current = Victor(0,0);
        if (EDGE_CURRENT) {
            // Try simulating a current around the edges to discourage bumping into walls
            var CUR_STR = EDGE_CURRENT_STRENGTH;
            if (boids[i].x < WIDTH * 0.05) {
                current.add(Victor(0, -CUR_STR));
            } else if (boids[i].x > WIDTH * 0.95) {
                current.add(Victor(0, CUR_STR));
            }
            if (boids[i].y < HEIGHT * 0.05) {
                current.add(Victor(CUR_STR, 0));
            } else if (boids[i].y > HEIGHT * 0.95) {
                current.add(Victor(-CUR_STR, 0));
            }
        }    

        boids[i].acceleration = alignment.add(separation).add(current)
                                    .add(cohesionAccel).add(foodDirection);
    }

    for (var i = 0; i < num; i++) {
        if (boids[i].acceleration.length() > MAX_ACCELERATION) {
            if(SOFT_MAX) {
                var L_a = boids[i].acceleration.length();

                if (L_a > 1) L_a = Math.sqrt(L_a);
                else L_a *= L_a;

                boids[i].acceleration.norm().multiply(Victor(L_a, L_a))
            } else {
                boids[i].acceleration.norm().multiply(Victor(MAX_ACCELERATION, MAX_ACCELERATION));
            }            
        }

        // Change the velocity by acceleration
        accelerateBoid(boids[i], boids[i].acceleration, t);

        // Randomly make the fish speed up to max
        if(Math.random() < 0.05) {
            var L = boids[i].maxSpeed;
            boids[i].velocity.norm().multiply(Victor(L, L));
        }
        // soft boundary test
        if (USE_SOFT_BOUNDARIES) {
            var SOFT_BND_STR = SOFT_BOUNDARY_STRENGTH;
            if (boids[i].x < 0) {
                boids[i].velocity.add(Victor(SOFT_BND_STR , 0));
            } else if (boids[i].x > WIDTH) {
                boids[i].velocity.add(Victor(-SOFT_BND_STR, 0));
            }
            if (boids[i].y < 0) {
                boids[i].velocity.add(Victor(0, SOFT_BND_STR));
            } else if (boids[i].y > HEIGHT) {
                boids[i].velocity.add(Victor(0, -SOFT_BND_STR));
            }
        }
        // Move along velocity.
        boids[i].x += boids[i].velocity.x * t;
        boids[i].y += boids[i].velocity.y * t;

        // separated true and false into 2 ifs because order
        // may be important for the hard boundaries.
        if (!USE_SOFT_BOUNDARIES) {
            // steer back into area out of it.
            if (boids[i].x > WIDTH) {
                boids[i].x = WIDTH; 
                boids[i].velocity.x *= -1;
            }
            else if (boids[i].x < 0) {
                boids[i].x = 0; 
                boids[i].velocity.x *= -1;
            }
            if (boids[i].y > HEIGHT * .98) {
                boids[i].y = HEIGHT * .98; 
                 boids[i].velocity.y *= -1;
            }
            else if (boids[i].y < 2) {
                boids[i].y = HEIGHT * 0.02;  
                boids[i].velocity.y  *= -1;
            }
        }
    }

    // remove eaten fishfood 
    var newfishfood = new Array();
    for (var f = 0; f < numfood; f++) {
        if (!fishfood[f].eaten) {
            newfishfood.push(fishfood[f]);
        }
    }
    fishfood = newfishfood;

    updateScreen(t);

    setTimeout(update, UPDATE_TICK);
}

// Update SVG 
function updateScreen(t) {
    d3.selectAll(".boid").data(boids)
    .transition().duration(UPDATE_TICK).ease("linear").attr("d", function(d){
        var L = d.maxSpeed;
        var norm = d.velocity.clone().norm().multiply(Victor(L, L));
        return "M " + d.x + " " + d.y + " l " + norm.x + " " + norm.y;
       });
    var sel = d3.select("#food").selectAll("circle").data(fishfood, 
        function(d) {
            return [d.x, d.y];
        });
    sel.enter().append("circle").attr("class", "fishfood")
      .attr("cx", function(d){return d.x;}).attr("cy", function(d){return d.y;})
      .attr("r", "1px");
    sel.exit().each(function(){
        setTimeout(function(me) {
            d3.select(me).remove();
        }, 200, this);
    }).transition().duration(200).ease("cubic-out").attr("r", "0px");

}

// Scale svg width to fit window.
function resize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    var svg = d3.select("#screen");
    var scale = svg.attr("scale");
    svg.attr("width", width).attr("height", height * scale);
}

function svgClicked() {
    var x, y;
    x = d3.event.x;
    y = d3.event.y;
    var rootSVG = d3.select("#screen")[0][0];
    var screenCTM = rootSVG.getScreenCTM().inverse();
    var point = rootSVG.createSVGPoint();
    point.x = x;
    point.y = y;
    var point2 = point.matrixTransform(screenCTM);
    createFishfood(point2.x, point2.y);
}

function initScreen() {
    var svg = d3.select("#screen");
    svg.attr("viewBox", "0 0 " + WIDTH + " " + HEIGHT);
    d3.select("#background").append("rect").attr("x", 0).attr("y", 0)
      .attr("width", WIDTH).attr("height", HEIGHT).on("click", svgClicked);
    // Sets markers. They are named color + Arrow.
    var colors = ["red", "yellow", "black"];
    var colordict = {
        "red":"red",
        "yellow":"#FFDD00",
        "black":"black"
    }
    d3.select("#markers").selectAll("marker")
      .data(colors).enter().append("marker")
      .attr("id",function(d){ return d + "Arrow"; })
      .attr("markerWidth",7).attr("markerHeight",7)
      .attr("refX",1).attr("refY",3).attr("orient","auto")
      .append("path").attr("d", "M1,1 L1,5 L5,3 L1,1").attr("fill",function(d){ return colordict[d];})
      .attr("markerUnits", "userSpaceOnUse");

    // Create boids.
    generate(BOID_NUM);
    resize();
}

// only handles strings.
function toBool(x) {
    if (x === "true") return true;
    return false;
}

function createOptionPanel() {
    initSlider = function(varname, sliderid, textid, min, max, step, ticks) {
        d3.select(sliderid).call(d3.slider()
        .axis(d3.svg.axis().orient("top").ticks(ticks))
        .min(min)
        .max(max)
        .step(step)
        .value(eval(varname))
        .on("slide", function(e, v) {
        d3.select(textid).text(v);
        eval(varname + " = +v");
        }));
        d3.select(textid).text(eval(varname));
    }

    // all slider settings
    initSlider("UPDATE_TICK", "#slider_update", "#text_update", 10, 1000, 10, 6);
    initSlider("LOGIC_TICK", "#slider_logic", "#text_logic", 0.1, 5.0, 0.1, 10);
    initSlider("ALIGNMENT_RADIUS", "#slider_alignmentRadius", "#text_alignmentRadius", 1, 12, 1, 10);
    initSlider("SEPARATION_RADIUS", "#slider_separationRadius", "#text_separationRadius", 1, 12, 1, 10);
    initSlider("SEPARATION_MAGIC", "#slider_separationMagic", "#text_separationMagic", 0.1, 2.0, 0.1, 6);
    initSlider("COHESION_RADIUS", "#slider_cohesionRadius", "#text_cohesionRadius", 1, 12, 1, 10);
    initSlider("COHESION_MAGIC_NUM", "#slider_cohesionStrength", "#text_cohesionStrength", 1, 10, 1, 10);
    initSlider("MAX_ACCELERATION", "#slider_maxacc", "#text_maxacc", 0.05, 2, 0.05, 5);
    initSlider("FOOD_RADIUS", "#slider_foodrad", "#text_foodrad", 0, 100, 1, 5);
    initSlider("EDGE_CURRENT_STRENGTH", "#slider_currstr", "#text_currstr", 0.05, 2, 0.05, 5);
    initSlider("SOFT_BOUNDARY_STRENGTH", "#slider_sftbndstr", "#text_sftbndstr", 0.05, 1, 0.05, 5);

    // Special setting for range slider.
    d3.select("#slider_speedclamp").call(d3.slider()
    .axis(d3.svg.axis().orient("top").ticks(5))
    .min(0.1)
    .max(2)
    .step(0.1)
    .value([MIN_SPEED, MAX_SPEED])
    .on("slide", function(e, v) {
        d3.select("#text_speedclamp").text(v);
        MIN_SPEED = +v[0];
        MAX_SPEED = +v[1];
    }));
    d3.select("#text_speedclamp").text([MIN_SPEED, MAX_SPEED]);
    d3.select("#clamp").on("click", resetSpeed);

    // checkbox settings
    var val = EDGE_CURRENT ? true : "";
    d3.select("#current_check").property("checked", val).on("click", function(){
        EDGE_CURRENT = d3.select(this).property("checked");
    });
    val = SOFT_MAX ? true : "";
    d3.select("#softacc_check").property("checked", val).on("click", function(){
        SOFT_MAX = d3.select(this).property("checked");
    });
    val = USE_SOFT_BOUNDARIES ? true : "";
    d3.select("#softbound_check").property("checked", val).on("click", function(){
        USE_SOFT_BOUNDARIES = d3.select(this).property("checked");
    });


    // The hide/show options button
    d3.select("#showOptions").on("click", function() {
        var me = d3.select(this);
        if (me.text() == "Show options") {
            me.text("Hide options");
            d3.select("#options").style("display", "");
            localStorage.setItem("optionsOpen", true)
        }
        else {
            me.text("Show options");
            d3.select("#options").style("display", "none");
            localStorage.setItem("optionsOpen", false);
        }
    });
    // to remember whether the option panel was open last time
    var optionsOpen = localStorage.getItem("optionsOpen");
    if (optionsOpen != null) {
        if (optionsOpen == "true") {
            d3.select("#showOptions").text("Hide options");
            d3.select("#options").style("display", "");
        } else {
            d3.select("#showOptions").text("Show options");
            d3.select("#options").style("display", "none");
        }
    }

}

function init() {
    initScreen();
    d3.select(window).on("resize", resize); // to set up autoresize
    createOptionPanel();
    update();
}