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
})()