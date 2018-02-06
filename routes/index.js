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

    io.on('connection', function (socket) {
        socket.on('start', function (reqbody) {
            let idJson = eval(reqbody.idJson);
            let startEndFlag = true;
            socket.on('startEndFlagFn', function (e) {
                startEndFlag = false;
            });
            const start = async function () {
                for (var i = 0; i < idJson.length; i++) {
                    if (!startEndFlag) {
                        console.info('跳出循环');
                        break;
                    }
                    let resultObj = await getData(reqbody.cookieInfo, idJson[i], reqbody.tobepaid, reqbody.priceForSaleRate, reqbody.xyz, reqbody.levle, io);
                    await sleep(1000);
                    if (resultObj) {
                        if (resultObj.tobepaid / resultObj.liabilities >= reqbody.xyz || resultObj.tobepaid >= reqbody.tobepaid) {
                            await singleApply(resultObj, reqbody.cookieInfo, io);
                            await sleep(500);
                        } else {
                            io.sockets.emit('sendinfo', {
                                code: '0000',
                                type: 'warn',
                                msg: ("id:  " + idJson[i].id + "   不符合条件")
                            });
                            console.warn("id:  " + idJson[i].id + "   不符合条件");
                            LogFile_warn.warn("id:  " + idJson[i].id + "  不符合条件");
                        }
                    }

                }
                io.sockets.emit('sendinfo', {code: '0000', type: 'suc', msg: ('申请完成,请查看日志')});
                console.info('申请完成,请查看日志');
                LogFile_suc.info('申请完成,请查看日志');
                io.sockets.emit('complete', {code: '0000', msg: "申请完成,请查看日志"});
            };
            start();
        })
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
        if (req.body.type === "suc") {
            data = rf.readFileSync(path.resolve(__dirname, '..') + "/logs/logs_suc.log", "utf-8");
        } else if (req.body.type === "fail") {
            data = rf.readFileSync(path.resolve(__dirname, '..') + "/logs/logs_warn.log", "utf-8");
        }
        res.send(data);
    });

    router.post('/delnfo', function (req, res, next) {
        if (req.body.type === "suc") {
            rf.writeFileSync(path.resolve(__dirname, '..') + "/logs/logs_suc.log", "");
        } else if (req.body.type === "fail") {
            rf.writeFileSync(path.resolve(__dirname, '..') + "/logs/logs_warn.log", "");
        }
        res.send({code: "0000", msg: "删除成功"});
    });

    return router;
};


module.exports = bidrouter;