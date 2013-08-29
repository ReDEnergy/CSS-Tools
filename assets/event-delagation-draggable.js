/*
 * Draggable concept using event delegation on Document
 * @author	Gabriel Ivanica
 */

var Draggable = (function Draggable() {

	var dragStart = function dragStart(e) {

		var node = e.target;
		if (node.getAttribute('data-draggable') !== 'true' || e.button !== 0)
			return;

		var obj = {};
		obj.node = node;
		obj.offsetLeft = e.clientX - node.offsetLeft;
		obj.offsetTop = e.clientY - node.offsetTop;
		obj.dragFunction = dragMotion.bind(obj);
		obj.endDragFunction = dragEnd.bind(obj);

		document.addEventListener('mousemove', obj.dragFunction);
		document.addEventListener('mouseup', obj.endDragFunction);
	};

	var dragEnd = function dragEnd(e) {
		if (e.button !== 0)
			return;

		document.removeEventListener('mousemove', this.dragFunction);
		document.removeEventListener('mouseup', this.endDragFunction);
	};

	var dragMotion = function dragMotion(e) {

		this.node.style.left = e.clientX - this.offsetLeft + 'px';
		this.node.style.top = e.clientY - this.offsetTop + 'px';
	};

	document.addEventListener('mousedown', dragStart, false);
})();
