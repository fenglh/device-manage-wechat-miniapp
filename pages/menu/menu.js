// pages/menu/menu.js
const leanCloudManager = require('../../utils/leanCloudManager');


Page({

  /**
   * 页面的初始数据
   */
  data: {
    employeeObjectID:null,
    routers: [
      {
        name: '共享记录',
        url: '../log/log',
        icon: '../images/record.png'
      },

      {
        name: '组别',
        url: '../group/group',
        icon: '../images/group2.png'
      },
      {
        name: '',
        url: '',
        icon: ''
      },
    ]
  }, 

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      this.setData({
        employeeObjectID: options.employeeObjectID,
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    //查询是否管理员
    var that = this;
    leanCloudManager.isAdmin({
      employeeObjectID: that.data.employeeObjectID,
      success:function(result){
        if(result){
          //是管理员
          console.log('是管理员')
          var routers = that.data.routers;
          routers[1] = {
            name: '管理员设置',
            url: '../admin/admin',
            icon: '../images/guanliyuan.png'
          };

          that.setData({
            routers: routers,
          })
        }
      }
    });
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