'use strict';

/**
 * UI-SlidersManager
 */

var SliderManager = (function SliderManager() {

	var subscribers = {};
	var sliders = [];

	var Slider = function(node) {
		var min = node.getAttribute('data-min') | 0;
		var max = node.getAttribute('data-max') | 0;
		var step = node.getAttribute('data-step') | 0;
		var value = node.getAttribute('data-value') | 0;
		var snap = node.getAttribute('data-snap');
		var topic = node.getAttribute('data-topic');

		this.min = min;
		this.max = max > 0 ? max : 100;
		this.step = step === 0 ? 1 : step;
		this.value = value <= max && value >= min ? value : (min + max) / 2 | 0;
		this.snap = snap === "true" ? true : false;
		this.topic = topic;
		this.node = node;

		var pointer = document.createElement('div');
		pointer.className = 'ui-slider-pointer';
		node.appendChild(pointer);
		this.pointer = pointer;

		setMouseTracking(node, updateSlider.bind(this));

		sliders[topic] = this;
		setValue(topic, this.value);
	}

	var setButtonComponent = function setButtonComponent(node) {
		var type = node.getAttribute('data-type');
		var topic = node.getAttribute('data-topic');
		if (type === "sub") {
			node.textContent = '-';
			node.addEventListener("click", function() {
				decrement(topic);
			});
		}
		if (type === "add") {
			node.textContent = '+';
			node.addEventListener("click", function() {
				increment(topic);
			});
		}
	}

	var setInputComponent = function setInputComponent(node) {
		var topic		= node.getAttribute('data-topic');
		var unit_type	= node.getAttribute('data-unit');

		var input = document.createElement('input');
		var unit = document.createElement('span');
		unit.textContent = unit_type;

		input.setAttribute('type', 'text');
		node.appendChild(input);
		node.appendChild(unit);

		input.addEventListener('click', function(e) {
			this.select();
		});

		input.addEventListener('change', function(e) {
			setValue(topic, e.target.value | 0);
		});

		subscribe(topic, function(value) {
			node.children[0].value = value;
		});
	}

	var increment = function increment(topic) {
		var slider = sliders[topic];
		if (slider === null || slider === undefined)
			return;

		if (slider.value + slider.step <= slider.max) {
			slider.value += slider.step;
			setValue(slider.topic, slider.value)
			notify.call(slider);
		}
	};

	var decrement = function decrement(topic) {
		var slider = sliders[topic];
		if (slider === null || slider === undefined)
			return;

		if (slider.value - slider.step >= slider.min) {
			slider.value -= slider.step;
			setValue(topic, slider.value)
			notify.call(slider);
		}
	}

	// this = Slider object
	var updateSlider = function updateSlider(e) {
		var node = this.node;
		var pos = e.pageX - node.offsetLeft;
		var width = node.clientWidth;
		var delta = this.max - this.min;
		var offset = this.pointer.clientWidth + 4; // border width * 2

		if (pos < 0) pos = 0;
		if (pos > width) pos = width;

		var value = pos * delta / width | 0;
		var precision = value % this.step;
		value = value - precision + this.min;
		if (precision > this.step / 2)
			value = value + this.step;

		if (this.snap)
			pos =  (value - this.min) * width / delta;

		this.pointer.style.left = pos - offset/2 + "px";
		this.value = value;
		node.setAttribute('data-value', value);
		notify.call(this);
	}

	var setValue = function setValue(topic, value) {
		var slider = sliders[topic];

		if (value > slider.max || value < slider.min)
			return;

		var delta = slider.max - slider.min;
		var width = slider.node.clientWidth;
		var offset = slider.pointer.clientWidth;
		var pos =  (value - slider.min) * width / delta;
		slider.value = value;
		slider.pointer.style.left = pos - offset / 2 + "px";
		slider.node.setAttribute('data-value', value);
		notify.call(slider);
	}

	var setMouseTracking = function setMouseTracking(elem, callback) {
		elem.addEventListener("mousedown", function(e) {
			callback(e);
			document.addEventListener("mousemove", callback);
		});

		document.addEventListener("mouseup", function(e) {
			document.removeEventListener("mousemove", callback);
		});
	}

	var subscribe = function subscribe(topic, callback) {
		if (subscribers[topic] === undefined)
			subscribers[topic] = [];
		subscribers[topic].push(callback);
	}

	var unsubscribe = function unsubscribe(topic, callback) {
		subscribers[topic].indexOf(callback);
		subscribers[topic].splice(index, 1);
	}

	var notify = function notify() {
		if (subscribers[this.topic] === undefined)
			return;

		for (var i in subscribers[this.topic]) {
			subscribers[this.topic][i](this.value);
		}
	}

	var init = function init() {
		var elem, size;

		elem = document.querySelectorAll('.ui-slider-btn-set');
		size = elem.length;
		for (var i = 0; i < size; i++)
			setButtonComponent(elem[i]);

		elem = document.querySelectorAll('.ui-slider-input');
		size = elem.length;
		for (var i = 0; i < size; i++)
			setInputComponent(elem[i]);

		elem = document.querySelectorAll('.ui-slider');
		size = elem.length;
		for (var i = 0; i < size; i++)
			new Slider(elem[i]);
	}

	return {
		init : init,
		setValue : setValue,
		subscribe : subscribe,
		unsubscribe : unsubscribe
	}

})();



