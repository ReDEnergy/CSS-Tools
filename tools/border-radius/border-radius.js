'use strict';

window.addEventListener("load", function() {
	BorderRadius.init();
});

var BorderRadius = (function BorderRadius() {

	function getElemById(id) {
		return document.getElementById(id);
	}

	/**
	 * Shadow dragging
	 */
	var PreviewMouseTracking = (function Drag() {
		var active = false;
		var lastX = 0;
		var lastY = 0;
		var subscribers = [];

		var init = function init(id) {
			var elem = getElemById(id);
			elem.addEventListener('mousedown', dragStart, false);
			document.addEventListener('mouseup', dragEnd, false);
		}

		var dragStart = function dragStart(e) {
			if (e.button !== 0)
				return;

			active = true;
			lastX = e.clientX;
			lastY = e.clientY;
			document.addEventListener('mousemove', mouseDrag, false);
		}

		var dragEnd = function dragEnd(e) {
			if (e.button !== 0)
				return;

			if (active === true) {
				active = false;
				document.removeEventListener('mousemove', mouseDrag, false);
			}
		}

		var mouseDrag = function mouseDrag(e) {
			notify(e.clientX - lastX, e.clientY - lastY);
			lastX = e.clientX;
			lastY = e.clientY;
		}

		var subscribe = function subscribe(callback) {
			subscribers.push(callback);
		}

		var unsubscribe = function unsubscribe(callback) {
			var index = subscribers.indexOf(callback);
			subscribers.splice(index, 1);
		}

		var notify = function notify(deltaX, deltaY) {
			for (var i in subscribers)
				subscribers[i](deltaX, deltaY);
		}

		return {
			init : init,
			subscribe : subscribe,
			unsubscribe : unsubscribe
		}

	})();

	var subject;
	var units = ['px', '%'];
	var output = null;

	var UnitSelector = function UnitSelector(topic) {

		this.container = document.createElement("div");
		this.select = document.createElement("select");
		for (var i in units) {
			var option = document.createElement("option");
			option.value = i;
			option.textContent = units[i];
			this.select.appendChild(option);
		}

		this.container.className = 'dropdown ' + 'unit-' + topic;
		this.container.appendChild(this.select);
	}

	UnitSelector.prototype.setValue = function setValue(value) {
		this.salect.value = value;
	}


	var RadiusContainer = function RadiusContainer(node) {
		var radius = document.createElement('div');
		var handle = document.createElement('div');
		var x = node.getAttribute('data-x');
		var y = node.getAttribute('data-y');
		var active = false;

		this.id = node.id;
		this.node = node;
		this.radius = radius;
		this.handle = handle;
		this.width = 100;
		this.height = 50;
		this.size = 50;
		this.rounded = false;

		this.unitX = 0;
		this.unitY = 0;
		this.unitR = 0;

		this.maxW = 100;
		this.maxH = 100;
		this.maxR = 100;

		this.topic = y + '-' + x;

		var sliderW = InputSliderManager.getNode(this.topic + '-w');
		var sliderH = InputSliderManager.getNode(this.topic + '-h');
		var sliderR = InputSliderManager.getNode(this.topic);

		this.setUnitX(this.unitX);
		this.setUnitY(this.unitY);
		this.setUnitR(this.unitR);

		this.updateWidth();
		this.updateHeight();
		this.updateRadius();

		if (x === 'left')	this.resizeX =  1;
		if (x === 'right')	this.resizeX = -1;
		if (y === 'top')	this.resizeY =  1;
		if (y === 'bottom')	this.resizeY = -1;

		radius.className = 'radius';

		var unit_selector = document.getElementById("unit-selection");
		var unitW = new UnitSelector(this.topic + '-w');
		var unitH = new UnitSelector(this.topic + '-h');
		var unitR = new UnitSelector(this.topic);

		unit_selector.appendChild(unitW.container);
		unit_selector.appendChild(unitH.container);
		unit_selector.appendChild(unitR.container);
		node.appendChild(radius);
		subject.appendChild(handle);

		unitW.select.addEventListener('change', function(e) {
			this.setUnitX(e.target.value | 0);
		}.bind(this));

		unitH.select.addEventListener('change', function(e) {
			this.setUnitY(e.target.value | 0);
		}.bind(this));

		unitR.select.addEventListener('change', function(e) {
			this.setUnitR(e.target.value | 0);
		}.bind(this));

		if (x === 'left' && y == 'top') handle.className = 'handle handle-top-left'
		if (x === 'right' && y == 'top') handle.className = 'handle handle-top-right';
		if (x === 'right' && y == 'bottom') handle.className = 'handle handle-bottom-right';
		if (x === 'left' && y == 'bottom') 	handle.className = 'handle handle-bottom-left';

		handle.addEventListener("mousedown", function(e) {
			active = true;
			this.radius.style.display = 'block';
			PreviewMouseTracking.subscribe(this.updateContainer.bind(this));
		}.bind(this));

		document.addEventListener("mouseup", function(e) {
			this.radius.style.display = 'none';
			if (active === true)
				PreviewMouseTracking.unsubscribe(this.updateContainer.bind(this));
		}.bind(this));

		InputSliderManager.subscribe(this.topic + '-w', this.setWidth.bind(this));
		InputSliderManager.subscribe(this.topic + '-h', this.setHeight.bind(this));
		InputSliderManager.subscribe(this.topic, this.setRadius.bind(this));

		ButtonManager.subscribe(this.topic, function(value) {
			this.rounded = value;
			if (value === true) {
				unitW.container.style.display = 'none';
				unitH.container.style.display = 'none';
				unitR.container.style.display = 'block';
				sliderW.style.display = 'none';
				sliderH.style.display = 'none';
				sliderR.style.display = 'block';
				this.setUnitR(this.unitR);
				this.updateRadius();
			}

			if (value === false) {
				unitW.container.style.display = 'block';
				unitH.container.style.display = 'block';
				unitR.container.style.display = 'none';
				sliderW.style.display = 'block';
				sliderH.style.display = 'block';
				sliderR.style.display = 'none';
				this.setUnitX(this.unitX);
				this.setUnitY(this.unitY);
				this.updateWidth();
				this.updateHeight();
			}

			this.updateBorderRadius();

		}.bind(this));

		this.updateBorderRadius();
	}

	RadiusContainer.prototype.updateWidth = function updateWidth() {
		this.node.style.width = this.width + units[this.unitX];
		var value = Math.round(this.width / 2);
		InputSliderManager.setValue(this.topic + '-w', value, false);
	}

	RadiusContainer.prototype.updateHeight = function updateHeight() {
		this.node.style.height = this.height + units[this.unitY];
		var value = Math.round(this.height / 2);
		InputSliderManager.setValue(this.topic + '-h', value, false);
	}

	RadiusContainer.prototype.updateRadius = function updateRadius() {
		var value = Math.round(this.size / 2);
		this.node.style.width = this.size + units[this.unitR];
		this.node.style.height = this.size + units[this.unitR];
		InputSliderManager.setValue(this.topic, value, false);
	}

	RadiusContainer.prototype.setWidth = function setWidth(value) {
		this.radius.style.display = 'block';
		this.width = 2 * value;
		this.node.style.width = this.width + units[this.unitX];
		this.updateBorderRadius();
	}

	RadiusContainer.prototype.setHeight = function setHeight(value) {
		this.radius.style.display = 'block';
		this.height = 2 * value;
		this.node.style.height = this.height + units[this.unitY];
		this.updateBorderRadius();
	}

	RadiusContainer.prototype.setRadius = function setRadius(value) {
		this.radius.style.display = 'block';
		this.size = 2 * value;
		this.node.style.width = this.size + units[this.unitR];
		this.node.style.height = this.size + units[this.unitR];
		this.updateBorderRadius();
	}

	RadiusContainer.prototype.setUnitX = function setUnitX(value) {
		this.unitX = value;
		if (this.unitX === 0) this.maxW = 2 * subject.clientWidth;
		if (this.unitX === 1) this.maxW = 200;
		InputSliderManager.setUnit(this.topic + '-w', units[this.unitX]);
		InputSliderManager.setMax(this.topic + '-w', this.maxW / 2);
	}

	RadiusContainer.prototype.setUnitY = function setUnitY(value) {
		this.unitY = value;
		if (this.unitY === 0) this.maxH = 2 * subject.clientHeight;
		if (this.unitY === 1) this.maxH = 200;
		InputSliderManager.setUnit(this.topic + '-h', units[this.unitY]);
		InputSliderManager.setMax(this.topic + '-h', this.maxH / 2);
	}

	RadiusContainer.prototype.setUnitR = function setUnitR(value) {
		this.unitR = value;

		if (this.unitR === 0)
			this.maxR = 2 * Math.min(subject.clientHeight , subject.clientWidth);

		if (this.unitR === 1)
			this.maxR = 200;

		InputSliderManager.setUnit(this.topic, units[this.unitR]);
		InputSliderManager.setMax(this.topic, this.maxR / 2);
	}

	RadiusContainer.prototype.updateUnits = function updateUnits(unit) {
		if (this.rounded) {
			this.setUnitR(this.unitR);
			return;
		}

		if (unit === 0)
			this.setUnitX(this.unitX);

		if (unit === 1)
			this.setUnitY(this.unitY);
	}

	RadiusContainer.prototype.composeBorderRadius = function composeBorderRadius () {

		if (this.rounded === true) {
			var unit = units[this.unitR];
			var value = Math.round(this.size / 2);
			return value + unit;
		}

		var unitX = units[this.unitX];
		var unitY = units[this.unitY];
		var valueX = Math.round(this.width / 2);
		var valueY = Math.round(this.height / 2);

		if (valueX === valueY && this.unitX === this.unitY)
			return valueX + unitX;

		return valueX + unitX + ' ' + valueY + unitY;
	}

	RadiusContainer.prototype.updateBorderRadius = function updateBorderRadius () {
		var radius = this.composeBorderRadius();
		var corner = 0;

		if (this.topic === 'top-left') {
			subject.style.borderTopLeftRadius = radius;
			corner = 0;
		}

		if (this.topic === 'top-right') {
			subject.style.borderTopRightRadius = radius;
			corner = 1;
		}

		if (this.topic === 'bottom-right') {
			subject.style.borderBottomRightRadius = radius;
			corner = 2;
		}

		if (this.topic === 'bottom-left') {
			subject.style.borderBottomLeftRadius = radius;
			corner = 3;
		}

		Tool.updateOutput(corner, radius);
	}

	RadiusContainer.prototype.updateContainer = function updateContainer(deltaX, deltaY) {

		if (this.rounded === true) {
			this.size += this.resizeX * deltaX + this.resizeY * deltaY;
			if (this.size < 0)	this.size = 0;
			if (this.size > this.maxR)	this.size = this.maxR;
			this.updateRadius();
			this.updateBorderRadius();
			return;
		}

		if (deltaX) {
			this.width += this.resizeX * deltaX;
			if (this.width < 0)	this.width = 0;
			if (this.width > this.maxW)	this.width = this.maxW;
			this.updateWidth();
		}

		if (deltaY) {
			this.height += this.resizeY * deltaY;
			if (this.height < 0) this.height = 0;
			if (this.height > this.maxH)	this.height = this.maxH;
			this.updateHeight();
		}

		if (deltaX || deltaY)
			this.updateBorderRadius();
	}


	/**
	 * Tool Manager
	 */
	var Tool = (function Tool() {
		var preview;
		var preview_ui;
		var radius_containers = [];
		var border_width = 3;
		var borders1 = [null, null, null, null];
		var borders2 = [0, 0, 0, 0];

		var updateUIWidth = function updateUIWidth(value) {
			var pwidth = subject.parentElement.clientWidth;
			var left = (pwidth - value) / 2;
			subject.style.width = value + "px";

			for (var i = 0; i < 4; i++)
				radius_containers[i].updateUnits(0);
		}

		var updateUIHeight = function updateUIHeight(value) {
			var pheight = subject.parentElement.clientHeight;
			var top = (pheight - value) / 2;
			subject.style.height = value + "px";
			subject.style.top = top - border_width + "px";

			for (var i = 0; i < 4; i++)
				radius_containers[i].updateUnits(1);
		}

		var updatePreviewUIWidth = function updatePreviewUIWidth() {
			var p = subject.parentElement.clientWidth;
			var v = preview_ui.clientWidth;
			console.log(p, v, (p - v ) / 2);
			preview_ui.style.left = (p - v) / 2 + "px" ;
		}

		var updatePreviewUIHeight = function updatePreviewUIHeight() {
			var p = subject.parentElement.clientHeight;
			var v = preview_ui.clientHeight;
			console.log(p, v, (p - v ) / 2);
			preview_ui.style.top = (p - v) / 2 + "px" ;
		}

		var updateOutput = function updateOutput(corner, radius) {
			var values = radius.split(" ");

			borders1[corner] = values[0];
			borders2[corner] = values[0];

			if (values.length === 2)
				borders2[corner] = values[1];

			var border_1_value = borders1.join(" ");
			var border_2_value = borders2.join(" ");
			var border_radius = 'border-radius: ' + border_1_value;

			if (border_2_value !== border_1_value)
				border_radius += ' / ' + border_2_value;

			border_radius += ';';
			output.textContent = border_radius;
		}

		var init = function init() {
			preview = getElemById("preview");
			subject = getElemById("subject");
			output = getElemById("output");
			preview_ui = getElemById("radius-ui-sliders");

			var elem = document.querySelectorAll('.radius-container');
			var size = elem.length;
			for (var i = 0; i < size; i++)
				radius_containers[i] = new RadiusContainer(elem[i]);

			InputSliderManager.subscribe("width", updateUIWidth);
			InputSliderManager.subscribe("height", updateUIHeight);

			InputSliderManager.setValue("width", subject.clientWidth);
			InputSliderManager.setValue("height", subject.clientHeight);
		}

		return {
			init : init,
			updateOutput : updateOutput
		}

	})();

	/**
	 * Init Tool
	 */
	var init = function init() {
		ButtonManager.init();
		InputSliderManager.init();
		PreviewMouseTracking.init("preview");
		Tool.init();
	}

	return {
		init : init
	}

})();

