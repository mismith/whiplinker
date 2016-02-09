class WhipLinker {
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
		this.sourceElements = [];
		this.targetElements = [];
		
		// hooks
		this.addSourceElements(typeof sourceElementsOrSelector === 'string' ? document.querySelectorAll(sourceElementsOrSelector) : sourceElementsOrSelector);
		this.addTargetElements(typeof targetElementsOrSelector === 'string' ? document.querySelectorAll(targetElementsOrSelector) : targetElementsOrSelector);
		document.addEventListener('mousemove', e => {
			if (this.active) {
				this._to(e.clientX, e.clientY);
			}
		});
		document.addEventListener('mouseup', e => {
			if (this.active) {
				this._miss();
			}
		});
	}
	
	// setup
	_returnsTruthy(fn, args, yes = ()=>{}, no = ()=>{}) {
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
	_hookSourceElement(el) {
		el.addEventListener('mousedown', e => {
			this._returnsTruthy(this.options.allowSource, [el], () => {
				this._from(el);
				
				e.preventDefault();
			})
		});
	}
	_hookTargetElement(el) {
		el.addEventListener('mouseup', e => {
			if (this.active) {
				this._returnsTruthy(this.options.allowTarget, [el], () => {
					this._hit(el);
				}, () => {
					this._miss();
				});
			}
		});
	}
	addSourceElement(el) {
		this.sourceElements.push(el);
		this._hookSourceElement(el);
	}
	addTargetElement(el) {
		this.targetElements.push(el);
		this._hookTargetElement(el);
	}
	addSourceElements(els) {
		for (var el of els) {
			this.addSourceElement(el);
		}
	}
	addTargetElements(els) {
		for (var el of els) {
			this.addTargetElement(el);
		}
	}
	
	// drawing
	_snap(el, snapTo = 'center center') {
		var offset = el.getBoundingClientRect();
	
		return {
			left: offset.left + (/left/.test(snapTo) ? 0 : (/right/.test(snapTo)  ? offset.width : offset.width / 2)),
			top:  offset.top  + (/top/.test(snapTo)  ? 0 : (/bottom/.test(snapTo) ? offset.height : offset.height / 2)),
		};
	}
	_from(el) {
		var whiplink = document.createElement('div');
		whiplink.className = this.options.prefix + 'whiplink';
		for (var property in this.options.styles.whiplink) {
			whiplink.style[property] = this.options.styles.whiplink[property];
		}
		this.options.container.appendChild(whiplink);
		this.offset = this._snap(el, this.options.snap);
		whiplink.style.left = this.offset.left + 'px';
		whiplink.style.top  = this.offset.top + 'px';
		this.active = whiplink;
		
		this.sourceElement = el;
		
		this.emit('from', [el, this.active]);
	}
	_to(x, y) {
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
	_hit(el) {
		if (this.active) {
			var offset = this._snap(el, this.options.snap);
			this._to(offset.left, offset.top);
			
			this.emit('hit', [el, this.sourceElement, this.active]);
			
			this.sourceElement = null;
			this.active = false;
		}
	}
	_miss() {
		if (this.active) {
			this.active.style.transition = 'width 200ms';
			this.active.style.width = 0;
			var el = this.active;
			setTimeout(() => {
				el.parentNode.removeChild(el);
			}, 200);
			
			this.emit('miss', [this.sourceElement, this.active]);
			
			this.sourceElement = null;
			this.active = false;
		}
	}
	
	// event delegation
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
