"use strict";
const htmlparser = require("htmlparser");

module.exports = function(source) {
  this.cacheable();
  
  const handler = new htmlparser.DefaultHandler((err, dom) => {
    let assembled = parseFragment(dom);
    
    this.callback(null, `module.exports.render = function (_compiler, _parent) { return function () {return ${assembled};}.bind(_parent)()}`);
  }, {verbose: false});
  const parser = new htmlparser.Parser(handler);
  parser.parseComplete(source);
};

function parseFragment(dom) {
  const args = [JSON.stringify("#frag"), "_parent", `{ children: [${parseNodes(dom).join(", ")}] }`];
  return `_compiler.createElement(${args.join(", ")})`;
}

function parseNode(node) {
  const tag = node.type === "text" ? "#text" : node.name;
  const children = node.data ? [JSON.stringify(node.data)] : parseNodes(node.children);
  const props = parseProps(node.attribs || {});
  const args = [JSON.stringify(tag), "_parent", `{ props: ${props}, children: [${children.join(", ")}] }`];
  const assignments = templateVariableAssignments(node.attribs || {});
  return `${assignments}_compiler.createElement(${args.join(", ")})`;
}

function parseNodes(nodes) {
  if (!nodes) return [];
  
  let res = [];
  for (let i = 0, len = nodes.length; i < len; i++) {
    res.push(parseNode(nodes[i]));
  }
  
  return res;
}

function templateVariableAssignments(props) {
  let assignments = "";
  
  for (let i = 0, keys = Object.keys(props), len = keys.length; i < len; i++) {
    let key = keys[i];
    let value = props[key];
    
    if (!startsWith(key, "#")) continue;
    key = key.slice(1);
    
    assignments += `this.$${key} = `;
  }
  
  return assignments;
}

function parseProps(props) {
  const pairs = [];
  
  for (let i = 0, keys = Object.keys(props), len = keys.length; i < len; i++) {
    let key = keys[i];
    let value = props[key];
    
    if (startsWith(key, "#")) continue;
    
    if (isSurroundedBy(key, "[(", ")]")) {
      let rawKey = key.slice(2, key.length - 2);
      pairs.push(`${JSON.stringify(`(${rawKey}Changed)`)}: [function ($event) { return ${value}.next($event); }.bind(this), function (observable) { return observable.skipInitial(); }]`)
      pairs.push(`${JSON.stringify(`[${rawKey}]`)}: ${value}`)
    } else if (isSurroundedBy(key, "(", ")")) {
      pairs.push(`${JSON.stringify(key)}: [function ($event) { return ${value}; }.bind(this)]`)
    } else if (isSurroundedBy(key, "[", "]")) {
      pairs.push(`${JSON.stringify(key)}: ${value}`)
    } else {
      pairs.push(`${JSON.stringify(key)}: ${JSON.stringify(value)}`);
    }
  }
  
  return `{${pairs.join(", ")}}`;
}

// Utils
//-----------------------
function startsWith(str, value) {
  return str.slice(0, value.length) === value;
}

function endsWith(str, value) {
  return str.slice(str.length - value.length, str.length) === value;
}

function isSurroundedBy(str, start, end) {
  return startsWith(str, start) && endsWith(str, end);
}