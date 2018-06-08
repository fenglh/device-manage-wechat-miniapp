//index.js
//获取应用实例
const app = getApp()
const coordtransform = require('../lib/coordtransform.js');

Page({
  data: {
    scale:14,
    latitude: null,
    longitude: null,
    altitude:null,
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    //控件
    controls: [],
    markers: []
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
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
  onLoad: function () {

    //获取定位
    this.getLocation();

    //获取用户信息
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        console.log(res.userInfo)
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
          console.log(res.userInfo)
        }
      })
    }

    //获取设备信息
    wx.getSystemInfo({
      success: res =>  {
        console.log("手机品牌:%s",res.model)
        console.log("系统版本:%s",res.system)
        console.log("屏幕宽度:%s",res.windowWidth)
        console.log("屏幕高度:%s",res.windowHeight)
        console.log("微信设置的语言:%s",res.language)
        console.log("微信版本号:%s",res.version)
        console.log("客户端平台:%s",res.platform)
        this.setData({
          //控件
          controls: [{
            // 我的位置控件
            id: 0,
            iconPath: "../images/imgs_main_location@2x.png",
            position: {
              left: 10,
              top: res.windowHeight -70 ,
              width: 50,
              height: 50
            },
            clickable: true
          }, {
            //二维码控件
            id: 1,
            iconPath: "../images/lock.png",
            position: {
              left: 10 + 50 +10,
              top: res.windowHeight - 70,
              width: 100,
              height: 50
            },
            clickable: true
            }, {
              //二维码控件
              id: 2,
              iconPath: "../images/lock.png",
              position: {
                left: 10 + 50 + 10 + 100 + 10,
                top: res.windowHeight - 70,
                width: 100,
                height: 50
              },
              clickable: true
            }]
        })
      }
    })
  },
  //视野变化
  regionchange(e){
    var mapCtx = wx.createMapContext("map", this);

    //获取当前地图的中心经纬度
    mapCtx.getCenterLocation({
      success: function (res) {
        console.log("中心经纬度:%f,%f", res.latitude, res.longitude)
      }
    }) 
  },
  // 控件处理程序
  controltap(e) {
    // 定位
    if (e.controlId == 0) {
      this.getLocation();
    };
    //借
    if (e.controlId == 1) {
      wx.scanCode({
        success: (res) => {
        },
        fail: (res) => {
          this.setData({
            lockhidden: false
          });
        }
      })
    };
    //还
    if (e.controlId == 2) {
      wx.scanCode({
        success: (res) => {
        },
        fail: (res) => {
          this.setData({
            lockhidden: false
          });
        }
      })
    }
  },

//获取定位信息
  getLocation: function () {
    var that = this
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        //设置中心经纬度
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          altitude: res.altitude,
          scale:16,
        })
      },
      fail: function (res) {
        wx.showToast({
          title: '获取定位信息失败',
          icon: 'none',
        })
      },

    })
  },

})
