import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h3');

let title = document.querySelector('.projects-title');
title.innerHTML = `${projects.length} Projects`
