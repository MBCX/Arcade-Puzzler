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
        const reg = await navigator.serviceWorker.register(sw_url.url);
        
        if (reg.waiting && reg.active) {
            console.log("Please close all tabs to get updates.");
        } else {
            reg.addEventListener("updatefound", (e) => {
                reg.installing.addEventListener("statechange", (e) => {
                    if (e.target.state === "installed")
                    {
                        if (reg.active)
                        {
                            console.log("Please close all tabs to get updates.");
                        }
                        else
                        {
                            console.log("Content is cached for the first time.");
                        }
                    }
                });
            });
        }
        
        this.navigator.serviceWorker.register(sw_url.url).then((reg) => {
            console.log("Arcade Puzzle PWA service worker ready.");
            loadMainJS();
            reg.update();
        }).catch((err) => {
            console.error("PWA Registration failed with error: " + err);
            loadMainJS();
        });
    });
} else {
    loadMainJS();
}