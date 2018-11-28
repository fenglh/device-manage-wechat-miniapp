// pages/log/log.js
const leanCloudManager = require('../../utils/leanCloudManager');


Page({

  /**
   * 页面的初始数据
   */

  data: {

    devices:[],

  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    wx.setNavigationBarTitle({
      title: '设备共享记录',
    });
    var that = this;
    leanCloudManager.getLogs({
      success: function (devices){
        devices.forEach(function(item,index){
          var action = item.action
          if (action == "add") {
            action = "【" + item.statusActionEmployeeObjectName + "】" + "新增了设备:"
          } else if (action == "delete") {
            action = "【" + item.statusActionEmployeeObjectName + "】" + "删除了设备:"
          } else if (action == "edit") {
            action = "【" +item.statusActionEmployeeObjectName + "】" + "编辑了设备:"
          }  else if (action == "borrowed") {
            action = "【" + item.statusActionEmployeeObjectName + "】" + "从" + "【" + item.fromEmployeeName + "】" + "处借取了" + item.deviceOwnerEmployeeName + "的:"
          } else if (action == "returned") {
            action = "【" + item.statusActionEmployeeObjectName + "】" + "从" + "【" + item.fromEmployeeName + "】" + "处收回了" + item.deviceOwnerEmployeeName + "的:"
          } 
          item.action = action;

        });
        that.setData({
          devices: devices,
        });
      },
      fial:function(error){
        wx.showToast({
          title: '获取设备记录失败!',
          icon:'none',
        })
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },



})