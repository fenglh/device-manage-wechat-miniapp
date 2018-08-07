
const AV = require('./av-live-query-weapp-min');
const app = getApp()

var leanCloud = {
  
  addMessageAction: function (source, destination, action, device) {
    //申请借用、拒绝、同意申请、归还提交、归还确认、增、删、改 分别对应
    //applying、cancel、rejected、borrowed、returning、returned、add、delete、edit
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
  addDevicesStatus: function (device, status, action, { success, fail }) {
    var that = this;
    var deviceAVObject = AV.Object.createWithoutData('Devices', device.deviceObjectID);
    var timestamp = Date.parse(new Date());
    var devicesStatusAVObject = new AV.Object('DevicesStatus');
    devicesStatusAVObject.set('status', status); //0闲置，-1 申请中，-2借出，-3归还中 -99删除
    devicesStatusAVObject.set('action', action);
    devicesStatusAVObject.set('actionTimestamp', timestamp);//当前操作时间
    //关联借用人
    var dependentActionUserAVObject = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    devicesStatusAVObject.set('dependentActionUser', dependentActionUserAVObject);//关联用户
    //关联设备
    devicesStatusAVObject.set('dependentDevice', deviceAVObject);///状态关联关联设备（双向关联）
    //关联状态
    deviceAVObject.set('dependentDevicesStatus', devicesStatusAVObject);
    deviceAVObject.save().then(function (result) {
      success ? success(result) : null;
    }, function (error) {
      fail ? fail() : null;
    });
  },


  getDevices: function ({ success, fail }) {

    var that = this;
    var query = new AV.Query('Devices');
    query.include(['dependentModel.dependent']);
    query.include(['dependentUser']);
    query.include(['dependentDevicesStatus.dependentActionUser']);

    //内嵌查询,匹配 != -99 且，状态不存在的记录
    var innerQuery = new AV.Query('DevicesStatus');
    innerQuery.equalTo('status', -99);
    query.doesNotMatchQuery('dependentDevicesStatus', innerQuery);

    query.find().then(function (results) {

      var devices = [];
      if (results.length > 0) {
        results.forEach(function (item, index) {
          //设备信息
          var deviceObjectID = item.id;
          var deviceID = item.get('deviceID');
          var OSVersion = item.get('OSVersion');
          var companyCode = item.get('companyCode');
          //型号
          var modelObjectID = item.get('dependentModel') ? item.get('dependentModel').id : null;
          var model = item.get('dependentModel') ? item.get('dependentModel').get('model') : null;
          //品牌
          var brand = item.get('dependentModel') ? (item.get('dependentModel').get('dependent') ? item.get('dependentModel').get('dependent').get('brand') : null) : null;
          //状态
          var status = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').get('status') : null;
          var statusObjectID = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').id : null;

          var statusObjectID = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').id : null;
          var statusActionTimestamp = item.get('dependentDevicesStatus') ? item.get('dependentDevicesStatus').get('actionTimestamp') : null;

          var statusActionEmployeeObjectID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentActionUser') ? item.get('dependentDevicesStatus').get('dependentActionUser').id : null) : null;
          var statusActionEmployeeID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentActionUser') ? item.get('dependentDevicesStatus').get('dependentActionUser').get('employeeID') : null) : null;
          var statusActionEmployeeObjectName = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentActionUser') ? item.get('dependentDevicesStatus').get('dependentActionUser').get('employeeName') : null) : null;

          //用户信息
          var employeeObjectID = item.get('dependentUser') ? item.get('dependentUser').id : null;
          var employeeID = item.get('dependentUser') ? item.get('dependentUser').get('employeeID') : null;
          var employeeName = item.get('dependentUser') ? item.get('dependentUser').get('employeeName') : null;
          var employeeOpenID = item.get('dependentUser') ? item.get('dependentUser').get('openID') : null;
          var obj = {};
          obj.deviceObjectID = deviceObjectID;
          obj.deviceID = deviceID;
          obj.OSVersion = OSVersion;
          obj.companyCode = companyCode;
          obj.modelObjectID = modelObjectID;
          obj.model = model;
          obj.brand = brand;

          obj.status = status;
          obj.statusObjectID = statusObjectID;
          obj.statusActionTimestamp = statusActionTimestamp && that.formatDateTime(statusActionTimestamp);
          obj.statusActionEmployeeObjectID = statusActionEmployeeObjectID;
          obj.statusActionEmployeeID = statusActionEmployeeID;
          obj.statusActionEmployeeObjectName = statusActionEmployeeObjectName;

          obj.employeeObjectID = employeeObjectID;
          obj.employeeID = employeeID;
          obj.employeeName = employeeName;
          obj.employeeOpenID = employeeOpenID;
          devices.push(obj);
        });
        //排序
        devices.sort(function (a, b) {
          //降序
          return b.status - a.status;
        });
      }
      success?success(devices):null;

    }, function (error) {
      fail ? fail(error) : null;
    });
  },



  //我的设备数量
  getMyDevicesCount: function ({ success, fail }) {

    var that = this;
    var user = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    var query = new AV.Query('Devices');
    query.equalTo('dependentUser', user);

    //内嵌查询,匹配 != -99 的记录
    var innerQuery = new AV.Query('DevicesStatus');
    innerQuery.equalTo('status', -99);
    query.doesNotMatchQuery('dependentDevicesStatus', innerQuery);
    query.count().then(function (count) {
      success ? success(count) :null;
    }, function (error) {
      fail ? fail(error) : null;
    });
  },

  //借用设备数量
  getBorrowedDeviceCount: function ({ success, fail }) {
    var that = this;
    //组合加内嵌查询
    var innerQuery1 = new AV.Query('DevicesStatus');
    innerQuery1.notEqualTo('status', 0);
    var innerQuery2 = new AV.Query('DevicesStatus');
    innerQuery2.notEqualTo('status', -99);
    var innerQuery12 = AV.Query.and(innerQuery1, innerQuery2);

    var innerQuery3 = new AV.Query('DevicesStatus');
    var borrowedUser = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    innerQuery3.equalTo('dependentActionUser', borrowedUser);
    var query = new AV.Query('Devices');

    var query123 = AV.Query.and(innerQuery12, innerQuery3);

    //执行内嵌操作
    query.matchesQuery('dependentDevicesStatus', query123);
    query.count().then(function (count) {
      success ? success(count) : null;
    }, function (error) {
      fail ? fail(error) : null;
    });
  },


}

module.exports = leanCloud;