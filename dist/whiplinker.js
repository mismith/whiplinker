'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WhipLinker = function () {
	function WhipLinker(source, target) {
		var _this = this;

		var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

		_classCallCheck(this, WhipLinker);

		// defaults
		this.options = {
			prefix: 'wl-',
			container: document.body
		};
		this.setOptions(options);

		// styling
		var style = document.createElement('style');
		style.appendChild(document.createTextNode('\n.' + this.options.prefix + 'source {}\n.' + this.options.prefix + 'target {}\n.' + this.options.prefix + 'whiplink {\n\tposition: absolute;\n\twidth: 0;\n\tpointer-events: none;\n\ttransform-origin: left center;\n\n\theight: 3px;\n\tbackground: black;\n\tmargin-top: -1.5px;\n\tborder-radius: 3px;\n}\n.' + this.options.prefix + 'whiplink.' + this.options.prefix + 'missed {\n\tbackground: red;\n\twidth: 0 !important;\n\ttransition: width 200ms;\n}\n.' + this.options.prefix + 'whiplink.' + this.options.prefix + 'hit {\n\tpointer-events: auto;\n}\n.' + this.options.prefix + 'whiplink.' + this.options.prefix + 'selected {\n\tbackground: rgb(59, 153, 252);\n}'));
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
		document.addEventListener('mousedown', function (e) {
			if (_this.sourceElements.indexOf(e.target) >= 0 && _this.filterSourceElement(e.target)) {
				_this._from(e.target);

				e.preventDefault();
			}
		});
		document.addEventListener('mousemove', function (e) {
			if (_this.whiplinkElement) {
				_this._to(e.clientX, e.clientY);

				e.preventDefault();
			}
		});
		document.addEventListener('mouseup', function (e) {
			if (_this.whiplinkElement) {
				if (_this.targetElements.indexOf(e.target) >= 0 && _this.filterTargetElement(e.target)) {
					_this._hit(e.target);
				} else {
					_this._miss();
				}

				e.preventDefault();
			}
		});
		document.addEventListener('click', function (e) {
			_this.deselectWhiplinks();

			e.preventDefault();
		});
		document.addEventListener('keyup', function (e) {
			if (e.keyCode === 46 /*del*/) {
					_this.removeWhiplinks();

					e.preventDefault();
				}
		});
	}

	// helpers


	_createClass(WhipLinker, [{
		key: 'setOptions',
		value: function setOptions() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			return Object.assign(this.options, options);
		}
	}, {
		key: '_reverseForEach',
		value: function _reverseForEach(array, iterator) {
			for (var i = array.length - 1; i >= 0; i -= 1) {
				iterator(array[i], i, array);
			}
		}

		// elements

	}, {
		key: 'hookSourceElement',
		value: function hookSourceElement(sourceElement) {
			sourceElement.classList.add(this.options.prefix + 'source');

			this.sourceElements.push(sourceElement);
		}
	}, {
		key: 'hookTargetElement',
		value: function hookTargetElement(targetElement) {
			targetElement.classList.add(this.options.prefix + 'target');

			this.targetElements.push(targetElement);
		}
	}, {
		key: 'hookSourceElements',
		value: function hookSourceElements() {
			var sourceElements = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

			if (typeof sourceElements === 'string') {
				sourceElements = document.querySelectorAll(sourceElements);
			}
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = Array.from(sourceElements)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var sourceElement = _step.value;

					this.hookSourceElement(sourceElement);
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}
		}
	}, {
		key: 'hookTargetElements',
		value: function hookTargetElements() {
			var targetElements = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

			if (typeof targetElements === 'string') {
				targetElements = document.querySelectorAll(targetElements);
			}
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = Array.from(targetElements)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var targetElement = _step2.value;

					this.hookTargetElement(targetElement);
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}
		}
	}, {
		key: 'filterSourceElement',
		value: function filterSourceElement(sourceElement) {
			var _this2 = this;

			return this.sourceFilters.reduce(function (prev, filter) {
				return prev && filter.call(_this2, { sourceElement: sourceElement, whiplinkElement: _this2.whiplinkElement });
			}, true);
		}
	}, {
		key: 'filterTargetElement',
		value: function filterTargetElement(targetElement) {
			var _this3 = this;

			return this.targetFilters.reduce(function (prev, filter) {
				return prev && filter.call(_this3, { sourceElement: _this3.sourceElement, whiplinkElement: _this3.whiplinkElement, targetElement: targetElement });
			}, true);
		}
	}, {
		key: 'addSourceFilter',
		value: function addSourceFilter(filter) {
			if (typeof filter === 'function') this.sourceFilters.push(filter);

			return this; // chainable
		}
	}, {
		key: 'addTargetFilter',
		value: function addTargetFilter(filter) {
			if (typeof filter === 'function') this.targetFilters.push(filter);

			return this; // chainable
		}

		// selection

	}, {
		key: '_hookWhiplink',
		value: function _hookWhiplink(whiplinkElement) {
			var _this4 = this;

			whiplinkElement.addEventListener('click', function (e) {
				if (e.shiftKey) {
					if (_this4.selectedWhiplinkElements.indexOf(whiplinkElement) >= 0) {
						_this4.deselectWhiplink(whiplinkElement);
					} else {
						_this4.selectWhiplink(whiplinkElement, true);
					}
				} else {
					_this4.selectWhiplink(whiplinkElement);
				}

				e.stopPropagation();
			});
		}
	}, {
		key: 'selectWhiplink',
		value: function selectWhiplink(whiplinkElement, append) {
			// clear existing selection if not appending
			if (!append) this.deselectWhiplinks();

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
	}, {
		key: 'deselectWhiplink',
		value: function deselectWhiplink(whiplinkElement) {
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
	}, {
		key: 'deselectWhiplinks',
		value: function deselectWhiplinks() {
			var _this5 = this;

			var whiplinkElements = arguments.length <= 0 || arguments[0] === undefined ? this.selectedWhiplinkElements : arguments[0];

			this._reverseForEach(whiplinkElements, function (whiplinkElement) {
				_this5.deselectWhiplink(whiplinkElement);
			});
		}
	}, {
		key: 'removeWhiplink',
		value: function removeWhiplink(whiplinkElement) {
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
	}, {
		key: 'removeWhiplinks',
		value: function removeWhiplinks() {
			var _this6 = this;

			var whiplinkElements = arguments.length <= 0 || arguments[0] === undefined ? this.selectedWhiplinkElements : arguments[0];

			this._reverseForEach(whiplinkElements, function (whiplinkElement) {
				_this6.removeWhiplink(whiplinkElement);
			});
		}

		// storage

	}, {
		key: 'addHit',
		value: function addHit(hit) {
			this.hits.push(hit);

			hit.whiplinkElement.classList.add(this.options.prefix + 'hit');

			return hit;
		}
	}, {
		key: 'findHit',
		value: function findHit(whiplinkElement) {
			return this.hits.find(function (hit) {
				return hit.whiplinkElement === whiplinkElement;
			});
		}
	}, {
		key: 'deleteHit',
		value: function deleteHit(hit) {
			// make sure it doesn't linger in DOM
			this.removeWhiplink(hit.whiplinkElement);

			// remove from hits
			this.hits.splice(this.hits.indexOf(hit), 1);
		}

		// drawing

	}, {
		key: 'snap',
		value: function snap(el) {
			var snapTo = arguments.length <= 1 || arguments[1] === undefined ? 'center center' : arguments[1];

			var offset = el.getBoundingClientRect();

			return {
				left: offset.left + (/left/.test(snapTo) ? 0 : /right/.test(snapTo) ? offset.width : offset.width / 2),
				top: offset.top + (/top/.test(snapTo) ? 0 : /bottom/.test(snapTo) ? offset.height : offset.height / 2)
			};
		}
	}, {
		key: '__styleWhiplinkFrom',
		value: function __styleWhiplinkFrom(whiplinkElement, sourceElement) {
			this._offset = this.snap(sourceElement, this.options.snap);
			whiplinkElement.style.left = this._offset.left + 'px';
			whiplinkElement.style.top = this._offset.top + 'px';
		}
	}, {
		key: '_from',
		value: function _from(sourceElement) {
			var whiplinkElement = document.createElement('div');
			whiplinkElement.className = this.options.prefix + 'whiplink';
			this.options.container.appendChild(whiplinkElement);

			this.__styleWhiplinkFrom(whiplinkElement, sourceElement);

			this.whiplinkElement = whiplinkElement;
			this.sourceElement = sourceElement;

			this.emit('from', [{ sourceElement: sourceElement, whiplinkElement: whiplinkElement }]);
		}
	}, {
		key: '__styleWhiplinkTo',
		value: function __styleWhiplinkTo(whiplinkElement, x, y) {
			x -= this._offset.left;
			y -= this._offset.top;

			var length = Math.sqrt(x * x + y * y),
			    angle = Math.atan(y / x) * // get theta
			180 / Math.PI + ( // to degrees
			x < 0 ? 180 : 0); // quadrants II & III

			whiplinkElement.style.width = length + 'px';
			whiplinkElement.style.transform = 'rotate(' + angle + 'deg)';
		}
	}, {
		key: '_to',
		value: function _to(x, y) {
			if (this.whiplinkElement) {
				this.__styleWhiplinkTo(this.whiplinkElement, x, y);

				this.emit('to', [{ x: x, y: y, sourceElement: this.sourceElement, whiplinkElement: this.whiplinkElement }]);
			}
		}
	}, {
		key: '_hit',
		value: function _hit(targetElement) {
			if (this.whiplinkElement) {
				var offset = this.snap(targetElement, this.options.snap);
				this._to(offset.left, offset.top);

				this._hookWhiplink(this.whiplinkElement);

				var hit = this.addHit({
					targetElement: targetElement,
					sourceElement: this.sourceElement,
					whiplinkElement: this.whiplinkElement
				});

				this.emit('hit', [hit]);

				this._done();
			}
		}
	}, {
		key: '_miss',
		value: function _miss() {
			var _this7 = this;

			if (this.whiplinkElement) {
				this.whiplinkElement.classList.add(this.options.prefix + 'missed');
				var whiplinkElement = this.whiplinkElement;
				setTimeout(function () {
					_this7.removeWhiplink(whiplinkElement);
				}, 200);

				this.emit('miss', [{ sourceElement: this.sourceElement, whiplinkElement: this.whiplinkElement }]);

				this._done();
			}
		}
	}, {
		key: '_done',
		value: function _done() {
			this.emit('done', [{ sourceElement: this.sourceElement, whiplinkElement: this.whiplinkElement }]);

			this.sourceElement = null;
			this.whiplinkElement = false;
		}
	}, {
		key: 'repaint',
		value: function repaint() {
			var _this8 = this;

			this._reverseForEach(this.hits, function (hit, i) {
				// auto-delete if either source or target is missing
				if (!_this8.options.container.contains(hit.sourceElement) || !_this8.options.container.contains(hit.targetElement)) {
					return _this8.deleteHit(hit);
				}

				// from
				_this8.__styleWhiplinkFrom(hit.whiplinkElement, hit.sourceElement);

				// to

				var _snap = _this8.snap(hit.targetElement, _this8.options.snap);

				var x = _snap.left;
				var y = _snap.top;

				_this8.__styleWhiplinkTo(hit.whiplinkElement, x, y);
			});
		}

		// event delegation

	}, {
		key: 'on',
		value: function on(eventType, callback) {
			if (typeof callback !== 'function') throw new Error('Callback must be a function.');

			this.events = this.events || {};
			this.events[eventType] = this.events[eventType] || [];
			this.events[eventType].push(callback);

			return this; // chainable
		}
	}, {
		key: 'emit',
		value: function emit(eventType) {
			var _this9 = this;

			var args = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

			if (this.events && this.events[eventType]) {
				this.events[eventType].forEach(function (callback) {
					callback.apply(_this9, args);
				});
			}
			return this; // chainable
		}
	}]);

	return WhipLinker;
}();
