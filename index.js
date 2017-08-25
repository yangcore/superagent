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
// //访问登录接口获取cookie
module.exports ={
    getcookie:function  (userid, pwd) {
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
                    resolve(cookie);
                })
        })
    },
    getData:  function (cookie, id, tobepaid, priceForSaleRate, xyz, levle) {
        return new Promise((resolve, reject) => {
        superagent.get(url.target_url)
            .set("Cookie", cookie)
            .set(browserMsg)
            .query(id)
            .end(function (err, res) {
                if (err) {
                    console.error(err + '    获取页面数据接口');
                    LogFile_err.error(err + '    获取页面数据接口');
                };
                if(res.text!==undefined){
                    var $ = cheerio.load(res.text);
                    var obj = {id};
                    obj.id = id.id;
                    obj.liabilities = $('.table-hd').eq(3).prev().children().eq(1).find("span").text().replace(/¥/g, '').replace(/,/g, '');//历史负债
                    obj.tobepaid = $('.table-hd').eq(3).prev().prev().children().eq(0).find("span").text().replace(/¥/g, '').replace(/,/g, '');//代还金额
                    obj.priceForSaleRate = priceForSaleRate;
                    obj.levle = levle;
                    resolve(obj)
                }else{
                    resolve(null);
                }
            });
        })
    },
singleApply : function (obj,cookie) {
        return new Promise((resolve, reject) => {
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
                resolve(res.body.Code);
            })
        })
    }
} 





    

