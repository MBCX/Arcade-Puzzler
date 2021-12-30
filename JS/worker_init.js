var sw_url = { url: "./sw.js" };

function loadMainJS()
{
    const script = document.createElement("script");
    script.src = "JS/main.js";
    script.type = "module";
    document.body.append(script);
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", async function () {
        const regist = await navigator.serviceWorker.register(sw_url.url);
        
        while (regist.waiting && regist.active) {
            console.log("Waiting for user to close all tabs.");
        }

        regist.addEventListener("updatefound", (e) => {
            regist.installing.addEventListener("statechange", (e) => {
                if (e.target.state === "installed") {
                    console.log("Content is cached for the first time.");
                }
            });
        });

        this.navigator.serviceWorker.register(sw_url.url).then((reg) => {
            console.log("Arcade Puzzle PWA service worker ready.");
            reg.update();
            loadMainJS();
        }).catch((err) => {
            console.error("PWA Registration failed with error: " + err);
            loadMainJS();
        });
    });
} else {
    loadMainJS();
}