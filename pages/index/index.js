//index.js
const AV = require('../../utils/av-live-query-weapp-min');

//获取应用实例
const app = getApp()


Page({
  data: {
    appid: 'wx2fc1b68058a04d90',//appid需自己提供，此处的appid我随机编写
    secret: 'ece9a679463eb37126b3c5fb3df0073e',//secret需自己提供，此处的secret我随机编写
    showModalStatus:false,
    userInfo: wx.getStorageSync('userInfo') || {},
    openIdInfo: wx.getStorageSync('openIdInfo') || {},
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

    var that = this;
    //获取用户信息和openid

    console.log("缓存openid信息：",this.data.openIdInfo)
    console.log("缓存userInfo信息：",this.data.userInfo)
    if ( !this.data.userInfo.avatarUrl || !this.data.userInfo.nickName) {
      wx.login({
        success: function (res) {
          if (res.code) {
            //获取用户信息
            wx.getUserInfo({
              success: function (res) {
                var objz = {};
                objz.avatarUrl = res.userInfo.avatarUrl;
                objz.nickName = res.userInfo.nickName;
                that.setData({
                  userInfo:objz,                
                })
                app.globalData.userInfo = objz;
                wx.setStorageSync('userInfo', objz);//存储userInfo

              }, fail(error) {
                console.log("获取用户信息失败，原因:",error.errMsg);
              }
            });
            if (!that.data.openIdInfo.openid) {
              //获取openid
              var data = that.globalData;//这里存储了appid、secret、token串  
              var url = 'https://api.weixin.qq.com/sns/jscode2session';
              wx.request({
                url: url,
                data: {
                  appid: that.data.appid,
                  secret: that.data.secret,
                  js_code: res.code,
                  grant_type: 'authorization_code'

                },
                method: 'GET',
                success: function (res) {
                  var obj = {};
                  obj.openid = res.data.openid;
                  wx.setStorageSync('openIdInfo', obj);//存储openid
                  that.setData({
                    openIdInfo: obj,
                  })
                  console.log('获取openid成功:', obj.openid);
                  that.checkBindEmployeeInfo(obj.openid);

                }, fail(error) {
                  console.log(error);
                }
              })
            }else{
              that.checkBindEmployeeInfo(that.data.openIdInfo.openid);
            }
            
          } else {
            console.log('获取用户登录状态失败' + res.errMsg);
          }
        }
      });
    }

  },

  checkBindEmployeeInfo: function (openid){
  //在获取了openid的情况下，检查绑定关系
    if (!openid) {
      console.log('openid还没有获取到');
      return;
    }
   
    var employeeInfo = wx.getStorageSync('employeeInfo') || {};
    var that = this;
    var now = Date.parse(new Date())
    if (!employeeInfo.employeeID || !employeeInfo.employeeName || (now - employeeInfo.expiredDate > 0)) {
      var query = new AV.Query('Users');
      query.equalTo('openID', openid);
      query.first().then(function (result) {
        if (!result) {
          console.log("还没有绑定员工信息")
          that.setData({
            showModalStatus: true
          })
        } else {
          console.log("已没有绑定员工信息")
          var employeeInfo = {};
          employeeInfo.employeeID = result.attributes["employeeID"];
          employeeInfo.employeeName = result.attributes["employeeName"];
          employeeInfo.expiredDate = Date.parse(new Date()) + 600 * 1000; //10分钟有效期 
          wx.setStorageSync('employeeInfo', employeeInfo);//存储员工信息
          console.log("从服务器获取绑定的员工信息:", employeeInfo);
        }
      }, function (error) {
      })
    } else {
      console.log("从缓存获取绑定的员工信息:", employeeInfo);
    }
  }

 

})
