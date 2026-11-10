(function () {
    "use strict";

    function initEntrance() {
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
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

    function initDiagram() {
        var svg = document.querySelector(".diagram svg");
        if (!svg) return;
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var live = svg.querySelectorAll(".wire-live");
        if (reduce) {
            live.forEach(function (p) { p.style.display = "none"; });
            return;
        }
        live.forEach(function (p) { p.style.animationPlayState = "paused"; });
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                live.forEach(function (p) {
                    p.style.animationPlayState = e.isIntersecting ? "running" : "paused";
                });
            });
        }, { threshold: 0.1 });
        io.observe(svg);
    }

    initEntrance();
    initClock();
    initMenu();
    initDiagram();
})();
