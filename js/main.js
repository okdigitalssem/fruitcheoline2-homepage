/**
 * 과일철이네2 홈페이지 - 메인 스크립트
 * config/site-config.js 의 값을 화면에 채워 넣고,
 * 메뉴 토글 / 계절 탭 / 스크롤 애니메이션 / 버튼 링크 연결을 담당합니다.
 */
(function () {
  "use strict";

  var config = window.SITE_CONFIG || {};
  var IMG_DIR = "public/images/fruits/";

  // 점(.)으로 연결된 경로(예: "about.title")로 config 값 찾기
  function getConfigValue(path) {
    var parts = path.split(".");
    var value = config;
    for (var i = 0; i < parts.length; i++) {
      if (value == null) return "";
      value = value[parts[i]];
    }
    return value == null ? "" : value;
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // 줄바꿈(\n)을 <br />로 바꾼 안전한 HTML
  function nl2br(str) {
    return escapeHtml(str).replace(/\n/g, "<br />");
  }

  function imgSrc(file) {
    return IMG_DIR + encodeURIComponent(file || "");
  }

  // 사진이 없을 때 "사진 준비중" 표시로 바꿔주는 공통 처리
  window.__fruitImgError = function (imgEl) {
    var box = imgEl.closest(".photo");
    if (box) box.classList.add("is-error");
  };

  function photoHtml(file, alt, emoji, extraClass) {
    return (
      '<div class="photo ' + (extraClass || "") + '">' +
      '<img src="' + imgSrc(file) + '" alt="' + escapeHtml(alt) + '" loading="lazy" onerror="window.__fruitImgError(this)" />' +
      '<div class="photo-fallback"><span class="photo-emoji">' + escapeHtml(emoji || "🍎") + "</span>" +
      '<span class="photo-fallback-text">사진 준비중</span></div>' +
      "</div>"
    );
  }

  // ---------------------------------------------------------
  // 1. data-config / data-config-nl / data-config-img 자동 채우기
  // ---------------------------------------------------------
  function applyTextConfig() {
    document.querySelectorAll("[data-config]").forEach(function (el) {
      var val = getConfigValue(el.getAttribute("data-config"));
      if (val) el.textContent = val;
    });

    document.querySelectorAll("[data-config-nl]").forEach(function (el) {
      var val = getConfigValue(el.getAttribute("data-config-nl"));
      if (val) el.innerHTML = nl2br(val);
    });

    document.querySelectorAll("[data-config-img]").forEach(function (el) {
      var val = getConfigValue(el.getAttribute("data-config-img"));
      if (val) el.setAttribute("src", imgSrc(val));
    });
  }

  // ---------------------------------------------------------
  // 2. 히어로 아래 흐르는 과일 이름 띠
  // ---------------------------------------------------------
  function renderTicker() {
    var track = document.getElementById("ticker-track");
    var fruits = config.fruits || [];
    if (!track || !fruits.length) return;
    var once = fruits
      .map(function (f) {
        return "<span>" + escapeHtml(f.emoji || "") + " " + escapeHtml(f.name) + "</span>";
      })
      .join("");
    // 끊김 없이 흐르도록 두 번 이어 붙입니다
    track.innerHTML = once + once;
  }

  // ---------------------------------------------------------
  // 3. POINT 3가지
  // ---------------------------------------------------------
  function renderPoints() {
    var wrap = document.getElementById("points");
    var points = (config.about && config.about.points) || [];
    if (!wrap) return;
    wrap.innerHTML = points
      .map(function (p, i) {
        var num = i + 1 < 10 ? "0" + (i + 1) : String(i + 1);
        return (
          '<div class="point">' +
          '<div class="point-photo-wrap" data-3d="' + (i % 2 ? "swing-right" : "swing-left") + '">' +
          photoHtml(p.image, p.title, "🍎", "point-photo") +
          "</div>" +
          '<div class="point-text" data-3d="' + (i % 2 ? "swing-left" : "swing-right") + '">' +
          '<span class="pill">POINT ' + num + "</span>" +
          '<h3 class="point-title display">' + escapeHtml(p.title) + "</h3>" +
          '<p class="point-desc">' + nl2br(p.desc) + "</p>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  // ---------------------------------------------------------
  // 4. 과일 상품 카드 20종 + 계절 탭
  // ---------------------------------------------------------
  function renderFruits() {
    var wrap = document.getElementById("fruit-grid");
    var fruits = config.fruits || [];
    if (!wrap) return;

    wrap.innerHTML = fruits
      .map(function (fruit, i) {
        var alt = fruit.name + " - 과일철이네2 신선한 " + fruit.name;
        return (
          '<article class="fruit-card" id="fruit-card-' + i + '" data-3d="flip" data-i="' + i + '" data-season="' + escapeHtml(fruit.season || "") + '">' +
          photoHtml(fruit.file, alt, fruit.emoji, "fruit-photo") +
          (fruit.pick ? '<span class="fruit-pick">추천</span>' : "") +
          '<div class="fruit-info">' +
          (fruit.season ? '<span class="fruit-season">' + escapeHtml(fruit.season) + "</span>" : "") +
          '<h3 class="fruit-name">' + escapeHtml(fruit.name) + "</h3>" +
          '<p class="fruit-desc">' + escapeHtml(fruit.desc) + "</p>" +
          '<a href="#" class="fruit-ask btn-kakao">가격 문의 ›</a>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function setupSeasonTabs() {
    var tabsWrap = document.getElementById("season-tabs");
    var fruits = config.fruits || [];
    if (!tabsWrap) return;

    var order = ["여름", "가을", "겨울", "사계절"];
    var seasons = [];
    fruits.forEach(function (f) {
      if (f.season && seasons.indexOf(f.season) === -1) seasons.push(f.season);
    });
    seasons.sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    if (!seasons.length) {
      tabsWrap.hidden = true;
      return;
    }

    var tabs = ["전체"].concat(seasons);
    tabsWrap.innerHTML = tabs
      .map(function (s, i) {
        return (
          '<button type="button" class="season-tab' + (i === 0 ? " is-active" : "") + '" role="tab" aria-selected="' +
          (i === 0 ? "true" : "false") + '" data-season="' + escapeHtml(s) + '">' + escapeHtml(s) + "</button>"
        );
      })
      .join("");

    tabsWrap.addEventListener("click", function (e) {
      var btn = e.target.closest(".season-tab");
      if (!btn) return;
      var season = btn.getAttribute("data-season");
      tabsWrap.querySelectorAll(".season-tab").forEach(function (t) {
        var active = t === btn;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      document.querySelectorAll("#fruit-grid .fruit-card").forEach(function (card) {
        card.hidden = !(season === "전체" || card.getAttribute("data-season") === season);
      });
      // 3D 스크롤 효과가 카드 위치를 다시 재도록 알려줍니다
      if (window.__cinemaRefresh) window.__cinemaRefresh();
    });
  }

  // ---------------------------------------------------------
  // 5. 선물용 과일 카드
  // ---------------------------------------------------------
  function renderGiftCards() {
    var wrap = document.getElementById("gift-cards");
    var cards = (config.gift && config.gift.cards) || [];
    if (!wrap) return;
    wrap.innerHTML = cards
      .map(function (c, i) {
        return (
          '<div class="gift-card" data-3d="fan" data-i="' + i + '" data-n="' + cards.length + '">' +
          photoHtml(c.image, c.title, c.icon || "🎁", "gift-photo") +
          '<div class="gift-body">' +
          '<p class="gift-card-title">' + escapeHtml(c.title) + "</p>" +
          '<p class="gift-card-desc">' + escapeHtml(c.desc) + "</p>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  // ---------------------------------------------------------
  // 6. 추천 말풍선 / 혜택 쿠폰
  // ---------------------------------------------------------
  function renderBubbles() {
    var wrap = document.getElementById("bubbles");
    var items = (config.recommend && config.recommend.items) || [];
    if (!wrap) return;
    if (!items.length) {
      wrap.closest("section").hidden = true;
      return;
    }
    wrap.innerHTML = items
      .map(function (it, i) {
        return (
          '<div class="bubble" data-3d="' + (i % 2 ? "swing-right" : "swing-left") + '">' +
          '<p class="bubble-title">' + escapeHtml(it.title) + "</p>" +
          '<p class="bubble-desc">' + nl2br(it.desc) + "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderCoupons() {
    var wrap = document.getElementById("coupons");
    var items = (config.benefits && config.benefits.items) || [];
    if (!wrap) return;
    if (!items.length) {
      wrap.closest("section").hidden = true;
      return;
    }
    wrap.innerHTML = items
      .map(function (it, i) {
        return (
          '<div class="coupon" data-3d="card" data-i="' + i + '">' +
          '<span class="coupon-label">' + escapeHtml(it.label) + "</span>" +
          '<p class="coupon-big display">' + escapeHtml(it.big) + "</p>" +
          '<p class="coupon-desc">' + nl2br(it.desc) + "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  // ---------------------------------------------------------
  // 7. 배달 지역 / 방문 안내(주소, 전화번호)
  // ---------------------------------------------------------
  function renderMisc() {
    var areasEl = document.getElementById("delivery-areas");
    if (areasEl && config.delivery && config.delivery.areas) {
      areasEl.textContent = config.delivery.areas.join(" / ");
    }

    var addressEl = document.getElementById("visit-address");
    if (addressEl) {
      var address = config.contact && config.contact.address;
      addressEl.textContent = address ? address : "주소 준비중입니다. 카카오톡으로 문의해주세요.";
    }

    var phoneRow = document.getElementById("visit-phone-row");
    var phoneEl = document.getElementById("visit-phone");
    var phone = config.contact && config.contact.phone;
    if (phoneRow && phoneEl && phone) {
      phoneEl.textContent = phone;
      phoneEl.setAttribute("href", "tel:" + phone.replace(/[^0-9+]/g, ""));
      phoneRow.hidden = false;
    }

    var yearEl = document.getElementById("footer-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // ---------------------------------------------------------
  // 7-1. 엔딩 크레딧 (영화 끝에 올라가는 매장 정보)
  // ---------------------------------------------------------
  function renderCredits() {
    var list = document.getElementById("credits-list");
    if (!list) return;
    var f = config.finale || {};
    var c = config.contact || {};
    var h = config.hours || {};
    var d = config.delivery || {};
    var rows = (f.credits || []).slice();
    if (c.address) rows.push({ role: "주소", name: c.address });
    if (c.phone) rows.push({ role: "전화", name: c.phone });
    if (h.openTime) rows.push({ role: "영업시간", name: h.openTime });
    if (h.closedDay) rows.push({ role: "정기휴무", name: h.closedDay });
    if (d.time) rows.push({ role: "배달시간", name: d.time });
    if (d.areas && d.areas.length) rows.push({ role: "배달지역", name: d.areas.join(" · ") });
    if (d.minOrder) rows.push({ role: "최소주문", name: d.minOrder });
    list.innerHTML = rows
      .map(function (r) {
        return "<div><dt>" + escapeHtml(r.role) + "</dt><dd>" + escapeHtml(r.name) + "</dd></div>";
      })
      .join("");

    var tel = document.getElementById("the-end-tel");
    if (tel && c.phone) {
      tel.setAttribute("href", "tel:" + c.phone.replace(/[^0-9+]/g, ""));
      tel.hidden = false;
    }
  }

  // ---------------------------------------------------------
  // 8. 카카오 / 네이버 버튼 링크 연결
  // ---------------------------------------------------------
  function wireExternalButtons() {
    var kakaoUrl = (config.contact && config.contact.kakaoChannelUrl) || "";
    var naverUrl = (config.contact && config.contact.naverPlaceUrl) || "";
    var address = (config.contact && config.contact.address) || "";
    // 네이버플레이스 주소가 없으면 매장 주소로 네이버 지도 검색을 열어 위치를 보여줍니다
    if (!naverUrl && address) {
      // 층수(예: ", 1층")는 지도 검색이 잘 안 되므로 빼고 도로명 주소만 검색합니다
      var mapQuery = address.replace(/[,\s]*(지하\s*)?\d+\s*층.*$/, "").trim();
      naverUrl = "https://map.naver.com/p/search/" + encodeURIComponent(mapQuery);
    }

    function wire(selector, url, notReadyMessage) {
      document.querySelectorAll(selector).forEach(function (btn) {
        if (url) {
          btn.setAttribute("href", url);
          btn.setAttribute("target", "_blank");
          btn.setAttribute("rel", "noopener noreferrer");
        } else {
          btn.addEventListener("click", function (e) {
            e.preventDefault();
            window.alert(notReadyMessage);
          });
        }
      });
    }

    wire(
      ".btn-kakao",
      kakaoUrl,
      "카카오톡 상담 주소가 아직 등록되지 않았습니다.\nconfig/site-config.js 파일의 kakaoChannelUrl 항목을 채워주세요."
    );
    wire(
      ".btn-naver",
      naverUrl,
      "매장 위치가 아직 등록되지 않았습니다.\nconfig/site-config.js 파일의 address(주소) 항목을 채워주세요."
    );
  }

  // ---------------------------------------------------------
  // 9. 모바일 메뉴 토글 / 스크롤 시 헤더 그림자
  // ---------------------------------------------------------
  function setupHeader() {
    var header = document.getElementById("site-header");
    var toggle = document.getElementById("menu-toggle");
    var nav = document.getElementById("main-nav");

    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-scrolled", window.scrollY > 10);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    if (!toggle || !nav) return;

    function closeMenu() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }

  // ---------------------------------------------------------
  // 10. 스크롤 시 섹션 등장 애니메이션
  // ---------------------------------------------------------
  function setupRevealAnimation() {
    var targets = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || targets.length === 0) {
      targets.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ---------------------------------------------------------
  // 15초 홍보 영상: 화면에 보이면 소리 없이 자동 재생, 벗어나면 멈춤
  // ---------------------------------------------------------
  function setupTrailer() {
    var video = document.getElementById("trailer-video");
    var soundBtn = document.getElementById("trailer-sound");
    if (!video) return;

    function syncSoundBtn() {
      if (!soundBtn) return;
      soundBtn.textContent = video.muted ? "🔇 소리 켜기" : "🔊 소리 끄기";
      soundBtn.setAttribute("aria-pressed", video.muted ? "false" : "true");
    }

    if (soundBtn) {
      soundBtn.addEventListener("click", function () {
        video.muted = !video.muted;
        if (!video.muted) {
          video.currentTime = 0; // 소리를 켜면 처음부터 들려줍니다
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        }
        syncSoundBtn();
      });
    }
    video.addEventListener("volumechange", syncSoundBtn);

    // "동작 줄이기" 설정 기기나 오래된 브라우저에서는 자동 재생하지 않습니다 (재생 버튼으로 보기)
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var p = video.play();
            if (p && p.catch) p.catch(function () {});
          } else if (!video.paused) {
            video.pause();
          }
        });
      },
      { threshold: 0.45 }
    );
    observer.observe(video);
  }

  // ---------------------------------------------------------
  // 초기 실행
  // ---------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    applyTextConfig();
    renderTicker();
    renderPoints();
    renderFruits();
    setupSeasonTabs();
    renderGiftCards();
    renderBubbles();
    renderCoupons();
    renderMisc();
    renderCredits();
    wireExternalButtons();
    setupHeader();
    setupRevealAnimation();
    setupTrailer();
  });
})();
