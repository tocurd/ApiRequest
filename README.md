# ApiRequest  
ApiRequest是为了简化前端开发中遇到的复杂重复的ajax请求而开发的插件，其能够有效的帮助开发者简单快速的创建一个ajax请求。  
并且ApiRequest会在请求的过程中会对用户输入的数据进行简单的前端检测处理，保证发送给后端的数据是规范正确的数据（后端需同样进行数据的检测）

## ApiRequest Html 结构
```html
<div api-name='User/Login' id="api-login">
	<input type="text" api-param-name="username" value="dsadas">
	<input type="password" api-param-name="password" value="dsadas">
	<button id="js-login">登陆1</button>
	<button api-event="clickSubmit">登陆2</button>
</div>
```

### 创建ApiRequest
```javascript
var ApiRequest = new ApiRequest({
	User : {
		Login : {
			url : 'login.php',
			params : {
				username : {max : 16 , min : 5 , name : '用户名'},
				password : {max : 16 , min : 5 , name : '密码'},
			}
		}
	}
} , {
	url : 'http://test.tocurd.com/',
});
```
  

### 直接将数据提交
```javascript
$("#js-login").click(function(){
	ApiRequest.push("User/Login").then(function(reslut){
		console.log(reslut)
	} , function(data){
		console.log(data)
	});
})
```
  

### 对数据进行二次处理后进行提交
```javascript
$("[api-event='clickSubmit']").click(function(){
	ApiRequest.push("User/Login",{
		autoCommit : false
	}).then(function(reslut){
		reslut.data.params.username = 'tocurd';

		ApiRequest.commit(reslut.data.api , reslut.data.params).then(function(data){
			console.log(data)
		}, function(data){
			console.log(data)
		})

	} , function(data){
		console.log(data)
	});
})
```