'use strict';

window.addEventListener("load", function(){
	BoxShadow.init();
});

var BoxShadow = (function BoxShadow() {

	function getElemById(id) {
		return document.getElementById(id);
	}

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

		var cmax = Math.max(red, green, blue);
		var cmin = Math.min(red, green, blue);
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
		return value.toUpperCase();
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
		this.color.setHSV(180, 10, 90, 1);
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

	Shadow.prototype.toggleInset = function toggleInset() {
		this.inset = this.inset === true ? false : true;
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
		var info_hexa;
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
			offset = gradient_picker.clientWidth / 2;

			x = (color.saturation * size / 100) | 0;
			y = size - (color.value * size / 100) | 0;

			gradient_picker.style.left = x - offset + "px";
			gradient_picker.style.top = y - offset + "px";

			// Set hue pointer location
			size = hue_area.clientWidth;
			offset = hue_selector.clientWidth/2;
			x = (color.hue * size / 360 ) | 0;
			hue_selector.style.left = x - offset + "px";

			// Set alpha pointer location
			size = alpha_area.clientWidth;
			offset = alpha_selector.clientWidth/2;
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
			info_hexa.textContent = color.getHexa();
			output_color.style.backgroundColor = color.getRGBA();
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

		/*
		 * Observer
		 */
		var setColor = function setColor(obj) {
			if(obj instanceof Color !== true) {
			console.log("Typeof instance not Color");
				return;
			}

			color.copy(obj);
			updateUI();
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
			info_hexa		= getElemById("info_hexa");
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
			subscribers.indexOf(callback);
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

	/*
	 * Element Class
	 */
	var CssClass = function CssClass(id) {
		this.posX = 0;
		this.posY = 0;
		this.rotate = 0;
		this.width = 200;
		this.height = 100;
		this.display = true;
		this.bgcolor = new Color();
		this.id = id;
		this.node = getElemById('obj-' + id);
		this.shadowID = null;
		this.shadows = []
		this.render = [];
	}

	CssClass.prototype.center = function center() {
		this.posX = ((this.node.parentNode.clientWidth - this.node.clientWidth) / 2) | 0;
		this.posY = ((this.node.parentNode.clientHeight - this.node.clientHeight) / 2) | 0;

		this.node.style.top = this.posY + "px";
		this.node.style.left = this.posX + "px";
	}

	CssClass.prototype.updatePos = function updatePos(deltaX, deltaY) {
		this.posX += deltaX;
		this.posY += deltaY;
		this.node.style.top = this.posY + "px";
		this.node.style.left = this.posX + "px";
	}

	CssClass.prototype.setPosX = function setPosX(value) {
		this.posX = value;
		this.node.style.left = this.posX + "px";
	}

	CssClass.prototype.setPosY = function setPosY(value) {
		this.posY = value;
		this.node.style.left = this.posY + "px";
	}

	CssClass.prototype.setWidth = function setWidth(value) {
		this.width = value;
		this.node.style.width = this.width + "px";
	}

	CssClass.prototype.setHeight = function setHeight(value) {
		this.height = value;
		this.node.style.height = this.height + "px";
	}

	CssClass.prototype.setRotate = function setRotate(value) {
		this.rotate = value;
		this.node.style.transform = 'rotate(' + value +'deg)';
	}

	CssClass.prototype.toggleDisplay = function toggleDisplay(value) {
		if (value === undefined || typeof value !== "boolean" || this.display === value)
			return;

		this.display = value;
		var display = this.display === true ? "block" : "none";
		this.node.style.display = display;
		getElemById(this.id).style.display = display;
	}

	CssClass.prototype.updateBgColor = function updateBgColor(color) {
		this.bgcolor.copy(color);
		this.node.style.backgroundColor = color.getColor();
	}


	/**
	 * Tool Manager
	 */
	var Tool = (function Tool() {

		var preview;
		var classes = [];
		var active = null;
		var output;

		/*
		 * Toll actions
		 */
		var addCssClass = function addCssClass(id) {
			classes[id] = new CssClass(id);
			classes[id].center();
		}

		var setActiveClass = function setActiveClass(id) {
			active = classes[id];
			active.shadowID = null;
			ColoPicker.setColor(classes[id].bgcolor);
			SliderManager.setValue("rotate", active.rotate);
			SliderManager.setValue("width", active.width);
			SliderManager.setValue("height", active.height);
		}

		var addShadow = function addShadow() {
			var length = active.shadows.push(new Shadow());
			setActiveShadow(length - 1);
			update();
		}

		var deleteShadow = function deleteShadow(id) {
			delete active.shadows[id];
			delete active.render[id];
			update();
		}

		var addGlowEffect = function addGlowEffect(id) {

			var store = new Shadow();
			store.copy(active.shadows[id]);
			active.shadows[id].color.setRGBA(40, 125, 200, 1);
			active.shadows[id].blur = 10;
			active.shadows[id].spread = 10;

			active.node.style.transition = "box-shadow 0.2s";
			updateShadowCSS(id);
			update();

			setTimeout(function() {
				active.shadows[id].copy(store);
				updateShadowCSS(id);
				update();
				setTimeout(function() {
					active.node.style.removeProperty("transition");
				}, 100);
			}, 200);
		}

		var setActiveShadow = function setActiveShadow(id) {
			if (active.shadowID === id)
				return;

			active.shadowID = id;
			ColoPicker.setColor(active.shadows[id].color);
			SliderManager.setValue("blur", active.shadows[id].blur);
			SliderManager.setValue("spread", active.shadows[id].spread);
			SliderManager.setValue("posX", active.shadows[id].posX);
			SliderManager.setValue("posY", active.shadows[id].posY);

			addGlowEffect(id);
		}

		var updateActivePos = function updateActivePos(deltaX, deltaY) {
			if (active.shadowID === null)
				active.updatePos(deltaX, deltaY);
			else
				updateShadowPos(deltaX, deltaY);
		}

		var setActivePosX = function setActivePosX(value) {
			if (active.shadowID === null)
				active.setPosX(value);
			else
				setShadowPosX(value);
		}

		var setActivePosY = function setActivePosY(value) {
			if (active.shadowID === null)
				active.setPosY(value);
			else
				setShadowPosY(value);
		}

		/*
		 * Shadow properties
		 */
		var updateShadowCSS = function updateShadowCSS(id) {
			active.render[id] = active.shadows[id].computeCSS();
		}

		var toggleShadowInset = function toggleShadowInset() {
			if (active.shadowID === null)
				return;
			active.shadows[active.shadowID].toggleInset();
			updateShadowCSS(active.shadowID);
			update();
		}

		var updateShadowPos = function updateShadowPos(deltaX, deltaY) {
			var shadow = active.shadows[active.shadowID];
			shadow.posX += deltaX;
			shadow.posY += deltaY;
			SliderManager.setValue("posX", shadow.posX);
			SliderManager.setValue("posY", shadow.posY);
			updateShadowCSS(active.shadowID);
			update();
		}

		var setShadowPosX = function setShadowPosX(value) {
			if (active.shadowID === null)
				return;
			active.shadows[active.shadowID].posX = value;
			updateShadowCSS(active.shadowID);
			update();
		}

		var setShadowPosY = function setShadowPosY(value) {
			if (active.shadowID === null)
				return;
			active.shadows[active.shadowID].posY = value;
			updateShadowCSS(active.shadowID);
			update();
		}

		var setShadowBlur = function setShadowBlur(value) {
			if (active.shadowID === null)
				return;
			active.shadows[active.shadowID].blur = value;
			updateShadowCSS(active.shadowID);
			update();
		}

		var setShadowSpread = function setShadowSpread(value) {
			if (active.shadowID === null)
				return;
			active.shadows[active.shadowID].spread = value;
			updateShadowCSS(active.shadowID);
			update();
		}

		var updateShadowColor = function updateShadowColor(color) {
			active.shadows[active.shadowID].color.copy(color);
			updateShadowCSS(active.shadowID);
			update();
		}

		/*
		 * Element Properties
		 */


		var updateColor = function updateColor(color) {
			if (active.shadowID === null)
				active.updateBgColor(color);
			else
				updateShadowColor(color);
		}

		var update = function update() {
			var outputCSS = [];
			for (var i in active.render)
				if (active.render[i])
					outputCSS.push(active.render[i]);
			output.textContent = outputCSS.join(", \n");

			active.node.style.boxShadow = outputCSS.join(", ");
		}

		var init = function init() {
			preview = getElemById("preview");
			output  = getElemById("output");

			ColoPicker.subscribe(updateColor);
			PreviewMouseTracking.subscribe(updateActivePos);
			SliderManager.subscribe("posX", setActivePosX);
			SliderManager.subscribe("posY", setActivePosY);
			SliderManager.subscribe("blur", setShadowBlur);
			SliderManager.subscribe("spread", setShadowSpread);
			SliderManager.subscribe("rotate", function(value){
				active.setRotate(value)
			});
			SliderManager.subscribe("width", function(value){
				active.setWidth(value)
			});
			SliderManager.subscribe("height", function(value){
				active.setHeight(value)
			});


			classes['lm-before'].toggleDisplay(false);
			classes['lm-after'].toggleDisplay(false);

			var inset =  document.getElementById("sw_inset");
			var after =  document.getElementById("sw_after");
			var before =  document.getElementById("sw_before");

			inset.addEventListener("change", toggleShadowInset);
			before.addEventListener("change", function(e) {
				classes['lm-before'].toggleDisplay(e.target.checked);
			});
			after.addEventListener("change", function(e) {
				classes['lm-after'].toggleDisplay(e.target.checked);
			});
		}

		return {
			init 			: init,
			addShadow		: addShadow,
			addCssClass		: addCssClass,
			deleteShadow	: deleteShadow,
			setActiveClass	: setActiveClass,
			setActiveShadow : setActiveShadow,
			updateActivePos : updateActivePos
		}

	})();

	/**
	 * Layer Manager
	 */
	var LayerManager = (function LayerManager() {
		var layerManager;
		var container;
		var stacks = [];
		var active = {
			node : null,
			stack : null
		}

		var mouseEvents = function mouseEvents(e) {
			var node = e.target;
			var type = node.getAttribute('data-type');
			console.log('Action TYPE:', type);

			if (type === 'subject') {
				setActiveStack(stacks[node.id]);
			}

			if (type === 'add')
				active.stack.addLayer();

			if (type === 'layer')
				active.stack.setActiveLayer(node);

			if (type === 'delete')
				active.stack.deleteLayer(node.parentNode);
		}

		var setActiveStack = function setActiveStack(stackObj) {
			active.stack.hide();
			active.stack = stackObj;
			active.stack.show();
		}

		/*
		 * Stack object
		 */
		var Stack = function Stack(parent) {
			var S = document.createElement('div');
			var title = document.createElement('div');
			var stack = document.createElement('div');

			S.className = 'container';
			stack.className = 'stack';
			title.className = 'title';
			title.textContent = parent.getAttribute('data-title');
			S.appendChild(title);
			S.appendChild(stack);

			this.id = parent.id;
			this.container = S;
			this.stack = stack;
			this.parent = parent;
			this.order = [];
			this.count = 0;
			this.layer = null;
			this.layerID = 0;
		}

		Stack.prototype.addLayer = function addLayer() {
			var uid = this.getUID();
			var layer = this.createLayer(uid);
			this.stack.insertBefore(layer, this.layer);
			this.order.splice(this.layerID, 0, uid);
			Tool.addShadow();
			this.setActiveLayer(layer);
		}

		Stack.prototype.createLayer = function createLayer(uid) {
			var layer = document.createElement('div');
			var del = document.createElement('span');

			layer.className = 'node';
			layer.setAttribute('data-shid', uid);
			layer.setAttribute('data-type', 'layer');
			layer.textContent = 'shadow ' + uid;

			del.className = 'delete';
			del.setAttribute('data-type', 'delete');

			layer.appendChild(del);
			return layer;
		}

		Stack.prototype.getUID = function getUID() {
			return this.count++;
		}

		Stack.prototype.deleteLayer = function deleteLayer(node) {
			var same = false;
			if (this.layer === node) {
				same = true;
				this.layer = null;
			}

			var shadowID =  node.getAttribute('data-shid') | 0;
			var index = this.order.indexOf(shadowID);
			this.stack.removeChild(this.stack.children[index]);
			this.order.splice(index, 1);

			if (index < this.layerID)
				this.layerID--;

			if (same && this.stack.children.length >= 1) {
				this.layer = this.stack.children[0];
				this.layerID = 0;
			}

			if (same)
				this.show();

			Tool.deleteShadow(shadowID);
			console.log(this);
		}

		Stack.prototype.setActiveLayer = function setActiveLayer(node) {
			if (this.layer)
				this.layer.removeAttribute('data-active');

			this.layer = node;
			this.layer.setAttribute('data-active', 'layer');

			var shadowID =  node.getAttribute('data-shid') | 0;
			this.layerID = this.order.indexOf(shadowID);
			Tool.setActiveShadow(shadowID);
		}

		Stack.prototype.unsetActiveLayer = function unsetActiveLayer() {
			if (this.layer)
				this.layer.removeAttribute('data-active');

			if (this.stack.children.length >= 1)
				this.layer = this.stack.children[0];
			else
				this.layer = null;

			this.layerID = 0;
		}

		Stack.prototype.hide = function hide() {
			this.unsetActiveLayer();
			this.parent.removeAttribute('data-active');
			var style = this.container.style;
			style.left = '100%';
			style.zIndex = '0';
		}

		Stack.prototype.show = function show() {
			this.parent.setAttribute('data-active', 'subject');
			var style = this.container.style;
			style.left = '0';
			style.zIndex = '10';
			Tool.setActiveClass(this.id);
		}

		function init() {

			var elem, size;
			layerManager = getElemById("layer_manager");
			container = getElemById("stack_container");

			elem = document.querySelectorAll('[data-type="subject"]');
			size = elem.length;

			for (var i = 0; i < size; i++) {
				var S = new Stack(elem[i]);
				stacks[elem[i].id] = S;
				container.appendChild(S.container);
				Tool.addCssClass(elem[i].id);
			}

			active.stack = stacks['lm-elem'];
			stacks['lm-elem'].show();

			layerManager.addEventListener("click", mouseEvents);

		}

	/*
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
	*/
		return {
			init : init,
			setActiveStack : setActiveStack
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
			var snap = node.getAttribute('data-snap');
			var topic = node.getAttribute('data-topic');

			this.min = min !== null ? min | 0 : 0;
			this.max = max !== null ? max | 0 : 100;
			this.step = step !== null && this.step > 0 ? step | 0 : 1;
			this.value = value !== null && value > min && value < max ? value | 0 : 0;
			this.snap = snap === "true" ? 1 : 0;
			this.topic = topic;
			this.node = node;

			var pointer = document.createElement('div');
			pointer.className = 'ui-slider-pointer';
			node.appendChild(pointer);
			this.pointer = pointer;

			setMouseTracking(node, updateSlider.bind(this));

			subscribers[topic] = [];
			sliders[topic] = this;
			setValue(topic, this.value);
		}

		var sliderComponent = function sliderComponent(node) {
			var type = node.getAttribute('data-type');
			var topic = node.getAttribute('data-topic');
			if (type === "sub")
				node.addEventListener("click", decrement.bind(sliders[topic]));
			if (type === "add")
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
			var precision = value % this.step;
			value = value - precision + this.min;
			if (precision > this.step / 2)
				value = value + this.step;

			if (this.snap) {
				pos =  (value - this.min) * width / delta;
			}

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

			elem = document.querySelectorAll('.ui-slider-set');
			size = elem.length;
			for (var i = 0; i < size; i++)
				sliderComponent(elem[i]);

			elem = document.querySelectorAll('.ui-slider-get');
			size = elem.length;
			for (var i = 0; i < size; i++) {
				var topic = elem[i].getAttribute('data-topic');
				var unit = elem[i].getAttribute('data-unit');
				unit = (unit !== null) ? unit : '';
				subscribe(topic, function(value) {
					this.textContent = value + unit;
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
		LayerManager.init();
		PreviewMouseTracking.init("preview");
		Tool.init();
	}

	return {
		init : init
	}

})();

