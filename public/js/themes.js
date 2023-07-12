let lightTheme = true;
function toggleTheme() {
    const darkmodeStylesheet = document.getElementById("darkmode-stylesheet");

    if (lightTheme) {
        lightTheme = false;
        darkmodeStylesheet.href = "/css/styles.dark.css";
        setThemeCookie("dark", 30); // Save the user's choice in a cookie
    } else {
        lightTheme = true;
        darkmodeStylesheet.href = "";
        setThemeCookie("light", 30); // Save the user's choice in a cookie
    }
}

function loadTheme() {
    const savedTheme = getThemeCookie();
    if (savedTheme) {
        if (savedTheme === "dark") {
            lightTheme = true;
        } else {
            lightTheme = false;
        }
        toggleTheme();
    }
}


function setThemeCookie(value, days) {
    const name = "theme";
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getThemeCookie() {
    const name = "theme";
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

document.addEventListener("DOMContentLoaded", loadTheme);
