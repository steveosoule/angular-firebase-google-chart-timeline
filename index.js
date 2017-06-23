var FIREBASE_URL = 'https://projects-ac147.firebaseio.com/proservices/';

var app = angular.module('app', ['ngRoute', 'firebase']);


app.config(function($routeProvider, $locationProvider) {
	$locationProvider.html5Mode(true);

	$routeProvider
	.when('/', {
		templateUrl : 'list.htm',
		controller : 'ListController'
	})
	.when('/schedules/:schedule', {
		templateUrl : 'schedules.htm',
		controller : 'SchedulesController'
	});
});

app.controller('MainController', function($scope, $route, $routeParams, $location, $firebase) {

	console.log('ListController');

	$scope.title = 'Schedule Main';

	$scope.$route = $route;
	$scope.$params = $routeParams;
	$scope.$location = $location;
	$scope.$firebase = $firebase;

});


app.controller('ListController', function($scope, $route, $routeParams, $location, $firebase) {

	console.log('ListController');

	$scope.title = 'Schedule List';

	// Firebase API
	var ref = new Firebase(FIREBASE_URL);
	var sync = $scope.$firebase(ref);

	$scope.endpoints = sync.$asArray();

	// New Schedules
	$scope.new_name = '';
	$scope.new = function(){

		if( !$scope.new_name.length ){
			return;
		}

		/*var new_ref = new Firebase(FIREBASE_URL + $scope.new_name);
		var new_sync = $scope.$firebase(new_ref);

		new_db = new_sync.$asArray();
		new_db.$add([]);*/

		var new_path = '/schedules/' + $scope.new_name;

		$location.path( new_path );
		$scope.$apply();
	};
});

app.controller('SchedulesController', function($scope, $route, $routeParams, $location, $firebase) {

	console.log('SchedulesController');

	$scope.params = $routeParams;
	$scope.$firebase = $firebase;

	$scope.title = 'Schedule: ' + $scope.params.schedule;


	$scope.firebase_url = FIREBASE_URL + $scope.params.schedule;

	// Firebase API
	var ref = new Firebase($scope.firebase_url);
	var sync = $scope.$firebase(ref);
	$scope.projects = sync.$asArray();


	// Cloning Schedules
	$scope.clone_name = '';
	$scope.clone = function(){

		if( !$scope.clone_name.length ){
			return;
		}

		var firebase_name = $scope.clone_name;

		var clone_ref = new Firebase(FIREBASE_URL + firebase_name);
		var clone_sync = $scope.$firebase(clone_ref);

		clone_db = clone_sync.$asArray();
		var clone_results = $scope.projects.map(function(element){
			return clone_db.$add(element);
		});

		var clone_path = '/schedules/' + $scope.clone_name;

		$location.path( clone_path );
		$scope.$apply();
	};

	var db_reduce_developers = function(developers, db_row, i){

		if( typeof developers[db_row.developer] === 'undefined'){
			developers[db_row.developer] = [];
		}

		developers[db_row.developer].push(db_row);

		return developers;
	};

	var drawDevelopers = function(){
		var db = angular.copy($scope.projects);

		var developers = db.reduce(db_reduce_developers, {});

		for(developer in developers){
			var developer_projects = developers[developer];
			drawProjectsChart(developer, developer_projects);
		}
	};

	var drawProjectsChart = function(chart_id, projects){

		var data = new google.visualization.DataTable();

		data.addColumn('string', 'Task ID');
		data.addColumn('string', 'Task Name');
		data.addColumn('date', 'Start Date');
		data.addColumn('date', 'End Date');
		data.addColumn('number', 'Duration');
		data.addColumn('number', 'Percent Complete');
		data.addColumn('string', 'Dependencies');

		var database = angular.copy($scope.projects);

		var schedule_rows = database.map(function(schedule, i){
			var row = {
				id: schedule.$id,
				name: schedule.developer + ' | ' + schedule.project,
				start_date: new Date( schedule.start_date ),
				end_date: new Date( schedule.end_date ),
				duration: schedule.hours,
				percent_complete: 0,
				dependencies: ''
			};
			var return_value = [row.id, row.name, row.start_date, row.end_date, row.duration, row.percent_complete, row.dependencies];
			return return_value;
		});
		console.log('add rows', schedule_rows);
		data.addRows(schedule_rows);

		var options = {
			height: 500
		};

		var chart = new google.visualization.Gantt(document.getElementById('gantt-chart'));

		chart.draw(data, options);
	};

	// Google Chart
	$scope.renderCharts = function() {

		drawDevelopers();

		var data = new google.visualization.DataTable();

		data.addColumn('string', 'Task ID');
		data.addColumn('string', 'Task Name');
		data.addColumn('date', 'Start Date');
		data.addColumn('date', 'End Date');
		data.addColumn('number', 'Duration');
		data.addColumn('number', 'Percent Complete');
		data.addColumn('string', 'Dependencies');

		var database = angular.copy($scope.projects);

		var schedule_rows = database.map(function(schedule, i){
			var row = {
				id: schedule.$id,
				name: schedule.developer + ' | ' + schedule.project,
				start_date: new Date( schedule.start_date ),
				end_date: new Date( schedule.end_date ),
				duration: schedule.hours,
				percent_complete: 0,
				dependencies: ''
			};
			var return_value = [row.id, row.name, row.start_date, row.end_date, row.duration, row.percent_complete, row.dependencies];
			return return_value;
		});
		console.log('add rows', schedule_rows);
		data.addRows(schedule_rows);

		var options = {
			height: 500
		};

		var chart = new google.visualization.Gantt(document.getElementById('gantt-chart'));

		chart.draw(data, options);
	};

	google.charts.load('current', {'packages':['gantt']});
	// google.charts.setOnLoadCallback($scope.renderCharts);




	// App Functionality
	$scope.app = {};

	$scope.add = function() {
		var value = angular.copy($scope.app);
		value.start_date = !!value.start_date ? value.start_date.toISOString() : '';
		value.end_date = !!value.end_date ? value.end_date.toISOString() : '';

		$scope.projects.$add(value);
		$scope.app = {};
	};

	$scope.edit = function(value) {

		value.start_date = !!value.start_date ? new Date(value.start_date) : '';
		value.end_date = !!value.end_date ? new Date(value.end_date) : '';

		$scope.app = value
	};

	$scope.delete = function(item) {
		$scope.projects.$remove(item)
	};


	$scope.$watch('projects', function (new_value, old_value) {
		$scope.renderCharts();
	}, true);

});