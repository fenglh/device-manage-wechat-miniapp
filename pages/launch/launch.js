

const request = require('../../utils/request.js')
const app = getApp()
Page({


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    if (!app.globalData.openid) {
      app.login({
        success: function (openid) {
          app.checkBindEmployeeInfo({
            openid:openid,
            success:function(res){
                if(res){

                  var employeeInfo = {};
                  employeeInfo.employeeObjectID = res.id;
                  employeeInfo.employeeID = res.attributes.employeeID;
                  employeeInfo.employeeName = res.attributes.employeeName;
                  app.globalData.employeeInfo = employeeInfo;
                  console.log('获取用户信息:', app.globalData.employeeInfo);
                  wx.redirectTo({
                    url: '../index/index',
                  })
                }else {
                  console.log("未绑定");
                  wx.redirectTo({
                    url: '../login/login',
                  })
                }
            },
            fail:function(){
              wx.showToast({
                title: '查询绑定员工信息失败!',
                icon:'none'
              })
            }
          })
        },
        fail: function () {
          console.log("获取openid失败");
        }
      });
    }else {
      console.log("获取缓存的openid:", app.globalData.openid);
      app.checkBindEmployeeInfo({
        openid: app.globalData.openid,
        success: function (res) {
          if (res) {
            console.log("已绑定2");
            var employeeInfo = {};
            employeeInfo.employeeObjectID = res.id;
            employeeInfo.employeeID = res.attributes.employeeID;
            employeeInfo.employeeName = res.attributes.employeeName;
            app.globalData.employeeInfo = employeeInfo;
            console.log('获取用户信息:', app.globalData.employeeInfo);
          //跳转到index
            wx.redirectTo({
              url: '../index/index',
            })
          } else {
            console.log('未绑定')
            //跳转到登录
            wx.redirectTo({
              url: '../login/login',
            })
          }
        },
        fail: function () {
          wx.showToast({
            title: '查询绑定员工信息失败!',
            icon: 'none'
          })
        }
      });
    }
  },
})