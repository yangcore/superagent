var express = require('express');
var router = express.Router();
var getData = require('../index').getData;
var singleApply = require('../index').singleApply;
var log4js = require('log4js');
var log4js_config = require("../log4");
var LogFile_warn = log4js.getLogger('log_file_warn');
var LogFile_suc = log4js.getLogger('log_file_suc');
var LogFile_err = log4js.getLogger('log_file_err');
var path = require('path');
var rf = require("fs");

var bidrouter = function (io) {
  log4js.configure(log4js_config);
  router.get('/', function (req, res, next) {
    res.render('index');
  });

  // router.post('/', function (req, res, next) {
  //   let reqbody = req.body,
  //     idJson = eval(reqbody.idJson);
  //   const start = async function () {
  //     for (var i = 0; i < idJson.length; i++) {
  //       let resultObj = await getData(reqbody.cookieInfo, idJson[i], reqbody.tobepaid, reqbody.priceForSaleRate, reqbody.xyz, reqbody.levle);
  //       await sleep(1000);
  //       if (resultObj) {
  //         await singleApply(resultObj, reqbody.cookieInfo);
  //         await sleep(500);
  //       }
  //     }
  //     io.sockets.emit('complete', { code: '0000', msg: "申请完成,请查看日志" });
  //     res.send({ code: '0000', msg: "申请完成,请查看日志" });
  //     res.end();
  //   }
  //   start();
  // });

  io.on('connection',function (socket) {
    socket.on('start', function (reqbody) {
      let idJson = eval(reqbody.idJson);
    const start = async function () {
      for (var i = 0; i < idJson.length; i++) {
        let resultObj = await getData(reqbody.cookieInfo, idJson[i], reqbody.tobepaid, reqbody.priceForSaleRate, reqbody.xyz, reqbody.levle);
        await sleep(1000);
        if (resultObj) {
          await singleApply(resultObj, reqbody.cookieInfo);
          await sleep(500);
        }
      }
      console.info('申请完成,请查看日志');
      LogFile_suc.info('申请完成,请查看日志');
      io.sockets.emit('complete', { code: '0000', msg: "申请完成,请查看日志" });
    }
    start();
    })
  })


  const sleep = function (time) { //休眠
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve();
      }, time);
    })
  };


  router.post('/readInfo', function (req, res, next) {
    let data;
    if (req.body.type == "suc") {
      data = rf.readFileSync(path.resolve(__dirname, '..') + "/logs/logs_suc.log", "utf-8");
    } else if (req.body.type == "fail") {
      data = rf.readFileSync(path.resolve(__dirname, '..') + "/logs/logs_warn.log", "utf-8");
    }
    res.send(data);
  });

  router.post('/delnfo', function (req, res, next) {
    if (req.body.type == "suc") {
      rf.writeFileSync(path.resolve(__dirname, '..') + "/logs/logs_suc.log", "");
    } else if (req.body.type == "fail") {
      rf.writeFileSync(path.resolve(__dirname, '..') + "/logs/logs_warn.log", "");
    }
    res.send({ code: "0000", msg: "删除成功" });
  });

  return router;
}


module.exports = bidrouter;