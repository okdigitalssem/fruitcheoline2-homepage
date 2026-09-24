/**
 * 과일철이네2 홈페이지 - 영화 같은 3D 스크롤 효과 (cinema.js)
 *
 * 외부 라이브러리 없이 동작합니다. (인터넷이 없어도 index.html 더블클릭으로 OK)
 *
 *  - 오프닝 타이틀 + 위아래 검은 띠(레터박스) + 필름 질감
 *  - SCENE 01 히어로 : 스크롤하면 기울어진 사진이 3D로 돌아 화면을 가득 채웁니다
 *  - SCENE 04 쇼케이스 : 과일 20종이 3D 원형으로 스크롤에 따라 회전합니다
 *  - 나머지 섹션 : data-3d="..." 가 붙은 요소가 3D로 날아 들어옵니다
 *  - 오른쪽 장면 목차, 카드 3D 호버, 회전 과일 클릭 → 상품 카드로 이동
 *
 * "동작 줄이기" 설정을 켠 기기에서는 효과 없이 일반 페이지로 보입니다.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  if (!root.classList.contains("cinema")) return; // 동작 줄이기 설정 등으로 꺼진 경우

  var config = window.SITE_CONFIG || {};
  var IMG_DIR = "public/images/fruits/";

  // ---------------------------------------------------------
  // 도우미
  // ---------------------------------------------------------
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function range(p, a, b) {
    return clamp((p - a) / (b - a), 0, 1);
  }
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var isMobile = vw <= 860;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  // 마우스 위치 (-1 ~ 1), 부드럽게 따라갑니다
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  // ---------------------------------------------------------
  // 1. 오프닝 타이틀
  // ---------------------------------------------------------
  function playIntro() {
    var seen = false;
    try {
      seen = sessionStorage.getItem("fc2-intro") === "1";
      sessionStorage.setItem("fc2-intro", "1");
    } catch (e) {}
    var delay = seen ? 0 : 1500;
    setTimeout(function () {
      root.classList.add("intro-done");
    }, delay);
  }

  // ---------------------------------------------------------
  // 2. SCENE 01 히어로 (고정된 무대 위에서 3D 연출)
  // ---------------------------------------------------------
  var hero = {
    section: document.getElementById("hero"),
    text: document.getElementById("hero-text"),
    photo: document.getElementById("hero-photo"),
    stamp: document.getElementById("hero-stamp"),
    caption: document.getElementById("hero-caption"),
    cue: document.getElementById("scroll-cue"),
    particles: [],
    p: 0,
    target: 0,
    geo: null,
  };

  function buildParticles() {
    var wrap = document.getElementById("hero-particles");
    if (!wrap) return;
    var emojis = ["🍓", "🍊", "🍇", "🍑", "🍎", "🥝", "🍒", "🍋", "🍐", "🫐"];
    var count = isMobile ? 9 : 16;
    var html = "";
    for (var i = 0; i < count; i++) {
      var depth = 0.3 + ((i * 37) % 70) / 100; // 0.3 ~ 1.0 (클수록 가까움)
      var x = (i * 61) % 100;
      var y = (i * 43 + 11) % 100;
      html +=
        '<span class="particle" data-depth="' + depth.toFixed(2) + '" style="left:' + x + "%;top:" + y +
        "%;font-size:" + Math.round(18 + depth * 34) + "px;filter:blur(" + (depth < 0.45 ? 2 : 0) + "px);opacity:" +
        (0.35 + depth * 0.5).toFixed(2) + '">' + emojis[i % emojis.length] + "</span>";
    }
    wrap.innerHTML = html;
    hero.particles = Array.prototype.map.call(wrap.children, function (el, i) {
      return { el: el, depth: parseFloat(el.getAttribute("data-depth")), phase: i * 0.7 };
    });
  }

  function measureHero() {
    if (!hero.photo) return;
    var old = hero.photo.style.transform;
    hero.photo.style.transform = "none";
    var r = hero.photo.getBoundingClientRect();
    var stageTop = hero.photo.closest(".scene-stage").getBoundingClientRect().top;
    hero.photo.style.transform = old;
    var cx = r.left + r.width / 2;
    var cy = r.top - stageTop + r.height / 2;
    hero.geo = {
      dx: vw / 2 - cx,
      dy: vh / 2 - cy,
      scale: Math.max(vw / r.width, vh / r.height) * 1.08,
    };
  }

  function renderHero(time) {
    if (!hero.section || !hero.geo) return;
    var p = hero.p;
    var g = hero.geo;

    // 글자: 뒤로 밀려나며 사라짐
    var t1 = easeInOut(range(p, 0, 0.38));
    hero.text.style.transform =
      "perspective(1100px) translate3d(0," + (-70 * t1) + "px," + (-520 * t1) + "px) rotateX(" + (22 * t1) + "deg)";
    hero.text.style.opacity = String(1 - t1);
    hero.text.style.pointerEvents = t1 > 0.5 ? "none" : "";

    // 사진: 기울어진 3D 카드 → 돌면서 화면 가득
    var tp = easeInOut(range(p, 0.02, 0.78));
    var mx = finePointer ? mouse.x * (1 - tp) : 0;
    var my = finePointer ? mouse.y * (1 - tp) : 0;
    var floatY = Math.sin(time / 900) * 8 * (1 - tp);
    hero.photo.style.transform =
      "perspective(1400px) translate3d(" + g.dx * tp + "px," + (g.dy * tp + floatY) + "px,0) " +
      "scale(" + lerp(1, g.scale, tp) + ") " +
      "rotateY(" + (-24 * (1 - tp) + mx * 10) + "deg) " +
      "rotateX(" + (10 * (1 - tp) - my * 10) + "deg) " +
      "rotateZ(" + (2 * (1 - tp)) + "deg)";
    hero.photo.style.setProperty("--round", 32 * (1 - tp) + "px");
    hero.photo.style.setProperty("--shade", String(0.62 * range(p, 0.45, 0.8)));

    // 도장: 빙글 돌며 날아감
    var ts = easeInOut(range(p, 0, 0.3));
    hero.stamp.style.transform =
      "perspective(900px) translate3d(" + (-200 * ts) + "px," + (160 * ts) + "px," + (300 * ts) + "px) rotate(" + (-12 - 200 * ts) + "deg)";
    hero.stamp.style.opacity = String(1 - ts);

    // 영화 자막
    var tc = easeOut(range(p, 0.6, 0.85));
    hero.caption.style.opacity = String(tc);
    hero.caption.style.transform =
      "perspective(1000px) translate(-50%,-50%) translate3d(0," + (40 * (1 - tc)) + "px," + (-260 * (1 - tc)) + "px)";

    if (hero.cue) hero.cue.style.opacity = String(1 - range(p, 0, 0.08));

    // 떠다니는 과일: 깊이에 따라 다른 속도로 (원근감)
    for (var i = 0; i < hero.particles.length; i++) {
      var pt = hero.particles[i];
      var d = pt.depth;
      var bob = Math.sin(time / 1200 + pt.phase) * 10 * d;
      pt.el.style.transform =
        "translate3d(" + (mouse.x * -30 * d) + "px," + (-p * 900 * d + bob + mouse.y * -20 * d) + "px," +
        (d * 200 * p) + "px) rotate(" + (p * 180 * (d - 0.6) + Math.sin(time / 1500 + pt.phase) * 12) + "deg)";
    }

    // 밝은 첫 화면에서는 검은 띠(레터박스)를 쓰지 않습니다 (마지막 장면에서만 닫힘)
    root.style.setProperty("--letterbox", "0");
  }

  // ---------------------------------------------------------
  // 3. SCENE 04 3D 회전 쇼케이스
  // ---------------------------------------------------------
  var ring = {
    section: document.getElementById("showcase"),
    el: document.getElementById("ring"),
    now: document.getElementById("showcase-now"),
    cards: [],
    p: 0,
    target: 0,
    radius: 0,
    step: 0,
    lastFront: -1,
  };

  function buildRing() {
    var fruits = config.fruits || [];
    if (!ring.el || !fruits.length) {
      if (ring.section) ring.section.hidden = true;
      return;
    }
    ring.step = 360 / fruits.length;
    ring.el.innerHTML = fruits
      .map(function (f, i) {
        return (
          '<a class="ring-card" href="#fruit-card-' + i + '" data-i="' + i + '" aria-label="' +
          escapeHtml(f.name) + ' 자세히 보기">' +
          '<div class="ring-photo"><img data-src="' + IMG_DIR + encodeURIComponent(f.file) + '" alt="" ' +
          'decoding="async" onerror="this.style.visibility=\'hidden\'" /></div>' +
          '<span class="ring-name"><span class="ring-emoji">' + escapeHtml(f.emoji || "") + "</span>" +
          escapeHtml(f.name) + "</span></a>"
        );
      })
      .join("");
    ring.cards = Array.prototype.slice.call(ring.el.children);
    layoutRing();
  }

  function layoutRing() {
    if (!ring.cards.length) return;
    var w = ring.cards[0].offsetWidth || 200;
    // 카드들이 원을 빈틈없이 두르도록 반지름 계산
    ring.radius = Math.round((w * 1.12) / (2 * Math.tan(Math.PI / ring.cards.length)));
    ring.cards.forEach(function (card, i) {
      card.style.transform = "rotateY(" + i * ring.step + "deg) translateZ(" + ring.radius + "px)";
    });
  }

  function renderRing() {
    if (!ring.cards.length) return;
    var p = ring.p;
    var enter = easeOut(range(p, 0, 0.18));
    var leave = easeInOut(range(p, 0.86, 1));
    var angle = -p * 360 * 1.15;
    var tilt = lerp(-38, -9, enter) + leave * 20;
    var depth = -ring.radius + lerp(-900, 0, enter) + leave * -600;

    ring.el.style.transform =
      "translate3d(0,0," + depth + "px) rotateX(" + tilt + "deg) rotateY(" + angle + "deg)";
    ring.el.style.opacity = String(enter * (1 - leave));

    // 앞쪽 카드는 밝게, 뒤쪽은 어둡게
    var front = 0;
    var best = -2;
    for (var i = 0; i < ring.cards.length; i++) {
      var a = ((i * ring.step + angle) * Math.PI) / 180;
      var c = Math.cos(a);
      if (c > best) {
        best = c;
        front = i;
      }
      ring.cards[i].style.opacity = (0.18 + 0.82 * Math.pow((c + 1) / 2, 1.6)).toFixed(3);
    }

    if (front !== ring.lastFront && ring.now) {
      ring.lastFront = front;
      var f = (config.fruits || [])[front] || {};
      ring.now.innerHTML =
        "<strong>" + escapeHtml((f.emoji || "") + " " + (f.name || "")) + "</strong><span>" + escapeHtml(f.desc || "") + "</span>";
      ring.now.classList.remove("is-swap");
      void ring.now.offsetWidth;
      ring.now.classList.add("is-swap");
      ring.cards.forEach(function (card, idx) {
        card.classList.toggle("is-front", idx === front);
      });
    }
  }

  // ---------------------------------------------------------
  // 4. data-3d 요소들 (스크롤 위치에 따라 3D로 등장)
  // ---------------------------------------------------------
  var items = [];

  function collectItems() {
    items = Array.prototype.map.call(document.querySelectorAll("[data-3d]"), function (el) {
      var prev = items.filter(function (it) {
        return it.el === el;
      })[0];
      return {
        el: el,
        type: el.getAttribute("data-3d"),
        i: parseInt(el.getAttribute("data-i") || "0", 10),
        n: parseInt(el.getAttribute("data-n") || "1", 10),
        top: 0,
        h: 0,
        e: prev ? prev.e : 0,
        c: prev ? prev.c : 0,
        stagger: 0,
      };
    });
    items.forEach(function (it) {
      if (it.type === "flip" || it.type === "fan") bindHover(it.el);
    });
  }

  // 변형(transform)을 잠시 지우고 원래 위치를 잽니다
  function measureItems() {
    items.forEach(function (it) {
      it.el.style.transform = "none";
    });
    var sy = window.scrollY;
    var visibleIndex = 0;
    items.forEach(function (it) {
      var r = it.el.getBoundingClientRect();
      it.top = r.top + sy;
      it.h = r.height;
      if (it.type === "flip") {
        if (it.el.hidden) return;
        var cols = vw <= 640 ? 2 : vw <= 1024 ? 3 : 4;
        it.stagger = (visibleIndex++ % cols) * 0.08;
      } else if (it.type === "card" || it.type === "fan" || it.el.hasAttribute("data-i")) {
        it.stagger = isMobile ? 0 : it.i * 0.08;
      }
    });
  }

  function targetFor(it, sy) {
    var top = it.top - sy;
    // 화면 아래에서 올라오며 0 → 1
    var e = (vh - top) / (vh * 0.55) - it.stagger;
    // 화면 가운데 기준 위치 (-1 위 ~ 1 아래)
    var c = (top + it.h / 2 - vh / 2) / vh;
    return { e: clamp(e, 0, 1), c: clamp(c, -1.5, 1.5) };
  }

  function styleFor(it) {
    var k = easeOut(it.e); // 0 → 1 (등장 완료)
    var r = 1 - k; // 1 → 0 (남은 양)
    var c = it.c;
    switch (it.type) {
      case "rise":
        return {
          t: "translate3d(0," + 90 * r + "px," + -220 * r + "px) rotateX(" + 38 * r + "deg)",
          o: k,
        };
      case "swing-left":
        return {
          t: "translate3d(" + -90 * r + "px,0," + -160 * r + "px) rotateY(" + 65 * r + "deg)",
          o: k,
          origin: "left center",
        };
      case "swing-right":
        return {
          t: "translate3d(" + 90 * r + "px,0," + -160 * r + "px) rotateY(" + -65 * r + "deg)",
          o: k,
          origin: "right center",
        };
      case "flip": {
        var dir = it.i % 2 ? -1 : 1;
        return {
          t: "translate3d(0," + 60 * r + "px," + -260 * r + "px) rotateY(" + 80 * r * dir + "deg) rotateX(" +
            (-18 * r + c * -5) + "deg)",
          o: k,
        };
      }
      case "card":
        return {
          t: "translate3d(0," + 40 * r + "px,0) rotateY(" + -180 * r + "deg) rotateZ(" + -6 * r + "deg)",
          o: 1,
        };
      case "fan": {
        if (isMobile) {
          return {
            t: "translate3d(0," + 80 * r + "px," + -200 * r + "px) rotateX(" + 30 * r + "deg)",
            o: k,
          };
        }
        var mid = (it.n - 1) / 2;
        var off = it.i - mid;
        var w = it.el.offsetWidth + 22;
        return {
          t: "translate3d(" + -off * w * r + "px," + (60 * r + Math.abs(off) * 20 * r) + "px," + (-120 * r - Math.abs(off) * 40 * r) +
            "px) rotateY(" + -off * 38 * r + "deg) rotateZ(" + off * 8 * r + "deg) rotateX(" + c * -6 + "deg)",
          o: clamp(k * 1.5, 0, 1),
        };
      }
      case "coin":
        return {
          t: "scale(" + (0.55 + 0.45 * k) + ") rotateY(" + (c * 70 + 180 * r) + "deg) rotateZ(" + c * -10 + "deg)",
          o: k,
        };
      case "standup":
        return {
          t: "translate3d(0,0," + -150 * r + "px) rotateX(" + 82 * r + "deg) scale(" + (0.8 + 0.2 * k) + ")",
          o: clamp(k * 1.4, 0, 1),
          origin: "center bottom",
        };
      case "zoom":
        return {
          t: "translate3d(0,0," + -700 * r + "px) rotateX(" + 25 * r + "deg)",
          o: k,
        };
      case "kenburns":
        return {
          t: "scale(" + (1.12 + 0.3 * clamp(c + 0.5, 0, 1.5)) + ") rotate(" + c * 3 + "deg)",
          o: 1,
        };
      default:
        return { t: "", o: 1 };
    }
  }

  // ---------------------------------------------------------
  // 4-1. 카드 3D 호버 (마우스를 올리면 기울어지고 빛이 반사됨, PC 전용)
  // ---------------------------------------------------------
  function bindHover(el) {
    if (!finePointer || el.__hover) return;
    var h = (el.__hover = { x: 0, y: 0, v: 0, tx: 0, ty: 0, tv: 0 });
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      h.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      h.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      h.tv = 1;
      el.style.setProperty("--gx", ((h.tx + 1) * 50).toFixed(1) + "%");
      el.style.setProperty("--gy", ((h.ty + 1) * 50).toFixed(1) + "%");
      kick();
    });
    el.addEventListener("pointerleave", function () {
      h.tx = 0;
      h.ty = 0;
      h.tv = 0;
      kick();
    });
  }

  // 호버 값을 부드럽게 따라가게 하고, 아직 움직이는 중이면 true
  function stepHover(el, smooth) {
    var h = el.__hover;
    if (!h) return false;
    h.x += (h.tx - h.x) * smooth;
    h.y += (h.ty - h.y) * smooth;
    h.v += (h.tv - h.v) * smooth;
    el.style.setProperty("--glare", h.v.toFixed(3));
    return Math.abs(h.tx - h.x) + Math.abs(h.ty - h.y) + Math.abs(h.tv - h.v) > 0.002;
  }

  function hoverTransform(el) {
    var h = el.__hover;
    if (!h || h.v < 0.001) return "";
    return (
      " translateZ(" + (h.v * 40).toFixed(1) + "px) rotateX(" + (-h.y * 12).toFixed(2) + "deg) rotateY(" +
      (h.x * 14).toFixed(2) + "deg)"
    );
  }

  // ---------------------------------------------------------
  // 4-2. 오른쪽 장면 목차 (영화 챕터처럼)
  // ---------------------------------------------------------
  var chapters = [];
  var activeChapter = -1;

  function buildSceneNav() {
    var nav = document.getElementById("scene-nav");
    if (!nav) return;
    var sections = document.querySelectorAll("[data-chapter]");
    nav.innerHTML = Array.prototype.map
      .call(sections, function (sec, i) {
        return (
          '<a href="#' + sec.id + '" class="scene-nav-item"><span class="scene-nav-no">' +
          (i + 1 < 10 ? "0" : "") + (i + 1) + '</span><span class="scene-nav-label">' +
          escapeHtml(sec.getAttribute("data-chapter")) + '</span><span class="scene-nav-dot"></span></a>'
        );
      })
      .join("");
    chapters = Array.prototype.map.call(sections, function (sec, i) {
      return { sec: sec, link: nav.children[i], top: 0 };
    });
  }

  function measureChapters() {
    var sy = window.scrollY;
    chapters.forEach(function (ch) {
      ch.top = ch.sec.getBoundingClientRect().top + sy;
    });
  }

  function updateSceneNav() {
    if (!chapters.length) return;
    var mid = window.scrollY + vh * 0.45;
    var idx = 0;
    for (var i = 0; i < chapters.length; i++) {
      if (!chapters[i].sec.hidden && chapters[i].top <= mid) idx = i;
    }
    if (idx === activeChapter) return;
    activeChapter = idx;
    chapters.forEach(function (ch, i) {
      ch.link.classList.toggle("is-active", i === idx);
      if (i === idx) ch.link.setAttribute("aria-current", "true");
      else ch.link.removeAttribute("aria-current");
    });
    // 어두운 장면 / 밝은 장면에 맞춰 목차 색을 바꿉니다
    var nav = document.getElementById("scene-nav");
    if (nav) nav.classList.toggle("on-light", !chapters[idx].sec.hasAttribute("data-dark"));
  }

  // ---------------------------------------------------------
  // 4-3. 첫 제목 글자를 한 글자씩 3D로 등장시키기
  // ---------------------------------------------------------
  function splitHeadline() {
    var el = document.querySelector(".hero-headline");
    if (!el) return;
    var text = el.textContent;
    var n = 0;
    el.innerHTML = text
      .split(/(\s+)/)
      .map(function (word) {
        if (/^\s+$/.test(word)) return " ";
        return (
          '<span class="word">' +
          Array.prototype.map
            .call(word, function (ch) {
              return '<span class="ch" style="--i:' + n++ + '">' + escapeHtml(ch) + "</span>";
            })
            .join("") +
          "</span>"
        );
      })
      .join("");
    el.setAttribute("aria-label", text);
    el.classList.add("is-split");
  }

  // ---------------------------------------------------------
  // 4-4. 회전하는 과일 카드를 누르면 아래 상품 카드로 이동
  // ---------------------------------------------------------
  function bindRingClicks() {
    if (!ring.el) return;
    ring.el.addEventListener("click", function (e) {
      var card = e.target.closest(".ring-card");
      if (!card) return;
      e.preventDefault();
      var target = document.getElementById("fruit-card-" + card.getAttribute("data-i"));
      if (!target) return;
      if (target.hidden) {
        var all = document.querySelector('.season-tab[data-season="전체"]');
        if (all) all.click();
      }
      setTimeout(function () {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.remove("is-spot");
        void target.offsetWidth;
        target.classList.add("is-spot");
      }, 120);
    });
  }

  // ---------------------------------------------------------
  // 5. 고정 무대(scene-pin) 진행률
  // ---------------------------------------------------------
  function pinProgress(section) {
    if (!section || section.hidden) return 0;
    var r = section.getBoundingClientRect();
    var total = r.height - vh;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
  }

  // ---------------------------------------------------------
  // 6. 메인 루프
  // ---------------------------------------------------------
  var progressBar = document.getElementById("scroll-progress-bar");
  var finale = document.getElementById("contact");
  var running = false;
  var lastTime = 0;

  function frame(time) {
    var dt = Math.min(64, time - (lastTime || time)) / 16.67;
    lastTime = time;
    var smooth = 1 - Math.pow(1 - 0.12, dt || 1); // 프레임 속도와 무관하게 부드럽게
    var sy = window.scrollY;
    var moving = false;

    mouse.x += (mouse.tx - mouse.x) * smooth;
    mouse.y += (mouse.ty - mouse.y) * smooth;

    // 고정 무대
    hero.target = pinProgress(hero.section);
    ring.target = pinProgress(ring.section);
    [hero, ring].forEach(function (s) {
      var d = s.target - s.p;
      s.p = Math.abs(d) < 0.0005 ? s.target : s.p + d * smooth;
      if (s.p !== s.target) moving = true;
    });

    // 화면 근처에 있을 때만 그립니다 (성능)
    var heroRect = hero.section && hero.section.getBoundingClientRect();
    if (heroRect && heroRect.bottom > -50) renderHero(time);
    var ringRect = ring.section && !ring.section.hidden && ring.section.getBoundingClientRect();
    // 쇼케이스가 가까워지면 사진을 불러옵니다 (일부 앱 내장 브라우저는 3D 안의 지연 로딩이 안 되어 직접 처리)
    if (ringRect && !ring.loaded && ringRect.top < vh * 2.5) {
      ring.loaded = true;
      ring.el.querySelectorAll("img[data-src]").forEach(function (img) {
        img.src = img.getAttribute("data-src");
        img.removeAttribute("data-src");
      });
    }
    if (ringRect && ringRect.bottom > -50 && ringRect.top < vh + 50) renderRing();

    // 3D 등장 요소
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.el.hidden) continue;
      var tg = targetFor(it, sy);
      var de = tg.e - it.e;
      var dc = tg.c - it.c;
      var hv = stepHover(it.el, smooth);
      if (hv) moving = true;
      if (Math.abs(de) < 0.0008 && Math.abs(dc) < 0.0008 && !hv) {
        if (it.settled) continue;
        it.e = tg.e;
        it.c = tg.c;
        it.settled = true;
      } else {
        it.e += de * smooth;
        it.c += dc * smooth;
        it.settled = false;
        moving = true;
      }
      var top = it.top - sy;
      if (top > vh * 1.6 || top + it.h < -vh * 0.6) continue; // 화면 밖이면 생략
      var st = styleFor(it);
      it.el.style.transform = st.t ? "perspective(1100px) " + st.t + hoverTransform(it.el) : "";
      it.el.style.opacity = st.o >= 0.999 ? "" : st.o.toFixed(3);
      if (st.origin) it.el.style.transformOrigin = st.origin;
    }

    updateSceneNav();

    // 스크롤 진행바
    var max = document.documentElement.scrollHeight - vh;
    if (progressBar) progressBar.style.transform = "scaleX(" + (max > 0 ? sy / max : 0) + ")";

    // 마지막 장면에서 레터박스가 다시 닫힘 (영화 엔딩)
    if (finale && (!heroRect || heroRect.bottom <= -50)) {
      var fr = finale.getBoundingClientRect();
      root.style.setProperty("--letterbox", String(0.8 * range(vh - fr.top, vh * 0.4, vh * 1.1)));
    }

    var heroVisible = heroRect && heroRect.bottom > 0;
    var mouseMoving = Math.abs(mouse.tx - mouse.x) > 0.001 || Math.abs(mouse.ty - mouse.y) > 0.001;
    if (moving || heroVisible || mouseMoving) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function kick() {
    if (running) return;
    running = true;
    lastTime = 0;
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------
  // 7. 다시 재기 (창 크기 변경, 사진 로딩, 계절 탭 클릭 등)
  // ---------------------------------------------------------
  var refreshTimer = null;
  function refresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      vw = window.innerWidth;
      vh = window.innerHeight;
      isMobile = vw <= 860;
      collectItems();
      layoutRing();
      measureItems();
      measureHero();
      measureChapters();
      items.forEach(function (it) {
        it.settled = false;
      });
      kick();
    }, 60);
  }
  window.__cinemaRefresh = refresh;

  // ---------------------------------------------------------
  // 시작
  // ---------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    splitHeadline();
    playIntro();
    buildParticles();
    buildRing();
    bindRingClicks();
    buildSceneNav();
    collectItems();
    measureItems();
    measureHero();
    measureChapters();
    kick();

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", refresh);
    window.addEventListener("load", refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    if ("ResizeObserver" in window) {
      var lastH = document.body.scrollHeight;
      new ResizeObserver(function () {
        var h = document.body.scrollHeight;
        if (Math.abs(h - lastH) > 2) {
          lastH = h;
          refresh();
        }
      }).observe(document.body);
    }

    if (finePointer) {
      window.addEventListener(
        "mousemove",
        function (e) {
          mouse.tx = (e.clientX / vw) * 2 - 1;
          mouse.ty = (e.clientY / vh) * 2 - 1;
          kick();
        },
        { passive: true }
      );
    }
  });
})();
