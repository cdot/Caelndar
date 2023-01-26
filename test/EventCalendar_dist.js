/*Copyright (C) Crawford Currie 2023 - All rights reserved*/

import { EventCalendar } from "../dist/mjs/index.js";

function lengthOfMonth(y, m) {
  const nMonth = (m + 1) % 12;
  const nYear = m === 11 ? y + 1 : y;
  return new Date(nYear, nMonth, 0).getDate();
}

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();
const lastDay = lengthOfMonth(year, month);

const events = [
  {
    start: new Date(year, 0, 1, 0, 0, 0),
    end: new Date(year, 11, lengthOfMonth(year, 11), 23, 59, 59),
    title: "Whole year",
    description: "Should last the whole year"
  },
  {
    start: new Date(year, month, 1, 0, 0, 0),
    end: new Date(year, month, lastDay, 23, 59, 59),
    title: "Whole month",
    description: "Should last the whole month"
  },
  {
    start: new Date(year, month, 7, 0, 0, 0),
    end: new Date(year, month, 14, 23, 59, 59),
    title: "Whole week",
    description: "Should last from the 7th to the 14th"
  },
  {
    start: new Date(year, month, 8, 0, 0, 0),
    end: new Date(year, month, 8, 23, 59, 59),
    title: "Whole day",
    description: "Should last for the 8th"
  },
  {
    start: new Date(year, month, 9, 10, 0, 0),
    end: new Date(year, month, 16, 10, 0, 0),
    title: "Overlap",
    description: "Should last from the 9th to the 16th"
  },
  {
    start: new Date(year, month, 10, 11, 0, 0),
    end: new Date(year, month, 10, 11, 0, 0),
    title: "No time at all",
    description: "Ends at the same time as it starts"
  }
];

const $cal = $(".ui-dialog [name=calendar]");

$("#open-dialog")
.on("click", () => {
  const opts = {
    events: events,
    title: "Events",
    add: e => {
      console.log("Add event ", e);
      return Promise.resolve(99);
    },
    change: e => {
      console.log("Change event ", e);
      return Promise.resolve();
    },
    delete: e => {
      console.log("Delete event ", e);
      return Promise.resolve();
    }
  };

  if ($("[name=future_only]").prop("checked"))
    opts.future_only = true;

  opts.editor = {};

  opts.editor.clockpicker = {};
  if ($("[name=editor-clockpicker-default]").prop("checked"))
    opts.editor.clockpicker.default = "now";
  opts.editor.clockpicker.placement = $("[name=editor-clockpicker-placement]").val();
  opts.editor.clockpicker.align = $("[name=editor-clockpicker-align]").val();
  if ($("[name=editor-clockpicker-twelvehour]").prop("checked"))
    opts.editor.clockpicker.twelvehour = true;

  $cal.parent().dialog({
    modal: true,
    width: 500,
    open: () => {
      console.log(opts);
      $cal.event_calendar(opts);
    }
  });
});
