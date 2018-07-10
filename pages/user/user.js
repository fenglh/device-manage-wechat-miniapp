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
    binBtnHide:false,
    focus:false,
    showModalStatus: false,
    openIdInfo:  {},
  },


  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '个人信息',
    })
      this.setData({
        employeeInfo: wx.getStorageSync('employeeInfo') || {},
        userInfo: wx.getStorageSync('userInfo') || {},
        openIdInfo: wx.getStorageSync('openIdInfo') || {},
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

  bindSubmit:function(){
    this.setData({
      showModalStatus: true
    });

  },
  bindEmployee: function (e) {

    var employeeInfo = {};
    employeeInfo.employeeID = e.detail.employeeID;
    employeeInfo.employeeName = e.detail.employeeName;
    employeeInfo.expiredDate = e.detail.expiredDate;
    this.setData({
      employeeInfo: employeeInfo,
    })
    wx.setStorageSync('employeeInfo', employeeInfo);//存储员工信息
    console.log("更新绑定结果:", employeeInfo);

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