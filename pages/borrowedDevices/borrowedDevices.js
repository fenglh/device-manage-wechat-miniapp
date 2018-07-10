
const AV = require('../../utils/av-live-query-weapp-min');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    devices: [],
    brands: {},
    hiddens: {},
    openid: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var brands = wx.getStorageSync('brandsInfo');
    this.setData({
      openid: options.openid,
      brands: brands,
    })
    this.getBorrowedDevices();

    console.log("当前品牌列表：", this.data.brands);
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

  bindSpread: function (e) {
    var tapIndex = e.currentTarget.dataset.index;

    if (!this.data.devices[tapIndex].ownerEmployeeName && this.data.devices[tapIndex].ownerID) {
      console.log('获取设备归属人信息');
      this.getDeviceUserInfo(tapIndex)
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
    var query = new AV.Query('DevicesStatus');
    query.equalTo("borrowedUserOpenID", this.data.openid);
    query.find().then(function (results) {
      results.forEach(function (item, index) {
        var queryDevices = new AV.Query('Devices');
        queryDevices.equalTo('deviceID', item.attributes.deviceID);
        queryDevices.first().then(function (result) {
          if (result) {

            var device = result.attributes;
            device.status = item.attributes.status;
            device.borrowedTime = that.formatDateTime(item.attributes.actionTimestamp);
            devices.push(device);
            that.setData({
              devices: devices
            })
          }
        },function(error){

        });
        });
      }, function (error) {
        console.log(error);
      });
    },

})