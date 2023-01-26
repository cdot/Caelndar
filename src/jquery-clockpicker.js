/*!
 * ClockPicker v0.0.7 (http://weareoutman.github.io/clockpicker/)
 * Copyright 2014 Wang Shenwei.
 * Licensed under MIT (https://github.com/weareoutman/clockpicker/blob/gh-pages/LICENSE)
* Converted to ESM, made scalable by font size by Crawford Currie 2023
 */

/* eslint-env browser, jquery */

// Can I use inline svg ?
const svgNS = 'http://www.w3.org/2000/svg';
const svgSupported = 'SVGAngle' in window
      && (() => {
				const el = document.createElement('div');
			  el.innerHTML = '<svg/>';
			  const supported = (el.firstChild
                           && el.firstChild.namespaceURI) == svgNS;
			  el.innerHTML = '';
			  return supported;
		  })();

// Can I use transition ?
const transitionSupported = (() => {
	const style = document.createElement('div').style;
	return 'transition' in style ||
	'WebkitTransition' in style ||
	'MozTransition' in style ||
	'msTransition' in style ||
	'OTransition' in style;
})();

// Listen to touch events in touch screen device, instead of mouse events
// in desktop (touch-punch may already have redirected them?)
const touchSupported = 'ontouchstart' in window;
const mousedownEvent = 'mousedown' + ( touchSupported ? ' touchstart' : '');
const	mousemoveEvent = 'mousemove.clockpicker'
      + ( touchSupported ? ' touchmove.clockpicker' : '');
const mouseupEvent = 'mouseup.clockpicker'
      + ( touchSupported ? ' touchend.clockpicker' : '');

// Vibrate the device if supported
const vibrate = navigator.vibrate
      ? 'vibrate' : navigator.webkitVibrate ? 'webkitVibrate' : null;

function createSvgElement(name) {
	return document.createElementNS(svgNS, name);
}

function leadingZero(num) {
	return (num < 10 ? '0' : '') + num;
}

// Get a unique id
let idCounter = 0;
function uniqueId(prefix) {
	const id = ++idCounter + '';
	return prefix ? prefix + id : id;
}

const duration = transitionSupported ? 350 : 1;

// Popover template
const tpl = [
	'<div class="clockpicker-popover ui-widget">',
	'<div class="arrow"></div>',
	'<div class="popover-title">',
	'<span class="clockpicker-span-hours ui-state-highlight"></span>',
	' : ',
	'<span class="clockpicker-span-minutes"></span>',
	'<span class="clockpicker-span-am-pm"></span>',
	'</div>',
	'<div class="popover-content">',
	'<div class="clockpicker-plate">',
	'<div class="clockpicker-canvas"></div>',
	'<div class="clockpicker-dial clockpicker-hours"></div>',
	'<div class="clockpicker-dial clockpicker-minutes clockpicker-dial-out"></div>',
	'</div>',
	'<span class="clockpicker-am-pm-block">',
	'</span>',
	'</div>',
	'</div>'
].join('');

function raiseCallback(callbackFunction) {
	if (callbackFunction && typeof callbackFunction === "function") {
		callbackFunction();
	}
}

class ClockPicker {

	// Default options
	static DEFAULTS = {
		default: '',
		fromnow: 0,
		placement: 'bottom',
		align: 'left',
		donetext: 'Done',    // done button text
		autoclose: false,    // auto close when minute is selected
		twelvehour: false, // change to 12 hour AM/PM clock from 24 hour
		vibrate: true        // vibrate the device when dragging clock hand
	};

  /**
   * @param {jQuery} $element input element
   * @param {object} options layout and interaction options. See widget
   * description for details.
   */
  constructor($element, options) {
		this.$element = $element;
		this.options = options;

		this.id = uniqueId('cp');

		this.$popover = $(tpl);
    this.$popover.css("font-size", "smaller");
    this.$plate = $('.clockpicker-plate', this.$popover);
		this.$hoursView = $('.clockpicker-hours', this.$popover);
		this.$minutesView = $('.clockpicker-minutes', this.$popover);
		const $amPmBlock = $('.clockpicker-am-pm-block', this.$popover);
		this.isInput = $element.prop('tagName') === 'INPUT';
		this.$input = this.isInput ? $element : $('input', $element);
		this.$addon = $('.input-group-addon', $element);

		this.isAppended = false;
		this.isShown = false;
		this.currentView = 'hours';
		this.spanHours = $('.clockpicker-span-hours', this.$popover);
		this.spanMinutes = $('.clockpicker-span-minutes', this.$popover);
		this.spanAmPm = $('.clockpicker-span-am-pm', this.$popover);
		this.amOrPm = "PM";

    // Layout is calculated on the basis of a 24px font.
    const font_factor =
          parseInt($(this.$element).css("font-size").replace("px", "")) / 24;

    this.outerRadius = 80 * font_factor;
    // innerRadius = 80 on 12 hour clock
    this.innerRadius = 54 * font_factor;
    this.dialRadius = 100 * font_factor;
    this.tickRadius = 13 * font_factor;

		// Setup for for 12 hour clock if option is selected
		if (options.twelvehour) {
			$('<button type="button" class="btn btn-sm btn-default clockpicker-button am-button">' + "AM" + '</button>')
			.on("click", () => {
				this.amOrPm = "AM";
				$('.clockpicker-span-am-pm').empty().append('AM');
			}).appendTo($amPmBlock);

			$('<button type="button" class="btn btn-sm btn-default clockpicker-button pm-button">' + "PM" + '</button>')
			.on("click", () => {
				this.amOrPm = 'PM';
				$('.clockpicker-span-am-pm').empty().append('PM');
			}).appendTo($amPmBlock);
		}

		if (!options.autoclose) {
			// If autoclose is not set, append a button
			$('<button type="button" class="btn btn-sm btn-default btn-block clockpicker-button">' + options.donetext + '</button>')
			.click($.proxy(this.done, this))
			.appendTo(this.$popover);
		}

		// Placement and arrow align - make sure they make sense.
		if ((options.placement === 'top' || options.placement === 'bottom')
        && (options.align === 'top' || options.align === 'bottom'))
      options.align = 'left';
		if ((options.placement === 'left' || options.placement === 'right')
        && (options.align === 'left' || options.align === 'right'))
      options.align = 'top';
		this.$popover.addClass(options.placement);
		this.$popover.addClass(`arrow-${options.align}`);

		this.spanHours.click($.proxy(this.toggleView, this, 'hours'));
		this.spanMinutes.click($.proxy(this.toggleView, this, 'minutes'));

		// Show or toggle
		this.$input.on(
      'focus.clockpicker click.clockpicker',
      $.proxy(this.show, this));
		this.$addon.on(
      'click.clockpicker',
      $.proxy(this.toggle, this));

		// Build ticks
		const tickTpl = $('<div class="clockpicker-tick"></div>');

		// Hours view
		if (options.twelvehour) {
			for (let i = 1; i < 13; i += 1) {
				const tick = tickTpl.clone();
				const radian = i / 6 * Math.PI;
				const radius = this.outerRadius;
				tick.css('font-size', '120%');
				tick.css({
					left: this.dialRadius + Math.sin(radian) * radius - this.tickRadius,
					top: this.dialRadius - Math.cos(radian) * radius - this.tickRadius
				});
				tick.html(i === 0 ? '00' : i);
				this.$hoursView.append(tick);
				tick.on(mousedownEvent, e => this.handle_mousedown(e));
			}
		} else {
			for (let i = 0; i < 24; i += 1) {
				const tick = tickTpl.clone();
				const radian = i / 6 * Math.PI;
				const inner = i > 0 && i < 13;
				const radius = inner ? this.innerRadius : this.outerRadius;
				tick.css({
					left: this.dialRadius + Math.sin(radian) * radius - this.tickRadius,
					top: this.dialRadius - Math.cos(radian) * radius - this.tickRadius
				});
				if (inner) {
					tick.css('font-size', '120%');
				}
				tick.html(i === 0 ? '00' : i);
				this.$hoursView.append(tick);
				tick.on(mousedownEvent, e => this.handle_mousedown(e));
			}
		}

		// Minutes view
		for (let i = 0; i < 60; i += 5) {
			const tick = tickTpl.clone();
			const radian = i / 30 * Math.PI;
			tick.css({
				left: this.dialRadius + Math.sin(radian) * this.outerRadius - this.tickRadius,
				top: this.dialRadius - Math.cos(radian) * this.outerRadius - this.tickRadius
			});
			//tick.css('font-size', '120%');
			tick.html(leadingZero(i));
			this.$minutesView.append(tick);
			tick.on(mousedownEvent, e => this.handle_mousedown(e));
		}

		// Clicking on minutes view space
		this.$plate.on(mousedownEvent, e => {
			if ($(e.target).closest('.clockpicker-tick').length === 0) {
				this.handle_mousedown(e, true);
			}
		});

		if (svgSupported) {
			// Draw clock hands and others
      const diameter = this.dialRadius * 2;
      this.$plate.width(diameter);
      this.$plate.height(diameter);
			this.$canvas = $('.clockpicker-canvas', this.$popover);
			const svg = createSvgElement('svg');
			svg.setAttribute('class', 'clockpicker-svg');
			svg.setAttribute('width', diameter);
			svg.setAttribute('height', diameter);
			const g = createSvgElement('g');
			g.setAttribute('transform', 'translate(' + this.dialRadius + ',' + this.dialRadius + ')');
			var bearing = createSvgElement('circle');
			bearing.setAttribute('class', 'clockpicker-canvas-bearing');
			bearing.setAttribute('cx', 0);
			bearing.setAttribute('cy', 0);
			bearing.setAttribute('r', 2);
			const hand = createSvgElement('line');
			hand.setAttribute('x1', 0);
			hand.setAttribute('y1', 0);
			const bg = createSvgElement('circle');
			bg.setAttribute('class', 'clockpicker-canvas-bg');
			bg.setAttribute('r', this.tickRadius);
			const fg = createSvgElement('circle');
			fg.setAttribute('class', 'clockpicker-canvas-fg');
			fg.setAttribute('r', 3.5);
			g.appendChild(hand);
			g.appendChild(bg);
			g.appendChild(fg);
			g.appendChild(bearing);
			svg.appendChild(g);
			this.$canvas.append(svg);

			this.hand = hand;
			this.bg = bg;
			this.fg = fg;
			this.bearing = bearing;
			this.g = g;
		}

		raiseCallback(this.options.init);
	}

  handle_mousedown(e, space) {
		const offset = this.$plate.offset();
		const isTouch = /^touch/.test(e.type);
		const x0 = offset.left + this.dialRadius;
		const y0 = offset.top + this.dialRadius;
		const dx = (isTouch ? e.originalEvent.touches[0] : e).pageX - x0;
		const dy = (isTouch ? e.originalEvent.touches[0] : e).pageY - y0;
		const z = Math.sqrt(dx * dx + dy * dy);
		let moved = false;

		// When clicking on minutes view space, check the mouse position
		if (space && (z < this.outerRadius - this.tickRadius || z > this.outerRadius + this.tickRadius)) {
			return;
		}
		e.preventDefault();

		// Set cursor style of body after 200ms
		const movingTimer = setTimeout(
      () => $("body").addClass('clockpicker-moving'), 200);

		// Place the canvas to top
		if (svgSupported)
			this.$plate.append(this.$canvas);

		// Clock
		this.setHand(dx, dy, ! space, true);

		$(document)
    .off(mousemoveEvent)
    .on(mousemoveEvent, e => {
			e.preventDefault();
			const isTouch = /^touch/.test(e.type);
			const x = (isTouch ? e.originalEvent.touches[0] : e).pageX - x0;
			const y = (isTouch ? e.originalEvent.touches[0] : e).pageY - y0;
			if (! moved && x === dx && y === dy) {
				// Clicking in chrome on windows will trigger a mousemove event
				return;
			}
			moved = true;
			this.setHand(x, y, false, true);
		});

		$(document)
    .off(mouseupEvent)
    .on(mouseupEvent, e => {
			$(document).off(mouseupEvent);
			e.preventDefault();
			const isTouch = /^touch/.test(e.type);
			const x = (isTouch ? e.originalEvent.changedTouches[0] : e).pageX - x0;
			const y = (isTouch ? e.originalEvent.changedTouches[0] : e).pageY - y0;
			if ((space || moved) && x === dx && y === dy) {
				this.setHand(x, y);
			}
			if (this.currentView === 'hours') {
				this.toggleView('minutes', duration / 2);
			} else {
				if (this.options.autoclose) {
					this.$minutesView.addClass('clockpicker-dial-out');
					setTimeout(() => this.done(), duration / 2);
				}
			}
			this.$plate.prepend(this.$canvas);

			// Reset cursor style of body
			clearTimeout(movingTimer);
			$("body").removeClass('clockpicker-moving');

			// Unbind mousemove event
			$(document).off(mousemoveEvent);
		});
	}

	// Show or hide popover
	toggle(){
		this[this.isShown ? 'hide' : 'show']();
	}

	// Set popover position
	locate() {
		const offset = this.$element.offset();
		const width = this.$element.outerWidth();
		const height = this.$element.outerHeight();
		const styles = {};

		this.$popover.show();

		// Place the popover
		switch (this.options.placement) {
		case 'bottom':
			styles.top = offset.top + height;
			break;
		case 'right':
			styles.left = offset.left + width;
			break;
		case 'top':
			styles.top = offset.top - this.$popover.outerHeight();
			break;
		case 'left':
			styles.left = offset.left - this.$popover.outerWidth();
			break;
		}

		// Align the popover arrow
		switch (this.options.align) {
		case 'left':
			styles.left = offset.left;
			break;
		case 'right':
			styles.left = offset.left + width - this.$popover.outerWidth();
			break;
		case 'top':
			styles.top = offset.top;
			break;
		case 'bottom':
			styles.top = offset.top + height - this.$popover.outerHeight();
			break;
		}

		this.$popover.css(styles);
	}

	// Show popover
	show() {
		// Not show again
		if (this.isShown) {
			return;
		}

		raiseCallback(this.options.beforeShow);

		// Initialize
		if (!this.isAppended) {
			$("body").append(this.$popover);

			// Reset position when resize
			$(window)
      .on('resize.clockpicker' + this.id, () => {
				if (this.isShown)
					this.locate();
			});

			this.isAppended = true;
		}

		// Get the time
		let value = ((this.$input.prop('value')
                    || this.options.default
                    || '') + '').split(':');
		if (value[0] === 'now') {
			const now = new Date(+ new Date() + this.options.fromnow);
			value = [
				now.getHours(),
				now.getMinutes()
			];
		}
		this.hours = + value[0] || 0;
		this.minutes = + value[1] || 0;
		this.spanHours.html(leadingZero(this.hours));
		this.spanMinutes.html(leadingZero(this.minutes));

		// Toggle to hours view
		this.toggleView('hours');

		// Set position
		this.locate();

		this.isShown = true;

		// Hide when clicking or tabbing on any element except the clock, input and addon
		$(document)
    .on(`click.clockpicker.${this.id} focusin.clockpicker.${this.id}`,
        e => {
			    const target = $(e.target);
			    if (target.closest(this.$popover).length === 0 &&
					    target.closest(this.$addon).length === 0 &&
					    target.closest(this.$input).length === 0) {
				    this.hide();
			    }
		    });

		// Hide when ESC is pressed
		$(document).on(`keyup.clockpicker.${this.id}`, e => {
			if (e.keyCode === 27) {
				this.hide();
			}
		});

		raiseCallback(this.options.afterShow);
	}

	// Hide popover
	hide() {
		raiseCallback(this.options.beforeHide);

		this.isShown = false;

		// Unbinding events on document
		$(document).off(`click.clockpicker.${this.id} focusin.clockpicker.${this.id}`);
		$(document).off(`keyup.clockpicker.${this.id}`);

		this.$popover.hide();

		raiseCallback(this.options.afterHide);
	}

	// Toggle to hours or minutes view
	toggleView(view, delay) {
	  let raiseAfterHourSelect = false;
		if (view === 'minutes' && $(this.$hoursView).css("visibility") === "visible") {
			raiseCallback(this.options.beforeHourSelect);
			raiseAfterHourSelect = true;
		}
		const isHours = view === 'hours';
		const nextView = isHours ? this.$hoursView : this.$minutesView;
		const hideView = isHours ? this.$minutesView : this.$hoursView;

		this.currentView = view;

		this.spanHours.toggleClass('ui-state-highlight', isHours);
		this.spanMinutes.toggleClass('ui-state-highlight', ! isHours);

		// Let's make transitions
		hideView.addClass('clockpicker-dial-out');
		nextView.css('visibility', 'visible').removeClass('clockpicker-dial-out');

		// Reset clock hand
		this.resetClock(delay);

		// After transitions ended
		clearTimeout(this.toggleViewTimer);
		this.toggleViewTimer =
    setTimeout(() => hideView.css('visibility', 'hidden'), duration);

		if (raiseAfterHourSelect) {
			raiseCallback(this.options.afterHourSelect);
		}
	}

	// Reset clock hand
	resetClock(delay) {
		const view = this.currentView;
		const value = this[view];
		const isHours = view === 'hours';
		const unit = Math.PI / (isHours ? 6 : 30);
		const radian = value * unit;
		const radius = isHours && value > 0 && value < 13 ? this.innerRadius : this.outerRadius;
		const x = Math.sin(radian) * radius;
		const y = - Math.cos(radian) * radius;
		if (svgSupported && delay) {
			this.$canvas.addClass('clockpicker-canvas-out');
			setTimeout(() => {
				this.$canvas.removeClass('clockpicker-canvas-out');
				this.setHand(x, y);
			}, delay);
		} else {
			this.setHand(x, y);
		}
	}

	// Set clock hand to (x, y)
	setHand(x, y, roundBy5, dragging) {
		let radian = Math.atan2(x, - y);
		const isHours = this.currentView === 'hours';
		const unit = Math.PI / (isHours || roundBy5 ? 6 : 30);
		const z = Math.sqrt(x * x + y * y);
		const options = this.options;
		const inner = isHours && z < (this.outerRadius + this.innerRadius) / 2;
		let radius = inner ? this.innerRadius : this.outerRadius;
		let value;

		if (options.twelvehour) {
			radius = this.outerRadius;
		}

		// Radian should in range [0, 2PI]
		if (radian < 0) {
			radian = Math.PI * 2 + radian;
		}

		// Get the round value
		value = Math.round(radian / unit);

		// Get the round radian
		radian = value * unit;

		// Correct the hours or minutes
		if (options.twelvehour) {
			if (isHours) {
				if (value === 0) {
					value = 12;
				}
			} else {
				if (roundBy5) {
					value *= 5;
				}
				if (value === 60) {
					value = 0;
				}
			}
		} else {
			if (isHours) {
				if (value === 12) {
					value = 0;
				}
				value = inner ? (value === 0 ? 12 : value) : value === 0 ? 0 : value + 12;
			} else {
				if (roundBy5) {
					value *= 5;
				}
				if (value === 60) {
					value = 0;
				}
			}
		}

		// Once hours or minutes changed, vibrate the device
		if (this[this.currentView] !== value) {
			if (vibrate && this.options.vibrate) {
				// Do not vibrate too frequently
				if (! this.vibrateTimer) {
					navigator[vibrate](10);
					this.vibrateTimer = setTimeout($.proxy(() => {
						this.vibrateTimer = null;
					}, this), 100);
				}
			}
		}

		this[this.currentView] = value;
		this[isHours ? 'spanHours' : 'spanMinutes'].html(leadingZero(value));

		// If svg is not supported, just add an active class to the tick
		if (! svgSupported) {
			this[isHours ? '$hoursView' : '$minutesView']
      .find('.clockpicker-tick')
      .each(() => {
				const tick = $(this);
				tick.toggleClass('active', value === + tick.html());
			});
			return;
		}

		// Place clock hand at the top when dragging
		if (dragging || (! isHours && value % 5)) {
			this.g.insertBefore(this.hand, this.bearing);
			this.g.insertBefore(this.bg, this.fg);
			this.bg.setAttribute('class', 'clockpicker-canvas-bg clockpicker-canvas-bg-trans');
		} else {
			// Or place it at the bottom
			this.g.insertBefore(this.hand, this.bg);
			this.g.insertBefore(this.fg, this.bg);
			this.bg.setAttribute('class', 'clockpicker-canvas-bg');
		}

		// Set clock hand and others' position
		const cx = Math.sin(radian) * radius;
		const cy = - Math.cos(radian) * radius;
		this.hand.setAttribute('x2', cx);
		this.hand.setAttribute('y2', cy);
		this.bg.setAttribute('cx', cx);
		this.bg.setAttribute('cy', cy);
		this.fg.setAttribute('cx', cx);
		this.fg.setAttribute('cy', cy);
	}

	// Hours and minutes are selected
	done() {
		raiseCallback(this.options.beforeDone);
		this.hide();
		const last = this.$input.prop('value');
		let value = leadingZero(this.hours) + ':' + leadingZero(this.minutes);
		if  (this.options.twelvehour) {
			value = value + this.amOrPm;
		}

		this.$input.prop('value', value);
		if (value !== last) {
			this.$input.triggerHandler('change');
			if (!this.isInput) {
				this.$element.trigger('change');
			}
		}

		if (this.options.autoclose) {
			this.$input.trigger('blur');
		}

		raiseCallback(this.options.afterDone);
	}

	// Remove clockpicker from input
	remove() {
		this.$element.removeData('clockpicker');
		this.$input.off('focus.clockpicker click.clockpicker');
		this.$addon.off('click.clockpicker');
		if (this.isShown) {
			this.hide();
		}
		if (this.isAppended) {
			$(window).off('resize.clockpicker' + this.id);
			this.$popover.remove();
		}
	}
}

/**
 * @param {object|string} options if object, interaction and layout options.
 * If string, anme of a ClockPicker method to invoke, one of "show", "hide",
 * "remove", or "toggleView".
 * @param {number} options.default default time, 'now' or '13:14' default: ''
 * @param {string} options.placement popover placement default: 'bottom'
 * @param {string} options.align popover arrow align default: 'left'
 * @param {string} options.donetext done button text default: 'Done'
 * @param {boolean} options.autoclose auto close when minute is
 * selected default: false
 * @param {boolean} options.twelvehour enables twelve hour mode with
 * AM & PM buttons default: false
 * @param {boolean} options.vibrate vibrate the device when dragging
 * clock hand default: true
 * @param {number} options.fromnow set default time to * milliseconds
 * from now (using with default = 'now') default: 0
 * @param {function} options.init callback function triggered after
 * the colorpicker has been initiated
 * @param {function} options.beforeShow callback function triggered
 * before popup is shown
 * @param {function} options.afterShow callback function triggered
 * after popup is shown
 * @param {function} options.beforeHide callback function triggered
 * before popup is hidden Note:will be triggered between beforeDone
 * and afterDone
 * @param {function} options.afterHide callback function triggered
 * after popup is hidden Note: will be triggered between beforeDone
 * and afterDone
 * @param {function} options.beforeHourSelect callback function
 * triggered before user makes an hour selection
 * @param {function} options.afterHourSelect callback function
 * triggered after user makes an hour selection
 * @param {function} options.beforeDone callback function triggered
 * before time is written to input
 * @param {function} options.afterDone callback function triggered
 * after time is written to input
 */
$.fn.clockpicker = function(...args) {
  const option = args[0];
	return this.each(function() {
		const $this = $(this);
		const instance = $this.data('clockpicker');
		if (!instance) {
			const options = $.extend(
        {}, ClockPicker.DEFAULTS, $this.data(),
        typeof option == 'object' && option);
			$this.data('clockpicker', new ClockPicker($this, options));
		} else {
			// Manual operations. show, hide, remove, toggleView
      // e.g. $object.clockpicker("show")
			if (typeof instance[option] === 'function') {
				instance[option].apply(instance, args);
			}
		}
	});
};

