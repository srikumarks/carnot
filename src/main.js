org = typeof(org) === 'undefined' ? {} : org;
org.sriku = org.sriku || {};

org.sriku.Carnot = (function (Carnot) {

    var GLOBAL = this;

#include "eventable.js"

    Carnot = Eventable(Carnot);

#include "parser.js"
#include "svg-renderer.js"

    Carnot['renderSections'] = function (sectionSelector, style) {
        style = style || {};
        var sections = (typeof(sectionSelector) === 'string' 
            ? GLOBAL.document.querySelectorAll(sectionSelector)
            : sectionSelector);

        WARNIF(sections.length === 0, "Carnot: No sections to render.");
        
        var svgs = [], i, N;
        sections = Array.prototype.slice.call(sections);
        sections.forEach(function (s) { return s.hidden = true; }); // Hide them all first.
        for (i = 0, N = sections.length; i < N; ++i) {
            svgs.push(RenderSVG(GLOBAL, sections[i], Parse(sections[i]), style));
            Carnot.emit('rendered_section', svgs[i]);
        }

        Carnot.emit('render_complete', svgs);
    };

    Carnot['renderPage'] = function (style) {
        if (GLOBAL.document.readyState === 'interactive') {
            setTimeout(Carnot.renderSections, 0, findCarnotSections(), style);
        } else {
            GLOBAL.document.addEventListener('readystatechange', function () {
                if (GLOBAL.document.readyState === 'interactive') {
                    Carnot.renderSections('pre.carnot_section', style);
                    GLOBAL.document.removeEventListener('readystatechange', arguments.callee);
                }
            });
        }
    };

    // Search for <pre> tags with class "carnot_section",
    // or pre tags which begin with the line - "tala pattern = ..."
    // and don't have class "carnot_ignore".
    function findCarnotSections() {
        var explicitSections = GLOBAL.document.querySelectorAll('pre.carnot_section');
        var sections = Array.prototype.slice.call(explicitSections);

        var allPreTags = GLOBAL.document.querySelectorAll('pre');
        var i, N, pre;
        for (i = 0, N = allPreTags.length; i < N; ++i) {
            pre = allPreTags[i];
            if (!pre.classList.contains('carnot_ignore')) {
                if (/^\s*tala\s+pattern\s*=/.test(pre.textContent)) {
                    // Starts with "tala pattern = " and does not
                    // have class "carnot_ignore", so we consider it
                    // to be a carnot_section.
                    sections.push(pre);
                }
            }
        }

        return sections;
    }

    function renderDocWithStyle() {
        var style = GLOBAL.document.querySelector('pre.carnot_style');
        if (style) {
            style.hidden = true;
            style = Parse(style)[0].properties;
        } else {
            style = {};
        }

        Carnot.renderPage(style);
    }

    // If a "carnot_style" class pre is present, load it up
    // and immediately begin rendering. Otherwise wait for
    // an explicit Carnot.render call.
    if (GLOBAL.document.readyState === "interactive") {
        renderDocWithStyle();
    } else {
        GLOBAL.document.addEventListener('readystatechange', function () {
            if (GLOBAL.document.readyState === 'interactive') {
                renderDocWithStyle();
                GLOBAL.document.removeEventListener('readystatechange', arguments.callee);
            }
        });
    }

    return Carnot;

}({}));

