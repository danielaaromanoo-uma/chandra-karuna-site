/* Chandra Karuna Yoga School — content loader
   Fetches JSON files edited via the /admin CMS and applies them to the page.
   Safe to include on every page: each page only has the element IDs relevant to it,
   so unrelated fetches simply find nothing to update. */

(function () {
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && value != null) el.textContent = value;
  }

  function renderList(id, items) {
    var el = document.getElementById(id);
    if (!el || !Array.isArray(items)) return;
    el.innerHTML = items.map(function (item) {
      return '<li>' + item + '</li>';
    }).join('');
  }

  function fetchJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Failed to load ' + path);
      return r.json();
    }).catch(function (err) {
      console.warn(err);
      return null;
    });
  }

  // ---- Site-wide settings (WhatsApp, email, Instagram) ----
  fetchJSON('content/settings.json').then(function (data) {
    if (!data) return;

    document.querySelectorAll('.js-whatsapp-link').forEach(function (a) {
      a.setAttribute('href', data.whatsappLink);
      if (a.children.length === 0) a.textContent = data.whatsappDisplay;
    });

    document.querySelectorAll('.js-email-link').forEach(function (a) {
      a.setAttribute('href', 'mailto:' + data.email);
      if (a.children.length === 0) a.textContent = data.email;
    });

    document.querySelectorAll('.js-instagram-link').forEach(function (a) {
      a.setAttribute('href', data.instagramUrl);
      if (a.children.length === 0) a.textContent = data.instagramHandle;
    });

    // Contact page's text-based Instagram link (no icon, special id)
    var igText = document.getElementById('settings-instagram-link');
    if (igText) {
      igText.setAttribute('href', data.instagramUrl);
      igText.textContent = data.instagramHandle;
    }
  });

  // ---- Homepage hero ----
  fetchJSON('content/homepage.json').then(function (data) {
    if (!data) return;
    var headline = document.getElementById('hero-headline');
    if (headline && data.heroHeadline) {
      headline.innerHTML = data.heroHeadline
        .split('\n')
        .map(function (line) {
          var d = document.createElement('div');
          d.textContent = line;
          return d.innerHTML;
        })
        .join('<br>');
    }
    setText('hero-tagline', data.heroTagline);
  });

  // ---- 200-Hour Training dates & price ----
  fetchJSON('content/training-200hr.json').then(function (data) {
    if (!data) return;

    // Homepage summary
    var hpCR = document.getElementById('hp-200-cr-date');
    if (hpCR) hpCR.textContent = data.costaRicaDate + ' \u00b7 Puerto Viejo, Costa Rica';
    var hpIT = document.getElementById('hp-200-it-date');
    if (hpIT) hpIT.textContent = data.tuscanyDate + ' \u00b7 Tuscany, Italy';

    // Trainings page detail
    renderList('tr-200-cr-dates', [data.costaRicaDate]);
    renderList('tr-200-it-dates', [data.tuscanyDate]);
    setText('price-200-regular', 'Investment: ' + data.price);
    setText('price-200-earlybird', 'Early bird (booked 3 months before the course starts): ' + data.earlyBirdPrice);
  });

  // ---- Yin Yoga Training dates & prices ----
  fetchJSON('content/training-yin.json').then(function (data) {
    if (!data) return;

    // Homepage summary
    renderList('hp-yin-cr-dates', data.costaRica && data.costaRica.dates);
    renderList('hp-yin-it-dates', data.italy && data.italy.dates);

    // Trainings page detail
    renderList('tr-yin-cr-dates', data.costaRica && data.costaRica.dates);
    setText('price-yin-cr', data.costaRica && data.costaRica.price);
    setText('price-yin-cr-eb', data.costaRica && data.costaRica.earlyBird);

    renderList('tr-yin-it-dates', data.italy && data.italy.dates);
    setText('price-yin-it', data.italy && data.italy.price);
    setText('price-yin-it-eb', data.italy && data.italy.earlyBird);
  });

  // ---- Photos ----
  fetchJSON('content/images.json').then(function (data) {
    if (!data) return;

    document.querySelectorAll('.js-logo-img').forEach(function (img) {
      if (data.logo) img.setAttribute('src', data.logo);
    });

    var map = {
      'hero-video-el': data.heroPoster ? { attr: 'poster', value: data.heroPoster } : null,
      'img-approach-photo': data.approachPhoto,
      'img-cta-photo': data.ctaPhoto,
      'img-team-daniela': data.teamDaniela,
      'img-team-dani': data.teamDani,
      'img-hybrid-photo': data.hybridPhoto,
      'img-yin-photo': data.yinPhoto
    };

    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var entry = map[id];
      if (!entry) return;
      if (typeof entry === 'object' && entry.attr) {
        el.setAttribute(entry.attr, entry.value);
      } else if (typeof entry === 'string') {
        el.setAttribute('src', entry);
      }
    });
  });

  // ---- Retreats (fully dynamic: grid + detail sections) ----
  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  var retreatsGrid = document.getElementById('retreats-grid');
  var retreatsDetail = document.getElementById('retreats-detail-container');
  if (retreatsGrid || retreatsDetail) {
    fetchJSON('content/retreats-index.json').then(function (retreats) {
      if (!retreats || !Array.isArray(retreats)) return;

      if (retreatsGrid) {
        retreatsGrid.innerHTML = retreats.map(function (r) {
          var dateBlock = r.status === 'upcoming' && r.dateRange
            ? '<div class="retreat-dates">' + escapeHtml(r.dateRange) + '<br>' + escapeHtml(r.location) + '</div>'
            : '<div class="coming-soon">Coming soon.</div>';
          var card =
            '<div class="retreat-card-body">' +
              '<h3>' + escapeHtml(r.title) + '</h3>' +
              '<p class="blurb">' + escapeHtml(r.cardBlurb || r.location || '') + '</p>' +
              dateBlock +
            '</div>';
          var img = '<img src="' + escapeHtml(r.image) + '" alt="' + escapeHtml(r.title) + '">';
          if (r.hasDetail && r.slug) {
            return '<a class="retreat-card" href="#' + escapeHtml(r.slug) + '" style="text-decoration:none;color:inherit;display:block;">' + img + card + '</a>';
          }
          return '<div class="retreat-card">' + img + card + '</div>';
        }).join('');
      }

      if (retreatsDetail) {
        retreatsDetail.innerHTML = retreats.filter(function (r) { return r.hasDetail; }).map(function (r) {
          var bodyHtml = (r.body || []).map(function (p) { return '<p>' + escapeHtml(p) + '</p>'; }).join('');
          var offeringsHtml = (r.offerings && r.offerings.length)
            ? '<div class="offerings-box">' + r.offerings.map(function (o) { return '<p>' + escapeHtml(o) + '</p>'; }).join('') + '</div>'
            : '';
          var dateLoc = r.dateRange ? escapeHtml(r.dateRange) + ' &nbsp;|&nbsp; ' + escapeHtml(r.location) : escapeHtml(r.location);
          return (
            '<section class="bg-deep" id="' + escapeHtml(r.slug) + '">' +
              '<div class="wrap">' +
                '<div class="retreat-detail-head">' +
                  '<span class="eyebrow">' + escapeHtml(r.eyebrow || r.title) + '</span>' +
                  '<span class="retreat-dates-loc">' + dateLoc + '</span>' +
                '</div>' +
                (r.tagline ? '<p class="retreat-tagline">' + escapeHtml(r.tagline) + '</p>' : '') +
                '<div class="retreat-body">' + bodyHtml + '</div>' +
                offeringsHtml +
                '<div class="detail-cta" style="margin-top:36px;">' +
                  '<a href="contact.html" class="btn solid">Book Your Intro Call</a>' +
                '</div>' +
              '</div>' +
            '</section>'
          );
        }).join('');
      }
    });
  }
})();
