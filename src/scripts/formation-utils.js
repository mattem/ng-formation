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
		},
		_buildSimpleType = function(type, level, allTypes){
			switch(type){
				case 'String':
					return _String(level, 'String', 'String', 'text');
					break;
				case 'Number':
					return _Number(level, 'Number', '0');
					break;
				case 'Boolean':
					return _Boolean(level, 'Boolean');
					break;
				case 'List':
					return _List(level, 'List', 'Object', undefined, allTypes);
					break;
				case 'Map':
					return _Map(level, 'Map', 'Key', 'Object', undefined, 'Value', 'Object', undefined, allTypes);
					break;
				case 'Object':
					return _Object(level, 'Object', allTypes, allTypes);
					break;
			}
		},
		_simpletons = ['String', 'Number', 'Boolean', 'List', 'Map', 'Object'],
		_String = function(level, label, placeholder, fieldType, required){
			return ''
				+'<formation-string label="'+label+'" placeholder="'+placeholder+'" level="'+level+'" field-type="'+fieldType+'" required="'+required+'">'
				+'</formation-string>';
		},
		_Number = function(level, label, placeholder){
			return '<formation-number label="'+label+'" placeholder="'+placeholder+'" level="'+level+'"></formation-number>';
		},
		_Boolean = function(level, label){
			return '<formation-boolean label="'+label+'" level="'+level+'"></formation-boolean>';
		},
		_Enum = function(level, label, values){
			if(angular.isArray(values)) values = values.join();
			return '<formation-enum label="'+label+'" values="'+values+'" level="'+level+'"></formation-enum>';
		},
		_List = function(level, label, innerTypeName, entryHTML, allTypes){
			if(entryHTML === '' || entryHTML == null || angular.isUndefined(entryHTML)){
				entryHTML = _Object(level+1, 'Object', allTypes, allTypes);
			}
			return ''
				+'<formation-list label="'+label+'" inner-type-name="'+innerTypeName+'" level="'+level+'">'
				+entryHTML
				+'</formation-list>';
		},
		_Map = function(level, label, keyLabel, keyDomain, keyHTML, valueLabel, valueDomain, valueHTML, allTypes){
			if(keyHTML === '' || keyHTML == null || angular.isUndefined(keyHTML)){
				keyHTML = _Object(level+1, 'Object', allTypes, allTypes);
			}
			if(valueHTML === '' || valueHTML == null || angular.isUndefined(valueHTML)){
				valueHTML = _Object(level+1, 'Object', allTypes, allTypes);
			}
			return 	''
				+'<formation-map label="'+label+'" level="'+level+'" '
				+'key-label="'+keyLabel+'" key-domain="'+keyDomain+'" ' 
				+'value-label="'+valueLabel+'" value-domain="'+valueDomain+'">'
				+'<div name="keyInputEle">'+keyHTML+'</div>'
				+'<div name="valueInputEle">'+valueHTML+'</div>'
				+'</formation-map>';
		},
		_Interface = function(level, label, names, types){
			if(angular.isArray(names)) names = names.join();
			if(angular.isArray(types)) types = types.join();
			return ''
				+'<formation-interface label="'+label+'" names="'+names+'" types="'+types+'" level="'+level+'">'
				+'</formation-interface>'
		},
		_Object = function(level, label, names, types){
			if(angular.isArray(names)) names = names.join();
			if(angular.isArray(types)) types = types.join();
			return ''
				+'<formation-object label="'+label+'" names="'+types+'" types="'+types+'" level="'+level+'">'
				+'</formation-object>';
		},
		_Nested = function(level, label, nestedTypeName, nestedTypeClass){
			return ''
				+'<formation-nested-type nested-type-name="'+nestedTypeName+'" label="'+label+'" nested-type-class="'+nestedTypeClass+'" level="'+level+'">'
				+'</formation-nested-type>';
		},
		_Unknown = function(type){
			return '<formation-unknown requested-type="'+type+'"></formation-unknown>';
		};

		return {
			labelFromClass: _labelFromClass,
			classFromLabel: _classFromLabel,
			simpleClassFromClass: _simpleClassFromClass,
			
			buildSimpleType: _buildSimpleType,
			simpletons: _simpletons,

			String: _String, 
			Number: _Number,
			Boolean: _Boolean,
			Enum: _Enum,
			List: _List,
			Map: _Map,
			Interface: _Interface,
			Object: _Object,
			Nested: _Nested,
			Unknown: _Unknown
		};
	}();
	

	return utils;

}]);