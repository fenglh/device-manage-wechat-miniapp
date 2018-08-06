//app.js


const AV = require('./utils/av-live-query-weapp-min');
const now = Date.parse(new Date());//当前时间

AV.init({
  appId: 'LaH7wECHB7xg5FTiTlFqdjLj-gzGzoHsz',
  appKey: '5LFqOEzgD0ot0Wvqvg4hLJ1F',
});


App({
  onLaunch: function () {

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },

  login: function ({ success, fail}) {

    var that = this;
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        that.getOpenId(res.code, function (openid) {
          if(openid){
            that.globalData.openid = openid;
            wx.setStorageSync('openid', openid);//存储openid
            success?success(openid):null;
          }else{
            fail?fail():null;
          }
        });
      }
    });
  },


  //获取openid
  getOpenId: function (code, callback = ((string) => (Void))) {
    //获取openid
    var data = this.globalData;//这里存储了appid、secret、token串  
    var url = 'https://angelapi.bluemoon.com.cn/bmhr-control/demo/weixin';
    wx.request({
      url: url,
      data: {
        appid: data.appid,
        secret: data.secret,
        js_code: code,
        grant_type: 'authorization_code'

      },
      method: 'GET',
      success: function (res) {
        callback(res.data.returnMsg.openid);
      }, fail(error) {
        callback(null);
      }
    });
  },


  checkBindEmployeeInfo: function ({ openid, success, fail }) {
    //在获取了openid的情况下，检查绑定关系
    if (!openid) {
      fail ? fail() : null
      return;
    }

    var that = this;
    var query = new AV.Query('Users');
    query.equalTo('openID', openid);
    query.first().then(function (result) {
      if (!result) {
        success ? success(null) : null
      } else {
        success ? success(result) : null
      }
    }, function (error) {
      fail ? fail() : null;
    })


  },


  globalData: {
    
    appid: 'wx2fc1b68058a04d90',//appid需自己提供，
    secret: 'ece9a679463eb37126b3c5fb3df0073e',//secret需自己提供，
    openid: wx.getStorageSync('openid') || null,
    userInfo:  null,
  }
})