// pages/Device/device.js

const AV = require('../../utils/av-live-query-weapp-min');
var crypto = require('../lib/cryptojs/cryptojs.js');
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    ocrSign:null,
    showTopTips: false,
    deviceObjectID:null,
    topTips: '',
    models: [],
    brands: [],
    modelIndex: null,
    isEdit: false,
    brandIndex: null,

    OSVersions: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]],
    systemVersionIndex1: 0,
    systemVersionIndex2: 0,
    systemVersionIndex3: 0,
    companyCode: 'A000',
    deviceCode: null,

  },


  onLoad: function (options) {
    var title = "新增设备";
    if (options.isEdit) {
     title = "修改设备";
     this.setData({
       isEdit: true,
     })
    }
    wx.setNavigationBarTitle({
      title: '修改设备',
    })

    this.data.ocrSign = this.generateOCRSign();
    //初始化品牌
    var that = this;
    this.getBrands({
      success: function (brands) {
        that.setData({
          brands: brands,
        });
        wx.hideLoading();
        //初始化数据
        if (options.isEdit){
          var device = JSON.parse(options.device);
          that.data.deviceObjectID = device.deviceObjectID;
          console.log(device);
          //初始化修改设备的数据
          //隐藏头部
          //计算品牌
          var brandIndex = null;
          for (var i = 0; i < brands.length; i++) {
            var brandObject = brands[i];
            if (brandObject.brand = device.brand) {
              brandIndex = i;
              //获取可选型号
              break;
            }
          }
          //计算型号
          if (brandIndex != null) {
            that.getBrandModels(device.brandObjectID, {
              success: function (models) {
                var modelIndex = null;
                for (var index = 0; index < models.length; index++) {
                  var item = models[index];
                  if (item.objectID == device.modelObjectID) {
                    modelIndex = index;
                    break;
                  }
                }
                that.setData({
                  models: models,
                  modelIndex: modelIndex,
                });
                console.log('型号:', models);
              },
              fail: function () {
                wx.showToast({
                  title: '加载型号列表失败',
                  icon: 'none',
                });
              }
            });
          }
          //计算版本
          var versions = device.OSVersion.split(".") || [];
          that.setData({
            
            deviceCode: device.deviceID,
            companyCode: device.companyCode,
            brandIndex: brandIndex,
            systemVersionIndex1: parseInt(versions[0]) - 1,
            systemVersionIndex2: parseInt(versions[1]),
            systemVersionIndex3: parseInt(versions[2]),
          });
        }
      },
      fail: function () {
        wx.showToast({
          title: '初始化品牌信息失败',
          icon: 'none',
        });
      }
    });
  },

  //生成腾讯orc签名
  generateOCRSign: function () {
    var secretId = 'AKIDENL7i9LZVFpV6XoqqsBOTObhhTBlpEZp',
      secretKey = 'IVXN5hHguTtwJdnlYDKxY0GKFAwlQuCI',
      appid = '1256097546',
      pexpired = 86400,
      userid = 0;

    var now = parseInt(Date.now() / 1000),
      rdm = parseInt(Math.random() * Math.pow(2, 32)),
      plainText = 'a=' + appid + '&k=' + secretId + '&e=' + (now + pexpired) + '&t=' + now + '&r=' + rdm + '&u=' + userid + '&f=',
      data = crypto.Crypto.charenc.UTF8.stringToBytes(plainText),
      resBytes = crypto.Crypto.HMAC(crypto.Crypto.SHA1, plainText, secretKey, { asBytes: true }),
      bin = resBytes.concat(data);

    var sign = crypto.Crypto.util.bytesToBase64(bin);
    return sign;
  },

  bindDeviceCodeInput: function (e) {
    this.setData({
      deviceCode: e.detail.value
    })
  },

  bindCompanyCodeInput: function (e) {
    this.setData({
      companyCode: e.detail.value
    })
  },


  bindBrandChange: function (e) {
    var value = parseInt(e.detail.value); 
    var that = this;
    if (value !== this.data.brandIndex) {
      var brand = this.data.brands[value];
      this.setData({
        brandIndex: parseInt(e.detail.value),
        modelIndex: null,
      });
      this.getBrandModels(brand.objectID,{
        success: function (models){
          that.setData({
            models:models,
          });
        },
        fail:function(){
          wx.showToast({
            title: '加载型号列表失败',
            icon:'none',
          });
        }
      });
    }
  },

  bindModelChange: function (e) {
    this.setData({
      modelIndex: parseInt(e.detail.value),
    })
  },

  bindSystemVersionChange: function (e) {
    this.setData({
      systemVersionIndex1: e.detail.value[0],
      systemVersionIndex2: e.detail.value[1],
      systemVersionIndex3: e.detail.value[2]
    })
  },

  bindModelTap: function (e) {
    // if (this.data.brandIndex == null) {
    //   wx.showToast({
    //     title: '请先选择品牌',
    //     icon: 'none'
    //   })
    // }
  },


  showTips: function (content) {
    var that = this;
    this.setData({
      showTopTips: true,
      topTips: content
    });
    setTimeout(function () {
      that.setData({
        showTopTips: false,
        topTips: ''
      });
    }, 3000);
  },

  bindSubmit: function () {


    if (this.data.deviceCode == null) {
      this.showTips('请输入设备编号');
      return;
    }

    if (this.data.companyCode == null) {
      this.showTips('请输入公司编号');
      return;
    }

    if (this.data.brandIndex == null) {
      this.showTips('请选择设备品牌');
      return;
    }
    if (this.data.modelIndex == null) {
      this.showTips('请选择设备型号');
      return;
    }
    if (this.data.systemVersionIndex1 == 0 && this.data.systemVersionIndex2 == 0 && this.data.systemVersionIndex3 == 0) {
      this.showTips('请选择系统版本');
      return;
    }

    wx.showLoading({
      title: '提交中...',
      mask:true,
    })
    var that = this;
    //编辑
    if (this.data.isEdit) {
      var deviceAVObject = AV.Object.createWithoutData('Devices', that.data.deviceObjectID);
      //公司编码
      deviceAVObject.set('companyCode', that.data.companyCode);

      //关联型号（含品牌）
      var modelObject = that.data.models[that.data.modelIndex];
      var modelAVObject = AV.Object.createWithoutData('Models', modelObject.objectID);
      deviceAVObject.set('dependentModel', modelAVObject);
      //系统版本
      deviceAVObject.set('OSVersion', that.data.OSVersions[0][that.data.systemVersionIndex1] + "." + that.data.OSVersions[1][that.data.systemVersionIndex2] + "." + that.data.OSVersions[2][that.data.systemVersionIndex3])
      deviceAVObject.save().then(function(result){
          wx.hideLoading();
          wx.navigateBack({
            delta: 1
          });
          wx.showToast({
            title: '修改成功！',
            icon: 'success'
          });
      },function(error){
        wx.showToast({
          title: '修改失败,请稍后再试!',
          icon:'none',
        });
      });
    } 
    //添加
    else {
      var DevicesObject = AV.Object.extend('Devices');
      var that = this;

      var query = new AV.Query(DevicesObject);
      query.include(['dependentDevicesStatus.dependentUser']);
      query.equalTo('deviceID', this.data.deviceCode);
      query.first().then(function (result) {
        

        var deviceAVObject = AV.Object('Devices');
        if (result) {
          console.log(result);
          var status = result.get('dependentDevicesStatus') && result.get('dependentDevicesStatus').get('status');
          if(status && status == -99){
            deviceAVObject = AV.Object.createWithoutData('Devices', result.id);
          }else{
            wx.hideLoading();
            var str = '已存在编号为' + result.attributes.deviceID + "的设备";
            that.showTips(str);
            return;
          }
        }

        console.log("添加设备");
        var timestamp = Date.parse(new Date());

        //关联的型号
        var selectedModel = that.data.models[that.data.modelIndex];
        var modelAVObject = AV.Object.createWithoutData('Models', selectedModel.objectID);
        //关联用户
        var userAVObject = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);

        deviceAVObject.set('dependentModel', modelAVObject);
        deviceAVObject.set('dependentUser', userAVObject);
        deviceAVObject.set('OSVersion', that.data.OSVersions[0][that.data.systemVersionIndex1] + "." + that.data.OSVersions[1][that.data.systemVersionIndex2] + "." + that.data.OSVersions[2][that.data.systemVersionIndex3])
        deviceAVObject.set('deviceID', that.data.deviceCode)
        deviceAVObject.set('companyCode', that.data.companyCode)
        deviceAVObject.save().then(function (deviceObject) {

          //先添加设备，再添加状态，否会提示循环
          var deviceAVObject = AV.Object.createWithoutData('Devices', deviceObject.id);
          var statusAVObject = new AV.Object('DevicesStatus');
          statusAVObject.set('status', 0); //0闲置，-1 申请中，-2借出，-3归还中 
          statusAVObject.set('actionTimestamp', timestamp);//当前操作时间
          //状态-借用人 关联
          var dependentUserAVObject = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
          statusAVObject.set('dependentUser', dependentUserAVObject);//关联用户
          //状态-设备关联
          statusAVObject.set('dependentDevice', deviceAVObject);//关联设备
          //关联状态
          deviceAVObject.set('dependentDevicesStatus', statusAVObject);
          deviceAVObject.save().then(function(result){
            wx.hideLoading();
            wx.navigateBack({
              delta: 1
            })
            // 成功
            wx.showToast({
              title: '添加成功！',
              icon: 'success'
            })
          }, function(error){
            wx.hideLoading();
            that.showTips('添加设备状态失败');
          })
        }, function (error) {
          wx.hideLoading();
          that.showTips('添加设备失败');
        });


      }, function (error) {
        wx.showToast({
          title: '服务器错误!',
          icon: 'none'
        });
      });
    }
  },

  bindScanClick: function () {
    console.log('照相机拍照')
    var that = this

    //相机拍照
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {

        that.setData({
          modelIndex: null,
          brandIndex: null,
          systemVersionIndex1: 0,
          systemVersionIndex2: 0,
          systemVersionIndex3: 0,
          companyCode: null,
          deviceCode: null,
        })


        var tempFilePaths = res.tempFilePaths;
        wx.showLoading({
          title: '资产识别中...',
        })
        
        wx.uploadFile({
          url: 'https://recognition.image.myqcloud.com/ocr/general',
          filePath: tempFilePaths[0],
          name: 'image',
          header: {
            "authorization": that.data.ocrSign,
          },
          formData: {
            "appid": "1256097546",
          },
          success: function (res) {
            wx.hideLoading();
            var result = JSON.parse(res.data)
            var items = result['data']['items']

            //按照x轴升序排序
            var srotYItems = items.sort(function (a, b) {
              return a.itemcoord.y - b.itemcoord.y
            })
            console.log(srotYItems)
            var flagIndex = null;
            srotYItems.forEach(function (item, index) {
              var str = item['itemstring'];
              var iscontain = str.indexOf("蓝月亮") == -1 ? false : true;
              if (iscontain) {
                flagIndex = index;
              }
            });

            if (flagIndex !== null) {
              //设备编码标签索引
              var deviceCodeIndex = 0
              if (flagIndex == 0) {
                deviceCodeIndex = flagIndex + 1
              } else {
                //取出距离y轴距离最近的元素的索引
                var offsetToPrev = Math.abs(srotYItems[flagIndex - 1]['itemcoord']['y'] - srotYItems[flagIndex]['itemcoord']['y']);
                var offsetToNext = Math.abs(srotYItems[flagIndex + 1]['itemcoord']['y'] - srotYItems[flagIndex]['itemcoord']['y']);
                deviceCodeIndex = offsetToPrev < offsetToNext ? flagIndex - 1 : flagIndex + 1;
              }
              //得到设备编码，去掉所有空格
              var deviceCode = srotYItems[deviceCodeIndex]["itemstring"].replace(/[ ]/g, "");
              //去除非数字
              deviceCode = deviceCode.replace(/[^\d.]/g, "");
              //公司编码
              var companyCodeIndex = deviceCodeIndex > flagIndex ? deviceCodeIndex + 1 : flagIndex + 1;
              var companyCode = srotYItems[companyCodeIndex]["itemstring"].replace(/[ ]/g, "");
              //将I、l换成1
              companyCode = companyCode.replace(/[Il]/g, "1");
              //型号描述
              var deviceDesc = srotYItems[companyCodeIndex + 1]["itemstring"].replace(/[ ]/g, "");
              var brandIndex = null;
              var iscontain = false;
              for (var index = 0; index < that.data.brands.length; index++){
                var item = that.data.brands[index];
                iscontain = deviceDesc.indexOf(item.brand) == -1 ? false : true;
                if (iscontain) {
                  brandIndex = index;
                  break;
                }
              }
              //加载可选的型号
              if(brandIndex != null){
                that.getBrandModels(item.objectID, {
                  success: function (models) {
                    that.setData({
                      models: models,
                    });
                  },
                  fail: function () {
                    wx.showToast({
                      title: '加载型号列表失败',
                      icon: 'none',
                    });
                  }
                });
              }
   
              that.setData({
                deviceCode: deviceCode,
                companyCode: companyCode,
                brandIndex: brandIndex,
              })
              // wx.showToast({
              //   title: '资产识成功!',
              //   icon:'success',
              // })

            } else {
              wx.showToast({
                title: '资产识别失败,请手动填写或重新识别',
                icon: 'none'
              })
            }

          },
          fail: function () {
            wx.hideLoading();
            wx.showToast({
              title: '资产识别出错，请重新识别',
            })
          }
        })
      }
    })
  },


  ////////////新增函数//////
  //同步品牌
  getBrands: function ({success,fail}) {
    var that = this;
    var query = new AV.Query('Brands');
    query.find().then(function (results) {
      if (results) {
        var brands = [];
        results.forEach(function (item, index) {
          var obj = {};
          obj.objectID = item.id;
          obj.brand = item.attributes.brand
          brands.push(obj);
        });
        if(success){success(brands)};
        console.log('从服务器获取品牌列表:', brands);
      } else {
        if(fail){fail()};
        console.log('无法从服务器同步设备品牌列表');
      }

    }, function (error) {
      if (fail) { fail() };
    });
  },

  // ok
  getBrandModels: function (brandObjectID, {success, fail}){
    var that = this;
    var Brand = AV.Object.createWithoutData('Brand', brandObjectID);
    var query = new AV.Query('Models');
    query.equalTo('dependent', Brand);
    query.find().then(function(results){

      var models = [];
      results.forEach(function (item, index) {
        var obj = {};
        obj.model = item.attributes.model;
        obj.objectID = item.id
        models.push(obj);
      });
      success? success(models):null;
    }, function(error){
      fail? fail(): null;
    });
  },

})


