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
        var sections = GLOBAL.document.querySelectorAll(sectionSelector);
        var svgs = [], i, N;
        sections = Array.prototype.slice.call(sections);
        sections.forEach(function (s) { return s.hidden = true; }); // Hide them all first.
        for (i = 0, N = sections.length; i < N; ++i) {
            svgs.push(RenderSVG(sections[i], Parse(sections[i]), style));
            Carnot.emit('rendered_section', svgs[i]);
        }

        Carnot.emit('render_complete', svgs);
    };

    Carnot['renderPage'] = function (style) {
        if (GLOBAL.document.readyState === 'interactive') {
            setTimeout(Carnot.renderSections, 0, 'pre.carnot_section', style);
        } else {
            GLOBAL.document.addEventListener('readystatechange', function () {
                if (GLOBAL.document.readyState === 'interactive') {
                    Carnot.renderSections('pre.carnot_section', style);
                    GLOBAL.document.removeEventListener('readystatechange', arguments.callee);
                }
            });
        }
    };

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

