const cache_name = "arcade-puzzler.comv1.1.00";
const start_page = "index.html";
const main_css = "CSS/game.css";


// Audio.
// const sn_back_button_click = "assets/audio/sn_back_button_click.wav";
// const sn_bad_move_piece = "assets/audio/sn_bad_move_piece.wav";
// const sn_enter_click = "assets/audio/sn_enter_click.wav";
// const sn_move_grid = "assets/audio/sn_move_grid.wav";
// const sn_move_piece = "assets/audio/sn_move_piece.wav";
// const sn_select = "assets/audio/sn_select.wav";
// const sn_title_screen = "assets/audio/sn_title_screen.wav";
// const sn_win = "assets/audio/sn_win.wav";

const files_to_cache = [
    start_page,
    main_css,
    // sn_back_button_click,
    // sn_bad_move_piece,
    // sn_enter_click,
    // sn_move_grid,
    // sn_move_piece,
    // sn_select,
    // sn_title_screen,
    // sn_win
];

// Installation of SW.
self.addEventListener("install", (e) => {
    console.log("Arcade Puzzle service installation.");
    e.waitUntil(
        caches.open(cache_name).then((cache) => {
            console.log("SW caching dependencies");
            files_to_cache.map(async (url) => {
                console.log("Trying to add: " + url);
                return cache.add(url).catch((reason) => {
                    return console.error("Arcade Puzzle SW: " + String(reason) + ' ' + url);
                });
            })
        })
    );
});

// Activation of SW.
self.addEventListener("activate", (e) => {
    console.log("Arcade Puzzle service activation.");
    e.waitUntil(caches.keys().then((keys) => {
		return Promise.all(keys.filter((key) => {
			return !files_to_cache.includes(key);
		}).map((key) => {
			return caches.delete(key);
		}));
	}).then(() => {
		return self.clients.claim();
	}));
});

// Fecth of SW.
self.addEventListener("fetch", (e) => {
    if (!e.request.url.match(/^(http|https):\/\//i))
        return;
    
    if (e.request.method != 'GET') return;
    
	e.respondWith(
		caches.match(e.request).then((response) => {
			return response || fetch(e.request).then(async (res) => {
				const cache = await caches.open(cache_name);
                cache.put(e.request, res.clone());
                return res;  
			});
		})
	);
});
