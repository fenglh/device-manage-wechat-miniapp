//index.js
const AV = require('../../utils/av-live-query-weapp-min');

//获取应用实例
const app = getApp()


Page({
  data: {

    showModalStatus:false,
    userInfo: wx.getStorageSync('userInfo') || {},
    openIdInfo: wx.getStorageSync('openIdInfo') || {},
    employeeInfo: wx.getStorageSync('employeeInfo') || {},
    list: [1,2,3,4,5,6,7,8,9,10],
  },


 
  /******************* */
  onLoad: function () {

  },

  onReady:function(){

    var that = this;
    //获取用户信息和openid

    console.log("缓存openid信息：",this.data.openIdInfo)
    console.log("缓存userInfo信息：",this.data.userInfo)
    if (!this.data.openIdInfo.openid || !this.data.userInfo.avatarUrl || !this.data.userInfo.nickName) {
      console.log("头像或者昵称不存在");
      wx.login({
        success: function (res) {
          if (res.code) {
            //获取用户信息
            wx.getUserInfo({
              success: function (res) {
                that.saveUserInfo(res.userInfo);
              }, fail(error) {
                console.log("获取用户信息失败，原因:",error.errMsg);
                // that.showToast("请点击左上角\"头像\"进行授权!");
              }
            });
            //获取openid
            if (!that.data.openIdInfo.openid) {
              that.getOpenId(res.code,function(openid){
                  if(openid){
                    var obj = {};
                    obj.openid = openid;
                    wx.setStorageSync('openIdInfo', obj);//存储openid
                    that.setData({
                      openIdInfo: obj,
                    })
                    //获取绑定的员工信息
                    that.getBindEmployeeInfo(obj.openid);
                  }
              });
            }else{
              //获取绑定的员工信息
              that.getBindEmployeeInfo(that.data.openIdInfo.openid);
            }
            
          } else {
            that.showToast('获取登录用户身份标识失败');
          }
        }
      });
    }else{
      //获取绑定的员工信息
      that.getBindEmployeeInfo(that.data.openIdInfo.openid);
    }

  },






  getOpenId: function (code, callback = ((string) => (Void))){
    //获取openid
    var data = app.globalData;//这里存储了appid、secret、token串  
    var url = 'https://api.weixin.qq.com/sns/jscode2session';
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
        callback(res.data.openid);
      }, fail(error) {
        console.log(error);
        callback(null);
      }
    });
  },
  
  showToast:function(content, duration=3000) {
    wx.showToast({
      title: content,
      icon: "none",
      duration: duration,
    })
  },



  getBindEmployeeInfo: function (openid){
  //在获取了openid的情况下，检查绑定关系
    if (!openid) {
      console.log('openid还没有获取到');
      return;
    }
   

    var now = Date.parse(new Date());//当前时间

    if (!this.data.employeeInfo.employeeID || !this.data.employeeInfo.employeeName || (now - this.data.employeeInfo.expiredDate >0)){
      var that = this;
      var query = new AV.Query('Users');
      query.equalTo('openID', openid);
      query.first().then(function (result) {
        if (!result) {
          console.log("还没有绑定员工信息")
          that.setData({
            showModalStatus: true
          })
        } else {
          console.log("已有绑定员工信息")
          var employeeInfo = {};
          employeeInfo.employeeID = result.attributes["employeeID"];
          employeeInfo.employeeName = result.attributes["employeeName"];
          employeeInfo.expiredDate = Date.parse(new Date()) + 1000 * 60 * 60 * 24; //24小时有效期 
          wx.setStorageSync('employeeInfo', employeeInfo);//存储员工信息
          console.log("从服务器获取绑定的员工信息:", employeeInfo);
        }
      }, function (error) {
      })
    }else{
      console.log('从缓存中获取到绑定员工信息:', this.data.employeeInfo);
    }
    



  },



  //事件
  bindgetuserinfo: function (e) {
    console.log(e);
    if (!e.detail.rawData) {
      this.showToast('授权失败!请点击右上角“更多-关于-更多-设置”中开启权限', 5000);
    } else {
      this.saveUserInfo(e.detail.userInfo);
      //跳转
      wx.navigateTo({
        url: '../user/user',
      })
    }

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

  bindEmployee:function(e) {
    

    var employeeInfo = {};
    employeeInfo.employeeID = e.detail.employeeID;
    employeeInfo.employeeName = e.detail.employeeName;
    wx.setStorageSync('employeeInfo', employeeInfo);//存储员工信息
    console.log("更新绑定结果:", employeeInfo);

  },

  //保存用户信息
  saveUserInfo: function (userInfo) {
    if (userInfo) {
      var objz = {};
      objz.avatarUrl = userInfo.avatarUrl;
      objz.nickName = userInfo.nickName;
      this.setData({
        userInfo: objz,
      })
      app.globalData.userInfo = objz;
      wx.setStorageSync('userInfo', objz);//存储userInfo
      console.log("保存用户信息:", userInfo);
      console.log('保存app.globalData:', app.globalData);
    }

  },

 

})
