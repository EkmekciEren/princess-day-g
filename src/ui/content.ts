/* Page text (from config), the acrostic poem reveal and the wish card. */
import { POEM, TEXT } from '../config';

type TextKey = keyof typeof TEXT;

/** Fill every [data-text="key"] element from the TEXT constants. */
export function fillText(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-text]').forEach((el) => {
    const v = TEXT[el.dataset.text as TextKey];
    if (typeof v === 'string') el.textContent = v;
  });
}

/** Build the acrostic: the first letter of each line is set apart in gold. */
export function buildPoem(list: HTMLElement): void {
  list.innerHTML = '';
  POEM.forEach((line, i) => {
    const chars = Array.from(line.trim()); // code points: keeps "Ü" whole
    const li = document.createElement('li');
    li.className = 'poem__line';
    li.style.setProperty('--i', String(i));
    const initial = document.createElement('span');
    initial.className = 'poem__initial';
    initial.setAttribute('aria-hidden', 'true');
    initial.textContent = chars[0] ?? '';
    const rest = document.createElement('span');
    rest.className = 'poem__rest';
    rest.setAttribute('aria-hidden', 'true');
    rest.textContent = chars.slice(1).join('');
    // screen readers read the line as a whole word, not "G … özlerinde"
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = line;
    li.append(initial, rest, sr);
    list.append(li);
  });
  list.setAttribute('aria-label', `Akrostiş: ${POEM.map((l) => Array.from(l.trim())[0]).join('')}`);
}

/** Reveal an element (adds .is-revealed) the first time it scrolls into view. */
export function revealOnView(el: Element, threshold = 0.3): void {
  if (!('IntersectionObserver' in window)) {
    el.classList.add('is-revealed');
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-revealed');
        io.unobserve(e.target);
      }
    }
  }, { threshold });
  io.observe(el);
}

/** "Bir dilek tut": cycles through the sweet lines, one per wish. */
export function setupWish(button: HTMLButtonElement, card: HTMLElement, onWish: (x: number, y: number) => void): void {
  let index = 0;
  let timer = 0;
  button.addEventListener('click', () => {
    const rect = button.getBoundingClientRect();
    onWish(rect.left + rect.width / 2, rect.top + rect.height / 2);
    window.clearTimeout(timer);
    const show = () => {
      card.textContent = TEXT.wishes[index % TEXT.wishes.length];
      index++;
      card.classList.add('is-shown');
    };
    if (card.classList.contains('is-shown')) {
      card.classList.remove('is-shown');
      timer = window.setTimeout(show, 450);
    } else {
      timer = window.setTimeout(show, 520);
    }
  });
}
