// pages/log/log.js
const leanCloudManager = require('../../utils/leanCloudManager');


Page({

  /**
   * 页面的初始数据
   */

  data: {

    list:[],

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
      success:function(results){
        console.log(results);
        var list = [];
        results.forEach(function(item, index){
          var action = item.get('action');
          var status = item.get('status');
          var actionTimestamp = item.get('actionTimestamp');
          var actionUserEmployeeName = item.get('dependentActionUser').get('employeeName');
          var actionUserEmployeeID = item.get('dependentActionUser').get('employeeID');
          var deviceID = item.get('dependentDevice').get('deviceID');
          var deviceModel = item.get('dependentDevice').get('dependentModel').get('model');

          var obj = {};
          obj.actionDate = leanCloudManager.formatDateTime(actionTimestamp);
          obj.actionUserEmployeeName = actionUserEmployeeName;
          //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit

          if(action == "add"){
            action = "新增了设备:"
          }else if(action == "delete"){
            action = "删除了设备:"
          } else if (action == "edit") {
            action = "编辑了设备:"
          } else if (action == "applying") {
            action = "申请了设备:"
          } else if (action == "cancel") {
            action = "取消申请了设备:"
          } else if (action == "borrowed") {
            action = "借用了设备:"
          } else if (action == "returning") {
            action = "归还设备:"
          } else if (action == "returned") {
            action = "确认归还了设备:"
          } else if (action == "rejected") {
            action = "拒绝该设备被申请:"
          } 
          obj.action = action;
          obj.deviceModel = deviceModel + "(" + deviceID + ")";
          list.push(obj);
        });

        that.setData({
          list:list,
        })
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