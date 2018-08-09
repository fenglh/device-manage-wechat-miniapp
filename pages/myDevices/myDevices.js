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
      content: '你确定拒绝 "' + device.borrowEmployeeName + '"申请设备' + device.model + " ?",
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({
            title: '',
          });
          //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
          leanCloudManager.addDoDevicesStatus(device.deviceObjectID, device.borrowEmployeeObjectID, 0,"rejected", {
            success: function () {
              wx.showToast({
                title: '拒绝成功!',
                icon: 'success',
              });
              that.getMyDevices();
            },
            fail: function () {
              wx.showToast({
                title: '拒绝失败，请稍后再试',
                icon: 'none'
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
          //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
          leanCloudManager.addDoDevicesStatus(device.deviceObjectID, device.borrowEmployeeObjectID, 0,"returned", {
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
                icon: 'none'
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
    var borrowEmployeeName = device.borrowEmployeeName;
    wx.showModal({
      title: device.model + '借用申请',
      content: "“" + borrowEmployeeName + "”" + "向你申请借用设备",
      cancelText: '稍后',
      confirmText: '同意',
      success: function (res) {
        if (res.confirm) {
          //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
          leanCloudManager.addDoDevicesStatus(device.deviceObjectID, device.borrowEmployeeObjectID, -2,"borrowed", {
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
    var device = this.data.devices[index];
    var that = this;
    //闲置状态下才可删除
    if (!device.status || device.status == 0) {
      wx.showActionSheet({
        itemList: ['删除'],
        success: function (res) {
          that.closeSlide(index);
          if (res.tapIndex == 0) {
            wx.showLoading({
              title: '',
              mask: true,
            });
            //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
            leanCloudManager.addDoDevicesStatus(device.deviceObjectID,null, -99, "delete", {
              success: function () {
                wx.showToast({
                  title: '删除设备成功',
                });
                that.getMyDevices();
              },
              fail: function (error) {
                wx.showToast({
                  title: '删除设备失败',
                  icon: 'none',
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
    } else {
      wx.showModal({
        title: '提示',
        content: '请在设备“闲置”状态时，进行删除操作',
        showCancel: false,
        success: function (res) {
          that.closeSlide(index);
        }
      })
    }
    

  },

  //ok
  bindEdit:function(e){
    var index = e.currentTarget.dataset.index;
    var device = this.data.devices[index];
    var that = this;
    if (!device.status || device.status == 0 ){
      wx.navigateTo({
        url: '../device/device?' + "device=" + JSON.stringify(device) + "&isEdit=true",
      });
      that.closeSlide(index);
    }else {
      wx.showModal({
        title: '提示',
        content: '请在设备“闲置”状态时，进行修编辑作',
        showCancel:false,
        success: function (res) {
          that.closeSlide(index);
        }
      })
    }


    
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
    leanCloudManager.getMyDevices({
      success: function (devices) {
        wx.stopPullDownRefresh();
        wx.hideNavigationBarLoading();
        var show = false;
        if (devices.length <= 0) {
          show = true;
        }
        that.setData({
          showEmptyView: show,
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