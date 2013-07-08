LIB=carnot
CPP=gcc -E -x c -DDEBUG=0${DEBUG} -P -undef -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers

GZIPENC = --add-header="Content-Encoding: gzip"
HTMLCONTENT = --add-header="Content-Type: text/html"
JSCONTENT = --add-header="Content-Type: application/javascript"
CACHE2W = --add-header="Cache-Control: max-age=1209600"
CACHE1D = --add-header="Cache-Control: max-age=86400"
CACHE1W = --add-header="Cache-Control: max-age=604800"

$(LIB).min.js.gz : $(LIB).min.js
	gzip -c $(LIB).min.js > $(LIB).min.js.gz

$(LIB).min.js : $(LIB).js
	cljs --compilation_level=SIMPLE_OPTIMIZATIONS $(LIB).js > $(LIB).min.js
	
$(LIB).js : lib/assert.js src/*.js
	cd src && ($(CPP) -include ../lib/assert.js main.js > ../$(LIB).js)

clean : 
	rm $(LIB).js $(LIB).min.js

deploy: $(LIB).min.js.gz
	which s3cmd && s3cmd $(GZIPENC) $(JSCONTENT) $(CACHE1W) put $(LIB).min.js.gz "s3://sriku.org/lib/$(LIB)/$(LIB).min.js"
