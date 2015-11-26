/**
 * Created by daniel on 26.11.15.
 */

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

		// CURRENT CHAPTER: Getting Notified Of Digests


	});


});

