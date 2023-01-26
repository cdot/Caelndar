/*Copyright (C) Crawford Currie 2023 - All rights reserved*/

/**
 * An event in a calendar.
 */
class CalendarEvent {
  /**
   * Construct an event
   * @param {object} p event description
   * @param {Date} p.start start of event
   * @param {Date} p.end end of event, defaults to start
   * @param {string} p.title event title
   * @param {string} p.description event description
   */
  constructor(p) {

    /**
     * Start date/time
     * @member {Date}
     */
    this.start = p.start;

    /**
     * End date/time
     * @member {Date}
     */
    this.end = p.end;

    /**
     * Event title
     * @member {string}
     */
    this.title = p.title;

    /**
     * Event description
     * @member {string}
     */
    this.description = p.description;
  }

  /**
   * Determine if the time of this event overlaps with the
   * given range.
   * @param {Date} start start of other range
   * @param {Date} end end of other range
   */
  overlapsRange(start, end) {
    if (start instanceof CalendarEvent)
      return this.overlapsRange(start.start, start,end);
    return (this.start <= end && this.end >= start);
  }

  /**
   * Create the DOM for the event in the events area
   * @param {function?} options.select function to invoke on select
   * @param {function?} options.edit function to invoke on edit
   */
  $create(options) {
    const $event = $(`<div id="" class="event"></div`);
    const ss = this.start.toLocaleString().replace(/:[^:]*$/, "");
    const es = this.end.toLocaleString().replace(/:[^:]*$/, "");
    $event.append(`<div class='event-time'>${ss}&hellip;${es}</span>`);
    $event.append(
      `<div class="event-text">${this.title} ${this.description}</div>`);
    if (options.select)
      $event.on("click", () => options.select(this));
    if (options.edit) {
      const $butt = $("<button class='event-button'>&#9998;</button>");
      $event.prepend($butt);
      $butt.button();
      $butt.on("click", () => options.edit(this));
    }
    return $event;
  }

  /**
   * Return a dot span reflecting the nature of this event
   * @return {jQuery} span contining the dot
   */
  $dots() {
    return $("<span class='dot color-pink'></span>");
  }
}

export { CalendarEvent }
