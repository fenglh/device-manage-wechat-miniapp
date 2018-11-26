 
//index.js
const AV = require('../../../utils/av-live-query-weapp-min');
const request = require('../../../utils/request.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    showModalStatus: Boolean,
    openid: String,
  },

  /**
   * 组件的初始数据
   */
  data: {
    employeeMobile: null,
    employeeCode: null,
    employeeMobileFocus: false,
    employeeCodeFocus: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {

    bindCloseEvent:function(e){
      var currentStatu = e.currentTarget.dataset.statu;
      this.util(currentStatu)
    },
    bindOKEvent: function (e) {

      if (!this.data.employeeMobile){
        wx.showToast({
          title: '请填写员工手机号',
          icon:'none',
        })
        this.setData({
          employeeMobileFocus:true,
        })
        return;
      }

      if (!this.data.employeeCode) {
        wx.showToast({
          title: '请填写员工编号',
          icon: 'none',
        });
        this.setData({
          employeeCodeFocus: true,
        })
        return;
      }

      wx.showLoading({
        title: '',
        mask: true,
      })
      var that = this;
      console.log("employeeMobile:", this.data.employeeMobile, "employeeCode:", this.data.employeeCode)
      request.getkUserInfoByMobile({
        mobileNo: this.data.employeeMobile,
        success: function (res) {
          console.log(res.data);
          var account = res.data.user.account;
          var name = res.data.user.realName;
          if (account != that.data.employeeCode){
            wx.showToast({
              title: '手机号与员工编号不匹配!',
              duration:3000,
              icon:"none",
            })
          }else{
            console.log('进行绑定');
            that.bindEmployeeInfo(that.properties.openid, that.data.employeeMobile, account, name)
          }
        },
        fail: function (res) {
          var responseMsg = res.data.responseMsg;
          wx.showToast({
            title: responseMsg,
            icon:'none'
          })
        }
      });
    },


    bindEmployeeInfo:function(openId, mobile, employeeCode, employeeName){

      if(!openId){
        wx.showToast({
          title: 'openId为空，无法绑定!',
          icon:'none'
        })
        return;
      }

      var query = new AV.Query('Users');
      query.equalTo('openID', openId);
      var that = this;
      query.first().then(function (data) {
        if(data){       //更新
          // 声明类型
          var user = AV.Object.createWithoutData('Users', data.id);
          // 编辑属性
          user.set('employeeID', employeeCode);
          user.set('employeeName', employeeName);
          user.set('employeeMobile', mobile);
          // 保存到云端
          user.save().then(function (obj) {
            that.util("close");
            wx.showToast({
              title: '绑定成功!',
              icon: 'success',
            })
            console.log('更新成功: ' + obj);

            var employeeInfo = {};

            employeeInfo.employeeID = employeeCode;
            employeeInfo.employeeMobile = mobile;
            employeeInfo.employeeName = employeeName;

            that.triggerEvent('successEvent', employeeInfo, null);

            // console.log('绑定成功，回调绑定信息: ', employeeInfo);

          }, function (error) {
            console.error(error);
            wx.showToast({
              title: '绑定失败,请稍后再试',
              icon: 'none',
            })
          });

        }else{        //插入
          // 声明类型
          var Users = AV.Object.extend('Users');
          // 新建对象
          var user = new Users();
          user.set('openID', openId);
          user.set('employeeID', employeeCode);
          user.set('employeeName', employeeName);
          user.set('employeeMobile', mobile);
          user.save().then(function (obj) {
          that.util("close");
          wx.showToast({
            title: '绑定成功!',
            icon:'success',
          })

          var employeeInfo = {};
            employeeInfo.employeeID = employeeCode;
            employeeInfo.employeeMobile = mobile;
            employeeInfo.employeeName = employeeName;


            that.triggerEvent('successEvent', employeeInfo, null);
          // console.log('绑定成功，回调绑定信息: ', employeeInfo);
        }, function (error) {
          console.error(error);
          wx.showToast({
            title: '绑定失败,请稍后再试',
            icon: 'none',
          })
        });
        }
      }, function (error) {
        wx.showToast({
          title: '绑定失败,请稍后再试',
          icon: 'none',
        })
      });
    },

    bindEmployeeMobileChange:function(e){
      this.setData({
        employeeMobile: e.detail.value
      })
    },
    bindEmployeeCodeChange: function (e) {
      this.setData({
        employeeCode: e.detail.value
      })
    },
    


    util: function (currentStatu) {
      /* 动画部分 */
      // 第1步：创建动画实例   
      var animation = wx.createAnimation({
        duration: 200,  //动画时长  
        timingFunction: "linear", //线性  
        delay: 0  //0则不延迟  
      });

      // 第2步：这个动画实例赋给当前的动画实例  
      this.animation = animation;

      // 第3步：执行第一组动画  
      animation.opacity(0).rotateX(-100).step();

      // 第4步：导出动画对象赋给数据对象储存  
      this.setData({
        animationData: animation.export()
      })

      // 第5步：设置定时器到指定时候后，执行第二组动画  
      setTimeout(function () {
        // 执行第二组动画  
        animation.opacity(1).rotateX(0).step();
        // 给数据对象储存的第一组动画，更替为执行完第二组动画的动画对象  
        this.setData({
          animationData: animation
        })

        //关闭  
        if (currentStatu == "close") {
          this.setData(
            {
              showModalStatus: false
            }
          );
        }
      }.bind(this), 200)

      // 显示  
      if (currentStatu == "open") {
        this.setData(
          {
            showModalStatus: true
          }
        );
      }
    },
  }
})
