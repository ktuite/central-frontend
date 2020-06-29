import Vue from 'vue';

import { unwrapElement } from './util';



////////////////////////////////////////////////////////////////////////////////
// dataTransfer()

export const dataTransfer = (files) => {
  const dt = new DataTransfer();
  for (const file of files) {
    // MDN indicates that DataTransferItemList.prototype.add() is not supported
    // in Chrome, but another source seems to imply that it is. I am not
    // encountering any issues using it in Headless Chrome.
    dt.items.add(file);
  }
  return dt;
};



////////////////////////////////////////////////////////////////////////////////
// trigger

export const trigger = {};

// Simple events
for (const eventName of ['click', 'submit']) {
  // Triggers an event, then waits a tick for the DOM to update.
  trigger[eventName] = (...args) => {
    if (args.length === 0) throw new Error('wrapper or selector required');
    if (typeof args[0] === 'string')
      return (wrapper) => trigger[eventName](wrapper, args[0]);
    const [wrapper, selector] = args;
    const target = selector == null ? wrapper : wrapper.first(selector);
    target.trigger(eventName);
    const nextTick = Vue.nextTick();
    return selector == null ? nextTick : nextTick.then(() => wrapper);
  };
}

// Changes the value of an <input> or <select> element, triggering a change
// event. This probably does not work with v-model: consider using fillForm()
// instead.
trigger.changeValue = (wrapper, ...args) => {
  if (args.length === 0) throw new Error('value required');
  if (args.length === 1) return trigger.changeValue(wrapper, null, args[0]);
  const [selector, value] = args;
  const target = selector == null ? wrapper : wrapper.first(selector);
  if (target.element.value === value) throw new Error('no change');
  target.element.value = value;
  target.trigger('change');
  return Vue.nextTick().then(() => wrapper);
};

// Checks a checkbox or radio input, triggering a change event.
trigger.check = (wrapper, selector = null) => {
  const target = selector != null ? wrapper.first(selector) : wrapper;
  if (target.element.checked) throw new Error('already checked');
  target.element.checked = true;
  target.trigger('change');
  return Vue.nextTick().then(() => wrapper);
};

// Unchecks a checkbox or radio input, triggering a change event.
trigger.uncheck = (wrapper, selector = null) => {
  const target = selector != null ? wrapper.first(selector) : wrapper;
  if (!target.element.checked) throw new Error('already unchecked');
  target.element.checked = false;
  target.trigger('change');
  return Vue.nextTick().then(() => wrapper);
};

// Drag events
for (const eventName of ['dragenter', 'dragover', 'dragleave', 'drop']) {
  trigger[eventName] = (wrapper, ...args) => {
    if (args.length === 0) throw new Error('files required');
    if (args.length === 1) return trigger[eventName](wrapper, null, args[0]);
    const [selector, files] = args;
    const target = selector == null ? wrapper : wrapper.first(selector);
    const targetElement = unwrapElement(target);
    $(targetElement).trigger($.Event(eventName, {
      target: targetElement,
      originalEvent: $.Event(eventName, { dataTransfer: dataTransfer(files) })
    }));
    const nextTick = Vue.nextTick();
    return selector == null ? nextTick : nextTick.then(() => wrapper);
  };
}

// Note that these `trigger` methods do not pass information to each other: each
// uses `args` without knowledge of any previous use. That means that each
// method instantiates its own data transfer object, and if `selector` is
// specified, each searches for the event target.
trigger.dragAndDrop = (...args) => trigger.dragenter(...args)
  .then(() => trigger.dragover(...args))
  .then(() => trigger.drop(...args));



////////////////////////////////////////////////////////////////////////////////
// TRIGGERING A SERIES OF EVENTS

/*
fillForm(wrapper, selectorsAndValues) fills a form (whether an actual <form>
element or something else). It sets the `value` property of one or more fields,
triggering an input event for each.

`wrapper` is an Avoriaz wrapper that wraps the form or a DOM node or Vue
component that contains the form. selectorsAndValues is an array of
[selector, value] arrays that specify how to select each field, as well as the
field's value.

fillForm() returns a promise that resolves to the wrapper.

For example:

  fillForm(component, [
    ['input[type="email"]', 'email@getodk.org'],
    ['input[type="password"]', 'password']
  ]);
*/
export const fillForm = (wrapper, selectorsAndValues) => {
  const promise = selectorsAndValues.reduce(
    (acc, [selector, value]) => acc.then(() => {
      const field = wrapper.first(selector);
      field.element.value = value;
      // If there is a v-model attribute, prompt it to sync.
      field.trigger('input');
      return Vue.nextTick();
    }),
    Promise.resolve()
  );
  return promise.then(() => wrapper);
};

// submitForm(wrapper, formSelector, fieldSelectorsAndValues) fills a form using
// fillForm(), then submits the form. `wrapper` is an Avoriaz wrapper that
// contains the form. submitForm() returns a promise that resolves to `wrapper`.
export const submitForm = (wrapper, formSelector, fieldSelectorsAndValues) => {
  const form = wrapper.first(formSelector);
  return fillForm(form, fieldSelectorsAndValues)
    .then(() => trigger.submit(form))
    .then(() => wrapper);
};
