angular.module('ngFormation')
.factory('formationUtils', [function(){

	var utils = function(){
		var 

		_labelFromClass = function(className){
			var index = className.lastIndexOf('.');
			if(index == -1) return className.match(/[A-Z][a-z]+/g).join(' ');
			return className.substring(index+1, className.length).match(/[A-Z][a-z]+/g).join(' ');
		},
		_classFromLabel = function(label){
			return label.replace(/ /g,'');
		},
		_simpleClassFromClass = function(simpleClass){
			return _classFromLabel(_labelFromClass(simpleClass));
		};


		return {
			labelFromClass: _labelFromClass,
			classFromLabel: _classFromLabel,
			simpleClassFromClass: _simpleClassFromClass
		};
	}();
	

	return utils;

}]);