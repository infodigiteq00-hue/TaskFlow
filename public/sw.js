// Service worker: shows system notification at scheduled time so user gets
// reminders even when the tab is in background. When tab is closed, SW may
// be killed; missed reminders are shown when user opens the tab again.

const timeouts = new Map();

function showNotification(title, body) {
  if (!self.registration) return;
  self.registration.showNotification(title, { body }).catch(function () {});
}

self.addEventListener('message', function (event) {
  const data = event.data || {};
  const type = data.type;
  const payload = data.payload;
  const msgId = data.id;

  if (type === 'SCHEDULE_REMINDER' && payload) {
    const id = payload.id;
    const fireAt = payload.fireAt;
    const title = payload.title;
    const body = payload.body;
    if (timeouts.has(id)) clearTimeout(timeouts.get(id));
    const now = Date.now();
    const delay = Math.max(0, fireAt - now);
    const tid = setTimeout(function () {
      timeouts.delete(id);
      showNotification(title, body);
    }, delay);
    timeouts.set(id, tid);
  } else if (type === 'CANCEL_REMINDER' && msgId) {
    const tid = timeouts.get(msgId);
    if (tid) {
      clearTimeout(tid);
      timeouts.delete(msgId);
    }
  }
});
