'use strict';

/**
 * UI-ButtonManager
 */

var ButtonManager = (function CheckBoxManager() {

	var subscribers = [];
	var buttons = [];

	var CheckBox = function CheckBox(node) {
		var topic = node.getAttribute('data-topic');
		var state = node.getAttribute('data-state');
		var name = node.getAttribute('data-label');
		var align = node.getAttribute('data-text-on');

		state = (state === "true");

		var checkbox = document.createElement("input");
		var label = document.createElement("label");

		var id = 'checkbox-' + topic;
		checkbox.id = id;
		checkbox.setAttribute('type', 'checkbox');
		checkbox.checked = state;

		label.setAttribute('for', id);
		if (name) {
			label.className = 'text';
			if (align)
				label.className += ' ' + align;
			label.textContent = name;
		}

		node.appendChild(checkbox);
		node.appendChild(label);

		this.node = node;
		this.topic = topic;
		this.checkbox = checkbox;

		checkbox.addEventListener('change', function(e) {
			notify.call(this);
		}.bind(this));

		buttons[topic] = this;
	};

	var getNode =  function getNode(topic) {
		return buttons[topic].node;
	};

	var setValue = function setValue(topic, value) {
		var obj = buttons[topic];
		if (obj === undefined)
			return;

		obj.checkbox.checked = value;
		notify.call(obj);
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
			subscribers[this.topic][i](this.checkbox.checked);
	};

	var init = function init() {
		var elem = document.querySelectorAll('.ui-checkbox');
		var size = elem.length;
		for (var i = 0; i < size; i++)
			new CheckBox(elem[i]);
	};

	return {
		init : init,
		setValue : setValue,
		subscribe : subscribe,
		unsubscribe : unsubscribe
	};

})();
