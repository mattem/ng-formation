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
		+'<form class="form-horizontal" id="formationForm">'
			+'<fieldset>'
				+'<legend>{{domain}}</legend>'
				+'<div class="form-group">'
					+'<div id="fcontainer"/>'
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
			var childScopes = [];

			scope.$watch('domain', function(newValue, oldValue, scope) {
				if(newValue !== oldValue){
					console.log('********** Starting build of '+newValue+' **********');
					console.time('formation-builder-timer');
					
				//***********************************************************************
					if(childScopes.length > 0){
						console.debug('Clearning old directive model', childScopes);
						iElm.find('div#fcontainer').empty();
						childScopes.forEach(function(cScope, i){
							cScope.$destroy();
						});
						childScopes = [];
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
										.removeClass('formation-list-entry-clean')
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

									console.log(event, $nestedTypeContainer);

									f.build($nestedTypeContainer.data('nestedTypeClass')).then(function(nestedConstruct){
										$compile(nestedConstruct.form)(scope.$new(), function(nestedClone, nestedTypeScope){
											childScopes.push(nestedTypeScope);
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
										$interfaceTypePicker = $(event.target.previousSibling).find('.formation-interface-type-picker'),
										interfaceType = $interfaceTypePicker.val();

									f.build(interfaceType).then(function(ifaceConstruct){
										$compile(ifaceConstruct.form)(scope.$new(), function(ifaceClone, ifaceScope){
											childScopes.push(ifaceScope);
											$(event.target.previousSibling).find('.formation-interface-type')
												.empty()
												.append(ifaceClone);
											$interfaceTypePicker.hide();
											$interfaceTypeAddBtn = $(event.target).hide();
											$(event.target.previousSibling).find('.formation-interface-type-container')
												.fadeIn('fast')
												.on('click', '.formation-interface-type-btn-remove', function(event){
													$(event.delegateTarget).hide();
													$interfaceTypeAddBtn.show();
													$interfaceTypePicker.show();
												});
										});
									});
								});
							childScopes.push(cloneScope);
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
				var v = {}, objDescriptor = $scope.objDescriptor;
				v[objDescriptor.objectName] = {};
				objDescriptor.propertyHolders.forEach(function(prop, i){
					if(prop.hasOwnProperty('value')){
						v[objDescriptor.objectName][prop.properyName] = prop.value;
					}
				});
				$scope.value = v;

				console.timeEnd('formation-serialize-timer');
				console.log('********** Done serialize form **********', v);
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

.directive('formationString', ['formationService', function(f){
	return {
		name: 'formation-string',
		scope: {
			label: '@',
			placeholder: '@?'
		},
		template: ''
			+'<div class="form-group">'
				+'<label class="col-lg-2 control-label" ng-if="label !== \'undefined\'">{{label}}</label>'
				+'<div class="col-lg-10">'
					+'<input type="text" class="form-control" placeholder="{{placeholder}}">'
				+'</div>'
			+'</div>',
		replace: true,
		link: function(scope, iElm, iAttrs, controller) {
		}
	};
}])

.directive('formationNumber', ['formationService', function(f){
	return {
		name: 'formation-number',
		scope: {
			label: '@',
			placeholder: '@?',
			min: '@?',
			max: '@?'
		},
		template: ''
			+'<div class="form-group">'
				+'<label class="col-lg-2 control-label" ng-if="label !== \'undefined\'">{{label}}</label>'
				+'<div class="col-lg-10">'
					+'<input type="number" min="min" max="max" class="form-control" placeholder="{{placeholder}}">'
				+'</div>'
			+'</div>',
		replace: true,
		link: function(scope, iElm, iAttrs, controller) {
		}
	};
}])

.directive('formationBoolean', ['formationService', function(f){
	return {
		name: 'formation-boolean',
		scope: {
			label: '@'
		},
		template: ''
			+'<div class="form-group">'
				+'<label class="col-lg-2 control-label">{{label}}</label>'
				+'<div class="col-lg-10">'
				  +'<div class="radio">'
				    +'<label>'
				      +'<input type="radio" ng-value="true">'
				      +'True'
				    +'</label>'
				  +'</div>'
				  +'<div class="radio">'
				    +'<label>'
				      +'<input type="radio" ng-value="false">'
				      +'False'
				    +'</label>'
				  +'</div>'
				+'</div>'
			+'</div>',
		replace: true,
		compile: function(tElem, tAttrs){
			return {
				pre: function(scope, iElem, iAttrs){
					iElem.find('input').prop('name', scope.label+'-'+uniqueId());
				},
			}
		}
	};
}])                   

.directive('formationEnum', ['formationService', function(f){
	return {
		name: 'formation-enum',
		scope: {
			label: '@',
			values: '@'
		},
		template: ''
			+'<div class="form-group">'
				+'<label class="col-lg-2 control-label">{{label}}</label>'
				+'<div class="col-lg-10">'
					+'<select class="form-control">'
						+'<option ng-repeat="(k, v) in model.enums">{{v}}</option>'
					+'</select>'
				+'</div>'
			+'</div>',
		replace: true,
		link: function(scope, iElm, iAttrs, controller) {
			scope.model = {};
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
			outerDomain: '@',
			keyLabel: '@',
			keyDomain: '@',
			valueLabel: '@',
			valueDomain: '@'
		},
		template: ''
			+'<div class="form-group">'
				+'<label class="col-lg-2 control-label">{{label}}</label>'
					+'<div class="col-lg-10">'
						+'<div class="formation-map-entry-container">'

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
											+'<div ng-multi-transclude="valueInputEle"></div>'
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
		compile: function(tElem, tAttrs){
			tElem.find('div.formation-map-entry-container').prop('id',  uniqueId())
			tElem.find('div.formation-map-entry-clean').prop('id',  uniqueId());
			return {
				pre: function(scope, iElem, iAttrs){
				},
        post: function(scope, iElem, iAttrs){
        	iElem.find('div#formation-map-entry-clean').hide();
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
			innerTypeName: '@'
		},
		template: ''
			+'<div class="form-group">'
				+'<label class="col-lg-2 control-label" ng-if="label">{{label}}</label>'
					+'<div class="col-lg-10">'
						+'<div class="formation-list-entry-container">'

							+'<div class="well well-sm" id="formation-list-entry-clean">'
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
							+'<span class="glyphicon glyphicon-plus-sign"></span> Add {{innerTypeName}}'
						+'</button>'
					+'</div>'
				+'</div>'
			+'</div>',
		replace: true,
		transclude: true,
		compile: function(tElem, tAttrs){
			tElem.find('div.formation-list-entry-container').prop('id',  uniqueId())
			tElem.find('div.formation-list-entry-clean').prop('id',  uniqueId());
			return {
				pre: function(scope, iElem, iAttrs){
				},
        post: function(scope, iElem, iAttrs){
					iElem.find('div#formation-list-entry-clean').hide();
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
			nestedTypeClass: '@'
		},
		template: ''
			+'<div class="form-group">'
				+'<label class="col-lg-2 control-label" ng-if="label">{{label}}</label>'
					+'<div class="col-lg-10">'
						+'<div class="formation-nested-type-container">'

							+'<div class="well well-sm">'
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
							+'<span class="glyphicon glyphicon-plus-sign"></span> Add {{nestedTypeName}}'
						+'</button>'
					+'</div>'
				+'</div>'
			+'</div>',
		replace: true,
		transclude: true,
		compile: function(tElem, tAttrs){
			tElem.find('div.formation-nested-type-container').prop('id',  uniqueId())
			return {
				pre: function(scope, iElem, iAttrs){
				},
        post: function(scope, iElem, iAttrs){
					iElem.find('div.formation-nested-type-container')
						.hide()
						.data('nestedTypeClass', scope.nestedTypeClass);
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
			names: '@'
		},
		template: ''
			+'<div class="form-group">'
				+'<label class="col-lg-2 control-label" ng-if="label">{{label}}</label>'
					+'<div class="col-lg-10">'
						+'<div class="formation-interface-grouping-container">'
							+'<div class="form-group">'
								+'<div class="col-lg-10">'
									+'<select class="form-control formation-interface-type-picker">'
										+'<option ng-repeat="(k, v) in model.names" value="{{model.types[k]}}">{{v}}</option>'
									+'</select>'
								+'</div>'
							+'</div>'
							+'<div class="formation-interface-type-container">'
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
							+'<span class="glyphicon glyphicon-plus-sign"></span> Add'
						+'</button>'
					+'</div>'
				+'</div>'
			+'</div>',
		replace: true,
		transclude: true,
		compile: function(tElem, tAttrs){
			tElem.find('div.formation-interface-type-container').prop('id',  uniqueId())
			return {
				pre: function(scope, iElem, iAttrs){
				},
        post: function(scope, iElem, iAttrs){
					iElem.find('div.formation-interface-type-container').hide();
					scope.model = { types: scope.types.split(','), names: scope.names.split(',') }
        }
      };
		},
	};
}]);

var uniqueId = function(){
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
};
