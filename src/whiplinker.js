window.WhipLinker = class WhipLinker {
	constructor(sourceElementsOrSelector, targetElementsOrSelector, options = {}) {
		// defaults
		this.options = Object.assign({
			prefix: 'wl-',
			container: document.body,
			styles: {
				whiplink: {
					position: 'absolute',
					height: '3px',
					width: 0,
					background: 'black',
					marginTop: '-1.5px',
					transformOrigin: 'left center',
					pointerEvents: 'none',
				},
			},
			allowSource: function (sourceElement) {},
			allowTarget: function (targetElement) {},
		}, options);
		
		// init
		var WhipLinker = this;
		this.active = false;
		this.sourceElements = typeof sourceElementsOrSelector === 'string' ? document.querySelectorAll(sourceElementsOrSelector) : sourceElementsOrSelector || [];
		this.targetElements = typeof targetElementsOrSelector === 'string' ? document.querySelectorAll(targetElementsOrSelector) : targetElementsOrSelector || [];
		
		// hooks
		function returnsTruthy(fn, args, yes, no = function(){}) {
			if (typeof fn === 'function') {
				var returnValue = fn.apply(this, args);
				if (returnValue !== undefined) {
					if ( ! returnValue) {
						no();
					} else {
						yes();
					}
				} else {
					yes();
				}
			} else {
				yes();
			}
		}
		for (var el of this.sourceElements) {
			el.addEventListener('mousedown', function (e) {
				returnsTruthy(WhipLinker.options.allowSource, [e.target], () => {
					WhipLinker.from(e.target);
					
					e.preventDefault();
				})
			});
		}
		document.addEventListener('mousemove', function (e) {
			if (WhipLinker.active) {
				WhipLinker.to(e.clientX, e.clientY);
			}
		});
		for (var el of this.targetElements) {
			el.addEventListener('mouseup', function (e) {
				if (WhipLinker.active) {
					returnsTruthy(WhipLinker.options.allowTarget, [e.target], () => {
						WhipLinker.hit(e.target);
					}, () => {
						WhipLinker.miss();
					});
				}
			});
		}
		document.addEventListener('mouseup', function (e) {
			if (WhipLinker.active) {
				WhipLinker.miss();
			}
		});
	}
	
	// helper
	snap(el, snapTo = 'center center') {
		var offset = el.getBoundingClientRect();
	
		return {
			left: offset.left + (/left/.test(snapTo) ? 0 : (/right/.test(snapTo)  ? offset.width : offset.width / 2)),
			top:  offset.top  + (/top/.test(snapTo)  ? 0 : (/bottom/.test(snapTo) ? offset.height : offset.height / 2)),
		};
	}
	
	// methods
	from(el) {
		var whiplink = document.createElement('div');
		whiplink.className = this.options.prefix + 'whiplink';
		for (var property in this.options.styles.whiplink) {
			whiplink.style[property] = this.options.styles.whiplink[property];
		}
		this.options.container.appendChild(whiplink);
		this.offset = this.snap(el, this.options.snap);
		whiplink.style.left = this.offset.left + 'px';
		whiplink.style.top  = this.offset.top + 'px';
		this.active = whiplink;
		
		this.emit('from', [el]);
	}
	to(x, y) {
		if (this.active) {
			x -= this.offset.left;
			y -= this.offset.top;
			
			var length = Math.sqrt(x*x + y*y),
				angle  = Math.atan(y / x) * // get theta
						 180 / Math.PI +    // to degrees
						 (x < 0 ? 180 : 0); // quadrants II & III
						 
			this.active.style.width = length + 'px';
			this.active.style.transform = 'rotate(' + angle + 'deg)';
			
			this.emit('to', [x, y]);
		}
	}
	hit(el) {
		if (this.active) {
			var offset = this.snap(el, this.options.snap);
			this.to(offset.left, offset.top);
			
			this.active = false;
			
			this.emit('hit', [el]);
		}
	}
	miss() {
		if (this.active) {
			this.active.style.transition = 'width 200ms';
			this.active.style.width = 0;
			var el = this.active;
			setTimeout(() => {
				el.parentNode.removeChild(el);
			}, 200);
			this.active = false;
			
			this.emit('miss', []);
		}
	}
	
	// events api
	on(eventType, callback) {
		if (typeof callback !== 'function') throw new Error('Callback must be a function.');
		
		this.events = this.events || {};
		this.events[eventType] = this.events[eventType] || [];
		this.events[eventType].push(callback);
		
		return this;
	}
	emit(eventType, args = []) {
		var WhipLinker = this;
		if (this.events && this.events[eventType]) {
			this.events[eventType].forEach(function (callback) {
				callback.apply(WhipLinker, args);
			});
		}
		return this;
	}
}
