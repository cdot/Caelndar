/*Copyright (C) Crawford Currie 2023 - All rights reserved*/

import { CalendarEvent } from "./CalendarEvent.js";
import { EditEventDialog } from "./EditEventDialog.js";

/**
 * Get the first instant of the day that the date falls in
 * @param {Date} date date of interest
 * @return {Date} first ms of the day
 */
function startOfDay(date) {
  const s = new Date(date);
  s.setHours(0);
  s.setMinutes(0);
  s.setSeconds(0);
  s.setMilliseconds(0);
  return s;
}

/**
 * Get the last instant of the day that the date falls in
 * @param {Date} date date of interest
 * @return {Date} one ms before midnight
 */
function endOfDay(date) {
  const s = new Date(date);
  s.setHours(23);
  s.setMinutes(59);
  s.setSeconds(59);
  s.setMilliseconds(999);
  return s;
}

/**
 * Get the first instant of the month that the date falls in
 * @param {Date} date date of interest
 * @return {Date} first ms of the month
 */
function startOfMonth(date) {
  const s = new Date(date);
  s.setDate(1);
  s.setHours(0);
  s.setMinutes(0);
  s.setSeconds(0);
  s.setMilliseconds(0);
  return s;
}

/**
 * Get the last instant of the month that the date falls in
 * @param {Date} date date of interest
 * @return {Date} last instant in the month
 * @return {Date} one ms before midnight on the last day of the month
 */
function endOfMonth(date) {
  const s = new Date(date);
  s.setDate(lengthOfMonth(date.getFullYear(), date.getMonth()));
  s.setHours(23);
  s.setMinutes(59);
  s.setSeconds(59);
  s.setMilliseconds(999);
  return s;
}

/**
 * Work out the length of the month
 * @param {number} y year
 * @param {number} m month
 * @return { number} number of days in the month
 */
function lengthOfMonth(y, m) {
  const nMonth = (m + 1) % 12;
  const nYear = m === 11 ? y + 1 : y;
  return new Date(nYear, nMonth, 0).getDate();
}

/**
 * jQuery UI widget for a visual event calendar with a list of events.
 * Each of which has a title and a description.
 */
class EventCalendar {

  /**
   * @param {object} options widget options
   * @param {CalendarEvent[]} options.events optional list of events, may
   * be simple objects that just look like CalendarEvent.
   * @param {boolean?} future_only only allow creation of events today
   * and on future days. default: false
   * @param {object?} editor options passed on the the editor dialog
   */
  constructor(options) {
    /**
     * Widget options
     * @member {object}
     */
    this.options = options || {};

    if (options.events)
      /**
       * List of events in the calendar
       * @member {CalendarEvent[]}
       */
      this.events = options.events.map(e => new CalendarEvent(e));
    else
      this.events = [];

    const today = new Date();

    /**
     * Currently displayed (selected) year
     * @member {number}
     */
    this.selectedYear = today.getFullYear();

    /**
     * Currently displayed (selected) month
     * @member {number}
     */
    this.selectedMonth = today.getMonth();

    /**
     * Currently displayed (selected) year
     * @member {number}
     */
    this.selectedDate = today.getDate();

    /**
     * Event editing dialog
     * @member {number}
     * @private
     */
    this.event_dialog = new EditEventDialog(this.options.editor);
  }

  /**
   * Load a list of events from a URL. Does not refresh the UI.
   */
  load(url) {
    return $.get(url)
    .then(events => {
      this.events = events.map(e => new CalendarEvent(e));
    });
  }

  /**
   * Post the events to a URL.
   */
  save(url) {
    return $.post(url, this.events);
  }

  /**
   * Add an event to the calendar. Does not refresh the UI.
   * @param {object} event CalendarEvent-like thing to add
   */
  addEvent(event) {
    // sort in by start date?
    this.events.push(event);
  }

  /**
   * Delete an event
   * @param {CalendarEvent} event event to remove
   */
  deleteEvent(event) {
    for (let i = 0; i < this.events.length; i++) {
      if (this.events[i] === event) {
        this.events.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Determine the list of events overlapping a day
   * @param {Date} date a Date representing a date/time that falls on the
   * requisite day
   * @return {CalendarEvent[]} list of events that overlap that day
   */
  eventsOnDay(date) {
    return this.intersect(startOfDay(date), endOfDay(date));
  }

  /**
   * Determine the list of events overlapping a month
   * @param {Date} date a Date representing a date/time that falls in the
   * requisite month
   * @return {CalendarEvent[]} list of events that overlap that month
   */
  eventsInMonth(date) {
    return this.intersect(startOfMonth(date), endOfMonth(date));
  }

  /**
   * Determine the list of events that intersect the given range
   * @param {Date} start a Date representing the start of the range
   * @param {Date} end a Date representing the endof the range
   * @return {CalendarEvent[]} list of events that overlap
   */
  intersect(start, end) {
    const matched = [];
    for (const e of this.events) {
      if (e.overlapsRange(start, end))
        matched.push(e);
    }
    return matched;
  }

  /**
   * Change the calendar to display the same month of the previous year
   */
  selectLastYear() {
    this.selectedYear--;
    this.selectedDate = undefined;
    this.refresh();
  }

  /**
   * Change the calendar to display the same month of the following year
   */
  selectNextYear() {
    this.selectedYear++;
    this.selectedDate = undefined;
    this.refresh();
  }

  /**
   * Change the calendar to display the previous month
   */
  selectLastMonth() {
    if (this.selectedMonth === 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else
      this.selectedMonth--;
    this.selectedDate = undefined;
    this.refresh();
  }

  /**
   * Change the calendar to display the next month
   */
  selectNextMonth() {
    if (this.selectedMonth === 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    } else
      this.selectedMonth++;
    this.selectedDate = undefined;
    this.refresh();
  }

  /**
   * Show the current month on the calendar
   */
  refreshCalendar() {
    const first = new Date(this.selectedYear, this.selectedMonth, 1);
    $(".this-month", this.$el).text(first.toLocaleDateString(undefined, {
      month: "long", year: "numeric" }));
    const $dayList = $(".day-list", this.$el);
    $dayList.empty();

    // Calculate last day of previous month
    const prevMonthLength =
          new Date(this.selectedYear, this.selectedMonth, 0).getDate();

    // And last day of this month (0th day of next month)
    const monthLength = lengthOfMonth(this.selectedYear, this.selectedMonth);

    // Offset start days by first day of week to get a day-of-month
    let dom = 1 - first.getDay();

    // Get today's date
    let today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    today = new Date(todayYear, todayMonth, todayDay);

    // 7 columns by 5 rows = 35 total.
    for (let row = 0; row < 5; row++) {
      const $row = $("<div class='day-row'></div>");
      for (let dow = 0; dow < 7; dow++) {
        let date = dom;
        if (dom <= 0)
          date = prevMonthLength + dom;
        else if (dom > monthLength)
          date = dom - monthLength;
        const $span = $(`<span>${date}</span>`);
        const $a = $("<a></a>");
        if (dom <= 0) {
          $span.addClass("out-day");
          $a.on("click", () => this.selectLastMonth());

        } else if (dom > monthLength) {
          $span.addClass("out-day");
          $a.on("click", () => this.selectNextMonth());

        } else {
           if (todayYear === this.selectedYear
               && todayMonth === this.selectedMonth) {
             if (todayDay === dom)
               $a.addClass("current-day");
             if (this.selectedDate === dom)
               $a.addClass("selected");
           }

          const $dots = $("<span class='dots'></span>");
          this.eventsOnDay(
            new Date(this.selectedYear, this.selectedMonth, dom))
          .forEach(e => {
            $dots.append(e.$dots());
            return true;
          });
          $span.append($dots);

          if (this.options.future_only
              && new Date(this.selectedYear, this.selectedMonth, dom) < today)
            $a.addClass("past-day");

          const day = dom;
          $a.on("click", () => {
            $(".selected", this.$el).removeClass("selected");
            $a.addClass("selected");
            this.selectedDate = day;
            //console.debug("Selected", this.selectedDate);
            this.refresh();
          });
        }

        $a.append($span);
        $row.append($a);
        dom++;
      }
      $dayList.append($row);
    }
    return $dayList;
  }

  /**
   * Display the given set of events in the event display area
   */
  refreshEvents() {
    const events = (typeof this.selectedDate === "undefined")
          ? this.eventsInMonth(
            new Date(this.selectedYear, this.selectedMonth, 1))
          : this.eventsOnDay(
            new Date(this.selectedYear, this.selectedMonth, this.selectedDate));
    const $info = $(".events-list", this.$el);
    $info.empty();
    events.forEach(e => {
      const $event = e.$create({
        edit: event => {
          this.event_dialog.open(event, this.$el.closest(".ui-dialog"))
          .then(async ne => {
            if (typeof ne === "object") {
              event.start = ne.start;
              event.end = ne.end;
              event.title = ne.title;
              event.description = ne.description;
              if (this.options.change)
                await this.options.change(event);
            } else if (ne === "DELETE") {
              if (this.options.delete)
                await this.options.delete(event);
              this.deleteEvent(event);
            }
            this.refresh();
          });
        }
      });
      $info.append($event);
    });
  }

  refresh() {
    this.refreshCalendar();
    this.refreshEvents();
  }

  /**
   * Construct the calendar UI
   */
  $create($context) {
    this.$el = $context;
    const url = new URL("../html/EventCalendar.html", import.meta.url);
    return $.get(url)
    .then(html => {
      this.$el.html(html);
      if (this.options.title)
        $("h1", $context).show().text(this.options.title);
      else
        $("h1", $context).hide();

      $(".prev-year", this.$el)
      .on("click", () => this.selectLastYear());
      $(".next-year", this.$el)
      .on("click", () => this.selectNextYear());
      $(".prev-month", this.$el)
      .on("click", () => this.selectLastMonth());
      $(".next-month", this.$el)
      .on("click", () => this.selectNextMonth());

      // Configure the "Add" button
      $(".add-event", this.$el)
      .on("click",
          () => this.event_dialog.open(null, $context)
          .then(async spec => {
            const e = new CalendarEvent(spec);
            if (this.options.add)
              await this.options.add(e);
            this.addEvent(e);
            this.refresh();
          }));

      this.refresh();
    });
  }
}

/**
 * jQueryUI widget
 */
$.widget("custom.event_calendar", {
  _create: function() {
    const events = new EventCalendar(this.options);
    events.$create($(this.element));
  }
});

export { EventCalendar }
