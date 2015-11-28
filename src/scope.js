/**
 * Created by daniel on 26.11.15.
 */
var _ = require("../node_modules/lodash");


var Scope = function () {
	this.$$watchers = [];
	this.$$lastDirtyWatch = null;
};
module.exports = Scope;

Scope.prototype.initWatchVal = {};

Scope.prototype.dummyListenerFn = function () {};

Scope.prototype.$watch = function (watchFn, listenerFn, valueEq) {
	var watch = {
		watchFn: watchFn,
		listenerFn: listenerFn || this.dummyListenerFn,
		oldVal: this.initWatchVal,
		valueEq: !!valueEq
	};
	this.$$watchers.push(watch);
	this.$$lastDirtyWatch = null;
};

Scope.prototype.$digest = function () {
	var dirty = false,
		digestCount = 0;
	this.$$lastDirtyWatch = null;
	do {
		dirty = this.$$digestOnce();
		digestCount += 1;
		if (dirty && digestCount >= 10) {
			throw Error("10 digest loops reached!");
		}
	} while(dirty && digestCount);
};

Scope.prototype.$$areEqual = function (newVal, oldVal, valueEq) {
	if (valueEq) {
		return _.isEqual(newVal, oldVal);
	}
	var recNaN = (typeof newVal === 'number' && typeof oldVal === 'number' &&
		isNaN(newVal) && isNaN(oldVal));
	return newVal === oldVal || recNaN;
};

Scope.prototype.$$digestOnce = function () {
	var theScope = this,
		dirty = false;
	_.forEach(this.$$watchers, function (watch) {
		var newVal = watch.watchFn(theScope);
		if (!theScope.$$areEqual(newVal, watch.oldVal, watch.valueEq)) {
			theScope.$$lastDirtyWatch = watch;
			watch.listenerFn(
				newVal,
				watch.oldVal === theScope.initWatchVal ? newVal : watch.oldVal,
				theScope
			);
			dirty = true;
			watch.oldVal = watch.valueEq ? _.cloneDeep(newVal) : newVal;
		} else if (theScope.$$lastDirtyWatch === watch) {
			return false;
		}
	});
	return dirty;
};

Scope.prototype.$eval = function (expression, locals) {
	return expression(this, locals);
};

Scope.prototype.$apply = function (expression) {
	try {
		return this.$eval(expression);
	} finally {
		this.$digest();
	}
};
