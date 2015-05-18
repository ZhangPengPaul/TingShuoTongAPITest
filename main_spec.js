var 登录登出测试=require('./user_spec.js').tests;
var 作业测试=require('./homework_spec.js').tests;

//console.log(process.argv[0], ",", process.argv[2]);
登录登出测试();
作业测试();
