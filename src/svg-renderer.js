
/*
 * Customization options available -
 *
 * tala pattern = || , , , , | , , | , , ||
 * aksharas per line = 8
 * aksharas = aksharas per line
 * line spacing = 22
 * para spacing = 22
 * notation font size = 13
 * notation small font size = 11
 * notation font = serif
 * text font = serif
 * stretch = 1.0
 * stretch space = 1.0
 * margin top = 22
 * margin left = 10
 * line extension top = 0
 * line extension bottom = 5
 *
 */

var kSvarasthanaTokenGlobalSearchRE = new RegExp(kSvarasthanaREStr, "g");

var kSvaraOctaveSuffix = {
    overdot: String.fromCharCode(parseInt("0307", 16)),
    overddot: String.fromCharCode(parseInt("0308", 16)),
    underdot: String.fromCharCode(parseInt("0323", 16)),
    underddot: String.fromCharCode(parseInt("0324", 16))
};

function RenderSVG(window, paragraphs, style) {

    var keyTalaPattern = '$tala pattern';
    var keyAksharasPerLine = '$aksharas per line';
    var keyAksharas = '$aksharas';
    var keyLineSpacing = '$line spacing';
    var keyParaSpacing = '$para spacing';
    var keyNotationFontSize = '$notation font size';
    var keyNotationSmallFontSize = '$notation small font size';
    var keyNotationFont = '$notation font';
    var keyTextFont = '$text font';
    var keyStretch = '$stretch';
    var keyStretchSpace = '$stretch space';
    var keyMarginTop = '$margin top';
    var keyMarginLeft = '$margin left';
    var keyLineExtensionTop = '$line extension top';
    var keyLineExtensionBottom = '$line extension bottom';

    var talaCache = {};
    var cursor = {x: 0, y: 0, xmax: 0, ymax: 0};
    var pendingLines = {};

    loadStyleDefaults(style);

    cursor.y = style[keyMarginTop];
    cursor.x = style[keyMarginLeft];

    processTalaPatterns(paragraphs);

    var div = window.document.createElement('div');
    var svgns = 'http://www.w3.org/2000/svg';
    var svg;
    var commitSVG = function (makeNew) {
        if (svg) {
            svg.setAttribute('width', cursor.xmax);
            svg.setAttribute('height', cursor.ymax);
            div.style.width = ''+cursor.xmax+'px';
        }
        if (makeNew) {
            svg = window.document.createElementNS(svgns, 'svg');
            div.appendChild(svg);
            cursor.y = style[keyMarginTop];
            cursor.x = style[keyMarginLeft];
            cursor.xmax = 0;
            cursor.ymax = 0;
        }
    };

    commitSVG(true);
    paragraphs.forEach(typesetPara);

    function extendLine(ix, x, fromY, toY) {
        var l = pendingLines[ix];
        if (!l) {
            l = pendingLines[ix] = {x: x, fromY: fromY, toY: toY};
        }

        l.toY = toY;
    }

    function flushLines() {
        var ix, l;
        for (ix in pendingLines) {
            if (pendingLines.hasOwnProperty(ix)) {
                l = pendingLines[ix];
                svgelem(svg, 'line', {
                    x1: l.x, 
                    y1: l.fromY,
                    x2: l.x, 
                    y2: l.toY,
                    'stroke-width': 2, 
                    stroke: 'black'
                });
            }
        }
        pendingLines = {};
    }

    function typesetPara(para, i) {
        if (para.lines) {
            para.lines.forEach(function (line) { typesetLine(para, line); });
            flushLines();
            commitSVG(i + 1 < paragraphs.length);
        }
    }

    function typesetLine(para, line) {
        switch (line.type) {
            case 'text': 
                flushLines();
                typesetText(para, line); 
                break;
            case 'svarasthana': 
                typesetSvarasthana(para, line); 
                break;
            case 'lyrics': 
                typesetLyrics(para, line); 
                break;
            default:
                throw new Error('Unknown line type ' + line.type);
        }
    }

    function typesetText(para, line) {
        svgelem(svg, 'text', {x: cursor.x, y: cursor.y, style: ('font-family: ' + style[keyTextFont] + ';') + 'font-size: 12pt;'}, line.tokens.join(' '));
        nextLine();
        cursor.y += style[keyLineExtensionTop] + style[keyLineExtensionBottom];
    }

    function typesetSvarasthana(para, line) {
        typesetTimedText(para, line);
    }

    function getSubSvaras(word) {
        return word.match(kSvarasthanaTokenGlobalSearchRE) || [];
    }

    function getSyllables(word) {
        var parts = [];
        var lastIx, i, N, c;
        for (i = 0, lastIx = 0, N = word.length; i < N; ++i) {
            c = word.charAt(i);
            if (c === ',' || c === '_') {
                if (i > lastIx) {
                    parts.push(word.substring(lastIx, i));
                }
                lastIx = i + 1;
                parts.push(c);
            }
        }
        if (i > lastIx) {
            parts.push(word.substring(lastIx, i));
        }
        return parts;
    }

    function typesetTimedText(para, line, additionalTextStyle) {
        var tala = para.properties[keyTalaPattern];
        var akshIx = 0, instrIx = 0, tokIx = 0, instr;

        // Skip aksharas until start
        while (akshIx < para.tala_interval.from) {
            if (tala.instructions[instrIx].tick) {
                akshIx++;
            }
            instrIx++;
        }

        // Skip all spaces
        while (instrIx < tala.instructions.length && tala.instructions[instrIx].space) {
            ++instrIx;
        }

        var givenAksharas = +(para.properties[keyAksharas] || para.properties[keyAksharasPerLine]);
        var startAkshIx = akshIx;
        var startInstrIx = instrIx;
        var subdivs = line.tokens.length / givenAksharas;
        var stretch = (+para.properties[keyStretch]) * style[keyStretch];
        var stretchSpace = stretch * ((+para.properties[keyStretchSpace]) || style[keyStretchSpace]);
        var textStyleBase = ('font-family:' + (line.type === 'lyrics' ? 'serif' : style[keyNotationFont]) + ';') + (additionalTextStyle || '');
        var notationFontSizes = [
            style[keyNotationFontSize],
            (+(para.properties[keyNotationSmallFontSize] || style[keyNotationSmallFontSize]))
            ];
        notationFontSizes.push(notationFontSizes[1] - (notationFontSizes[0] - notationFontSizes[1]));

        var fontSize = function (n) {
//            return 'font-size:' + Math.max(8,Math.ceil(style[keyNotationFontSize]/Math.log(Math.max(1,n)))) + 'pt;';
            return 'font-size: ' + notationFontSizes[n > 6 ? 2 : (n > 2 ? 1 : 0)] + 'pt;';
        };
        var textStyle = textStyleBase + fontSize(subdivs);
        var subDivIx = 0;
        var subsvaras, props, dx;
        var isSvarasthana = line.type === 'svarasthana';

        REQUIRE(subdivs % 1.0 < 0.00001, "Invalid subdivision");
        subdivs = Math.floor(subdivs);
        props = {x: cursor.x, y: cursor.y, style: textStyle};

        var renderSubsvara = function (s) {
            svgelem(svg, 'text', props, showSvara(s));
            props.x += dx / subsvaras.length;
        };

        var renderSubSyllable = function (s) {
            svgelem(svg, 'text', props, showSyllable(s));
            props.x += dx / subsvaras.length;
        };

        while (akshIx < para.tala_interval.to) {
            instr = tala.instructions[instrIx];
            if (instr.tick) {
                dx = instr.tick * stretch / subdivs;
                props.x = cursor.x;
                props.y = cursor.y;
                props.style = textStyle;
                if (isSvarasthana) {
                    subsvaras = getSubSvaras(line.tokens[tokIx]);
                    props.style = textStyleBase + fontSize((subsvaras.length > 2 ? subsvaras.length : 1) * subdivs);
                    subsvaras.forEach(renderSubsvara);
                } else {
                    subsvaras = getSyllables(line.tokens[tokIx]);
                    props.style = textStyleBase + fontSize(subdivs);
                    subsvaras.forEach(renderSubSyllable);
                }
                cursor.x += dx;
                ++subDivIx;
                ++tokIx;
                if (subDivIx >= subdivs) {
                    subDivIx = 0;
                    ++akshIx;
                    ++instrIx;
                } else {
                    continue;
                }
            } 

            // Consume other non-tick instructions up to the next tick.
            while (instrIx < tala.instructions.length && (instr = tala.instructions[instrIx], !instr.tick)) {
                if (instr.space) {
                    if (instr.scale) {
                        cursor.x += instr.space * stretchSpace;
                    } else {
                        cursor.x += instr.space;
                    }
                } else if (instr.line) {
                    if (instr.draw) {
                        extendLine(instrIx, 
                                cursor.x, 
                                cursor.y - style[keyLineSpacing] - style[keyLineExtensionTop],
                                cursor.y + style[keyLineExtensionBottom]);
                    }
                    cursor.x += instr.line;
                }
                instr = tala.instructions[++instrIx];
            }
        }

        nextLine();
    }

    function typesetLyrics(para, line) {
        typesetTimedText(para, line, 'font-style: italic;');
    }

    function nextLine(spacingKey) {
        cursor.y += style[spacingKey || keyLineSpacing];
        cursor.ymax = Math.max(cursor.y, cursor.ymax);
        cursor.xmax = Math.max(cursor.x + 40, cursor.xmax);
        cursor.x = style[keyMarginLeft];
    }

    // Augment each "paragraph" with information about
    // where in the tala cycle it begins and where it
    // ends.
    //
    // Adds "tala_interval" property, which is an object
    // of the form {from: m, to:n}, where the aksharas
    // included are k >= m & k < n.
    function processTalaPatterns(paragraphs) {
        var fromAkshara = 0, toAkshara = 0, aksharas = 0, aksharasInTala = 0, aksharasPerLine = 0;

        var i, N, para, tala, aksh;

        for (i = 0, N = paragraphs.length; i < N; ++i) {

            para = paragraphs[i];
            tala = para.properties[keyTalaPattern];

            aksharasInTala = countAksharasInTala(tala);
            aksharasPerLine = +(para.properties[keyAksharasPerLine]);
            aksharas = +(para.properties[keyAksharas] || para.properties[keyAksharasPerLine]);
            

            toAkshara += aksharas;

            // Repeat the tala pattern enough times to cover the given notation line.
            aksh = aksharasInTala;
            while (toAkshara > aksh) {
                para.properties[keyTalaPattern] += tala;
                aksh += aksharasInTala;
            }

            // On repetition, you may find patterns such as '||||' in the tala.
            // This we normalize to '||' - i.e. the maximum number of times a vertical
            // bar may be repeated is 2.
            tala = para.properties[keyTalaPattern] = compileTala(para.properties[keyTalaPattern].replace(/\|\|+/g, '||'));

            var paraAksharas = +(para.properties[keyAksharas] || para.properties[keyAksharasPerLine]);

            // Adjust notation lines whose akshara count is smaller than
            // the given aksharas per line. We do this by stretching the
            // line by an integer factor.
            para.lines.forEach(function (line) {
                if (line.type !== 'text') {
                    if (line.tokens.length < paraAksharas) {
                        //ASSERT(aksh % line.tokens.length === 0);
                        var i, j, M, E, N, newTokens = [];
                        M = Math.floor(aksh / line.tokens.length);
                        E = Math.round(aksh - M * line.tokens.length); 
                                // Insert additional gaps so that we 
                                // render something instead of giving up.
                        for (i = 0, N = line.tokens.length; i < N; ++i) {
                            newTokens.push(line.tokens[i]);
                            for (j = 1; j < M; ++j) {
                                newTokens.push('_');
                            }
                        }
                        for (i = 0; i < E; ++i) {
                            newTokens.push('_');
                        }
                        line.tokens = newTokens;
                    }
                }
            });

            para.tala_interval = {
                from: fromAkshara,
                to: toAkshara
            };

            // Modulo tala cycle.
            fromAkshara = toAkshara;
            while (fromAkshara >= aksharasInTala) {
                fromAkshara -= aksharasInTala;
                toAkshara -= aksharasInTala;
            }
        }

        return paragraphs;
    }

    function compileTala(talaPattern) {
        var talaKey = '$' + talaPattern;
        
        if (talaKey in talaCache) {
            return talaCache[talaKey];
        }

        var i, N, c, instrs = [], nearLine;
        for (i = 0, N = talaPattern.length; i < N; ++i) {
            c = talaPattern.charAt(i);
            nearLine = (i + 1 < N && talaPattern.charAt(i+1) === '|') || (i > 0 && talaPattern.charAt(i-1) === '|');
            switch (c) {
                case '|' : 
                    if (nearLine) {
                        instrs.push({line: 5, draw: true});
                    } else {
                        instrs.push({line: 10, draw: true}); 
                    }
                    break;
                case ' ':
                    if (nearLine) {
                        instrs.push({space: 15, scale: false});
                    } else {
                        instrs.push({space: 30, scale: true});
                    }
                    break;
                case ',':
                    instrs.push({tick: 40});
                    break;
                case '_':
                    instrs.push({line: 10, draw: false});
                    break;
                default:
                    throw new Error('Unknown pattern character [' + c + '] in tala - "' + talaPattern + '"');
            }
        }

        return (talaCache[talaKey] = {
            pattern: talaPattern,
            aksharas: countAksharasInTala(talaPattern),
            instructions: instrs
        });
    }

    function countAksharasInTala(talaPattern) {
        var commas = talaPattern.match(/,/g);
        var num = (commas && commas.length) || 0;
        REQUIRE(num > 0, "At least one akshara is required in a tala");
        return num;
    }

    function showSvara(text) {
        if (text === '_') {
            return "";
        } 

        switch (text.length) {
            case 3: 
                if (text[1] === '+' && text[2] === '+') {
                    return text[0] + kSvaraOctaveSuffix.overddot;
                } else if (text[1] === '-' && text[2] === '-') {
                    return text[0] + kSvaraOctaveSuffix.underddot;
                } else {
                    return text;
                }
            case 2:
                if (text[1] === '+') {
                    return text[0] + kSvaraOctaveSuffix.overdot;
                } else if (text[1] === '-') {
                    return text[0] + kSvaraOctaveSuffix.underdot;
                } else {
                    return text;
                }
            default:
                return text;
        }
    }
    
    function showSyllable(text) {
        if (text === '_') {
            return "";
        } else {
            return text;
        }
    }

    function svgelem(elem, n, attrs, content) {
        var tag = window.document.createElementNS('http://www.w3.org/2000/svg', n);
        if (attrs) {
            Object.keys(attrs).forEach(function (k) {
                if (attrs[k]) {
                    tag.setAttribute(k, attrs[k]);
                }
            });
        }
        if (content) {
            tag.textContent = content;
        }
        elem.appendChild(tag);
        return tag;
    }

    function loadStyleDefaults(style) {
        style[keyLineSpacing] = (+style[keyLineSpacing]) || 22;
        style[keyParaSpacing] = (+style[keyParaSpacing]) || style[keyLineSpacing];
        style[keyNotationFontSize] = (+style[keyNotationFontSize]) || 13;
        style[keyNotationSmallFontSize] = (+style[keyNotationSmallFontSize]) || (style[keyNotationFontSize] - 2);
        style[keyNotationFont] = (style[keyNotationFont] || 'sans-serif');
        style[keyTextFont] = (style[keyTextFont] || 'serif');
        style[keyStretch] = (+style[keyStretch]) || 1.0;
        style[keyStretchSpace] = (+style[keyStretchSpace]) || 1.0;
        style[keyMarginTop] = (+style[keyMarginTop]) || style[keyLineSpacing];
        style[keyMarginLeft] = (+style[keyMarginLeft]) || 10;
        style[keyLineExtensionTop] = (+style[keyLineExtensionTop]) || 0;
        style[keyLineExtensionBottom] = (+style[keyLineExtensionBottom]) || 5;
    }

    return div;
}
