
/**
Parses code of the following form into an array of "paragraphs".

<pre class="carnot_section">
tala pattern = | , , , , | , , | , , ||
aksharas per line = 8
stretch = 1.0

> Line 1
S r G m P d N S+
un mai pe num ul lam ko yil

> Line 2
S+ N d P m G r S
un dan ul le vaa zhum dei vam
</pre>

The returned structure is an array of "Paragraph" objects -

paragraph.lines[i] = Line object
paragraph.properties = key-value-pairs

line.type = 'text' or 'svarasthanas' or 'lyrics' or 'property'
line.tokens = [string]
 
*/

function Parse(pre) {

    function trim(s) {
        return s.trim();
    }

    function isNotEmpty(s) {
        return s.length > 0;
    }

    function split(str, re) {
        return str.split(re).map(trim).filter(isNotEmpty);
    }

    function normalize(str) {
        return str.trim().replace(/\s+/g, ' ');
    }

    function normalizePropertyKey(key) {
        return normalize(key).toLowerCase();
    }

    function parseLine(line) {
        var type, tokens;
        if (/^\>/.test(line)) {
            // Line begins with '>', so it is a 'text' type line.
            type = 'text';
            tokens = [line.substring(1).trim()];
        } else if (/\=/.test(line)) {
            // Line contains '=' sign. It is a property specifier.
            // tokens[0] is the key and tokens[1] is the value.
            type = 'property';
            tokens = line.split('=').filter(isNotEmpty).map(normalize);
            REQUIRE(tokens.length === 2);
            tokens[0] = normalizePropertyKey(tokens[0]);
        } else {
            // Test for svarasthana or lyrics.
            tokens = split(line, /\s/g);
            if (tokens.filter(function (tok) {
                // Accept svaras not separated by space as well.
                // Each such "word" will be typeset within the space of one akshara.
                return (/^(([SrRgGmMPdDnN][\+\-]*)|[,_])+$/).test(tok);
            }).length === tokens.length) {
                type = 'svarasthana';
            } else {
                type = 'lyrics';
            }
        }

        return {
            type: type,
            tokens: tokens
        };
    }

    // Default properties
    var properties = {
        '$aksharas per line': 16,
        '$tala pattern' : ',',
        '$stretch' : 1.0
    };

    function copyProps(src, dest) {
        var k;
        for (k in src) {
            if (src.hasOwnProperty(k)) {
                dest[k] = src[k];
            }
        }
        return dest;
    }

    function parseProperties(lineObjects) {
        var props = copyProps(properties, {});
        var filteredLines = [];

        lineObjects.forEach(function (lineObj) {
            if (lineObj.type === 'property' && lineObj.tokens.length === 2) {
                props['$'+lineObj.tokens[0]] = lineObj.tokens[1];
            } else {
                filteredLines.push(lineObj);
            }
        });

        if (filteredLines.length === 0) {
            // Global properties.
            copyProps(props, properties);
            return null;
        }

        return {
            type: 'paragraph',
            lines: filteredLines,
            properties: props
        };
    }

    // Get the code to split and ditch the leading and training spaces.
    var code = pre.textContent.trim();

    // Split into paragraphs - at least one blank line separates paragraphs.
    var paragraphs = split(code, /([ \t]*\n)([ \t]*\n)+/);

    // Split each paragraph into lines.
    paragraphs = paragraphs.map(function (p) {
        var lines = split(p, /\n/).map(parseLine);
        return parseProperties(lines);
    }).filter(function (l) { return l; });

    if (paragraphs.length === 0) {
        return [{type: 'properties', properties: properties}];
    }

    return paragraphs;
}
