/**
 * Created by daniel on 26.11.15.
 */
var Scope = function () {
	this.$$watchers = [];
};

Scope.prototype.initWatchVal = {};

Scope.prototype.$watch = function (watchFn, listenerFn) {
	var watch = {
		watchFn: watchFn,
		listenerFn: listenerFn,
		oldVal: this.initWatchVal
	};
	this.$$watchers.push(watch);
};

Scope.prototype.$digest = function () {
	var theScope = this;
	this.$$watchers.forEach(function (watch) {
		var newVal = watch.watchFn(theScope);
		if (newVal !== watch.oldVal) {
			watch.listenerFn(
				newVal,
				watch.oldVal === theScope.initWatchVal ? newVal : watch.oldVal,
				theScope
			);
		}
		watch.oldVal = newVal;
	});

};

