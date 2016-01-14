document.addEventListener("DOMContentLoaded", init);

var xy = [0,0];
var qstrs;

// Function from http://stackoverflow.com/questions/2907482/how-to-get-the-query-string-by-javascript by Josh Stodola
function getQueryStrings() { 
  var assoc  = {};
  var decode = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); };
  var queryString = location.search.substring(1); 
  var keyValues = queryString.split('&'); 

  for(var i in keyValues) { 
    var key = keyValues[i].split('=');
    if (key.length > 1) {
      assoc[decode(key[0])] = decode(key[1]);
    }
  } 

  return assoc; 
}

function init() {
	qstrs = getQueryStrings();
	if (qstrs["chr"].length == 1)
		qstrs["chr"] = "0" + qstrs["chr"];
	d3.select("#header").append("h1").text("Chromosome " + qstrs["chr"])
	d3.select("#img").append("img").attr("id", "image")
	  .attr("src", "output/chr" + qstrs["chr"] + ".png").attr("alt", "chr" + qstrs["chr"])
	  .on("click", updateCoords);
    d3.select("#submit").on("click", lookup);
}

function updateCoords() {
	xy = d3.mouse(this);
	d3.select("#x").attr("value", Math.floor(xy[0]));
	d3.select("#y").attr("value", Math.floor(xy[1]));
}

function lookup() {
	var form = this.form;
	if (form.L.value > 10000 || form.L.value < 1)
		return;
	// Else, actually do the lookup.
	var n = parseInt(d3.select("#image")[0][0].naturalWidth);
	console.log(n);
	//n *= n;
	var x = parseInt(form.x.value);
	var y = parseInt(form.y.value);
	var position = xy2d(n, y, x);
	console.log(x, y, n, position);
	// times fifty because 1 pixel is 50 bp in my situation.
	var url = "../../../dna/" + qstrs["chr"] + "/"  + position * 50 + "/" + form.L.value;
	d3.text(url, function(error, text) {
		d3.select("#results").text(text);
	});
}


/// Functions to get the "d" position from an xy position in the image.
/// Obtained from the Wikipedia page.
function rot(n, x, y, rx, ry) {
	if (ry == 0) {
		if (rx == 1) {
			x = n-1 - x
			y = n-1 - y			
		}
		return [y, x];
	}
	return [x, y];
}
            //v total number of cells.
function xy2d(n, x, y) {
	var rx,ry,s,d;
	rx = ry = d = 0;
	for (s = n/2; s > 0; s /= 2) {
		rx = (x & s) > 0;
		ry = (y & s) > 0;
		rx = rx ? 1 : 0;
		ry = ry ? 1 : 0;
		d += s * s * ((3 * rx) ^ ry);
		var temp = rot(s, x, y, rx, ry);
		x = temp[0];
		y = temp[1];
	}
	return d;
}