module.exports = function watch() {
  var watcher = null
  var ready = false
  var chokidar = require('chokidar')
  var exec = require('child_process').exec;

  var watcher = chokidar.watch(config.get("upload_csv_path"), {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    followSymlinks: false,
    useFsEvents: false,
    usePolling: false,
    awaitWriteFinish:{
      stabilityThreshold: 2000
    }
  });


  var log = console.log.bind(console);

  //添加文件时
  function addFileListener(path_,stats) {
    // if (ready) {
    //   log('File', path_, 'has been added ' + stats.size);
    //    //读取话单记录的csv文件
    //   var request = require('request');
    //   request(config.get("domain")+'/import/csv/audio?file='+path_, function (error, response, body) {
    //     if (!error && response.statusCode == 200) {
    //       console.log(body);
    //     }
    //   });
    // }
  }

  function addDirecotryListener(path) {
    if (ready) {
      log('Directory', path, 'has been added')
    }
  }
  // 文件内容改变时
  function fileChangeListener(path_,stats) {
    log('File', path_, 'has been changed ' + stats.size)
  }

  // 删除文件时，需要把文件里所有的用例删掉
  function fileRemovedListener(path_) {
    log('File', path_, 'has been removed')
  }

  // 删除目录时
  function directoryRemovedListener(path) {
    log('Directory', path, 'has been removed')
  }

  watcher.on('add', addFileListener)
  .on('change', fileChangeListener)
  .on('addDir', addDirecotryListener)
  .on('unlink', fileRemovedListener)
  .on('unlinkDir', directoryRemovedListener)
  .on('error', function (error) {
    log('Error happened', error);
  })
  .on('ready', function () {
    log('watch cvs Ready for changes.');
    ready = true
  })
}
