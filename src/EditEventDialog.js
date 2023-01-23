/*Copyright (C) Crawford Currie 2023 - All rights reserved*/

import "./jquery-clockpicker.js";

/**
 * Parse a server local time HH[:MM[:SS]][am|pm] string
 * Times must be in the range 00:00:00..23:59:59
 * @param {string} s time string
 * @return {number[]} array of [ h, m, s ]
 */
function parseTime(str) {
  let pm = false;
  str = str.replace(/(am|pm)$/i, () => { pm = true; return ""; });
  const hms = str.split(":");
  let h = Number.parseInt(hms.shift()), m = 0, s = 0;
  if (h < 0 || h > 23) throw Error("Hours out of range 0..23");
  if (pm && h < 13) h += 12;
  if (hms.length > 0) {
    m = Number.parseInt(hms.shift());
    if (m < 0 || m > 59) throw Error("Minutes out of range 0..59");
    if (hms.length > 0) {
      const s = Number.parseFloat(hms.shift());
      if (s < 0 || s > 59) throw Error("Minutes out of range 0..59");
    }
    if (hms.length > 0) throw Error("Time format error");
  }
  return [ h, m, s ];
}

class EditEventDialog {

  /**
   */
  constructor(options) {

    this.options = options || {};

    /**
     * `resolve` function for the open() promise
     */
    this.resolve = undefined;

    /**
     * jQuery object
     * @member {jQuery}
     */
    this.$dialog = undefined;
  }

  /**
   * Populate the dialog fields for the given event
   * @param {object} event (or event-like thing)
   */
  populate(spec) {
    const $dialog = this.$dialog;
    $("[name=start-date]", $dialog).val(spec.start.toDateString());
    $("[name=start-time]", $dialog).val(spec.start.toLocaleTimeString());
    $("[name=end-date]", this.$dialog).val(spec.start.toDateString());
    $("[name=end-time]", $dialog).val(spec.end.toLocaleTimeString());
    $("[name=title]", $dialog).val(spec.title);
    $("[name=description]", $dialog).val(spec.description);
  }

  /**
   * @private
   */
  $create() {
    const url = import.meta.url.replace(/\.js$/, ".html");
    return $.get(url)
    .then(html => {
      const $dialog = this.$dialog = $(html);
      $("body").append($dialog);

      $("button.save-button", $dialog)
      .on("click", () => {
        try {
          const stds = $("[name=start-date]", $dialog).val();
          const st = new Date(stds);
          const stts = parseTime($("[name=start-time]", $dialog).val());
          st.setHours(parseInt(stts[0]));
          st.setMinutes(parseInt(stts[1]));
          st.setSeconds(parseInt(stts[2]));

          const ets = $("[name=end-date]", $dialog).val();
          const et = new Date(ets ? ets : stds);
          const etts = parseTime($("[name=end-time]", $dialog).val());
          et.setHours(parseInt(etts[0]));
          et.setMinutes(parseInt(etts[1]));
          et.setSeconds(parseInt(etts[2]));

          if (st >= et)
            throw Error("'Start' must be before 'End'");
          $dialog.dialog("close");
          this.resolve({
            start: st,
            end: et,
            title: $("[name=title]", $dialog).val(),
            description: $("[name=description]", $dialog).val()
          });
        } catch (e) {
          console.error(e);
        }
      });

      $("button.delete-button", $dialog)
      .on("click", () => {
        $dialog.dialog("close");
        this.resolve("DELETE");
      });

      $("[name=start]", $dialog)
      .on("change", function() {
        $("[name=end]", $dialog)
        .datepicker("option", "minDate", $(this).val());
      });

      $('.clockpicker', $dialog).clockpicker({
        autoclose: true,
        default: "now"
      });

      return $dialog;
    });
  }

  /**
   * Open the dialog on the given event (if defined)
   * @return {Promise} that resolves when the dialog is saved, or
   * rejects when it is closed.
   */
  open(spec) {
    let promise;
    if (this.$dialog)
      promise = Promise.resolve(this.$dialog);
    else
      promise = this.$create();

    return promise.then(() => {
      let title;
      if (spec) {
        this.populate(spec);
        $("button.delete-button", this.$dialog).show();
        title = "Edit";
      } else {
        $("button.delete-button", this.$dialog).hide();
        title = "Add";
      }

      return new Promise(resolve => {
        this.resolve = resolve;
        this.$dialog.dialog({
          modal: true,
          minWidth: 400,
          width: 'auto',
          title: "Add",
          create: () => {
            $(".datepicker", this.$dialog)
            .datepicker({
              minDate: new Date(),
              dateFormat: "D, d M yy",
              beforeShow: function(input, inst) {
                // Add the dialog class to inherit font sizes etc
                $('#ui-datepicker-div').addClass("edit-event-dialog");
              }
            });
            $("select", this.$dialog)
            .selectmenu();
            $(".spinner", this.$dialog)
            .each(function() {
              $(this).spinner({
                min: $(this).data("min"),
                max: $(this).data("max")
              }).val(0);
            });
          },
          open: () => {
            this.$dialog.dialog("option", "title", title);
          }
        });
      });
    });
  }
}

export { EditEventDialog }
