(function () {
    "use strict";

    var C = {
        paper: "#f2e6c9",
        paper3: "#f8f0dc",
        ink: "#0c0c08",
        vermilion: "#e8401a",
        amber: "#f0a018",
        azure: "#1f6feb",
        olive: "#4a4a24",
        teal: "#23302e",
        sea: "#6e7b7b"
    };

    var MASK_B64 =
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/B/8AAAAAAAAAAAAAAAAAAH/////wB+B4AA8AAAAA" +
        "AAAA//////+AD+AAAAfgAAAAAAAD//+f//+ABoAD8D/8A/gAAAAD///Af/+AAAAPHv//8dAAgf4P///4f/8AAPgPP/////8J" +
        "h//////+P/wAB///////////////////P+PgD//////////////////+HwPgP///////////h////+P+DwAAf//////////9" +
        "B/n//+D+AAAHP3/////////oA+A/////gAAPHv///////wPAAgA/////wAAP/////////8OAAAAf////wAAP/////////8MA" +
        "AAAP////4AAH/////////8AAAAAD////4AAB/////////8AAAAAD///+AAAP//f//////+AAAAAD///4AAAP3///////+cAA" +
        "AAAD///gAAAPn///////8YAAAAAB///AAAAP/v//////94AAAAAB///AAAAP/M//////vwAAAAAAf/8AAAAP////////iAAA" +
        "AAAAf/8AAAA/////////gAAAAAAAP8PAAAA/////////gAAAAAAAH4OAAAB/////P///gAAAAMAAB9/gAAB/////H//8gAAA" +
        "AGAAB/z8AAB/////B+f4gAAAAAAAAf4AAAB////+B4fxwAAAAAAAAB4AAAD////wB4Hw4AAAAAAAAAZ/AAB////4AwHx4AAA" +
        "AAAAAAf/gAA////4A4Hj4AAAAAAAAAH/4AAf///wAYPD4AAAAAAAAAD/8AAPP//wAAPPAAAAAAAAAAH/+AAAH//gAAHf8AAA" +
        "AAAAAAH//gAAH/+AAAD/3wgAAAAAAAH//8AAD/+AAADv/+wAAAAAAAH//+AAD/8AAAB9xf8AAAAAAAD//8AAB/8AAAAf4fmA" +
        "AAAAAAD//8AAB/+QAAAAztiAAAAAAAB//4AAD/+YAAAAPuAggAAAAAB//4AAD//4AAAA/+AxgAAAAAAf/4AAD/5wAAAB//AD" +
        "AAAAAAAf/wAAB/5wAAAH//hgAAAAAAAf/wAAB/5wAAAH//gAAAAAAAAf+AAAB/xgAAAH//wAAAAAAAAf+AAAA/gAAAAH//wA" +
        "AAAAAAAf8AAAAfgAAAAH//wAAAAAAAAf4AAAAfAAAAAD5/gEAAAAAAA/wAAAAAAAAAADA/gGgAAAAAA/gAAAAAAAAAAAAPAH" +
        "AAAAAAA/AAAAAAAAAAAAAHAOAAAAAAA+AAAAAAAAAAAAADAcAAAAAAB8AAAAAAAAAAAAAAA4AAAAAAB8AAAAAAAAGAAAAAAA" +
        "AAAAAAB5gAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAfQP///+AAAAAAAAAeAAAAFw//9/////8A" +
        "AAAAAcB/AAAf///////////4AAD/+///AAB////////////4AP/////+AB/////////////AA//////hHn/////////////g" +
        "AH//////v//////////////A////////////////////////Af4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    var MW = 144, MH = 72;
    var mask = null;

    function decodeMask() {
        var bin = atob(MASK_B64);
        var out = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    function isLand(lat, lon) {
        var x = Math.floor((lon + 180) / 360 * MW);
        var y = Math.floor((90 - lat) / 180 * MH);
        if (x < 0) x = 0; if (x >= MW) x = MW - 1;
        if (y < 0) y = 0; if (y >= MH) y = MH - 1;
        var i = y * MW + x;
        return (mask[i >> 3] >> (7 - (i & 7))) & 1;
    }

    /* ── textmode globe ───────────────────────────────────── */

    function initGlobe() {
        var canvas = document.getElementById("globe");
        if (!canvas) return;
        mask = decodeMask();

        var ctx = canvas.getContext("2d");
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        var W = 0, H = 0, cx = 0, cy = 0, R = 0;

        function size() {
            var box = canvas.getBoundingClientRect();
            W = Math.max(200, Math.round(box.width));
            H = Math.max(200, Math.round(box.height));
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            cx = W / 2;
            cy = H / 2;
            R = Math.min(W, H) * 0.395;
        }

        var rot = 0;
        var t = 0;

        function draw() {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = C.teal;
            ctx.fillRect(0, 0, W, H);

            var wob = reduce ? 0 : Math.sin(t * 0.9) * 0.01;
            var RR = R * (1 + wob);

            var TILT = 20 * Math.PI / 180;
            var ct = Math.cos(TILT), st = Math.sin(TILT);

            function proj(lat, lon) {
                var la = lat * Math.PI / 180;
                var lo = (lon + rot) * Math.PI / 180;
                var cl = Math.cos(la);
                var x = cl * Math.sin(lo);
                var y = Math.sin(la);
                var z = cl * Math.cos(lo);
                var y2 = y * ct - z * st;
                var z2 = y * st + z * ct;
                return {
                    x: cx + x * RR,
                    y: cy - y2 * RR,
                    z: z2
                };
            }

            /* ── wire mesh: real strokes ── */
            ctx.lineWidth = 1;
            var g, lon, a, b;

            for (g = -60; g <= 60; g += 30) {
                ctx.beginPath();
                var pen = false;
                for (lon = -180; lon <= 180; lon += 2) {
                    var q = proj(g, lon);
                    if (q.z > 0.02) {
                        if (pen) ctx.lineTo(q.x, q.y);
                        else { ctx.moveTo(q.x, q.y); pen = true; }
                    } else pen = false;
                }
                ctx.strokeStyle = "rgba(159,176,172," + (g === 0 ? 0.5 : 0.34) + ")";
                ctx.stroke();
            }

            for (g = 0; g < 360; g += 30) {
                ctx.beginPath();
                var pen2 = false;
                for (var lt = -88; lt <= 88; lt += 2) {
                    var q2 = proj(lt, g);
                    if (q2.z > 0.02) {
                        if (pen2) ctx.lineTo(q2.x, q2.y);
                        else { ctx.moveTo(q2.x, q2.y); pen2 = true; }
                    } else pen2 = false;
                }
                ctx.strokeStyle = "rgba(159,176,172,0.30)";
                ctx.stroke();
            }

            /* ── land: character stipple ── */
            var step = 2.5;
            var cellH = (R * 2) / 52;
            var fs = Math.max(6, Math.round(cellH * 1.04));
            ctx.font = fs + 'px "Departure Mono", monospace';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            for (var lat = -82.5; lat <= 82.5; lat += step) {
                for (lon = -180; lon < 180; lon += step) {
                    if (!isLand(lat, lon)) continue;
                    var p = proj(lat, lon);
                    if (p.z <= 0.06) continue;
                    var dx = p.x - cx, dy = p.y - cy;
                    if (dx * dx + dy * dy > RR * RR * 0.995) continue;

                    var edge = !isLand(lat + step, lon) || !isLand(lat - step, lon) ||
                        !isLand(lat, lon + step) || !isLand(lat, lon - step);

                    if (edge) {
                        ctx.fillStyle = C.amber;
                        ctx.globalAlpha = 0.55 + 0.45 * p.z;
                        ctx.fillText("\u2588", p.x, p.y);
                    } else {
                        ctx.fillStyle = C.amber;
                        ctx.globalAlpha = 0.18 + 0.34 * p.z;
                        ctx.fillText("\u2592", p.x, p.y);
                    }
                }
            }

            /* ── equator ── */
            ctx.beginPath();
            var pen3 = false;
            for (lon = -180; lon <= 180; lon += 2) {
                var q3 = proj(0, lon);
                if (q3.z > 0.06) {
                    if (pen3) ctx.lineTo(q3.x, q3.y);
                    else { ctx.moveTo(q3.x, q3.y); pen3 = true; }
                } else pen3 = false;
            }
            ctx.strokeStyle = C.vermilion;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.9;
            ctx.stroke();

            /* ── rim ── */
            ctx.globalAlpha = 0.62;
            ctx.strokeStyle = "#b6c4c0";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(cx, cy, RR, 0, Math.PI * 2);
            ctx.stroke();

            ctx.globalAlpha = 1;
        }

        function loop() {
            rot += 0.16;
            t += 0.016;
            draw();
            requestAnimationFrame(loop);
        }

        size();
        draw();
        window.addEventListener("resize", function () {
            size();
            draw();
        });

        if (reduce) {
            rot = -20;
            draw();
        } else {
            requestAnimationFrame(loop);
        }
    }

    /* ── fluid character field ────────────────────────────── */

    function initFlow() {
        var canvas = document.getElementById("flow");
        if (!canvas) return;
        var ctx = canvas.getContext("2d");
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var W = 0, H = 0, cols = 0, rows = 0;
        var cw = 11, ch = 17;
        var particles = [];
        var palette = [C.amber, C.vermilion, C.azure, C.paper, "#9fb0ac"];
        var glyphs = ".:;+*#%/\\[]{}<>=~^\u00b7\u2500\u2502\u2591\u2592";

        function size() {
            var box = canvas.getBoundingClientRect();
            W = Math.round(box.width);
            H = Math.round(box.height);
            if (!W || !H) return;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            cols = Math.ceil(W / cw);
            rows = Math.ceil(H / ch);
            build();
        }

        function build() {
            particles = [];
            var n = Math.round(cols * rows * 0.42);
            for (var i = 0; i < n; i++) {
                particles.push({
                    x: Math.random() * cols,
                    y: Math.random() * rows,
                    sp: 0.05 + Math.random() * 0.26,
                    ph: Math.random() * Math.PI * 2,
                    amp: 0.4 + Math.random() * 2.2,
                    g: glyphs[(Math.random() * glyphs.length) | 0],
                    c: palette[(Math.random() * palette.length) | 0],
                    a: 0.38 + Math.random() * 0.62
                });
            }
        }

        function draw(time) {
            if (!W || !H) return;
            ctx.fillStyle = C.ink;
            ctx.fillRect(0, 0, W, H);
            ctx.font = '14px "Departure Mono", monospace';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                if (!reduce) {
                    p.x += p.sp;
                    if (p.x > cols) { p.x = -1; p.y = Math.random() * rows; }
                }
                var yy = p.y + Math.sin(p.x * 0.2 + p.ph + time * 0.7) * p.amp;
                ctx.globalAlpha = p.a * (0.5 + 0.5 * Math.sin(p.x * 0.12 + p.ph));
                ctx.fillStyle = p.c;
                ctx.fillText(p.g, p.x * cw + cw / 2, yy * ch + ch / 2);
            }
            ctx.globalAlpha = 1;
        }

        var start = performance.now();
        function loop() {
            draw((performance.now() - start) / 1000);
            requestAnimationFrame(loop);
        }

        size();
        draw(0);

        var rt = null;
        window.addEventListener("resize", function () {
            size();
            draw(0);
            if (!reduce && !rt) rt = requestAnimationFrame(loop);
        });

        if (!reduce) {
            rt = requestAnimationFrame(loop);
        }
    }

    /* ── chrome ───────────────────────────────────────────── */

    function initEntrance() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            document.documentElement.classList.add("entered");
            return;
        }
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                document.documentElement.classList.add("entered");
            });
        });
    }

    function initClock() {
        var el = document.querySelector("[data-clock]");
        if (!el) return;
        function tick() {
            var d = new Date();
            var pad = function (n) { return String(n).padStart(2, "0"); };
            el.textContent = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
                " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
        }
        tick();
        setInterval(tick, 30000);
    }

    function initMenu() {
        var bar = document.querySelector(".bar");
        var btn = document.querySelector(".bar-toggle");
        if (!bar || !btn) return;
        btn.addEventListener("click", function () {
            var open = bar.classList.toggle("open");
            btn.setAttribute("aria-expanded", open ? "true" : "false");
            btn.textContent = open ? "CLOSE" : "INDEX";
        });
    }

    initEntrance();
    initGlobe();
    initFlow();
    initClock();
    initMenu();
})();
