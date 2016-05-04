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
}