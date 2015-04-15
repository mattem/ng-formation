var 
  stringCalibrationClass = {"objectName":"Formation String Calibration Class","className":"me.mattem.formation.calibration.FormationStringCalibrationClass","propertyHolders":[{"properyName":"SimpleStringTwo","propertyTypeDescriptor":{"generalTypes":["String"],"typeUnknown":false},"propertyGeneralType":"String"},{"properyName":"SimpleString","propertyTypeDescriptor":{"generalTypes":["String"],"typeUnknown":false},"propertyGeneralType":"String"}]},
  F_URL = 'http://localhost:8080/formation',
  F_DESCRIBE = F_URL+'/describe/?object=',
  OBJECT_DESCRIPTORS = {
    StringCalibrationClass: stringCalibrationClass
  };

describe('Factory: formation-helper:', function(){

  var f, $httpBackend, $timeout, $rootScope;
  beforeEach(module('ngFormation'));
  beforeEach(
    angular.mock.inject(['formationService', '$httpBackend', '$timeout', '$rootScope', function(_f_, _$httpBackend_, _$timeout_, _$rootScope_){
        f = _f_;
        expect(f).toBeDefined();

        $httpBackend = _$httpBackend_;
        expect($httpBackend).toBeDefined();

        $timeout = _$timeout_;
        expect($timeout).toBeDefined();

        $rootScope = _$rootScope_;
        expect($rootScope).toBeDefined();
      }
    ])
  );

  describe('build()', function(){
    beforeEach(function(done){
      $httpBackend.when('GET', F_DESCRIBE+'String Calibration Class').respond(OBJECT_DESCRIPTORS.StringCalibrationClass);
      done();
    });

    afterEach(function() {

    });

    it('should return a promise when invoked', function(){
      expect(f.build('')).toBeDefined();
    });

    it('should build the String Calibration Class correctly', function(done){
      $httpBackend.expectGET(F_DESCRIBE+'String Calibration Class');

      f.build('String Calibration Class').then(function(construct){
        // Check the form
        var handler = new Tautologistics.NodeHtmlParser.DefaultHandler(function (error, dom) { 
          if(error){
            this.fail(error);
          }

          var str1 = dom[0], str2 = dom[1];

          // Check String1 and it's attributes
          expect(str1.name).toBe('formation-string');
          expect(str1.attribs.label).toBe('SimpleStringTwo');
          expect(str1.attribs.placeholder).toBe('SimpleStringTwo');
          expect(str1.attribs.level).toBe('0');
          expect(str1.children).toBeUndefined();

          // Check String2 and it's attributes
          expect(str2.name).toBe('formation-string');
          expect(str2.attribs.label).toBe('SimpleString');
          expect(str2.attribs.placeholder).toBe('SimpleString');
          expect(str2.attribs.level).toBe('0');
          expect(str2.children).toBeUndefined();

          done();
        });
        var parser = new Tautologistics.NodeHtmlParser.Parser(handler);
        parser.parseComplete(construct.form);
      });

      $timeout.flush(1);
      $httpBackend.flush();
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
      $timeout.flush(30);
    });

  });

});

