// Demo Interface vars
var bboxWidth = 800
var	bboxHeight = 600

var	bbox = {
	xl: 0,
	xr: this.bboxWidth,
	yt: 0,
	yb: this.bboxHeight
};

// The Identifiers of the three triangles that can be seen in the interface
var NULL_TRIANGLE = -1
var LEFT_TRIANGLE = 0
var MIDDLE_TRIANGLE = 1
var RIGHT_TRIANGLE = 2

// The colots for the user points located in each triangle
var triangleColors = {}
triangleColors[NULL_TRIANGLE] = "grey"
triangleColors[LEFT_TRIANGLE] = "red"
triangleColors[RIGHT_TRIANGLE] = "blue"
triangleColors[MIDDLE_TRIANGLE] = "green"


// Core vars
var pointLocation
var	svg
var cells = [
				{
					id : LEFT_TRIANGLE,
					points : [
						{"x": 0, "y" : 0},
						{"x": 0, "y" : 600},
						{"x": 400, "y" : 600}
					]
				},
				{
					id : RIGHT_TRIANGLE,
					points : [	
						{"x": 800, "y" : 0},
						{"x": 400, "y" : 600},
						{"x": 800, "y" : 600}
					]
				},
				{	
					id : MIDDLE_TRIANGLE,
					points : [
						{"x": 0, "y" : 0},
						{"x": 400, "y" : 600},
						{"x": 800, "y" : 0}
					]
				}	
			]

var Demo = {

	init : function() {

		// Demo box
		svg = d3.select("#content")
		.append("svg")
		.attr("width", window.bboxWidth)
		.attr("height", window.bboxHeight)
		.attr("style", "cursor:crosshair; margin:0 auto;")
		.attr("border", 0)
		.on("click", function() {

			var coordinates = d3.mouse(this)
			Demo.drawLocation({x: coordinates[0], y: coordinates[1]});
		});

		svg.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", window.bboxWidth)
		.attr("height", window.bboxHeight)	
		.style("stroke", "black")
		.style("fill", "none")
		.style("stroke-width", 1);

		this.drawEdges(cells)

		pointLocation = new PointLocation()
	},

	/* Computes and draws the location of the point */
	drawLocation : function(userPoint) {

		locationId = pointLocation.getLocation(userPoint, cells, window.bbox)
		this.drawUserPoint(userPoint, triangleColors[locationId])
	},

	drawUserPoint : function(userPoint, color) {

		svg.append("circle")
			.attr("cx",userPoint.x)
			.attr("cy",userPoint.y)
			.attr("r", 4)
			.attr("fill",color)
	},

	drawEdges : function(cells) {

		for (cell of cells) {

			points = cell.points	
			
			for (var i = 0; i < points.length; i++) {

				var point1 = points[i]
				var point2 = points[(i+1) % points.length]

				svg.append("line")
				.attr("x1", point1.x)
				.attr("y1", point1.y)
				.attr("x2", point2.x)
				.attr("y2", point2.y)
				.attr("stroke", window.triangleColors[cell.id])
				.attr("stroke-width", 3)
			}
		}
	}
}