//app.js


const AV = require('./utils/av-live-query-weapp-min');

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
    brandsInfo: {},//型号信息
    models: {},//品牌信息
  }
})