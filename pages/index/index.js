//index.js
const AV = require('../../utils/av-live-query-weapp-min');

//获取应用实例
const app = getApp()

const now = Date.parse(new Date());//当前时间
Page({
  data: {
    showEmptyView: false,
    userInfo: wx.getStorageSync('userInfo') || {},
    devices: [],
    allDevices: [],//搜索专用的所有设备
    brandsInfo: app.globalData.brandsInfo || {},
    modelsInfo: app.globalData.modelsInfo || {},
    myDevicesCount: 0,
    borrowedDevicesCount: 0
  },



  /******************* */
  onShow: function () {
    // this.getStatus(this.data.devices);
    this.getBorrowedDeviceCount(app.globalData.openid);
    this.getMyDevicesCount(app.globalData.openid);
    this.getDevices();

  },
  onLoad: function () {
    wx.setNavigationBarTitle({
      title: '机可借',
    })


    this.getModels();
    this.syncBrands();

    

  },

  onReady: function () {
    //获取我的设备数量
    this.getMyDevicesCount(app.globalData.openid);
    this.getBorrowedDeviceCount(app.globalData.openid);

  },

  searchContent: function (content) {
    if (content == "") {
      this.getDevices();
      return;
    }
    var devices = [];
    this.data.allDevices.forEach(function (item, index) {
      if (item.deviceModel.toUpperCase().indexOf(content.toUpperCase()) != -1 ||
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
      url: '../myDevices/myDevices?openid=' + app.globalData.openid,
    })
  },
  bindBorrowedDevices: function (e) {
    //跳转
    wx.navigateTo({
      url: '../borrowedDevices/borrowedDevices?openid=' + app.globalData.openid,
    })
  },

  bindBorrowed: function (e) {


    var item = e.currentTarget.dataset.item;
    var index = e.currentTarget.dataset.index;
    var that = this;
    wx.showModal({
      title: '申请借取设备',
      content: item.deviceModel + "（" + item.deviceID + "）",
      cancelText: '稍后',
      confirmText: '申请',
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定');
          that.doBorrowDevice(index, item.deviceID);
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  getMyDevicesCount: function (openid) {
    if (!openid) {
      return;
    }
    var that = this;
    var query = new AV.Query('Devices');
    query.equalTo('ownerID', openid);
    query.count().then(function (count) {
      that.setData({
        myDevicesCount: count,
      })
    }, function (error) {

    });
  },

  getBorrowedDeviceCount: function (openid) {
    if (!openid) {
      return;
    }
    var that = this;
    var borrowedOpenidQuery = new AV.Query('DevicesStatus');
    borrowedOpenidQuery.equalTo("borrowedUserOpenID", openid);

    var statusQuery = new AV.Query('DevicesStatus');
    statusQuery.notEqualTo("status", 0);

    var query = AV.Query.and(borrowedOpenidQuery, statusQuery);

    query.count().then(function (count) {
      that.setData({
        borrowedDevicesCount: count,
      })
    }, function (error) {
      console.log(error);
    });

  },

  addDeviceStatus: function (index, devicdID, status, openid) {
    var that = this;
    var DevicesStatus = AV.Object.extend('DevicesStatus');
    var devicesStatus = new DevicesStatus();
    var timestamp = Date.parse(new Date());
    devicesStatus.set('actionTimestamp', timestamp);//当前操作时间
    devicesStatus.set('status', status);
    devicesStatus.set('deviceID', devicdID);
    devicesStatus.set('borrowedUserOpenID', openid);

    devicesStatus.save().then(function (result) {
      that.getStatus(that.data.devices);
      wx.showToast({
        title: '设备借取申请成功,请等待管理员确认',
        icon: 'none'
      });
      var devices = that.data.devices;
      devices[index].borrowedEmployeeName = app.globalData.employeeInfo.employeeName;
      that.setData({
        devices: devices,
      })
      that.getBorrowedDeviceCount(app.globalData.openid);
    }, function (error) {
      wx.showToast({
        title: '设备借取申请失败！',
        icon: 'none'
      })
    });
    // 设置优先级
  },

  updateDeviceStatus: function (index, objectId, status, openid) {
    var that = this;
    var timestamp = Date.parse(new Date());
    var todo = AV.Object.createWithoutData('DevicesStatus', objectId);
    todo.set('actionTimestamp', timestamp);//当前操作时间
    todo.set('status', status);
    todo.set('borrowedUserOpenID', openid);

    todo.save().then(function (result) {
      that.getStatus(that.data.devices);
      wx.showToast({
        title: '设备借取申请成功,请等待管理员确认',
        icon: 'none'
      })
      var devices = that.data.devices;
      devices[index].borrowedEmployeeName = app.globalData.employeeInfo.employeeName;
      that.setData({
        devices: devices,
      })


      that.getBorrowedDeviceCount(app.globalData.openid);

    }, function (error) {
      wx.showToast({
        title: '设备借取申请失败！',
        icon: 'none'
      })
    });
  },

  doBorrowDevice: function (index, deviceID) {
    var query = new AV.Query('DevicesStatus');
    var that = this;
    query.equalTo('deviceID', deviceID);
    query.first().then(function (result) {
      if (result) {
        var status = result.attributes.status;
        if (status == -2) {
          wx.showToast({
            title: '借取失败，该设备已被借出!',
            icon: "none",
          })
        } else if (status == -1) {
          wx.showToast({
            title: '借取失败，该设备已被别人申请',
            icon: "none",
          })
        } else {
          //可以借取
          that.updateDeviceStatus(index, result.id, -1, app.globalData.openid);
        }
      } else {
        //添加
        that.addDeviceStatus(index, deviceID, -1, app.globalData.openid);
      }
    }, function (error) {

    });
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
      devices: devices,
      allDevices: devices,
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
        allDevices: devices,
        devices: devices,
      })

    }, function (error) {
      console.log(error);
    });

  },


  getUsers: function (devices) {
    var that = this;
    devices.forEach(function (item, index) {
      var queryUser = new AV.Query('Users');
      queryUser.equalTo("openID", item.ownerID);
      queryUser.first().then(function (result) {
        item.employeeID = result.attributes.employeeID;
        item.employeeName = result.attributes.employeeName;
        that.setData({
          allDevices: devices,
          devices: devices,
        })
      }, function (error) {
        console.log(error);
      });
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
        // devices.sort(function(a,b){
        //   var statusA = a.status ? a.status : 0;
        //   var statusB = b.status ? b.status : 0;
        //   return statusB - statusA;
        // })
        that.setData({
          allDevices: devices,
          devices: devices,
        })
      }, function (error) {
        console.log(error);
      });
    });
  },


  getDevices: function () {
    var that = this;
    var query = new AV.Query('Devices');
    query.descending('createdAt');
    query.find().then(function (results) {

      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
      if (results.length > 0) {
        var devices = [];
        results.forEach(function (item, index) {
          devices.push(item.attributes);
        });
        that.setData({
          showEmptyView: false,
          allDevices: devices,
          devices: devices
        })
        that.getStatus(devices);
        that.getUsers(devices);
        console.log("获取设备列表:", devices);
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
      this.saveUserInfo(e.detail.userInfo);
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



  //保存用户信息
  saveUserInfo: function (userInfo) {
    if (userInfo) {
      var objz = {};
      objz.avatarUrl = userInfo.avatarUrl;
      objz.nickName = userInfo.nickName;
      this.setData({
        userInfo: objz,
      })
      app.globalData.userInfo = objz;
      wx.setStorageSync('userInfo', objz);//存储userInfo
      console.log("保存用户信息:", userInfo);
      console.log('保存app.globalData:', app.globalData);
    }

  },
  onPullDownRefresh: function () {

    wx.showNavigationBarLoading();
    this.onShow();
  },

  //同步品牌
  syncBrands: function () {
    var that = this;
    var query = new AV.Query('Brands');
    query.ascending('brandID');
    query.find().then(function (results) {
      if (results) {

        var brands = {};
        results.forEach(function (item, index) {
          brands[item.attributes.brandID] = item.attributes.brand;
        });

        var obj = {};
        obj.brands = brands;
        obj.expiredDate = Date.parse(new Date()) + 1000 * 60 * 60 * 24; //24小时有效期 

        that.setData({
          brandsInfo: obj
        });
        app.globalData.brandsInfo=obj;
        wx.setStorageSync('BrandsInfo', obj);//缓存
        console.log("从服务器同步设备品牌列表:", obj);
      } else {
        console.log('无法从服务器同步设备品牌列表');
      }

    }, function (error) {
    });
  },

  //同步型号
  getModels: function () {
    var that = this;
    var query = new AV.Query('Models');
    query.ascending('brandID');
    query.limit(200);
    query.find().then(function (results) {
      if (results) {
        var modelDic = {};
        var models = [];
        results.forEach(function (item, index) {
          if (!modelDic[item.attributes.brandID]) {
            modelDic[item.attributes.brandID] = [];
          }
          modelDic[item.attributes.brandID].push(item.attributes.model);
        });
        var obj = {};
        obj.models = modelDic;
        obj.expiredDate = Date.parse(new Date()) + 1000 * 60 * 60 * 24; //24小时有效期 
        that.setData({
          modelsInfo:obj,
        })
        app.globalData.modelsInfo = obj;
        wx.setStorageSync('ModelsInfo', obj);//缓存
        console.log("从服务器同步设备型号列表:", obj);
      } else {
        console.log('无法从服务器同步设备型号列表');
      }

    }, function (error) {
    });
  },


})
