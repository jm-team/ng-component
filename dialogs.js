// module
var app = require('../app')

function Dialogs(){
  
  this.resolveKeys = []
  this.scope = {}
  this.locals = {}
  this.element = null
  this.resolves = []
  this.controllerName = ''
}

Dialogs.prototype.creatHTML = function(config){
  var header = '<div class="dialog-header">'+config.dialogHeader+'</div>'
  var footer = '<div class="dialog-footer">'+config.dialogFooter+'</div>'
  var _template = '<div class="dialog-content">' + (config.template)+'</div>'
  var _templateUrl = config.templateUrl
  var templateCache = this.$templateCache
  var q = this.$q
  var defer = q.defer()

  if(_templateUrl){
    http.get(_templateUrl, {
      cache: templateCache
    }).then(function(response){
      defer.resolve(response.data)
    })
  }else{
    return q.when('<div class="dialog-bg '+config.backdropClass+'" ng-click="DropCloseDialogs($event)"><div ng-click="$event.stopPropagation()" class="dialog-box '+config.className+'">'+
      (header + _template + footer)+
      '<i ng-click="close($event)" class="dialog-icon-close">&times;</i></div></div>')
  }
  return defer.promise
}


Dialogs.prototype.resolve = function(config){
  var q = this.$q
  if(angular.isObject(config.resolve)){
    for(var attr in config.resolve){
      this.resolveKeys.push(attr)
      this.resolves.push(config.resolve[attr]())
    }
  }
  return q.all(this.resolves)
}

Dialogs.prototype.render = function(data,config){
  var scope = this.scope
  var animate = this.$animate
  var controller = this.$controller
  var compile = this.$compile

  this.element = angular.element(data)

  if (this.controllerName) {
    this.locals.$scope = scope;
    var ctrl = controller(this.controllerName, this.locals);
    if (this.controllerAs) {
      scope[this.controllerAs] = ctrl
    }else if (this.locals) {
      for (var prop in this.locals) {
        scope[prop] = this.locals[prop];
      }
    }
  }
  compile(this.element)(scope)
  console.log(this.container)
  return animate.enter(this.element, this.container)
}

Dialogs.prototype.modal = function(config){
  var http = this.$http
  var q = this.$q
  var rootScope = this.$rootScope
  var controller = this.$controller

  var scope = this.scope = rootScope.$new();
  var defer = q.defer()
  var self = this

  this.container = angular.element(config.container || document.body)
  this.controllerAs = config.controllerAs
  this.controllerName = config.controller || null
  this.locals = config.locals || {}

  this.resolve(config).then(function(data){
    angular.forEach(data, function(item, index){
      scope[self.resolveKeys[index]] = item;
    });
    return self.creatHTML(config)
  }).then(function(data){
    if(!self.element){
      self.render(data,config)
    }
  })

  scope.ok = function($event){
    self.element.remove()
    scope.$destroy()

    if(angular.isFunction(config.okCallback)){
      config.okCallback($event,scope)
    }
    defer.resolve(scope)
  }

  scope.DropCloseDialogs = function(){
    if(angular.isUndefined(config.isBackdropClickClose) || config.isBackdropClickClose){
      scope.close()
    }
  }

  scope.close = function(){
    self.element.remove()
    self.element = null
    scope.$destroy()
  }

  scope.cancel = function($event){
    scope.close()
    defer.reject()

    if(angular.isFunction(config.cancelCallback)){
      config.cancelCallback($event,scope)
    }
  }

  return defer.promise;
}

Dialogs.prototype.alert = function(config){
  var cof = angular.extend(config, {
    dialogHeader: '<h3 class="dialog-title">'+(config.title || '温馨提示')+'</h3>',
    dialogFooter: '<button class="btn-sm btn-primary " ng-click="ok($event)">确定</button>'
  })
  return this.modal(cof)
}

Dialogs.prototype.confirm = function(config){
  var cof = angular.extend(config, {
    dialogHeader: '<h3 class="dialog-title">'+(config.title || '温馨提示')+'</h3>',
    dialogFooter: '<button class="btn-sm btn-primary " ng-click="ok($event)">确定</button><button class="btn-sm btn-primary " ng-click="cancel($event)">取消</button>'
  })
  return this.modal(cof)
}

app.provider('dialogs', {
  instance: new Dialogs(),

  $get:['$document', '$compile', '$q', '$http', '$rootScope', '$controller', '$animate', '$templateCache',
  function($document, $compile, $q, $http, $rootScope, $controller, $animate, $templateCache){
    this.instance.$document = $document
    this.instance.$compile = $compile
    this.instance.$q = $q
    this.instance.$http = $http
    this.instance.$controller = $controller
    this.instance.$rootScope = $rootScope
    this.instance.$animate = $animate
    this.templateCache = $templateCache
    return this.instance
  }]
})
