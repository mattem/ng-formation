angular.module('ngFormation', [])
.factory('formationService', ['formationUtils', '$http', '$cacheFactory', '$q', '$timeout', 
function(fUtils, $http, $cacheFactory, $q, $timeout){

	var objDescriptorCache, objListCache, categoryCache;
	(function(){
		objDescriptorCache = $cacheFactory('objDescriptorCache', {capacity: 10});
		objListCache = $cacheFactory('objListCache', {capacity:1});
		categoryCache = $cacheFactory('categoryCache', {capacity:20});
	})();

	var _unknown = function(objDescriptor, domain){
		return {
			form: fUtils.Unknown(),
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
			switch(type){
				case 'String':
					deferred.resolve(fUtils.String(level, propertyHolder.properyName, propertyHolder.properyName));
					break;
				case 'Boolean':
					deferred.resolve(fUtils.Boolean(level, propertyHolder.properyName));
					break;
				case 'Integer':
				case 'Long':
				case 'Short':
				case 'Float':
					deferred.resolve(fUtils.Number(level, propertyHolder.properyName, '0'));
					break;
				case 'Enum':
					deferred.resolve(fUtils.Enum(level, propertyHolder.properyName, propertyHolder.objectPropertyDescriptor.values));
					break;
				case 'List':
					var 
						label = propertyHolder.properyName || typeDescriptor.innerTypes[0].generalTypes[0],
						valueTyped = {
							objDescriptor: objDescriptor, 
							propertyHolder: typeDescriptor.innerTypes[0], 
							type: typeDescriptor.innerTypes[0].generalTypes[0], 
							typeDescriptor: typeDescriptor.innerTypes[0], 
							outerType: type
						};
					_evaluate(valueTyped, {level: level+1}).then(function(innerHtml){
						deferred.resolve(
							fUtils.List(level, label, typeDescriptor.innerTypes[0].generalTypes[0], innerHtml)
						);
					});
					break;
				case 'Map':
					var 
						oPropDesc = propertyHolder.objectPropertyDescriptor || {mapKeyLabel: 'Key', mapValueLabel: 'Value' },
						label = propertyHolder.properyName || '',
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
					$q.all(innerTypeProms).then(function(innerHtml){
						deferred.resolve(
							fUtils.Map(level, label, 
								oPropDesc.mapKeyLabel, typeDescriptor.innerTypes[0].generalTypes[0], innerHtml[0], 
								oPropDesc.mapValueLabel, typeDescriptor.innerTypes[1].generalTypes[0], innerHtml[1])
						);
					});
					break;
				case 'Interface':
					helper.typesForCategory(propertyHolder.objectPropertyDescriptor.typeCategory).then(function(types){
						var classes = [], names = []; 
						_.each(types, function(ele, i, list){ names.push(ele.objectName); classes.push(ele.className); });
						deferred.resolve(
							fUtils.Interface(level, propertyHolder.properyName, names, classes)
						);
					});
					break;
				case 'Object':
					helper.all().then(function(data){
						var label = propertyHolder.properyName || '';
						deferred.resolve(fUtils.Object(level, label, data, data));
					});
					break;
				default:
					var label = propertyHolder.properyName || type;
					label = fUtils.labelFromClass(label);
					deferred.resolve(fUtils.Nested(level, label, label, type));
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

					console.log($containers, innerType);
					
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
				case 'Object':
					obj.value = {};
					obj.label = fUtils.simpleClassFromClass($field.data('inner-type'));
					var
						level = parseInt(options.level),
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
							if(fUtils.simpletons.indexOf(obj.label) == -1){
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
			var
				ops = {};
				ops.level = options ? options.level : 0;

			if(fUtils.simpletons.indexOf(domain) > -1){
				helper.all().then(function(data){
					var construct = { form: fUtils.buildSimpleType(domain, ops.level, data) };
					deferred.resolve(construct);
				});
				return;
			}
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
						evalPromise = _evaluate(typed, ops)
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
					var all = data.data.concat(fUtils.simpletons).sort();
					console.log('Got formation object list:', all);
					deferred.resolve(all);
					objListCache.put('objects', all);
		  	});
			}
		});
		return deferred.promise;
	};

	helper.forget = function(){
		console.debug('Formation forgetting from objDescriptorCache', objDescriptorCache.info());
		objDescriptorCache.removeAll();
	};

	return helper;
}]);
