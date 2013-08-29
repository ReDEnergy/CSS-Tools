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
		input.style.width = 50 + obj.precision * 10 + 'px';

		input.addEventListener('click', function(e) {
			this.select();
		});

		input.addEventListener('change', function(e) {
			var value = parseFloat(e.target.value);

			if (isNaN(value) === true)
				setValue(obj.topic, obj.value);
			else
				setValue(obj.topic, value);
		});

		return input;
	};

	var SliderComponent = function SliderComponent(obj, sign) {
		var slider = document.createElement('div');
		var startX = null;
		var start_value = 0;

		slider.addEventListener("click", function(e) {
			document.removeEventListener("mousemove", sliderMotion);
			setValue(obj.topic, obj.value + obj.step * sign);
		});

		slider.addEventListener("mousedown", function(e) {
			startX = e.clientX;
			start_value = obj.value;
			document.body.style.cursor = "e-resize";

			document.addEventListener("mouseup", slideEnd);
			document.addEventListener("mousemove", sliderMotion);
		});

		var slideEnd = function slideEnd(e) {
			document.removeEventListener("mousemove", sliderMotion);
			document.body.style.cursor = "auto";
			slider.style.cursor = "pointer";
		};

		var sliderMotion = function sliderMotion(e) {
			slider.style.cursor = "e-resize";
			var delta = (e.clientX - startX) / obj.sensivity | 0;
			var value = delta * obj.step + start_value;
			setValue(obj.topic, value);
		};

		return slider;
	};

	var InputSlider = function(node) {
		var min		= parseFloat(node.getAttribute('data-min'));
		var max		= parseFloat(node.getAttribute('data-max'));
		var step	= parseFloat(node.getAttribute('data-step'));
		var value	= parseFloat(node.getAttribute('data-value'));
		var topic	= node.getAttribute('data-topic');
		var unit	= node.getAttribute('data-unit');
		var name 	= node.getAttribute('data-info');
		var sensivity = node.getAttribute('data-sensivity') | 0;
		var precision = node.getAttribute('data-precision') | 0;

		this.min = isNaN(min) ? 0 : min;
		this.max = isNaN(max) ? 100 : max;
		this.precision = precision >= 0 ? precision : 0;
		this.step = step < 0 || isNaN(step) ? 1 : step.toFixed(precision);
		this.topic = topic;
		this.node = node;
		this.unit = unit === null ? '' : unit;
		this.sensivity = sensivity > 0 ? sensivity : 5;
		value = isNaN(value) ? this.min : value;

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

		this.input = input;
		sliders[topic] = this;
		setValue(topic, value);
	};

	InputSlider.prototype.setInputValue = function setInputValue() {
		this.input.value = this.value.toFixed(this.precision) + this.unit;
	};

	var setValue = function setValue(topic, value, send_notify) {
		var slider = sliders[topic];
		if (slider === undefined)
			return;

		value = parseFloat(value.toFixed(slider.precision));

		if (value > slider.max) value = slider.max;
		if (value < slider.min)	value = slider.min;

		slider.value = value;
		slider.node.setAttribute('data-value', value);

		slider.setInputValue();

		if (send_notify === false)
			return;

		notify.call(slider);
	};

	var setMax = function setMax(topic, value) {
		var slider = sliders[topic];
		if (slider === undefined)
			return;

		slider.max = value;
		setValue(topic, slider.value);
	};

	var setMin = function setMin(topic, value) {
		var slider = sliders[topic];
		if (slider === undefined)
			return;

		slider.min = value;
		setValue(topic, slider.value);
	};

	var setUnit = function setUnit(topic, unit) {
		var slider = sliders[topic];
		if (slider === undefined)
			return;

		slider.unit = unit;
		setValue(topic, slider.value);
	};

	var setStep = function setStep(topic, value) {
		var slider = sliders[topic];
		if (slider === undefined)
			return;

		slider.step = parseFloat(value);
		setValue(topic, slider.value);
	};

	var setPrecision = function setPrecision(topic, value) {
		var slider = sliders[topic];
		if (slider === undefined)
			return;

		value = value | 0;
		slider.precision = value;

		var step = parseFloat(slider.step.toFixed(value));
		if (step === 0)
			slider.step = 1 / Math.pow(10, value);

		setValue(topic, slider.value);
	};

	var setSensivity = function setSensivity(topic, value) {
		var slider = sliders[topic];
		if (slider === undefined)
			return;

		value = value | 0;

		slider.sensivity = value > 0 ? value : 5;
	};

	var getNode =  function getNode(topic) {
		return sliders[topic].node;
	};

	var getPrecision =  function getPrecision(topic) {
		return sliders[topic].precision;
	};

	var getStep =  function getStep(topic) {
		return sliders[topic].step;
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

	var createSlider = function createSlider(topic, label) {
		var slider = document.createElement('div');
		slider.className = 'ui-input-slider';
		slider.setAttribute('data-topic', topic);

		if (label !== undefined)
			slider.setAttribute('data-info', label);

		new InputSlider(slider);
		return slider;
	};

	var init = function init() {
		var elem = document.querySelectorAll('.ui-input-slider');
		var size = elem.length;
		for (var i = 0; i < size; i++)
			new InputSlider(elem[i]);
	};

	return {
		init : init,
		setMax : setMax,
		setMin : setMin,
		setUnit : setUnit,
		setStep : setStep,
		getNode : getNode,
		getStep : getStep,
		setValue : setValue,
		subscribe : subscribe,
		unsubscribe : unsubscribe,
		setPrecision : setPrecision,
		setSensivity : setSensivity,
		getPrecision : getPrecision,
		createSlider : createSlider,
	};

})();