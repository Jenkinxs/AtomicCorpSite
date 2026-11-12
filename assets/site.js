(function () {
    "use strict";

    var C = {
        void: "#060a07",
        paper: "#e8dfc4",
        paper3: "#f4edd8",
        orange: "#ff5510",
        amber: "#f0a018",
        blue: "#1f6fff",
        acid: "#a8e05f",
        moss: "#6b8f3a"
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

    function initGlobe() {
        var canvas = document.getElementById("globe");
        if (!canvas) return;
        mask = decodeMask();

        var ctx = canvas.getContext("2d");
        var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var W = 0, H = 0, cx = 0, cy = 0, R = 0, rot = 0, t = 0;

        function size() {
            var box = canvas.getBoundingClientRect();
            W = Math.max(320, Math.round(box.width));
            H = Math.max(240, Math.round(box.height));
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            cx = W * 0.68;
            cy = H * 0.5;
            R = Math.max(W, H) * 0.74;
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            var TILT = 20 * Math.PI / 180;
            var ct = Math.cos(TILT), st = Math.sin(TILT);
            var wob = reduce ? 0 : Math.sin(t * 0.8) * 0.008;
            var RR = R * (1 + wob);

            function proj(lat, lon) {
                var la = lat * Math.PI / 180;
                var lo = (lon + rot) * Math.PI / 180;
                var cl = Math.cos(la);
                var x = cl * Math.sin(lo);
                var y = Math.sin(la);
                var z = cl * Math.cos(lo);
                return {
                    x: cx + x * RR,
                    y: cy - (y * ct - z * st) * RR,
                    z: y * st + z * ct
                };
            }

            ctx.lineWidth = 1;
            var g, lon, lt, q, pen;

            for (g = -60; g <= 60; g += 30) {
                ctx.beginPath();
                pen = false;
                for (lon = -180; lon <= 180; lon += 2) {
                    q = proj(g, lon);
                    if (q.z > 0.02) {
                        if (pen) ctx.lineTo(q.x, q.y);
                        else { ctx.moveTo(q.x, q.y); pen = true; }
                    } else pen = false;
                }
                ctx.strokeStyle = "rgba(107,143,58," + (g === 0 ? 0.6 : 0.38) + ")";
                ctx.stroke();
            }

            for (g = 0; g < 360; g += 30) {
                ctx.beginPath();
                pen = false;
                for (lt = -88; lt <= 88; lt += 2) {
                    q = proj(lt, g);
                    if (q.z > 0.02) {
                        if (pen) ctx.lineTo(q.x, q.y);
                        else { ctx.moveTo(q.x, q.y); pen = true; }
                    } else pen = false;
                }
                ctx.strokeStyle = "rgba(107,143,58,0.26)";
                ctx.stroke();
            }

            var step = 2.5;
            var fs = Math.max(8, Math.round(R * 0.023));
            ctx.font = fs + 'px "Departure Mono", monospace';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            for (var lat = -82.5; lat <= 82.5; lat += step) {
                for (lon = -180; lon < 180; lon += step) {
                    var p = proj(lat, lon);
                    if (p.z <= 0.04) continue;
                    var dx = p.x - cx, dy = p.y - cy;
                    if (dx * dx + dy * dy > RR * RR) continue;

                    var land = isLand(lat, lon);
                    if (!land) {
                        if (((lat + 90) / step + (lon + 180) / step) % 2 < 1) continue;
                        ctx.fillStyle = C.moss;
                        ctx.globalAlpha = 0.10 + 0.22 * p.z;
                        ctx.fillText("\u00b7", p.x, p.y);
                        continue;
                    }

                    var edge = !isLand(lat + step, lon) || !isLand(lat - step, lon) ||
                        !isLand(lat, lon + step) || !isLand(lat, lon - step);

                    if (edge) {
                        ctx.fillStyle = C.acid;
                        ctx.globalAlpha = 0.30 + 0.62 * p.z;
                        ctx.fillText("\u2588", p.x, p.y);
                    } else {
                        ctx.fillStyle = C.moss;
                        ctx.globalAlpha = 0.12 + 0.34 * p.z;
                        ctx.fillText("\u2592", p.x, p.y);
                    }
                }
            }

            ctx.beginPath();
            pen = false;
            for (lon = -180; lon <= 180; lon += 2) {
                q = proj(0, lon);
                if (q.z > 0.06) {
                    if (pen) ctx.lineTo(q.x, q.y);
                    else { ctx.moveTo(q.x, q.y); pen = true; }
                } else pen = false;
            }
            ctx.strokeStyle = C.orange;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.85;
            ctx.stroke();

            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = C.moss;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, RR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        function loop() {
            rot += 0.14;
            t += 0.016;
            draw();
            requestAnimationFrame(loop);
        }

        size();
        draw();
        window.addEventListener("resize", function () { size(); draw(); });
        if (!reduce) requestAnimationFrame(loop);
    }

    function initGlyphs(id, density, scale) {
        var canvas = document.getElementById(id);
        if (!canvas) return;
        var ctx = canvas.getContext("2d");
        var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var W = 0, H = 0;
        var items = [];
        var glyphs = "01<>[]{}/\\|=+*#%$@&?!~^\u00b7\u2591\u2592\u2593\u2500\u2502\u250c\u2510\u2514\u2518";
        var colors = [C.acid, C.orange, C.blue, C.paper, C.amber, C.moss];

        function size() {
            W = canvas.clientWidth || window.innerWidth;
            H = canvas.clientHeight || window.innerHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            build();
        }

        function build() {
            items = [];
            var n = Math.round((W * H) / density);
            n = Math.max(50, Math.min(260, n));
            for (var i = 0; i < n; i++) {
                items.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vx: (Math.random() - 0.5) * 0.55,
                    vy: (Math.random() - 0.5) * 0.35,
                    sz: (11 + Math.random() * 15) * scale,
                    g: glyphs[(Math.random() * glyphs.length) | 0],
                    c: colors[(Math.random() * colors.length) | 0],
                    a: 0.16 + Math.random() * 0.5,
                    ph: Math.random() * Math.PI * 2
                });
            }
        }

        function paint(p, now) {
            var flick = now === undefined ? 0.7 : 0.55 + 0.45 * Math.sin(now * 0.0011 + p.ph);
            ctx.globalAlpha = p.a * flick;
            ctx.fillStyle = p.c;
            ctx.font = p.sz + 'px "Departure Mono", monospace';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(p.g, p.x, p.y);
        }

        var last = performance.now();
        function frame(now) {
            var dt = Math.min(48, now - last) / 16.67;
            last = now;
            ctx.clearRect(0, 0, W, H);
            for (var i = 0; i < items.length; i++) {
                var p = items[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                if (p.x < -30) p.x = W + 30;
                if (p.x > W + 30) p.x = -30;
                if (p.y < -30) p.y = H + 30;
                if (p.y > H + 30) p.y = -30;
                paint(p, now);
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(frame);
        }

        size();
        window.addEventListener("resize", size);

        if (reduce) {
            ctx.clearRect(0, 0, W, H);
            for (var i = 0; i < items.length; i++) paint(items[i]);
            ctx.globalAlpha = 1;
        } else {
            requestAnimationFrame(frame);
        }
    }

    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789=*+-></\\|#%";

    function scramble(el, target, ms) {
        var frames = Math.max(1, Math.floor(ms / 34));
        var f = 0;
        if (el._iv) clearInterval(el._iv);
        el._iv = setInterval(function () {
            f++;
            var prog = f / frames;
            el.textContent = target.split("").map(function (ch, i) {
                if (ch === " ") return " ";
                if (i < Math.floor(prog * target.length)) return ch;
                return CHARS[(Math.random() * CHARS.length) | 0];
            }).join("");
            if (f >= frames) {
                clearInterval(el._iv);
                el.textContent = target;
            }
        }, 34);
    }

    function initScramble() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        document.querySelectorAll("[data-scramble]").forEach(function (el) {
            var target = el.getAttribute("data-scramble") || el.textContent.trim();
            el.addEventListener("mouseenter", function () { scramble(el, target, 420); });
            el.addEventListener("focus", function () { scramble(el, target, 420); });
            el.addEventListener("mouseleave", function () {
                if (el._iv) clearInterval(el._iv);
                el.textContent = target;
            });
        });
    }

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
                " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
        }
        tick();
        setInterval(tick, 1000);
    }

    function initMenu() {
        var bar = document.querySelector(".bar");
        var btn = document.querySelector(".bar-toggle");
        if (!bar || !btn) return;
        btn.addEventListener("click", function () {
            var open = bar.classList.toggle("open");
            btn.setAttribute("aria-expanded", open ? "true" : "false");
            btn.textContent = open ? "X" : "MENU";
        });
    }

    initEntrance();
    initGlobe();
    initGlyphs("glyphs", 11000, 1);
    initGlyphs("heroGlyphs", 5200, 1.25);
    initScramble();
    initClock();
    initMenu();
})();
