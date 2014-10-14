var document = window.document,
	support = {
		transform3d: ("WebKitCSSMatrix" in window && "m11" in new WebKitCSSMatrix()),
		touch: ("ontouchstart" in window)
	};
	
var ImagesZoom = {

    finger: false,

	/*
	* @params
	*     imgsUrl: 图片地址（数组）
	*     detail: 文本信息
	*     currentImg: 当前第几张图
	*	  isScale: true/false 是否开启缩放功能
	*     maxScale: 最大缩放值
	*/
	init: function(params) {
		var self = this;

		self.setConfig(params);

		self.len = self.imgs.length;

		self.$wrap = $(".appue_scale");
		self.$that = $(".appue_scale .this_img");
		
		self.bodyWidth  = self.$wrap.width();
		self.bodyHeight = self.$wrap.height();

		self.imagesWH = new Array(self.len); // 存取图片高宽
		
		self.newX = 0;
		self.newY = 0;
		
		self.initImg();
		
		self.addEvent();
	},

	setConfig: function(params) {
		var self = this;

		var i,
			options = {
				imgsUrl: "",
				detail: "",
				buffMove: 3,
				currentImg: 0,
				isScale: false,
				maxScale: 2,
				minDist: 120
			};

        for (i in params) options[i] = params[i];

		self.imgs      = options.imgsUrl; //----------图片地址 数组
		self.detail    = options.detail; //-----------文字描述
		self.current   = options.currentImg; //-------当前是第几张图
		self.buffScale = options.maxScale; //---------缩放最大值
        self.isScale   = options.isScale; //----------是否开启缩放[true、false]
		self.buffMove  = options.buffMove; //---------缓冲系数
        self.minDist   = options.minDist; //----------最大移动距离，超过该距离将翻页
	},
	
	initImg: function() {
		var self = this;

		var str = "";
		
		for(var i=0; i<self.len; i++) {
			str = str + '<li style="width:'+ self.bodyWidth +'px;height:'+ self.bodyHeight +'px;"></li>';
		}
		
		self.$that.append(str);
		
		self.$wrap.css({
			"display": "block"
		});
		
		// self.$wrap.find("li").eq(self.current).append('<img src="'+ self.imgs[self.current] +'" />');

		// self.$that.css({
		// 	'-webkit-transform': 'translate3d(-' + self.bodyWidth*self.current + 'px, 0, 0)'
		// });

		self.appendImage();
			
        self.moveSlide({
			'timer': '0'
        });
	},
	
	/*
	* 事件绑定
	* touchstart、touchmove、touchend
	*/
	addEvent: function() {
		var self = this;
		
		var that = document.querySelectorAll(".appue_scale li");

		for(var i=0, len=that.length; i<len; i++) {

			that[i].addEventListener("touchstart", function(e) {
				self._touchstart(e);
			}, false);

			that[i].addEventListener("touchmove", function(e) {
				self._touchmove(e);
			}, false);

			that[i].addEventListener("touchend", function(e) {
				self._touchend(e);
			}, false);
			
		}
	},

	/*
	* 更新地图信息
	*     e: 点击事件
	*/
	_changeData: function(e){
		var self = this;

		self.mapX = $(e.target).width();  	//地图宽度
		self.mapY = $(e.target).height(); 	//地图高度

		// this.outDistY = (this.mapY - this.wrapY)/2; //当图片高度超过屏幕的高度时候。图片是垂直居中的，这时移动有个高度做为缓冲带
		self.width  = self.mapX - self.bodyWidth;   //地图的宽度减去可视区域的宽度
		self.height = self.mapY - self.bodyHeight;   //地图的高度减去可视区域的高度
	},


	/*
	* 获取图片的初始高、宽
	*/
	setImagesInfo: function(e) {
		var self = this;

		var $that = self.getTarget(e);

		if (!self.imagesWH[self.current]) {
			self.imagesWH[self.current] = {};
			self.imagesWH[self.current].w = $that.width();
			self.imagesWH[self.current].h = $that.height();
		}
	},
	
	_touchstart: function(e) {
		var self = this;

        if (e.target.nodeName !== 'IMG') {
            return;
        }

		e.preventDefault();

		self.setImagesInfo(e); // 存取图片信息

		var touchTarget = e.targetTouches.length; //获得触控点数

		self._changeData(e); //重新初始化图片、可视区域数据，由于放大会产生新的计算


		if(touchTarget == 1){

			self.finger = false;

			// 获取开始坐标
			self.basePageX = self.getPage(e, "pageX");
			self.basePageY = self.getPage(e, "pageY");

		}else{

			if (self.isScale) {

				self.finger = true;

		        self.startFingerDist = self.getTouchDist(e).dist;
		        self.startFingerX    = self.getTouchDist(e).x;
		        self.startFingerY    = self.getTouchDist(e).y;
				
			}

		}
	},
	
	_touchmove: function(e) {
		var self = this;

        if (e.target.nodeName !== 'IMG') {
            return;
        }

		e.preventDefault();
		e.stopPropagation();

		if (self.isScale) {
		
			var touchTarget = e.targetTouches.length; //获得触控点数

			if (touchTarget == 1 && !self.finger) {
				self.finger = false;
				self._move(e);
			}

			if (touchTarget >= 2) {
				self.finger = true;
				self._zoom(e);
			}

		} else {

			self.finger = false;
			self._move(e);

		}
	},
	
	_touchend: function(e) {
		var self = this;


        if (e.target.nodeName !== 'IMG') {
            return;
        }
        
		if (self.finger) {

			self.resetZoom(e);

		} else {

			self.resetMove(e);
		
		}

	},
	
	_move: function(e) {
		var self = this;

		var imgBaseWidth = self.imagesWH[self.current].w,
			imgBaseHeight = self.imagesWH[self.current].h;

		var pageX = self.getPage(e, "pageX"), //获取移动坐标
			pageY = self.getPage(e, "pageY");

		// 禁止默认事件
		e.preventDefault();
		e.stopPropagation();

		// 获得移动距离
		self.distX = (pageX - self.basePageX) + self.newX;
		self.distY = (pageY - self.basePageY) + self.newY;

		var currentImgWidth = self.getTarget(e).width(),
			endX = currentImgWidth - imgBaseWidth;

		if (self.distX >= 0) {

			self.moveX = Math.round( self.distX / self.buffMove );

		} else {

			if (currentImgWidth == imgBaseWidth) {

				self.moveX = Math.round( self.distX / self.buffMove );

			} else {

				if (self.distX <= -endX) {

					self.moveX = Math.round( (self.distX + endX) / self.buffMove - endX );

				} else {

					self.moveX = self.distX;

				}
			
			}

		}

		self.moveY = 0;
		
        self.refresh({
			'e': e,
			'x': self.moveX,
			'y': self.moveY,
			'timer': '0s',
			'type': 'ease'
		});
	},
	
	_zoom: function(e) {
		var self = this;

		var currentWidth = "";

		var imgBaseWidth = self.imagesWH[self.current].w,
			imgBaseHeight = self.imagesWH[self.current].h;

		e.preventDefault();
		e.stopPropagation();

		var nowFingerDist = self.getTouchDist(e).dist, //获得当前长度
			ratio 		  = nowFingerDist / self.startFingerDist, //计算缩放比
			imgWidth  	  = Math.round(self.mapX * ratio), //计算图片宽度
			imgHeight 	  = Math.round(self.mapY * ratio); //计算图片高度

		var $target = self.getTarget(e);

		if (imgWidth <= imgBaseWidth*self.buffScale) {

			if (imgWidth >= imgBaseWidth && imgHeight <= self.bodyHeight) {

				self.imgNewX = Math.round(self.startFingerX * ratio - self.startFingerX + (-self.newX) * ratio);
				self.imgNewY = 0;
				currentWidth = imgWidth;

			} else if (imgHeight > imgBaseHeight) {

				// // 计算图片新的坐标
				// self.imgNewX = Math.round(self.startFingerX * ratio - self.startFingerX + (-self.newX) * ratio);
				// self.imgNewY = Math.round((self.startFingerY * ratio - self.startFingerY)/2 + (-self.newY) * ratio);

				self.imgNewX = Math.round(self.startFingerX * ratio - self.startFingerX + (-self.newX) * ratio);
				self.imgNewY = Math.round( (imgHeight - self.bodyHeight) / 2 );
				currentWidth = imgWidth;

			} else if (imgWidth < imgBaseWidth) {

				self.imgNewX = Math.round(self.startFingerX * ratio - self.startFingerX + (-self.newX) * ratio);
				self.imgNewY = Math.round( (imgHeight - self.bodyHeight) / 2 );

				currentWidth = imgBaseWidth;

			}
		
			$target.css({
				'width': currentWidth + 'px',
				'max-width': 'none',
				'max-height': 'none'
			});

	        self.refresh({
				'e': e,
				'x': -self.imgNewX,
				'y': -self.imgNewY,
				'timer': 0,
				'type': 'ease'
			});

		}

	},

	resetMove: function(e) {
		var self = this;

		var imgBaseWidth = self.imagesWH[self.current].w,
			imgBaseHeight = self.imagesWH[self.current].h;

		var currentImgWidth = self.getTarget(e).width(),
			endX = currentImgWidth - imgBaseWidth;

		if (!self.distX) {
			self.distX = 0;
		}

		if ( self.current == 0 ) {

			if (self.distX >= 0) {

				moveDist(0);

			} else {

				if ( self.distX <= -(self.minDist + endX) ) {
			        moveNext();
				} else if ( self.distX <= -endX && self.distX > -(self.minDist + endX) ) {
					moveDist(-endX);
				} else {
					moveDist(self.distX);
				}

			}

		} else if ( self.current == (self.len - 1) ) {

			if ( self.distX >= 0 ) {

				if ( self.distX < self.minDist ) {
					moveDist(0);
				} else {
					movePrev();
				}

			} else {

				if (self.distX <= -endX) {
					moveDist(-endX);
				} else {
					moveDist(self.distX);
				}
			}

		} else {

			if (self.distX >= 0) {

				if ( self.distX < self.minDist ) {
					moveDist(0);
				} else {
					movePrev();
 				}

			} else {

				if ( self.distX <= -(self.minDist + endX) ) {
			        moveNext();
				} else if ( self.distX <= -endX && self.distX > -(self.minDist + endX) ) {
					moveDist(-endX);
				} else {
					moveDist(self.distX);
				}

			}

		}

		self.newY = 0;


		function moveDist(distX) {

			self.newX = distX;

	        self.refresh({
				'e': e,
				'x': self.newX,
				'y': 0,
				'timer': '.5s',
				'type': 'ease'
			});

		}

		function movePrev() {

	        self.reset();

			self.current--;

	        self.moveSlide({
				'timer': '.5s'
	        });
			
	        self.resetImage({
	        	'e': e,
	        	'z': self.current + 1
	        });
		}

		function moveNext() {

			self.reset();

			self.current++;

	        self.moveSlide({
				'timer': '.5s'
	        });

	        self.resetImage({
	        	'e': e,
	        	'z': self.current - 1
	        });

		}
	},

	resetZoom: function(e) {
		var self = this;

		var imgBaseWidth = self.imagesWH[self.current].w,
			imgBaseHeight = self.imagesWH[self.current].h;

		var currentImgWidth = self.getTarget(e).width(),
			endX = currentImgWidth - imgBaseWidth;

		self.distX = -self.imgNewX;
		self.distY = -self.imgNewY;

		if (self.distX > 0) {

			self.newX = 0;

		} else {

			// self.distX 小于0

			if ( (self.distX + endX) < 0 ) {

				self.newX = self.bodyWidth - currentImgWidth; // 是个负值

			} else {

				self.newX = self.distX;

			}
		}

		self.newY = 0;

        self.refresh({
			'e': e,
			'x': self.newX,
			'y': self.newY,
			'timer': '.5s',
			'type': 'ease'
		});

	},

	reset: function () {
		var self = this;

		self.newX = 0;
		self.newY = 0;
		self.distX = 0;
		self.distY = 0;
	},

    /*
	* @params
	*     el: 执行移动的元素
	*     timer: 时间
	*     type: 动画滚动类型
	*     x: 横向移动距离 
	*     y: 纵向移动距离
    */
    refresh: function (params) {
		var self = this;

		var $target = self.getTarget(params.e);

		$target.css({
			'-webkit-transition': '-webkit-transform ' + params.timer + ' ' + params.type,
			'-webkit-transform': self.getTranslate(params.x, params.y)
		});
    },

    /*
    * 插入图片和文本
    * none parmas
    */
    appendImage: function() {
    	var self = this;

		var $that = self.$wrap.find("li").eq(self.current),
			content = $that.html();
 
		if (!content) {
			$that.html('<div class="this_loading"></div>');
		}

        var image = new Image();

        image.onload = function () {

            var str = "";

            if (self.detail) {

                str = '<img src="' + self.imgs[self.current] + '" />' +
			          '<div class="this_text">' + self.detail[self.current] + '</div>';

            } else {

                str = '<img src="' + self.imgs[self.current] + '" />';

            }

            if (!content || (content.search(/img/) == -1)) {
                $that.html(str);
            }

        };

        image.src = self.imgs[self.current];
    },
    
    /*
    * 移动幻灯片
	* @params
	*     timer: 时间
    */
    moveSlide: function (params) {
		var self = this;
		
		self.$that.css({
			'-webkit-transition': '-webkit-transform ' + params.timer + ' ease',
			'-webkit-transform': self.getTranslate(-self.current * self.bodyWidth, 0)
		});
    },

    /*
    * 重置图片样式
	* @params:
	*     e:
	*     z: 
    */
    resetImage: function(params) {
    	var self = this;

    	self.$that.on('webkitTransitionEnd', function(e){
    		// $('.appue_scale li').eq(params.z).find('img').attr('style', '');

    		$('.appue_scale li img').attr('style', '');

	        self.appendImage();
    	});
    },

    // 获取多点触控
    getTouchDist: function (e) {
        var x1 = 0,
            y1 = 0,
            x2 = 0,
            y2 = 0,
            x3 = 0,
            y3 = 0,
            result = {};

        x1 = e.touches[0].pageX;
        x2 = e.touches[1].pageX;
        y1 = e.touches[0].pageY - document.body.scrollTop;
        y2 = e.touches[1].pageY - document.body.scrollTop;

        if (!x1 || !x2) return;

        if (x1 <= x2) {
            x3 = (x2 - x1) / 2 + x1;
        } else {
            x3 = (x1 - x2) / 2 + x2;
        }
        if (y1 <= y2) {
            y3 = (y2 - y1) / 2 + y1;
        } else {
            y3 = (y1 - y2) / 2 + y2;
        }

        result = {
            dist: Math.round(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))),
            x: Math.round(x3),
            y: Math.round(y3)
        };
		
        return result;
    },

    getTarget: function(e) {
		var $target = "";

		if (e.target.nodeName == 'IMG') {

			$target = $(e.target);

		} else {

			$target = $(e.target).find("img");
		}

		return $target;
    },
	
    eventStop: function (e) {
        e.preventDefault();
        e.stopPropagation();
    },
	
	getTranslate: function(x, y) {
		var distX = x, distY = y;
		return support.transform3d ? "translate3d(" + distX + "px, " + distY + "px, 0)" : "translate(" + distX + "px, " + distY + "px)";
	},
	
	getPage: function(event, page) {
		return support.touch ? event.changedTouches[0][page] : event[page];
	}
}