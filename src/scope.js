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
	var dirty = false,
		digestCount = 0;
	do {
		dirty = this.$$digestOnce();
		digestCount += 1;
		if (dirty && digestCount >= 10) {
			throw Error("10 digest loops reached!");
		}
	} while(dirty && digestCount);
};

Scope.prototype.$$digestOnce = function () {
	var theScope = this,
		dirty = false;
	this.$$watchers.forEach(function (watch) {
		var newVal = watch.watchFn(theScope);
		if (newVal !== watch.oldVal && watch.listenerFn) {
			watch.listenerFn(
				newVal,
				watch.oldVal === theScope.initWatchVal ? newVal : watch.oldVal,
				theScope
			);
			dirty = true;
		}
		watch.oldVal = newVal;
	});
	return dirty;
};

