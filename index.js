// 浏览器请求报文头部部分信息
const superagent = require('superagent');
const cheerio = require('cheerio');
const browserMsg = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36",
  'Content-Type': 'application/x-www-form-urlencoded',
};
const url = {
  login_url: "https://ac.ppdai.com/User/Login?message=&Redirect=http://invest.ppdai.com/negotiable/applynew",
  target_url: "http://invest.ppdai.com/loan/info",
  singleApply_url: "http://invdebt.ppdai.com/Negotiable/SingleApply"
};
const log4js = require('log4js');
const log4js_config = require("./log4");
const LogFile_warn = log4js.getLogger('log_file_warn');
const LogFile_suc = log4js.getLogger('log_file_suc');
const LogFile_err = log4js.getLogger('log_file_err');
log4js.configure(log4js_config);
// //访问登录接口获取cookie
module.exports = {

  getData(cookie, idObj, tobepaid, priceForSaleRate, xyz, levle, callback) {
    superagent.get(url.target_url)
      .set("Cookie", cookie)
      .set(browserMsg)
      .query(idObj)
      .end(function (err, res) {
        let fetchStart = new Date().getTime();
        if (err) {
          if (err.timeout) {
            console.warn('id:' + idObj.id + '    请求超时');
            LogFile_warn.warn('id:' + idObj.id + '      请求超时');
          } else {
            console.warn('id:' + idObj.id + err + '    获取页面数据接口');
            LogFile_warn.warn('id:' + idObj.id + err + '    获取页面数据接口');
          }
          return false;
        }
        if (res.text !== undefined) {
          let $ = cheerio.load(res.text),
            obj = {};
          obj.id = idObj.id;
          obj.liabilities = $('p:contains("历史最高负债：¥")').find("span").text().replace(/¥/g, '').replace(/,/g, ''); //历史负债
          obj.tobepaid = $('p:contains("待还金额：¥")').find("span").text().replace(/¥/g, '').replace(/,/g, ''); //代还金额
          obj.priceForSaleRate = priceForSaleRate;
          obj.levle = levle;
          let spendTime = new Date().getTime() - fetchStart;
          if (!obj.liabilities && !obj.tobepaid) {
            console.warn('抓取:' + obj.id + '失败,没有找到该标的信息,耗时：' + spendTime);
            LogFile_warn.warn('抓取: id' + obj.id + '失败,没有找到该标的信息,耗时：' + spendTime);
            callback()
          } else {
            console.log('抓取:' + obj.id + '成功,耗时：' + spendTime);
            console.info('抓取信息:' + JSON.stringify(obj));
            callback(null, obj)
          }
        }
      });
  },
  singleApply(obj, cookie, callback) {
    superagent.post(url.singleApply_url)
      .set("Cookie", cookie)
      .set(browserMsg)
      .query({ listingId: obj.id })
      .query({ preDebtdealId: 0 })
      .query({ priceForSale: 0 })
      .query({ priceForSaleRate: obj.priceForSaleRate * 1000 / 100000 })
      .query({ creditCode: obj.levle })
      .end(function (err, res) {
        if (err) {
          if (err.timeout) {
            console.warn('id:' + obj.id + '   请求超时');
            LogFile_warn.warn('id:' + obj.id + '    请求超时');
            callback()
          } else {
            console.warn('id:' + obj.id + err + '    申请债券接口');
            LogFile_warn.warn('id:' + obj.id + err + '    申请债券接口');
            callback()
          }
          return false;
        }

        if (!isNaN(res.body.Code) || res.body.Code === 0) {
          if (res.body.Code === 1) {
            console.info('id:' + obj.id + "   拍拍贷返回状态码" + res.body.Code + "," + res.body.Message);
            LogFile_suc.info('id:' + obj.id + "   拍拍贷返回状态码" + res.body.Code + "," + res.body.Message);
          } else {
            console.warn("id:  " + obj.id + "   拍拍贷返回状态码" + res.body.Code + "," + res.body.Message);
            LogFile_warn.warn("id:  " + obj.id + "   拍拍贷返回状态码" + res.body.Code + "," + res.body.Message);
          }
        }
        console.info('拍拍贷返回的数据',"id:  " + obj.id + JSON.stringify(res.body));
        callback(null, res.body);
      })
  }
};