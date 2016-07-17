/*
 * @author: CastaMo
 * @last-edit-date: 2016-07-17
 * @depend: none
 *
 */

 (function(win, doc) {

    'use strict';

    // ----------------------------------------- 辅助函数 start-------------------------------------------------

    function is(obj, type) {
        var toString = Object.prototype.toString,
            undefined;
        return (type === 'Null' && obj === null) ||
            (type === "Undefined" && obj === undefined) ||
            toString.call(obj).slice(8, -1) === type;
    }
    /*
     * 深拷贝函数
     * @param {Object} oldObj: 被拷贝的对象
     * @param {Object} newObj: 需要拷贝的对象
     * @ return {Object} newObj: 拷贝之后的对象
     */
    function extend(oldObj, newObj) {
        for (var key in oldObj) {
            var copy = oldObj[key];
            if (oldObj === copy || key in newObj) continue; //如window.window === window，会陷入死循环，需要处理一下
            if (is(copy, "Object")) {
                newObj[key] = extend(copy, newObj[key] || {});
            } else if (is(copy, "Array")) {
                newObj[key] = [];
                newObj[key] = extend(copy, newObj[key] || []);
            } else {
                newObj[key] = copy;
            }
        }
        return newObj;
    }

    // ----------------------------------------- 辅助函数 end-------------------------------------------------

    var ImageBuffer;

    ImageBuffer = (function() {


    	/*
		 * 默认配置:
		 *
		 * 当前正在加载的数量
		 * 最大加载数量
		 * 该数组用于给对应的ImageBuffer提供现有的id，并且循环使用，保证互不冲突
		 * 等待队列，用于存放将要加载图片的对象
		 * 运行加载的容器，为了在移除对象的阶段提高效率，这里用键值对来加快查找速率，结合上述_indexArr一起使用
    	 */
        var _staticConfig = {
        	currentLoadingNumber  	: 0,
        	maxLoadingNumber 		: 5,
        	indexArr 				: [0, 1, 2, 3, 4],
        	waitingQueue 			: [],
        	runningContainer 		: []
        };

        //检查当前是否可进行Loading
        var _checkForLoading = function() {
        	//等待队列为空或加载数量达到极限时, 不执行
        	if (	_staticConfig.waitingQueue.length === 0
        		|| 	_staticConfig.currentLoadingNumber >= _staticConfig.maxLoadingNumber) {
        		return;
        	}
        	_staticConfig.currentLoadingNumber++;

        	//从waiting队列头取出将要加载图片的对象, 进行一系列初始化的工作
        	var readyObject = _staticConfig.waitingQueue.shift();
        	readyObject.id 	= _staticConfig.indexArr.shift();
        	_staticConfig.runningContainer[readyObject.id] 	= readyObject;
        	readyObject.readForLoading();
        }

        ImageBuffer.displayName = "ImageBuffer";

        /*
         * 静态公有方法: 设置配置
         * @param {Object} optiosn: 组件配置
         *
         * 通过深拷贝，扩展(替换)默认配置
         */
        ImageBuffer.setOptions = function(options) {
        	if (typeof options !== "object") {
        		return;
        	}
        	extend(options, _staticConfig);
        }

        /*
         * 静态公有方法: 懒加载的入口
         * @param {HTMLElement} targetDom: 需要进行懒加载的DOM节点
         * @param {String} url: 需要加载的图片URL
         *
         */
        ImageBuffer.lazyLoading = function(targetDom, url) {
        	new ImageBuffer({
        		targetDom 	: 	targetDom 	|| null,
        		url 		: 	url  		|| ""
        	});
        }


        /*
         * 图片懒加载对象
         *
         * @param {Object} options: 对象配置
         * 包含三个属性:
         * 1. targetDom, 目标dom。
         * 2. url, 图片的URL。
         */
        function ImageBuffer(options) {
        	extend(options, this);
        	_staticConfig.waitingQueue.push(this);
        	console.log(_staticConfig);
        	_checkForLoading();

        }

        ImageBuffer.prototype = {

        	constructor: ImageBuffer,

        	//加载的准备工作
        	readForLoading: function() {
        		this.allocResource();
        		this.defImgAllEvent();
        		this.beginLoad();
        	},

        	//分配资源(一个用于加载的<img>)
        	allocResource: function() {
        		this.image = new Image;
        	},

        	//定义该img的所有事件
        	defImgAllEvent: function() {
        		var self = this;
        		this.image.onload = function() {
        			self.applyUrlToDom();
        			self.releaseSelf();
        		};
        		this.image.onerror = function() {
        			self.releaseSelf();
        		};
        		this.image.onabort = function() {
        			self.releaseSelf();
        		}
        	},

        	//开始加载
        	beginLoad: function() {
        		this.image.src = this.url;
        	},

        	//将加载好的img所对应的url应用到dom上
        	applyUrlToDom: function() {
        		var isImg = this.targetDom.tagName === "IMG";
        		if (isImg) {
        			this. targetDom.src = this.url;
        		} else {
        			this.targetDom.style.backgroundImage = "url(" + this.url + ")";
        		}
        	},

        	//释放自身
        	releaseSelf: function() {
        		_staticConfig.currentLoadingNumber--;

        		//归还id给indexArr, 便于循环使用, 并且检查能否执行下一次加载。
        		_staticConfig.indexArr.push(this.id);
        		delete _staticConfig.runningContainer[this.id];
        		_checkForLoading();
        	}

        }

        return ImageBuffer;
    })();

    win.ImageBuffer = ImageBuffer;


 })(window, document, undefined);