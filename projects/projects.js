import { fetchJSON, renderProjects } from '../global.js';

// Step 1.3: load the project data and render it
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

// Step 1.6: count projects from the data, so the number updates automatically
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle && projects) {
  projectsTitle.textContent = `${projects.length} Projects`;
}
