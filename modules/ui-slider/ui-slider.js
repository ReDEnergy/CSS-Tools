/**
 * UI-SlidersManager
 */

var SliderManager = (function SliderManager() {
	'use strict';

	var subscribers = {};
	var sliders = [];

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

	var Slider = function(node) {
		var topic = node.getAttribute('data-topic');
		var info = node.getAttribute('data-info');
		var unit = node.getAttribute('data-unit');
		var min = node.getAttribute('data-min') | 0;
		var max = node.getAttribute('data-max') | 0;
		var step = node.getAttribute('data-step') | 0;
		var value = node.getAttribute('data-value') | 0;
		var snap = node.getAttribute('data-snap');

		this.min = min;
		this.max = max > 0 ? max : 100;
		this.step = step === 0 ? 1 : step;
		this.value = value <= max && value >= min ? value : (min + max) / 2 | 0;
		this.snap = snap === "true" ? true : false;
		this.topic = topic;
		this.unit = unit;

		var name = document.createElement('div');
		var slider = document.createElement('div');
		var pointer = document.createElement('div');

		name.className = 'ui-slider-name';
		name.textContent = info;

		slider.className = 'ui-slider-slider';
		pointer.className = 'ui-slider-pointer';

		node.appendChild(name);
		slider.appendChild(pointer);

		this.pointer = pointer;
		this.slider = slider;
		this.node = node;

		this.createSetButton('-', this.decrement.bind(this));
		node.appendChild(slider);
		this.createSetButton('+', this.increment.bind(this));
		this.createInputField();

		new trackMouse(slider, this.updateSlider.bind(this), this.startMove.bind(this));
		slider.addEventListener('click', function(e) {
			this.startMove();
			this.updateSlider(e);
		}.bind(this));

		sliders[topic] = this;
		this.setValue(this.value);
	};

	Slider.prototype.createSetButton = function createSetButton(type, callback) {
		var button = document.createElement('div');
		button.className = 'ui-slider-button';
		button.textContent = type;
		button.addEventListener("click", callback);
		this.node.appendChild(button);
	};

	Slider.prototype.createInputField = function createInputField() {
		var input = document.createElement('input');
		input.setAttribute('type', 'text');
		this.node.appendChild(input);

		input.addEventListener('click', function(e) {
			this.select();
		});

		input.addEventListener('change', function(e) {
			this.setValue(e.target.value | 0);
		}.bind(this));

		subscribe(this.topic, function(value) {
			input.value = value + this.unit;
		}.bind(this));
	};

	Slider.prototype.startMove = function startMove(e) {
		this.sliderX = this.slider.getBoundingClientRect().left;
	};

	Slider.prototype.updateSlider = function updateSlider(e) {
		var width = this.slider.clientWidth;
		var pos = e.clientX - this.sliderX;
		var delta = this.max - this.min;

		if (pos < 0) pos = 0;
		if (pos > width) pos = width;

		var value = pos * delta / width | 0;
		var precision = value % this.step;
		value = value - precision + this.min;

		if (precision > this.step / 2)
			value = value + this.step;

		if (this.snap)
			pos =  (value - this.min) * width / delta;

		this.pointer.style.left = pos + "px";
		this.value = value;
		notify.call(this);
	};

	Slider.prototype.increment = function increment() {
		this.setValue(this.value + this.step);
	};

	Slider.prototype.decrement = function decrement() {
		this.setValue(this.value - this.step);
	};

	Slider.prototype.setValue = function setValue(value) {
		if (value > this.max || value < this.min)
			return;

		var delta = this.max - this.min;
		var width = this.slider.clientWidth;
		var pos =  (value - this.min) * width / delta | 0;
		this.value = value;
		this.pointer.style.left = pos + "px";
		notify.call(this);
	};

	var setValue = function setValue(topic, value) {
		var slider = sliders[topic];
		slider.setValue(value);
	};

	var subscribe = function subscribe(topic, callback) {
		if (subscribers[topic] === undefined)
			subscribers[topic] = [];
		subscribers[topic].push(callback);
	};

	var unsubscribe = function unsubscribe(topic, callback) {
		subscribers[topic].indexOf(callback);
		subscribers[topic].splice(index, 1);
	};

	var notify = function notify() {
		if (subscribers[this.topic] === undefined)
			return;
		for (var i = 0; i < subscribers[this.topic].length; i++)
			subscribers[this.topic][i](this.value);
	};

	var init = function init() {
		var elem = document.querySelectorAll('.ui-slider');
		var size = elem.length;
		for (var i = 0; i < size; i++)
			new Slider(elem[i]);
	};

	return {
		init : init,
		setValue : setValue,
		subscribe : subscribe,
		unsubscribe : unsubscribe
	};

})();



