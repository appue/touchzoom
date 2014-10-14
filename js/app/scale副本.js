define(function () {
	var document = window.document,
		support = {
			transform3d: ("WebKitCSSMatrix" in window && "m11" in new WebKitCSSMatrix()),
			touch: ("ontouchstart" in window)
		};
		
	var SlideZoom = {
		buffMove: 3, // 缓冲系数
        finger: false,
		listImages: "",
		listIndex: "",
		
		newScale: 1,
		currentScale: 0,
		
		init: function(params) {
			var self = this;
			
			self.imgs  = params.img;
			self.index = params.z;
			self.buffScale = params.scale || 4;
			
			self.len   = self.imgs.length;
			self.$wrap = $(".slide_container");
			self.$that = $(".slide_container .this_img");
			
			self.bodyWidth  = $("body").width();
			self.bodyHeight = $("body").height();
			
			self.newX = 0;
			self.newY = 0;
			
			self.initImg();
			
			self.addEvent();
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
			
			self.$wrap.find("li").eq(self.index).append('<img src="'+ self.imgs[self.index] +'" />');
			
			self.$that.css({
				'-webkit-transform': 'translate3d(-' + self.bodyWidth*self.index + 'px, 0, 0)'
			});
		},
		
		addEvent: function() {
			var self = this;
			
			self.$that.find("img").on("touchstart", function(e) {
				self._touchstart(e);
			});
			self.$that.find("img").on("touchmove", function(e) {
				self._touchmove(e);
			});
			self.$that.find("img").on("touchend", function(e) {
				self._touchend(e);
			});
		},
		
		_touchstart: function(e) {
            var self = this;
			
            e.preventDefault();
			
            var touchTarget = e.targetTouches.length;
			
            if (touchTarget == 1) {
			
                self.basePageX = self.getPage(e, 'pageX');
                self.basePageY = self.getPage(e, 'pageY');
				
				self.endX = ( $(e.target).width() - $("body").width() ) / 2;
				
				if (self.endX < 0) {
					self.endX = 0;
				}
				
            } else {
			
                self.startFingerDist = self.getTouchDist(e).dist;
                self.startFingerX = self.getTouchDist(e).x;
                self.startFingerY = self.getTouchDist(e).y;
				
            }
		},
		
		_touchmove: function(e) {
			var self = this;
			
            e.preventDefault();
            e.stopPropagation();

            var touchTarget = e.targetTouches.length;

            if (touchTarget == 1) {
                self._move(e);
            }

            if (touchTarget >= 2) {
                self._zoom(e);
            }
			
		},
		
		_touchend: function(e) {
			var self = this;
			
			
			if (self.currentScale <= 1) {
			
				self.newScale = 1;
				
			} else if (self.currentScale >= self.buffScale){
			
				self.newScale = self.buffScale;
				
			} else {
			
				self.newScale = self.currentScale;
				
			}
			
			//console.log("imgwidth: " + $(e.target).width());
			//console.log("endx: " + self.endX);
			//console.log("distx: " + self.distX);
			
			if (self.distX < -self.endX) {
			
				self.newX = -self.endX / self.newScale;
				
			} else if (self.distX > self.endX) {
			
				self.newX = self.endX / self.newScale;
				self.newY = self.distY;
				
			}
			
            self.refresh({
				'e': e,
				'scale': self.newScale,
				'x': self.newX,
				'y': self.newY,
				'timer': '.2s',
				'type': 'ease-in-out'
			});
			
		},
		
		_move: function(e) {
            var self = this;
            
			var pageX = self.getPage(e, 'pageX'),
                pageY = self.getPage(e, 'pageY');

            // 禁止默认事件
            // e.preventDefault();
            // e.stopPropagation();
			
            self.distX = (pageX - self.basePageX) + self.newX;
			
			//console.log(self.distX);
			
			if (self.newScale == 1) {
			
				self.distY = 0;
				
			} else {
			
				self.distY = (pageY - self.basePageY) + self.newY;
				
			}
			
			self.distY = 0;
				
			if (self.distX < -self.endX) {
				
				console.log(1);
				self.moveX = -self.endX + Math.round( (self.distX + self.endX) / self.buffMove );
				
			} else if (self.distX > self.endX) {
			
				console.log(2);
				self.moveX = self.endX + Math.round( (self.distX - self.endX) / self.buffMove );
			
			} else {
			
				console.log(3);
				self.moveX = self.distX;
			
			}
			
			self.moveY = self.distY;
			
            self.refresh({
				'e': e,
				'scale': self.newScale,
				'x': self.moveX,
				'y': self.moveY,
				'timer': '0s',
				'type': 'ease'
			});
		},
		
		_zoom: function(e) {
            var self = this;
            // e.preventDefault();
            // e.stopPropagation();
			
            var nowFingerDist = self.getTouchDist(e).dist, //获得当前长度
				currentScale = nowFingerDist / self.startFingerDist; //计算缩放比
			
			
			self.currentScale = currentScale - 1 + self.newScale;
			
			if (self.currentScale < 1) {
			
				self.currentScale = 1 + (self.currentScale -1)/3;
				
			} else if (self.currentScale > 2){
			
				self.currentScale = 2 + (self.currentScale - 2)/3;
				
			}
			
			//console.log(currentScale +"___"+ self.currentScale);
			
            self.refresh({
				'e': e,
				'scale': self.currentScale,
				'x': self.newX,
				'y': self.newY,
				'timer': '0s',
				'type': 'ease'
			});
		},

        // 执行图片移动
        refresh: function (params) {
			var self = this;
			
			$(params.e.target).css({
				'-webkit-transition': '-webkit-transform ' + params.timer + ' ' + params.type,
				'-webkit-transform': 'scale(' + params.scale + ')' + self.getTranslate(params.x, params.y)
			});
			
			/*
            this.zoomImg.style.webkitTransitionProperty = '-webkit-transform';
            this.zoomImg.style.webkitTransitionDuration = timer;
            this.zoomImg.style.webkitTransitionTimingFunction = type;
            this.zoomImg.style.webkitTransform = getTranslate(x, y);
			*/
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
	
	return SlideZoom;
});