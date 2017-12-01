const express = require('express');
const router = express.Router();
const getData = require('./index').getData;
const singleApply = require('./index').singleApply;
const log4js = require('log4js');
const log4js_config = require("../log4");
const LogFile_warn = log4js.getLogger('log_file_warn');
const LogFile_suc = log4js.getLogger('log_file_suc');
const LogFile_err = log4js.getLogger('log_file_err');
const path = require('path');
const rf = require("fs");
const async = require('async'); //异步抓取 
const trimSpace = function (array) {
  for (let i = 0; i < array.length; i++) {
    if (!array[i]) {
      array.splice(i, 1);
      i = i - 1;
    }
  }
  return array;
};

log4js.configure(log4js_config);

router.get('/', function (req, res, next) {
  res.render('index');
});

router.post('/', function (req, res, next) {
  let reqbody = req.body,
    idJson = eval(reqbody.idJson);
  async.mapLimit(idJson, 5, (idObj, callback) => {
    getData(reqbody.cookieInfo, idObj, reqbody.tobepaid, reqbody.priceForSaleRate, reqbody.xyz, reqbody.levle, callback)
  }, (err, obj) => {
    async.mapLimit(trimSpace(obj), 5, (resultObj, callback) => {
      if (resultObj) {
        if (resultObj.tobepaid / resultObj.liabilities >= reqbody.xyz || resultObj.tobepaid >= reqbody.tobepaid) {
          singleApply(resultObj, reqbody.cookieInfo, callback)
        } else {
          console.warn("id  " + resultObj.id + "    不符合条件");
          LogFile_warn.warn("id  " + resultObj.id + "    不符合条件");
        }
      }
    }, (err, state) => {
      res.send({ code: '0000', msg: "申请完成,请查看日志" });
      res.end();
    });
  })
});

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