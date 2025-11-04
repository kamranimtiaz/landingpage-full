const swiperAnimationConfig = {
  speed: 700,
  on: {
    init: function () {
      this.slides.forEach((slide) => {
        slide.style.transitionTimingFunction =
          "cubic-bezier(0.34, 1.8, 0.64, 1)";
      });
    },
  },
};
console.log("Experience Loaded")
/**
 * Einfaches i18n: Plurale und Texte je nach Sprache
 * - Sprache wird aus <html lang> oder optional body[data-locale] gelesen
 * - Pluralformen via Intl.PluralRules
 */
const Locale = (() => {
  function getLocale() {
    const htmlLang = (
      document.documentElement.getAttribute("lang") || ""
    ).toLowerCase();
    if (htmlLang) return htmlLang.split("-")[0];
    const bodyLocale =
      (document.body && document.body.getAttribute("data-locale")) || "";
    if (bodyLocale) return bodyLocale.toLowerCase().split("-")[0];
    const navLang = (navigator.language || "de").toLowerCase();
    return navLang.split("-")[0];
  }
  return { get: getLocale };
})();

const TRANSLATIONS = {
  de: {
    selectDates: "Datum auswählen",
    adults: { one: "{n} Erwachsener", other: "{n} Erwachsene" },
    children: { one: "{n} Kind", other: "{n} Kinder" },
    nights: { one: "{n} Übernachtung", other: "{n} Übernachtungen" },
    nightsSuffix: " — klingt nach einer guten Auszeit!",
  },
  en: {
    selectDates: "Select dates",
    adults: { one: "{n} adult", other: "{n} adults" },
    children: { one: "{n} child", other: "{n} children" },
    nights: { one: "{n} night", other: "{n} nights" },
    nightsSuffix: " — sounds like a great getaway!",
  },
  it: {
    selectDates: "Seleziona le date",
    adults: { one: "{n} adulto", other: "{n} adulti" },
    children: { one: "{n} bambino", other: "{n} bambini" },
    nights: { one: "{n} notte", other: "{n} notti" },
    nightsSuffix: " — sembra una bella pausa!",
  },
  fr: {
    selectDates: "Sélectionner les dates",
    adults: { one: "{n} adulte", other: "{n} adultes" },
    children: { one: "{n} enfant", other: "{n} enfants" },
    nights: { one: "{n} nuit", other: "{n} nuits" },
    nightsSuffix: " — ça ressemble à une belle escapade !",
  },
};

const pluralRulesCache = new Map();

function t(key) {
  const locale = Locale.get();
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.de;
  return dict[key] || TRANSLATIONS.de[key] || "";
}

function tCount(nounKey, count) {
  const locale = Locale.get();
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.de;
  const forms = dict[nounKey] || TRANSLATIONS.de[nounKey];
  let pr = pluralRulesCache.get(locale);
  if (!pr) {
    try {
      pr = new Intl.PluralRules(locale);
    } catch (e) {
      pr = new Intl.PluralRules("en");
    }
    pluralRulesCache.set(locale, pr);
  }
  let cat;
  try {
    cat = pr.select(count);
  } catch {
    cat = count === 1 ? "one" : "other";
  }
  const template = forms[cat] || forms.other;
  return template.replace("{n}", String(count));
}

function personsSummary(adults, children) {
  const adultsText = tCount("adults", adults);
  
  // Only include children text if there are children (handle null/undefined/negative)
  if (children && children > 0) {
    const childrenText = tCount("children", children);
    return adultsText + ", " + childrenText;
  }
  
  // Return only adults text when no children
  return adultsText;
}

// Alternative version with more explicit logic:
function personsSummaryDetailed(adults, children) {
  const parts = [];
  
  // Always include adults
  parts.push(tCount("adults", adults));
  
  // Only include children if count > 0
  if (children && children > 0) {
    parts.push(tCount("children", children));
  }
  
  return parts.join(", ");
}

// Flatpickr Locale-Hilfen
function ensureFlatpickrLocales() {
  if (!window.flatpickr || !window.flatpickr.l10ns) return;
  const l = window.flatpickr.l10ns;
  // Französisch (falls nicht geladen)
  if (!l.fr) {
    l.fr = {
      firstDayOfWeek: 1,
      weekdays: {
        shorthand: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
        longhand: [
          "Dimanche",
          "Lundi",
          "Mardi",
          "Mercredi",
          "Jeudi",
          "Vendredi",
          "Samedi",
        ],
      },
      months: {
        shorthand: [
          "Janv",
          "Févr",
          "Mars",
          "Avr",
          "Mai",
          "Juin",
          "Juil",
          "Août",
          "Sept",
          "Oct",
          "Nov",
          "Déc",
        ],
        longhand: [
          "Janvier",
          "Février",
          "Mars",
          "Avril",
          "Mai",
          "Juin",
          "Juillet",
          "Août",
          "Septembre",
          "Octobre",
          "Novembre",
          "Décembre",
        ],
      },
      rangeSeparator: " au ",
      weekAbbreviation: "Sem",
      scrollTitle: "Défiler pour augmenter",
      toggleTitle: "Cliquer pour basculer",
    };
  }
  // Italienisch (falls nicht geladen)
  if (!l.it) {
    l.it = {
      firstDayOfWeek: 1,
      weekdays: {
        shorthand: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
        longhand: [
          "Domenica",
          "Lunedì",
          "Martedì",
          "Mercoledì",
          "Giovedì",
          "Venerdì",
          "Sabato",
        ],
      },
      months: {
        shorthand: [
          "Gen",
          "Feb",
          "Mar",
          "Apr",
          "Mag",
          "Giu",
          "Lug",
          "Ago",
          "Set",
          "Ott",
          "Nov",
          "Dic",
        ],
        longhand: [
          "Gennaio",
          "Febbraio",
          "Marzo",
          "Aprile",
          "Maggio",
          "Giugno",
          "Luglio",
          "Agosto",
          "Settembre",
          "Ottobre",
          "Novembre",
          "Dicembre",
        ],
      },
      rangeSeparator: " al ",
      weekAbbreviation: "Sett",
      scrollTitle: "Scorri per aumentare",
      toggleTitle: "Clicca per alternare",
    };
  }
}

function resolveFlatpickrLocale() {
  const lang = Locale.get();
  if (!window.flatpickr || !window.flatpickr.l10ns) return lang;
  ensureFlatpickrLocales();
  const l = window.flatpickr.l10ns;
  if (l[lang]) return l[lang];
  if (lang.startsWith("de")) return l.de || "de";
  if (lang.startsWith("fr")) return l.fr || "fr";
  if (lang.startsWith("it")) return l.it || "it";
  return l.default;
}

function createTopicSlug(topicName) {
  if (!topicName) return "";

  return (
    topicName
      .toLowerCase()
      .trim()
      // Handle specific replacements first
      .replace(/ & /g, "-")
      .replace(/\(/g, "") // Remove opening parentheses
      .replace(/\)/g, "") // Remove closing parentheses
      .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and dashes
      .replace(/\s+/g, "-") // Replace spaces with dashes
      .replace(/-+/g, "-") // Replace multiple dashes with single dash
      .replace(/^-|-$/g, "")
  ); // Remove leading/trailing dashes
}

class GalleryDataParser {
  constructor() {
    this.cachedData = null;
  }

  parse() {
    if (this.cachedData) return this.cachedData;

    const result = [];
    const dataSource = document.querySelector(".data-source");

    // Guard: Return empty array if data source doesn't exist
    if (!dataSource) {
      console.warn("GalleryDataParser: .data-source element not found on this page");
      return (this.cachedData = result);
    }

    const topicItems = dataSource.querySelectorAll("[data-topic-name]");

    topicItems.forEach((item) => {
      const topic = {
        topicname: createTopicSlug(item.getAttribute("data-topic-name")),
        galleryname: createTopicSlug(item.getAttribute("data-gallery-name")),
        images: {},
        heroImages: {},
        quoteImages: {},
      };

      // Grab Heading and Summary for each topic
      const headingEl = item.querySelector("[data-source-heading]");
      const summaryEl = item.querySelector("[data-source-summary]");
      const heroTitleEl = item.querySelector("[data-source-header-title]");

      if (headingEl) {
        topic.heading = headingEl.getAttribute("data-source-heading");
      }

      if (summaryEl) {
        topic.summary = summaryEl.getAttribute("data-source-summary");
      }

      if (heroTitleEl) {
        topic.headerTitle = heroTitleEl.getAttribute(
          "data-source-header-title"
        );
      }

      // Parse gallery images (existing functionality)
      item.querySelectorAll(".images-gallery").forEach((gallery) => {
        const season = gallery.getAttribute("data-season");
        topic.images[season] = Array.from(
          gallery.querySelectorAll("[data-img-url]")
        ).map((img) => img.getAttribute("data-img-url"));
      });

      // Parse hero images for different seasons
      const heroSummer = item.querySelector("[data-hero-summer-img]");
      const heroWinter = item.querySelector("[data-hero-winter-img]");

      if (heroSummer) {
        topic.heroImages.summer = heroSummer.getAttribute(
          "data-hero-summer-img"
        );
      }
      if (heroWinter) {
        topic.heroImages.winter = heroWinter.getAttribute(
          "data-hero-winter-img"
        );
      }

      // Parse quote images for different seasons
      const quoteSummer = item.querySelector("[data-quote-summer-img]");
      const quoteWinter = item.querySelector("[data-quote-winter-img]");

      if (quoteSummer) {
        topic.quoteImages.summer = quoteSummer.getAttribute(
          "data-quote-summer-img"
        );
      }
      if (quoteWinter) {
        topic.quoteImages.winter = quoteWinter.getAttribute(
          "data-quote-winter-img"
        );
      }

      result.push(topic);
    });

    console.log("Parsed topic data with headings and summaries:", result);
    return (this.cachedData = result);
  }

  getSeasonImages(topicName, season) {
    const data = this.parse();
    const topic = data.find((t) => t.topicname === topicName);
    return topic ? topic.images[season] || [] : [];
  }

  getHeroImage(topicName, season) {
    const data = this.parse();
    const topic = data.find((t) => t.topicname === topicName);
    return topic ? topic.heroImages[season] || null : null;
  }

  getQuoteImage(topicName, season) {
    const data = this.parse();
    const topic = data.find((t) => t.topicname === topicName);
    return topic ? topic.quoteImages[season] || null : null;
  }

  // Get all images for a topic and season
  getAllTopicImages(topicName, season) {
    const data = this.parse();
    const topic = data.find((t) => t.topicname === topicName);

    if (!topic) return null;

    return {
      galleryImages: topic.images[season] || [],
      heroImage: topic.heroImages[season] || null,
      quoteImage: topic.quoteImages[season] || null,
    };
  }
}

class HeroImageManager {
  constructor(galleryData, season = "summer") {
    this.data = galleryData;
    this.season = season;
    this.topicToImageMap = this.buildImageMap();
    this.heroImg = document.querySelector(".hero_img");
    this.currentTopic = null;
    this.hasLoadedInitialImage = false;
    this.imageCache = new Map();
    this.isTransitioning = false;

    this.init();
  }

  buildImageMap() {
    const imageMap = {};
    this.data.forEach((topic) => {
      const topicKey = topic.topicname.toLowerCase();
      const heroImage = topic.heroImages?.[this.season];
      if (heroImage) {
        imageMap[topicKey] = heroImage;
      }
    });
    return imageMap;
  }

  preloadImages() {
    Object.entries(this.topicToImageMap).forEach(([topic, imageUrl]) => {
      if (!this.imageCache.has(imageUrl)) {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          this.imageCache.set(imageUrl, img);
        };
        img.onerror = () => {
          console.warn(`Failed to preload hero image: ${imageUrl}`);
        };
      }
    });
  }

  updateSeason(newSeason, currentTopic = null) {
    this.season = newSeason;
    this.topicToImageMap = this.buildImageMap();
    this.preloadImages();

    if (!this.hasLoadedInitialImage) return;

    const topicToCheck = currentTopic || this.currentTopic;
    if (topicToCheck && this.topicToImageMap[topicToCheck.toLowerCase()]) {
      this.loadHeroImage(topicToCheck.toLowerCase(), true);
    }
  }

  init() {
    if (!this.heroImg) return;
    this.preloadImages();
    this.handleInitialTopic();
    this.setupTopicChangeListener();
  }

  handleInitialTopic() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramTopic = urlParams.get("topic");

    this.showHeroImage();

    setTimeout(() => {
      this.hasLoadedInitialImage = true;

      // If URL has topic parameter, click the corresponding topic button
      if (paramTopic) {
        this.clickTopicButton(paramTopic.toLowerCase());
      }
    }, 500); // Longer delay to ensure topic buttons are rendered
  }

  clickTopicButton(topicSlug) {
    // Find the topic button with matching data-topic attribute
    const topicButton = document.querySelector(`[data-topic="${topicSlug}"]`);

    if (topicButton) {
      console.log(`🎯 Clicking topic button for: ${topicSlug}`);
      topicButton.click();
    } else {
      console.warn(`⚠️ Topic button not found for: ${topicSlug}`);
      // Debug: Show available buttons
      const allButtons = document.querySelectorAll("[data-topic]");
      console.log(
        "Available topic buttons:",
        Array.from(allButtons).map((btn) => btn.getAttribute("data-topic"))
      );
    }
  }

  setupTopicChangeListener() {
    document.addEventListener("topicChange", (e) => {
      const selectedTopic = e.detail.topic.toLowerCase();
      this.currentTopic = selectedTopic;

      if (this.hasLoadedInitialImage && this.topicToImageMap[selectedTopic]) {
        this.loadHeroImage(selectedTopic, true);
      }
    });
  }

  loadHeroImage(topicKey, animated = false) {
    if (this.isTransitioning) return;

    const imageUrl = this.topicToImageMap[topicKey];
    if (!imageUrl || !this.heroImg) return;

    this.isTransitioning = true;

    if (this.imageCache.has(imageUrl)) {
      this.performFadeTransition(imageUrl, animated);
    } else {
      const tempImg = new Image();
      tempImg.src = imageUrl;

      tempImg.onload = () => {
        this.imageCache.set(imageUrl, tempImg);
        this.performFadeTransition(imageUrl, animated);
      };

      tempImg.onerror = () => {
        console.warn(`Failed to load hero image for topic: ${topicKey}`);
        this.isTransitioning = false;
        this.showHeroImage();
      };
    }
  }

  performFadeTransition(imageUrl, animated) {
    if (!animated) {
      // No animation - just set image directly
      this.heroImg.removeAttribute("srcset");
      this.heroImg.removeAttribute("sizes");
      this.heroImg.src = imageUrl;
      this.heroImg.style.opacity = "1";
      this.isTransitioning = false;
      return;
    }

    // Step 1: Fade out
    this.heroImg.style.opacity = "0";

    // Step 2: Change image while invisible, then fade in with scale
    setTimeout(() => {
      // Remove scale class while invisible
      this.heroImg.classList.remove("scaleup");

      // Change image
      this.heroImg.removeAttribute("srcset");
      this.heroImg.removeAttribute("sizes");
      this.heroImg.src = imageUrl;

      // Force reflow to ensure class is removed
      void this.heroImg.offsetWidth;

      // Add scale class back for new image (forces restart)
      this.heroImg.classList.add("scaleup");

      // Fade back in
      this.heroImg.style.opacity = "1";

      this.isTransitioning = false;
    }, 200);
  }

  showHeroImage() {
    if (this.heroImg) {
      this.heroImg.style.visibility = "visible";
      if (!this.isTransitioning) {
        this.heroImg.style.opacity = "1";
      }
    }
  }

  getCurrentTopic() {
    return this.currentTopic;
  }
}

class TopicSwiperManager {
  constructor(data) {
    this.data = data;
    this.swiper = null;
    this.triggers = [];
    this.tabItems = [];
    this.currentTopic = null;
    this.init();
  }

  init() {
    this.setupElements();
    this.initializeSwiper();
    this.setupEventListeners();
    this.setupDefaultTopic();
  }

  setupElements() {
    this.triggers = document.querySelectorAll(".topic_button[data-topic]");
    this.tabItems = Array.from(this.triggers).map((trigger) =>
      trigger.closest(".swiper-slide")
    );
  }

  initializeSwiper() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }

    this.swiper = new Swiper(".swiper.is-topic", {
      slidesPerView: 2.5,
      spaceBetween: 0,
      rewind: true,
      navigation: {
        nextEl: ".topic_next-btn",
        prevEl: ".topic_prev-btn",
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      breakpoints: {
        389: { slidesPerView: 3.5 },
        480: { slidesPerView: 3 },
        768: { slidesPerView: 4 },
      },
      on: {
        init: () => this.correctSwiperARIARoles(),
        update: () => this.correctSwiperARIARoles(),
      },
    });

    // Delayed check in case Swiper overrides attributes after initialization
    setTimeout(() => this.correctSwiperARIARoles(), 1000);
  }

  correctSwiperARIARoles() {
    const topicWrapper = document.querySelector(".swiper-wrapper.is-topic");
    if (topicWrapper) {
      topicWrapper.setAttribute("role", "tablist");

      const topicSlides = topicWrapper.querySelectorAll(".swiper-slide");
      topicSlides.forEach((slide) => {
        slide.setAttribute("role", "tab");
        if (!slide.hasAttribute("aria-selected")) {
          slide.setAttribute("aria-selected", "false");
        }
      });

      const anySelected = Array.from(topicSlides).some(
        (slide) => slide.getAttribute("aria-selected") === "true"
      );
      if (!anySelected && topicSlides.length > 0) {
        topicSlides[0].setAttribute("aria-selected", "true");
      }
    }
  }

  setupEventListeners() {
    this.triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        this.handleTopicClick(trigger);
      });
    });
  }

  handleTopicClick(trigger) {
    // Reset visual feedback for all triggers
    this.triggers.forEach((btn) => {
      btn.classList.remove("is-active");
    });

    // Reset ARIA attributes on tab elements
    this.tabItems.forEach((tabItem) => {
      if (tabItem) {
        tabItem.setAttribute("aria-selected", "false");
      }
    });

    // Set visual feedback for active trigger
    trigger.classList.add("is-active");

    // Set ARIA attributes for parent tab element
    const parentTabItem = trigger.closest(".swiper-slide");
    if (parentTabItem) {
      parentTabItem.setAttribute("aria-selected", "true");
    }

    const topic = trigger.getAttribute("data-topic").toLowerCase();
    this.currentTopic = topic;

    // UPDATE URL PARAMETER
    this.updateURLParameter(topic);

    const evt = new CustomEvent("topicChange", {
      detail: { topic, manual: true },
    });
    document.dispatchEvent(evt);

    // Slide to active topic
    const index = Array.from(this.triggers).findIndex((btn) => btn === trigger);
    this.swiper.slideTo(index);
  }

  // Add this new method to TopicSwiperManager class
  updateURLParameter(topic) {
    const url = new URL(window.location);
    url.searchParams.set("topic", topic);

    // Update URL without page reload
    window.history.pushState({ topic }, "", url);

    console.log(`📍 Updated URL parameter: topic=${topic}`);
  }

  setupDefaultTopic() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTopic = urlParams.get("topic");
    let defaultTopic = urlTopic ? urlTopic.toLowerCase() : null;

    if (!defaultTopic && this.triggers.length > 0) {
      defaultTopic = this.triggers[0].getAttribute("data-topic").toLowerCase();
    }

    this.triggers.forEach((trigger, index) => {
      const triggerTopic = trigger.getAttribute("data-topic").toLowerCase();
      const isActive = triggerTopic === defaultTopic;

      if (isActive) {
        trigger.classList.add("is-active");
        this.currentTopic = defaultTopic;
      } else {
        trigger.classList.remove("is-active");
      }

      const parentTabItem = trigger.closest(".swiper-slide");
      if (parentTabItem) {
        parentTabItem.setAttribute(
          "aria-selected",
          isActive ? "true" : "false"
        );
      }

      if (isActive) {
        const evt = new CustomEvent("topicChange", {
          detail: { topic: defaultTopic, manual: false },
        });
        document.dispatchEvent(evt);

        setTimeout(() => {
          this.swiper.slideTo(index);
        }, 100);
      }
    });
  }

  destroy() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
  }

  getCurrentTopic() {
    return this.currentTopic;
  }
}

class GalleryTabsRenderer {
  constructor(jsonData) {
    this.data = jsonData;
    this.template = document
      .querySelector(".gallery_tabs-collection-item")
      ?.cloneNode(true);
    this.container = document.querySelector(
      ".gallery_tabs-collection-item"
    )?.parentElement;
  }

  renderTabs() {
    if (!this.template || !this.container) return;

    this.container.innerHTML = "";

    this.data.forEach((topic) => {
      const clone = this.template.cloneNode(true);

      const textElement = clone.querySelector("p");
      if (textElement) {
        textElement.textContent = topic.galleryname;

        // Use centralized slug function for consistency
        const topicSlug = createTopicSlug(topic.topicname);
        textElement.setAttribute("data-gallery-id", topicSlug);
        textElement.setAttribute("data-topic-target", topicSlug);
      }

      this.container.appendChild(clone);
    });
  }
}

class GalleryImageRenderer {
  constructor(jsonData, season = "summer") {
    this.data = jsonData;
    this.season = season;
    this.template = document
      .querySelector(".swiper-slide.is-gallery")
      ?.cloneNode(true);
    this.container = document.querySelector(
      ".swiper-slide.is-gallery"
    )?.parentElement;
  }

  renderImages() {
    if (!this.container || !this.template) return;

    this.container.innerHTML = "";

    this.data.forEach((topic) => {
      const images = topic.images?.[this.season] || [];
      images.forEach((srcUrl) => {
        const slideClone = this.template.cloneNode(true);
        const slideImg = slideClone?.querySelector("img");
        const topicSlug = createTopicSlug(topic.topicname);
        slideClone.setAttribute("data-gallery-id", topicSlug);
        slideClone.setAttribute("data-topic-target", topicSlug);

        if (slideImg) {
          slideImg.src = srcUrl;
          slideImg.alt = topic.galleryname || topic.topicname;
        }

        this.container.appendChild(slideClone);
      });
    });
  }

  updateSeason(newSeason) {
    this.season = newSeason;
    this.renderImages();
  }
}

class GallerySwiperManager {
  constructor(data, season = "summer") {
    this.data = data;
    this.season = season;
    this.swiper = null;
    this.triggerElements = [];
    this.tabItems = [];
    this.currentActiveTab = null;
    this.init();
  }

  init() {
    this.setupElements();
    this.initializeSwiper();
    this.setupEventListeners();
    this.updateActiveTab();
  }

  setupElements() {
    this.triggerElements = document.querySelectorAll(".gallery_tabs");
    this.tabItems = document.querySelectorAll(".gallery_tabs-collection-item");
  }

  initializeSwiper() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }

    this.swiper = new Swiper(".swiper.is-gallery", {
      ...swiperAnimationConfig,
      slidesPerView: 1.2,
      spaceBetween: 16,
      centeredSlides: false,
      initialSlide: 0,
      rewind: true,
      navigation: {
        nextEl: ".gallery_next-btn",
        prevEl: ".gallery_prev-btn",
      },
      keyboard: { enabled: true, onlyInViewport: true },
      breakpoints: {
        480: {
          slidesPerView: 2.2,
          spaceBetween: 16,
          centeredSlides: false,
          initialSlide: 0,
        },
        992: {
          slidesPerView: 2,
          spaceBetween: 32,
          centeredSlides: true,
          initialSlide: 1,
        },
      },
    });

    // Setup slide change listener
    this.swiper.on("slideChange", () => this.updateActiveTab());
  }

  normalizeTopicForComparison(topic) {
    return createTopicSlug(topic);
  }
  setupEventListeners() {
    this.triggerElements.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        this.handleTabClick(trigger);
      });
    });

    // Topic changes ALWAYS control gallery tabs
    document.addEventListener("topicChange", (e) => {
      this.handleTopicChange(e.detail.topic);
    });
  }

  handleTabClick(trigger) {
    const targetCategory = trigger.getAttribute("data-gallery-id");

    // Store current active tab
    this.currentActiveTab = targetCategory;

    this.navigateToTab(targetCategory);
    this.updateTabVisualState(targetCategory);
  }

  handleTopicChange(selectedTopic) {
    // Topic changes ALWAYS update gallery - no conditions
    const targetIndex = this.findSlideIndexByTopic(selectedTopic);
    if (targetIndex !== -1) {
      this.swiper.slideTo(targetIndex);
    }
    this.updateTabSelection(selectedTopic);

    // Update current active tab to match topic
    this.currentActiveTab = selectedTopic.toLowerCase();
  }

  // Get current gallery tab
  getCurrentActiveTab() {
    const activeTab = document.querySelector(".gallery_tabs.is-custom-current");
    if (activeTab) {
      return activeTab.getAttribute("data-gallery-id");
    }
    return this.currentActiveTab;
  }

  // Separate navigation logic
  navigateToTab(targetCategory) {
    const wrapper = document.querySelector(".swiper-wrapper.is-gallery");
    if (!wrapper) return;

    const allSlides = wrapper.querySelectorAll(".swiper-slide.is-gallery");
    let targetIndex = 0;

    allSlides.forEach((slide, idx) => {
      if (
        slide.getAttribute("data-gallery-id") === targetCategory &&
        targetIndex === 0
      ) {
        targetIndex = idx;
      }
    });

    this.swiper.slideTo(targetIndex);
  }

  // Separate visual state update logic
  updateTabVisualState(targetCategory) {
    // Reset all tabs
    this.triggerElements.forEach((trigger) => {
      trigger.classList.remove("is-custom-current");
    });

    this.tabItems.forEach((item) => {
      item.setAttribute("aria-selected", "false");
    });

    // Set active tab
    const activeTrigger = document.querySelector(
      `.gallery_tabs[data-gallery-id="${targetCategory}"]`
    );
    if (activeTrigger) {
      activeTrigger.classList.add("is-custom-current");

      const parentTabItem =
        activeTrigger.closest('[role="tab"]') ||
        activeTrigger.closest(".gallery_tabs-collection-item");

      if (parentTabItem) {
        parentTabItem.setAttribute("aria-selected", "true");
      }
    }
  }

  updateSeason(newSeason) {
    // Store current active tab BEFORE any changes
    const activeTabBeforeDestroy = this.getCurrentActiveTab();

    this.season = newSeason;

    // Re-initialize swiper without rendering
    // (rendering is handled by GalleryImageRenderer)
    this.destroy();
    this.init();

    // Restore the gallery tab state after recreation
    if (activeTabBeforeDestroy) {
      // Temporarily remove slideChange listener to prevent interference
      this.swiper.off("slideChange");

      // Restore state immediately
      this.currentActiveTab = activeTabBeforeDestroy;
      this.updateTabVisualState(activeTabBeforeDestroy);
      this.navigateToTab(activeTabBeforeDestroy);

      // Re-enable slideChange listener after restoration
      setTimeout(() => {
        this.swiper.on("slideChange", () => this.updateActiveTab());
      }, 50);
    }
  }

  findSlideIndexByTopic(selectedTopic) {
    if (!this.swiper || !this.swiper.slides) return 0;

    const normalizedSelectedTopic =
      this.normalizeTopicForComparison(selectedTopic);

    let targetIndex = 0;
    this.swiper.slides.forEach((slide, idx) => {
      const slideTopic =
        slide.getAttribute("data-topic-target") ||
        slide.getAttribute("data-gallery-id") ||
        "";
      const normalizedSlideTopic = this.normalizeTopicForComparison(slideTopic);

      if (
        normalizedSlideTopic === normalizedSelectedTopic &&
        targetIndex === 0
      ) {
        targetIndex = idx;
      }
    });
    return targetIndex;
  }

  updateTabSelection(selectedTopic) {
    const normalizedSelectedTopic =
      this.normalizeTopicForComparison(selectedTopic);

    this.triggerElements.forEach((tab) => {
      tab.classList.remove("is-custom-current");
      const tabTopic =
        tab.getAttribute("data-topic-target") ||
        tab.getAttribute("data-gallery-id") ||
        "";
      const normalizedTabTopic = this.normalizeTopicForComparison(tabTopic);

      if (normalizedTabTopic === normalizedSelectedTopic) {
        tab.classList.add("is-custom-current");
      }

      const parentTab = tab.closest('[role="tab"]');
      if (parentTab) {
        parentTab.setAttribute(
          "aria-selected",
          normalizedTabTopic === normalizedSelectedTopic ? "true" : "false"
        );
        tab.removeAttribute("aria-selected");
      } else {
        tab.setAttribute(
          "aria-selected",
          normalizedTabTopic === normalizedSelectedTopic ? "true" : "false"
        );
      }
    });
  }

  updateActiveTab() {
    // Add safety checks for swiper initialization
    if (
      !this.swiper ||
      !this.swiper.slides ||
      this.swiper.slides.length === 0
    ) {
      return;
    }

    const activeSlide = this.swiper.slides[this.swiper.activeIndex];
    if (!activeSlide) {
      return;
    }

    const activeCategory = activeSlide.getAttribute("data-gallery-id");
    if (!activeCategory) {
      return;
    }

    // Update current active tab
    this.currentActiveTab = activeCategory;

    // Use the centralized visual state update
    this.updateTabVisualState(activeCategory);
  }

  destroy() {
    if (this.swiper) {
      // Remove slideChange event listener before destroying to prevent unwanted events
      this.swiper.off("slideChange");
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
  }
}

class QuoteImageManager {
  constructor(galleryData, season = "summer") {
    this.data = galleryData;
    this.season = season;
    this.topicToImageMap = this.buildImageMap();
    this.quoteImg = null;
    this.currentTopic = null;
    this.init();
  }

  buildImageMap() {
    const imageMap = {};

    this.data.forEach((topic) => {
      const topicKey = topic.topicname.toLowerCase();
      const quoteImage = topic.quoteImages?.[this.season];

      if (quoteImage) {
        imageMap[topicKey] = quoteImage;
      }
    });

    return imageMap;
  }

  updateSeason(newSeason, currentTopic = null) {
    this.season = newSeason;
    this.topicToImageMap = this.buildImageMap();

    if (currentTopic && this.topicToImageMap[currentTopic.toLowerCase()]) {
      this.loadQuoteImage(currentTopic.toLowerCase());
    }
  }

  init() {
    this.findQuoteImageElement();
    if (!this.quoteImg) return;

    this.handleInitialTopic();
    this.setupTopicChangeListener();
  }

  findQuoteImageElement() {
    // First check if video element exists
    const quoteVideo = document.querySelector("[data-quote-video]");
    if (quoteVideo) {
      // Video is present, don't look for image element
      this.quoteImg = null;
      return;
    }

    // Video not found, look for image element
    this.quoteImg = document.querySelector("[data-quote-image]");
  }

  handleInitialTopic() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramTopic = urlParams.get("topic");

    if (paramTopic && this.topicToImageMap[paramTopic.toLowerCase()]) {
      this.currentTopic = paramTopic.toLowerCase();
      this.loadQuoteImage(this.currentTopic);
    } else {
      this.showQuoteImage();
    }
  }

  setupTopicChangeListener() {
    document.addEventListener("topicChange", (e) => {
      const selectedTopic = e.detail.topic.toLowerCase();
      this.currentTopic = selectedTopic;
      if (this.topicToImageMap[selectedTopic]) {
        this.loadQuoteImage(selectedTopic);
      }
    });
  }

  loadQuoteImage(topicKey) {
    const imageUrl = this.topicToImageMap[topicKey];
    if (!imageUrl || !this.quoteImg) return;

    const tempImg = new Image();
    tempImg.src = imageUrl;

    tempImg.onload = () => {
      this.quoteImg.removeAttribute("srcset");
      this.quoteImg.removeAttribute("sizes");
      this.quoteImg.src = imageUrl;

      this.showQuoteImage();
    };

    tempImg.onerror = () => {
      console.warn(`Failed to load quote image for topic: ${topicKey}`);
      this.showQuoteImage();
    };
  }

  showQuoteImage() {
    if (this.quoteImg) {
      this.quoteImg.style.visibility = "visible";
      this.quoteImg.style.opacity = "1";
    }
  }

  getCurrentTopic() {
    return this.currentTopic;
  }
}

class TopicRenderer {
  constructor(jsonData) {
    this.data = jsonData;
    this.template = document
      .querySelector("[data-topic-template]")
      .cloneNode(true);
    this.container = document.querySelector(
      "[data-topic-template]"
    ).parentElement;
  }

  renderTopics() {
    this.container.innerHTML = "";

    this.data.forEach((topic) => {
      const clone = this.template.cloneNode(true);
      const button = clone.querySelector("[data-topic]");
      const textElement = clone.querySelector("p");

      // Use centralized slug function
      const topicSlug = createTopicSlug(topic.topicname);
      button.setAttribute("data-topic", topicSlug);

      if (textElement) {
        textElement.textContent = topic.topicname;
      }

      this.container.append(clone);
    });
  }
}

class TopicContentRenderer {
  constructor(jsonData) {
    this.data = jsonData;
    this.headingElement = document.querySelector("[data-topic-heading]");
    this.summaryElement = document.querySelector("[data-topic-summary]");
    this.headerTitleElement = document.querySelector(
      "[data-topic-header-title]"
    );

    this.currentTopic = null;
    this.setupTopicChangeListener();
  }

  setupTopicChangeListener() {
    document.addEventListener("topicChange", (e) => {
      const selectedTopic = e.detail.topic.toLowerCase();
      this.updateContent(selectedTopic);
    });
  }

  updateContent(topicName) {
    const topicData = this.data.find((topic) => topic.topicname === topicName);

    if (topicData) {
      if (this.headingElement && topicData.heading) {
        this.headingElement.innerHTML = topicData.heading;
      }

      if (this.summaryElement && topicData.summary) {
        this.summaryElement.innerHTML = topicData.summary;
      }

      if (this.headerTitleElement && topicData.headerTitle) {
        this.headerTitleElement.innerHTML = topicData.headerTitle;
      }

      this.currentTopic = topicName;
      console.log(`Updated topic content for: ${topicName}`, topicData);
    }
  }
}

class SeasonSwitchManager {
  constructor(gallerySystem) {
    this.gallerySystem = gallerySystem;
    this.seasonSwitch = document.querySelector(".navbar_season-switch");
    this.init();
  }

  init() {
    if (!this.seasonSwitch) return;
    this.seasonSwitch.addEventListener(
      "click",
      this.handleSeasonSwitch.bind(this)
    );
  }

  handleSeasonSwitch(evt) {
    const el = evt.target.closest('[role="switch"]');
    if (!el) return;

    const isCurrentlySummer = el.getAttribute("aria-checked") === "true";
    const newSeason = isCurrentlySummer ? "winter" : "summer";

    el.setAttribute("aria-checked", isCurrentlySummer ? "false" : "true");

    this.gallerySystem.switchSeason(newSeason);
  }
}

class GallerySystem {
  constructor() {
    this.parser = new GalleryDataParser();
    this.data = this.parser.parse();
    console.log(this.data);
    this.currentSeason = "summer";
    this.currentTopic = null;

    this.heroImageManager = null;
    this.galleryImageRenderer = null;
    this.topicSwiperManager = null;
    this.gallerySwiperManager = null;
    this.quoteImageManager = null;

    this.init();
  }

  init() {
    this.renderStaticContent();
    this.initializeComponents();
    this.setupEventListeners();

    new SeasonSwitchManager(this);
  }

  renderStaticContent() {
    const topicRenderer = new TopicRenderer(this.data);
    topicRenderer.renderTopics();

    const tabsRenderer = new GalleryTabsRenderer(this.data);
    tabsRenderer.renderTabs();

    const topicContentRenderer = new TopicContentRenderer(this.data);
  }

  initializeComponents() {
    this.heroImageManager = new HeroImageManager(this.data, this.currentSeason);
    this.galleryImageRenderer = new GalleryImageRenderer(
      this.data,
      this.currentSeason
    );
    this.galleryImageRenderer.renderImages();
    this.quoteImageManager = new QuoteImageManager(
      this.data,
      this.currentSeason
    );

    // Initialize Swiper managers
    this.topicSwiperManager = new TopicSwiperManager(this.data);
    this.gallerySwiperManager = new GallerySwiperManager(
      this.data,
      this.currentSeason
    );
  }

  setupEventListeners() {
    document.addEventListener("topicChange", (e) => {
      this.currentTopic = e.detail.topic.toLowerCase();
    });
  }

  switchSeason(newSeason) {
    this.currentSeason = newSeason;

    const currentTopic = this.heroImageManager.getCurrentTopic();

    this.heroImageManager.updateSeason(newSeason, currentTopic);
    this.galleryImageRenderer.updateSeason(newSeason);
    this.quoteImageManager.updateSeason(newSeason, this.currentTopic);

    // Update gallery swiper manager - this handles the smooth transition internally
    if (this.gallerySwiperManager) {
      this.gallerySwiperManager.updateSeason(newSeason);
    }

    // No topicChange events during season switch
  }
}

/******************************************************************************
 * INITIALIZATION
 *****************************************************************************/

document.addEventListener("DOMContentLoaded", () => {
  new GallerySystem();

  /******************************************************************************
   * TOPIC BANNER ANIMATION
   *****************************************************************************/
  let topicBannerTl;
  document.addEventListener("topicChange", function (e) {
    if (!e.detail.manual) return;
    if (topicBannerTl) topicBannerTl.kill();
    const bannerEl = document.querySelector(".topic_banner");
    if (!bannerEl) return;
    const newTopic = e.detail.topic;
    const bannerText = document.getElementById("topic-banner-text");
    if (bannerText) {
      bannerText.textContent = newTopic;
    }
    topicBannerTl = gsap.timeline();
    topicBannerTl.set(bannerEl, {
      y: "-20vh",
      opacity: 0,
      filter: "blur(40px)",
      display: "block",
    });
    topicBannerTl.to(bannerEl, {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.4,
      ease: "power2.out",
    });
    topicBannerTl.to(bannerEl, { duration: 2 });
    topicBannerTl.to(bannerEl, {
      y: "-20vh",
      opacity: 0,
      filter: "blur(40px)",
      duration: 0.3,
      onComplete: function () {
        bannerEl.style.display = "none";
      },
    });
  });
});


/******************************************************************************
 * NAV SHOW/HIDE
 *****************************************************************************/

(function () {
  /**
   * Optimierte Throttle-Funktion für Scroll-Events
   * - Garantiert erste und letzte Ausführung
   * - Nutzt requestAnimationFrame für Browser-Optimierung
   *
   * @param {Function} fn Auszuführende Funktion
   * @param {Number} limit Zeit zwischen Aufrufen in ms
   * @return {Function} Throttled Funktion
   */
  function createThrottledFunction(fn, limit = 100) {
    let lastFunc;
    let lastRan;
    let ticking = false;

    return function () {
      const context = this;
      const args = arguments;

      // rAF für Browser-Optimierung
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
        });
      } else {
        return;
      }

      // Erste Ausführung sofort
      if (!lastRan) {
        fn.apply(context, args);
        lastRan = Date.now();
        return;
      }

      clearTimeout(lastFunc);

      const delta = Date.now() - lastRan;

      // Verzögerte oder sofortige Ausführung
      if (delta < limit) {
        lastFunc = setTimeout(() => {
          fn.apply(context, args);
          lastRan = Date.now();
        }, limit - delta);
      } else {
        fn.apply(context, args);
        lastRan = Date.now();
      }
    };
  }

  // Anfängliches Einblenden der Navbar-Komponente (die im CSS ausgeblendet ist)
  const navbarComponent = document.querySelector(".navbar_component");
  if (navbarComponent) {
    // Nach einem kurzen Delay einblenden (nach dem Hero-Heading)
    setTimeout(() => {
      // Transition hinzufügen, bevor Werte geändert werden
      navbarComponent.style.transition =
        "opacity 300ms ease-out, visibility 300ms ease-out";
      navbarComponent.style.visibility = "visible";
      navbarComponent.style.opacity = "1";
    }, 200); // Etwas verzögert nach der Hero-Animation
  }

  // Ursprüngliche Scroll-Funktionalität für das Ein-/Ausblenden der Nav-Elemente
  const navBg = document.querySelector(".navbar_bg-layer");
  const navMenu = document.querySelector(".navbar_menu");
  const hero = document.querySelector("#hero");

  // Logo-Elemente für Farbänderung
  const logoLink = document.querySelector(".navbar_logo-link");
  const logoElement = document.querySelector(".navbar_logo");
  const logoSvgs = logoLink ? Array.from(logoLink.querySelectorAll("svg")) : [];

  if (!navBg || !navMenu || !hero) return;

  // Farbvariable aus dem data-Attribut des Logo-Links auslesen
  const heroLogoColorAttr = logoLink
    ? logoLink.getAttribute("data-logo-color-at-hero")
    : null;
  let navVisible = false;
  let logoIsCustomColor = false;

  // Hilfsfunktionen für die Logo-Farbe
  function setLogoHeroColor() {
    if (!heroLogoColorAttr || logoIsCustomColor) return;

    // Wir ändern nur die Farbe der sichtbaren Elemente, nicht des Link-Wrappers
    // Die vollständige CSS-Variable aus dem Attribut verwenden
    if (logoElement) {
      logoElement.style.transition = "color 300ms ease-out"; // Gleiche Transitions wie die Navbar
      logoElement.style.color = heroLogoColorAttr; // Direkt den Wert verwenden
    }

    // Alle SVG-Icons im Link
    logoSvgs.forEach((svg) => {
      svg.style.transition = "color 300ms ease-out";
      svg.style.color = heroLogoColorAttr; // Direkt den Wert verwenden
    });

    logoIsCustomColor = true;
  }

  function resetLogoColor() {
    if (!logoIsCustomColor) return;

    if (logoElement) logoElement.style.color = "";
    logoSvgs.forEach((svg) => {
      svg.style.color = "";
    });

    logoIsCustomColor = false;
  }

  function showNav() {
    navBg.classList.add("is-active");
    navMenu.classList.add("is-active");
    resetLogoColor(); // Logo auf Standardfarbe zurücksetzen wenn Nav eingeblendet wird
  }

  function hideNav() {
    navBg.classList.remove("is-active");
    navMenu.classList.remove("is-active");
    setLogoHeroColor(); // Spezielle Hero-Farbe wenn Nav ausgeblendet ist
  }

  function checkNavVisibility() {
    const isMobile = window.innerWidth < 992;
    const threshold = window.innerHeight * (isMobile ? 0.4 : 0.8);
    const shouldShow = window.scrollY >= threshold;
    if (shouldShow !== navVisible) {
      if (shouldShow) {
        showNav();
      } else {
        hideNav();
      }
      navVisible = shouldShow;
    }
  }

  // Optimierte Scroll-Event-Registrierung mit Throttling (66ms ≈ 15fps)
  // Dies reduziert die CPU-Last erheblich, ohne wahrnehmbare Verzögerung zu verursachen
  const throttledCheckNavVisibility = createThrottledFunction(
    checkNavVisibility,
    66
  );
  window.addEventListener("scroll", throttledCheckNavVisibility, {
    passive: true,
  });

  // Initialisierung
  checkNavVisibility(); // Hier unthrottled für sofortige initiale Prüfung

  // Initiale Farbeinstellung für das Logo im Hero-Bereich
  if (!navVisible && heroLogoColorAttr) {
    setLogoHeroColor();
  }
})();

/******************************************************************************
 * POPUP-SKRIPT MIT ATTRIBUTEN
 *****************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  function openPopup(targetPopup) {
    if (!targetPopup) return;

    const previouslyFocused = document.activeElement;
    targetPopup.setAttribute(
      "data-previous-focus",
      previouslyFocused
        ? previouslyFocused.id || "document.body"
        : "document.body"
    );

    targetPopup.setAttribute("aria-hidden", "false");
    targetPopup.setAttribute("aria-modal", "true");

    targetPopup.removeAttribute("inert");

    document.body.classList.add("scroll-disable");

    targetPopup.classList.remove("hide");

    targetPopup.style.opacity = "0";
    targetPopup.style.transition = "opacity 300ms ease-in-out";

    requestAnimationFrame(() => {
      targetPopup.style.opacity = "1";

      setTimeout(() => {
        const closeButton = targetPopup.querySelector(
          '[data-close-popup="true"] button'
        );
        if (closeButton) {
          closeButton.focus();
        } else {
          const focusableElements = targetPopup.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 100);
    });
  }

  function closePopup(targetPopup) {
    if (!targetPopup) return;

    const focusedElement = document.activeElement;
    if (focusedElement && targetPopup.contains(focusedElement)) {
      focusedElement.blur();
    }

    targetPopup.setAttribute("aria-hidden", "true");
    targetPopup.removeAttribute("aria-modal");

    targetPopup.setAttribute("inert", "");

    document.body.classList.remove("scroll-disable");

    targetPopup.style.opacity = "0";
    targetPopup.addEventListener(
      "transitionend",
      () => {
        targetPopup.classList.add("hide");

        setTimeout(() => {
          const previousFocusId = targetPopup.getAttribute(
            "data-previous-focus"
          );
          if (previousFocusId) {
            if (previousFocusId === "document.body") {
              document.body.focus();
            } else {
              const previousElement = document.getElementById(previousFocusId);
              if (previousElement) {
                previousElement.focus();
              }
            }
          }
        }, 10);
      },
      { once: true }
    );
  }

  function bindPopupTriggers() {
    const triggers = document.querySelectorAll("[data-open-popup]");
    triggers.forEach((trigger) => {
      const clone = trigger.cloneNode(true);
      trigger.replaceWith(clone);
    });

    const freshTriggers = document.querySelectorAll("[data-open-popup]");
    freshTriggers.forEach((trigger) => {
      trigger.addEventListener("click", function (event) {
        // Ignoriere diesen Klick, wenn es über ein Delete-Element kommt
        if (
          event.target.closest("[data-room-delete]") ||
          event.target.closest("[data-offer-delete]")
        ) {
          return;
        }

        const popupName = this.getAttribute("data-open-popup");
        const targetPopup = document.querySelector(
          `[data-popup="${popupName}"]`
        );
        if (targetPopup) {
          event.preventDefault();
          openPopup(targetPopup);
        }
      });
    });
  }

  bindPopupTriggers();

  if (window.fsAttributes) {
    window.fsAttributes.push([
      "cmsnest",
      () => {
        bindPopupTriggers();
      },
    ]);
  }

  document.querySelectorAll("[data-close-popup='true']").forEach((closer) => {
    closer.addEventListener("click", function (e) {
      const targetPopup = this.closest("[data-popup]");
      if (targetPopup) {
        closePopup(targetPopup);
      }
    });
  });

  document.addEventListener(
    "click",
    function (e) {
      const linkElement = e.target.closest('a[href^="#"]');
      if (linkElement && linkElement.closest('[data-close-popup="true"]')) {
        const targetPopup = linkElement.closest("[data-popup]");
        if (targetPopup) {
          closePopup(targetPopup);
          const href = linkElement.getAttribute("href");
          setTimeout(() => {
            const targetElement = document.querySelector(href);
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: "smooth" });
            }
          }, 310);
          e.preventDefault();
        }
      }
    },
    true
  );

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      const activePopup = document.querySelector('[aria-modal="true"]');
      if (activePopup) {
        closePopup(activePopup);
      }
    }
  });
});

/******************************************************************************
 * SWIPER GÄSTESTIMMEN
 *****************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  const swiper = new Swiper(".swiper.is-reviews", {
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
    autoHeight: true,
    slidesPerView: 1,
    spaceBetween: 32,
    rewind: true,
    navigation: {
      nextEl: ".reviews_next-btn",
      prevEl: ".reviews_prev-btn",
    },
    pagination: {
      el: ".reviews_bullets-wrapper",
      clickable: true,
      bulletClass: "reviews_bullet",
      bulletActiveClass: "is-current",
    },
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    breakpoints: {
      992: {
        slidesPerView: 1,
        spaceBetween: 32,
      },
    },
  });
});

/******************************************************************************
 * ROOMS FILTER & SWIPER
 *****************************************************************************/

document.addEventListener("DOMContentLoaded", () => {
  console.log("🏠 ROOMS SECTION: Starting filter initialization...");

  const roomsSection = document.querySelector(".section_rooms");
  console.log("🏠 ROOMS SECTION: Found section?", !!roomsSection);

  if (!roomsSection) {
    console.log("❌ ROOMS SECTION: .section_rooms not found in DOM - exiting");
    return;
  }

  // Get filter buttons
  const filterButtons = roomsSection.querySelectorAll("[data-filter-name]");
  console.log("🏠 ROOMS SECTION: Found filter buttons:", filterButtons.length);

  // Get all room slides
  const allSlides = roomsSection.querySelectorAll(".swiper-slide.is-rooms");
  console.log("🏠 ROOMS SECTION: Found room slides:", allSlides.length);

  // Get swiper container
  const swiperContainer = roomsSection.querySelector(".swiper.is-rooms");
  console.log("🏠 ROOMS SECTION: Found swiper container?", !!swiperContainer);

  // Get the tab pane container (legacy from old tab system)
  const tabPaneContainer = roomsSection.querySelector(".rooms_tab-pane");
  console.log("🏠 ROOMS SECTION: Found tab pane container?", !!tabPaneContainer);

  // Make sure the tab pane is visible (override old tab system)
  if (tabPaneContainer) {
    console.log("🏠 ROOMS SECTION: Ensuring tab pane is visible (removing aria-hidden)");
    tabPaneContainer.classList.remove("hide");
    tabPaneContainer.removeAttribute("aria-hidden");
    tabPaneContainer.style.display = "";
  }

  let currentSwiper = null;
  let currentFilter = "all"; // Track current filter

  // Hide section if no slides exist
  if (allSlides.length === 0) {
    console.log("❌ ROOMS SECTION: NO room slides found - HIDING entire section");
    roomsSection.style.display = "none";
    return;
  }

  // Get pagination element (outside swiper container to prevent it from being moved)
  const paginationEl = roomsSection.querySelector(".rooms_bullets-wrapper");

  // Initialize Swiper
  function initSwiper() {
    console.log("🔄 ROOMS SECTION: Initializing Swiper...");

    if (currentSwiper) {
      console.log("🔄 ROOMS SECTION: Destroying existing Swiper instance");
      // Use destroy(false, true) to keep instance but clean up
      // This prevents pagination from being removed from DOM
      currentSwiper.destroy(false, true);
      currentSwiper = null;
    }

    if (!swiperContainer) {
      console.log("❌ ROOMS SECTION: No swiper container found");
      return;
    }

    // Clear any existing pagination bullets before reinit
    if (paginationEl) {
      paginationEl.innerHTML = '';
    }

    currentSwiper = new Swiper(swiperContainer, {
      ...swiperAnimationConfig,
      autoHeight: false,
      slidesPerView: 1.2,
      spaceBetween: 16,
      rewind: false,
      // Critical for filtering - watch slides and skip hidden ones
      watchSlidesProgress: true,
      watchSlidesVisibility: true,
      // Only count visible slides
      visibilityFullFit: false,
      navigation: {
        nextEl: ".rooms_next-btn",
        prevEl: ".rooms_prev-btn",
      },
      pagination: {
        el: ".rooms_bullets-wrapper",
        clickable: true,
        bulletClass: "rooms_bullet",
        bulletActiveClass: "is-current",
        renderBullet: function (index, className) {
          return '<span class="' + className + '" tabindex="0" role="button" aria-label="Go to slide ' + (index + 1) + '"></span>';
        },
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      breakpoints: {
        790: {
          slidesPerView: 2,
          spaceBetween: 32,
        },
        1150: {
          slidesPerView: 3,
          spaceBetween: 32,
        },
        1440: {
          slidesPerView: 3,
          spaceBetween: 48,
        },
      },
      // Event to log what Swiper sees
      on: {
        init: function() {
          console.log(`🔍 ROOMS SWIPER: Initialized with ${this.slides.length} total slides`);
          const visibleSlides = Array.from(this.slides).filter(slide =>
            slide.style.display !== 'none' && !slide.classList.contains('swiper-slide-hidden')
          );
          console.log(`🔍 ROOMS SWIPER: ${visibleSlides.length} visible slides detected`);
        },
      },
    });

    console.log("✅ ROOMS SECTION: Swiper initialized successfully");
  }

  // Store original parent and position for each slide
  const slideParent = allSlides.length > 0 ? allSlides[0].parentElement : null;
  const slideDataMap = new Map(); // Store slides and their original order

  // Store all slides with their original index
  allSlides.forEach((slide, index) => {
    slideDataMap.set(slide, index);
  });

  // Filter slides by data-filter-name
  function filterSlides(filterName) {
    console.log(`\n🔍 ROOMS SECTION: Filtering slides by: "${filterName}"`);

    if (!currentSwiper) {
      console.log("❌ ROOMS SECTION: No Swiper instance found");
      return 0;
    }

    // Add opacity 0 to swiper container to hide the jerk
    if (swiperContainer) {
      swiperContainer.style.opacity = '0';
      swiperContainer.style.transition = 'opacity 0.15s ease-out';
    }

    let visibleCount = 0;
    const visibleSlides = [];

    // Determine which slides should be visible
    allSlides.forEach((slide, index) => {
      // Backward compatibility: check inside card content first, then on card itself
      const filterData = slide.querySelector("[data-filter-name]");
      let slideFilterName = filterData ? filterData.getAttribute("data-filter-name") : null;

      // If not found inside, check the slide itself
      if (!slideFilterName) {
        slideFilterName = slide.getAttribute("data-filter-name");
      }

      console.log(`   📋 Slide [${index}]: data-filter-name="${slideFilterName}"`);

      // Show all slides if filter is "*" or "all"
      if (filterName === "*" || filterName === "all" || slideFilterName === filterName) {
        // Prepare slide for display
        slide.classList.remove("swiper-slide-hidden");
        slide.style.display = "";
        slide.removeAttribute("aria-hidden");
        visibleSlides.push(slide);
        visibleCount++;
        console.log(`   ✅ Slide [${index}]: WILL BE VISIBLE`);
      } else {
        console.log(`   ❌ Slide [${index}]: WILL BE HIDDEN (removed from DOM)`);
      }
    });

    console.log(`\n📊 ROOMS SECTION: ${visibleCount} visible slides after filtering`);

    // Remove all slides from Swiper
    console.log("🔄 ROOMS SECTION: Removing all slides from Swiper...");
    currentSwiper.removeAllSlides();

    // Append only visible slides back to Swiper
    console.log(`🔄 ROOMS SECTION: Adding ${visibleCount} filtered slides to Swiper...`);
    currentSwiper.appendSlide(visibleSlides);

    // Update Swiper to refresh layout and pagination
    console.log("🔄 ROOMS SECTION: Updating Swiper layout...");
    currentSwiper.update();

    // Slide to first slide
    currentSwiper.slideTo(0, 0);

    // Fade in the swiper container
    setTimeout(() => {
      if (swiperContainer) {
        swiperContainer.style.opacity = '1';
      }
      console.log("✅ ROOMS SECTION: Filter applied successfully");
    }, 10);

    return visibleCount;
  }

  // Set active filter button
  function setActiveFilter(activeButton) {
    console.log("🎨 ROOMS SECTION: Setting active filter button");

    // Remove active class from all buttons
    filterButtons.forEach((btn) => {
      btn.classList.remove("is-custom-current");
      const parentItem = btn.closest(".rooms_tabs-collection-item");
      if (parentItem) {
        parentItem.setAttribute("aria-selected", "false");
      }
    });

    // Add active class to clicked button
    if (activeButton) {
      activeButton.classList.add("is-custom-current");
      const parentItem = activeButton.closest(".rooms_tabs-collection-item");
      if (parentItem) {
        parentItem.setAttribute("aria-selected", "true");
      }
    }
  }

  // Check if filter buttons exist and count rooms per filter
  function checkFilters() {
    console.log("🔍 ROOMS SECTION: Checking available filters...");

    const filterCounts = {};

    // Count slides per filter
    allSlides.forEach((slide) => {
      // Backward compatibility: check inside card content first, then on card itself
      const filterData = slide.querySelector("[data-filter-name]");
      let filterName = filterData ? filterData.getAttribute("data-filter-name") : null;

      // If not found inside, check the slide itself
      if (!filterName) {
        filterName = slide.getAttribute("data-filter-name");
      }

      if (filterName) {
        filterCounts[filterName] = (filterCounts[filterName] || 0) + 1;
      }
    });

    console.log("📊 ROOMS SECTION: Filter counts:", filterCounts);

    // Hide filter buttons that have no matching rooms (except "*" which shows all)
    filterButtons.forEach((btn) => {
      const filterName = btn.getAttribute("data-filter-name");
      const count = filterCounts[filterName] || 0;
      const parentItem = btn.closest(".rooms_tabs-collection-item");

      // Never hide the "*" filter as it shows all items
      if (filterName === "*") {
        console.log(`   ⭐ Keeping filter button: "*" (shows all rooms)`);
        if (parentItem) {
          parentItem.style.display = "";
        }
      } else if (count === 0 && parentItem) {
        console.log(`   ❌ Hiding filter button: "${filterName}" (0 rooms)`);
        parentItem.style.display = "none";
      } else {
        console.log(`   ✅ Showing filter button: "${filterName}" (${count} rooms)`);
        if (parentItem) {
          parentItem.style.display = "";
        }
      }
    });

    return filterCounts;
  }

  // Setup event listeners for filter buttons
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filterName = button.getAttribute("data-filter-name");
      console.log(`\n🖱️  ROOMS SECTION: Filter button clicked: "${filterName}"`);

      currentFilter = filterName;
      setActiveFilter(button);
      filterSlides(filterName);
    });
  });

  // Initialize
  console.log("\n🚀 ROOMS SECTION: Initializing...");

  // Check and hide empty filters
  checkFilters();

  // Initialize Swiper
  initSwiper();

  // Get all visible filters
  const visibleFilters = Array.from(filterButtons).filter(btn => {
    const parentItem = btn.closest(".rooms_tabs-collection-item");
    return !parentItem || parentItem.style.display !== "none";
  });

  // Look for "*" filter first, otherwise use first visible filter
  let defaultFilter = null;
  const starFilter = visibleFilters.find(btn => btn.getAttribute("data-filter-name") === "*");

  if (starFilter) {
    defaultFilter = starFilter;
    console.log(`⭐ ROOMS SECTION: Using "*" filter as default (shows all rooms)`);
  } else if (visibleFilters.length > 0) {
    defaultFilter = visibleFilters[0];
    console.log(`✅ ROOMS SECTION: Using first visible filter as default`);
  }

  if (defaultFilter) {
    const filterName = defaultFilter.getAttribute("data-filter-name");
    console.log(`✅ ROOMS SECTION: Setting default filter: "${filterName}"`);
    currentFilter = filterName;
    setActiveFilter(defaultFilter);
    filterSlides(filterName);
  } else {
    console.log("⚠️  ROOMS SECTION: No visible filters, showing all rooms");
    filterSlides("all");
  }

  console.log("\n✅ ROOMS SECTION: Filter system initialized successfully!");
});

/******************************************************************************
 * OFFERS FILTER & SWIPER
 *****************************************************************************/

document.addEventListener("DOMContentLoaded", () => {
  console.log("🎁 OFFERS SECTION: Starting filter initialization...");

  const offersSection = document.querySelector(".section_offers");
  console.log("🎁 OFFERS SECTION: Found section?", !!offersSection);

  if (!offersSection) {
    console.log("❌ OFFERS SECTION: .section_offers not found in DOM - exiting");
    return;
  }

  // Get filter buttons
  const filterButtons = offersSection.querySelectorAll("[data-filter-name]");
  console.log("🎁 OFFERS SECTION: Found filter buttons:", filterButtons.length);

  // Get all offer slides
  const allSlides = offersSection.querySelectorAll(".swiper-slide.is-offers");
  console.log("🎁 OFFERS SECTION: Found offer slides:", allSlides.length);

  // Get swiper container
  const swiperContainer = offersSection.querySelector(".swiper.is-offers");
  console.log("🎁 OFFERS SECTION: Found swiper container?", !!swiperContainer);

  // Get the tab pane container (legacy from old tab system)
  const tabPaneContainer = offersSection.querySelector(".offers_tab-pane");
  console.log("🎁 OFFERS SECTION: Found tab pane container?", !!tabPaneContainer);

  // Make sure the tab pane is visible (override old tab system)
  if (tabPaneContainer) {
    console.log("🎁 OFFERS SECTION: Ensuring tab pane is visible (removing aria-hidden)");
    tabPaneContainer.classList.remove("hide");
    tabPaneContainer.removeAttribute("aria-hidden");
    tabPaneContainer.style.display = "";
  }

  let currentSwiper = null;
  let currentFilter = "all"; // Track current filter

  // Hide section if no slides exist
  if (allSlides.length === 0) {
    console.log("❌ OFFERS SECTION: NO offer slides found - HIDING entire section");
    offersSection.style.display = "none";
    return;
  }

  // Get pagination element (outside swiper container to prevent it from being moved)
  const paginationEl = offersSection.querySelector(".offers_bullets-wrapper");

  // Initialize Swiper
  function initSwiper() {
    console.log("🔄 OFFERS SECTION: Initializing Swiper...");

    if (currentSwiper) {
      console.log("🔄 OFFERS SECTION: Destroying existing Swiper instance");
      // Use destroy(false, true) to keep instance but clean up
      // This prevents pagination from being removed from DOM
      currentSwiper.destroy(false, true);
      currentSwiper = null;
    }

    if (!swiperContainer) {
      console.log("❌ OFFERS SECTION: No swiper container found");
      return;
    }

    // Clear any existing pagination bullets before reinit
    if (paginationEl) {
      paginationEl.innerHTML = '';
    }

    currentSwiper = new Swiper(swiperContainer, {
      ...swiperAnimationConfig,
      autoHeight: false,
      slidesPerView: 1.2,
      spaceBetween: 16,
      rewind: false,
      // Critical for filtering - watch slides and skip hidden ones
      watchSlidesProgress: true,
      watchSlidesVisibility: true,
      // Only count visible slides
      visibilityFullFit: false,
      navigation: {
        nextEl: ".offers_next-btn",
        prevEl: ".offers_prev-btn",
      },
      pagination: {
        el: ".offers_bullets-wrapper",
        clickable: true,
        bulletClass: "offers_bullet",
        bulletActiveClass: "is-current",
        renderBullet: function (index, className) {
          return '<span class="' + className + '" tabindex="0" role="button" aria-label="Go to slide ' + (index + 1) + '"></span>';
        },
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      breakpoints: {
        790: {
          slidesPerView: 2,
          spaceBetween: 32,
        },
        1150: {
          slidesPerView: 2,
          spaceBetween: 32,
        },
        1440: {
          slidesPerView: 2,
          spaceBetween: 48,
        },
      },
      // Event to log what Swiper sees
      on: {
        init: function() {
          console.log(`🔍 OFFERS SWIPER: Initialized with ${this.slides.length} total slides`);
          const visibleSlides = Array.from(this.slides).filter(slide =>
            slide.style.display !== 'none' && !slide.classList.contains('swiper-slide-hidden')
          );
          console.log(`🔍 OFFERS SWIPER: ${visibleSlides.length} visible slides detected`);
        },
      },
    });

    console.log("✅ OFFERS SECTION: Swiper initialized successfully");
  }

  // Store original parent and position for each slide
  const slideParent = allSlides.length > 0 ? allSlides[0].parentElement : null;
  const slideDataMap = new Map(); // Store slides and their original order

  // Store all slides with their original index
  allSlides.forEach((slide, index) => {
    slideDataMap.set(slide, index);
  });

  // Filter slides by data-filter-name
  function filterSlides(filterName) {
    console.log(`\n🔍 OFFERS SECTION: Filtering slides by: "${filterName}"`);

    if (!currentSwiper) {
      console.log("❌ OFFERS SECTION: No Swiper instance found");
      return 0;
    }

    // Add opacity 0 to swiper container to hide the jerk
    if (swiperContainer) {
      swiperContainer.style.opacity = '0';
      swiperContainer.style.transition = 'opacity 0.15s ease-out';
    }

    let visibleCount = 0;
    const visibleSlides = [];

    // Determine which slides should be visible
    allSlides.forEach((slide, index) => {
      // Backward compatibility: check inside card content first, then on card itself
      const filterData = slide.querySelector("[data-filter-name]");
      let slideFilterName = filterData ? filterData.getAttribute("data-filter-name") : null;

      // If not found inside, check the slide itself
      if (!slideFilterName) {
        slideFilterName = slide.getAttribute("data-filter-name");
      }

      console.log(`   📋 Slide [${index}]: data-filter-name="${slideFilterName}"`);

      // Show all slides if filter is "*" or "all"
      if (filterName === "*" || filterName === "all" || slideFilterName === filterName) {
        // Prepare slide for display
        slide.classList.remove("swiper-slide-hidden");
        slide.style.display = "";
        slide.removeAttribute("aria-hidden");
        visibleSlides.push(slide);
        visibleCount++;
        console.log(`   ✅ Slide [${index}]: WILL BE VISIBLE`);
      } else {
        console.log(`   ❌ Slide [${index}]: WILL BE HIDDEN (removed from DOM)`);
      }
    });

    console.log(`\n📊 OFFERS SECTION: ${visibleCount} visible slides after filtering`);

    // Remove all slides from Swiper
    console.log("🔄 OFFERS SECTION: Removing all slides from Swiper...");
    currentSwiper.removeAllSlides();

    // Append only visible slides back to Swiper
    console.log(`�� OFFERS SECTION: Adding ${visibleCount} filtered slides to Swiper...`);
    currentSwiper.appendSlide(visibleSlides);

    // Update Swiper to refresh layout and pagination
    console.log("🔄 OFFERS SECTION: Updating Swiper layout...");
    currentSwiper.update();

    // Slide to first slide
    currentSwiper.slideTo(0, 0);

    // Fade in the swiper container
    setTimeout(() => {
      if (swiperContainer) {
        swiperContainer.style.opacity = '1';
      }
      console.log("✅ OFFERS SECTION: Filter applied successfully");
    }, 10);

    return visibleCount;
  }

  // Set active filter button
  function setActiveFilter(activeButton) {
    console.log("🎨 OFFERS SECTION: Setting active filter button");

    // Remove active class from all buttons
    filterButtons.forEach((btn) => {
      btn.classList.remove("is-custom-current");
      const parentItem = btn.closest(".offers_tabs-collection-item");
      if (parentItem) {
        parentItem.setAttribute("aria-selected", "false");
      }
    });

    // Add active class to clicked button
    if (activeButton) {
      activeButton.classList.add("is-custom-current");
      const parentItem = activeButton.closest(".offers_tabs-collection-item");
      if (parentItem) {
        parentItem.setAttribute("aria-selected", "true");
      }
    }
  }

  // Check if filter buttons exist and count offers per filter
  function checkFilters() {
    console.log("🔍 OFFERS SECTION: Checking available filters...");

    const filterCounts = {};

    // Count slides per filter
    allSlides.forEach((slide) => {
      // Backward compatibility: check inside card content first, then on card itself
      const filterData = slide.querySelector("[data-filter-name]");
      let filterName = filterData ? filterData.getAttribute("data-filter-name") : null;

      // If not found inside, check the slide itself
      if (!filterName) {
        filterName = slide.getAttribute("data-filter-name");
      }

      if (filterName) {
        filterCounts[filterName] = (filterCounts[filterName] || 0) + 1;
      }
    });

    console.log("📊 OFFERS SECTION: Filter counts:", filterCounts);

    // Hide filter buttons that have no matching offers (except "*" which shows all)
    filterButtons.forEach((btn) => {
      const filterName = btn.getAttribute("data-filter-name");
      const count = filterCounts[filterName] || 0;
      const parentItem = btn.closest(".offers_tabs-collection-item");

      // Never hide the "*" filter as it shows all items
      if (filterName === "*") {
        console.log(`   ⭐ Keeping filter button: "*" (shows all offers)`);
        if (parentItem) {
          parentItem.style.display = "";
        }
      } else if (count === 0 && parentItem) {
        console.log(`   ❌ Hiding filter button: "${filterName}" (0 offers)`);
        parentItem.style.display = "none";
      } else {
        console.log(`   ✅ Showing filter button: "${filterName}" (${count} offers)`);
        if (parentItem) {
          parentItem.style.display = "";
        }
      }
    });

    return filterCounts;
  }

  // Setup event listeners for filter buttons
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filterName = button.getAttribute("data-filter-name");
      console.log(`\n🖱️  OFFERS SECTION: Filter button clicked: "${filterName}"`);

      currentFilter = filterName;
      setActiveFilter(button);
      filterSlides(filterName);
    });
  });

  // Initialize
  console.log("\n🚀 OFFERS SECTION: Initializing...");

  // Check and hide empty filters
  checkFilters();

  // Initialize Swiper
  initSwiper();

  // Get all visible filters
  const visibleFilters = Array.from(filterButtons).filter(btn => {
    const parentItem = btn.closest(".offers_tabs-collection-item");
    return !parentItem || parentItem.style.display !== "none";
  });

  // Look for "*" filter first, otherwise use first visible filter
  let defaultFilter = null;
  const starFilter = visibleFilters.find(btn => btn.getAttribute("data-filter-name") === "*");

  if (starFilter) {
    defaultFilter = starFilter;
    console.log(`⭐ OFFERS SECTION: Using "*" filter as default (shows all offers)`);
  } else if (visibleFilters.length > 0) {
    defaultFilter = visibleFilters[0];
    console.log(`✅ OFFERS SECTION: Using first visible filter as default`);
  }

  if (defaultFilter) {
    const filterName = defaultFilter.getAttribute("data-filter-name");
    console.log(`✅ OFFERS SECTION: Setting default filter: "${filterName}"`);
    currentFilter = filterName;
    setActiveFilter(defaultFilter);
    filterSlides(filterName);
  } else {
    console.log("⚠️  OFFERS SECTION: No visible filters, showing all offers");
    filterSlides("all");
  }

  console.log("\n✅ OFFERS SECTION: Filter system initialized successfully!");
});

/******************************************************************************
 * SWIPER SOCIAL MEDIA REVIEWS
 *****************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  const swiper = new Swiper(".swiper.is-sm-reviews", {
    ...swiperAnimationConfig,
    autoHeight: false,
    slidesPerView: 1.2,
    centeredSlides: true,
    initialSlide: 1,
    spaceBetween: 16,
    rewind: true,
    navigation: {
      nextEl: ".sm-reviews_next-btn",
      prevEl: ".sm-reviews_prev-btn",
    },
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    breakpoints: {
      630: {
        slidesPerView: 1.5,
        spaceBetween: 24,
      },
      992: {
        slidesPerView: 2.2,
        spaceBetween: 24,
      },
      1140: {
        centeredSlides: false,
        slidesPerView: 2,
        spaceBetween: 24,
      },
    },
  });
});

/******************************************************************************
 * POPUP GALLERY SWIPER MIT THUMBS
 *****************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".popup_gallery").forEach((container) => {
    // Cache häufig verwendete DOM-Elemente
    const mainSliderEl = container.querySelector(".swiper.is-popup");
    const thumbsSliderEl = container.querySelector(".swiper.is-popup-thumbs");
    const imgWrapper = container.querySelector(".popup_gallery-img-wrapper");
    const navPrev = container.querySelector(".popup_gallery-prev-btn");
    const navNext = container.querySelector(".popup_gallery-next-btn");

    if (!mainSliderEl) {
      console.error(
        "Kein Hauptslider-Element (.swiper.is-popup) im Container gefunden."
      );
      return;
    }

    const mainWrapper = mainSliderEl.querySelector(".swiper-wrapper.is-popup");
    if (!mainWrapper) {
      console.error(
        "Kein Wrapper im Hauptslider (.swiper-wrapper.is-popup) im Container gefunden."
      );
      return;
    }
    while (mainWrapper.firstChild) {
      mainWrapper.removeChild(mainWrapper.firstChild);
    }

    if (!thumbsSliderEl) {
      console.error(
        "Kein Thumbs-Slider-Element (.swiper.is-popup-thumbs) im Container gefunden."
      );
      return;
    }

    const thumbsWrapper = thumbsSliderEl.querySelector(
      ".swiper-wrapper.is-popup-thumbs"
    );
    if (!thumbsWrapper) {
      console.error(
        "Kein Wrapper im Thumbs-Slider (.swiper-wrapper.is-popup-thumbs) im Container gefunden."
      );
      return;
    }
    while (thumbsWrapper.firstChild) {
      thumbsWrapper.removeChild(thumbsWrapper.firstChild);
    }

    if (!imgWrapper) {
      console.error(
        "Kein Bild-Wrapper (.popup_gallery-img-wrapper) im Container gefunden."
      );
      return;
    }

    const imgURLItems = imgWrapper.querySelectorAll(
      ".popup_gallery-img-url[data-img-url]"
    );
    if (!imgURLItems.length) {
      console.error(
        "Keine Bild-URLs in .popup_gallery-img-url im Container gefunden."
      );
      return;
    }

    imgURLItems.forEach((item) => {
      const imgURL = item.getAttribute("data-img-url");
      if (imgURL) {
        const slide = document.createElement("div");
        slide.classList.add("swiper-slide", "is-popup");
        const img = document.createElement("img");
        img.src = imgURL;
        img.loading = "lazy";
        img.classList.add("popup_gallery-img");
        slide.appendChild(img);
        mainWrapper.appendChild(slide);

        const thumbSlide = document.createElement("div");
        thumbSlide.classList.add("swiper-slide", "is-popup-thumbs");
        const thumbImg = document.createElement("img");
        thumbImg.src = imgURL;
        thumbImg.loading = "lazy";
        thumbImg.classList.add("popup_gallery-thumb-img");
        thumbSlide.appendChild(thumbImg);
        thumbsWrapper.appendChild(thumbSlide);
      }
    });

    if (!navPrev || !navNext) {
      console.warn(
        "Navigationselemente (.popup_gallery-prev-btn / .popup_gallery-next-btn) im Container nicht gefunden."
      );
    }

    const thumbsSwiper = new Swiper(thumbsSliderEl, {
      slidesPerView: 4.4,
      spaceBetween: 8,
      freeMode: true,
      watchSlidesProgress: true,
      mousewheel: {
        forceToAxis: true,
        sensitivity: 1,
        releaseOnEdges: true,
      },
      breakpoints: {
        480: {
          slidesPerView: 5.3,
          spaceBetween: 8,
        },
      },
    });

    const mainSwiper = new Swiper(mainSliderEl, {
      slidesPerView: 1,
      spaceBetween: 16,
      navigation:
        navPrev && navNext
          ? {
              nextEl: navNext,
              prevEl: navPrev,
            }
          : false,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      mousewheel: {
        forceToAxis: true,
        sensitivity: 1,
        releaseOnEdges: true,
        thresholdDelta: 10,
      },
      thumbs: {
        swiper: thumbsSwiper,
      },
      breakpoints: {
        480: {
          slidesPerView: 1,
          spaceBetween: 16,
        },
        992: {
          slidesPerView: 1,
          spaceBetween: 32,
        },
      },
    });
  });
});

/******************************************************************************
 * ROOMS & OFFERS TO FORM
 *****************************************************************************/

document.addEventListener("click", function (e) {
  // Cache häufig verwendete DOM-Elemente
  const roomElement = document.querySelector("[data-room-element]");
  const offerElement = document.querySelector("[data-offer-element]");
  const wrapper = document.querySelector("[data-room-offer-wrapper]");
  const roomInput = document.querySelector('[name="selected-room"]');
  const offerInput = document.querySelector('[name="selected-offer"]');
  const roomNameTarget = document.querySelector("[data-room-name-target]");
  const roomImgTarget = document.querySelector("[data-room-image-target]");
  const offerNameTarget = document.querySelector("[data-offer-name-target]");
  const offerImgTarget = document.querySelector("[data-offer-image-target]");

  const roomBtn = e.target.closest('[data-custom="select-room"]');
  if (roomBtn) {
    e.preventDefault();

    const popup = roomBtn.closest("[data-popup]");
    let card;
    let popupId;

    if (popup) {
      popupId = popup.getAttribute("data-popup");
      card = document.querySelector(`[data-popup-source="${popupId}"]`);
    } else {
      card = roomBtn.closest(".rooms_card");
      const detailsBtn = card.querySelector("[data-open-popup]");
      if (detailsBtn) {
        popupId = detailsBtn.getAttribute("data-open-popup");
      }
    }

    if (!card) return;

    const nameEl = card.querySelector("[data-room-name]");
    const codeEl = card.querySelector("[data-room-code]");
    const imgEl = card.querySelector("[data-room-image]");
    const name = nameEl ? (nameEl.getAttribute("data-room-name") || nameEl.textContent.trim()) : "";
    const code = codeEl ? (codeEl.getAttribute("data-room-code") || codeEl.textContent.trim()) : "";
    const img = imgEl ? imgEl.getAttribute("src") : "";

    // Create combined value for submission: "CODE|Name"
    // Format: "DBL|Deluxe Double Room" - easy to parse on server with split('|')
    const roomValue = code && name ? `${code}|${name}` : (name || "");

    if (roomNameTarget) {
      if (roomNameTarget.tagName === "INPUT") {
        roomNameTarget.value = name;
      } else {
        roomNameTarget.textContent = name;
      }
    }

    if (roomImgTarget) roomImgTarget.src = img;
    if (roomInput) roomInput.value = roomValue;

    if (roomElement) {
      roomElement.style.display = "block";

      const roomButton = roomElement.querySelector(
        ".form_r-o-wrapper[data-open-popup]"
      );
      if (roomButton && popupId) {
        roomButton.setAttribute("data-open-popup", popupId);
      }
    }

    if (wrapper) wrapper.style.display = "flex";
  }

  const offerBtn = e.target.closest('[data-custom="select-offer"]');
  if (offerBtn) {
    e.preventDefault();

    const popup = offerBtn.closest("[data-popup]");
    let card;
    let popupId;

    if (popup) {
      popupId = popup.getAttribute("data-popup");
      card = document.querySelector(`[data-popup-source="${popupId}"]`);
    } else {
      card = offerBtn.closest(".offers_card");
      const detailsBtn = card.querySelector("[data-open-popup]");
      if (detailsBtn) {
        popupId = detailsBtn.getAttribute("data-open-popup");
      }
    }

    if (!card) return;

    const nameEl = card.querySelector("[data-offer-name]");
    const codeEl = card.querySelector("[data-offer-code]");
    const imgEl = card.querySelector("[data-offer-image]");

    // Get values from either attributes or text content (like room cards)
    const name = nameEl
      ? (nameEl.getAttribute("data-offer-name") || nameEl.textContent.trim())
      : "";
    const code = codeEl
      ? (codeEl.getAttribute("data-offer-code") || codeEl.textContent.trim())
      : "";
    const img = imgEl ? imgEl.getAttribute("src") : "";

    // Create combined value for submission: "CODE|Name" (same pattern as rooms)
    const offerValue = code && name ? `${code}|${name}` : (name || "");

    if (offerNameTarget) {
      if (offerNameTarget.tagName === "INPUT") {
        offerNameTarget.value = name;
      } else {
        offerNameTarget.textContent = name;
      }
    }

    if (offerImgTarget) offerImgTarget.src = img;
    if (offerInput) offerInput.value = offerValue;

    if (offerElement) {
      offerElement.style.display = "block";

      const offerButton = offerElement.querySelector(
        ".form_r-o-wrapper[data-open-popup]"
      );
      if (offerButton && popupId) {
        offerButton.setAttribute("data-open-popup", popupId);
      }
    }

    if (wrapper) wrapper.style.display = "flex";
  }

  const roomDelete = e.target.closest("[data-room-delete]");
  if (roomDelete) {
    e.preventDefault();
    e.stopPropagation();

    const event = e || window.event;
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }

    if (roomElement) roomElement.style.display = "none";
    if (roomInput) roomInput.value = "";
    // Zusätzliche Sicherheit: Falls roomNameTarget ein Input ist, auch diesen leeren
    if (roomNameTarget && roomNameTarget.tagName === "INPUT") {
      roomNameTarget.value = "";
    }

    if (offerElement && offerElement.style.display === "none" && wrapper) {
      wrapper.style.display = "none";
    }

    return false;
  }

  const offerDelete = e.target.closest("[data-offer-delete]");
  if (offerDelete) {
    e.preventDefault();
    e.stopPropagation();

    const event = e || window.event;
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }

    if (offerElement) offerElement.style.display = "none";
    if (offerInput) offerInput.value = "";
    // Zusätzliche Sicherheit: Falls offerNameTarget ein Input ist, auch diesen leeren
    if (offerNameTarget && offerNameTarget.tagName === "INPUT") {
      offerNameTarget.value = "";
    }

    if (roomElement && roomElement.style.display === "none" && wrapper) {
      wrapper.style.display = "none";
    }

    return false;
  }
});

/******************************************************************************
 * ZENTRALE ARIA-KORREKTUREN FÜR BARRIEREFREIHEIT
 *****************************************************************************/
document.addEventListener("DOMContentLoaded", function () {
  /**
   * WICHTIGER HINWEIS ZUR ARIA-IMPLEMENTIERUNG:
   *
   * Diese Seite nutzt eine "Zwei-Schichten-Strategie" für ARIA-Attribute:
   *
   * 1. ARIAHelper (hier): Setzt initiale ARIA-Attribute und korrigiert sie nach Timer.
   *    Dies ist notwendig, weil Webflow und Swiper manchmal ARIA-Attribute überschreiben.
   *
   * 2. Modulare Event-Handler: In den einzelnen Komponenten-Blöcken setzen diese
   *    ARIA-Attribute direkt bei Benutzerinteraktionen.
   *
   * Beide Systeme sind notwendig für vollständige Accessibility-Konformität.
   * Das Entfernen einer der beiden Schichten kann zu Accessibility-Fehlern führen.
   */
  const ARIAHelper = {
    /**
     * Hilfsfunktionen zur konsistenten Verwaltung von ARIA-Attributen
     * - Standardisierte Benennungskonvention:
     *   - Ebene 1: tabList (container mit role="tablist")
     *   - Ebene 2: tabItems (elemente mit role="tab", bekommen aria-selected)
     *   - Ebene 3: triggerElements (klickbare elemente innerhalb der Tabs, KEINE aria-attribute)
     */
    setRole: function (selector, role, attributes = {}) {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) return;

      elements.forEach((el) => {
        el.setAttribute("role", role);
        Object.entries(attributes).forEach(([key, value]) => {
          el.setAttribute(key, value);
        });
      });
    },

    /**
     * Korrigiert Tab-bezogene ARIA-Attribute basierend auf der dreistufigen Hierarchie
     * @param {string} tabListSelector - Selektor für Tablist-Container (Ebene 1)
     * @param {string} tabItemsSelector - Selektor für Tab-Elemente (Ebene 2)
     * @param {string} triggerSelector - Selektor für Trigger-Elemente innerhalb der Tabs (Ebene 3)
     */
    setupTablist: function (
      tabListSelector,
      tabItemsSelector,
      triggerSelector
    ) {
      // Tab-Listen (Ebene 1)
      const tabLists = document.querySelectorAll(tabListSelector);
      tabLists.forEach((list) => {
        list.setAttribute("role", "tablist");
      });

      // Tab-Elemente (Ebene 2)
      const tabItems = document.querySelectorAll(tabItemsSelector);
      tabItems.forEach((tabItem) => {
        // Tab-Element mit korrekter Rolle
        tabItem.setAttribute("role", "tab");

        // Prüfe, ob das Tab aktiv ist (über CSS-Klasse oder Kind-Element)
        const isActive =
          tabItem.classList.contains("is-custom-current") ||
          tabItem.classList.contains("is-active") ||
          tabItem.querySelector(".is-custom-current, .is-active");

        // Setze aria-selected direkt auf dem Tab-Element
        tabItem.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      // Trigger-Elemente (Ebene 3) - entferne ARIA-Attribute
      if (triggerSelector) {
        const triggers = document.querySelectorAll(triggerSelector);
        triggers.forEach((trigger) => {
          // Trigger sollten keine ARIA-Tab-Attribute haben
          trigger.removeAttribute("aria-selected");

          // Bewahre Klassen für visuelles Feedback
          // Diese Klassen werden vom JS-Code für die Darstellung verwendet
        });
      }
    },

    /**
     * Korrigiert ARIA für Swiper-basierte Tabs
     * Bei Swiper ist die Struktur:
     * - Wrapper (Ebene 1, tabList)
     * - Slides (Ebene 2, tabItems)
     * - Buttons/Trigger (Ebene 3)
     */
    setupSwiperTabs: function () {
      // Topic-Filter Tabs (im Swiper)
      this.setupTablist(
        ".swiper-wrapper.is-topic",
        ".swiper-wrapper.is-topic .swiper-slide",
        ".topic_button"
      );

      // Gewöhnliche Collection-basierte Tabs
      this.setupTablist(
        ".gallery_tabs-collection-list, .rooms_tabs-collection-list, .offers_tabs-collection-list",
        ".gallery_tabs-collection-item, .rooms_tabs-collection-item, .offers_tabs-collection-item",
        '.gallery_tabs, [class*="tabs"]:not([role="tab"])'
      );
    },

    /**
     * Korrigiert Swiper-Karussells für ARIA-Konformität
     * @param {string} wrapperSelector - Selektor für Swiper-Wrapper
     * @param {string} slideSelector - Selektor für Slides innerhalb des Wrappers
     */
    setupCarousel: function (wrapperSelector, slideSelector) {
      const wrappers = document.querySelectorAll(wrapperSelector);
      if (wrappers.length === 0) return;

      wrappers.forEach((wrapper) => {
        // Für Karussells ist role="region" semantisch korrekter als role="list"
        if (
          wrapper.getAttribute("role") === "list" ||
          !wrapper.getAttribute("role")
        ) {
          wrapper.setAttribute("role", "region");
          wrapper.setAttribute("aria-roledescription", "carousel");
        }

        // Slides in Karussells sollten role="group" haben
        const slides = wrapper.querySelectorAll(slideSelector);
        slides.forEach((slide) => {
          // Slides mit role="tab" behalten diese Rolle (für Swiper-Tabs)
          if (slide.getAttribute("role") !== "tab") {
            slide.setAttribute("role", "group");
            slide.setAttribute("aria-roledescription", "slide");
          }
        });
      });
    },

    /**
     * Führt alle ARIA-Korrekturen aus
     */
    initAll: function () {
      // Tab-Systeme einrichten
      this.setupSwiperTabs();

      // Karusselle einrichten (nicht-Tab Swiper)
      this.setupCarousel(
        ".swiper-wrapper:not(.is-topic)",
        '.swiper-slide:not([role="tab"])'
      );
    },
  };

  // ARIA-Korrekturen anwenden
  ARIAHelper.initAll();

  // Bei dynamischen Änderungen oder AJAX-Navigationen erneut anwenden
  // z.B. nach Swiper-Initialisierung
  setTimeout(ARIAHelper.initAll.bind(ARIAHelper), 1000);
});

/******************************************************************************
 * LOCATION DROPDOWN AUTO-OPEN
 *****************************************************************************/
document.addEventListener("DOMContentLoaded", function () {
  // Funktion zum automatischen Öffnen des Location Dropdowns bei Klick auf entsprechende Links
  function setupLocationDropdownLinks() {
    // Alle Links mit href="#location" finden
    const locationLinks = document.querySelectorAll('a[href="#location"]');

    if (!locationLinks.length) return;

    // DOM-Referenzen einmalig außerhalb der Event-Handler cachen
    const locationDropdownCheckbox = document.querySelector(
      ".location_dropdown-checkbox"
    );
    const contentWrapper = document.querySelector(".location_content-wrapper");
    let focusableElement = null;

    // Fokussierbare Elemente vorab finden, falls vorhanden
    if (contentWrapper) {
      focusableElement = contentWrapper.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    }

    if (!locationDropdownCheckbox) return;

    // Für jeden Link einen Event-Listener hinzufügen
    locationLinks.forEach((link) => {
      link.addEventListener(
        "click",
        function (e) {
          // Standard-Scroll-Verhalten des Browsers beibehalten
          // Nach dem Scrollen die Checkbox aktivieren

          // requestAnimationFrame für flüssigere visuelle Änderungen verwenden
          requestAnimationFrame(() => {
            // Checkbox auf checked setzen, um das Dropdown zu öffnen
            locationDropdownCheckbox.checked = true;

            // Optional: Fokus auf den Inhalt des Dropdowns setzen für bessere Accessibility
            if (focusableElement) {
              focusableElement.focus();
            }
          });
        },
        { passive: true }
      ); // Passive Event Listener für bessere Scrolling-Performance
    });
  }

  // Funktion aufrufen
  setupLocationDropdownLinks();
});
