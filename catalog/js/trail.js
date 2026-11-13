// Live trail on the AI pieces page. In an app these updates come from the real run
// (server events); here a small timer plays one run so the states can be seen in order.
import { icon } from './icons.js';

const trail = document.querySelector('[data-live-trail]');
if (trail) {
  const start = trail.innerHTML;
  const total = trail.querySelectorAll('.hc-step').length;
  let timer = 0;

  const steps = () => [...trail.querySelectorAll('.hc-step')];
  const count = () => {
    trail.querySelector('.hc-trail-n').textContent = `${steps().filter(s => s.dataset.state === 'done').length}/${total}`;
  };
  const meta = (step, status, time) => {
    const m = step.querySelector('.hc-step-m');
    m.innerHTML = '';
    if (status) m.insertAdjacentHTML('beforeend', `<span class="hc-step-s">${status}</span>`);
    if (time != null) m.insertAdjacentHTML('beforeend', `<span data-time>${time}s</span>`);
  };
  const finish = step => {
    const t = step.querySelector('[data-time]')?.textContent;
    step.dataset.state = 'done';
    meta(step, '', t ? parseInt(t, 10) : null);
    const tg = step.querySelector('.hc-step-tg');
    if (tg) {
      tg.setAttribute('aria-expanded', 'false');
      document.getElementById(tg.getAttribute('aria-controls')).hidden = true;
    }
    count();
  };
  const again = () => {
    let f = trail.querySelector('.hc-trail-f');
    if (!f) {
      f = document.createElement('div');
      f.className = 'hc-trail-f';
      trail.append(f);
    }
    f.innerHTML = `<button class="btn btn-sm btn-secondary" data-run-again>${icon('rotate-ccw', 13)}Run again</button>`;
  };

  function play() {
    let secs = 31;
    let tests = 182;
    const patch = steps()[2];
    timer = setInterval(() => {
      if (patch.dataset.state === 'current') {
        secs += 1;
        tests = Math.min(214, tests + 4);
        patch.querySelector('[data-time]').textContent = `${secs}s`;
        patch.querySelector('[data-count]').textContent = `${tests}/214`;
        if (tests === 214) {
          patch.querySelector('.hc-sub > li[data-state="current"]').dataset.state = 'done';
          finish(patch);
          const note = steps()[3];
          note.dataset.state = 'current';
          meta(note, 'Writing', 0);
          secs = 0;
        }
        return;
      }
      const note = steps()[3];
      if (note.dataset.state === 'current') {
        secs += 1;
        note.querySelector('[data-time]').textContent = `${secs}s`;
        if (secs >= 4) {
          finish(note);
          const pr = steps()[4];
          pr.querySelector('.hc-step-s').textContent = 'Needs your approval';
          pr.insertAdjacentHTML(
            'beforeend',
            `<div class="hc-step-x row" style="gap:6px;padding-top:6px"><button class="btn btn-sm btn-primary" data-approve>${icon('check', 13)}Approve</button><button class="btn btn-sm btn-secondary" data-decline>Decline</button></div>`,
          );
          clearInterval(timer);
        }
      }
    }, 300);
  }

  trail.addEventListener('click', e => {
    const pr = steps()[4];
    if (e.target.closest('[data-approve]')) {
      pr.querySelector('.hc-step-x').remove();
      pr.dataset.state = 'current';
      meta(pr, 'Opening', 0);
      setTimeout(() => {
        finish(pr);
        pr.querySelector('.hc-step-m').innerHTML = '<span class="hc-id">#214</span>';
        again();
      }, 1500);
    } else if (e.target.closest('[data-decline]')) {
      pr.querySelector('.hc-step-x').remove();
      pr.dataset.state = 'error';
      meta(pr, 'Declined');
      again();
    } else if (e.target.closest('[data-run-again]')) {
      clearInterval(timer);
      trail.innerHTML = start;
      play();
    }
  });

  play();
}
