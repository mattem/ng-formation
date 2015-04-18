angular.module('ngFormation')
.directive('formation', ['$compile', 'formationService', function($compile, f){
	return {
		name: 'formation',
		scope: {
			domain: '=',
			value: '=?',
			debug: '=?'
		},
		controller: function($scope, $element, $attrs, $transclude) {},
		restrict: 'E',
		template: ''
		+'<form class="form-horizontal formation-form">'
			+'<fieldset>'
				+'<legend>{{domain}}</legend>'
				+'<div class="form-group">'
					+'<div class="formation-form-container" id="fcontainer"/>'
				+'</div>'
				+'<div class="form-group" ng-if="domain">'
					+'<div class="col-lg-10">'
						+'<button type="submit" class="btn btn-small btn-primary" ng-click="onSubmitClick()">Submit</button>'
					+'</div>'
				+'</div>'
			+'</fieldset>'
		+'</form>',
		replace: true,
		link: function(scope, iElm, iAttrs, controller) {
			scope.childScopes = [];

			scope.$watch('domain', function(newValue, oldValue, scope) {
				if(newValue !== oldValue){
					console.log('********** Starting build of '+newValue+' **********');
					console.time('formation-builder-timer');
					
				//***********************************************************************
					if(scope.childScopes.length > 0){
						console.debug('Clearning old directive model', scope.childScopes);
						iElm.find('div#fcontainer').empty().off();
						scope.childScopes.forEach(function(cScope, i){
							cScope.$destroy();
						});
						scope.childScopes = [];
						scope.objDescriptor = undefined;
					}
				//************************************************************************

					f.build(newValue).then(function(construct){
						var objDescriptor = construct.descriptor, formHtml = construct.form;

						scope.objDescriptor = objDescriptor;
						if(scope.debug){ scope.debug.objDescriptor = objDescriptor; }
						
						console.debug('$compile HTML ['+formHtml+']');
						console.time('formation-compile-timer');

						$compile(formHtml)(scope.$new(), function(cloneElement, cloneScope){
							iElm.find('div#fcontainer')
								.append(cloneElement)
								.unbind('click')
								.on('click', '.formation-list-entry-btn-add', function(event){
									$(event.target.previousSibling).children('div#formation-list-entry-clean')
										.clone(true)
										.prop('id', uniqueId())
										.removeClass('formation-clean')
										.on('click', 'button.formation-list-entry-btn-remove', function(event) {
	  									$(event.delegateTarget).remove();
	  								})
										.fadeIn('fast')
										.appendTo($(event.target.previousSibling));
								})
								.on('click', '.formation-map-entry-btn-add', function(event){
									$(event.target.previousSibling).children('div#formation-map-entry-clean')
										.clone(true)
										.prop('id', uniqueId())
										.removeClass('formation-map-entry-clean')
										.on('click', 'button.formation-map-entry-btn-remove', function(event) {
	  									$(event.delegateTarget).remove();
	  								})
										.fadeIn('fast')
										.appendTo($(event.target.previousSibling));
								})
								.on('click', '.formation-nested-type-btn-add', function(event){
									var $nestedTypeAddBtn = $(this).hide();
									var $nestedTypeContainer = $(event.target.previousSibling);
									var $nestedTypeHolder = $nestedTypeContainer.find('.formation-nested-type');
									var level = parseInt($nestedTypeContainer.data('level'));

									f.build($nestedTypeContainer.data('type'), {level: level+1}).then(function(nestedConstruct){
										$compile(nestedConstruct.form)(scope.$new(), function(nestedClone, nestedTypeScope){
											scope.childScopes.push(nestedTypeScope);
											$nestedTypeContainer.find('button.formation-nested-type-btn-remove')
												.show()
												.unbind()
												.on('click', function(event) {
													$(this).hide();
			  									$nestedTypeContainer.hide();
			  									$nestedTypeHolder.empty();
			  									$nestedTypeAddBtn.show();
			  								});
											$nestedTypeHolder
												.empty()
												.append(nestedClone)
											$nestedTypeContainer.fadeIn('fast');
										});
									});
								})
								.on('click', '.formation-interface-type-btn-add', function(event){
									var 
										$interfaceTypePickerContainer = $(event.target.previousSibling).find('.formation-interface-type-picker-container').first(),
										interfaceType = $interfaceTypePickerContainer.find('.formation-interface-type-picker').val()
										level = parseInt($(event.target.previousSibling).data('level'));

									f.build(interfaceType, {level: level+1}).then(function(ifaceConstruct){
										$compile(ifaceConstruct.form)(scope.$new(), function(ifaceClone, ifaceScope){
											scope.childScopes.push(ifaceScope);
											$(event.target.previousSibling).find('.formation-field')
												.first()
												.data('inner-type', f.utils.classFromLabel(interfaceType));
											$(event.target.previousSibling).find('.formation-interface-type')
												.empty()
												.append(ifaceClone)
												.addClass('formation-'+interfaceType.replace(/\./g, '-'))
												.addClass('formation-level-'+level);
											$interfaceTypePickerContainer.hide();
											$interfaceTypeAddBtn = $(event.target).hide();
											$(event.target.previousSibling).find('.formation-interface-type-container')
												.fadeIn('fast')
												.on('click', '.formation-interface-type-btn-remove', function(event){
													$(event.delegateTarget).hide();
													$interfaceTypePickerContainer.show();
													$interfaceTypeAddBtn.show();
												});
										});
									});
								})
								.on('click', '.formation-object-type-btn-add', function(event){
									var 
										$container = $(event.target.parentElement);
										type = $container.find('.formation-object-type-picker').first().val(),
										level = parseInt($(event.target).hide().data('level'));

										console.log($container, type, level, event);

									f.build(type, {level: level}).then(function(gConstruct){
										$compile(gConstruct.form)(scope.$new(), function(gClone, gScope){
											scope.childScopes.push(gScope);
											$container.find('.formation-field')
												.first()
												.data('inner-type', f.utils.classFromLabel(type));
											$container.find('.formation-object-type').first()
												.empty()
												.append(gClone);
											$container.find('.formation-object-type-picker-container').first().hide();
											$container.find('.formation-object-type-btn-remove').first()
												.on('click', function(event){
													$container.find('.formation-object-container').first().hide();
													$container.find('.formation-object-type-picker-container').first().show();
													$container.find('.formation-object-type-btn-add').show();
												});
											$container.find('.formation-object-container').first().show();
										});
									});
								});
							scope.childScopes.push(cloneScope);
							console.timeEnd('formation-compile-timer');
						});
						console.timeEnd('formation-builder-timer');
						console.log('********** Done building '+newValue+' ********** (lazily caching inner types for this form)');
					});
				}
			});
		},
		controller: function($scope, $element, $attrs, $transclude) {
			$scope.onSubmitClick = function(){
				console.log('********** Starting serialize form **********');
				console.time('formation-serialize-timer');

				f.serialize($element.find('.formation-form-container'), {level: 0}).then(function(obj){
					console.log(obj);
					$scope.value = obj;
					console.timeEnd('formation-serialize-timer');
					console.log('********** Done serialize form **********');
				});
			};
		},
	};
}])

.directive('formationUnknown', ['formationService', function(f){
	return {
		name: 'formation-unknown',
		scope: {
			requestedType: '@'
		},
		template: ''
			+'<div class="form-group">'
				+'<div class="col-lg-10">'
					+'<div class="well well-sm">'
						+'<span><i class="glyphicon glyphicon-exclamation-sign"></i> {{requestedType}} is unknown</span>'
					+'</div>'
				+'</div>'
			+'</div>',
		replace: true,
		link: function(scope, iElm, iAttrs, controller) {
		}
	};
}])

.directive('formationString', ['formationService', '$q', function(f,$q){
	return {
		name: 'formation-string',
		scope: {
			label: '@',
			placeholder: '@?',
			level: '@'
		},
		template: ''
			+'<div class="form-group formation-field-container formation-String" ng-class=[model.formationLevel]>'
				+'<label class="col-lg-2 control-label" ng-if="label !== \'undefined\'">{{label}}</label>'
				+'<div class="col-lg-10">'
					+'<input type="text" class="form-control formation-field" placeholder="{{placeholder}}" ng-model="value">'
				+'</div>'
			+'</div>',
		replace: true,
		link: function(scope, iElm, iAttrs, controller) {
			scope.model = {};
			scope.model.formationLevel = 'formation-level-'+scope.level;
			scope.uniqueId = uniqueId();
			iElm.find('input.form-control.formation-field')
				.data('type', 'String')
				.data('label', scope.label);
			iElm.find('.formation-field-container')
				.data('type', 'String')
				.data('level', scope.level);
		}
	};
}])

.directive('formationNumber', ['formationService', function(f){
	return {
		name: 'formation-number',
		scope: {
			label: '@',
			level: '@',
			placeholder: '@?',
			min: '@?',
			max: '@?'
		},
		template: ''
			+'<div class="form-group formation-field-container formation-Integer" ng-class="[model.formationLevel]">'
				+'<label class="col-lg-2 control-label" ng-if="label !== \'undefined\'">{{label}}</label>'
				+'<div class="col-lg-10">'
					+'<input type="number" min="min" max="max" class="form-control formation-field" placeholder="{{placeholder}}" ng-model="value">'
				+'</div>'
			+'</div>',
		replace: true,
		link: function(scope, iElm, iAttrs, controller) {
			scope.model = {};
			scope.model.formationLevel = 'formation-level-'+scope.level;

			iElm.find('input.form-control.formation-field')
				.data('type', 'Integer')
				.data('label', scope.label);
			iElm.find('.formation-field-container')
				.data('type', 'Integer')
				.data('level', scope.level);
		}
	};
}])

.directive('formationBoolean', ['formationService', function(f){
	return {
		name: 'formation-boolean',
		scope: {
			label: '@',
			level: '@'
		},
		template: ''
			+'<div class="form-group formation-field-container formation-Boolean" ng-class="model.formationLevel">'
				+'<label class="col-lg-2 control-label">{{label}}</label>'
				+'<div class="col-lg-10 formation-field">'
				  +'<div class="radio">'
				    +'<label>'
				      +'<input type="radio" ng-value="true" value="true" ng-model="value">'
				      +'True'
				    +'</label>'
				  +'</div>'
				  +'<div class="radio">'
				    +'<label>'
				      +'<input type="radio" ng-value="false" value="false" ng-model="value">'
				      +'False'
				    +'</label>'
				  +'</div>'
				+'</div>'
			+'</div>',
		replace: true,
		compile: function(tElm, tAttrs){
			return {
				pre: function(scope, iElm, iAttrs){
					iElm.find('input').prop('name', scope.label+'-'+uniqueId());
				},
				post: function(scope, iElm, iAttrs){
					scope.model = {};
        	scope.model.formationLevel = 'formation-level-'+scope.level;
					iElm.find('.formation-field')
						.data('type', 'Boolean')
						.data('label', scope.label);
					iElm.find('.formation-field-container')
						.data('type', 'Boolean')
						.data('level', scope.level);
				}
			}
		}
	};
}])                   

.directive('formationEnum', ['formationService', function(f){
	return {
		name: 'formation-enum',
		scope: {
			label: '@',
			values: '@',
			level: '@'
		},
		template: ''
			+'<div class="form-group formation-field-container formation-Enum" ng-class="[model.formationLevel]">'
				+'<label class="col-lg-2 control-label">{{label}}</label>'
				+'<div class="col-lg-10">'
					+'<select class="form-control formation-field">'
						+'<option ng-repeat="(k, v) in model.enums">{{v}}</option>'
					+'</select>'
				+'</div>'
			+'</div>',
		replace: true,
		link: function(scope, iElm, iAttrs, controller) {
			iElm.find('select.formation-field')
				.data('type', 'Enum')
				.data('label', scope.label);
			iElm.find('.formation-field-container')
				.data('level', scope.level)
				.addClass('level', 'formation-level-'+scope.level)
				.data('type', 'Enum');

			scope.model = {};
			scope.model.formationLevel = 'formation-level-'+scope.level;
			scope.$watch('values', function(newValue, oldValue, scope){
				if(angular.isDefined(newValue)){
					scope.model.enums = newValue.split(',');
				}
			});
		}
	};
}])

.directive('formationMap', ['formationService', '$compile', function(f, $compile){
	return {
		name: 'formation-map',
		scope: {
			label: '@',
			keyLabel: '@',
			keyDomain: '@',
			valueLabel: '@',
			valueDomain: '@',
			level: '@'
		},
		template: ''
			+'<div class="form-group formation-field-container formation-Map" ng-class="[model.formationLevel]">'
				+'<label class="col-lg-2 control-label">{{label}}</label>'
					+'<div class="col-lg-10">'
						+'<div class="formation-map-entry-container formation-field">'
							+'<div class="well well-sm" id="formation-map-entry-clean" ng-multi-transclude-controller>'
								+'<div class="row">'
									+'<div class="col-lg-12">'
										+'<span control-label">{{keyLabel}}</span>'
										+'<div id="formation-map-key-input">'
											+'<div ng-multi-transclude="keyInputEle"></div>'
										+'</div>'
									+'</div>'
								+'</div>'
								+'<div class="row">'
									+'<div class="col-lg-12">'
										+'<span control-label">{{valueLabel}}</span>'
										+'<div id="formation-map-value-input">'
											+'<div ng-multi-transclude="valueInputEle" ng-class="\'formation-map-value-input\'"></div>'
										+'</div>'
									+'</div>'
								+'</div>'
								+'<button type="button" class="btn btn-xs btn-danger formation-map-entry-btn-remove">'
									+'<span class="glyphicon glyphicon-minus-sign"></span> Remove'
								+'</button>'
							+'</div>'
						+'</div>'
						+'<button type="button" class="btn btn-xs btn-primary formation-map-entry-btn-add">'
							+'<span class="glyphicon glyphicon-plus-sign"></span> Add Entry'
						+'</button>'
					+'</div>'
				+'</div>'
			+'</div>',
		replace: true,
		transclude: true,
		compile: function(tElm, tAttrs){
			tElm.find('div.formation-map-entry-container').prop('id',  uniqueId())
			tElm.find('div.formation-map-entry-clean').prop('id',  uniqueId());
			return {
				pre: function(scope, iElm, iAttrs){
				},
        post: function(scope, iElm, iAttrs){
        	scope.model = {};
        	scope.model.formationLevel = 'formation-level-'+scope.level;
        	iElm.find('div#formation-map-entry-clean').hide();

        	iElm.find('.formation-field').first()
						.data('type', 'Map')
						.data('label', scope.label)
						.data('inner-key-type', scope.keyDomain)
						.data('inner-key-label', scope.keyLabel)
						.data('inner-value-type', scope.valueDomain)
						.data('inner-value-label', scope.valueLabel);
        }
      };
		},
	};
}])

.directive('formationList', ['formationService', '$compile', function(f, $compile){
	return {
		name: 'formation-list',
		scope: {
			label: '@',
			innerTypeName: '@',
			level: '@'
		},
		template: ''
			+'<div class="form-group formation-field-container formation-List" ng-class="[model.formationLevel]">'
				+'<label class="col-lg-2 control-label" ng-if="label">{{label}}</label>'
					+'<div class="col-lg-10">'
						+'<div class="formation-list-entry-container formation-field">'
							+'<div class="well well-sm formation-clean" id="formation-list-entry-clean">'
								+'<div class="row">'
									+'<div class="col-lg-12">'
										+'<div ng-transclude></div>'
									+'</div>'
								+'</div>'
								+'<button type="button" class="btn btn-xs btn-danger formation-list-entry-btn-remove">'
									+'<span class="glyphicon glyphicon-minus-sign"></span> Remove'
								+'</button>'
							+'</div>'
						+'</div>'
						+'<button type="button" class="btn btn-xs btn-primary formation-list-entry-btn-add">'
							+'<span class="glyphicon glyphicon-plus-sign"></span> Add {{model.addBtnLabel}} Entry'
						+'</button>'
					+'</div>'
				+'</div>'
			+'</div>',
		replace: true,
		transclude: true,
		compile: function(tElm, tAttrs){
			tElm.find('div.formation-list-entry-container').prop('id',  uniqueId())
			tElm.find('div.formation-list-entry-clean').prop('id',  uniqueId());
			return {
				pre: function(scope, iElm, iAttrs){
				},
        post: function(scope, iElm, iAttrs){
        	scope.model = {};
        	scope.model.formationLevel = 'formation-level-'+scope.level;
        	scope.model.addBtnLabel = f.utils.labelFromClass(scope.innerTypeName);
        	iElm.find('.formation-field').first()
						.data('type', 'List')
						.data('inner-type', scope.innerTypeName)
						.data('label', scope.label);
					iElm.find('.formation-field-container').first()
						.data('level', scope.level)
						.addClass('level', 'formation-level-'+scope.level)
						.data('type', 'List');
					iElm.find('div#formation-list-entry-clean').hide();
        }
      };
		},
	};
}])

.directive('formationNestedType', ['formationService', '$compile', function(f, $compile){
	return {
		name: 'formation-nested-type',
		scope: {
			label: '@',
			nestedTypeName: '@',
			nestedTypeClass: '@',
			level: '@'
		},
		template: ''
			+'<div class="form-group formation-field-container" ng-class="[model.formationLevel, model.formationNestedTypeClass]">'
				+'<label class="col-lg-2 control-label" ng-if="label">{{label}}</label>'
					+'<div class="col-lg-10">'
						+'<div class="formation-nested-type-container">'

							+'<div class="well well-sm formation-field">'
								+'<div class="row">'
									+'<div class="col-lg-12">'
										+'<div class="formation-nested-type"></div>'
									+'</div>'
								+'</div>'
								+'<button type="button" class="btn btn-xs btn-danger formation-nested-type-btn-remove">'
									+'<span class="glyphicon glyphicon-minus-sign"></span> Remove'
								+'</button>'
							+'</div>'

						+'</div>'
						+'<button type="button" class="btn btn-xs btn-primary formation-nested-type-btn-add">'
							+'<span class="glyphicon glyphicon-plus-sign"></span> Add {{label}}'
						+'</button>'
					+'</div>'
				+'</div>'
			+'</div>',
		replace: true,
		transclude: true,
		compile: function(tElm, tAttrs){
			tElm.find('div.formation-nested-type-container').prop('id',  uniqueId())
			return {
				pre: function(scope, iElm, iAttrs){
					scope.model = {};
					scope.model.formationNestedTypeClass = 'formation-'+scope.nestedTypeClass.replace(/\./g, '-');
					scope.model.formationLevel = 'formation-level-'+scope.level;
				},
        post: function(scope, iElm, iAttrs){
					iElm.find('div.formation-nested-type-container')
						.hide()
						.data('level', scope.level)
						.data('type', scope.nestedTypeClass);

					iElm.find('.formation-field').first()
						.data('label', scope.label)
						.data('type', scope.nestedTypeClass);

					iElm.find('.formation-field-container').first()
						.data('type', scope.nestedTypeClass)
						.data('level', scope.level)
        }
      };
		},
	};
}])

.directive('formationInterface', ['formationService', '$compile', function(f, $compile){
	return {
		name: 'formation-interface',
		scope: {
			label: '@',
			types: '@',
			names: '@',
			level: '@'
		},
		template: ''
			+'<div class="form-group formation-field-container formation-Interface" ng-class="[model.formationLevel, model.formationNestedTypeClass]">'
				+'<label class="col-lg-2 control-label" ng-if="label">{{label}}</label>'
					+'<div class="col-lg-10">'
						+'<div class="formation-interface-grouping-container">'
							+'<div class="form-group formation-interface-type-picker-container">'
								+'<div class="col-lg-10">'
									+'<select class="form-control formation-interface-type-picker">'
										+'<option ng-repeat="(k, v) in model.names" value="{{model.types[k]}}">{{v}}</option>'
									+'</select>'
								+'</div>'
							+'</div>'
							+'<div class="formation-interface-type-container formation-field">'
								+'<div class="well well-sm">'
									+'<div class="row">'
										+'<div class="col-lg-12">'
											+'<div class="formation-interface-type"></div>'
										+'</div>'
									+'</div>'
								+'</div>'
								+'<button type="button" class="btn btn-xs btn-danger formation-interface-type-btn-remove">'
									+'<span class="glyphicon glyphicon-minus-sign"></span> Remove'
								+'</button>'
							+'</div>'
						+'</div>'
						+'<button type="button" class="btn btn-xs btn-primary formation-interface-type-btn-add">'
							+'<span class="glyphicon glyphicon-asterisk"></span> Create'
						+'</button>'
					+'</div>'
				+'</div>'
			+'</div>',
		replace: true,
		transclude: true,
		compile: function(tElm, tAttrs){
			tElm.find('div.formation-interface-type-container').prop('id',  uniqueId())
			return {
				pre: function(scope, iElm, iAttrs){
				},
        post: function(scope, iElm, iAttrs){
					iElm.find('div.formation-interface-type-container').hide();
					scope.model = { types: scope.types.split(','), names: scope.names.split(',') };
					scope.model.formationLevel = 'formation-level-'+scope.level;

					iElm.find('.formation-field').first()
						.data('label', scope.label)
						.data('type', 'Interface');

					iElm.find('.formation-interface-grouping-container').first()
						.data('level', scope.level)
        }
      };
		},
	};
}])

.directive('formationObject', ['formationService', '$compile', function(f, $compile){
	return {
		name: 'formation-interface',
		scope: {
			label: '@',
			types: '@',
			names: '@',
			level: '@'
		},
		template: ''
			+'<div class="form-group formation-Object formation-field-container" ng-class=[model.formationLevel]>'
				+'<label class="col-lg-2 control-label" ng-if="label">{{label}}</label>'
					+'<div class="col-lg-10">'

						+'<div class="form-group formation-object-type-picker-container">'
							+'<div class="col-lg-10">'
								+'<select class="form-control formation-object-type-picker">'
									+'<option ng-repeat="(k, v) in model.names" value="{{model.types[k]}}">{{v}}</option>'
								+'</select>'
							+'</div>'
						+'</div>'

						+'<div class="formation-object-container formation-field">'
							+'<div class="well well-sm">'
								+'<div class="row">'
									+'<div class="col-lg-12">'
										+'<div class="formation-object-type"></div>'
									+'</div>'
								+'</div>'
							+'</div>'
							+'<button type="button" class="btn btn-xs btn-danger formation-object-type-btn-remove">'
								+'<span class="glyphicon glyphicon-minus-sign"></span> Remove'
							+'</button>'
						+'</div>'

						+'<button type="button" class="btn btn-xs btn-primary formation-object-type-btn-add">'
							+'<span class="glyphicon glyphicon-asterisk"></span> Create'
						+'</button>'

					+'</div>'
				+'</div>'
			+'</div>',
		replace: true,
		transclude: true,
		compile: function(tElm, tAttrs){
			tElm.find('div.formation-interface-type-container').prop('id',  uniqueId())
			return {
				pre: function(scope, iElm, iAttrs){},
        post: function(scope, iElm, iAttrs){
					scope.model = { types: scope.types.split(','), names: scope.names.split(',') };
					scope.model.formationLevel = 'formation-level-'+scope.level;

					iElm.find('div.formation-object-container').first().hide();
					iElm.find('.formation-field').first().data('type', 'Object');
					iElm.find('button.formation-object-type-btn-add').first()
						.data('level', scope.level)
        }
      };
		},
	};
}]);

var uniqueId = function(){
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
};
