/* lets MindEase be installed on a phone and open quickly */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
}
