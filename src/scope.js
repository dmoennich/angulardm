/**
 * Created by daniel on 26.11.15.
 */
var _ = require("../node_modules/lodash");


var Scope = function () {
	this.$$watchers = [];
	this.$$lastDirtyWatch = null;
	this.$$asyncQueue = [];
	this.$$phase = null;
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
	this.$beginPhase("$digest");
	var dirty = false,
		maxDigestCount = 10;
	this.$$lastDirtyWatch = null;
	do {
		while (this.$$asyncQueue.length) {
			var asyncTask = this.$$asyncQueue.shift();
			asyncTask.scope.$eval(asyncTask.expression);
		}
		dirty = this.$$digestOnce();
		maxDigestCount -= 1;
		if ((dirty || this.$$asyncQueue.length) && !maxDigestCount) {
			this.$clearPhase();
			throw Error("10 digest loops reached!");
		}
	} while (dirty || this.$$asyncQueue.length);
	this.$clearPhase();
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
		this.$beginPhase("$apply");
		return this.$eval(expression);
	} finally {
		this.$clearPhase();
		this.$digest();
	}
};

Scope.prototype.$evalAsync = function (expr) {
	var theScope = this;
	if (!this.$$phase && !this.$$asyncQueue.length) {
		setTimeout(function () {
			if (theScope.$$asyncQueue.length) {
				theScope.$digest();
			}
		}, 0)
	}
	this.$$asyncQueue.push({scope: this, expression: expr});
};


Scope.prototype.$beginPhase = function (phase) {
	if (this.$$phase !== null) {
		throw new Error($$phase + " is already in progress!");
	}
	this.$$phase = phase;
};

Scope.prototype.$clearPhase = function () {
	this.$$phase = null;
};


