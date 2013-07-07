'use strict';

window.addEventListener("load", function(){
	BoxShadow.init();
});

var BoxShadow = (function BoxShadow() {

	function getElemById(id) {
		return document.getElementById(id);
	}

	var subject;
	var preview;
	var SubjectObj = {
		posX : 0,
		posY : 0
	}

	SubjectObj.center = function center() {
		SubjectObj.posX = ((preview.clientWidth - subject.clientWidth) / 2) | 0;
		SubjectObj.posY = ((preview.clientHeight - subject.clientHeight) / 2) | 0;

		subject.style.top = SubjectObj.posY + "px";
		subject.style.left = SubjectObj.posX + "px";
	}

/*
	var Observer = (function Observer() {
		var topics = [];
		var subscribers = [];


		var publish = function publish(topic, data) {

		}

		var subscribe = function subscribe(topic, callback) {
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
			var sla = document.querySelectorAll('.ui-slider');
			var size = sla.length;
			for (var i = 0; i < size; i++)
				new Slider(sla[i]);
		}

		return {
			init : init,
			setValue : setValue,
			subscribe : subscribe,
			unsubscribe : unsubscribe
		}
	})()
*/

	/**
	 * RGBA Color class
	 */

	function Color() {
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.a = 1;
		this.hue = 0;
		this.saturation = 0;
		this.value = 0;
	}

	Color.prototype.copy = function copy(obj) {
		if(obj instanceof Color !== true) {
			console.log("Typeof instance not Color");
			return;
		}

		this.r = obj.r;
		this.g = obj.g;
		this.b = obj.b;
		this.a = obj.a;
		this.hue = obj.hue;
		this.saturation = obj.saturation;
		this.value = obj.value;
	}

	Color.prototype.setRGBA = function setRGBA(red, green, blue, alpha) {
		if (red != undefined)
			this.r = red | 0;
		if (green != undefined)
			this.g = green | 0;
		if (blue != undefined)
			this.b = blue | 0;
		if (alpha != undefined)
			this.a = alpha | 0;
	}

	/**
	 * HSV/HSB (hue, saturation, value / brightness)
	 * @param hue			0-360
	 * @param saturation	0-100
	 * @param value 		0-100
	 */
	Color.prototype.setHSV = function setHSV(hue, saturation, value) {
		this.hue = hue;
		this.saturation = saturation;
		this.value = value;
		this.updateRGB();
	}

	Color.prototype.updateRGB = function updateRGB() {
		var sat = this.saturation / 100;
		var value = this.value / 100;
		var C = sat * value;
		var H = this.hue / 60;
		var X = C * (1 - Math.abs(H % 2 - 1));
		var m = value - C;
		var precision = 255;

		C = (C + m) * precision;
		X = (X + m) * precision;
		m = m * precision;

		if (H >= 0 && H < 1) {	this.setRGBA(C, X, m);	return; }
		if (H >= 1 && H < 2) {	this.setRGBA(X, C, m);	return; }
		if (H >= 2 && H < 3) {	this.setRGBA(m, C, X);	return; }
		if (H >= 3 && H < 4) {	this.setRGBA(m, X, C);	return; }
		if (H >= 4 && H < 5) {	this.setRGBA(X, m, C);	return; }
		if (H >= 5 && H < 6) {	this.setRGBA(C, m, X);	return; }
	}

	Color.prototype.updateHSV = function updateHSV() {
		var red		= this.r / 255;
		var green	= this.g / 255;
		var blue	= this.b / 255;

		var cmax = Math.max(red, Math.max(green, blue));
		var cmin = Math.min(red, Math.min(green, blue));
		var delta = cmax - cmin;
		var hue = 0;
		var saturation = 0;

		if (delta) {
			if (cmax === red ) { hue = ((green - blue) / delta) % 6;}
			if (cmax === blue ) { hue = ((blue - red) / delta) + 2; }
			if (cmax === green ) { hue = ((red - green) / delta) + 4; }
			if (cmax) saturation = delta / cmax;
		}
		this.hue = 60 * hue;
		this.saturation = (saturation * 100) | 0;
		this.value = (cmax * 100) | 0;
	}

	Color.prototype.setHexa = function setHexa(hred, hgreen, hblue) {
		this.r = parseInt(hred, 16);
		this.g = parseInt(hgreen, 16);
		this.b = parseInt(hblue, 16);
		this.alpha	= 1;
	}

	Color.prototype.getHexa = function getHexa() {
		var r = this.r.toString(16);
		var g = this.g.toString(16);
		var b = this.b.toString(16);
		if (this.r < 16) r = '0' + r;
		if (this.g < 16) g = '0' + g;
		if (this.b < 16) b = '0' + b;
		var value = '#' + r + g + b;
		return value;
	}

	Color.prototype.getRGBA = function getRGBA() {

		var rgb = "(" + this.r + ", " + this.g + ", " + this.b;
		var a = '';
		var v = '';
		if (this.a !== 1) {
			a = 'a';
			v = ', ' + this.a;
		}

		var value = "rgb" + a + rgb + v + ")";
		return value;
	}

	Color.prototype.getColor = function getColor() {
		if (this.a | 0 === 1)
			return this.getHexa();
		return this.getRGBA();
	}

	/**
	 * Shadow Object
	 */
	function Shadow() {
		this.inset  = false;
		this.posX   = 5;
		this.posY   = -5;
		this.blur   = 10;
		this.spread = 0;
		this.color  = new Color();
		this.color.setHSV(0, 50, 50, 1);
	}

	Shadow.prototype.computeCSS = function computeCSS() {
		var value = "";
		if (this.inset === true)
			value += "inset ";
		value += this.posX + "px ";
		value += this.posY + "px ";
		value += this.blur + "px ";
		value += this.spread + "px ";
		value += this.color.getColor();

		return value;
	}

	Shadow.prototype.copy = function copy(obj) {
		if(obj instanceof Shadow !== true) {
			console.log("Typeof instance not Shadow");
			return;
		}

		this.inset  = obj.inset;
		this.posX   = obj.posX;
		this.posY   = obj.posY;
		this.blur   = obj.blur;
		this.spread = obj.spread;
		this.color.copy(obj.color);
	}

	/**
	 * Shadow dragging
	 */
	var PreviewMouseTracking = (function Drag() {
		var active = false;
		var lastX = 0;
		var lastY = 0;

		var init = function init() {
			preview.addEventListener('mousedown', dragStart, false);
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
			Tool.updateActivePos(e.clientX - lastX, e.clientY - lastY);
			lastX = e.clientX;
			lastY = e.clientY;
		}

		return {
			init : init
		}

	})();

	/**
	 * Color Picker
	 */
	var ColoPicker = (function ColoPicker() {

		var colorpicker;
		var hue_area;
		var gradient_area;
		var alpha_area;
		var gradient_picker;
		var hue_selector;
		var alpha_selector;
		var pick_object;
		var info_rgb;
		var info_hsv;
		var output_color;
		var color = new Color();
		var subscribers = [];

		var updateColor = function updateColor(e) {
			var x = e.pageX - gradient_area.offsetLeft;
			var y = e.pageY - gradient_area.offsetTop;

			// width and height should be the same
			var size = gradient_area.clientWidth;

			if (x > size)
				x = size;
			if (y > size)
				y = size;

			if (x < 0) x = 0;
			if (y < 0) y = 0;

			var value = 100 - (y * 100 / size) | 0;
			var saturation = x * 100 / size | 0;

			color.setHSV(color.hue, saturation, value);
			// should update just
			// color pointer location
			updateUI();
			notify();
		}

		var updateHue = function updateHue(e) {
			var x = e.pageX - hue_area.offsetLeft;
			var width = hue_area.clientWidth;

			if (x < 0) x = 0;
			if (x > width) x = width;

			var hue = ((360 * x) / width) | 0;
			if (hue === 360) hue = 359;

			color.setHSV(hue, color.saturation, color.value);

			// should update just
			// hue pointer location
			// picker area background
			// alpha area background
			updateUI();
			notify();
		}

		var updateAlpha = function updateAlpha(e) {
			var x = e.pageX - alpha_area.offsetLeft;
			var width = alpha_area.clientWidth;

			if (x < 0) x = 0;
			if (x > width) x = width;

			color.a = (x / width).toFixed(2);

			// should update just
			// alpha pointer location
			updateUI();
			notify();
		}

		var setHueGfx = function setHueGfx(hue) {
			var sat = color.saturation;
			var val = color.value;
			var alpha = color.a;

			color.setHSV(hue, 100, 100);
			gradient_area.style.backgroundColor = color.getHexa();

			color.a = 0;
			var start = color.getRGBA();
			color.a = 1;
			var end = color.getRGBA();
			color.a = alpha;

			var gradient = '-moz-linear-gradient(left, ' +	start + '0%, ' + end + ' 100%)';
			alpha_area.style.background = gradient;
		}

		var updateUI = function updateUI() {
			var x, y;		// coordinates
			var size;		// size of the area
			var offset;		// pointer graphic selector offset

			// Set color pointer location
			size = gradient_area.clientWidth;
			offset = gradient_picker.clientWidth / 2 + 2;

			x = (color.saturation * size / 100) | 0;
			y = size - (color.value * size / 100) | 0;

			gradient_picker.style.left = x - offset + "px";
			gradient_picker.style.top = y - offset + "px";

			// Set hue pointer location
			size = hue_area.clientWidth;
			offset = hue_selector.clientWidth/2 + 2;
			x = (color.hue * size / 360 ) | 0;
			hue_selector.style.left = x - offset + "px";

			// Set alpha pointer location
			size = alpha_area.clientWidth;
			offset = alpha_selector.clientWidth/2 + 2;
			x = (color.a * size) | 0;
			alpha_selector.style.left = x - offset + "px";

			// Set picker area background
			var nc = new Color();
			nc.copy(color);
			if (nc.hue === 360) nc.hue = 0;
			nc.setHSV(nc.hue, 100, 100);
			gradient_area.style.backgroundColor = nc.getHexa();

			// Set alpha area background
			nc.copy(color);
			nc.a = 0;
			var start = nc.getRGBA();
			nc.a = 1;
			var end = nc.getRGBA();
			var gradient = '-moz-linear-gradient(left, ' +	start + '0%, ' + end + ' 100%)';
			alpha_area.style.background = gradient;

			// Update color info
			info_rgb.textContent = color.getRGBA();
			info_hsv.textContent = "HSV " + color.hue + " " + color.saturation + " " + color.value;
			output_color.style.backgroundColor = color.getRGBA();
		}

		var setColor = function setColor(obj) {
			if(obj instanceof Color !== true) {
			console.log("Typeof instance not Color");
				return;
			}

			color.copy(obj);
			updateUI();
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

		var subscribe = function subscribe(callback) {
			subscribers.push(callback);
		}

		var unsubscribe = function unsubscribe(callback) {
			subscribers.indexOf(callback);
			subscribers.splice(index, 1);
		}

		var notify = function notify() {
			for (var i in subscribers)
				subscribers[i](color);
		}

		var init = function init() {
			colorpicker		= getElemById("colorpicker");
			hue_area		= getElemById("hue");
			gradient_area	= getElemById("gradient");
			alpha_area		= getElemById("alpha");
			gradient_picker	= getElemById("gradient_picker");
			hue_selector	= getElemById("hue_selector");
			alpha_selector	= getElemById("alpha_selector");
			info_rgb		= getElemById("info_rgb");
			info_hsv		= getElemById("info_hsv");
			output_color	= getElemById("output_color");

			setMouseTracking(gradient_area, updateColor);
			setMouseTracking(hue_area, updateHue);
			setMouseTracking(alpha_area, updateAlpha);
			color.setHSV(180, 50, 50);
			updateUI();
		}

		return {
			init : init,
			setColor : setColor,
			subscribe : subscribe,
			unsubscribe : unsubscribe
		}

	})();

	/**
	 * Tool Manager
	 */
	var Tool = (function Tool() {
		var shadowID = null;
		var shadows = [];
		var render = [];
		var active = null;
		var output;

		var addShadow = function addShadow() {
			var length = shadows.push(new Shadow());
			setActiveShadow(length - 1);
			update();
		}

		var setActiveShadow = function setActiveShadow(id) {
			if (shadowID === id)
				return;

			shadowID = id;
			ColoPicker.setColor(shadows[id].color);
			SliderManager.setValue("blur", shadows[id].blur);
			SliderManager.setValue("spread", shadows[id].spread);
			addGlowEffect(id);
		}

		var setActiveObject =  function setActiveObject(item) {
			shadowID = null;
			if (item === 0)
				active = subject;
		}

		var updateActivePos = function updateActivePos(deltaX, deltaY) {
			if (shadowID === null)
				updateObjPos(deltaX, deltaY);
			else
				updateShadowPos(deltaX, deltaY);
		}

		var renderShadow = function renderShadow(id) {
			render[id] = shadows[id].computeCSS();
		}

		var updateShadowPos = function updateShadowPos(deltaX, deltaY) {
			shadows[shadowID].posX += deltaX;
			shadows[shadowID].posY += deltaY;
			renderShadow(shadowID);
			update();
		}

		var updateShadowBlur = function updateShadowBlur(value) {
			if (shadowID === null)
				return;
			shadows[shadowID].blur = value;
			renderShadow(shadowID);
			update();
		}

		var updateShadowSpread = function updateShadowSpread(value) {
			if (shadowID === null)
				return;
			shadows[shadowID].spread = value;
			renderShadow(shadowID);
			update();
		}

		var updateColor = function updateColor(color) {
			if (shadowID === null) {
				subject.style.backgroundColor = color.getColor();
				return;
			}

			shadows[shadowID].color.copy(color);
			renderShadow(shadowID);
			update();
		}

		var updateObjPos = function updateObjPos(deltaX, deltaY) {
			SubjectObj.posX += deltaX;
			SubjectObj.posY += deltaY;
			subject.style.top = SubjectObj.posY + "px";
			subject.style.left = SubjectObj.posX + "px";
		}

		var update = function update() {
			var outputCSS = [];
			for (var i in render)
				if (render[i])
					outputCSS.push(render[i]);
			output.textContent = outputCSS.join(", \n");

			subject.style.boxShadow = outputCSS.join(", ");
		}

		var deleteShadow = function deleteShadow(id) {
			delete shadows[id];
			delete render[id];
			if (shadowID === id)
				active = subject;
			update();
		}

		var addGlowEffect = function addGlowEffect(id) {

			var store = new Shadow();
			store.copy(shadows[id]);
			shadows[id].color.setRGBA(40, 125, 200, 1);
			shadows[id].blur = 10;
			shadows[id].spread = 10;

			subject.style.transition = "box-shadow 0.2s";
			renderShadow(id);
			update();

			setTimeout(function() {
				shadows[id].copy(store);
				renderShadow(id);
				update();
				setTimeout(function() {
					subject.style.removeProperty("transition");
				}, 100);
			}, 200);

		}

		var init = function init() {
			subject = getElemById("subject");
			preview = getElemById("preview");
			output  = getElemById("output");

			SubjectObj.center();
			ColoPicker.subscribe(updateColor);
			SliderManager.subscribe("blur", updateShadowBlur);
			SliderManager.subscribe("spread", updateShadowSpread);
		}

		return {
			init : init,
			addShadow : addShadow,
			updateColor : updateColor,
			updateActivePos : updateActivePos,
			setActiveShadow : setActiveShadow,
			setActiveObject : setActiveObject,
			deleteShadow : deleteShadow
		}

	})();

	/**
	 * Layer Manager
	 */
	var LayerManager = (function LayerManager() {
		var layer_ID = 0;
		var activeLayer = null;
		var nr = 0;
		var order = [];
		var stack;
		var add_btn;
		var Subject = {
			before : null,
			after : null,
			elem : null
		}

		var activateSubject = function activateSubject() {
			switchActiveLayerTo(Subject.elem);
			Tool.setActiveObject(0);
		}

		var clickShadowStack = function clickShadowStack(e) {
			if (e.target.className === "layer") {
				switchActiveLayerTo(e.target);

				var shadow_ID = e.target.getAttribute("sid") | 0;
				layer_ID = order.indexOf(shadow_ID);

				Tool.setActiveShadow(shadow_ID);
			}

			if (e.target.className === "delete") {
				var layer = e.target.parentNode;
				var shadow_ID = layer.getAttribute("sid") | 0;
				var index = order.indexOf(shadow_ID);

				order.splice(index, 1);
				stack.removeChild(layer);
				Tool.deleteShadow(shadow_ID);
				if (activeLayer === layer)
					activateSubject();
			}
		}

		var getActiveNodeLayer = function getActiveNodeLayer() {
			if(stack.childElementCount === 0)
				return null;

			return stack.children[layer_ID];
		}

		var switchActiveLayerTo = function switchActiveLayerTo(node) {
			if (activeLayer !== null)
				activeLayer.removeAttribute("active");

			activeLayer = node;
			activeLayer.setAttribute("active", "true");
		}

		var addLayer = function addLayer() {
			var layer = createLayer();
			switchActiveLayerTo(layer);
			Tool.addShadow();
			stack.insertBefore(layer, getActiveNodeLayer());
			order.splice(layer_ID, 0, nr++);
		}

		var createLayer = function createLayer() {
			var elem = document.createElement("div");
			var del = document.createElement("span");
			elem.className = 'layer';
			elem.setAttribute('sid', nr);
			elem.textContent = 'shadow ' + nr;
			del.className = 'delete';
			elem.appendChild(del);
			return elem;
		}

		var dragEvent = function dragEvent(e) {
			if (e.target.className === "layer") {
				document.addEventListener("mousemove", drag);
				document.addEventListener("mouseup", dragEnd);
			}
		}

		var dragStart = function dragStart(e) {

		}

		var dragEnd = function dragEnd(e) {
			document.removeEventListener("mousemove", drag);
		}

		var drag = function drag(e) {

		}

		function init() {
			Subject.elem = getElemById("subject_layer");
			Subject.before = getElemById("subject_before");
			Subject.after = getElemById("subject_after");

			stack = getElemById("shadow_stack");

			add_btn = getElemById("new_layer");

			add_btn.addEventListener("click", addLayer);
			stack.addEventListener("click", clickShadowStack);
			stack.addEventListener("mousedown", dragEvent);
			Subject.elem.addEventListener("click", activateSubject);

			switchActiveLayerTo(Subject.elem);
		}

		return {
			init : init,
		}

	})();

	// TODO optimize math
	// TODO snapping
	/**
	 * UI-SlidersManager
	 */
	var SliderManager = (function SliderManager() {

		var subscribers = {};
		var sliders = [];

		var Slider = function(node) {
			var min = node.getAttribute('data-min');
			var max = node.getAttribute('data-max');
			var step = node.getAttribute('data-step');
			var value = node.getAttribute('data-value');
			// var snap = node.getAttribute('data-snap');

			this.min = min !== null ? min | 0 : 0;
			this.max = max !== null ? max | 0 : 100;
			this.step = step !== null ? step | 0 : 1;
			this.value = value !== null && value > min && value < max ? value | 0 : 0;
			// this.snap = snap === "true" ? true : false;
			this.topic = node.id;
			this.node = node;

			var pointer = document.createElement('div');
			pointer.className = 'ui-slider-pointer';
			node.appendChild(pointer);
			this.pointer = pointer;

			setMouseTracking(node, updateSlider.bind(this));

			subscribers[node.id] = [];
			sliders[node.id] = this;
		}

		var sliderComponent = function sliderComponent(node) {
			var type = node.getAttribute('data-type');
			var topic = node.getAttribute('data-topic');
			if (type === "sub")
				node.addEventListener("click", decrement.bind(sliders[topic]));
			else
				node.addEventListener("click", increment.bind(sliders[topic]));
		}

		var increment = function increment() {
			if (this.value + this.step <= this.max) {
				this.value += this.step;
				setValue(this.topic, this.value)
				notify.call(this);
			}
		};

		var decrement = function decrement() {
			if (this.value - this.step >= this.min) {
				this.value -= this.step;
				setValue(this.topic, this.value)
				notify.call(this);
			}
		}

		// this = Slider object
		var updateSlider = function updateSlider(e) {
			var node = this.node;
			var pos = e.pageX - node.offsetLeft;
			var width = node.clientWidth;
			var delta = this.max - this.min;
			var offset = this.pointer.clientWidth;

			if (pos < 0) pos = 0;
			if (pos > width) pos = width;

			var value = pos * delta / width | 0;
			value = value - value % this.step + this.min;

			this.pointer.style.left = pos - offset + "px";
			this.value = value;
			node.setAttribute('data-value', value);
			notify.call(this);
		}

		var setValue = function setValue(topic, value) {
			var slider = sliders[topic];
			var delta = slider.max - slider.min;
			var width = slider.node.clientWidth;
			var offset = slider.pointer.clientWidth;
			var pos =  (value - slider.min) * width / delta;
			slider.value = value;
			slider.pointer.style.left = pos - offset + 'px';
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
			var elem = document.querySelectorAll('.ui-slider');
			var size = elem.length;
			for (var i = 0; i < size; i++)
				new Slider(elem[i]);

			var elem = document.querySelectorAll('.ui-slider-set');
			var size = elem.length;
			for (var i = 0; i < size; i++)
				sliderComponent(elem[i]);

			var elem = document.querySelectorAll('.ui-slider-get');
			var size = elem.length;
			for (var i = 0; i < size; i++) {
				var topic = elem[i].getAttribute('data-topic');
				subscribe(topic, function(value){
					this.textContent = value + "px";
				}.bind(elem[i]));
			}
		}

		return {
			init : init,
			setValue : setValue,
			subscribe : subscribe,
			unsubscribe : unsubscribe
		}

	})();

	/**
	 * Init Tool
	 */
	var init = function init() {
		ColoPicker.init();
		SliderManager.init();
		Tool.init();
		PreviewMouseTracking.init();
		LayerManager.init();
	}

	return {
		init : init
	}

})();

