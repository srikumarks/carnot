
/*
 * Customization options available -
 *
 * tala pattern = || , , , , | , , | , , ||
 * aksharas per line = 8
 * line spacing = 22
 * para spacing = 22
 * notation font size = 13
 * notation small font size = 11
 * notation font = serif
 * text font = serif
 * stretch = 1.6
 * margin top = 22
 * margin left = 10
 * line start offset = 0
 * line end offset = 5
 *
 */
function RenderSVG(section, paragraphs, style) {

    var keyTalaPattern = '$tala pattern';
    var keyAksharasPerLine = '$aksharas per line';
    var keyLineSpacing = '$line spacing';
    var keyParaSpacing = '$para spacing';
    var keyNotationFontSize = '$notation font size';
    var keyNotationSmallFontSize = '$notation small font size';
    var keyNotationFont = '$notation font';
    var keyTextFont = '$text font';
    var keyStretch = '$stretch';
    var keyMarginTop = '$margin top';
    var keyMarginLeft = '$margin left';
    var keyLineStartOffset = '$line start offset';
    var keyLineEndOffset = '$line end offset';

    var talaCache = {};
    var cursor = {x: 0, y: 0, xmax: 0, ymax: 0};

    loadStyleDefaults(style);

    section.hidden = true;
    cursor.y = style[keyMarginTop];
    cursor.x = style[keyMarginLeft];

    processTalaPatterns(paragraphs);

    var div = GLOBAL.document.createElement('div');
    var svg = GLOBAL.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    div.insertBefore(svg, null);
    
    paragraphs.forEach(typesetPara);

    svg.setAttribute('width', cursor.xmax);
    svg.setAttribute('height', cursor.ymax);

    section.parentElement.insertBefore(div, section);

    function typesetPara(para, i) {
        if (para.lines) {
            para.lines.forEach(function (line) { typesetLine(para, line); });
            if (i + 1 < paragraphs.length) {
                nextLine(keyParaSpacing);
            }
        }
    }

    function typesetLine(para, line) {
        switch (line.type) {
            case 'text': 
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
        cursor.y += style[keyLineStartOffset] + style[keyLineEndOffset];
    }

    function typesetSvarasthana(para, line) {
        typesetTimedText(para, line);
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

        var startAkshIx = akshIx;
        var startInstrIx = instrIx;
        var subdivs = line.tokens.length / (+para.properties[keyAksharasPerLine]);
        var textStyle = ('font-family:' + style[keyNotationFont] + ';') + ('font-size:' + (subdivs > 2 ? style[keyNotationSmallFontSize] : style[keyNotationFontSize]) + 'pt;') + (additionalTextStyle || '');
        var subDivIx = 0;
        var stretch = (+para.properties[keyStretch]) * style[keyStretch];

        REQUIRE(subdivs % 1.0 < 0.00001, "Invalid subdivision");
        subdivs = Math.floor(subdivs);

        while (akshIx < para.tala_interval.to) {
            instr = tala.instructions[instrIx];
            if (instr.tick) {
                svgelem(svg, 'text', {x: cursor.x, y: cursor.y, style: textStyle}, show(line.tokens[tokIx]));
                cursor.x += instr.tick * stretch / subdivs;
                ++subDivIx;
                ++tokIx;
                if (subDivIx < subdivs) {
                    continue;
                }
                subDivIx = 0;
                ++akshIx;
                ++instrIx;
            } 

            // Consume other non-tick instructions up to the next tick.
            while (instrIx < tala.instructions.length && (instr = tala.instructions[instrIx], !instr.tick)) {
                if (instr.space) {
                    if ((instrIx + 1 < tala.instructions.length && tala.instructions[instrIx+1].line)
                            || (instrIx > 0 && tala.instructions[instrIx-1].line)) {
                                cursor.x += instr.space;
                            } else {
                                cursor.x += instr.space * stretch;
                            }
                } else if (instr.line) {
                    if (instr.draw) {
                        svgelem(svg, 'line', {
                            x1: cursor.x, 
                            y1: (cursor.y + style[keyLineEndOffset]), 
                            x2: cursor.x, 
                            y2: (cursor.y - style[keyLineSpacing] - style[keyLineStartOffset]), 
                            'stroke-width': 2, 
                            stroke: 'black'
                        });
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
        var fromAkshara = 0, toAkshara = 0, aksharasInTala = 0, aksharasPerLine = 0;

        var i, N, para, tala, aksh;

        for (i = 0, N = paragraphs.length; i < N; ++i) {

            para = paragraphs[i];
            tala = para.properties[keyTalaPattern];

            aksharasInTala = countAksharasInTala(tala);
            aksharasPerLine = +(para.properties[keyAksharasPerLine]);

            toAkshara += aksharasPerLine;

            // Repeat the tala pattern enough times to cover the given notation line.
            aksh = aksharasInTala;
            while (toAkshara > aksh) {
                para.properties[keyTalaPattern] += tala;
                aksh += aksharasInTala;
            }

            // On repetition, you may find patterns such as '||||' in the tala.
            // This we normalize to '||' - i.e. the maximum number of times a vertical
            // bar may be repeated is 2.
            para.properties[keyTalaPattern] = compileTala(para.properties[keyTalaPattern].replace(/\|\|+/g, '||'));

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

        var i, N, c, instrs = [];
        for (i = 0, N = talaPattern.length; i < N; ++i) {
            c = talaPattern.charAt(i);
            switch (c) {
                case '|' : 
                    if ((i + 1 < N && talaPattern.charAt(i+1) === '|') || (i > 0 && talaPattern.charAt(i-1) === '|')) {
                        instrs.push({line: 5, draw: true});
                    } else {
                        instrs.push({line: 10, draw: true}); 
                    }
                    break;
                case ' ':
                    instrs.push({space: 10});
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
        return (commas && commas.length) || 0;
    }

    function show(text) {
        var hisa = "Ṡ";
        var losa = "Ṣ";

        if (text === '_') {
            return "";
        } 

        if (text.length === 2 && text[1] === '+') {
            return text[0] + hisa[1];
        } 

        if (text.length === 2 && text[1] === '-') {
            return text[0] + losa[1];
        }

        return text;
    }

    function svgelem(elem, n, attrs, content) {
        var tag = GLOBAL.document.createElementNS('http://www.w3.org/2000/svg', n);
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
        style[keyNotationFont] = (style[keyNotationFont] || 'serif');
        style[keyTextFont] = (style[keyTextFont] || 'serif');
        style[keyStretch] = (+style[keyStretch]) || 1.6;
        style[keyMarginTop] = (+style[keyMarginTop]) || style[keyLineSpacing];
        style[keyMarginLeft] = (+style[keyMarginLeft]) || 10;
        style[keyLineStartOffset] = (+style[keyLineStartOffset]) || 0;
        style[keyLineEndOffset] = (+style[keyLineEndOffset]) || 5;
    }

    return null;
}
