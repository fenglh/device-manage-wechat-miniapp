const AV = require('../../utils/av-live-query-weapp-min');

const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    model:null,
    brands:[],
    brandIndex: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getBrands();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  bindInputModel:function(e){
    this.setData({
      model: e.detail.value
    })
    console.log("输入:",this.data.model);

  },

  bindBrandChange: function (e) {

    if (e.detail.value !== this.data.brandIndex) {
      this.setData({
        brandIndex: e.detail.value,
      })
    }
  },
  bindSubmit:function(){
    console.log('绑定提交');
    if (!this.data.brandIndex  || !this.data.model ) {
      wx.showToast({
        title: '请填写完整信息',
        icon:'none',
      });
      return;
    }
    wx.showLoading({
      title: '',
    });
    

    // var brandObject = AV.Object.createWithoutData('Brands', brand.objectID);
    var brand = this.data.brands[this.data.brandIndex];
    var brandObject = AV.Object.createWithoutData('Brands', brand.objectID);
    var modelObject = new AV.Object('Models');
    modelObject.set('model', this.data.model);
    modelObject.set('dependent', brandObject);
    modelObject.save().then(function(model){
      wx.showToast({
        title: '添加成功!',
      })
    }, function(error){
      wx.showToast({
        title: '添加失败!',
        icon:'none',
      })
    });
  },
  //同步品牌
  getBrands: function () {
    var that = this;
    var query = new AV.Query('Brands');
    query.ascending('brandID');
    query.find().then(function (results) {
      if (results) {
        var brands=[];
        results.forEach(function (item, index) {
          var obj = {};
          obj.objectID=item.id;
          obj.brand = item.attributes.brand
          brands.push(obj);
        });
        that.setData({
          brands:brands,
        })
        console.log('从服务器获取品牌列表:', brands);
      } else {
        console.log('无法从服务器同步设备品牌列表');
      }

    }, function (error) {
    });
  },
})