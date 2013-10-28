window.addEventListener("load", function() {
	RadialGradientTool.init();
});

var RadialGradientTool = (function RadialGradientTool() {
	'use strict';

	var radian = 180 / Math.PI;
	var inv_radian = Math.PI / 180;
	var units = {'%': 1, 'px' : 0};

	/*========== DOM Methods ==========*/

	function getElemById(id) {
		return document.getElementById(id);
	}

	function allowDropEvent(e) {
		e.preventDefault();
	}

	function createClassElement(tag, className, parent) {
		var elem = document.createElement(tag);
		elem.className = className;
		if (parent) parent.appendChild(elem);
		return elem;
	};

	function trackMouse(elem, callback, startFunc, endFunc) {
		startFunc = startFunc || function(e) {};
		endFunc = endFunc || function(e) {};

		elem.addEventListener('mousedown', function(e) {
			e.preventDefault();
			startFunc(e);

			document.addEventListener('mousemove', callback);

			document.addEventListener('mouseup', function up(e) {
				document.removeEventListener('mousemove', callback);
				document.removeEventListener('mouseup', up);
				endFunc(e);
			});
		});

		elem.addEventListener('click', function(e) {
			e.stopPropagation();
		});
	}

	var Color = UIColorPicker.Color;
	var HSVColor = UIColorPicker.HSVColor;

	var UIComponent = (function UIComponent() {

		function makeResizable(elem, axis, callback, endFunc) {
			var valueX = 0;
			var valueY = 0;
			var action = 0;
			var callback = typeof callback === "function" ? callback : null;

			endFunc = endFunc || function(e) {};

			var resizeStart = function resizeStart(e) {
				e.stopPropagation();
				e.preventDefault();
				if (e.button !== 0)
					return;

				valueX = e.clientX - elem.clientWidth;
				valueY = e.clientY - elem.clientHeight;

				document.body.setAttribute('data-resize', axis);
				document.addEventListener('mousemove', mouseMove);
				document.addEventListener('mouseup', resizeEnd);
			};

			var mouseMove = function mouseMove(e) {
				if (action >= 0)
					elem.style.width = e.clientX - valueX + 'px';
				if (action <= 0)
					elem.style.height = e.clientY - valueY + 'px';
				if (callback)
					callback();
			};

			var resizeEnd = function resizeEnd(e) {
				if (e.button !== 0)
					return;

				document.body.removeAttribute('data-resize', axis);
				document.removeEventListener('mousemove', mouseMove);
				document.removeEventListener('mouseup', resizeEnd);
				endFunc();
			};

			var handle = document.createElement('div');
			handle.className = 'resize-handle';

			if (axis === 'width') action = 1;
			else if (axis === 'height') action = -1;
			else axis = 'both';

			handle.className = 'resize-handle';
			handle.setAttribute('data-resize', axis);
			handle.addEventListener('mousedown', resizeStart);
			elem.appendChild(handle);
		};

		/*========== Make an element draggable relative to it's parent ==========*/

		var makeDraggable = function makeDraggable(elem, endFunction) {

			var offsetTop;
			var offsetLeft;

			elem.setAttribute('data-draggable', 'true');

			var dragStart = function dragStart(e) {
				e.preventDefault();
				e.stopPropagation();

				if (e.target.getAttribute('data-draggable') !== 'true' ||
					e.target !== elem || e.button !== 0)
					return;

				offsetLeft = e.clientX - elem.offsetLeft;
				offsetTop = e.clientY - elem.offsetTop;

				document.addEventListener('mousemove', mouseDrag);
				document.addEventListener('mouseup', dragEnd);
			};

			var dragEnd = function dragEnd(e) {
				if (e.button !== 0)
					return;

				document.removeEventListener('mousemove', mouseDrag);
				document.removeEventListener('mouseup', dragEnd);
			};

			var mouseDrag = function mouseDrag(e) {
				elem.style.left = e.clientX - offsetLeft + 'px';
				elem.style.top = e.clientY - offsetTop + 'px';
				console.log(e.clientX - offsetLeft, e.clientY - offsetTop);
			};

			elem.addEventListener('mousedown', dragStart, false);
		};

		return {
			makeResizable : makeResizable,
			makeDraggable : makeDraggable
		};
	})();


	/**
	 * Gradient Point
	 */
	var GradientPoint = function GradientPoint(Axis) {
		var point = document.createElement('div');

		point.className = 'gradient-point';

		this.position = 0;
		this.node = point;
		this.shape = Axis;
		this.color = new HSVColor(0, 0, 100);
		this.CSScolor = this.color.getColor();
		this.CSSposition = 0;
		this.PrevPoint = null;
		this.NextPoint = null;

		this.shape.num_points++;

		point.addEventListener('click', this.activate.bind(this));
		trackMouse(point, this.updatePositionM.bind(this), this.startMove.bind(this),
			this.endMove.bind(this));

		Axis.line.appendChild(point);
		return this;
	};

	GradientPoint.prototype.deletePoint = function deletePoint() {
		this.shape.line.removeChild(this.node);
	};

	GradientPoint.prototype.activate = function activate() {
		if (this.shape.state === false)
			return;

		this.shape.setActivePoint(this);
		this.node.setAttribute('data-active', 'true');
		UIColorPicker.setColor('picker', this.color);
		InputSliderManager.setValue('point-position', this.CSSposition);
		if (this.shape.num_points > 2)
			GradientShapeManager.setDeleteButtonState('active');
	};

	GradientPoint.prototype.deactivate = function deactivate() {
		this.node.removeAttribute('data-active');
	};

	GradientPoint.prototype.startMove = function startMove(e) {
		this.shape.updateShapeProperties();
		this.node.setAttribute('data-active', 'true');
		document.body.setAttribute('data-dragging', 'true');
	};

	GradientPoint.prototype.endMove = function endMove(e) {
		this.node.removeAttribute('data-active', 'true');
		document.body.removeAttribute('data-dragging');
	};

	/*
	 * Update position while moving the Point using the Mouse
	 */
	GradientPoint.prototype.updatePositionM = function updatePositionM(e) {
		this.position = Math.max(0, e.clientX - this.shape.centerX);
		this.updateCSSPosition();
		this.shape.reorderPoint(this);
		this.shape.updateGradient();
		this.updateSlider();
	};

	/*
	 * Set position when placing a new Gradient Point using the Mouse
	 */
	GradientPoint.prototype.setPositionM = function setPositionM(position) {
		this.position = position;
		this.updateCSSPosition();
		this.shape.reorderPoint(this);
		this.shape.updateGradient();
		this.updateSlider();
	};

	GradientPoint.prototype.updateAbsolutePosition = function updateAbsolutePosition() {
		if (this.shape.unit ='%')
			this.position = parseFloat(((this.CSSposition / 100) * this.shape.lsize).toFixed(1));;
	};

	/*
	 * Set Position directly
	 */
	GradientPoint.prototype.setPosition = function setPosition(pos) {
		this.position = pos;
		if (this.shape.unit === '%')
			this.position = parseFloat(((this.position / 100) * this.shape.lsize).toFixed(1));;
		this.updateCSSPosition();
		this.shape.reorderPoint(this);
		this.shape.updateGradient();
	};

	GradientPoint.prototype.updateSlider = function updateSlider() {
		if (this.shape.ActivePoint === this && this.shape.state === true)
			InputSliderManager.setValue('point-position', this.CSSposition, false);
	};

	GradientPoint.prototype.updateColor = function updateColor(color) {
		this.color.copy(color);
		this.CSScolor = color.getColor();
		this.updateCSSvalue();
	};

	GradientPoint.prototype.updateCSSPosition = function updateCSSPosition() {
		this.CSSposition = this.position | 0;
		if (this.shape.unit === '%')
			this.CSSposition = parseFloat((100 * this.position / this.shape.lsize).toFixed(1));

		this.node.style.left = this.CSSposition + this.shape.unit;
		this.updateCSSvalue();
	};

	GradientPoint.prototype.updateCSSvalue = function updateCSSvalue() {
		this.CSSvalue = this.CSScolor + ' ' + this.CSSposition + this.shape.unit;
	};

	GradientPoint.prototype.insertBefore = function insertBefore(point) {
		this.NextPoint = point;
		this.PrevPoint = point.PrevPoint;
		point.PrevPoint = this;
		if (this.PrevPoint)
			this.PrevPoint.NextPoint = this;
	};

	GradientPoint.prototype.insertAfter = function insertAfter(point) {
		this.NextPoint = point.NextPoint;
		this.PrevPoint = point;
		point.NextPoint = this;
		if (this.NextPoint)
			this.NextPoint.PrevPoint = this;
	};


	/**
	 * Gradient Axis
	 */
	function GradientShape(container, id) {
		var shape = createClassElement('div', 'gradient-shape', null);
		var line = createClassElement('div', 'gradient-line', shape);
		var arrow = createClassElement('div', 'dir-arrow', line);

		shape.setAttribute('shapeID', id);

		var svg = this.createSVGArrow(id);
		arrow.appendChild(svg);

		this.id 	= id;
		this.shape	= shape;
		this.unit	= '%';
		this.line	= line;
		this.container = container;
		this.ending_shape = 'ellipse';

		this.posX = 0;
		this.posY = 0;
		this.centerX = 0;
		this.centerY = 0;
		this.setShapeSize(150, 75);
		this.setShapePosition(container.clientWidth/2, container.clientHeight/2);

		this.FirstPoint = null;
		this.ActivePoint = null;

		this.gradient = '';
		this.num_points = 0;

		this.state = false;
		// this.updateOnResize();

		container.appendChild(shape);
		line.addEventListener('click', this.placeGradientPoint.bind(this));
		arrow.addEventListener('click', function(e) {
			e.stopPropagation();
			e.preventDefault();
		});

		this.updateShapeProperties();

		this.setDraggable();
		this.setResizable();

		console.log(this);
	};

	GradientShape.prototype.setDraggable = function setDraggable() {
		var offsetTop;
		var offsetLeft;

		this.shape.setAttribute('data-draggable', 'true');

		var mouseDrag = function mouseDrag(e) {
			this.setShapePosition(e.clientX - offsetLeft, e.clientY - offsetTop);
		}.bind(this);

		var dragStart = function dragStart(e) {
			e.preventDefault();
			e.stopPropagation();

			if (e.target !== this.shape || e.button !== 0)
				return;

			offsetLeft = e.clientX - this.posX;
			offsetTop = e.clientY - this.posY;

			document.addEventListener('mousemove', mouseDrag);
			document.addEventListener('mouseup', dragEnd);
		}.bind(this);

		var dragEnd = function dragEnd(e) {
			if (e.button !== 0)
				return;

			document.removeEventListener('mousemove', mouseDrag);
			document.removeEventListener('mouseup', dragEnd);
		};

		this.shape.addEventListener('mousedown', dragStart, false);
	};

	GradientShape.prototype.setResizable = 	function setResizable() {
		var valueX = 0;
		var valueY = 0;
		var mouseX = 0;
		var mouseY = 0;

		var resize = createClassElement('div', 'shape-resize', this.shape);
		resize.setAttribute('data-resize', 'both');

		var mouseMove = function mouseMove(e) {
			this.setShapeSize((e.clientX - valueX) / 2, (e.clientY - valueY)/2);
			this.setShapePosition((e.clientX - mouseX) / 2, (e.clientY - mouseY)/2);
		}.bind(this);

		var resizeStart = function resizeStart(e) {
			e.stopPropagation();
			e.preventDefault();
			if (e.button !== 0)
				return;

			mouseX = e.clientX - 2 * this.posX;
			mouseY = e.clientY - 2 * this.posY;

			valueX = e.clientX - 2 * this.width;
			valueY = e.clientY - 2 * this.height;

			document.body.setAttribute('data-resize', 'both');
			document.addEventListener('mousemove', mouseMove);
			document.addEventListener('mouseup', resizeEnd);
		}.bind(this);

		var resizeEnd = function resizeEnd(e) {
			if (e.button !== 0)
				return;

			document.body.removeAttribute('data-resize');
			document.removeEventListener('mousemove', mouseMove);
			document.removeEventListener('mouseup', resizeEnd);
		};

		resize.addEventListener('mousedown', resizeStart);
	};

	GradientShape.prototype.createSVGArrow = function createSVGArrow(id) {
		var xmlns = 'http://www.w3.org/2000/svg';
		var svg = document.createElementNS(xmlns, 'svg');
		var path = document.createElementNS(xmlns, 'path');

		svg.setAttribute('class', 'gradient-arrow');

		svg.setAttribute('width', '25');
		svg.setAttribute('height', '25');

		path.setAttribute('fill', '#CCC');
		path.setAttribute('d', 'M 25,12.5 L 0,0 L 7.5,12.5 L 0,25');
		svg.appendChild(path);

		return svg;
	};

	GradientShape.prototype.placeGradientPoint = function placeGradientPoint(e) {
		this.updateShapeProperties();
		var point = new GradientPoint(this);
		point.setPositionM(e.clientX - this.centerX);
		point.activate();
		this.attachPoint(point);
		this.updateGradient();
	};

	GradientShape.prototype.newGradientPoint = function newGradientPoint(pos) {
		var point = new GradientPoint(this);
		point.setPosition(pos);
		point.activate();
		this.attachPoint(point);
		this.updateGradient();
	};

	GradientShape.prototype.attachPoint = function attachPoint(point) {

		// add the first point
		if (this.FirstPoint === null) {
			this.FirstPoint = point;
			return;
		}

		// insert the point into the list
		var p = this.FirstPoint;
		while (p.NextPoint) {
			if (point.CSSposition < p.CSSposition) {
				point.insertBefore(p);
				if (point.PrevPoint === null)
					this.FirstPoint = point;
				return;
			}
			p = p.NextPoint;
		};

		// test the last point
		if (point.CSSposition < p.CSSposition)
			point.insertBefore(p);
		else
			point.insertAfter(p);

		if (point.PrevPoint === null)
			this.FirstPoint = point;

		return;
	};

	GradientShape.prototype.detachPoint = function detachPoint(point) {
		if (this.FirstPoint === point)
			this.FirstPoint = point.NextPoint;
		if (point.PrevPoint)
			point.PrevPoint.NextPoint = point.NextPoint;
		if (point.NextPoint)
			point.NextPoint.PrevPoint = point.PrevPoint;
		point.NextPoint = null;
		point.PrevPoint = null;
	};

	GradientShape.prototype.deleteActivePoint = function deleteActivePoint() {
		// return if only 2 points left on the axis
		if (this.num_points === 2)
			return;

		if (this.ActivePoint) {
			this.ActivePoint.deletePoint();
			this.detachPoint(this.ActivePoint);
			this.updateGradient();
			this.num_points--;
		}
	};

	GradientShape.prototype.reorderPoint = function reorderPoint(point) {
		if (point.NextPoint && point.NextPoint.CSSposition > point.CSSposition &&
			point.PrevPoint && point.PrevPoint.CSSposition < point.CSSposition)
			return;
		if (point.NextPoint === point.PrevPoint)
			return;

		this.detachPoint(point);
		this.attachPoint(point);
	};

	GradientShape.prototype.setActivePoint = function setActivePoint(point) {
		if (this.ActivePoint)
			this.ActivePoint.deactivate();
		this.ActivePoint = point;
	};

	GradientShape.prototype.activate = function activate() {
		this.state = true;
		this.shape.setAttribute('data-active', this.state);
		InputSliderManager.setUnit('point-position', this.unit, false);
		// SliderManager.setValue('axis-rotation', this.angle | 0, false);
		DropDownManager.setValue('axis-unit', units[this.unit], false);

		if (this.ActivePoint)
			this.ActivePoint.activate();
	};

	GradientShape.prototype.deactivate = function deactivate() {
		this.state = false;
		this.shape.removeAttribute('data-active', this.state);
		if (this.ActivePoint)
			this.ActivePoint.deactivate();
	};

	GradientShape.prototype.deleteAxis = function deleteAxis() {
		this.deactivate();
		this.container.removeChild(this.shape);
	};

	GradientShape.prototype.updatePointColor = function updatePointColor(color) {
		if (this.ActivePoint)
			this.ActivePoint.updateColor(color);
		this.updateGradient();
	};

	GradientShape.prototype.updatePointPosition = function updatePointPosition(value) {
		if (this.ActivePoint)
			this.ActivePoint.setPosition(value);
	};

	GradientShape.prototype.setUnit = function setUnit(unit) {
		this.unit = unit;
		this.updateAllPoints();
		InputSliderManager.setUnit('point-position', unit, false);

		if (this.ActivePoint)
			this.ActivePoint.updateSlider();

		this.updateGradient();
	};

	GradientShape.prototype.updateAllPoints = function updateAllPoints() {
		var p = this.FirstPoint;
		while(p) {
			p.updateCSSPosition();
			p = p.NextPoint;
		}
	};

	GradientShape.prototype.updateOnResize = function updateOnResize() {
		this.updateShapeProperties();
	};

	GradientShape.prototype.updateCenterPointPos = function updateCenterPointPos() {
		var pos = this.container.getBoundingClientRect();
		this.centerX = (pos.left + pos.right) / 2;
		this.centerY = (pos.top + pos.bottom) / 2;
	};

	GradientShape.prototype.setShapePosition = function setShapePosition(posX, posY) {
		console.log(posX, posY);
		this.posX = posX;
		this.posY = posY;
		this.shape.style.left = (posX - this.width) + 'px';
		this.shape.style.top = (posY - this.height) + 'px';
		this.CSSposition = 'at ' + posX + 'px ' + posY + 'px, ';
		GradientShapeManager.updateCSSGradient();
	};

	GradientShape.prototype.setShapeSize = function setShapeSize(width, height) {
		this.width = width;
		this.height = height;
		this.shape.style.width = 2 * width + 'px';
		this.shape.style.height = 2 * height + 'px';
	};

	GradientShape.prototype.updateShapeProperties = function updateShapeProperties() {
		var pos = this.shape.getBoundingClientRect();
		this.centerX = (pos.left + pos.right) / 2;
		this.centerY = (pos.top + pos.bottom) / 2;
		this.lsize = this.shape.clientWidth / 2;
	};

	GradientShape.prototype.updateContainer = function updateContainer() {
	};

	/* UI Methods - apply CSS */

	GradientShape.prototype.updateCSS = function updateCSS() {
		this.line.style.width = 2 * this.lsize + 'px';
		this.shape.style.transform = 'rotate('+ -this.angle +'deg)';
		this.shape.style.webkitTransform = 'rotate('+ -this.angle +'deg)';
	};

	GradientShape.prototype.updateGradient = function updateGradient() {
		var p = this.FirstPoint;
		if (p === null)
			return;

		this.gradient = p.CSSvalue;
		p = p.NextPoint;
		while(p) {
			this.gradient += ', ' + p.CSSvalue;
			p = p.NextPoint;
		};
		GradientShapeManager.updateCSSGradient();
	};

	// this is the standard syntax
	GradientShape.prototype.getCSSGradient = function getCSSGradient() {
		var shape = this.ending_shape + ' ' + this.width + 'px ' +  this.height + 'px ';
		var gradient = 'radial-gradient(' + shape + this.CSSposition + this.gradient + ')';
		console.log(this, gradient);
		return gradient;
	};

	/**
	 * GradientShapeManager
	 */
	var GradientShapeManager = (function GradientShapeManager() {

		var lg_axes = [];
		var ActiveShape = null;
		var ActiveShortcut = null;
		var axes_menu = null;
		var gradient_container = null;
		var add_axis_btn;
		var delete_axis_btn;
		var delete_point_btn;
		var update_output;
		var dragElem;

		var createStartShape = function createStartShape() {

			if (ActiveShape)
				ActiveShape.deactivate();

			var shapeID = getNextAxisID();
			var Shape = new GradientShape(gradient_container, shapeID);
			var color = new HSVColor(60, 100, 100);
			ActiveShape = Shape;

			Shape.activate();
			Shape.newGradientPoint(10);
			Shape.updatePointColor(color);

			color.setHSV(0, 100, 100);
			Shape.newGradientPoint(30);
			Shape.updatePointColor(color);

			color.setValue(0);
			Shape.newGradientPoint(85);
			Shape.updatePointColor(color);

			color.setAlpha(0);
			Shape.newGradientPoint(100);
			Shape.updatePointColor(color);

			UIColorPicker.setColor('picker', color);
			lg_axes.push(Shape);

			Shape.Shortcut = createAxisShortcut(shapeID);
			updateCSSGradient();
		};

		var createNewGradientShape = function createNewGradientShape() {

			if (ActiveShape)
				ActiveShape.deactivate();

			var shapeID = getNextAxisID();
			var Shape = new GradientShape(gradient_container, shapeID);
			var color = new HSVColor(0, 0, 50);
			ActiveShape = Shape;

			Shape.activate();
			Shape.newGradientPoint(10);
			Shape.updatePointColor(color);

			color.setValue(90);
			Shape.newGradientPoint(90);
			Shape.updatePointColor(color);

			color.setAlpha(0);
			Shape.newGradientPoint(100);
			Shape.updatePointColor(color);

			UIColorPicker.setColor('picker', color);
			lg_axes.push(Shape);

			Shape.Shortcut = createAxisShortcut(shapeID);
			Shape.activate();
		};

		var createAxisShortcut = function createAxisShortcut(shapeID) {
			var link = createClassElement('div', 'axis', axes_menu);

			link.setAttribute('shapeID', shapeID);
			link.setAttribute('draggable', 'true');
			link.style.left = (lg_axes.length - 1) * 60 + 'px';

			link.addEventListener('click', function() {
				activateAxisShortcut(link);
				var shapeID = this.getAttribute('shapeID') | 0;
				activateAxis(shapeID);
			});

			link.addEventListener('dragstart', function (e) {
				dragElem = this;
				e.dataTransfer.setData('shapeID', this.getAttribute('shapeID'));
			});
			link.addEventListener('dragover', allowDropEvent);
			link.addEventListener('drop', function swap(e) {
				if (dragElem === this)
					return;

				var from = getOrderID(e.dataTransfer.getData('shapeID'));
				var to = getOrderID(this.getAttribute('shapeID'));

				var swap = lg_axes[from];
				lg_axes[from] = lg_axes[to];
				lg_axes[to] = swap;

				var left = dragElem.offsetLeft;
				dragElem.style.left = this.offsetLeft + 'px';
				this.style.left = left + 'px';

				updateCSSGradient();
			});

			activateAxisShortcut(link);
			return link;
		};

		var activateAxisShortcut = function activateAxisShortcut(node) {
			if (ActiveShortcut)
				ActiveShortcut.removeAttribute('data-state');
			node.setAttribute('data-state', 'active');
			ActiveShortcut = node;
		};

		var getNextAxisID = function getNextAxisID() {
			var ids = [];
			var idx = 0;
			var len = lg_axes.length;

			for (var i=0; i<len; i++)
				ids[lg_axes[i].id] = true;

			while (idx < lg_axes.length) {
				if (ids[idx] !== true)
					return idx;
				idx++;
			}

			return idx;
		};

		var getOrderID = function getOrderID(shapeID) {
			var len = lg_axes.length;
			for (var i=0; i<len; i++)
				if (lg_axes[i].id == shapeID)
					return i;
		};

		var activateAxis = function activateAxis(shapeID) {
			var axis = lg_axes[getOrderID(shapeID)];
			if (axis === null) return;

			if (ActiveShape && ActiveShape !== axis)
				ActiveShape.deactivate();
			ActiveShape = axis;
			ActiveShape.activate();

			if (lg_axes.length > 1)
				delete_axis_btn.removeAttribute('data-state');
		};

		/* Axis functions */

		var setAxisUnit = function setAxisUnit(obj) {
			ActiveShape.setUnit(obj.value);
		};

		var setAddShapeButton = function setAddShapeButton() {
			add_axis_btn = getElemById('add-shape');
			add_axis_btn.addEventListener('click', function() {
				if (lg_axes.length === 4)
					return;

				createNewGradientShape();

				if (lg_axes.length > 1)
					delete_axis_btn.removeAttribute('data-state');
				if (lg_axes.length === 4)
					this.setAttribute('data-state', 'disabled');
			});
		};

		var setDeleteShapeButton = function setDeleteShapeButton() {
			delete_axis_btn = getElemById('delete-shape');
			delete_axis_btn.addEventListener('click', function () {
				if (this.hasAttribute('data-state'))
					return;
				if (lg_axes.length === 1)
					return;

				axes_menu.removeChild(ActiveShape.Shortcut);
				ActiveShape.deleteAxis();
				lg_axes.splice(getOrderID(ActiveShape.id), 1);

				ActiveShape = null;
				updateCSSGradient();

				var len = lg_axes.length;
				for (var i=0; i<len; i++)
					lg_axes[i].Shortcut.style.left = 60 * i + 'px';

				this.setAttribute('data-state', 'disabled');
				if (lg_axes.length < 4)
					add_axis_btn.removeAttribute('data-state');
			});
		};

		/* Point methods */

		var updatePointColor = function updatePointColor(color) {
			ActiveShape.updatePointColor(color);
		};

		var updatePointPosition = function updatePointPosition(color) {
			ActiveShape.updatePointPosition(color);
		};

		var setDeletePointButton = function setDeletePointButton() {
			delete_point_btn = getElemById('delete-point');
			delete_point_btn.addEventListener('click', function () {
				if (this.getAttribute('data-state') === 'disabled')
					return;

				ActiveShape.deleteActivePoint();
				updateCSSGradient();
				setDeleteButtonState('disabled');
			});
		};

		var setDeleteButtonState = function setDeleteButtonState(state) {
			if (delete_point_btn)
				delete_point_btn.setAttribute('data-state', state);
		};

		/* Container box functions */

		var resizeContainer = function resizeContainer() {
			var len = lg_axes.length;
			for(var i = 0; i < len; i++)
				lg_axes[i].updateOnResize();
		};

		var resizeEnd = function resizeEnd() {
			var len = lg_axes.length;
			for(var i = 0; i < len; i++)
				lg_axes[i].updateAbsolutePosition();
		};

		/* General functions */

		var updateCSSGradient = function () {
			var gradient = [];
			var k = 0;
			var len = lg_axes.length;
			for(var i = 0; i < len; i++) {
				gradient.push(lg_axes[i].getCSSGradient());
			}

			gradient_container.style.background = gradient.join(', ');

			if (update_output)
				window.clearTimeout(update_output);

			update_output = setTimeout( function() {
				Tool.updateOutputCSSCode(gradient);
			}, 500);
		};

		var init = function init() {
			gradient_container = getElemById('gradient-container');
			axes_menu = getElemById('gradient-axes');

			setDeletePointButton();
			setDeleteShapeButton();
			setAddShapeButton();
			createStartShape();

			UIColorPicker.subscribe('picker', updatePointColor);
			InputSliderManager.subscribe('point-position', updatePointPosition);

			// DropDownManager.subscribe('axis-unit', setAxisUnit);

			UIComponent.makeResizable(gradient_container, 'both', resizeContainer, resizeEnd);
			window.addEventListener('resize', resizeContainer);
		};

		return {
			init : init,
			updateCSSGradient : updateCSSGradient,
			setDeleteButtonState : setDeleteButtonState
		};

	})();


	/**
	 * Tool
	 */
	var Tool = (function Tool() {

		var container;
		var output;

		var setToggleAlphaBackground = function setToggleAlphaBackground() {
			var button = getElemById('canvas-bg');
			var state = true;
			button.addEventListener('click', function() {
				state = !state;
				container.setAttribute('data-alpha', state);
				this.setAttribute('data-alpha', state);
			});
		};

		var updateOutputCSSCode = function updateOutputCSSCode(gradient) {

			var updateOutputElem = function updateOutputElem(index, prefix) {
				var code = prefix + gradient.join(',\n ' + prefix) + ';';
				output.children[index].children[1].textContent = code;
				output.children[index].style.height = output.children[index].children[1].scrollHeight + 'px';
			};

			updateOutputElem(0, '');
		};


		var init = function init() {
			output = getElemById('output');
			container = getElemById('gradient-container');

			setToggleAlphaBackground();
		};

		return {
			init : init,
			updateOutputCSSCode: updateOutputCSSCode
		};

	})();

	var init = function init() {
		UIColorPicker.init();
		InputSliderManager.init();
		DropDownManager.init();
		SliderManager.init();
		GradientShapeManager.init();
		Tool.init();
	};

	return {
		init : init
	};

})();

