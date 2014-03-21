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
			this.outDistY = (this.mapY - this.wrapY)/2; //当图片高度超过屏幕的高度时候。图片是垂直居中的，这时移动有个高度做为缓冲带
			this.width    = this.mapX - this.wrapX;   //地图的宽度减去可视区域的宽度
			this.height   = this.mapY - this.wrapY;   //地图的高度减去可视区域的高度
		},
		_touchstart: function(e){
			var self = this,
				touchTarget = e.targetTouches.length; //获得触控点数

			e.preventDefault();

			self._changeData(); //重新初始化图片、可视区域数据，由于放大会产生新的计算

			// 获得图片的宽度和高度
	        self.startImgWidth  = self.element.offsetWidth;
	        self.startImgHeight = self.element.offsetHeight;


	        // console.log(self.startImgWidth);

			if(touchTarget == 1){
				// self.startPageX = getPage(e, "pageX");
				// self.basePageX  = self.startPageX;
				
				// self.startPageY = getPage(e, "pageY");
				// self.basePageY  = self.startPageY;

				// 获取开始坐标
				self.basePageX = getPage(e, "pageX");
				self.basePageY = getPage(e, "pageY");


				// console.log("touchstart: "+ self.basePageX +"___"+ self.basePageY);

				self.finger = false;
				// console.log(self.element.offsetHeight);
			}else{
				self.finger = true;

		        self.startFingerDist = self.getTouchDist(e).dist;
		        self.startFingerX    = self.getTouchDist(e).x;
		        self.startFingerY    = self.getTouchDist(e).y;

				// console.log("self.startFingerX: "+ self.startFingerX);
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

				//console.log("touchmove: "+ pageX +"___"+ pageY);

				// 获得移动距离
				self.distX = (pageX - self.basePageX) + self.newX;
				self.distY = (pageY - self.basePageY) + self.newY;

				// self.imgPreLeft = self.imgPreLeft + self.distX;

				if(self.width==0 || self.element.offsetWidth==self.imgBaseWidth){ //宽度正好是屏幕的宽度时候不容许左右移动
					self.moveX = 0
					self.movePos();
					console.log("touchmove: "+1);
				}else{
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
				}
				self.finger = false;

				var n = document.defaultView.getComputedStyle(self.element,null).webkitTransform.slice(7).split(", ")[4];
				// console.log("n: "+parseInt(n));
				self.imgPreLeft = -parseInt(n);

				// if(self.imgPreLeft < 0) self.imgPreLeft = 0;
				// console.log("self.moveX: "+self.moveX);
				// console.log("self.imgPreLeft: "+self.imgPreLeft);

				// console.log("1: "+self.imgPreLeft);
			}

			if(touchTarget>=2){
				e.preventDefault();
				e.stopPropagation();

				// console.log("2: "+self.imgPreLeft);

				self.nowFingerDist = self.getTouchDist(e).dist;
				self.nowFingerX    = self.getTouchDist(e).x;
				self.nowFingerY    = self.getTouchDist(e).y;

				// console.log(self.element.getAttribute("style"));


				// self.imgPreLeft = self.imgPreLeft + self.distX;
				// var a = document.defaultView.getComputedStyle(self.element,null);
				// var style = self.element.getAttribute("style");
				// var b = style.split(";");
				// console.log(document.defaultView.getComputedStyle(self.element,null).webkitTransform.slice(7).split(", ")[4]);
				// console.log(b);

				// var k = 0;
				// var n = document.defaultView.getComputedStyle(self.element,null).webkitTransform.slice(7).split(", ")[4];
				// console.log("n: "+parseInt(n));
				// if(self.distX!=0){
				// 	k = self.imgPreLeft + parseInt(n);
				// }
				// console.log(k);

				// if(self.element.offsetHeight < self.wrapY){
				// 	var ratio   = self.nowFingerDist / self.startFingerDist,
				// 		moveTop = document.body.scrollTop,
				// 		imgLeft = Math.round(self.startFingerX * ratio) - self.startFingerX + self.imgPreLeft *ratio,
				// 		imgTop  = (self.startImgHeight * ratio - self.startImgHeight)/2,
				// 		imgWidth = Math.round(self.startImgWidth * self.nowFingerDist / self.startFingerDist);
				// 		imgHeight = Math.round(self.startImgHeight * self.nowFingerDist / self.startFingerDist);
				// }else{
self.ratio = self.nowFingerDist / self.startFingerDist;
					var ratio   = self.nowFingerDist / self.startFingerDist,
						moveTop = document.body.scrollTop,
						// imgLeft = Math.round(self.startFingerX * ratio) - self.startFingerX,
						// imgLeft = Math.round(self.startFingerX * ratio) - self.startFingerX + self.imgPreLeft *ratio,
						imgLeft = Math.round(self.startFingerX * ratio) - self.startFingerX + self.imgPreLeft *ratio,
						imgTop  = Math.round((self.startFingerY-moveTop-self.element.offsetTop) * ratio) - (self.startFingerY-moveTop-self.element.offsetTop) + self.imgPreTop * ratio,
						imgWidth = Math.round(self.startImgWidth * self.nowFingerDist / self.startFingerDist);
						imgHeight = Math.round(self.startImgHeight * self.nowFingerDist / self.startFingerDist);

				// }

				// console.log("imgLeft:"+imgLeft+" imgNewLeft:"+(imgLeft+self.imgPreLeft));
				// if(self.distX){
				// 	imgLeft = -imgLeft-self.distX;
				// }

				if(imgWidth >= self.imgBaseWidth){
					self.element.style.width = imgWidth + "px";
					// self.element.style.height = imgHeight + "px";
					// self.element.style.marginTop = -self.element.height/2+"px";

					// var mt = (imgHeight-self.imgBaseHeight)/2

					// self.element.style.webkitTransform = getTranslate(-imgLeft, 0);

					// console.log(self.element.getAttribute("style"));

					self.refresh(-imgLeft, -imgTop, "0s", "ease");

					
					self.a = Math.round(imgLeft);
					self.b = Math.round(imgTop);

					// self.distX = -imgLeft;
					self.newX = -Math.round(imgLeft);
					self.newY = -Math.round(imgTop);
					// self.distY = -imgTop;
					// self.newY  = -imgTop;

					// console.log("self.newX.finger:"+self.newX);
					self.finger = true;
				}else{
					// self.isScale = true;
					if(imgWidth < self.imgBaseWidth){
						self.element.style.width = self.imgBaseWidth + "px";
					}
				}
				self.finger = true;
			}
		},
		_touchend: function(e){
			var self = this;
			
			self.imgPreLeft = self.a;
			self.imgPreTop = self.b

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
			}
		},
		movePos: function(){ //移动
			var self = this;

			if(self.height<0){
				var a = (self.wrapY - self.imgBaseHeight)/2;
				var b = self.wrapY - self.element.offsetHeight - a;
				if(self.distY < 0){
					if(self.distY <= -a){
						self.moveY = Math.round((self.distY+a)/self.buff)-a;
					}else{
						if(self.distY <= b ){
							// if( Math.abs(self.disY) <= b ){
							// 	self.moveY = self.distY;
							// }else{
							// 	self.moveY = Math.round((self.distY+b)/self.buff) - b;
							// }

							console.log("b: "+b);
							console.log("self.distY: "+self.distY);
							self.moveY = Math.round((self.distY+b)/self.buff) - b;
						}else{
							self.moveY = self.distY;
						}
					}
				}else{

					// console.log("self.distY: "+self.distY);
					// if(Math.abs(self.distY) >= a){
					// 	self.moveY = Math.round((self.distY-a)/self.buff)+a;;
					// }else{
					// 	self.moveY = self.distY;
					// }
				}

				console.log("movePos: "+2);
			}else{
				if(self.outDistY<=0){
					if(self.distY > 0){
						self.moveY = Math.round(self.distY/self.buff);
						console.log("movePos: "+3);
					}else if(self.distY < -self.height){
						self.moveY = -self.height+Math.round((self.distY+self.height)/self.buff);
						console.log("movePos: "+4);
					}else{
						self.moveY = self.distY;
						console.log("movePos: "+5);
					}
				}else{
					if(self.distY>0 && self.distY<=self.outDistY){
						self.moveY = self.distY;
						console.log("movePos: "+6);
					}else if(self.distY > self.outDistY){
						self.moveY = Math.round((self.distY-self.outDistY)/self.buff)+self.outDistY;
						console.log("movePos: "+7);
					}else if(self.distY < -self.outDistY){
						self.moveY = -self.outDistY+Math.round((self.distY+self.outDistY)/self.buff);
						console.log("movePos: "+8);
					}else{
						self.moveY = self.distY;
						console.log("movePos: "+9);
					}
				}
			}


			// self.element.style.webkitTransform = getTranslate(self.moveX, self.moveY);
			self.refresh(self.moveX, self.moveY, "0s", "ease");
		},
		reset: function(){
			var self = this;

			var hideTime = ".4s";
			// -------------
			if(self.height<0){
				// self.moveY = self.distY;
				// console.log(self.moveY);
				// self.moveY = Math.round(self.distY/self.buff);

				var a = (self.wrapY - self.imgBaseHeight)/2;
				if(self.distY < 0){
					if(Math.abs(self.distY) >= a){
						self.newY = -a;
					}else{
						self.newY = self.distY;
					}
				}else{
					if(Math.abs(self.distY) >= a){
						self.newY = a;
					}else{
						self.newY = self.distY;
					}
				}


				console.log("movePos: "+2);
				self.refresh(self.newX, self.newY, hideTime, "ease-in-out");
			}else{
				if(self.outDistY<=0){
					if( self.distY>0 ){
						self.newY = 0;
						self.refresh(self.newX, self.newY, hideTime, "ease-in-out");
						console.log("reset: "+3);
					}else if( self.distY<0 && self.distY>=-self.height ){
						self.newY = self.distY;
						// self.refresh(self.newX, self.distY, "0s", "ease");
						self.refresh(self.newX, self.distY, hideTime, "ease-in-out");
						console.log("reset: "+4);
					}else if( self.distY<-self.height ){
						self.newY = -self.height;
						self.refresh(self.newX, self.newY, hideTime, "ease-in-out");
						console.log("reset: "+5);
					}
				}else{
					if( self.distY>0 && self.distY<self.outDistY ){
						self.newY = self.distY;
						// self.refresh(self.newX, self.distY, "0s", "ease");
						self.refresh(self.newX, self.distY, hideTime, "ease-in-out");
						console.log("reset: "+6);
					}else if( self.distY>=self.outDistY ){
						self.newY = self.outDistY;
						self.refresh(self.newX, self.newY, hideTime, "ease-in-out");
						console.log("reset: "+7);
					}else if( self.distY<0 && self.distY>=-self.outDistY ){
						self.newY = self.distY;
						// self.refresh(self.newX, self.distY, "0s", "ease");
						self.refresh(self.newX, self.distY, hideTime, "ease-in-out");
						console.log("reset: "+8);
					}else if( self.distY<-self.outDistY ){
						self.newY = -self.outDistY;
						self.refresh(self.newX, self.newY, hideTime, "ease-in-out");
						console.log("reset: "+9);
					}
				}
			}
		},
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
		getTouchDist: function(e){
			var x1 = y1 = x2 = y2 = x3 = y3 = 0,
				result = {};
	        x1 = e.touches.item(0).pageX;
	        x2 = e.touches.item(1).pageX;
	        y1 = e.touches.item(0).pageY;
	        y2 = e.touches.item(1).pageY;

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

