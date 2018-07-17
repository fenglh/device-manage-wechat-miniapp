// pages/myDevices/myDevices.js

const AV = require('../../utils/av-live-query-weapp-min');
const now = Date.parse(new Date());//当前时间
Page({

  /**
   * 页面的初始数据
   */
  data: {
    devices: [],
    brands: {},
    openid: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */

  onShow:function() {
    this.getMyDevices();
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '我的设备',
    })

    var brands = wx.getStorageSync('brandsInfo');
    this.setData({
      openid: options.openid,
      brands: brands,
    })
    
  },

  bindAddDevice: function (e) {
    wx.navigateTo({
      url: '../device/device',
    })
  },

  bindTapExpand: function (e) {
    var tapIndex = e.currentTarget.dataset.index;

    if (!this.data.devices[tapIndex].borrowedEmployeeID && this.data.devices[tapIndex].borrowedUserOpenID) {
      console.log('获取借用人信息');
      this.getBorrowUserInfo(tapIndex)
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


  getBorrowUserInfo: function (index) {
    var that = this;
    var openid = this.data.devices[index].borrowedUserOpenID;
    var queryUser = new AV.Query('Users');
    queryUser.equalTo("openID", openid);
    queryUser.first().then(function (result) {
      var borrowedEmployeeID = result.attributes.employeeID;
      var borrowedEmployeeName = result.attributes.employeeName;
      var devices = that.data.devices;
      devices[index].borrowedEmployeeID = borrowedEmployeeID;
      devices[index].borrowedEmployeeName = borrowedEmployeeName;
      console.log(result);
      console.log(devices);
      that.setData({
        devices: devices,
      })

    }, function (error) {
      console.log(error);
    });

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  confirmReturn:function(index){
    var that = this; 
    var query = new AV.Query('DevicesStatus');
    query.equalTo('deviceID', this.data.devices[index].deviceID);
    query.equalTo('borrowedUserOpenID', this.data.devices[index].borrowedUserOpenID);
    query.equalTo('status', -3);
    query.first().then(function (status) {
      var todo = AV.Object.createWithoutData('DevicesStatus', status.id);
      // 修改属性
      todo.set('status', 0);//归还中
      todo.set('borrowedUserOpenID', "");
      // 保存到云端
      todo.save().then(function (result) {
        wx.showToast({
          title: '确认归还成功',
          icon: 'success',
        });
        that.getMyDevices();
      }, function (error) {
        console.log(error);
      });
    }, function (error) {

    });
  },

  bindConfirmReturn:function(e){
    var index = e.currentTarget.dataset.index;
    var that = this;
    wx.showModal({
      title: '确认归还',
      content: '你确定已归还 ' + that.data.devices[index].deviceModel + " ?",
      success: function (res) {
        if (res.confirm) {
          that.confirmReturn(index);
        }
      }
    })
  },
  bindPass: function (e) {
    var index = e.currentTarget.dataset.index;
    var that = this;
    var borrowedEmployeeID = this.data.devices[index].borrowedEmployeeID;
    var borrowedEmployeeName = this.data.devices[index].borrowedEmployeeName;
    var deviceModel = this.data.devices[index].deviceModel;
    wx.showModal({
      title: deviceModel + '借用申请',
      content: "“" + borrowedEmployeeName + "”" + "向你申请借用该设备",
      cancelText: '稍后',
      confirmText: '同意',
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定');
          that.agreeBorrowed(that.data.devices[index].deviceID);
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  agreeBorrowed: function (deviceID) {
    var that = this;
    var queryStatus = new AV.Query('DevicesStatus');
    queryStatus.equalTo("deviceID", deviceID);
    queryStatus.first().then(function (result) {
      that.updateDeviceStatus(result.id, -2);

    }, function (error) {

    });
  },

  updateDeviceStatus: function (objectId, status) {
    var that = this;
    var timestamp = Date.parse(new Date());
    var todo = AV.Object.createWithoutData('DevicesStatus', objectId);
    todo.set('status', status);
    todo.set('actionTimestamp', timestamp);//当前操作时间
    todo.save().then(function (result) {
      that.getStatus(that.data.devices);
      wx.showToast({
        title: '设备借取已同意申请借用!',
        icon: 'none'
      })
    }, function (error) {
      wx.showToast({
        title: '同意借取设备失败，服务器错误',
        icon: 'none'
      })
    });
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



  getStatus: function (devices) {
    var status = {};
    var that = this;
    devices.forEach(function (item, index) {

      //获取设备状态
      var queryStatus = new AV.Query('DevicesStatus');
      queryStatus.equalTo("deviceID", item.deviceID);
      queryStatus.first().then(function (result) {
        item.status = result.attributes.status;
        item.borrowedUserOpenID = result.attributes.borrowedUserOpenID;
        item.borrowedTime = that.formatDateTime(result.attributes.actionTimestamp);
        // devices.sort(function (a, b) {
        //   //升序
        //   var statusA = a.status ? a.status : 0;
        //   var statusB = b.status ? b.status : 0;
        //   return statusA - statusB;
        // })
        that.setData({
          devices: devices,
        })
      }, function (error) {
        console.log(error);
      });
    });
  },
  getMyDevices: function () {
    var that = this;
    var query = new AV.Query('Devices');
    query.equalTo('ownerID', this.data.openid);
    query.find().then(function (results) {

      if (results) {
        var devices = [];
        results.forEach(function (item, index) {
          devices.push(item.attributes);
        });
        that.setData({
          devices: devices
        })
        that.getStatus(devices);
        // that.getUsers(devices);
        console.log("获取设备列表:", devices);

      } else {
        console.log('无法从服务器同步设备系统版本列表');
      }

    }, function (error) {
    });
  },



})