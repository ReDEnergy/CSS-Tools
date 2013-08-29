'use strict';

window.addEventListener("load", function() {
	BorderImage.init();
});

var BorderImage = (function BorderImage() {

	var getElemById = document.getElementById.bind(document);

	var subject;
	var preview;
	var guidelines = [];
	var positions = ['top', 'right', 'bottom', 'left'];

	var makeDraggable = function makeDraggable(elem) {

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

	var PreviewControl = function PreviewControl() {

		var dragging = false;
		var valueX = null;
		var valueY = null;

		var dragStart = function dragStart(e) {
			if (e.button !== 0)
				return;

			valueX = e.clientX - preview.clientWidth;
			valueY = e.clientY - preview.clientHeight;
			dragging = true;

			document.addEventListener('mousemove', mouseDrag);
		};

		var dragEnd = function dragEnd(e) {
			if (e.button !== 0 || dragging === false)
				return;

			document.removeEventListener('mousemove', mouseDrag);
			dragging = false;
		};

		var mouseDrag = function mouseDrag(e) {
			InputSliderManager.setValue('preview-width', e.clientX - valueX);
			InputSliderManager.setValue('preview-height', e.clientY - valueY);
		};

		var init = function init() {

			makeDraggable(preview);
			makeDraggable(subject);

			var handle = document.createElement('div');
			handle.className = 'resize-handle';

			handle.addEventListener('mousedown', dragStart);
			document.addEventListener('mouseup', dragEnd);

			preview.appendChild(handle);

		};

		return {
			init: init
		};

	}();

	var ImageReader = (function ImageReader() {

		var fReader = new FileReader();
		var browse = document.createElement('input');

		var loadImage = function loadImage(e) {
			if (browse.files.length === 0)
				return;

			var file = browse.files[0];

			if (file.type.slice(0, 5) !== 'image')
				return;

			fReader.readAsDataURL(file);

			return false;
		};

		fReader.onload = function(e) {
			ImageControl.loadRemoteImage(e.target.result);
		};

		var load = function load() {
			browse.click();
		};

		browse.setAttribute('type', 'file');
		browse.style.display = 'none';
		browse.onchange = loadImage;

		return {
			load: load
		};

	})();

	var ImageControl = (function ImageControl() {

		var scale = 0.5;
		var imgSource = new Image();
		var imgState = null;
		var selected = null;


		var topics = ['slice', 'width', 'outset'];
		var properties = {};
		properties['border'] = {
			fill			: false,

			slice_values	: [27, 27, 27, 27],
			width_values	: [20, 20, 20, 20],
			outset_values	: [0, 0, 0, 0],

			slice_units		: [0, 0, 0, 0],
			width_units		: [0, 0, 0, 0],
			outset_units	: [0, 0, 0, 0],

			repeat			: [1, 1],
			size			: [300, 200],
			preview_area	: 400
		};

		properties['border2'] = {
			fill			: false,

			slice_values	: [33, 33, 33, 33],
			width_values	: [1.5, 1.5, 1.5, 1.5],
			outset_values	: [0, 0, 0, 0],

			slice_units		: [1, 1, 1, 1],
			width_units		: [2, 2, 2, 2],
			outset_units	: [0, 0, 0, 0],

			repeat			: [2, 2],
			size			: [300, 200],
			preview_area	: 400
		};

		properties['border3'] = {
			fill			: true,

			slice_values	: [15, 15, 15, 15],
			width_values	: [10, 10, 10, 10],
			outset_values	: [0, 0, 0, 0],

			slice_units		: [0, 0, 0, 0],
			width_units		: [0, 0, 0, 0],
			outset_units	: [0, 0, 0, 0],

			repeat			: [2, 2],
			size			: [300, 200],
			preview_area	: 400
		};

		properties['border4'] = {
			fill			: false,

			slice_values	: [13, 13, 13, 13],
			width_values	: [13, 13, 13, 13],
			outset_values	: [13, 13, 13, 13],

			slice_units		: [0, 0, 0, 0],
			width_units		: [0, 0, 0, 0],
			outset_units	: [0, 0, 0, 0],

			repeat			: [0, 0],
			size			: [300, 200],
			preview_area	: 400
		};

		properties['border5'] = {
			fill			: false,

			slice_values	: [0, 12, 0, 12],
			width_values	: [0, 12, 0, 12],
			outset_values	: [0, 0, 0, 0],

			slice_units		: [0, 0, 0, 0],
			width_units		: [0, 0, 0, 0],
			outset_units	: [0, 0, 0, 0],

			repeat			: [0, 0],
			size			: [300, 200],
			preview_area	: 400,
		};

		properties['border6'] = {
			fill			: false,

			slice_values	: [42, 42, 42, 42],
			width_values	: [42, 42, 42, 42],
			outset_values	: [0, 0, 0, 0],

			slice_units		: [0, 0, 0, 0],
			width_units		: [0, 0, 0, 0],
			outset_units	: [0, 0, 0, 0],

			repeat			: [2, 2],
			size			: [350, 350],
			preview_area	: 500,
		};


		var loadLocalImage = function loadLocalImage(source) {
			var location = "images/" + source;
			imgSource.src = location;
		};

		var loadRemoteImage = function loadRemoteImage(source) {
			imgSource.src = source;
			if (selected)
				selected.removeAttribute('selected');
			Tool.setOutputCSS('source', 'url("' + source + '")');
		};

		var pickImage = function pickImage(e) {
			if (e.target.className === 'image') {
				selected = e.target;
				selected.setAttribute('selected', 'true');
				loadRemoteImage(e.target.src);
				imgState = e.target.getAttribute('data-stateID');
			}
		};

		var loadImageState = function loadImageState(stateID) {
			if (properties[stateID] === undefined)
				return;

			var prop = properties[stateID];
			var topic;
			var unit_array;
			var value_array;

			for (var i in topics) {
				for (var j=0; j<4; j++) {
					topic = topics[i] + '-' + positions[j];
					unit_array = topics[i] + '_units';
					value_array = topics[i] + '_values';
					InputSliderManager.setValue(topic, prop[value_array][j]);
					DropDownManager.setValue(topic, prop[unit_array][j]);
				}
			}

			ButtonManager.setValue('slice-fill', prop['fill']);
			DropDownManager.setValue('image-repeat-X', prop['repeat'][0]);
			DropDownManager.setValue('image-repeat-Y', prop['repeat'][1]);
			InputSliderManager.setValue('preview-width', prop['size'][0]);
			InputSliderManager.setValue('preview-height', prop['size'][1]);
			InputSliderManager.setValue('preview-area-height', prop['preview_area']);
		};

		var update = function update() {
			scale =  Math.min(300, (30000 / this.width) | 0);
			setScale(scale);
			InputSliderManager.setValue('scale', scale, false);

			subject.style.backgroundImage = 'url("' + this.src + '")';
			preview.style.borderImageSource = 'url("' + this.src + '")';

			guidelines['slice-top'].setMax(this.height);
			guidelines['slice-right'].setMax(this.width);
			guidelines['slice-bottom'].setMax(this.height);
			guidelines['slice-left'].setMax(this.width);

			if (imgState)
				loadImageState(imgState);
		};

		var setScale = function setScale(value) {
			scale = value;
			var w = imgSource.width * scale / 100 | 0;
			var h = imgSource.height * scale / 100 | 0;
			subject.style.width = w + 'px';
			subject.style.height = h + 'px';

			for (var i = 0; i < positions.length; i++)
				guidelines['slice-' + positions[i]].updateGuidelinePos();
		};

		var getScale = function getScale() {
			return scale/100;
		};

		var toggleGallery = function toggleGallery() {
			var gallery = getElemById('image-gallery');
			var button  = getElemById('toggle-gallery');
			var state = 1;
			button.addEventListener('click', function() {
				state = 1 ^ state;
				if (state === 0) {
					gallery.setAttribute('data-collapsed', 'true');
					button.setAttribute('data-action', 'show');
				}
				else {
					gallery.removeAttribute('data-collapsed');
					button.setAttribute('data-action', 'hide');
				}
			});
		};

		var init = function init() {
			var gallery = getElemById('image-gallery');
			var browse = getElemById('load-image');
			var remote = getElemById('remote-url');
			var load_remote = getElemById('load-remote');

			remote.addEventListener('change', function(){
				loadRemoteImage(this.value);
			});

			load_remote.addEventListener('click', function(){
				loadRemoteImage(remote.value);
			});

			browse.addEventListener('click', ImageReader.load);
			gallery.addEventListener('click', pickImage);
			imgSource.addEventListener('load', update);

			InputSliderManager.subscribe('scale', setScale);
			InputSliderManager.setValue('scale', scale);
			imgState = 'border';
			loadLocalImage('border-image-1.png');
			toggleGallery();
		};

		return {
			init: init,
			getScale : getScale,
			loadRemoteImage: loadRemoteImage
		};

	})();

	var GuideLine = function GuideLine(node) {
		var topic = node.getAttribute('data-topic');
		var axis = node.getAttribute('data-axis');

		this.node = node;
		this.topic = topic;
		this.axis = axis;
		this.info = topic.split('-')[1];

		this.position = 0;
		this.value = 0;
		this.unit = 0;
		this.max = 0;
		this.pos = positions.indexOf(this.info);

		guidelines[topic] = this;

		var relative_container = document.createElement('div');
		var tooltip = document.createElement('div');
		var tooltip2 = document.createElement('div');

		tooltip.className = 'tooltip';
		tooltip.setAttribute('data-info', this.info);

		tooltip2.className = 'tooltip2';
		tooltip2.textContent = this.info;
		tooltip2.setAttribute('data-info', this.info);

		this.tooltip = tooltip;

		relative_container.appendChild(tooltip);
		relative_container.appendChild(tooltip2);
		node.appendChild(relative_container);

		var startX = 0;
		var startY = 0;
		var start = 0;

		var startDrag = function startDrag(e) {
			startX = e.clientX;
			startY = e.clientY;
			start = guidelines[topic].position;
			document.body.setAttribute('data-move', axis);
			relative_container.setAttribute('data-active', '');
			node.setAttribute('data-active', '');

			document.addEventListener('mousemove', updateGuideline);
			document.addEventListener('mouseup', endDrag);
		};

		var endDrag = function endDrag() {
			document.body.removeAttribute('data-move');
			relative_container.removeAttribute('data-active');
			node.removeAttribute('data-active');

			document.removeEventListener('mousemove', updateGuideline);
		};

		var updateGuideline = function updateGuideline(e) {
			var value;
			if (topic === 'slice-top')
				value = e.clientY - startY + start;

			if (topic === 'slice-right')
				value = startX - e.clientX + start;

			if (topic === 'slice-bottom')
				value = startY - e.clientY + start;

			if (topic === 'slice-left')
				value = e.clientX - startX + start;

			if (this.unit === 0)
				InputSliderManager.setValue(topic, value * 1 / ImageControl.getScale() | 0);
			else {
				InputSliderManager.setValue(topic, (value * 100 / (this.max * ImageControl.getScale())) | 0);
			}

		}.bind(this);

		node.addEventListener("mousedown", startDrag);

		InputSliderManager.subscribe(topic, this.setPosition.bind(this));
		InputSliderManager.setValue(topic, this.position);
	};


	GuideLine.prototype.updateGuidelinePos = function updateGuidelinePos() {
		if (this.unit === 0)
			this.position = this.value * ImageControl.getScale() | 0;
		else
			this.position = this.value * this.max * ImageControl.getScale() / 100 | 0;

		this.node.style[this.info] = this.position + 'px';
	};

	GuideLine.prototype.setPosition = function setPosition(value) {
		this.value = value;
		this.tooltip.textContent = value;
		this.updateGuidelinePos();
		Tool.setBorderSlice(this.pos, value);
	};

	GuideLine.prototype.setMax = function setMax(max) {
		this.max = max;
		this.updateLimit();
	};

	GuideLine.prototype.updateLimit = function updateLimit() {
		if (this.unit === 1)
			InputSliderManager.setMax(this.topic, 100);
		else
			InputSliderManager.setMax(this.topic, this.max);
	};

	GuideLine.prototype.setUnit = function setUnit(type) {
		if (type === '%')	this.unit = 1;
		if (type === '')	this.unit = 0;
		this.updateLimit();
	};

	/*
	 * Unit panel
	 */
	var UnitPanel = (function UnitPanel () {

		var panel;
		var title;
		var precision;
		var step;
		var unit_topic = null; // settings are made for this topic
		var step_option = [1, 0.1, 0.01];

		var updatePrecision = function updatePrecision(value) {
			InputSliderManager.setPrecision('unit-step', value);
			InputSliderManager.setStep('unit-step', step_option[value]);
			InputSliderManager.setMin('unit-step', step_option[value]);

			if (unit_topic)
				InputSliderManager.setPrecision(unit_topic, value);
		};

		var updateUnitSettings = function updateUnitSettings(value) {
			if (unit_topic)
				InputSliderManager.setStep(unit_topic, value);
		};

		var show = function show(e) {
			var topic = e.target.getAttribute('data-topic');
			var precision = InputSliderManager.getPrecision(topic);
			var step = InputSliderManager.getStep(topic);

			unit_topic = topic;
			title.textContent = topic;

			panel.setAttribute('data-active', 'true');
			panel.style.top = e.target.offsetTop - 40 + 'px';
			panel.style.left = e.target.offsetLeft + 30 + 'px';

			InputSliderManager.setValue('unit-precision', precision);
			InputSliderManager.setValue('unit-step', step);
		};

		var init = function init() {
			panel = document.createElement('div');
			title = document.createElement('div');
			var close = document.createElement('div');

			step = InputSliderManager.createSlider('unit-step', 'step');
			precision = InputSliderManager.createSlider('unit-precision', 'precision');

			InputSliderManager.setStep('unit-precision', 1);
			InputSliderManager.setMax('unit-precision', 2);
			InputSliderManager.setValue('unit-precision', 2);
			InputSliderManager.setSensivity('unit-precision', 20);

			InputSliderManager.setValue('unit-step', 1);
			InputSliderManager.setStep('unit-step', 0.01);
			InputSliderManager.setPrecision('unit-step', 2);

			InputSliderManager.subscribe('unit-precision', updatePrecision);
			InputSliderManager.subscribe('unit-step', updateUnitSettings);

			close.addEventListener('click', function () {
				panel.setAttribute('data-active', 'false');
			});

			title.textContent = 'Properties';
			title.className = 'title';
			close.className = 'close';
			panel.id = 'unit-settings';
			panel.setAttribute('data-active', 'false');
			panel.appendChild(title);
			panel.appendChild(precision);
			panel.appendChild(step);
			panel.appendChild(close);
			document.body.appendChild(panel);
		};

		return {
			init : init,
			show : show
		};

	})();

	/**
	 * Tool Manager
	 */
	var Tool = (function Tool() {
		var preview_area;
		var dropdown_unit_options = [
			{ '' : '--', '%' : '%'},
			{ 'px' : 'px', '%' : '%', 'em' : 'em'},
			{ 'px' : 'px', 'em' : 'em'},
		];

		var border_slice = [];
		var border_width = [];
		var border_outset = [];

		var border_slice_values = [];
		var border_width_values = [];
		var border_outset_values = [];

		var border_slice_units = ['', '', '', ''];
		var border_width_units = ['px', 'px', 'px', 'px'];
		var border_outset_units = ['px', 'px', 'px', 'px'];

		var border_fill = false;
		var border_repeat = ['round', 'round'];
		var CSS_code = {
			'source' : null,
			'slice' : null,
			'width' : null,
			'outset' : null,
			'repeat' : null
		};

		var setBorderSlice = function setBorderSlice(positionID, value) {
			border_slice[positionID] = value + border_slice_units[positionID];
			updateBorderSlice();
		};

		var updateBorderSlice = function updateBorderSlice() {
			var value = border_slice.join(' ');
			if (border_fill === true)
				value += ' fill';

			preview.style.borderImageSlice = value;
			setOutputCSS('slice', value);
		};

		var setBorderFill = function setBorderFill(value) {
			border_fill = value;
			var bimgslice = border_slice.join(' ');;
			if (value === true)
				bimgslice += ' fill';

			preview.style.borderImageSlice = bimgslice;
		};

		var updateBorderWidth = function updateBorderWidth() {
			var value = border_width.join(' ');
			preview.style.borderImageWidth = value;
			setOutputCSS('width', value);
		};

		var updateBorderOutset = function updateBorderOutset() {
			var value = border_outset.join(' ');
			preview.style.borderImageOutset = border_outset.join(' ');
			setOutputCSS('outset', value);
		};

		var setBorderRepeat = function setBorderRepeat(obj) {
			border_repeat[obj.value] = obj.name;
			var value = border_repeat.join(' ');
			preview.style.borderImageRepeat = value;
			setOutputCSS('repeat', value);
		};

		var setOutputCSS = function setOutputCSS(topic, value) {
			CSS_code[topic].textContent = value + ';';
		};

		var setPreviewFontSize = function setPreviewFontSize(value) {
			preview.style.fontSize = value + 'px';
		};

		var setPreviewWidth = function setPreviewWidth(value) {
			preview.style.width = value + 'px';
		};

		var setPreviewHeight = function setPreviewHeight(value) {
			preview.style.height = value + 'px';
		};

		var setPreviewAreaHeight = function setPreviewAreaHeight(value) {
			preview_area.style.height = value + 'px';
		};

		var updateDragOption = function updateDragOption(value) {
			if (value === true)
				subject.setAttribute('data-draggable', 'true');
			else
				subject.removeAttribute('data-draggable');
		};

		var createProperty = function createProperty(topic, labelID, optionsID) {

			var slider = InputSliderManager.createSlider(topic, positions[labelID]);
			var dropdown = DropDownManager.createDropDown(topic, dropdown_unit_options[optionsID]);

			InputSliderManager.setSensivity(topic, 3);
			InputSliderManager.setPrecision(topic, 1);

			var property = document.createElement('div');
			var config = document.createElement('div');

			property.className = 'property';
			config.className = 'config';
			config.setAttribute('data-topic', topic);
			config.addEventListener('click', UnitPanel.show);

			property.appendChild(slider);
			property.appendChild(dropdown);
			property.appendChild(config);

			return property;
		};

		var initBorderSliceControls = function initBorderSliceControls() {
			var container = getElemById('border-slice-control');

			var listenForChanges = function listenForChanges(topic, id) {
				InputSliderManager.subscribe(topic, function(value) {
					border_slice_values[id] = value;
					border_slice[id] = value + border_slice_units[id];
					updateBorderSlice();
				});

				DropDownManager.subscribe(topic, function(obj) {
					guidelines[topic].setUnit(obj.value);
					border_slice_units[id] = obj.value;
					border_slice[id] = border_slice_values[id] + obj.value;
					updateBorderSlice();
				});
			};

			for (var i = 0; i < positions.length; i++) {
				var topic = 'slice-' + positions[i];
				var property = createProperty(topic, i, 0);
				listenForChanges(topic, i);

				container.appendChild(property);
			}

			container.appendChild(container.children[1]);

		};

		var initBorderWidthControls = function initBorderWidthControls() {
			var container = getElemById('border-width-control');

			var listenForChanges = function listenForChanges(topic, id) {
				InputSliderManager.subscribe(topic, function(value) {
					border_width_values[id] = value;
					border_width[id] = value + border_width_units[id];
					updateBorderWidth();
				});

				DropDownManager.subscribe(topic, function(obj) {
					if (obj.value === '%')
						InputSliderManager.setMax(topic, 100);
					else
						InputSliderManager.setMax(topic, 1000);

					border_width_units[id] = obj.value;
					border_width[id] = border_width_values[id] + obj.value;
					updateBorderWidth();
				});
			};

			for (var i = 0; i < positions.length; i++) {
				var topic = 'width-' + positions[i];
				var property = createProperty(topic, i, 1);
				InputSliderManager.setMax(topic, 1000);
				listenForChanges(topic, i);

				container.appendChild(property);
			}
		};

		var initBorderOutsetControls = function initBorderOutsetControls() {

			var container = getElemById('border-outset-control');

			var listenForChanges = function listenForChanges(topic, id) {
				InputSliderManager.subscribe(topic, function(value) {
					border_outset_values[id] = value;
					border_outset[id] = value + border_outset_units[id];
					updateBorderOutset();
				});

				DropDownManager.subscribe(topic, function(obj) {
					border_outset_units[id] = obj.value;
					border_outset[id] = border_outset_values[id] + obj.value;
					updateBorderOutset();
				});
			};

			for (var i = 0; i < positions.length; i++) {
				var topic = 'outset-' + positions[i];
				var property = createProperty(topic, i, 2);
				InputSliderManager.setMax(topic, 1000);
				listenForChanges(topic, i);

				container.appendChild(property);
			}
		};

		var init = function init() {

			var gallery =
			subject = getElemById('subject');
			preview = getElemById("preview");
			preview_area = getElemById("preview_section");


			CSS_code['source'] = getElemById("out-border-source");
			CSS_code['slice'] = getElemById("out-border-slice");
			CSS_code['width'] = getElemById("out-border-width");
			CSS_code['outset'] = getElemById("out-border-outset");
			CSS_code['repeat'] = getElemById("out-border-repeat");

			initBorderSliceControls();
			initBorderWidthControls();
			initBorderOutsetControls();

			var elem = document.querySelectorAll('.guideline');
			var size = elem.length;
			for (var i = 0; i < size; i++)
				new GuideLine(elem[i]);

			PreviewControl.init();

			ButtonManager.subscribe('slice-fill',setBorderFill);
			ButtonManager.subscribe('drag-subject', updateDragOption);
			ButtonManager.setValue('drag-subject', false);

			DropDownManager.subscribe('image-repeat-X', setBorderRepeat);
			DropDownManager.subscribe('image-repeat-Y', setBorderRepeat);

			InputSliderManager.subscribe('preview-area-height', setPreviewAreaHeight);
			InputSliderManager.subscribe('preview-width', setPreviewWidth);
			InputSliderManager.subscribe('preview-height', setPreviewHeight);
			InputSliderManager.subscribe('font-size', setPreviewFontSize);
			InputSliderManager.setValue('preview-width', 300);
			InputSliderManager.setValue('preview-height', 200);
		};

		return {
			init: init,
			setOutputCSS: setOutputCSS,
			setBorderSlice: setBorderSlice
		};

	})();

	/**
	 * Init Tool
	 */
	var init = function init() {
		InputSliderManager.init();
		DropDownManager.init();
		ButtonManager.init();
		UnitPanel.init();
		Tool.init();
		ImageControl.init();
	};

	return {
		init : init
	};

})();