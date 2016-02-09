'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WhipLinker = function () {
	function WhipLinker(sourceElementsOrSelector, targetElementsOrSelector) {
		var _this = this;

		var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

		_classCallCheck(this, WhipLinker);

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
					pointerEvents: 'none'
				}
			},
			allowSource: function allowSource(sourceElement) {},
			allowTarget: function allowTarget(targetElement) {}
		}, options);

		// init
		var _WhipLinker = this;
		this.active = false;
		this.sourceElements = [];
		this.targetElements = [];

		// hooks
		this.addSourceElements(typeof sourceElementsOrSelector === 'string' ? document.querySelectorAll(sourceElementsOrSelector) : sourceElementsOrSelector);
		this.addTargetElements(typeof targetElementsOrSelector === 'string' ? document.querySelectorAll(targetElementsOrSelector) : targetElementsOrSelector);
		document.addEventListener('mousemove', function (e) {
			if (_this.active) {
				_this._to(e.clientX, e.clientY);
			}
		});
		document.addEventListener('mouseup', function (e) {
			if (_this.active) {
				_this._miss();
			}
		});
	}

	// setup


	_createClass(WhipLinker, [{
		key: '_returnsTruthy',
		value: function _returnsTruthy(fn, args) {
			var yes = arguments.length <= 2 || arguments[2] === undefined ? function () {} : arguments[2];
			var no = arguments.length <= 3 || arguments[3] === undefined ? function () {} : arguments[3];

			if (typeof fn === 'function') {
				var returnValue = fn.apply(this, args);
				if (returnValue !== undefined) {
					if (!returnValue) {
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
	}, {
		key: '_hookSourceElement',
		value: function _hookSourceElement(el) {
			var _this2 = this;

			el.addEventListener('mousedown', function (e) {
				_this2._returnsTruthy(_this2.options.allowSource, [el], function () {
					_this2._from(el);

					e.preventDefault();
				});
			});
		}
	}, {
		key: '_hookTargetElement',
		value: function _hookTargetElement(el) {
			var _this3 = this;

			el.addEventListener('mouseup', function (e) {
				if (_this3.active) {
					_this3._returnsTruthy(_this3.options.allowTarget, [el], function () {
						_this3._hit(el);
					}, function () {
						_this3._miss();
					});
				}
			});
		}
	}, {
		key: 'addSourceElement',
		value: function addSourceElement(el) {
			this.sourceElements.push(el);
			this._hookSourceElement(el);
		}
	}, {
		key: 'addTargetElement',
		value: function addTargetElement(el) {
			this.targetElements.push(el);
			this._hookTargetElement(el);
		}
	}, {
		key: 'addSourceElements',
		value: function addSourceElements(els) {
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = els[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var el = _step.value;

					this.addSourceElement(el);
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
		key: 'addTargetElements',
		value: function addTargetElements(els) {
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = els[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var el = _step2.value;

					this.addTargetElement(el);
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

		// drawing

	}, {
		key: '_snap',
		value: function _snap(el) {
			var snapTo = arguments.length <= 1 || arguments[1] === undefined ? 'center center' : arguments[1];

			var offset = el.getBoundingClientRect();

			return {
				left: offset.left + (/left/.test(snapTo) ? 0 : /right/.test(snapTo) ? offset.width : offset.width / 2),
				top: offset.top + (/top/.test(snapTo) ? 0 : /bottom/.test(snapTo) ? offset.height : offset.height / 2)
			};
		}
	}, {
		key: '_from',
		value: function _from(el) {
			var whiplink = document.createElement('div');
			whiplink.className = this.options.prefix + 'whiplink';
			for (var property in this.options.styles.whiplink) {
				whiplink.style[property] = this.options.styles.whiplink[property];
			}
			this.options.container.appendChild(whiplink);
			this.offset = this._snap(el, this.options.snap);
			whiplink.style.left = this.offset.left + 'px';
			whiplink.style.top = this.offset.top + 'px';
			this.active = whiplink;

			this.sourceElement = el;

			this.emit('from', [el, this.active]);
		}
	}, {
		key: '_to',
		value: function _to(x, y) {
			if (this.active) {
				x -= this.offset.left;
				y -= this.offset.top;

				var length = Math.sqrt(x * x + y * y),
				    angle = Math.atan(y / x) * // get theta
				180 / Math.PI + ( // to degrees
				x < 0 ? 180 : 0); // quadrants II & III

				this.active.style.width = length + 'px';
				this.active.style.transform = 'rotate(' + angle + 'deg)';

				this.emit('to', [x, y]);
			}
		}
	}, {
		key: '_hit',
		value: function _hit(el) {
			if (this.active) {
				var offset = this._snap(el, this.options.snap);
				this._to(offset.left, offset.top);

				this.emit('hit', [el, this.sourceElement, this.active]);

				this.sourceElement = null;
				this.active = false;
			}
		}
	}, {
		key: '_miss',
		value: function _miss() {
			if (this.active) {
				this.active.style.transition = 'width 200ms';
				this.active.style.width = 0;
				var el = this.active;
				setTimeout(function () {
					el.parentNode.removeChild(el);
				}, 200);

				this.emit('miss', [this.sourceElement, this.active]);

				this.sourceElement = null;
				this.active = false;
			}
		}

		// event delegation

	}, {
		key: 'on',
		value: function on(eventType, callback) {
			if (typeof callback !== 'function') throw new Error('Callback must be a function.');

			this.events = this.events || {};
			this.events[eventType] = this.events[eventType] || [];
			this.events[eventType].push(callback);

			return this;
		}
	}, {
		key: 'emit',
		value: function emit(eventType) {
			var args = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

			var WhipLinker = this;
			if (this.events && this.events[eventType]) {
				this.events[eventType].forEach(function (callback) {
					callback.apply(WhipLinker, args);
				});
			}
			return this;
		}
	}]);

	return WhipLinker;
}();
