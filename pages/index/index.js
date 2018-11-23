//index.js


//获取应用实例
const app = getApp()

const AV = require('../../utils/av-live-query-weapp-min');
const leanCloudManager = require('../../utils/leanCloudManager');



const now = Date.parse(new Date());//当前时间
Page({
  data: {
    showEmptyView: false,
    userInfo: {},
    devices: [],
    allDevices: [],//搜索专用的所有设备
    myDevicesCount: 0,
    borrowedDevicesCount: 0,
    showBindDialog:false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },



  /******************* */
  onShow: function () {


    if(app.globalData.bind){
      this.getBorrowedDeviceCount();
      this.getMyDevicesCount();
    }
    this.getDevices();

  },

  onLoad: function () {
    wx.setNavigationBarTitle({
      title: '机可借',
    })

    if (!app.globalData.bind) {
      this.setData({
        showBindDialog: true
      })
    }

    
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
        //检查绑定
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
    var that = this;
    if (content == "") {
      this.setData({
        devices: that.data.allDevices,
      });
      return;
    }
    content = content.toUpperCase()
    var devices = [];
    this.data.allDevices.forEach(function (item, index) {
      var model = item.model && item.model.toUpperCase();
      var OSVersion = item.OSVersion && item.OSVersion.toUpperCase();
      var employeeName = item.employeeName && item.employeeName.toUpperCase();
      var remark = item.remark && item.remark.toUpperCase();
      var deviceID = item.deviceID && item.deviceID.toUpperCase();
      console.log(model, OSVersion, remark, deviceID);

      if ((model && model.indexOf(content) != -1) ||
        (OSVersion && OSVersion.indexOf(content) != -1) ||
        (employeeName && employeeName.indexOf(content) != -1) ||
        (remark && remark.indexOf(content) != -1) ||
        (deviceID && deviceID.indexOf(content) != -1)) {
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

    if (!app.globalData.bind) {
      this.setData({
        showBindDialog: true
      });
      return;
    }
      //跳转
      wx.navigateTo({
        url: '../myDevices/myDevices',
      })
    


  },
  // ok
  bindBorrowedDevices: function (e) {
    if (!app.globalData.bind) {
      this.setData({
        showBindDialog: true
      });
      return;
    }
          //跳转
    wx.navigateTo({
      url: '../borrowedDevices/borrowedDevices',
    })
    

  },
  // ok
  bindBorrowed: function (e) {
    // var index = e.currentTarget.dataset.index;
    // var device = this.data.devices[index];
    // var that = this;
    // wx.showModal({
    //   title: '申请借用设备',
    //   content: "你确定要申请设备 " + device.model + "?" ,
    //   cancelText: '稍后',
    //   confirmText: '申请',
    //   success: function (res) {
    //     if (res.confirm) {
    //       that.doBorrowDevice(index);
    //     }
    //   }
    // })
  },


  //ok
  doBorrowDevice: function (deviceID) {


    var query = new AV.Query('Devices');
    query.include(['dependentUser']);
    query.include(['dependentModel']);
    var that = this;
    query.equalTo('deviceID', deviceID);
    wx.showLoading({
      title: '',
      mask: true,
    });
    query.first().then(function (result) {
        if(result){
          wx.hideLoading();
          console.log(result);
          var deviceEmployeeObjectID = result.attributes.dependentUser.id; 
          var model = result.attributes.dependentModel.attributes.model;
          var prefix = "";
          var status = 0;
          var action = ""

          if (deviceEmployeeObjectID == app.globalData.employeeInfo.employeeObjectID) {
            //收回设备
            prefix = "收回"
            status = 0
            action = "returned"
          } else {
            //借出设备
            titleSuccess = "借用";
            status = -2
            action = "borrowed"
          }



          var that = this;
          wx.showModal({
            title: prefix+'设备',
            content: "你确定要"+prefix+"设备 " + model + "?",
            cancelText: '稍后',
            confirmText: prefix,
            success: function (res) {
              if (res.confirm) {
                //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
                leanCloudManager.addDoDevicesStatus(result.id, app.globalData.employeeInfo.employeeObjectID, status, action, {
                  success: function () {
                    wx.showToast({
                      title: prefix+"成功!",
                    });

                    that.getDevices();
                    that.getBorrowedDeviceCount();
                  },
                  fail: function (error) {
                    wx.showToast({
                      title: prefix+"失败,请稍后再试!",
                      icon: 'none'
                    });
                    console.log(error);
                  }
                });
              }
            }
          })
 
        }else{
          wx.showToast({
            title: '设备不存在',
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
    });
  },

  getBorrowedDeviceCount:function(){
    var that = this;
    leanCloudManager.getBorrowedDeviceCount({
      success: function (count) {
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
        that.setData({
          borrowedDevicesCount: count,
        })
      },
    });
  },
  getMyDevicesCount:function(){
    var that = this;
    leanCloudManager.getMyDevicesCount({
      success: function (count) {
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
        that.setData({
          myDevicesCount: count,
        })
      },
    });
  },
  getDevices:function(){
    var that = this;
    leanCloudManager.getDevices({
      success: function (devices) {
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
        var show = false;
        if (devices.length <= 0) {
          show = true;
        }
        that.setData({
          showEmptyView: show,
          allDevices: devices,
          devices: devices
        })
      },
      fail: function (error) {
        wx.showToast({
          title: '获取设备列表失败',
          icon: 'none',
        });
      }
    });
  },


  //事件
  scanClick:function(e) {
    if (!app.globalData.bind) {
      this.setData({
        showBindDialog: true
      });
      return;
    }

    var that = this;
    var show;
    wx.scanCode({
      success: (res) => {

        var param = JSON.parse(res.result)
        console.log(param);
        var brand = param["brand"];
        var companyCode = param["companyCode"];
        var deviceCode = param["deviceCode"];
        var model = param["model"];
        var OSVersion = param["OSVersion"];
        var remark = param["remark"];
        that.doBorrowDevice(deviceCode);
      },
      fail: (res) => {
        wx.showToast({
          title: '失败',
          icon: 'success',
          duration: 2000
        })
      },
      complete: (res) => {
      }
    })
  },

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

  bindMore: function () {
    if (!app.globalData.bind) {
      this.setData({
        showBindDialog: true
      });
      return;
    }
    
    wx.navigateTo({
      url: '../menu/menu',
    })

  },

  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    this.onShow();
  },
})
