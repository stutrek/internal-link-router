import React from 'react';
import { connect } from 'react-redux';
import { push, replace, goBack } from 'react-router-redux';

import Scrollparent from 'scrollparent';

import easeInOut from 'eases/quad-in-out';

const RAF = (function () {
    if (typeof window === 'undefined') {
        return () => {};
    }
    return window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function (cb) { setTimeout(cb, 16); };
})();

function isBody (element) {
    return element === document.body || element === document.documentElement;
}

function getScrollTop (element) {
    if (isBody(element)) {
        return (window.pageYOffset !== undefined)
                ? window.pageYOffset
                : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    } else {
        return element.scrollTop;
    }
}

function scrollToElement (target, topOffset, maxTime) {
    let parent = Scrollparent(target);
    let startingTop = getScrollTop(parent);

    if (!isBody(parent)) {
        scrollToElement(parent, topOffset, maxTime);
        topOffset = parent.getBoundingClientRect().top;
    }

    let distanceToScroll;
    if (target) {
        distanceToScroll = target.getBoundingClientRect().top - (topOffset || 0);
    } else {
        distanceToScroll = -startingTop;
    }

    let duration = Math.min(Math.abs(distanceToScroll) * 2, maxTime);
    let startingTime = new Date();
    RAF(function doIt() {
        let time = new Date() - startingTime;
        let ratio = easeInOut(Math.min(1, time / duration));
        let distanceSoFar = distanceToScroll * ratio;
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

function getState (el, state={}) {
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

export class InternalLinkRouter extends React.Component {

    handleClick = (event) => {
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
            this.props.goBack();
            return;
        }

        var href = a.getAttribute('href');

        if (this.props.routeInterceptor) {
            let shouldContinue = this.props.routeInterceptor(href);
            if (!shouldContinue) {
                event.preventDefault();
                return;
            }
        }

        if (href && href.charAt(0) === '/' && href.charAt(1) !== '/') {
            event.preventDefault();
            let state =  getState(event.target);
            state.navigationId = navigationId++;
            let location = {
                pathname: a.pathname,
                search: a.search,
                hash: a.hash,
                state
            };

            if (a.dataset && a.dataset.replace) {
                this.props.replace(location);
            } else {
                this.props.redirect(location);
            }
            if (href.indexOf('#') !== -1) {
                let hash = href.split('#')[1];
                setTimeout(() => {
                    let scrollToEl = document.getElementById(hash);
                    if (scrollToEl) {
                        scrollToElement(scrollToEl, this.props.topOffset, 0);
                    }
                }, 33);
            } else {
                window.scrollTo(0, 0);
            }
        }

        if (href && href.charAt(0) === '#') {
            let target = document.getElementById(href.substr(1));
            if (target || href === '#') {
                scrollToElement(target, this.props.topOffset, 750);
            }
            event.preventDefault();
        }
    }

    render () {
        return (<div onClick={this.handleClick} data-link-router>
            {this.props.children}
        </div>);
    }
}

export default connect(null, function (dispatch) {
    return {
        redirect: (url) => dispatch(push(url)),
        replace: (url) => dispatch(replace(url)),
        goBack: () => dispatch(goBack())
    };
})(InternalLinkRouter);
