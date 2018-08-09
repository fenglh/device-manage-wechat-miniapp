
const AV = require('../../utils/av-live-query-weapp-min');
const leanCloudManager = require('../../utils/leanCloudManager');
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    devices: [],
    showEmptyView:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '借入设备',
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
  //ok
  bindReturnBorrowed:function(e) {
    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    var that = this;
    wx.showModal({
      title: '归还设备',
      content: '你确定要归还设备 ' + device.model + " ?",
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({
            title: '',
            mask: true,
          });
          //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
          leanCloudManager.addDoDevicesStatus(device.deviceObjectID, device.borrowEmployeeObjectID, -3, "returning", {
            success: function () {
              wx.showToast({
                title: '归还提交成功，请等待\"' + device.employeeName + "\"确认",
                icon: 'none',
              });
              that.getBorrowedDevices();
            },
            fail: function () {
              wx.showToast({
                title: '归还提交失败，请稍后再试',
                icon: 'none'
              });
            }
          });
        }
      }
    })
  },

  //ok
  bindCancelBorrowed:function(e) {
      console.log('取消申请');
      var index = e.currentTarget.dataset.index;
      var device = this.data.devices[index];
      var that = this;
      wx.showModal({
        title: '取消申请',
        content: '你确定要取消申请 ' + device.model + " ?",
        success: function (res) {
          if (res.confirm) {
            wx.showLoading({
              title: '',
              mask: true,
            });
            //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
            leanCloudManager.addDoDevicesStatus(device.deviceObjectID, device.borrowEmployeeObjectID, 0,"cancel", {
              success:function(){
                wx.showToast({
                  title: "取消申请成功!",
                  icon: 'success',
                });
                that.getBorrowedDevices();
              },
              fail:function(){
                wx.showToast({
                  title: '取消申请失败，请稍后再试',
                  icon: 'none'
                })
              }
            });
          }
        }
      });
  },

  
  // ok
  getBorrowedDevices: function () {
    var that = this;
    leanCloudManager.getBorrowedDevices({
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