import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';


async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({


        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new DataTransfer(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    // console.log(data);
    return (data);
}

// let commits = d3.groups(data, (d) => d.commit);


function processCommits(data) {
    return d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: 'https://github.com/portfolio/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                // What other options do we need to set?
                // Hint: look up configurable, writable, and enumerable
                enumerable: false,
                writeable: false,
                configurable: false,
            });

            return ret;
        })
        .sort((a, b) => a.datetime - b.datetime);

}

function renderCommitInfo(data, commits) {
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    dl.append('dt').html('Total <abbr title = "Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // NEW
    let uniqueFiles = d3.groups(data, d => d.file).length;
    dl.append('dt').text('Number of files');
    dl.append('dd').text(uniqueFiles);

    let maxLines = d3.max(data, d => d.line);
    dl.append('dt').text('Max Lines');
    dl.append('dd').text(maxLines);

    let maxDepth = d3.max(data, d => d.depth);
    dl.append('dt').text('Max Depth');
    dl.append('dd').text(maxDepth);

    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file,
    );
    console.log(fileLengths)
    dl.append('dt').text('Average File Length');
    dl.append('dd').text(d3.mean(fileLengths, (d) => d[1]));

}

// TOOLTIPS
function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');

    if (Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
        dateStyle: 'full',
    });
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');

    // changed from Client to page, client was having some strange offsets
    tooltip.style.left = `${event.pageX}px`;
    tooltip.style.top = `${event.pageY}px`;
}

// BRUSH
function brushed(event) {
    const selection = event.selection;

    d3.selectAll('circle').classed('selected', (d) =>
        isCommitSelected(selection, d),
    );

    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
    if (!selection) {
        return false
    }

    const [x0, x1] = selection.map((d) => d[0]);
    const [y0, y1] = selection.map((d) => d[1]);
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
        // console.log('truth');
        return true;
    };
}

let xScale;
let yScale;

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);


    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice()

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0])

    const dots = svg.append('g').attr('class', 'dots');


    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .attr('class', 'x-axis') // new line to mark the g tag
        .call(xAxis);

    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('class', 'y-axis') // just for consistency
        .call(yAxis);

    // range of edited lines
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([5, 30]); // adjust these values based on your experimentation

    // place dots after making axes
    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id) // change this line
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .style('--r', (d) => rScale(d.totalLines))
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })

        .on('mouseleave', () => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);

            updateTooltipVisibility(false);
        });

    // Add gridlines BEFORE the axes
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    const gridColorScale = d3.scaleSequential()
        .domain([0, 24])
        .interpolator(d3.interpolateRgbBasis(['#2c3e50', '#e67e22', '#f1c40f', '#e67e22', '#2c3e50']));

    gridlines.selectAll(".tick line")
        .attr('stroke', d => {
            const hour = d instanceof Date ? d.getHours() : d;
            return gridColorScale(hour);
        })

}

function createBrushSelector(svg) {
    svg.call(d3.brush().on('start brush end', brushed));
    svg.selectAll('.dots, .overlay ~ *').raise();
}

function renderSelectionCount(selection) {
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];

    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${selectedCommits.length || 'No'
        } commits selected`;

    return selectedCommits;
}

function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);

    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type,
    );

    // Update DOM with breakdown
    container.innerHTML = '';

    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);

        container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
    }
}

let data = await loadData();
let commits = processCommits(data);
console.log(commits);
console.log(data);

// LAB 08
let commitProgress = 100;

let timeScale = d3
    .scaleTime()
    .domain([d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime)])
    .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);
// let commitSlider = document.getElementById('commit-progress');
let commitTime = document.getElementById('commit-time');

// Will get updated as user changes slider
let filteredCommits = commits;
let colors = d3.scaleOrdinal(d3.schemeTableau10);

function updateFileDisplay(filteredCommits) {
    // after initializing filteredCommits
    let lines = filteredCommits.flatMap((d) => d.lines);
    let files = d3
        .groups(lines, (d) => d.file)
        .map(([name, lines]) => {
            return { name, lines };
        })
        .sort((a, b) => b.lines.length - a.lines.length);

    let filesContainer = d3
        .select('#files')
        .selectAll('div')
        .data(files, (d) => d.name)
        .join(
            // This code only runs when the div is initially rendered
            (enter) =>
                enter.append('div').call((div) => {
                    div.append('dt').append('code');
                    div.append('dd');
                }),
        );

    // This code updates the div info
    filesContainer.select('dt > code').text((d) => d.name);
    filesContainer

        .select('dd')
        .selectAll('div')
        .data((d) => d.lines)
        .join('div')
        .attr('class', 'loc')
        .attr('style', (d) => `--color: ${colors(d.type)}`);
    ;


}
let filteredData;
// function onTimeSliderChange() {
//     commitProgress = commitSlider.value;
//     commitMaxTime = timeScale.invert(commitProgress);
//     commitTime.textContent = commitMaxTime.toLocaleDateString('en', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//     });
//     filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
//     filteredData = data.filter((d) => d.datetime <= commitMaxTime);

//     updateScatterPlot(filteredData, filteredCommits);
//     updateFileDisplay(filteredCommits);
//     updateCommitInfo(filteredData, filteredCommits);
// }

renderCommitInfo(data, commits);
renderScatterPlot(data, commits)
createBrushSelector(d3.select('svg'));

function updateCommitInfo(data, commits) {
    const statsContainer = d3.select('#stats').html('');
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    dl.append('dt').html('Total <abbr title = "Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // NEW
    let uniqueFiles = d3.groups(data, d => d.file).length;
    dl.append('dt').text('Number of files');
    dl.append('dd').text(uniqueFiles);

    let maxLines = d3.max(data, d => d.line);
    dl.append('dt').text('Max Lines');
    dl.append('dd').text(maxLines);

    let maxDepth = d3.max(data, d => d.depth);
    dl.append('dt').text('Max Depth');
    dl.append('dd').text(maxDepth);

    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file,
    );
    // console.log(fileLengths)
    dl.append('dt').text('Average File Length');
    dl.append('dd').text(d3.mean(fileLengths, (d) => d[1]));

}

function updateScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const svg = d3.select('#chart').select('svg');

    xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

    const xAxis = d3.axisBottom(xScale);

    // CHANGE: we should clear out the existing xAxis and then create a new one.
    const xAxisGroup = svg.select('g.x-axis');
    xAxisGroup.selectAll('*').remove();
    xAxisGroup.call(xAxis);

    const dots = svg.select('g.dots');

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id) // change this line
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .style('--r', (d) => rScale(d.totalLines))
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });
}

// commitSlider.addEventListener('input', (event) => {
//     onTimeSliderChange();
// });

// onTimeSliderChange();

// scrolly telling
d3.select('#scatter-story')
    .selectAll('.step')
    .data(commits)
    .join('div')
    .attr('class', 'step')
    .html(
        (d, i) => `
		On ${d.datetime.toLocaleString('en', {
            dateStyle: 'full',
            timeStyle: 'short',
        })},
		I made <a href="${d.url}" target="_blank">${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
            }</a>.
		I edited ${d.totalLines} lines across ${d3.rollups(
                d.lines,
                (D) => D.length,
                (d) => d.file,
            ).length
            } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
    );

function onStepEnter(response) {
    console.log(response.element.__data__.datetime);
    response.element.style.opacity = 1;

    commitMaxTime = response.element.__data__.datetime;
    commitTime.textContent = commitMaxTime.toLocaleDateString('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
    filteredData = data.filter((d) => d.datetime <= commitMaxTime);

    updateScatterPlot(filteredData, filteredCommits);
    updateFileDisplay(filteredCommits);
    updateCommitInfo(filteredData, filteredCommits);

}

const scroller = scrollama();
scroller
    .setup({
        container: '#scrolly-1',
        offset: 0.54,
        step: '#scrolly-1 .step',
    })
    .onStepEnter(onStepEnter)
    .onStepExit(response => {
    // Fired when leaving a step
    // Use this to remove classes or reset visuals
    response.element.style.opacity = 0;
  });

