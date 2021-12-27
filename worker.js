// Inspired by Flutter's registration
// of service worker.
var service_working_version = "1.0.0";
var script_loaded = false;

function loadMainJS() {
    if (script_loaded) return;
    script_loaded = true;
    let script_tag = document.createElement("script");
    script_tag.src = "JS/main.js";
    script_tag.type = "module";
    document.body.append(script_tag);
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        let worker_url = "arcade_puzzler.js?v=" + service_working_version;
        this.navigator.serviceWorker.register(worker_url).then((reg) => {
            function waitForActivation(service) {
                service.addEventListener("statechange", () => {
                    if (service.state == "activated") {
                        console.log("Service worker installed.");
                        loadMainJS();
                    }
                });
            }

            if (!reg.active && (reg.installing || reg.waiting)) {
                waitForActivation(reg.installing || reg.waiting);
            } else if (reg.active.scriptURL.endsWith(service_working_version)) {
                console.log("New worker is available.");
                reg.update();
                waitForActivation(reg.installing);
            } else {
                console.log("Loading app from service worker.");
                loadMainJS();
            }

            // If service worker doesn't succeed in a reasonable amount of time,
            // fallback to plaint <script> tag.
            this.window.setTimeout(() => {
                if (!script_loaded) {
                    console.warn(
                        "Failed to load app from service worker. Falling back to plain <script> tag."
                    );
                    loadMainJS();
                }
            }, 4000);
        }).catch(() => {
            loadMainJS();        
        });
    });
} else {
    // Not supported.
    loadMainJS();
}
