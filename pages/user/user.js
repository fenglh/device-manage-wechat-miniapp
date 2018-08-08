// pages/user/user.js
const AV = require('../../utils/av-live-query-weapp-min');

const app = getApp()

const userInfo = wx.getStorageSync('userInfo');

Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    employeeInfo:  {},
    userInfo:{},
    binBtnHide:false,
    focus:false,
    showModalStatus: false,
  },


  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '个人信息',
    })
    console.log("个人信息:", app.globalData.employeeInfo);
      this.setData({
        employeeInfo: app.globalData.employeeInfo || {},
        userInfo: app.globalData.userInfo || {},
      })
  },

  bindLogout:function(e){
    var that = this;
    wx.showModal({
      title: '解除绑定',
      content: '您确定要解除绑定吗？',
      success: function (res) {
        
        if (res.confirm) {
          that.deleteBindOpenId(app.globalData.openid);
        }
      }
    })

  },



  deleteBindOpenId: function ( youOpenId) {
    wx.showLoading({
      title: '',
      mask:true,
    })
    var Users = AV.Object.extend('Users');
    var that = this;
    var query = new AV.Query(Users);
    query.equalTo('openID', youOpenId);
    query.first().then(function (result) {
      var user = AV.Object.createWithoutData('Users', result.id);
      user.destroy().then(function (success) {
        wx.clearStorage();
        wx.reLaunch({
          url: '../login/login',
        })

      }, function (error) {
        wx.hideLoading();
        // 删除失败
        wx.showToast({
          title: '解除绑定失败!',
          icon: "none",
        })
      });

    }, function (error) {
      wx.hideLoading();
      wx.showToast({
        title: '绑定不存在',
        icon: "none",
      })
    });

  },


 
})