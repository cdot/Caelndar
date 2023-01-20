/*Copyright (C) Crawford Currie 2023 - All rights reserved*/

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
    $("[name=start-hour]", $dialog).val(spec.start.getHours());
    $("[name=start-minute]", $dialog).val(spec.start.getMinutes());
    $("[name=end-date]", this.$dialog).val(spec.start.toDateString());
    $("[name=end-hour]", $dialog).val(spec.end.getHours());
    $("[name=end-minute]", $dialog).val(spec.end.getMinutes());
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
        const sts = $("[name=start-date]", $dialog).val();
        const st = new Date(sts);
        const sth = $("[name=start-hour]", $dialog).val();
        st.setHours(parseInt(sth));
        const stm = $("[name=start-minute]", $dialog).val();
        st.setMinutes(parseInt(stm));

        const ets = $("[name=end-date]", $dialog).val();
        const et = new Date(ets ? ets : sts);
        const eth = $("[name=end-hour]", $dialog).val();
        et.setHours(parseInt(eth));
        const etm = $("[name=end-minute]", $dialog).val();
        et.setMinutes(parseInt(etm));

        if (st >= et) {
          alert("'Start' must be before 'End'");
          return;
        }
        $dialog.dialog("close");
        this.resolve({
          start: st,
          end: et,
          title: $("[name=title]", $dialog).val(),
          description: $("[name=description]", $dialog).val()
        });
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
              dateFormat: "D, d M yy"
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
