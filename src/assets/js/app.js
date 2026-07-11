import $ from 'jquery';
import 'what-input';

// Foundation JS relies on a global variable. In ES6, all imports are hoisted
// to the top of the file so if we used `import` to import Foundation,
// it would execute earlier than we have assigned the global variable.
// This is why we have to use CommonJS require() here since it doesn't
// have the hoisting behavior.
window.jQuery = $;
require('foundation-sites');

// If you want to pick and choose which modules to include, comment out the above and uncomment
// the line below
//import './lib/foundation-explicit-pieces';


$(document).foundation();

const normalizeSearchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('hu')
    .trim();

const scoreSearchEntry = (entry, terms) => {
  const title = normalizeSearchText(entry.title);
  const description = normalizeSearchText(entry.description);
  const keywords = normalizeSearchText((entry.keywords || []).join(' '));

  if (!terms.every((term) => title.includes(term) || description.includes(term) || keywords.includes(term))) {
    return 0;
  }

  return terms.reduce((score, term) => {
    if (title === term) return score + 100;
    if (title.startsWith(term)) return score + 50;
    if (title.includes(term)) return score + 25;
    if (keywords.includes(term)) return score + 10;
    return score + 3;
  }, 0);
};

document.querySelectorAll('[data-site-search]').forEach((form) => {
  const input = form.querySelector('input[type="search"]');
  const results = form.querySelector('[role="listbox"]');
  const siteRoot = form.dataset.siteRoot || '';
  let entries = [];
  let matches = [];
  let activeIndex = -1;

  const closeResults = () => {
    results.hidden = true;
    results.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  };

  const setActiveResult = (nextIndex) => {
    const options = [...results.querySelectorAll('[role="option"]')];
    if (!options.length) return;
    activeIndex = (nextIndex + options.length) % options.length;
    options.forEach((option, index) => option.classList.toggle('is-active', index === activeIndex));
    input.setAttribute('aria-activedescendant', options[activeIndex].id);
    options[activeIndex].scrollIntoView({ block: 'nearest' });
  };

  const renderResults = () => {
    const terms = normalizeSearchText(input.value).split(/\s+/).filter(Boolean);
    if (!terms.length) {
      closeResults();
      return;
    }

    matches = entries
      .map((entry) => ({ entry, score: scoreSearchEntry(entry, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, 'hu'))
      .slice(0, 8)
      .map(({ entry }) => entry);

    results.innerHTML = '';
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'site-search-empty';
      empty.textContent = 'Nincs találat.';
      results.appendChild(empty);
    } else {
      matches.forEach((entry, index) => {
        const link = document.createElement('a');
        link.id = `site-search-result-${index}`;
        link.className = 'site-search-result';
        link.href = `${siteRoot}${entry.link}`;
        link.setAttribute('role', 'option');
        link.innerHTML = `<strong></strong><span></span>`;
        link.querySelector('strong').textContent = entry.title;
        link.querySelector('span').textContent = entry.description;
        results.appendChild(link);
      });
    }

    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    activeIndex = -1;
  };

  fetch(form.dataset.searchIndex)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      entries = Array.isArray(data) ? data : [];
      if (input.value.trim()) renderResults();
    })
    .catch((error) => console.warn('A keresési index nem tölthető be:', error));

  input.addEventListener('input', renderResults);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveResult(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Escape') {
      closeResults();
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      results.querySelectorAll('[role="option"]')[activeIndex].click();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!matches.length) return;
    window.location.assign(`${siteRoot}${matches[0].link}`);
  });

  document.addEventListener('click', (event) => {
    if (!form.contains(event.target)) closeResults();
  });
});
