// Demo Interface vars
var bboxWidth = 800
var	bboxHeight = 600

var	bbox = {
	xl: 0,
	xr: this.bboxWidth,
	yt: 0,
	yb: this.bboxHeight
};

var NULL_TRIANGLE = -1
var LEFT_TRIANGLE = 0
var MIDDLE_TRIANGLE = 1
var RIGHT_TRIANGLE = 2

var triangleColors = {}
triangleColors[NULL_TRIANGLE] = "grey"
triangleColors[LEFT_TRIANGLE] = "red"
triangleColors[RIGHT_TRIANGLE] = "blue"
triangleColors[BOTTOM_TRIANGLE] = "green"


// Core vars
var pointLocation
var	svg
var cells = [
				[
					{"x": 0, "y" : 0},
					{"x": 0, "y" : 600},
					{"x": 400, "y" : 600}
				],
				[
					{"x": 0, "y" : 0},
					{"x": 400, "y" : 600}
					{"x": 800, "y" : 0},
				],
				[
					{"x": 800, "y" : 0},
					{"x": 400, "y" : 600},
					{"x": 800, "y" : 600}
				]
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
			this.compute({x: coordinates[0], y: coordinates[1]});
		});

		svg.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", window.bboxWidth)
		.attr("height", window.bboxHeight)	
		.style("stroke", "black")
		.style("fill", "none")
		.style("stroke-width", 0);

		pointLocation = new PointLocation()
	},

	compute : function(userPoint) {

		// Recompute the location and draw it
		location = this.computeLocation(userPoint, cells)
		this.drawUserPoint(location)
	},

	computeLocation : function(point, cells) {

		var areas = []

		for (var i = 0; i < cells.length; i++) {

			var areaVertices = []
			for (var j = 0; j < cellAttr.length; j++) {
				areaVertices.push({x: cellAttr[j][0], y: cellAttr[j][1]})
			}

			areas.push({id: this.indexOf(site, userPoints), points: areaVertices})
			this.drawEdges(areaVertices)
		}

		var conqueredPoints = []

		for (var i = 0; i < point.length; i++) {
			
			var conquerPoint = point[i]
			var siteId = pointLocation.getLocation(conquerPoint, areas, window.bbox)
			conqueredPoints.push({"siteId": siteId,"coordinates": conquerPoint})
		}

		return conqueredPoints
	},

	drawSites : function(userPoints) {

		for(var i = 0; i < userPoints.length; i++) {
			
			var site = userPoints[i]

			svg.append("circle")
			.attr("cx",site.x)
			.attr("cy",site.y)
			.attr("r", 4)
			.attr("fill", colors[i%2])
		}
	},

	drawUserPoint : function(points) {

		for(var i = 0; i < points.length; i++) {
			
			var point = points[i]

			var siteId = point.siteId
			var coord = point.coordinates

			var image;

			if (siteId == NULL_TRIANGLE) {
				image = triangleColors[NULL_TRIANGLE]
			} else {
				image = triangleColors[siteId % 2]
			}
			svg.append("svg:image")
			.attr("xlink:href", "images/conquer/" + image)
			.attr("x", coord.x-15)
			.attr("y", coord.y-15)
			.attr("width", "30")
			.attr("height", "30");
		}
	},

	drawEdges : function(points) {

		for(var i = 0; i < points.length; i++) {

			var point1 = points[i]
			var point2 = points[(i+1) % points.length]

				svg.append("line")
				.attr("x1", point1.x)
				.attr("y1", point1.y)
				.attr("x2", point2.x)
				.attr("y2", point2.y)
				.attr("stroke", "#ac00e6")
				.attr("stroke-width", 4)
		}
	},

	contains : function(array, coordinates) {

		var found = false;

		for(var i = 0; i < array.length && !found; i++) {

			var point = array[i]

			if (coordinates[0] == point.x && coordinates[1] == point.y) {
				found = true;
			}
		}

		return found;
	},

	indexOf : function(site1, userPoints) {

		var index = -1

		for (var i = 0; i < userPoints.length && index == -1; i++) {

			var site2 = userPoints[i]

			if (site1.x == site2.x && site1.y == site2.y) {
				index = i
			}
		}

		return index
	},

	orderCounterClockwise : function(center, points) {

		var pointsCpy = points.slice();
		var ordPoints = [];

		if (points.length > 0) {
			var point = pointsCpy.splice(0,1)[0]

 			// Push first point and take it as reference for the rest of the points
 			ordPoints.push(point)
 			var mainSegment = {va: center, vb: point}
	
 			while (pointsCpy.length > 0) {
	
 				point = pointsCpy[0]
	
 				var auxSegment = {va: center, vb: point}
	
 				var nextPointIndex = 0
	
 				for (var i = 1; i < pointsCpy.length; i++) {
	
 					var auxPoint = pointsCpy[i]
	
 					if (this.positionFromSegment(auxPoint,mainSegment) ==  -1
 						&&
 						this.positionFromSegment(auxPoint,auxSegment) ==  1) {
	
 						point = auxPoint
 						auxSegment.vb = point
 						nextPointIndex = i
 					}
 				}
	
 				ordPoints.push(pointsCpy.splice(nextPointIndex,1)[0])
 			}
 		}
 		
		return ordPoints;
},

	/* Given a point and a segment, determines in which side of the segment such point is located
	 *
	 * @param point : query point
	 * @param segment : query segment
	 *
	 *	@return	1 if the point is on the right side of the segment
	 *			0 if the point is on the segment
	 *  		-1 if the point is on the left side of the segment
	 */
	 positionFromSegment : function(point, segment) {

	 	var pa = segment.va
	 	var pb = segment.vb

	 	var determinant = (pb.x - pa.x) * (point.y - pa.y) - (pb.y - pa.y) * (point.x - pa.x)

	 	return Math.sign(determinant)
	 }
	}