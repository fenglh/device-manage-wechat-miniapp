
const AV = require('./av-live-query-weapp-min');
const app = getApp()

var leanCloud = {



  checkBindEmployeeInfo: function ({ openid, success, fail }) {
    //在获取了openid的情况下，检查绑定关系
    if (!openid) {
      fail ? fail("openid 为空") : null
      return;
    }
    var that = this;
    var query = new AV.Query('Users');
    query.equalTo('openID', openid);
    query.first().then(function (result) {
      if (!result) {
        success ? success(null) : null
      } else {
        success ? success(result) : null
      }
    }, function (error) {
      fail ? fail(error) : null;
    });
  },


  addDevice: function (deviceCode, companyCode, modelObjectID, osVersion,remark, { success, fail }){

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
    remark?deviceAVObject.set('remark', remark):null;
    deviceAVObject.save().then(function (deviceObject) {

      that.addDoDevicesStatus(deviceObject.id, null,0, "add", {
        success:function(result){
          success ? success(result) : null;
        },
        fail:function(error){
          fail ? fail(error) : null;
        }
      });
    }, function (error) {
      fail ? fail(error) : null;
    });
  },

  //编辑设备
  editDevice: function (deviceObjectID, companyCode,modelObjectID, OSVersion,remark, {success, fail}){
    var that = this;
    var deviceAVObject = AV.Object.createWithoutData('Devices', deviceObjectID);
    //公司编码
    deviceAVObject.set('companyCode', companyCode);
    //关联型号（含品牌）
    var modelAVObject = AV.Object.createWithoutData('Models', modelObjectID);
    deviceAVObject.set('dependentModel', modelAVObject);
    //系统版本
    deviceAVObject.set('OSVersion', OSVersion);
    deviceAVObject.set('remark', remark);
    deviceAVObject.save().then(function (result) {
      that.addDoDevicesStatus(deviceObjectID,null,0, "edit", {
        success:function(result){
          //增加编辑状态成功
          success ? success(result) : null;
        },
        fail:function(error){
          //增加编辑状态失败
          fail ? fail(error) : null;
        }
      });
    }, function (error) {
      fail ? fail(error) : null;
    });
  },


  addDoDevicesStatus: function (deviceObjectID,borrowUserObjectID, status, action, { success, fail }) {
    var that = this;
    var deviceAVObject = AV.Object.createWithoutData('Devices', deviceObjectID);
    var timestamp = Date.parse(new Date());
    var devicesStatusAVObject = new AV.Object('DevicesStatus');
    devicesStatusAVObject.set('status', status); //0闲置，-1 申请中，-2借出，-3归还中 -99删除
    devicesStatusAVObject.set('action', action);
    devicesStatusAVObject.set('actionTimestamp', timestamp);//当前操作时间
    //关联操作人
    var dependentActionUserAVObject = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    devicesStatusAVObject.set('dependentActionUser', dependentActionUserAVObject);//关联用户
    //关联（借用人）
    if (borrowUserObjectID){
      var dependentBorrowUserAVObject = AV.Object.createWithoutData('Users', borrowUserObjectID);
      devicesStatusAVObject.set('dependentBorrowUser', dependentBorrowUserAVObject);//关联用户
    }

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

  //批量配置型号
  test:function(){
    var query = new AV.Query('Models');
    query.ascending('brandID');
    // query.skip(100);//查询限制是一次100条，总数量是148条，所以剩下的要第二次跳过前面100条继续批量插入
    query.find().then(function(results){
      console.log("查询结果",results);
      var brand1000 = AV.Object.createWithoutData('Brands', "5b45b2e9fe88c200350738c5");//苹果
      var brand1001 = AV.Object.createWithoutData('Brands', "5b45b2f5ee920a003b383b51");//华为
      var brand1002 = AV.Object.createWithoutData('Brands', "5b45b2f9ee920a003b250388"); //小米

      var brand1010 = AV.Object.createWithoutData('Brands', "5b4d43eb67f35600352f761f");//三星
      var brand1009 = AV.Object.createWithoutData('Brands', "5b45c05eee920a003b261524");//魅族
      var brand1007 = AV.Object.createWithoutData('Brands', "5b45b3689f5454003b212ee9");//酷派
      var brand1008 = AV.Object.createWithoutData('Brands', "5b45c024ee920a003b2610b8");//中兴
      var brand1006 = AV.Object.createWithoutData('Brands', "5b45b35cee920a003b384112");//oppo

      var brand1005 = AV.Object.createWithoutData('Brands', "5b45b3069f5454003b7755b4");//联想
      var brand1004 = AV.Object.createWithoutData('Brands', "5b45b3010b6160003c3e3c58");//锤子
      var brand1003 = AV.Object.createWithoutData('Brands', "5b45b2fc9f5454003b775556");//vivo

      results.forEach(function(item, index){

        var modelAVObject = AV.Object.createWithoutData('Models', item.id);
        var brandID =item.get("brandID");
        if (brandID == "1000"){
          modelAVObject.set('dependent', brand1000);
        }else if (brandID == "1001") {
          modelAVObject.set('dependent', brand1001);
        }else if (brandID == "1002") {
          modelAVObject.set('dependent', brand1002);
        }else if(brandID == "1003"){
          modelAVObject.set('dependent', brand1003);
        } else if (brandID == "1004") {
          modelAVObject.set('dependent', brand1004);
        } else if (brandID == "1005") {
          modelAVObject.set('dependent', brand1005);
        } else if (brandID == "1006") {
          modelAVObject.set('dependent', brand1006);
        } else if (brandID == "1007") {
          modelAVObject.set('dependent', brand1007);
        } else if (brandID == "1008") {
          modelAVObject.set('dependent', brand1008);
        } else if (brandID == "1009") {
          modelAVObject.set('dependent', brand1009);
        } else if (brandID == "1010") {
          modelAVObject.set('dependent', brand1010);
        } 

        modelAVObject.save().then(function(result){
          console.log('保存成功');
        }, function(error){
          console.log('保存失败');
        });
        
      });
    }, function(error){

    });
  },

  getDevices: function ({ success, fail }) {

    var that = this;
    var query = new AV.Query('Devices');
    query.include(['dependentModel.dependent']);
    query.include(['dependentUser']);
    query.include(['dependentDevicesStatus.dependentActionUser']);
    query.include(['dependentDevicesStatus.dependentBorrowUser']);

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
          var remark = item.get('remark');
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
          //状态操作人
          var statusActionEmployeeObjectID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentActionUser') ? item.get('dependentDevicesStatus').get('dependentActionUser').id : null) : null;
          var statusActionEmployeeID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentActionUser') ? item.get('dependentDevicesStatus').get('dependentActionUser').get('employeeID') : null) : null;
          var statusActionEmployeeObjectName = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentActionUser') ? item.get('dependentDevicesStatus').get('dependentActionUser').get('employeeName') : null) : null;

          //设备借用人
          var borrowEmployeeObjectID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentBorrowUser') ? item.get('dependentDevicesStatus').get('dependentBorrowUser').id : null) : null;
          var borrowEmployeeID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentBorrowUser') ? item.get('dependentDevicesStatus').get('dependentBorrowUser').get('employeeID') : null) : null;
          var borrowEmployeeObjectName = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentBorrowUser') ? item.get('dependentDevicesStatus').get('dependentBorrowUser').get('employeeName') : null) : null;

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
          obj.remark = remark;
          obj.modelObjectID = modelObjectID;
          obj.model = model;
          obj.brand = brand;

          obj.status = status;
          obj.statusObjectID = statusObjectID;
          obj.statusActionTimestamp = that.formatDateTime(statusActionTimestamp)

          obj.borrowEmployeeObjectID = borrowEmployeeObjectID;
          obj.borrowEmployeeID = borrowEmployeeID;
          obj.borrowEmployeeObjectName = borrowEmployeeObjectName;

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


  // ok
  getBorrowedDevices: function ({ success, fail }) {
    var that = this;

    //组合加内嵌查询
    var innerQuery1 = new AV.Query('DevicesStatus');
    innerQuery1.notEqualTo('status', 0);
    var innerQuery2 = new AV.Query('DevicesStatus');
    innerQuery2.notEqualTo('status', -99);
    var innerQuery12 = AV.Query.and(innerQuery1, innerQuery2);

    var innerQuery3 = new AV.Query('DevicesStatus');
    var borrowedUser = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    innerQuery3.equalTo('dependentBorrowUser', borrowedUser);
    var query = new AV.Query('Devices');

    var query123 = AV.Query.and(innerQuery12, innerQuery3);

    //执行内嵌操作
    query.matchesQuery('dependentDevicesStatus', query123);
    query.include(['dependentModel.dependent']);
    query.include(['dependentUser']);
    query.include(['dependentDevicesStatus.dependentActionUser']);
    query.include(['dependentDevicesStatus.dependentBorrowUser']);

    query.find().then(function (results) {

      var devices = [];
      if (results.length > 0) {
        
        results.forEach(function (item, index) {
          //设备信息
          var deviceObjectID = item.id;
          var deviceID = item.get('deviceID');
          var OSVersion = item.get('OSVersion');
          var companyCode = item.get('companyCode');
          var remark = item.get('remark');
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


          //设备借用人
          var borrowEmployeeObjectID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentBorrowUser') ? item.get('dependentDevicesStatus').get('dependentBorrowUser').id : null) : null;
          var borrowEmployeeID = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentBorrowUser') ? item.get('dependentDevicesStatus').get('dependentBorrowUser').get('employeeID') : null) : null;
          var borrowEmployeeObjectName = item.get('dependentDevicesStatus') ? (item.get('dependentDevicesStatus').get('dependentBorrowUser') ? item.get('dependentDevicesStatus').get('dependentBorrowUser').get('employeeName') : null) : null;


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
          obj.remark = remark;
          obj.modelObjectID = modelObjectID;
          obj.model = model;
          obj.brand = brand;

          obj.status = status;
          obj.statusObjectID = statusObjectID;
          obj.statusActionTimestamp = that.formatDateTime(statusActionTimestamp);
          obj.statusActionEmployeeObjectID = statusActionEmployeeObjectID;
          obj.statusActionEmployeeID = statusActionEmployeeID;
          obj.statusActionEmployeeObjectName = statusActionEmployeeObjectName;

          obj.borrowEmployeeObjectID = borrowEmployeeObjectID;
          obj.borrowEmployeeID = borrowEmployeeID;
          obj.borrowEmployeeObjectName = borrowEmployeeObjectName;

          obj.employeeObjectID = employeeObjectID;
          obj.employeeID = employeeID;
          obj.employeeName = employeeName;
          obj.employeeOpenID = employeeOpenID;
          devices.push(obj);
          console.log(devices);
        });
        //排序
        devices.sort(function (a, b) {
          //降序
          return b.status - a.status;
        });
      } 
      success ? success(devices) : null;

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
    innerQuery3.equalTo('dependentBorrowUser', borrowedUser);
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

  //检查自己是否是管理员
  isAdmin: function ({ success, fail }){
    var query = new AV.Query('AdminUsers');
    var user = AV.Object.createWithoutData('Users', app.globalData.employeeInfo.employeeObjectID);
    query.equalTo('dependentUser', user);
    query.first().then(function(result){
      success ? success(result) : null;
    }, function(error){
      fail ? fail(error) : null;
    });
  },

  //获取前30条日志记录
  getLogs: function ({ success, fail }){
    var query = new AV.Query('DevicesStatus');
    query.descending('actionTimestamp'); //降序
    query.limit(30);
    query.include(['dependentDevice.dependentModel']);
    query.include(['dependentActionUser']);
    query.find().then(function(results){
      success ? success(results) : null;
    },
    function(error){
      fail ? fail(error) : null;
    });
  },



  // ok
  formatDateTime: function (inputTime) {
    if(!inputTime){
      return inputTime;
    }
    var date = new Date(inputTime);
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    var h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    var minute = date.getMinutes();
    var second = date.getSeconds();
    minute = minute < 10 ? ('0' + minute) : minute;
    // second = second < 10 ? ('0' + second) : second; 
    return y + '-' + m + '-' + d + ' ' + h + ':' + minute;
  },

}

module.exports = leanCloud;