angular.module('ngFormation', [])
.factory('formationService', ['formationUtils', '$http', '$cacheFactory', '$q', '$timeout', 
function(fUtils, $http, $cacheFactory, $q, $timeout){

	var objDescriptorCache, constructCache, objListCache, categoryCache;
	(function(){
		objDescriptorCache = $cacheFactory('objDescriptorCache', {capacity: 10});
		constructCache = $cacheFactory('constructCache', {capacity:10});
		objListCache = $cacheFactory('objListCache', {capacity:1});
		categoryCache = $cacheFactory('categoryCache', {capacity:20});
	})();

	var _unknown = function(objDescriptor, domain){
		return {
			form: '<formation-unknown requested-type="'+domain+'"></formation-unknown>',
			objDescriptor: objDescriptor
		};
	};

	var _evaluate = function(typed, options){
		var 
			objDescriptor = typed.objDescriptor, 
			propertyHolder = typed.propertyHolder, 
			type = typed.type, 
			typeDescriptor = typed.typeDescriptor, 
			outerType = typed.outerType,
			deferred = $q.defer(),
			level = options.level;

		$timeout(function(){
			console.debug('Evaluating property', propertyHolder, 'Using type ['+type+']');
			var propHtml = '', generalType = propertyHolder.propertyGeneralType;
			switch(type){
				case 'String':
					propHtml = '' 
					+'<formation-string label="'+propertyHolder.properyName+'" placeholder="'+propertyHolder.properyName+'" level="'+level+'">'
					+'</formation-string>';
					deferred.resolve(propHtml);
					break;
				case 'Boolean':
					propHtml = ''
					+'<formation-boolean label="'+propertyHolder.properyName+'" level="'+level+'"></formation-boolean>';
					deferred.resolve(propHtml);
					break;
				case 'Integer':
				case 'Long':
					propHtml = '' 
					+'<formation-number label="'+propertyHolder.properyName+'" placeholder="0" level="'+level+'"></formation-number>';
					deferred.resolve(propHtml);
					break;
				case 'Enum':
					var values = propertyHolder.objectPropertyDescriptor.values.join();
					propHtml = ''
					+'<formation-enum label="'+propertyHolder.properyName+'" values="'+values+'" level="'+level+'">'
					+'</formation-enum>';
					deferred.resolve(propHtml);
					break;
				case 'List':
					var oPropDesc = propertyHolder.objectPropertyDescriptor,
					label = propertyHolder.properyName || typeDescriptor.innerTypes[0].generalTypes[0];
					propHtml = ''
					+'<formation-list label="'+label+'" inner-type-name="'+typeDescriptor.innerTypes[0].generalTypes[0]+'" level="'+level+'">';
					// now resolve inner types
					var valueTyped = {
							objDescriptor: objDescriptor, 
							propertyHolder: typeDescriptor.innerTypes[0], 
							type: typeDescriptor.innerTypes[0].generalTypes[0], 
							typeDescriptor: typeDescriptor.innerTypes[0], 
							outerType: type
						};
					_evaluate(valueTyped, {level: level+1}).then(function(innerHtml){
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
					+' key-domain="'+typeDescriptor.innerTypes[0].generalTypes[0]+'" value-domain="'+typeDescriptor.innerTypes[1].generalTypes[0]+'" '
					+'level="'+level+'">';
					
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
						keyProm = _evaluate(keyTyped, {level: level+1}),
						valueProm = _evaluate(valueTyped, {level: level+1});

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
						+'<formation-interface label="'+propertyHolder.properyName+'" names="'+names+'" types="'+classes+'" level="'+level+'">'
						+'</formation-interface>';
						deferred.resolve(propHtml);
					});
					break;
				default:
					var label = propertyHolder.properyName || type;
					label = fUtils.labelFromClass(label);
					propHtml += ''
					+'<formation-nested-type nested-type-name="'+label+'" label="'+label+'" nested-type-class="'+type+'" level="'+level+'">'
					+'</formation-nested-type>';
					deferred.resolve(propHtml);
					break;
			}
		});
		return deferred.promise;
	};

	var _processContainer = function($container, options){
		var d = $q.defer();
		$timeout(function(){
			console.debug('Processing container', $container, 'with options', options);
			$field = $container.find('.formation-field').not('.formation-clean').not(':hidden').first();
			console.debug('Using field', $field);
			_serializeField($field, options).then(function(prop){
				d.resolve(prop);
			});
		});
		return d.promise;
	};

	var _defaultOptions = {wrapped: true};
	var _serializeField = function($field, options){
		var deferred = $q.defer();
		$timeout(function(){
			options = $.extend({}, _defaultOptions, options);
			
			console.debug('Starting to process ['+$field[0]+'] Using options', options);

			var type = $field.data('type'), obj = {label: '', value:''};
			if(angular.isUndefined(type)){
				deferred.resolve({});
				return;
			}

			console.debug('Found data type ['+type+'] on field');
			switch(type){
				case 'String':
					obj.label = $field.data('label');
					obj.value = $field.val();
					deferred.resolve(obj);
					break;
				case 'Integer':
					obj.label = $field.data('label');
					obj.value = parseInt($field.val(), 10);
					deferred.resolve(obj);
					break;
				case 'Boolean':
					obj.label = $field.data('label');
					obj.value = ($field.find('input[type="radio"]:checked').val() === 'true');
					deferred.resolve(obj);
					break;
				case 'Enum':
					obj.label = $field.data('label');
					obj.value = $field.find('option:selected').val();
					deferred.resolve(obj);
					break;
				case 'List':
					obj.value = [];
					obj.label = $field.data('label');
					var 
						innerType = $field.data('inner-type'),
						level = parseInt(options.level) + 1,
						$containers = $field.find('.formation-field-container.formation-'+innerType.replace(/\./g, '-')+'.formation-level-'+level),
						proms = [];
					
					$containers.each(function(i, elm){
						var $container = $(elm);
						if($container.is(':visible')){
							var op = {level: level};
							var p = _processContainer($container, op);
							proms.push(p);
						}
					});
					$q.all(proms).then(function(ar){
						ar.forEach(function(item){
							obj.value.push(item.value);
						});
						deferred.resolve(obj);
					});
					break;
				case 'Map':
					obj.value = {};
					obj.label = $field.data('label');
					var 
						innerKeyType = $field.data('inner-key-type'),
						innerValueType = $field.data('inner-value-type')
						level = parseInt(options.level) + 1,
						$keyContainers = $field.find('#formation-map-key-input:visible')
							.find('.formation-field-container.formation-'+innerKeyType.replace(/\./g, '-')+'.formation-level-'+level+':visible'),
						$valueContainers = $field.find('#formation-map-value-input:visible')
							.find('.formation-field-container.formation-'+innerValueType.replace(/\./g, '-')+'.formation-level-'+level+':visible');

					if($keyContainers.length == 0){
						deferred.resolve(obj);
						return; 
					}

					var _numProps = function(cObj){
						var count = 0;
						for(var k in cObj){if(cObj.hasOwnProperty(k)) count++;}
						return count;
					};

					var _processKeyValuePair = function($kElm, $vElm, $valueContainers, options){
						if($kElm.is(':visible') && $vElm.is(':visible')){
							_processContainer($kElm, options).then(function(keyItem){
								_processContainer($vElm, options).then(function(valueItem){
									obj.value[keyItem.value] = valueItem.value;
									if(_numProps(obj.value) == $valueContainers.length){
										deferred.resolve(obj);
									}
								});
							});
						}
					};

					var _processKeyValueContainers = function($keyContainers, $valueContainers){
						var i = 0, op = {level: level, wrapped: false};
						while(i < $keyContainers.length){
							var 
								$kElm = $($keyContainers[i]),
								$vElm = $($valueContainers[i]);
							_processKeyValuePair($kElm, $vElm, $valueContainers, op);
							i++;
						};
					};
					_processKeyValueContainers($keyContainers, $valueContainers);
					break;
				case 'Interface':
					obj.value = {};
					obj.label = fUtils.simpleClassFromClass($field.data('inner-type'));

					var 
						innerType = $field.data('inner-type'),
						level = parseInt(options.level)+1,
						$containers = $field.find('.formation-field-container.formation-level-'+level),
						proms = [];

					//obj.value[innerType] = {};

					$containers.each(function(i, elm){
						var $container = $(elm);
						if($container.is(':visible')){
							var op = {level: level, wrapped: options.wrapped};
							proms.push(_processContainer($container, op));
						}
					});
					$q.all(proms).then(function(ar){
						ar.forEach(function(item){
							if(options.wrapped){
								obj.value[item.label] = item.value;
							}else{
								obj.value = item.value;
							}
						});
						deferred.resolve(obj);
					});

					break;
				default:
					obj.value = {};
					obj.label = $field.data('label');
					var 
						level = parseInt(options.level) + 1,
						nestedType = $field.data('nested-type'), 
						$containers = $field.find('.formation-field-container.formation-level-'+level),
						proms = [];

					$containers.each(function(i, elm){
						var $container = $(elm);
						if($container.is(':visible')){
							var op = {level: level, wrapped: options.wrapped};
							proms.push(_processContainer($container, op));
						}
					});
					$q.all(proms).then(function(ar){
						ar.forEach(function(item){
							if(options.wrapped){
								obj.value[item.label] = item.value;
							}else{
								obj.value = item.value;
							}
						});
						deferred.resolve(obj);
					});
					break;
			};
		});
		return deferred.promise;
	};

	var helper = {utils: fUtils};
	helper.build = function(domain, options){
		var deferred = $q.defer();
		$timeout(function(){
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

						ops = {};
						ops.level = options ? options.level : 0;

						var evalPromise = _evaluate(typed, ops)
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

						//console.debug('Caching form for ['+domain+']');
						//constructCache.put(domain, construct);
					});

				});
			}
		});
		return deferred.promise;
	};

	helper.serialize = function($form, options){
		var deferred = $q.defer(), obj = {}, proms = [];
		$timeout(function(){
			$form.children('.formation-field-container').each(function(i,elm){
				var p = _processContainer($(elm), options);
				p.then(function(prop){
					if(angular.isDefined(prop) && prop.hasOwnProperty('label') && prop.hasOwnProperty('value'))
						obj[prop.label] = prop.value;
				});
				proms.push(p);
			});
			$q.all(proms).then(function(){
				deferred.resolve(obj);
			});
		});
		return deferred.promise;
	};

	helper.describe = function(domain){
		var deferred = $q.defer();

		$timeout(function(){
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
		var deferred = $q.defer();
		$timeout(function(){
			if(angular.isUndefined(category)){
				deferred.reject();
				return;
			}
			var cat = categoryCache.get(category);
			if(angular.isDefined(cat)){
				console.debug(category+' found in cache as', cat);
				deferred.resolve(cat);
			}else{
				$http.get('http://localhost:8080/formation/category/?category='+category).then(function(data, status, headers, config){
					console.debug('Category ['+category+'] listed as', data.data);
					categoryCache.put(category, data.data);
					deferred.resolve(data.data);
				});
			}
		});
		return deferred.promise;
	};

	helper.all = function(){
		var deferred = $q.defer();
		$timeout(function(){
			var all = objListCache.get('objects');
			if(angular.isDefined(all)){
				console.log('Found all in cache as', all);
				deferred.resolve(all);
			}else{
				$http.get('http://localhost:8080/formation/list').then(function(data, status, headers, config){
					console.log('Got formation object list:', data.data);
					deferred.resolve(data.data);
					objListCache.put('objects', data.data);
		  	});
			}
		});
		return deferred.promise;
	};

	helper.forget = function(){
		console.debug('Formation forgetting from objDescriptorCache', objDescriptorCache.info());
		objDescriptorCache.removeAll();
		console.debug('Formation forgetting from constructCache', constructCache.info());
		constructCache.removeAll();
	};

	return helper;
}]);
