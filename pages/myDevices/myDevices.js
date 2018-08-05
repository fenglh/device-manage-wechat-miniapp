// pages/myDevices/myDevices.js

const AV = require('../../utils/av-live-query-weapp-min');
const now = Date.parse(new Date());//当前时间
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showEmptyView: false,
    devices: [],
    slideStyle: '',
    startX: 0,
    slideMenuWidth: 150,

  },

  /**
   * 生命周期函数--监听页面加载
   */

  onShow: function () {
    this.getMyDevices();
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '我的设备',
    })

  },

  //ok
  bindAddDevice: function (e) {
    wx.navigateTo({
      url: '../device/device',
    })
  },

  // ok
  bindTapExpand: function (e) {
    //是否从在侧滑状态下点击
    var now = Date.parse(new Date());//当前时间 毫秒
    var tapIndex = e.currentTarget.dataset.index;
    var devices = this.data.devices;
    var device = devices[tapIndex];
    if (!device.isExpand) {
      device.isExpand = true;
    } else {
      device.isExpand = !device.isExpand;
    }
    this.setData({
      devices: devices
    });

  },


  confirmReturn: function (index) {
    var that = this;
    var query = new AV.Query('DevicesStatus');
    query.equalTo('deviceID', this.data.devices[index].deviceID);
    query.equalTo('borrowedUserOpenID', this.data.devices[index].borrowedUserOpenID);
    query.equalTo('status', -3);
    query.first().then(function (status) {
      var todo = AV.Object.createWithoutData('DevicesStatus', status.id);
      // 修改属性
      todo.set('status', 0);//归还中
      todo.set('borrowedUserOpenID', "");
      // 保存到云端
      todo.save().then(function (result) {
        wx.showToast({
          title: '确认归还成功',
          icon: 'success',
        });
        that.getMyDevices();
      }, function (error) {
        console.log(error);
      });
    }, function (error) {

    });
  },

  bindConfirmReturn: function (e) {
    var index = e.currentTarget.dataset.index;
    var that = this;
    wx.showModal({
      title: '确认归还',
      content: '你确定已归还 ' + that.data.devices[index].deviceModel + " ?",
      success: function (res) {
        if (res.confirm) {
          that.confirmReturn(index);
        }
      }
    })
  },

  // ok
  bindPass: function (e) {
    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    var that = this;
    var borrowedEmployeeID = device.borrowedEmployeeID;
    var statusActionEmployeeObjectName = device.statusActionEmployeeObjectName;
    var deviceModel = device.model;
    wx.showModal({
      title: deviceModel + '借用申请',
      content: "“" + statusActionEmployeeObjectName + "”" + "向你申请借用设备",
      cancelText: '稍后',
      confirmText: '同意',
      success: function (res) {
        if (res.confirm) {
          that.agreeBorrowed(index);
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  // ok
  agreeBorrowed:function(index){
      var device = this.data.devices[index];
      var deviceObject = AV.Object.createWithoutData('Devices', device.deviceObjectID);
      var timestamp = Date.parse(new Date());
      var devicesStatus = new AV.Object('DevicesStatus');
      devicesStatus.set('status', -2); //0闲置，-1 申请中，-2借出，-3归还中 
      devicesStatus.set('actionTimestamp', timestamp);//当前操作时间
      //关联借用人
      var dependentUser = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
      devicesStatus.set('dependentUser', dependentUser);//关联用户
      //关联设备
      var dependentDevice = AV.Object.createWithoutData('Device', device.deviceObjectID);
      devicesStatus.set('dependentDevice', dependentDevice);//关联设备
      //关联状态
      deviceObject.set('dependentDevicesStatus', devicesStatus);
      deviceObject.save().then(function (result) {
        wx.showToast({
          title: '通过申请成功!',
        })
      }, function (error) {
        wx.showToast({
          title: '通过申请失败',
          icon: 'none'
        });
      });
  },

  bindDelete:function(e){
    var index = e.currentTarget.dataset.index;
    var that = this;
    var device = this.data.devices[index];
    var that = this 
    wx.showActionSheet({
      itemList: ['删除'],
      success: function (res) {
        if(res.tapIndex == 0){
          wx.showLoading({
            title: '',
            mask:true,
          })
          that.deleDevice(device.deviceID, that.data.openid);
        };
      },
      fail: function (res) {
        that.closeSlide(index);
      }
    })
  },

  bindEdit:function(e){
    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    this.closeSlide(index);
    wx.navigateTo({
      url: '../device/device?' + "deviceID=" + device.deviceID + "&companyCode=" + device.companyCode + "&brandID=" + device.brandID + "&model=" + device.deviceModel + "&OSVersion=" + device.OSVersion + "&isEdit=true",
    })
  },


  //ok
  closeSlide:function(index){
    var devices = this.data.devices;
    var slideStyle = "left:0px";
    devices[index].isSlideMenuOpen = false;
    devices[index].slideStyle = slideStyle;
    //更新列表的状态
    this.setData({
      devices: devices
    });

    
  },


  deleDevice:function(deviceID, youOpenId) {
    var DevicesObject = AV.Object.extend('Devices');
    var that = this;
    var query = new AV.Query(DevicesObject);
    query.equalTo('deviceID', deviceID);
    query.equalTo('ownerID', youOpenId);
    query.first().then(function (result) {
      var device = AV.Object.createWithoutData('Devices', result.id);
      device.destroy().then(function (success) {
        //删除状态
        var DevicesStatus = AV.Object.extend('DevicesStatus');
        var query = new AV.Query(DevicesStatus);
        query.equalTo('deviceID', deviceID);
        query.equalTo('borrowedUserOpenID', youOpenId);
        query.first().then(function (result) {
          var status = AV.Object.createWithoutData('DevicesStatus', result.id);
          status.destroy().then(function (success) {
            that.getMyDevices();
            wx.hideLoading();
            wx.showToast({
              title: '删除成功',
              icon: "success",
            })
            
          }, function (error) {
            // 删除失败
            wx.hideLoading();
            wx.showToast({
              title: '删除失败',
              icon: "none",
            })
          });
        }, function(error){
          console.log('设备不存在状态记录，无需删除状态记录')
          that.getMyDevices();
          wx.hideLoading();
          wx.showToast({
            title: '删除成功',
            icon: "success",
          })
          
        });

      }, function (error) {
        wx.hideLoading();
        // 删除失败
        wx.showToast({
          title: '删除失败',
          icon: "none",
        })
      });

    }, function(error){
      wx.hideLoading();
        wx.showToast({
          title: '设备不存在',
          icon:"none",
        })
    });

  },



  //ok
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
  getMyDevices: function () {
    var that = this;

    var user = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    var query = new AV.Query('Devices');
    query.equalTo('dependentUser', user);
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
          var modelObjectID = item.get('dependentModel') ? item.get('dependentModel').id : null;
          var model = item.get('dependentModel') ? item.get('dependentModel').get('model') : null;
          //品牌
          var brand = item.get('dependentModel') ? (item.get('dependentModel').get('dependent') ? item.get('dependentModel').get('dependent').get('brand') : null) : null;
          //状态
          var status = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').get('status') : null;
          var statusObjectID = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').id : null;

          var statusObjectID = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').id : null;
          var statusActionTimestamp = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').get('actionTimestamp') : null;

          var statusActionEmployeeObjectID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentUser') ? item.get('dependentDevicesStatus').get('dependentUser').id : null) : null;
          var statusActionEmployeeID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentUser') ? item.get('dependentDevicesStatus').get('dependentUser').get('employeeID') : null) : null;
          var statusActionEmployeeObjectName = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentUser') ? item.get('dependentDevicesStatus').get('dependentUser').get('employeeName') : null) : null;

          //用户信息
          var employeeObjectID = item.get('dependentUser') ? item.get('dependentUser').id : null;
          var employeeID = item.get('dependentUser') ? item.get('dependentUser').get('employeeID') : null;
          var employeeName = item.get('dependentUser') ? item.get('dependentUser').get('employeeName') : null;
          var employeeOpenID = item.get('dependentUser') ? item.get('dependentUser').get('openID') : null;
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
        icon: 'none',
      })
    });

  },




  //手指刚放到屏幕触发
  touchS: function (e) {
    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    //判断是否只有一个触摸点
    if (e.touches.length == 1) {
      this.setData({
        //记录触摸起始位置的X坐标
        startX: e.touches[0].clientX
      });
    }
  },

  //触摸时触发，手指在屏幕上每移动一次，触发一次
  touchM: function (e) {

    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    if (device.isExpand) {
      return;
    }
    var that = this
    if (e.touches.length == 1) {
      //记录触摸点位置的X坐标
      var moveX = e.touches[0].clientX;
      //计算手指起始点的X坐标与当前触摸点的X坐标的差值
      var disX = that.data.startX - moveX;
      //delBtnWidth 为右侧按钮区域的宽度
      var slideMenuWidth = that.data.slideMenuWidth;
      var slideStyle = "";
      if (disX == 0 || disX < 0) {//如果移动距离小于等于0，文本层位置不变
        slideStyle = "left:0px";
      } else if (disX > 0) {//移动距离大于0，文本层left值等于手指移动距离
        slideStyle = "left:-" + disX + "px";
        if (disX >= slideMenuWidth) {
          //控制手指移动距离最大值为删除按钮的宽度
          slideStyle = "left:-" + slideMenuWidth + "px";
        }
      }
      //获取手指触摸的是哪一个item
      var index = e.currentTarget.dataset.index;
      var devices = that.data.devices;
      //将拼接好的样式设置到当前item中
      devices[index].slideStyle = slideStyle;
      //更新列表的状态
      this.setData({
        devices: devices
      });
    }
  },

  touchE: function (e) {

    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    var that = this
    if (e.changedTouches.length == 1) {

      //获取手指触摸的是哪一项
      var index = e.currentTarget.dataset.index;
      var devices = that.data.devices;
      //手指移动结束后触摸点位置的X坐标
      var endX = e.changedTouches[0].clientX;
      //触摸开始与结束，手指移动的距离
      var disX = that.data.startX - endX;
      var slideMenuWidth = that.data.slideMenuWidth;
      //如果距离小于删除按钮的1/2，不显示删除按钮
      var slideStyle = '';
      if (!devices[index].isSlideMenuOpen && disX == 0) {
        this.bindTapExpand(e)
      } else {
        if (!device.isExpand) {
          if (disX > slideMenuWidth / 2) {
            slideStyle = "left:-" + slideMenuWidth + "px";
            devices[index].isSlideMenuOpen = true;
            console.log('侧滑打开');
          } else {
            slideStyle = "left:0px";
            devices[index].isSlideMenuOpen = false;
            console.log('侧滑关闭');
          }
          devices[index].slideStyle = slideStyle;
          //更新列表的状态
          that.setData({
            devices: devices
          });
        }

      }


    }
  }
})