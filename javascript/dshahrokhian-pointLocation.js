/*!
 Copyright (C) 2015-2016 Daniyal Shahrokhian: https://github.com/dshahrokhian
 */

/*
 Author: Daniyal Shahrokhian (dani.shahrokhian@gmail.com)
 File: dshahrokhian-pointLocation.js
 Version: TBA
 Date: TBA
 Description: This is my personal Javascript implementation of Trapezoidal Map point location algorithm.
 For further information, refer to "Chapter 6. Point Location" from the book Computational Geometry by Mark de Berg.
 */

var PointLocation;

/* ## Usage: var bbox = {
 *		  		xl: {initial x value, e.g. 0},
 *		  		xr: {bounding box's width},
 *		  		yt: {initial y value, e.g. 0},
 *		  		yb: {bounding box's height}
 *		  	 };
 *
 *			 var areas;
 *
 *			 var area1 = {id: -identifier that you want to assign to this area-, points: -a set of point objects {x,y}
 *							that define the polygon of the area, with the points ordered counterclockwise-}
 *			 var area2 = {id: 2, ...}
 }
 *			 areas.push(area1)			 
 *			 areas.push(area2)			 
 *
 *		  	 var pl = new PointLocation()
 *
 *			 // returns 2
 *		  	 var sideID = pl.getLocation(-some point inside area 2-, areas, bbox)
 *
 *		  	 // returns -1
 *			 var siteID = pl.getLocation(-some point on the boundaries of the areas-})
 *
 *			 // returns -1
 *			 var siteID = pl.getLocation(-some point outside all given areas-})
 *
 */
PointLocation = function() {

	var S;
	var D;
	var mapSegments;
	var nextUniqueId;
	var degeneratePoints;

	var Node = function(type) {
		this.type = type
	};

	var XNode = function(xVal, leftChild, rightChild) {
		Node.call(this, "x-node")
		this.xVal = xVal
		this.leftChild = leftChild
		this.rightChild = rightChild
	};

	var YNode = function(segment, topChild, bottomChild) {
		Node.call(this, "y-node")
		this.segment = segment
		this.topChild = topChild
		this.bottomChild = bottomChild
	};

	var Leaf = function(trapId) {
		Node.call(this, "leaf")
		this.trapezoid = trapId
	};

	var Trapezoid = function() {

		this.id = nextUniqueId++

		this.setSiteId = function(id) {
			this.siteId = id
			return this
		};

		this.setLeftTopNeigh = function(trapId) {
			this.leftTopNeigh = trapId
			return this
		}; this.setLeftBottomNeigh = function(trapId) {
			this.leftBottomNeigh = trapId
			return this
		}; this.setRightTopNeigh = function(trapId) {
			this.rightTopNeigh = trapId
			return this
		}; this.setRightBottomNeigh = function(trapId) {
			this.rightBottomNeigh = trapId
			return this
		};

		this.setLeftP = function(point) {
			this.leftp = point
			return this
		}; this.setRightP = function(point) {
			this.rightp = point
			return this
		}
	};

	var Segment = function() {

		this.degenerate = false
		this.leftSiteId = null
		this.rightSiteId = null

		this.setVa = function(point) {
			this.va = point
			return this
		}; this.setVb = function(point) {
			this.vb = point
			return this
		};

		this.setLeftSiteId = function(id) {
			this.leftSiteId = id
			return this
		}; this.setRightSiteId = function(id) {
			this.rightSiteId = id
			return this
		};

		this.setDegenerate = function(isDegenerate) {
			this.degenerate = isDegenerate
			return this
		}; this.isDegenerate = function() {
			return this.degenerate
		};

		this.containedIn = function(array) {

			for (segment of array) {

				if (this.equals(segment)) {
					return true
				}
			}

			return false
		};

		this.getIndex = function(array) {

			index = -1;

			for (var i = 0; (i < array.length) && (index == -1); i++) {

				if (this.equals(array[i])) {
					index = i
				}
			}

			return index;
		};

		this.equals = function(segment) {

			var thisRealX = ((this.isDegenerate()) ? this.vb.x - 1 : this.vb.x)
			var segmentRealX = ((segment.isDegenerate()) ? segment.vb.x - 1 : segment.vb.x)

			if (this.va.x == segment.va.x && thisRealX == segmentRealX
				&& this.va.y == segment.va.y && this.vb.y == segment.vb.y) {
				return true
			} else if (this.va.x == segmentRealX && thisRealX == segment.va.x
				&& this.va.y == segment.vb.y && this.vb.y == segment.va.y) {
				return true
			} else {
				return false
			}
		}
	};

	this.getLocation = function(point, areas, bbox) {

		S = {};
		D = {};
		mapSegments = [];
		nextUniqueId = -1;
		degeneratePoints = [];
		
		var trapezoid = new Trapezoid();
		trapezoid.setSiteId(-1)
			.setLeftP({x : -1, y: -1})
			.setRightP({x : bbox.xr + 2, y: -1})
			.setLeftTopNeigh(null)
			.setLeftBottomNeigh(null)
			.setRightTopNeigh(null)
			.setRightBottomNeigh(null)

		D[trapezoid.id] = trapezoid
		S = new Leaf(trapezoid.id)

		for (area of areas) {
			addArea(area.id, area.points)
		}

		return locate(point)
	};

	/* Adds a new area to the algorithm
	 *
	 * @parameter id : identifier of the area, to be returned everytime a query point is contained inside it
	 * @parameter points : the set of points that define the area. Each point must have the object format of
	 * 						"{x,y}" and must be ordered counterclockwise
	 */
	function addArea(id, points) {

		var newSegments = processSegments(id, points)
		mapSegments = mapSegments.concat(newSegments)

		var normSegments = []
		for (var i = 0; i < points.length; i++) {

			var segment = new Segment()
			segment.setVa(points[i])
				   .setVb(points[(i+1) % points.length]) 
			normSegments.push(segment)
		}
	};

	/* Computes the location of the query point
	 *
	 * @parameter point : query point, with object format "{x,y}"
	 *
	 * @return the area identifier containing such point
	 */
	function locate(point) {

		var node = S

		var siteId;

		while(node.type != "leaf") {
			node = getNextNode(point, node)
		}

		if (node.trapezoid == -1) { // If the point lies in the boundary of two different areas
			siteId = -1
		} else {
			siteId = D[node.trapezoid].siteId
		}

		return siteId
	};

	/* Given a new segment on the map, it recomputes D and S.
	 * For each intersected trapezoid, it replaces it by 2 to 4 new ones.
	 *
	 * The code is divided in three sections: One for the first intersected trapezoid, another
	 *	for the trapezoids in between, and a last one for the last intersected trapezoid.
	 *
	 * If the segment intersects only one trapezoid, it can have the following format, being a[0]
	 * and a[3] optional depending whenever the new segments shares one or both end-points with
	 * the trapezoid it intersects:
	 *
	 * _____________________
	 * |      | a[1] |      |  *Note: "------" is the segment
	 * | a[0] |------| a[3] |
	 * |      | a[2] |      |
	 * |______|______|______|
	 *
	 * If there are more intersected trapezoids, a[1] and a[2] are repeated once for every inner-trapezoid
	 *
	 * @param segment : new segment to be computed for the map
	 * @param interTraps : trapezoids in the current map that are intersected by such segment
	 */
	function recomputeMap(segment, interTraps) {

		// Section 1
		var startTrap = D[interTraps[0]]
		var a = [null, null, null, null]

		a[1] = new Trapezoid()
		a[1].setSiteId(segment.leftSiteId)
			.setLeftP(segment.va)
			.setRightP(getIntersection(segment, startTrap.rightp.x))
			.setLeftTopNeigh(startTrap.leftTopNeigh)
			.setLeftBottomNeigh(startTrap.leftTopNeigh)
			.setRightTopNeigh(startTrap.rightTopNeigh)
			.setRightBottomNeigh(startTrap.rightTopNeigh)

		a[2] = new Trapezoid()
		a[2].setSiteId(segment.rightSiteId)
			.setLeftP(segment.va)
			.setRightP(getIntersection(segment, startTrap.rightp.x))
			.setLeftTopNeigh(startTrap.leftBottomNeigh)
			.setLeftBottomNeigh(startTrap.leftBottomNeigh)
			.setRightTopNeigh(startTrap.rightBottomNeigh)
			.setRightBottomNeigh(startTrap.rightBottomNeigh)

		if (segment.va.x > startTrap.leftp.x) {

			a[0] = new Trapezoid()
			a[0].setLeftP(startTrap.leftp)
				.setRightP(segment.va)
				.setLeftTopNeigh(startTrap.leftTopNeigh)
				.setLeftBottomNeigh(startTrap.leftBottomNeigh)
				.setRightTopNeigh(a[1].id)
				.setRightBottomNeigh(a[2].id)

			a[1].setLeftTopNeigh(a[0].id)
				.setLeftBottomNeigh(a[0].id)

			a[2].setLeftTopNeigh(a[0].id)
				.setLeftBottomNeigh(a[0].id)
		}

		if (segment.vb.x < startTrap.rightp.x) {

			a[3] = new Trapezoid()
			a[3].setLeftP(segment.vb)
				.setRightP(startTrap.rightp)
				.setRightTopNeigh(startTrap.rightTopNeigh)
				.setRightBottomNeigh(startTrap.rightBottomNeigh)
				.setLeftTopNeigh(a[1].id)
				.setLeftBottomNeigh(a[2].id)

			a[1].setRightP(segment.vb)
				.setRightTopNeigh(a[3].id)
				.setRightBottomNeigh(a[3].id)

			a[2].setRightP(segment.vb)
				.setRightTopNeigh(a[3].id)
				.setRightBottomNeigh(a[3].id)
		}

		if (interTraps.length > 1) {

			// Section 2

			// Save these values since they will be needed after overwritting them
			var prevTrapTop = a[1]
			var prevTrapBottom = a[2]

			a[0] = a[3] = null // Restart these values, since they will not occur in inner-trapezoids
			for(var i = 1; i < interTraps.length - 1; i++) {

				var innerTrap = D[interTraps[i]]

				a[1] = new Trapezoid()
				a[1].setSiteId(segment.leftSiteId)
					.setLeftP(getIntersection(segment, innerTrap.leftp.x))
					.setRightP(getIntersection(segment, innerTrap.rightp.x))
					.setLeftTopNeigh(prevTrapTop.id)
					.setLeftBottomNeigh(prevTrapTop.id)
					.setRightTopNeigh(innerTrap.rightTopNeigh)
					.setRightBottomNeigh(innerTrap.rightTopNeigh)

				a[2] = new Trapezoid()
				a[2].setSiteId(segment.rightSiteId)
					.setLeftP(getIntersection(segment, innerTrap.leftp.x))
					.setRightP(getIntersection(segment, innerTrap.rightp.x))
					.setLeftTopNeigh(prevTrapBottom.id)
					.setLeftBottomNeigh(prevTrapBottom.id)
					.setRightTopNeigh(innerTrap.rightBottomNeigh)
					.setRightBottomNeigh(innerTrap.rightBottomNeigh)

				// Modify previously analyzed trapezoids with these new ones
				prevTrapTop.setRightTopNeigh(a[1].id)
						   .setRightBottomNeigh(a[1].id)

				prevTrapBottom.setRightTopNeigh(a[2].id)
					.setRightBottomNeigh(a[2].id)

				// Refresh values for the next trapezoid
				prevTrapTop = a[1]
				prevTrapBottom = a[2]

				updateSandD(innerTrap, a, segment)
			}

			// Section 3
			var endTrap = D[interTraps[interTraps.length-1]]

			a[0] = a[3] = null

			a[1] = new Trapezoid()
			a[1].setSiteId(segment.leftSiteId)
				.setLeftP(getIntersection(segment, endTrap.leftp.x))
				.setRightP(segment.vb)
				.setLeftTopNeigh(prevTrapTop.id)
				.setLeftBottomNeigh(prevTrapTop.id)
				.setRightTopNeigh(endTrap.rightTopNeigh)
				.setRightBottomNeigh(endTrap.rightTopNeigh)

			a[2] = new Trapezoid()
			a[2].setSiteId(segment.rightSiteId)
				.setLeftP(getIntersection(segment, endTrap.leftp.x))
				.setRightP(segment.vb)
				.setLeftTopNeigh(prevTrapBottom.id)
				.setLeftBottomNeigh(prevTrapBottom.id)
				.setRightTopNeigh(endTrap.rightBottomNeigh)
				.setRightBottomNeigh(endTrap.rightBottomNeigh)

			// Modify previously analyzed trapezoids with these new ones
			prevTrapTop.setRightTopNeigh(a[1].id)
				.setRightBottomNeigh(a[1].id)

			prevTrapBottom.setRightTopNeigh(a[2].id)
				.setRightBottomNeigh(a[2].id)

			if (segment.vb.x < endTrap.rightp.x) {

				a[3] = new Trapezoid()
				a[3].setLeftP(segment.vb)
					.setRightP(endTrap.rightp)
					.setRightTopNeigh(endTrap.rightTopNeigh)
					.setRightBottomNeigh(endTrap.rightBottomNeigh)
					.setLeftTopNeigh(a[1].id)
					.setLeftBottomNeigh(a[2].id)

				a[1].setRightTopNeigh(a[3].id)
					.setRightBottomNeigh(a[3].id)

				a[2].setRightTopNeigh(a[3].id)
					.setRightBottomNeigh(a[3].id)
			}

			updateSandD(endTrap, a, segment)
		}
	}
};