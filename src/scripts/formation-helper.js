angular.module('ngFormation', [])
.factory('formationService', ['$http', '$cacheFactory', '$q', function($http, $cacheFactory, $q){

	var objDescriptorCache, constructCache; 
	(function(){
		objDescriptorCache = $cacheFactory('objDescriptorCache', {capacity: 10});
		constructCache = $cacheFactory('constructCache', {capacity:10});

		objDescriptorCache.removeAll();
		constructCache.removeAll();
	})();

	var _unknown = function(objDescriptor, domain){
		return {
			form: '<formation-unknown requested-type="'+domain+'"></formation-unknown>',
			objDescriptor: objDescriptor
		};
	};

	var _evaluate = function(typed, build){
		var 
			objDescriptor = typed.objDescriptor, 
			propertyHolder = typed.propertyHolder, 
			type = typed.type, 
			typeDescriptor = typed.typeDescriptor, 
			outerType = typed.outerType,
			deferred = $q.defer(),
			build = build || {};

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
					var valueTyped = {
							objDescriptor: objDescriptor, 
							propertyHolder: typeDescriptor.innerTypes[0], 
							type: typeDescriptor.innerTypes[0].generalTypes[0], 
							typeDescriptor: typeDescriptor.innerTypes[0], 
							outerType: type
						};
					_evaluate(valueTyped).then(function(innerHtml){
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
						keyTyped = {
							objDescriptor: objDescriptor, 
							propertyHolder: typeDescriptor.innerTypes[0], 
							type: typeDescriptor.innerTypes[0].generalTypes[0], 
							typeDescriptor: typeDescriptor.innerTypes[0], 
							outerType: type
						},
						valueTyped = {
							objDescriptor: objDescriptor, 
							propertyHolder: typeDescriptor.innerTypes[1], 
							type: typeDescriptor.innerTypes[1].generalTypes[0], 
							typeDescriptor: typeDescriptor.innerTypes[1], 
							outerType: type,
						},
						keyProm = _evaluate(keyTyped),
						valueProm = _evaluate(valueTyped);

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
					var label = propertyHolder.properyName || '';
					propHtml += ''
					+'<formation-nested-type nested-type-name="'+label+'" label="'+label+'" nested-type-class="'+type+'">'
					+'</formation-nested-type>';
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
			if(angular.isUndefined(domain) || domain == 'undefined'){
				deferred.resolve(_unknown());
				return;
			}
			var construct = constructCache.get(domain);
			if(angular.isDefined(construct)){
				console.debug('Serving form for ['+domain+'] from cache');
				deferred.resolve(construct);
			}else{
				helper.describe(domain).then(function(objDescriptor){
					var formHtml = [], proms = [];
					
					objDescriptor.propertyHolders.forEach(function(propertyHolder, index){
						var typed = {
								objDescriptor: objDescriptor, 
								propertyHolder: propertyHolder, 
								type: propertyHolder.propertyGeneralType, 
								typeDescriptor: propertyHolder.propertyTypeDescriptor, 
								outerType: 'NONE',
							},
						evalPromise = _evaluate(typed)
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

						console.debug('Caching form for ['+domain+']');
						constructCache.put(domain, construct);
					});

				});
			}
		});
		return deferred.promise;
	};

	helper.describe = function(domain){
		var deferred = $q.defer();

		setTimeout(function(){
			if(angular.isUndefined(domain) || domain == 'undefined'){
				deferred.reject();
				return;
			}
			var objDescriptor = objDescriptorCache.get(domain);
			if(angular.isDefined(objDescriptor)){
				console.debug(domain+' found in cache, described as', objDescriptor);
				deferred.resolve(objDescriptor);
			}else{
				$http.get('http://localhost:8080/formation/describe/?object='+domain).then(function(data, status, headers, config){
					console.debug(domain+' described as', data.data);
					deferred.resolve(data.data); 
					objDescriptorCache.put(domain, data.data);
				});
			}
		});
		return deferred.promise;
	};

	helper.typesForCategory = function(category){
		return $http.get('http://localhost:8080/formation/category/?category='+category).then(function(data, status, headers, config){
			console.debug('Category ['+category+'] listed as', data.data);
			return data.data;
		});
	};

	helper.forget = function(){
		console.debug('Formation forgetting from objDescriptorCache', objDescriptorCache.info());
		objDescriptorCache.removeAll();
		console.debug('Formation forgetting from constructCache', constructCache.info());
		constructCache.removeAll();
	};

	return helper;
}]);
