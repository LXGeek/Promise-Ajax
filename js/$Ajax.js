;(function () {
    var $Ajax = function (options) {
        this.config = {
            url: '',
            type: 'get',
            async: true,
            dataType: 'json',
            contentType: 'application/json',
            data: {}
        };
        this.start(options);
    };

    var xhr = null;

    $Ajax.init = function (options) {
        new $Ajax(options);
    };

    $Ajax.prototype = {
        constructor: $Ajax,
        createXHR: function () {
            if(typeof XMLHttpRequest != 'undefined'){
                return new XMLHttpRequest();
            } else {
                throw new Error('No XHR object available！');
            }
        },
        start: function (options) {
            xhr = this.createXHR();
            if(options.url){
                this.config.url = options.url;
            } else {
                throw new Error("url cannot be null!");
            }
            if(options.type){
                this.config.type = options.type;
            }
            if(options.async){
                this.config.async = options.async;
            }
            if(options.dataType){
                this.config.dataType = options.dataType;
            }
            if(options.data){
                this.config.data = options.data;
            }
            if(options.success){
                this.config.success = options.success;
            }
            if(options.error){
                this.config.error = options.error;
            }
            if(options.beforeSend){
                options.beforeSend();
            }

            var complete = function () {
                return new Promise(function (resolve, reject) {
                    if(xhr.readyState == 4){
                        if((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304){
                            resolve(options.success(xhr.responseText));
                        }
                    } else {
                        if(options.error){
                            resolve(options.error());
                        } else {
                            throw new Error("Request was unsucessful:"+xhr.status);
                        }
                    }
                });
            }

            if(this.config.dataType == 'json' || this.config.dataType == 'JSON'){   //  非跨域处理
                if((this.config.type == 'get') || (this.config.type == 'GET')){
                    for(var item in this.config.data){
                        this.config.url = addURLParam(this.config.url, item, this.config.data[item]);
                    }

                    xhr.onreadystatechange = complete;
                    xhr.open(this.config.type, this.config.url, this.config.async);
                    xhr.send(null);
                }

                if((this.config.type == 'post') || (this.config.type == 'POST')){
                    xhr.addEventListener('readystatechange', complete, false);
                    xhr.open(this.config.type, this.config.url, this.config.async);

                    if(options.contentType){
                        this.config.contentType = options.contentType;
                    }

                    xhr.setRequestHeader('Content-Type', this.config.contentType);
                    xhr.send(serialize(this.config.data));
                }

            } else if (this.config.dataType == 'jsonp' || this.config.dataType == 'JSONP'){   //  跨域处理
                if((this.config.type == 'get') || (this.config.type == 'GET')){ //  jsonp只能进行get请求跨域

                    //  创建script标签
                    var cbName = 'callback';
                    var timer = null;
                    var head = document.getElementsByTagName('head')[0];
                    var scriptTag = document.createElement('script');

                    this.config.callback = cbName;
                    head.appendChild(scriptTag);

                    //  创建jsonp的回调函数
                    window[cbName] = function (json) {
                        head.removeChild(scriptTag);
                        clearTimeout(timer);
                        window[cbName] = null;
                        options.success && options.success(json);
                    };

                    //  超时处理
                    if(options.time){
                        timer = setTimeout(function () {
                            head.removeChild(scriptTag);
                            options.fail && options.fail({message: "Over time！"});
                            window[cbName] = null;
                        }, options.time);
                    }

                    this.config.url = this.config.url + "?callback=" + cbName;

                    for(var item in this.config.data){
                        this.config.url = addURLParam(this.config.url,item,this.config.data[item]);
                    }

                    scriptTag.src = this.config.url;
                }
            } else {
                throw new Error('dataType is error!');
            }
        }
    };

    function addURLParam(url, name, value) {
        url += (url.indexOf('?') == -1 ? '?' : '&');
        url += encodeURIComponent(name) + '=' + encodeURIComponent(value);
        return url;
    }

    //  序列化函数
    function serialize(data) {
        var str = '';

        for(var item in data){
            str += item + '=' + data[item] + '&';
        }
        return str.slice(0, str.length - 1);
    }

    window.$Ajax = $Ajax;
})();