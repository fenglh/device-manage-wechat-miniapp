//app.js


const AV = require('./utils/av-live-query-weapp-min');
const now = Date.parse(new Date());//当前时间

AV.init({
  appId: 'LaH7wECHB7xg5FTiTlFqdjLj-gzGzoHsz',
  appKey: '5LFqOEzgD0ot0Wvqvg4hLJ1F',
});


App({
  onLaunch: function () {
    


    // 1. 获取用户信息
    if (!this.globalData.wxUserInfo){

      wx.getSetting({

        success: res => {
          if (res.authSetting['scope.userInfo']) {
            // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
            wx.getUserInfo({
              success: res => {
                // 可以将 res 发送给后台解码出 unionId
                
                this.globalData.wxUserInfo = res.userInfo
                wx.setStorageSync('wxUserInfo', res.userInfo);//存储
                console.log("获取微信用户信息:", this.globalData.wxUserInfo);
                // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                // 所以此处加入 callback 以防止这种情况
                if (this.userInfoReadyCallback) {
                  this.userInfoReadyCallback(res.userInfo)
                }
              }
            })
          }
        }
        //未授权也不会回调fail函数，所以这里没有fail回调处理

      })
    }else {

      console.log('获取缓存的微信用户信息:', this.globalData.wxUserInfo)
    }


    //2.获取openid
    if (!this.globalData.openid){
      var that = this;
      //获取openid
      this.getOpenId({
        success: function (openid) {
          that.globalData.openid = openid;
          wx.setStorageSync('openid', openid);//存储openid
          console.log("获取微信openId:", that.globalData.openid);
          if (that.openidReadyCallback) {
            that.openidReadyCallback(openid)
          }
        },
        fail: function () {
          wx.showToast({
            title: '获取openId失败!',
            icon: 'none'
          })
        }
      });
    }else{

      console.log('获取缓存的微信openId:', this.globalData.openid)
    }
  },


  //
  getOpenId: function ({ success, fail}) {

    var that = this;
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        that.requestDecodeOpenId(res.code, function (openid) {
          if(openid){
            success?success(openid):null;
          }else{
            fail?fail():null;
          }
        });
      }
    });
  },


  //获取openid
  requestDecodeOpenId: function (code, callback = ((string) => (Void))) {
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




  globalData: {
    
    appid: 'wx2fc1b68058a04d90',//appid需自己提供，
    secret: 'ece9a679463eb37126b3c5fb3df0073e',//secret需自己提供，
    openid: wx.getStorageSync('openid') || null,
    wxUserInfo: wx.getStorageSync('wxUserInfo') || null,//微信用户信息
  }
})