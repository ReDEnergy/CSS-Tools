/*
 * Observer pattern - Pub/Sub
 */
var Observer = (function Observer() {
	var topics = [];
	var subscribers = [];

	var publish = function publish(topic, data) {
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
		var sla = document.querySelectorAll('.ui-slider');
		var size = sla.length;
		for (var i = 0; i < size; i++)
			new Slider(sla[i]);
	}
	return {
		init : init,
		setValue : setValue,
		subscribe : subscribe,
		unsubscribe : unsubscribe
	}
})();


/*
 * EventManager
 */
var EventManager = (function EventManager() {

	var subscribers = [];

	var subscribe = function subscribe(event, callback) {
		if (subscribers[event] === undefined)
			subscribers[event] = [];

		subscribers[event].push(callback);
	}

	var unsubscribe = function unsubscribe(event, callback) {
		subscribers[event].indexOf(callback);
		subscribers[event].splice(index, 1);
	}

	var trigger = function trigger(event, value) {
		if (subscribers[event] === undefined)
			return;

		for (var i in subscribers[event]) {
			subscribers[event][i](value);
		}
	}

	var init = function init() {
	}

	return {
		init : init,
		trigger : trigger,
		subscribe : subscribe,
		unsubscribe : unsubscribe
	}
});


