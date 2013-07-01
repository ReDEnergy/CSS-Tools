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
		this.posX   = 5;
		this.posY   = -5;
		this.blur   = 5;
		this.spread = 0;
		this.color  = [0, 0, 0, 1];
		this.undo	= [];
	}

	Shadow.prototype.setGlow = function setGlow() {
		this.saveState();
		this.spread	= 10;
		this.blur	= 10;
		this.color	= [37, 123, 194, 1];
	}

	Shadow.prototype.saveState = function saveState() {
		this.undo.push([this.posX, this.posY, this.blur, this.spread, this.color]);
	}

	Shadow.prototype.undoState = function undoState() {
		var prev = this.undo.pop([this.posX, this.posY, this.blur, this.spread, this.color]);
		this.posX	= prev[0];
		this.posY	= prev[1];
		this.blur	= prev[2];
		this.spread	= prev[3];
		this.color	= prev[4];
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

	var Controls = (function Controls() {

		var init = function init() {
			preview.addEventListener("mwhell")
		}

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

			var length = shadows.push(new Shadow());
			setActiveShadow(length - 1);
			update();
		}

		var setActiveShadow = function setActiveShadow(id) {
			if (shodowID === id)
				return;

			active = shadows[id];
			addGlowEffect(id);
			shodowID = id;

			console.log("Shadows", shadows);
			console.log("Render", render);
		}

		var setActiveObject =  function setActiveObject(item) {
			shodowID = null;
			if (item === 0)
				active = subject;
		}

		var updateActivePos = function updateActivePos(deltaX, deltaY) {
			if (shodowID === null)
				updateObjPos(deltaX, deltaY);
			else
				updateShadowPos(deltaX, deltaY);
		}

		var renderShadow = function renderShadow(id) {
			render[id] = shadows[id].computeCSS();
		}

		var updateShadowPos = function updateShadowPos(deltaX, deltaY) {
			active.posX += deltaX;
			active.posY += deltaY;
			renderShadow(shodowID);
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
			if (shodowID === id)
				active = subject;
			update();
		}

		// Implement in shadow object the glow effect
		// should return the previous shadow state
		var addGlowEffect = function addGlowEffect(id) {
			shadows[id].setGlow();
			renderShadow(id);
			subject.style.transition = "box-shadow 0.2s";
			update();
			setTimeout(function() {
				shadows[id].undoState();
				renderShadow(id);
				update();
				setTimeout(function() {
					subject.style.removeProperty("transition");
				}, 200);
			}, 200);
		}

		return {
			init : init,
			addShadow : addShadow,
			updateActivePos : updateActivePos,
			setActiveShadow : setActiveShadow,
			setActiveObject : setActiveObject,
			deleteShadow : deleteShadow
		}

	})();


	/*
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

		function init() {
			Subject.elem = getElemById("subject_layer");
			Subject.before = getElemById("subject_before");
			Subject.after = getElemById("subject_after");

			stack = getElemById("shadow_stack");

			add_btn = getElemById("new_layer");

			add_btn.addEventListener("click", addLayer);
			stack.addEventListener("click", clickShadowStack);
			Subject.elem.addEventListener("click", activateSubject);

			switchActiveLayerTo(Subject.elem);
		}

		var activateSubject = function activateSubject() {
			switchActiveLayerTo(Subject.elem);
			Tool.setActiveObject(0);
		}

		var clickShadowStack = function clickShadowStack(e) {
			console.log(e.target);
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

				console.log(shadow_ID, index);

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
			console.log("activeLayer", activeLayer);

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
			console.log(order);
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

