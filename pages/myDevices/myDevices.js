// pages/myDevices/myDevices.js

const AV = require('../../utils/av-live-query-weapp-min');
const now = Date.parse(new Date());//当前时间
Page({

  /**
   * 页面的初始数据
   */
  data: {
    devices: [],
    brands: {},
    openid: null,
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

    var brands = wx.getStorageSync('brandsInfo');
    this.setData({
      openid: options.openid,
      brands: brands,
    })

  },





  bindAddDevice: function (e) {
    wx.navigateTo({
      url: '../device/device',
    })
  },

  bindTapExpand: function (e) {

    //是否从在侧滑状态下点击
    var now = Date.parse(new Date());//当前时间 毫秒
    // if (now - this.data.touchEndTime  < 100){
    //   console.log('侧滑状态下点击');
    //   return;
    // }

    var tapIndex = e.currentTarget.dataset.index;
    var devices = this.data.devices;

    if (!devices[tapIndex].borrowedEmployeeID && devices[tapIndex].borrowedUserOpenID) {
      console.log('获取借用人信息');
      this.getBorrowUserInfo(tapIndex)
    }

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
        devices: devices,
      })

    }, function (error) {
      console.log(error);
    });

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

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
  bindPass: function (e) {
    var index = e.currentTarget.dataset.index;
    var that = this;
    var borrowedEmployeeID = this.data.devices[index].borrowedEmployeeID;
    var borrowedEmployeeName = this.data.devices[index].borrowedEmployeeName;
    var deviceModel = this.data.devices[index].deviceModel;
    wx.showModal({
      title: deviceModel + '借用申请',
      content: "“" + borrowedEmployeeName + "”" + "向你申请借用该设备",
      cancelText: '稍后',
      confirmText: '同意',
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定');
          that.agreeBorrowed(that.data.devices[index].deviceID);
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  agreeBorrowed: function (deviceID) {
    var that = this;
    var queryStatus = new AV.Query('DevicesStatus');
    queryStatus.equalTo("deviceID", deviceID);
    queryStatus.first().then(function (result) {
      that.updateDeviceStatus(result.id, -2);

    }, function (error) {

    });
  },

  updateDeviceStatus: function (objectId, status) {
    var that = this;
    var timestamp = Date.parse(new Date());
    var todo = AV.Object.createWithoutData('DevicesStatus', objectId);
    todo.set('status', status);
    todo.set('actionTimestamp', timestamp);//当前操作时间
    todo.save().then(function (result) {
      that.getStatus(that.data.devices);
      wx.showToast({
        title: '设备借取已同意申请借用!',
        icon: 'none'
      })
    }, function (error) {
      wx.showToast({
        title: '同意借取设备失败，服务器错误',
        icon: 'none'
      })
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
        // devices.sort(function (a, b) {
        //   //升序
        //   var statusA = a.status ? a.status : 0;
        //   var statusB = b.status ? b.status : 0;
        //   return statusA - statusB;
        // })
        that.setData({
          devices: devices,
        })
      }, function (error) {
        console.log(error);
      });
    });
  },
  getMyDevices: function () {
    var that = this;
    var query = new AV.Query('Devices');
    query.equalTo('ownerID', this.data.openid);
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
        // that.getUsers(devices);
        console.log("获取设备列表:", devices);

      } else {
        console.log('无法从服务器同步设备系统版本列表');
      }

    }, function (error) {
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