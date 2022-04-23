// Append special CSS rules for bug-fix
// in specific browsers.
if (/Firefox/.test(window.navigator.userAgent)) {
    const link = document.createElement("link");

    document.querySelector("head").append(link);
    link.setAttribute("href", "../CSS/browser-fixes/firefox.css");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
}

if (/Safari/.test(window.navigator.userAgent)) {
    const link = document.createElement("link");

    document.querySelector("head").append(link);
    link.setAttribute("href", "../CSS/browser-fixes/safari.css");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
}