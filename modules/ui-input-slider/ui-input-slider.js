'use strict';

/**
 * UI-SlidersManager
 */

var InputSliderManager = (function InputSliderManager() {

	var subscribers = {};
	var sliders = [];

	var InputComponent = function InputComponent(obj) {
		var input = document.createElement('input');
		input.setAttribute('type', 'text');

		input.addEventListener('click', function(e) {
			this.select();
		});

		input.addEventListener('change', function(e) {
			var value = parseInt(e.target.value);

			if (isNaN(value) === true)
				setValue(obj.topic, obj.value);
			else
				setValue(obj.topic, value);
		});

		subscribe(obj.topic, function(value) {
			input.value = value + obj.unit;
		});

		return input;
	}

	var SliderComponent = function SliderComponent(obj, sign) {
		var slider = document.createElement('div');
		var startX = null;
		var start_value = 0;

		slider.addEventListener("click", function(e) {
			setValue(obj.topic, obj.value + obj.step * sign);
		});

		slider.addEventListener("mousedown", function(e) {
			startX = e.clientX;
			start_value = obj.value;
			document.body.style.cursor = "e-resize";
			document.addEventListener("mousemove", sliderMotion);
		});

		document.addEventListener("mouseup", function(e) {
			document.removeEventListener("mousemove", sliderMotion);
			document.body.style.cursor = "auto";
			slider.style.cursor = "pointer";
		});

		var sliderMotion = function sliderMotion(e) {
			slider.style.cursor = "e-resize";
			var delta = (e.clientX - startX) / obj.sensivity | 0;
			var value = delta * obj.step + start_value;
			setValue(obj.topic, value);
		}

		return slider;
	}

	var InputSlider = function(node) {
		var min		= node.getAttribute('data-min') | 0;
		var max		= node.getAttribute('data-max') | 0;
		var step	= node.getAttribute('data-step') | 0;
		var value	= node.getAttribute('data-value') | 0;
		var topic	= node.getAttribute('data-topic');
		var unit	= node.getAttribute('data-unit');
		var name 	= node.getAttribute('data-info');
		var sensivity = node.getAttribute('data-sensivity') | 0;

		this.min = min;
		this.max = max > 0 ? max : 100;
		this.step = step === 0 ? 1 : step;
		this.topic = topic;
		this.node = node;
		this.unit = unit;
		this.sensivity = sensivity > 0 ? sensivity : 5;

		var input = new InputComponent(this);
		var slider_left  = new SliderComponent(this, -1);
		var slider_right = new SliderComponent(this,  1);

		slider_left.className = 'ui-input-slider-left';
		slider_right.className = 'ui-input-slider-right';

		if (name) {
			var info = document.createElement('span');
			info.className = 'ui-input-slider-info';
			info.textContent = name;
			node.appendChild(info);
		}

		node.appendChild(slider_left);
		node.appendChild(input);
		node.appendChild(slider_right);
		node.className = 'ui-input-slider ui-input-slider-container';

		this.input = input;
		sliders[topic] = this;
		setValue(topic, value);
	}

	var setValue = function setValue(topic, value, send_notify) {
		var slider = sliders[topic];
		if (slider === undefined)
			return;

		if (value > slider.max) value = slider.max;
		if (value < slider.min)	value = slider.min;

		slider.value = value;
		slider.node.setAttribute('data-value', value);

		if (send_notify !== undefined && send_notify === false) {
			slider.input.value = value + slider.unit;
			return;
		}

		notify.call(slider);
	}

	var setMax = function setMax(topic, value) {
		var slider = sliders[topic];
		if (slider === undefined)
			return;

		slider.max = value;
		setValue(topic, slider.value);
	}

	var setMin = function setMin(topic, value) {
		var slider = sliders[topic];
		if (slider === undefined)
			return;

		slider.min = value;
		setValue(topic, slider.value);
	}

	var setUnit = function setUnit(topic, unit) {
		var slider = sliders[topic];
		if (slider === undefined)
			return;

		slider.unit = unit;
		setValue(topic, slider.value);
	}

	var getNode =  function getNode(topic) {
		return sliders[topic].node;
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
		for (var i in subscribers[this.topic]) {
			subscribers[this.topic][i](this.value);
		}
	}

	var init = function init() {
		var elem = document.querySelectorAll('.ui-input-slider');
		var size = elem.length;
		for (var i = 0; i < size; i++)
			new InputSlider(elem[i]);
	}

	return {
		init : init,
		setMax : setMax,
		setMin : setMin,
		setUnit : setUnit,
		getNode : getNode,
		setValue : setValue,
		subscribe : subscribe,
		unsubscribe : unsubscribe
	}

})();