console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// ---------- Step 2: highlight current page (replaced by Step 3 below) ----------
// let navLinks = $$('nav a');
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );
// currentLink?.classList.add('current');

// ---------- Step 3: build the nav menu automatically ----------
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/carmenwu0520', title: 'GitHub' },
];

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/' // local server
    : '/portfolio/'; // GitHub Pages repo name

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // relative links get the base path so they work on every page
  url = !url.startsWith('http') ? BASE_PATH + url : url;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // highlight the page we're on
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname,
  );

  // open external links (like GitHub) in a new tab
  if (a.host !== location.host) {
    a.target = '_blank';
  }

  nav.append(a);
}

// ---------- Step 4: dark mode switch ----------
document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`,
);

let select = document.querySelector('.color-scheme select');

// show which mode "Automatic" is using right now
let osIsDark = matchMedia('(prefers-color-scheme: dark)').matches;
select.querySelector('option[value="light dark"]').textContent =
  `Automatic (${osIsDark ? 'Dark' : 'Light'})`;

function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  select.value = colorScheme;
}

// load the saved preference
if ('colorScheme' in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  setColorScheme(event.target.value);
  localStorage.colorScheme = event.target.value; // save it
});

// ---------- Step 5 (optional): better contact form ----------
let form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
  event.preventDefault();
  let data = new FormData(form);
  let params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  let url = form.action + '?' + params.join('&');
  location.href = url;
});

// =====================================================================
// Lab 4: load project data and render it with reusable functions
// =====================================================================

// ---------- Step 1.2: fetch and parse a JSON file ----------
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    console.log(response); // inspect the Response object in DevTools

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

// ---------- Step 1.4: render an array of projects into a container ----------
const VALID_HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const PLACEHOLDER_IMAGE = 'https://dsc106.com/labs/lab02/images/empty.svg';

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Check Your Understanding: what if containerElement is null?
  if (!(containerElement instanceof Element)) {
    console.error('renderProjects: containerElement is not a valid DOM element');
    return;
  }

  // Challenge: only allow real heading tags, fall back to h2 otherwise
  if (!VALID_HEADINGS.includes(headingLevel)) {
    console.warn(`renderProjects: "${headingLevel}" is not a heading tag, using h2`);
    headingLevel = 'h2';
  }

  // Think About It: clear first so calling this twice doesn't duplicate articles
  containerElement.innerHTML = '';

  // Check Your Understanding: show a placeholder for an empty (or missing) array
  if (!Array.isArray(projects) || projects.length === 0) {
    containerElement.innerHTML = '<p>No projects to show yet.</p>';
    return;
  }

  for (const project of projects) {
    const article = document.createElement('article');

    // Think About It: handle missing properties gracefully
    const title = project.title ?? 'Untitled project';
    const description = project.description ?? '';
    const link = project.url
      ? ` <a href="${project.url}" target="_blank">View project</a>`
      : '';

    // Images in projects.json are written relative to the site root
    // (e.g. "images/me.jpg"), so they work from every page.
    let image = project.image || PLACEHOLDER_IMAGE;
    if (!image.startsWith('http')) {
      image = BASE_PATH + image;
    }

    article.innerHTML = `
      <${headingLevel}>${title}</${headingLevel}>
      <img src="${image}" alt="${title}">
      <p>${description}${link}</p>
    `;

    containerElement.appendChild(article);
  }
}

// ---------- Step 3.2: load public profile data from the GitHub API ----------
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
