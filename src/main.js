org = typeof(org) === 'undefined' ? {} : org;
org.sriku = org.sriku || {};

org.sriku.Carnot = (function (Carnot) {

    var GLOBAL = this;

#include "eventable.js"

    Carnot = Eventable(Carnot);

#include "parser.js"
#include "svg-renderer.js"

    // notation = text
    // style = object
    // => svg element
    Carnot['renderNotation'] = function (notation, style) {
        style = style || {};

        var pre = GLOBAL.document.createElement('pre');
        pre.textContent = notation;

        return RenderSVG(GLOBAL, Parse(pre), style);
    };

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
            svgs.push(RenderSVG(GLOBAL, Parse(sections[i]), style));
            sections[i].parentElement.insertBefore(svgs[i], sections[i]);
            Carnot.emit('rendered_section', svgs[i]);
        }

        Carnot.emit('render_complete', svgs);
    };

    Carnot['renderPage'] = function (style) {
        if (GLOBAL.document.readyState === 'interactive') {
            setTimeout(Carnot.renderSections, 0, findSections(GLOBAL.document), style);
        } else {
            GLOBAL.document.addEventListener('readystatechange', function () {
                if (GLOBAL.document.readyState === 'interactive') {
                    Carnot.renderSections('pre.carnot_section', style);
                    GLOBAL.document.removeEventListener('readystatechange', arguments.callee);
                }
            });
        }
    };

    Carnot['findSections'] = findSections;
    Carnot['scanStyle'] = scanStyle;

    // Search for <pre> tags with class "carnot_section",
    // or pre tags which begin with the line - "tala pattern = ..."
    // and don't have class "carnot_ignore".
    function findSections(topNode) {
        topNode = topNode || GLOBAL.document;
        var explicitSections = topNode.querySelectorAll('pre.carnot_section');
        var sections = Array.prototype.slice.call(explicitSections);

        var allPreTags = topNode.querySelectorAll('pre');
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

    function scanStyle(topNode) {
        topNode = topNode || GLOBAL.document;
        var style = topNode.querySelector('pre.carnot_style');
        if (style) {
            style.hidden = true;
            style = Parse(style);
            return style[style.length - 1].properties;
        } else {
            return {};
        }
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

