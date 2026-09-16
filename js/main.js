/**
 * 과일철이네2 홈페이지 - 메인 스크립트
 * config/site-config.js 의 값을 화면에 채워 넣고,
 * 메뉴 토글 / 스크롤 애니메이션 / 버튼 링크 연결을 담당합니다.
 */
(function () {
  "use strict";

  var config = window.SITE_CONFIG || {};

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
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ---------------------------------------------------------
  // 1. data-config / data-config-nl 텍스트 자동 채우기
  // ---------------------------------------------------------
  function applyTextConfig() {
    document.querySelectorAll("[data-config]").forEach(function (el) {
      var val = getConfigValue(el.getAttribute("data-config"));
      if (val) el.textContent = val;
    });

    document.querySelectorAll("[data-config-nl]").forEach(function (el) {
      var val = getConfigValue(el.getAttribute("data-config-nl"));
      if (val) {
        el.innerHTML = escapeHtml(val).replace(/\n/g, "<br />");
      }
    });
  }

  // ---------------------------------------------------------
  // 2. 매장 소개 특징 카드
  // ---------------------------------------------------------
  function renderFeatures() {
    var wrap = document.getElementById("about-features");
    var features = (config.about && config.about.features) || [];
    if (!wrap) return;
    wrap.innerHTML = features
      .map(function (f) {
        return (
          '<div class="feature-card">' +
          '<span class="feature-icon">' + escapeHtml(f.icon) + "</span>" +
          '<p class="feature-text">' + escapeHtml(f.text) + "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  // ---------------------------------------------------------
  // 3. 과일 상품 카드 20종
  // ---------------------------------------------------------
  function renderFruits() {
    var wrap = document.getElementById("fruit-grid");
    var fruits = config.fruits || [];
    if (!wrap) return;

    wrap.innerHTML = fruits
      .map(function (fruit) {
        var imgPath = "public/images/fruits/" + fruit.file;
        var alt = fruit.name + " - 과일철이네2 신선한 " + fruit.name;
        return (
          '<div class="fruit-card">' +
          '<div class="fruit-photo">' +
          '<img src="' + imgPath + '" alt="' + escapeHtml(alt) + '" loading="lazy" onerror="window.__fruitImgError(this)" />' +
          '<div class="fruit-photo-fallback">' +
          '<span class="fruit-emoji">' + escapeHtml(fruit.emoji || "🍉") + "</span>" +
          '<span class="fruit-fallback-text">사진 준비중</span>' +
          "</div>" +
          "</div>" +
          '<div class="fruit-info">' +
          '<h3 class="fruit-name">' + escapeHtml(fruit.name) + "</h3>" +
          '<p class="fruit-desc">' + escapeHtml(fruit.desc) + "</p>" +
          '<span class="fruit-price-placeholder">가격 문의</span>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  // 이미지 로드 실패 시 예쁜 placeholder로 교체
  window.__fruitImgError = function (imgEl) {
    var photoBox = imgEl.closest(".fruit-photo");
    if (photoBox) photoBox.classList.add("is-error");
  };

  // ---------------------------------------------------------
  // 4. 선물용 과일 카드
  // ---------------------------------------------------------
  function renderGiftCards() {
    var wrap = document.getElementById("gift-cards");
    var cards = (config.gift && config.gift.cards) || [];
    if (!wrap) return;
    wrap.innerHTML = cards
      .map(function (c) {
        return (
          '<div class="gift-card">' +
          '<span class="gift-icon">' + escapeHtml(c.icon) + "</span>" +
          '<p class="gift-card-title">' + escapeHtml(c.title) + "</p>" +
          '<p class="gift-card-desc">' + escapeHtml(c.desc) + "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  // ---------------------------------------------------------
  // 5. 배달 지역 / 방문 안내(주소, 전화번호)
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
      phoneRow.hidden = false;
    }

    var yearEl = document.getElementById("footer-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // ---------------------------------------------------------
  // 6. 카카오 / 네이버 버튼 링크 연결
  // ---------------------------------------------------------
  function wireExternalButtons() {
    var kakaoUrl = (config.contact && config.contact.kakaoChannelUrl) || "";
    var naverUrl = (config.contact && config.contact.naverPlaceUrl) || "";

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
      "네이버플레이스 주소가 아직 등록되지 않았습니다.\nconfig/site-config.js 파일의 naverPlaceUrl 항목을 채워주세요."
    );
  }

  // ---------------------------------------------------------
  // 7. 모바일 메뉴 토글
  // ---------------------------------------------------------
  function setupMobileMenu() {
    var toggle = document.getElementById("menu-toggle");
    var nav = document.getElementById("main-nav");
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
  // 8. 스크롤 시 섹션 등장 애니메이션
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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ---------------------------------------------------------
  // 초기 실행
  // ---------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    applyTextConfig();
    renderFeatures();
    renderFruits();
    renderGiftCards();
    renderMisc();
    wireExternalButtons();
    setupMobileMenu();
    setupRevealAnimation();
  });
})();
