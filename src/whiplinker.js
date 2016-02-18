class WhipLinker {
	constructor(source, target, options = {}) {
		// defaults
		this.options = {
			prefix: 'wl-',
			container: document.body,
		};
		this.setOptions(options);
		
		// styling
		var style = document.createElement('style');
		style.appendChild(document.createTextNode(`
.${this.options.prefix}source {}
.${this.options.prefix}target {}
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
		this.whiplinkElement = false;
		this.selectedWhiplinkElements = [];
		this.sourceElements = [];
		this.targetElements = [];
		this.sourceFilters = [];
		this.targetFilters = [];
		this.hits = [];
		
		// hooks
		this.hookSourceElements(source);
		this.hookTargetElements(target);
		document.addEventListener('mousedown', e => {
			if (this.sourceElements.indexOf(e.target) >= 0 && this.filterSourceElement(e.target)) {
				this._from(e.target);
		
				e.preventDefault();
			}
		});
		document.addEventListener('mousemove', e => {
			if (this.whiplinkElement) {
				this._to(e.clientX, e.clientY);
		
				e.preventDefault();
			}
		});
		document.addEventListener('mouseup', e => {
			if (this.whiplinkElement) {
				if (this.targetElements.indexOf(e.target) >= 0 && this.filterTargetElement(e.target)) {
					this._hit(e.target);
				} else {
					this._miss();
				}
		
				e.preventDefault();
			}
		});
		document.addEventListener('click', e => {
			this.deselectWhiplinks();
		
			e.preventDefault();
		});
		document.addEventListener('keyup', e => {
			if (e.keyCode === 46 /*del*/) {
				this.removeWhiplinks();
		
				e.preventDefault();
			}
		});
	}
	
	// helpers
	setOptions(options = {}) {
		return Object.assign(this.options, options);
	}
	_reverseForEach(array, iterator) {
		for (var i = array.length - 1; i >= 0; i -= 1) {
			iterator(array[i], i, array);
		}
	}
	
	// elements
	hookSourceElement(sourceElement) {
		sourceElement.classList.add(this.options.prefix + 'source');
		
		this.sourceElements.push(sourceElement);
	}
	hookTargetElement(targetElement) {
		targetElement.classList.add(this.options.prefix + 'target');
		
		this.targetElements.push(targetElement);
	}
	hookSourceElements(sourceElements = []) {
		if (typeof sourceElements === 'string') {
			sourceElements = document.querySelectorAll(sourceElements);
		}
		for (var sourceElement of Array.from(sourceElements)) {
			this.hookSourceElement(sourceElement);
		}
	}
	hookTargetElements(targetElements = []) {
		if (typeof targetElements === 'string') {
			targetElements = document.querySelectorAll(targetElements);
		}
		for (var targetElement of Array.from(targetElements)) {
			this.hookTargetElement(targetElement);
		}
	}
	filterSourceElement(sourceElement) {
		return this.sourceFilters.reduce((prev, filter) => {
			return prev && filter.call(this, {sourceElement, whiplinkElement: this.whiplinkElement});
		}, true);
	}
	filterTargetElement(targetElement) {
		return this.targetFilters.reduce((prev, filter) => {
			return prev && filter.call(this, {sourceElement: this.sourceElement, whiplinkElement: this.whiplinkElement, targetElement});
		}, true);
	}
	addSourceFilter(filter) {
		if (typeof filter === 'function') this.sourceFilters.push(filter);
		
		return this; // chainable
	}
	addTargetFilter(filter) {
		if (typeof filter === 'function') this.targetFilters.push(filter);
		
		return this; // chainable
	}
	
	// selection
	_hookWhiplink(whiplinkElement) {
		whiplinkElement.addEventListener('click', e => {
			if (e.shiftKey) {
				if (this.selectedWhiplinkElements.indexOf(whiplinkElement) >= 0) {
					this.deselectWhiplink(whiplinkElement);
				} else {
					this.selectWhiplink(whiplinkElement, true);
				}
			} else {
				this.selectWhiplink(whiplinkElement);
			}
			
			e.stopPropagation();
		});
	}
	selectWhiplink(whiplinkElement, append) {
		// clear existing selection if not appending
		if ( ! append) this.deselectWhiplinks();
		
		var index = this.selectedWhiplinkElements.indexOf(whiplinkElement);
		if (index < 0) {
			// add it
			this.selectedWhiplinkElements.push(whiplinkElement);
			
			// mark as selected
			whiplinkElement.classList.add(this.options.prefix + 'selected');
			
			// fire event
			var hit = this.findHit(whiplinkElement);
			if (hit) {
				this.emit('select', [hit]);
			}
		}
	}
	deselectWhiplink(whiplinkElement) {
		var index = this.selectedWhiplinkElements.indexOf(whiplinkElement);
		if (index >= 0) {
			// remove it
			this.selectedWhiplinkElements.splice(index, 1);
			
			// unmark as selected
			whiplinkElement.classList.remove(this.options.prefix + 'selected');
			
			// fire event
			var hit = this.findHit(whiplinkElement);
			if (hit) {
				this.emit('deselect', [hit]);
			}
		}
	}
	deselectWhiplinks(whiplinkElements = this.selectedWhiplinkElements) {
		this._reverseForEach(whiplinkElements, whiplinkElement => {
			this.deselectWhiplink(whiplinkElement);
		});
	}
	removeWhiplink(whiplinkElement) {
		// make sure it doesn't linger in selected
		this.deselectWhiplink(whiplinkElement);
		
		// remove from DOM
		this.options.container.removeChild(whiplinkElement);
		
		// fire event
		var hit = this.findHit(whiplinkElement);
		if (hit) {
			this.emit('delete', [hit]);
		}
	}
	removeWhiplinks(whiplinkElements = this.selectedWhiplinkElements) {
		this._reverseForEach(whiplinkElements, whiplinkElement => {
			this.removeWhiplink(whiplinkElement);
		});
	}
	
	// storage
	addHit(hit) {
		this.hits.push(hit);
		
		hit.whiplinkElement.classList.add(this.options.prefix + 'hit');
		
		return hit;
	}
	findHit(whiplinkElement) {
		return this.hits.find(hit => {
			return hit.whiplinkElement === whiplinkElement;
		});
	}
	deleteHit(hit) {
		// make sure it doesn't linger in DOM
		this.removeWhiplink(hit.whiplinkElement);
		
		// remove from hits
		this.hits.splice(this.hits.indexOf(hit), 1);
	}
	
	// drawing
	snap(el, snapTo = 'center center') {
		var offset = el.getBoundingClientRect();
	
		return {
			left: offset.left + (/left/.test(snapTo) ? 0 : (/right/.test(snapTo)  ? offset.width : offset.width / 2)),
			top:  offset.top  + (/top/.test(snapTo)  ? 0 : (/bottom/.test(snapTo) ? offset.height : offset.height / 2)),
		};
	}
	__styleWhiplinkFrom(whiplinkElement, sourceElement) {
		this._offset = this.snap(sourceElement, this.options.snap);
		whiplinkElement.style.left = this._offset.left + 'px';
		whiplinkElement.style.top  = this._offset.top + 'px';
	}
	_from(sourceElement) {
		var whiplinkElement = document.createElement('div');
		whiplinkElement.className = this.options.prefix + 'whiplink';
		this.options.container.appendChild(whiplinkElement);
		
		this.__styleWhiplinkFrom(whiplinkElement, sourceElement);
		
		this.whiplinkElement = whiplinkElement;
		this.sourceElement = sourceElement;
		
		this.emit('from', [{sourceElement, whiplinkElement: whiplinkElement}]);
	}
	__styleWhiplinkTo(whiplinkElement, x, y) {
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
		if (this.whiplinkElement) {
			this.__styleWhiplinkTo(this.whiplinkElement, x, y);
			
			this.emit('to', [{x, y, sourceElement: this.sourceElement, whiplinkElement: this.whiplinkElement}]);
		}
	}
	_hit(targetElement) {
		if (this.whiplinkElement) {
			var offset = this.snap(targetElement, this.options.snap);
			this._to(offset.left, offset.top);
			
			this._hookWhiplink(this.whiplinkElement);
			
			var hit = this.addHit({
				targetElement,
				sourceElement:   this.sourceElement,
				whiplinkElement: this.whiplinkElement,
			});
			
			this.emit('hit', [hit]);
			
			this._done();
		}
	}
	_miss() {
		if (this.whiplinkElement) {
			this.whiplinkElement.classList.add(this.options.prefix + 'missed');
			var whiplinkElement = this.whiplinkElement;
			setTimeout(() => {
				this.removeWhiplink(whiplinkElement);
			}, 200);
			
			this.emit('miss', [{sourceElement: this.sourceElement, whiplinkElement: this.whiplinkElement}]);
			
			this._done();
		}
	}
	_done() {
		this.emit('done', [{sourceElement: this.sourceElement, whiplinkElement: this.whiplinkElement}]);
		
		this.sourceElement = null;
		this.whiplinkElement = false;
	}
	repaint() {
		this._reverseForEach(this.hits, (hit, i) => {
			// auto-delete if either source or target is missing
			if ( ! this.options.container.contains(hit.sourceElement) || ! this.options.container.contains(hit.targetElement)) {
				return this.deleteHit(hit);
			}
			
			// from
			this.__styleWhiplinkFrom(hit.whiplinkElement, hit.sourceElement);
			
			// to
			let {left: x, top: y} = this.snap(hit.targetElement, this.options.snap);
			this.__styleWhiplinkTo(hit.whiplinkElement, x, y);
		});
	}
	
	// event delegation
	on(eventType, callback) {
		if (typeof callback !== 'function') throw new Error('Callback must be a function.');
		
		this.events = this.events || {};
		this.events[eventType] = this.events[eventType] || [];
		this.events[eventType].push(callback);
		
		return this; // chainable
	}
	emit(eventType, args = []) {
		if (this.events && this.events[eventType]) {
			this.events[eventType].forEach(callback => {
				callback.apply(this, args);
			});
		}
		return this; // chainable
	}
}
