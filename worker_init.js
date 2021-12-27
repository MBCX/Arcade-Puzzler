var sw_url = { url: "\/JS/sw.js" };
if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        this.navigator.serviceWorker.register(sw_url.url).then((reg) => {
            console.log("Arcade Puzzler PWA service worker ready.");
            reg.update();
        }).catch((err) => {
            console.error("PWA Registration failed with error: " + err);
        });
    });
}