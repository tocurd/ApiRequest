

var ApiRequest = (function(ApiRequestList){


	var Rule = {};
	var deBug = true;
	var ApiRequestData = {};
	var ApiRequestRuleAttribute = ['is_null' , 'is_number' , 'type' , 'max' , 'min' , 'name'];
	var ApiRequestAttribute = ['url' , 'method'];
	var ApiName = '';
	var config = {
		name : {
			apiName : "api-name",
			apiParamName : "api-param-name",
			apiEvent : "api-event",
		},
		event : {
			click : "clickSubmit"
		}
	};





	var modules = function(ApiRequestList , option){
		ApiRequestData.ApiRequestList = ApiRequestList;
		ApiRequestData.option = option;

		if(isset(option) && isset(option.event) && option.event){
			$(replace("[$='$']" , [config.name.apiEvent , config.event.click])).each(function(key , value){
				$(value).click(function(){
					option.start($(value).attr('api-name') , data)
					ApiRequest.push($(value).attr('api-name')).then(function(data){
						option.success($(value).attr('api-name') , data)
					} , function(data){
						option.error($(value).attr('api-name') , data)
					});
				})
			})
		}
	}




	modules.prototype.push = function(apiName , option){
		if( ! isset(option)) option = {};

		ApiRequestData.SelectApi = uriGet(ApiRequestData.ApiRequestList , apiName);


		// 去获取页面内表单的数据
		var from_data = this.getApiFrom(apiName);
		if(from_data != false) $.each(from_data , function(key , value){
			ApiRequestData.SelectApi[key] = 
			typeof value == 'object' ? 
			$.extend(true , ApiRequestData.SelectApi[key] , from_data[key]) : value;
		})

		if(ApiRequestData.SelectApi == false) return reslut(false , apiName + " 未能找到定义好的API");



		// 合并表单内的数据
		$.each(ApiRequestAttribute , function(key , value){
			if(ApiRequestData.SelectApi[value] && ApiRequestData.SelectApi[value] != ''){
				option[value] = isset(ApiRequestData.SelectApi[value]) && ApiRequestData.SelectApi[value] != '' ? ApiRequestData.SelectApi[value] : (isset(option[value]) ? option[value] : '')
			}
		});



		// 对用户输入的数据进行规范性检测
		var RuleReslut = rule(ApiRequestData.SelectApi.params , ApiRequestData.SelectApi.rule , ApiRequestData.SelectApi.element);
		if(RuleReslut.length > 0) return reslut(false , RuleReslut[0].message , RuleReslut , 'rule_error');




		// 将用户输入的参数与系统获取的参数合并
		if(isset(option) && isset(option.params)){
			ApiRequestData.SelectApi.params = $.extend(ApiRequestData.SelectApi.params , option.params);
		}


		// 开始提交
		var promise = $.Deferred();
		var url = apiName.replace('\\' , '/').toLowerCase();


		if(isset(option) && isset(option.url)){
			url = option.url;
			if(url.indexOf("http://") < 0){
				if(isset(ApiRequestData.option) && isset(ApiRequestData.option.url)){
					url = ApiRequestData.option.url + url;
				}
			}
		}else{
			url = (isset(ApiRequestData.option) && isset(ApiRequestData.option.url) ? ApiRequestData.option.url : '') + url
		}



		doAjax({
			url : url,
			data : ApiRequestData.SelectApi.params , 
			type : isset(option) && isset(option.type) ? option.type : "POST",
			dataType :isset(option) && isset(option.dataType) ? api.dataType : "JSON",
			timeOut :isset(option) && isset(option.timeOut) ? api.timeOut : 5000,
			promise: promise,
		});
		return promise;
	}



	/**
	 * 处理提交成功后的自动刷新或跳转
	 * @param  {[type]} url [description]
	 * @return {[type]}     [description]
	 */
	modules.prototype.success = function(url , time){
		setTimeout(function(){
			if(url == '' || typeof url == 'undefined'){
				window.location.reload()
			}else{
				window.location.href = url
			}
		} , isset(time) ? time : 1000)
	}




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
	 * 获取页面中定义的API
	 * @param  {[type]} apiName [description]
	 * @return {[type]}         [description]
	 */
	modules.prototype.getApiFrom = function(apiName){
		var $api = $(replace("[$='$']" , [config.name.apiName , apiName]));
		var $apiParams = $api.find(replace("[$]" , [config.name.apiParamName]));
		var params = {};
		var element = {};
		var rule = {};


		$.each($apiParams , function(key , value){
			var $value = $(value);
			var val =  ! isset($value.attr('data')) ? $(value).val() : $value.attr('data');
			params[$(value).attr(config.name.apiParamName)] = val;
			element[$(value).attr(config.name.apiParamName)] = $(value);

			rule[$(value).attr(config.name.apiParamName)] = {};
			$.each(ApiRequestRuleAttribute , function(type_key , type_value){
				if(isset($value.attr(type_value))){
					rule[$(value).attr(config.name.apiParamName)][type_value] = $value.attr(type_value);
				}
			})
		})

		if(params.length <= 0 || rule.length <= 0) return false;
		var data = {};
		$.each(ApiRequestAttribute , function(api_key , api_value){
			if(isset($api.attr(api_value))){
				data[api_value] = $api.attr(api_value);
			}
		});

		data.rule = rule;
		data.params = params;
		data.element = element;
		return data;
	}




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

			if(isset(thisRule.is_null) && thisRule.is_null == false && length == 0){
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
	 * 用于反馈给用户的一个结果
	 * @param  {[type]} static  [description]
	 * @param  {[type]} message [description]
	 * @param  {[type]} data    [description]
	 * @param  {[type]} code    [description]
	 */
	var reslut = function(static , message , data){
		then = function(success , error){
			var returnParams = {
				message : message,
				data : data ,
			};
			if(static){
				if(typeof success == 'function') success(returnParams);
			}else{
				if(deBug) console.error(message);
				if(typeof error == 'function') error(returnParams)
			}
		}
		return this;
	}



	var isset = function(context){
		return typeof context !== 'undefined';
	}

	var replace = function(text , array){
		var text = text.split('');
		var index = 0;
		$.each(text , function(key , value){
			if(value == "$"){
				text.splice(key , 1 , array[index]);
				index ++;
			}
		});
		return text.join('');
	}


	var uriGet = function(apiList , uri){
		var temp = apiList;
		var uri = uri.split('/');
		for(value in uri){
			if(typeof temp[uri[value]] == 'undefined'){
				return false;
			}
			temp = temp[uri[value]];
		}
		return typeof temp == 'undefined' ? false : temp;
	}

	return modules;
})(jQuery);