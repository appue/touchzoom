(function(window, undefined){
	var document = window.document,
		support = {
			transform3d: ("WebKitCSSMatrix" in window && "m11" in new WebKitCSSMatrix()),
			touch: ("ontouchstart" in window)
		},
		touchstartEvent =  support.touch ? "touchstart" : "mousedown",
		touchmoveEvent  =  support.touch ? "touchmove" : "mousemove",
		touchendEvent   =  support.touch ? "touchend" : "mouseup";

		
	function getTranslate(x, y){
		var distX = x, distY = y;
		return support.transform3d
			? "translate3d("+ distX +"px, "+ distY +"px, 0)"
			: "translate("+ distX +"px, "+ distY +"px)";
	}

	function getPage(event, page) {
		return support.touch ? event.changedTouches[0][page] : event[page];
	}

	var ImagesZoom = function(params){
		return (this instanceof ImagesZoom)
			? this.init(params)
			: new ImagesZoom(params);
	};

	ImagesZoom.prototype = {
		// 给初始化数据
		init: function(params){
			var self   = this,
				params = params || {};
				
			var imgList   = document.querySelectorAll(params.elem + " img"),
				zoomMask  = document.querySelector(".imgzoom_pack"),
				zoomImg   = document.querySelector(".imgzoom_pack .imgzoom_img img"),
				zoomClose = document.querySelector(".imgzoom_pack .imgzoom_x"),
				imgSrc    = "";

			zoomClose.addEventListener("click", function(){

				zoomMask.style.cssText = "display:none";
				zoomImg.src = "";
				zoomImg.style.cssText = "";

				document.removeEventListener("touchmove", self.eventStop, false);
			}, false);

			for(var len=imgList.length,i=0; i<len; i++){
				imgList[i].addEventListener("click", function(){
					imgSrc = this.getAttribute("src");
					zoomMask.style.cssText = "display:block";
					zoomImg.src = imgSrc;
					zoomImg.style.cssText = "margin-top:-"+(zoomImg.offsetHeight/2)+"px";

					// 禁止页面滚动
					document.addEventListener("touchmove", self.eventStop, false);
					
					self.imgBaseWidth  = zoomImg.offsetWidth;
					self.imgBaseHeight = zoomImg.offsetHeight;

					self.addEventStart({
						wrapX: zoomMask.offsetWidth,
						wrapY: zoomMask.offsetHeight,
						mapX: zoomImg.width,
						mapY: zoomImg.height
					});
				}, false);
			}
		},
		addEventStart: function(params){
			var self   = this,
				params = params || {};

			self.element = document.querySelector(".imgzoom_pack img");

			self.buff   = 3; //缓冲系数
			self.finger = false; //触摸手指的状态 false：单手指 true：多手指


			self.distX = 0;
			self.distY = 0;
			self.newX  = 0;
			self.newY  = 0;

			self.y = 0;
			self.imgPreLeft = 0;
			self.imgPreTop  = 0;
			self.a = 0;


			//config set
			self.wrapX = params.wrapX || 0; 	//可视区域宽度
			self.wrapY = params.wrapY || 0; 	//可视区域高度
			self.mapX  = params.mapX || 0; 	    //地图宽度
			self.mapY  = params.mapY || 0;      //地图高度

			self.outDistY = (self.mapY - self.wrapY)/2; //图片超过一瓶的时候有用
			
			self.width  = self.mapX - self.wrapX;   //地图的宽度减去可视区域的宽度
			self.height = self.mapY - self.wrapY;   //地图的高度减去可视区域的高度

			self.element.addEventListener("touchstart",function(e){
				self._touchstart(e);
			},false);
			self.element.addEventListener("touchmove",function(e){
				self._touchmove(e);
			},false);
			self.element.addEventListener("touchend",function(e){
				self._touchend(e);
			},false);
		},
		_changeData: function(){
			this.mapX     = this.element.offsetWidth; 	  //地图宽度
			this.mapY     = this.element.offsetHeight;      //地图高度
			// this.outDistY = (this.mapY - this.wrapY)/2; //当图片高度超过屏幕的高度时候。图片是垂直居中的，这时移动有个高度做为缓冲带
			this.width    = this.mapX - this.wrapX;   //地图的宽度减去可视区域的宽度
			this.height   = this.mapY - this.wrapY;   //地图的高度减去可视区域的高度
		},
		_touchstart: function(e){
			var self = this,
				touchTarget = e.targetTouches.length; //获得触控点数

			e.preventDefault();

			self._changeData(); //重新初始化图片、可视区域数据，由于放大会产生新的计算

			if(touchTarget == 1){
				// 获取开始坐标
				self.basePageX = getPage(e, "pageX");
				self.basePageY = getPage(e, "pageY");

				self.finger = false;
			}else{
				self.finger = true;

		        self.startFingerDist = self.getTouchDist(e).dist;
		        self.startFingerX    = self.getTouchDist(e).x;
		        self.startFingerY    = self.getTouchDist(e).y;
			}
		},
		_touchmove: function(e){
			var self = this,
				touchTarget = e.targetTouches.length; //获得触控点数

			if(touchTarget == 1 && !self.finger){
				// 获取移动坐标
				var pageX = getPage(e, "pageX"),
					pageY = getPage(e, "pageY");

				// 禁止默认事件
				e.preventDefault();
				e.stopPropagation();

				// 获得移动距离
				self.distX = (pageX - self.basePageX) + self.newX;
				self.distY = (pageY - self.basePageY) + self.newY;

				if(self.distX > 0){
					self.moveX = Math.round(self.distX/self.buff);
					self.movePos();
					console.log("touchmove: "+2);
				}else if( self.distX<=0 && self.distX>=-self.width ){
					self.moveX = self.distX;
					self.movePos();
					console.log("touchmove: "+3);
				}else if(self.distX < -self.width ){
					self.moveX = -self.width+Math.round((self.distX+self.width)/self.buff);
					self.movePos();
					console.log("touchmove: "+4);
				}
				self.finger = false;
			}

			if(touchTarget>=2){
				// e.preventDefault();
				// e.stopPropagation();
				// var nowFingerDist = self.getTouchDist(e).dist, //获得当前长度
				// 	ratio = nowFingerDist / self.startFingerDist, //计算缩放比
				// 	imgWidth  = Math.round(self.mapX * ratio), //计算图片宽度
				// 	imgHeight = Math.round(self.mapY * ratio); //计算图片高度
				// // 计算图片新的坐标
				// self.imgNewX   = Math.round(self.startFingerX * ratio) - self.startFingerX + Math.round((-self.newX) * ratio);
				// self.imgNewY   = (Math.round(self.startFingerY * ratio) - self.startFingerY)/2 + Math.round((-self.newY) * ratio);
				// // 开始图片缩放
				// if(imgWidth >= self.imgBaseWidth){
				// 	self.element.style.width = imgWidth + "px";
				// 	self.refresh(-self.imgNewX, -self.imgNewY, "0s", "ease");
				// 	self.finger = true;
				// }else{
				// 	if(imgWidth < self.imgBaseWidth){
				// 		self.element.style.width = self.imgBaseWidth + "px";
				// 	}
				// }
				// self.finger = true;
				self._zoom(e);
			}
		},
		_touchend: function(e){
			var self = this;

			self._changeData(); //重新计算数据

			if(!self.finger){
				if( self.distX>0 ){
					self.newX = 0;
					self.reset();
					console.log("touchend:"+1);
				}else if( self.distX<=0 && self.distX>=-self.width ){
					self.newX = self.distX;
					self.newY = self.distY;
					self.reset();
					console.log("touchend:"+2);
				}else if( self.distX<-self.width ){
					self.newX = -self.width;
					self.reset();
					console.log("touchend:"+3);
				}
			}else{
				self.newX = -self.imgNewX;
				self.newY = -self.imgNewY;
			}
		},
		// 图片缩放
		_zoom: function(e){
			var self = this;
			e.preventDefault();
			e.stopPropagation();


			var nowFingerDist = self.getTouchDist(e).dist, //获得当前长度
				ratio = nowFingerDist / self.startFingerDist, //计算缩放比
				imgWidth  = Math.round(self.mapX * ratio), //计算图片宽度
				imgHeight = Math.round(self.mapY * ratio); //计算图片高度
			// 计算图片新的坐标
			self.imgNewX   = Math.round(self.startFingerX * ratio) - self.startFingerX + Math.round((-self.newX) * ratio);
			self.imgNewY   = (Math.round(self.startFingerY * ratio) - self.startFingerY)/2 + Math.round((-self.newY) * ratio);
			// 开始图片缩放
			if(imgWidth >= self.imgBaseWidth){
				self.element.style.width = imgWidth + "px";
				self.refresh(-self.imgNewX, -self.imgNewY, "0s", "ease");
				self.finger = true;
			}else{
				if(imgWidth < self.imgBaseWidth){
					self.element.style.width = self.imgBaseWidth + "px";
				}
			}

			self.finger = true;
		},
		// 移动坐标
		movePos: function(){
			var self = this;

			if(self.height<0){
				// moveTop移动到顶部需要移动的距离
				var moveTop = (self.wrapY - self.imgBaseHeight)/2;
				// var b = self.wrapY - self.element.offsetHeight - a;
				if(self.distY < 0){
					if(self.distY <= -moveTop){
						self.moveY = Math.round((self.distY+moveTop)/self.buff)-moveTop;
					}else{
						// moveBottom移动到底部的临界点
						// moveBottomDistY移动到底部需要移动的距离
						var moveBottom = Math.round(self.wrapY/2 - (self.distY + self.mapY - self.imgBaseHeight/2)),
							moveBottomDistY = Math.round(self.wrapY/2 - self.mapY + self.imgBaseHeight/2);
						if(moveBottom<=0){
							self.moveY = Math.round((self.distY-moveBottomDistY)/self.buff) + moveBottomDistY;
						}else{
							self.moveY = self.distY;
						}
					}
				}else{
					var moveBottomDistY = Math.round(self.wrapY/2 + self.imgBaseHeight/2 - self.mapY);
					if(self.distY >= moveBottomDistY){
						self.moveY = Math.round((self.distY-moveBottomDistY)/self.buff)+moveBottomDistY;
					}else{
						self.moveY = self.distY;
					}
				}
			}else{
				// if(self.outDistY<=0){
				// 	if(self.distY > 0){
				// 		self.moveY = Math.round(self.distY/self.buff);
				// 		console.log("movePos: "+3);
				// 	}else if(self.distY < -self.height){
				// 		self.moveY = -self.height+Math.round((self.distY+self.height)/self.buff);
				// 		console.log("movePos: "+4);
				// 	}else{
				// 		self.moveY = self.distY;
				// 		console.log("movePos: "+5);
				// 	}
				// }else{
				// 	if(self.distY>0 && self.distY<=self.outDistY){
				// 		self.moveY = self.distY;
				// 		console.log("movePos: "+6);
				// 	}else if(self.distY > self.outDistY){
				// 		self.moveY = Math.round((self.distY-self.outDistY)/self.buff)+self.outDistY;
				// 		console.log("movePos: "+7);
				// 	}else if(self.distY < -self.outDistY){
				// 		self.moveY = -self.outDistY+Math.round((self.distY+self.outDistY)/self.buff);
				// 		console.log("movePos: "+8);
				// 	}else{
				// 		self.moveY = self.distY;
				// 		console.log("movePos: "+9);
				// 	}
				// }

				if(self.outDistY > 0){
					if(self.element.offsetHeight == self.imgBaseHeight){
						if(self.distY <= -Math.round(self.outDistY)){
							self.moveY = Math.round((self.distY+self.outDistY)/self.buff) - self.outDistY;
						}else if(self.distY >= Math.round(self.outDistY)){
							self.moveY = Math.round((self.distY-self.outDistY)/self.buff) + self.outDistY;
						}else{
							self.moveY = self.distY;
						}
					}else{
						self.moveY = self.distY;
					}
				}else{
					// var moveTop = (self.wrapY - self.imgBaseHeight)/2;
					// var a = moveTop +  (self.element.offsetHeight - self.wrapY)/2; //下面不能移了

					// if(self.distY < 0){
					// 	// if(self.distY <= -a){
					// 	// 	self.moveY = Math.round((self.distY + a)/self.buff) - a;
					// 	// }else{
					// 	// 	self.moveY = self.distY;
					// 	// }
						
					// }

					self.moveY = self.distY;
				}
			}

			// self.element.style.webkitTransform = getTranslate(self.moveX, self.moveY);
			self.refresh(self.moveX, self.moveY, "0s", "ease");
		},
		// 重置数据
		reset: function(){
			var self = this,
				hideTime = ".4s";
			
			if(self.height<0){
				// moveTop移动到顶部需要移动的距离
				var moveTop = (self.wrapY - self.imgBaseHeight)/2;
				// var b = self.wrapY - self.element.offsetHeight - a;
				if(self.distY < 0){
					if(self.distY <= -moveTop){
						self.newY = -moveTop;
					}else{
						// moveBottom移动到底部的临界点
						// moveBottomDistY移动到底部需要移动的距离
						var moveBottom = Math.round(self.wrapY/2 - (self.distY + self.mapY - self.imgBaseHeight/2)),
							moveBottomDistY = Math.round(self.wrapY/2 - self.mapY + self.imgBaseHeight/2);
						if(moveBottom<=0){
							self.newY = moveBottomDistY;
						}else{
							self.newY = self.distY;
						}
					}
				}else{
					var moveBottomDistY = Math.round(self.wrapY/2 + self.imgBaseHeight/2 - self.mapY);

					if(self.distY >= moveBottomDistY){
						self.newY = moveBottomDistY;
					}else{
						self.newY = self.distY;
					}
				}
				self.refresh(self.newX, self.newY, hideTime, "ease-in-out");
			}else{
				// if(self.outDistY<=0){
				// 	if( self.distY>0 ){
				// 		self.newY = 0;
				// 		self.refresh(self.newX, self.newY, hideTime, "ease-in-out");
				// 		console.log("reset: "+3);
				// 	}else if( self.distY<0 && self.distY>=-self.height ){
				// 		self.newY = self.distY;
				// 		// self.refresh(self.newX, self.distY, "0s", "ease");
				// 		self.refresh(self.newX, self.distY, hideTime, "ease-in-out");
				// 		console.log("reset: "+4);
				// 	}else if( self.distY<-self.height ){
				// 		self.newY = -self.height;
				// 		self.refresh(self.newX, self.newY, hideTime, "ease-in-out");
				// 		console.log("reset: "+5);
				// 	}
				// }else{
				// 	if( self.distY>0 && self.distY<self.outDistY ){
				// 		self.newY = self.distY;
				// 		// self.refresh(self.newX, self.distY, "0s", "ease");
				// 		self.refresh(self.newX, self.distY, hideTime, "ease-in-out");
				// 		console.log("reset: "+6);
				// 	}else if( self.distY>=self.outDistY ){
				// 		self.newY = self.outDistY;
				// 		self.refresh(self.newX, self.newY, hideTime, "ease-in-out");
				// 		console.log("reset: "+7);
				// 	}else if( self.distY<0 && self.distY>=-self.outDistY ){
				// 		self.newY = self.distY;
				// 		// self.refresh(self.newX, self.distY, "0s", "ease");
				// 		self.refresh(self.newX, self.distY, hideTime, "ease-in-out");
				// 		console.log("reset: "+8);
				// 	}else if( self.distY<-self.outDistY ){
				// 		self.newY = -self.outDistY;
				// 		self.refresh(self.newX, self.newY, hideTime, "ease-in-out");
				// 		console.log("reset: "+9);
				// 	}
				// }


				if(self.outDistY > 0){
					if(self.element.offsetHeight == self.imgBaseHeight){
						if(self.distY <= -Math.round(self.outDistY)){
							self.newY = -self.outDistY;
						}else if(self.distY >= Math.round(self.outDistY)){
							self.newY = self.outDistY;
						}else{
							self.newY = self.distY;
						}
					}else{
						self.newY = self.distY;
					}
				}else{
					// var moveTop = (self.wrapY - self.imgBaseHeight)/2;
					// var a = moveTop +  (self.element.offsetHeight - self.wrapY)/2; //下面不能移了

					
					self.newY = self.distY;
				}
				self.refresh(self.newX, self.newY, hideTime, "ease-in-out");
			}
		},
		// 执行图片移动
		refresh: function(x, y, timer, type){
			var self = this;
			self.element.style.webkitTransitionProperty = "-webkit-transform";
		    self.element.style.webkitTransitionDuration = timer;
			self.element.style.webkitTransitionTimingFunction = type;
		    // self.element.addEventListener("webkitTransitionEnd", function(event){
		    // 	self.element.style.webkitTransition = "none";
		    // }, false );
		    self.element.style.webkitTransform = getTranslate(x, y);
		},
		// 获取多点触控
		getTouchDist: function(e){
			var x1 = y1 = x2 = y2 = x3 = y3 = 0,
				result = {};
	        x1 = e.touches.item(0).pageX;
	        x2 = e.touches.item(1).pageX;
	        y1 = e.touches.item(0).pageY - document.body.scrollTop;
	        y2 = e.touches.item(1).pageY - document.body.scrollTop;

	        console.log(y1);
	        console.log(y2);

	        if(!x1 || !x2) return;

	        if(x1<=x2){
	        	x3 = (x2-x1)/2+x1;
	        }else{
	        	x3 = (x1-x2)/2+x2;
	        }
	        if(y1<=y2){
	        	y3 = (y2-y1)/2+y1;
	        }else{
	        	y3 = (y1-y2)/2+y2;
	        }

	        result = {
	        	dist: Math.round(Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2))),
	        	x: Math.round(x3),
	        	y: Math.round(y3)
	        };
			return result;
		},
		eventStop: function(e){
			e.preventDefault();
			e.stopPropagation();
		}
	};

	window.ImagesZoom = new ImagesZoom();
})(this);

document.addEventListener("DOMContentLoaded", function(event){
	ImagesZoom.init({
		"elem": ".list"
	});
}, false);

