/*                                                 */
/*   The script must be run from the app folder!   */
/*                                                 */

const assert = require("assert");
assert.equal(process.cwd().substr(process.cwd().length - 3), "app", "You must run the test file from where the app.js is located! (cd app; node ../test.js)");
const glob = require("./app/global.js");
const fs = require("fs");
const vm = require("vm");

/* Test nameContainsInvalidChars: */

console.log("Testing nameContainsInvalidChars");

const invalidStrings = ["_", "<", ">", "|", "*", "\\", "/", "!", ":", ";", ".", "&", "Gus      Ek", "GusEk", "5", ];
for (var i = 0; i < invalidStrings.length; ++i) {
        assert.equal(glob.nameContainsInvalidChars(invalidStrings[i]), true, invalidStrings[i]);
}

const validStrings = ["Gus Ek", "Bo Gus Hen Ek", "Bo-Gus Ek", "- -", "gus ek"];
for (var i = 0; i < validStrings.length; ++i) {
        assert.equal(glob.nameContainsInvalidChars(validStrings[i]), false, validStrings[i]);
}

/* Test layoutValid */

console.log("Testing layoutValid");

const content = fs.readFileSync("./models/admin.js", {encoding: "utf-8"});
const func = getFunc(content, "layoutValid");
const sandbox = {JSON: JSON, console: console};
const script = new vm.Script(func);
const context = new vm.createContext(sandbox);
script.runInContext(context);

assert.equal(sandbox.layoutValid('[[{"id": 0, "type": "seat"}]]'), true, "FAILED: layoutValid");
assert.equal(sandbox.layoutValid('[[{"id": "bla", "type": "seat"}]]'), false, "FAILED: layoutValid");
assert.equal(sandbox.layoutValid('[[{"id": 0, "type": "seatasd"}]]'), false, "FAILED: layoutValid");
assert.equal(sandbox.layoutValid('{id: {}}'), false, "FAILED: layoutValid");

/* --------------------------------------------- */

console.log("\nTests succeeded!");

/* --------------------------------------------- */

function getFunc(str, funcName)
{
        var funcIndex = str.indexOf("function " + funcName);

        if (funcIndex === -1) {
                return false;
        } else {
                var clip = str.substring(funcIndex, str.length);

                var funcStartIndex = clip.indexOf("{");
                var funcEndIndex = false;
                var numFound = 0;
                for (var pos = funcStartIndex; pos < clip.length; ++pos) {
                        if (clip[pos] === "{")
                                ++numFound;
                        else if (clip[pos] === "}")
                                --numFound;

                        if (numFound === 0) {
                                funcEndIndex = pos;
                                break;
                        }
                }

                if (funcEndIndex === false)
                        return false;
                else
                        return clip.substring(0, funcEndIndex + 1);
        }
}
