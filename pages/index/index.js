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
    borrowedDevicesCount: 0,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
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
    
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
          })
        }
      })
    }

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

  // ok
  bindSearchConfirm: function (e) {
    console.log(e.detail);
  },
  //ok
  bindSearchInput: function (e) {
    console.log(e.detail);
    this.searchContent(e.detail.value);
  },
  // ok
  bindMyDevices: function (e) {
    //跳转
    wx.navigateTo({
      url: '../myDevices/myDevices',
    })
  },
  // ok
  bindBorrowedDevices: function (e) {
    //跳转
    wx.navigateTo({
      url: '../borrowedDevices/borrowedDevices',
    })
  },
  // ok
  bindBorrowed: function (e) {
    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    var that = this;
    wx.showModal({
      title: '申请借用设备',
      content: "你确定要申请设备 " + device.model + "?" ,
      cancelText: '稍后',
      confirmText: '申请',
      success: function (res) {
        if (res.confirm) {
          that.doBorrowDevice(index);
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

    //内嵌查询,匹配 != -99 的记录
    var innerQuery = new AV.Query('DevicesStatus');
    innerQuery.equalTo('status', -99);
    query.doesNotMatchQuery('dependentDevicesStatus', innerQuery);


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

    //组合加内嵌查询
    var innerQuery1 = new AV.Query('DevicesStatus');
    innerQuery1.notEqualTo('status', 0);
    var innerQuery2 = new AV.Query('DevicesStatus');
    innerQuery2.notEqualTo('status', -99);
    var innerQuery12 = AV.Query.and(innerQuery1, innerQuery2);

    var innerQuery3 = new AV.Query('DevicesStatus');
    var borrowedUser = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    innerQuery3.equalTo('dependentUser', borrowedUser);
    var query = new AV.Query('Devices');

    var query123 = AV.Query.and(innerQuery12, innerQuery3);

    //执行内嵌操作
    query.matchesQuery('dependentDevicesStatus', query123);


    query.find().then(function (results) {
      that.setData({
        borrowedDevicesCount: results.length,
      })
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

          var deviceAVObject = AV.Object.createWithoutData('Devices', device.deviceObjectID);
          var timestamp = Date.parse(new Date());
          //关联状态
          var statusAVObject = new AV.Object('DevicesStatus');
          statusAVObject.set('status', -1); //0闲置，-1 申请中，-2借出，-3归还中 
          statusAVObject.set('actionTimestamp', timestamp);//当前操作时间
          //关联借用人
          var dependentUserAVObject = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
          statusAVObject.set('dependentUser', dependentUserAVObject);//关联用户
          //关联设备
          statusAVObject.set('dependentDevice', deviceAVObject);//关联设备

          //关联状态
          deviceAVObject.set('dependentDevicesStatus', statusAVObject);
          deviceAVObject.save().then(function(result){
            wx.showToast({
              title: '申请借取成功!',
            });
            that.getDevices();
            that.getBorrowedDeviceCount();
          },function(error){
            wx.showToast({
              title: '申请借取失败，请稍后再试',
              icon:'none'
            });
            console.log(error);
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

    //内嵌查询,匹配 != -99 的记录
    var innerQuery = new AV.Query('DevicesStatus'); 
    innerQuery.equalTo('status', -99);
    query.doesNotMatchQuery('dependentDevicesStatus', innerQuery);
    
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
          allDevices:[],
          devices:[],
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
  showToast: function (content, duration = 3000) {
    wx.showToast({
      title: content,
      icon: "none",
      duration: duration,
    })
  },

  //事件
  getUserInfo: function (e) {
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
