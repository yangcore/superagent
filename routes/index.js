var express = require('express');
var router = express.Router();
var getinfo = require('../index').getcookie;
var getData = require('../index').getData;
var singleApply = require('../index').singleApply;
var co = require('co');
var log4js = require('log4js');
var log4js_config = require("../log4");
log4js.configure(log4js_config);
var LogFile_warn = log4js.getLogger('log_file_warn');
var LogFile_suc = log4js.getLogger('log_file_suc');
var LogFile_err = log4js.getLogger('log_file_err');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});


router.post('/', function (req, res, next) {
  let gen = function* () {
    var reqbody = req.body;
    var idJson = eval(reqbody.idJson);
    var cookieInfo = yield getinfo(reqbody.user, reqbody.password);
    if (cookieInfo.length > 3) {
      cookieInfo = cookieInfo[0].split(';')[0] + ';' + cookieInfo[1].split(';')[0] + ';' + cookieInfo[2].split(';')[0] + ';' + cookieInfo[3].split(';')[0] + ';' + cookieInfo[4].split(';')[0] + ';' + cookieInfo[5].split(';')[0] + ';';
      for (var i = 0; i < idJson.length; i++) {
        var obj = yield getData(cookieInfo, idJson[i], reqbody.tobepaid, reqbody.priceForSaleRate, reqbody.xyz, reqbody.levle);
        console.info(obj);
        if (obj) {
          if (obj.tobepaid / obj.liabilities >= reqbody.xyz || obj.tobepaid >= reqbody.tobepaid) {
            var Code = yield singleApply(obj,cookieInfo);
            console.info(obj.id + "拍拍贷返回状态码" + Code);
            if (Code == 1) {
              console.info(obj.id + "    成功申请1条债权");
              LogFile_suc.info(obj.id + "    成功申请1条债权");
            } else if (Code == 0) {
              console.warn("id  " + obj.id + "    申请失败");
              LogFile_warn.warn("id  " + obj.id + "    申请失败");
            } else {
              console.warn("id  " + obj.id + "    返回数据错误");
              LogFile_warn.warn("id  " + obj.id + "    返回数据错误");
            }
          } else {
            console.info("id  " + obj.id + "    不符合条件");
            LogFile_warn.warn("id  " + obj.id + "    不符合条件");
          }
        }else{
          console.info("id  " + idJson[i].id + "    页面抓取失败");
          LogFile_warn.warn("id  " + idJson[i].id + "    页面抓取失败");
        }
      }
      console.info("申请结束");
      res.send({ code: '0000', msg: "申请完成,请查看logs文件夹下的日志" });
    } else {
      res.send({ code: '1001', msg: "账户名或密码也许不正确，请检查再试" });
    }
  }
  co(gen).then(() => {
    res.end();
  });

})
var path = require('path')
var rf = require("fs");
router.post('/readInfo', function (req, res, next) {
  if (req.body.type == "suc") {
    var data = rf.readFileSync(path.resolve(__dirname, '..') + "/logs/logs_suc.log", "utf-8");
  } else if (req.body.type == "fail") {
    var data = rf.readFileSync(path.resolve(__dirname, '..') + "/logs/logs_warn.log", "utf-8");
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
