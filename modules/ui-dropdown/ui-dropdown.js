/**
 * UI-DropDown Select
 */

var DropDownManager = (function DropdownManager() {
	'use strict';

	var subscribers = {};
	var dropdowns = [];
	var active = null;

	var visbility = ["hidden", "visible"];

	var DropDown = function DropDown(node) {
		var topic = node.getAttribute('data-topic');
		var label = node.getAttribute('data-label');
		var selected = node.getAttribute('data-selected') | 0;

		var select = document.createElement('div');
		var list = document.createElement('div');
		var uval = 0;
		var option = null;
		var option_value = null;

		list.className = 'ui-dropdown-list';
		select.className = 'ui-dropdown-select';

		while (node.firstElementChild !== null) {
			option = node.firstElementChild;
			option_value = option.getAttribute('data-value');

			if (option_value === null)
				option.setAttribute('data-value', uval);

			list.appendChild(node.firstElementChild);
			uval++;
		}

		node.appendChild(select);
		node.appendChild(list);

		select.onclick = this.toggle.bind(this);
		list.onclick = this.updateValue.bind(this);
		document.addEventListener('click', clickOut);

		this.state = 0;
		this.time = 0;
		this.dropmenu = list;
		this.select = select;
		this.toggle(false);
		this.value = {};
		this.topic = topic;

		if (label)
			select.textContent = label;
		else
			this.setNodeValue(list.children[selected]);

		dropdowns[topic] = this;

	};

	DropDown.prototype.toggle = function toggle(state) {
		if (typeof(state) === 'boolean')
			this.state = state === false ? 0 : 1;
		else
			this.state = 1 ^ this.state;

		if (active !== this) {
			if (active)
				active.toggle(false);
			active = this;
		}

		if (this.state === 0)
			this.dropmenu.setAttribute('data-hidden', 'true');
		else
			this.dropmenu.removeAttribute('data-hidden');

	};

	DropDown.prototype.updateValue = function updateValue(e) {

		if (Date.now() - this.time < 500)
			return;

		if (e.target.className !== "ui-dropdown-list") {
			this.setNodeValue(e.target);
			this.toggle(false);
		}

		this.time = Date.now();
	};

	DropDown.prototype.setNodeValue = function setNodeValue(node) {
		this.value['name'] = node.textContent;
		this.value['value'] = node.getAttribute('data-value');

		this.select.textContent = node.textContent;
		this.select.setAttribute('data-value', this.value['value']);

		notify.call(this);
	};

	var clickOut = function clickOut(e) {
		if (active.state === 0 ||
			e.target === active.dropmenu ||
			e.target === active.select)
			return;

		active.toggle(false);
	};

	var createDropDown = function createDropDown(topic, options) {

		var dropdown = document.createElement('div');
		dropdown.setAttribute('data-topic', topic);
		dropdown.className = 'ui-dropdown';

		for (var i in options) {
			var x = document.createElement('div');
			x.setAttribute('data-value', i);
			x.textContent = options[i];
			dropdown.appendChild(x);
		}

		new DropDown(dropdown);

		return dropdown;
	};

	var setValue = function setValue(topic, index) {
		if (dropdowns[topic] === undefined ||
			index >= dropdowns[topic].dropmenu.children.length)
			return;

		dropdowns[topic].setNodeValue(dropdowns[topic].dropmenu.children[index]);
	};

	var subscribe = function subscribe(topic, callback) {
		if (subscribers[topic] === undefined)
			subscribers[topic] = [];
		subscribers[topic].push(callback);
	};

	var unsubscribe = function unsubscribe(topic, callback) {
		var index = subscribers[topic].indexOf(callback);
		subscribers[topic].splice(index, 1);
	};

	var notify = function notify() {
		if (subscribers[this.topic] === undefined)
			return;

		for (var i in subscribers[this.topic]) {
			subscribers[this.topic][i](this.value);
		}
	};

	var init = function init() {
		var elem, size;

		elem = document.querySelectorAll('.ui-dropdown');
		size = elem.length;
		for (var i = 0; i < size; i++)
			new DropDown(elem[i]);

	};

	return {
		init : init,
		setValue : setValue,
		subscribe : subscribe,
		unsubscribe : unsubscribe,
		createDropDown : createDropDown
	};

})();