'use strict';

window.addEventListener("load", function() {
	LinearGradientTool.init();
});

var LinearGradientTool = (function LinearGradientTool() {

	var radian = 180 / Math.PI;
	var inv_radian = Math.PI / 180;

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

		function makeResizable(elem, axis, callback) {
			var valueX = 0;
			var valueY = 0;
			var action = 0;
			var callback = typeof callback === "function" ? callback : null;

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

		return {
			makeResizable : makeResizable
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
		this.Axis = Axis;
		this.color = new HSVColor(0, 0, 100);
		this.CSScolor = this.color.getColor();
		this.CSSposition = 0;
		this.PrevPoint = null;
		this.NextPoint = null;

		this.Axis.num_points++;

		point.addEventListener('click', this.activate.bind(this));
		trackMouse(point, this.updatePositionM.bind(this), this.startMove.bind(this),
			this.endMove.bind(this));

		Axis.line.appendChild(point);
		return this;
	};

	GradientPoint.prototype.deletePoint = function deletePoint() {
		this.Axis.line.removeChild(this.node);
	};

	GradientPoint.prototype.activate = function activate() {
		if (this.Axis.state === false)
			return;

		this.Axis.setActivePoint(this);
		this.node.setAttribute('data-active', 'true');
		UIColorPicker.setColor('picker', this.color);
		InputSliderManager.setValue('point-position', this.CSSposition);
		if (this.Axis.num_points > 2)
			AxesManager.setDeleteButtonState('active');
	};

	GradientPoint.prototype.deactivate = function deactivate() {
		this.node.removeAttribute('data-active');
	};

	GradientPoint.prototype.startMove = function startMove(e) {
		this.Axis.updateCenterPointPos();
		this.node.setAttribute('data-active', 'true');
		document.body.setAttribute('data-dragging', 'true');
	};

	GradientPoint.prototype.endMove = function endMove(e) {
		this.node.removeAttribute('data-active', 'true');
		document.body.removeAttribute('data-dragging');
	};

	GradientPoint.prototype.updatePositionM = function updatePositionM(e) {
		var A = this.Axis;
		var Qx = e.clientX - A.centerX;
		var Qy = e.clientY - A.centerY;
		this.position = (A.Px * Qx + A.Py * Qy) / A.Pmod + A.lsize;
		this.updateCSSPosition();
		this.Axis.reorderPoint(this);
		this.Axis.updateGradient();
		this.updateSlider();
	};

	GradientPoint.prototype.setPositionM = function setPositionM(posX, posY) {
		var A = this.Axis;
		var Qx = posX - A.centerX;
		var Qy = posY - A.centerY;
		this.position = (A.Px * Qx + A.Py * Qy) / A.Pmod + A.lsize;
		this.updateCSSPosition();
		this.Axis.reorderPoint(this);
		this.Axis.updateGradient();
		this.updateSlider();
	};

	GradientPoint.prototype.updateAbsolutePosition = function updateAbsolutePosition() {
		this.position = parseFloat(((this.CSSposition / 100) * (2 * this.Axis.lsize)).toFixed(1));;
	};

	GradientPoint.prototype.setPosition = function setPosition(pos) {
		this.position = pos;
		if (this.Axis.unit === '%')
			this.position = parseFloat(((this.position / 100) * (2 * this.Axis.lsize)).toFixed(1));;
		this.updateCSSPosition();
		this.Axis.reorderPoint(this);
		this.Axis.updateGradient();
	};

	GradientPoint.prototype.updateSlider = function updateSlider() {
		if (this.Axis.ActivePoint === this && this.Axis.state === true)
			InputSliderManager.setValue('point-position', this.CSSposition, false);
	};

	GradientPoint.prototype.updateColor = function updateColor(color) {
		this.color.copy(color);
		this.CSScolor = color.getColor();
		this.updateCSSvalue();
	};

	GradientPoint.prototype.updateCSSPosition = function updatePosition() {
		this.CSSposition = this.position | 0;
		if (this.Axis.unit === '%')
			this.CSSposition = parseFloat((100 * this.position / (2 * this.Axis.lsize)).toFixed(1));

		this.node.style.left = this.CSSposition + this.Axis.unit;
		this.updateCSSvalue();
	};

	GradientPoint.prototype.updateCSSvalue = function updateCSSvalue() {
		this.CSSvalue = this.CSScolor + ' ' + this.CSSposition + this.Axis.unit;
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
	function GradientAxis(container, id) {
		var axis = createClassElement('div', 'gradient-axis', null);
		var line = createClassElement('div', 'gradient-line', axis);
		var rotate_point = createClassElement('div', 'rotate-point', axis);

		axis.setAttribute('axisID', id);

		var svg = this.createSVGArrow(id);
		rotate_point.appendChild(svg);

		this.id 	= id;
		this.axis	= axis;
		this.unit	= '%';
		this.line	= line;
		this.container = container;
		this.lsize = container.clientWidth / 2;
		this.FirstPoint = null;
		this.ActivePoint = null;
		this.gradient = '';
		this.num_points = 0;

		this.size = 0;
		this.angle = 0;
		this.state = false;
		this.updateOnResize();

		trackMouse(rotate_point, this.updateAxisAngle.bind(this),
						this.startRotation.bind(this));

		container.appendChild(axis);
		line.addEventListener('click', this.placeGradientPoint.bind(this));
	};


	GradientAxis.prototype.createSVGArrow = function createSVGArrow(id) {
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

	GradientAxis.prototype.placeGradientPoint = function placeGradientPoint(e) {
		this.updateCenterPointPos();
		var point = new GradientPoint(this);
		point.setPositionM(e.clientX, e.clientY);
		point.activate();
		this.attachPoint(point);
		this.updateGradient();
	};

	GradientAxis.prototype.newGradientPoint = function newGradientPoint(pos) {
		var point = new GradientPoint(this);
		point.setPosition(pos);
		point.activate();
		this.attachPoint(point);
		this.updateGradient();
	};

	GradientAxis.prototype.attachPoint = function attachPoint(point) {

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

	GradientAxis.prototype.detachPoint = function detachPoint(point) {
		if (this.FirstPoint === point)
			this.FirstPoint = point.NextPoint;
		if (point.PrevPoint)
			point.PrevPoint.NextPoint = point.NextPoint;
		if (point.NextPoint)
			point.NextPoint.PrevPoint = point.PrevPoint;
		point.NextPoint = null;
		point.PrevPoint = null;
	};

	GradientAxis.prototype.deleteActivePoint = function deleteActivePoint() {
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

	GradientAxis.prototype.reorderPoint = function reorderPoint(point) {
		if (point.NextPoint && point.NextPoint.CSSposition > point.CSSposition &&
			point.PrevPoint && point.PrevPoint.CSSposition < point.CSSposition)
			return;
		if (point.NextPoint === point.PrevPoint)
			return;

		this.detachPoint(point);
		this.attachPoint(point);
	};

	GradientAxis.prototype.setActivePoint = function setActivePoint(point) {
		if (this.ActivePoint)
			this.ActivePoint.deactivate();
		this.ActivePoint = point;
	};

	GradientAxis.prototype.activate = function activate() {
		this.state = true;
		this.axis.setAttribute('data-active', this.state);
		InputSliderManager.setUnit('point-position', this.unit, false);
		SliderManager.setValue('axis-rotation', this.angle | 0, false);

		var dp = 0;
		if (this.unit === '%') dp = 1;
		DropDownManager.setValue('axis-unit', dp);

		if (this.ActivePoint)
			this.ActivePoint.activate();
	};

	GradientAxis.prototype.deactivate = function deactivate() {
		this.state = false;
		this.axis.removeAttribute('data-active', this.state);
		if (this.ActivePoint)
			this.ActivePoint.deactivate();
	};

	GradientAxis.prototype.deleteAxis = function deleteAxis() {
		this.deactivate();
		this.container.removeChild(this.axis);
	};

	GradientAxis.prototype.updatePointColor = function updatePointColor(color) {
		if (this.ActivePoint)
			this.ActivePoint.updateColor(color);
		this.updateGradient();
	};

	GradientAxis.prototype.updatePointPosition = function updatePointPosition(value) {
		if (this.ActivePoint)
			this.ActivePoint.setPosition(value);
	};

	GradientAxis.prototype.setUnit = function setUnit(unit) {
		this.unit = unit;
		this.updateAllPoints();
		InputSliderManager.setUnit('point-position', unit, false);

		if (this.ActivePoint)
			this.ActivePoint.updateSlider();

		this.updateGradient();
	};

	GradientAxis.prototype.updateAllPoints = function updateAllPoints() {
		var p = this.FirstPoint;
		while(p) {
			p.updateCSSPosition();
			p = p.NextPoint;
		}
	};

	/* Axis events */
	GradientAxis.prototype.startRotation = function startRotation(e) {
		this.updateCenterPointPos();
		this.updateAxisAngle(e);
	};

	GradientAxis.prototype.updateOnResize = function updateOnResize() {
		this.updateContainer();
		this.updateCenterPointPos();
		this.setAxisAngle(this.angle);
	};

	GradientAxis.prototype.updateCenterPointPos = function updateCenterPointPos() {
		var pos = this.container.getBoundingClientRect();
		this.centerX = (pos.left + pos.right) / 2;
		this.centerY = (pos.top + pos.bottom) / 2;
	};

	GradientAxis.prototype.updateContainer = function updateContainer() {
		var W = this.container.clientWidth;
		var H = this.container.clientHeight;

		var max_size = Math.sqrt(W * W + H * H) + 50;

		this.axis.style.width = max_size + 'px';
		this.axis.style.left = (W - max_size)/2 - 1 + 'px';

		this.mW = W / 2;
		this.mH = H / 2;
	};

	GradientAxis.prototype.updateAxisAngle = function updateAxisAngle(e) {

		var Px = e.clientX - this.centerX;
		var Py = e.clientY - this.centerY;
		var deg = -Math.atan2(Py, Px) * radian;
		var Pmod = Math.sqrt(Px * Px + Py * Py);
		this.lsize = (this.mW * Math.abs(Px) + this.mH * Math.abs(Py)) / Pmod;

		if (this.state === true)
			SliderManager.setValue('axis-rotation', deg | 0, false);

		this.angle = deg;
		this.updateCSS();
		AxesManager.updateCSSGradient();

		this.Px = Px;
		this.Py = Py;
		this.Pmod = Pmod;
	};

	GradientAxis.prototype.setAxisAngle = function setAxisAngle(deg) {
		var rad = -deg * inv_radian;
		var Px = Math.cos(rad);
		var Py = Math.sin(rad);
		this.lsize = this.mW * Math.abs(Px) + this.mH * Math.abs(Py);

		this.angle = deg;
		this.updateCSS();
		AxesManager.updateCSSGradient();

		this.Px = Px;
		this.Py = Py;
		this.Pmod = 1;
	};

	/* UI Methods - apply CSS */

	GradientAxis.prototype.updateCSS = function updateCSS() {
		this.line.style.width = 2 * this.lsize + 'px';
		this.axis.style.transform = 'rotate('+ -this.angle +'deg)';
		this.axis.style.webkitTransform = 'rotate('+ -this.angle +'deg)';
	};

	GradientAxis.prototype.updateGradient = function updateGradient() {
		var p = this.FirstPoint;
		if (p === null)
			return;

		this.gradient = p.CSSvalue;
		p = p.NextPoint;
		while(p) {
			this.gradient += ', ' + p.CSSvalue;
			p = p.NextPoint;
		};
		AxesManager.updateCSSGradient();
	};

	// this is the standard syntax
	GradientAxis.prototype.getCSSGradient = function getCSSGradient() {
		return 'linear-gradient('+ (-this.angle + 90 | 0) +'deg, ' + this.gradient + ')';
	};

	/**
	 * AxesManager Manager
	 */
	var AxesManager = (function AxesManager() {

		var lg_axes = [];
		var ActiveAxis = null;
		var ActiveShortcut = null;
		var axes_menu = null;
		var gradient_container = null;
		var add_axis_btn;
		var delete_axis_btn;
		var delete_point_btn;
		var update_output;
		var dragElem;

		var createStartAxis = function createStartAxis(angle) {

			if (ActiveAxis)
				ActiveAxis.deactivate();

			var axisID = getNextAxisID();
			var axis = new GradientAxis(gradient_container, axisID);
			var color = new HSVColor(210, 90, 90);
			ActiveAxis = axis;

			axis.activate();
			axis.setAxisAngle(angle);
			axis.newGradientPoint(10);
			axis.updatePointColor(color);

			color.setAlpha(0.5);
			axis.newGradientPoint(50);
			axis.updatePointColor(color);

			color.setHue(275);
			axis.newGradientPoint(50);
			axis.updatePointColor(color);

			color.setAlpha(1);
			axis.newGradientPoint(90);
			axis.updatePointColor(color);

			UIColorPicker.setColor('picker', color);
			lg_axes.push(axis);

			axis.Shortcut = createAxisShortcut(axisID);
			axis.activate();
		};

		var createAxis = function createAxis(angle) {

			if (ActiveAxis)
				ActiveAxis.deactivate();

			var axisID = getNextAxisID();
			var axis = new GradientAxis(gradient_container, axisID);
			var color = new HSVColor(0, 0, 50);
			ActiveAxis = axis;

			axis.activate();
			axis.setAxisAngle(angle);
			axis.newGradientPoint(10);
			axis.updatePointColor(color);

			color.setValue(90);
			axis.newGradientPoint(90);
			axis.updatePointColor(color);

			UIColorPicker.setColor('picker', color);
			lg_axes.push(axis);

			axis.Shortcut = createAxisShortcut(axisID);
			axis.activate();
		};

		var createAxisShortcut = function createAxisShortcut(axisID) {
			var axis = createClassElement('div', 'axis', axes_menu);

			axis.setAttribute('axisID', axisID);
			axis.setAttribute('draggable', 'true');
			axis.style.left = (lg_axes.length - 1) * 60 + 'px';

			axis.addEventListener('click', function() {
				activateAxisShortcut(axis);
				var axisID = this.getAttribute('axisID') | 0;
				activateAxis(axisID);
			});

			axis.addEventListener('dragstart', function (e) {
				dragElem = this;
				e.dataTransfer.setData('axisID', this.getAttribute('axisID'));
			});
			axis.addEventListener('dragover', allowDropEvent);
			axis.addEventListener('drop', function swap(e) {
				if (dragElem === this)
					return;

				var from = getOrderID(e.dataTransfer.getData('axisID'));
				var to = getOrderID(this.getAttribute('axisID'));

				var swap = lg_axes[from];
				lg_axes[from] = lg_axes[to];
				lg_axes[to] = swap;

				var left = dragElem.offsetLeft;
				dragElem.style.left = this.offsetLeft + 'px';
				this.style.left = left + 'px';

				updateCSSGradient();
			});

			activateAxisShortcut(axis);
			return axis;
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

		var getOrderID = function getOrderID(axisID) {
			var len = lg_axes.length;
			for (var i=0; i<len; i++)
				if (lg_axes[i].id == axisID)
					return i;
		};

		var activateAxis = function activateAxis(axisID) {
			var axis = lg_axes[getOrderID(axisID)];
			if (axis === null) return;

			if (ActiveAxis && ActiveAxis !== axis)
				ActiveAxis.deactivate();
			ActiveAxis = axis;
			ActiveAxis.activate();

			if (lg_axes.length > 1)
				delete_axis_btn.removeAttribute('data-state');
		};

		/* Axis functions */

		var updateAxisRotation = function updateAxisRotation(value) {
			ActiveAxis.setAxisAngle(value);
		};

		var setAxisUnit = function setAxisUnit(obj) {
			ActiveAxis.setUnit(obj.value);
		};

		var setAddAxisButton = function setAddAxisButton() {
			add_axis_btn = getElemById('add-axis');
			add_axis_btn.addEventListener('click', function() {
				if (lg_axes.length === 4)
					return;

				createAxis(0);

				if (lg_axes.length > 1)
					delete_axis_btn.removeAttribute('data-state');
				if (lg_axes.length === 4)
					this.setAttribute('data-state', 'disabled');
			});
		};

		var setDeleteAxisButton = function setDeleteAxisButton() {
			delete_axis_btn = getElemById('delete-axis');
			delete_axis_btn.addEventListener('click', function () {
				if (this.hasAttribute('data-state'))
					return;
				if (lg_axes.length === 1)
					return;

				axes_menu.removeChild(ActiveAxis.Shortcut);
				ActiveAxis.deleteAxis();
				lg_axes.splice(getOrderID(ActiveAxis.id), 1);

				ActiveAxis = null;
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
			ActiveAxis.updatePointColor(color);
		};

		var updatePointPosition = function updatePointPosition(color) {
			ActiveAxis.updatePointPosition(color);
		};

		var setDeletePointButton = function setDeletePointButton() {
			delete_point_btn = getElemById('delete-point');
			delete_point_btn.addEventListener('click', function () {
				if (this.getAttribute('data-state') === 'disabled')
					return;

				ActiveAxis.deleteActivePoint();
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
			setDeleteAxisButton();
			setAddAxisButton();

			createStartAxis(18);
			createStartAxis(-18);

			updateCSSGradient();

			UIColorPicker.subscribe('picker', updatePointColor);
			InputSliderManager.subscribe('point-position', updatePointPosition);

			DropDownManager.subscribe('axis-unit', setAxisUnit);
			SliderManager.subscribe('axis-rotation', updateAxisRotation);

			UIComponent.makeResizable(gradient_container, 'both', resizeContainer);
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
		AxesManager.init();
		Tool.init();
	};

	return {
		init : init
	};

})();



