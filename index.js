
var fs = require("fs")
,   pth = require("path")
,   nopt = require("nopt")
,   cwd = process.cwd()
,   jn = pth.join
,   dn = __dirname
,   res = jn(dn, "res")
,   rfs = function (path) { return fs.readFileSync(path, "utf8"); }
,   wfs = function (path, content) { fs.writeFileSync(path, content, { encoding: "utf8" }); }
,   rjson = function (path) { return JSON.parse(rfs(path)); }
,   wjson = function (path, obj) { wfs(path, JSON.stringify(obj, null, 2)); }
,   tmpl = rfs(jn(res, "template.html"))
,   knownOpts = {
                    "input" :   String
                ,   "output" :  String
                ,   "force":    Boolean
                ,   "help":     Boolean
                }
,   shortHands = {
                    "i":    ["--input"]
                ,   "o":    ["--output"]
                ,   "f":    ["--force"]
                ,   "h":    ["--help"]
                }
,   parsed = nopt(knownOpts, shortHands)
,   options = {
        input:  parsed.input || cwd
    ,   output: parsed.output || cwd
    ,   force:  parsed.force || false
    ,   help:   parsed.help || false
    }
,   err = function (str) {
        console.error("[ERROR] " + str);
        process.exit(1);
    }
,   reports = []
,   consolidated = {}
,   out = {
        ua: []
    ,   results: {}
    }
;

if (options.help) {
    console.log("XXX USAGE");
    process.exit(0);
}

if (!fs.existsSync(options.input)) err("No input directory: " + options.input);
if (!fs.existsSync(options.output)) err("No output directory: " + options.output);

fs.readdirSync(options.input)
    .forEach(function (f) {
        if (!/^\w\w\d\d\.json$/.test(f)) return;
        reports.push(f);
        consolidated[f.replace(/\.json$/, "")] = JSON.parse(rfs(jn(options.input, f)));
    })
;

if (!reports.length) err("No JSON reports matching \\w\\w\\d\\d.json in input directory: " + options.input);

// consolidation
for (var ua in consolidated) {
    out.ua.push(ua);
    for (var i = 0, n = consolidated[ua].results.length; i < n; i++) {
        var testData = consolidated[ua].results[i]
        ,   id = testData.test
        ;
        if (!out.results[id]) {
            out.results[id] = {
                byUA:       {}
            ,   totals:     {}
            ,   subtests:   {}
            };
        }
        out.results[id].byUA[ua] = testData.status;
        if (!out.results[id].totals[testData.status]) out.results[id].totals[testData.status] = 1;
        else out.results[id].totals[testData.status]++;
        for (var j = 0, m = testData.subtests.length; j < m; j++) {
            var st = testData.subtests[j];
            if (!out.results[id].subtests[st.name]) out.results[id].subtests[st.name] = { byUA: {}, totals: {} };
            out.results[id].subtests[st.name].byUA[ua] = st.status;
            if (!out.results[id].subtests[st.name].totals[st.status]) out.results[id].subtests[st.name].totals[st.status] = 1;
            else out.results[id].subtests[st.name].totals[st.status]++;
        }
    }
}
wjson(jn(dn, "consolidated.json"), out);


// support filters.json?
// generate both all, less-than-2, none, filtered reports


