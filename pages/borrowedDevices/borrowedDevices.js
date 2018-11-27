
const AV = require('../../utils/av-live-query-weapp-min');
const leanCloudManager = require('../../utils/leanCloudManager');
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    employeeObjectID:null,
    devices: [],
    showEmptyView:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '借入设备',
    });

    this.setData({
      employeeObjectID: options.employeeObjectID,
    })
    this.getBorrowedDevices();
  },

  //ok
  formatDateTime: function (inputTime) {
    var date = new Date(inputTime);
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    var h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    var minute = date.getMinutes();
    var second = date.getSeconds();
    minute = minute < 10 ? ('0' + minute) : minute;
    // second = second < 10 ? ('0' + second) : second; 
    return y + '-' + m + '-' + d + ' ' + h + ':' + minute;
  },
  //ok
  bindTapExpand: function (e) {
    var tapIndex = e.currentTarget.dataset.index;
    var devices = this.data.devices;
    var device = devices[tapIndex];
    if (!device.isExpand) {
      device.isExpand = true;
    } else {
      device.isExpand = !device.isExpand;
    }
    this.setData({
      devices: devices
    });


  },



  
  // ok
  getBorrowedDevices: function () {
    var that = this;
    leanCloudManager.getBorrowedDevices({
      employeeObjectID: that.data.employeeObjectID,
      success: function (devices) {
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
        var show = false;
        if (devices.length <= 0) {
          show = true;
        }
        that.setData({
          showEmptyView: show,
          devices: devices
        })
      },
      fail: function (error) {
        wx.showToast({
          title: '获取设备列表失败',
          icon: 'none',
        });
      }
    });
  },


  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    this.getBorrowedDevices();
  },

})