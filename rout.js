(function(global){
  var Rout=function rout(Conf){
    //set the triggers
    this.setTriggers();
    //set standart position (index)
    global.location.hash=Conf.index||'';
    //Save Conf
    this.Config=Conf;
    return this;
  };
  /*
    Устанавливаем обработчики
  */
  Rout.prototype.setTriggers=function(){
    var t=this;
    if('onhashchange' in global) global.addEventListener("hashchange", function(){t.trigger.call(t)}, false);
    if('onpopstate' in global) global.addEventListener("onpopstate", function(){t.trigger.call(t)}, false);
  };
  /*
    Добавляем Rout элемент.
    var RoutObject - {"link":"/link/mask",function};
  */
  Rout.prototype.addLink=function(RoutObject){
    var isSet=false;
    if(this.Routs.length>0){
      for(var key in this.Routs){
        if(this.Routs[key]['link']==RoutObject['link']) isSet=true;
      }
    }
    if(!isSet) this.Routs[this.Routs.length]=RoutObject;
    if(this.History.length<1) this.trigger();
    return this;
  };
  /*
    Добавляем стандартный элемент страницы 404.
    var RoutObject - {"link":"/link/mask",function};
  */
  Rout.prototype.set404=function(RoutObject){
    this.Rout404=RoutObject; return this;
  };
  /*
    Устанавливаем URL и вызываем обработчик
    var Location - string '/link/page';
  */
  Rout.prototype.setURL=function(Location){
    this.PathName=Location; this.trigger(); return this;
  };
  /*
    Получение URL в зависимости от режима работы.
    Hash mode - работа с hash api
    URL mode - работа с history api
    Path Name - ручное управление url (Сделано для node js)
  */
  Rout.prototype.getURL=function(){
    var URL='';
    if(this.HashMode==true) URL=global.location.hash.substring(1);
    else if(this.URLMode==true) URL=global.location.pathname.substring(1);
    else if(this.PathName.length>0) URL=this.PathName.substring(1);
    return URL;
  };
  /*
    Перебор и поиск соответствий в исписке Routs.
    В случае если элементы небыли найдены вызывается стандартный элемент Rout404
  */
  Rout.prototype.trigger = function () {
    for(var index in this.Routs){
      var LocationHash=this.getURL(),TestRout=this.Routs[index]['link'];
      if(this.testLink(TestRout,LocationHash)) {
        this.addHistory(this.Routs[index], LocationHash);
        return this.CallFunction(this.Routs[index],LocationHash);
      }
    } console.warn('WARNING: no link established. 404!');
    if(typeof this.Rout404!='undefined') return this.CallFunction(this.Rout404,false);
  };
  /*
    Вызов переданого Rout.
    var RoutObject - {"link":"/link/mask",function}
    var Link - string '/link/page';
  */
  Rout.prototype.CallFunction=function(RoutObject,Link){
    if(Link!=false) RoutObject['function'].call(this.RoutScoup(RoutObject,Link));
    else RoutObject['function'].call({'error':404,'msg':'WARNING: no link established'});
  }
  /*
    Тестируем ссылку на соответствие с переданным Rout.
    var RoutObject - {"link":"/link/mask",function}
    var Link - string '/link/page';
  */
  Rout.prototype.testLink=function(RoutLink,Link){
    return (new RegExp('^'+RoutLink.replace(/\(\:[a-z0-9]+\)/i,'')+'$','i')).test(Link);
  };
  /*
    Разбираем url для получения параметров из url.
    URL должен быть строковым или соотвествовать JavaScript RegExp за исклюсчением вставок вида (:varName) определяющих имена переменных в которые будут передаваться данные из url.
    var RoutObject - {"link":"/link/mask",function}
    var Link - string (Пример: /page/(:id)[0-9]+)
  */
  Rout.prototype.RoutScoup=function(RoutObject,Link){
    if(/\(\:[a-z-0-9_]+\)/i.test(RoutObject['link'])){
      var LinkArray=Link.split('/'); var RoutArray=RoutObject['link'].split('/'); var Reusult={};
      for(var index in RoutArray){
        if(/\(\:[a-z-0-9_]+\)/i.test(RoutArray[index])){
          var Name=RoutArray[index].match(/\(\:[a-z-0-9_]+\)/i)[0]; Name = Name.substring(2,Name.length-1);
          Reusult[Name]=LinkArray[index];
        }
      }
      return Reusult;
    } else return {};
  };
  /*
    Получение истории.
  */
  Rout.prototype.getHistory = function(){
      return this.History;
  };
  /*
    Добавление Rout в историю.
    var RoutObject - {"link":"/link/mask",function}
    var Location - string '/link/page';
  */
  Rout.prototype.addHistory = function(RoutObject, Location){
      this.unActive();
      var HistoryElement = RoutObject; HistoryElement['location'] = Location; HistoryElement['active'] = true; this.History[this.History.length] = HistoryElement;
  };
  /*
    Деактивируем все элементы истории.
  */
  Rout.prototype.unActive = function(){
      for(var i in this.History) this.History[i]['active'] = false;
  };
  /*
    Перемещаем активный элемент истории и вызываем его.
  */
  Rout.prototype.go = function (to) {
      this.unActive();
      if(to >= 0){
          this.History[to]['active'] = true;
          this.CallFunction(this.History[to],this.History[to]['location']);
      } else {
          var positon = this.History.length - 1 + (to);
          this.History[positon]['active'] = true;
          this.CallFunction(this.History[positon], this.History[positon]['location']);
      } return this;
  };
  Rout.prototype.back = function(){
      return this.go(-1);
  };
  Rout.prototype.Routs=[];    //Objects {"link":"/link/mask",function}
  Rout.prototype.Rout404={};  //Object  {function} function for work in error 404
  Rout.prototype.Config={};   //Object  {"index":"/index"}
  Rout.prototype.History=[];  //Objects {"link":"/link/mask",function,'location':'/link/page','active':bollean}
  Rout.prototype.PathName='';  //For work in node js server
  Rout.prototype.HashMode=true;  //Work with window hash api
  Rout.prototype.URLMode=false;  //Work with html5 history api (location.pathname)
  //Export
  global.RouteCross=Rout;
})(window);
