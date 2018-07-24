
const AV = require('../../utils/av-live-query-weapp-min');
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    devices: [],
    brandsInfo: {},
    openid: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '借入设备',
    })
    var brands = app.globalData.brandsInfo.brands || {};

    this.setData({
      openid: options.openid,
      brands: brands,
    })
    this.getBorrowedDevices();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

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

  bindTapExpand: function (e) {
    var tapIndex = e.currentTarget.dataset.index;

    if (!this.data.devices[tapIndex].ownerEmployeeName && this.data.devices[tapIndex].ownerID) {
      console.log('获取设备归属人信息');
      this.getDeviceUserInfo(tapIndex)
    }
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
  bindReturnBorrowed:function(e) {
    var index = e.currentTarget.dataset.index;
    var that = this;
    wx.showModal({
      title: '归还设备',
      content: '你确定要归还设备 ' + that.data.devices[index].deviceModel + " ?",
      success: function (res) {
        if (res.confirm) {
          that.returnDevice(index);
        }
      }
    })
  },
  bindCancelBorrowed:function(e) {
      console.log('取消申请');
      var index = e.currentTarget.dataset.index;
      var that = this;
      wx.showModal({
        title: '取消申请',
        content: '你确定要取消申请 ' + that.data.devices[index].deviceModel + " ?",
        success: function (res) {
          if (res.confirm) {
            that.cancelBorrowingDevice(index);
          }
        }
      })

  },

  returnDevice:function(index){
    var that = this;
    var query = new AV.Query('DevicesStatus');
    query.equalTo('deviceID', this.data.devices[index].deviceID);
    query.equalTo('borrowedUserOpenID', this.data.openid);
    query.equalTo('status', -2);
    query.first().then(function (status) {
      var todo = AV.Object.createWithoutData('DevicesStatus', status.id);
      // 修改属性
      todo.set('status', -3);//归还中
      // todo.set('borrowedUserOpenID', "");
      // 保存到云端
      todo.save().then(function (result) {
        wx.showToast({
          title: '归还提交成功，请等待管理员确认',
          icon:'none',
        });
        that.getBorrowedDevices();
      }, function (error) {
        console.log(error);
      });
    }, function (error) {

    });
  },
  cancelBorrowingDevice:function(index){
    var that = this;
    var query = new AV.Query('DevicesStatus');
    query.equalTo('deviceID', this.data.devices[index].deviceID);
    query.equalTo('borrowedUserOpenID', this.data.openid);
    query.equalTo('status', -1);
    query.first().then(function (status) {
      var todo = AV.Object.createWithoutData('DevicesStatus', status.id);
      // 修改属性
      todo.set('status', 0);
      todo.set('borrowedUserOpenID', "");
      // 保存到云端
      todo.save().then(function (result) {
        wx.showToast({
          title: '取消申请成功!',
        });
        that.getBorrowedDevices();
      }, function (error) {
        console.log(error);
      });
    }, function (error) {

    });
  },

  getDeviceUserInfo: function (index) {
    var that = this;
    var openid = this.data.devices[index].ownerID;
    var queryUser = new AV.Query('Users');
    queryUser.equalTo("openID", openid);
    queryUser.first().then(function (result) {
      var ownerEmployeeID = result.attributes.employeeID;
      var ownerEmployeeName = result.attributes.employeeName;
      var devices = that.data.devices;
      devices[index].ownerEmployeeID = ownerEmployeeID;
      devices[index].ownerEmployeeName = ownerEmployeeName;
      that.setData({
        devices: devices,
      })
      console.log(devices);

    }, function (error) {
      console.log(error);
    });

  },


  getBorrowedDevices: function () {
    if (!this.data.openid) {
      wx.showToast({
        title: '无法获取到用户openid',
        icon: "none"
      });
      return;
    }
    var that = this;
    //获取设备状态
    var devices = [];
    var borrowedOpenidQuery = new AV.Query('DevicesStatus');
    borrowedOpenidQuery.equalTo("borrowedUserOpenID", this.data.openid);

    var statusQuery = new AV.Query('DevicesStatus');
    statusQuery.notEqualTo("status", 0);
    
    var query = AV.Query.and(borrowedOpenidQuery, statusQuery);

    query.find().then(function (results) {
      if(results.length == 0){
        that.setData({
          devices: [],
        })
        return;
      }
      results.forEach(function (item, index) {
        var queryDevices = new AV.Query('Devices');
        queryDevices.equalTo('deviceID', item.attributes.deviceID);
        queryDevices.first().then(function (result) {
          if (result) {

            var device = result.attributes;
            device.status = item.attributes.status;
            device.actionTime = that.formatDateTime(item.attributes.actionTimestamp);
            devices.push(device);
            that.setData({
              devices: devices
            })
          }
        },function(error){
          console.log(error);
        });
        });
      }, function (error) {
        console.log(error);
      });
    },

})