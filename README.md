**Carnot** is an easy to use Javascript library for typesetting 
Carnatic music notation within web pages.

*Status:* ALPHA. Syntax and API are subject to change without notice.

*Supported browsers*: Chrome, Safari and Firefox.

## Usage

Include the script directly from the library URL like this -

    <script src="http://sriku.org/lib/carnot/carnot.min.js"> </script>

It doesn't matter where within the page you include it.

The script will search your page for `pre` tags with the class `carnot_section`
and render them using SVG. 

You can see a rendering of the below example [here][sample]. 
[Ganarajena Rakshitoham][GR] is a larger example of using Carnot within 
a blog post to display the prescriptive and descriptive notation 
of a whole composition. 

    tala pattern = || ,, ,, ,, | ,, ,, | ,, ,, ||
    aksharas per line = 14
    stretch = 0.6
        
    , , G  m  , P  , m  , G  , , m   G
    _ _ ka na _ ka _ sa _ bē _ _ śan _
    _ _ க ன _ க _ ச _ பே _ _ சன் _

    R S  , , S  , , S  , S   , , N-   , 
    _ da _ _ ri _ _ sa _ nam _ _ kaṇ _
    _ த _ _ ரி _ _ ச _ னம் _ _ கண் _

    S   , , , , , R   , , , G  , m  , 
    ḍen _ _ _ _ _ kaṇ _ _ _ ḍu _ aa _
    டேன் _ _ _ _ _ கண் _ _ _ டு _ ஆ _

    , , P   , , , P   , m   , , P   , m
    _ _ nan _ _ _ dam _ koṇ _ _ ḍen _ til 
    _ _ னந் _ _ _ தம் _ கொண் _ _ டேன் _ தில்

    aksharas = 2
    G R
    _ lai
    _ லை
    

If you're using [Markdown], including a section to be typeset by
Carnot is a breeze. Any [Markdown code block][MCS] that begins
with `tala pattern = ...blah-blah...` will be considered as
a Carnot section and typeset accordingly.

### Examples - Traditional Carnatic exercises

1. [Sarali varisai](http://sriku.org/notations/jantaivarisai.html)
2. [Jantai varisai](http://sriku.org/notations/jantai.html)

[Markdown]: http://daringfireball.net/projects/markdown/
[GR]: http://sriku.org/blog/2013/07/09/notation-ganarajena-rakshitoham/
[MCS]: http://daringfireball.net/projects/markdown/syntax#precode

## Syntax

A "carnot_section" is wrapped in a `pre` tag whose class is set to `carnot_section`. The body of the `pre` gives the notation in plain text with the syntax described below.

The notation is considered in "paragraphs" where all lines of a paragraph 
are expected to be of the same symbolic duration.

"Lines" may be of the following types -

1. Text lines which begin with the ">" character. These are rendered as plain
   text without any timing. This is useful for stuff like `> (Repeat this twice)`.

2. "Svarasthana" lines, which given the solfege notation with timing. These
   lines may only use one of the "svarasthana" symbols "SrRgGmMPdDnN".
   Additionally, "," can be used to indicate a *visible* time gap and "_" can
   be used to indicate an *invisible* gap. Upper and lower octave svarasthana
   symbols can be obtained by just suffixing the svarasthana letter with "+" or
   "-" without intervening spaces. Spaces *must* separate svara and gap symbols
   and no other types of symbols must be present for a line to be considered as
   "svarasthana notation".
   
   Ex: `S+ N , d , S+ , N d , P , P ,`
   
3. "Lyrics" lines, which need to presented as timed syllables. The syntax is
   pretty much the same as for the svarasthana lines, except that the text is
   presented in words instead of letters. The textual content can be in any
   language.
   
   Ex: `mā _ yā _ tī _ ta _ sva rū _ pi ṇi _ _ _` 

4. "Property" lines, which are of the form `some key = some value`. These
   control the interpretation of the other line types during rendering. If a
   paragraph consists entirely of property lines, then the properties are
   considered to be applicable to all the following paragraphs. Properties
   specified within paragraphs with at least one other line type are considered
   to apply only to that paragraph.

   Ex: `aksharas per line = 6`
   
## Properties

### tala pattern

A `tala pattern` specification consists of a sequence of "|", "," and space
characters. While a "," counts aksharas of a tala, "|" marks major angas.  "|"
indicators are rendered by drawing vertical lines. Space is significant and can
be used to visually group sub-akshara notes as in [the sample][sample].
However, multiple spaces are collapsed into a single space. Furthermore, "|" is
rendered as a single vertical line and "||" is rendered as a double vertical
line, but all others such as "||||" will be rendered just like "||". 

The "_" character is also permitted and behaves exactly like "|" except that it
doesn't cause a line to be drawn. This is useful to align aksharas of long
talas whose avrtams get split into multiple lines.

There is no restriction on the types of talas you can encode using this scheme,
meaning you aren't limited to the 35 talas, or whatever.

Example: 

1. `tala pattern = || , , , , | , , | , , ||` 
2. `tala pattern = || ,, ,, ,, | ,, ,, | ,, ,, ||`

### aksharas per line

The value of this property is expected to be a natural number greater than 0.
It specifies how many of the tala aksharas a line should occupy. 

### stretch

Give a floating point value that will horizontally stretch the spacing used in
the rendering. A value of "2.0" will be twice as wide as a value of "1.0".

[sample]: http://sriku.org/notations/sample.html


## Style controls

If you place a `pre` section with class `carnot_style`, then the properties
specified in that section are loaded into a style object that is passed to the
renderer. If this section is absent, then default styling applies.

The following parameters are available for customization and are given below
along with their default values.

    <pre class="carnot_style">
    line spacing = 22
    para spacing = 22
    notation font size = 13
    notation small font size = 11
    notation font = serif
    text font = serif
    stretch = 1.0
    stretch space = 1.0
    margin top = 22
    margin left = 10
    line extension top = 0
    line extension bottom = 5
    </pre>



