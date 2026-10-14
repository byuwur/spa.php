/**
 * File: _fonts.js
 * Shared Google Fonts loading requires jQuery; optional pickers also use Select2.
 * Keep the SPA.php and SPA.js implementations in sync.
 * Copyright (c) 2026 Andrés Trujillo [Mateus] byUwUr
 */
(function (global) {
  if (typeof jQuery === "undefined" && !global.jQuery) return console.error("Init _fonts.js FAILED. No jQuery found.");
  const $ = global.jQuery;

  global.byFont = global.byFont || {};
  const byFont = global.byFont;
  if (typeof byFont.init === "function") return;
  // ==========
  // ==== VERIFIED GOOGLE FONTS CATALOG ====
  // ==========

  // Names and normal weights verified against https://fonts.google.com/metadata/fonts on 2026-10-10.
  const catalog = {
    ABeeZee: "400",
    "Abril Fatface": "400",
    Actor: "400",
    Adamina: "400",
    "Aguafina Script": "400",
    "Albert Sans": "100;200;300;400;500;600;700;800;900",
    Aldrich: "400",
    Aleo: "100;200;300;400;500;600;700;800;900",
    "Alfa Slab One": "400",
    Allison: "400",
    Allura: "400",
    "Amatic SC": "400;700",
    Amiri: "400;700",
    "Andada Pro": "400;500;600;700;800",
    "Anek Telugu": "100;200;300;400;500;600;700;800",
    "Anonymous Pro": "400;700",
    "Antic Slab": "400",
    Anton: "400",
    "Architects Daughter": "400",
    Archivo: "100;200;300;400;500;600;700;800;900",
    "Archivo Black": "400",
    Arimo: "400;500;600;700",
    Arvo: "400;700",
    Audiowide: "400",
    "Azeret Mono": "100;200;300;400;500;600;700;800;900",
    "B612 Mono": "400;700",
    "Baloo 2": "400;500;600;700;800",
    Bangers: "400",
    Barlow: "100;200;300;400;500;600;700;800;900",
    "Barlow Condensed": "100;200;300;400;500;600;700;800;900",
    Barriecito: "400",
    Baskervville: "400;500;600;700",
    "Be Vietnam Pro": "100;200;300;400;500;600;700;800;900",
    "Bebas Neue": "400",
    Birthstone: "400",
    "Bitcount Grid Double Ink": "100;200;300;400;500;600;700;800;900",
    "Bitcount Single Ink": "100;200;300;400;500;600;700;800;900",
    Bitter: "100;200;300;400;500;600;700;800;900",
    "Black Ops One": "400",
    "Bodoni Moda": "400;500;600;700;800;900",
    Boogaloo: "400",
    "Bricolage Grotesque": "200;300;400;500;600;700;800",
    Bungee: "400",
    "Bungee Hairline": "400",
    "Bungee Inline": "400",
    "Bungee Outline": "400",
    "Bungee Shade": "400",
    "Bungee Tint": "400",
    Butcherman: "400",
    "Caacupe One": "400",
    Cairo: "200;300;400;500;600;700;800;900;1000",
    "Cairo Play": "200;300;400;500;600;700;800;900;1000",
    Calistoga: "400",
    Calligraffitti: "400",
    Cambo: "400",
    Caprasimo: "400",
    Caveat: "400;500;600;700",
    "Caveat Brush": "400",
    "Chakra Petch": "300;400;500;600;700",
    "Changa One": "400",
    Chewy: "400",
    "Chivo Mono": "100;200;300;400;500;600;700;800;900",
    Cinzel: "400;500;600;700;800;900",
    "Cinzel Decorative": "400;700;900",
    Coiny: "400",
    Comfortaa: "300;400;500;600;700",
    "Comic Neue": "300;400;700",
    "Comic Relief": "400;700",
    "Concert One": "400",
    Cookie: "400",
    "Cormorant Garamond": "300;400;500;600;700",
    Courgette: "400",
    "Courier Prime": "400;700",
    Cousine: "400;700",
    Creepster: "400",
    "Crimson Pro": "200;300;400;500;600;700;800;900",
    "Crimson Text": "400;600;700",
    "Cutive Mono": "400",
    Damion: "400",
    "Dancing Script": "400;500;600;700",
    Datatype: "100;200;300;400;500;600;700;800;900",
    "Dawning of a New Day": "400",
    Delius: "400",
    Diplomata: "400",
    "DM Mono": "300;400;500",
    "DM Sans": "100;200;300;400;500;600;700;800;900;1000",
    "DM Serif Display": "400",
    "DM Serif Text": "400",
    DotGothic16: "400",
    "Eagle Lake": "400",
    Eater: "400",
    "EB Garamond": "400;500;600;700;800",
    "Edu AU VIC WA NT Guides": "400;500;600;700",
    Electrolize: "400",
    Exo: "100;200;300;400;500;600;700;800;900",
    "Exo 2": "100;200;300;400;500;600;700;800;900",
    Fascinate: "400",
    "Fascinate Inline": "400",
    "Faster One": "400",
    Faustina: "300;400;500;600;700;800",
    Figtree: "300;400;500;600;700;800;900",
    "Fira Code": "300;400;500;600;700",
    "Fira Mono": "400;500;700",
    "Fira Sans": "100;200;300;400;500;600;700;800;900",
    "Fira Sans Condensed": "100;200;300;400;500;600;700;800;900",
    "Fjalla One": "400",
    Forum: "400",
    "Fragment Mono": "400",
    "Frank Ruhl Libre": "300;400;500;600;700;800;900",
    Fraunces: "100;200;300;400;500;600;700;800;900",
    "Fredericka the Great": "400",
    Fredoka: "300;400;500;600;700",
    Frijole: "400",
    "Fugaz One": "400",
    "Funnel Display": "300;400;500;600;700;800",
    "Fuzzy Bubbles": "400;700",
    Geist: "100;200;300;400;500;600;700;800;900",
    "Geist Mono": "100;200;300;400;500;600;700;800;900",
    Geostar: "400",
    "Geostar Fill": "400",
    "Germania One": "400",
    "Gloria Hallelujah": "400",
    "Gochi Hand": "400",
    "Google Sans": "400;500;600;700",
    "Google Sans Code": "300;400;500;600;700;800",
    "Google Sans Flex": "1;100;200;300;400;500;600;700;800;900;1000",
    "Grandiflora One": "400",
    "Gravitas One": "400",
    "Great Vibes": "400",
    "Grechen Fuemen": "400",
    Gruppo: "400",
    Gulzar: "400",
    "Hanalei Fill": "400",
    Handlee: "400",
    Heebo: "100;200;300;400;500;600;700;800;900",
    Hind: "300;400;500;600;700",
    "Hind Siliguri": "300;400;500;600;700",
    "IBM Plex Mono": "100;200;300;400;500;600;700",
    "IBM Plex Sans": "100;200;300;400;500;600;700",
    "IBM Plex Sans Arabic": "100;200;300;400;500;600;700",
    "IBM Plex Serif": "100;200;300;400;500;600;700",
    "IM Fell English": "400",
    "IM Fell English SC": "400",
    Inconsolata: "200;300;400;500;600;700;800;900",
    "Indie Flower": "400",
    "Inria Serif": "300;400;700",
    "Instrument Sans": "400;500;600;700",
    "Instrument Serif": "400",
    Inter: "100;200;300;400;500;600;700;800;900",
    "Inter Tight": "100;200;300;400;500;600;700;800;900",
    "Iosevka Charon Mono": "300;400;500;700",
    Italiana: "400",
    Italianno: "400",
    Itim: "400",
    "Jersey 10": "400",
    "JetBrains Mono": "100;200;300;400;500;600;700;800",
    "Josefin Sans": "100;200;300;400;500;600;700",
    "Josefin Slab": "100;200;300;400;500;600;700",
    Jost: "100;200;300;400;500;600;700;800;900",
    "Just Another Hand": "400",
    K2D: "100;200;300;400;500;600;700;800",
    Kablammo: "400",
    "Kaisei Opti": "400;500;700",
    Kalam: "300;400;700",
    Kanit: "100;200;300;400;500;600;700;800;900",
    Karla: "200;300;400;500;600;700;800",
    "Kaushan Script": "400",
    "Kay Pho Du": "400;500;600;700",
    Kedebideri: "400;500;600;700;800;900",
    "Klee One": "400;600",
    Kodchasan: "200;300;400;500;600;700",
    "Kode Mono": "400;500;600;700",
    Kufam: "400;500;600;700;800;900",
    Lato: "100;300;400;700;900",
    "Leckerli One": "400",
    Lekton: "400;700",
    Lemon: "400",
    Lemonada: "300;400;500;600;700",
    Lexend: "100;200;300;400;500;600;700;800;900",
    "Lexend Deca": "100;200;300;400;500;600;700;800;900",
    "Libertinus Mono": "400",
    "Libre Baskerville": "400;500;600;700",
    "Libre Caslon Text": "400;700",
    "Libre Franklin": "100;200;300;400;500;600;700;800;900",
    "Lilita One": "400",
    Limelight: "400",
    Literata: "200;300;400;500;600;700;800;900",
    Lobster: "400",
    "Lobster Two": "400;700",
    Lora: "400;500;600;700",
    "Loved by the King": "400",
    "Luckiest Guy": "400",
    "LXGW WenKai Mono TC": "300;400;700",
    "M PLUS 1 Code": "100;200;300;400;500;600;700",
    "Major Mono Display": "400",
    Mali: "200;300;400;500;600;700",
    Manrope: "200;300;400;500;600;700;800",
    Marcellus: "400",
    Martel: "200;300;400;600;700;800;900",
    "Martian Mono": "100;200;300;400;500;600;700;800",
    "Maven Pro": "400;500;600;700;800;900",
    Megrim: "400",
    Merriweather: "300;400;500;600;700;800;900",
    "Metal Mania": "400",
    Michroma: "400",
    Miniver: "400",
    Monofett: "400",
    Monoton: "400",
    Montserrat: "100;200;300;400;500;600;700;800;900",
    "Montserrat Alternates": "100;200;300;400;500;600;700;800;900",
    "Ms Madi": "400",
    Mulish: "200;300;400;500;600;700;800;900;1000",
    MuseoModerno: "100;200;300;400;500;600;700;800;900",
    "Nanum Brush Script": "400",
    "Nanum Gothic": "400;700;800",
    "Nanum Gothic Coding": "400;700",
    Neucha: "400",
    Neuton: "200;300;400;700;800",
    "New Rocker": "400",
    Nosifer: "400",
    "Nothing You Could Do": "400",
    "Noto Naskh Arabic": "400;500;600;700",
    "Noto Sans": "100;200;300;400;500;600;700;800;900",
    "Noto Sans Devanagari": "100;200;300;400;500;600;700;800;900",
    "Noto Sans JP": "100;200;300;400;500;600;700;800;900",
    "Noto Sans KR": "100;200;300;400;500;600;700;800;900",
    "Noto Sans Mono": "100;200;300;400;500;600;700;800;900",
    "Noto Sans SC": "100;200;300;400;500;600;700;800;900",
    "Noto Serif": "100;200;300;400;500;600;700;800;900",
    "Nova Mono": "400",
    Nunito: "200;300;400;500;600;700;800;900;1000",
    "Nunito Sans": "200;300;400;500;600;700;800;900;1000",
    "Old Standard TT": "400;700",
    Onest: "100;200;300;400;500;600;700;800;900",
    "Open Sans": "300;400;500;600;700;800",
    Orbitron: "400;500;600;700;800;900",
    Oswald: "200;300;400;500;600;700",
    Outfit: "100;200;300;400;500;600;700;800;900",
    "Overpass Mono": "300;400;500;600;700",
    Oxanium: "200;300;400;500;600;700;800",
    "Oxygen Mono": "400",
    Pacifico: "400",
    "Palanquin Dark": "400;500;600;700",
    "Passion One": "400;700;900",
    "Patrick Hand": "400",
    "Patua One": "400",
    "Permanent Marker": "400",
    "Petit Formal Script": "400",
    "Pinyon Script": "400",
    "Pirata One": "400",
    "Pixelify Sans": "400;500;600;700",
    "Playfair Display": "400;500;600;700;800;900",
    "Plus Jakarta Sans": "200;300;400;500;600;700;800",
    "Poiret One": "400",
    Poppins: "100;200;300;400;500;600;700;800;900",
    Prata: "400",
    "Press Start 2P": "400",
    Prompt: "100;200;300;400;500;600;700;800;900",
    "PT Mono": "400",
    "PT Sans": "400;700",
    "PT Serif": "400;700",
    "Public Sans": "100;200;300;400;500;600;700;800;900",
    Quantico: "400;700",
    Quattrocento: "400;700",
    Questrial: "400",
    Quicksand: "300;400;500;600;700",
    "Racing Sans One": "400",
    Rajdhani: "300;400;500;600;700",
    Raleway: "100;200;300;400;500;600;700;800;900",
    Ramabhadra: "400",
    "Readex Pro": "200;300;400;500;600;700",
    "Red Hat Mono": "300;400;500;600;700",
    "Red Hat Text": "300;400;500;600;700",
    "Reddit Mono": "200;300;400;500;600;700;800;900",
    "Reenie Beanie": "400",
    Righteous: "400",
    Roboto: "100;200;300;400;500;600;700;800;900",
    "Roboto Condensed": "100;200;300;400;500;600;700;800;900",
    "Roboto Mono": "100;200;300;400;500;600;700",
    "Roboto Slab": "100;200;300;400;500;600;700;800;900",
    "Rock Salt": "400",
    "Ropa Sans": "400",
    Rowdies: "300;400;700",
    Rubik: "300;400;500;600;700;800;900",
    "Rubik Mono One": "400",
    "Russo One": "400",
    Rye: "400",
    Sacramento: "400",
    Saira: "100;200;300;400;500;600;700;800;900",
    "Saira Condensed": "100;200;300;400;500;600;700;800;900",
    Sancreek: "400",
    Satisfy: "400",
    "Sawarabi Mincho": "400",
    Schoolbell: "400",
    "Shadows Into Light": "400",
    "Share Tech": "400",
    "Share Tech Mono": "400",
    Signika: "300;400;500;600;700",
    Silkscreen: "400;700",
    Skranji: "400;700",
    Smokum: "400",
    "Smooch Sans": "100;200;300;400;500;600;700;800;900",
    Sofia: "400",
    "Sometype Mono": "400;500;600;700",
    Sora: "100;200;300;400;500;600;700;800",
    "Source Code Pro": "200;300;400;500;600;700;800;900",
    "Source Sans 3": "200;300;400;500;600;700;800;900",
    "Source Serif 4": "200;300;400;500;600;700;800;900",
    "Space Grotesk": "300;400;500;600;700",
    "Space Mono": "400;700",
    "Special Elite": "400",
    Spectral: "200;300;400;500;600;700;800",
    "Spline Sans Mono": "300;400;500;600;700",
    "Sree Krushnadevaraya": "400",
    Sriracha: "400",
    Staatliches: "400",
    Stick: "400",
    "STIX Two Text": "400;500;600;700",
    Syncopate: "400;700",
    "Syne Mono": "400",
    "TASA Explorer": "400;500;600;700;800",
    Teko: "300;400;500;600;700",
    Tiny5: "400",
    "Titan One": "400",
    "Titillium Web": "200;300;400;600;700;900",
    Trochut: "400;700",
    Ubuntu: "300;400;500;700",
    "Ubuntu Mono": "400;700",
    "Ubuntu Sans Mono": "400;500;600;700",
    Unbounded: "200;300;400;500;600;700;800;900",
    "Unica One": "400",
    UnifrakturCook: "700",
    UnifrakturMaguntia: "400",
    Urbanist: "100;200;300;400;500;600;700;800;900",
    "Victor Mono": "100;200;300;400;500;600;700",
    Vidaloka: "400",
    Vollkorn: "400;500;600;700;800;900",
    VT323: "400",
    Wallpoet: "400",
    "Work Sans": "100;200;300;400;500;600;700;800;900",
    Workbench: "400",
    "Xanh Mono": "400",
    "Yanone Kaffeesatz": "200;300;400;500;600;700",
    "Yarndings 12": "400",
    Yellowtail: "400",
    "Yeseva One": "400",
    Yrsa: "300;400;500;600;700",
    Zeyada: "400",
    "Zilla Slab": "300;400;500;600;700",
    "Zilla Slab Highlight": "400;700"
  };

  const families = Object.freeze(Object.keys(catalog));
  byFont.families = families;
  const names = new Map(families.map((name) => [name.toLowerCase(), name]));
  const requests = new Map();

  // ==========
  // ==== FONT LOADING AND PREVIEWS ====
  // ==========

  function googleFamily(value) {
    const first = String(value || "")
      .split(",")[0]
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2");
    return names.get(first.toLowerCase());
  }

  /** Cache successful and failed stylesheet requests to avoid retries while browsing or offline. */
  function load(value) {
    const name = googleFamily(value);
    if (!name) return;
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@${catalog[name]}&display=swap`;
    if (requests.has(url)) return requests.get(url);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.dataset.fontFamily = name;
    const request = new Promise(function (resolve) {
      const timeout = setTimeout(() => resolve(false), 8000);
      link.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      link.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    });
    requests.set(url, request);
    document.head.append(link);
    return request;
  }

  /**
   * Build a CSS stack without downloading fonts for offscreen dropdown options.
   * @param {string} value Saved family name or existing CSS font stack.
   * @param {string} [fallback] Fonts to use when the requested family is unavailable.
   * @returns {string} A valid font-family value, or the fallback for malformed input.
   */
  byFont.stack = function (value, fallback = "system-ui, sans-serif") {
    const name = googleFamily(value);
    const selected = name && !String(value).includes(",") ? `"${name}"` : value;
    const fontStack = selected ? `${selected}, ${fallback}` : fallback;
    return CSS.supports("font-family", fontStack) ? fontStack : fallback;
  };

  /** Request a selected or visible font once, preserving installed families and CSS stacks. */
  byFont.family = function (value, fallback = "system-ui, sans-serif") {
    load(value);
    return byFont.stack(value, fallback);
  };

  /**
   * Bound the wait for renderers that measure text before starting an animation.
   * @param {string} value Family name or existing CSS font stack.
   * @param {number|string} [weight=400] Current rendering weight.
   * @param {string} [text] Glyphs needed for the measurement.
   * @returns {Promise<boolean>} Whether the font loaded; failures leave CSS fallbacks usable.
   */
  byFont.ready = async function (value, weight = 400, text = "Aa 0123") {
    const name = googleFamily(value);
    if (!name || !document.fonts) return true;
    let timer;
    // One deadline covers both stylesheet loading and glyph readiness.
    const expiry = new Promise((resolve) => {
      timer = setTimeout(() => resolve(false), 3000);
    });
    try {
      if (!(await Promise.race([load(value), expiry]))) return false;
      const fonts = await Promise.race([document.fonts.load(`${weight} 16px "${name}"`, text), expiry]);
      return fonts?.length > 0;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  // ==========
  // ==== OPTIONAL FONT PICKERS ====
  // ==========

  const pickers = new WeakMap();
  const systemFonts = ["system-ui", "sans-serif", "serif", "monospace", "Arial", "Arial Black", "Verdana", "Tahoma", "Trebuchet MS", "Georgia", "Times New Roman", "Courier New", "Impact"];

  /** Render labels safely without downloading offscreen Google families. */
  function fontOption(option) {
    if (option.children || option.id == null) return option.text;
    const label = document.createElement("span");
    label.className = "font-option d-block text-truncate";
    label.textContent = option.text;
    label.dataset.font = option.id;
    label.style.fontFamily = byFont.stack(option.id);
    return $(label);
  }

  /**
   * Enhance one native field, preserving its name, saved value, and form Reset.
   * @param {HTMLInputElement|HTMLSelectElement} field Input or select to enhance.
   * @param {Object} [options] Optional host settings; no application state is stored here.
   * @param {Function} [options.initSelect2] Host initializer accepting a select and Select2 options.
   * @param {string} [options.fallback] Font stack used while a family is unavailable.
   * @param {string} [options.emptyFont] Font used for an empty selection.
   * @param {number|string|HTMLElement} [options.weight=400] Weight or form control that supplies it.
   * @param {string} [options.previewText] Plain text for the sample beneath the control.
   * @returns {HTMLInputElement|HTMLSelectElement} The enhanced select, or the original without UI libraries.
   */
  byFont.picker = function (field, { initSelect2, fallback = "system-ui, sans-serif", emptyFont = "", weight = 400, previewText = "Aa Bb 0123456789" } = {}) {
    if (!field || typeof $.fn.select2 !== "function" || !field.matches("input, select")) return field;
    const previous = pickers.get(field);
    if (previous && $(previous.select).data("select2")) return previous.select;
    if (previous) byFont.destroy(previous.select);

    const initial = field.value;
    const maxLength = Number(field.getAttribute("maxlength")) || 240;
    const select = field.tagName === "SELECT" ? field : document.createElement("select");
    const existing = field.tagName === "SELECT" ? [...field.options].filter((option) => !families.includes(option.value)).map((option) => [option.value, option.text]) : [];
    if ($(select).data("select2")) $(select).select2("close").select2("destroy");
    if (select !== field) {
      for (const { name, value } of field.attributes) {
        if (!["type", "value"].includes(name)) select.setAttribute(name, value);
      }
      select.classList.replace("form-control", "form-select");
      field.replaceWith(select);
    }
    select.classList.add("font-picker");
    select.setAttribute("data-font-picker", "");
    if (!select.hasAttribute("aria-label") && !select.labels.length) select.setAttribute("aria-label", "Font family");
    select.replaceChildren();
    const installed = document.createElement("optgroup");
    installed.label = "Installed and system fonts";
    const choices = new Map([["", "Default font"], ...systemFonts.map((name) => [name, name]), ...existing]);
    if (!families.includes(initial) && !choices.has(initial)) choices.set(initial, initial);
    for (const [value, title] of choices) installed.append(new Option(title, value, value === initial, value === initial));
    const google = document.createElement("optgroup");
    google.label = "Google Fonts";
    for (const name of families) google.append(new Option(name, name, name === initial, name === initial));
    select.append(installed, google);
    select.value = initial;
    const modal = select.closest(".modal, dialog");
    const widgetOptions = {
      width: "100%",
      dropdownParent: $(modal || document.body),
      tags: true,
      templateResult: fontOption,
      templateSelection: (option, container) => {
        // A stable selection node survives Select2's removal of unused custom tags.
        $(container).css("font-family", byFont.stack(option.id));
        return option.text;
      },
      createTag: ({ term }) => {
        const value = term.trim();
        return value && value.length <= maxLength ? { id: value, text: value } : null;
      }
    };
    if (initSelect2) initSelect2(select, widgetOptions);
    else $(select).select2(widgetOptions);

    const widget = $(select).data("select2");
    widget.dropdown.$dropdown.addClass("font-picker-dropdown");
    let observer;
    if (window.IntersectionObserver) {
      observer = new IntersectionObserver(
        (entries) => {
          if (!widget.isOpen()) return;
          for (const entry of entries) {
            if (!entry.isIntersecting || !entry.target.isConnected) continue;
            byFont.family(entry.target.dataset.font);
            observer.unobserve(entry.target);
          }
        },
        { root: widget.$results[0] }
      );
      widget.on("results:all", () => {
        observer.disconnect();
        if (widget.isOpen()) widget.$results.find(".font-option").each((_, option) => observer.observe(option));
      });
      $(select).on("select2:close.byFont", () => observer.disconnect());
    }

    const sample = document.createElement("span");
    sample.className = "font-preview d-block mt-1 fs-5 text-break";
    sample.textContent = previewText;
    select.parentElement.append(sample);
    const weightField = typeof weight === "object" ? weight : null;
    const update = () => {
      sample.style.fontFamily = byFont.family(select.value || emptyFont, fallback);
      sample.style.fontWeight = weightField ? weightField.value || 400 : weight;
    };
    $(select).on("change.byFont", update);
    if (weightField) $(weightField).on("input.byFont change.byFont", update);
    let resetTimer;
    const reset = () => {
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        $(select).val(initial).trigger("change.select2");
        update();
      }, 0);
    };
    const form = select.form;
    if (form) $(form).on("reset.byFont", reset);
    pickers.set(select, {
      select,
      field,
      dispose() {
        clearTimeout(resetTimer);
        if (observer && typeof observer.disconnect === "function") observer.disconnect();
        $(select).off(".byFont");
        if (weightField) $(weightField).off("input.byFont change.byFont", update);
        if (form) $(form).off("reset.byFont", reset);
        sample.remove();
      }
    });
    if (select !== field) pickers.set(field, pickers.get(select));
    update();
    return select;
  };

  /** Enhance explicitly marked fields; repeated SPA initialization keeps existing controls. */
  byFont.init = function (root = document) {
    if (!root || typeof $.fn.select2 !== "function") return;
    // Dispose routed controls; modal removal calls destroy directly.
    $(document)
      .off("bySPA:before-unload.byFont")
      .on("bySPA:before-unload.byFont", () => byFont.destroy($("#spa-content")[0]));
    $(root)
      .find("[data-font-picker]")
      .addBack("[data-font-picker]")
      .each((_, field) => byFont.picker(field));
  };

  /** Release samples, observers, and event handlers before removing a field or subtree. */
  byFont.destroy = function (root = document) {
    if (!root) return;
    const fields = pickers.has(root) || $(root).is("[data-font-picker]") ? [root] : $(root).find("[data-font-picker]").toArray();
    for (const field of fields) {
      const state = pickers.get(field);
      if (!state) continue;
      if ($(state.select).data("select2")) $(state.select).select2("close").select2("destroy");
      state.dispose();
      pickers.delete(state.select);
      pickers.delete(state.field);
    }
  };
})(typeof window !== "undefined" ? window : this);
