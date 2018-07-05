// pages/user/user.js

const app = getApp()

const userInfo = wx.getStorageSync('userInfo');

Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    employeeInfo:  {},
    userInfo:{},
    binBtnHide:true,
    focus:false
  },


  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      this.setData({
        employeeInfo: wx.getStorageSync('employeeInfo'),
        userInfo: wx.getStorageSync('userInfo')
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    if (!this.data.employeeInfo){
      var that = this;
      wx.showModal({
        title: '提示',
        content: '请绑定员工信息',
        showCancel:false,
        success:function(){
          that.setData({
            binBtnHide:false,
            focus:true
          })
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})