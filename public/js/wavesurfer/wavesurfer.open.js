function AudioPlay(el, opts) {
  var opts = opts || {};
  this.opts = $.extend({}, Chart.DEFAULTS, opts);
  this.$el = $(el);
  this.wavesurfer = Wavesurfer.create({
    container: this.$el,
    waveColor: '#A8DBA8',
    progressColor: '#3B8686',
    height: 120,
    barWidth: 1,
  });

  this.lrcIndex = 0;
  this.lrcTime = [];
  this.lrcLine = [];
}

AudioPlay.DEFAULTS = {
  waveColor: '#A8DBA8',
  progressColor: '#3B8686',
  height: 120,
  barWidth: 1,
}

AudioPlay.prototype.bindDom = function(){

}

AudioPlay.prototype.setLrc = function(){
  var timeExp = /\[(\d{2}):(\d{2})\.(\d{2})]/;
  var lrcExp = /](.*)$/;
  var notLrcLineExp = /\[[A-Za-z]+:/;
  var tpl = ''

  var lrcObj = JSON.parse($(".lrc-content").val());
  var lines = []
  $.each(lrcObj.sentence, function(idx, lrc){
    var role = lrc.role==1?'客戶':'坐席'
    var line = '['+secondToTimeFloat(lrc.start_time/1000)+']&nbsp;'+'['+role+']&nbsp;'+lrc.sentence_text;
    lines.push(line)
  })

  for (var i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace(/^\s+|\s+$/g, '');
    var oneTime = timeExp.exec(lines[i]);
    var oneLrc = lrcExp.exec(lines[i]);
    if(oneTime && oneLrc && !lrcExp.exec(lrcExp.exec(oneLrc[1])[1])){
      lrcTime.push(parseInt(oneTime[1]) * 60 + parseInt(oneTime[2]) + parseInt(oneTime[3]) / 100);
      lrcLine.push(oneLrc[1]);
    }
    if(i==0){
      tpl+= '<li class="lrc-current" data-second="'+lrcTime[i]+'">' + lines[i] + '</li>'
    }else{
      tpl += '<li data-second="'+lrcTime[i]+'">' + lines[i] + '</li>'
    }
  }
  $(".audio-text").append(tpl)
}

AudioPlay.prototype.updateLrc = function(){
  
}

AudioPlay.prototype.markKeyword = function(){
  
}

AudioPlay.prototype.updateBar = function(){
  
}

AudioPlay.prototype.getElementViewTop = function(){
  
}

AudioPlay.prototype.addRegion = function(){
  
}

AudioPlay.prototype.setPlayRate = function(){
  
}


AudioPlay.prototype.setLrc = function(){
  
}

AudioPlay.prototype.add0 = function(){
  
}

AudioPlay.prototype.secondToTimeFloat = function(){
  
}
/**
 * audio
 */
var wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: '#A8DBA8',
  progressColor: '#3B8686',
  height: 120,
  barWidth: 1,
})

var lrcIndex = 0;
var lrcTime = [];
var lrcLine = [];

function initAudio() {
  
  setLrc();

  bindAudioDom();

  //playlist
  var currentTrack = 0;

  // The playlist links
  var links = document.querySelectorAll('#playlist a');

  // Load a track by index and highlight the corresponding link
  var setCurrentSong = function(index) {
    links[currentTrack].classList.remove('active');
    currentTrack = index;
    links[currentTrack].classList.add('active');
    wavesurfer.load(links[currentTrack].href);
  };

  // Load the track on click
  Array.prototype.forEach.call(links, function(link, index) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      setCurrentSong(index);
    });
  });

  // Play on audio load
  wavesurfer.on('ready', function() {
    // var regions = [{
    //   start: 20,
    //   end: 100
    // }, {
    //   start: 140,
    //   end: 380
    // }]
    var regions = []
    addRegion(regions)

    var duration = wavesurfer.getDuration();
    var durationTxt = secondToTime(duration, "comma");
    $(".duration").html(durationTxt);
    
    var keywords = JSON.parse($(".lrc-keywords").val())
    markKeyword(keywords)
    updateLrc(0);
    wavesurfer.play();
  });

  // Go to the next track on finish
  wavesurfer.on('finish', function() {
    setCurrentSong((currentTrack + 1) % links.length);
  });

  // Load the first track
  setCurrentSong(currentTrack);
}

function bindAudioDom() {
  var playing = true;
  $(".play-pause").on('click', function(event){
    wavesurfer.playPause();
  })

  // Toggle play/pause text
  wavesurfer.on('play', function() {
    $(".play-pause").find("i")[0].className = "pause icon";
    var lrcInterval = setInterval(function(){
      var currentTime = wavesurfer.getCurrentTime()
      $(".current-time").html(secondToTime(currentTime, "comma"))
      updateLrc(currentTime)
    },1000);
  });
  wavesurfer.on('pause', function() {
    $(".play-pause").find("i")[0].className = "play icon";
    window.clearInterval(lrcInterval);
  });

  //音量调节
  var volume = 0.8;
  var barHeight = 64;
  var volumeIcon = $(".audio-volume-btn");
  var muted = false;
  updateBar($(".volume-bar-ajust-active"), volume, 'height')

  $(".volume-bar-ajust").on('click', function(event){
    var e = event || window.event;
    var volumeBar = $(".volume-bar-ajust");
    var percentage = (barHeight-e.clientY+getElementViewTop(volumeBar)) / barHeight;
    percentage = percentage > 0 ? percentage : 0;
    percentage = percentage < 1 ? percentage : 1;
    volume = percentage

    updateBar($(".volume-bar-ajust-active"), percentage, 'height');

    if(percentage > 0){
      volumeIcon.find("i")[0].className = "volume up icon"
    }

    if(percentage === 0){
      volumeIcon.find("i")[0].className = "volume off icon"
    }

    wavesurfer.setVolume(volume);
  })

  //静音开关
  volumeIcon.on('click', function(event){
    var vol = volume;
    if(muted){
      muted = false;
      volumeIcon.find('i')[0].className = "volume up icon";
      updateBar($(".volume-bar-ajust-active"), volume, 'height')
    }else{
      muted = true;
      vol = 0;
      volumeIcon.find('i')[0].className = "volume off icon";
      updateBar($(".volume-bar-ajust-active"), 0, 'height')
    }
    wavesurfer.setVolume(vol);
  })

  //volumebar 显示隐藏
  $(".audio-volume").on('mouseover', function(event){
    $(".volume-bar").css({
      "display": "block"
    })
  })
  $(".audio-volume").on('mouseout', function(event){
    $(".volume-bar").css({
      "display": "none"
    })
  })


  $(".audio-text").delegate("li", "click", function(event){
    var sec = $(this).attr("data-second");
    var totalSec = wavesurfer.getDuration();
    wavesurfer.seekTo(parseInt(sec/totalSec*100)/100)
    $(".current-time").html(secondToTime(sec, "comma"))
    updateLrc(sec)
  })
}

function updateBar(el, percentage, direction) {
  percentage = percentage > 0 ? percentage : 0;
  percentage = percentage < 1 ? percentage : 1;
  $(el)[0].style[direction] = percentage*100 + '%';
}

function getElementViewTop (element) {
  var actualTop = element[0].offsetTop;
  var current = element[0].offsetParent;
  var elementScrollTop;
  while (current !== null){
    actualTop += current.offsetTop;
    current = current.offsetParent;
  }
  elementScrollTop = document.body.scrollTop + document.documentElement.scrollTop;
  return actualTop - elementScrollTop;
}

//获取音频文本内容并格式化显示
function setLrc() {
  var timeExp = /\[(\d{2}):(\d{2})\.(\d{2})]/;
  var lrcExp = /](.*)$/;
  var notLrcLineExp = /\[[A-Za-z]+:/;
  var tpl = ''

  var lrcObj = JSON.parse($(".lrc-content").val());
  var lines = []
  $.each(lrcObj.sentence, function(idx, lrc){
    var role = lrc.role==1?'客戶':'坐席'
    var line = '['+secondToTimeFloat(lrc.start_time/1000)+']&nbsp;'+'['+role+']&nbsp;'+lrc.sentence_text;
    lines.push(line)
  })

  for (var i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace(/^\s+|\s+$/g, '');
    var oneTime = timeExp.exec(lines[i]);
    var oneLrc = lrcExp.exec(lines[i]);
    if(oneTime && oneLrc && !lrcExp.exec(lrcExp.exec(oneLrc[1])[1])){
      lrcTime.push(parseInt(oneTime[1]) * 60 + parseInt(oneTime[2]) + parseInt(oneTime[3]) / 100);
      lrcLine.push(oneLrc[1]);
    }
    if(i==0){
      tpl+= '<li class="lrc-current" data-second="'+lrcTime[i]+'">' + lines[i] + '</li>'
    }else{
      tpl += '<li data-second="'+lrcTime[i]+'">' + lines[i] + '</li>'
    }
  }
  $(".audio-text").append(tpl)
}

//更新文字位置
function updateLrc(currentTime) {
  if (!currentTime) {
    var currentTime = wavesurfer.getCurrentTime();
  }

  if(currentTime === 0){
    $('.audioText').css({
      'transform': 'translateY(' + 0 + 'px)'
    })
    return false;
  }

  if (currentTime < lrcTime[lrcIndex] || currentTime >= lrcTime[lrcIndex + 1]) {
    for (var i = 0; i < lrcTime.length; i++) {
      if (currentTime >= lrcTime[i] && (!lrcTime[i + 1] || currentTime < lrcTime[i + 1])) {
        lrcIndex = i;
        $('.audioText').css({
          'transform': 'translateY(' + -lrcIndex * 22 + 'px)'
        })
        $('.lrc-current') && $('.lrc-current').removeClass('lrc-current');
        var lrcList = $('.audioText').find('li');
        if(lrcList&&lrcList.length>0){
          if(lrcList[i]){
            lrcList[i].classList.add('lrc-current');
          }
        }
      }
    }
  }
}


//添加标注区域
function addRegion(regions) {
  $.each(regions, function(idx, region) {
    if(region&&region.length>0){
      wavesurfer.addRegion({
        start: region.start,
        end: region.end,
        drag: false,
        color: region.color || "rgba(54, 198, 211, 0.1)"
      })
    }
  })
}

//调整播放速度
function setPlayRate(rate) {
  wavesurfer.setPlaybackRate(rate);
}

//add 0
var add0 = function (num) {
  return num < 10 ? '0' + num : '' + num;
};

// format second to 00:00.00
function secondToTimeFloat(second) {
  var min = parseInt(second / 60);
  var second = String(parseInt((second - min * 60)*100)/100)
  var sec = second.split(/\./)[0];
  var microSec = second.split(/\./)[1];

  if(microSec && microSec.length === 1){
    microSec = microSec+'0'
  } else if(!microSec) {
    microSec = '00'
  }

  return add0(min) + ':' + add0(sec) + '.' + microSec;
}

//标注关键词
function markKeyword(keywords){
  if(keywords&&keywords.length>0){
    var w = $("#waveform").width();
    var h = $("#waveform").height()
    var duration = wavesurfer.getDuration();
    $.each(keywords, function(idx, keyword){
      if(keyword.time>duration){
        return false
      }
      var percentage = keyword.time/duration
      var positionX = w * percentage;
      var positionY = h/2 * (Math.random())
      console.log(positionX)
      console.log(positionY)
      var tpl = '<span style="position:absolute;font-size:12px;color:#000;z-index:999;top:'+positionY+'px;left:'+positionX+'px;">'+keyword.word+'</span>'
      $("#waveform").append(tpl)
    })
  }
}
