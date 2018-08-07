// pages/myDevices/myDevices.js

const AV = require('../../utils/av-live-query-weapp-min');
const leanCloudManager = require('../../utils/leanCloudManager');

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

  //拒绝申请
  bindReject:function(e){
    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    var that = this;
    wx.showModal({
      title: '拒绝申请',
      content: '你确定拒绝 "' + device.statusActionEmployeeObjectName + '"申请设备' + device.model + " ?",
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({
            title: '',
          });
          leanCloudManager.addDevicesStatus(device.deviceObjectID, 0, {
            success: function () {
              wx.showToast({
                title: '拒绝成功!',
                icon: 'success',
              });
              that.getMyDevices();
            },
            fail: function () {
              wx.showToast({
                title: '决绝失败，请稍后再试',
                icon: 'noen'
              });
            }
          })
        }
      }
    });

  },



  //ok
  bindConfirmReturn: function (e) {
    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    var that = this;
    wx.showModal({
      title: '确认归还',
      content: '你确定已归还设备 ' + device.model + " ?",
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({
            title: '',
          });
          leanCloudManager.addDevicesStatus(device.deviceObjectID, 0, {
            success:function(){
              wx.showToast({
                title: '确认归还成功!',
                icon: 'success',
              });
              that.getMyDevices();
            },
            fail:function(){
              wx.showToast({
                title: '确认归还失败，请稍后再试',
                icon: 'noen'
              });
            }
          })
        }
      }
    });
  },

  // ok
  bindPass: function (e) {
    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    var that = this;
    var borrowedEmployeeID = device.borrowedEmployeeID;
    var statusActionEmployeeObjectName = device.statusActionEmployeeObjectName;
    wx.showModal({
      title: device.model + '借用申请',
      content: "“" + statusActionEmployeeObjectName + "”" + "向你申请借用设备",
      cancelText: '稍后',
      confirmText: '同意',
      success: function (res) {
        if (res.confirm) {
          leanCloudManager.addDevicesStatus(device.deviceObjectID, -2, {
            success:function(){
              that.getMyDevices();
            },
            fail:function(){
              wx.showToast({
                title: '通过借用申请失败',
                icon: 'none'
              });
            }
          });
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  

  bindDelete:function(e){
    var index = e.currentTarget.dataset.index;
    var that = this;
    wx.showActionSheet({
      itemList: ['删除'],
      success: function (res) {
        if(res.tapIndex == 0){
          wx.showLoading({
            title: '',
            mask:true,
          })
          leanCloudManager.addDevicesStatus(device.deviceObjectID, -99, {
            success:function(){
                wx.showToast({
                  title: '删除设备成功',
                });
                that.getMyDevices();
            },
            fail:function(error){
              wx.showToast({
                title: '删除设备失败',
                icon:'none',
              });
              console.log(error);
            }
          })
        };
      },
      fail: function (res) {
        that.closeSlide(index);
      }
    })
  },

  //ok
  bindEdit:function(e){
    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    wx.navigateTo({
      url: '../device/device?' + "device=" + JSON.stringify(device) + "&isEdit=true",
    });
    this.closeSlide(index);
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
    query.include(['dependentDevicesStatus.dependentActionUser']);

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
          var modelObjectID = item.get('dependentModel') ? item.get('dependentModel').id : null;
          var model = item.get('dependentModel') ? item.get('dependentModel').get('model') : null;
          //品牌
          var brand = item.get('dependentModel') ? (item.get('dependentModel').get('dependent') ? item.get('dependentModel').get('dependent').get('brand') : null) : null;
          var brandObjectID = item.get('dependentModel') ? (item.get('dependentModel').get('dependent') ? item.get('dependentModel').get('dependent').id : null) : null;

          //状态
          var status = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').get('status') : null;
          var statusObjectID = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').id : null;

          var statusObjectID = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').id : null;
          var statusActionTimestamp = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').get('actionTimestamp') : null;

          var statusActionEmployeeObjectID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentActionUser') ? item.get('dependentDevicesStatus').get('dependentActionUser').id : null) : null;
          var statusActionEmployeeID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentActionUser') ? item.get('dependentDevicesStatus').get('dependentActionUser').get('employeeID') : null) : null;
          var statusActionEmployeeObjectName = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentActionUser') ? item.get('dependentDevicesStatus').get('dependentActionUser').get('employeeName') : null) : null;

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
          obj.brandObjectID = brandObjectID;
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

        //排序
        devices.sort(function (a, b) {
          //降序
          return b.status - a.status;
        });

        that.setData({
          showEmptyView: false,
          devices: devices
        })
      } else {
        that.setData({
          showEmptyView: true,
          devices:[],
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
  },

  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    this.onShow();
  },

})