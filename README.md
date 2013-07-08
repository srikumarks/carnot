**Carnot** is an easy to use Javascript library for typesetting 
Carnatic music notation within web pages.

## Usage

Include the script directly from the library URL like this -

    <script src="http://sriku.org/lib/carnot/carnot.min.js"> </script>

It doesn't matter where within the page you include it.

The script will search your page for `pre` tags with the class 
`carnot_section` and render them using SVG. Here is an example -

    <pre class="carnot_section">
    tala pattern = || ,, ,, ,, | ,, ,, | ,, ,, ||
    aksharas per line = 14
    stretch = 0.6
    
    > Pallavi "Kanakasabēśan", Raga Shankarābharaṇam

    _ _ G  m  , P  , m  , G  , , m   G
    _ _ ka na _ ka _ sa _ bē _ _ śan _

    R S  , , S  , , S  , S   , , N   , 
    _ da _ _ ri _ _ sa _ nam _ _ kaṇ _

    S   , , , , , R   , , , G  , m  , 
    ḍen _ _ _ _ _ kaṇ _ _ _ ḍu _ aa _

    , , P   , , , P   , m   , , P   , G
    _ _ nan _ _ _ dam _ koṇ _ _ ḍen _ til 

    aksharas per line = 2
    , R
    _ lai
    </pre>
    
.. and here it is rendered -

<script src="http://sriku.org/lib/carnot/carnot.min.js"></script>

<pre class="carnot_section">
tala pattern = || ,, ,, ,, | ,, ,, | ,, ,, ||
aksharas per line = 14
stretch = 0.6

> Pallavi "Kanakasabēśan", Raga Shankarābharaṇam

_ _ G  m  , P  , m  , G  , , m   G
_ _ ka na _ ka _ sa _ bē _ _ śan _

R S  , , S  , , S  , S   , , N   , 
_ da _ _ ri _ _ sa _ nam _ _ kaṇ _

S   , , , , , R   , , , G  , m  , 
ḍen _ _ _ _ _ kaṇ _ _ _ ḍu _ aa _

, , P   , , , P   , m   , , P   , G
_ _ nan _ _ _ dam _ koṇ _ _ ḍen _ til 

aksharas per line = 2
, R
_ lai
</pre>
 
