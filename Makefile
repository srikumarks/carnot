LIB=carnot
CPP=gcc -E -x c -DDEBUG=0${DEBUG} -P -undef -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers

GZIPENC = --add-header="Content-Encoding: gzip"
HTMLCONTENT = --mime-type="text/html"
TEXTCONTENT = --mime-type="text/plain; charset=utf-8"
JSCONTENT = --mime-type="application/javascript"
CACHE2W = --add-header="Cache-Control: max-age=1209600"
CACHE1D = --add-header="Cache-Control: max-age=86400"
CACHE1W = --add-header="Cache-Control: max-age=604800"

NOTATIONS = $(wildcard notations/*.md)
NOTATIONSGZ = $(patsubst %.md,%.md.gz,$(NOTATIONS))
NOTATIONHTML = $(patsubst %.md,%.html,$(NOTATIONS))
NOTATIONHTMLGZ = $(patsubst %.md,%.html.gz,$(NOTATIONS))

all : $(LIB).min.js.gz $(NOTATIONHTMLGZ) $(NOTATIONSGZ)

$(LIB).min.js.gz : $(LIB).min.js
	test 0 = "$(deploy)" || (gzip -c $(LIB).min.js > $(LIB).min.js.gz && s3cmd $(GZIPENC) $(JSCONTENT) $(CACHE1W) put $(LIB).min.js.gz "s3://sriku.org/lib/$(LIB)/$(LIB).min.js")

$(LIB).min.js : $(LIB).js
	cljs --compilation_level=SIMPLE_OPTIMIZATIONS $(LIB).js > $(LIB).min.js
	
$(LIB).js : lib/assert.js src/*.js
	cd src && ($(CPP) -include ../lib/assert.js main.js > ../$(LIB).js)

$(NOTATIONSGZ): %.md.gz : %.md
	test 0 = "$(deploy)" || (gzip -c $< > $@ && s3cmd $(GZIPENC) $(CACHE1W) $(TEXTCONTENT) put $@ "s3://sriku.org/$<")

$(NOTATIONHTML) : %.html : %.md
	pandoc --from=markdown --to=html5 --standalone $< -o $@

$(NOTATIONHTMLGZ) : %.html.gz : %.html
	test 0 = "$(deploy)" || (gzip -c $< > $@ && s3cmd $(GZIPENC) $(CACHE1W) $(HTMLCONTENT) put $@ "s3://sriku.org/$<")

clean : 
	rm $(LIB).js $(LIB).min.js

