console.log("IT'S ALIVE!")

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}


// STEP 2
// let navLinks = $$("nav a")

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname,
// )

// // truthy currentlink only 
// if (currentLink){
//     currentLink.classList.add('current')
// }

let pages = [
    { url: 'index.html', title: 'Home'},
    { url: 'projects/index.html', title: 'Projects'},
    { url: 'resume/index.html', title: 'Resume'},
    { url: 'contact/index.html', title: 'Contact Me'},
];

let nav = document.createElement('nav');
document.body.prepend(nav);

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")

? "/" 
: "/portfolio/" ;

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    url = !url.startsWith('http') ? BASE_PATH + url : url;
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    if (a.host === location.host && a.pathname === location.pathname){
        a.classList.add('current');
    };

    nav.append(a);
};

document.body.insertAdjacentHTML(
    'afterbegin',

        `
        <label class = "color-scheme">
            Theme:
            <select>
                <option value = 'light dark'> Automatic </option>
                <option value = 'light'> Light </option>
                <option value = 'dark'> Dark </option>
            </select>
        </label>`,

);

let theme_select = document.querySelector(".color-scheme")
theme_select.style.font = 'inherit';


if ("colorScheme" in localStorage) {
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
    theme_select.querySelector('select').value = localStorage.colorScheme;
    
    // console.log(theme_select.value);
    
};


theme_select.addEventListener('input', function (event){
    console.log('color scheme changed to ', event.target.value)

    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value;
});

let form_select = document.querySelector("form");

form_select?.addEventListener('submit',function(event){
    event.preventDefault()

    let data = new FormData(form_select);

    let out_url = `${form_select.action}?`;

    for (let [name,value] of data){
        console.log(name, encodeURIComponent(value));
        out_url += name + '=' + encodeURIComponent(value) + '&'
    }
    
    console.log(out_url);
    location.href = out_url;
}

);
