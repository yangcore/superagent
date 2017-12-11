const express = require('express');
const router = express.Router();
const getData = require('../index').getData;
const singleApply = require('../index').singleApply;
const log4js = require('log4js');
const log4js_config = require("../log4");
const LogFile_warn = log4js.getLogger('log_file_warn');
const LogFile_suc = log4js.getLogger('log_file_suc');
const LogFile_err = log4js.getLogger('log_file_err');
const path = require('path');
const rf = require("fs");
log4js.configure(log4js_config);

router.get('/', function (req, res, next) {
  res.render('index');
});

router.post('/', function (req, res, next) {
  let reqbody = req.body,
    idJson = eval(reqbody.idJson);
 const start= async  function (){
    for(var i=0;i<idJson.length;i++){
      let resultObj= await getData(reqbody.cookieInfo, idJson[i], reqbody.tobepaid, reqbody.priceForSaleRate, reqbody.xyz, reqbody.levle);
      await sleep(2000);
      if(resultObj){
        await singleApply(resultObj, reqbody.cookieInfo);
        await sleep(2000);
      }
    }
    res.send({ code: '0000', msg: "申请完成,请查看日志" });
    res.end();
  }
  start();
});


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

module.exports = router;