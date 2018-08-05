
const AV = require('../../utils/av-live-query-weapp-min');
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    devices: [],
    brandsInfo: {},
    showEmptyView:false,
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
    query.equalTo('borrowedUserOpenID', app.globalData.openid);
    query.equalTo('status', -2);
    query.first().then(function (status) {
      var todo = AV.Object.createWithoutData('DevicesStatus', status.id);
      // 修改属性
      var timestamp = Date.parse(new Date());
      todo.set('status', -3);//归还中
      todo.set('actionTimestamp', timestamp);//当前操作时间
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
    query.equalTo('borrowedUserOpenID', app.globalData.openid);
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


  // ok
  getBorrowedDevices: function () {
    var that = this;

    var user = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    var query = new AV.Query('Devices');
    query.equalTo('dependentUser', user);
    query.include(['dependentModel.dependent']);
    query.include(['dependentUser']);
    query.include(['dependentDevicesStatus.dependentUser']);

    query.find().then(function (results) {

      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
      if (results.length > 0) {
        var devices = [];
        results.forEach(function (item, index) {
          //设备信息
          var deviceObjectID = item.id;
          var deviceID = item.get('deviceID');
          var OSVersion = item.get('OSVersion');
          var companyCode = item.get('companyCode');
          //型号
          var modelObjectID = item.get('dependentModel') ? item.get('dependentModel').id : null;
          var model = item.get('dependentModel') ? item.get('dependentModel').get('model') : null;
          //品牌
          var brand = item.get('dependentModel') ? (item.get('dependentModel').get('dependent') ? item.get('dependentModel').get('dependent').get('brand') : null) : null;
          //状态
          var status = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').get('status') : null;
          var statusObjectID = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').id : null;

          var statusObjectID = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').id : null;
          var statusActionTimestamp = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').get('actionTimestamp') : null;

          var statusActionEmployeeObjectID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentUser') ? item.get('dependentDevicesStatus').get('dependentUser').id : null) : null;
          var statusActionEmployeeID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentUser') ? item.get('dependentDevicesStatus').get('dependentUser').get('employeeID') : null) : null;
          var statusActionEmployeeObjectName = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentUser') ? item.get('dependentDevicesStatus').get('dependentUser').get('employeeName') : null) : null;

          //用户信息
          var employeeObjectID = item.get('dependentUser') ? item.get('dependentUser').id : null;
          var employeeID = item.get('dependentUser') ? item.get('dependentUser').get('employeeID') : null;
          var employeeName = item.get('dependentUser') ? item.get('dependentUser').get('employeeName') : null;
          var employeeOpenID = item.get('dependentUser') ? item.get('dependentUser').get('openID') : null;
          var obj = {};
          obj.deviceObjectID = deviceObjectID;
          obj.deviceID = deviceID;
          obj.OSVersion = OSVersion;
          obj.companyCode = companyCode;
          obj.modelObjectID = modelObjectID;
          obj.model = model;
          obj.brand = brand;

          obj.status = status;
          obj.statusObjectID = statusObjectID;
          obj.statusActionTimestamp = that.formatDateTime(statusActionTimestamp);
          obj.statusActionEmployeeObjectID = statusActionEmployeeObjectID;
          obj.statusActionEmployeeID = statusActionEmployeeID;
          obj.statusActionEmployeeObjectName = statusActionEmployeeObjectName;

          obj.employeeObjectID = employeeObjectID;
          obj.employeeID = employeeID;
          obj.employeeName = employeeName;
          obj.employeeOpenID = employeeOpenID;
          devices.push(obj);
          console.log(devices);
        });
        that.setData({
          showEmptyView: false,
          allDevices: devices,
          devices: devices
        })
      } else {
        that.setData({
          showEmptyView: true,
        })
      }
    }, function (error) {
      wx.showToast({
        title: '获取设备列表失败',
        icon: 'none',
      })
    });

  },

})