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
    radioItems: [
      { name: '蓝月亮', value: '0' },
      { name: '月亮小屋', value: '1', checked: true }
    ],
    brands: [["iPhone 5", "iPhone 5s", "iPhone 6", "iPhone 6s", "iPhone 7", "iPhone 7s"],
      ["GALAXY S7", "GALAXY S8", "GALAXY S9", "GALAXY A7", "GALAXY A8", "GALAXY A9"],
      ["小米8", "小米7", "小米红米7"],
      ["华为 P20", "华为 P21"],
      ["vivo Z1", "vivo NEX", "vivo Y85", "vivo Y83", "vivo Y75", "vivo Y67"],
      ["联想 A5860", "联想 A3900", "联想 A3860", "联想 A3500", "联想 S5", "联想 Z5"],
      ["锤子 cm33", "锤子 P10", "锤子 NX1", "锤子 坚果 Pro2"]
    ],
    brandIndex:0,

    deviceTypes: ["苹果", "三星",  "小米", "华为", "vivo", "联想", "锤子"],
    deviceTypeIndex: 0,

    systemVersions: [["8.3.1", "9.0", "10.1.1", "11.1.1"],
      ["4.3", "4.2.0", "4.1.1", "11.1.1"],
      ["2.3.1", "9.0", "10.1.1", "11.1.1"],
      ["2.3.1", "9.0", "10.1.1", "11.1.1"],
      ["1.3.1", "9.0", "10.1.1", "11.1.1"],
      ["10.3.1", "9.0", "10.1.1", "11.1.1"],
      ["20.3.1", "9.0", "10.1.1", "11.1.1"]],

    systemVersionIndex: 0,

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


  radioChange: function (e) {
    console.log('radio发生change事件，携带value值为：', e.detail.value);

    var radioItems = this.data.radioItems;
    for (var i = 0, len = radioItems.length; i < len; ++i) {
      radioItems[i].checked = radioItems[i].value == e.detail.value;
    }

    this.setData({
      radioItems: radioItems
    });
  },


  bindDeviceTypesChange:function(e) {
    this.setData({
      deviceTypeIndex: e.detail.value
    })
  },

  bindDeviceBrandChange: function (e) {
    this.setData({
      brandIndex: e.detail.value
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

    if (!this.data.deviceCode){
      this.showTips('请输入设备编号');
    } else if (!this.data.companyCode){
      this.showTips('请输入公司编号');
    }else{
      wx.showModal({
        title: '',
        content: '我确定填写信息无误',
        success: function (res) {
          if (res.confirm) {
            console.log('用户点击确定')
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    }


  },

  bindScanClick:function() {
    console.log('照相机拍照')
   var that = this
    //相机拍照
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths
        // console.log("图片地址:%s", tempFilePaths)
        // console.log("ocrSign：%s", that.data.ocrSign)
        wx.showLoading({
          title: '资产识别中...',
        })
        wx.uploadFile({
          url: 'http://recognition.image.myqcloud.com/ocr/general',
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
              var deviceTypeIndex = 0;
              console.log("deviceDesc :%s", deviceDesc)
              that.data.deviceTypes.forEach(function (item, index) {
                console.log(item);
                var iscontain = deviceDesc.indexOf(item) == -1 ? false : true;
                if (iscontain) {
                  deviceTypeIndex = index;
                }
              });

              that.setData({
                deviceCode: deviceCode,
                companyCode: companyCode,
                deviceTypeIndex: deviceTypeIndex
              })
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


