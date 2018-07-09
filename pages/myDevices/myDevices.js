// pages/myDevices/myDevices.js

const AV = require('../../utils/av-live-query-weapp-min');
const now = Date.parse(new Date());//当前时间
Page({

  /**
   * 页面的初始数据
   */
  data: {
    devices: [],
    users: {},
    status: {},
    brands: {},
    hiddens: {},
    openid:null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var brands = wx.getStorageSync('brandsInfo') ;
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },


  getMyDevices: function () {
    var that = this;
    var query = new AV.Query('Devices');
    query.equalTo('ownerID',this.data.openid);
    query.descending('updatedAt');
    query.find().then(function (results) {

      if (results) {
        var devices = [];
        var users = {};
        var status = {};
        results.forEach(function (item, index) {
          var queryUser = new AV.Query('Users');
          queryUser.equalTo("openID", item.attributes.ownerID);
          queryUser.first().then(function (result) {
            var obj = {};
            obj.employeeID = result.attributes.employeeID;
            obj.employeeName = result.attributes.employeeName;
            users[result.attributes.openID] = obj;
            that.setData({
              users: users,
            })
          }, function (error) {
            console.log(error);
          });
          //获取设备状态
          var queryStatus = new AV.Query('DevicesStatus');
          queryStatus.equalTo("deviceID", item.attributes.deviceID);
          queryStatus.first().then(function (result) {
            var obj = {};
            obj.status = result.attributes.status;
            status[result.attributes.deviceID] = obj;
            that.setData({
              status: status,
            })
          }, function (error) {
            console.log(error);
          });
          devices.push(item.attributes);
        });

        that.setData({
          devices: devices
        })
        console.log("获取设备列表:", devices);

      } else {
        console.log('无法从服务器同步设备系统版本列表');
      }

    }, function (error) {
    });
  },


})