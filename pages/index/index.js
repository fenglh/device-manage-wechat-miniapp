//index.js
const AV = require('../../utils/av-live-query-weapp-min');
const leanCloudManager = require('../../utils/leanCloudManager');


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

    var that = this;

    leanCloudManager.getMyDevicesCount({
      success:function(count){
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
        that.setData({
          myDevicesCount: count,
        })
      },
    });
    leanCloudManager.getBorrowedDeviceCount({
      success: function (count) {
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
        that.setData({
          borrowedDevicesCount: count,
        })
      },
    });

    leanCloudManager.getDevices({
      success:function(devices){
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
        var show = false;
        if(devices.length <= 0){
          show = true;
        }
        that.setData({
          showEmptyView: show,
          allDevices: devices,
          devices: devices
        })
      },
      fail:function(error){
        wx.showToast({
          title: '获取设备列表失败',
          icon: 'none',
        });
      }
    });

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
    var that = this;
    if (content == "") {
      this.setData({
        devices: that.data.allDevices,
      });
      return;
    }
    var devices = [];
    this.data.allDevices.forEach(function (item, index) {
      if (item.model.toUpperCase().indexOf(content.toUpperCase()) != -1 ||
        item.OSVersion.indexOf(content) != -1 ||
        item.employeeName.indexOf(content) != -1 ||
        (item.remark && item.remark.indexOf(content) != -1) ||
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


  //ok
  doBorrowDevice: function (index) {

    var device = this.data.devices[index];
    var query = new AV.Query('Devices');
    query.include(['dependentDevicesStatus']);
    var that = this;
    wx.showLoading({
      title: '',
      mask:true,
    });
    query.equalTo('deviceID', device.deviceID);
    query.first().then(function (result) {
        if(result){
          //设备被借用了
          var dependentDevicesStatus = result.get('dependentDevicesStatus');
          if (dependentDevicesStatus){
            var status = dependentDevicesStatus.get('status');
            if (status && status!= 0) {
              wx.showToast({
                title: '借用失败，该设备已被借出!',
                icon: "none",
              })
              return;
            }
          }
          var device = that.data.devices[index];
          console.log(device);
          //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
          leanCloudManager.addDevicesStatus(device.deviceObjectID, -1, "applying", {
            success:function(){
              wx.showToast({
                title: '申请借用成功!',
              });

              leanCloudManager.getDevices({
                success: function (devices) {
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
              
              leanCloudManager.getBorrowedDeviceCount({
                success: function (count) {
                  that.setData({
                    borrowedDevicesCount: count,
                  })
                },
              });
            },
            fail:function(){
              wx.showToast({
                title: '申请借用失败，请稍后再试',
                icon: 'none'
              });
            }
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
    });
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

  bindMore: function () {
    wx.navigateTo({
      url: '../menu/menu',
    })

  },

  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    this.onShow();
  },
})
