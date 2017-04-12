/**
 * api返回格式
 * {state : true , message : "" , xxx : {} , xxxx : {}}
 * {state : false , message : "" , xxx : {} , xxxx : {}}
 */

var ApiRequest = (function(ApiRequestList){
	var modules = function(ApiRequestList , option){
		this.ApiRequestList = ApiRequestList;
		this.AllOption = option;
	} , ApiRequestList = {} ,
		SelectApi = {},
		AllOption = {};

	var NameOption = {
		name : {
			apiName : "api-name",
			apiParamName : "api-param-name",
		},
		event : {
			click : "clickSubmit"
		}
	};





	/**
	 * 在此进行请求预准备
	 * @param  {[type]} api    [API名称]
	 * @param  {[type]} option [{
	 *    autoCommit 是否自动提交(bool)
	 *    target 自动获取参数的元素
	 * }]
	 * @param  {[type]} target [自定义获取API参数的元素]
	 */
	modules.prototype.push = function(apiName , option){
		this.SelectApi = uriGet(this.ApiRequestList , apiName);
		if(this.SelectApi == false) return reslut(false , "未能找到定义好的API" , {});


		var SelectApiParams = getFrom(apiName , option , this.SelectApi);
		var RuleReslut = rule(SelectApiParams , this.SelectApi.params);
		if(RuleReslut.length > 0) return reslut(false , RuleReslut[0].message , RuleReslut , 'rule_error');


		if(isset(option) && option.autoCommit == false){
			var SelectApi = this.SelectApi;
			return reslut(true , "" , {
				api : SelectApi,
				params : SelectApiParams
			} , 'ready');
		}

		return this.commit(this.SelectApi , SelectApiParams);
	}

	
	/**
	 * 提交用户的请求
	 * @param  {[type]} api    [description]
	 * @param  {[type]} params [description]
	 * @return {[type]}        [description]
	 */
	modules.prototype.commit = function(api , params){
		var promise = $.Deferred();
		doAjax({
			url : (isset(this.AllOption) && isset(this.AllOption.url) ? this.AllOption.url : '') + api.url,
			data : params , 
			type : isset(api.type) ? api.type : "POST",
			dataType : isset(api.dataType) ? api.dataType : "JSON",
			timeOut : isset(api.timeOut) ? api.timeOut : 5000,
			promise: promise,
		});
		return promise;
	}



	/**
	 * 用于绑定按钮的事件请求
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
	var eventPush = function(data){
		// var SelectApiParams = getFrom(data.apiName , data.option , data.SelectApi);
		// var RuleReslut = rule(SelectApiParams , data.SelectApi.params);
		// if(RuleReslut.length > 0) return reslut(false , RuleReslut[0].message , RuleReslut , 'rule_error');
		

		// if(isset(data.option) && data.option.autoCommit == false){
		// 	alert('x')
		// 	return reslut(true , "" , {
		// 		api : data.SelectApi,
		// 		params : SelectApiParams
		// 	} , 'ready');
		// }


		// var promise = $.Deferred();
		// doAjax({
		// 	url : api.url,
		// 	data : params , 
		// 	type : isset(api.type) ? api.type : "POST",
		// 	dataType : isset(api.dataType) ? api.dataType : "JSON",
		// 	timeOut : isset(api.timeOut) ? api.timeOut : 5000,
		// 	promise: promise,
		// });
		// return this.commit(this.SelectApi , SelectApiParams);
	}
	



	/**
	 * 向后端发送处理请求
	 * @param  {[type]} options [description]
	 * @param  {[type]} isfile  [description]
	 * @return {[type]}         [description]
	 */
	var doAjax = function(options){
		$.ajax({
			url : options.url , 
			data : options.data , 
			cache: false,
			type: options.type,
			contentType: "application/x-www-form-urlencoded; charset=UTF-8",
			dataType: options.dataType,
			timeOut : options.timeOut, 
			content : window,
			success : function(data){
				if(data.state){
					options.promise.resolve(data);
				}else{
					if(isset(data.message)){
						options.promise.reject({
							message : "请求出现异常，接口服务器尚未反馈错误信息，请稍候再试！"
						});
					}else{
						options.promise.reject({
							message : data.message
						});
					}
				}
			},
			error : function(data){
				try{
					var error = JSON.parse(data.responseText);
					options.promise.reject({
						message : error.message
					});
				}catch (e){
					options.promise.reject({
						message : "请求出现异常，服务器繁忙或出现问题无法处理您的请求，请稍候再试！"
					});
				}
			},
			complete : function(){
				isRequest = true;
			}
		});
	}



	/**
	 * 处理提交成功后的自动刷新或跳转
	 * @param  {[type]} url [description]
	 * @return {[type]}     [description]
	 */
	modules.prototype.success = function(url){
		setTimeout(function(){
			if(url == '' || typeof url == 'undefined'){
				window.location.reload()
			}else{
				window.location.href = url
			}
		} , ! isNaN(url) ? url : 1000)
	}


	/**
	 * 检测用户输入规范
	 * @param  {[type]} params [description]
	 * @param  {[type]} rule   [description]
	 */
	var rule = function(params , rule){
		var toastText = {
			header : '您输入的' , 
			rule : {
				min : '不能少于' ,
				max : '不能大于' ,
				nullText : '不能为空' ,
				error : '规则不正确' ,
			} , 
			sum : '位字符',
			footer : ''
		};
		var error = [];

		$.each(params , function(key , param){
			if(key == 'uriGet') return;
			var thisRule = rule[key];
			var param = params[key];
			var thisName = toastText.header + thisRule.name;
			var message = '';
			var length = param.length;
			if( ! isset(thisRule) || ! isset(thisRule['name'])) return false;

			if(isset(thisRule.is_null) && thisRule.is_null == true && length == 0){
				error.push({message : thisName + toastText.rule.nullText , data : thisRule.other});
			}else if(isset(thisRule.min) && length < thisRule.min){
				error.push({message : thisName + toastText.rule.min + thisRule.min + toastText.sum , data : thisRule.other});
			}else if(isset(thisRule.max) && length > thisRule.max){
				error.push({message : thisName + toastText.rule.max + thisRule.max + toastText.sum , data : thisRule.other});
			}else if(isset(thisRule.is_number) && thisRule.is_number == true &&  (! isNaN(rule[key]) || value < thisRule.number_min || value > thisRule.number_max )){
				error.push({message : thisName + toastText.rule.error , data : thisRule.other});
			}

		});
		return error;
	}



	/**
	 * 获取用户提供的表单内的数据
	 * @param  {[type]} apiName [description]
	 * @param  {[type]} option  [description]
	 */
	var getFrom = function(apiName , option){
		var apiParamName = NameOption.name.apiParamName;
		var target = ! (isset(option) && isset(option.target))
			? "[" + NameOption.name.apiName + "='" + apiName + "']" 
			: option.target ,
		apiParamsTemp = {};
		$(target + " [" + apiParamName + ']').each(function(key , value){
			apiParamsTemp[$(value).attr(apiParamName)] = $(value).val()
		});
		return apiParamsTemp;
	}


	/**
	 * 用于反馈给用户的一个结果
	 * @param  {[type]} static  [description]
	 * @param  {[type]} message [description]
	 * @param  {[type]} data    [description]
	 * @param  {[type]} code    [description]
	 */
	var reslut = function(static , message , data , code){
		then = function(success , error){
			var returnParams = {
				message : message,
				data : data ,
				code : code ,
			};
			if(static){
				if(typeof success == 'function') success(returnParams);
			}else{
				if(typeof error == 'function') error(returnParams)
			}
		}
		return this;
	}


	var isset = function(context){
		return typeof context !== 'undefined';
	}
	uriGet = function(apiList , uri){
		var temp = apiList;
		var uri = uri.split('/');
		$.each(uri , function(key , value){
			temp = temp[value];
		});
		return typeof temp == 'undefined' ? false : temp;
	}

	return modules;
})(jQuery);