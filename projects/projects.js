import { fetchJSON, renderProjects } from '../global.js';

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

let title = document.querySelector('.projects-title');
title.innerHTML = `${projects.length} Projects`


// LAB 05
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Temporary Hardcoded Data
// let data = [
//   { value: 1, label: 'apples' },
//   { value: 2, label: 'oranges' },
//   { value: 3, label: 'mangos' },
//   { value: 4, label: 'pears' },
//   { value: 5, label: 'limes' },
//   { value: 5, label: 'cherries' },
// ];

// Plotting actual data
let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year,
);
let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
});

let colors = d3.scaleOrdinal(d3.schemeTableau10)
let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d));

// highlighting selected wedge



// Search Field
let query = '';

let searchInput = document.querySelector('.searchBar');

// accidental dupe
// searchInput.addEventListener('input', (event) => {
//     // update query value
//     query = event.target.value;

//     // TODO: filter the projects
//     let filteredProjects = projects.filter((project) => {
//         let values = Object.values(project).join('\n').toLowerCase();
//         return values.includes(query.toLowerCase());
//     }

//     );
//     // TODO: render updated projects!
//     renderProjects(filteredProjects, projectsContainer, 'h2');
// });

// selectedIndex for Highlighting
let selectedIndex = -1;

// updating pie chart

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {


    // re-calculate rolled data
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    // re-calculate data
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year }; // TODO
    });

    // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value)
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));

    // TODO: clear up paths and legends
    let newSVG = d3.select('svg');
    let newLegend = d3.select('.legend')
    newSVG.selectAll('path').remove();
    newLegend.selectAll('li').remove();

    // update paths and legends, refer to steps 1.4 and 2.2

    newArcs.forEach((arc, index) => {
        d3.select('svg')
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(index))
            .on('click', () => {
                selectedIndex = selectedIndex === index ? -1 : index;

                console.log(selectedIndex)
                newSVG
                    .selectAll('path')
                    .attr('class', (_, idx) => (
                        (idx === selectedIndex) ? 'selected' : 'none'
                    ));

                newLegend
                    .selectAll('li')
                    .attr('class', (_, idx) => (
                        (idx === selectedIndex) ? 'selected' : 'legend_li'
                    ));

                // filtering by selected wedge

                if (selectedIndex === -1) {
                    // Originally 
                    // renderProjects(projects, projectsContainer, 'h2')

                    // CHECK FOR SEARCHINPUT VALUE
                    // THESE LINES WERE CHANGED TO FIX SEARCH BUG
                    let allProjects = false;
                    let filteredProjects = projects.filter((project) => {

                        // Even if selectedIndex is -1 so that no pie slices are 
                        // selected, still check if the search box has 
                        // any information, if not, filtered projects returns all projects
            
                        console.log(searchInput.value)

                        if (searchInput.value) {
                            console.log('searchInput has value')
                            let values = Object.values(project).join('\n').toLowerCase();
                            return values.includes(query.toLowerCase())
                        } else {
                            // console
                            allProjects = true;
                        }

                    });
                    if (allProjects){
                        renderProjects(projects, projectsContainer, 'h2')
                        renderPieChart(projects);
                    } else {
                        renderProjects(filteredProjects, projectsContainer, 'h2')    
                        renderPieChart(filteredProjects);
                    }
                    


                } else {
                    
                    newData.forEach((d, idx) => {
                        if (idx === selectedIndex) {
                            let filteredProjects = projects.filter((project) => {

                                // ADDING MATCH BASED ON SEARCHINPUT

                                // console.log(searchInput.value)

                                // THESE LINES WERE CHANGED TO INCLUDE ANY 
                                // INFORMATION IN SEARCH BOX
                                if (searchInput.value) {
                                    console.log('searchInput has value')
                                    let values = Object.values(project).join('\n').toLowerCase();
                                    return values.includes(query.toLowerCase()) && project.year.includes(d.label);

                                } else {
                                    // originally this was the only check being done 
                                    return project.year.includes(d.label)
                                }


                            });
                            renderProjects(filteredProjects, projectsContainer, 'h2')


                        }
                    });


                }
            });
    });

    let legend = d3.select('.legend');
    newData.forEach((d, idx) => {
        legend
            .append('li')
            .attr('class', 'legend_li')
            .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    });
}

// Call this function on page load
renderPieChart(projects);

// UPDATE EVERYTHING WHEN SEARCH BOX CHANGES
searchInput.addEventListener('input', (event) => {


    // update query value (THIS NEEDS TO BE UPDATED TO INCLUDE THE SELECTED INDEX)
    query = event.target.value;

    // TODO: filter the projects
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();


        // ADDED THIS LINE
        let matchesYear = true;
        if (selectedIndex !== -1) {
            let selectedYear = data[selectedIndex].label;
            matchesYear = project.year === selectedYear;
        };


        // ADDED EXTRA CONDITIONAL
        return values.includes(query.toLowerCase()) && matchesYear;


    }

    );
    // TODO: render updated projects!
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});




