angular.module('ngFormation', [])
.factory('formationService', ['$http', '$cacheFactory', '$q', function($http, $cacheFactory, $q){

	var _evaluate = function(objDescriptor, propertyHolder, type, typeDescriptor){
		var deferred = $q.defer();
		setTimeout(function(){
			console.debug('Evaluating property', propertyHolder, 'Using type ['+type+']');
			var propHtml = '', generalType = propertyHolder.propertyGeneralType;
			switch(type){
				case 'String':
					propHtml = '' 
					+'<formation-string label="'+propertyHolder.properyName+'" placeholder="'+propertyHolder.properyName+'">'
					+'</formation-string>';
					deferred.resolve(propHtml);
					break;
				case 'Boolean':
					propHtml = ''
					+'<formation-boolean label="'+propertyHolder.properyName+'"></formation-boolean>';
					deferred.resolve(propHtml);
					break;
				case 'Integer':
				case 'Long':
					propHtml = '' 
					+'<formation-number label="'+propertyHolder.properyName+'" placeholder="0"></formation-number>';
					deferred.resolve(propHtml);
					break;
				case 'Enum':
					var values = propertyHolder.objectPropertyDescriptor.values.join();
					propHtml = ''
					+'<formation-enum label="'+propertyHolder.properyName+'" values="'+values+'">'
					+'</formation-enum>';
					deferred.resolve(propHtml);
					break;
				case 'List':
					var oPropDesc = propertyHolder.objectPropertyDescriptor;
					propHtml = ''
					+'<formation-list label="'+propertyHolder.properyName+'" inner-type-name="'+typeDescriptor.innerTypes[0].generalTypes[0]+'">';
					// now resolve inner types
					_evaluate(objDescriptor, typeDescriptor.innerTypes[0], typeDescriptor.innerTypes[0].generalTypes[0], typeDescriptor.innerTypes[0])
					.then(function(innerHtml){
						propHtml += innerHtml+'</formation-list>';
						deferred.resolve(propHtml);
					});
					break;
				case 'Map':
					var oPropDesc = propertyHolder.objectPropertyDescriptor || {mapKeyLabel: 'Key', mapValueLabel: 'Value' };
					var label = propertyHolder.properyName || '';

					propHtml = ''
					+'<formation-map outer-domain="'+objDescriptor.objectName+'" label="'+label+'" '
					+'key-label="'+oPropDesc.mapKeyLabel+'" value-label="'+oPropDesc.mapValueLabel+'" '
					+' key-domain="'+typeDescriptor.innerTypes[0].generalTypes[0]+'" value-domain="'+typeDescriptor.innerTypes[1].generalTypes[0]+'">'
					
					// resolve inner types
					var 
						innerTypeProms = [],
						keyProm = _evaluate(objDescriptor, typeDescriptor.innerTypes[0], typeDescriptor.innerTypes[0].generalTypes[0], typeDescriptor.innerTypes[0]),
						valueProm = _evaluate(objDescriptor, typeDescriptor.innerTypes[1], typeDescriptor.innerTypes[1].generalTypes[0], typeDescriptor.innerTypes[1]);

					innerTypeProms.push(keyProm, valueProm);
					$q.all(innerTypeProms).then(function(innerHtmls){
							 propHtml+= '<div name="keyInputEle">'+innerHtmls[0]+'</div>';
							 propHtml+= '<div name="valueInputEle">'+innerHtmls[1]+'</div></formation-map>';
						deferred.resolve(propHtml);
					});
					break;
				case 'Interface':
					helper.typesForCategory(propertyHolder.objectPropertyDescriptor.typeCategory).then(function(types){
						var classes = [], names = []; 
						_.each(types, function(ele, i, list){ names.push(ele.objectName); classes.push(ele.className); });
						classes = classes.join();
						names = names.join();
						propHtml = ''
						+'<formation-interface label="'+propertyHolder.properyName+'" names="'+names+'" types="'+classes+'">'
						+'</formation-interface>';
						deferred.resolve(propHtml);
					});
					break;
				default:
					// helper.build(type).then(function(construct){
						
					// });
					var label = propertyHolder.properyName || '';
					propHtml += ''
					+'<formation-nested-type nested-type-name="'+label+'" label="'+label+'" nested-type-class="'+propertyHolder.propertyGeneralType+'">'
					+'</formation-nested-type>'
					deferred.resolve(propHtml);
					break;
			}
		});
		return deferred.promise;
	};

	var _forType = function(){

	};

	var helper = {};
	helper.build = function(domain){
		var deferred = $q.defer();
		setTimeout(function(){
			helper.describe(domain).then(function(objDescriptor){
				var formHtml = [], proms = [];
				
				objDescriptor.propertyHolders.forEach(function(propertyHolder, index){
					var evalPromise = _evaluate(objDescriptor, propertyHolder, propertyHolder.propertyGeneralType, propertyHolder.propertyTypeDescriptor)
					.then(function(propHtml){
						formHtml.push(propHtml);
					});
					proms.push(evalPromise);
				});

				$q.all(proms).then(function(){
					var construct = {
						descriptor: objDescriptor,
						form: formHtml.join('')
					};
					deferred.resolve(construct);
				});

			});
		});
		return deferred.promise;
	};

	helper.describe = function(domain){
		return $http.get('http://localhost:8080/formation/describe/?object='+domain).then(function(data, status, headers, config){
			console.debug(domain+' described as', data.data);
			return data.data; 
		});
	};

	helper.typesForCategory = function(category){
		return $http.get('http://localhost:8080/formation/category/?category='+category).then(function(data, status, headers, config){
			console.debug('Category ['+category+'] listed as', data.data);
			return data.data;
		});
	};

	helper.evaluate = function(){
		var _byPropertyName = function(outerDomain, properyName, innerPropertyIndex){
			var deferred = $q.defer();
			setTimeout(function(){
				helper.describe(outerDomain).then(function(objDescriptor){
					var pHolder = _.find(objDescriptor.propertyHolders, function(p){ return p.properyName === properyName });
					console.log(pHolder);
					var innerPHolder = pHolder.propertyTypeDescriptor.innerTypes[innerPropertyIndex];
					console.log(innerPHolder);
					_evaluate(objDescriptor, innerPHolder, innerPHolder.generalTypes[0]).then(function(propHtml){
						var construct = {
							descriptor: objDescriptor,
							form: propHtml
						};
						deferred.resolve(construct);
					});
				});
			});
			return deferred.promise;
		};

		return{
			byPropertyName: _byPropertyName
		};
	}();

	return helper;
}]);
