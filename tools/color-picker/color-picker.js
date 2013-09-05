'use strict';

window.addEventListener("load", function() {
	ColorPickerTool.init();
});

var ColorPickerTool = (function ColorPickerTool() {

	/*========== Get DOM Element By ID ==========*/

	function getElemById(id) {
		return document.getElementById(id);
	}

	function allowDropEvent(e) {
		e.preventDefault();
	}

	/*========== Make an element resizable relative to it's parent ==========*/

	var UIComponent = (function UIComponent() {

		function makeResizable(elem, axis) {
			var valueX = 0;
			var valueY = 0;
			var action = 0;

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

		/*========== Make an element draggable relative to it's parent ==========*/

		var makeDraggable = function makeDraggable(elem, endFunction) {

			var offsetTop;
			var offsetLeft;

			elem.setAttribute('data-draggable', 'true');

			var dragStart = function dragStart(e) {
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
			};

			elem.addEventListener('mousedown', dragStart, false);
		};

		return {
			makeResizable : makeResizable,
			makeDraggable : makeDraggable
		};

	})();

	/*========== Color Class ==========*/

	var Color = UIColorPicker.Color;

	/**
	 * ColorInfo
	 */
	var ColorInfo = (function ColorInfo() {

		var info_box;
		var RGBA;
		var HEXA;
		var HSLA;

		var updateInfo = function updateInfo(color) {
			if (color.a === 1) {
				RGBA.info.textContent = 'RGB';
				HSLA.info.textContent = 'HSL';
			}
			else {
				RGBA.info.textContent = 'RGBA';
				HSLA.info.textContent = 'HSLA';
			}

			RGBA.value.textContent = color.getRGBA();
			HSLA.value.textContent = color.getHSLA();
			HEXA.value.textContent = color.getHexa();
		};

		var InfoProperty = function InfoProperty(info) {

			var node = document.createElement('div');
			var title = document.createElement('div');
			var value = document.createElement('div');

			node.className = 'property';
			title.className = 'title';
			value.className = 'value';

			title.textContent = info;

			node.appendChild(title);
			node.appendChild(value);

			this.node = node;
			this.value = value;
			this.info = title;

			info_box.appendChild(node);
		};

		var init = function init() {

			info_box = getElemById('color-info');

			RGBA = new InfoProperty('RGBA');
			HSLA = new InfoProperty('HSLA');
			HEXA = new InfoProperty('HEXA');

			UIColorPicker.subscribe('picker', updateInfo);

		};

		return {
			init: init
		};

	})();

	/**
	 * ColorPicker Samples
	 */
	var ColorPickerSamples = (function ColorPickerSamples() {

		var samples = [];
		var active = null;
		var container = null;
		var canvas = null;
		var base_color = new Color();
		base_color.setHSL(0, 0, 100);

		var ColorSample = function ColorSample() {
			var node = document.createElement('div');
			node.className = 'sample';

			this.id = samples.length;
			this.node = node;
			this.color = new Color(base_color);
			console.log(this.color);

			node.setAttribute('sample-id', this.id);
			node.setAttribute('draggable', 'true');

			node.addEventListener('dragstart', this.dragStart.bind(this));
			node.addEventListener('dragover' , allowDropEvent);
			node.addEventListener('drop'     , this.dragDrop.bind(this));

			samples.push(this);
			return node;
		};

		ColorSample.prototype.updateBgColor = function updateBgColor() {
			this.node.style.backgroundColor = this.color.getColor();
		};

		ColorSample.prototype.updateColor = function updateColor(color) {
			this.color.copy(color);
			this.updateBgColor();
		};

		ColorSample.prototype.activate = function activate() {
			console.log(this.color);
			UIColorPicker.setColor('picker', this.color);
			this.node.setAttribute('data-active', 'active');
		};

		ColorSample.prototype.deactivate = function deactivate() {
			this.node.removeAttribute('data-active');
		};

		ColorSample.prototype.dragStart = function dragStart(e) {
			e.dataTransfer.setData('sampleID', this.id);
			e.dataTransfer.setData('location', 'picker-samples');
		};

		ColorSample.prototype.dragDrop = function dragDrop(e) {
			var sampleID = e.dataTransfer.getData('sampleID');
			var location = e.dataTransfer.getData('location');

			this.color = Tool.getSampleColorFrom(e);
			this.updateBgColor();
		};

		var createNewSample = function createNewSample(e) {
			var sampleID = e.dataTransfer.getData('sampleID');
			var location = e.dataTransfer.getData('location');

			if (sampleID && location) {
				var sample = new ColorSample();
				sample.updateColor(Tool.getSampleColorFrom(e));
				canvas.insertBefore(sample, canvas.lastChildElement);
			}
		};

		var createNewSampleButton = function createNewSampleButton() {
			var button = document.createElement('div');
			button.id = 'add-sample';
			button.addEventListener('click', function() {
				var sample = new ColorSample();
				container.insertBefore(sample, button);
			});
			container.appendChild(button);
		};

		var activateSample = function activateSample(e) {
			if (e.target.className !== 'sample')
				return;

			if (active)
				active.deactivate();

			active = samples[e.target.getAttribute('sample-id')];
			active.activate();
		};

		var getSampleColor = function getSampleColor(id) {
			if (samples[id] !== undefined && samples[id]!== null)
				return new Color(samples[id].color);
		};

		var init = function init() {
			container = getElemById('color-samples');

			for (var i=0; i<6; i++)
				container.appendChild(new ColorSample());

			createNewSampleButton();

			active = samples[0];
			active.activate();

			container.addEventListener('click', activateSample);
			container.addEventListener('dragover', allowDropEvent);
			container.addEventListener('drop', createNewSample);

			UIColorPicker.subscribe('picker', function(color){
				active.updateColor(color);
			});
			UIComponent.makeResizable(container, 'height');

		};

		return {
			init : init,
			getSampleColor : getSampleColor
		};

	})();

	/**
	 * ColorPalette
	 */
	var ColorPalette = (function ColorPalette() {

		var samples = [];
		var color_palette;
		var complementary;

		var ColorSample = function ColorSample(id) {
			var node = document.createElement('div');
			node.className = 'sample';

			this.id = samples.length;
			this.node = node;
			this.color = new Color();

			node.setAttribute('sample-id', this.id);
			node.setAttribute('draggable', 'true');
			node.addEventListener('dragstart', this.dragStart.bind(this));
			node.addEventListener('click', this.pickColor.bind(this));

			samples.push(this);
		};

		ColorSample.prototype.updateBgColor = function updateBgColor() {
			this.node.style.backgroundColor = this.color.getColor();
		};

		ColorSample.prototype.updateColor = function updateColor(color) {
			this.color.copy(color);
			this.updateBgColor();
		};

		ColorSample.prototype.updateHue = function updateHue(color, degree, steps) {
			this.color.copy(color);
			var hue = (steps * degree + this.color.hue) % 360;
			if (hue < 0) hue += 360;
			this.color.setHue(hue);
			this.updateBgColor();
		};

		ColorSample.prototype.updateSaturation = function updateSaturation(color, value, steps) {
			var saturation = color.saturation + value * steps;
			if (saturation <= 0) {
				this.node.setAttribute('data-disabled', 'true');
				return;
			}

			this.node.removeAttribute('data-disabled', 'true');
			this.color.copy(color);
			this.color.setSaturation(saturation);
			this.updateBgColor();
		};

		ColorSample.prototype.updateLightness = function updateLightness(color, value, steps) {
			var lightness = color.lightness + value * steps;
			if (lightness <= 0) {
				this.node.setAttribute('data-disabled', 'true');
				return;
			}
			this.node.removeAttribute('data-disabled', 'true');
			this.color.copy(color);
			this.color.setLightness(lightness);
			this.updateBgColor();
		};

		ColorSample.prototype.updateBrightness = function updateBrightness(color, value, steps) {
			var brightness = color.value + value * steps;
			if (brightness <= 0) {
				this.node.setAttribute('data-disabled', 'true');
				return;
			}
			this.node.removeAttribute('data-disabled', 'true');
			this.color.copy(color);
			this.color.setValue(brightness);
			this.updateBgColor();
		};

		ColorSample.prototype.updateAlpha = function updateAlpha(color, value, steps) {
			var alpha = parseFloat(color.a) + value * steps;
			if (alpha <= 0) {
				this.node.setAttribute('data-disabled', 'true');
				return;
			}
			this.node.removeAttribute('data-disabled', 'true');
			this.color.copy(color);
			this.color.a = parseFloat(alpha.toFixed(2));
			this.updateBgColor();
		};

		ColorSample.prototype.pickColor = function pickColor() {
			UIColorPicker.setColor('picker', this.color);
		};

		ColorSample.prototype.dragStart = function dragStart(e) {
			e.dataTransfer.setData('sampleID', this.id);
			e.dataTransfer.setData('location', 'palette-samples');
		};

		var createHuePalette = function createHuePalette() {
			var palette = document.createElement('div');
			var hue_samples = [];
			palette.className = 'palette';

			for(var i = 0; i < 12; i++) {
				var sample = new ColorSample();
				palette.appendChild(sample.node);
				hue_samples.push(sample);
			}

			UIColorPicker.subscribe('picker', function(color) {
				for(var i = 0; i < 12; i++) {
					hue_samples[i].updateHue(color, 30, i);
				}
			});

			color_palette.appendChild(palette);
		};

		var createSaturationPalette = function createSaturationPalette() {
			var palette = document.createElement('div');
			var sat_samples = [];
			palette.className = 'palette';

			for(var i = 0; i < 11; i++) {
				var sample = new ColorSample();
				palette.appendChild(sample.node);
				sat_samples.push(sample);
			}

			UIColorPicker.subscribe('picker', function(color) {
				for(var i = 0; i < 11; i++) {
					sat_samples[i].updateSaturation(color, -10, i);
				}
			});

			color_palette.appendChild(palette);
		};

		/* Brightness or Lightness - depends on the picker mode */
		var createVLPalette = function createSaturationPalette() {
			var palette = document.createElement('div');
			var vl_samples = [];
			palette.className = 'palette';

			for(var i = 0; i < 11; i++) {
				var sample = new ColorSample();
				palette.appendChild(sample.node);
				vl_samples.push(sample);
			}

			UIColorPicker.subscribe('picker', function(color) {
				for(var i = 0; i < 11; i++) {
					if(color.format === 'HSL')
						vl_samples[i].updateLightness(color, -10, i);
					else
						vl_samples[i].updateBrightness(color, -10, i);
				}
			});

			color_palette.appendChild(palette);
		};

		var createAlphaPalette = function createAlphaPalette() {
			var palette = document.createElement('div');
			var alpha_samples = [];
			palette.className = 'palette';

			for(var i = 0; i < 10; i++) {
				var sample = new ColorSample();
				palette.appendChild(sample.node);
				alpha_samples.push(sample);
			}

			UIColorPicker.subscribe('picker', function(color) {
				for(var i = 0; i < 10; i++) {
					alpha_samples[i].updateAlpha(color, -0.1, i);
				}
			});

			color_palette.appendChild(palette);
		};

		var getSampleColor = function getSampleColor(id) {
			if (samples[id] !== undefined && samples[id]!== null)
				return new Color(samples[id].color);
		};

		var init = function init() {
			color_palette = getElemById('color-palette');

			createHuePalette();
			createSaturationPalette();
			createVLPalette();
			createAlphaPalette();

		};

		return {
			init : init,
			getSampleColor : getSampleColor
		};

	})();

	var Tool = (function Tool() {

		var canvas_content = null;
		var canvas = null;
		var samples = [];
		var drag_image = new Image();
		var picker_preview_color;

		var CanvasSample = function CanvasSample(color, posX, posY) {

			var node = document.createElement('div');
			var delete_btn = document.createElement('div');
			node.className = 'sample';
			delete_btn.className = 'delete';

			this.id = samples.length;
			this.node = node;
			this.color = color;
			this.updateBgColor();

			node.style.top = posY - 50 + 'px';
			node.style.left = posX - 50 + 'px';
			node.setAttribute('sample-id', this.id);
			node.appendChild(delete_btn);
			delete_btn.addEventListener('click', this.deleteSample.bind(this));

			UIComponent.makeDraggable(node);
			UIComponent.makeResizable(node);

			samples.push(this);
			return node;
		};

		CanvasSample.prototype.updateBgColor = function updateBgColor() {
			this.node.style.backgroundColor = this.color.getColor();
		};

		CanvasSample.prototype.updateColor = function updateColor(color) {
			this.color.copy(color);
			this.updateBgColor();
		};

		CanvasSample.prototype.deleteSample = function deleteSample() {
			canvas.removeChild(this.node);
			samples[this.id] = null;
		};

		CanvasSample.prototype.updatePosition = function updatePosition(posX, posY) {
			this.node.style.top = posY - this.startY + 'px';
			this.node.style.left = posX - this.startX + 'px';
		};

		var canvasDropEvent = function canvasDropEvent(e) {
			var sampleID = e.dataTransfer.getData('sampleID');
			var location = e.dataTransfer.getData('location');

			if (sampleID && location) {
				var offsetX = e.pageX - canvas.offsetParent.offsetLeft;
				var offsetY = e.pageY - canvas.offsetParent.offsetTop;
				var color = getSampleColorFrom(e);
				var sample = new CanvasSample(color, offsetX, offsetY);
				canvas.appendChild(sample);
			}
		};

		var deleteSample = function deleteSample(e) {
			var sampleID = e.dataTransfer.getData('canvas-sampleID');
			if (sampleID)
				samples[sampleID].deleteSample();
		};

		var getSampleColorFrom = function getSampleColorFrom(e) {
			var sampleID = e.dataTransfer.getData('sampleID');
			var location = e.dataTransfer.getData('location');

			console.log(sampleID, location);

			if (location === 'picker-samples')
				return ColorPickerSamples.getSampleColor(sampleID);
			if (location === 'palette-samples')
				return ColorPalette.getSampleColor(sampleID);
		};

		var init = function init() {
			canvas = getElemById('canvas');
			canvas_content = getElemById('canvas-content');

			canvas.addEventListener('dragover', allowDropEvent);
			canvas.addEventListener('drop', canvasDropEvent);

			var color = new Color();
			color.setHSL(0, 51, 51);
			UIColorPicker.setColor('picker', color);

			UIComponent.makeResizable(canvas_content, 'height');
		};

		return {
			init : init,
			getSampleColorFrom : getSampleColorFrom
		};

	})();

	var init = function init() {
		UIColorPicker.init();
		ColorInfo.init();
		ColorPalette.init();
		ColorPickerSamples.init();
		Tool.init();
	};

	return {
		init : init
	};

})();



