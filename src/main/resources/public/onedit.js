var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3548__auto____100123 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____100123)) {
    return or__3548__auto____100123
  }else {
    var or__3548__auto____100124 = p["_"];
    if(cljs.core.truth_(or__3548__auto____100124)) {
      return or__3548__auto____100124
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__100188 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100125 = this$;
      if(cljs.core.truth_(and__3546__auto____100125)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100125
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____100126 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100126)) {
          return or__3548__auto____100126
        }else {
          var or__3548__auto____100127 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100127)) {
            return or__3548__auto____100127
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__100189 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100128 = this$;
      if(cljs.core.truth_(and__3546__auto____100128)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100128
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____100129 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100129)) {
          return or__3548__auto____100129
        }else {
          var or__3548__auto____100130 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100130)) {
            return or__3548__auto____100130
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__100190 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100131 = this$;
      if(cljs.core.truth_(and__3546__auto____100131)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100131
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____100132 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100132)) {
          return or__3548__auto____100132
        }else {
          var or__3548__auto____100133 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100133)) {
            return or__3548__auto____100133
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__100191 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100134 = this$;
      if(cljs.core.truth_(and__3546__auto____100134)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100134
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____100135 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100135)) {
          return or__3548__auto____100135
        }else {
          var or__3548__auto____100136 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100136)) {
            return or__3548__auto____100136
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__100192 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100137 = this$;
      if(cljs.core.truth_(and__3546__auto____100137)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100137
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____100138 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100138)) {
          return or__3548__auto____100138
        }else {
          var or__3548__auto____100139 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100139)) {
            return or__3548__auto____100139
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__100193 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100140 = this$;
      if(cljs.core.truth_(and__3546__auto____100140)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100140
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____100141 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100141)) {
          return or__3548__auto____100141
        }else {
          var or__3548__auto____100142 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100142)) {
            return or__3548__auto____100142
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__100194 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100143 = this$;
      if(cljs.core.truth_(and__3546__auto____100143)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100143
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____100144 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100144)) {
          return or__3548__auto____100144
        }else {
          var or__3548__auto____100145 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100145)) {
            return or__3548__auto____100145
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__100195 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100146 = this$;
      if(cljs.core.truth_(and__3546__auto____100146)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100146
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____100147 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100147)) {
          return or__3548__auto____100147
        }else {
          var or__3548__auto____100148 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100148)) {
            return or__3548__auto____100148
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__100196 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100149 = this$;
      if(cljs.core.truth_(and__3546__auto____100149)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100149
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____100150 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100150)) {
          return or__3548__auto____100150
        }else {
          var or__3548__auto____100151 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100151)) {
            return or__3548__auto____100151
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__100197 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100152 = this$;
      if(cljs.core.truth_(and__3546__auto____100152)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100152
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____100153 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100153)) {
          return or__3548__auto____100153
        }else {
          var or__3548__auto____100154 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100154)) {
            return or__3548__auto____100154
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__100198 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100155 = this$;
      if(cljs.core.truth_(and__3546__auto____100155)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100155
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____100156 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100156)) {
          return or__3548__auto____100156
        }else {
          var or__3548__auto____100157 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100157)) {
            return or__3548__auto____100157
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__100199 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100158 = this$;
      if(cljs.core.truth_(and__3546__auto____100158)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100158
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____100159 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100159)) {
          return or__3548__auto____100159
        }else {
          var or__3548__auto____100160 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100160)) {
            return or__3548__auto____100160
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__100200 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100161 = this$;
      if(cljs.core.truth_(and__3546__auto____100161)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100161
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____100162 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100162)) {
          return or__3548__auto____100162
        }else {
          var or__3548__auto____100163 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100163)) {
            return or__3548__auto____100163
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__100201 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100164 = this$;
      if(cljs.core.truth_(and__3546__auto____100164)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100164
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____100165 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100165)) {
          return or__3548__auto____100165
        }else {
          var or__3548__auto____100166 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100166)) {
            return or__3548__auto____100166
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__100202 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100167 = this$;
      if(cljs.core.truth_(and__3546__auto____100167)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100167
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____100168 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100168)) {
          return or__3548__auto____100168
        }else {
          var or__3548__auto____100169 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100169)) {
            return or__3548__auto____100169
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__100203 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100170 = this$;
      if(cljs.core.truth_(and__3546__auto____100170)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100170
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____100171 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100171)) {
          return or__3548__auto____100171
        }else {
          var or__3548__auto____100172 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100172)) {
            return or__3548__auto____100172
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__100204 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100173 = this$;
      if(cljs.core.truth_(and__3546__auto____100173)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100173
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____100174 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100174)) {
          return or__3548__auto____100174
        }else {
          var or__3548__auto____100175 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100175)) {
            return or__3548__auto____100175
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__100205 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100176 = this$;
      if(cljs.core.truth_(and__3546__auto____100176)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100176
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____100177 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100177)) {
          return or__3548__auto____100177
        }else {
          var or__3548__auto____100178 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100178)) {
            return or__3548__auto____100178
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__100206 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100179 = this$;
      if(cljs.core.truth_(and__3546__auto____100179)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100179
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____100180 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100180)) {
          return or__3548__auto____100180
        }else {
          var or__3548__auto____100181 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100181)) {
            return or__3548__auto____100181
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__100207 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100182 = this$;
      if(cljs.core.truth_(and__3546__auto____100182)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100182
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____100183 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100183)) {
          return or__3548__auto____100183
        }else {
          var or__3548__auto____100184 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100184)) {
            return or__3548__auto____100184
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__100208 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100185 = this$;
      if(cljs.core.truth_(and__3546__auto____100185)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____100185
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____100186 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____100186)) {
          return or__3548__auto____100186
        }else {
          var or__3548__auto____100187 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____100187)) {
            return or__3548__auto____100187
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__100188.call(this, this$);
      case 2:
        return _invoke__100189.call(this, this$, a);
      case 3:
        return _invoke__100190.call(this, this$, a, b);
      case 4:
        return _invoke__100191.call(this, this$, a, b, c);
      case 5:
        return _invoke__100192.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__100193.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__100194.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__100195.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__100196.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__100197.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__100198.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__100199.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__100200.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__100201.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__100202.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__100203.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__100204.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__100205.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__100206.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__100207.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__100208.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100210 = coll;
    if(cljs.core.truth_(and__3546__auto____100210)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____100210
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____100211 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100211)) {
        return or__3548__auto____100211
      }else {
        var or__3548__auto____100212 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____100212)) {
          return or__3548__auto____100212
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100213 = coll;
    if(cljs.core.truth_(and__3546__auto____100213)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____100213
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____100214 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100214)) {
        return or__3548__auto____100214
      }else {
        var or__3548__auto____100215 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____100215)) {
          return or__3548__auto____100215
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100216 = coll;
    if(cljs.core.truth_(and__3546__auto____100216)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____100216
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____100217 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100217)) {
        return or__3548__auto____100217
      }else {
        var or__3548__auto____100218 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____100218)) {
          return or__3548__auto____100218
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__100225 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100219 = coll;
      if(cljs.core.truth_(and__3546__auto____100219)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____100219
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____100220 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____100220)) {
          return or__3548__auto____100220
        }else {
          var or__3548__auto____100221 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____100221)) {
            return or__3548__auto____100221
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__100226 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100222 = coll;
      if(cljs.core.truth_(and__3546__auto____100222)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____100222
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____100223 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____100223)) {
          return or__3548__auto____100223
        }else {
          var or__3548__auto____100224 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____100224)) {
            return or__3548__auto____100224
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__100225.call(this, coll, n);
      case 3:
        return _nth__100226.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100228 = coll;
    if(cljs.core.truth_(and__3546__auto____100228)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____100228
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____100229 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100229)) {
        return or__3548__auto____100229
      }else {
        var or__3548__auto____100230 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____100230)) {
          return or__3548__auto____100230
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100231 = coll;
    if(cljs.core.truth_(and__3546__auto____100231)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____100231
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____100232 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100232)) {
        return or__3548__auto____100232
      }else {
        var or__3548__auto____100233 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____100233)) {
          return or__3548__auto____100233
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__100240 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100234 = o;
      if(cljs.core.truth_(and__3546__auto____100234)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____100234
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____100235 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____100235)) {
          return or__3548__auto____100235
        }else {
          var or__3548__auto____100236 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____100236)) {
            return or__3548__auto____100236
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__100241 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100237 = o;
      if(cljs.core.truth_(and__3546__auto____100237)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____100237
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____100238 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____100238)) {
          return or__3548__auto____100238
        }else {
          var or__3548__auto____100239 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____100239)) {
            return or__3548__auto____100239
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__100240.call(this, o, k);
      case 3:
        return _lookup__100241.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100243 = coll;
    if(cljs.core.truth_(and__3546__auto____100243)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____100243
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____100244 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100244)) {
        return or__3548__auto____100244
      }else {
        var or__3548__auto____100245 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____100245)) {
          return or__3548__auto____100245
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100246 = coll;
    if(cljs.core.truth_(and__3546__auto____100246)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____100246
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____100247 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100247)) {
        return or__3548__auto____100247
      }else {
        var or__3548__auto____100248 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____100248)) {
          return or__3548__auto____100248
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100249 = coll;
    if(cljs.core.truth_(and__3546__auto____100249)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____100249
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____100250 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100250)) {
        return or__3548__auto____100250
      }else {
        var or__3548__auto____100251 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____100251)) {
          return or__3548__auto____100251
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100252 = coll;
    if(cljs.core.truth_(and__3546__auto____100252)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____100252
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____100253 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100253)) {
        return or__3548__auto____100253
      }else {
        var or__3548__auto____100254 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____100254)) {
          return or__3548__auto____100254
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100255 = coll;
    if(cljs.core.truth_(and__3546__auto____100255)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____100255
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____100256 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100256)) {
        return or__3548__auto____100256
      }else {
        var or__3548__auto____100257 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____100257)) {
          return or__3548__auto____100257
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100258 = coll;
    if(cljs.core.truth_(and__3546__auto____100258)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____100258
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____100259 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100259)) {
        return or__3548__auto____100259
      }else {
        var or__3548__auto____100260 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____100260)) {
          return or__3548__auto____100260
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100261 = coll;
    if(cljs.core.truth_(and__3546__auto____100261)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____100261
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____100262 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____100262)) {
        return or__3548__auto____100262
      }else {
        var or__3548__auto____100263 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____100263)) {
          return or__3548__auto____100263
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100264 = o;
    if(cljs.core.truth_(and__3546__auto____100264)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____100264
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____100265 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____100265)) {
        return or__3548__auto____100265
      }else {
        var or__3548__auto____100266 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____100266)) {
          return or__3548__auto____100266
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100267 = o;
    if(cljs.core.truth_(and__3546__auto____100267)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____100267
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____100268 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____100268)) {
        return or__3548__auto____100268
      }else {
        var or__3548__auto____100269 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____100269)) {
          return or__3548__auto____100269
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100270 = o;
    if(cljs.core.truth_(and__3546__auto____100270)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____100270
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____100271 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____100271)) {
        return or__3548__auto____100271
      }else {
        var or__3548__auto____100272 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____100272)) {
          return or__3548__auto____100272
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100273 = o;
    if(cljs.core.truth_(and__3546__auto____100273)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____100273
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____100274 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____100274)) {
        return or__3548__auto____100274
      }else {
        var or__3548__auto____100275 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____100275)) {
          return or__3548__auto____100275
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__100282 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100276 = coll;
      if(cljs.core.truth_(and__3546__auto____100276)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____100276
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____100277 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____100277)) {
          return or__3548__auto____100277
        }else {
          var or__3548__auto____100278 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____100278)) {
            return or__3548__auto____100278
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__100283 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100279 = coll;
      if(cljs.core.truth_(and__3546__auto____100279)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____100279
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____100280 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____100280)) {
          return or__3548__auto____100280
        }else {
          var or__3548__auto____100281 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____100281)) {
            return or__3548__auto____100281
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__100282.call(this, coll, f);
      case 3:
        return _reduce__100283.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100285 = o;
    if(cljs.core.truth_(and__3546__auto____100285)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____100285
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____100286 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____100286)) {
        return or__3548__auto____100286
      }else {
        var or__3548__auto____100287 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____100287)) {
          return or__3548__auto____100287
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100288 = o;
    if(cljs.core.truth_(and__3546__auto____100288)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____100288
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____100289 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____100289)) {
        return or__3548__auto____100289
      }else {
        var or__3548__auto____100290 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____100290)) {
          return or__3548__auto____100290
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100291 = o;
    if(cljs.core.truth_(and__3546__auto____100291)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____100291
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____100292 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____100292)) {
        return or__3548__auto____100292
      }else {
        var or__3548__auto____100293 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____100293)) {
          return or__3548__auto____100293
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100294 = o;
    if(cljs.core.truth_(and__3546__auto____100294)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____100294
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____100295 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____100295)) {
        return or__3548__auto____100295
      }else {
        var or__3548__auto____100296 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____100296)) {
          return or__3548__auto____100296
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100297 = d;
    if(cljs.core.truth_(and__3546__auto____100297)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____100297
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____100298 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____100298)) {
        return or__3548__auto____100298
      }else {
        var or__3548__auto____100299 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____100299)) {
          return or__3548__auto____100299
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100300 = this$;
    if(cljs.core.truth_(and__3546__auto____100300)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____100300
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____100301 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____100301)) {
        return or__3548__auto____100301
      }else {
        var or__3548__auto____100302 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____100302)) {
          return or__3548__auto____100302
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100303 = this$;
    if(cljs.core.truth_(and__3546__auto____100303)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____100303
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____100304 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____100304)) {
        return or__3548__auto____100304
      }else {
        var or__3548__auto____100305 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____100305)) {
          return or__3548__auto____100305
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100306 = this$;
    if(cljs.core.truth_(and__3546__auto____100306)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____100306
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____100307 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____100307)) {
        return or__3548__auto____100307
      }else {
        var or__3548__auto____100308 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____100308)) {
          return or__3548__auto____100308
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.type = function type(x) {
  return x.constructor
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__100309 = null;
  var G__100309__100310 = function(o, k) {
    return null
  };
  var G__100309__100311 = function(o, k, not_found) {
    return not_found
  };
  G__100309 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__100309__100310.call(this, o, k);
      case 3:
        return G__100309__100311.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100309
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__100313 = null;
  var G__100313__100314 = function(_, f) {
    return f.call(null)
  };
  var G__100313__100315 = function(_, f, start) {
    return start
  };
  G__100313 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__100313__100314.call(this, _, f);
      case 3:
        return G__100313__100315.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100313
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o === null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__100317 = null;
  var G__100317__100318 = function(_, n) {
    return null
  };
  var G__100317__100319 = function(_, n, not_found) {
    return not_found
  };
  G__100317 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__100317__100318.call(this, _, n);
      case 3:
        return G__100317__100319.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100317
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__100327 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__100321 = cljs.core._nth.call(null, cicoll, 0);
      var n__100322 = 1;
      while(true) {
        if(cljs.core.truth_(n__100322 < cljs.core._count.call(null, cicoll))) {
          var G__100331 = f.call(null, val__100321, cljs.core._nth.call(null, cicoll, n__100322));
          var G__100332 = n__100322 + 1;
          val__100321 = G__100331;
          n__100322 = G__100332;
          continue
        }else {
          return val__100321
        }
        break
      }
    }
  };
  var ci_reduce__100328 = function(cicoll, f, val) {
    var val__100323 = val;
    var n__100324 = 0;
    while(true) {
      if(cljs.core.truth_(n__100324 < cljs.core._count.call(null, cicoll))) {
        var G__100333 = f.call(null, val__100323, cljs.core._nth.call(null, cicoll, n__100324));
        var G__100334 = n__100324 + 1;
        val__100323 = G__100333;
        n__100324 = G__100334;
        continue
      }else {
        return val__100323
      }
      break
    }
  };
  var ci_reduce__100329 = function(cicoll, f, val, idx) {
    var val__100325 = val;
    var n__100326 = idx;
    while(true) {
      if(cljs.core.truth_(n__100326 < cljs.core._count.call(null, cicoll))) {
        var G__100335 = f.call(null, val__100325, cljs.core._nth.call(null, cicoll, n__100326));
        var G__100336 = n__100326 + 1;
        val__100325 = G__100335;
        n__100326 = G__100336;
        continue
      }else {
        return val__100325
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__100327.call(this, cicoll, f);
      case 3:
        return ci_reduce__100328.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__100329.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__100337 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__100350 = null;
  var G__100350__100351 = function(_, f) {
    var this__100338 = this;
    return cljs.core.ci_reduce.call(null, this__100338.a, f, this__100338.a[this__100338.i], this__100338.i + 1)
  };
  var G__100350__100352 = function(_, f, start) {
    var this__100339 = this;
    return cljs.core.ci_reduce.call(null, this__100339.a, f, start, this__100339.i)
  };
  G__100350 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__100350__100351.call(this, _, f);
      case 3:
        return G__100350__100352.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100350
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__100340 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__100341 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__100354 = null;
  var G__100354__100355 = function(coll, n) {
    var this__100342 = this;
    var i__100343 = n + this__100342.i;
    if(cljs.core.truth_(i__100343 < this__100342.a.length)) {
      return this__100342.a[i__100343]
    }else {
      return null
    }
  };
  var G__100354__100356 = function(coll, n, not_found) {
    var this__100344 = this;
    var i__100345 = n + this__100344.i;
    if(cljs.core.truth_(i__100345 < this__100344.a.length)) {
      return this__100344.a[i__100345]
    }else {
      return not_found
    }
  };
  G__100354 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__100354__100355.call(this, coll, n);
      case 3:
        return G__100354__100356.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100354
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__100346 = this;
  return this__100346.a.length - this__100346.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__100347 = this;
  return this__100347.a[this__100347.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__100348 = this;
  if(cljs.core.truth_(this__100348.i + 1 < this__100348.a.length)) {
    return new cljs.core.IndexedSeq(this__100348.a, this__100348.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__100349 = this;
  return this$
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__100358 = null;
  var G__100358__100359 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__100358__100360 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__100358 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__100358__100359.call(this, array, f);
      case 3:
        return G__100358__100360.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100358
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__100362 = null;
  var G__100362__100363 = function(array, k) {
    return array[k]
  };
  var G__100362__100364 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__100362 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__100362__100363.call(this, array, k);
      case 3:
        return G__100362__100364.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100362
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__100366 = null;
  var G__100366__100367 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__100366__100368 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__100366 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__100366__100367.call(this, array, n);
      case 3:
        return G__100366__100368.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100366
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3698__auto____100370 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____100370)) {
    var s__100371 = temp__3698__auto____100370;
    return cljs.core._first.call(null, s__100371)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__100372 = cljs.core.next.call(null, s);
      s = G__100372;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__100373 = cljs.core.seq.call(null, x);
  var n__100374 = 0;
  while(true) {
    if(cljs.core.truth_(s__100373)) {
      var G__100375 = cljs.core.next.call(null, s__100373);
      var G__100376 = n__100374 + 1;
      s__100373 = G__100375;
      n__100374 = G__100376;
      continue
    }else {
      return n__100374
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__100377 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__100378 = function() {
    var G__100380__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__100381 = conj.call(null, coll, x);
          var G__100382 = cljs.core.first.call(null, xs);
          var G__100383 = cljs.core.next.call(null, xs);
          coll = G__100381;
          x = G__100382;
          xs = G__100383;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__100380 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100380__delegate.call(this, coll, x, xs)
    };
    G__100380.cljs$lang$maxFixedArity = 2;
    G__100380.cljs$lang$applyTo = function(arglist__100384) {
      var coll = cljs.core.first(arglist__100384);
      var x = cljs.core.first(cljs.core.next(arglist__100384));
      var xs = cljs.core.rest(cljs.core.next(arglist__100384));
      return G__100380__delegate.call(this, coll, x, xs)
    };
    return G__100380
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__100377.call(this, coll, x);
      default:
        return conj__100378.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__100378.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__100385 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__100386 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__100385.call(this, coll, n);
      case 3:
        return nth__100386.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__100388 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__100389 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__100388.call(this, o, k);
      case 3:
        return get__100389.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__100392 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__100393 = function() {
    var G__100395__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__100391 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__100396 = ret__100391;
          var G__100397 = cljs.core.first.call(null, kvs);
          var G__100398 = cljs.core.second.call(null, kvs);
          var G__100399 = cljs.core.nnext.call(null, kvs);
          coll = G__100396;
          k = G__100397;
          v = G__100398;
          kvs = G__100399;
          continue
        }else {
          return ret__100391
        }
        break
      }
    };
    var G__100395 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__100395__delegate.call(this, coll, k, v, kvs)
    };
    G__100395.cljs$lang$maxFixedArity = 3;
    G__100395.cljs$lang$applyTo = function(arglist__100400) {
      var coll = cljs.core.first(arglist__100400);
      var k = cljs.core.first(cljs.core.next(arglist__100400));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100400)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100400)));
      return G__100395__delegate.call(this, coll, k, v, kvs)
    };
    return G__100395
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__100392.call(this, coll, k, v);
      default:
        return assoc__100393.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__100393.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__100402 = function(coll) {
    return coll
  };
  var dissoc__100403 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__100404 = function() {
    var G__100406__delegate = function(coll, k, ks) {
      while(true) {
        var ret__100401 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__100407 = ret__100401;
          var G__100408 = cljs.core.first.call(null, ks);
          var G__100409 = cljs.core.next.call(null, ks);
          coll = G__100407;
          k = G__100408;
          ks = G__100409;
          continue
        }else {
          return ret__100401
        }
        break
      }
    };
    var G__100406 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100406__delegate.call(this, coll, k, ks)
    };
    G__100406.cljs$lang$maxFixedArity = 2;
    G__100406.cljs$lang$applyTo = function(arglist__100410) {
      var coll = cljs.core.first(arglist__100410);
      var k = cljs.core.first(cljs.core.next(arglist__100410));
      var ks = cljs.core.rest(cljs.core.next(arglist__100410));
      return G__100406__delegate.call(this, coll, k, ks)
    };
    return G__100406
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__100402.call(this, coll);
      case 2:
        return dissoc__100403.call(this, coll, k);
      default:
        return dissoc__100404.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__100404.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__451__auto____100411 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____100412 = x__451__auto____100411;
      if(cljs.core.truth_(and__3546__auto____100412)) {
        var and__3546__auto____100413 = x__451__auto____100411.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____100413)) {
          return cljs.core.not.call(null, x__451__auto____100411.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____100413
        }
      }else {
        return and__3546__auto____100412
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____100411)
    }
  }())) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__100415 = function(coll) {
    return coll
  };
  var disj__100416 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__100417 = function() {
    var G__100419__delegate = function(coll, k, ks) {
      while(true) {
        var ret__100414 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__100420 = ret__100414;
          var G__100421 = cljs.core.first.call(null, ks);
          var G__100422 = cljs.core.next.call(null, ks);
          coll = G__100420;
          k = G__100421;
          ks = G__100422;
          continue
        }else {
          return ret__100414
        }
        break
      }
    };
    var G__100419 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100419__delegate.call(this, coll, k, ks)
    };
    G__100419.cljs$lang$maxFixedArity = 2;
    G__100419.cljs$lang$applyTo = function(arglist__100423) {
      var coll = cljs.core.first(arglist__100423);
      var k = cljs.core.first(cljs.core.next(arglist__100423));
      var ks = cljs.core.rest(cljs.core.next(arglist__100423));
      return G__100419__delegate.call(this, coll, k, ks)
    };
    return G__100419
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__100415.call(this, coll);
      case 2:
        return disj__100416.call(this, coll, k);
      default:
        return disj__100417.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__100417.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____100424 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____100425 = x__451__auto____100424;
      if(cljs.core.truth_(and__3546__auto____100425)) {
        var and__3546__auto____100426 = x__451__auto____100424.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____100426)) {
          return cljs.core.not.call(null, x__451__auto____100424.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____100426
        }
      }else {
        return and__3546__auto____100425
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__451__auto____100424)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____100427 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____100428 = x__451__auto____100427;
      if(cljs.core.truth_(and__3546__auto____100428)) {
        var and__3546__auto____100429 = x__451__auto____100427.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____100429)) {
          return cljs.core.not.call(null, x__451__auto____100427.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____100429
        }
      }else {
        return and__3546__auto____100428
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__451__auto____100427)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__451__auto____100430 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____100431 = x__451__auto____100430;
    if(cljs.core.truth_(and__3546__auto____100431)) {
      var and__3546__auto____100432 = x__451__auto____100430.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____100432)) {
        return cljs.core.not.call(null, x__451__auto____100430.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____100432
      }
    }else {
      return and__3546__auto____100431
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__451__auto____100430)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__451__auto____100433 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____100434 = x__451__auto____100433;
    if(cljs.core.truth_(and__3546__auto____100434)) {
      var and__3546__auto____100435 = x__451__auto____100433.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____100435)) {
        return cljs.core.not.call(null, x__451__auto____100433.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____100435
      }
    }else {
      return and__3546__auto____100434
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__451__auto____100433)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__451__auto____100436 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____100437 = x__451__auto____100436;
    if(cljs.core.truth_(and__3546__auto____100437)) {
      var and__3546__auto____100438 = x__451__auto____100436.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____100438)) {
        return cljs.core.not.call(null, x__451__auto____100436.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____100438
      }
    }else {
      return and__3546__auto____100437
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__451__auto____100436)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____100439 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____100440 = x__451__auto____100439;
      if(cljs.core.truth_(and__3546__auto____100440)) {
        var and__3546__auto____100441 = x__451__auto____100439.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____100441)) {
          return cljs.core.not.call(null, x__451__auto____100439.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____100441
        }
      }else {
        return and__3546__auto____100440
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__451__auto____100439)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__451__auto____100442 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____100443 = x__451__auto____100442;
    if(cljs.core.truth_(and__3546__auto____100443)) {
      var and__3546__auto____100444 = x__451__auto____100442.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____100444)) {
        return cljs.core.not.call(null, x__451__auto____100442.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____100444
      }
    }else {
      return and__3546__auto____100443
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__451__auto____100442)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__100445 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__100445.push(key)
  });
  return keys__100445
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(cljs.core.truth_(s === null)) {
    return false
  }else {
    var x__451__auto____100446 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____100447 = x__451__auto____100446;
      if(cljs.core.truth_(and__3546__auto____100447)) {
        var and__3546__auto____100448 = x__451__auto____100446.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____100448)) {
          return cljs.core.not.call(null, x__451__auto____100446.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____100448
        }
      }else {
        return and__3546__auto____100447
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__451__auto____100446)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____100449 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____100449)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____100450 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____100450)) {
        return or__3548__auto____100450
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____100449
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____100451 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____100451)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____100451
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____100452 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____100452)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____100452
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____100453 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____100453)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____100453
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____100454 = coll;
    if(cljs.core.truth_(and__3546__auto____100454)) {
      var and__3546__auto____100455 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____100455)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____100455
      }
    }else {
      return and__3546__auto____100454
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___100460 = function(x) {
    return true
  };
  var distinct_QMARK___100461 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___100462 = function() {
    var G__100464__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__100456 = cljs.core.set([y, x]);
        var xs__100457 = more;
        while(true) {
          var x__100458 = cljs.core.first.call(null, xs__100457);
          var etc__100459 = cljs.core.next.call(null, xs__100457);
          if(cljs.core.truth_(xs__100457)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__100456, x__100458))) {
              return false
            }else {
              var G__100465 = cljs.core.conj.call(null, s__100456, x__100458);
              var G__100466 = etc__100459;
              s__100456 = G__100465;
              xs__100457 = G__100466;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__100464 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100464__delegate.call(this, x, y, more)
    };
    G__100464.cljs$lang$maxFixedArity = 2;
    G__100464.cljs$lang$applyTo = function(arglist__100467) {
      var x = cljs.core.first(arglist__100467);
      var y = cljs.core.first(cljs.core.next(arglist__100467));
      var more = cljs.core.rest(cljs.core.next(arglist__100467));
      return G__100464__delegate.call(this, x, y, more)
    };
    return G__100464
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___100460.call(this, x);
      case 2:
        return distinct_QMARK___100461.call(this, x, y);
      default:
        return distinct_QMARK___100462.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___100462.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__100468 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__100468))) {
        return r__100468
      }else {
        if(cljs.core.truth_(r__100468)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__100470 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__100471 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__100469 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__100469, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__100469)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__100470.call(this, comp);
      case 2:
        return sort__100471.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__100473 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__100474 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__100473.call(this, keyfn, comp);
      case 3:
        return sort_by__100474.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__100476 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__100477 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__100476.call(this, f, val);
      case 3:
        return reduce__100477.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__100483 = function(f, coll) {
    var temp__3695__auto____100479 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____100479)) {
      var s__100480 = temp__3695__auto____100479;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__100480), cljs.core.next.call(null, s__100480))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__100484 = function(f, val, coll) {
    var val__100481 = val;
    var coll__100482 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__100482)) {
        var G__100486 = f.call(null, val__100481, cljs.core.first.call(null, coll__100482));
        var G__100487 = cljs.core.next.call(null, coll__100482);
        val__100481 = G__100486;
        coll__100482 = G__100487;
        continue
      }else {
        return val__100481
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__100483.call(this, f, val);
      case 3:
        return seq_reduce__100484.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__100488 = null;
  var G__100488__100489 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__100488__100490 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__100488 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__100488__100489.call(this, coll, f);
      case 3:
        return G__100488__100490.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100488
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___100492 = function() {
    return 0
  };
  var _PLUS___100493 = function(x) {
    return x
  };
  var _PLUS___100494 = function(x, y) {
    return x + y
  };
  var _PLUS___100495 = function() {
    var G__100497__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__100497 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100497__delegate.call(this, x, y, more)
    };
    G__100497.cljs$lang$maxFixedArity = 2;
    G__100497.cljs$lang$applyTo = function(arglist__100498) {
      var x = cljs.core.first(arglist__100498);
      var y = cljs.core.first(cljs.core.next(arglist__100498));
      var more = cljs.core.rest(cljs.core.next(arglist__100498));
      return G__100497__delegate.call(this, x, y, more)
    };
    return G__100497
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___100492.call(this);
      case 1:
        return _PLUS___100493.call(this, x);
      case 2:
        return _PLUS___100494.call(this, x, y);
      default:
        return _PLUS___100495.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___100495.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___100499 = function(x) {
    return-x
  };
  var ___100500 = function(x, y) {
    return x - y
  };
  var ___100501 = function() {
    var G__100503__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__100503 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100503__delegate.call(this, x, y, more)
    };
    G__100503.cljs$lang$maxFixedArity = 2;
    G__100503.cljs$lang$applyTo = function(arglist__100504) {
      var x = cljs.core.first(arglist__100504);
      var y = cljs.core.first(cljs.core.next(arglist__100504));
      var more = cljs.core.rest(cljs.core.next(arglist__100504));
      return G__100503__delegate.call(this, x, y, more)
    };
    return G__100503
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___100499.call(this, x);
      case 2:
        return ___100500.call(this, x, y);
      default:
        return ___100501.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___100501.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___100505 = function() {
    return 1
  };
  var _STAR___100506 = function(x) {
    return x
  };
  var _STAR___100507 = function(x, y) {
    return x * y
  };
  var _STAR___100508 = function() {
    var G__100510__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__100510 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100510__delegate.call(this, x, y, more)
    };
    G__100510.cljs$lang$maxFixedArity = 2;
    G__100510.cljs$lang$applyTo = function(arglist__100511) {
      var x = cljs.core.first(arglist__100511);
      var y = cljs.core.first(cljs.core.next(arglist__100511));
      var more = cljs.core.rest(cljs.core.next(arglist__100511));
      return G__100510__delegate.call(this, x, y, more)
    };
    return G__100510
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___100505.call(this);
      case 1:
        return _STAR___100506.call(this, x);
      case 2:
        return _STAR___100507.call(this, x, y);
      default:
        return _STAR___100508.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___100508.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___100512 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___100513 = function(x, y) {
    return x / y
  };
  var _SLASH___100514 = function() {
    var G__100516__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__100516 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100516__delegate.call(this, x, y, more)
    };
    G__100516.cljs$lang$maxFixedArity = 2;
    G__100516.cljs$lang$applyTo = function(arglist__100517) {
      var x = cljs.core.first(arglist__100517);
      var y = cljs.core.first(cljs.core.next(arglist__100517));
      var more = cljs.core.rest(cljs.core.next(arglist__100517));
      return G__100516__delegate.call(this, x, y, more)
    };
    return G__100516
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___100512.call(this, x);
      case 2:
        return _SLASH___100513.call(this, x, y);
      default:
        return _SLASH___100514.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___100514.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___100518 = function(x) {
    return true
  };
  var _LT___100519 = function(x, y) {
    return x < y
  };
  var _LT___100520 = function() {
    var G__100522__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__100523 = y;
            var G__100524 = cljs.core.first.call(null, more);
            var G__100525 = cljs.core.next.call(null, more);
            x = G__100523;
            y = G__100524;
            more = G__100525;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__100522 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100522__delegate.call(this, x, y, more)
    };
    G__100522.cljs$lang$maxFixedArity = 2;
    G__100522.cljs$lang$applyTo = function(arglist__100526) {
      var x = cljs.core.first(arglist__100526);
      var y = cljs.core.first(cljs.core.next(arglist__100526));
      var more = cljs.core.rest(cljs.core.next(arglist__100526));
      return G__100522__delegate.call(this, x, y, more)
    };
    return G__100522
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___100518.call(this, x);
      case 2:
        return _LT___100519.call(this, x, y);
      default:
        return _LT___100520.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___100520.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___100527 = function(x) {
    return true
  };
  var _LT__EQ___100528 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___100529 = function() {
    var G__100531__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__100532 = y;
            var G__100533 = cljs.core.first.call(null, more);
            var G__100534 = cljs.core.next.call(null, more);
            x = G__100532;
            y = G__100533;
            more = G__100534;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__100531 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100531__delegate.call(this, x, y, more)
    };
    G__100531.cljs$lang$maxFixedArity = 2;
    G__100531.cljs$lang$applyTo = function(arglist__100535) {
      var x = cljs.core.first(arglist__100535);
      var y = cljs.core.first(cljs.core.next(arglist__100535));
      var more = cljs.core.rest(cljs.core.next(arglist__100535));
      return G__100531__delegate.call(this, x, y, more)
    };
    return G__100531
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___100527.call(this, x);
      case 2:
        return _LT__EQ___100528.call(this, x, y);
      default:
        return _LT__EQ___100529.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___100529.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___100536 = function(x) {
    return true
  };
  var _GT___100537 = function(x, y) {
    return x > y
  };
  var _GT___100538 = function() {
    var G__100540__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__100541 = y;
            var G__100542 = cljs.core.first.call(null, more);
            var G__100543 = cljs.core.next.call(null, more);
            x = G__100541;
            y = G__100542;
            more = G__100543;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__100540 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100540__delegate.call(this, x, y, more)
    };
    G__100540.cljs$lang$maxFixedArity = 2;
    G__100540.cljs$lang$applyTo = function(arglist__100544) {
      var x = cljs.core.first(arglist__100544);
      var y = cljs.core.first(cljs.core.next(arglist__100544));
      var more = cljs.core.rest(cljs.core.next(arglist__100544));
      return G__100540__delegate.call(this, x, y, more)
    };
    return G__100540
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___100536.call(this, x);
      case 2:
        return _GT___100537.call(this, x, y);
      default:
        return _GT___100538.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___100538.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___100545 = function(x) {
    return true
  };
  var _GT__EQ___100546 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___100547 = function() {
    var G__100549__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__100550 = y;
            var G__100551 = cljs.core.first.call(null, more);
            var G__100552 = cljs.core.next.call(null, more);
            x = G__100550;
            y = G__100551;
            more = G__100552;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__100549 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100549__delegate.call(this, x, y, more)
    };
    G__100549.cljs$lang$maxFixedArity = 2;
    G__100549.cljs$lang$applyTo = function(arglist__100553) {
      var x = cljs.core.first(arglist__100553);
      var y = cljs.core.first(cljs.core.next(arglist__100553));
      var more = cljs.core.rest(cljs.core.next(arglist__100553));
      return G__100549__delegate.call(this, x, y, more)
    };
    return G__100549
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___100545.call(this, x);
      case 2:
        return _GT__EQ___100546.call(this, x, y);
      default:
        return _GT__EQ___100547.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___100547.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__100554 = function(x) {
    return x
  };
  var max__100555 = function(x, y) {
    return x > y ? x : y
  };
  var max__100556 = function() {
    var G__100558__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__100558 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100558__delegate.call(this, x, y, more)
    };
    G__100558.cljs$lang$maxFixedArity = 2;
    G__100558.cljs$lang$applyTo = function(arglist__100559) {
      var x = cljs.core.first(arglist__100559);
      var y = cljs.core.first(cljs.core.next(arglist__100559));
      var more = cljs.core.rest(cljs.core.next(arglist__100559));
      return G__100558__delegate.call(this, x, y, more)
    };
    return G__100558
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__100554.call(this, x);
      case 2:
        return max__100555.call(this, x, y);
      default:
        return max__100556.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__100556.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__100560 = function(x) {
    return x
  };
  var min__100561 = function(x, y) {
    return x < y ? x : y
  };
  var min__100562 = function() {
    var G__100564__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__100564 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100564__delegate.call(this, x, y, more)
    };
    G__100564.cljs$lang$maxFixedArity = 2;
    G__100564.cljs$lang$applyTo = function(arglist__100565) {
      var x = cljs.core.first(arglist__100565);
      var y = cljs.core.first(cljs.core.next(arglist__100565));
      var more = cljs.core.rest(cljs.core.next(arglist__100565));
      return G__100564__delegate.call(this, x, y, more)
    };
    return G__100564
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__100560.call(this, x);
      case 2:
        return min__100561.call(this, x, y);
      default:
        return min__100562.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__100562.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__100566 = n % d;
  return cljs.core.fix.call(null, (n - rem__100566) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__100567 = cljs.core.quot.call(null, n, d);
  return n - d * q__100567
};
cljs.core.rand = function() {
  var rand = null;
  var rand__100568 = function() {
    return Math.random.call(null)
  };
  var rand__100569 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__100568.call(this);
      case 1:
        return rand__100569.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___100571 = function(x) {
    return true
  };
  var _EQ__EQ___100572 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___100573 = function() {
    var G__100575__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__100576 = y;
            var G__100577 = cljs.core.first.call(null, more);
            var G__100578 = cljs.core.next.call(null, more);
            x = G__100576;
            y = G__100577;
            more = G__100578;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__100575 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100575__delegate.call(this, x, y, more)
    };
    G__100575.cljs$lang$maxFixedArity = 2;
    G__100575.cljs$lang$applyTo = function(arglist__100579) {
      var x = cljs.core.first(arglist__100579);
      var y = cljs.core.first(cljs.core.next(arglist__100579));
      var more = cljs.core.rest(cljs.core.next(arglist__100579));
      return G__100575__delegate.call(this, x, y, more)
    };
    return G__100575
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___100571.call(this, x);
      case 2:
        return _EQ__EQ___100572.call(this, x, y);
      default:
        return _EQ__EQ___100573.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___100573.cljs$lang$applyTo;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__100580 = n;
  var xs__100581 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100582 = xs__100581;
      if(cljs.core.truth_(and__3546__auto____100582)) {
        return n__100580 > 0
      }else {
        return and__3546__auto____100582
      }
    }())) {
      var G__100583 = n__100580 - 1;
      var G__100584 = cljs.core.next.call(null, xs__100581);
      n__100580 = G__100583;
      xs__100581 = G__100584;
      continue
    }else {
      return xs__100581
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__100589 = null;
  var G__100589__100590 = function(coll, n) {
    var temp__3695__auto____100585 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____100585)) {
      var xs__100586 = temp__3695__auto____100585;
      return cljs.core.first.call(null, xs__100586)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__100589__100591 = function(coll, n, not_found) {
    var temp__3695__auto____100587 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____100587)) {
      var xs__100588 = temp__3695__auto____100587;
      return cljs.core.first.call(null, xs__100588)
    }else {
      return not_found
    }
  };
  G__100589 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__100589__100590.call(this, coll, n);
      case 3:
        return G__100589__100591.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100589
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___100593 = function() {
    return""
  };
  var str_STAR___100594 = function(x) {
    if(cljs.core.truth_(x === null)) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___100595 = function() {
    var G__100597__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__100598 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__100599 = cljs.core.next.call(null, more);
            sb = G__100598;
            more = G__100599;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__100597 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__100597__delegate.call(this, x, ys)
    };
    G__100597.cljs$lang$maxFixedArity = 1;
    G__100597.cljs$lang$applyTo = function(arglist__100600) {
      var x = cljs.core.first(arglist__100600);
      var ys = cljs.core.rest(arglist__100600);
      return G__100597__delegate.call(this, x, ys)
    };
    return G__100597
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___100593.call(this);
      case 1:
        return str_STAR___100594.call(this, x);
      default:
        return str_STAR___100595.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___100595.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__100601 = function() {
    return""
  };
  var str__100602 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(x === null)) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__100603 = function() {
    var G__100605__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__100606 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__100607 = cljs.core.next.call(null, more);
            sb = G__100606;
            more = G__100607;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__100605 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__100605__delegate.call(this, x, ys)
    };
    G__100605.cljs$lang$maxFixedArity = 1;
    G__100605.cljs$lang$applyTo = function(arglist__100608) {
      var x = cljs.core.first(arglist__100608);
      var ys = cljs.core.rest(arglist__100608);
      return G__100605__delegate.call(this, x, ys)
    };
    return G__100605
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__100601.call(this);
      case 1:
        return str__100602.call(this, x);
      default:
        return str__100603.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__100603.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__100609 = function(s, start) {
    return s.substring(start)
  };
  var subs__100610 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__100609.call(this, s, start);
      case 3:
        return subs__100610.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__100612 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__100613 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__100612.call(this, ns);
      case 2:
        return symbol__100613.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__100615 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__100616 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__100615.call(this, ns);
      case 2:
        return keyword__100616.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__100618 = cljs.core.seq.call(null, x);
    var ys__100619 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__100618 === null)) {
        return ys__100619 === null
      }else {
        if(cljs.core.truth_(ys__100619 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__100618), cljs.core.first.call(null, ys__100619)))) {
            var G__100620 = cljs.core.next.call(null, xs__100618);
            var G__100621 = cljs.core.next.call(null, ys__100619);
            xs__100618 = G__100620;
            ys__100619 = G__100621;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__100622_SHARP_, p2__100623_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__100622_SHARP_, cljs.core.hash.call(null, p2__100623_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__100624__100625 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__100624__100625)) {
    var G__100627__100629 = cljs.core.first.call(null, G__100624__100625);
    var vec__100628__100630 = G__100627__100629;
    var key_name__100631 = cljs.core.nth.call(null, vec__100628__100630, 0, null);
    var f__100632 = cljs.core.nth.call(null, vec__100628__100630, 1, null);
    var G__100624__100633 = G__100624__100625;
    var G__100627__100634 = G__100627__100629;
    var G__100624__100635 = G__100624__100633;
    while(true) {
      var vec__100636__100637 = G__100627__100634;
      var key_name__100638 = cljs.core.nth.call(null, vec__100636__100637, 0, null);
      var f__100639 = cljs.core.nth.call(null, vec__100636__100637, 1, null);
      var G__100624__100640 = G__100624__100635;
      var str_name__100641 = cljs.core.name.call(null, key_name__100638);
      obj[str_name__100641] = f__100639;
      var temp__3698__auto____100642 = cljs.core.next.call(null, G__100624__100640);
      if(cljs.core.truth_(temp__3698__auto____100642)) {
        var G__100624__100643 = temp__3698__auto____100642;
        var G__100644 = cljs.core.first.call(null, G__100624__100643);
        var G__100645 = G__100624__100643;
        G__100627__100634 = G__100644;
        G__100624__100635 = G__100645;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__100646 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__100647 = this;
  return new cljs.core.List(this__100647.meta, o, coll, this__100647.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__100648 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__100649 = this;
  return this__100649.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__100650 = this;
  return this__100650.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__100651 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__100652 = this;
  return this__100652.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__100653 = this;
  return this__100653.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__100654 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__100655 = this;
  return new cljs.core.List(meta, this__100655.first, this__100655.rest, this__100655.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__100656 = this;
  return this__100656.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__100657 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__100658 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__100659 = this;
  return new cljs.core.List(this__100659.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__100660 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__100661 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__100662 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__100663 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__100664 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__100665 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__100666 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__100667 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__100668 = this;
  return this__100668.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__100669 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__100670) {
    var items = cljs.core.seq(arglist__100670);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__100671 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__100672 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__100673 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__100674 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__100674.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__100675 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__100676 = this;
  return this__100676.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__100677 = this;
  if(cljs.core.truth_(this__100677.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__100677.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__100678 = this;
  return this__100678.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__100679 = this;
  return new cljs.core.Cons(meta, this__100679.first, this__100679.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__100680 = null;
  var G__100680__100681 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__100680__100682 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__100680 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__100680__100681.call(this, string, f);
      case 3:
        return G__100680__100682.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100680
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__100684 = null;
  var G__100684__100685 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__100684__100686 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__100684 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__100684__100685.call(this, string, k);
      case 3:
        return G__100684__100686.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100684
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__100688 = null;
  var G__100688__100689 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__100688__100690 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__100688 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__100688__100689.call(this, string, n);
      case 3:
        return G__100688__100690.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100688
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__100698 = null;
  var G__100698__100699 = function(tsym100692, coll) {
    var tsym100692__100694 = this;
    var this$__100695 = tsym100692__100694;
    return cljs.core.get.call(null, coll, this$__100695.toString())
  };
  var G__100698__100700 = function(tsym100693, coll, not_found) {
    var tsym100693__100696 = this;
    var this$__100697 = tsym100693__100696;
    return cljs.core.get.call(null, coll, this$__100697.toString(), not_found)
  };
  G__100698 = function(tsym100693, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__100698__100699.call(this, tsym100693, coll);
      case 3:
        return G__100698__100700.call(this, tsym100693, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__100698
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__100702 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__100702
  }else {
    lazy_seq.x = x__100702.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__100703 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__100704 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__100705 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__100706 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__100706.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__100707 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__100708 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__100709 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__100710 = this;
  return this__100710.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__100711 = this;
  return new cljs.core.LazySeq(meta, this__100711.realized, this__100711.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__100712 = [];
  var s__100713 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__100713))) {
      ary__100712.push(cljs.core.first.call(null, s__100713));
      var G__100714 = cljs.core.next.call(null, s__100713);
      s__100713 = G__100714;
      continue
    }else {
      return ary__100712
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__100715 = s;
  var i__100716 = n;
  var sum__100717 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____100718 = i__100716 > 0;
      if(cljs.core.truth_(and__3546__auto____100718)) {
        return cljs.core.seq.call(null, s__100715)
      }else {
        return and__3546__auto____100718
      }
    }())) {
      var G__100719 = cljs.core.next.call(null, s__100715);
      var G__100720 = i__100716 - 1;
      var G__100721 = sum__100717 + 1;
      s__100715 = G__100719;
      i__100716 = G__100720;
      sum__100717 = G__100721;
      continue
    }else {
      return sum__100717
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(arglist === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.next.call(null, arglist) === null)) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__100725 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__100726 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__100727 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__100722 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__100722)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__100722), concat.call(null, cljs.core.rest.call(null, s__100722), y))
      }else {
        return y
      }
    })
  };
  var concat__100728 = function() {
    var G__100730__delegate = function(x, y, zs) {
      var cat__100724 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__100723 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__100723)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__100723), cat.call(null, cljs.core.rest.call(null, xys__100723), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__100724.call(null, concat.call(null, x, y), zs)
    };
    var G__100730 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100730__delegate.call(this, x, y, zs)
    };
    G__100730.cljs$lang$maxFixedArity = 2;
    G__100730.cljs$lang$applyTo = function(arglist__100731) {
      var x = cljs.core.first(arglist__100731);
      var y = cljs.core.first(cljs.core.next(arglist__100731));
      var zs = cljs.core.rest(cljs.core.next(arglist__100731));
      return G__100730__delegate.call(this, x, y, zs)
    };
    return G__100730
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__100725.call(this);
      case 1:
        return concat__100726.call(this, x);
      case 2:
        return concat__100727.call(this, x, y);
      default:
        return concat__100728.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__100728.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___100732 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___100733 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___100734 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___100735 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___100736 = function() {
    var G__100738__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__100738 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__100738__delegate.call(this, a, b, c, d, more)
    };
    G__100738.cljs$lang$maxFixedArity = 4;
    G__100738.cljs$lang$applyTo = function(arglist__100739) {
      var a = cljs.core.first(arglist__100739);
      var b = cljs.core.first(cljs.core.next(arglist__100739));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100739)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__100739))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__100739))));
      return G__100738__delegate.call(this, a, b, c, d, more)
    };
    return G__100738
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___100732.call(this, a);
      case 2:
        return list_STAR___100733.call(this, a, b);
      case 3:
        return list_STAR___100734.call(this, a, b, c);
      case 4:
        return list_STAR___100735.call(this, a, b, c, d);
      default:
        return list_STAR___100736.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___100736.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__100749 = function(f, args) {
    var fixed_arity__100740 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__100740 + 1) <= fixed_arity__100740)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__100750 = function(f, x, args) {
    var arglist__100741 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__100742 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__100741, fixed_arity__100742) <= fixed_arity__100742)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__100741))
      }else {
        return f.cljs$lang$applyTo(arglist__100741)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__100741))
    }
  };
  var apply__100751 = function(f, x, y, args) {
    var arglist__100743 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__100744 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__100743, fixed_arity__100744) <= fixed_arity__100744)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__100743))
      }else {
        return f.cljs$lang$applyTo(arglist__100743)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__100743))
    }
  };
  var apply__100752 = function(f, x, y, z, args) {
    var arglist__100745 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__100746 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__100745, fixed_arity__100746) <= fixed_arity__100746)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__100745))
      }else {
        return f.cljs$lang$applyTo(arglist__100745)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__100745))
    }
  };
  var apply__100753 = function() {
    var G__100755__delegate = function(f, a, b, c, d, args) {
      var arglist__100747 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__100748 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__100747, fixed_arity__100748) <= fixed_arity__100748)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__100747))
        }else {
          return f.cljs$lang$applyTo(arglist__100747)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__100747))
      }
    };
    var G__100755 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__100755__delegate.call(this, f, a, b, c, d, args)
    };
    G__100755.cljs$lang$maxFixedArity = 5;
    G__100755.cljs$lang$applyTo = function(arglist__100756) {
      var f = cljs.core.first(arglist__100756);
      var a = cljs.core.first(cljs.core.next(arglist__100756));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100756)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__100756))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__100756)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__100756)))));
      return G__100755__delegate.call(this, f, a, b, c, d, args)
    };
    return G__100755
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__100749.call(this, f, a);
      case 3:
        return apply__100750.call(this, f, a, b);
      case 4:
        return apply__100751.call(this, f, a, b, c);
      case 5:
        return apply__100752.call(this, f, a, b, c, d);
      default:
        return apply__100753.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__100753.cljs$lang$applyTo;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__100757) {
    var obj = cljs.core.first(arglist__100757);
    var f = cljs.core.first(cljs.core.next(arglist__100757));
    var args = cljs.core.rest(cljs.core.next(arglist__100757));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___100758 = function(x) {
    return false
  };
  var not_EQ___100759 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___100760 = function() {
    var G__100762__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__100762 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__100762__delegate.call(this, x, y, more)
    };
    G__100762.cljs$lang$maxFixedArity = 2;
    G__100762.cljs$lang$applyTo = function(arglist__100763) {
      var x = cljs.core.first(arglist__100763);
      var y = cljs.core.first(cljs.core.next(arglist__100763));
      var more = cljs.core.rest(cljs.core.next(arglist__100763));
      return G__100762__delegate.call(this, x, y, more)
    };
    return G__100762
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___100758.call(this, x);
      case 2:
        return not_EQ___100759.call(this, x, y);
      default:
        return not_EQ___100760.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___100760.cljs$lang$applyTo;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll) === null)) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__100764 = pred;
        var G__100765 = cljs.core.next.call(null, coll);
        pred = G__100764;
        coll = G__100765;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____100766 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____100766)) {
        return or__3548__auto____100766
      }else {
        var G__100767 = pred;
        var G__100768 = cljs.core.next.call(null, coll);
        pred = G__100767;
        coll = G__100768;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__100769 = null;
    var G__100769__100770 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__100769__100771 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__100769__100772 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__100769__100773 = function() {
      var G__100775__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__100775 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__100775__delegate.call(this, x, y, zs)
      };
      G__100775.cljs$lang$maxFixedArity = 2;
      G__100775.cljs$lang$applyTo = function(arglist__100776) {
        var x = cljs.core.first(arglist__100776);
        var y = cljs.core.first(cljs.core.next(arglist__100776));
        var zs = cljs.core.rest(cljs.core.next(arglist__100776));
        return G__100775__delegate.call(this, x, y, zs)
      };
      return G__100775
    }();
    G__100769 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__100769__100770.call(this);
        case 1:
          return G__100769__100771.call(this, x);
        case 2:
          return G__100769__100772.call(this, x, y);
        default:
          return G__100769__100773.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__100769.cljs$lang$maxFixedArity = 2;
    G__100769.cljs$lang$applyTo = G__100769__100773.cljs$lang$applyTo;
    return G__100769
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__100777__delegate = function(args) {
      return x
    };
    var G__100777 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__100777__delegate.call(this, args)
    };
    G__100777.cljs$lang$maxFixedArity = 0;
    G__100777.cljs$lang$applyTo = function(arglist__100778) {
      var args = cljs.core.seq(arglist__100778);
      return G__100777__delegate.call(this, args)
    };
    return G__100777
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__100782 = function() {
    return cljs.core.identity
  };
  var comp__100783 = function(f) {
    return f
  };
  var comp__100784 = function(f, g) {
    return function() {
      var G__100788 = null;
      var G__100788__100789 = function() {
        return f.call(null, g.call(null))
      };
      var G__100788__100790 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__100788__100791 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__100788__100792 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__100788__100793 = function() {
        var G__100795__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__100795 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__100795__delegate.call(this, x, y, z, args)
        };
        G__100795.cljs$lang$maxFixedArity = 3;
        G__100795.cljs$lang$applyTo = function(arglist__100796) {
          var x = cljs.core.first(arglist__100796);
          var y = cljs.core.first(cljs.core.next(arglist__100796));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100796)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100796)));
          return G__100795__delegate.call(this, x, y, z, args)
        };
        return G__100795
      }();
      G__100788 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__100788__100789.call(this);
          case 1:
            return G__100788__100790.call(this, x);
          case 2:
            return G__100788__100791.call(this, x, y);
          case 3:
            return G__100788__100792.call(this, x, y, z);
          default:
            return G__100788__100793.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__100788.cljs$lang$maxFixedArity = 3;
      G__100788.cljs$lang$applyTo = G__100788__100793.cljs$lang$applyTo;
      return G__100788
    }()
  };
  var comp__100785 = function(f, g, h) {
    return function() {
      var G__100797 = null;
      var G__100797__100798 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__100797__100799 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__100797__100800 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__100797__100801 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__100797__100802 = function() {
        var G__100804__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__100804 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__100804__delegate.call(this, x, y, z, args)
        };
        G__100804.cljs$lang$maxFixedArity = 3;
        G__100804.cljs$lang$applyTo = function(arglist__100805) {
          var x = cljs.core.first(arglist__100805);
          var y = cljs.core.first(cljs.core.next(arglist__100805));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100805)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100805)));
          return G__100804__delegate.call(this, x, y, z, args)
        };
        return G__100804
      }();
      G__100797 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__100797__100798.call(this);
          case 1:
            return G__100797__100799.call(this, x);
          case 2:
            return G__100797__100800.call(this, x, y);
          case 3:
            return G__100797__100801.call(this, x, y, z);
          default:
            return G__100797__100802.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__100797.cljs$lang$maxFixedArity = 3;
      G__100797.cljs$lang$applyTo = G__100797__100802.cljs$lang$applyTo;
      return G__100797
    }()
  };
  var comp__100786 = function() {
    var G__100806__delegate = function(f1, f2, f3, fs) {
      var fs__100779 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__100807__delegate = function(args) {
          var ret__100780 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__100779), args);
          var fs__100781 = cljs.core.next.call(null, fs__100779);
          while(true) {
            if(cljs.core.truth_(fs__100781)) {
              var G__100808 = cljs.core.first.call(null, fs__100781).call(null, ret__100780);
              var G__100809 = cljs.core.next.call(null, fs__100781);
              ret__100780 = G__100808;
              fs__100781 = G__100809;
              continue
            }else {
              return ret__100780
            }
            break
          }
        };
        var G__100807 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__100807__delegate.call(this, args)
        };
        G__100807.cljs$lang$maxFixedArity = 0;
        G__100807.cljs$lang$applyTo = function(arglist__100810) {
          var args = cljs.core.seq(arglist__100810);
          return G__100807__delegate.call(this, args)
        };
        return G__100807
      }()
    };
    var G__100806 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__100806__delegate.call(this, f1, f2, f3, fs)
    };
    G__100806.cljs$lang$maxFixedArity = 3;
    G__100806.cljs$lang$applyTo = function(arglist__100811) {
      var f1 = cljs.core.first(arglist__100811);
      var f2 = cljs.core.first(cljs.core.next(arglist__100811));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100811)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100811)));
      return G__100806__delegate.call(this, f1, f2, f3, fs)
    };
    return G__100806
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__100782.call(this);
      case 1:
        return comp__100783.call(this, f1);
      case 2:
        return comp__100784.call(this, f1, f2);
      case 3:
        return comp__100785.call(this, f1, f2, f3);
      default:
        return comp__100786.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__100786.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__100812 = function(f, arg1) {
    return function() {
      var G__100817__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__100817 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__100817__delegate.call(this, args)
      };
      G__100817.cljs$lang$maxFixedArity = 0;
      G__100817.cljs$lang$applyTo = function(arglist__100818) {
        var args = cljs.core.seq(arglist__100818);
        return G__100817__delegate.call(this, args)
      };
      return G__100817
    }()
  };
  var partial__100813 = function(f, arg1, arg2) {
    return function() {
      var G__100819__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__100819 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__100819__delegate.call(this, args)
      };
      G__100819.cljs$lang$maxFixedArity = 0;
      G__100819.cljs$lang$applyTo = function(arglist__100820) {
        var args = cljs.core.seq(arglist__100820);
        return G__100819__delegate.call(this, args)
      };
      return G__100819
    }()
  };
  var partial__100814 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__100821__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__100821 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__100821__delegate.call(this, args)
      };
      G__100821.cljs$lang$maxFixedArity = 0;
      G__100821.cljs$lang$applyTo = function(arglist__100822) {
        var args = cljs.core.seq(arglist__100822);
        return G__100821__delegate.call(this, args)
      };
      return G__100821
    }()
  };
  var partial__100815 = function() {
    var G__100823__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__100824__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__100824 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__100824__delegate.call(this, args)
        };
        G__100824.cljs$lang$maxFixedArity = 0;
        G__100824.cljs$lang$applyTo = function(arglist__100825) {
          var args = cljs.core.seq(arglist__100825);
          return G__100824__delegate.call(this, args)
        };
        return G__100824
      }()
    };
    var G__100823 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__100823__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__100823.cljs$lang$maxFixedArity = 4;
    G__100823.cljs$lang$applyTo = function(arglist__100826) {
      var f = cljs.core.first(arglist__100826);
      var arg1 = cljs.core.first(cljs.core.next(arglist__100826));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100826)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__100826))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__100826))));
      return G__100823__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__100823
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__100812.call(this, f, arg1);
      case 3:
        return partial__100813.call(this, f, arg1, arg2);
      case 4:
        return partial__100814.call(this, f, arg1, arg2, arg3);
      default:
        return partial__100815.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__100815.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__100827 = function(f, x) {
    return function() {
      var G__100831 = null;
      var G__100831__100832 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__100831__100833 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__100831__100834 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__100831__100835 = function() {
        var G__100837__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__100837 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__100837__delegate.call(this, a, b, c, ds)
        };
        G__100837.cljs$lang$maxFixedArity = 3;
        G__100837.cljs$lang$applyTo = function(arglist__100838) {
          var a = cljs.core.first(arglist__100838);
          var b = cljs.core.first(cljs.core.next(arglist__100838));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100838)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100838)));
          return G__100837__delegate.call(this, a, b, c, ds)
        };
        return G__100837
      }();
      G__100831 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__100831__100832.call(this, a);
          case 2:
            return G__100831__100833.call(this, a, b);
          case 3:
            return G__100831__100834.call(this, a, b, c);
          default:
            return G__100831__100835.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__100831.cljs$lang$maxFixedArity = 3;
      G__100831.cljs$lang$applyTo = G__100831__100835.cljs$lang$applyTo;
      return G__100831
    }()
  };
  var fnil__100828 = function(f, x, y) {
    return function() {
      var G__100839 = null;
      var G__100839__100840 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__100839__100841 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__100839__100842 = function() {
        var G__100844__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__100844 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__100844__delegate.call(this, a, b, c, ds)
        };
        G__100844.cljs$lang$maxFixedArity = 3;
        G__100844.cljs$lang$applyTo = function(arglist__100845) {
          var a = cljs.core.first(arglist__100845);
          var b = cljs.core.first(cljs.core.next(arglist__100845));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100845)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100845)));
          return G__100844__delegate.call(this, a, b, c, ds)
        };
        return G__100844
      }();
      G__100839 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__100839__100840.call(this, a, b);
          case 3:
            return G__100839__100841.call(this, a, b, c);
          default:
            return G__100839__100842.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__100839.cljs$lang$maxFixedArity = 3;
      G__100839.cljs$lang$applyTo = G__100839__100842.cljs$lang$applyTo;
      return G__100839
    }()
  };
  var fnil__100829 = function(f, x, y, z) {
    return function() {
      var G__100846 = null;
      var G__100846__100847 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__100846__100848 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__100846__100849 = function() {
        var G__100851__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__100851 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__100851__delegate.call(this, a, b, c, ds)
        };
        G__100851.cljs$lang$maxFixedArity = 3;
        G__100851.cljs$lang$applyTo = function(arglist__100852) {
          var a = cljs.core.first(arglist__100852);
          var b = cljs.core.first(cljs.core.next(arglist__100852));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100852)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100852)));
          return G__100851__delegate.call(this, a, b, c, ds)
        };
        return G__100851
      }();
      G__100846 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__100846__100847.call(this, a, b);
          case 3:
            return G__100846__100848.call(this, a, b, c);
          default:
            return G__100846__100849.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__100846.cljs$lang$maxFixedArity = 3;
      G__100846.cljs$lang$applyTo = G__100846__100849.cljs$lang$applyTo;
      return G__100846
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__100827.call(this, f, x);
      case 3:
        return fnil__100828.call(this, f, x, y);
      case 4:
        return fnil__100829.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__100855 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____100853 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____100853)) {
        var s__100854 = temp__3698__auto____100853;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__100854)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__100854)))
      }else {
        return null
      }
    })
  };
  return mapi__100855.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____100856 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____100856)) {
      var s__100857 = temp__3698__auto____100856;
      var x__100858 = f.call(null, cljs.core.first.call(null, s__100857));
      if(cljs.core.truth_(x__100858 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__100857))
      }else {
        return cljs.core.cons.call(null, x__100858, keep.call(null, f, cljs.core.rest.call(null, s__100857)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__100868 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____100865 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____100865)) {
        var s__100866 = temp__3698__auto____100865;
        var x__100867 = f.call(null, idx, cljs.core.first.call(null, s__100866));
        if(cljs.core.truth_(x__100867 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__100866))
        }else {
          return cljs.core.cons.call(null, x__100867, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__100866)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__100868.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__100913 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__100918 = function() {
        return true
      };
      var ep1__100919 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__100920 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____100875 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____100875)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____100875
          }
        }())
      };
      var ep1__100921 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____100876 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____100876)) {
            var and__3546__auto____100877 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____100877)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____100877
            }
          }else {
            return and__3546__auto____100876
          }
        }())
      };
      var ep1__100922 = function() {
        var G__100924__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____100878 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____100878)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____100878
            }
          }())
        };
        var G__100924 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__100924__delegate.call(this, x, y, z, args)
        };
        G__100924.cljs$lang$maxFixedArity = 3;
        G__100924.cljs$lang$applyTo = function(arglist__100925) {
          var x = cljs.core.first(arglist__100925);
          var y = cljs.core.first(cljs.core.next(arglist__100925));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100925)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100925)));
          return G__100924__delegate.call(this, x, y, z, args)
        };
        return G__100924
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__100918.call(this);
          case 1:
            return ep1__100919.call(this, x);
          case 2:
            return ep1__100920.call(this, x, y);
          case 3:
            return ep1__100921.call(this, x, y, z);
          default:
            return ep1__100922.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__100922.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__100914 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__100926 = function() {
        return true
      };
      var ep2__100927 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____100879 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____100879)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____100879
          }
        }())
      };
      var ep2__100928 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____100880 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____100880)) {
            var and__3546__auto____100881 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____100881)) {
              var and__3546__auto____100882 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____100882)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____100882
              }
            }else {
              return and__3546__auto____100881
            }
          }else {
            return and__3546__auto____100880
          }
        }())
      };
      var ep2__100929 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____100883 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____100883)) {
            var and__3546__auto____100884 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____100884)) {
              var and__3546__auto____100885 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____100885)) {
                var and__3546__auto____100886 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____100886)) {
                  var and__3546__auto____100887 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____100887)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____100887
                  }
                }else {
                  return and__3546__auto____100886
                }
              }else {
                return and__3546__auto____100885
              }
            }else {
              return and__3546__auto____100884
            }
          }else {
            return and__3546__auto____100883
          }
        }())
      };
      var ep2__100930 = function() {
        var G__100932__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____100888 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____100888)) {
              return cljs.core.every_QMARK_.call(null, function(p1__100859_SHARP_) {
                var and__3546__auto____100889 = p1.call(null, p1__100859_SHARP_);
                if(cljs.core.truth_(and__3546__auto____100889)) {
                  return p2.call(null, p1__100859_SHARP_)
                }else {
                  return and__3546__auto____100889
                }
              }, args)
            }else {
              return and__3546__auto____100888
            }
          }())
        };
        var G__100932 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__100932__delegate.call(this, x, y, z, args)
        };
        G__100932.cljs$lang$maxFixedArity = 3;
        G__100932.cljs$lang$applyTo = function(arglist__100933) {
          var x = cljs.core.first(arglist__100933);
          var y = cljs.core.first(cljs.core.next(arglist__100933));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100933)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100933)));
          return G__100932__delegate.call(this, x, y, z, args)
        };
        return G__100932
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__100926.call(this);
          case 1:
            return ep2__100927.call(this, x);
          case 2:
            return ep2__100928.call(this, x, y);
          case 3:
            return ep2__100929.call(this, x, y, z);
          default:
            return ep2__100930.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__100930.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__100915 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__100934 = function() {
        return true
      };
      var ep3__100935 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____100890 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____100890)) {
            var and__3546__auto____100891 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____100891)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____100891
            }
          }else {
            return and__3546__auto____100890
          }
        }())
      };
      var ep3__100936 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____100892 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____100892)) {
            var and__3546__auto____100893 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____100893)) {
              var and__3546__auto____100894 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____100894)) {
                var and__3546__auto____100895 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____100895)) {
                  var and__3546__auto____100896 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____100896)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____100896
                  }
                }else {
                  return and__3546__auto____100895
                }
              }else {
                return and__3546__auto____100894
              }
            }else {
              return and__3546__auto____100893
            }
          }else {
            return and__3546__auto____100892
          }
        }())
      };
      var ep3__100937 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____100897 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____100897)) {
            var and__3546__auto____100898 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____100898)) {
              var and__3546__auto____100899 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____100899)) {
                var and__3546__auto____100900 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____100900)) {
                  var and__3546__auto____100901 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____100901)) {
                    var and__3546__auto____100902 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____100902)) {
                      var and__3546__auto____100903 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____100903)) {
                        var and__3546__auto____100904 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____100904)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____100904
                        }
                      }else {
                        return and__3546__auto____100903
                      }
                    }else {
                      return and__3546__auto____100902
                    }
                  }else {
                    return and__3546__auto____100901
                  }
                }else {
                  return and__3546__auto____100900
                }
              }else {
                return and__3546__auto____100899
              }
            }else {
              return and__3546__auto____100898
            }
          }else {
            return and__3546__auto____100897
          }
        }())
      };
      var ep3__100938 = function() {
        var G__100940__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____100905 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____100905)) {
              return cljs.core.every_QMARK_.call(null, function(p1__100860_SHARP_) {
                var and__3546__auto____100906 = p1.call(null, p1__100860_SHARP_);
                if(cljs.core.truth_(and__3546__auto____100906)) {
                  var and__3546__auto____100907 = p2.call(null, p1__100860_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____100907)) {
                    return p3.call(null, p1__100860_SHARP_)
                  }else {
                    return and__3546__auto____100907
                  }
                }else {
                  return and__3546__auto____100906
                }
              }, args)
            }else {
              return and__3546__auto____100905
            }
          }())
        };
        var G__100940 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__100940__delegate.call(this, x, y, z, args)
        };
        G__100940.cljs$lang$maxFixedArity = 3;
        G__100940.cljs$lang$applyTo = function(arglist__100941) {
          var x = cljs.core.first(arglist__100941);
          var y = cljs.core.first(cljs.core.next(arglist__100941));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100941)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100941)));
          return G__100940__delegate.call(this, x, y, z, args)
        };
        return G__100940
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__100934.call(this);
          case 1:
            return ep3__100935.call(this, x);
          case 2:
            return ep3__100936.call(this, x, y);
          case 3:
            return ep3__100937.call(this, x, y, z);
          default:
            return ep3__100938.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__100938.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__100916 = function() {
    var G__100942__delegate = function(p1, p2, p3, ps) {
      var ps__100908 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__100943 = function() {
          return true
        };
        var epn__100944 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__100861_SHARP_) {
            return p1__100861_SHARP_.call(null, x)
          }, ps__100908)
        };
        var epn__100945 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__100862_SHARP_) {
            var and__3546__auto____100909 = p1__100862_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____100909)) {
              return p1__100862_SHARP_.call(null, y)
            }else {
              return and__3546__auto____100909
            }
          }, ps__100908)
        };
        var epn__100946 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__100863_SHARP_) {
            var and__3546__auto____100910 = p1__100863_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____100910)) {
              var and__3546__auto____100911 = p1__100863_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____100911)) {
                return p1__100863_SHARP_.call(null, z)
              }else {
                return and__3546__auto____100911
              }
            }else {
              return and__3546__auto____100910
            }
          }, ps__100908)
        };
        var epn__100947 = function() {
          var G__100949__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____100912 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____100912)) {
                return cljs.core.every_QMARK_.call(null, function(p1__100864_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__100864_SHARP_, args)
                }, ps__100908)
              }else {
                return and__3546__auto____100912
              }
            }())
          };
          var G__100949 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__100949__delegate.call(this, x, y, z, args)
          };
          G__100949.cljs$lang$maxFixedArity = 3;
          G__100949.cljs$lang$applyTo = function(arglist__100950) {
            var x = cljs.core.first(arglist__100950);
            var y = cljs.core.first(cljs.core.next(arglist__100950));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100950)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100950)));
            return G__100949__delegate.call(this, x, y, z, args)
          };
          return G__100949
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__100943.call(this);
            case 1:
              return epn__100944.call(this, x);
            case 2:
              return epn__100945.call(this, x, y);
            case 3:
              return epn__100946.call(this, x, y, z);
            default:
              return epn__100947.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__100947.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__100942 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__100942__delegate.call(this, p1, p2, p3, ps)
    };
    G__100942.cljs$lang$maxFixedArity = 3;
    G__100942.cljs$lang$applyTo = function(arglist__100951) {
      var p1 = cljs.core.first(arglist__100951);
      var p2 = cljs.core.first(cljs.core.next(arglist__100951));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__100951)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__100951)));
      return G__100942__delegate.call(this, p1, p2, p3, ps)
    };
    return G__100942
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__100913.call(this, p1);
      case 2:
        return every_pred__100914.call(this, p1, p2);
      case 3:
        return every_pred__100915.call(this, p1, p2, p3);
      default:
        return every_pred__100916.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__100916.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__100991 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__100996 = function() {
        return null
      };
      var sp1__100997 = function(x) {
        return p.call(null, x)
      };
      var sp1__100998 = function(x, y) {
        var or__3548__auto____100953 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____100953)) {
          return or__3548__auto____100953
        }else {
          return p.call(null, y)
        }
      };
      var sp1__100999 = function(x, y, z) {
        var or__3548__auto____100954 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____100954)) {
          return or__3548__auto____100954
        }else {
          var or__3548__auto____100955 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____100955)) {
            return or__3548__auto____100955
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__101000 = function() {
        var G__101002__delegate = function(x, y, z, args) {
          var or__3548__auto____100956 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____100956)) {
            return or__3548__auto____100956
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__101002 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__101002__delegate.call(this, x, y, z, args)
        };
        G__101002.cljs$lang$maxFixedArity = 3;
        G__101002.cljs$lang$applyTo = function(arglist__101003) {
          var x = cljs.core.first(arglist__101003);
          var y = cljs.core.first(cljs.core.next(arglist__101003));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101003)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101003)));
          return G__101002__delegate.call(this, x, y, z, args)
        };
        return G__101002
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__100996.call(this);
          case 1:
            return sp1__100997.call(this, x);
          case 2:
            return sp1__100998.call(this, x, y);
          case 3:
            return sp1__100999.call(this, x, y, z);
          default:
            return sp1__101000.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__101000.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__100992 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__101004 = function() {
        return null
      };
      var sp2__101005 = function(x) {
        var or__3548__auto____100957 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____100957)) {
          return or__3548__auto____100957
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__101006 = function(x, y) {
        var or__3548__auto____100958 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____100958)) {
          return or__3548__auto____100958
        }else {
          var or__3548__auto____100959 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____100959)) {
            return or__3548__auto____100959
          }else {
            var or__3548__auto____100960 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____100960)) {
              return or__3548__auto____100960
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__101007 = function(x, y, z) {
        var or__3548__auto____100961 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____100961)) {
          return or__3548__auto____100961
        }else {
          var or__3548__auto____100962 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____100962)) {
            return or__3548__auto____100962
          }else {
            var or__3548__auto____100963 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____100963)) {
              return or__3548__auto____100963
            }else {
              var or__3548__auto____100964 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____100964)) {
                return or__3548__auto____100964
              }else {
                var or__3548__auto____100965 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____100965)) {
                  return or__3548__auto____100965
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__101008 = function() {
        var G__101010__delegate = function(x, y, z, args) {
          var or__3548__auto____100966 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____100966)) {
            return or__3548__auto____100966
          }else {
            return cljs.core.some.call(null, function(p1__100869_SHARP_) {
              var or__3548__auto____100967 = p1.call(null, p1__100869_SHARP_);
              if(cljs.core.truth_(or__3548__auto____100967)) {
                return or__3548__auto____100967
              }else {
                return p2.call(null, p1__100869_SHARP_)
              }
            }, args)
          }
        };
        var G__101010 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__101010__delegate.call(this, x, y, z, args)
        };
        G__101010.cljs$lang$maxFixedArity = 3;
        G__101010.cljs$lang$applyTo = function(arglist__101011) {
          var x = cljs.core.first(arglist__101011);
          var y = cljs.core.first(cljs.core.next(arglist__101011));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101011)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101011)));
          return G__101010__delegate.call(this, x, y, z, args)
        };
        return G__101010
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__101004.call(this);
          case 1:
            return sp2__101005.call(this, x);
          case 2:
            return sp2__101006.call(this, x, y);
          case 3:
            return sp2__101007.call(this, x, y, z);
          default:
            return sp2__101008.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__101008.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__100993 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__101012 = function() {
        return null
      };
      var sp3__101013 = function(x) {
        var or__3548__auto____100968 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____100968)) {
          return or__3548__auto____100968
        }else {
          var or__3548__auto____100969 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____100969)) {
            return or__3548__auto____100969
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__101014 = function(x, y) {
        var or__3548__auto____100970 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____100970)) {
          return or__3548__auto____100970
        }else {
          var or__3548__auto____100971 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____100971)) {
            return or__3548__auto____100971
          }else {
            var or__3548__auto____100972 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____100972)) {
              return or__3548__auto____100972
            }else {
              var or__3548__auto____100973 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____100973)) {
                return or__3548__auto____100973
              }else {
                var or__3548__auto____100974 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____100974)) {
                  return or__3548__auto____100974
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__101015 = function(x, y, z) {
        var or__3548__auto____100975 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____100975)) {
          return or__3548__auto____100975
        }else {
          var or__3548__auto____100976 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____100976)) {
            return or__3548__auto____100976
          }else {
            var or__3548__auto____100977 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____100977)) {
              return or__3548__auto____100977
            }else {
              var or__3548__auto____100978 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____100978)) {
                return or__3548__auto____100978
              }else {
                var or__3548__auto____100979 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____100979)) {
                  return or__3548__auto____100979
                }else {
                  var or__3548__auto____100980 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____100980)) {
                    return or__3548__auto____100980
                  }else {
                    var or__3548__auto____100981 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____100981)) {
                      return or__3548__auto____100981
                    }else {
                      var or__3548__auto____100982 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____100982)) {
                        return or__3548__auto____100982
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__101016 = function() {
        var G__101018__delegate = function(x, y, z, args) {
          var or__3548__auto____100983 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____100983)) {
            return or__3548__auto____100983
          }else {
            return cljs.core.some.call(null, function(p1__100870_SHARP_) {
              var or__3548__auto____100984 = p1.call(null, p1__100870_SHARP_);
              if(cljs.core.truth_(or__3548__auto____100984)) {
                return or__3548__auto____100984
              }else {
                var or__3548__auto____100985 = p2.call(null, p1__100870_SHARP_);
                if(cljs.core.truth_(or__3548__auto____100985)) {
                  return or__3548__auto____100985
                }else {
                  return p3.call(null, p1__100870_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__101018 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__101018__delegate.call(this, x, y, z, args)
        };
        G__101018.cljs$lang$maxFixedArity = 3;
        G__101018.cljs$lang$applyTo = function(arglist__101019) {
          var x = cljs.core.first(arglist__101019);
          var y = cljs.core.first(cljs.core.next(arglist__101019));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101019)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101019)));
          return G__101018__delegate.call(this, x, y, z, args)
        };
        return G__101018
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__101012.call(this);
          case 1:
            return sp3__101013.call(this, x);
          case 2:
            return sp3__101014.call(this, x, y);
          case 3:
            return sp3__101015.call(this, x, y, z);
          default:
            return sp3__101016.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__101016.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__100994 = function() {
    var G__101020__delegate = function(p1, p2, p3, ps) {
      var ps__100986 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__101021 = function() {
          return null
        };
        var spn__101022 = function(x) {
          return cljs.core.some.call(null, function(p1__100871_SHARP_) {
            return p1__100871_SHARP_.call(null, x)
          }, ps__100986)
        };
        var spn__101023 = function(x, y) {
          return cljs.core.some.call(null, function(p1__100872_SHARP_) {
            var or__3548__auto____100987 = p1__100872_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____100987)) {
              return or__3548__auto____100987
            }else {
              return p1__100872_SHARP_.call(null, y)
            }
          }, ps__100986)
        };
        var spn__101024 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__100873_SHARP_) {
            var or__3548__auto____100988 = p1__100873_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____100988)) {
              return or__3548__auto____100988
            }else {
              var or__3548__auto____100989 = p1__100873_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____100989)) {
                return or__3548__auto____100989
              }else {
                return p1__100873_SHARP_.call(null, z)
              }
            }
          }, ps__100986)
        };
        var spn__101025 = function() {
          var G__101027__delegate = function(x, y, z, args) {
            var or__3548__auto____100990 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____100990)) {
              return or__3548__auto____100990
            }else {
              return cljs.core.some.call(null, function(p1__100874_SHARP_) {
                return cljs.core.some.call(null, p1__100874_SHARP_, args)
              }, ps__100986)
            }
          };
          var G__101027 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__101027__delegate.call(this, x, y, z, args)
          };
          G__101027.cljs$lang$maxFixedArity = 3;
          G__101027.cljs$lang$applyTo = function(arglist__101028) {
            var x = cljs.core.first(arglist__101028);
            var y = cljs.core.first(cljs.core.next(arglist__101028));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101028)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101028)));
            return G__101027__delegate.call(this, x, y, z, args)
          };
          return G__101027
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__101021.call(this);
            case 1:
              return spn__101022.call(this, x);
            case 2:
              return spn__101023.call(this, x, y);
            case 3:
              return spn__101024.call(this, x, y, z);
            default:
              return spn__101025.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__101025.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__101020 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__101020__delegate.call(this, p1, p2, p3, ps)
    };
    G__101020.cljs$lang$maxFixedArity = 3;
    G__101020.cljs$lang$applyTo = function(arglist__101029) {
      var p1 = cljs.core.first(arglist__101029);
      var p2 = cljs.core.first(cljs.core.next(arglist__101029));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101029)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101029)));
      return G__101020__delegate.call(this, p1, p2, p3, ps)
    };
    return G__101020
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__100991.call(this, p1);
      case 2:
        return some_fn__100992.call(this, p1, p2);
      case 3:
        return some_fn__100993.call(this, p1, p2, p3);
      default:
        return some_fn__100994.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__100994.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__101042 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____101030 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____101030)) {
        var s__101031 = temp__3698__auto____101030;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__101031)), map.call(null, f, cljs.core.rest.call(null, s__101031)))
      }else {
        return null
      }
    })
  };
  var map__101043 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__101032 = cljs.core.seq.call(null, c1);
      var s2__101033 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____101034 = s1__101032;
        if(cljs.core.truth_(and__3546__auto____101034)) {
          return s2__101033
        }else {
          return and__3546__auto____101034
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__101032), cljs.core.first.call(null, s2__101033)), map.call(null, f, cljs.core.rest.call(null, s1__101032), cljs.core.rest.call(null, s2__101033)))
      }else {
        return null
      }
    })
  };
  var map__101044 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__101035 = cljs.core.seq.call(null, c1);
      var s2__101036 = cljs.core.seq.call(null, c2);
      var s3__101037 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____101038 = s1__101035;
        if(cljs.core.truth_(and__3546__auto____101038)) {
          var and__3546__auto____101039 = s2__101036;
          if(cljs.core.truth_(and__3546__auto____101039)) {
            return s3__101037
          }else {
            return and__3546__auto____101039
          }
        }else {
          return and__3546__auto____101038
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__101035), cljs.core.first.call(null, s2__101036), cljs.core.first.call(null, s3__101037)), map.call(null, f, cljs.core.rest.call(null, s1__101035), cljs.core.rest.call(null, s2__101036), cljs.core.rest.call(null, s3__101037)))
      }else {
        return null
      }
    })
  };
  var map__101045 = function() {
    var G__101047__delegate = function(f, c1, c2, c3, colls) {
      var step__101041 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__101040 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__101040))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__101040), step.call(null, map.call(null, cljs.core.rest, ss__101040)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__100952_SHARP_) {
        return cljs.core.apply.call(null, f, p1__100952_SHARP_)
      }, step__101041.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__101047 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__101047__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__101047.cljs$lang$maxFixedArity = 4;
    G__101047.cljs$lang$applyTo = function(arglist__101048) {
      var f = cljs.core.first(arglist__101048);
      var c1 = cljs.core.first(cljs.core.next(arglist__101048));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101048)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__101048))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__101048))));
      return G__101047__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__101047
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__101042.call(this, f, c1);
      case 3:
        return map__101043.call(this, f, c1, c2);
      case 4:
        return map__101044.call(this, f, c1, c2, c3);
      default:
        return map__101045.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__101045.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____101049 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____101049)) {
        var s__101050 = temp__3698__auto____101049;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__101050), take.call(null, n - 1, cljs.core.rest.call(null, s__101050)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__101053 = function(n, coll) {
    while(true) {
      var s__101051 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____101052 = n > 0;
        if(cljs.core.truth_(and__3546__auto____101052)) {
          return s__101051
        }else {
          return and__3546__auto____101052
        }
      }())) {
        var G__101054 = n - 1;
        var G__101055 = cljs.core.rest.call(null, s__101051);
        n = G__101054;
        coll = G__101055;
        continue
      }else {
        return s__101051
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__101053.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__101056 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__101057 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__101056.call(this, n);
      case 2:
        return drop_last__101057.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__101059 = cljs.core.seq.call(null, coll);
  var lead__101060 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__101060)) {
      var G__101061 = cljs.core.next.call(null, s__101059);
      var G__101062 = cljs.core.next.call(null, lead__101060);
      s__101059 = G__101061;
      lead__101060 = G__101062;
      continue
    }else {
      return s__101059
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__101065 = function(pred, coll) {
    while(true) {
      var s__101063 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____101064 = s__101063;
        if(cljs.core.truth_(and__3546__auto____101064)) {
          return pred.call(null, cljs.core.first.call(null, s__101063))
        }else {
          return and__3546__auto____101064
        }
      }())) {
        var G__101066 = pred;
        var G__101067 = cljs.core.rest.call(null, s__101063);
        pred = G__101066;
        coll = G__101067;
        continue
      }else {
        return s__101063
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__101065.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____101068 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____101068)) {
      var s__101069 = temp__3698__auto____101068;
      return cljs.core.concat.call(null, s__101069, cycle.call(null, s__101069))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__101070 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__101071 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__101070.call(this, n);
      case 2:
        return repeat__101071.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__101073 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__101074 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__101073.call(this, n);
      case 2:
        return repeatedly__101074.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__101080 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__101076 = cljs.core.seq.call(null, c1);
      var s2__101077 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____101078 = s1__101076;
        if(cljs.core.truth_(and__3546__auto____101078)) {
          return s2__101077
        }else {
          return and__3546__auto____101078
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__101076), cljs.core.cons.call(null, cljs.core.first.call(null, s2__101077), interleave.call(null, cljs.core.rest.call(null, s1__101076), cljs.core.rest.call(null, s2__101077))))
      }else {
        return null
      }
    })
  };
  var interleave__101081 = function() {
    var G__101083__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__101079 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__101079))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__101079), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__101079)))
        }else {
          return null
        }
      })
    };
    var G__101083 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__101083__delegate.call(this, c1, c2, colls)
    };
    G__101083.cljs$lang$maxFixedArity = 2;
    G__101083.cljs$lang$applyTo = function(arglist__101084) {
      var c1 = cljs.core.first(arglist__101084);
      var c2 = cljs.core.first(cljs.core.next(arglist__101084));
      var colls = cljs.core.rest(cljs.core.next(arglist__101084));
      return G__101083__delegate.call(this, c1, c2, colls)
    };
    return G__101083
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__101080.call(this, c1, c2);
      default:
        return interleave__101081.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__101081.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__101087 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____101085 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____101085)) {
        var coll__101086 = temp__3695__auto____101085;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__101086), cat.call(null, cljs.core.rest.call(null, coll__101086), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__101087.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__101088 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__101089 = function() {
    var G__101091__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__101091 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__101091__delegate.call(this, f, coll, colls)
    };
    G__101091.cljs$lang$maxFixedArity = 2;
    G__101091.cljs$lang$applyTo = function(arglist__101092) {
      var f = cljs.core.first(arglist__101092);
      var coll = cljs.core.first(cljs.core.next(arglist__101092));
      var colls = cljs.core.rest(cljs.core.next(arglist__101092));
      return G__101091__delegate.call(this, f, coll, colls)
    };
    return G__101091
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__101088.call(this, f, coll);
      default:
        return mapcat__101089.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__101089.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____101093 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____101093)) {
      var s__101094 = temp__3698__auto____101093;
      var f__101095 = cljs.core.first.call(null, s__101094);
      var r__101096 = cljs.core.rest.call(null, s__101094);
      if(cljs.core.truth_(pred.call(null, f__101095))) {
        return cljs.core.cons.call(null, f__101095, filter.call(null, pred, r__101096))
      }else {
        return filter.call(null, pred, r__101096)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__101098 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__101098.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__101097_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__101097_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__101105 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__101106 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____101099 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____101099)) {
        var s__101100 = temp__3698__auto____101099;
        var p__101101 = cljs.core.take.call(null, n, s__101100);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__101101)))) {
          return cljs.core.cons.call(null, p__101101, partition.call(null, n, step, cljs.core.drop.call(null, step, s__101100)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__101107 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____101102 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____101102)) {
        var s__101103 = temp__3698__auto____101102;
        var p__101104 = cljs.core.take.call(null, n, s__101103);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__101104)))) {
          return cljs.core.cons.call(null, p__101104, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__101103)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__101104, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__101105.call(this, n, step);
      case 3:
        return partition__101106.call(this, n, step, pad);
      case 4:
        return partition__101107.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__101113 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__101114 = function(m, ks, not_found) {
    var sentinel__101109 = cljs.core.lookup_sentinel;
    var m__101110 = m;
    var ks__101111 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__101111)) {
        var m__101112 = cljs.core.get.call(null, m__101110, cljs.core.first.call(null, ks__101111), sentinel__101109);
        if(cljs.core.truth_(sentinel__101109 === m__101112)) {
          return not_found
        }else {
          var G__101116 = sentinel__101109;
          var G__101117 = m__101112;
          var G__101118 = cljs.core.next.call(null, ks__101111);
          sentinel__101109 = G__101116;
          m__101110 = G__101117;
          ks__101111 = G__101118;
          continue
        }
      }else {
        return m__101110
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__101113.call(this, m, ks);
      case 3:
        return get_in__101114.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__101119, v) {
  var vec__101120__101121 = p__101119;
  var k__101122 = cljs.core.nth.call(null, vec__101120__101121, 0, null);
  var ks__101123 = cljs.core.nthnext.call(null, vec__101120__101121, 1);
  if(cljs.core.truth_(ks__101123)) {
    return cljs.core.assoc.call(null, m, k__101122, assoc_in.call(null, cljs.core.get.call(null, m, k__101122), ks__101123, v))
  }else {
    return cljs.core.assoc.call(null, m, k__101122, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__101124, f, args) {
    var vec__101125__101126 = p__101124;
    var k__101127 = cljs.core.nth.call(null, vec__101125__101126, 0, null);
    var ks__101128 = cljs.core.nthnext.call(null, vec__101125__101126, 1);
    if(cljs.core.truth_(ks__101128)) {
      return cljs.core.assoc.call(null, m, k__101127, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__101127), ks__101128, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__101127, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__101127), args))
    }
  };
  var update_in = function(m, p__101124, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__101124, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__101129) {
    var m = cljs.core.first(arglist__101129);
    var p__101124 = cljs.core.first(cljs.core.next(arglist__101129));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101129)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101129)));
    return update_in__delegate.call(this, m, p__101124, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__101130 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__101163 = null;
  var G__101163__101164 = function(coll, k) {
    var this__101131 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__101163__101165 = function(coll, k, not_found) {
    var this__101132 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__101163 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101163__101164.call(this, coll, k);
      case 3:
        return G__101163__101165.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101163
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__101133 = this;
  var new_array__101134 = cljs.core.aclone.call(null, this__101133.array);
  new_array__101134[k] = v;
  return new cljs.core.Vector(this__101133.meta, new_array__101134)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__101167 = null;
  var G__101167__101168 = function(tsym101135, k) {
    var this__101137 = this;
    var tsym101135__101138 = this;
    var coll__101139 = tsym101135__101138;
    return cljs.core._lookup.call(null, coll__101139, k)
  };
  var G__101167__101169 = function(tsym101136, k, not_found) {
    var this__101140 = this;
    var tsym101136__101141 = this;
    var coll__101142 = tsym101136__101141;
    return cljs.core._lookup.call(null, coll__101142, k, not_found)
  };
  G__101167 = function(tsym101136, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101167__101168.call(this, tsym101136, k);
      case 3:
        return G__101167__101169.call(this, tsym101136, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101167
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__101143 = this;
  var new_array__101144 = cljs.core.aclone.call(null, this__101143.array);
  new_array__101144.push(o);
  return new cljs.core.Vector(this__101143.meta, new_array__101144)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__101171 = null;
  var G__101171__101172 = function(v, f) {
    var this__101145 = this;
    return cljs.core.ci_reduce.call(null, this__101145.array, f)
  };
  var G__101171__101173 = function(v, f, start) {
    var this__101146 = this;
    return cljs.core.ci_reduce.call(null, this__101146.array, f, start)
  };
  G__101171 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__101171__101172.call(this, v, f);
      case 3:
        return G__101171__101173.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101171
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__101147 = this;
  if(cljs.core.truth_(this__101147.array.length > 0)) {
    var vector_seq__101148 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__101147.array.length)) {
          return cljs.core.cons.call(null, this__101147.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__101148.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__101149 = this;
  return this__101149.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__101150 = this;
  var count__101151 = this__101150.array.length;
  if(cljs.core.truth_(count__101151 > 0)) {
    return this__101150.array[count__101151 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__101152 = this;
  if(cljs.core.truth_(this__101152.array.length > 0)) {
    var new_array__101153 = cljs.core.aclone.call(null, this__101152.array);
    new_array__101153.pop();
    return new cljs.core.Vector(this__101152.meta, new_array__101153)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__101154 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__101155 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__101156 = this;
  return new cljs.core.Vector(meta, this__101156.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__101157 = this;
  return this__101157.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__101175 = null;
  var G__101175__101176 = function(coll, n) {
    var this__101158 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____101159 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____101159)) {
        return n < this__101158.array.length
      }else {
        return and__3546__auto____101159
      }
    }())) {
      return this__101158.array[n]
    }else {
      return null
    }
  };
  var G__101175__101177 = function(coll, n, not_found) {
    var this__101160 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____101161 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____101161)) {
        return n < this__101160.array.length
      }else {
        return and__3546__auto____101161
      }
    }())) {
      return this__101160.array[n]
    }else {
      return not_found
    }
  };
  G__101175 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101175__101176.call(this, coll, n);
      case 3:
        return G__101175__101177.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101175
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__101162 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__101162.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, []);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__101179 = pv.cnt;
  if(cljs.core.truth_(cnt__101179 < 32)) {
    return 0
  }else {
    return cnt__101179 - 1 >> 5 << 5
  }
};
cljs.core.new_path = function new_path(level, node) {
  var ll__101180 = level;
  var ret__101181 = node;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, ll__101180))) {
      return ret__101181
    }else {
      var embed__101182 = ret__101181;
      var r__101183 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      var ___101184 = r__101183[0] = embed__101182;
      var G__101185 = ll__101180 - 5;
      var G__101186 = r__101183;
      ll__101180 = G__101185;
      ret__101181 = G__101186;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__101187 = cljs.core.aclone.call(null, parent);
  var subidx__101188 = pv.cnt - 1 >> level & 31;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 5, level))) {
    ret__101187[subidx__101188] = tailnode;
    return ret__101187
  }else {
    var temp__3695__auto____101189 = parent[subidx__101188];
    if(cljs.core.truth_(temp__3695__auto____101189)) {
      var child__101190 = temp__3695__auto____101189;
      var node_to_insert__101191 = push_tail.call(null, pv, level - 5, child__101190, tailnode);
      var ___101192 = ret__101187[subidx__101188] = node_to_insert__101191;
      return ret__101187
    }else {
      var node_to_insert__101193 = cljs.core.new_path.call(null, level - 5, tailnode);
      var ___101194 = ret__101187[subidx__101188] = node_to_insert__101193;
      return ret__101187
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____101195 = 0 <= i;
    if(cljs.core.truth_(and__3546__auto____101195)) {
      return i < pv.cnt
    }else {
      return and__3546__auto____101195
    }
  }())) {
    if(cljs.core.truth_(i >= cljs.core.tail_off.call(null, pv))) {
      return pv.tail
    }else {
      var node__101196 = pv.root;
      var level__101197 = pv.shift;
      while(true) {
        if(cljs.core.truth_(level__101197 > 0)) {
          var G__101198 = node__101196[i >> level__101197 & 31];
          var G__101199 = level__101197 - 5;
          node__101196 = G__101198;
          level__101197 = G__101199;
          continue
        }else {
          return node__101196
        }
        break
      }
    }
  }else {
    throw new Error(cljs.core.str.call(null, "No item ", i, " in vector of length ", pv.cnt));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__101200 = cljs.core.aclone.call(null, node);
  if(cljs.core.truth_(level === 0)) {
    ret__101200[i & 31] = val;
    return ret__101200
  }else {
    var subidx__101201 = i >> level & 31;
    var ___101202 = ret__101200[subidx__101201] = do_assoc.call(null, pv, level - 5, node[subidx__101201], i, val);
    return ret__101200
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__101203 = pv.cnt - 2 >> level & 31;
  if(cljs.core.truth_(level > 5)) {
    var new_child__101204 = pop_tail.call(null, pv, level - 5, node[subidx__101203]);
    if(cljs.core.truth_(function() {
      var and__3546__auto____101205 = new_child__101204 === null;
      if(cljs.core.truth_(and__3546__auto____101205)) {
        return subidx__101203 === 0
      }else {
        return and__3546__auto____101205
      }
    }())) {
      return null
    }else {
      var ret__101206 = cljs.core.aclone.call(null, node);
      var ___101207 = ret__101206[subidx__101203] = new_child__101204;
      return ret__101206
    }
  }else {
    if(cljs.core.truth_(subidx__101203 === 0)) {
      return null
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        var ret__101208 = cljs.core.aclone.call(null, node);
        var ___101209 = ret__101208[subidx__101203] = null;
        return ret__101208
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail
};
cljs.core.PersistentVector.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__101210 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__101250 = null;
  var G__101250__101251 = function(coll, k) {
    var this__101211 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__101250__101252 = function(coll, k, not_found) {
    var this__101212 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__101250 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101250__101251.call(this, coll, k);
      case 3:
        return G__101250__101252.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101250
}();
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__101213 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____101214 = 0 <= k;
    if(cljs.core.truth_(and__3546__auto____101214)) {
      return k < this__101213.cnt
    }else {
      return and__3546__auto____101214
    }
  }())) {
    if(cljs.core.truth_(cljs.core.tail_off.call(null, coll) <= k)) {
      var new_tail__101215 = cljs.core.aclone.call(null, this__101213.tail);
      new_tail__101215[k & 31] = v;
      return new cljs.core.PersistentVector(this__101213.meta, this__101213.cnt, this__101213.shift, this__101213.root, new_tail__101215)
    }else {
      return new cljs.core.PersistentVector(this__101213.meta, this__101213.cnt, this__101213.shift, cljs.core.do_assoc.call(null, coll, this__101213.shift, this__101213.root, k, v), this__101213.tail)
    }
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, k, this__101213.cnt))) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Index ", k, " out of bounds  [0,", this__101213.cnt, "]"));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__101254 = null;
  var G__101254__101255 = function(tsym101216, k) {
    var this__101218 = this;
    var tsym101216__101219 = this;
    var coll__101220 = tsym101216__101219;
    return cljs.core._lookup.call(null, coll__101220, k)
  };
  var G__101254__101256 = function(tsym101217, k, not_found) {
    var this__101221 = this;
    var tsym101217__101222 = this;
    var coll__101223 = tsym101217__101222;
    return cljs.core._lookup.call(null, coll__101223, k, not_found)
  };
  G__101254 = function(tsym101217, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101254__101255.call(this, tsym101217, k);
      case 3:
        return G__101254__101256.call(this, tsym101217, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101254
}();
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__101224 = this;
  if(cljs.core.truth_(this__101224.cnt - cljs.core.tail_off.call(null, coll) < 32)) {
    var new_tail__101225 = cljs.core.aclone.call(null, this__101224.tail);
    new_tail__101225.push(o);
    return new cljs.core.PersistentVector(this__101224.meta, this__101224.cnt + 1, this__101224.shift, this__101224.root, new_tail__101225)
  }else {
    var root_overflow_QMARK___101226 = this__101224.cnt >> 5 > 1 << this__101224.shift;
    var new_shift__101227 = cljs.core.truth_(root_overflow_QMARK___101226) ? this__101224.shift + 5 : this__101224.shift;
    var new_root__101229 = cljs.core.truth_(root_overflow_QMARK___101226) ? function() {
      var n_r__101228 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      n_r__101228[0] = this__101224.root;
      n_r__101228[1] = cljs.core.new_path.call(null, this__101224.shift, this__101224.tail);
      return n_r__101228
    }() : cljs.core.push_tail.call(null, coll, this__101224.shift, this__101224.root, this__101224.tail);
    return new cljs.core.PersistentVector(this__101224.meta, this__101224.cnt + 1, new_shift__101227, new_root__101229, [o])
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__101258 = null;
  var G__101258__101259 = function(v, f) {
    var this__101230 = this;
    return cljs.core.ci_reduce.call(null, v, f)
  };
  var G__101258__101260 = function(v, f, start) {
    var this__101231 = this;
    return cljs.core.ci_reduce.call(null, v, f, start)
  };
  G__101258 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__101258__101259.call(this, v, f);
      case 3:
        return G__101258__101260.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101258
}();
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__101232 = this;
  if(cljs.core.truth_(this__101232.cnt > 0)) {
    var vector_seq__101233 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__101232.cnt)) {
          return cljs.core.cons.call(null, cljs.core._nth.call(null, coll, i), vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__101233.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__101234 = this;
  return this__101234.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__101235 = this;
  if(cljs.core.truth_(this__101235.cnt > 0)) {
    return cljs.core._nth.call(null, coll, this__101235.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__101236 = this;
  if(cljs.core.truth_(this__101236.cnt === 0)) {
    throw new Error("Can't pop empty vector");
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 1, this__101236.cnt))) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__101236.meta)
    }else {
      if(cljs.core.truth_(1 < this__101236.cnt - cljs.core.tail_off.call(null, coll))) {
        return new cljs.core.PersistentVector(this__101236.meta, this__101236.cnt - 1, this__101236.shift, this__101236.root, cljs.core.aclone.call(null, this__101236.tail))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          var new_tail__101237 = cljs.core.array_for.call(null, coll, this__101236.cnt - 2);
          var nr__101238 = cljs.core.pop_tail.call(null, this__101236.shift, this__101236.root);
          var new_root__101239 = cljs.core.truth_(nr__101238 === null) ? cljs.core.PersistentVector.EMPTY_NODE : nr__101238;
          var cnt_1__101240 = this__101236.cnt - 1;
          if(cljs.core.truth_(function() {
            var and__3546__auto____101241 = 5 < this__101236.shift;
            if(cljs.core.truth_(and__3546__auto____101241)) {
              return new_root__101239[1] === null
            }else {
              return and__3546__auto____101241
            }
          }())) {
            return new cljs.core.PersistentVector(this__101236.meta, cnt_1__101240, this__101236.shift - 5, new_root__101239[0], new_tail__101237)
          }else {
            return new cljs.core.PersistentVector(this__101236.meta, cnt_1__101240, this__101236.shift, new_root__101239, new_tail__101237)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__101242 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__101243 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__101244 = this;
  return new cljs.core.PersistentVector(meta, this__101244.cnt, this__101244.shift, this__101244.root, this__101244.tail)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__101245 = this;
  return this__101245.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__101262 = null;
  var G__101262__101263 = function(coll, n) {
    var this__101246 = this;
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  };
  var G__101262__101264 = function(coll, n, not_found) {
    var this__101247 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____101248 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____101248)) {
        return n < this__101247.cnt
      }else {
        return and__3546__auto____101248
      }
    }())) {
      return cljs.core._nth.call(null, coll, n)
    }else {
      return not_found
    }
  };
  G__101262 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101262__101263.call(this, coll, n);
      case 3:
        return G__101262__101264.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101262
}();
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__101249 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__101249.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = new Array(32);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, []);
cljs.core.PersistentVector.fromArray = function(xs) {
  return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, xs)
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__101266) {
    var args = cljs.core.seq(arglist__101266);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__101267 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__101295 = null;
  var G__101295__101296 = function(coll, k) {
    var this__101268 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__101295__101297 = function(coll, k, not_found) {
    var this__101269 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__101295 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101295__101296.call(this, coll, k);
      case 3:
        return G__101295__101297.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101295
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__101270 = this;
  var v_pos__101271 = this__101270.start + key;
  return new cljs.core.Subvec(this__101270.meta, cljs.core._assoc.call(null, this__101270.v, v_pos__101271, val), this__101270.start, this__101270.end > v_pos__101271 + 1 ? this__101270.end : v_pos__101271 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__101299 = null;
  var G__101299__101300 = function(tsym101272, k) {
    var this__101274 = this;
    var tsym101272__101275 = this;
    var coll__101276 = tsym101272__101275;
    return cljs.core._lookup.call(null, coll__101276, k)
  };
  var G__101299__101301 = function(tsym101273, k, not_found) {
    var this__101277 = this;
    var tsym101273__101278 = this;
    var coll__101279 = tsym101273__101278;
    return cljs.core._lookup.call(null, coll__101279, k, not_found)
  };
  G__101299 = function(tsym101273, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101299__101300.call(this, tsym101273, k);
      case 3:
        return G__101299__101301.call(this, tsym101273, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101299
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__101280 = this;
  return new cljs.core.Subvec(this__101280.meta, cljs.core._assoc_n.call(null, this__101280.v, this__101280.end, o), this__101280.start, this__101280.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__101303 = null;
  var G__101303__101304 = function(coll, f) {
    var this__101281 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__101303__101305 = function(coll, f, start) {
    var this__101282 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__101303 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__101303__101304.call(this, coll, f);
      case 3:
        return G__101303__101305.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101303
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__101283 = this;
  var subvec_seq__101284 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__101283.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__101283.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__101284.call(null, this__101283.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__101285 = this;
  return this__101285.end - this__101285.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__101286 = this;
  return cljs.core._nth.call(null, this__101286.v, this__101286.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__101287 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__101287.start, this__101287.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__101287.meta, this__101287.v, this__101287.start, this__101287.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__101288 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__101289 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__101290 = this;
  return new cljs.core.Subvec(meta, this__101290.v, this__101290.start, this__101290.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__101291 = this;
  return this__101291.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__101307 = null;
  var G__101307__101308 = function(coll, n) {
    var this__101292 = this;
    return cljs.core._nth.call(null, this__101292.v, this__101292.start + n)
  };
  var G__101307__101309 = function(coll, n, not_found) {
    var this__101293 = this;
    return cljs.core._nth.call(null, this__101293.v, this__101293.start + n, not_found)
  };
  G__101307 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101307__101308.call(this, coll, n);
      case 3:
        return G__101307__101309.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101307
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__101294 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__101294.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__101311 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__101312 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__101311.call(this, v, start);
      case 3:
        return subvec__101312.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__101314 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__101315 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__101316 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__101317 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__101317.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__101318 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__101319 = this;
  return cljs.core._first.call(null, this__101319.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__101320 = this;
  var temp__3695__auto____101321 = cljs.core.next.call(null, this__101320.front);
  if(cljs.core.truth_(temp__3695__auto____101321)) {
    var f1__101322 = temp__3695__auto____101321;
    return new cljs.core.PersistentQueueSeq(this__101320.meta, f1__101322, this__101320.rear)
  }else {
    if(cljs.core.truth_(this__101320.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__101320.meta, this__101320.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__101323 = this;
  return this__101323.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__101324 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__101324.front, this__101324.rear)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__101325 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__101326 = this;
  if(cljs.core.truth_(this__101326.front)) {
    return new cljs.core.PersistentQueue(this__101326.meta, this__101326.count + 1, this__101326.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____101327 = this__101326.rear;
      if(cljs.core.truth_(or__3548__auto____101327)) {
        return or__3548__auto____101327
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__101326.meta, this__101326.count + 1, cljs.core.conj.call(null, this__101326.front, o), cljs.core.PersistentVector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__101328 = this;
  var rear__101329 = cljs.core.seq.call(null, this__101328.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____101330 = this__101328.front;
    if(cljs.core.truth_(or__3548__auto____101330)) {
      return or__3548__auto____101330
    }else {
      return rear__101329
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__101328.front, cljs.core.seq.call(null, rear__101329))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__101331 = this;
  return this__101331.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__101332 = this;
  return cljs.core._first.call(null, this__101332.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__101333 = this;
  if(cljs.core.truth_(this__101333.front)) {
    var temp__3695__auto____101334 = cljs.core.next.call(null, this__101333.front);
    if(cljs.core.truth_(temp__3695__auto____101334)) {
      var f1__101335 = temp__3695__auto____101334;
      return new cljs.core.PersistentQueue(this__101333.meta, this__101333.count - 1, f1__101335, this__101333.rear)
    }else {
      return new cljs.core.PersistentQueue(this__101333.meta, this__101333.count - 1, cljs.core.seq.call(null, this__101333.rear), cljs.core.PersistentVector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__101336 = this;
  return cljs.core.first.call(null, this__101336.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__101337 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__101338 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__101339 = this;
  return new cljs.core.PersistentQueue(meta, this__101339.count, this__101339.front, this__101339.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__101340 = this;
  return this__101340.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__101341 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__101342 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__101343 = array.length;
  var i__101344 = 0;
  while(true) {
    if(cljs.core.truth_(i__101344 < len__101343)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__101344]))) {
        return i__101344
      }else {
        var G__101345 = i__101344 + incr;
        i__101344 = G__101345;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___101347 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___101348 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____101346 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____101346)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____101346
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___101347.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___101348.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__101351 = cljs.core.hash.call(null, a);
  var b__101352 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__101351 < b__101352)) {
    return-1
  }else {
    if(cljs.core.truth_(a__101351 > b__101352)) {
      return 1
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__101353 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__101380 = null;
  var G__101380__101381 = function(coll, k) {
    var this__101354 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__101380__101382 = function(coll, k, not_found) {
    var this__101355 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__101355.strobj, this__101355.strobj[k], not_found)
  };
  G__101380 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101380__101381.call(this, coll, k);
      case 3:
        return G__101380__101382.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101380
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__101356 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__101357 = goog.object.clone.call(null, this__101356.strobj);
    var overwrite_QMARK___101358 = new_strobj__101357.hasOwnProperty(k);
    new_strobj__101357[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___101358)) {
      return new cljs.core.ObjMap(this__101356.meta, this__101356.keys, new_strobj__101357)
    }else {
      var new_keys__101359 = cljs.core.aclone.call(null, this__101356.keys);
      new_keys__101359.push(k);
      return new cljs.core.ObjMap(this__101356.meta, new_keys__101359, new_strobj__101357)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__101356.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__101360 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__101360.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__101384 = null;
  var G__101384__101385 = function(tsym101361, k) {
    var this__101363 = this;
    var tsym101361__101364 = this;
    var coll__101365 = tsym101361__101364;
    return cljs.core._lookup.call(null, coll__101365, k)
  };
  var G__101384__101386 = function(tsym101362, k, not_found) {
    var this__101366 = this;
    var tsym101362__101367 = this;
    var coll__101368 = tsym101362__101367;
    return cljs.core._lookup.call(null, coll__101368, k, not_found)
  };
  G__101384 = function(tsym101362, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101384__101385.call(this, tsym101362, k);
      case 3:
        return G__101384__101386.call(this, tsym101362, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101384
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__101369 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__101370 = this;
  if(cljs.core.truth_(this__101370.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__101350_SHARP_) {
      return cljs.core.vector.call(null, p1__101350_SHARP_, this__101370.strobj[p1__101350_SHARP_])
    }, this__101370.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__101371 = this;
  return this__101371.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__101372 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__101373 = this;
  return new cljs.core.ObjMap(meta, this__101373.keys, this__101373.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__101374 = this;
  return this__101374.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__101375 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__101375.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__101376 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____101377 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____101377)) {
      return this__101376.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____101377
    }
  }())) {
    var new_keys__101378 = cljs.core.aclone.call(null, this__101376.keys);
    var new_strobj__101379 = goog.object.clone.call(null, this__101376.strobj);
    new_keys__101378.splice(cljs.core.scan_array.call(null, 1, k, new_keys__101378), 1);
    cljs.core.js_delete.call(null, new_strobj__101379, k);
    return new cljs.core.ObjMap(this__101376.meta, new_keys__101378, new_strobj__101379)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__101389 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__101427 = null;
  var G__101427__101428 = function(coll, k) {
    var this__101390 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__101427__101429 = function(coll, k, not_found) {
    var this__101391 = this;
    var bucket__101392 = this__101391.hashobj[cljs.core.hash.call(null, k)];
    var i__101393 = cljs.core.truth_(bucket__101392) ? cljs.core.scan_array.call(null, 2, k, bucket__101392) : null;
    if(cljs.core.truth_(i__101393)) {
      return bucket__101392[i__101393 + 1]
    }else {
      return not_found
    }
  };
  G__101427 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101427__101428.call(this, coll, k);
      case 3:
        return G__101427__101429.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101427
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__101394 = this;
  var h__101395 = cljs.core.hash.call(null, k);
  var bucket__101396 = this__101394.hashobj[h__101395];
  if(cljs.core.truth_(bucket__101396)) {
    var new_bucket__101397 = cljs.core.aclone.call(null, bucket__101396);
    var new_hashobj__101398 = goog.object.clone.call(null, this__101394.hashobj);
    new_hashobj__101398[h__101395] = new_bucket__101397;
    var temp__3695__auto____101399 = cljs.core.scan_array.call(null, 2, k, new_bucket__101397);
    if(cljs.core.truth_(temp__3695__auto____101399)) {
      var i__101400 = temp__3695__auto____101399;
      new_bucket__101397[i__101400 + 1] = v;
      return new cljs.core.HashMap(this__101394.meta, this__101394.count, new_hashobj__101398)
    }else {
      new_bucket__101397.push(k, v);
      return new cljs.core.HashMap(this__101394.meta, this__101394.count + 1, new_hashobj__101398)
    }
  }else {
    var new_hashobj__101401 = goog.object.clone.call(null, this__101394.hashobj);
    new_hashobj__101401[h__101395] = [k, v];
    return new cljs.core.HashMap(this__101394.meta, this__101394.count + 1, new_hashobj__101401)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__101402 = this;
  var bucket__101403 = this__101402.hashobj[cljs.core.hash.call(null, k)];
  var i__101404 = cljs.core.truth_(bucket__101403) ? cljs.core.scan_array.call(null, 2, k, bucket__101403) : null;
  if(cljs.core.truth_(i__101404)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__101431 = null;
  var G__101431__101432 = function(tsym101405, k) {
    var this__101407 = this;
    var tsym101405__101408 = this;
    var coll__101409 = tsym101405__101408;
    return cljs.core._lookup.call(null, coll__101409, k)
  };
  var G__101431__101433 = function(tsym101406, k, not_found) {
    var this__101410 = this;
    var tsym101406__101411 = this;
    var coll__101412 = tsym101406__101411;
    return cljs.core._lookup.call(null, coll__101412, k, not_found)
  };
  G__101431 = function(tsym101406, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101431__101432.call(this, tsym101406, k);
      case 3:
        return G__101431__101433.call(this, tsym101406, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101431
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__101413 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__101414 = this;
  if(cljs.core.truth_(this__101414.count > 0)) {
    var hashes__101415 = cljs.core.js_keys.call(null, this__101414.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__101388_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__101414.hashobj[p1__101388_SHARP_]))
    }, hashes__101415)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__101416 = this;
  return this__101416.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__101417 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__101418 = this;
  return new cljs.core.HashMap(meta, this__101418.count, this__101418.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__101419 = this;
  return this__101419.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__101420 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__101420.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__101421 = this;
  var h__101422 = cljs.core.hash.call(null, k);
  var bucket__101423 = this__101421.hashobj[h__101422];
  var i__101424 = cljs.core.truth_(bucket__101423) ? cljs.core.scan_array.call(null, 2, k, bucket__101423) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__101424))) {
    return coll
  }else {
    var new_hashobj__101425 = goog.object.clone.call(null, this__101421.hashobj);
    if(cljs.core.truth_(3 > bucket__101423.length)) {
      cljs.core.js_delete.call(null, new_hashobj__101425, h__101422)
    }else {
      var new_bucket__101426 = cljs.core.aclone.call(null, bucket__101423);
      new_bucket__101426.splice(i__101424, 2);
      new_hashobj__101425[h__101422] = new_bucket__101426
    }
    return new cljs.core.HashMap(this__101421.meta, this__101421.count - 1, new_hashobj__101425)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__101435 = ks.length;
  var i__101436 = 0;
  var out__101437 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__101436 < len__101435)) {
      var G__101438 = i__101436 + 1;
      var G__101439 = cljs.core.assoc.call(null, out__101437, ks[i__101436], vs[i__101436]);
      i__101436 = G__101438;
      out__101437 = G__101439;
      continue
    }else {
      return out__101437
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__101440 = cljs.core.seq.call(null, keyvals);
    var out__101441 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__101440)) {
        var G__101442 = cljs.core.nnext.call(null, in$__101440);
        var G__101443 = cljs.core.assoc.call(null, out__101441, cljs.core.first.call(null, in$__101440), cljs.core.second.call(null, in$__101440));
        in$__101440 = G__101442;
        out__101441 = G__101443;
        continue
      }else {
        return out__101441
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__101444) {
    var keyvals = cljs.core.seq(arglist__101444);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__101445_SHARP_, p2__101446_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____101447 = p1__101445_SHARP_;
          if(cljs.core.truth_(or__3548__auto____101447)) {
            return or__3548__auto____101447
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__101446_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__101448) {
    var maps = cljs.core.seq(arglist__101448);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__101451 = function(m, e) {
        var k__101449 = cljs.core.first.call(null, e);
        var v__101450 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__101449))) {
          return cljs.core.assoc.call(null, m, k__101449, f.call(null, cljs.core.get.call(null, m, k__101449), v__101450))
        }else {
          return cljs.core.assoc.call(null, m, k__101449, v__101450)
        }
      };
      var merge2__101453 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__101451, function() {
          var or__3548__auto____101452 = m1;
          if(cljs.core.truth_(or__3548__auto____101452)) {
            return or__3548__auto____101452
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__101453, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__101454) {
    var f = cljs.core.first(arglist__101454);
    var maps = cljs.core.rest(arglist__101454);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__101456 = cljs.core.ObjMap.fromObject([], {});
  var keys__101457 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__101457)) {
      var key__101458 = cljs.core.first.call(null, keys__101457);
      var entry__101459 = cljs.core.get.call(null, map, key__101458, "\ufdd0'user/not-found");
      var G__101460 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__101459, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__101456, key__101458, entry__101459) : ret__101456;
      var G__101461 = cljs.core.next.call(null, keys__101457);
      ret__101456 = G__101460;
      keys__101457 = G__101461;
      continue
    }else {
      return ret__101456
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Set")
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__101462 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__101483 = null;
  var G__101483__101484 = function(coll, v) {
    var this__101463 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__101483__101485 = function(coll, v, not_found) {
    var this__101464 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__101464.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__101483 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101483__101484.call(this, coll, v);
      case 3:
        return G__101483__101485.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101483
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__101487 = null;
  var G__101487__101488 = function(tsym101465, k) {
    var this__101467 = this;
    var tsym101465__101468 = this;
    var coll__101469 = tsym101465__101468;
    return cljs.core._lookup.call(null, coll__101469, k)
  };
  var G__101487__101489 = function(tsym101466, k, not_found) {
    var this__101470 = this;
    var tsym101466__101471 = this;
    var coll__101472 = tsym101466__101471;
    return cljs.core._lookup.call(null, coll__101472, k, not_found)
  };
  G__101487 = function(tsym101466, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101487__101488.call(this, tsym101466, k);
      case 3:
        return G__101487__101489.call(this, tsym101466, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101487
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__101473 = this;
  return new cljs.core.Set(this__101473.meta, cljs.core.assoc.call(null, this__101473.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__101474 = this;
  return cljs.core.keys.call(null, this__101474.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__101475 = this;
  return new cljs.core.Set(this__101475.meta, cljs.core.dissoc.call(null, this__101475.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__101476 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__101477 = this;
  var and__3546__auto____101478 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____101478)) {
    var and__3546__auto____101479 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____101479)) {
      return cljs.core.every_QMARK_.call(null, function(p1__101455_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__101455_SHARP_)
      }, other)
    }else {
      return and__3546__auto____101479
    }
  }else {
    return and__3546__auto____101478
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__101480 = this;
  return new cljs.core.Set(meta, this__101480.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__101481 = this;
  return this__101481.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__101482 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__101482.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__101492 = cljs.core.seq.call(null, coll);
  var out__101493 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__101492)))) {
      var G__101494 = cljs.core.rest.call(null, in$__101492);
      var G__101495 = cljs.core.conj.call(null, out__101493, cljs.core.first.call(null, in$__101492));
      in$__101492 = G__101494;
      out__101493 = G__101495;
      continue
    }else {
      return out__101493
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__101496 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____101497 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____101497)) {
        var e__101498 = temp__3695__auto____101497;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__101498))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__101496, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__101491_SHARP_) {
      var temp__3695__auto____101499 = cljs.core.find.call(null, smap, p1__101491_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____101499)) {
        var e__101500 = temp__3695__auto____101499;
        return cljs.core.second.call(null, e__101500)
      }else {
        return p1__101491_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__101508 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__101501, seen) {
        while(true) {
          var vec__101502__101503 = p__101501;
          var f__101504 = cljs.core.nth.call(null, vec__101502__101503, 0, null);
          var xs__101505 = vec__101502__101503;
          var temp__3698__auto____101506 = cljs.core.seq.call(null, xs__101505);
          if(cljs.core.truth_(temp__3698__auto____101506)) {
            var s__101507 = temp__3698__auto____101506;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__101504))) {
              var G__101509 = cljs.core.rest.call(null, s__101507);
              var G__101510 = seen;
              p__101501 = G__101509;
              seen = G__101510;
              continue
            }else {
              return cljs.core.cons.call(null, f__101504, step.call(null, cljs.core.rest.call(null, s__101507), cljs.core.conj.call(null, seen, f__101504)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__101508.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__101511 = cljs.core.PersistentVector.fromArray([]);
  var s__101512 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__101512))) {
      var G__101513 = cljs.core.conj.call(null, ret__101511, cljs.core.first.call(null, s__101512));
      var G__101514 = cljs.core.next.call(null, s__101512);
      ret__101511 = G__101513;
      s__101512 = G__101514;
      continue
    }else {
      return cljs.core.seq.call(null, ret__101511)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____101515 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____101515)) {
        return or__3548__auto____101515
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__101516 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__101516 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__101516 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3548__auto____101517 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____101517)) {
      return or__3548__auto____101517
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__101518 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__101518 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__101518)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__101521 = cljs.core.ObjMap.fromObject([], {});
  var ks__101522 = cljs.core.seq.call(null, keys);
  var vs__101523 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____101524 = ks__101522;
      if(cljs.core.truth_(and__3546__auto____101524)) {
        return vs__101523
      }else {
        return and__3546__auto____101524
      }
    }())) {
      var G__101525 = cljs.core.assoc.call(null, map__101521, cljs.core.first.call(null, ks__101522), cljs.core.first.call(null, vs__101523));
      var G__101526 = cljs.core.next.call(null, ks__101522);
      var G__101527 = cljs.core.next.call(null, vs__101523);
      map__101521 = G__101525;
      ks__101522 = G__101526;
      vs__101523 = G__101527;
      continue
    }else {
      return map__101521
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__101530 = function(k, x) {
    return x
  };
  var max_key__101531 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__101532 = function() {
    var G__101534__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__101519_SHARP_, p2__101520_SHARP_) {
        return max_key.call(null, k, p1__101519_SHARP_, p2__101520_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__101534 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__101534__delegate.call(this, k, x, y, more)
    };
    G__101534.cljs$lang$maxFixedArity = 3;
    G__101534.cljs$lang$applyTo = function(arglist__101535) {
      var k = cljs.core.first(arglist__101535);
      var x = cljs.core.first(cljs.core.next(arglist__101535));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101535)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101535)));
      return G__101534__delegate.call(this, k, x, y, more)
    };
    return G__101534
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__101530.call(this, k, x);
      case 3:
        return max_key__101531.call(this, k, x, y);
      default:
        return max_key__101532.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__101532.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__101536 = function(k, x) {
    return x
  };
  var min_key__101537 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__101538 = function() {
    var G__101540__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__101528_SHARP_, p2__101529_SHARP_) {
        return min_key.call(null, k, p1__101528_SHARP_, p2__101529_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__101540 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__101540__delegate.call(this, k, x, y, more)
    };
    G__101540.cljs$lang$maxFixedArity = 3;
    G__101540.cljs$lang$applyTo = function(arglist__101541) {
      var k = cljs.core.first(arglist__101541);
      var x = cljs.core.first(cljs.core.next(arglist__101541));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101541)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101541)));
      return G__101540__delegate.call(this, k, x, y, more)
    };
    return G__101540
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__101536.call(this, k, x);
      case 3:
        return min_key__101537.call(this, k, x, y);
      default:
        return min_key__101538.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__101538.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__101544 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__101545 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____101542 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____101542)) {
        var s__101543 = temp__3698__auto____101542;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__101543), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__101543)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__101544.call(this, n, step);
      case 3:
        return partition_all__101545.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____101547 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____101547)) {
      var s__101548 = temp__3698__auto____101547;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__101548)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__101548), take_while.call(null, pred, cljs.core.rest.call(null, s__101548)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__101549 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__101550 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__101566 = null;
  var G__101566__101567 = function(rng, f) {
    var this__101551 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__101566__101568 = function(rng, f, s) {
    var this__101552 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__101566 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__101566__101567.call(this, rng, f);
      case 3:
        return G__101566__101568.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101566
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__101553 = this;
  var comp__101554 = cljs.core.truth_(this__101553.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__101554.call(null, this__101553.start, this__101553.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__101555 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__101555.end - this__101555.start) / this__101555.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__101556 = this;
  return this__101556.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__101557 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__101557.meta, this__101557.start + this__101557.step, this__101557.end, this__101557.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__101558 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__101559 = this;
  return new cljs.core.Range(meta, this__101559.start, this__101559.end, this__101559.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__101560 = this;
  return this__101560.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__101570 = null;
  var G__101570__101571 = function(rng, n) {
    var this__101561 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__101561.start + n * this__101561.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____101562 = this__101561.start > this__101561.end;
        if(cljs.core.truth_(and__3546__auto____101562)) {
          return cljs.core._EQ_.call(null, this__101561.step, 0)
        }else {
          return and__3546__auto____101562
        }
      }())) {
        return this__101561.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__101570__101572 = function(rng, n, not_found) {
    var this__101563 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__101563.start + n * this__101563.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____101564 = this__101563.start > this__101563.end;
        if(cljs.core.truth_(and__3546__auto____101564)) {
          return cljs.core._EQ_.call(null, this__101563.step, 0)
        }else {
          return and__3546__auto____101564
        }
      }())) {
        return this__101563.start
      }else {
        return not_found
      }
    }
  };
  G__101570 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__101570__101571.call(this, rng, n);
      case 3:
        return G__101570__101572.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__101570
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__101565 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__101565.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__101574 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__101575 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__101576 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__101577 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__101574.call(this);
      case 1:
        return range__101575.call(this, start);
      case 2:
        return range__101576.call(this, start, end);
      case 3:
        return range__101577.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____101579 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____101579)) {
      var s__101580 = temp__3698__auto____101579;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__101580), take_nth.call(null, n, cljs.core.drop.call(null, n, s__101580)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____101582 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____101582)) {
      var s__101583 = temp__3698__auto____101582;
      var fst__101584 = cljs.core.first.call(null, s__101583);
      var fv__101585 = f.call(null, fst__101584);
      var run__101586 = cljs.core.cons.call(null, fst__101584, cljs.core.take_while.call(null, function(p1__101581_SHARP_) {
        return cljs.core._EQ_.call(null, fv__101585, f.call(null, p1__101581_SHARP_))
      }, cljs.core.next.call(null, s__101583)));
      return cljs.core.cons.call(null, run__101586, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__101586), s__101583))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__101601 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____101597 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____101597)) {
        var s__101598 = temp__3695__auto____101597;
        return reductions.call(null, f, cljs.core.first.call(null, s__101598), cljs.core.rest.call(null, s__101598))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__101602 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____101599 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____101599)) {
        var s__101600 = temp__3698__auto____101599;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__101600)), cljs.core.rest.call(null, s__101600))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__101601.call(this, f, init);
      case 3:
        return reductions__101602.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__101605 = function(f) {
    return function() {
      var G__101610 = null;
      var G__101610__101611 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__101610__101612 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__101610__101613 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__101610__101614 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__101610__101615 = function() {
        var G__101617__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__101617 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__101617__delegate.call(this, x, y, z, args)
        };
        G__101617.cljs$lang$maxFixedArity = 3;
        G__101617.cljs$lang$applyTo = function(arglist__101618) {
          var x = cljs.core.first(arglist__101618);
          var y = cljs.core.first(cljs.core.next(arglist__101618));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101618)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101618)));
          return G__101617__delegate.call(this, x, y, z, args)
        };
        return G__101617
      }();
      G__101610 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__101610__101611.call(this);
          case 1:
            return G__101610__101612.call(this, x);
          case 2:
            return G__101610__101613.call(this, x, y);
          case 3:
            return G__101610__101614.call(this, x, y, z);
          default:
            return G__101610__101615.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__101610.cljs$lang$maxFixedArity = 3;
      G__101610.cljs$lang$applyTo = G__101610__101615.cljs$lang$applyTo;
      return G__101610
    }()
  };
  var juxt__101606 = function(f, g) {
    return function() {
      var G__101619 = null;
      var G__101619__101620 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__101619__101621 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__101619__101622 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__101619__101623 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__101619__101624 = function() {
        var G__101626__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__101626 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__101626__delegate.call(this, x, y, z, args)
        };
        G__101626.cljs$lang$maxFixedArity = 3;
        G__101626.cljs$lang$applyTo = function(arglist__101627) {
          var x = cljs.core.first(arglist__101627);
          var y = cljs.core.first(cljs.core.next(arglist__101627));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101627)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101627)));
          return G__101626__delegate.call(this, x, y, z, args)
        };
        return G__101626
      }();
      G__101619 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__101619__101620.call(this);
          case 1:
            return G__101619__101621.call(this, x);
          case 2:
            return G__101619__101622.call(this, x, y);
          case 3:
            return G__101619__101623.call(this, x, y, z);
          default:
            return G__101619__101624.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__101619.cljs$lang$maxFixedArity = 3;
      G__101619.cljs$lang$applyTo = G__101619__101624.cljs$lang$applyTo;
      return G__101619
    }()
  };
  var juxt__101607 = function(f, g, h) {
    return function() {
      var G__101628 = null;
      var G__101628__101629 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__101628__101630 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__101628__101631 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__101628__101632 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__101628__101633 = function() {
        var G__101635__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__101635 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__101635__delegate.call(this, x, y, z, args)
        };
        G__101635.cljs$lang$maxFixedArity = 3;
        G__101635.cljs$lang$applyTo = function(arglist__101636) {
          var x = cljs.core.first(arglist__101636);
          var y = cljs.core.first(cljs.core.next(arglist__101636));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101636)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101636)));
          return G__101635__delegate.call(this, x, y, z, args)
        };
        return G__101635
      }();
      G__101628 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__101628__101629.call(this);
          case 1:
            return G__101628__101630.call(this, x);
          case 2:
            return G__101628__101631.call(this, x, y);
          case 3:
            return G__101628__101632.call(this, x, y, z);
          default:
            return G__101628__101633.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__101628.cljs$lang$maxFixedArity = 3;
      G__101628.cljs$lang$applyTo = G__101628__101633.cljs$lang$applyTo;
      return G__101628
    }()
  };
  var juxt__101608 = function() {
    var G__101637__delegate = function(f, g, h, fs) {
      var fs__101604 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__101638 = null;
        var G__101638__101639 = function() {
          return cljs.core.reduce.call(null, function(p1__101587_SHARP_, p2__101588_SHARP_) {
            return cljs.core.conj.call(null, p1__101587_SHARP_, p2__101588_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__101604)
        };
        var G__101638__101640 = function(x) {
          return cljs.core.reduce.call(null, function(p1__101589_SHARP_, p2__101590_SHARP_) {
            return cljs.core.conj.call(null, p1__101589_SHARP_, p2__101590_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__101604)
        };
        var G__101638__101641 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__101591_SHARP_, p2__101592_SHARP_) {
            return cljs.core.conj.call(null, p1__101591_SHARP_, p2__101592_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__101604)
        };
        var G__101638__101642 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__101593_SHARP_, p2__101594_SHARP_) {
            return cljs.core.conj.call(null, p1__101593_SHARP_, p2__101594_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__101604)
        };
        var G__101638__101643 = function() {
          var G__101645__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__101595_SHARP_, p2__101596_SHARP_) {
              return cljs.core.conj.call(null, p1__101595_SHARP_, cljs.core.apply.call(null, p2__101596_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__101604)
          };
          var G__101645 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__101645__delegate.call(this, x, y, z, args)
          };
          G__101645.cljs$lang$maxFixedArity = 3;
          G__101645.cljs$lang$applyTo = function(arglist__101646) {
            var x = cljs.core.first(arglist__101646);
            var y = cljs.core.first(cljs.core.next(arglist__101646));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101646)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101646)));
            return G__101645__delegate.call(this, x, y, z, args)
          };
          return G__101645
        }();
        G__101638 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__101638__101639.call(this);
            case 1:
              return G__101638__101640.call(this, x);
            case 2:
              return G__101638__101641.call(this, x, y);
            case 3:
              return G__101638__101642.call(this, x, y, z);
            default:
              return G__101638__101643.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__101638.cljs$lang$maxFixedArity = 3;
        G__101638.cljs$lang$applyTo = G__101638__101643.cljs$lang$applyTo;
        return G__101638
      }()
    };
    var G__101637 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__101637__delegate.call(this, f, g, h, fs)
    };
    G__101637.cljs$lang$maxFixedArity = 3;
    G__101637.cljs$lang$applyTo = function(arglist__101647) {
      var f = cljs.core.first(arglist__101647);
      var g = cljs.core.first(cljs.core.next(arglist__101647));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101647)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__101647)));
      return G__101637__delegate.call(this, f, g, h, fs)
    };
    return G__101637
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__101605.call(this, f);
      case 2:
        return juxt__101606.call(this, f, g);
      case 3:
        return juxt__101607.call(this, f, g, h);
      default:
        return juxt__101608.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__101608.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__101649 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__101652 = cljs.core.next.call(null, coll);
        coll = G__101652;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__101650 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____101648 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____101648)) {
          return n > 0
        }else {
          return and__3546__auto____101648
        }
      }())) {
        var G__101653 = n - 1;
        var G__101654 = cljs.core.next.call(null, coll);
        n = G__101653;
        coll = G__101654;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__101649.call(this, n);
      case 2:
        return dorun__101650.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__101655 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__101656 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__101655.call(this, n);
      case 2:
        return doall__101656.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__101658 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__101658), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__101658), 1))) {
      return cljs.core.first.call(null, matches__101658)
    }else {
      return cljs.core.vec.call(null, matches__101658)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__101659 = re.exec(s);
  if(cljs.core.truth_(matches__101659 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__101659), 1))) {
      return cljs.core.first.call(null, matches__101659)
    }else {
      return cljs.core.vec.call(null, matches__101659)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__101660 = cljs.core.re_find.call(null, re, s);
  var match_idx__101661 = s.search(re);
  var match_str__101662 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__101660)) ? cljs.core.first.call(null, match_data__101660) : match_data__101660;
  var post_match__101663 = cljs.core.subs.call(null, s, match_idx__101661 + cljs.core.count.call(null, match_str__101662));
  if(cljs.core.truth_(match_data__101660)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__101660, re_seq.call(null, re, post_match__101663))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__101665__101666 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___101667 = cljs.core.nth.call(null, vec__101665__101666, 0, null);
  var flags__101668 = cljs.core.nth.call(null, vec__101665__101666, 1, null);
  var pattern__101669 = cljs.core.nth.call(null, vec__101665__101666, 2, null);
  return new RegExp(pattern__101669, flags__101668)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__101664_SHARP_) {
    return print_one.call(null, p1__101664_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(cljs.core.truth_(obj === null)) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(void 0 === obj)) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____101670 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____101670)) {
            var and__3546__auto____101674 = function() {
              var x__451__auto____101671 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____101672 = x__451__auto____101671;
                if(cljs.core.truth_(and__3546__auto____101672)) {
                  var and__3546__auto____101673 = x__451__auto____101671.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____101673)) {
                    return cljs.core.not.call(null, x__451__auto____101671.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____101673
                  }
                }else {
                  return and__3546__auto____101672
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____101671)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____101674)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____101674
            }
          }else {
            return and__3546__auto____101670
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__451__auto____101675 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____101676 = x__451__auto____101675;
            if(cljs.core.truth_(and__3546__auto____101676)) {
              var and__3546__auto____101677 = x__451__auto____101675.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____101677)) {
                return cljs.core.not.call(null, x__451__auto____101675.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____101677
              }
            }else {
              return and__3546__auto____101676
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__451__auto____101675)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__101678 = cljs.core.first.call(null, objs);
  var sb__101679 = new goog.string.StringBuffer;
  var G__101680__101681 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__101680__101681)) {
    var obj__101682 = cljs.core.first.call(null, G__101680__101681);
    var G__101680__101683 = G__101680__101681;
    while(true) {
      if(cljs.core.truth_(obj__101682 === first_obj__101678)) {
      }else {
        sb__101679.append(" ")
      }
      var G__101684__101685 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__101682, opts));
      if(cljs.core.truth_(G__101684__101685)) {
        var string__101686 = cljs.core.first.call(null, G__101684__101685);
        var G__101684__101687 = G__101684__101685;
        while(true) {
          sb__101679.append(string__101686);
          var temp__3698__auto____101688 = cljs.core.next.call(null, G__101684__101687);
          if(cljs.core.truth_(temp__3698__auto____101688)) {
            var G__101684__101689 = temp__3698__auto____101688;
            var G__101692 = cljs.core.first.call(null, G__101684__101689);
            var G__101693 = G__101684__101689;
            string__101686 = G__101692;
            G__101684__101687 = G__101693;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____101690 = cljs.core.next.call(null, G__101680__101683);
      if(cljs.core.truth_(temp__3698__auto____101690)) {
        var G__101680__101691 = temp__3698__auto____101690;
        var G__101694 = cljs.core.first.call(null, G__101680__101691);
        var G__101695 = G__101680__101691;
        obj__101682 = G__101694;
        G__101680__101683 = G__101695;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__101679
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return cljs.core.str.call(null, cljs.core.pr_sb.call(null, objs, opts))
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__101696 = cljs.core.pr_sb.call(null, objs, opts);
  sb__101696.append("\n");
  return cljs.core.str.call(null, sb__101696)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__101697 = cljs.core.first.call(null, objs);
  var G__101698__101699 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__101698__101699)) {
    var obj__101700 = cljs.core.first.call(null, G__101698__101699);
    var G__101698__101701 = G__101698__101699;
    while(true) {
      if(cljs.core.truth_(obj__101700 === first_obj__101697)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__101702__101703 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__101700, opts));
      if(cljs.core.truth_(G__101702__101703)) {
        var string__101704 = cljs.core.first.call(null, G__101702__101703);
        var G__101702__101705 = G__101702__101703;
        while(true) {
          cljs.core.string_print.call(null, string__101704);
          var temp__3698__auto____101706 = cljs.core.next.call(null, G__101702__101705);
          if(cljs.core.truth_(temp__3698__auto____101706)) {
            var G__101702__101707 = temp__3698__auto____101706;
            var G__101710 = cljs.core.first.call(null, G__101702__101707);
            var G__101711 = G__101702__101707;
            string__101704 = G__101710;
            G__101702__101705 = G__101711;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____101708 = cljs.core.next.call(null, G__101698__101701);
      if(cljs.core.truth_(temp__3698__auto____101708)) {
        var G__101698__101709 = temp__3698__auto____101708;
        var G__101712 = cljs.core.first.call(null, G__101698__101709);
        var G__101713 = G__101698__101709;
        obj__101700 = G__101712;
        G__101698__101701 = G__101713;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__101714) {
    var objs = cljs.core.seq(arglist__101714);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__101715) {
    var objs = cljs.core.seq(arglist__101715);
    return prn_str__delegate.call(this, objs)
  };
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__101716) {
    var objs = cljs.core.seq(arglist__101716);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__101717) {
    var objs = cljs.core.seq(arglist__101717);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__101718) {
    var objs = cljs.core.seq(arglist__101718);
    return print_str__delegate.call(this, objs)
  };
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__101719) {
    var objs = cljs.core.seq(arglist__101719);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__101720) {
    var objs = cljs.core.seq(arglist__101720);
    return println_str__delegate.call(this, objs)
  };
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__101721) {
    var objs = cljs.core.seq(arglist__101721);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__101722 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__101722, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3698__auto____101723 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____101723)) {
        var nspc__101724 = temp__3698__auto____101723;
        return cljs.core.str.call(null, nspc__101724, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____101725 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____101725)) {
          var nspc__101726 = temp__3698__auto____101725;
          return cljs.core.str.call(null, nspc__101726, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", cljs.core.str.call(null, this$), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__101727 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__101727, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__101728 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__101729 = this;
  var G__101730__101731 = cljs.core.seq.call(null, this__101729.watches);
  if(cljs.core.truth_(G__101730__101731)) {
    var G__101733__101735 = cljs.core.first.call(null, G__101730__101731);
    var vec__101734__101736 = G__101733__101735;
    var key__101737 = cljs.core.nth.call(null, vec__101734__101736, 0, null);
    var f__101738 = cljs.core.nth.call(null, vec__101734__101736, 1, null);
    var G__101730__101739 = G__101730__101731;
    var G__101733__101740 = G__101733__101735;
    var G__101730__101741 = G__101730__101739;
    while(true) {
      var vec__101742__101743 = G__101733__101740;
      var key__101744 = cljs.core.nth.call(null, vec__101742__101743, 0, null);
      var f__101745 = cljs.core.nth.call(null, vec__101742__101743, 1, null);
      var G__101730__101746 = G__101730__101741;
      f__101745.call(null, key__101744, this$, oldval, newval);
      var temp__3698__auto____101747 = cljs.core.next.call(null, G__101730__101746);
      if(cljs.core.truth_(temp__3698__auto____101747)) {
        var G__101730__101748 = temp__3698__auto____101747;
        var G__101755 = cljs.core.first.call(null, G__101730__101748);
        var G__101756 = G__101730__101748;
        G__101733__101740 = G__101755;
        G__101730__101741 = G__101756;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__101749 = this;
  return this$.watches = cljs.core.assoc.call(null, this__101749.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__101750 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__101750.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__101751 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__101751.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__101752 = this;
  return this__101752.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__101753 = this;
  return this__101753.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__101754 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__101763 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__101764 = function() {
    var G__101766__delegate = function(x, p__101757) {
      var map__101758__101759 = p__101757;
      var map__101758__101760 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__101758__101759)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__101758__101759) : map__101758__101759;
      var validator__101761 = cljs.core.get.call(null, map__101758__101760, "\ufdd0'validator");
      var meta__101762 = cljs.core.get.call(null, map__101758__101760, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__101762, validator__101761, null)
    };
    var G__101766 = function(x, var_args) {
      var p__101757 = null;
      if(goog.isDef(var_args)) {
        p__101757 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__101766__delegate.call(this, x, p__101757)
    };
    G__101766.cljs$lang$maxFixedArity = 1;
    G__101766.cljs$lang$applyTo = function(arglist__101767) {
      var x = cljs.core.first(arglist__101767);
      var p__101757 = cljs.core.rest(arglist__101767);
      return G__101766__delegate.call(this, x, p__101757)
    };
    return G__101766
  }();
  atom = function(x, var_args) {
    var p__101757 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__101763.call(this, x);
      default:
        return atom__101764.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__101764.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____101768 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____101768)) {
    var validate__101769 = temp__3698__auto____101768;
    if(cljs.core.truth_(validate__101769.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3282)))));
    }
  }else {
  }
  var old_value__101770 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__101770, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___101771 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___101772 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___101773 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___101774 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___101775 = function() {
    var G__101777__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__101777 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__101777__delegate.call(this, a, f, x, y, z, more)
    };
    G__101777.cljs$lang$maxFixedArity = 5;
    G__101777.cljs$lang$applyTo = function(arglist__101778) {
      var a = cljs.core.first(arglist__101778);
      var f = cljs.core.first(cljs.core.next(arglist__101778));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__101778)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__101778))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__101778)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__101778)))));
      return G__101777__delegate.call(this, a, f, x, y, z, more)
    };
    return G__101777
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___101771.call(this, a, f);
      case 3:
        return swap_BANG___101772.call(this, a, f, x);
      case 4:
        return swap_BANG___101773.call(this, a, f, x, y);
      case 5:
        return swap_BANG___101774.call(this, a, f, x, y, z);
      default:
        return swap_BANG___101775.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___101775.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__101779) {
    var iref = cljs.core.first(arglist__101779);
    var f = cljs.core.first(cljs.core.next(arglist__101779));
    var args = cljs.core.rest(cljs.core.next(arglist__101779));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__101780 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__101781 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__101780.call(this);
      case 1:
        return gensym__101781.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f
};
cljs.core.Delay.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__101783 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__101783.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__101784 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__101784.state, function(p__101785) {
    var curr_state__101786 = p__101785;
    var curr_state__101787 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, curr_state__101786)) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__101786) : curr_state__101786;
    var done__101788 = cljs.core.get.call(null, curr_state__101787, "\ufdd0'done");
    if(cljs.core.truth_(done__101788)) {
      return curr_state__101787
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__101784.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__101789__101790 = options;
    var map__101789__101791 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__101789__101790)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__101789__101790) : map__101789__101790;
    var keywordize_keys__101792 = cljs.core.get.call(null, map__101789__101791, "\ufdd0'keywordize-keys");
    var keyfn__101793 = cljs.core.truth_(keywordize_keys__101792) ? cljs.core.keyword : cljs.core.str;
    var f__101799 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__520__auto____101798 = function iter__101794(s__101795) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__101795__101796 = s__101795;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__101795__101796))) {
                        var k__101797 = cljs.core.first.call(null, s__101795__101796);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__101793.call(null, k__101797), thisfn.call(null, x[k__101797])]), iter__101794.call(null, cljs.core.rest.call(null, s__101795__101796)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__520__auto____101798.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__101799.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__101800) {
    var x = cljs.core.first(arglist__101800);
    var options = cljs.core.rest(arglist__101800);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__101801 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__101805__delegate = function(args) {
      var temp__3695__auto____101802 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__101801), args);
      if(cljs.core.truth_(temp__3695__auto____101802)) {
        var v__101803 = temp__3695__auto____101802;
        return v__101803
      }else {
        var ret__101804 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__101801, cljs.core.assoc, args, ret__101804);
        return ret__101804
      }
    };
    var G__101805 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__101805__delegate.call(this, args)
    };
    G__101805.cljs$lang$maxFixedArity = 0;
    G__101805.cljs$lang$applyTo = function(arglist__101806) {
      var args = cljs.core.seq(arglist__101806);
      return G__101805__delegate.call(this, args)
    };
    return G__101805
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__101808 = function(f) {
    while(true) {
      var ret__101807 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__101807))) {
        var G__101811 = ret__101807;
        f = G__101811;
        continue
      }else {
        return ret__101807
      }
      break
    }
  };
  var trampoline__101809 = function() {
    var G__101812__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__101812 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__101812__delegate.call(this, f, args)
    };
    G__101812.cljs$lang$maxFixedArity = 1;
    G__101812.cljs$lang$applyTo = function(arglist__101813) {
      var f = cljs.core.first(arglist__101813);
      var args = cljs.core.rest(arglist__101813);
      return G__101812__delegate.call(this, f, args)
    };
    return G__101812
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__101808.call(this, f);
      default:
        return trampoline__101809.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__101809.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__101814 = function() {
    return rand.call(null, 1)
  };
  var rand__101815 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__101814.call(this);
      case 1:
        return rand__101815.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__101817 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__101817, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__101817, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___101826 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___101827 = function(h, child, parent) {
    var or__3548__auto____101818 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____101818)) {
      return or__3548__auto____101818
    }else {
      var or__3548__auto____101819 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____101819)) {
        return or__3548__auto____101819
      }else {
        var and__3546__auto____101820 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____101820)) {
          var and__3546__auto____101821 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____101821)) {
            var and__3546__auto____101822 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____101822)) {
              var ret__101823 = true;
              var i__101824 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____101825 = cljs.core.not.call(null, ret__101823);
                  if(cljs.core.truth_(or__3548__auto____101825)) {
                    return or__3548__auto____101825
                  }else {
                    return cljs.core._EQ_.call(null, i__101824, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__101823
                }else {
                  var G__101829 = isa_QMARK_.call(null, h, child.call(null, i__101824), parent.call(null, i__101824));
                  var G__101830 = i__101824 + 1;
                  ret__101823 = G__101829;
                  i__101824 = G__101830;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____101822
            }
          }else {
            return and__3546__auto____101821
          }
        }else {
          return and__3546__auto____101820
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___101826.call(this, h, child);
      case 3:
        return isa_QMARK___101827.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__101831 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__101832 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__101831.call(this, h);
      case 2:
        return parents__101832.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__101834 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__101835 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__101834.call(this, h);
      case 2:
        return ancestors__101835.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__101837 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__101838 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__101837.call(this, h);
      case 2:
        return descendants__101838.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__101848 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3566)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__101849 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3570)))));
    }
    var tp__101843 = "\ufdd0'parents".call(null, h);
    var td__101844 = "\ufdd0'descendants".call(null, h);
    var ta__101845 = "\ufdd0'ancestors".call(null, h);
    var tf__101846 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____101847 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__101843.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__101845.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__101845.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__101843, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__101846.call(null, "\ufdd0'ancestors".call(null, h), tag, td__101844, parent, ta__101845), "\ufdd0'descendants":tf__101846.call(null, "\ufdd0'descendants".call(null, h), parent, ta__101845, tag, td__101844)})
    }();
    if(cljs.core.truth_(or__3548__auto____101847)) {
      return or__3548__auto____101847
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__101848.call(this, h, tag);
      case 3:
        return derive__101849.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__101855 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__101856 = function(h, tag, parent) {
    var parentMap__101851 = "\ufdd0'parents".call(null, h);
    var childsParents__101852 = cljs.core.truth_(parentMap__101851.call(null, tag)) ? cljs.core.disj.call(null, parentMap__101851.call(null, tag), parent) : cljs.core.set([]);
    var newParents__101853 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__101852)) ? cljs.core.assoc.call(null, parentMap__101851, tag, childsParents__101852) : cljs.core.dissoc.call(null, parentMap__101851, tag);
    var deriv_seq__101854 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__101840_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__101840_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__101840_SHARP_), cljs.core.second.call(null, p1__101840_SHARP_)))
    }, cljs.core.seq.call(null, newParents__101853)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__101851.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__101841_SHARP_, p2__101842_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__101841_SHARP_, p2__101842_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__101854))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__101855.call(this, h, tag);
      case 3:
        return underive__101856.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__101858 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____101860 = cljs.core.truth_(function() {
    var and__3546__auto____101859 = xprefs__101858;
    if(cljs.core.truth_(and__3546__auto____101859)) {
      return xprefs__101858.call(null, y)
    }else {
      return and__3546__auto____101859
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____101860)) {
    return or__3548__auto____101860
  }else {
    var or__3548__auto____101862 = function() {
      var ps__101861 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__101861) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__101861), prefer_table))) {
          }else {
          }
          var G__101865 = cljs.core.rest.call(null, ps__101861);
          ps__101861 = G__101865;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____101862)) {
      return or__3548__auto____101862
    }else {
      var or__3548__auto____101864 = function() {
        var ps__101863 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__101863) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__101863), y, prefer_table))) {
            }else {
            }
            var G__101866 = cljs.core.rest.call(null, ps__101863);
            ps__101863 = G__101866;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____101864)) {
        return or__3548__auto____101864
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____101867 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____101867)) {
    return or__3548__auto____101867
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__101876 = cljs.core.reduce.call(null, function(be, p__101868) {
    var vec__101869__101870 = p__101868;
    var k__101871 = cljs.core.nth.call(null, vec__101869__101870, 0, null);
    var ___101872 = cljs.core.nth.call(null, vec__101869__101870, 1, null);
    var e__101873 = vec__101869__101870;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__101871))) {
      var be2__101875 = cljs.core.truth_(function() {
        var or__3548__auto____101874 = be === null;
        if(cljs.core.truth_(or__3548__auto____101874)) {
          return or__3548__auto____101874
        }else {
          return cljs.core.dominates.call(null, k__101871, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__101873 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__101875), k__101871, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__101871, " and ", cljs.core.first.call(null, be2__101875), ", and neither is preferred"));
      }
      return be2__101875
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__101876)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__101876));
      return cljs.core.second.call(null, best_entry__101876)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____101877 = mf;
    if(cljs.core.truth_(and__3546__auto____101877)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____101877
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____101878 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____101878)) {
        return or__3548__auto____101878
      }else {
        var or__3548__auto____101879 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____101879)) {
          return or__3548__auto____101879
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____101880 = mf;
    if(cljs.core.truth_(and__3546__auto____101880)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____101880
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____101881 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____101881)) {
        return or__3548__auto____101881
      }else {
        var or__3548__auto____101882 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____101882)) {
          return or__3548__auto____101882
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____101883 = mf;
    if(cljs.core.truth_(and__3546__auto____101883)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____101883
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____101884 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____101884)) {
        return or__3548__auto____101884
      }else {
        var or__3548__auto____101885 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____101885)) {
          return or__3548__auto____101885
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____101886 = mf;
    if(cljs.core.truth_(and__3546__auto____101886)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____101886
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____101887 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____101887)) {
        return or__3548__auto____101887
      }else {
        var or__3548__auto____101888 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____101888)) {
          return or__3548__auto____101888
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____101889 = mf;
    if(cljs.core.truth_(and__3546__auto____101889)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____101889
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____101890 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____101890)) {
        return or__3548__auto____101890
      }else {
        var or__3548__auto____101891 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____101891)) {
          return or__3548__auto____101891
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____101892 = mf;
    if(cljs.core.truth_(and__3546__auto____101892)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____101892
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____101893 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____101893)) {
        return or__3548__auto____101893
      }else {
        var or__3548__auto____101894 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____101894)) {
          return or__3548__auto____101894
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____101895 = mf;
    if(cljs.core.truth_(and__3546__auto____101895)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____101895
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____101896 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____101896)) {
        return or__3548__auto____101896
      }else {
        var or__3548__auto____101897 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____101897)) {
          return or__3548__auto____101897
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____101898 = mf;
    if(cljs.core.truth_(and__3546__auto____101898)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____101898
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____101899 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____101899)) {
        return or__3548__auto____101899
      }else {
        var or__3548__auto____101900 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____101900)) {
          return or__3548__auto____101900
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__101901 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__101902 = cljs.core._get_method.call(null, mf, dispatch_val__101901);
  if(cljs.core.truth_(target_fn__101902)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__101901));
  }
  return cljs.core.apply.call(null, target_fn__101902, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__101903 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__101904 = this;
  cljs.core.swap_BANG_.call(null, this__101904.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__101904.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__101904.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__101904.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__101905 = this;
  cljs.core.swap_BANG_.call(null, this__101905.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__101905.method_cache, this__101905.method_table, this__101905.cached_hierarchy, this__101905.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__101906 = this;
  cljs.core.swap_BANG_.call(null, this__101906.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__101906.method_cache, this__101906.method_table, this__101906.cached_hierarchy, this__101906.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__101907 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__101907.cached_hierarchy), cljs.core.deref.call(null, this__101907.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__101907.method_cache, this__101907.method_table, this__101907.cached_hierarchy, this__101907.hierarchy)
  }
  var temp__3695__auto____101908 = cljs.core.deref.call(null, this__101907.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____101908)) {
    var target_fn__101909 = temp__3695__auto____101908;
    return target_fn__101909
  }else {
    var temp__3695__auto____101910 = cljs.core.find_and_cache_best_method.call(null, this__101907.name, dispatch_val, this__101907.hierarchy, this__101907.method_table, this__101907.prefer_table, this__101907.method_cache, this__101907.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____101910)) {
      var target_fn__101911 = temp__3695__auto____101910;
      return target_fn__101911
    }else {
      return cljs.core.deref.call(null, this__101907.method_table).call(null, this__101907.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__101912 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__101912.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__101912.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__101912.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__101912.method_cache, this__101912.method_table, this__101912.cached_hierarchy, this__101912.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__101913 = this;
  return cljs.core.deref.call(null, this__101913.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__101914 = this;
  return cljs.core.deref.call(null, this__101914.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__101915 = this;
  return cljs.core.do_dispatch.call(null, mf, this__101915.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__101916__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__101916 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__101916__delegate.call(this, _, args)
  };
  G__101916.cljs$lang$maxFixedArity = 1;
  G__101916.cljs$lang$applyTo = function(arglist__101917) {
    var _ = cljs.core.first(arglist__101917);
    var args = cljs.core.rest(arglist__101917);
    return G__101916__delegate.call(this, _, args)
  };
  return G__101916
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid(val)
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
};
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return Boolean(opt_cancel)
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.getFunctionName = function(fn) {
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(buffer[i])
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.logToSpeedTracer_ = function(msg) {
  if(goog.global["console"] && goog.global["console"]["markTimeline"]) {
    goog.global["console"]["markTimeline"](msg)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  this.logToSpeedTracer_("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("goog.debug.RelativeTimeProvider");
goog.debug.RelativeTimeProvider = function() {
  this.relativeTimeStart_ = goog.now()
};
goog.debug.RelativeTimeProvider.defaultInstance_ = new goog.debug.RelativeTimeProvider;
goog.debug.RelativeTimeProvider.prototype.set = function(timeStamp) {
  this.relativeTimeStart_ = timeStamp
};
goog.debug.RelativeTimeProvider.prototype.reset = function() {
  this.set(goog.now())
};
goog.debug.RelativeTimeProvider.prototype.get = function() {
  return this.relativeTimeStart_
};
goog.debug.RelativeTimeProvider.getDefaultInstance = function() {
  return goog.debug.RelativeTimeProvider.defaultInstance_
};
goog.provide("goog.debug.Formatter");
goog.provide("goog.debug.HtmlFormatter");
goog.provide("goog.debug.TextFormatter");
goog.require("goog.debug.RelativeTimeProvider");
goog.require("goog.string");
goog.debug.Formatter = function(opt_prefix) {
  this.prefix_ = opt_prefix || "";
  this.startTimeProvider_ = goog.debug.RelativeTimeProvider.getDefaultInstance()
};
goog.debug.Formatter.prototype.showAbsoluteTime = true;
goog.debug.Formatter.prototype.showRelativeTime = true;
goog.debug.Formatter.prototype.showLoggerName = true;
goog.debug.Formatter.prototype.showExceptionText = false;
goog.debug.Formatter.prototype.showSeverityLevel = false;
goog.debug.Formatter.prototype.formatRecord = goog.abstractMethod;
goog.debug.Formatter.prototype.setStartTimeProvider = function(provider) {
  this.startTimeProvider_ = provider
};
goog.debug.Formatter.prototype.getStartTimeProvider = function() {
  return this.startTimeProvider_
};
goog.debug.Formatter.prototype.resetRelativeTimeStart = function() {
  this.startTimeProvider_.reset()
};
goog.debug.Formatter.getDateTimeStamp_ = function(logRecord) {
  var time = new Date(logRecord.getMillis());
  return goog.debug.Formatter.getTwoDigitString_(time.getFullYear() - 2E3) + goog.debug.Formatter.getTwoDigitString_(time.getMonth() + 1) + goog.debug.Formatter.getTwoDigitString_(time.getDate()) + " " + goog.debug.Formatter.getTwoDigitString_(time.getHours()) + ":" + goog.debug.Formatter.getTwoDigitString_(time.getMinutes()) + ":" + goog.debug.Formatter.getTwoDigitString_(time.getSeconds()) + "." + goog.debug.Formatter.getTwoDigitString_(Math.floor(time.getMilliseconds() / 10))
};
goog.debug.Formatter.getTwoDigitString_ = function(n) {
  if(n < 10) {
    return"0" + n
  }
  return String(n)
};
goog.debug.Formatter.getRelativeTime_ = function(logRecord, relativeTimeStart) {
  var ms = logRecord.getMillis() - relativeTimeStart;
  var sec = ms / 1E3;
  var str = sec.toFixed(3);
  var spacesToPrepend = 0;
  if(sec < 1) {
    spacesToPrepend = 2
  }else {
    while(sec < 100) {
      spacesToPrepend++;
      sec *= 10
    }
  }
  while(spacesToPrepend-- > 0) {
    str = " " + str
  }
  return str
};
goog.debug.HtmlFormatter = function(opt_prefix) {
  goog.debug.Formatter.call(this, opt_prefix)
};
goog.inherits(goog.debug.HtmlFormatter, goog.debug.Formatter);
goog.debug.HtmlFormatter.prototype.showExceptionText = true;
goog.debug.HtmlFormatter.prototype.formatRecord = function(logRecord) {
  var className;
  switch(logRecord.getLevel().value) {
    case goog.debug.Logger.Level.SHOUT.value:
      className = "dbg-sh";
      break;
    case goog.debug.Logger.Level.SEVERE.value:
      className = "dbg-sev";
      break;
    case goog.debug.Logger.Level.WARNING.value:
      className = "dbg-w";
      break;
    case goog.debug.Logger.Level.INFO.value:
      className = "dbg-i";
      break;
    case goog.debug.Logger.Level.FINE.value:
    ;
    default:
      className = "dbg-f";
      break
  }
  var sb = [];
  sb.push(this.prefix_, " ");
  if(this.showAbsoluteTime) {
    sb.push("[", goog.debug.Formatter.getDateTimeStamp_(logRecord), "] ")
  }
  if(this.showRelativeTime) {
    sb.push("[", goog.string.whitespaceEscape(goog.debug.Formatter.getRelativeTime_(logRecord, this.startTimeProvider_.get())), "s] ")
  }
  if(this.showLoggerName) {
    sb.push("[", goog.string.htmlEscape(logRecord.getLoggerName()), "] ")
  }
  sb.push('<span class="', className, '">', goog.string.newLineToBr(goog.string.whitespaceEscape(goog.string.htmlEscape(logRecord.getMessage()))));
  if(this.showExceptionText && logRecord.getException()) {
    sb.push("<br>", goog.string.newLineToBr(goog.string.whitespaceEscape(logRecord.getExceptionText() || "")))
  }
  sb.push("</span><br>");
  return sb.join("")
};
goog.debug.TextFormatter = function(opt_prefix) {
  goog.debug.Formatter.call(this, opt_prefix)
};
goog.inherits(goog.debug.TextFormatter, goog.debug.Formatter);
goog.debug.TextFormatter.prototype.formatRecord = function(logRecord) {
  var sb = [];
  sb.push(this.prefix_, " ");
  if(this.showAbsoluteTime) {
    sb.push("[", goog.debug.Formatter.getDateTimeStamp_(logRecord), "] ")
  }
  if(this.showRelativeTime) {
    sb.push("[", goog.debug.Formatter.getRelativeTime_(logRecord, this.startTimeProvider_.get()), "s] ")
  }
  if(this.showLoggerName) {
    sb.push("[", logRecord.getLoggerName(), "] ")
  }
  if(this.showSeverityLevel) {
    sb.push("[", logRecord.getLevel().name, "] ")
  }
  sb.push(logRecord.getMessage(), "\n");
  if(this.showExceptionText && logRecord.getException()) {
    sb.push(logRecord.getExceptionText(), "\n")
  }
  return sb.join("")
};
goog.provide("goog.debug.Console");
goog.require("goog.debug.LogManager");
goog.require("goog.debug.Logger.Level");
goog.require("goog.debug.TextFormatter");
goog.debug.Console = function() {
  this.publishHandler_ = goog.bind(this.addLogRecord, this);
  this.formatter_ = new goog.debug.TextFormatter;
  this.formatter_.showAbsoluteTime = false;
  this.formatter_.showExceptionText = false;
  this.isCapturing_ = false;
  this.logBuffer_ = ""
};
goog.debug.Console.prototype.getFormatter = function() {
  return this.formatter_
};
goog.debug.Console.prototype.setCapturing = function(capturing) {
  if(capturing == this.isCapturing_) {
    return
  }
  var rootLogger = goog.debug.LogManager.getRoot();
  if(capturing) {
    rootLogger.addHandler(this.publishHandler_)
  }else {
    rootLogger.removeHandler(this.publishHandler_);
    this.logBuffer = ""
  }
  this.isCapturing_ = capturing
};
goog.debug.Console.prototype.addLogRecord = function(logRecord) {
  var record = this.formatter_.formatRecord(logRecord);
  if(window.console && window.console["firebug"]) {
    switch(logRecord.getLevel()) {
      case goog.debug.Logger.Level.SHOUT:
        window.console["info"](record);
        break;
      case goog.debug.Logger.Level.SEVERE:
        window.console["error"](record);
        break;
      case goog.debug.Logger.Level.WARNING:
        window.console["warn"](record);
        break;
      default:
        window.console["debug"](record);
        break
    }
  }else {
    if(window.console) {
      window.console.log(record)
    }else {
      if(window.opera) {
        window.opera["postError"](record)
      }else {
        this.logBuffer_ += record
      }
    }
  }
};
goog.debug.Console.instance = null;
goog.debug.Console.autoInstall = function() {
  if(!goog.debug.Console.instance) {
    goog.debug.Console.instance = new goog.debug.Console
  }
  if(window.location.href.indexOf("Debug=true") != -1) {
    goog.debug.Console.instance.setCapturing(true)
  }
};
goog.debug.Console.show = function() {
  alert(goog.debug.Console.instance.logBuffer_)
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("onedit");
goog.require("cljs.core");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.debug.Logger");
goog.require("goog.debug.Console");
onedit.logger = goog.debug.Logger.getLogger.call(null, "onedit");
goog.debug.Console.autoInstall.call(null);
onedit.reader = function() {
  var reader__100122 = new goog.global.FileReader;
  reader__100122.onload = function(e) {
    onedit.logger.info(e.target.result);
    return goog.dom.setTextContent.call(null, goog.dom.getElement.call(null, "buffer"), e.target.result)
  };
  return reader__100122
}();
onedit.load = function load(file) {
  return onedit.reader.readAsText(file)
};
goog.events.listen.call(null, goog.dom.getElement.call(null, "open"), goog.events.EventType.CLICK, function() {
  return goog.dom.getElement.call(null, "file").click()
});
goog.events.listen.call(null, goog.dom.getElement.call(null, "file"), goog.events.EventType.CHANGE, function(e) {
  return onedit.load.call(null, e.target.files[0])
});
