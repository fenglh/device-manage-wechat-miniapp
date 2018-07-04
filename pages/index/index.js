//index.js
const AV = require('../../utils/av-live-query-weapp-min');

//获取应用实例
const app = getApp()


Page({
  data: {
    showModalStatus:false,
  },



  bindAvatarEvent:function(){
    wx.navigateTo({
      url: '../user/user',
    })
  },
  bindSearchEvent: function () {
    wx.navigateTo({
      url: '../search/search',
    })
  },
  bindMoreEvent: function () {
    wx.navigateTo({
      url: '../menu/menu',
    })
  },

  

  /******************* */
  onLoad: function () {

  },

  onReady:function(){

    console.log("index 初始化");
    var user = wx.getStorageSync('user') || {};
    if(!user.openid){
      console.log('openid还没有获取到');
      return;
    }
    var employeeInfo = wx.getStorageSync('employeeInfo') || {};
    var that = this;
    var now = Date.parse(new Date()) 
    if (!employeeInfo.employeeID || !employeeInfo.employeeName || (now - employeeInfo.expiredDate > 0)) {
      var query = new AV.Query('Users');
      query.equalTo('openID', user.openid);
      query.first().then(function (result) {
        if (!result) {
          that.setData({
            showModalStatus: true
          })
        } else {
          var employeeInfo = {};
          employeeInfo.employeeID = result.attributes["employeeID"];
          employeeInfo.employeeName = result.attributes["employeeName"];
          employeeInfo.expiredDate = Date.parse(new Date()) + 600 * 1000; //10分钟有效期 
          wx.setStorageSync('employeeInfo', employeeInfo);//存储员工信息
          console.log("已绑定员工信息:", employeeInfo);
        }
      }, function (error) {
      })
    }else{
      console.log("缓存：员工信息:", employeeInfo);
    }

  },

 

})
