import './styles/styles.css';
import './styles/custom.css';

import $ from 'jquery';

window.$ = $;
window.jQuery = $;

async function startApp() {
  await import('bootstrap/dist/js/bootstrap.bundle.min.js');
  await import('jquery.easing');
  await import('./scripts/portfolio.js');
}

startApp();
