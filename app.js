//app.js


const AV = require('./utils/av-live-query-weapp-min');

AV.init({
  appId: 'IcEv4jY8hXwfHnIdn2DMlF4E-gzGzoHsz',
  appKey: 'X6WstPiEjGHdzoRMqx9JR7lT',
});


App({
  onLaunch: function () {

    var user = wx.getStorageSync('user') || {};
    var userInfo = wx.getStorageSync('userInfo') || {};
    this.globalData.userInfo = userInfo;
    console.log(this.globalData.userInfo)
    var openid = user.openid;
    var that = this;
    if (!user.openid || !userInfo.avatarUrl || !userInfo.nickName) { 
      wx.login({
        success:function(res){
          if(res.code){
            //获取用户信息
            wx.getUserInfo({
              success: function (res) {
                var objz = {};
                objz.avatarUrl = res.userInfo.avatarUrl;
                objz.nickName = res.userInfo.nickName;
                that.globalData.userInfo = objz;
                wx.setStorageSync('userInfo', objz);//存储userInfo

              }, fail(error) {
                console.log(error);
              }
            });
            //获取openid
            var data = that.globalData;//这里存储了appid、secret、token串  
            var url = 'https://api.weixin.qq.com/sns/jscode2session';
            wx.request({
              url: url,
              data:{
                appid: data.appid,
                secret: data.secret,
                js_code: res.code,
                grant_type: 'authorization_code'

              },
              method:'GET',
              success:function (res) {
                var obj = {};
                obj.openid = res.data.openid;
                obj.expires_in = Date.now() + res.data.expires_in;
                wx.setStorageSync('user', obj);//存储openid
                console.log('获取openid成功:',obj.openid);  
              },fail(error){
                console.log(error);
              }
            })
          }else{
            console.log('获取用户登录状态失败' + res.errMsg);
          }
        }
      });
    }
  },


  globalData: {
    userInfo: null,
    appid: 'wx2fc1b68058a04d90',//appid需自己提供，此处的appid我随机编写
    secret: 'ece9a679463eb37126b3c5fb3df0073e',//secret需自己提供，此处的secret我随机编写
  }
})