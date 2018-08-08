const AV = require('../../utils/av-live-query-weapp-min');

const request = require('../../utils/request.js')


const app = getApp()


const MinUserLength = 5
const MaxUserLength = 8

const MinPwdLength = 8
const MaxPwdLength = 16

const host = 'https://angel.bluemoon.com.cn'
var url_login = host + '/bluemoon-control/user/ssoLogin'
var url_get_user_info = host + '/bluemoon-control/user/getUserInfo'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    user: '',
    pwd: '',
    pwdInputDisabled: true,
    pwdInputFocus: false,
    userInputFocus: true,
    userInputDisabled: false,
    loginBtndisable: true,
    animating: false,
    inputTips:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '机可借',
    })
    console.log('login onLoad')
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: 'white',
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {




    this.userInputAnimation = this.initAnimation(0,350);
    this.tipsAnimation = this.initAnimation(0, 700);
    this.pwdInputAnimation = this.initAnimation(0, 350);
    this.inputViewAnimation = this.initAnimation(0, 350);
    //登录按钮动画
    this.loginAnimation = this.initAnimation(0, 700);


    if (this.data.user.length >= 5) {
      this.animationPwdInputShow(true)
    } else {
      this.animationPwdInputShow(false)
      //清空密码
      this.setData({ pwd: '' })
    }
  },

  animationPwdInputShow: function (show) {

    var opacity = 0;
    if (show) {
      opacity = 1;
    } else {
      opacity = 0;
    }

    this.pwdInputAnimation.opacity(opacity).step()
    this.setData({
      pwdInputAnimation: this.pwdInputAnimation.export(),
    })
  },

  //用户名输入事件
  userBindinput: function (e) {
    this.setData({
      user: e.detail.value,
    })
    if (this.data.user.length >= MinUserLength) {
      this.hideInputTips(); 
      this.animationPwdInputShow(true)
    } else {
      this.showInputTips();
      this.animationPwdInputShow(false)
      //清空密码
      this.setData({
        pwd: '',
        userInputFocus: true
      })
    }
  },

  //密码输入事件
  pwdBindinput: function (e) {
    this.setData({
      pwd: e.detail.value,
    })

    if (this.data.pwd.length >= MinPwdLength) {
      this.hideInputTips(); 
      this.animationLoginBtnHeight(44)
    } else {
      this.showInputTips();
      this.animationLoginBtnHeight(0.5)
    }

  },

  initAnimation: function (delay,duration){

    var animation = wx.createAnimation({
      duration: duration,
      timingFunction: 'ease',
      delay: delay,
    })
    return animation;
  },


  animationLoginBtnHeight: function (value) {
    //登录按钮：高度变化
    this.loginAnimation.height(value).step()
    this.setData({
      loginAnimation: this.loginAnimation.export()
    })
  },
  animationMoveReset: function () {
    // Y轴移动，并缩放，以及透明度--还原
    this.inputViewAnimation.translateY(0).opacity(1).step()
    this.userInputAnimation.opacity(1).step()
    var pwdOpacity = 0
    if (this.data.user.length >= MinUserLength) { 
      
      pwdOpacity = 0.65 
    }
    this.pwdInputAnimation.opacity(pwdOpacity).step()
    this.setData({
      userInputAnimation: this.userInputAnimation.export(),
      inputViewAnimation: this.inputViewAnimation.export(),
      pwdInputAnimation: this.pwdInputAnimation.export(),

    })
  },

  animationMoveUp: function () {
    //用户输入框：Y轴移动、缩放、透明度
    this.inputViewAnimation.translateY(-50).step()
    this.userInputAnimation.opacity(0.65).step()
    this.pwdInputAnimation.opacity(1).step()
    this.setData({
      userInputAnimation: this.userInputAnimation.export(),
      inputViewAnimation: this.inputViewAnimation.export(),
      pwdInputAnimation: this.pwdInputAnimation.export(),
    })
  },

  

  hideInputTips:function() {
    this.tipsAnimation.height(0).opacity(0).step();
    this.setData({
      tipsAnimation: this.tipsAnimation.export()
    })
  },
  showInputTips:function(){
    var tips = '';
    if (this.data.pwdInputFocus){
      if (this.data.pwd.length < MinPwdLength){
        tips = `请输入${MinPwdLength}-${MaxPwdLength}员工密码`
      }
      
    }else{
      if (this.data.user.length < MinUserLength) {
        tips = `请输入${MinUserLength}-${MaxUserLength}员工编号`
      }
    }
    this.setData({
      inputTips: tips
    })
      this.tipsAnimation.height(30).opacity(1).step();
      this.setData({
        tipsAnimation: this.tipsAnimation.export()
      })

  },
  userBindtap: function () {

    if (this.data.animating) {
      var that = this;
      setTimeout(function () {
        that.userBindtap()
      }.bind(this), 100)
      console.log('动画中，延时执行')
      return;
    }
    //屏蔽所有
    this.disableAllInput()
    this.animationMoveReset()
    this.animationLoginBtnHeight(0.5)

    setTimeout(function () {
      this.setData({
        userInputDisabled: false,
        userInputFocus: true,

      })

    }.bind(this), 400)

    setTimeout(function () {
      this.setData({
        animating: false,
      })

    }.bind(this), 1300)

  },


  pwdBindtap: function () {

    if (this.data.animating) {
      setTimeout(function () {
        this.pwdBindtap()
      }.bind(this), 100)
      console.log('动画中，延时执行')
      return;
    }

    if (this.data.user.length < MinUserLength) {
      return;
    }

    this.animationMoveUp()

    if (this.data.pwd.length >= MinPwdLength) {
      this.animationLoginBtnHeight(44)
    } else {
      this.animationLoginBtnHeight(0.5)
    }

    setTimeout(function () {
      this.setData({
        pwdInputDisabled: false,
        pwdInputFocus: true,

      })

    }.bind(this), 400)

    setTimeout(function () {
      this.setData({
        animating: false,
      })

    }.bind(this), 1300)

  },



  disableAllInput: function () {
    this.setData({
      pwdInputFocus: false,
      userInputFocus: false,
      userInputDisabled: true,
      pwdInputDisabled: true,
      animating: true,
    })
  },



  //登录
  loginBindtap: function (e) {
    wx.showLoading({
      title: '登录中...',
      mask: true,
    })

    var that = this
    request.login({
      user: this.data.user,
      pwd: this.data.pwd,
      success: function (res) {
        var responseCode = res.data.responseCode
        var responseMsg = res.data.responseMsg
        if (responseCode != 0) {
          wx.showToast({
            title: res.data.responseMsg,
            icon: 'none',
          })
        } else {
          //跳转到首页
          console.log(res);
          var token = res.data.token;
          request.getUserInfo({
            token:token,
            success:function(res){
              console.log("获取用户信息成功:",res);
              var name = res.data.user.realName;
              var account = res.data.user.account;
              var mobile = res.data.user.mobileNo;
              that.bindEmployeeInfo(app.globalData.openid, account, name);
            },
            fail:function(res){
              console.log("获取用户信息失败:", res);
              wx.hideLoading();
            }
          });
        }

      },
      fail: function (res) {
        var responseMsg = res.data.responseMsg;
        wx.showToast({
          title: responseMsg,
          icon: 'none',
        })
      }
    })
  },

  bindEmployeeInfo: function (openid, employeeId, employeeName){
    var query = new AV.Query('Users');
    query.equalTo('openID', openid);
    var that = this;
    query.first().then(function (data) {
      if (data) {       //更新
        // 声明类型
        var user = AV.Object.createWithoutData('Users', data.id);
        // 修改属性
        user.set('employeeID', employeeId);
        user.set('employeeName', employeeName);
        // 保存到云端
        user.save().then(function (obj) {
          //保存
          var employeeInfo = {};
          employeeInfo.employeeObjectID =obj.id;
          employeeInfo.employeeID = obj.attributes["employeeID"];
          employeeInfo.employeeName = obj.attributes["employeeName"];
          app.globalData.employeeInfo = employeeInfo;
          //跳转到index
          wx.redirectTo({
            url: '../index/index',
          })
        }, function (error) {
          console.error(error);
          wx.showToast({
            title: '绑定登录用户信息失败',
            icon: 'none',
          })
        });

      } else {        //插入
        // 声明类型
        var Users = AV.Object.extend('Users');
        // 新建对象
        var user = new Users();
        user.set('openID', openid);
        user.set('employeeID', employeeId);
        user.set('employeeName', employeeName);
        user.save().then(function (obj) {
          //保存
          var employeeInfo = {};
          employeeInfo.employeeObjectID = obj.id;
          employeeInfo.employeeID = obj.attributes["employeeID"];
          employeeInfo.employeeName = obj.attributes["employeeName"];
          app.globalData.employeeInfo = employeeInfo;
          wx.redirectTo({
            url: '../index/index',
          })
        }, function (error) {
          console.error(error);
          wx.showToast({
            title: '绑定登录用户信息失败',
            icon: 'none',
          })
        });
      }
    }, function (error) {
      wx.showToast({
        title: '绑定失败,请稍后再试',
        icon: 'none',
      });
      console.log('错误日志：', error);
    });
  },


})