window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments)};gtag("js", new Date());gtag("set", "developer_id.dMDhkMT", true);gtag('consent', 'default', {ad_storage: 'denied','ad_user_data': 'denied','ad_personalization': 'denied','ads_data_redaction': true});
gtag('set', {'allow_google_signals': false,'allow_ad_personalization_signals': false});gtag("config", "UA-180241214-1", {"groups":"default","cookie_domain":"cdar.berkeley.edu","anonymize_ip":true});gtag("config", "G-08JSVH8JY3", {"groups":"default","cookie_domain":"cdar.berkeley.edu","anonymize_ip":true});;
/**
 * @file
 */

(function ($) {

  'use strict';

  Drupal.extlink = Drupal.extlink || {};

  Drupal.extlink.attach = function (context, settings) {
    if (!settings.hasOwnProperty('extlink')) {
      return;
    }

    // Strip the host name down, removing ports, subdomains, or www.
    var pattern = /^(([^\/:]+?\.)*)([^\.:]{1,})((\.[a-z0-9]{1,253})*)(:[0-9]{1,5})?$/;
    var host = window.location.host.replace(pattern, '$2$3$6');
    var subdomain = window.location.host.replace(host, '');

    // Determine what subdomains are considered internal.
    var subdomains;
    if (settings.extlink.extSubdomains) {
      subdomains = '([^/]*\\.)?';
    }
    else if (subdomain === 'www.' || subdomain === '') {
      subdomains = '(www\\.)?';
    }
    else {
      subdomains = subdomain.replace('.', '\\.');
    }

    // Build regular expressions that define an internal link.
    var internal_link = new RegExp('^https?://([^@]*@)?' + subdomains + host, 'i');

    // Extra internal link matching.
    var extInclude = false;
    if (settings.extlink.extInclude) {
      extInclude = new RegExp(settings.extlink.extInclude.replace(/\\/, '\\'), 'i');
    }

    // Extra external link matching.
    var extExclude = false;
    if (settings.extlink.extExclude) {
      extExclude = new RegExp(settings.extlink.extExclude.replace(/\\/, '\\'), 'i');
    }

    // Extra external link CSS selector exclusion.
    var extCssExclude = false;
    if (settings.extlink.extCssExclude) {
      extCssExclude = settings.extlink.extCssExclude;
    }

    // Extra external link CSS selector explicit.
    var extCssExplicit = false;
    if (settings.extlink.extCssExplicit) {
      extCssExplicit = settings.extlink.extCssExplicit;
    }

    // Define the jQuery method (either 'append' or 'prepend') of placing the icon, defaults to 'append'.
    var extIconPlacement = settings.extlink.extIconPlacement || 'append';

    // Find all links which are NOT internal and begin with http as opposed
    // to ftp://, javascript:, etc. other kinds of links.
    // When operating on the 'this' variable, the host has been appended to
    // all links by the browser, even local ones.
    // In jQuery 1.1 and higher, we'd use a filter method here, but it is not
    // available in jQuery 1.0 (Drupal 5 default).
    var external_links = [];
    var mailto_links = [];
    $('a:not([data-extlink]), area:not([data-extlink])', context).each(function (el) {
      try {
        var url = '';
        if (typeof this.href == 'string') {
          url = this.href.toLowerCase();
        }
        // Handle SVG links (xlink:href).
        else if (typeof this.href == 'object') {
          url = this.href.baseVal;
        }
        if (url.indexOf('http') === 0
          && ((!url.match(internal_link) && !(extExclude && url.match(extExclude))) || (extInclude && url.match(extInclude)))
          && !(extCssExclude && $(this).is(extCssExclude))
          && !(extCssExclude && $(this).parents(extCssExclude).length > 0)
          && !(extCssExplicit && $(this).parents(extCssExplicit).length < 1)) {
          external_links.push(this);
        }
        // Do not include area tags with begin with mailto: (this prohibits
        // icons from being added to image-maps).
        else if (this.tagName !== 'AREA'
          && url.indexOf('mailto:') === 0
          && !(extCssExclude && $(this).parents(extCssExclude).length > 0)
          && !(extCssExplicit && $(this).parents(extCssExplicit).length < 1)) {
          mailto_links.push(this);
        }
      }
      // IE7 throws errors often when dealing with irregular links, such as:
      // <a href="node/10"></a> Empty tags.
      // <a href="http://user:pass@example.com">example</a> User:pass syntax.
      catch (error) {
        return false;
      }
    });

    if (settings.extlink.extClass) {
      Drupal.extlink.applyClassAndSpan(external_links, settings.extlink.extClass, extIconPlacement);
    }

    if (settings.extlink.mailtoClass) {
      Drupal.extlink.applyClassAndSpan(mailto_links, settings.extlink.mailtoClass, extIconPlacement);
    }

    if (settings.extlink.extTarget) {
      // Apply the target attribute to all links.
      $(external_links).attr('target', settings.extlink.extTarget);
      // Add rel attributes noopener and noreferrer.
      $(external_links).attr('rel', function (i, val) {
        // If no rel attribute is present, create one with the values noopener and noreferrer.
        if (val == null) {
          return 'noopener noreferrer';
        }
        // Check to see if rel contains noopener or noreferrer. Add what doesn't exist.
        if (val.indexOf('noopener') > -1 || val.indexOf('noreferrer') > -1) {
          if (val.indexOf('noopener') === -1) {
            return val + ' noopener';
          }
          if (val.indexOf('noreferrer') === -1) {
            return val + ' noreferrer';
          }
          // Both noopener and noreferrer exist. Nothing needs to be added.
          else {
            return val;
          }
        }
        // Else, append noopener and noreferrer to val.
        else {
          return val + ' noopener noreferrer';
        }
      });
    }

    Drupal.extlink = Drupal.extlink || {};

    // Set up default click function for the external links popup. This should be
    // overridden by modules wanting to alter the popup.
    Drupal.extlink.popupClickHandler = Drupal.extlink.popupClickHandler || function () {
      if (settings.extlink.extAlert) {
        return confirm(settings.extlink.extAlertText);
      }
    };

    $(external_links).click(function (e) {
      return Drupal.extlink.popupClickHandler(e, this);
    });
  };

  /**
   * Apply a class and a trailing <span> to all links not containing images.
   *
   * @param {object[]} links
   *   An array of DOM elements representing the links.
   * @param {string} class_name
   *   The class to apply to the links.
   * @param {string} icon_placement
   *   'append' or 'prepend' the icon to the link.
   */
  Drupal.extlink.applyClassAndSpan = function (links, class_name, icon_placement) {
    var $links_to_process;
    if (Drupal.settings.extlink.extImgClass) {
      $links_to_process = $(links);
    }
    else {
      var links_with_images = $(links).find('img').parents('a');
      $links_to_process = $(links).not(links_with_images);
    }
    // Add data-extlink attribute.
    $links_to_process.attr('data-extlink', '');
    var i;
    var length = $links_to_process.length;
    for (i = 0; i < length; i++) {
      var $link = $($links_to_process[i]);
      if ($link.css('display') === 'inline' || $link.css('display') === 'inline-block') {
        if (Drupal.settings.extlink.extUseFontAwesome) {
          if (class_name === Drupal.settings.extlink.mailtoClass) {
            $link[icon_placement]('<span class="fa-' + class_name + ' extlink"><span class="fa fa-envelope-o" title="' + Drupal.settings.extlink.mailtoLabel + '"></span><span class="element-invisible">' + Drupal.settings.extlink.mailtoLabel + '</span></span>');
          }
          else {
            $link[icon_placement]('<span class="fa-' + class_name + ' extlink"><span class="fa fa-external-link" title="' + Drupal.settings.extlink.extLabel + '"></span><span class="element-invisible">' + Drupal.settings.extlink.extLabel + '</span></span>');
          }
        }
        else {
          if (class_name === Drupal.settings.extlink.mailtoClass) {
            $link[icon_placement]('<span class="' + class_name + '"><span class="element-invisible">' + Drupal.settings.extlink.mailtoLabel + '</span></span>');
          }
          else {
            $link[icon_placement]('<span class="' + class_name + '"><span class="element-invisible">' + Drupal.settings.extlink.extLabel + '</span></span>');
          }
        }
      }
    }
  };

  Drupal.behaviors.extlink = Drupal.behaviors.extlink || {};
  Drupal.behaviors.extlink.attach = function (context, settings) {
    // Backwards compatibility, for the benefit of modules overriding extlink
    // functionality by defining an "extlinkAttach" global function.
    if (typeof extlinkAttach === 'function') {
      extlinkAttach(context);
    }
    else {
      Drupal.extlink.attach(context, settings);
    }
  };

})(jQuery);
;
(function ($) {

/**
 * Attaches sticky table headers.
 */
Drupal.behaviors.tableHeader = {
  attach: function (context, settings) {
    if (!$.support.positionFixed) {
      return;
    }

    $('table.sticky-enabled', context).once('tableheader', function () {
      $(this).data("drupal-tableheader", new Drupal.tableHeader(this));
    });
  }
};

/**
 * Constructor for the tableHeader object. Provides sticky table headers.
 *
 * @param table
 *   DOM object for the table to add a sticky header to.
 */
Drupal.tableHeader = function (table) {
  var self = this;

  this.originalTable = $(table);
  this.originalHeader = $(table).children('thead');
  this.originalHeaderCells = this.originalHeader.find('> tr > th');
  this.displayWeight = null;

  // React to columns change to avoid making checks in the scroll callback.
  this.originalTable.bind('columnschange', function (e, display) {
    // This will force header size to be calculated on scroll.
    self.widthCalculated = (self.displayWeight !== null && self.displayWeight === display);
    self.displayWeight = display;
  });

  // Clone the table header so it inherits original jQuery properties. Hide
  // the table to avoid a flash of the header clone upon page load.
  this.stickyTable = $('<table class="sticky-header"/>')
    .insertBefore(this.originalTable)
    .css({ position: 'fixed', top: '0px' });
  this.stickyHeader = this.originalHeader.clone(true)
    .hide()
    .appendTo(this.stickyTable);
  this.stickyHeaderCells = this.stickyHeader.find('> tr > th');

  this.originalTable.addClass('sticky-table');
  $(window)
    .bind('scroll.drupal-tableheader', $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    .bind('resize.drupal-tableheader', { calculateWidth: true }, $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    // Make sure the anchor being scrolled into view is not hidden beneath the
    // sticky table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceAnchor.drupal-tableheader', function () {
      window.scrollBy(0, -self.stickyTable.outerHeight());
    })
    // Make sure the element being focused is not hidden beneath the sticky
    // table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceFocus.drupal-tableheader', function (event) {
      if (self.stickyVisible && event.clientY < (self.stickyOffsetTop + self.stickyTable.outerHeight()) && event.$target.closest('sticky-header').length === 0) {
        window.scrollBy(0, -self.stickyTable.outerHeight());
      }
    })
    .triggerHandler('resize.drupal-tableheader');

  // We hid the header to avoid it showing up erroneously on page load;
  // we need to unhide it now so that it will show up when expected.
  this.stickyHeader.show();
};

/**
 * Call the header offset function to prevent use of eval().
 *
 * @param accessor
 *   The callback function name.
 * @return
 *   The callback result.
 */
Drupal.tableHeader.callHeaderOffsetFunction = function(accessor) {
  accessor = accessor.split('.');
  var callback = window;
  for (var i = 0, len = accessor.length - 1; i < len; i++) {
    if (typeof callback[accessor[i]] !== 'function' && typeof callback[accessor[i]] != 'object') {
      return 0;
    }
    callback = callback[accessor[i]];
  }
  if (typeof callback[accessor[accessor.length - 1]] === 'function') {
    return callback[accessor[accessor.length - 1]]();
  }
  return 0;
};

/**
 * Event handler: recalculates position of the sticky table header.
 *
 * @param event
 *   Event being triggered.
 */
Drupal.tableHeader.prototype.eventhandlerRecalculateStickyHeader = function (event) {
  var self = this;
  var calculateWidth = event.data && event.data.calculateWidth;

  // Reset top position of sticky table headers to the current top offset.
  this.stickyOffsetTop = Drupal.settings.tableHeaderOffset ? Drupal.tableHeader.callHeaderOffsetFunction(Drupal.settings.tableHeaderOffset) : 0;
  this.stickyTable.css('top', this.stickyOffsetTop + 'px');

  // Save positioning data.
  var viewHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  if (calculateWidth || this.viewHeight !== viewHeight) {
    this.viewHeight = viewHeight;
    this.vPosition = this.originalTable.offset().top - 4 - this.stickyOffsetTop;
    this.hPosition = this.originalTable.offset().left;
    this.vLength = this.originalTable[0].clientHeight - 100;
    calculateWidth = true;
  }

  // Track horizontal positioning relative to the viewport and set visibility.
  var hScroll = document.documentElement.scrollLeft || document.body.scrollLeft;
  var vOffset = (document.documentElement.scrollTop || document.body.scrollTop) - this.vPosition;
  this.stickyVisible = vOffset > 0 && vOffset < this.vLength;
  this.stickyTable.css({ left: (-hScroll + this.hPosition) + 'px', visibility: this.stickyVisible ? 'visible' : 'hidden' });

  // Only perform expensive calculations if the sticky header is actually
  // visible or when forced.
  if (this.stickyVisible && (calculateWidth || !this.widthCalculated)) {
    this.widthCalculated = true;
    var $that = null;
    var $stickyCell = null;
    var display = null;
    var cellWidth = null;
    // Resize header and its cell widths.
    // Only apply width to visible table cells. This prevents the header from
    // displaying incorrectly when the sticky header is no longer visible.
    for (var i = 0, il = this.originalHeaderCells.length; i < il; i += 1) {
      $that = $(this.originalHeaderCells[i]);
      $stickyCell = this.stickyHeaderCells.eq($that.index());
      display = $that.css('display');
      if (display !== 'none') {
        cellWidth = $that.css('width');
        // Exception for IE7.
        if (cellWidth === 'auto') {
          cellWidth = $that[0].clientWidth + 'px';
        }
        $stickyCell.css({'width': cellWidth, 'display': display});
      }
      else {
        $stickyCell.css('display', 'none');
      }
    }
    this.stickyTable.css('width', this.originalTable.outerWidth());
  }
};

})(jQuery);
;
