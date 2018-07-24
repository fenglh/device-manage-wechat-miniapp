//app.js


const AV = require('./utils/av-live-query-weapp-min');
const now = Date.parse(new Date());//当前时间

AV.init({
  appId: 'IcEv4jY8hXwfHnIdn2DMlF4E-gzGzoHsz',
  appKey: 'X6WstPiEjGHdzoRMqx9JR7lT',
});


App({
  onLaunch: function () {
    
  },



  globalData: {
    userInfo: wx.getStorageSync('userInfo') || {},
    appid: 'wx2fc1b68058a04d90',//appid需自己提供，
    secret: 'ece9a679463eb37126b3c5fb3df0073e',//secret需自己提供，
    brandsInfo: wx.getStorageSync('BrandsInfo') || {},//型号信息
    modelsInfo: wx.getStorageSync('ModelsInfo') || {},//品牌信息


  }
})