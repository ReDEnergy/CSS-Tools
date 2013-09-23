window.addEventListener("load", function() {
	ColorPickerTool.init();
});

var ColorPickerTool = (function ColorPickerTool() {
	'use strict';

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
	var HSLColor = UIColorPicker.HSLColor;

	/**
	 * ColorPalette
	 */
	var ColorPalette = (function ColorPalette() {

		var samples = [];
		var color_palette;
		var complementary;

		var hideNode = function(node) {
			node.setAttribute('data-hidden', 'true');
		};

		var ColorSample = function ColorSample(id) {
			var node = document.createElement('div');
			node.className = 'sample';

			this.uid = samples.length;
			this.node = node;
			this.color = new Color();

			node.setAttribute('sample-id', this.uid);
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
				this.node.setAttribute('data-hidden', 'true');
				return;
			}

			this.node.removeAttribute('data-hidden');
			this.color.copy(color);
			this.color.setSaturation(saturation);
			this.updateBgColor();
		};

		ColorSample.prototype.updateLightness = function updateLightness(color, value, steps) {
			var lightness = color.lightness + value * steps;
			if (lightness <= 0) {
				this.node.setAttribute('data-hidden', 'true');
				return;
			}
			this.node.removeAttribute('data-hidden');
			this.color.copy(color);
			this.color.setLightness(lightness);
			this.updateBgColor();
		};

		ColorSample.prototype.updateBrightness = function updateBrightness(color, value, steps) {
			var brightness = color.value + value * steps;
			if (brightness <= 0) {
				this.node.setAttribute('data-hidden', 'true');
				return;
			}
			this.node.removeAttribute('data-hidden');
			this.color.copy(color);
			this.color.setValue(brightness);
			this.updateBgColor();
		};

		ColorSample.prototype.updateAlpha = function updateAlpha(color, value, steps) {
			var alpha = parseFloat(color.a) + value * steps;
			if (alpha <= 0) {
				this.node.setAttribute('data-hidden', 'true');
				return;
			}
			this.node.removeAttribute('data-hidden');
			this.color.copy(color);
			this.color.a = parseFloat(alpha.toFixed(2));
			this.updateBgColor();
		};

		ColorSample.prototype.pickColor = function pickColor() {
			UIColorPicker.setColor('picker', this.color);
		};

		ColorSample.prototype.dragStart = function dragStart(e) {
			e.dataTransfer.setData('sampleID', this.uid);
			e.dataTransfer.setData('location', 'palette-samples');
		};

		var Palette = function Palette(text, size) {
			this.samples = [];
			this.locked = false;

			var palette = document.createElement('div');
			var title = document.createElement('div');
			var controls = document.createElement('div');
			var container = document.createElement('div');
			var lock = document.createElement('div');

			container.className = 'container';
			title.className = 'title';
			palette.className = 'palette';
			controls.className = 'controls';
			lock.className = 'lock';
			title.textContent = text;

			controls.appendChild(lock);
			container.appendChild(title);
			container.appendChild(controls);
			container.appendChild(palette);

			lock.addEventListener('click', function () {
				this.locked = !this.locked;
				lock.setAttribute('locked-state', this.locked);
			}.bind(this));

			for(var i = 0; i < size; i++) {
				var sample = new ColorSample();
				this.samples.push(sample);
				palette.appendChild(sample.node);
			}

			this.container = container;
			this.title = title;
		};

		var createHuePalette = function createHuePalette() {
			var palette = new Palette('Hue', 12);

			UIColorPicker.subscribe('picker', function(color) {
				if (palette.locked === true)
					return;

				for(var i = 0; i < 12; i++) {
					palette.samples[i].updateHue(color, 30, i);
				}
			});

			color_palette.appendChild(palette.container);
		};

		var createSaturationPalette = function createSaturationPalette() {
			var palette = new Palette('Saturation', 11);

			UIColorPicker.subscribe('picker', function(color) {
				if (palette.locked === true)
					return;

				for(var i = 0; i < 11; i++) {
					palette.samples[i].updateSaturation(color, -10, i);
				}
			});

			color_palette.appendChild(palette.container);
		};

		/* Brightness or Lightness - depends on the picker mode */
		var createVLPalette = function createSaturationPalette() {
			var palette = new Palette('Lightness', 11);

			UIColorPicker.subscribe('picker', function(color) {
				if (palette.locked === true)
					return;

				if(color.format === 'HSL') {
					palette.title.textContent = 'Lightness';
					for(var i = 0; i < 11; i++)
						palette.samples[i].updateLightness(color, -10, i);
				}
				else {
					palette.title.textContent = 'Value';
					for(var i = 0; i < 11; i++)
						palette.samples[i].updateBrightness(color, -10, i);
				}
			});

			color_palette.appendChild(palette.container);
		};

		var isBlankPalette = function isBlankPalette(container, value) {
			if (value === 0) {
				container.setAttribute('data-collapsed', 'true');
				return true;
			}

			container.removeAttribute('data-collapsed');
			return false;
		};

		var createAlphaPalette = function createAlphaPalette() {
			var palette = new Palette('Alpha', 10);

			UIColorPicker.subscribe('picker', function(color) {
				if (palette.locked === true)
					return;

				for(var i = 0; i < 10; i++) {
					palette.samples[i].updateAlpha(color, -0.1, i);
				}
			});

			color_palette.appendChild(palette.container);
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

	/**
	 * ColorInfo
	 */
	var ColorInfo = (function ColorInfo() {

		var info_box;
		var select;
		var RGBA;
		var HEXA;
		var HSLA;

		var updateInfo = function updateInfo(color) {
			if (color.a | 0 === 1) {
				RGBA.info.textContent = 'RGB';
				HSLA.info.textContent = 'HSL';
			}
			else {
				RGBA.info.textContent = 'RGBA';
				HSLA.info.textContent = 'HSLA';
			}

			RGBA.value.value = color.getRGBA();
			HSLA.value.value = color.getHSLA();
			HEXA.value.value = color.getHexa();
		};

		var InfoProperty = function InfoProperty(info) {

			var node = document.createElement('div');
			var title = document.createElement('div');
			var value = document.createElement('input');
			var copy = document.createElement('div');

			node.className = 'property';
			title.className = 'type';
			value.className = 'value';
			copy.className = 'copy';

			title.textContent = info;
			value.setAttribute('type', 'text');

			copy.addEventListener('click', function() {
				value.select();
			});

			node.appendChild(title);
			node.appendChild(value);
			node.appendChild(copy);

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
		var nr_samples = 0;
		var active = null;
		var container = null;
		var	samples_per_line = 10;
		var trash_can = null;
		var base_color = new HSLColor(0, 50, 100);
		var add_btn;
		var add_btn_pos;

		var ColorSample = function ColorSample() {
			var node = document.createElement('div');
			node.className = 'sample';

			this.uid = samples.length;
			this.index = nr_samples++;
			this.node = node;
			this.color = new Color(base_color);

			node.setAttribute('sample-id', this.uid);
			node.setAttribute('draggable', 'true');

			node.addEventListener('dragstart', this.dragStart.bind(this));
			node.addEventListener('dragover' , allowDropEvent);
			node.addEventListener('drop'     , this.dragDrop.bind(this));

			this.updatePosition(this.index);
			this.updateBgColor();
			samples.push(this);
		};

		ColorSample.prototype.updateBgColor = function updateBgColor() {
			this.node.style.backgroundColor = this.color.getColor();
		};

		ColorSample.prototype.updatePosition = function updatePosition(index) {
			this.index = index;
			this.posY = 5 + ((index / samples_per_line) | 0) * 52;
			this.posX = 5 + ((index % samples_per_line) | 0) * 52;
			this.node.style.top  = this.posY + 'px';
			this.node.style.left = this.posX + 'px';
		};

		ColorSample.prototype.updateColor = function updateColor(color) {
			this.color.copy(color);
			this.updateBgColor();
		};

		ColorSample.prototype.activate = function activate() {
			UIColorPicker.setColor('picker', this.color);
			this.node.setAttribute('data-active', 'true');
		};

		ColorSample.prototype.deactivate = function deactivate() {
			this.node.removeAttribute('data-active');
		};

		ColorSample.prototype.dragStart = function dragStart(e) {
			e.dataTransfer.setData('sampleID', this.uid);
			e.dataTransfer.setData('location', 'picker-samples');
		};

		ColorSample.prototype.dragDrop = function dragDrop(e) {
			e.stopPropagation();
			this.color = Tool.getSampleColorFrom(e);
			this.updateBgColor();
		};

		ColorSample.prototype.deleteSample = function deleteSample() {
			container.removeChild(this.node);
			samples[this.uid] = null;
			nr_samples--;
		};

		var updateUI = function updateUI() {
			updateContainerProp();

			var index = 0;
			var nr = samples.length;
			for (var i=0; i < nr; i++)
				if (samples[i] !== null) {
					samples[i].updatePosition(index);
					index++;
				}

			AddSampleButton.updatePosition(index);
		};

		var deleteSample = function deleteSample(e) {
			trash_can.parentElement.setAttribute('drag-state', 'none');

			var location = e.dataTransfer.getData('location');
			if (location !== 'picker-samples')
				return;

			var sampleID = e.dataTransfer.getData('sampleID');
			samples[sampleID].deleteSample();
			console.log(samples);

			updateUI();
		};

		var createDropSample = function createDropSample() {
			var sample = document.createElement('div');
			sample.id = 'drop-effect-sample';
			sample.className = 'sample';
			container.appendChild(sample);
		};

		var setActivateSample = function setActivateSample(e) {
			if (e.target.className !== 'sample')
				return;

			unsetActiveSample(active);
			Tool.unsetVoidSample();
			CanvasSamples.unsetActiveSample();
			active = samples[e.target.getAttribute('sample-id')];
			active.activate();
		};

		var unsetActiveSample = function unsetActiveSample() {
			if (active)
				active.deactivate();
			active = null;
		};

		var getSampleColor = function getSampleColor(id) {
			if (samples[id] !== undefined && samples[id]!== null)
				return new Color(samples[id].color);
		};

		var updateContainerProp = function updateContainerProp() {
			samples_per_line = ((container.clientWidth - 5) / 52) | 0;
			var height = 52 * (1 + (nr_samples / samples_per_line) | 0);
			container.style.height = height + 10 + 'px';
		};

		var AddSampleButton = (function AddSampleButton() {
			var node;
			var _index = 0;
			var _posX;
			var _posY;

			var updatePosition = function updatePosition(index) {
				_index = index;
				_posY = 5 + ((index / samples_per_line) | 0) * 52;
				_posX = 5 + ((index % samples_per_line) | 0) * 52;

				node.style.top  = _posY + 'px';
				node.style.left = _posX + 'px';
			};

			var addButtonClick = function addButtonClick() {
				var sample = new ColorSample();
				container.appendChild(sample.node);
				updatePosition(_index + 1);
				updateUI();
			};

			var init = function init() {
				node = document.createElement('div');
				var icon = document.createElement('div');

				node.className = 'sample';
				icon.id = 'add-icon';
				node.appendChild(icon);
				node.addEventListener('click', addButtonClick);

				updatePosition(0);
				container.appendChild(node);
			};

			return {
				init : init,
				updatePosition : updatePosition
			};
		})();

		var init = function init() {
			container = getElemById('picker-samples');
			trash_can = getElemById('trash-can');

			AddSampleButton.init();

			for (var i=0; i<16; i++) {
				var sample = new ColorSample();
				container.appendChild(sample.node);
			}

			AddSampleButton.updatePosition(samples.length);
			updateUI();

			active = samples[0];
			active.activate();

			container.addEventListener('click', setActivateSample);

			trash_can.addEventListener('dragover', allowDropEvent);
			trash_can.addEventListener('dragenter', function() {
				this.parentElement.setAttribute('drag-state', 'enter');
			});
			trash_can.addEventListener('dragleave', function(e) {
				this.parentElement.setAttribute('drag-state', 'none');
			});
			trash_can.addEventListener('drop', deleteSample);

			UIColorPicker.subscribe('picker', function(color) {
				if (active)
					active.updateColor(color);
			});

		};

		return {
			init : init,
			getSampleColor : getSampleColor,
			unsetActiveSample : unsetActiveSample
		};

	})();

	/**
	 * Canvas Samples
	 */
	var CanvasSamples = (function CanvasSamples() {

		var active = null;
		var canvas = null;
		var samples = [];
		var zindex = null;
		var tutorial = true;

		var CanvasSample = function CanvasSample(color, posX, posY) {

			var node = document.createElement('div');
			var pick = document.createElement('div');
			var delete_btn = document.createElement('div');
			node.className = 'sample';
			pick.className = 'pick';
			delete_btn.className = 'delete';

			this.uid = samples.length;
			this.node = node;
			this.color = color;
			this.updateBgColor();
			this.zIndex = 1;

			node.style.top = posY - 50 + 'px';
			node.style.left = posX - 50 + 'px';
			node.setAttribute('sample-id', this.uid);

			node.appendChild(pick);
			node.appendChild(delete_btn);

			var activate = function activate() {
				setActiveSample(this);
			}.bind(this);

			node.addEventListener('dblclick', activate);
			pick.addEventListener('click', activate);
			delete_btn.addEventListener('click', this.deleteSample.bind(this));

			UIComponent.makeDraggable(node);
			UIComponent.makeResizable(node);

			samples.push(this);
			canvas.appendChild(node);
			return this;
		};

		CanvasSample.prototype.updateBgColor = function updateBgColor() {
			this.node.style.backgroundColor = this.color.getColor();
		};

		CanvasSample.prototype.updateColor = function updateColor(color) {
			this.color.copy(color);
			this.updateBgColor();
		};

		CanvasSample.prototype.updateZIndex = function updateZIndex(value) {
			this.zIndex = value;
			this.node.style.zIndex = value;
		};

		CanvasSample.prototype.activate = function activate() {
			this.node.setAttribute('data-active', 'true');
			zindex.setAttribute('data-active', 'true');

			UIColorPicker.setColor('picker', this.color);
			InputSliderManager.setValue('z-index', this.zIndex);
		};

		CanvasSample.prototype.deactivate = function deactivate() {
			this.node.removeAttribute('data-active');
			zindex.removeAttribute('data-active');
		};

		CanvasSample.prototype.deleteSample = function deleteSample() {
			if (active === this)
				unsetActiveSample();
			canvas.removeChild(this.node);
			samples[this.uid] = null;
		};

		CanvasSample.prototype.updatePosition = function updatePosition(posX, posY) {
			this.node.style.top = posY - this.startY + 'px';
			this.node.style.left = posX - this.startX + 'px';
		};

		var canvasDropEvent = function canvasDropEvent(e) {
			var color = Tool.getSampleColorFrom(e);

			if (color) {
				var offsetX = e.pageX - canvas.offsetLeft;
				var offsetY = e.pageY - canvas.offsetTop;
				var sample = new CanvasSample(color, offsetX, offsetY);
				if (tutorial) {
					tutorial = false;
					canvas.removeAttribute('data-tutorial');
					var info = new CanvasSample(new Color(), 100, 100);
					info.node.setAttribute('data-tutorial', 'dblclick');
				}
			}

		};

		var setActiveSample = function setActiveSample(sample) {
			ColorPickerSamples.unsetActiveSample();
			Tool.unsetVoidSample();
			unsetActiveSample();
			active = sample;
			active.activate();
		};

		var unsetActiveSample = function unsetActiveSample() {
			if (active)
				active.deactivate();
			active = null;
		};

		var createToggleBgButton = function createToggleBgButton() {
			var button = document.createElement('div');
			var state = false;
			button.className = 'toggle-bg';
			canvas.appendChild(button);

			button.addEventListener('click', function() {
				state = !state;
				canvas.setAttribute('data-bg', state);
			});
		};

		var init = function init() {
			canvas = getElemById('canvas');
			zindex = getElemById('zindex');

			canvas.addEventListener('dragover', allowDropEvent);
			canvas.addEventListener('drop', canvasDropEvent);

			createToggleBgButton();

			UIColorPicker.subscribe('picker', function(color) {
				if (active)	active.updateColor(color);
			});

			InputSliderManager.subscribe('z-index', function (value) {
				if (active)	active.updateZIndex(value);
			});

			UIComponent.makeResizable(canvas, 'height');
		};

		return {
			init : init,
			unsetActiveSample : unsetActiveSample
		};

	})();

	var StateButton = function StateButton(node, state) {
		this.state = false;
		this.callback = null;

		node.addEventListener('click', function() {
			this.state = !this.state;
			if (typeof this.callback === "function")
				this.callback(this.state);
		}.bind(this));
	};

	StateButton.prototype.set = function set() {
		this.state = true;
		if (typeof this.callback === "function")
			this.callback(this.state);
	};

	StateButton.prototype.unset = function unset() {
		this.state = false;
		if (typeof this.callback === "function")
			this.callback(this.state);
	};

	StateButton.prototype.subscribe = function subscribe(func) {
		this.callback = func;
	};


	/**
	 * Tool
	 */
	var Tool = (function Tool() {

		var samples = [];
		var controls = null;
		var void_sw;

		var createPickerModeSwitch = function createPickerModeSwitch() {
			var parent = getElemById('controls');
			var icon = document.createElement('div');
			var button = document.createElement('div');
			var hsv = document.createElement('div');
			var hsl = document.createElement('div');
			var active = null;

			icon.className = 'icon picker-icon';
			button.className = 'switch';
			button.appendChild(hsv);
			button.appendChild(hsl);

			hsv.textContent = 'HSV';
			hsl.textContent = 'HSL';

			active = hsl;
			active.setAttribute('data-active', 'true');

			function switchPickingModeTo(elem) {
				active.removeAttribute('data-active');
				active = elem;
				active.setAttribute('data-active', 'true');
				UIColorPicker.setPickerMode('picker', active.textContent);
			};

			var picker_sw = new StateButton(icon);
			picker_sw.subscribe(function() {
				if (active === hsv)
					switchPickingModeTo(hsl);
				else
					switchPickingModeTo(hsv);
			});

			hsv.addEventListener('click', function() {
				switchPickingModeTo(hsv);
			});
			hsl.addEventListener('click', function() {
				switchPickingModeTo(hsl);
			});

			parent.appendChild(icon);
			parent.appendChild(button);
		};

		var setPickerDragAndDrop = function setPickerDragAndDrop() {
			var preview = document.querySelector('#picker .preview-color');
			var picking_area = document.querySelector('#picker .picking-area');

			preview.setAttribute('draggable', 'true');
			preview.addEventListener('drop', drop);
			preview.addEventListener('dragstart', dragStart);
			preview.addEventListener('dragover', allowDropEvent);

			picking_area.addEventListener('drop', drop);
			picking_area.addEventListener('dragover', allowDropEvent);

			function drop(e) {
				var color = getSampleColorFrom(e);
				UIColorPicker.setColor('picker', color);
			};

			function dragStart(e) {
				e.dataTransfer.setData('sampleID', 'picker');
				e.dataTransfer.setData('location', 'picker');
			};
		};

		var getSampleColorFrom = function getSampleColorFrom(e) {
			var sampleID = e.dataTransfer.getData('sampleID');
			var location = e.dataTransfer.getData('location');

			if (location === 'picker')
				return UIColorPicker.getColor(sampleID);
			if (location === 'picker-samples')
				return ColorPickerSamples.getSampleColor(sampleID);
			if (location === 'palette-samples')
				return ColorPalette.getSampleColor(sampleID);
		};

		var setVoidSwitch = function setVoidSwitch() {
			var void_sample = getElemById('void-sample');
			void_sw = new StateButton(void_sample);
			void_sw.subscribe( function (state) {
				void_sample.setAttribute('data-active', state);
				if (state === true) {
					ColorPickerSamples.unsetActiveSample();
					CanvasSamples.unsetActiveSample();
				}
			});
		};

		var unsetVoidSample = function unsetVoidSample() {
			void_sw.unset();
		};

		var init = function init() {
			controls = getElemById('controls');

			var color = new Color();
			color.setHSL(0, 51, 51);
			UIColorPicker.setColor('picker', color);

			setPickerDragAndDrop();
			createPickerModeSwitch();
			setVoidSwitch();
		};

		return {
			init : init,
			unsetVoidSample : unsetVoidSample,
			getSampleColorFrom : getSampleColorFrom
		};

	})();

	var init = function init() {
		UIColorPicker.init();
		InputSliderManager.init();
		ColorInfo.init();
		ColorPalette.init();
		ColorPickerSamples.init();
		CanvasSamples.init();
		Tool.init();
	};

	return {
		init : init
	};

})();



