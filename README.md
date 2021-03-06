# ng-formation

[![Build Status](https://travis-ci.org/mattem/ng-formation.svg?branch=master)](https://travis-ci.org/mattem/ng-formation)

> Formation is currently under development, so not all features listed may not work as advertised 

### What is ng-formation?
Formation lets you build dynamic forms easily from a Spring Boot project (see [formation-spring-boot-starter](https://github.com/mattem/formation-spring-boot-starter) for more on that).

Having the backend processing would be nothing without something to render the form on the front end, and if your project uses AngularJS, then you can simply use _ng-formation_. It provides an easy directive to render the form description generated by the backend.

## Quick Start

Install using bower:

Soon!

Add it to your applications angular module as a dependancy: 

```javascript
angular
  .module('myapp', [
    'ngFormation'
  ])
```

Add the directive your view:


```html
<formation domain="'MyJavaObject'"></formation>
```

Have a look at the [wiki](https://github.com/mattem/ng-formation/wiki) for more options and examples.

## License

The MIT License (MIT)
