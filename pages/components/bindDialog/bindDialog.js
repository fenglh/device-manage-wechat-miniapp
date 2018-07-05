
//index.js
const AV = require('../../../utils/av-live-query-weapp-min');


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
    employeeId: null,
    employeeName: null,
    employeeIdFocus: false,
    employeeNameFocus: false,
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

      if (!this.data.employeeId){
        wx.showToast({
          title: '请填写员工编号',
          icon:'none',
        })
        this.setData({
          employeeIdFocus:true,
        })
        return;
      }

      if (!this.data.employeeName) {
        wx.showToast({
          title: '请填写员工姓名',
          icon: 'none',
        });
        this.setData({
          employeeNameFocus: true,
        })
        return;
      }
      //绑定员工数据

      wx.showLoading({
        title: '保存中...',
        mask: true,
      })

      var query = new AV.Query('Users');
      query.equalTo('openID', this.properties.openid);
      var that = this;
      query.first().then(function (data) {
        if(data){       //更新
          // 声明类型
          var user = AV.Object.createWithoutData('Users', data.id);
          // 修改属性
          user.set('employeeID', that.data.employeeId);
          user.set('employeeName', that.data.employeeName);
          // 保存到云端
          user.save().then(function (obj) {
            that.util("close");
            wx.showToast({
              title: '绑定成功!',
              icon: 'success',
            })
            console.log('更新成功: ' + obj);
            that.triggerBindResult();
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
          user.set('openID', that.properties.openid);
          user.set('employeeID', that.data.employeeId);
          user.set('employeeName', that.data.employeeName);
          user.save().then(function (obj) {
          that.util("close");
          wx.showToast({
            title: '绑定成功!',
            icon:'success',
          })
          that.triggerBindResult();
          console.log('保存成功: ' + obj);
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
    bindEmployeeIdChange:function(e){
      this.setData({
        employeeId: e.detail.value
      })
    },
    bindEmployeeNameChange: function (e) {
      this.setData({
        employeeName: e.detail.value
      })
    },
    
    triggerBindResult:function(){
      var employeeInfo = {};
      employeeInfo.employeeID = this.data.employeeId;
      employeeInfo.employeeName = this.data.employeeName;
      employeeInfo.expiredDate = Date.parse(new Date()) + 600 * 1000; //10分钟有效期 
      this.triggerEvent('bindEmployee', employeeInfo, null);
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
