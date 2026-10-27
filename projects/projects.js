// projects/projects.js — Lab 5 (includes Step 5.4 fix: search + pie filter work together)
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// ---------- Data + DOM ----------
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

// ---------- State ----------
// FIX (Step 5.4): keep BOTH filters as state, and store the selected YEAR
// instead of selectedIndex. Indexes shift when search removes years from the pie,
// so an index can end up pointing at the wrong wedge.
let query = '';
let selectedYear = null; // null = nothing selected (same idea as selectedIndex = -1)

// ---------- D3 generators ----------
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const sliceGenerator = d3.pie().value((d) => d.value);

// Color keyed by YEAR (not index) so each year keeps its color after filtering.
const allYears = [...new Set(projects.map((p) => String(p.year)))].sort();
const colors = d3.scaleOrdinal(d3.schemeTableau10).domain(allYears);

// ---------- Filters ----------
function filterByQuery(list) {
  const q = query.toLowerCase();
  return list.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(q);
  });
}

function filterByYear(list) {
  if (selectedYear === null) return list;
  return list.filter((project) => String(project.year) === selectedYear);
}

// ---------- Rendering ----------
// The project list always applies BOTH filters: search AND selected year.
function renderList() {
  const visible = filterByYear(filterByQuery(projects));
  renderProjects(visible, projectsContainer, 'h2');
  if (projectsTitle) projectsTitle.textContent = `${visible.length} Projects`;
}

// The pie shows the search results (not year-filtered), so every matching year
// still has a wedge you can click to switch years.
function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => String(d.year),
  );

  const data = rolledData
    .map(([year, count]) => ({ value: count, label: year }))
    .sort((a, b) => d3.ascending(a.label, b.label));

  const arcData = sliceGenerator(data);

  // Clear old paths + legend items before drawing new ones
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  arcData.forEach((d) => {
    const year = d.data.label;

    svg
      .append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(year))
      .attr('data-year', year)
      // Accessibility: wedges are focusable and keyboard-clickable
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', `${year}: ${d.data.value} project${d.data.value === 1 ? '' : 's'}`)
      .on('click', () => toggleYear(year))
      .on('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleYear(year);
        }
      });

    legend
      .append('li')
      .attr('class', 'legend-item')
      .attr('data-year', year)
      .attr('style', `--color:${colors(year)}`)
      .html(`<span class="swatch"></span> ${year} <em>(${d.data.value})</em>`)
      .on('click', () => toggleYear(year));
  });

  highlightSelection();
}

// Add/remove .selected on the matching wedge + legend item
function highlightSelection() {
  d3.select('#projects-pie-plot')
    .selectAll('path')
    .classed('selected', function () {
      return this.dataset.year === selectedYear;
    });

  d3.select('.legend')
    .selectAll('li')
    .classed('selected', function () {
      return this.dataset.year === selectedYear;
    });
}

// ---------- Interactions ----------
// Click a wedge/legend item: select it, or deselect if it's already selected
function toggleYear(year) {
  selectedYear = selectedYear === year ? null : year;
  highlightSelection();
  renderList(); // uses BOTH filters → this is the bug fix
}

// Typing in search: recompute pie from search results, then list with BOTH filters
searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  const searched = filterByQuery(projects);
  // If the selected year disappeared from the search results, clear the selection
  if (selectedYear !== null && !searched.some((p) => String(p.year) === selectedYear)) {
    selectedYear = null;
  }

  renderPieChart(searched);
  renderList();
});

// ---------- Initial render (page load) ----------
renderPieChart(projects);
renderList();
