import * as CSS from './lib/css';
import * as DOM from './lib/dom';
import cls from './lib/class-names';
import EventManager from './lib/event-manager';
import processScrollDiff from './process-scroll-diff';
import updateGeometry from './update-geometry';
import { toInt, outerWidth } from './lib/util';

import clickRail from './handlers/click-rail';
import dragThumb from './handlers/drag-thumb';
import keyboard from './handlers/keyboard';
import wheel from './handlers/mouse-wheel';
import touch from './handlers/touch';
import ScrollType from './lib/scroll-type'

const defaultSettings = () => ({
  handlers: ['click-rail', 'drag-thumb', 'keyboard', 'wheel', 'touch'],
  maxScrollbarLength: null,
  minScrollbarLength: null,
  scrollingThreshold: 1000,
  scrollXMarginOffset: 0,
  scrollYMarginOffset: 0,
  suppressScrollX: false,
  suppressScrollY: false,
  swipeEasing: true,
  useBothWheelAxes: false,
  wheelPropagation: true,
  wheelSpeed: 1,
  useTopAndLeft: false,
  postScroll: false
});

const handlers = {
  'click-rail': clickRail,
  'drag-thumb': dragThumb,
  keyboard,
  wheel,
  touch,
};

export default class PerfectScrollbar {
  constructor(element, userSettings = {}) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element || !element.nodeName) {
      throw new Error('no element is specified to initialize PerfectScrollbar');
    }

    this.element = element;

    element.classList.add(cls.main);

    this.settings = defaultSettings();
    for (const key in userSettings) {
      this.settings[key] = userSettings[key];
    }

    this.ST=ScrollType[this.settings.useTopAndLeft ? 'useTopAndLeft' : 'default'];

    this.containerWidth = null;
    this.containerHeight = null;
    this.contentWidth = null;
    this.contentHeight = null;

    const focus = () => element.classList.add(cls.state.focus);
    const blur = () => element.classList.remove(cls.state.focus);

    this.isRtl = CSS.get(element).direction === 'rtl';
    if (this.isRtl === true) {
      element.classList.add(cls.rtl);
    }
    this.isNegativeScroll = (() => {
      const originalScrollLeft = element.scrollLeft;
      let result = null;
      element.scrollLeft = -1;
      result = element.scrollLeft < 0;
      element.scrollLeft = originalScrollLeft;
      return result;
    })();
    this.negativeScrollAdjustment = this.isNegativeScroll
      ? element.scrollWidth - element.clientWidth
      : 0;
    this.event = new EventManager();
    this.ownerDocument = element.ownerDocument || document;

    this.scrollbarXRail = DOM.div(cls.element.rail('x'));
    this.ST.addXRail(element,this.scrollbarXRail);
    //element.appendChild(this.scrollbarXRail);
    this.scrollbarX = DOM.div(cls.element.thumb('x'));
    this.scrollbarXRail.appendChild(this.scrollbarX);
    this.scrollbarX.setAttribute('tabindex', 0);
    this.event.bind(this.scrollbarX, 'focus', focus);
    this.event.bind(this.scrollbarX, 'blur', blur);
    this.scrollbarXActive = null;
    this.scrollbarXWidth = null;
    this.scrollbarXLeft = null;
    const railXStyle = CSS.get(this.scrollbarXRail);
    this.scrollbarXBottom = parseInt(railXStyle.bottom, 10);
    if (isNaN(this.scrollbarXBottom)) {
      this.isScrollbarXUsingBottom = false;
      this.scrollbarXTop = toInt(railXStyle.top);
    } else {
      this.isScrollbarXUsingBottom = true;
    }
    this.railBorderXWidth =
      toInt(railXStyle.borderLeftWidth) + toInt(railXStyle.borderRightWidth);
    // Set rail to display:block to calculate margins
    CSS.set(this.scrollbarXRail, { display: 'block' });
    this.railXMarginWidth =
      toInt(railXStyle.marginLeft) + toInt(railXStyle.marginRight);
    CSS.set(this.scrollbarXRail, { display: '' });
    this.railXWidth = null;
    this.railXRatio = null;

    this.scrollbarYRail = DOM.div(cls.element.rail('y'));
    //element.appendChild(this.scrollbarYRail);
    this.ST.addYRail(element,this.scrollbarYRail);
    this.scrollbarY = DOM.div(cls.element.thumb('y'));
    this.scrollbarYRail.appendChild(this.scrollbarY);
    this.scrollbarY.setAttribute('tabindex', 0);
    this.event.bind(this.scrollbarY, 'focus', focus);
    this.event.bind(this.scrollbarY, 'blur', blur);
    this.scrollbarYActive = null;
    this.scrollbarYHeight = null;
    this.scrollbarYTop = null;
    const railYStyle = CSS.get(this.scrollbarYRail);
    this.scrollbarYRight = parseInt(railYStyle.right, 10);
    if (isNaN(this.scrollbarYRight)) {
      this.isScrollbarYUsingRight = false;
      this.scrollbarYLeft = toInt(railYStyle.left);
    } else {
      this.isScrollbarYUsingRight = true;
    }
    this.scrollbarYOuterWidth = this.isRtl ? outerWidth(this.scrollbarY) : null;
    this.railBorderYWidth =
      toInt(railYStyle.borderTopWidth) + toInt(railYStyle.borderBottomWidth);
    CSS.set(this.scrollbarYRail, { display: 'block' });
    this.railYMarginHeight =
      toInt(railYStyle.marginTop) + toInt(railYStyle.marginBottom);
    CSS.set(this.scrollbarYRail, { display: '' });
    this.railYHeight = null;
    this.railYRatio = null;

    // moved this below rail setup because this.ST.scrollLeft looks for the content in the 3rd child if top scrolling -- it must be set before updateGeometry
    this.isNegativeScroll = (() => {
      const originalScrollLeft = this.ST.scrollLeft(element);
      let result = null;
      this.ST.scrollLeft(element, -1);
      result = this.ST.scrollLeft(element) < 0;
      this.ST.scrollLeft(element,originalScrollLeft);
      return result;
    })();
    this.negativeScrollAdjustment = this.isNegativeScroll
      ? element.scrollWidth - element.clientWidth
      : 0;

    this.reach = {
      x:
        this.ST.scrollLeft(element) <= 0
          ? 'start'
          : this.ST.scrollLeft(element) >= this.contentWidth - this.containerWidth
            ? 'end'
            : null,
      y:
        this.ST.scrollTop(element) <= 0
          ? 'start'
          : this.ST.scrollTop(element) >= this.contentHeight - this.containerHeight
            ? 'end'
            : null,
    };

    this.isAlive = true;

    this.settings.handlers.forEach(handlerName => handlers[handlerName](this));

    this.lastScrollTop = Math.floor(this.ST.scrollTop(element)); // for onScroll only
    this.lastScrollLeft = this.ST.scrollLeft(element); // for onScroll only
    this.event.bind(this.element, 'scroll', e => this.onScroll(e));
    updateGeometry(this);
  }

  update() {
    if (!this.isAlive) {
      return;
    }

    // Recalcuate negative scrollLeft adjustment
    this.negativeScrollAdjustment = this.isNegativeScroll
      ? this.element.scrollWidth - this.element.clientWidth
      : 0;

    // Recalculate rail margins
    CSS.set(this.scrollbarXRail, { display: 'block' });
    CSS.set(this.scrollbarYRail, { display: 'block' });
    this.railXMarginWidth =
      toInt(CSS.get(this.scrollbarXRail).marginLeft) +
      toInt(CSS.get(this.scrollbarXRail).marginRight);
    this.railYMarginHeight =
      toInt(CSS.get(this.scrollbarYRail).marginTop) +
      toInt(CSS.get(this.scrollbarYRail).marginBottom);

    // Hide scrollbars not to affect scrollWidth and scrollHeight
    CSS.set(this.scrollbarXRail, { display: 'none' });
    CSS.set(this.scrollbarYRail, { display: 'none' });

    updateGeometry(this);

    processScrollDiff(this, 'top', 0, false, true);
    processScrollDiff(this, 'left', 0, false, true);

    CSS.set(this.scrollbarXRail, { display: '' });
    CSS.set(this.scrollbarYRail, { display: '' });
  }

  onScroll(e) {
    if (!this.isAlive) {
      return;
    }

    updateGeometry(this);
    processScrollDiff(this, 'top', this.ST.scrollTop(this.element) - this.lastScrollTop);
    processScrollDiff(
      this,
      'left',
      this.ST.scrollLeft(this.element) - this.lastScrollLeft
    );

    this.lastScrollTop = Math.floor(this.ST.scrollTop(this.element));
    this.lastScrollLeft = this.ST.scrollLeft(this.element);
  }

  destroy() {
    if (!this.isAlive) {
      return;
    }

    this.event.unbindAll();
    DOM.remove(this.scrollbarX);
    DOM.remove(this.scrollbarY);
    DOM.remove(this.scrollbarXRail);
    DOM.remove(this.scrollbarYRail);
    this.removePsClasses();

    // unset elements
    this.element = null;
    this.scrollbarX = null;
    this.scrollbarY = null;
    this.scrollbarXRail = null;
    this.scrollbarYRail = null;

    this.isAlive = false;
  }

  removePsClasses() {
    this.element.className = this.element.className
      .split(' ')
      .filter(name => !name.match(/^ps([-_].+|)$/))
      .join(' ');
  }
}
