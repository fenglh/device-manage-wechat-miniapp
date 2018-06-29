// pages/Device/device.js

const AV = require('../../utils/av-live-query-weapp-min');
var crypto = require('../lib/cryptojs/cryptojs.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    showTopTips: false,
    radioItems: [
      { name: '蓝月亮', value: '0' },
      { name: '月亮小屋', value: '1', checked: true }
    ],
    brands: ["iPhone 5", "iPhone 5s", "iPhone 6", "iPhone 6s", "iPhone 7", "iPhone 7s"],
    brandIndex:0,

    deveceTypes: ["诺基亚", "三星", "苹果", "小米", "华为", "vivo"],
    deveceTypeIndex: 0,

    deveceCode:null,
    systemVersions: ["8.3.1", "9.0", "10.1.1", "11.1.1"],
    systemVersionIndex: 0,


    date: "2016-09-01",

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

  bindDateChange: function (e) {
    this.setData({
      date: e.detail.value
    })
  },
  showTopTips: function () {
    var that = this;
    this.setData({
      showTopTips: true
    });
    setTimeout(function () {
      that.setData({
        showTopTips: false
      });
    }, 3000);
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
            var result = JSON.parse(res.data)
            var items = result['data']['items']
            var srotXItems = items.sort(function (a, b){
              console.log(a.itemcoord.x)
              return a.itemcoord.x - b.itemcoord.x
            })

            var srotYItems = items.sort(function (a, b) {
              console.log(a.itemcoord.x)
              return a.itemcoord.y - b.itemcoord.y
            })

            items.forEach(function(item, index){

              var str = item['itemstring'];
              var iscontain = str.indexOf("蓝月亮") == -1 ? false : true;
              if(iscontain){
                console.log(str)
              }
            });
            // var data = result['result_list'][0]['data']
            // var company=data[0]['value'];
            // var deviceType = data[1]['value'];
            // var deviceCode = data[3]['value'];
            // var date = data[4]['value'];
            // console.log("公司名称:%s", company);
            // console.log("设备类型:%s", deviceType);
            // console.log("设备编码:%s", deviceCode);
            // console.log("贴标时间:%s", date);
            // that.setData({
            //   date: date,
            //   deviceCode: deviceCode
            // })
          },
          complete:function(res){
            wx.hideLoading();
          }
        })
      }
    })
  },



})