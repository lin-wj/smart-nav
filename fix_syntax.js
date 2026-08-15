const fs = require("fs");
const path = "/sessions/adoring-lucid-brown/mnt/smartnav_work/index.html";
let c = fs.readFileSync(path, "utf8");

const scripts = c.match(/<script>([\s\S]*?)<\/script>/g);
const code = scripts[0].replace(/<\/?script>/g, "");

// Check the api function specifically
const apiIdx = code.indexOf("async function api(url,opt={}){");
if (apiIdx >= 0) {
  let depth = 0;
  let braceStart = -1;
  for (let i = apiIdx; i < code.length; i++) {
    if (code[i] === "{") {
      if (braceStart === -1) braceStart = i;
      depth++;
    } else if (code[i] === "}") {
      depth--;
      if (depth === 0 && braceStart >= 0) {
        const body = code.substring(braceStart, i+1);
        console.log("api function body:");
        console.log(body);
        try {
          new Function(body);
          console.log("api function: SYNTAX OK");
        } catch(e) {
          console.log("api function ERROR:", e.message);
        }
        break;
      }
    }
  }
}

// Also check loadAll
const loadAllIdx = code.indexOf("async function loadAll(){");
if (loadAllIdx >= 0) {
  let depth = 0;
  let braceStart = -1;
  for (let i = loadAllIdx; i < code.length; i++) {
    if (code[i] === "{") {
      if (braceStart === -1) braceStart = i;
      depth++;
    } else if (code[i] === "}") {
      depth--;
      if (depth === 0 && braceStart >= 0) {
        const body = code.substring(braceStart, i+1);
        try {
          new Function(body);
          console.log("loadAll function: SYNTAX OK");
        } catch(e) {
          console.log("loadAll function ERROR:", e.message);
        }
        break;
      }
    }
  }
}
