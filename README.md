# Event Calendar
JQuery UI widget for a simple event calendar application.

<img style="float:right" src="/images/splash.png" width="197" height="309" alt="Image" /> When applied to a div, the widget creates a visual representation of a
month-by-month calendar, with a block showing events underneath. Events
are simple, having just a start and an end, a title, and a description.

For example:
```
{
   start: new Date(2023, 0, 1, 0, 0, 0),
   end: new Date(2023, 0, 1, 23, 59, 59),
   title: "New Year's Day",
   description: "A time for reflection"
}
```
The widget supports adding, removing and editing events.

## Installation
```
$ npm install @cdot/event_calendar
```
At time of writing, recurring events are not supported.

## Usage
Invoke the widget on a div in the normal way. e.g.
```
$("#selector").event_calendar({ title: "Public Holidays" })
```
## Options
Options are passed to the widget in the usual way.

### add
Function that will be called when an event is added to the calendar. Will be passed a structure describing the event `{ start: end: title: description: }` and should return a Promise. The event structure can be modified (e.g. to add a unique id for the event) and any modifications will be retained in the `events` structure passed to the widget.

### change
Function that will be called when an event is modified. Will be passed a structure descriping the event `{ start: end: title: description: }` and should return a Promise. The event structure can be modified (e.g. to add a unique id for the event) and any modifications will be retained in the `events` structure passed to the widget.

### delete
Function that will be called when an event is deleted. Should return a Promise.

### events
Array of pre-existing events. Each entry in the array must be an object with fields as follows:
* `start` Date object giving the start time for the event.
* `end` Date object giving the end time of the event.
* `title` string title of the event
* `description` string description of the event

### title
Optional string title displayed above the calendar.

An example is given in the `test` directory.
