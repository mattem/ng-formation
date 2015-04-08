'use strict';

describe('Factory: formation-helper:', function(){

  var f;
  beforeEach(module('ngFormation'));
  beforeEach(
    angular.mock.inject(['formationService', 
      function(_f_){
        f = _f_;
        expect(f).toBeDefined();
      }
    ])
  );

  describe('build()', function(){
    var 
      errorMessage = 'Invalid WS URL',
      wsSpy, sendSpy, fakeWs = {};
    
    beforeEach(function(done){
      jasmine.clock().install();
      done();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    var socketGoReady = function(){
      expect(fakeWs).toBeDefined();
      fakeWs.readyState = 1;
    };

    it('should return a promise when invoked', function(){
      expect(f.build('')).toBeDefined();
    });

  });

});