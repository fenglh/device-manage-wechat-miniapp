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
    hiddens: {},
    openid:null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var brands = wx.getStorageSync('brandsInfo')  ;
      this.setData({
        openid:options.openid,
        brands: brands,
      })
      this.getMyDevices();

      console.log("===当前品牌列表：", this.data.brands);
  },

  bindAddDevice:function(e){
    wx.navigateTo({
      url: '../device/device',
    })
  },

  bindSpread: function (e) {
    var tapIndex = e.currentTarget.dataset.index;
    
    if (!this.data.devices[tapIndex].borrowedEmployeeID && this.data.devices[tapIndex].borrowedUserOpenID){
      console.log('获取借用人信息');
      this.getBorrowUserInfo(tapIndex)
    }
    var hiddens = this.data.hiddens;
    if (!this.data.hiddens[tapIndex]) {
      hiddens[tapIndex] = true;
    } else {
      hiddens[tapIndex] = false;

    }
    this.setData({
      hiddens: hiddens
    });

    console.log('当前点击:', this.data.hiddens);

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
  bindPass:function(e){
    var index = e.currentTarget.dataset.index;
    var that = this;
    var borrowedEmployeeID = this.data.devices[index].borrowedEmployeeID;
    var borrowedEmployeeName = this.data.devices[index].borrowedEmployeeName;
    var deviceModel = this.data.devices[index].deviceModel;
    wx.showModal({
      title: deviceModel+'借用申请',
      content: "“" + borrowedEmployeeName + "”" + "向你申请借用该设备" ,
      cancelText: '稍后',
      confirmText: '同意',
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定');
          that.doBorrowDevice(item.deviceID);
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  updateDeviceStatus: function (objectId, status) {
    var that = this;
    var todo = AV.Object.createWithoutData('DevicesStatus', objectId);
    todo.set('status', status);
    todo.save().then(function (result) {
      that.getStatus(that.data.devices);
      wx.showToast({
        title: '设备借取申请成功,请等待管理员确认',
        icon: 'none'
      })
    }, function (error) {
      wx.showToast({
        title: '设备借取申请失败！',
        icon: 'none'
      })
    });
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
        devices.sort(function (a, b) {
          //升序
          var statusA = a.status ? a.status : 0;
          var statusB = b.status ? b.status : 0;
          return statusA - statusB;
        })
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