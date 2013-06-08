window.addEventListener("load", pageLoad);

function pageLoad() {
	BorderTool.init();
};


var BorderTool = {

	canvas : null,
	info : null,
	guidelines : [],
	active : null,
	mouse_state: 0,
	image: null,
	preview : null,
	resize_dir : ['s-resize', 'w-resize', 'n-resize', 'e-resize'],



	init : function init() {
		this.canvas = document.getElementById("border_tool_canvas");
		this.info = document.getElementById("info");
		this.preview = document.getElementById("preview");
		this.trackMouse();
		this.loadImageOnCanvas("./images/stars.jpg");
		this.createGuidelines();
		BorderTool.updatePreview();
	},

	loadImageOnCanvas: function loadImage(dataURL) {
		// load image from data url
		var imageObj = new Image();
		imageObj.onload = function() {
			BorderTool.image = this;
			BorderTool.drawImage();
		};

		imageObj.src = dataURL;
	},

	requestImage: function requestImage(url) {
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.onreadystatechange = function(e) {
			if(request.readyState == 4 && request.status == 200) {
				BorderTool.loadImageOnCanvas(request.responseText);
				console.log("Response: ", request.responseText);
			}
			console.log("ReadyState: ", request.readyState);
			console.log("Status: ", request.status);
		}
		request.send(null);
	},

	drawImage: function drawImage() {
		var ctx = this.canvas.getContext('2d');
		ctx.drawImage(BorderTool.image, 0, 0, BorderTool.canvas.width,
					BorderTool.canvas.height);
		for (var i in this.guidelines)
			this.guidelines[i].draw();
	},

	updateCanvas : function updateCanvas(mouseX, mouseY) {
		if (this.mouse_state == 0)
			this.updatePointer(mouseX, mouseY);

		if (this.mouse_state && this.active) {

			var opposite = (parseInt(this.active) + 2) % 4;
			var delta = Math.abs( this.guidelines[this.active].getPosition() -
						this.guidelines[opposite].getPosition());

			this.guidelines[this.active].updatePosition(mouseX, mouseY);
			this.drawImage();
		}
	},

	updatePreview : function updatePreview() {
		
		var spos = [];

		for (var i in this.guidelines)
			spos.push(this.guidelines[i].getSlicePositionInPX());

		var slice_param = spos.join(" ");
		this.preview.style.borderImageSlice = slice_param;
	},

	createGuidelines : function createGuidelines() {
		var ctx = this.canvas.getContext('2d');
		var gl0 = new GuideLine(60, 'Y', "top", this.canvas);
		var gl1 = new GuideLine(this.canvas.width - 36, 'X', "right", this.canvas);
		var gl2 = new GuideLine(this.canvas.height - 33, 'Y', "bottom", this.canvas);
		var gl3 = new GuideLine(47, 'X', "left", this.canvas);
		this.guidelines.push(gl0);
		this.guidelines.push(gl1);
		this.guidelines.push(gl2);
		this.guidelines.push(gl3);
	},

	updatePointer: function updatePointer(mouseX, mouseY) {

		for(var i in this.guidelines) {
			if (this.guidelines[i].isMouseOver(mouseX, mouseY)) {
				this.canvas.style.cursor = this.resize_dir[i];
				this.active = i;
				return;
			}
		}
		this.active = null;
		this.canvas.removeAttribute("style");
	},


	trackMouse : function trackMouse() {

		var offsetX = this.canvas.offsetLeft;
		var offsetY = this.canvas.offsetTop;	
		var state = 0;

		function mouseMove(e) {
			
			var posX = e.pageX - offsetX;
			var posY = e.pageY - offsetY;

			BorderTool.info.textContent = posX + ' ' + posY;
			BorderTool.updateCanvas(posX, posY);
			if (BorderTool.canvas.hasAttribute("style") && BorderTool.mouse_state == 1)
				BorderTool.updatePreview();
		};

		function mouseDown(e) {
			BorderTool.mouse_state = 1;
		};

		function mouseUp() {
			BorderTool.mouse_state = 0;
			BorderTool.updateCanvas();
			BorderTool.updatePreview();
		};

		this.canvas.addEventListener('mousemove', mouseMove);
		this.canvas.addEventListener('mousedown', mouseDown);
		this.canvas.addEventListener('mouseup', mouseUp);

	}
};


function GuideLine(position, axis, zone, canvas) {

	var pos = position;
	var axis = axis;
	var zone = zone;
	var width = 3;
	var center = 1;
	var canvas = canvas;

	function draw() {

		var ctx = canvas.getContext('2d');
		var start = Math.ceil(pos - width/2 - center);

			ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
		if (axis === 'X') {
			ctx.fillRect(start, 0, width, canvas.height);
		ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
			ctx.fillRect(start + center, 0, center, canvas.height);
		}
		else {
			ctx.fillRect(0, start, canvas.width, 3);
		ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
			ctx.fillRect(0, start + center, canvas.width, 1);
		}

		drawOpaqueBorder(start, ctx);
	}

	function drawOpaqueBorder(start, ctx) {
		ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
		zone == "top" ? ctx.fillRect(0, 0, canvas.width, start) :
		(zone == "right" ? ctx.fillRect(start, 0, canvas.width, canvas.height) :
		(zone == "bottom" ? ctx.fillRect(0, start, canvas.width, canvas.height) :
		(zone == "left" ? ctx.fillRect(0, 0, start, canvas.width) : null)));
	}

	function isMouseOver(mouseX, mouseY) {
		if (axis === 'X')
			return Math.abs(mouseX - pos) <= 2;
		return Math.abs(mouseY - pos) <= 2;
	}

	function updatePosition(mouseX, mouseY) {
		if (axis === 'X')
			pos = mouseX;
		else
			pos = mouseY;
		draw();
	}

	function getPosition() {
		return pos;
	}

	function getSlicePositionInPX() {
		if (zone == "top" || zone == "left")
			return pos;
		if (zone == "bottom")
			return canvas.height - pos;
		if (zone == "right")
			return canvas.width - pos;
	}

	return {
		draw : draw,
		isMouseOver : isMouseOver,
		getPosition : getPosition,
		updatePosition : updatePosition,
		getSlicePositionInPX : getSlicePositionInPX
	}
}
