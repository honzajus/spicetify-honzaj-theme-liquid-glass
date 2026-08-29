(function nowPlayingGlow() {
	if (!(Spicetify.Player && Spicetify.colorExtractor)) {
		setTimeout(nowPlayingGlow, 100);
		return;
	}

	const style = document.createElement("style");
	style.id = "now-playing-glow-style";
	style.textContent = `
.Root__now-playing-bar,.main-nowPlayingBar-container{
	border-radius:14px!important;
	overflow:hidden!important;
	margin:5px 8px!important;
	width:calc(100% - 16px)!important;
	background:linear-gradient(90deg,rgba(var(--cover-r1,30),var(--cover-g1,30),var(--cover-b1,30),.3),rgba(var(--cover-r2,30),var(--cover-g2,30),var(--cover-b2,30),.3))!important;
	border:1px solid rgba(255,255,255,.08)!important;
	box-shadow:0 4px 14px rgba(0,0,0,.3)!important;
	backdrop-filter:blur(16px) saturate(160%)!important;
	-webkit-backdrop-filter:blur(16px) saturate(160%)!important;
	transition:background .6s ease!important;
}
footer.main-nowPlayingBar-nowPlayingBar{border-radius:14px!important}
.main-nowPlayingBar-left .main-coverSlot-container,.main-nowPlayingBar-left .main-coverSlot-expanded,.main-nowPlayingBar-left img{
	border-radius:8px!important;
	box-shadow:0 2px 6px rgba(0,0,0,.25)!important;
}
.main-nowPlayingBar-right,.main-nowPlayingBar-right button,.main-nowPlayingBar-right svg{opacity:.85!important;filter:none!important}
.main-nowPlayingBar-right button:hover svg{opacity:1!important;transform:scale(1.05)!important}
.main-nowPlayingBar-extraControls,.main-nowPlayingBar-right{gap:8px!important}
.x-progressBar-progressBarBg{height:100%!important;--progress-bar-radius:10px!important}
.x-progressBar-sliderArea{height:100%!important}
.x-progressBar-sliderArea *{height:100%!important}
.x-progressBar-fillColor{height:100%!important}
@keyframes rotating{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.cover-art,.main-nowPlayingView-coverArtContainer::after,.main-nowPlayingView-coverArtContainer::before{animation:rotating 10s linear infinite;border-radius:50%}
.cover-art{clip-path:circle(50% at 50% 50%)}
.main-nowPlayingBar-left button{background:transparent}
.main-nowPlayingView-coverArt{box-shadow:none;filter:drop-shadow(0 9px 9px rgba(0,0,0,.271))}
`;

	function keepStyleLast() {
		if (document.body.lastElementChild !== style) {
			document.body.appendChild(style);
		}
	}
	keepStyleLast();
	new MutationObserver(keepStyleLast).observe(document.body, { childList: true });

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d", { willReadFrequently: true });

	function hexToRgb(hex) {
		const n = parseInt(hex.replace("#", ""), 16);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	}

	function setPoint(suffix, r, g, b) {
		document.documentElement.style.setProperty(`--cover-r${suffix}`, r);
		document.documentElement.style.setProperty(`--cover-g${suffix}`, g);
		document.documentElement.style.setProperty(`--cover-b${suffix}`, b);
	}

	function getCoverUrl(item) {
		const m = item?.metadata || {};
		const raw = m.image_xlarge_url || m.image_large_url || m.image_url || null;
		if (!raw) return null;
		return raw.startsWith("spotify:image:") ? "https://i.scdn.co/image/" + raw.slice("spotify:image:".length) : raw;
	}

	function averageRegion(data, width, x0, y0, w, h) {
		let r = 0, g = 0, b = 0, n = 0;
		for (let y = y0; y < y0 + h; y++) {
			for (let x = x0; x < x0 + w; x++) {
				const i = (y * width + x) * 4;
				r += data[i];
				g += data[i + 1];
				b += data[i + 2];
				n++;
			}
		}
		return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
	}

	function fromCanvas(url) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				try {
					const size = 16;
					canvas.width = size;
					canvas.height = size;
					ctx.drawImage(img, 0, 0, size, size);
					const data = ctx.getImageData(0, 0, size, size).data;
					const left = averageRegion(data, size, 0, 0, size / 2, size);
					const right = averageRegion(data, size, size / 2, 0, size / 2, size);
					resolve([left, right]);
				} catch (e) {
					reject(e);
				}
			};
			img.onerror = reject;
			img.src = url;
		});
	}

	async function update() {
		const item = Spicetify.Player.data?.item;
		if (!item) return;

		try {
			const colors = await Spicetify.colorExtractor(item.uri);
			const values = colors ? Object.values(colors).filter(Boolean) : [];
			if (values.length >= 2) {
				setPoint(1, ...hexToRgb(values[0]));
				setPoint(2, ...hexToRgb(values[1]));
				return;
			}
			if (values.length === 1) {
				const rgb = hexToRgb(values[0]);
				setPoint(1, ...rgb);
				setPoint(2, ...rgb);
				return;
			}
		} catch (e) {}

		const url = getCoverUrl(item);
		if (!url) return;
		try {
			const [left, right] = await fromCanvas(url);
			setPoint(1, ...left);
			setPoint(2, ...right);
		} catch (e) {}
	}

	Spicetify.Player.addEventListener("songchange", update);
	update();
})();
