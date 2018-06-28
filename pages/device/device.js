// pages/Device/device.js

const AV = require('../../utils/av-live-query-weapp-min');

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

    systemVersions: ["8.3.1", "9.0", "10.1.1", "11.1.1"],
    systemVersionIndex: 0,

    countries: ["5000", "A1000"],
    countryIndex: 0,

    date: "2016-09-01",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
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
  bindCountryChange: function (e) {
    console.log('picker country 发生选择改变，携带值为', e.detail.value);

    this.setData({
      countryIndex: e.detail.value
    })
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

})