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
			container: document.body,
			allowSource: function allowSource(sourceElement) {},
			allowTarget: function allowTarget(targetElement) {}
		};
		this.setOptions(options);

		var style = document.createElement('style');
		style.appendChild(document.createTextNode('\n.' + this.options.prefix + 'whiplink {\n\tposition: absolute;\n\twidth: 0;\n\tpointer-events: none;\n\ttransform-origin: left center;\n\n\theight: 3px;\n\tbackground: black;\n\tmargin-top: -1.5px;\n\tborder-radius: 3px;\n}\n.' + this.options.prefix + 'whiplink.' + this.options.prefix + 'missed {\n\tbackground: red;\n\twidth: 0 !important;\n\ttransition: width 200ms;\n}\n.' + this.options.prefix + 'whiplink.' + this.options.prefix + 'hit {\n\tpointer-events: auto;\n}\n.' + this.options.prefix + 'whiplink.' + this.options.prefix + 'selected {\n\tbackground: rgb(59, 153, 252);\n}'));
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
		document.addEventListener('click', function (e) {
			_this.deselectWhiplinks();
		});
		document.addEventListener('keyup', function (e) {
			if (e.keyCode === 8 || e.keyCode === 46) {
				_this.deleteWhiplinks();
			}
		});
	}

	_createClass(WhipLinker, [{
		key: 'setOptions',
		value: function setOptions() {
			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			return Object.assign(this.options, options);
		}

		// setup

	}, {
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
				_this2._returnsTruthy(_this2.options.allowSource, [{ sourceElement: el, whiplinkElement: _this2.active }], function () {
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
					_this3._returnsTruthy(_this3.options.allowTarget, [{ targetElement: el, sourceElement: _this3.sourceElement, whiplinkElement: _this3.active }], function () {
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
		value: function addSourceElements() {
			var els = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = Array.from(els)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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
		value: function addTargetElements() {
			var els = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = Array.from(els)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
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
	}, {
		key: 'find',
		value: function find(whiplinkElement) {
			return this.list.find(function (hit) {
				return hit.whiplinkElement === whiplinkElement;
			});
		}

		// selection

	}, {
		key: '_hookWhiplink',
		value: function _hookWhiplink(el) {
			var _this4 = this;

			el.addEventListener('click', function (e) {
				_this4.selected.indexOf(el) >= 0 ? _this4.deselectWhiplink(el) : _this4.selectWhiplink(el, e.shiftKey);

				e.stopPropagation();
			});
		}
	}, {
		key: 'selectWhiplink',
		value: function selectWhiplink(el, append) {
			var index = this.selected.indexOf(el);
			if (index < 0) {
				if (!append) this.deselectWhiplinks(this.selected);
				this.selected.push(el);

				var hit = this.find(el);
				if (hit) {
					el.classList.add(this.options.prefix + 'selected');
					this.emit('select', [hit]);
				}
			}
		}
	}, {
		key: 'deselectWhiplink',
		value: function deselectWhiplink(el) {
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
	}, {
		key: 'deselectWhiplinks',
		value: function deselectWhiplinks() {
			var _this5 = this;

			var els = arguments.length <= 0 || arguments[0] === undefined ? this.selected : arguments[0];

			Array.from(els).forEach(function (el) {
				_this5.deselectWhiplink(el);
			});
		}
	}, {
		key: 'deleteWhiplink',
		value: function deleteWhiplink(el) {
			this.deselectWhiplink(el); // make sure it doesn't linger in this.selected

			var hit = this.find(el);
			if (hit) {
				el.parentNode.removeChild(el);
				this.emit('delete', [hit]);
			}
		}
	}, {
		key: 'deleteWhiplinks',
		value: function deleteWhiplinks() {
			var _this6 = this;

			var els = arguments.length <= 0 || arguments[0] === undefined ? this.selected : arguments[0];

			Array.from(els).forEach(function (el) {
				_this6.deleteWhiplink(el);
			});
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
		key: '__from',
		value: function __from(sourceElement, whipLinkElement) {
			this._offset = this.snap(sourceElement, this.options.snap);
			whipLinkElement.style.left = this._offset.left + 'px';
			whipLinkElement.style.top = this._offset.top + 'px';
		}
	}, {
		key: '_from',
		value: function _from(sourceElement) {
			var whiplink = document.createElement('div');
			whiplink.className = this.options.prefix + 'whiplink';
			this.options.container.appendChild(whiplink);

			this.__from(sourceElement, whiplink);

			this.active = whiplink;
			this.sourceElement = sourceElement;

			this.emit('from', [{ sourceElement: sourceElement, whiplinkElement: whiplink }]);
		}
	}, {
		key: '__to',
		value: function __to(whiplinkElement, x, y) {
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
			if (this.active) {
				this.__to(this.active, x, y);

				this.emit('to', [{ x: x, y: y, sourceElement: this.sourceElement, whiplinkElement: this.active }]);
			}
		}
	}, {
		key: '_hit',
		value: function _hit(el) {
			if (this.active) {
				var offset = this.snap(el, this.options.snap);
				this._to(offset.left, offset.top);

				this._hookWhiplink(this.active);

				var hit = {
					targetElement: el,
					sourceElement: this.sourceElement,
					whiplinkElement: this.active
				};
				this.list.push(hit);
				this.active.classList.add(this.options.prefix + 'hit');

				this.emit('hit', [hit]);

				this._done();
			}
		}
	}, {
		key: '_miss',
		value: function _miss() {
			if (this.active) {
				this.active.classList.add(this.options.prefix + 'missed');
				var el = this.active;
				setTimeout(function () {
					el.parentNode.removeChild(el);
				}, 200);

				this.emit('miss', [{ sourceElement: this.sourceElement, whiplinkElement: this.active }]);

				this._done();
			}
		}
	}, {
		key: '_done',
		value: function _done() {
			this.emit('done', [{ sourceElement: this.sourceElement, whiplinkElement: this.active }]);

			this.sourceElement = null;
			this.active = false;
		}
	}, {
		key: 'repaint',
		value: function repaint() {
			var _this7 = this;

			this.list.forEach(function (hit) {
				// from
				_this7.__from(hit.sourceElement, hit.whiplinkElement);

				// to

				var _snap = _this7.snap(hit.targetElement, _this7.options.snap);

				var x = _snap.left;
				var y = _snap.top;

				_this7.__to(hit.whiplinkElement, x, y);
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

			return this;
		}
	}, {
		key: 'emit',
		value: function emit(eventType) {
			var _this8 = this;

			var args = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

			if (this.events && this.events[eventType]) {
				this.events[eventType].forEach(function (callback) {
					callback.apply(_this8, args);
				});
			}
			return this;
		}
	}]);

	return WhipLinker;
}();
