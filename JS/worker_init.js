var sw_url = { url: "./sw.js" };

async function loadMainJS(src)
{
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.type = "module";
        script.addEventListener("load", function() {
           resolve(script); 
        });
        script.onerror = reject;
        document.head.append(script);
    });
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

        this.navigator.serviceWorker.register(sw_url.url).then(async (reg) => {
            console.log("Arcade Puzzle PWA service worker ready.");
            reg.update();
            await loadMainJS("JS/main.js");
        }).catch(async (err) => {
            console.error("PWA Registration failed with error: " + err);
            await loadMainJS("JS/main.js");
        });
    });
} else {
    loadMainJS();
}
