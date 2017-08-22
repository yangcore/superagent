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
    singleApply_url: "http://invest.ppdai.com/Negotiable/SingleApplyNew"
};

var log4js = require('log4js');
var log4js_config = require("./log4.json");
log4js.configure(log4js_config);
var LogFile_warn = log4js.getLogger('log_file_warn');
var LogFile_suc = log4js.getLogger('log_file_suc');
var LogFile_err = log4js.getLogger('log_file_err');


// //访问登录接口获取cookie
module.exports = function (userid, pwd, tobepaid, priceForSaleRate, xyz, levle, idJson) {
    var idJson = eval(idJson);
    return new Promise((resolve, reject) => {
        superagent.post(url.login_url)
            .type("form")
            .set(browserMsg)
            .send({
                UserName: userid,
                Password: pwd,
                IsAsync: true,
                Redirect: "",
                RememberMe: false
            })
            .end(function (err, res) {
                var stu;
                if (err) {
                    console.error(err + '   获取cookie接口');
                    LogFile_err.error(err + '   获取cookie接口');
                } 
                var cookie = res.header["set-cookie"];
                if (cookie.length > 3) {
                    cookie = cookie[0].split(';')[0] + ';' + cookie[1].split(';')[0] + ';' + cookie[2].split(';')[0] + ';' + cookie[3].split(';')[0] + ';' + cookie[4].split(';')[0] + ';' + cookie[5].split(';')[0] + ';';
                    for (var i = 0; i < idJson.length; i++) {
                        getData(cookie, idJson[i].id, tobepaid, priceForSaleRate, xyz, levle);
                    }
                    stu = true;
                } else {
                    stu = false
                }
                resolve(stu);
            })
    })
}



function getData(cookie, id, tobepaid, priceForSaleRate, xyz, levle) {
    superagent.get(url.target_url)
        .set("Cookie", cookie)
        .set(browserMsg)
        .query({ id: id })
        .end(function (err, res) {
            if (err) {
                console.error(err + '    获取页面数据接口');
                LogFile_err.error(err + '    获取页面数据接口');
            };
            var $ = cheerio.load(res.text);
            var obj = {};
            obj.id = id;
            obj.liabilities = $('.table-hd').eq(3).prev().children().eq(1).find("span").text().replace(/¥/g, '').replace(/,/g, '');//历史负债
            obj.tobepaid = $('.table-hd').eq(3).prev().prev().children().eq(0).find("span").text().replace(/¥/g, '').replace(/,/g, '');//代还金额
            obj.priceForSaleRate = priceForSaleRate;
            obj.levle = levle;
            console.info(obj.tobepaid , obj.liabilities , xyz , obj.tobepaid , tobepaid);
            if (obj.tobepaid / obj.liabilities >= xyz || obj.tobepaid >= tobepaid) {
                singleApply(obj);
            }else{
                LogFile_warn.warn("id  " + obj.id + "    不符合条件");
            }
        });

    function singleApply(obj) {
        superagent.post(url.singleApply_url)
            .set("Cookie", cookie)
            .set(browserMsg)
            .query({ listingId: obj.id })
            .query({ predebtdealId: 0 })
            .query({ priceForSale: 0 })
            .query({ priceForSaleRate: obj.priceForSaleRate * 1000 / 100000 })
            .query({ creditCode: obj.levle })
            .end(function (err, res) {
                if (err)  {
                    console.error(err + '    申请债券接口');
                    LogFile_err.error(err + '    申请债券接口');
                }
                console.info(res.body.Code);
                if (res.body.Code == 1) {
                    // console.info(obj.id + "    成功申请1条债权");
                    LogFile_suc.info(obj.id + "    成功申请1条债权");
                } else {
                    // console.warn("id  " + obj.id + "    申请失败");
                    LogFile_warn.warn("id  " + obj.id + "    申请失败");
                }
            });
    }
}
