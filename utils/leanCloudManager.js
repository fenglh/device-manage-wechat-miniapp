
const AV = require('./av-live-query-weapp-min');
const app = getApp()

var leanCloud = {
  
  addMessageAction: function (source, destination, action, device) {
    //申请借用、拒绝、同意申请、归还提交、归还确认、增、删、改 分别对应
    //applying、reject、applyed、returning、returned、add、delete、edit
    //message包含4个要素:source、destination、timestmap、action 
    var timestamp = Date.parse(new Date());

    var messageAVObject = AV.Object('Messages');
    action && messageAVObject.set('action', action);
    source && messageAVObject.set('dependentSource', source);
    destination && messageAVObject.set('dependentDestination', destination);
    device && messageAVObject.set('dependentDevice', device);
    messageAVObject.set('actionTimestamp', timestamp);
    messageAVObject.save().then(function (result) {
      console.log('消息保存成功!');
    }, function (error) {
      console.log('消息保存失败!');
    });
  },

  addDevice: function (deviceCode, companyCode, modelObjectID, osVersion, { success, fail }){

    var that = this;
    var timestamp = Date.parse(new Date());

    var deviceAVObject = AV.Object('Devices');
    //关联的型号
    var modelAVObject = AV.Object.createWithoutData('Models', modelObjectID);
    deviceAVObject.set('dependentModel', modelAVObject);

    //关联用户
    var userAVObject = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    deviceAVObject.set('dependentUser', userAVObject);
    //管理设备信息
    deviceAVObject.set('OSVersion', osVersion);
    deviceAVObject.set('deviceID', deviceCode);
    deviceAVObject.set('companyCode', companyCode);
    deviceAVObject.save().then(function (deviceObject) {

      //再添加状态，否会提示循环
      var deviceAVObject = AV.Object.createWithoutData('Devices', deviceObject.id);
      var statusAVObject = new AV.Object('DevicesStatus');
      statusAVObject.set('status', 0); //0闲置，-1 申请中，-2借出，-3归还中 
      statusAVObject.set('actionTimestamp', timestamp);//当前操作时间
      //状态-借用人 关联
      var dependentActionUserAVObject = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
      statusAVObject.set('dependentActionUser', dependentActionUserAVObject);//关联用户
      //状态-设备关联
      statusAVObject.set('dependentDevice', deviceAVObject);//关联设备
      //关联状态
      deviceAVObject.set('dependentDevicesStatus', statusAVObject);
      deviceAVObject.save().then(function (result) {
        that.addMessageAction(userAVObject, null, "add", deviceAVObject);
        success ? success(result) : null;
      }, function (error) {
        fail ? fail(error) : null;
      })
    }, function (error) {
      fail ? fail(error) : null;
    });
  },

  //编辑设备
  editDevice: function (deviceObjectID, companyCode,modelObjectID, OSVersion, {success, fail}){
    var that = this;
    var deviceAVObject = AV.Object.createWithoutData('Devices', deviceObjectID);
    //公司编码
    deviceAVObject.set('companyCode', companyCode);
    //关联型号（含品牌）
    var modelAVObject = AV.Object.createWithoutData('Models', modelObjectID);
    deviceAVObject.set('dependentModel', modelAVObject);
    //系统版本
    deviceAVObject.set('OSVersion', OSVersion);
    deviceAVObject.save().then(function (result) {
      var userAVObject = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
      that.addMessageAction(userAVObject, null, "edit", deviceAVObject);
      success? success(result):null;
    }, function (error) {
      fail ? fail(error) : null;
    });
  },

  //添加一个状态
  addDevicesStatus: function (deviceObjectID, status, { success, fail }) {
  var that = this;
  var deviceAVObject = AV.Object.createWithoutData('Devices', deviceObjectID);
  var timestamp = Date.parse(new Date());
  var devicesStatusAVObject = new AV.Object('DevicesStatus');
  devicesStatusAVObject.set('status', status); //0闲置，-1 申请中，-2借出，-3归还中 -99删除
  devicesStatusAVObject.set('actionTimestamp', timestamp);//当前操作时间
  //关联借用人
  var dependentActionUserAVObject = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
  devicesStatusAVObject.set('dependentActionUser', dependentActionUserAVObject);//关联用户
  //关联设备
  devicesStatusAVObject.set('dependentDevice', deviceAVObject);///状态关联关联设备（双向关联）
  //关联状态
  deviceAVObject.set('dependentDevicesStatus', devicesStatusAVObject);
  deviceAVObject.save().then(function (result) {
    success ? success() : null;
  }, function (error) {
    fail ? fail() : null;
  });
  },


}

module.exports = leanCloud;