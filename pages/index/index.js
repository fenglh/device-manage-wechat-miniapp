//index.js
const AV = require('../../utils/av-live-query-weapp-min');

//获取应用实例
const app = getApp()

const now = Date.parse(new Date());//当前时间
Page({
  data: {

    showModalStatus: false,
    userInfo: wx.getStorageSync('userInfo') || {},
    openIdInfo: wx.getStorageSync('openIdInfo') || {},
    employeeInfo: wx.getStorageSync('employeeInfo') || {},
    devices: [],
    users: {},
    status: {},
    brands: wx.getStorageSync('brandsInfo') || {},
    hiddens: {},
  },



  /******************* */
  onLoad: function () {
    this.getDevices();
  },

  bindMyDevices: function (e) {
    //跳转
    wx.navigateTo({
      url: '../myDevices/myDevices?openid=' + this.data.openIdInfo.openid,
    })
  },
  bindBorrowedDevices: function (e) {
    //跳转
    wx.navigateTo({
      url: '../borrowedDevices/borrowedDevices',
    })
  },

  bindBorrowed: function (e) {

    var item = e.currentTarget.dataset.item;
    var that = this;
    wx.showModal({
      title: '申请借取设备',
      content: item.deviceModel + "（" + item.deviceID + "）",
      cancelText: '稍后',
      confirmText: '申请',
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

  addDeviceStatus: function (devicdID, status) {
    var that = this;
    var DevicesStatus = AV.Object.extend('DevicesStatus');
    var devicesStatus = new DevicesStatus();
    devicesStatus.set('status', status);
    devicesStatus.set('deviceID', devicdID);
    devicesStatus.save().then(function (result) {
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
    // 设置优先级
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

  doBorrowDevice: function (deviceID) {
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
          that.updateDeviceStatus(result.id, -1);
        }
      } else {
        //添加
        that.addDeviceStatus(deviceID, -1);
      }
    }, function (error) {

    });
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

  getBrands: function () {
    var that = this;
    var query = new AV.Query('Brands');
    query.find().then(function (results) {
      console.log(results);
      var brands = {};
      brands.expiredDate = Date.parse(new Date()) + 1000 * 60 * 60 * 24; //24
      results.forEach(function (item, index) {
        brands[String(item.attributes.brandID)] = item.attributes.brand;
      });
      console.log("获取品牌列表：", brands);
      wx.setStorageSync('brandsInfo', brands);//存储品牌信息
      that.setData({
        brands: brands,
      });
    }, function (error) {

    });
  },

  onReady: function () {


    console.log("获取缓存openid信息：", this.data.openIdInfo);
    console.log("获取缓存userInfo信息：", this.data.userInfo);
    console.log("获取缓存brands信息：", this.data.brands);


    if (!this.data.brands.expiredDate || now - this.data.brands.expiredDate > 0) {
      console.log('更新brands信息');
      this.getBrands();
    }

    var that = this;
    //获取用户信息和openid
    if (!this.data.openIdInfo.openid || !this.data.userInfo.avatarUrl || !this.data.userInfo.nickName) {
      console.log("头像或者昵称不存在");
      wx.login({
        success: function (res) {
          if (res.code) {
            //获取用户信息
            wx.getUserInfo({
              success: function (res) {
                that.saveUserInfo(res.userInfo);
              }, fail(error) {
                console.log("获取用户信息失败，原因:", error.errMsg);
              }
            });
            //获取openid
            if (!that.data.openIdInfo.openid) {
              that.getOpenId(res.code, function (openid) {
                if (openid) {
                  var obj = {};
                  obj.openid = openid;
                  obj.expiredDate = now + 1000 * 60 * 60 * 24; //24
                  wx.setStorageSync('openIdInfo', obj);//存储openid
                  that.setData({
                    openIdInfo: obj,
                  })
                  //获取绑定的员工信息
                  that.getBindEmployeeInfo(obj.openid);
                }
              });
            } else {
              //获取绑定的员工信息
              that.getBindEmployeeInfo(that.data.openIdInfo.openid);
            }

          } else {
            that.showToast('获取登录用户身份标识失败');
          }
        }
      });
    } else {
      //获取绑定的员工信息
      that.getBindEmployeeInfo(that.data.openIdInfo.openid);
    }

  },



  getUsers: function (devices) {
    var users = {};
    var that = this;
    devices.forEach(function (item, index) {
      var queryUser = new AV.Query('Users');
      queryUser.equalTo("openID", item.ownerID);
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
        var obj = {};
        obj.status = result.attributes.status;
        status[result.attributes.deviceID] = obj;
        that.setData({
          status: status,
        })
      }, function (error) {
        console.log(error);
      });
    });
  },


  getDevices: function () {
    var that = this;
    var query = new AV.Query('Devices');
    query.descending('updatedAt');
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
        that.getUsers(devices);
        console.log("获取设备列表:", devices);

      } else {
        console.log('无法从服务器同步设备系统版本列表');
      }

    }, function (error) {
    });
  },


  getOpenId: function (code, callback = ((string) => (Void))) {
    //获取openid
    var data = app.globalData;//这里存储了appid、secret、token串  
    var url = 'https://api.weixin.qq.com/sns/jscode2session';
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
        callback(res.data.openid);
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



  getBindEmployeeInfo: function (openid) {
    //在获取了openid的情况下，检查绑定关系
    if (!openid) {
      console.log('openid还没有获取到');
      return;
    }

    if (!this.data.employeeInfo.employeeID || !this.data.employeeInfo.employeeName || (now - this.data.employeeInfo.expiredDate > 0)) {
      var that = this;
      var query = new AV.Query('Users');
      query.equalTo('openID', openid);
      query.first().then(function (result) {
        if (!result) {
          console.log("还没有绑定员工信息")
          that.setData({
            showModalStatus: true
          })
        } else {
          console.log("已有绑定员工信息")
          var employeeInfo = {};
          employeeInfo.employeeID = result.attributes["employeeID"];
          employeeInfo.employeeName = result.attributes["employeeName"];
          employeeInfo.expiredDate = Date.parse(new Date()) + 1000 * 60 * 60 * 24; //24小时有效期 
          wx.setStorageSync('employeeInfo', employeeInfo);//存储员工信息
          console.log("从服务器获取绑定的员工信息:", employeeInfo);
        }
      }, function (error) {
      })
    } else {
      console.log('从缓存中获取到绑定员工信息:', this.data.employeeInfo);
    }




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
  bindSearchEvent: function () {
    wx.navigateTo({
      url: '../search/search',
    })
  },
  bindMoreEvent: function () {
    wx.navigateTo({
      url: '../menu/menu',
    })
  },

  bindEmployee: function (e) {


    var employeeInfo = {};
    employeeInfo.employeeID = e.detail.employeeID;
    employeeInfo.employeeName = e.detail.employeeName;
    wx.setStorageSync('employeeInfo', employeeInfo);//存储员工信息
    console.log("更新绑定结果:", employeeInfo);

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



})
