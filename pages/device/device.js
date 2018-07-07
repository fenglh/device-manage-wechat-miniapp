// pages/Device/device.js

const AV = require('../../utils/av-live-query-weapp-min');
var crypto = require('../lib/cryptojs/cryptojs.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    showTopTips: false,
    topTips: '',
    models: wx.getStorageSync('modelsInfo').models || {},
    modelIndex:null,

    brands: wx.getStorageSync('brandsInfo').brands || [],
    brandIndex: null,

    OSVersions: wx.getStorageSync('OSVersionsInfo').OSVersions || {},
    systemVersionIndex: null,

    companyCode:null,
    deviceCode:null,
    ocrSign:null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var sign = this.generateOCRSign()
    this.setData({
      ocrSign:sign
    })
    console.log("签名:%s", this.data.ocrSign)
  },

  onReady: function () {

    //同步品牌列表
    if (this.data.brands.length == 0){
      this.syncBrands();
    }else{
      console.log("从缓存同步设备品牌列表:", this.data.brands);
    }
    if (Object.keys(this.data.models).length == 0){
      this.syncModels();
    }else {
      console.log("从缓存同步设备型号列表:", this.data.models);
    }

    if (Object.keys(this.data.OSVersions).length == 0) {
      this.syncOSVersion();
    } else {
      console.log("从缓存同步设备系统版本列表:", this.data.OSVersions);
    }
    

    //同步设备型号

  },

  syncOSVersion:function(){
    var that = this;
    var query = new AV.Query('OSVersion');
    query.ascending('brandID');
    query.find().then(function (results) {
      if (results) {
        var OSVersions = {};
        results.forEach(function (item, index) {
          var brandID = item.attributes.brandID;
          if (!OSVersions[brandID]) {
            OSVersions[brandID] = [];
          }
          OSVersions[brandID].push(item.attributes.version);
        });

        that.setData({
          OSVersions: OSVersions,
        })

        var obj = {};
        obj.OSVersions = OSVersions;
        obj.expiredDate = Date.parse(new Date()) + 1000 * 60 * 60 * 24; //24小时有效期 
        wx.setStorageSync('OSVersionsInfo', obj);//存储openid

        console.log("从服务器同步设备系统版本列表:", OSVersions);
      } else {
        console.log('无法从服务器同步设备系统版本列表');
      }

    }, function (error) {
    });
  },


  //同步型号
  syncModels:function(){
    var that = this;
    var query = new AV.Query('Models');
    query.ascending('brandID');
    query.find().then(function (results) {
      if (results) {
        var models={};
        results.forEach(function (item, index) {
          var brandID = item.attributes.brandID;
          if (!models[brandID]){
            models[brandID] = [];
          }
          models[brandID].push(item.attributes.model);
        });

        that.setData({
          models: models,
        })

        var obj = {};
        obj.models = models;
        obj.expiredDate = Date.parse(new Date()) + 1000 * 60 * 60 * 24; //24小时有效期 
        wx.setStorageSync('modelsInfo', obj);

        console.log("从服务器同步设备型号列表:", models);
      } else {
        console.log('无法从服务器同步设备型号列表');
      }

    }, function (error) {
    });
  },
  //同步品牌
  syncBrands:function(){
    var that = this;
    var query = new AV.Query('Brands');
    query.ascending('brandID');
    query.find().then(function (results) {
      if (results) {

        var brands = [];
        results.forEach(function (item, index) {
          var obj = {};
          obj.brandID = item.attributes.brandID;
          obj.brand = item.attributes.brand;
          brands.push(obj);
        });
        that.setData({
          brands: brands,
        })
        var obj = {};
        obj.brands = brands;
        obj.expiredDate = Date.parse(new Date()) + 1000 * 60 * 60 * 24; //24小时有效期 
        wx.setStorageSync('brandsInfo', obj);
        console.log("从服务器同步设备品牌列表:", brands);
      } else {
        console.log('无法从服务器同步设备品牌列表');
      }

    }, function (error) {
    });
  },

  //生成腾讯orc签名
  generateOCRSign:function() {
    var secretId = 'AKIDENL7i9LZVFpV6XoqqsBOTObhhTBlpEZp',
      secretKey = 'IVXN5hHguTtwJdnlYDKxY0GKFAwlQuCI',
      appid = '1256097546',
      pexpired = 86400,
      userid = 0;

    var now = parseInt(Date.now() / 1000),
      rdm = parseInt(Math.random() * Math.pow(2, 32)),
      plainText = 'a=' + appid + '&k=' + secretId + '&e=' + (now + pexpired) + '&t=' + now + '&r=' + rdm + '&u=' + userid + '&f=',
      data = crypto.Crypto.charenc.UTF8.stringToBytes(plainText),
      resBytes = crypto.Crypto.HMAC(crypto.Crypto.SHA1, plainText, secretKey, { asBytes:true}),
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



  bindBrandChange:function(e) {

    if (e.detail.value !== this.data.brandIndex){
      this.setData({
        brandIndex: e.detail.value,
        modelIndex: null,
        systemVersionIndex: null,
      })
    }
  },

  bindModelChange: function (e) {
    this.setData({
      modelIndex: e.detail.value,
    })
  },
  
  bindSystemVersionChange: function (e) {
    this.setData({
      systemVersionIndex: e.detail.value
    })
  },

  showTips:function(content) {
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

    console.log(this.data.brandIndex)

    if (this.data.deviceCode == null){
      this.showTips('请输入设备编号');
      return;
    }

    if (this.data.companyCode == null){
      this.showTips('请输入公司编号');
      return ;
    }

    if (this.data.brandIndex == null) {
      this.showTips('请选择设备品牌');
      return;
    }

    if (this.data.modelIndex == null) {
      this.showTips('请选择设备型号');
      return;
    }

    if (!this.data.systemVersionIndex) {
      this.showTips('请选择系统版本');
      return;
    }
    


    var DevicesObject = AV.Object.extend('Devices');
    var that = this;
    new AV.Query(DevicesObject).equalTo('deviceID', this.data.deviceCode).find().then(function (results) {
      console.log(results);
      console.log(results.length);
      if (results.length > 0){
        wx.showToast({
        title: '该设备已存在!',
        icon:'none'
        });
      }else{
        var openIdInfo = wx.getStorageSync('openIdInfo');
        
        var deviceObject = new DevicesObject();
        deviceObject.set('brandID', that.data.brands[that.data.brandIndex].brandID);
        deviceObject.set('deviceModel', that.data.models[that.data.brands[that.data.brandIndex].brandID][that.data.modelIndex])
        deviceObject.set('OSVersion', that.data.OSVersions[that.data.brands[that.data.brandIndex].brandID][that.data.systemVersionIndex])
        deviceObject.set('deviceID', that.data.deviceCode )
        deviceObject.set('companyCode', that.data.companyCode)
        deviceObject.set('ownerID', openIdInfo.openid);
        deviceObject.save().then(function (deviceObject) {
          wx.hideLoading();
          wx.showToast({
            title: '添加成功！',
            icon:'success'
          })

          // 成功
        }, function (error) {
          wx.hideLoading();
          console.log(error)
          // 失败
          wx.showToast({
            title: '添加设备失败！',
            icon: 'success'
          })
        });

      }
    },function(error){
      wx.showToast({
        title: '服务器错误!',
        icon: 'none'
      });
    });


  },

  bindScanClick:function() {
    console.log('照相机拍照')
   var that = this
   that.setData({
     modelIndex: null,
     brandIndex: null,
     systemVersionIndex: null,
     companyCode: null,
     deviceCode: null,
   })
    //相机拍照
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {


        var tempFilePaths = res.tempFilePaths;
        wx.showLoading({
          title: '资产识别中...',
        })
        wx.uploadFile({
          url: 'https://recognition.image.myqcloud.com/ocr/general',
          filePath: tempFilePaths[0],
          name: 'image',
          header:{
            "authorization": that.data.ocrSign ,
          },
          formData:{
            "appid":"1256097546",
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
            var flagIndex=null;
            srotYItems.forEach(function(item, index){
              var str = item['itemstring'];
              var iscontain = str.indexOf("蓝月亮") == -1 ? false : true;
              if(iscontain){  
                flagIndex = index;
              }
            });

            if(flagIndex !== null){
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
              console.log("deviceDesc :%s", deviceDesc)
              that.data.brands.forEach(function (item, index) {
                console.log(item);
                var iscontain = deviceDesc.indexOf(item.brand) == -1 ? false : true;
                if (iscontain) {
                  brandIndex = index;
                }
              });

              that.setData({
                deviceCode: deviceCode,
                companyCode: companyCode,
                brandIndex: brandIndex
              })
              // wx.showToast({
              //   title: '资产识成功!',
              //   icon:'success',
              // })

            }else{
              wx.showToast({
                title: '资产识别失败,请手动填写或重新识别',
                icon:'none'
              })
            }

          },
          fail:function(){
            wx.hideLoading();
            wx.showToast({
              title: '资产识别出错，请重新识别',
            })
          }
        })
      }
    })
  },



})


