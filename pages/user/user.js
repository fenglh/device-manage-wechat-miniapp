// pages/user/user.js
const AV = require('../../utils/av-live-query-weapp-min');

const app = getApp()


Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    binBtnHide:false,
    focus:false,
    isBind: false,
    openid:null,
    employeeID:null,
    employeeMobile:null,
    employeeName:null,
    wxNickName:null,

  },


  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("options:",options);

    var isBind = options.isBind === 'true';

    wx.setNavigationBarTitle({
      title: '个人信息',
    })

    this.setData({
      openid:options.openid,
      isBind: isBind,
      wxNickName: options.wxNickName,
    })

    if (isBind){
      this.setData({
        employeeID: options.employeeID,
        employeeMobile: options.employeeID,
        employeeName: options.employeeName,
      }) 
    }


  },

  bindLogout:function(e){
    var that = this;
    wx.showModal({
      title: '解除绑定',
      content: '您确定要解除绑定吗？',
      success: function (res) {
        
        if (res.confirm) {
          that.deleteBindOpenId(that.data.openid);
        }
      }
    })

  },



  deleteBindOpenId: function ( youOpenId) {
    wx.showLoading({
      title: '',
      mask:true,
    })
    var Users = AV.Object.extend('Users');
    var that = this;
    var query = new AV.Query(Users);
    query.equalTo('openID', youOpenId);
    query.first().then(function (result) {
      var user = AV.Object.createWithoutData('Users', result.id);
      user.destroy().then(function (success) {
        let pages = getCurrentPages();//当前页面
        let prevPage = pages[pages.length - 2];//上一页面
        prevPage.cleanBindInfo();
        //解除绑定成功
        wx.navigateBack({
          delta:1,
        })

      }, function (error) {
        wx.hideLoading();
        // 删除失败
        wx.showToast({
          title: '解除绑定失败!',
          icon: "none",
        })
      });

    }, function (error) {
      wx.hideLoading();
      wx.showToast({
        title: '绑定不存在',
        icon: "none",
      })
    });

  },


 
})