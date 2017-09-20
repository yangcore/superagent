// 浏览器请求报文头部部分信息
var superagent = require('superagent');
var cheerio = require('cheerio');
var browserMsg = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36",
    'Content-Type': 'application/x-www-form-urlencoded',
};
var url = {
    login_url: "https://ac.ppdai.com/User/Login?message=&Redirect=http://invest.ppdai.com/negotiable/applynew",
    target_url: "http://invest.ppdai.com/loan/info",
    singleApply_url: "http://invdebt.ppdai.com/Negotiable/SingleApply"
};
var log4js = require('log4js');
var log4js_config = require("./log4");
log4js.configure(log4js_config);
var LogFile_warn = log4js.getLogger('log_file_warn');
var LogFile_suc = log4js.getLogger('log_file_suc');
var LogFile_err = log4js.getLogger('log_file_err');

// //访问登录接口获取cookie
module.exports ={
    getcookie:function  (userid, pwd) {
        return new Promise((resolve, reject) => {
            superagent.post(url.login_url)
                .timeout({
                    response: 5000,
                    deadline: 10000,
                })
                .type("form")
                .set(browserMsg)
                .send({
                    UserName: userid,
                    Password: pwd,
                    IsAsync: true,
                    Redirect: "",
                    RememberMe: true
                })
                .end(function (err, res) {
                    var stu;
                    if (err) {
                        if (err.timeout) {
                            console.info('请求超时');
                            LogFile_warn.warn('登陆超时');
                            resolve("timeout");
                        }else {
                            console.error(err + '   获取cookie接口');
                            LogFile_err.error(err + '   获取cookie接口');
                            resolve("fail");
                        }
                    }else {
                        var cookie = res.header["set-cookie"];
                        resolve(cookie);
                    }
                })
        })
    },
    getData:  function (cookie, id, tobepaid, priceForSaleRate, xyz, levle) {
        return new Promise((resolve, reject) => {
        superagent.get(url.target_url)
            .timeout({
                response: 5000,
                deadline: 10000,
            })
            .set("Cookie", cookie)
            .set(browserMsg)
            .query(id)
            .end(function (err, res) {
                    if (err) {
                        if (err.timeout) {
                            console.info('请求超时');
                            LogFile_warn.warn('请求超时');
                            resolve("timeout")
                        }else {
                            console.error(err + '    获取页面数据接口');
                            LogFile_err.error(err + '    获取页面数据接口');
                            resolve("fail")
                        }
                    }else {
                        if(res.text!==undefined){
                            var $ = cheerio.load(res.text);
                            var obj = {id};
                            obj.id = id.id;
                            obj.liabilities = $('p:contains("历史最高负债：¥")').find("span").text().replace(/¥/g, '').replace(/,/g, '');//历史负债
                            obj.tobepaid = $('p:contains("待还金额：¥")').find("span").text().replace(/¥/g, '').replace(/,/g, '');//代还金额

                            obj.priceForSaleRate = priceForSaleRate;
                            obj.levle = levle;
                            resolve(obj)
                        }else{
                            resolve(null);
                        }
                    }
            });
        })
    },
singleApply : function (obj,cookie) {
        return new Promise((resolve, reject) => {
        superagent.post(url.singleApply_url)
            .timeout({
                response: 5000,
                deadline: 10000,
            })
            .set("Cookie", cookie)
            .set(browserMsg)
            .query({ listingId: obj.id })
            .query({ preDebtdealId: 0 })
            .query({ priceForSale: 0 })
            .query({ priceForSaleRate: obj.priceForSaleRate * 1000 / 100000 })
            .query({ creditCode: obj.levle })
            .end(function (err, res) {
                    if (err)  {
                        if (err.timeout) {
                            console.info('请求超时');
                            LogFile_warn.warn('请求超时');
                            resolve("timeout");
                        }else {
                            console.error(err + '    申请债券接口');
                            LogFile_err.error(err + '    申请债券接口');
                            resolve("fail");
                        }
                    }else {
                        resolve(res.body);
                    }
            })
        })
    }
};





    

