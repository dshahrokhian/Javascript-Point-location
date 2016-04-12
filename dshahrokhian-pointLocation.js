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
		nextUniqueId = -1; // Initialize to -1 since the first trapezoid represents the bbox, and not a real area
		degeneratePoints = [];

		var trapezoid = new Trapezoid();
		trapezoid.setSiteId(-1)
			.setLeftP({x : -1, y : -1})
			.setRightP({x : bbox.xr + 2, y : -1})
			.setLeftTopNeigh(null)
			.setLeftBottomNeigh(null)
			.setRightTopNeigh(null)
			.setRightBottomNeigh(null)

		D[trapezoid.id] = trapezoid
		S = new Leaf(trapezoid.id)

		for (area of areas) {
			addArea(area.id, area.points)
		}

		for (segment of mapSegments) {
			recomputeMap(segment, getIntersectedTrapezoids(segment));
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
	};

	/* Computes the location of the query point
	 *
	 * @parameter point : query point, with object format "{x,y}"
	 *
	 * @return the area identifier containing such point
	 */
	function locate(point) {

		var siteId;

		var node = S

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
	 * The code is divided in three sections:
	 * 
	 * - Section 1: first intersected trapezoid
	 * - Section 2: trapezoids in between
	 * - Section 3: last intersected trapezoid.
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

		if (falsePositive) {
		updateSandD(startTrap, a, segment)

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

	/* Updates tree S and D according to the new trapezoids that will substitute the old one
	 *
	 * @param oldTrap : Trapezoid to be replaced
	 * @param newTraps : new trapezoids that will replace the old one. The format of this array
	 * follows the intersection possibilites. This means that a[0] and/or a[3] may be null.
	 */
	function updateSandD(oldTrap, newTraps, segment) {

		for (trapezoid of newTraps) {
			if (trapezoid != null) {
				D[trapezoid.id] = trapezoid
			}
		}

		var pi = qi = null

		var si = new YNode(segment, new Leaf(newTraps[1].id), new Leaf(newTraps[2].id))

		if (newTraps[3] != null) {
			qi = new XNode(newTraps[3].leftp.x, si, new Leaf(newTraps[3].id))
		}

		if (newTraps[0] != null) {
			pi = new XNode(
				newTraps[0].rightp.x,
				new Leaf(newTraps[0].id),
				((qi != null) ? qi : si)
			)
		}

		if (pi != null) {
			substituteLeaf(oldTrap, pi)
		} else if (qi != null) {
			substituteLeaf(oldTrap, qi)
		} else {
			substituteLeaf(oldTrap, si)
		}

		updateNeighbors(oldTrap, newTraps)
		delete D[oldTrap.id]
	};

	/* Updates the neighbors of the old trapezoid taking into account the new ones
	 *
	 * @param oldTrap : old trapezoid which neighbors must be updates
	 * @param newTraps : new trapezoids to be referenced by the old trapezoid's neighbors
	 */
	function updateNeighbors(oldTrap, newTraps) {

		var newTrapsForLeftNeigh = {}

		if (newTraps[0] != null) {

			newTrapsForLeftNeigh.top = newTrapsForLeftNeigh.bottom = newTraps[0]

		} else {

			newTrapsForLeftNeigh.top = newTraps[1]
			newTrapsForLeftNeigh.bottom =  newTraps[2]

		}

		var newTrapsForRightNeigh = {}

		if (newTraps[3] != null) {

			newTrapsForRightNeigh.top = newTrapsForRightNeigh.bottom = newTraps[3]

		} else {

			newTrapsForRightNeigh.top = newTraps[1]
			newTrapsForRightNeigh.bottom =  newTraps[2]

		}

		updateLeftNeighbors(oldTrap, newTrapsForLeftNeigh)
		updateRightNeighbors(oldTrap, newTrapsForRightNeigh)
	};

	function updateLeftNeighbors(oldTrap, newTraps) {

		if (oldTrap.leftTopNeigh != null) {
			var oldLeftTopNeigh = D[oldTrap.leftTopNeigh]
			var oldLeftBottomNeigh = D[oldTrap.leftBottomNeigh]

			if (oldTrap.leftTopNeigh == oldTrap.leftBottomNeigh) {

				if (oldLeftTopNeigh.rightTopNeigh == oldTrap.id) {
					oldLeftTopNeigh.setRightTopNeigh(newTraps.top.id)
				}

				if (oldLeftTopNeigh.rightBottomNeigh == oldTrap.id) {
					oldLeftTopNeigh.setRightBottomNeigh(newTraps.bottom.id)
				}

			} else {

				if (oldLeftTopNeigh.rightp.y == oldTrap.leftp.y) {

					if (oldLeftTopNeigh.rightTopNeigh == oldTrap.id) {
						oldLeftTopNeigh.setRightTopNeigh(newTraps.top.id)
					}

					if (oldLeftTopNeigh.rightBottomNeigh == oldTrap.id) {
						oldLeftTopNeigh.setRightBottomNeigh(newTraps.top.id)
					}

					if (oldLeftBottomNeigh.rightTopNeigh == oldTrap.id) {
						oldLeftBottomNeigh.setRightTopNeigh(newTraps.bottom.id)
					}

					if (oldLeftBottomNeigh.rightBottomNeigh == oldTrap.id) {
						oldLeftBottomNeigh.setRightBottomNeigh(newTraps.bottom.id)
					}


					/* Extraordinaty case. Should not happen */
				} else if (oldLeftTopNeigh.rightp.y > oldTrap.leftp.y) {
					oldLeftTopNeigh.setRightTopNeigh(newTraps.top.id)
						.setRightBottomNeigh(newTraps.top.id)

					oldLeftBottomNeigh.setRightTopNeigh(newTraps.top.id)
						.setRightBottomNeigh(newTraps.bottom.id)

				} else {
					oldLeftTopNeigh.setRightTopNeigh(newTraps.top.id)
						.setRightBottomNeigh(newTraps.bottom.id)

					oldLeftBottomNeigh.setRightTopNeigh(newTraps.bottom.id)
						.setRightBottomNeigh(newTraps.bottom.id)

			}
		}
	}
	};

	function updateRightNeighbors(oldTrap, newTraps) {

		if (oldTrap.rightTopNeigh != null) {

			var oldRightTopNeigh = D[oldTrap.rightTopNeigh]
			var oldRightBottomNeigh = D[oldTrap.rightBottomNeigh]

			if (oldTrap.rightTopNeigh == oldTrap.rightBottomNeigh) {

				if (oldRightTopNeigh.leftTopNeigh == oldTrap.id) {
					oldRightTopNeigh.setLeftTopNeigh(newTraps.top.id)
				}

				if (oldRightTopNeigh.leftBottomNeigh == oldTrap.id) {
					oldRightTopNeigh.setLeftBottomNeigh(newTraps.bottom.id)
				}

			} else {

				if (oldRightTopNeigh.leftp.y == oldTrap.rightp.y) {

					if (oldRightTopNeigh.leftTopNeigh == oldTrap.id) {
						oldRightTopNeigh.setLeftTopNeigh(newTraps.top.id)
					}

					if (oldRightTopNeigh.leftBottomNeigh == oldTrap.id) {
						oldRightTopNeigh.setLeftBottomNeigh(newTraps.top.id)
					}

					if (oldRightBottomNeigh.leftTopNeigh == oldTrap.id) {
						oldRightBottomNeigh.setLeftTopNeigh(newTraps.bottom.id)
					}

					if (oldRightBottomNeigh.leftBottomNeigh == oldTrap.id) {
						oldRightBottomNeigh.setLeftBottomNeigh(newTraps.bottom.id)
					}

					/* Extraordinary case, it should not happen*/ 
				} else if (oldRightTopNeigh.leftp.y > oldTrap.rightp.y) {
					oldRightTopNeigh.setLeftTopNeigh(newTraps.top.id)
						.setLeftBottomNeigh(newTraps.top.id)

					oldRightBottomNeigh.setLeftTopNeigh(newTraps.top.id)
						.setLeftBottomNeigh(newTraps.bottom.id)

				} else {

					oldRightTopNeigh.setLeftTopNeigh(newTraps.top.id)
						.setLeftBottomNeigh(newTraps.bottom.id)

					oldRightBottomNeigh.setLeftTopNeigh(newTraps.bottom.id)
						.setLeftBottomNeigh(newTraps.bottom.id)
				}
		}
	}
};

	/* Given a point, it calculates in which trapezoid of the map it is located
	 *
	 * @parameter point query point, with object format "{x,y}"
	 *
	 * @return leaf node with the trapezoid in which the point is contained
	 */
	function getLeaf(trapezoid) {

		var node = S
		var point = trapezoid.leftp

		while(node.type != "leaf") {

			if (node.type == "x-node") {
				node = ((point.x < node.xVal) ? node.leftChild : node.rightChild);
			} else if (node.type == "y-node") {

				var pos = positionFromSegment(point, node.segment)

				switch(pos) {
					case 1:
						node = node.topChild;
						break;
					case 0:
						node = ((node.topChild.trapezoid == trapezoid.id) ? node.topchild : node.bottomChild)
						break;
					case -1:
						node = node.bottomChild;
				}
			}
		}

		return node;
	};

	function substituteLeaf(trapezoid, newNode) {

		var node = S

		if(node.type == "leaf") { /*Case with only one trapezoid on the map*/
			
			S = newNode

		} else {

			var nextNode = node;

			while(node.type != "leaf") {

				if (node.type == "x-node") {

					if (trapezoid.leftp.x < node.xVal) {

						nextNode = node.leftChild

						if (nextNode.type == "leaf") {

							if(nextNode.trapezoid === trapezoid.id) {
								node.leftChild = newNode
							} else {
								alert("error in search 1")
							}
						}

					} else {

						nextNode = node.rightChild

						if (nextNode.type == "leaf") {
							if(nextNode.trapezoid === trapezoid.id) {
							node.rightChild = newNode
						} else {
							alert("error in search 2")
						}
						}
					}

				} else if (node.type == "y-node") {

					var pos = positionFromSegment(trapezoid.leftp, node.segment)

					switch(pos) {
						case 1:
							nextNode = node.topChild;
							if (nextNode.type == "leaf") {
								if(nextNode.trapezoid === trapezoid.id) {
								node.topChild = newNode
							} else {
								alert("error in search 3")
							}
							}
							break;

						case 0:
							if (node.topChild.trapezoid === trapezoid.id) {

								nextNode = node.topChild

								if (nextNode.type == "leaf") {
									if(nextNode.trapezoid === trapezoid.id) {
									node.topChild = newNode
								} else {
									alert("error in search 4")
								}
								}

							} else if (node.bottomChild.trapezoid === trapezoid.id) {

								nextNode = node.bottomChild

								if (nextNode.type == "leaf") {
									if(nextNode.trapezoid === trapezoid.id) {
									node.bottomChild = newNode
								} else {
									alert("error in search 5")
								}
								}

							} else {

								pos = positionFromSegment(trapezoid.rightp, node.segment)

								switch(pos) {
									case 1:
										nextNode = node.topChild;
										if (nextNode.type == "leaf") {
											if(nextNode.trapezoid === trapezoid.id) {
											node.topChild = newNode
										} else {
											alert("error in search 6")
										}
										}
										break;

									case 0:
										console.log("sigue estando en la linea")
										if (node.topChild.trapezoid === trapezoid.id) {

											nextNode = node.topChild

											if (nextNode.type == "leaf") {
												if(nextNode.trapezoid === trapezoid.id) {
												node.topChild = newNode
											} else {
												alert("error in search 7")
											}
											}

										} else if (node.bottomChild.trapezoid === trapezoid.id) {

											nextNode = node.bottomChild

											if (nextNode.type == "leaf") {
												if(nextNode.trapezoid === trapezoid.id) {
												node.bottomChild = newNode
											} else {
												alert("error in search 8")
											}
											}
										}
										break;

									case -1:
										nextNode = node.bottomChild;
										if (nextNode.type == "leaf") {
											if(nextNode.trapezoid === trapezoid.id) {
											node.bottomChild = newNode
										} else {
											alert("error in search 9")
										}
										}

								}

							}
							break;

						case -1:
							nextNode = node.bottomChild;
							if (nextNode.type == "leaf") {
								if(nextNode.trapezoid === trapezoid.id) {
								node.bottomChild = newNode
							} else {
								alert("error in search 10")
							}
							}
					}
				}
				node = nextNode
			}
		}
	};

	/* @return the identifiers of the trapezoids which the segment intersects */
	function getIntersectedTrapezoids(segment) {

		var trapezoids = []

		var nodeA = S

		while (nodeA.type != "leaf") {

			var nextNode = getNextNode(segment.va, nodeA);

			/* If the first point of the segment was in the line, we use the second instead. If the map
			 * was given properly, this could only happen between segments sharing an end-point. We use the
			 * second point since it allows us to know in which direction the segment is going, and selecting
			 * the proper next trapezoid according to this direction.
			 */
			if (nextNode.trapezoid === -1) {
				nodeA = getNextNode(segment.vb, nodeA)
			} else {
				nodeA = nextNode;
			}
		}

		trapezoids.push(nodeA.trapezoid)

		var currentTrapId = nodeA.trapezoid
		var currentTrap = D[currentTrapId]

		while(segment.vb.x > currentTrap.rightp.x) {

			var position = positionFromSegment(currentTrap.rightp, segment)

			if (position === 1) {
				currentTrapId = currentTrap.rightBottomNeigh
			} else if (position === -1) {
				currentTrapId = currentTrap.rightTopNeigh
			} else if (position == 0) {
				alert("on the line") // Delete this after release
			}

			trapezoids.push(currentTrapId)
			currentTrap = D[currentTrapId]
		}

		return trapezoids;
	};

	/* @return the next node in S according to the point and current node provided */
	function getNextNode(point, currentNode) {

		var nextNode = currentNode;

		if (currentNode.type == "x-node") {
			nextNode = ((point.x < currentNode.xVal) ? currentNode.leftChild : currentNode.rightChild);
		} else if (currentNode.type == "y-node") {

			var pos = positionFromSegment(point, currentNode.segment)

			switch(pos) {
				case 1:
					nextNode = currentNode.topChild;
					break;
				case 0:
					nextNode = new Leaf(-1);
					break;
				case -1:
					nextNode = currentNode.bottomChild;
			}
		}

		return nextNode;
	};

	/* Processes the segments represented by the points of the polygon. If some of these segments are 
	 * already present in mapSegments, they are modified online.
	 *
	 * @parameter id : identifier of the polygon
	 * @parameter points : points defining the polygon, in counterclockwise order
	 *
	 * @return new segments non-present in mapSegments
	 */
	function processSegments(id, points) {

		var newSegments = []

		for (var i = 0; i < points.length; i++) {

			var segment = new Segment()
			segment.setVa(points[i])
				   .setVb(points[(i+1) % points.length]) // In order to conect to the next point. If the 'i' point is the last one, it is connected to the first point (i=0)

			if (pointContainedIn(segment.va, degeneratePoints)) {
				segment.setVa(segment.va + 1)
			}

			if (pointContainedIn(segment.vb, degeneratePoints)) {
				segment.setVb(segment.vb + 1)
			}

			segment = fix(id, segment)

			if (segment.isDegenerate()) {
				degeneratePoints.push({x: segment.vb.x - 1, y: segment.vb.y})
			}

			if (!segment.containedIn(mapSegments)) {
				newSegments.push(segment)
			}

		}

		return newSegments
	};

	/* Fixes the given segments, according to the following rules:
	 * 1. x-value of segment.va must be lower than segment.vb, so the segments always point to the right
	 * 2. if the segment is not present in mapSegments, then it must be created and its left-site is associated
	 *		to the site of polygon being analyzed
	 * 3. if the segment is present in mapSegments, its right-site is associated to the site of the polygon being
	 *		analyzed
	 *
	 * @return fixed segment
	 */
	function fix(id, segment) {

		if (segment.containedIn(mapSegments)) {

			var index = segment.getIndex(mapSegments)
			segment = mapSegments[index]

			// If the segment is already in the map (and the points were correctly provided by the user)
			// then one of its sites has not been set (== null)
			if (segment.leftSiteId == null) {
				segment.setLeftSiteId(id)
			} else {
				segment.setRightSiteId(id)
			}

		} else {

			segment.setLeftSiteId(id)

			if (segment.va.x > segment.vb.x) { 

				segment = invert(segment)

			} else if (segment.va.x == segment.vb.x) { // Degenerate case of vertical segments

				segment.vb.x++
				segment.setDegenerate(true)

			}
		}

		return segment
	};

	/* Given a segment, determines the inverse of it:
	 * - starting point <-> ending point
	 * - left side <-> right side
	 *
	 * @return inversse of the segment
	 */
	function invert(segment) {

		var tempPoint = {x: segment.va.x, y: segment.va.y}
		var tempSite = segment.leftSiteId

		return segment.setVa(segment.vb)
			.setVb(tempPoint)
			.setLeftSiteId(segment.rightSiteId)
			.setRightSiteId(tempSite)
	};

	/* Given a point and a segment, determines in which side of the segment such point is located
	 *
	 * @param point : query point
	 * @param segment : query segment
	 *
	 * @return 1 if the point is on the right side of the segment
	 *		   0 if the point is on the segment
	 *  	   -1 if the point is on the left side of the segment
	 */
	function positionFromSegment(point, segment) {

		var pa = segment.va
		var pb = segment.vb

		var determinant = (pb.x - pa.x) * (point.y - pa.y) - (pb.y - pa.y) * (point.x - pa.x)

		return Math.sign(determinant)
	};

	/* Given a segment and a vertical line, calculates the point in which they intersect
	 *
	 * @param segment
	 * @param xVal : 'x' coordinate of the vertical line
	 *
	 * @return the point from the intersection of the segment with the vertical line
	 */
	function getIntersection(segment, xVal) {

		var slope = (segment.vb.y - segment.va.y) / (segment.vb.x - segment.va.x)

		/* We use the line formula y = mx + b  to get the value b */
		var b = segment.va.y - slope * segment.va.x

		return {x: xVal, y: (slope * xVal + b) }
	};

	/* @return true if the given point is inside the array; false otherwise */
	function pointContainedIn(point1, array) {

		for (point2 of array) {

			if (point1.x === point2.x && point1.y === point2.y) {
				return true
			}
		}

		return false
	}
}