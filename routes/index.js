var express = require('express');
var router = express.Router();
var getinfo = require('../index');
var co = require('co');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});


router.post('/', function (req, res, next) {
  let gen = function* () {
    var reqbody = req.body;
    var statu = yield getinfo(reqbody.user, reqbody.password, reqbody.tobepaid, reqbody.priceForSaleRate, reqbody.xyz, reqbody.levle, reqbody.idJson);
    if (statu) {
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
var rf=require("fs"); 
router.post('/readInfo',function(req, res, next){
 if(req.body.type=="suc"){
  var data=rf.readFileSync(path.resolve(__dirname, '..')+"/logs/logs_suc.log","utf-8");
 }else if(req.body.type=="fail"){
  var data=rf.readFileSync(path.resolve(__dirname, '..')+"/logs/logs_warn.log","utf-8");
 }
  res.send(data);
});

router.post('/delnfo',function(req, res, next){
  if(req.body.type=="suc"){
    rf.writeFileSync(path.resolve(__dirname, '..')+"/logs/logs_suc.log","");
  }else if(req.body.type=="fail"){
    rf.writeFileSync(path.resolve(__dirname, '..')+"/logs/logs_warn.log","");
  }
   res.send({code:"0000",msg:"删除成功"});
 });



module.exports = router;
