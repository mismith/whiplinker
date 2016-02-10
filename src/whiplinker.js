class WhipLinker {
	constructor(source, target, options = {}) {
		// defaults
		this.options = {
			prefix: 'wl-',
			container: document.body,
			allowSource: function (sourceElement) {},
			allowTarget: function (targetElement) {},
		};
		this.setOptions(options);
		
		var style = document.createElement('style');
		style.appendChild(document.createTextNode(`
.${this.options.prefix}whiplink {
	position: absolute;
	width: 0;
	pointer-events: none;
	transform-origin: left center;

	height: 3px;
	background: black;
	margin-top: -1.5px;
	border-radius: 3px;
}
.${this.options.prefix}whiplink.${this.options.prefix}missed {
	background: red;
	width: 0 !important;
	transition: width 200ms;
}
.${this.options.prefix}whiplink.${this.options.prefix}hit {
	pointer-events: auto;
}
.${this.options.prefix}whiplink.${this.options.prefix}selected {
	background: rgb(59, 153, 252);
}`));
		document.head.insertBefore(style, document.head.firstChild);
		
		// init
		this.active = false;
		this.selected = [];
		
		this.sourceElements = [];
		this.targetElements = [];
		this.list = [];
		
		// hooks
		this.addSourceElements(typeof source === 'string' ? document.querySelectorAll(source) : source);
		this.addTargetElements(typeof target === 'string' ? document.querySelectorAll(target) : target);
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
		document.addEventListener('click', e => {
			this.deselectWhiplinks();
		});
		document.addEventListener('keyup', e => {
			if (e.keyCode === 8 || e.keyCode === 46) {
				this.deleteWhiplinks();
			}
		});
	}
	setOptions(options = {}) {
		return Object.assign(this.options, options);
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
			this._returnsTruthy(this.options.allowSource, [{sourceElement: el, whiplinkElement: this.active}], () => {
				this._from(el);
				
				e.preventDefault();
			})
		});
	}
	_hookTargetElement(el) {
		el.addEventListener('mouseup', e => {
			if (this.active) {
				this._returnsTruthy(this.options.allowTarget, [{targetElement: el, sourceElement: this.sourceElement, whiplinkElement: this.active}], () => {
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
	addSourceElements(els = []) {
		for (var el of Array.from(els)) {
			this.addSourceElement(el);
		}
	}
	addTargetElements(els = []) {
		for (var el of Array.from(els)) {
			this.addTargetElement(el);
		}
	}
	find(whiplinkElement) {
		return this.list.find(hit => {
			return hit.whiplinkElement === whiplinkElement;
		});
	}
	
	// selection
	_hookWhiplink(el) {
		el.addEventListener('click', e => {
			this.selected.indexOf(el) >= 0 ? this.deselectWhiplink(el) : this.selectWhiplink(el, e.shiftKey);
			
			e.stopPropagation();
		});
	}
	selectWhiplink(el, append) {
		var index = this.selected.indexOf(el);
		if (index < 0) {
			if ( ! append) this.deselectWhiplinks(this.selected);
			this.selected.push(el);
			
			var hit = this.find(el);
			if (hit) {
				el.classList.add(this.options.prefix + 'selected');
				this.emit('select', [hit]);
			}
		}
	}
	deselectWhiplink(el) {
		var index = this.selected.indexOf(el);
		if (index >= 0) {
			this.selected.splice(index, 1);
			
			var hit = this.find(el);
			if (hit) {
				el.classList.remove(this.options.prefix + 'selected');
				this.emit('deselect', [hit]);
			}
		}
	}
	deselectWhiplinks(els = this.selected) {
		Array.from(els).forEach(el => {
			this.deselectWhiplink(el);
		});
	}
	deleteWhiplink(el) {
		this.deselectWhiplink(el); // make sure it doesn't linger in this.selected
		
		var hit = this.find(el);
		if (hit) {
			el.parentNode.removeChild(el);
			this.emit('delete', [hit]);
		}
	}
	deleteWhiplinks(els = this.selected) {
		Array.from(els).forEach(el => {
			this.deleteWhiplink(el);
		});
	}
	
	// drawing
	snap(el, snapTo = 'center center') {
		var offset = el.getBoundingClientRect();
	
		return {
			left: offset.left + (/left/.test(snapTo) ? 0 : (/right/.test(snapTo)  ? offset.width : offset.width / 2)),
			top:  offset.top  + (/top/.test(snapTo)  ? 0 : (/bottom/.test(snapTo) ? offset.height : offset.height / 2)),
		};
	}
	__from(sourceElement, whipLinkElement) {
		this._offset = this.snap(sourceElement, this.options.snap);
		whipLinkElement.style.left = this._offset.left + 'px';
		whipLinkElement.style.top  = this._offset.top + 'px';
	}
	_from(sourceElement) {
		var whiplink = document.createElement('div');
		whiplink.className = this.options.prefix + 'whiplink';
		this.options.container.appendChild(whiplink);
		
		this.__from(sourceElement, whiplink);
		
		this.active = whiplink;
		this.sourceElement = sourceElement;
		
		this.emit('from', [{sourceElement, whiplinkElement: whiplink}]);
	}
	__to(whiplinkElement, x, y) {
		x -= this._offset.left;
		y -= this._offset.top;
		
		var length = Math.sqrt(x*x + y*y),
			angle  = Math.atan(y / x) * // get theta
					 180 / Math.PI +    // to degrees
					 (x < 0 ? 180 : 0); // quadrants II & III
					 
		whiplinkElement.style.width = length + 'px';
		whiplinkElement.style.transform = 'rotate(' + angle + 'deg)';
	}
	_to(x, y) {
		if (this.active) {
			this.__to(this.active, x, y);
			
			this.emit('to', [{x, y, sourceElement: this.sourceElement, whiplinkElement: this.active}]);
		}
	}
	_hit(el) {
		if (this.active) {
			var offset = this.snap(el, this.options.snap);
			this._to(offset.left, offset.top);
			
			this._hookWhiplink(this.active);
			
			var hit = {
				targetElement:   el,
				sourceElement:   this.sourceElement,
				whiplinkElement: this.active,
			};
			this.list.push(hit);
			this.active.classList.add(this.options.prefix + 'hit');
			
			this.emit('hit', [hit]);
			
			this._done();
		}
	}
	_miss() {
		if (this.active) {
			this.active.classList.add(this.options.prefix + 'missed');
			var el = this.active;
			setTimeout(() => {
				el.parentNode.removeChild(el);
			}, 200);
			
			this.emit('miss', [{sourceElement: this.sourceElement, whiplinkElement: this.active}]);
			
			this._done();
		}
	}
	_done() {
		this.emit('done', [{sourceElement: this.sourceElement, whiplinkElement: this.active}]);
		
		this.sourceElement = null;
		this.active = false;
	}
	repaint() {
		this.list.forEach(hit => {
			// from
			this.__from(hit.sourceElement, hit.whiplinkElement);
			
			// to
			let {left: x, top: y} = this.snap(hit.targetElement, this.options.snap);
			this.__to(hit.whiplinkElement, x, y);
		});
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
		if (this.events && this.events[eventType]) {
			this.events[eventType].forEach(callback => {
				callback.apply(this, args);
			});
		}
		return this;
	}
}
