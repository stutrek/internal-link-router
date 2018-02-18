'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.InternalLinkRouter = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _reactRouterRedux = require('react-router-redux');

var _scrollparent = require('scrollparent');

var _scrollparent2 = _interopRequireDefault(_scrollparent);

var _quadInOut = require('eases/quad-in-out');

var _quadInOut2 = _interopRequireDefault(_quadInOut);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RAF = function () {
    if (typeof window === 'undefined') {
        return function () {};
    }
    return window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function (cb) {
        setTimeout(cb, 16);
    };
}();

function isBody(element) {
    return element === document.body || element === document.documentElement;
}

function getScrollTop(element) {
    if (isBody(element)) {
        return window.pageYOffset !== undefined ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    } else {
        return element.scrollTop;
    }
}

function scrollToElement(target, topOffset, maxTime) {
    var parent = (0, _scrollparent2.default)(target);
    var startingTop = getScrollTop(parent);

    if (!isBody(parent)) {
        scrollToElement(parent, topOffset, maxTime);
        topOffset = parent.getBoundingClientRect().top;
    }

    var distanceToScroll = void 0;
    if (target) {
        distanceToScroll = target.getBoundingClientRect().top - (topOffset || 0);
    } else {
        distanceToScroll = -startingTop;
    }

    var duration = Math.min(Math.abs(distanceToScroll) * 2, maxTime);
    var startingTime = new Date();
    RAF(function doIt() {
        var time = new Date() - startingTime;
        var ratio = (0, _quadInOut2.default)(Math.min(1, time / duration));
        var distanceSoFar = distanceToScroll * ratio;
        if (isBody(parent)) {
            window.scrollTo(0, distanceSoFar + startingTop);
        } else {
            parent.scrollTop = distanceSoFar + startingTop;
        }
        if (ratio < 1) {
            RAF(doIt);
        }
    });
}

function getState(el) {
    var state = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (el.href) {
        state.currentUrl = el.href;
    }

    if (el.dataset) {
        for (var key in el.dataset) {
            if (el.dataset.hasOwnProperty(key)) {
                // for some reason Object.assign doesn't work in Safari.
                state[key] = el.dataset[key];
            }
        }
    }

    if (el.parentNode && el.parentNode.dataset) {
        return getState(el.parentNode, state);
    }
    return state;
}

var navigationId = 0;

var InternalLinkRouter = exports.InternalLinkRouter = function (_React$Component) {
    _inherits(InternalLinkRouter, _React$Component);

    function InternalLinkRouter() {
        var _ref;

        var _temp, _this, _ret;

        _classCallCheck(this, InternalLinkRouter);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = InternalLinkRouter.__proto__ || Object.getPrototypeOf(InternalLinkRouter)).call.apply(_ref, [this].concat(args))), _this), _this.handleClick = function (event) {
            if (event.defaultPrevented || event.metaKey) {
                return;
            }

            var el = event.target;
            var a;
            while (el && el.parentNode) {
                if (el.nodeName === 'A' || el.dataset && el.dataset.backButton) {
                    a = el;
                    break;
                }
                el = el.parentNode;
            }

            if (!a || a.target || a.getAttribute('download')) {
                return;
            }

            if (a.dataset && a.dataset.backButton) {
                _this.props.goBack();
                return;
            }

            var href = a.getAttribute('href');

            if (_this.props.routeInterceptor) {
                var shouldContinue = _this.props.routeInterceptor(href);
                if (!shouldContinue) {
                    event.preventDefault();
                    return;
                }
            }

            if (href && href.charAt(0) === '/' && href.charAt(1) !== '/') {
                event.preventDefault();
                var state = getState(event.target);
                state.navigationId = navigationId++;
                var location = {
                    pathname: a.pathname,
                    search: a.search,
                    hash: a.hash,
                    state: state
                };

                if (a.dataset && a.dataset.replace) {
                    _this.props.replace(location);
                } else {
                    _this.props.redirect(location);
                }
                if (href.indexOf('#') !== -1) {
                    var hash = href.split('#')[1];
                    setTimeout(function () {
                        var scrollToEl = document.getElementById(hash);
                        if (scrollToEl) {
                            scrollToElement(scrollToEl, _this.props.topOffset, 0);
                        }
                    }, 33);
                } else {
                    window.scrollTo(0, 0);
                }
            }

            if (href && href.charAt(0) === '#') {
                var target = document.getElementById(href.substr(1));
                if (target || href === '#') {
                    scrollToElement(target, _this.props.topOffset, 750);
                }
                event.preventDefault();
            }
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(InternalLinkRouter, [{
        key: 'render',
        value: function render() {
            return _react2.default.createElement(
                'div',
                { onClick: this.handleClick, 'data-link-router': true },
                this.props.children
            );
        }
    }]);

    return InternalLinkRouter;
}(_react2.default.Component);

exports.default = (0, _reactRedux.connect)(null, function (dispatch) {
    return {
        redirect: function redirect(url) {
            return dispatch((0, _reactRouterRedux.push)(url));
        },
        replace: function replace(url) {
            return dispatch((0, _reactRouterRedux.replace)(url));
        },
        goBack: function goBack() {
            return dispatch((0, _reactRouterRedux.goBack)());
        }
    };
})(InternalLinkRouter);
//# sourceMappingURL=index.js.map