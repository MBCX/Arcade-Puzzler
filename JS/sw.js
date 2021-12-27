"use strict";

const cache_name = "arcade-puzzler.comv1.0.0";
const start_page = window.location.hostname + "/index.html";
const game_page = window.location.hostname + "/game.html";
const options_page = window.location.hostname + "/options.html";
const files_to_cache = [
    start_page,
    game_page,
    options_page
];

// Installation of SW.
self.addEventListener("install", (e) => {
    console.log("Arcade Puzzler service installation.");
    e.waitUntil(
        caches.open(cache_name).then((cache) => {
            console.log("SW caching dependencies");
            files_to_cache.map((url) => {
                return cache.add(url).catch((reason) => {
                    return console.log("Arcade Puzzler SW: " + String(reason) + ' ' + url);
                });
            })
        })
    );
});

// Activation of SW.
self.addEventListener("activate", (e) => {
    console.log("Arcade Puzzler service activation.");
    e.waitUntil(
        caches.keys().then((keylist) => {
            return Promise.all(keylist.map((key) => {
                if (key !== cache_name) {
                    console.log("Arcade Puzzler SW old cache removed", key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// Fecth of SW.
self.addEventListener("fetch", (e) => {
    if (!e.request.url.match(/^(http|https):\/\//i))
        return;
    
	e.respondWith(
		caches.match(e.request).then((response) => {
			return response || this.window.fetch(e.request).then(async (res) => {
				const cache = await caches.open(cache_name);
                cache.put(e.request, res.clone());
                return res;  
			});
		}).catch(() => {
			return caches.match(offlinePage);
		})
	);
});