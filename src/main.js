import '../css/styles.css';
import '../css/custom.css';

import $ from 'jquery';

window.$ = $;
window.jQuery = $;

async function startApp() {
  await import('bootstrap/dist/js/bootstrap.bundle.min.js');
  await import('jquery.easing');
  await import('../js/scripts.js');
}

startApp();
