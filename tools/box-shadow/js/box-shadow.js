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
	 * Shadow Object
	 */
	function Shadow() {
		this.inset  = false;
		this.posX   = 10;
		this.posY   = 10;
		this.blur   = 5;
		this.spread = 0;
		this.color  = [0, 0, 0, 1];
	}

	Shadow.prototype.computeCSS = function computeCSS() {
		var value = "";
		if (this.inset === true)
			value += "inset ";
		value += this.posX + "px ";
		value += this.posY + "px ";
		value += this.blur + "px ";
		value += this.spread + "px ";
		value += this.computeColor();

		return value;
	}

	Shadow.prototype.computeColor = function computeColor() {

		var alpha = this.color[3] !== 1 ? "," + this.color[3] : "";
		return "rgb(" + this.color[0] + ", " + this.color[1] + ", " +
					this.color[2] + alpha + ")";
	}

	/*
	 * Shadow dragging
	 */

	var Drag = (function Drag() {
		var active = false;
		var lastX = 0;
		var lastY = 0;

		var init = function init() {
			preview.addEventListener('mousedown', dragStart, false);
			document.addEventListener('mouseup', dragEnd, false);
		}

		var dragStart = function dragStart(e) {
			active = true;
			lastX = e.clientX;
			lastY = e.clientY;
			document.addEventListener('mousemove', mouseDrag, false);
		};

		var dragEnd = function dragEnd(e) {
			if (active === true) {
				active = false;
				document.removeEventListener('mousemove', mouseDrag, false);
			}
		};

		var mouseDrag = function mouseDrag(e) {
			Tool.updateActivePos(e.clientX - lastX, e.clientY - lastY);
			lastX = e.clientX;
			lastY = e.clientY;
		};

		return {
			init : init
		}

	})();



	/*
	 * Tool Manager
	 */

	var Tool = (function Tool() {
		var shodowID = null;
		var shadows = [];
		var render = [];
		var active = null;
		var output;

		var init = function init() {
			subject = getElemById("subject");
			preview = getElemById("preview");
			output  = getElemById("output");

			SubjectObj.center();
		}

		var addShadow = function addShadow() {
			active = new Shadow();
			shodowID = shadows.length;
			shadows.push(active);
			renderShadow();
			update();
		}

		var updateActivePos = function updateActivePos(deltaX, deltaY) {
			if (shodowID === null)
				updateObjPos(deltaX, deltaY);
			else
				updateShadowPos(deltaX, deltaY);
		}

		var updateShadowPos = function updateShadowPos(deltaX, deltaY) {
			active.posX += deltaX;
			active.posY += deltaY;
			render[shodowID] = active.computeCSS();
			update();
		}

		var renderShadow = function renderShadow() {
			render[shodowID] = active.computeCSS();
		}


		var updateObjPos = function updateObjPos(deltaX, deltaY) {
			SubjectObj.posX += deltaX;
			SubjectObj.posY += deltaY;
			subject.style.top = SubjectObj.posY + "px";
			subject.style.left = SubjectObj.posX + "px";
		}

		var update = function update() {
			subject.style.boxShadow = render.join(", ");
			output.textContent = render.join("\n");
		}

		return {
			init : init,
			addShadow : addShadow,
			updateActivePos : updateActivePos,
			updateShadowPos : updateShadowPos,
			renderShadow : renderShadow,
			updateObjPos : updateObjPos,
			update : update,
			getActiveNode : function (id) {
				return active;
			},
			setActiveShadow : function setActiveShadow(id) {
				active = shadows[id];
				shodowID = id;
			},
		}

	})();


	/*
	 * Layer Manager
	 */
	var LayerManager = (function LayerManager() {
		var layer_ID = null;
		var nr = 0;
		var order = [];
		var stack;
		var add_btn;

		var init = function init() {
			stack = getElemById("shadow_stack");
			add_btn = getElemById("new_layer");
			add_btn.addEventListener("click", addLayer);
			stack.addEventListener("click", clickEvent);
		}

		var clickEvent = function clickEvent(e) {
			if (e.target.className === "layer") {
				getActiveNodeLayer().removeAttribute("active");

				var shadow_ID = e.target.getAttribute("sid") | 0;
				layer_ID = order.indexOf(shadow_ID);

				console.log("layer_ID", layer_ID);

				Tool.setActiveShadow(shadow_ID);
				e.target.setAttribute("active", "true");
			}
		}

		var getActiveLayerID = function getActiveLayerID() {
		}

		var activeLayer = function activeLayer(elem) {

		}

		var getActiveNodeLayer = function getActiveNodeLayer() {
			if(layer_ID == null)
				return null;

			return stack.children[layer_ID];
		}

		var addLayer = function addLayer() {
			var layer = createLayer();
			var activeNode = getActiveNodeLayer();

			// DEBUG
			console.log("before_layer_ID", layer_ID);
			console.log("activeNode", activeNode);

			if (activeNode !== null)
				activeNode.removeAttribute("active");

			if (layer_ID === null)
				layer_ID = 0;

			Tool.addShadow();

			stack.insertBefore(layer, activeNode);
			order.splice(layer_ID, 0, nr++);

			// DEBUG
			console.log("after_layer_ID", layer_ID);
			console.log(order);
		}

		var createLayer = function createLayer() {
			var elem = document.createElement("div");
			elem.className = 'layer';
			elem.setAttribute('sid', nr);
			elem.setAttribute('active', "true");
			elem.textContent = 'shadow ' + nr;
			return elem;
		}

		return {
			init : init,
		}

	})();


	/*
	 * Init Tool
	 */

	var init = function init() {
		Tool.init();
		Drag.init();
		LayerManager.init();
	}

	return {
		init : init
	}

})();

