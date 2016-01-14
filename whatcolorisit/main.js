document.addEventListener("DOMContentLoaded", init);


/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
/* Copied from http://stackoverflow.com/questions/2353211 */

function padStr(num, length) {
    var str = String(num);
    if (str.length == length)
        return str;
    var padding = length - str.length;
    while (padding > 0) {
        str = "0" + str;
        padding--;
    }
    return str;
}

// Turns three numbers into a hexcode!
function hexify(r, g, b) {
    var R = padStr(r.toString(16), 2);
    var G = padStr(g.toString(16), 2);
    var B = padStr(b.toString(16), 2);
    return "#" + R + G + B;
}

// if x < a, set x=a. If x > b, set x=b. Return x.
function limitRange(x, a, b) {
    if (x < a) {
        return a;
    } if (x > b) {
        return b;
    }
    return x;
}

function update(model) {
    var now = new Date();
    var hr = now.getHours();
    var min = now.getMinutes();
    var sec = now.getSeconds();
    var time = padStr(hr,2) + ":" + padStr(min,2) + ":" + padStr(sec,2)
    d3.select("#Time").text(time); // set the text to the proper time!

    if (model == "HSL") {
        var H = (hr*60 + min)/1440;        
        var S = 0.2 + min/60/2;
        var L = 0.5 + Math.sin(sec/30*Math.PI)/4;
        var rgb = hslToRgb(H, S, L);
        var hexcode = hexify(rgb[0], rgb[1], rgb[2]);

        // Write the hex code.
        d3.select("#Hexcode").text(hexcode.toUpperCase());

        // Transition the background.
        var rgb = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
        d3.select("body").transition().duration(900).style("background-color", rgb);

        // Set the text color.
        var textRGB = hslToRgb(15, 0.1, 0.9);
        var textHexcode = hexify(textRGB[0], textRGB[1], textRGB[2]);
        d3.selectAll("p").transition().duration(900).style("color", textHexcode)

        var Htext = "Color/Hue = " + Math.floor(H*360);
        var Stext = "Saturation = " + Math.floor(S*100) + "%";
        var Ltext = "Brightness = " + Math.floor(L*100) + "%";
        d3.select("#H").text(Htext);
        d3.select("#S").text(Stext);
        d3.select("#L").text(Ltext);
    }
    else { // fall back to RGB
        // Next find the background color.
        var R = parseInt(hr/24 * 256);
        var G = parseInt(min/60 * 256);
        var B = parseInt(sec/60 * 256);

        var hexcode = hexify(R,G,B);
        // Write the hex code.
        d3.select("#Hexcode").text(hexcode);

        // Transition the background color.
        var rgba = "rgba(" + R + "," + G + "," + B + "," + 0.7 + ")";
        d3.select("body").transition().duration(500).style("background-color", rgba);
    }
}

var resizables = ["#Time", "#HSL", "#Hexcode"];

// Scale text size to window.
function resize() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    var len = resizables.length;
    for (var i = 0; i < len; i++) {
        var me = d3.select(resizables[i]);
        var size = width/ me.attr("scale");
        me.property("SIZE", size); // Set this as a helper for other font-size-changing transitions.
        me.transition().ease("cubic-out").style("font-size", size);
    }
}

// Expands the HSL info, or collapses it.
function toggleHSL() {
    var HSL = d3.select("#HSL");
    if (HSL.style("display") == "none") {
        HSL.style("display", "block");
    } else {
        HSL.style("display", "none");
    }
}

// Does the same thing as toggleHSL, but fancier
function fancyToggleHSL() {
    var HSL = d3.select("#HSL");
    var duration = 400;
    if (HSL.style("display") == "none") {    
        var size = HSL.property("SIZE");
        HSL.style("font-size", "0").style("display", "block").
            transition().ease("cubic-out").duration(duration).style("font-size", size);
    } else {
        HSL.transition().ease("cubic-in").duration(duration).style("font-size", "0px");
        window.setTimeout(function(s){
            HSL.style("display", "none")
               .style("font-size", s);
        }, duration + 100, size);
    }
}

function init() {
    // call once to resize text, then autoresize.
    resize();
    d3.select(window).on("resize", resize);

    // Make the HSL text expandable
    d3.select("#Hexcode").on("click", fancyToggleHSL);

    var mode = "HSL"
    update(mode);
    window.setInterval(update, 1000, mode)
}