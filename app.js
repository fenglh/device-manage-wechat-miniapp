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
    var openid = user.openid;
    console.log(openid);

    if (!user.openid ) {
      wx.login({
        success:function(res){
          if(res.code){
            wx.getUserInfo({
              success:function (res){
                var objz = {};
                objz.avatarUrl = res.userInfo.avatarUrl;
                objz.nickName = res.userInfo.nickName;
                wx.setStorageSync('userInfo', objz);//存储userInfo
              }
            });
            var data = that.globalData;//这里存储了appid、secret、token串  
            var url = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + d.appid + '&secret=' + d.secret + '&js_code=' + res.code + '&grant_type=authorization_code';  
            wx.request({
              url: 'url',
              data:{},
              method:'GET',
              success:function (res) {
                var obj = {};
                obj.openid = res.data.openid;
                obj.expires_in = Date.now() + res.data.expires_in;
                //console.log(obj);
                wx.setStorageSync('user', obj);//存储openid  
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
    appid: '1wqas2342dasaqwe2323424ac23qwe',//appid需自己提供，此处的appid我随机编写
    secret: 'e0dassdadef2424234209bwqqweqw123ccqwa',//secret需自己提供，此处的secret我随机编写
  }
})