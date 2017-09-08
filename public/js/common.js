var validator = {}

validator.select = function(objects){
    this.objects = objects;
    return this;
}

validator.match = function(validate){
    var object;
    if(this.type() === Array){
        for(var i in this.objects){
            object = this.objects[i];
            if(!validate(object+"")){
                return false;
            }
        }
    }else if(this.type() === String){
        object = this.objects
        if(!validate(object+""))
            return false;
    }else if(this.type() === Object){
        for(var i in this.objects){
            object = this.objects[i];
            if(!validate(object+"")){
                return false;
            }
        }
    }
    return true;
}

validator.isNumeric = function(){
    return this.match(function(object){
        return object.search(/^-?[0-9]+$/)==-1?false:true;
    });
}

validator.isInt = function(){
    return this.match(function(object){
        return object.search(/^(?:-?(?:0|[1-9][0-9]*))$/)==-1?false:true;
    });
}

validator.isDecimal = function(){
    return this.match(function(object){
        return object.search(/^(?:-?(?:0|[1-9][0-9]*))?(?:\.[0-9]*)?$/)==-1?false:true;
    });
}

validator.isArray = function(){
    return Array.isArray(this.objects);
}

validator.isEmail = function(){
    return this.match(function(object){
        return object.search(/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/)==-1?false:true;
    });
}

validator.isUrl = function(){
    return this.match(function(object){
        return object.search(/^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i)==-1?false:true;
    });
}

validator.isIP = function(){
    return this.match(function(object){
        return object.search(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)==-1?false:true;
    });
}

validator.isAlpha = function(){
    return this.match(function(object){
        return object.search(/^[a-zA-Z]+$/)==-1?false:true;
    });
}

validator.isAlphaAndNumber = function(){
    return this.match(function(object){
        return object.search(/^[a-zA-Z0-9]+$/)==-1?false:true;
    });
}

validator.isLowercase = function(){
    return this.match(function(object){
        return object.search(/^[a-z0-9]+$/)==-1?false:true;
    });
}

validator.isUppercase = function(){
    return this.match(function(object){
        return object.search(/^[A-Z0-9]+$/)==-1?false:true;
    });
}

validator.notEmpty = function(){
    return this.match(function(object){
        return object.search(/^[\s\t\r\n]*$/)==-1?true:false;
    });
}

validator.contains = function(str){
    return this.match(function(object){
        return object.indexOf(str)!=-1;
    });
}

validator.startWith = function(str){
    return this.match(function(object){
        return object.indexOf(str) == 0;
    });
}

validator.endWith = function(str){
    return this.match(function(object){
        return object.lastIndexOf(str) == object.length - str.length;
    });
}
// 电话号码验证，400，800
validator.isPhone=function(value) {
 //  var tel = /^(0[0-9]{2,3}\-)?([2-9][0-9]{6,7})+(\-[0-9]{1,4})?$/;
//  var tel=/^(((400|800)-(\d{3})-(\d{4}))|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{3,7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)$/

	var tel=/^(((400|800)-(\d{3})-(\d{4}))|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)$/
    return tel.test(value);
};


// 电话号码验证 增加170号
validator.isMobile=function(value) {
    var length = value.length;
    var mobile = /^((\(\d{3}\))|(\d{3}\-))?13[0-9]\d{8}|15[0-9]\d{8}|170\d{8}|18[0-9]\d{8}$/;

    return  (length == 11 && mobile.test(value));
};

validator.length = function(min, max){
    return this.match(function(object){
        if(max){
            return object.length >= min && object.length <= max;
        }

        return object.length >= min;
    });
}

validator.type = function(){
    return this.objects.constructor;
}


function loading(){
    $.fancybox.showLoading();
}

function hideSheet(dir){
  $.sheetbox.close(dir);
}

function hideLoading(){
    $.fancybox.hideLoading();
}

function modal(url, callback, wrapper){
  $.get(url,function(data){
      if(callback){
        callback(data);
        if(wrapper){
          $("#modal").html(data);
          $('#modal').modal('toggle');
        }
      }else{
        $("#modal").html(data);
        $('#modal').modal('toggle');
      }
  });
}

function hideModal(){
  $('#modal').modal('hide');
}

//bPopup confirm
function confirmModal(details, callback){
    var s = "<div class='tc' style='margin:40px auto 30px;font-size:18px;'>"+details+"</div>";
    s += " <div class='tc'>" +
        "<a href='javascript:;' class='btn'>确定</a> " +
        "<a href='javascript:;' style='margin-left:25px;'>取消</a>" +
        "</div>";

    var obj =$('#confirm_to_pop_up').bPopup({
        speed: 650,
        onOpen: function() {
            $('#confirm_to_pop_up').html(s);
        },
        onClose: function() {
        },
        modalClose: false
    });

    $($("a",obj)[0]).click(function(){
        obj.close();
        callback();
        return false;
    });
    $($("a",obj)[1]).click(function(){
        obj.close();
        return false;
    });
}
//bPopup alert
function alertModal(details, callback){
    var s = "<div class='tc' style='margin:40px auto 30px;font-size:18px;'>"+details+"</div>";
    s += " <div class='tc'>" +
        "<a href='javascript:;' class='btn'>确定</a> " +
        "</div>";

    var obj =$('#alert_pop_up').bPopup({
        speed: 650,
        appending:true,
        onOpen: function() {
            $('#alert_pop_up').html(s);
        }
    });

    $($("a",obj)[0]).click(function(){
        obj.close();
        if(callback)
            callback();
    });
}

function confirmModal_bak(details, callback){
  var s = "<div class='modal fade' style='width:300px;margin-left:-150px;'><div class='modal-header'>";
  s += "<button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>";
  s += "<h3>提示</h3></div>";
  s += "<div class='modal-body'><p>"+details+"</p></div>";
  s += "<div class='modal-footer'><a href='javascript:;' class='btn'>确认</a><a href='javascript:;' data-dismiss='modal' class='btn'>取消</a></div></div>";
  var obj = $(s).modal('toggle');
  $($("a",obj)[0]).click(function(){
    $(obj).modal('hide');
    callback();
    return false;
  });
}

function alertModal_bak(details, callback){
  var s = "<div class='modal fade' style='width:300px;margin-left:-150px;'><div class='modal-header'>";
  s += "<button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>";
  s += "<h3>提示</h3></div>";
  s += "<div class='modal-body'><p>"+details+"</p></div>";
  s += "<div class='modal-footer'><a href='javascript:;' data-dismiss='modal' class='btn'>确认</a></div></div>";
  var obj = $(s).modal('toggle');
  $($("a",obj)[0]).click(function(){
    $(obj).modal('hide');
  });
  $(obj).on('hidden', function () {
    if(callback)
      callback();
  });
  $(obj).on('hidden.bs.modal', function () {
    if(callback)
      callback();
  });

}

function loadVideo(id){
  flowplayer(id, "/js/flowplayer/flowplayer-3.2.16.swf",{
    clip: {
        autoPlay: false,
        autoBuffering: false
    },
    plugins:  {

        // controlbar settings
        controls:  {
            backgroundGradient: 'none',
            backgroundColor: '#333333',
            all:false,
            play:true,
            volume:true,
            mute:true,
            time:true,
            stop:false,
            playlist:false,
            fullscreen:true,
            height:30
        }
    },
    canvas: {
        //backgroundImage: 'url(/media/img/demos/helloworld.jpg)'
        // use a wicked backgound color
        backgroundColor: '#999999'
    }
  });
}

function loadAudio(id){
  flowplayer(id, "/js/flowplayer/flowplayer-3.2.16.swf",{
    clip: {
        autoPlay: false,
        autoBuffering: false
    },
    plugins:  {
        audio: {
            url: "/js/flowplayer/flowplayer.audio-3.2.10.swf"
        },
        // controlbar settings
        controls:  {
            backgroundGradient: 'none',
            backgroundColor: '#333333',
            all:false,
            play:true,
            volume:true,
            mute:true,
            time:true,
            stop:false,
            playlist:false,
            fullscreen:true,
            height:30
        }
    },
    canvas: {
      backgroundColor: '#999999'
    }
  });
}

function getCaptcha(obj, name){
   $.get("/captcha?name="+(name==undefined?"":name)+"&random="+Math.random(), function(data){
      $(obj).attr("src",data);
   });
}

function getSMSCode(mobile, callback){
   $.get("/sms?mobile="+mobile, function(data){
      callback(data);
   });
}

function countDown(obj, callback, callback2){
  var countdown=60;
  function settime(obj) {
    if (countdown == 0) {
      countdown = 60;
      callback2(obj, countdown);
      return;
    } else {
      countdown--;
      callback(obj, countdown);
    }

    setTimeout(function() {
      settime(obj)
    },1000);
  }
  settime(obj);
}

function getToken(obj, space,callback){
   $.get("/qiniu_token?space="+space, function(data){
      $(obj).val(data);
      if(callback)
        callback();
   });
}

function setEnterKey(obj,targetObj){
  $(obj).keypress(function(e){
    e = window.event || arguments.callee.caller.arguments[0] || event;
    if(e.keyCode=="13"){
      $(targetObj).click();
    }
  });
}
