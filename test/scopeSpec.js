/**
 * Created by daniel on 26.11.15.
 */
var _ = require("../node_modules/lodash/index"),
	Scope = require("../src/scope");


describe("Scope", function () {

	it("should be an object", function () {
		var $scope = new Scope();
		$scope.myVal = 5;
		expect($scope.myVal).toEqual(5);
	});


	describe("digest", function () {

		var scope;

		beforeEach(function () {
			scope = new Scope();
		});

		it("should call the listener function of a watch on $digest", function () {

			var listenerFn = jasmine.createSpy(),
				watchFn = function () {
					return 1;
				};

			scope.$watch(watchFn, listenerFn);
			scope.$digest();
			expect(listenerFn).toHaveBeenCalled();
		});


		it("should call the watch function with the scope as an argument", function () {

			var watchFn = jasmine.createSpy();
			scope.$watch(watchFn, function() {});

			scope.$digest();
			expect(watchFn).toHaveBeenCalledWith(scope);
		});


		it("should call the listener only when the watch value changed", function () {

			scope.myVal = 5;
			var watchFn = function (scope) {
					return scope.myVal;
				},
			listenerFn = jasmine.createSpy();

			scope.$watch(watchFn, listenerFn);
			scope.$digest();
			expect(listenerFn.calls.count()).toBe(1);
			scope.$digest();
			expect(listenerFn.calls.count()).toBe(1);
			scope.myVal = 7;
			scope.$digest();
			expect(listenerFn.calls.count()).toBe(2);

		});


		it("should call listener if first return value of watch is undefined", function () {

			var watchFn = function () {},
				listenerFn = jasmine.createSpy();

			scope.$watch(watchFn, listenerFn);
			scope.$digest();

			expect(listenerFn).toHaveBeenCalled();


		});


		it("should call listener with newValue as oldValue the first time", function () {

			var myObj = {val: 5},
				listenerFn = jasmine.createSpy(),
				watchFn = function () {
					return myObj;
				};

			scope.$watch(watchFn, listenerFn);
			scope.$digest();

			expect(listenerFn).toHaveBeenCalledWith(myObj, myObj, scope);
		});


		it("should call the watch function, also when no listener fn provided", function () {

			var watchFn = jasmine.createSpy();

			scope.$watch(watchFn);
			scope.$digest();

			expect(watchFn).toHaveBeenCalled();
		});


		it("triggers chained watchers in the same digest", function() {
			scope.name = 'Jane';
			scope.$watch(
					function(scope) { return scope.nameUpper; },
					function(newValue, oldValue, scope) {
						if (newValue) {
							scope.initial = newValue.substring(0, 1) + '.';
						}
					}
			);
			scope.$watch(
					function(scope) { return scope.name; },
					function(newValue, oldValue, scope) {
						if (newValue) {
							scope.nameUpper = newValue.toUpperCase();
						}
					}
			);
			scope.$digest();
			expect(scope.initial).toBe('J.');
			scope.name = 'Bob';
			scope.$digest();
			expect(scope.initial).toBe('B.');
		});


		it("should throw an exception after 10 digest loops", function () {

			scope.counterA = 0;
			scope.counterB = 0;

			var watchFn1 = function (scope) {
					return scope.counterA;
				},
				listenerFn1 = function (newVal, oldVal, scope) {
					scope.counterB += 1;
				},
				watchFn2 = function (scope) {
					return scope.counterB;
				},
				listenerFn2 = function (newVal, oldVal, scope) {
					scope.counterA += 1;
				};

			scope.$watch(watchFn1, listenerFn1);
			scope.$watch(watchFn2, listenerFn2);
			expect(function () {scope.$digest();}).toThrow();

		});


		it("ends the digest when the last watch is clean", function() {
			var watchExecutions = 0,
				i;

			scope.numArr = [];
			for (i = 0; i < 100; i++) {
				scope.numArr[i] = i;
			}

			scope.numArr.forEach(function (num) {
				scope.$watch(function (scope) {
					watchExecutions += 1;
					return scope.numArr[num];
				}, function () {});
			});

			scope.$digest();
			expect(watchExecutions).toBe(200);
			scope.numArr[0] = 420;
			scope.$digest();
			expect(watchExecutions).toBe(301);
		});

		it("does not end digest so that new watches are not run", function() {
			scope.aValue = 'abc';
			scope.counter = 0;
			scope.$watch(
					function(scope) { return scope.aValue; },
					function(newValue, oldValue, scope) {
						scope.$watch(
								function(scope) { return scope.aValue; },
								function(newValue, oldValue, scope) {
									scope.counter++;
								}
						);
					}
			);
			scope.$digest();
			expect(scope.counter).toBe(1);
		});


		it("compares based on value if enabled", function() {
			scope.aValue = [1, 2, 3];
			scope.counter = 0;
			scope.$watch(
					function(scope) { return scope.aValue; },
					function(newValue, oldValue, scope) {
						scope.counter++;
					},
					true
			);
			scope.$digest();
			expect(scope.counter).toBe(1);
			scope.aValue.push(4);
			scope.$digest();
			expect(scope.counter).toBe(2);
		});


		it("correctly handles NaNs", function() {
			scope.number = 0/0; // NaN
			scope.counter = 0;
			scope.$watch(
					function(scope) { return scope.number; },
					function(newValue, oldValue, scope) {
						scope.counter++;
					}
			);
			scope.$digest();
			expect(scope.counter).toBe(1);
			scope.$digest();
			expect(scope.counter).toBe(1);
		});


		it("executes $eval'ed function and returns result", function() {
			scope.aValue = 42;
			var result = scope.$eval(function(scope) {
				return scope.aValue;
			});
			expect(result).toBe(42);
		});
		it("passes the second $eval argument straight through", function() {
			scope.aValue = 42;
			var result = scope.$eval(function(scope, arg) {
				return scope.aValue + arg;
			}, 2);
			expect(result).toBe(44);
		});


		it("executes $apply'ed function and starts the digest", function() {
			scope.aValue = 'someValue';
			scope.counter = 0;
			scope.$watch(
					function(scope) {
						return scope.aValue;
					},
					function(newValue, oldValue, scope) {
						scope.counter++;
					}
			);
			scope.$digest();
			expect(scope.counter).toBe(1);
			scope.$apply(function(scope) {
				scope.aValue = 'someOtherValue';
			});
			expect(scope.counter).toBe(2);
		});


		//next: $evalAsync - Deferred Execution


	}); // end describe digest


});

