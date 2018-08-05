//index.js
const AV = require('../../utils/av-live-query-weapp-min');


//获取应用实例
const app = getApp()

const now = Date.parse(new Date());//当前时间
Page({
  data: {
    showEmptyView: false,
    userInfo: {},
    devices: [],
    allDevices: [],//搜索专用的所有设备
    myDevicesCount: 0,
    borrowedDevicesCount: 0
  },



  /******************* */
  onShow: function () {

    this.getBorrowedDeviceCount();
    this.getMyDevicesCount();
    this.getDevices();

  },
  onLoad: function () {
    wx.setNavigationBarTitle({
      title: '机可借',
    })
    this.setData({
      userInfo: app.globalData.userInfo,
    })
  },

  // ok
  searchContent: function (content) {
    if (content == "") {
      this.getDevices();
      return;
    }
    var devices = [];
    this.data.allDevices.forEach(function (item, index) {
      if (item.model.toUpperCase().indexOf(content.toUpperCase()) != -1 ||
        item.OSVersion.indexOf(content) != -1 ||
        item.deviceID.indexOf(content) != -1) {
        devices.push(item);
      }
    });
    this.setData({
      devices: devices,
    })
  },


  bindSearchConfirm: function (e) {
    console.log(e.detail);
  },

  bindSearchInput: function (e) {
    console.log(e.detail);
    this.searchContent(e.detail.value);
  },

  bindMyDevices: function (e) {
    //跳转
    wx.navigateTo({
      url: '../myDevices/myDevices',
    })
  },
  bindBorrowedDevices: function (e) {
    //跳转
    wx.navigateTo({
      url: '../borrowedDevices/borrowedDevices',
    })
  },

  bindBorrowed: function (e) {
    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    var that = this;
    wx.showModal({
      title: '申请借取设备',
      content: device.model + "（" + device.deviceID + "）",
      cancelText: '稍后',
      confirmText: '申请',
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定');
          that.doBorrowDevice(index);
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  // ok
  getMyDevicesCount: function () {

    var that = this;
    var user = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    var query = new AV.Query('Devices');
    query.equalTo('dependentUser', user);
    query.count().then(function (count) {
      that.setData({
        myDevicesCount: count,
      })
    }, function (error) {

    });
  },

  //ok
  getBorrowedDeviceCount: function () {
    var that = this;
    var user = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    var query = new AV.Query('Devices');
    query.equalTo('dependentUser', user);
    query.include(['dependentDevicesStatus']);
    query.find().then(function (results) {
      var i = 0
      results.forEach(function(item, index){
        var dependentDevicesStatus = item.get('dependentDevicesStatus');
        if (dependentDevicesStatus){
          var status = dependentDevicesStatus.get('status');
          if (status && status != 0){
            i++;
          }
        }
      })
      that.setData({
        borrowedDevicesCount: i,
      })
    }, function (error) {

    });

  },


  //ok
  doBorrowDevice: function (index) {

    var device = this.data.devices[index];
    var query = new AV.Query('Devices');
    query.include(['dependentDevicesStatus']);
    var that = this;
    query.equalTo('deviceID', device.deviceID);
    query.first().then(function (result) {
        if(result){
          //设备被借取了
          var dependentDevicesStatus = result.get('dependentDevicesStatus');
          if (dependentDevicesStatus){
            var status = dependentDevicesStatus.get('status');
            if (status && status!= 0) {
              wx.showToast({
                title: '借取失败，该设备已被借出!',
                icon: "none",
              })
              return;
            }
          }

          //设置
          console.log('可以借用:', device);

          var deviceObject = AV.Object.createWithoutData('Devices', device.deviceObjectID);
          var timestamp = Date.parse(new Date());
          var devicesStatus = new AV.Object('DevicesStatus');
          devicesStatus.set('status', -1); //0闲置，-1 申请中，-2借出，-3归还中 
          devicesStatus.set('actionTimestamp', timestamp);//当前操作时间
          //关联借用人
          var dependentUser = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
          devicesStatus.set('dependentUser', dependentUser);//关联用户
          //关联设备
          var dependentDevice = AV.Object.createWithoutData('Device', device.deviceObjectID);
          devicesStatus.set('dependentDevice', dependentDevice);//关联设备

          //关联状态
          deviceObject.set('dependentDevicesStatus', devicesStatus);
          deviceObject.save().then(function(result){
            console.log('更新状态成功:',reslut);
            wx.showToast({
              title: '申请借取成功!',
            })
          },function(error){
            wx.showToast({
              title: '申请借取失败，请稍后再试',
              icon:'noen'
            })
          });


          
        }else{
          wx.showToast({
            title: '设备已被删除，请刷新列表',
            icon: 'none',
          })
        }
    }, function(error){
        wx.showToast({
        title: '查询设备失败',
        icon:'none',
        })
    });

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
      devices: devices,
      allDevices: devices,
    });



  },


  // ok
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



  // ok
  getDevices: function () {
    var that = this;
    var query = new AV.Query('Devices');
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
          var modelObjectID = item.get('dependentModel')?item.get('dependentModel').id:null;
          var model = item.get('dependentModel')?item.get('dependentModel').get('model'):null;
          //品牌
          var brand = item.get('dependentModel') ? (item.get('dependentModel').get('dependent')?item.get('dependentModel').get('dependent').get('brand'):null):null;
          //状态
          var status = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').get('status'):null;
          var statusObjectID = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').id:null;

          var statusObjectID = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').id : null;
          var statusActionTimestamp = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').get('actionTimestamp') : null;

          var statusActionEmployeeObjectID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentUser')?item.get('dependentDevicesStatus').get('dependentUser').id:null):null;
          var statusActionEmployeeID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentUser')?item.get('dependentDevicesStatus').get('dependentUser').get('employeeID'):null):null;
          var statusActionEmployeeObjectName = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentUser')?item.get('dependentDevicesStatus').get('dependentUser').get('employeeName'):null):null;

          //用户信息
          var employeeObjectID = item.get('dependentUser')?item.get('dependentUser').id:null;
          var employeeID = item.get('dependentUser')?item.get('dependentUser').get('employeeID'):null;
          var employeeName = item.get('dependentUser')?item.get('dependentUser').get('employeeName'):null;
          var employeeOpenID = item.get('dependentUser')?item.get('dependentUser').get('openID'):null;
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
        icon:'none',
      })
    });

  },


  getOpenId: function (code, callback = ((string) => (Void))) {
    //获取openid
    var data = app.globalData;//这里存储了appid、secret、token串  
    var url = 'https://angelapi.bluemoon.com.cn/bmhr-control/demo/weixin';
    wx.request({
      url: url,
      data: {
        appid: data.appid,
        secret: data.secret,
        js_code: code,
        grant_type: 'authorization_code'

      },
      method: 'GET',
      success: function (res) {
        callback(res.data.returnMsg.openid);
      }, fail(error) {
        console.log(error);
        wx.showToast({
          title: error.errMsg,
          icon: 'none'
        });
        callback(null);
      }
    });
  },

  showToast: function (content, duration = 3000) {
    wx.showToast({
      title: content,
      icon: "none",
      duration: duration,
    })
  },

  //事件
  bindgetuserinfo: function (e) {
    console.log(e);
    if (!e.detail.rawData) {
      this.showToast('授权失败!请点击右上角“更多-关于-更多-设置”中开启权限', 5000);
    } else {
      //授权，保存信息
      this.setData({
        userInfo: e.detail.userInfo,
      })
      app.globalData.userInfo = e.detail.userInfo;

      //跳转
      wx.navigateTo({
        url: '../user/user',
      })
    }

  },

  bindMoreEvent: function () {
    wx.navigateTo({
      url: '../menu/menu',
    })
  },

  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    this.onShow();
  },
})
