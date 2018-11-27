//index.js


//获取应用实例
const app = getApp()

const AV = require('../../utils/av-live-query-weapp-min');
const leanCloudManager = require('../../utils/leanCloudManager');



const now = Date.parse(new Date());//当前时间
Page({
  data: {
    wxUserInfo:null,
    showEmptyView: false,
    devices: [],
    allDevices: [],//搜索专用的所有设备
    myDevicesCount: 0,
    borrowedDevicesCount: 0,
    isBind:false,
    showBindDialog:false,
    openid:null,//传递给bindDialog
    employeeInfo:null,//传递给bindDialog
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },



  /******************* */
  onShow: function () {


    if(this.data.isBind){
      this.getBorrowedDeviceCount();
      this.getMyDevicesCount();
    }
    this.getDevices();

  },

  onLoad: function () {
    wx.setNavigationBarTitle({
      title: '机可借',
    })

    this.setData({
      openid:app.globalData.openid,
      wxUserInfo: app.globalData.wxUserInfo,
    })

    //异步请求回来的
    if(this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = userInfo => {
        console.log('userInfoReadyCallback');
        this.setData({
          wxUserInfo: userInfo,
        })
        //检查绑定
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          this.setData({
            wxUserInfo: res.userInfo,
          })
        }
      })
    }


    app.openidReadyCallback = openid => {
      //因网络请求是异步，如果网络延迟，index page都加载完，回调才回来那么,重新检查一遍
      this.setData({
        openid:openid
      })
      if(!this.data.isBind){
        this.checkEmployeeBindInfo(this.data.openid);
      }
    }
    //检查绑定关系
    this.checkEmployeeBindInfo(this.data.openid);

  },


  //检查绑定关系
  checkEmployeeBindInfo:function(openid){
    var that = this;
    if(!openid){
      console.log('openid为空');
      return;
    }

    leanCloudManager.checkBindEmployeeInfo({
      openid: openid,
      success: function (res) {

        if (res) {
          console.log('已经绑定:', openid);
          var employeeObjectID  = res.id;
          var employeeID = res.attributes.employeeID;
          var employeeMobile = res.attributes.employeeMobile;
          var employeeName = res.attributes.employeeName;
          var employeeInfo = {};
          employeeInfo.employeeObjectID = employeeObjectID;
          employeeInfo.employeeID = employeeID;
          employeeInfo.employeeMobile = employeeMobile;
          employeeInfo.employeeName = employeeName;
          console.log("employeeInfo:", employeeInfo);
          that.setData({
            isBind: true,
            showBindDialog: false,
            employeeInfo: employeeInfo
          });
          that.getBorrowedDeviceCount();
          that.getMyDevicesCount();
        } else {
          that.setData({
            isBind: false,
            showBindDialog: true,
          })
        }
      },
      fail: function (error) {
        wx.showToast({
          title: '接口请求失败：检查是否绑定员工信息！',
          icon: 'none'
        })
      }
    })
  },

  cleanBindInfo: function () {
    console.log('清除绑定关系');
    this.setData({
      isBind: false,
      employeeInfo: null,
    })
  },

  //dialog 回调

  onSuccessEvent:function(e){
    console.log('员工绑定成功:',e.detail);
    this.setData({
      isBind:true,
      employeeInfo: e.detail,
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

    if (!this.data.isBind) {
      this.setData({
        showBindDialog: true
      });
      return;
    }
      //跳转
      wx.navigateTo({
        url: '../myDevices/myDevices?employeeObjectID=' + this.data.employeeInfo.employeeObjectID,
      })
    


  },
  // ok
  bindBorrowedDevices: function (e) {
    if (!this.data.isBind) {
      this.setData({
        showBindDialog: true
      });
      return;
    }
          //跳转
    wx.navigateTo({
      url: '../borrowedDevices/borrowedDevices?employeeObjectID=' + this.data.employeeInfo.employeeObjectID
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

    var that = this;
    
    var query = new AV.Query('Devices');
    query.include(['dependentUser']);
    query.include(['dependentModel']);
    query.include(['dependentDevicesStatus.dependentActionUser']);
    query.equalTo('deviceID', deviceID);
    wx.showLoading({
      title: '',
      mask: true,
    });
    query.first().then(function (result) {

        if(result){
          wx.hideLoading();
          console.log('借取设备查询：',result);
          var deviceEmployeeObjectID = result.attributes.dependentUser.id; 
          var model = result.attributes.dependentModel.attributes.model;
          
          
          var dependentDevicesStatus = result.attributes.dependentDevicesStatus;
          var dependentActionUser = dependentDevicesStatus ? dependentDevicesStatus.attributes.dependentActionUser :null;
          var curBorrowedUserObjectID = dependentActionUser ? dependentActionUser.id : null;


          //当前借用人objectID
          if (!dependentDevicesStatus || !curBorrowedUserObjectID) {//没有设备状态,或者没有借用人
            if (deviceEmployeeObjectID == that.data.employeeInfo.employeeObjectID) { //归属者是自己，
              wx.showModal({
                title: "收回设备",
                content: model + '设备已处于闲置状态，无需进行收回',
                showCancel: false,
              })
            }else{//归属者不是自己
              //进行借用
                // var that = this;
                wx.showModal({
                  title: '借用设备',
                  content: "你确定要借用设备 " + model + "?",
                  cancelText: '稍后',
                  confirmText: '确定',
                  success: function (res) {
                    if (res.confirm) {
                      //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
                      leanCloudManager.addDoDevicesStatus(that.data.employeeInfo.employeeObjectID, result.id, that.data.employeeInfo.employeeObjectID, -2, 'borrowed', {
                        success: function () {
                          wx.showToast({
                            title: "借用成功!",
                          });

                          that.getDevices();
                          that.getBorrowedDeviceCount();
                        },
                        fail: function (error) {
                          wx.showToast({
                            title: "借用失败,请稍后再试!",
                            icon: 'none'
                          });
                          console.log(error);
                        }
                      });
                    }
                  }
                })


            }
          }else{ //有借用人
            if (curBorrowedUserObjectID == that.data.employeeInfo.employeeObjectID) {//借用人是自己
              if (deviceEmployeeObjectID == that.data.employeeInfo.employeeObjectID) { //归属者是自己，（即可自己已经进行回收过了）
                wx.showModal({
                  title: '收回设备',
                  content: model + '已处于闲置状态，无需进行收回',
                  showCancel: false,
                })
              }else{
                wx.showModal({
                  title: "借用设备",
                  content: model + '已被您借用，无需重复借用',
                  showCancel: false,
                })
              }
            }else {//借用人不是自己
              if (deviceEmployeeObjectID == that.data.employeeInfo.employeeObjectID) { //归属者是自己，即自己收回已借出(借用人不是自己)的设备
                //进行收回

                wx.showModal({
                  title: '收回设备',
                  content: "你确定收回设备 " + model + "?",
                  cancelText: '稍后',
                  confirmText: '确定',
                  success: function (res) {
                    if (res.confirm) {
                      //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
                      leanCloudManager.addDoDevicesStatus(that.data.employeeInfo.employeeObjectID, result.id, null, 0, 'returned', {
                        success: function () {
                          wx.showToast({
                            title: "收回成功!",
                          });

                          that.getDevices();
                          that.getBorrowedDeviceCount();
                        },
                        fail: function (error) {
                          wx.showToast({
                            title: "收回失败,请稍后再试!",
                            icon: 'none'
                          });
                          console.log(error);
                        }
                      });
                    }
                  }
                })
              }else{
                //进行借用
                wx.showModal({
                  title: '借用设备',
                  content: "你确定要借用设备 " + model + "?",
                  cancelText: '稍后',
                  confirmText: '确定',
                  success: function (res) {
                    if (res.confirm) {
                      //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
                      leanCloudManager.addDoDevicesStatus(that.data.employeeInfo.employeeObjectID, result.id, that.data.employeeInfo.employeeObjectID, -2, 'borrowed', {
                        success: function () {
                          wx.showToast({
                            title: "借用成功!",
                          });

                          that.getDevices();
                          that.getBorrowedDeviceCount();
                        },
                        fail: function (error) {
                          wx.showToast({
                            title: "借用失败,请稍后再试!",
                            icon: 'none'
                          });
                          console.log(error);
                        }
                      });
                    }
                  }
                })
              }
            }
          }
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
      employeeObjectID: that.data.employeeInfo.employeeObjectID,
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
      employeeObjectID: that.data.employeeInfo.employeeObjectID,
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
    if (!this.data.isBind) {
      this.setData({
        showBindDialog: true
      });
      return;
    }

    var that = this;
    var show;
    wx.scanCode({
      success: (res) => {
        console.log("res.result:",res.result);

 
        var param = JSON.parse(res.result.trim());
        console.log("param:", param);
        var brand = param["brand"];
        var companyCode = param["companyCode"];
        var deviceID = param["deviceID"];
        var model = param["model"];
        var OSVersion = param["OSVersion"];
        var remark = param["remark"];
        that.doBorrowDevice(deviceID);
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

      app.globalData.wxUserInfo = e.detail.userInfo;
      this.setData({
        wxUserInfo: e.detail.userInfo,
      })

      //跳转
      var url = '../user/user?isBind=' + this.data.isBind +
        "&openid=" + this.data.openid +
        "&wxNickName=" + this.data.wxUserInfo.nickName;
      if(this.data.isBind){
        var url = '../user/user?isBind=' + this.data.isBind +
          "&openid=" + this.data.openid +
          "&employeeID=" + this.data.employeeInfo.employeeID +
          "&employeeMobile=" + this.data.employeeInfo.employeeMobile +
          "&employeeName=" + this.data.employeeInfo.employeeName +
          "&wxNickName=" + this.data.wxUserInfo.nickName;
      }

      wx.navigateTo({
        url: url,
      })
    }

  },



  bindMore: function () {
    if (!this.data.isBind) {
      this.setData({
        showBindDialog: true
      });
      return;
    }
    
    wx.navigateTo({
      url: '../menu/menu?employeeObjectID=' + this.data.employeeInfo.employeeObjectID,
    })

  },

  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    this.onShow();
  },
})
