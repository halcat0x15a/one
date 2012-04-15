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
  var or__3548__auto____8571 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____8571)) {
    return or__3548__auto____8571
  }else {
    var or__3548__auto____8572 = p["_"];
    if(cljs.core.truth_(or__3548__auto____8572)) {
      return or__3548__auto____8572
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
  var _invoke__8636 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8573 = this$;
      if(cljs.core.truth_(and__3546__auto____8573)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8573
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____8574 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8574)) {
          return or__3548__auto____8574
        }else {
          var or__3548__auto____8575 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8575)) {
            return or__3548__auto____8575
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__8637 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8576 = this$;
      if(cljs.core.truth_(and__3546__auto____8576)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8576
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____8577 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8577)) {
          return or__3548__auto____8577
        }else {
          var or__3548__auto____8578 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8578)) {
            return or__3548__auto____8578
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__8638 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8579 = this$;
      if(cljs.core.truth_(and__3546__auto____8579)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8579
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____8580 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8580)) {
          return or__3548__auto____8580
        }else {
          var or__3548__auto____8581 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8581)) {
            return or__3548__auto____8581
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__8639 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8582 = this$;
      if(cljs.core.truth_(and__3546__auto____8582)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8582
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____8583 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8583)) {
          return or__3548__auto____8583
        }else {
          var or__3548__auto____8584 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8584)) {
            return or__3548__auto____8584
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__8640 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8585 = this$;
      if(cljs.core.truth_(and__3546__auto____8585)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8585
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____8586 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8586)) {
          return or__3548__auto____8586
        }else {
          var or__3548__auto____8587 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8587)) {
            return or__3548__auto____8587
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__8641 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8588 = this$;
      if(cljs.core.truth_(and__3546__auto____8588)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8588
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____8589 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8589)) {
          return or__3548__auto____8589
        }else {
          var or__3548__auto____8590 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8590)) {
            return or__3548__auto____8590
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__8642 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8591 = this$;
      if(cljs.core.truth_(and__3546__auto____8591)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8591
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____8592 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8592)) {
          return or__3548__auto____8592
        }else {
          var or__3548__auto____8593 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8593)) {
            return or__3548__auto____8593
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8643 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8594 = this$;
      if(cljs.core.truth_(and__3546__auto____8594)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8594
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____8595 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8595)) {
          return or__3548__auto____8595
        }else {
          var or__3548__auto____8596 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8596)) {
            return or__3548__auto____8596
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__8644 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8597 = this$;
      if(cljs.core.truth_(and__3546__auto____8597)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8597
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____8598 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8598)) {
          return or__3548__auto____8598
        }else {
          var or__3548__auto____8599 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8599)) {
            return or__3548__auto____8599
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__8645 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8600 = this$;
      if(cljs.core.truth_(and__3546__auto____8600)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8600
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____8601 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8601)) {
          return or__3548__auto____8601
        }else {
          var or__3548__auto____8602 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8602)) {
            return or__3548__auto____8602
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__8646 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8603 = this$;
      if(cljs.core.truth_(and__3546__auto____8603)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8603
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____8604 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8604)) {
          return or__3548__auto____8604
        }else {
          var or__3548__auto____8605 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8605)) {
            return or__3548__auto____8605
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__8647 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8606 = this$;
      if(cljs.core.truth_(and__3546__auto____8606)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8606
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____8607 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8607)) {
          return or__3548__auto____8607
        }else {
          var or__3548__auto____8608 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8608)) {
            return or__3548__auto____8608
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__8648 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8609 = this$;
      if(cljs.core.truth_(and__3546__auto____8609)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8609
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____8610 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8610)) {
          return or__3548__auto____8610
        }else {
          var or__3548__auto____8611 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8611)) {
            return or__3548__auto____8611
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__8649 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8612 = this$;
      if(cljs.core.truth_(and__3546__auto____8612)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8612
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____8613 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8613)) {
          return or__3548__auto____8613
        }else {
          var or__3548__auto____8614 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8614)) {
            return or__3548__auto____8614
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__8650 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8615 = this$;
      if(cljs.core.truth_(and__3546__auto____8615)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8615
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____8616 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8616)) {
          return or__3548__auto____8616
        }else {
          var or__3548__auto____8617 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8617)) {
            return or__3548__auto____8617
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__8651 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8618 = this$;
      if(cljs.core.truth_(and__3546__auto____8618)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8618
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____8619 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8619)) {
          return or__3548__auto____8619
        }else {
          var or__3548__auto____8620 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8620)) {
            return or__3548__auto____8620
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__8652 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8621 = this$;
      if(cljs.core.truth_(and__3546__auto____8621)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8621
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____8622 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8622)) {
          return or__3548__auto____8622
        }else {
          var or__3548__auto____8623 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8623)) {
            return or__3548__auto____8623
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__8653 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8624 = this$;
      if(cljs.core.truth_(and__3546__auto____8624)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8624
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____8625 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8625)) {
          return or__3548__auto____8625
        }else {
          var or__3548__auto____8626 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8626)) {
            return or__3548__auto____8626
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__8654 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8627 = this$;
      if(cljs.core.truth_(and__3546__auto____8627)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8627
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____8628 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8628)) {
          return or__3548__auto____8628
        }else {
          var or__3548__auto____8629 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8629)) {
            return or__3548__auto____8629
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__8655 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8630 = this$;
      if(cljs.core.truth_(and__3546__auto____8630)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8630
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____8631 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8631)) {
          return or__3548__auto____8631
        }else {
          var or__3548__auto____8632 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8632)) {
            return or__3548__auto____8632
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__8656 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8633 = this$;
      if(cljs.core.truth_(and__3546__auto____8633)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____8633
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____8634 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____8634)) {
          return or__3548__auto____8634
        }else {
          var or__3548__auto____8635 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____8635)) {
            return or__3548__auto____8635
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
        return _invoke__8636.call(this, this$);
      case 2:
        return _invoke__8637.call(this, this$, a);
      case 3:
        return _invoke__8638.call(this, this$, a, b);
      case 4:
        return _invoke__8639.call(this, this$, a, b, c);
      case 5:
        return _invoke__8640.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__8641.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__8642.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8643.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__8644.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__8645.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__8646.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__8647.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__8648.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__8649.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__8650.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__8651.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__8652.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__8653.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__8654.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__8655.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__8656.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8658 = coll;
    if(cljs.core.truth_(and__3546__auto____8658)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____8658
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____8659 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8659)) {
        return or__3548__auto____8659
      }else {
        var or__3548__auto____8660 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____8660)) {
          return or__3548__auto____8660
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
    var and__3546__auto____8661 = coll;
    if(cljs.core.truth_(and__3546__auto____8661)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____8661
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____8662 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8662)) {
        return or__3548__auto____8662
      }else {
        var or__3548__auto____8663 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____8663)) {
          return or__3548__auto____8663
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
    var and__3546__auto____8664 = coll;
    if(cljs.core.truth_(and__3546__auto____8664)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____8664
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____8665 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8665)) {
        return or__3548__auto____8665
      }else {
        var or__3548__auto____8666 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____8666)) {
          return or__3548__auto____8666
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
  var _nth__8673 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8667 = coll;
      if(cljs.core.truth_(and__3546__auto____8667)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____8667
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____8668 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____8668)) {
          return or__3548__auto____8668
        }else {
          var or__3548__auto____8669 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____8669)) {
            return or__3548__auto____8669
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__8674 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8670 = coll;
      if(cljs.core.truth_(and__3546__auto____8670)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____8670
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____8671 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____8671)) {
          return or__3548__auto____8671
        }else {
          var or__3548__auto____8672 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____8672)) {
            return or__3548__auto____8672
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
        return _nth__8673.call(this, coll, n);
      case 3:
        return _nth__8674.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8676 = coll;
    if(cljs.core.truth_(and__3546__auto____8676)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____8676
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____8677 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8677)) {
        return or__3548__auto____8677
      }else {
        var or__3548__auto____8678 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____8678)) {
          return or__3548__auto____8678
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8679 = coll;
    if(cljs.core.truth_(and__3546__auto____8679)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____8679
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____8680 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8680)) {
        return or__3548__auto____8680
      }else {
        var or__3548__auto____8681 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____8681)) {
          return or__3548__auto____8681
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
  var _lookup__8688 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8682 = o;
      if(cljs.core.truth_(and__3546__auto____8682)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____8682
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____8683 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____8683)) {
          return or__3548__auto____8683
        }else {
          var or__3548__auto____8684 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____8684)) {
            return or__3548__auto____8684
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__8689 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8685 = o;
      if(cljs.core.truth_(and__3546__auto____8685)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____8685
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____8686 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____8686)) {
          return or__3548__auto____8686
        }else {
          var or__3548__auto____8687 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____8687)) {
            return or__3548__auto____8687
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
        return _lookup__8688.call(this, o, k);
      case 3:
        return _lookup__8689.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8691 = coll;
    if(cljs.core.truth_(and__3546__auto____8691)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____8691
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____8692 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8692)) {
        return or__3548__auto____8692
      }else {
        var or__3548__auto____8693 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____8693)) {
          return or__3548__auto____8693
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8694 = coll;
    if(cljs.core.truth_(and__3546__auto____8694)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____8694
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____8695 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8695)) {
        return or__3548__auto____8695
      }else {
        var or__3548__auto____8696 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____8696)) {
          return or__3548__auto____8696
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
    var and__3546__auto____8697 = coll;
    if(cljs.core.truth_(and__3546__auto____8697)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____8697
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____8698 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8698)) {
        return or__3548__auto____8698
      }else {
        var or__3548__auto____8699 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____8699)) {
          return or__3548__auto____8699
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
    var and__3546__auto____8700 = coll;
    if(cljs.core.truth_(and__3546__auto____8700)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____8700
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____8701 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8701)) {
        return or__3548__auto____8701
      }else {
        var or__3548__auto____8702 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____8702)) {
          return or__3548__auto____8702
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
    var and__3546__auto____8703 = coll;
    if(cljs.core.truth_(and__3546__auto____8703)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____8703
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____8704 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8704)) {
        return or__3548__auto____8704
      }else {
        var or__3548__auto____8705 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____8705)) {
          return or__3548__auto____8705
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8706 = coll;
    if(cljs.core.truth_(and__3546__auto____8706)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____8706
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____8707 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8707)) {
        return or__3548__auto____8707
      }else {
        var or__3548__auto____8708 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____8708)) {
          return or__3548__auto____8708
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
    var and__3546__auto____8709 = coll;
    if(cljs.core.truth_(and__3546__auto____8709)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____8709
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____8710 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____8710)) {
        return or__3548__auto____8710
      }else {
        var or__3548__auto____8711 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____8711)) {
          return or__3548__auto____8711
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
    var and__3546__auto____8712 = o;
    if(cljs.core.truth_(and__3546__auto____8712)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____8712
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____8713 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____8713)) {
        return or__3548__auto____8713
      }else {
        var or__3548__auto____8714 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____8714)) {
          return or__3548__auto____8714
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
    var and__3546__auto____8715 = o;
    if(cljs.core.truth_(and__3546__auto____8715)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____8715
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____8716 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____8716)) {
        return or__3548__auto____8716
      }else {
        var or__3548__auto____8717 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____8717)) {
          return or__3548__auto____8717
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
    var and__3546__auto____8718 = o;
    if(cljs.core.truth_(and__3546__auto____8718)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____8718
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____8719 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____8719)) {
        return or__3548__auto____8719
      }else {
        var or__3548__auto____8720 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____8720)) {
          return or__3548__auto____8720
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
    var and__3546__auto____8721 = o;
    if(cljs.core.truth_(and__3546__auto____8721)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____8721
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____8722 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____8722)) {
        return or__3548__auto____8722
      }else {
        var or__3548__auto____8723 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____8723)) {
          return or__3548__auto____8723
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
  var _reduce__8730 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8724 = coll;
      if(cljs.core.truth_(and__3546__auto____8724)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____8724
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____8725 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____8725)) {
          return or__3548__auto____8725
        }else {
          var or__3548__auto____8726 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____8726)) {
            return or__3548__auto____8726
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__8731 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8727 = coll;
      if(cljs.core.truth_(and__3546__auto____8727)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____8727
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____8728 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____8728)) {
          return or__3548__auto____8728
        }else {
          var or__3548__auto____8729 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____8729)) {
            return or__3548__auto____8729
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
        return _reduce__8730.call(this, coll, f);
      case 3:
        return _reduce__8731.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8733 = o;
    if(cljs.core.truth_(and__3546__auto____8733)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____8733
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____8734 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____8734)) {
        return or__3548__auto____8734
      }else {
        var or__3548__auto____8735 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____8735)) {
          return or__3548__auto____8735
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
    var and__3546__auto____8736 = o;
    if(cljs.core.truth_(and__3546__auto____8736)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____8736
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____8737 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____8737)) {
        return or__3548__auto____8737
      }else {
        var or__3548__auto____8738 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____8738)) {
          return or__3548__auto____8738
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
    var and__3546__auto____8739 = o;
    if(cljs.core.truth_(and__3546__auto____8739)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____8739
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____8740 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____8740)) {
        return or__3548__auto____8740
      }else {
        var or__3548__auto____8741 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____8741)) {
          return or__3548__auto____8741
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
    var and__3546__auto____8742 = o;
    if(cljs.core.truth_(and__3546__auto____8742)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____8742
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____8743 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____8743)) {
        return or__3548__auto____8743
      }else {
        var or__3548__auto____8744 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____8744)) {
          return or__3548__auto____8744
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
    var and__3546__auto____8745 = d;
    if(cljs.core.truth_(and__3546__auto____8745)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____8745
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____8746 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____8746)) {
        return or__3548__auto____8746
      }else {
        var or__3548__auto____8747 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____8747)) {
          return or__3548__auto____8747
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
    var and__3546__auto____8748 = this$;
    if(cljs.core.truth_(and__3546__auto____8748)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____8748
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____8749 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____8749)) {
        return or__3548__auto____8749
      }else {
        var or__3548__auto____8750 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____8750)) {
          return or__3548__auto____8750
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8751 = this$;
    if(cljs.core.truth_(and__3546__auto____8751)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____8751
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____8752 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____8752)) {
        return or__3548__auto____8752
      }else {
        var or__3548__auto____8753 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____8753)) {
          return or__3548__auto____8753
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____8754 = this$;
    if(cljs.core.truth_(and__3546__auto____8754)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____8754
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____8755 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____8755)) {
        return or__3548__auto____8755
      }else {
        var or__3548__auto____8756 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____8756)) {
          return or__3548__auto____8756
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
  var G__8757 = null;
  var G__8757__8758 = function(o, k) {
    return null
  };
  var G__8757__8759 = function(o, k, not_found) {
    return not_found
  };
  G__8757 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8757__8758.call(this, o, k);
      case 3:
        return G__8757__8759.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8757
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
  var G__8761 = null;
  var G__8761__8762 = function(_, f) {
    return f.call(null)
  };
  var G__8761__8763 = function(_, f, start) {
    return start
  };
  G__8761 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8761__8762.call(this, _, f);
      case 3:
        return G__8761__8763.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8761
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
  var G__8765 = null;
  var G__8765__8766 = function(_, n) {
    return null
  };
  var G__8765__8767 = function(_, n, not_found) {
    return not_found
  };
  G__8765 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8765__8766.call(this, _, n);
      case 3:
        return G__8765__8767.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8765
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
  var ci_reduce__8775 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__8769 = cljs.core._nth.call(null, cicoll, 0);
      var n__8770 = 1;
      while(true) {
        if(cljs.core.truth_(n__8770 < cljs.core._count.call(null, cicoll))) {
          var G__8779 = f.call(null, val__8769, cljs.core._nth.call(null, cicoll, n__8770));
          var G__8780 = n__8770 + 1;
          val__8769 = G__8779;
          n__8770 = G__8780;
          continue
        }else {
          return val__8769
        }
        break
      }
    }
  };
  var ci_reduce__8776 = function(cicoll, f, val) {
    var val__8771 = val;
    var n__8772 = 0;
    while(true) {
      if(cljs.core.truth_(n__8772 < cljs.core._count.call(null, cicoll))) {
        var G__8781 = f.call(null, val__8771, cljs.core._nth.call(null, cicoll, n__8772));
        var G__8782 = n__8772 + 1;
        val__8771 = G__8781;
        n__8772 = G__8782;
        continue
      }else {
        return val__8771
      }
      break
    }
  };
  var ci_reduce__8777 = function(cicoll, f, val, idx) {
    var val__8773 = val;
    var n__8774 = idx;
    while(true) {
      if(cljs.core.truth_(n__8774 < cljs.core._count.call(null, cicoll))) {
        var G__8783 = f.call(null, val__8773, cljs.core._nth.call(null, cicoll, n__8774));
        var G__8784 = n__8774 + 1;
        val__8773 = G__8783;
        n__8774 = G__8784;
        continue
      }else {
        return val__8773
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__8775.call(this, cicoll, f);
      case 3:
        return ci_reduce__8776.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__8777.call(this, cicoll, f, val, idx)
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
  var this__8785 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__8798 = null;
  var G__8798__8799 = function(_, f) {
    var this__8786 = this;
    return cljs.core.ci_reduce.call(null, this__8786.a, f, this__8786.a[this__8786.i], this__8786.i + 1)
  };
  var G__8798__8800 = function(_, f, start) {
    var this__8787 = this;
    return cljs.core.ci_reduce.call(null, this__8787.a, f, start, this__8787.i)
  };
  G__8798 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8798__8799.call(this, _, f);
      case 3:
        return G__8798__8800.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8798
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__8788 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__8789 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__8802 = null;
  var G__8802__8803 = function(coll, n) {
    var this__8790 = this;
    var i__8791 = n + this__8790.i;
    if(cljs.core.truth_(i__8791 < this__8790.a.length)) {
      return this__8790.a[i__8791]
    }else {
      return null
    }
  };
  var G__8802__8804 = function(coll, n, not_found) {
    var this__8792 = this;
    var i__8793 = n + this__8792.i;
    if(cljs.core.truth_(i__8793 < this__8792.a.length)) {
      return this__8792.a[i__8793]
    }else {
      return not_found
    }
  };
  G__8802 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8802__8803.call(this, coll, n);
      case 3:
        return G__8802__8804.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8802
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__8794 = this;
  return this__8794.a.length - this__8794.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__8795 = this;
  return this__8795.a[this__8795.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__8796 = this;
  if(cljs.core.truth_(this__8796.i + 1 < this__8796.a.length)) {
    return new cljs.core.IndexedSeq(this__8796.a, this__8796.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__8797 = this;
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
  var G__8806 = null;
  var G__8806__8807 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__8806__8808 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__8806 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8806__8807.call(this, array, f);
      case 3:
        return G__8806__8808.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8806
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__8810 = null;
  var G__8810__8811 = function(array, k) {
    return array[k]
  };
  var G__8810__8812 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__8810 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8810__8811.call(this, array, k);
      case 3:
        return G__8810__8812.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8810
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__8814 = null;
  var G__8814__8815 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__8814__8816 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__8814 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8814__8815.call(this, array, n);
      case 3:
        return G__8814__8816.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8814
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
  var temp__3698__auto____8818 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____8818)) {
    var s__8819 = temp__3698__auto____8818;
    return cljs.core._first.call(null, s__8819)
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
      var G__8820 = cljs.core.next.call(null, s);
      s = G__8820;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__8821 = cljs.core.seq.call(null, x);
  var n__8822 = 0;
  while(true) {
    if(cljs.core.truth_(s__8821)) {
      var G__8823 = cljs.core.next.call(null, s__8821);
      var G__8824 = n__8822 + 1;
      s__8821 = G__8823;
      n__8822 = G__8824;
      continue
    }else {
      return n__8822
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
  var conj__8825 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__8826 = function() {
    var G__8828__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__8829 = conj.call(null, coll, x);
          var G__8830 = cljs.core.first.call(null, xs);
          var G__8831 = cljs.core.next.call(null, xs);
          coll = G__8829;
          x = G__8830;
          xs = G__8831;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__8828 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8828__delegate.call(this, coll, x, xs)
    };
    G__8828.cljs$lang$maxFixedArity = 2;
    G__8828.cljs$lang$applyTo = function(arglist__8832) {
      var coll = cljs.core.first(arglist__8832);
      var x = cljs.core.first(cljs.core.next(arglist__8832));
      var xs = cljs.core.rest(cljs.core.next(arglist__8832));
      return G__8828__delegate.call(this, coll, x, xs)
    };
    return G__8828
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__8825.call(this, coll, x);
      default:
        return conj__8826.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__8826.cljs$lang$applyTo;
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
  var nth__8833 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__8834 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__8833.call(this, coll, n);
      case 3:
        return nth__8834.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__8836 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__8837 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__8836.call(this, o, k);
      case 3:
        return get__8837.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__8840 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__8841 = function() {
    var G__8843__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__8839 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__8844 = ret__8839;
          var G__8845 = cljs.core.first.call(null, kvs);
          var G__8846 = cljs.core.second.call(null, kvs);
          var G__8847 = cljs.core.nnext.call(null, kvs);
          coll = G__8844;
          k = G__8845;
          v = G__8846;
          kvs = G__8847;
          continue
        }else {
          return ret__8839
        }
        break
      }
    };
    var G__8843 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8843__delegate.call(this, coll, k, v, kvs)
    };
    G__8843.cljs$lang$maxFixedArity = 3;
    G__8843.cljs$lang$applyTo = function(arglist__8848) {
      var coll = cljs.core.first(arglist__8848);
      var k = cljs.core.first(cljs.core.next(arglist__8848));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8848)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8848)));
      return G__8843__delegate.call(this, coll, k, v, kvs)
    };
    return G__8843
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__8840.call(this, coll, k, v);
      default:
        return assoc__8841.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__8841.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__8850 = function(coll) {
    return coll
  };
  var dissoc__8851 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__8852 = function() {
    var G__8854__delegate = function(coll, k, ks) {
      while(true) {
        var ret__8849 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__8855 = ret__8849;
          var G__8856 = cljs.core.first.call(null, ks);
          var G__8857 = cljs.core.next.call(null, ks);
          coll = G__8855;
          k = G__8856;
          ks = G__8857;
          continue
        }else {
          return ret__8849
        }
        break
      }
    };
    var G__8854 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8854__delegate.call(this, coll, k, ks)
    };
    G__8854.cljs$lang$maxFixedArity = 2;
    G__8854.cljs$lang$applyTo = function(arglist__8858) {
      var coll = cljs.core.first(arglist__8858);
      var k = cljs.core.first(cljs.core.next(arglist__8858));
      var ks = cljs.core.rest(cljs.core.next(arglist__8858));
      return G__8854__delegate.call(this, coll, k, ks)
    };
    return G__8854
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__8850.call(this, coll);
      case 2:
        return dissoc__8851.call(this, coll, k);
      default:
        return dissoc__8852.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__8852.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__451__auto____8859 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____8860 = x__451__auto____8859;
      if(cljs.core.truth_(and__3546__auto____8860)) {
        var and__3546__auto____8861 = x__451__auto____8859.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____8861)) {
          return cljs.core.not.call(null, x__451__auto____8859.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____8861
        }
      }else {
        return and__3546__auto____8860
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____8859)
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
  var disj__8863 = function(coll) {
    return coll
  };
  var disj__8864 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__8865 = function() {
    var G__8867__delegate = function(coll, k, ks) {
      while(true) {
        var ret__8862 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__8868 = ret__8862;
          var G__8869 = cljs.core.first.call(null, ks);
          var G__8870 = cljs.core.next.call(null, ks);
          coll = G__8868;
          k = G__8869;
          ks = G__8870;
          continue
        }else {
          return ret__8862
        }
        break
      }
    };
    var G__8867 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8867__delegate.call(this, coll, k, ks)
    };
    G__8867.cljs$lang$maxFixedArity = 2;
    G__8867.cljs$lang$applyTo = function(arglist__8871) {
      var coll = cljs.core.first(arglist__8871);
      var k = cljs.core.first(cljs.core.next(arglist__8871));
      var ks = cljs.core.rest(cljs.core.next(arglist__8871));
      return G__8867__delegate.call(this, coll, k, ks)
    };
    return G__8867
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__8863.call(this, coll);
      case 2:
        return disj__8864.call(this, coll, k);
      default:
        return disj__8865.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__8865.cljs$lang$applyTo;
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
    var x__451__auto____8872 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____8873 = x__451__auto____8872;
      if(cljs.core.truth_(and__3546__auto____8873)) {
        var and__3546__auto____8874 = x__451__auto____8872.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____8874)) {
          return cljs.core.not.call(null, x__451__auto____8872.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____8874
        }
      }else {
        return and__3546__auto____8873
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__451__auto____8872)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____8875 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____8876 = x__451__auto____8875;
      if(cljs.core.truth_(and__3546__auto____8876)) {
        var and__3546__auto____8877 = x__451__auto____8875.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____8877)) {
          return cljs.core.not.call(null, x__451__auto____8875.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____8877
        }
      }else {
        return and__3546__auto____8876
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__451__auto____8875)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__451__auto____8878 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____8879 = x__451__auto____8878;
    if(cljs.core.truth_(and__3546__auto____8879)) {
      var and__3546__auto____8880 = x__451__auto____8878.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____8880)) {
        return cljs.core.not.call(null, x__451__auto____8878.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____8880
      }
    }else {
      return and__3546__auto____8879
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__451__auto____8878)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__451__auto____8881 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____8882 = x__451__auto____8881;
    if(cljs.core.truth_(and__3546__auto____8882)) {
      var and__3546__auto____8883 = x__451__auto____8881.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____8883)) {
        return cljs.core.not.call(null, x__451__auto____8881.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____8883
      }
    }else {
      return and__3546__auto____8882
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__451__auto____8881)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__451__auto____8884 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____8885 = x__451__auto____8884;
    if(cljs.core.truth_(and__3546__auto____8885)) {
      var and__3546__auto____8886 = x__451__auto____8884.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____8886)) {
        return cljs.core.not.call(null, x__451__auto____8884.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____8886
      }
    }else {
      return and__3546__auto____8885
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__451__auto____8884)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____8887 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____8888 = x__451__auto____8887;
      if(cljs.core.truth_(and__3546__auto____8888)) {
        var and__3546__auto____8889 = x__451__auto____8887.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____8889)) {
          return cljs.core.not.call(null, x__451__auto____8887.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____8889
        }
      }else {
        return and__3546__auto____8888
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__451__auto____8887)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__451__auto____8890 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____8891 = x__451__auto____8890;
    if(cljs.core.truth_(and__3546__auto____8891)) {
      var and__3546__auto____8892 = x__451__auto____8890.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____8892)) {
        return cljs.core.not.call(null, x__451__auto____8890.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____8892
      }
    }else {
      return and__3546__auto____8891
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__451__auto____8890)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__8893 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__8893.push(key)
  });
  return keys__8893
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
    var x__451__auto____8894 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____8895 = x__451__auto____8894;
      if(cljs.core.truth_(and__3546__auto____8895)) {
        var and__3546__auto____8896 = x__451__auto____8894.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____8896)) {
          return cljs.core.not.call(null, x__451__auto____8894.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____8896
        }
      }else {
        return and__3546__auto____8895
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__451__auto____8894)
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
  var and__3546__auto____8897 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____8897)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____8898 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____8898)) {
        return or__3548__auto____8898
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____8897
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____8899 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____8899)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____8899
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____8900 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____8900)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____8900
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____8901 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____8901)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____8901
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
    var and__3546__auto____8902 = coll;
    if(cljs.core.truth_(and__3546__auto____8902)) {
      var and__3546__auto____8903 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____8903)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____8903
      }
    }else {
      return and__3546__auto____8902
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___8908 = function(x) {
    return true
  };
  var distinct_QMARK___8909 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___8910 = function() {
    var G__8912__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__8904 = cljs.core.set([y, x]);
        var xs__8905 = more;
        while(true) {
          var x__8906 = cljs.core.first.call(null, xs__8905);
          var etc__8907 = cljs.core.next.call(null, xs__8905);
          if(cljs.core.truth_(xs__8905)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__8904, x__8906))) {
              return false
            }else {
              var G__8913 = cljs.core.conj.call(null, s__8904, x__8906);
              var G__8914 = etc__8907;
              s__8904 = G__8913;
              xs__8905 = G__8914;
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
    var G__8912 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8912__delegate.call(this, x, y, more)
    };
    G__8912.cljs$lang$maxFixedArity = 2;
    G__8912.cljs$lang$applyTo = function(arglist__8915) {
      var x = cljs.core.first(arglist__8915);
      var y = cljs.core.first(cljs.core.next(arglist__8915));
      var more = cljs.core.rest(cljs.core.next(arglist__8915));
      return G__8912__delegate.call(this, x, y, more)
    };
    return G__8912
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___8908.call(this, x);
      case 2:
        return distinct_QMARK___8909.call(this, x, y);
      default:
        return distinct_QMARK___8910.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___8910.cljs$lang$applyTo;
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
      var r__8916 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__8916))) {
        return r__8916
      }else {
        if(cljs.core.truth_(r__8916)) {
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
  var sort__8918 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__8919 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__8917 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__8917, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__8917)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__8918.call(this, comp);
      case 2:
        return sort__8919.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__8921 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__8922 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__8921.call(this, keyfn, comp);
      case 3:
        return sort_by__8922.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__8924 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__8925 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__8924.call(this, f, val);
      case 3:
        return reduce__8925.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__8931 = function(f, coll) {
    var temp__3695__auto____8927 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____8927)) {
      var s__8928 = temp__3695__auto____8927;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__8928), cljs.core.next.call(null, s__8928))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__8932 = function(f, val, coll) {
    var val__8929 = val;
    var coll__8930 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__8930)) {
        var G__8934 = f.call(null, val__8929, cljs.core.first.call(null, coll__8930));
        var G__8935 = cljs.core.next.call(null, coll__8930);
        val__8929 = G__8934;
        coll__8930 = G__8935;
        continue
      }else {
        return val__8929
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__8931.call(this, f, val);
      case 3:
        return seq_reduce__8932.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__8936 = null;
  var G__8936__8937 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__8936__8938 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__8936 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8936__8937.call(this, coll, f);
      case 3:
        return G__8936__8938.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8936
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___8940 = function() {
    return 0
  };
  var _PLUS___8941 = function(x) {
    return x
  };
  var _PLUS___8942 = function(x, y) {
    return x + y
  };
  var _PLUS___8943 = function() {
    var G__8945__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__8945 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8945__delegate.call(this, x, y, more)
    };
    G__8945.cljs$lang$maxFixedArity = 2;
    G__8945.cljs$lang$applyTo = function(arglist__8946) {
      var x = cljs.core.first(arglist__8946);
      var y = cljs.core.first(cljs.core.next(arglist__8946));
      var more = cljs.core.rest(cljs.core.next(arglist__8946));
      return G__8945__delegate.call(this, x, y, more)
    };
    return G__8945
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___8940.call(this);
      case 1:
        return _PLUS___8941.call(this, x);
      case 2:
        return _PLUS___8942.call(this, x, y);
      default:
        return _PLUS___8943.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___8943.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___8947 = function(x) {
    return-x
  };
  var ___8948 = function(x, y) {
    return x - y
  };
  var ___8949 = function() {
    var G__8951__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__8951 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8951__delegate.call(this, x, y, more)
    };
    G__8951.cljs$lang$maxFixedArity = 2;
    G__8951.cljs$lang$applyTo = function(arglist__8952) {
      var x = cljs.core.first(arglist__8952);
      var y = cljs.core.first(cljs.core.next(arglist__8952));
      var more = cljs.core.rest(cljs.core.next(arglist__8952));
      return G__8951__delegate.call(this, x, y, more)
    };
    return G__8951
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___8947.call(this, x);
      case 2:
        return ___8948.call(this, x, y);
      default:
        return ___8949.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___8949.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___8953 = function() {
    return 1
  };
  var _STAR___8954 = function(x) {
    return x
  };
  var _STAR___8955 = function(x, y) {
    return x * y
  };
  var _STAR___8956 = function() {
    var G__8958__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__8958 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8958__delegate.call(this, x, y, more)
    };
    G__8958.cljs$lang$maxFixedArity = 2;
    G__8958.cljs$lang$applyTo = function(arglist__8959) {
      var x = cljs.core.first(arglist__8959);
      var y = cljs.core.first(cljs.core.next(arglist__8959));
      var more = cljs.core.rest(cljs.core.next(arglist__8959));
      return G__8958__delegate.call(this, x, y, more)
    };
    return G__8958
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___8953.call(this);
      case 1:
        return _STAR___8954.call(this, x);
      case 2:
        return _STAR___8955.call(this, x, y);
      default:
        return _STAR___8956.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___8956.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___8960 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___8961 = function(x, y) {
    return x / y
  };
  var _SLASH___8962 = function() {
    var G__8964__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__8964 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8964__delegate.call(this, x, y, more)
    };
    G__8964.cljs$lang$maxFixedArity = 2;
    G__8964.cljs$lang$applyTo = function(arglist__8965) {
      var x = cljs.core.first(arglist__8965);
      var y = cljs.core.first(cljs.core.next(arglist__8965));
      var more = cljs.core.rest(cljs.core.next(arglist__8965));
      return G__8964__delegate.call(this, x, y, more)
    };
    return G__8964
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___8960.call(this, x);
      case 2:
        return _SLASH___8961.call(this, x, y);
      default:
        return _SLASH___8962.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___8962.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___8966 = function(x) {
    return true
  };
  var _LT___8967 = function(x, y) {
    return x < y
  };
  var _LT___8968 = function() {
    var G__8970__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__8971 = y;
            var G__8972 = cljs.core.first.call(null, more);
            var G__8973 = cljs.core.next.call(null, more);
            x = G__8971;
            y = G__8972;
            more = G__8973;
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
    var G__8970 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8970__delegate.call(this, x, y, more)
    };
    G__8970.cljs$lang$maxFixedArity = 2;
    G__8970.cljs$lang$applyTo = function(arglist__8974) {
      var x = cljs.core.first(arglist__8974);
      var y = cljs.core.first(cljs.core.next(arglist__8974));
      var more = cljs.core.rest(cljs.core.next(arglist__8974));
      return G__8970__delegate.call(this, x, y, more)
    };
    return G__8970
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___8966.call(this, x);
      case 2:
        return _LT___8967.call(this, x, y);
      default:
        return _LT___8968.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___8968.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___8975 = function(x) {
    return true
  };
  var _LT__EQ___8976 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___8977 = function() {
    var G__8979__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__8980 = y;
            var G__8981 = cljs.core.first.call(null, more);
            var G__8982 = cljs.core.next.call(null, more);
            x = G__8980;
            y = G__8981;
            more = G__8982;
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
    var G__8979 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8979__delegate.call(this, x, y, more)
    };
    G__8979.cljs$lang$maxFixedArity = 2;
    G__8979.cljs$lang$applyTo = function(arglist__8983) {
      var x = cljs.core.first(arglist__8983);
      var y = cljs.core.first(cljs.core.next(arglist__8983));
      var more = cljs.core.rest(cljs.core.next(arglist__8983));
      return G__8979__delegate.call(this, x, y, more)
    };
    return G__8979
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___8975.call(this, x);
      case 2:
        return _LT__EQ___8976.call(this, x, y);
      default:
        return _LT__EQ___8977.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___8977.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___8984 = function(x) {
    return true
  };
  var _GT___8985 = function(x, y) {
    return x > y
  };
  var _GT___8986 = function() {
    var G__8988__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__8989 = y;
            var G__8990 = cljs.core.first.call(null, more);
            var G__8991 = cljs.core.next.call(null, more);
            x = G__8989;
            y = G__8990;
            more = G__8991;
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
    var G__8988 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8988__delegate.call(this, x, y, more)
    };
    G__8988.cljs$lang$maxFixedArity = 2;
    G__8988.cljs$lang$applyTo = function(arglist__8992) {
      var x = cljs.core.first(arglist__8992);
      var y = cljs.core.first(cljs.core.next(arglist__8992));
      var more = cljs.core.rest(cljs.core.next(arglist__8992));
      return G__8988__delegate.call(this, x, y, more)
    };
    return G__8988
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___8984.call(this, x);
      case 2:
        return _GT___8985.call(this, x, y);
      default:
        return _GT___8986.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___8986.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___8993 = function(x) {
    return true
  };
  var _GT__EQ___8994 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___8995 = function() {
    var G__8997__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__8998 = y;
            var G__8999 = cljs.core.first.call(null, more);
            var G__9000 = cljs.core.next.call(null, more);
            x = G__8998;
            y = G__8999;
            more = G__9000;
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
    var G__8997 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8997__delegate.call(this, x, y, more)
    };
    G__8997.cljs$lang$maxFixedArity = 2;
    G__8997.cljs$lang$applyTo = function(arglist__9001) {
      var x = cljs.core.first(arglist__9001);
      var y = cljs.core.first(cljs.core.next(arglist__9001));
      var more = cljs.core.rest(cljs.core.next(arglist__9001));
      return G__8997__delegate.call(this, x, y, more)
    };
    return G__8997
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___8993.call(this, x);
      case 2:
        return _GT__EQ___8994.call(this, x, y);
      default:
        return _GT__EQ___8995.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___8995.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__9002 = function(x) {
    return x
  };
  var max__9003 = function(x, y) {
    return x > y ? x : y
  };
  var max__9004 = function() {
    var G__9006__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__9006 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9006__delegate.call(this, x, y, more)
    };
    G__9006.cljs$lang$maxFixedArity = 2;
    G__9006.cljs$lang$applyTo = function(arglist__9007) {
      var x = cljs.core.first(arglist__9007);
      var y = cljs.core.first(cljs.core.next(arglist__9007));
      var more = cljs.core.rest(cljs.core.next(arglist__9007));
      return G__9006__delegate.call(this, x, y, more)
    };
    return G__9006
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__9002.call(this, x);
      case 2:
        return max__9003.call(this, x, y);
      default:
        return max__9004.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__9004.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__9008 = function(x) {
    return x
  };
  var min__9009 = function(x, y) {
    return x < y ? x : y
  };
  var min__9010 = function() {
    var G__9012__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__9012 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9012__delegate.call(this, x, y, more)
    };
    G__9012.cljs$lang$maxFixedArity = 2;
    G__9012.cljs$lang$applyTo = function(arglist__9013) {
      var x = cljs.core.first(arglist__9013);
      var y = cljs.core.first(cljs.core.next(arglist__9013));
      var more = cljs.core.rest(cljs.core.next(arglist__9013));
      return G__9012__delegate.call(this, x, y, more)
    };
    return G__9012
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__9008.call(this, x);
      case 2:
        return min__9009.call(this, x, y);
      default:
        return min__9010.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__9010.cljs$lang$applyTo;
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
  var rem__9014 = n % d;
  return cljs.core.fix.call(null, (n - rem__9014) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__9015 = cljs.core.quot.call(null, n, d);
  return n - d * q__9015
};
cljs.core.rand = function() {
  var rand = null;
  var rand__9016 = function() {
    return Math.random.call(null)
  };
  var rand__9017 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__9016.call(this);
      case 1:
        return rand__9017.call(this, n)
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
  var _EQ__EQ___9019 = function(x) {
    return true
  };
  var _EQ__EQ___9020 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___9021 = function() {
    var G__9023__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9024 = y;
            var G__9025 = cljs.core.first.call(null, more);
            var G__9026 = cljs.core.next.call(null, more);
            x = G__9024;
            y = G__9025;
            more = G__9026;
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
    var G__9023 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9023__delegate.call(this, x, y, more)
    };
    G__9023.cljs$lang$maxFixedArity = 2;
    G__9023.cljs$lang$applyTo = function(arglist__9027) {
      var x = cljs.core.first(arglist__9027);
      var y = cljs.core.first(cljs.core.next(arglist__9027));
      var more = cljs.core.rest(cljs.core.next(arglist__9027));
      return G__9023__delegate.call(this, x, y, more)
    };
    return G__9023
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___9019.call(this, x);
      case 2:
        return _EQ__EQ___9020.call(this, x, y);
      default:
        return _EQ__EQ___9021.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___9021.cljs$lang$applyTo;
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
  var n__9028 = n;
  var xs__9029 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9030 = xs__9029;
      if(cljs.core.truth_(and__3546__auto____9030)) {
        return n__9028 > 0
      }else {
        return and__3546__auto____9030
      }
    }())) {
      var G__9031 = n__9028 - 1;
      var G__9032 = cljs.core.next.call(null, xs__9029);
      n__9028 = G__9031;
      xs__9029 = G__9032;
      continue
    }else {
      return xs__9029
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__9037 = null;
  var G__9037__9038 = function(coll, n) {
    var temp__3695__auto____9033 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____9033)) {
      var xs__9034 = temp__3695__auto____9033;
      return cljs.core.first.call(null, xs__9034)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__9037__9039 = function(coll, n, not_found) {
    var temp__3695__auto____9035 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____9035)) {
      var xs__9036 = temp__3695__auto____9035;
      return cljs.core.first.call(null, xs__9036)
    }else {
      return not_found
    }
  };
  G__9037 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9037__9038.call(this, coll, n);
      case 3:
        return G__9037__9039.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9037
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___9041 = function() {
    return""
  };
  var str_STAR___9042 = function(x) {
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
  var str_STAR___9043 = function() {
    var G__9045__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9046 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__9047 = cljs.core.next.call(null, more);
            sb = G__9046;
            more = G__9047;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__9045 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9045__delegate.call(this, x, ys)
    };
    G__9045.cljs$lang$maxFixedArity = 1;
    G__9045.cljs$lang$applyTo = function(arglist__9048) {
      var x = cljs.core.first(arglist__9048);
      var ys = cljs.core.rest(arglist__9048);
      return G__9045__delegate.call(this, x, ys)
    };
    return G__9045
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___9041.call(this);
      case 1:
        return str_STAR___9042.call(this, x);
      default:
        return str_STAR___9043.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___9043.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__9049 = function() {
    return""
  };
  var str__9050 = function(x) {
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
  var str__9051 = function() {
    var G__9053__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9054 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__9055 = cljs.core.next.call(null, more);
            sb = G__9054;
            more = G__9055;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__9053 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9053__delegate.call(this, x, ys)
    };
    G__9053.cljs$lang$maxFixedArity = 1;
    G__9053.cljs$lang$applyTo = function(arglist__9056) {
      var x = cljs.core.first(arglist__9056);
      var ys = cljs.core.rest(arglist__9056);
      return G__9053__delegate.call(this, x, ys)
    };
    return G__9053
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__9049.call(this);
      case 1:
        return str__9050.call(this, x);
      default:
        return str__9051.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__9051.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__9057 = function(s, start) {
    return s.substring(start)
  };
  var subs__9058 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__9057.call(this, s, start);
      case 3:
        return subs__9058.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__9060 = function(name) {
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
  var symbol__9061 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__9060.call(this, ns);
      case 2:
        return symbol__9061.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__9063 = function(name) {
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
  var keyword__9064 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__9063.call(this, ns);
      case 2:
        return keyword__9064.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__9066 = cljs.core.seq.call(null, x);
    var ys__9067 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__9066 === null)) {
        return ys__9067 === null
      }else {
        if(cljs.core.truth_(ys__9067 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__9066), cljs.core.first.call(null, ys__9067)))) {
            var G__9068 = cljs.core.next.call(null, xs__9066);
            var G__9069 = cljs.core.next.call(null, ys__9067);
            xs__9066 = G__9068;
            ys__9067 = G__9069;
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
  return cljs.core.reduce.call(null, function(p1__9070_SHARP_, p2__9071_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__9070_SHARP_, cljs.core.hash.call(null, p2__9071_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__9072__9073 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__9072__9073)) {
    var G__9075__9077 = cljs.core.first.call(null, G__9072__9073);
    var vec__9076__9078 = G__9075__9077;
    var key_name__9079 = cljs.core.nth.call(null, vec__9076__9078, 0, null);
    var f__9080 = cljs.core.nth.call(null, vec__9076__9078, 1, null);
    var G__9072__9081 = G__9072__9073;
    var G__9075__9082 = G__9075__9077;
    var G__9072__9083 = G__9072__9081;
    while(true) {
      var vec__9084__9085 = G__9075__9082;
      var key_name__9086 = cljs.core.nth.call(null, vec__9084__9085, 0, null);
      var f__9087 = cljs.core.nth.call(null, vec__9084__9085, 1, null);
      var G__9072__9088 = G__9072__9083;
      var str_name__9089 = cljs.core.name.call(null, key_name__9086);
      obj[str_name__9089] = f__9087;
      var temp__3698__auto____9090 = cljs.core.next.call(null, G__9072__9088);
      if(cljs.core.truth_(temp__3698__auto____9090)) {
        var G__9072__9091 = temp__3698__auto____9090;
        var G__9092 = cljs.core.first.call(null, G__9072__9091);
        var G__9093 = G__9072__9091;
        G__9075__9082 = G__9092;
        G__9072__9083 = G__9093;
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
  var this__9094 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__9095 = this;
  return new cljs.core.List(this__9095.meta, o, coll, this__9095.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__9096 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__9097 = this;
  return this__9097.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__9098 = this;
  return this__9098.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__9099 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__9100 = this;
  return this__9100.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__9101 = this;
  return this__9101.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9102 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9103 = this;
  return new cljs.core.List(meta, this__9103.first, this__9103.rest, this__9103.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9104 = this;
  return this__9104.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9105 = this;
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
  var this__9106 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__9107 = this;
  return new cljs.core.List(this__9107.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__9108 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__9109 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__9110 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__9111 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__9112 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__9113 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9114 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9115 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9116 = this;
  return this__9116.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9117 = this;
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
  list.cljs$lang$applyTo = function(arglist__9118) {
    var items = cljs.core.seq(arglist__9118);
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
  var this__9119 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__9120 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9121 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9122 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9122.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__9123 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__9124 = this;
  return this__9124.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__9125 = this;
  if(cljs.core.truth_(this__9125.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__9125.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9126 = this;
  return this__9126.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9127 = this;
  return new cljs.core.Cons(meta, this__9127.first, this__9127.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__9128 = null;
  var G__9128__9129 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__9128__9130 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__9128 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9128__9129.call(this, string, f);
      case 3:
        return G__9128__9130.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9128
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__9132 = null;
  var G__9132__9133 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__9132__9134 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__9132 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9132__9133.call(this, string, k);
      case 3:
        return G__9132__9134.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9132
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__9136 = null;
  var G__9136__9137 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__9136__9138 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__9136 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9136__9137.call(this, string, n);
      case 3:
        return G__9136__9138.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9136
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
  var G__9146 = null;
  var G__9146__9147 = function(tsym9140, coll) {
    var tsym9140__9142 = this;
    var this$__9143 = tsym9140__9142;
    return cljs.core.get.call(null, coll, this$__9143.toString())
  };
  var G__9146__9148 = function(tsym9141, coll, not_found) {
    var tsym9141__9144 = this;
    var this$__9145 = tsym9141__9144;
    return cljs.core.get.call(null, coll, this$__9145.toString(), not_found)
  };
  G__9146 = function(tsym9141, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9146__9147.call(this, tsym9141, coll);
      case 3:
        return G__9146__9148.call(this, tsym9141, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9146
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__9150 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__9150
  }else {
    lazy_seq.x = x__9150.call(null);
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
  var this__9151 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__9152 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9153 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9154 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9154.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__9155 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__9156 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__9157 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9158 = this;
  return this__9158.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9159 = this;
  return new cljs.core.LazySeq(meta, this__9159.realized, this__9159.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__9160 = [];
  var s__9161 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__9161))) {
      ary__9160.push(cljs.core.first.call(null, s__9161));
      var G__9162 = cljs.core.next.call(null, s__9161);
      s__9161 = G__9162;
      continue
    }else {
      return ary__9160
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__9163 = s;
  var i__9164 = n;
  var sum__9165 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9166 = i__9164 > 0;
      if(cljs.core.truth_(and__3546__auto____9166)) {
        return cljs.core.seq.call(null, s__9163)
      }else {
        return and__3546__auto____9166
      }
    }())) {
      var G__9167 = cljs.core.next.call(null, s__9163);
      var G__9168 = i__9164 - 1;
      var G__9169 = sum__9165 + 1;
      s__9163 = G__9167;
      i__9164 = G__9168;
      sum__9165 = G__9169;
      continue
    }else {
      return sum__9165
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
  var concat__9173 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__9174 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__9175 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__9170 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__9170)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9170), concat.call(null, cljs.core.rest.call(null, s__9170), y))
      }else {
        return y
      }
    })
  };
  var concat__9176 = function() {
    var G__9178__delegate = function(x, y, zs) {
      var cat__9172 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__9171 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__9171)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__9171), cat.call(null, cljs.core.rest.call(null, xys__9171), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__9172.call(null, concat.call(null, x, y), zs)
    };
    var G__9178 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9178__delegate.call(this, x, y, zs)
    };
    G__9178.cljs$lang$maxFixedArity = 2;
    G__9178.cljs$lang$applyTo = function(arglist__9179) {
      var x = cljs.core.first(arglist__9179);
      var y = cljs.core.first(cljs.core.next(arglist__9179));
      var zs = cljs.core.rest(cljs.core.next(arglist__9179));
      return G__9178__delegate.call(this, x, y, zs)
    };
    return G__9178
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__9173.call(this);
      case 1:
        return concat__9174.call(this, x);
      case 2:
        return concat__9175.call(this, x, y);
      default:
        return concat__9176.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__9176.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___9180 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___9181 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___9182 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___9183 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___9184 = function() {
    var G__9186__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__9186 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9186__delegate.call(this, a, b, c, d, more)
    };
    G__9186.cljs$lang$maxFixedArity = 4;
    G__9186.cljs$lang$applyTo = function(arglist__9187) {
      var a = cljs.core.first(arglist__9187);
      var b = cljs.core.first(cljs.core.next(arglist__9187));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9187)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9187))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9187))));
      return G__9186__delegate.call(this, a, b, c, d, more)
    };
    return G__9186
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___9180.call(this, a);
      case 2:
        return list_STAR___9181.call(this, a, b);
      case 3:
        return list_STAR___9182.call(this, a, b, c);
      case 4:
        return list_STAR___9183.call(this, a, b, c, d);
      default:
        return list_STAR___9184.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___9184.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__9197 = function(f, args) {
    var fixed_arity__9188 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__9188 + 1) <= fixed_arity__9188)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__9198 = function(f, x, args) {
    var arglist__9189 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__9190 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__9189, fixed_arity__9190) <= fixed_arity__9190)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__9189))
      }else {
        return f.cljs$lang$applyTo(arglist__9189)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9189))
    }
  };
  var apply__9199 = function(f, x, y, args) {
    var arglist__9191 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__9192 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__9191, fixed_arity__9192) <= fixed_arity__9192)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__9191))
      }else {
        return f.cljs$lang$applyTo(arglist__9191)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9191))
    }
  };
  var apply__9200 = function(f, x, y, z, args) {
    var arglist__9193 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__9194 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__9193, fixed_arity__9194) <= fixed_arity__9194)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__9193))
      }else {
        return f.cljs$lang$applyTo(arglist__9193)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9193))
    }
  };
  var apply__9201 = function() {
    var G__9203__delegate = function(f, a, b, c, d, args) {
      var arglist__9195 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__9196 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__9195, fixed_arity__9196) <= fixed_arity__9196)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__9195))
        }else {
          return f.cljs$lang$applyTo(arglist__9195)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__9195))
      }
    };
    var G__9203 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9203__delegate.call(this, f, a, b, c, d, args)
    };
    G__9203.cljs$lang$maxFixedArity = 5;
    G__9203.cljs$lang$applyTo = function(arglist__9204) {
      var f = cljs.core.first(arglist__9204);
      var a = cljs.core.first(cljs.core.next(arglist__9204));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9204)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9204))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9204)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9204)))));
      return G__9203__delegate.call(this, f, a, b, c, d, args)
    };
    return G__9203
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__9197.call(this, f, a);
      case 3:
        return apply__9198.call(this, f, a, b);
      case 4:
        return apply__9199.call(this, f, a, b, c);
      case 5:
        return apply__9200.call(this, f, a, b, c, d);
      default:
        return apply__9201.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__9201.cljs$lang$applyTo;
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
  vary_meta.cljs$lang$applyTo = function(arglist__9205) {
    var obj = cljs.core.first(arglist__9205);
    var f = cljs.core.first(cljs.core.next(arglist__9205));
    var args = cljs.core.rest(cljs.core.next(arglist__9205));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___9206 = function(x) {
    return false
  };
  var not_EQ___9207 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___9208 = function() {
    var G__9210__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__9210 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9210__delegate.call(this, x, y, more)
    };
    G__9210.cljs$lang$maxFixedArity = 2;
    G__9210.cljs$lang$applyTo = function(arglist__9211) {
      var x = cljs.core.first(arglist__9211);
      var y = cljs.core.first(cljs.core.next(arglist__9211));
      var more = cljs.core.rest(cljs.core.next(arglist__9211));
      return G__9210__delegate.call(this, x, y, more)
    };
    return G__9210
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___9206.call(this, x);
      case 2:
        return not_EQ___9207.call(this, x, y);
      default:
        return not_EQ___9208.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___9208.cljs$lang$applyTo;
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
        var G__9212 = pred;
        var G__9213 = cljs.core.next.call(null, coll);
        pred = G__9212;
        coll = G__9213;
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
      var or__3548__auto____9214 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____9214)) {
        return or__3548__auto____9214
      }else {
        var G__9215 = pred;
        var G__9216 = cljs.core.next.call(null, coll);
        pred = G__9215;
        coll = G__9216;
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
    var G__9217 = null;
    var G__9217__9218 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__9217__9219 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__9217__9220 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__9217__9221 = function() {
      var G__9223__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__9223 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__9223__delegate.call(this, x, y, zs)
      };
      G__9223.cljs$lang$maxFixedArity = 2;
      G__9223.cljs$lang$applyTo = function(arglist__9224) {
        var x = cljs.core.first(arglist__9224);
        var y = cljs.core.first(cljs.core.next(arglist__9224));
        var zs = cljs.core.rest(cljs.core.next(arglist__9224));
        return G__9223__delegate.call(this, x, y, zs)
      };
      return G__9223
    }();
    G__9217 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__9217__9218.call(this);
        case 1:
          return G__9217__9219.call(this, x);
        case 2:
          return G__9217__9220.call(this, x, y);
        default:
          return G__9217__9221.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__9217.cljs$lang$maxFixedArity = 2;
    G__9217.cljs$lang$applyTo = G__9217__9221.cljs$lang$applyTo;
    return G__9217
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__9225__delegate = function(args) {
      return x
    };
    var G__9225 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9225__delegate.call(this, args)
    };
    G__9225.cljs$lang$maxFixedArity = 0;
    G__9225.cljs$lang$applyTo = function(arglist__9226) {
      var args = cljs.core.seq(arglist__9226);
      return G__9225__delegate.call(this, args)
    };
    return G__9225
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__9230 = function() {
    return cljs.core.identity
  };
  var comp__9231 = function(f) {
    return f
  };
  var comp__9232 = function(f, g) {
    return function() {
      var G__9236 = null;
      var G__9236__9237 = function() {
        return f.call(null, g.call(null))
      };
      var G__9236__9238 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__9236__9239 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__9236__9240 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__9236__9241 = function() {
        var G__9243__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9243 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9243__delegate.call(this, x, y, z, args)
        };
        G__9243.cljs$lang$maxFixedArity = 3;
        G__9243.cljs$lang$applyTo = function(arglist__9244) {
          var x = cljs.core.first(arglist__9244);
          var y = cljs.core.first(cljs.core.next(arglist__9244));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9244)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9244)));
          return G__9243__delegate.call(this, x, y, z, args)
        };
        return G__9243
      }();
      G__9236 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9236__9237.call(this);
          case 1:
            return G__9236__9238.call(this, x);
          case 2:
            return G__9236__9239.call(this, x, y);
          case 3:
            return G__9236__9240.call(this, x, y, z);
          default:
            return G__9236__9241.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9236.cljs$lang$maxFixedArity = 3;
      G__9236.cljs$lang$applyTo = G__9236__9241.cljs$lang$applyTo;
      return G__9236
    }()
  };
  var comp__9233 = function(f, g, h) {
    return function() {
      var G__9245 = null;
      var G__9245__9246 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__9245__9247 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__9245__9248 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__9245__9249 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__9245__9250 = function() {
        var G__9252__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__9252 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9252__delegate.call(this, x, y, z, args)
        };
        G__9252.cljs$lang$maxFixedArity = 3;
        G__9252.cljs$lang$applyTo = function(arglist__9253) {
          var x = cljs.core.first(arglist__9253);
          var y = cljs.core.first(cljs.core.next(arglist__9253));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9253)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9253)));
          return G__9252__delegate.call(this, x, y, z, args)
        };
        return G__9252
      }();
      G__9245 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9245__9246.call(this);
          case 1:
            return G__9245__9247.call(this, x);
          case 2:
            return G__9245__9248.call(this, x, y);
          case 3:
            return G__9245__9249.call(this, x, y, z);
          default:
            return G__9245__9250.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9245.cljs$lang$maxFixedArity = 3;
      G__9245.cljs$lang$applyTo = G__9245__9250.cljs$lang$applyTo;
      return G__9245
    }()
  };
  var comp__9234 = function() {
    var G__9254__delegate = function(f1, f2, f3, fs) {
      var fs__9227 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__9255__delegate = function(args) {
          var ret__9228 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__9227), args);
          var fs__9229 = cljs.core.next.call(null, fs__9227);
          while(true) {
            if(cljs.core.truth_(fs__9229)) {
              var G__9256 = cljs.core.first.call(null, fs__9229).call(null, ret__9228);
              var G__9257 = cljs.core.next.call(null, fs__9229);
              ret__9228 = G__9256;
              fs__9229 = G__9257;
              continue
            }else {
              return ret__9228
            }
            break
          }
        };
        var G__9255 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9255__delegate.call(this, args)
        };
        G__9255.cljs$lang$maxFixedArity = 0;
        G__9255.cljs$lang$applyTo = function(arglist__9258) {
          var args = cljs.core.seq(arglist__9258);
          return G__9255__delegate.call(this, args)
        };
        return G__9255
      }()
    };
    var G__9254 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9254__delegate.call(this, f1, f2, f3, fs)
    };
    G__9254.cljs$lang$maxFixedArity = 3;
    G__9254.cljs$lang$applyTo = function(arglist__9259) {
      var f1 = cljs.core.first(arglist__9259);
      var f2 = cljs.core.first(cljs.core.next(arglist__9259));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9259)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9259)));
      return G__9254__delegate.call(this, f1, f2, f3, fs)
    };
    return G__9254
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__9230.call(this);
      case 1:
        return comp__9231.call(this, f1);
      case 2:
        return comp__9232.call(this, f1, f2);
      case 3:
        return comp__9233.call(this, f1, f2, f3);
      default:
        return comp__9234.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__9234.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__9260 = function(f, arg1) {
    return function() {
      var G__9265__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__9265 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9265__delegate.call(this, args)
      };
      G__9265.cljs$lang$maxFixedArity = 0;
      G__9265.cljs$lang$applyTo = function(arglist__9266) {
        var args = cljs.core.seq(arglist__9266);
        return G__9265__delegate.call(this, args)
      };
      return G__9265
    }()
  };
  var partial__9261 = function(f, arg1, arg2) {
    return function() {
      var G__9267__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__9267 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9267__delegate.call(this, args)
      };
      G__9267.cljs$lang$maxFixedArity = 0;
      G__9267.cljs$lang$applyTo = function(arglist__9268) {
        var args = cljs.core.seq(arglist__9268);
        return G__9267__delegate.call(this, args)
      };
      return G__9267
    }()
  };
  var partial__9262 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__9269__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__9269 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9269__delegate.call(this, args)
      };
      G__9269.cljs$lang$maxFixedArity = 0;
      G__9269.cljs$lang$applyTo = function(arglist__9270) {
        var args = cljs.core.seq(arglist__9270);
        return G__9269__delegate.call(this, args)
      };
      return G__9269
    }()
  };
  var partial__9263 = function() {
    var G__9271__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__9272__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__9272 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9272__delegate.call(this, args)
        };
        G__9272.cljs$lang$maxFixedArity = 0;
        G__9272.cljs$lang$applyTo = function(arglist__9273) {
          var args = cljs.core.seq(arglist__9273);
          return G__9272__delegate.call(this, args)
        };
        return G__9272
      }()
    };
    var G__9271 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9271__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__9271.cljs$lang$maxFixedArity = 4;
    G__9271.cljs$lang$applyTo = function(arglist__9274) {
      var f = cljs.core.first(arglist__9274);
      var arg1 = cljs.core.first(cljs.core.next(arglist__9274));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9274)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9274))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9274))));
      return G__9271__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__9271
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__9260.call(this, f, arg1);
      case 3:
        return partial__9261.call(this, f, arg1, arg2);
      case 4:
        return partial__9262.call(this, f, arg1, arg2, arg3);
      default:
        return partial__9263.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__9263.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__9275 = function(f, x) {
    return function() {
      var G__9279 = null;
      var G__9279__9280 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__9279__9281 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__9279__9282 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__9279__9283 = function() {
        var G__9285__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__9285 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9285__delegate.call(this, a, b, c, ds)
        };
        G__9285.cljs$lang$maxFixedArity = 3;
        G__9285.cljs$lang$applyTo = function(arglist__9286) {
          var a = cljs.core.first(arglist__9286);
          var b = cljs.core.first(cljs.core.next(arglist__9286));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9286)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9286)));
          return G__9285__delegate.call(this, a, b, c, ds)
        };
        return G__9285
      }();
      G__9279 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__9279__9280.call(this, a);
          case 2:
            return G__9279__9281.call(this, a, b);
          case 3:
            return G__9279__9282.call(this, a, b, c);
          default:
            return G__9279__9283.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9279.cljs$lang$maxFixedArity = 3;
      G__9279.cljs$lang$applyTo = G__9279__9283.cljs$lang$applyTo;
      return G__9279
    }()
  };
  var fnil__9276 = function(f, x, y) {
    return function() {
      var G__9287 = null;
      var G__9287__9288 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__9287__9289 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__9287__9290 = function() {
        var G__9292__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__9292 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9292__delegate.call(this, a, b, c, ds)
        };
        G__9292.cljs$lang$maxFixedArity = 3;
        G__9292.cljs$lang$applyTo = function(arglist__9293) {
          var a = cljs.core.first(arglist__9293);
          var b = cljs.core.first(cljs.core.next(arglist__9293));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9293)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9293)));
          return G__9292__delegate.call(this, a, b, c, ds)
        };
        return G__9292
      }();
      G__9287 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9287__9288.call(this, a, b);
          case 3:
            return G__9287__9289.call(this, a, b, c);
          default:
            return G__9287__9290.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9287.cljs$lang$maxFixedArity = 3;
      G__9287.cljs$lang$applyTo = G__9287__9290.cljs$lang$applyTo;
      return G__9287
    }()
  };
  var fnil__9277 = function(f, x, y, z) {
    return function() {
      var G__9294 = null;
      var G__9294__9295 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__9294__9296 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__9294__9297 = function() {
        var G__9299__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__9299 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9299__delegate.call(this, a, b, c, ds)
        };
        G__9299.cljs$lang$maxFixedArity = 3;
        G__9299.cljs$lang$applyTo = function(arglist__9300) {
          var a = cljs.core.first(arglist__9300);
          var b = cljs.core.first(cljs.core.next(arglist__9300));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9300)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9300)));
          return G__9299__delegate.call(this, a, b, c, ds)
        };
        return G__9299
      }();
      G__9294 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9294__9295.call(this, a, b);
          case 3:
            return G__9294__9296.call(this, a, b, c);
          default:
            return G__9294__9297.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9294.cljs$lang$maxFixedArity = 3;
      G__9294.cljs$lang$applyTo = G__9294__9297.cljs$lang$applyTo;
      return G__9294
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__9275.call(this, f, x);
      case 3:
        return fnil__9276.call(this, f, x, y);
      case 4:
        return fnil__9277.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__9303 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____9301 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9301)) {
        var s__9302 = temp__3698__auto____9301;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__9302)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__9302)))
      }else {
        return null
      }
    })
  };
  return mapi__9303.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____9304 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____9304)) {
      var s__9305 = temp__3698__auto____9304;
      var x__9306 = f.call(null, cljs.core.first.call(null, s__9305));
      if(cljs.core.truth_(x__9306 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__9305))
      }else {
        return cljs.core.cons.call(null, x__9306, keep.call(null, f, cljs.core.rest.call(null, s__9305)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__9316 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____9313 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9313)) {
        var s__9314 = temp__3698__auto____9313;
        var x__9315 = f.call(null, idx, cljs.core.first.call(null, s__9314));
        if(cljs.core.truth_(x__9315 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__9314))
        }else {
          return cljs.core.cons.call(null, x__9315, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__9314)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__9316.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__9361 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__9366 = function() {
        return true
      };
      var ep1__9367 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__9368 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9323 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9323)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____9323
          }
        }())
      };
      var ep1__9369 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9324 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9324)) {
            var and__3546__auto____9325 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____9325)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____9325
            }
          }else {
            return and__3546__auto____9324
          }
        }())
      };
      var ep1__9370 = function() {
        var G__9372__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____9326 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____9326)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____9326
            }
          }())
        };
        var G__9372 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9372__delegate.call(this, x, y, z, args)
        };
        G__9372.cljs$lang$maxFixedArity = 3;
        G__9372.cljs$lang$applyTo = function(arglist__9373) {
          var x = cljs.core.first(arglist__9373);
          var y = cljs.core.first(cljs.core.next(arglist__9373));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9373)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9373)));
          return G__9372__delegate.call(this, x, y, z, args)
        };
        return G__9372
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__9366.call(this);
          case 1:
            return ep1__9367.call(this, x);
          case 2:
            return ep1__9368.call(this, x, y);
          case 3:
            return ep1__9369.call(this, x, y, z);
          default:
            return ep1__9370.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__9370.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__9362 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__9374 = function() {
        return true
      };
      var ep2__9375 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9327 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9327)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____9327
          }
        }())
      };
      var ep2__9376 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9328 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9328)) {
            var and__3546__auto____9329 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____9329)) {
              var and__3546__auto____9330 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____9330)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____9330
              }
            }else {
              return and__3546__auto____9329
            }
          }else {
            return and__3546__auto____9328
          }
        }())
      };
      var ep2__9377 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9331 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9331)) {
            var and__3546__auto____9332 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____9332)) {
              var and__3546__auto____9333 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____9333)) {
                var and__3546__auto____9334 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____9334)) {
                  var and__3546__auto____9335 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____9335)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____9335
                  }
                }else {
                  return and__3546__auto____9334
                }
              }else {
                return and__3546__auto____9333
              }
            }else {
              return and__3546__auto____9332
            }
          }else {
            return and__3546__auto____9331
          }
        }())
      };
      var ep2__9378 = function() {
        var G__9380__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____9336 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____9336)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9307_SHARP_) {
                var and__3546__auto____9337 = p1.call(null, p1__9307_SHARP_);
                if(cljs.core.truth_(and__3546__auto____9337)) {
                  return p2.call(null, p1__9307_SHARP_)
                }else {
                  return and__3546__auto____9337
                }
              }, args)
            }else {
              return and__3546__auto____9336
            }
          }())
        };
        var G__9380 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9380__delegate.call(this, x, y, z, args)
        };
        G__9380.cljs$lang$maxFixedArity = 3;
        G__9380.cljs$lang$applyTo = function(arglist__9381) {
          var x = cljs.core.first(arglist__9381);
          var y = cljs.core.first(cljs.core.next(arglist__9381));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9381)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9381)));
          return G__9380__delegate.call(this, x, y, z, args)
        };
        return G__9380
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__9374.call(this);
          case 1:
            return ep2__9375.call(this, x);
          case 2:
            return ep2__9376.call(this, x, y);
          case 3:
            return ep2__9377.call(this, x, y, z);
          default:
            return ep2__9378.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__9378.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__9363 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__9382 = function() {
        return true
      };
      var ep3__9383 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9338 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9338)) {
            var and__3546__auto____9339 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____9339)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____9339
            }
          }else {
            return and__3546__auto____9338
          }
        }())
      };
      var ep3__9384 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9340 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9340)) {
            var and__3546__auto____9341 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____9341)) {
              var and__3546__auto____9342 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____9342)) {
                var and__3546__auto____9343 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____9343)) {
                  var and__3546__auto____9344 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____9344)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____9344
                  }
                }else {
                  return and__3546__auto____9343
                }
              }else {
                return and__3546__auto____9342
              }
            }else {
              return and__3546__auto____9341
            }
          }else {
            return and__3546__auto____9340
          }
        }())
      };
      var ep3__9385 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9345 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9345)) {
            var and__3546__auto____9346 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____9346)) {
              var and__3546__auto____9347 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____9347)) {
                var and__3546__auto____9348 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____9348)) {
                  var and__3546__auto____9349 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____9349)) {
                    var and__3546__auto____9350 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____9350)) {
                      var and__3546__auto____9351 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____9351)) {
                        var and__3546__auto____9352 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____9352)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____9352
                        }
                      }else {
                        return and__3546__auto____9351
                      }
                    }else {
                      return and__3546__auto____9350
                    }
                  }else {
                    return and__3546__auto____9349
                  }
                }else {
                  return and__3546__auto____9348
                }
              }else {
                return and__3546__auto____9347
              }
            }else {
              return and__3546__auto____9346
            }
          }else {
            return and__3546__auto____9345
          }
        }())
      };
      var ep3__9386 = function() {
        var G__9388__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____9353 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____9353)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9308_SHARP_) {
                var and__3546__auto____9354 = p1.call(null, p1__9308_SHARP_);
                if(cljs.core.truth_(and__3546__auto____9354)) {
                  var and__3546__auto____9355 = p2.call(null, p1__9308_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____9355)) {
                    return p3.call(null, p1__9308_SHARP_)
                  }else {
                    return and__3546__auto____9355
                  }
                }else {
                  return and__3546__auto____9354
                }
              }, args)
            }else {
              return and__3546__auto____9353
            }
          }())
        };
        var G__9388 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9388__delegate.call(this, x, y, z, args)
        };
        G__9388.cljs$lang$maxFixedArity = 3;
        G__9388.cljs$lang$applyTo = function(arglist__9389) {
          var x = cljs.core.first(arglist__9389);
          var y = cljs.core.first(cljs.core.next(arglist__9389));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9389)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9389)));
          return G__9388__delegate.call(this, x, y, z, args)
        };
        return G__9388
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__9382.call(this);
          case 1:
            return ep3__9383.call(this, x);
          case 2:
            return ep3__9384.call(this, x, y);
          case 3:
            return ep3__9385.call(this, x, y, z);
          default:
            return ep3__9386.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__9386.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__9364 = function() {
    var G__9390__delegate = function(p1, p2, p3, ps) {
      var ps__9356 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__9391 = function() {
          return true
        };
        var epn__9392 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__9309_SHARP_) {
            return p1__9309_SHARP_.call(null, x)
          }, ps__9356)
        };
        var epn__9393 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__9310_SHARP_) {
            var and__3546__auto____9357 = p1__9310_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____9357)) {
              return p1__9310_SHARP_.call(null, y)
            }else {
              return and__3546__auto____9357
            }
          }, ps__9356)
        };
        var epn__9394 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__9311_SHARP_) {
            var and__3546__auto____9358 = p1__9311_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____9358)) {
              var and__3546__auto____9359 = p1__9311_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____9359)) {
                return p1__9311_SHARP_.call(null, z)
              }else {
                return and__3546__auto____9359
              }
            }else {
              return and__3546__auto____9358
            }
          }, ps__9356)
        };
        var epn__9395 = function() {
          var G__9397__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____9360 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____9360)) {
                return cljs.core.every_QMARK_.call(null, function(p1__9312_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__9312_SHARP_, args)
                }, ps__9356)
              }else {
                return and__3546__auto____9360
              }
            }())
          };
          var G__9397 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9397__delegate.call(this, x, y, z, args)
          };
          G__9397.cljs$lang$maxFixedArity = 3;
          G__9397.cljs$lang$applyTo = function(arglist__9398) {
            var x = cljs.core.first(arglist__9398);
            var y = cljs.core.first(cljs.core.next(arglist__9398));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9398)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9398)));
            return G__9397__delegate.call(this, x, y, z, args)
          };
          return G__9397
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__9391.call(this);
            case 1:
              return epn__9392.call(this, x);
            case 2:
              return epn__9393.call(this, x, y);
            case 3:
              return epn__9394.call(this, x, y, z);
            default:
              return epn__9395.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__9395.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__9390 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9390__delegate.call(this, p1, p2, p3, ps)
    };
    G__9390.cljs$lang$maxFixedArity = 3;
    G__9390.cljs$lang$applyTo = function(arglist__9399) {
      var p1 = cljs.core.first(arglist__9399);
      var p2 = cljs.core.first(cljs.core.next(arglist__9399));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9399)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9399)));
      return G__9390__delegate.call(this, p1, p2, p3, ps)
    };
    return G__9390
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__9361.call(this, p1);
      case 2:
        return every_pred__9362.call(this, p1, p2);
      case 3:
        return every_pred__9363.call(this, p1, p2, p3);
      default:
        return every_pred__9364.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__9364.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__9439 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__9444 = function() {
        return null
      };
      var sp1__9445 = function(x) {
        return p.call(null, x)
      };
      var sp1__9446 = function(x, y) {
        var or__3548__auto____9401 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9401)) {
          return or__3548__auto____9401
        }else {
          return p.call(null, y)
        }
      };
      var sp1__9447 = function(x, y, z) {
        var or__3548__auto____9402 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9402)) {
          return or__3548__auto____9402
        }else {
          var or__3548__auto____9403 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____9403)) {
            return or__3548__auto____9403
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__9448 = function() {
        var G__9450__delegate = function(x, y, z, args) {
          var or__3548__auto____9404 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____9404)) {
            return or__3548__auto____9404
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__9450 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9450__delegate.call(this, x, y, z, args)
        };
        G__9450.cljs$lang$maxFixedArity = 3;
        G__9450.cljs$lang$applyTo = function(arglist__9451) {
          var x = cljs.core.first(arglist__9451);
          var y = cljs.core.first(cljs.core.next(arglist__9451));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9451)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9451)));
          return G__9450__delegate.call(this, x, y, z, args)
        };
        return G__9450
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__9444.call(this);
          case 1:
            return sp1__9445.call(this, x);
          case 2:
            return sp1__9446.call(this, x, y);
          case 3:
            return sp1__9447.call(this, x, y, z);
          default:
            return sp1__9448.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__9448.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__9440 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__9452 = function() {
        return null
      };
      var sp2__9453 = function(x) {
        var or__3548__auto____9405 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9405)) {
          return or__3548__auto____9405
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__9454 = function(x, y) {
        var or__3548__auto____9406 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9406)) {
          return or__3548__auto____9406
        }else {
          var or__3548__auto____9407 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____9407)) {
            return or__3548__auto____9407
          }else {
            var or__3548__auto____9408 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____9408)) {
              return or__3548__auto____9408
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__9455 = function(x, y, z) {
        var or__3548__auto____9409 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9409)) {
          return or__3548__auto____9409
        }else {
          var or__3548__auto____9410 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____9410)) {
            return or__3548__auto____9410
          }else {
            var or__3548__auto____9411 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____9411)) {
              return or__3548__auto____9411
            }else {
              var or__3548__auto____9412 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____9412)) {
                return or__3548__auto____9412
              }else {
                var or__3548__auto____9413 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____9413)) {
                  return or__3548__auto____9413
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__9456 = function() {
        var G__9458__delegate = function(x, y, z, args) {
          var or__3548__auto____9414 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____9414)) {
            return or__3548__auto____9414
          }else {
            return cljs.core.some.call(null, function(p1__9317_SHARP_) {
              var or__3548__auto____9415 = p1.call(null, p1__9317_SHARP_);
              if(cljs.core.truth_(or__3548__auto____9415)) {
                return or__3548__auto____9415
              }else {
                return p2.call(null, p1__9317_SHARP_)
              }
            }, args)
          }
        };
        var G__9458 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9458__delegate.call(this, x, y, z, args)
        };
        G__9458.cljs$lang$maxFixedArity = 3;
        G__9458.cljs$lang$applyTo = function(arglist__9459) {
          var x = cljs.core.first(arglist__9459);
          var y = cljs.core.first(cljs.core.next(arglist__9459));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9459)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9459)));
          return G__9458__delegate.call(this, x, y, z, args)
        };
        return G__9458
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__9452.call(this);
          case 1:
            return sp2__9453.call(this, x);
          case 2:
            return sp2__9454.call(this, x, y);
          case 3:
            return sp2__9455.call(this, x, y, z);
          default:
            return sp2__9456.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__9456.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__9441 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__9460 = function() {
        return null
      };
      var sp3__9461 = function(x) {
        var or__3548__auto____9416 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9416)) {
          return or__3548__auto____9416
        }else {
          var or__3548__auto____9417 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____9417)) {
            return or__3548__auto____9417
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__9462 = function(x, y) {
        var or__3548__auto____9418 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9418)) {
          return or__3548__auto____9418
        }else {
          var or__3548__auto____9419 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____9419)) {
            return or__3548__auto____9419
          }else {
            var or__3548__auto____9420 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____9420)) {
              return or__3548__auto____9420
            }else {
              var or__3548__auto____9421 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____9421)) {
                return or__3548__auto____9421
              }else {
                var or__3548__auto____9422 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____9422)) {
                  return or__3548__auto____9422
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__9463 = function(x, y, z) {
        var or__3548__auto____9423 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9423)) {
          return or__3548__auto____9423
        }else {
          var or__3548__auto____9424 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____9424)) {
            return or__3548__auto____9424
          }else {
            var or__3548__auto____9425 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____9425)) {
              return or__3548__auto____9425
            }else {
              var or__3548__auto____9426 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____9426)) {
                return or__3548__auto____9426
              }else {
                var or__3548__auto____9427 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____9427)) {
                  return or__3548__auto____9427
                }else {
                  var or__3548__auto____9428 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____9428)) {
                    return or__3548__auto____9428
                  }else {
                    var or__3548__auto____9429 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____9429)) {
                      return or__3548__auto____9429
                    }else {
                      var or__3548__auto____9430 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____9430)) {
                        return or__3548__auto____9430
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
      var sp3__9464 = function() {
        var G__9466__delegate = function(x, y, z, args) {
          var or__3548__auto____9431 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____9431)) {
            return or__3548__auto____9431
          }else {
            return cljs.core.some.call(null, function(p1__9318_SHARP_) {
              var or__3548__auto____9432 = p1.call(null, p1__9318_SHARP_);
              if(cljs.core.truth_(or__3548__auto____9432)) {
                return or__3548__auto____9432
              }else {
                var or__3548__auto____9433 = p2.call(null, p1__9318_SHARP_);
                if(cljs.core.truth_(or__3548__auto____9433)) {
                  return or__3548__auto____9433
                }else {
                  return p3.call(null, p1__9318_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__9466 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9466__delegate.call(this, x, y, z, args)
        };
        G__9466.cljs$lang$maxFixedArity = 3;
        G__9466.cljs$lang$applyTo = function(arglist__9467) {
          var x = cljs.core.first(arglist__9467);
          var y = cljs.core.first(cljs.core.next(arglist__9467));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9467)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9467)));
          return G__9466__delegate.call(this, x, y, z, args)
        };
        return G__9466
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__9460.call(this);
          case 1:
            return sp3__9461.call(this, x);
          case 2:
            return sp3__9462.call(this, x, y);
          case 3:
            return sp3__9463.call(this, x, y, z);
          default:
            return sp3__9464.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__9464.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__9442 = function() {
    var G__9468__delegate = function(p1, p2, p3, ps) {
      var ps__9434 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__9469 = function() {
          return null
        };
        var spn__9470 = function(x) {
          return cljs.core.some.call(null, function(p1__9319_SHARP_) {
            return p1__9319_SHARP_.call(null, x)
          }, ps__9434)
        };
        var spn__9471 = function(x, y) {
          return cljs.core.some.call(null, function(p1__9320_SHARP_) {
            var or__3548__auto____9435 = p1__9320_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____9435)) {
              return or__3548__auto____9435
            }else {
              return p1__9320_SHARP_.call(null, y)
            }
          }, ps__9434)
        };
        var spn__9472 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__9321_SHARP_) {
            var or__3548__auto____9436 = p1__9321_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____9436)) {
              return or__3548__auto____9436
            }else {
              var or__3548__auto____9437 = p1__9321_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____9437)) {
                return or__3548__auto____9437
              }else {
                return p1__9321_SHARP_.call(null, z)
              }
            }
          }, ps__9434)
        };
        var spn__9473 = function() {
          var G__9475__delegate = function(x, y, z, args) {
            var or__3548__auto____9438 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____9438)) {
              return or__3548__auto____9438
            }else {
              return cljs.core.some.call(null, function(p1__9322_SHARP_) {
                return cljs.core.some.call(null, p1__9322_SHARP_, args)
              }, ps__9434)
            }
          };
          var G__9475 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9475__delegate.call(this, x, y, z, args)
          };
          G__9475.cljs$lang$maxFixedArity = 3;
          G__9475.cljs$lang$applyTo = function(arglist__9476) {
            var x = cljs.core.first(arglist__9476);
            var y = cljs.core.first(cljs.core.next(arglist__9476));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9476)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9476)));
            return G__9475__delegate.call(this, x, y, z, args)
          };
          return G__9475
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__9469.call(this);
            case 1:
              return spn__9470.call(this, x);
            case 2:
              return spn__9471.call(this, x, y);
            case 3:
              return spn__9472.call(this, x, y, z);
            default:
              return spn__9473.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__9473.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__9468 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9468__delegate.call(this, p1, p2, p3, ps)
    };
    G__9468.cljs$lang$maxFixedArity = 3;
    G__9468.cljs$lang$applyTo = function(arglist__9477) {
      var p1 = cljs.core.first(arglist__9477);
      var p2 = cljs.core.first(cljs.core.next(arglist__9477));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9477)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9477)));
      return G__9468__delegate.call(this, p1, p2, p3, ps)
    };
    return G__9468
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__9439.call(this, p1);
      case 2:
        return some_fn__9440.call(this, p1, p2);
      case 3:
        return some_fn__9441.call(this, p1, p2, p3);
      default:
        return some_fn__9442.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__9442.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__9490 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____9478 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9478)) {
        var s__9479 = temp__3698__auto____9478;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__9479)), map.call(null, f, cljs.core.rest.call(null, s__9479)))
      }else {
        return null
      }
    })
  };
  var map__9491 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9480 = cljs.core.seq.call(null, c1);
      var s2__9481 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____9482 = s1__9480;
        if(cljs.core.truth_(and__3546__auto____9482)) {
          return s2__9481
        }else {
          return and__3546__auto____9482
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9480), cljs.core.first.call(null, s2__9481)), map.call(null, f, cljs.core.rest.call(null, s1__9480), cljs.core.rest.call(null, s2__9481)))
      }else {
        return null
      }
    })
  };
  var map__9492 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9483 = cljs.core.seq.call(null, c1);
      var s2__9484 = cljs.core.seq.call(null, c2);
      var s3__9485 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____9486 = s1__9483;
        if(cljs.core.truth_(and__3546__auto____9486)) {
          var and__3546__auto____9487 = s2__9484;
          if(cljs.core.truth_(and__3546__auto____9487)) {
            return s3__9485
          }else {
            return and__3546__auto____9487
          }
        }else {
          return and__3546__auto____9486
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9483), cljs.core.first.call(null, s2__9484), cljs.core.first.call(null, s3__9485)), map.call(null, f, cljs.core.rest.call(null, s1__9483), cljs.core.rest.call(null, s2__9484), cljs.core.rest.call(null, s3__9485)))
      }else {
        return null
      }
    })
  };
  var map__9493 = function() {
    var G__9495__delegate = function(f, c1, c2, c3, colls) {
      var step__9489 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__9488 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9488))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__9488), step.call(null, map.call(null, cljs.core.rest, ss__9488)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__9400_SHARP_) {
        return cljs.core.apply.call(null, f, p1__9400_SHARP_)
      }, step__9489.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__9495 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9495__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9495.cljs$lang$maxFixedArity = 4;
    G__9495.cljs$lang$applyTo = function(arglist__9496) {
      var f = cljs.core.first(arglist__9496);
      var c1 = cljs.core.first(cljs.core.next(arglist__9496));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9496)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9496))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9496))));
      return G__9495__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__9495
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__9490.call(this, f, c1);
      case 3:
        return map__9491.call(this, f, c1, c2);
      case 4:
        return map__9492.call(this, f, c1, c2, c3);
      default:
        return map__9493.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__9493.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____9497 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9497)) {
        var s__9498 = temp__3698__auto____9497;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9498), take.call(null, n - 1, cljs.core.rest.call(null, s__9498)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__9501 = function(n, coll) {
    while(true) {
      var s__9499 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____9500 = n > 0;
        if(cljs.core.truth_(and__3546__auto____9500)) {
          return s__9499
        }else {
          return and__3546__auto____9500
        }
      }())) {
        var G__9502 = n - 1;
        var G__9503 = cljs.core.rest.call(null, s__9499);
        n = G__9502;
        coll = G__9503;
        continue
      }else {
        return s__9499
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9501.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__9504 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__9505 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__9504.call(this, n);
      case 2:
        return drop_last__9505.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__9507 = cljs.core.seq.call(null, coll);
  var lead__9508 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__9508)) {
      var G__9509 = cljs.core.next.call(null, s__9507);
      var G__9510 = cljs.core.next.call(null, lead__9508);
      s__9507 = G__9509;
      lead__9508 = G__9510;
      continue
    }else {
      return s__9507
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__9513 = function(pred, coll) {
    while(true) {
      var s__9511 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____9512 = s__9511;
        if(cljs.core.truth_(and__3546__auto____9512)) {
          return pred.call(null, cljs.core.first.call(null, s__9511))
        }else {
          return and__3546__auto____9512
        }
      }())) {
        var G__9514 = pred;
        var G__9515 = cljs.core.rest.call(null, s__9511);
        pred = G__9514;
        coll = G__9515;
        continue
      }else {
        return s__9511
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9513.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____9516 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____9516)) {
      var s__9517 = temp__3698__auto____9516;
      return cljs.core.concat.call(null, s__9517, cycle.call(null, s__9517))
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
  var repeat__9518 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__9519 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__9518.call(this, n);
      case 2:
        return repeat__9519.call(this, n, x)
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
  var repeatedly__9521 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__9522 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__9521.call(this, n);
      case 2:
        return repeatedly__9522.call(this, n, f)
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
  var interleave__9528 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9524 = cljs.core.seq.call(null, c1);
      var s2__9525 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____9526 = s1__9524;
        if(cljs.core.truth_(and__3546__auto____9526)) {
          return s2__9525
        }else {
          return and__3546__auto____9526
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__9524), cljs.core.cons.call(null, cljs.core.first.call(null, s2__9525), interleave.call(null, cljs.core.rest.call(null, s1__9524), cljs.core.rest.call(null, s2__9525))))
      }else {
        return null
      }
    })
  };
  var interleave__9529 = function() {
    var G__9531__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__9527 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9527))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__9527), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__9527)))
        }else {
          return null
        }
      })
    };
    var G__9531 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9531__delegate.call(this, c1, c2, colls)
    };
    G__9531.cljs$lang$maxFixedArity = 2;
    G__9531.cljs$lang$applyTo = function(arglist__9532) {
      var c1 = cljs.core.first(arglist__9532);
      var c2 = cljs.core.first(cljs.core.next(arglist__9532));
      var colls = cljs.core.rest(cljs.core.next(arglist__9532));
      return G__9531__delegate.call(this, c1, c2, colls)
    };
    return G__9531
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__9528.call(this, c1, c2);
      default:
        return interleave__9529.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__9529.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__9535 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____9533 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____9533)) {
        var coll__9534 = temp__3695__auto____9533;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__9534), cat.call(null, cljs.core.rest.call(null, coll__9534), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__9535.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__9536 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__9537 = function() {
    var G__9539__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__9539 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9539__delegate.call(this, f, coll, colls)
    };
    G__9539.cljs$lang$maxFixedArity = 2;
    G__9539.cljs$lang$applyTo = function(arglist__9540) {
      var f = cljs.core.first(arglist__9540);
      var coll = cljs.core.first(cljs.core.next(arglist__9540));
      var colls = cljs.core.rest(cljs.core.next(arglist__9540));
      return G__9539__delegate.call(this, f, coll, colls)
    };
    return G__9539
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__9536.call(this, f, coll);
      default:
        return mapcat__9537.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__9537.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____9541 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____9541)) {
      var s__9542 = temp__3698__auto____9541;
      var f__9543 = cljs.core.first.call(null, s__9542);
      var r__9544 = cljs.core.rest.call(null, s__9542);
      if(cljs.core.truth_(pred.call(null, f__9543))) {
        return cljs.core.cons.call(null, f__9543, filter.call(null, pred, r__9544))
      }else {
        return filter.call(null, pred, r__9544)
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
  var walk__9546 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__9546.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__9545_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__9545_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__9553 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__9554 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____9547 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9547)) {
        var s__9548 = temp__3698__auto____9547;
        var p__9549 = cljs.core.take.call(null, n, s__9548);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__9549)))) {
          return cljs.core.cons.call(null, p__9549, partition.call(null, n, step, cljs.core.drop.call(null, step, s__9548)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__9555 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____9550 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9550)) {
        var s__9551 = temp__3698__auto____9550;
        var p__9552 = cljs.core.take.call(null, n, s__9551);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__9552)))) {
          return cljs.core.cons.call(null, p__9552, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__9551)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__9552, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__9553.call(this, n, step);
      case 3:
        return partition__9554.call(this, n, step, pad);
      case 4:
        return partition__9555.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__9561 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__9562 = function(m, ks, not_found) {
    var sentinel__9557 = cljs.core.lookup_sentinel;
    var m__9558 = m;
    var ks__9559 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__9559)) {
        var m__9560 = cljs.core.get.call(null, m__9558, cljs.core.first.call(null, ks__9559), sentinel__9557);
        if(cljs.core.truth_(sentinel__9557 === m__9560)) {
          return not_found
        }else {
          var G__9564 = sentinel__9557;
          var G__9565 = m__9560;
          var G__9566 = cljs.core.next.call(null, ks__9559);
          sentinel__9557 = G__9564;
          m__9558 = G__9565;
          ks__9559 = G__9566;
          continue
        }
      }else {
        return m__9558
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__9561.call(this, m, ks);
      case 3:
        return get_in__9562.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__9567, v) {
  var vec__9568__9569 = p__9567;
  var k__9570 = cljs.core.nth.call(null, vec__9568__9569, 0, null);
  var ks__9571 = cljs.core.nthnext.call(null, vec__9568__9569, 1);
  if(cljs.core.truth_(ks__9571)) {
    return cljs.core.assoc.call(null, m, k__9570, assoc_in.call(null, cljs.core.get.call(null, m, k__9570), ks__9571, v))
  }else {
    return cljs.core.assoc.call(null, m, k__9570, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__9572, f, args) {
    var vec__9573__9574 = p__9572;
    var k__9575 = cljs.core.nth.call(null, vec__9573__9574, 0, null);
    var ks__9576 = cljs.core.nthnext.call(null, vec__9573__9574, 1);
    if(cljs.core.truth_(ks__9576)) {
      return cljs.core.assoc.call(null, m, k__9575, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__9575), ks__9576, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__9575, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__9575), args))
    }
  };
  var update_in = function(m, p__9572, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__9572, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__9577) {
    var m = cljs.core.first(arglist__9577);
    var p__9572 = cljs.core.first(cljs.core.next(arglist__9577));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9577)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9577)));
    return update_in__delegate.call(this, m, p__9572, f, args)
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
  var this__9578 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__9611 = null;
  var G__9611__9612 = function(coll, k) {
    var this__9579 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__9611__9613 = function(coll, k, not_found) {
    var this__9580 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__9611 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9611__9612.call(this, coll, k);
      case 3:
        return G__9611__9613.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9611
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__9581 = this;
  var new_array__9582 = cljs.core.aclone.call(null, this__9581.array);
  new_array__9582[k] = v;
  return new cljs.core.Vector(this__9581.meta, new_array__9582)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__9615 = null;
  var G__9615__9616 = function(tsym9583, k) {
    var this__9585 = this;
    var tsym9583__9586 = this;
    var coll__9587 = tsym9583__9586;
    return cljs.core._lookup.call(null, coll__9587, k)
  };
  var G__9615__9617 = function(tsym9584, k, not_found) {
    var this__9588 = this;
    var tsym9584__9589 = this;
    var coll__9590 = tsym9584__9589;
    return cljs.core._lookup.call(null, coll__9590, k, not_found)
  };
  G__9615 = function(tsym9584, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9615__9616.call(this, tsym9584, k);
      case 3:
        return G__9615__9617.call(this, tsym9584, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9615
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__9591 = this;
  var new_array__9592 = cljs.core.aclone.call(null, this__9591.array);
  new_array__9592.push(o);
  return new cljs.core.Vector(this__9591.meta, new_array__9592)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__9619 = null;
  var G__9619__9620 = function(v, f) {
    var this__9593 = this;
    return cljs.core.ci_reduce.call(null, this__9593.array, f)
  };
  var G__9619__9621 = function(v, f, start) {
    var this__9594 = this;
    return cljs.core.ci_reduce.call(null, this__9594.array, f, start)
  };
  G__9619 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9619__9620.call(this, v, f);
      case 3:
        return G__9619__9621.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9619
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__9595 = this;
  if(cljs.core.truth_(this__9595.array.length > 0)) {
    var vector_seq__9596 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__9595.array.length)) {
          return cljs.core.cons.call(null, this__9595.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__9596.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__9597 = this;
  return this__9597.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__9598 = this;
  var count__9599 = this__9598.array.length;
  if(cljs.core.truth_(count__9599 > 0)) {
    return this__9598.array[count__9599 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__9600 = this;
  if(cljs.core.truth_(this__9600.array.length > 0)) {
    var new_array__9601 = cljs.core.aclone.call(null, this__9600.array);
    new_array__9601.pop();
    return new cljs.core.Vector(this__9600.meta, new_array__9601)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__9602 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9603 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9604 = this;
  return new cljs.core.Vector(meta, this__9604.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9605 = this;
  return this__9605.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__9623 = null;
  var G__9623__9624 = function(coll, n) {
    var this__9606 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____9607 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____9607)) {
        return n < this__9606.array.length
      }else {
        return and__3546__auto____9607
      }
    }())) {
      return this__9606.array[n]
    }else {
      return null
    }
  };
  var G__9623__9625 = function(coll, n, not_found) {
    var this__9608 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____9609 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____9609)) {
        return n < this__9608.array.length
      }else {
        return and__3546__auto____9609
      }
    }())) {
      return this__9608.array[n]
    }else {
      return not_found
    }
  };
  G__9623 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9623__9624.call(this, coll, n);
      case 3:
        return G__9623__9625.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9623
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9610 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9610.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, []);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__9627 = pv.cnt;
  if(cljs.core.truth_(cnt__9627 < 32)) {
    return 0
  }else {
    return cnt__9627 - 1 >> 5 << 5
  }
};
cljs.core.new_path = function new_path(level, node) {
  var ll__9628 = level;
  var ret__9629 = node;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, ll__9628))) {
      return ret__9629
    }else {
      var embed__9630 = ret__9629;
      var r__9631 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      var ___9632 = r__9631[0] = embed__9630;
      var G__9633 = ll__9628 - 5;
      var G__9634 = r__9631;
      ll__9628 = G__9633;
      ret__9629 = G__9634;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__9635 = cljs.core.aclone.call(null, parent);
  var subidx__9636 = pv.cnt - 1 >> level & 31;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 5, level))) {
    ret__9635[subidx__9636] = tailnode;
    return ret__9635
  }else {
    var temp__3695__auto____9637 = parent[subidx__9636];
    if(cljs.core.truth_(temp__3695__auto____9637)) {
      var child__9638 = temp__3695__auto____9637;
      var node_to_insert__9639 = push_tail.call(null, pv, level - 5, child__9638, tailnode);
      var ___9640 = ret__9635[subidx__9636] = node_to_insert__9639;
      return ret__9635
    }else {
      var node_to_insert__9641 = cljs.core.new_path.call(null, level - 5, tailnode);
      var ___9642 = ret__9635[subidx__9636] = node_to_insert__9641;
      return ret__9635
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____9643 = 0 <= i;
    if(cljs.core.truth_(and__3546__auto____9643)) {
      return i < pv.cnt
    }else {
      return and__3546__auto____9643
    }
  }())) {
    if(cljs.core.truth_(i >= cljs.core.tail_off.call(null, pv))) {
      return pv.tail
    }else {
      var node__9644 = pv.root;
      var level__9645 = pv.shift;
      while(true) {
        if(cljs.core.truth_(level__9645 > 0)) {
          var G__9646 = node__9644[i >> level__9645 & 31];
          var G__9647 = level__9645 - 5;
          node__9644 = G__9646;
          level__9645 = G__9647;
          continue
        }else {
          return node__9644
        }
        break
      }
    }
  }else {
    throw new Error(cljs.core.str.call(null, "No item ", i, " in vector of length ", pv.cnt));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__9648 = cljs.core.aclone.call(null, node);
  if(cljs.core.truth_(level === 0)) {
    ret__9648[i & 31] = val;
    return ret__9648
  }else {
    var subidx__9649 = i >> level & 31;
    var ___9650 = ret__9648[subidx__9649] = do_assoc.call(null, pv, level - 5, node[subidx__9649], i, val);
    return ret__9648
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__9651 = pv.cnt - 2 >> level & 31;
  if(cljs.core.truth_(level > 5)) {
    var new_child__9652 = pop_tail.call(null, pv, level - 5, node[subidx__9651]);
    if(cljs.core.truth_(function() {
      var and__3546__auto____9653 = new_child__9652 === null;
      if(cljs.core.truth_(and__3546__auto____9653)) {
        return subidx__9651 === 0
      }else {
        return and__3546__auto____9653
      }
    }())) {
      return null
    }else {
      var ret__9654 = cljs.core.aclone.call(null, node);
      var ___9655 = ret__9654[subidx__9651] = new_child__9652;
      return ret__9654
    }
  }else {
    if(cljs.core.truth_(subidx__9651 === 0)) {
      return null
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        var ret__9656 = cljs.core.aclone.call(null, node);
        var ___9657 = ret__9656[subidx__9651] = null;
        return ret__9656
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
  var this__9658 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__9698 = null;
  var G__9698__9699 = function(coll, k) {
    var this__9659 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__9698__9700 = function(coll, k, not_found) {
    var this__9660 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__9698 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9698__9699.call(this, coll, k);
      case 3:
        return G__9698__9700.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9698
}();
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__9661 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____9662 = 0 <= k;
    if(cljs.core.truth_(and__3546__auto____9662)) {
      return k < this__9661.cnt
    }else {
      return and__3546__auto____9662
    }
  }())) {
    if(cljs.core.truth_(cljs.core.tail_off.call(null, coll) <= k)) {
      var new_tail__9663 = cljs.core.aclone.call(null, this__9661.tail);
      new_tail__9663[k & 31] = v;
      return new cljs.core.PersistentVector(this__9661.meta, this__9661.cnt, this__9661.shift, this__9661.root, new_tail__9663)
    }else {
      return new cljs.core.PersistentVector(this__9661.meta, this__9661.cnt, this__9661.shift, cljs.core.do_assoc.call(null, coll, this__9661.shift, this__9661.root, k, v), this__9661.tail)
    }
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, k, this__9661.cnt))) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Index ", k, " out of bounds  [0,", this__9661.cnt, "]"));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__9702 = null;
  var G__9702__9703 = function(tsym9664, k) {
    var this__9666 = this;
    var tsym9664__9667 = this;
    var coll__9668 = tsym9664__9667;
    return cljs.core._lookup.call(null, coll__9668, k)
  };
  var G__9702__9704 = function(tsym9665, k, not_found) {
    var this__9669 = this;
    var tsym9665__9670 = this;
    var coll__9671 = tsym9665__9670;
    return cljs.core._lookup.call(null, coll__9671, k, not_found)
  };
  G__9702 = function(tsym9665, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9702__9703.call(this, tsym9665, k);
      case 3:
        return G__9702__9704.call(this, tsym9665, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9702
}();
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__9672 = this;
  if(cljs.core.truth_(this__9672.cnt - cljs.core.tail_off.call(null, coll) < 32)) {
    var new_tail__9673 = cljs.core.aclone.call(null, this__9672.tail);
    new_tail__9673.push(o);
    return new cljs.core.PersistentVector(this__9672.meta, this__9672.cnt + 1, this__9672.shift, this__9672.root, new_tail__9673)
  }else {
    var root_overflow_QMARK___9674 = this__9672.cnt >> 5 > 1 << this__9672.shift;
    var new_shift__9675 = cljs.core.truth_(root_overflow_QMARK___9674) ? this__9672.shift + 5 : this__9672.shift;
    var new_root__9677 = cljs.core.truth_(root_overflow_QMARK___9674) ? function() {
      var n_r__9676 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      n_r__9676[0] = this__9672.root;
      n_r__9676[1] = cljs.core.new_path.call(null, this__9672.shift, this__9672.tail);
      return n_r__9676
    }() : cljs.core.push_tail.call(null, coll, this__9672.shift, this__9672.root, this__9672.tail);
    return new cljs.core.PersistentVector(this__9672.meta, this__9672.cnt + 1, new_shift__9675, new_root__9677, [o])
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__9706 = null;
  var G__9706__9707 = function(v, f) {
    var this__9678 = this;
    return cljs.core.ci_reduce.call(null, v, f)
  };
  var G__9706__9708 = function(v, f, start) {
    var this__9679 = this;
    return cljs.core.ci_reduce.call(null, v, f, start)
  };
  G__9706 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9706__9707.call(this, v, f);
      case 3:
        return G__9706__9708.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9706
}();
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__9680 = this;
  if(cljs.core.truth_(this__9680.cnt > 0)) {
    var vector_seq__9681 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__9680.cnt)) {
          return cljs.core.cons.call(null, cljs.core._nth.call(null, coll, i), vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__9681.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__9682 = this;
  return this__9682.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__9683 = this;
  if(cljs.core.truth_(this__9683.cnt > 0)) {
    return cljs.core._nth.call(null, coll, this__9683.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__9684 = this;
  if(cljs.core.truth_(this__9684.cnt === 0)) {
    throw new Error("Can't pop empty vector");
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 1, this__9684.cnt))) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9684.meta)
    }else {
      if(cljs.core.truth_(1 < this__9684.cnt - cljs.core.tail_off.call(null, coll))) {
        return new cljs.core.PersistentVector(this__9684.meta, this__9684.cnt - 1, this__9684.shift, this__9684.root, cljs.core.aclone.call(null, this__9684.tail))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          var new_tail__9685 = cljs.core.array_for.call(null, coll, this__9684.cnt - 2);
          var nr__9686 = cljs.core.pop_tail.call(null, this__9684.shift, this__9684.root);
          var new_root__9687 = cljs.core.truth_(nr__9686 === null) ? cljs.core.PersistentVector.EMPTY_NODE : nr__9686;
          var cnt_1__9688 = this__9684.cnt - 1;
          if(cljs.core.truth_(function() {
            var and__3546__auto____9689 = 5 < this__9684.shift;
            if(cljs.core.truth_(and__3546__auto____9689)) {
              return new_root__9687[1] === null
            }else {
              return and__3546__auto____9689
            }
          }())) {
            return new cljs.core.PersistentVector(this__9684.meta, cnt_1__9688, this__9684.shift - 5, new_root__9687[0], new_tail__9685)
          }else {
            return new cljs.core.PersistentVector(this__9684.meta, cnt_1__9688, this__9684.shift, new_root__9687, new_tail__9685)
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
  var this__9690 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9691 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9692 = this;
  return new cljs.core.PersistentVector(meta, this__9692.cnt, this__9692.shift, this__9692.root, this__9692.tail)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9693 = this;
  return this__9693.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__9710 = null;
  var G__9710__9711 = function(coll, n) {
    var this__9694 = this;
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  };
  var G__9710__9712 = function(coll, n, not_found) {
    var this__9695 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____9696 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____9696)) {
        return n < this__9695.cnt
      }else {
        return and__3546__auto____9696
      }
    }())) {
      return cljs.core._nth.call(null, coll, n)
    }else {
      return not_found
    }
  };
  G__9710 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9710__9711.call(this, coll, n);
      case 3:
        return G__9710__9712.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9710
}();
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9697 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9697.meta)
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
  vector.cljs$lang$applyTo = function(arglist__9714) {
    var args = cljs.core.seq(arglist__9714);
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
  var this__9715 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__9743 = null;
  var G__9743__9744 = function(coll, k) {
    var this__9716 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__9743__9745 = function(coll, k, not_found) {
    var this__9717 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__9743 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9743__9744.call(this, coll, k);
      case 3:
        return G__9743__9745.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9743
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__9718 = this;
  var v_pos__9719 = this__9718.start + key;
  return new cljs.core.Subvec(this__9718.meta, cljs.core._assoc.call(null, this__9718.v, v_pos__9719, val), this__9718.start, this__9718.end > v_pos__9719 + 1 ? this__9718.end : v_pos__9719 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__9747 = null;
  var G__9747__9748 = function(tsym9720, k) {
    var this__9722 = this;
    var tsym9720__9723 = this;
    var coll__9724 = tsym9720__9723;
    return cljs.core._lookup.call(null, coll__9724, k)
  };
  var G__9747__9749 = function(tsym9721, k, not_found) {
    var this__9725 = this;
    var tsym9721__9726 = this;
    var coll__9727 = tsym9721__9726;
    return cljs.core._lookup.call(null, coll__9727, k, not_found)
  };
  G__9747 = function(tsym9721, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9747__9748.call(this, tsym9721, k);
      case 3:
        return G__9747__9749.call(this, tsym9721, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9747
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__9728 = this;
  return new cljs.core.Subvec(this__9728.meta, cljs.core._assoc_n.call(null, this__9728.v, this__9728.end, o), this__9728.start, this__9728.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__9751 = null;
  var G__9751__9752 = function(coll, f) {
    var this__9729 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__9751__9753 = function(coll, f, start) {
    var this__9730 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__9751 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9751__9752.call(this, coll, f);
      case 3:
        return G__9751__9753.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9751
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__9731 = this;
  var subvec_seq__9732 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__9731.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__9731.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__9732.call(null, this__9731.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__9733 = this;
  return this__9733.end - this__9733.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__9734 = this;
  return cljs.core._nth.call(null, this__9734.v, this__9734.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__9735 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__9735.start, this__9735.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__9735.meta, this__9735.v, this__9735.start, this__9735.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__9736 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9737 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9738 = this;
  return new cljs.core.Subvec(meta, this__9738.v, this__9738.start, this__9738.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9739 = this;
  return this__9739.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__9755 = null;
  var G__9755__9756 = function(coll, n) {
    var this__9740 = this;
    return cljs.core._nth.call(null, this__9740.v, this__9740.start + n)
  };
  var G__9755__9757 = function(coll, n, not_found) {
    var this__9741 = this;
    return cljs.core._nth.call(null, this__9741.v, this__9741.start + n, not_found)
  };
  G__9755 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9755__9756.call(this, coll, n);
      case 3:
        return G__9755__9757.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9755
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9742 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9742.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__9759 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__9760 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__9759.call(this, v, start);
      case 3:
        return subvec__9760.call(this, v, start, end)
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
  var this__9762 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__9763 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9764 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9765 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9765.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__9766 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__9767 = this;
  return cljs.core._first.call(null, this__9767.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__9768 = this;
  var temp__3695__auto____9769 = cljs.core.next.call(null, this__9768.front);
  if(cljs.core.truth_(temp__3695__auto____9769)) {
    var f1__9770 = temp__3695__auto____9769;
    return new cljs.core.PersistentQueueSeq(this__9768.meta, f1__9770, this__9768.rear)
  }else {
    if(cljs.core.truth_(this__9768.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__9768.meta, this__9768.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9771 = this;
  return this__9771.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9772 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__9772.front, this__9772.rear)
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
  var this__9773 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__9774 = this;
  if(cljs.core.truth_(this__9774.front)) {
    return new cljs.core.PersistentQueue(this__9774.meta, this__9774.count + 1, this__9774.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____9775 = this__9774.rear;
      if(cljs.core.truth_(or__3548__auto____9775)) {
        return or__3548__auto____9775
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__9774.meta, this__9774.count + 1, cljs.core.conj.call(null, this__9774.front, o), cljs.core.PersistentVector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__9776 = this;
  var rear__9777 = cljs.core.seq.call(null, this__9776.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____9778 = this__9776.front;
    if(cljs.core.truth_(or__3548__auto____9778)) {
      return or__3548__auto____9778
    }else {
      return rear__9777
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__9776.front, cljs.core.seq.call(null, rear__9777))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__9779 = this;
  return this__9779.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__9780 = this;
  return cljs.core._first.call(null, this__9780.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__9781 = this;
  if(cljs.core.truth_(this__9781.front)) {
    var temp__3695__auto____9782 = cljs.core.next.call(null, this__9781.front);
    if(cljs.core.truth_(temp__3695__auto____9782)) {
      var f1__9783 = temp__3695__auto____9782;
      return new cljs.core.PersistentQueue(this__9781.meta, this__9781.count - 1, f1__9783, this__9781.rear)
    }else {
      return new cljs.core.PersistentQueue(this__9781.meta, this__9781.count - 1, cljs.core.seq.call(null, this__9781.rear), cljs.core.PersistentVector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__9784 = this;
  return cljs.core.first.call(null, this__9784.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__9785 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9786 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9787 = this;
  return new cljs.core.PersistentQueue(meta, this__9787.count, this__9787.front, this__9787.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9788 = this;
  return this__9788.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9789 = this;
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
  var this__9790 = this;
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
  var len__9791 = array.length;
  var i__9792 = 0;
  while(true) {
    if(cljs.core.truth_(i__9792 < len__9791)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__9792]))) {
        return i__9792
      }else {
        var G__9793 = i__9792 + incr;
        i__9792 = G__9793;
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
  var obj_map_contains_key_QMARK___9795 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___9796 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9794 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____9794)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____9794
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
        return obj_map_contains_key_QMARK___9795.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___9796.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__9799 = cljs.core.hash.call(null, a);
  var b__9800 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__9799 < b__9800)) {
    return-1
  }else {
    if(cljs.core.truth_(a__9799 > b__9800)) {
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
  var this__9801 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__9828 = null;
  var G__9828__9829 = function(coll, k) {
    var this__9802 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__9828__9830 = function(coll, k, not_found) {
    var this__9803 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__9803.strobj, this__9803.strobj[k], not_found)
  };
  G__9828 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9828__9829.call(this, coll, k);
      case 3:
        return G__9828__9830.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9828
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__9804 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__9805 = goog.object.clone.call(null, this__9804.strobj);
    var overwrite_QMARK___9806 = new_strobj__9805.hasOwnProperty(k);
    new_strobj__9805[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___9806)) {
      return new cljs.core.ObjMap(this__9804.meta, this__9804.keys, new_strobj__9805)
    }else {
      var new_keys__9807 = cljs.core.aclone.call(null, this__9804.keys);
      new_keys__9807.push(k);
      return new cljs.core.ObjMap(this__9804.meta, new_keys__9807, new_strobj__9805)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__9804.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__9808 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__9808.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__9832 = null;
  var G__9832__9833 = function(tsym9809, k) {
    var this__9811 = this;
    var tsym9809__9812 = this;
    var coll__9813 = tsym9809__9812;
    return cljs.core._lookup.call(null, coll__9813, k)
  };
  var G__9832__9834 = function(tsym9810, k, not_found) {
    var this__9814 = this;
    var tsym9810__9815 = this;
    var coll__9816 = tsym9810__9815;
    return cljs.core._lookup.call(null, coll__9816, k, not_found)
  };
  G__9832 = function(tsym9810, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9832__9833.call(this, tsym9810, k);
      case 3:
        return G__9832__9834.call(this, tsym9810, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9832
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__9817 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__9818 = this;
  if(cljs.core.truth_(this__9818.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__9798_SHARP_) {
      return cljs.core.vector.call(null, p1__9798_SHARP_, this__9818.strobj[p1__9798_SHARP_])
    }, this__9818.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__9819 = this;
  return this__9819.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9820 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9821 = this;
  return new cljs.core.ObjMap(meta, this__9821.keys, this__9821.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9822 = this;
  return this__9822.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9823 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__9823.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__9824 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____9825 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____9825)) {
      return this__9824.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____9825
    }
  }())) {
    var new_keys__9826 = cljs.core.aclone.call(null, this__9824.keys);
    var new_strobj__9827 = goog.object.clone.call(null, this__9824.strobj);
    new_keys__9826.splice(cljs.core.scan_array.call(null, 1, k, new_keys__9826), 1);
    cljs.core.js_delete.call(null, new_strobj__9827, k);
    return new cljs.core.ObjMap(this__9824.meta, new_keys__9826, new_strobj__9827)
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
  var this__9837 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__9875 = null;
  var G__9875__9876 = function(coll, k) {
    var this__9838 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__9875__9877 = function(coll, k, not_found) {
    var this__9839 = this;
    var bucket__9840 = this__9839.hashobj[cljs.core.hash.call(null, k)];
    var i__9841 = cljs.core.truth_(bucket__9840) ? cljs.core.scan_array.call(null, 2, k, bucket__9840) : null;
    if(cljs.core.truth_(i__9841)) {
      return bucket__9840[i__9841 + 1]
    }else {
      return not_found
    }
  };
  G__9875 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9875__9876.call(this, coll, k);
      case 3:
        return G__9875__9877.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9875
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__9842 = this;
  var h__9843 = cljs.core.hash.call(null, k);
  var bucket__9844 = this__9842.hashobj[h__9843];
  if(cljs.core.truth_(bucket__9844)) {
    var new_bucket__9845 = cljs.core.aclone.call(null, bucket__9844);
    var new_hashobj__9846 = goog.object.clone.call(null, this__9842.hashobj);
    new_hashobj__9846[h__9843] = new_bucket__9845;
    var temp__3695__auto____9847 = cljs.core.scan_array.call(null, 2, k, new_bucket__9845);
    if(cljs.core.truth_(temp__3695__auto____9847)) {
      var i__9848 = temp__3695__auto____9847;
      new_bucket__9845[i__9848 + 1] = v;
      return new cljs.core.HashMap(this__9842.meta, this__9842.count, new_hashobj__9846)
    }else {
      new_bucket__9845.push(k, v);
      return new cljs.core.HashMap(this__9842.meta, this__9842.count + 1, new_hashobj__9846)
    }
  }else {
    var new_hashobj__9849 = goog.object.clone.call(null, this__9842.hashobj);
    new_hashobj__9849[h__9843] = [k, v];
    return new cljs.core.HashMap(this__9842.meta, this__9842.count + 1, new_hashobj__9849)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__9850 = this;
  var bucket__9851 = this__9850.hashobj[cljs.core.hash.call(null, k)];
  var i__9852 = cljs.core.truth_(bucket__9851) ? cljs.core.scan_array.call(null, 2, k, bucket__9851) : null;
  if(cljs.core.truth_(i__9852)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__9879 = null;
  var G__9879__9880 = function(tsym9853, k) {
    var this__9855 = this;
    var tsym9853__9856 = this;
    var coll__9857 = tsym9853__9856;
    return cljs.core._lookup.call(null, coll__9857, k)
  };
  var G__9879__9881 = function(tsym9854, k, not_found) {
    var this__9858 = this;
    var tsym9854__9859 = this;
    var coll__9860 = tsym9854__9859;
    return cljs.core._lookup.call(null, coll__9860, k, not_found)
  };
  G__9879 = function(tsym9854, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9879__9880.call(this, tsym9854, k);
      case 3:
        return G__9879__9881.call(this, tsym9854, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9879
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__9861 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__9862 = this;
  if(cljs.core.truth_(this__9862.count > 0)) {
    var hashes__9863 = cljs.core.js_keys.call(null, this__9862.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__9836_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__9862.hashobj[p1__9836_SHARP_]))
    }, hashes__9863)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__9864 = this;
  return this__9864.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9865 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9866 = this;
  return new cljs.core.HashMap(meta, this__9866.count, this__9866.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9867 = this;
  return this__9867.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9868 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__9868.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__9869 = this;
  var h__9870 = cljs.core.hash.call(null, k);
  var bucket__9871 = this__9869.hashobj[h__9870];
  var i__9872 = cljs.core.truth_(bucket__9871) ? cljs.core.scan_array.call(null, 2, k, bucket__9871) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__9872))) {
    return coll
  }else {
    var new_hashobj__9873 = goog.object.clone.call(null, this__9869.hashobj);
    if(cljs.core.truth_(3 > bucket__9871.length)) {
      cljs.core.js_delete.call(null, new_hashobj__9873, h__9870)
    }else {
      var new_bucket__9874 = cljs.core.aclone.call(null, bucket__9871);
      new_bucket__9874.splice(i__9872, 2);
      new_hashobj__9873[h__9870] = new_bucket__9874
    }
    return new cljs.core.HashMap(this__9869.meta, this__9869.count - 1, new_hashobj__9873)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__9883 = ks.length;
  var i__9884 = 0;
  var out__9885 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__9884 < len__9883)) {
      var G__9886 = i__9884 + 1;
      var G__9887 = cljs.core.assoc.call(null, out__9885, ks[i__9884], vs[i__9884]);
      i__9884 = G__9886;
      out__9885 = G__9887;
      continue
    }else {
      return out__9885
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__9888 = cljs.core.seq.call(null, keyvals);
    var out__9889 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__9888)) {
        var G__9890 = cljs.core.nnext.call(null, in$__9888);
        var G__9891 = cljs.core.assoc.call(null, out__9889, cljs.core.first.call(null, in$__9888), cljs.core.second.call(null, in$__9888));
        in$__9888 = G__9890;
        out__9889 = G__9891;
        continue
      }else {
        return out__9889
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
  hash_map.cljs$lang$applyTo = function(arglist__9892) {
    var keyvals = cljs.core.seq(arglist__9892);
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
      return cljs.core.reduce.call(null, function(p1__9893_SHARP_, p2__9894_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____9895 = p1__9893_SHARP_;
          if(cljs.core.truth_(or__3548__auto____9895)) {
            return or__3548__auto____9895
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__9894_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__9896) {
    var maps = cljs.core.seq(arglist__9896);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9899 = function(m, e) {
        var k__9897 = cljs.core.first.call(null, e);
        var v__9898 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__9897))) {
          return cljs.core.assoc.call(null, m, k__9897, f.call(null, cljs.core.get.call(null, m, k__9897), v__9898))
        }else {
          return cljs.core.assoc.call(null, m, k__9897, v__9898)
        }
      };
      var merge2__9901 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9899, function() {
          var or__3548__auto____9900 = m1;
          if(cljs.core.truth_(or__3548__auto____9900)) {
            return or__3548__auto____9900
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9901, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__9902) {
    var f = cljs.core.first(arglist__9902);
    var maps = cljs.core.rest(arglist__9902);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9904 = cljs.core.ObjMap.fromObject([], {});
  var keys__9905 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__9905)) {
      var key__9906 = cljs.core.first.call(null, keys__9905);
      var entry__9907 = cljs.core.get.call(null, map, key__9906, "\ufdd0'user/not-found");
      var G__9908 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__9907, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__9904, key__9906, entry__9907) : ret__9904;
      var G__9909 = cljs.core.next.call(null, keys__9905);
      ret__9904 = G__9908;
      keys__9905 = G__9909;
      continue
    }else {
      return ret__9904
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
  var this__9910 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__9931 = null;
  var G__9931__9932 = function(coll, v) {
    var this__9911 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__9931__9933 = function(coll, v, not_found) {
    var this__9912 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9912.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__9931 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9931__9932.call(this, coll, v);
      case 3:
        return G__9931__9933.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9931
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__9935 = null;
  var G__9935__9936 = function(tsym9913, k) {
    var this__9915 = this;
    var tsym9913__9916 = this;
    var coll__9917 = tsym9913__9916;
    return cljs.core._lookup.call(null, coll__9917, k)
  };
  var G__9935__9937 = function(tsym9914, k, not_found) {
    var this__9918 = this;
    var tsym9914__9919 = this;
    var coll__9920 = tsym9914__9919;
    return cljs.core._lookup.call(null, coll__9920, k, not_found)
  };
  G__9935 = function(tsym9914, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9935__9936.call(this, tsym9914, k);
      case 3:
        return G__9935__9937.call(this, tsym9914, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9935
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__9921 = this;
  return new cljs.core.Set(this__9921.meta, cljs.core.assoc.call(null, this__9921.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__9922 = this;
  return cljs.core.keys.call(null, this__9922.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__9923 = this;
  return new cljs.core.Set(this__9923.meta, cljs.core.dissoc.call(null, this__9923.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__9924 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__9925 = this;
  var and__3546__auto____9926 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____9926)) {
    var and__3546__auto____9927 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____9927)) {
      return cljs.core.every_QMARK_.call(null, function(p1__9903_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9903_SHARP_)
      }, other)
    }else {
      return and__3546__auto____9927
    }
  }else {
    return and__3546__auto____9926
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__9928 = this;
  return new cljs.core.Set(meta, this__9928.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__9929 = this;
  return this__9929.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__9930 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__9930.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__9940 = cljs.core.seq.call(null, coll);
  var out__9941 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__9940)))) {
      var G__9942 = cljs.core.rest.call(null, in$__9940);
      var G__9943 = cljs.core.conj.call(null, out__9941, cljs.core.first.call(null, in$__9940));
      in$__9940 = G__9942;
      out__9941 = G__9943;
      continue
    }else {
      return out__9941
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__9944 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____9945 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____9945)) {
        var e__9946 = temp__3695__auto____9945;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9946))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9944, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9939_SHARP_) {
      var temp__3695__auto____9947 = cljs.core.find.call(null, smap, p1__9939_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____9947)) {
        var e__9948 = temp__3695__auto____9947;
        return cljs.core.second.call(null, e__9948)
      }else {
        return p1__9939_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9956 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9949, seen) {
        while(true) {
          var vec__9950__9951 = p__9949;
          var f__9952 = cljs.core.nth.call(null, vec__9950__9951, 0, null);
          var xs__9953 = vec__9950__9951;
          var temp__3698__auto____9954 = cljs.core.seq.call(null, xs__9953);
          if(cljs.core.truth_(temp__3698__auto____9954)) {
            var s__9955 = temp__3698__auto____9954;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__9952))) {
              var G__9957 = cljs.core.rest.call(null, s__9955);
              var G__9958 = seen;
              p__9949 = G__9957;
              seen = G__9958;
              continue
            }else {
              return cljs.core.cons.call(null, f__9952, step.call(null, cljs.core.rest.call(null, s__9955), cljs.core.conj.call(null, seen, f__9952)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__9956.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__9959 = cljs.core.PersistentVector.fromArray([]);
  var s__9960 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__9960))) {
      var G__9961 = cljs.core.conj.call(null, ret__9959, cljs.core.first.call(null, s__9960));
      var G__9962 = cljs.core.next.call(null, s__9960);
      ret__9959 = G__9961;
      s__9960 = G__9962;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9959)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____9963 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____9963)) {
        return or__3548__auto____9963
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__9964 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__9964 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9964 + 1)
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
    var or__3548__auto____9965 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____9965)) {
      return or__3548__auto____9965
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__9966 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__9966 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__9966)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9969 = cljs.core.ObjMap.fromObject([], {});
  var ks__9970 = cljs.core.seq.call(null, keys);
  var vs__9971 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9972 = ks__9970;
      if(cljs.core.truth_(and__3546__auto____9972)) {
        return vs__9971
      }else {
        return and__3546__auto____9972
      }
    }())) {
      var G__9973 = cljs.core.assoc.call(null, map__9969, cljs.core.first.call(null, ks__9970), cljs.core.first.call(null, vs__9971));
      var G__9974 = cljs.core.next.call(null, ks__9970);
      var G__9975 = cljs.core.next.call(null, vs__9971);
      map__9969 = G__9973;
      ks__9970 = G__9974;
      vs__9971 = G__9975;
      continue
    }else {
      return map__9969
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__9978 = function(k, x) {
    return x
  };
  var max_key__9979 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__9980 = function() {
    var G__9982__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9967_SHARP_, p2__9968_SHARP_) {
        return max_key.call(null, k, p1__9967_SHARP_, p2__9968_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9982 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9982__delegate.call(this, k, x, y, more)
    };
    G__9982.cljs$lang$maxFixedArity = 3;
    G__9982.cljs$lang$applyTo = function(arglist__9983) {
      var k = cljs.core.first(arglist__9983);
      var x = cljs.core.first(cljs.core.next(arglist__9983));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9983)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9983)));
      return G__9982__delegate.call(this, k, x, y, more)
    };
    return G__9982
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__9978.call(this, k, x);
      case 3:
        return max_key__9979.call(this, k, x, y);
      default:
        return max_key__9980.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__9980.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__9984 = function(k, x) {
    return x
  };
  var min_key__9985 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__9986 = function() {
    var G__9988__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9976_SHARP_, p2__9977_SHARP_) {
        return min_key.call(null, k, p1__9976_SHARP_, p2__9977_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9988 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9988__delegate.call(this, k, x, y, more)
    };
    G__9988.cljs$lang$maxFixedArity = 3;
    G__9988.cljs$lang$applyTo = function(arglist__9989) {
      var k = cljs.core.first(arglist__9989);
      var x = cljs.core.first(cljs.core.next(arglist__9989));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9989)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9989)));
      return G__9988__delegate.call(this, k, x, y, more)
    };
    return G__9988
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__9984.call(this, k, x);
      case 3:
        return min_key__9985.call(this, k, x, y);
      default:
        return min_key__9986.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__9986.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__9992 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__9993 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____9990 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9990)) {
        var s__9991 = temp__3698__auto____9990;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9991), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9991)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__9992.call(this, n, step);
      case 3:
        return partition_all__9993.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____9995 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____9995)) {
      var s__9996 = temp__3698__auto____9995;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9996)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9996), take_while.call(null, pred, cljs.core.rest.call(null, s__9996)))
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
  var this__9997 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__9998 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__10014 = null;
  var G__10014__10015 = function(rng, f) {
    var this__9999 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__10014__10016 = function(rng, f, s) {
    var this__10000 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__10014 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__10014__10015.call(this, rng, f);
      case 3:
        return G__10014__10016.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10014
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__10001 = this;
  var comp__10002 = cljs.core.truth_(this__10001.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__10002.call(null, this__10001.start, this__10001.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__10003 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__10003.end - this__10003.start) / this__10003.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__10004 = this;
  return this__10004.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__10005 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__10005.meta, this__10005.start + this__10005.step, this__10005.end, this__10005.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__10006 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__10007 = this;
  return new cljs.core.Range(meta, this__10007.start, this__10007.end, this__10007.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__10008 = this;
  return this__10008.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__10018 = null;
  var G__10018__10019 = function(rng, n) {
    var this__10009 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__10009.start + n * this__10009.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____10010 = this__10009.start > this__10009.end;
        if(cljs.core.truth_(and__3546__auto____10010)) {
          return cljs.core._EQ_.call(null, this__10009.step, 0)
        }else {
          return and__3546__auto____10010
        }
      }())) {
        return this__10009.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__10018__10020 = function(rng, n, not_found) {
    var this__10011 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__10011.start + n * this__10011.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____10012 = this__10011.start > this__10011.end;
        if(cljs.core.truth_(and__3546__auto____10012)) {
          return cljs.core._EQ_.call(null, this__10011.step, 0)
        }else {
          return and__3546__auto____10012
        }
      }())) {
        return this__10011.start
      }else {
        return not_found
      }
    }
  };
  G__10018 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10018__10019.call(this, rng, n);
      case 3:
        return G__10018__10020.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10018
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__10013 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10013.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__10022 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__10023 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__10024 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__10025 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__10022.call(this);
      case 1:
        return range__10023.call(this, start);
      case 2:
        return range__10024.call(this, start, end);
      case 3:
        return range__10025.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____10027 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____10027)) {
      var s__10028 = temp__3698__auto____10027;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__10028), take_nth.call(null, n, cljs.core.drop.call(null, n, s__10028)))
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
    var temp__3698__auto____10030 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____10030)) {
      var s__10031 = temp__3698__auto____10030;
      var fst__10032 = cljs.core.first.call(null, s__10031);
      var fv__10033 = f.call(null, fst__10032);
      var run__10034 = cljs.core.cons.call(null, fst__10032, cljs.core.take_while.call(null, function(p1__10029_SHARP_) {
        return cljs.core._EQ_.call(null, fv__10033, f.call(null, p1__10029_SHARP_))
      }, cljs.core.next.call(null, s__10031)));
      return cljs.core.cons.call(null, run__10034, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__10034), s__10031))))
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
  var reductions__10049 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____10045 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____10045)) {
        var s__10046 = temp__3695__auto____10045;
        return reductions.call(null, f, cljs.core.first.call(null, s__10046), cljs.core.rest.call(null, s__10046))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__10050 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____10047 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____10047)) {
        var s__10048 = temp__3698__auto____10047;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10048)), cljs.core.rest.call(null, s__10048))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__10049.call(this, f, init);
      case 3:
        return reductions__10050.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__10053 = function(f) {
    return function() {
      var G__10058 = null;
      var G__10058__10059 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10058__10060 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10058__10061 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10058__10062 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10058__10063 = function() {
        var G__10065__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10065 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10065__delegate.call(this, x, y, z, args)
        };
        G__10065.cljs$lang$maxFixedArity = 3;
        G__10065.cljs$lang$applyTo = function(arglist__10066) {
          var x = cljs.core.first(arglist__10066);
          var y = cljs.core.first(cljs.core.next(arglist__10066));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10066)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10066)));
          return G__10065__delegate.call(this, x, y, z, args)
        };
        return G__10065
      }();
      G__10058 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10058__10059.call(this);
          case 1:
            return G__10058__10060.call(this, x);
          case 2:
            return G__10058__10061.call(this, x, y);
          case 3:
            return G__10058__10062.call(this, x, y, z);
          default:
            return G__10058__10063.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10058.cljs$lang$maxFixedArity = 3;
      G__10058.cljs$lang$applyTo = G__10058__10063.cljs$lang$applyTo;
      return G__10058
    }()
  };
  var juxt__10054 = function(f, g) {
    return function() {
      var G__10067 = null;
      var G__10067__10068 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10067__10069 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10067__10070 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10067__10071 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10067__10072 = function() {
        var G__10074__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10074 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10074__delegate.call(this, x, y, z, args)
        };
        G__10074.cljs$lang$maxFixedArity = 3;
        G__10074.cljs$lang$applyTo = function(arglist__10075) {
          var x = cljs.core.first(arglist__10075);
          var y = cljs.core.first(cljs.core.next(arglist__10075));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10075)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10075)));
          return G__10074__delegate.call(this, x, y, z, args)
        };
        return G__10074
      }();
      G__10067 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10067__10068.call(this);
          case 1:
            return G__10067__10069.call(this, x);
          case 2:
            return G__10067__10070.call(this, x, y);
          case 3:
            return G__10067__10071.call(this, x, y, z);
          default:
            return G__10067__10072.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10067.cljs$lang$maxFixedArity = 3;
      G__10067.cljs$lang$applyTo = G__10067__10072.cljs$lang$applyTo;
      return G__10067
    }()
  };
  var juxt__10055 = function(f, g, h) {
    return function() {
      var G__10076 = null;
      var G__10076__10077 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10076__10078 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10076__10079 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10076__10080 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10076__10081 = function() {
        var G__10083__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10083 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10083__delegate.call(this, x, y, z, args)
        };
        G__10083.cljs$lang$maxFixedArity = 3;
        G__10083.cljs$lang$applyTo = function(arglist__10084) {
          var x = cljs.core.first(arglist__10084);
          var y = cljs.core.first(cljs.core.next(arglist__10084));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10084)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10084)));
          return G__10083__delegate.call(this, x, y, z, args)
        };
        return G__10083
      }();
      G__10076 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10076__10077.call(this);
          case 1:
            return G__10076__10078.call(this, x);
          case 2:
            return G__10076__10079.call(this, x, y);
          case 3:
            return G__10076__10080.call(this, x, y, z);
          default:
            return G__10076__10081.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10076.cljs$lang$maxFixedArity = 3;
      G__10076.cljs$lang$applyTo = G__10076__10081.cljs$lang$applyTo;
      return G__10076
    }()
  };
  var juxt__10056 = function() {
    var G__10085__delegate = function(f, g, h, fs) {
      var fs__10052 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10086 = null;
        var G__10086__10087 = function() {
          return cljs.core.reduce.call(null, function(p1__10035_SHARP_, p2__10036_SHARP_) {
            return cljs.core.conj.call(null, p1__10035_SHARP_, p2__10036_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__10052)
        };
        var G__10086__10088 = function(x) {
          return cljs.core.reduce.call(null, function(p1__10037_SHARP_, p2__10038_SHARP_) {
            return cljs.core.conj.call(null, p1__10037_SHARP_, p2__10038_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__10052)
        };
        var G__10086__10089 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__10039_SHARP_, p2__10040_SHARP_) {
            return cljs.core.conj.call(null, p1__10039_SHARP_, p2__10040_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__10052)
        };
        var G__10086__10090 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__10041_SHARP_, p2__10042_SHARP_) {
            return cljs.core.conj.call(null, p1__10041_SHARP_, p2__10042_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__10052)
        };
        var G__10086__10091 = function() {
          var G__10093__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__10043_SHARP_, p2__10044_SHARP_) {
              return cljs.core.conj.call(null, p1__10043_SHARP_, cljs.core.apply.call(null, p2__10044_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__10052)
          };
          var G__10093 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10093__delegate.call(this, x, y, z, args)
          };
          G__10093.cljs$lang$maxFixedArity = 3;
          G__10093.cljs$lang$applyTo = function(arglist__10094) {
            var x = cljs.core.first(arglist__10094);
            var y = cljs.core.first(cljs.core.next(arglist__10094));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10094)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10094)));
            return G__10093__delegate.call(this, x, y, z, args)
          };
          return G__10093
        }();
        G__10086 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10086__10087.call(this);
            case 1:
              return G__10086__10088.call(this, x);
            case 2:
              return G__10086__10089.call(this, x, y);
            case 3:
              return G__10086__10090.call(this, x, y, z);
            default:
              return G__10086__10091.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10086.cljs$lang$maxFixedArity = 3;
        G__10086.cljs$lang$applyTo = G__10086__10091.cljs$lang$applyTo;
        return G__10086
      }()
    };
    var G__10085 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10085__delegate.call(this, f, g, h, fs)
    };
    G__10085.cljs$lang$maxFixedArity = 3;
    G__10085.cljs$lang$applyTo = function(arglist__10095) {
      var f = cljs.core.first(arglist__10095);
      var g = cljs.core.first(cljs.core.next(arglist__10095));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10095)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10095)));
      return G__10085__delegate.call(this, f, g, h, fs)
    };
    return G__10085
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__10053.call(this, f);
      case 2:
        return juxt__10054.call(this, f, g);
      case 3:
        return juxt__10055.call(this, f, g, h);
      default:
        return juxt__10056.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__10056.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__10097 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__10100 = cljs.core.next.call(null, coll);
        coll = G__10100;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__10098 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____10096 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____10096)) {
          return n > 0
        }else {
          return and__3546__auto____10096
        }
      }())) {
        var G__10101 = n - 1;
        var G__10102 = cljs.core.next.call(null, coll);
        n = G__10101;
        coll = G__10102;
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
        return dorun__10097.call(this, n);
      case 2:
        return dorun__10098.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__10103 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__10104 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__10103.call(this, n);
      case 2:
        return doall__10104.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__10106 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10106), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__10106), 1))) {
      return cljs.core.first.call(null, matches__10106)
    }else {
      return cljs.core.vec.call(null, matches__10106)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10107 = re.exec(s);
  if(cljs.core.truth_(matches__10107 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__10107), 1))) {
      return cljs.core.first.call(null, matches__10107)
    }else {
      return cljs.core.vec.call(null, matches__10107)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10108 = cljs.core.re_find.call(null, re, s);
  var match_idx__10109 = s.search(re);
  var match_str__10110 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__10108)) ? cljs.core.first.call(null, match_data__10108) : match_data__10108;
  var post_match__10111 = cljs.core.subs.call(null, s, match_idx__10109 + cljs.core.count.call(null, match_str__10110));
  if(cljs.core.truth_(match_data__10108)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10108, re_seq.call(null, re, post_match__10111))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10113__10114 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10115 = cljs.core.nth.call(null, vec__10113__10114, 0, null);
  var flags__10116 = cljs.core.nth.call(null, vec__10113__10114, 1, null);
  var pattern__10117 = cljs.core.nth.call(null, vec__10113__10114, 2, null);
  return new RegExp(pattern__10117, flags__10116)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__10112_SHARP_) {
    return print_one.call(null, p1__10112_SHARP_, opts)
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
          var and__3546__auto____10118 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____10118)) {
            var and__3546__auto____10122 = function() {
              var x__451__auto____10119 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____10120 = x__451__auto____10119;
                if(cljs.core.truth_(and__3546__auto____10120)) {
                  var and__3546__auto____10121 = x__451__auto____10119.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____10121)) {
                    return cljs.core.not.call(null, x__451__auto____10119.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____10121
                  }
                }else {
                  return and__3546__auto____10120
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____10119)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____10122)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____10122
            }
          }else {
            return and__3546__auto____10118
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__451__auto____10123 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____10124 = x__451__auto____10123;
            if(cljs.core.truth_(and__3546__auto____10124)) {
              var and__3546__auto____10125 = x__451__auto____10123.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____10125)) {
                return cljs.core.not.call(null, x__451__auto____10123.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____10125
              }
            }else {
              return and__3546__auto____10124
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__451__auto____10123)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__10126 = cljs.core.first.call(null, objs);
  var sb__10127 = new goog.string.StringBuffer;
  var G__10128__10129 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__10128__10129)) {
    var obj__10130 = cljs.core.first.call(null, G__10128__10129);
    var G__10128__10131 = G__10128__10129;
    while(true) {
      if(cljs.core.truth_(obj__10130 === first_obj__10126)) {
      }else {
        sb__10127.append(" ")
      }
      var G__10132__10133 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10130, opts));
      if(cljs.core.truth_(G__10132__10133)) {
        var string__10134 = cljs.core.first.call(null, G__10132__10133);
        var G__10132__10135 = G__10132__10133;
        while(true) {
          sb__10127.append(string__10134);
          var temp__3698__auto____10136 = cljs.core.next.call(null, G__10132__10135);
          if(cljs.core.truth_(temp__3698__auto____10136)) {
            var G__10132__10137 = temp__3698__auto____10136;
            var G__10140 = cljs.core.first.call(null, G__10132__10137);
            var G__10141 = G__10132__10137;
            string__10134 = G__10140;
            G__10132__10135 = G__10141;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____10138 = cljs.core.next.call(null, G__10128__10131);
      if(cljs.core.truth_(temp__3698__auto____10138)) {
        var G__10128__10139 = temp__3698__auto____10138;
        var G__10142 = cljs.core.first.call(null, G__10128__10139);
        var G__10143 = G__10128__10139;
        obj__10130 = G__10142;
        G__10128__10131 = G__10143;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10127
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return cljs.core.str.call(null, cljs.core.pr_sb.call(null, objs, opts))
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10144 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10144.append("\n");
  return cljs.core.str.call(null, sb__10144)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__10145 = cljs.core.first.call(null, objs);
  var G__10146__10147 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__10146__10147)) {
    var obj__10148 = cljs.core.first.call(null, G__10146__10147);
    var G__10146__10149 = G__10146__10147;
    while(true) {
      if(cljs.core.truth_(obj__10148 === first_obj__10145)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__10150__10151 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10148, opts));
      if(cljs.core.truth_(G__10150__10151)) {
        var string__10152 = cljs.core.first.call(null, G__10150__10151);
        var G__10150__10153 = G__10150__10151;
        while(true) {
          cljs.core.string_print.call(null, string__10152);
          var temp__3698__auto____10154 = cljs.core.next.call(null, G__10150__10153);
          if(cljs.core.truth_(temp__3698__auto____10154)) {
            var G__10150__10155 = temp__3698__auto____10154;
            var G__10158 = cljs.core.first.call(null, G__10150__10155);
            var G__10159 = G__10150__10155;
            string__10152 = G__10158;
            G__10150__10153 = G__10159;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____10156 = cljs.core.next.call(null, G__10146__10149);
      if(cljs.core.truth_(temp__3698__auto____10156)) {
        var G__10146__10157 = temp__3698__auto____10156;
        var G__10160 = cljs.core.first.call(null, G__10146__10157);
        var G__10161 = G__10146__10157;
        obj__10148 = G__10160;
        G__10146__10149 = G__10161;
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
  pr_str.cljs$lang$applyTo = function(arglist__10162) {
    var objs = cljs.core.seq(arglist__10162);
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
  prn_str.cljs$lang$applyTo = function(arglist__10163) {
    var objs = cljs.core.seq(arglist__10163);
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
  pr.cljs$lang$applyTo = function(arglist__10164) {
    var objs = cljs.core.seq(arglist__10164);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__10165) {
    var objs = cljs.core.seq(arglist__10165);
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
  print_str.cljs$lang$applyTo = function(arglist__10166) {
    var objs = cljs.core.seq(arglist__10166);
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
  println.cljs$lang$applyTo = function(arglist__10167) {
    var objs = cljs.core.seq(arglist__10167);
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
  println_str.cljs$lang$applyTo = function(arglist__10168) {
    var objs = cljs.core.seq(arglist__10168);
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
  prn.cljs$lang$applyTo = function(arglist__10169) {
    var objs = cljs.core.seq(arglist__10169);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__10170 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10170, "{", ", ", "}", opts, coll)
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
      var temp__3698__auto____10171 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____10171)) {
        var nspc__10172 = temp__3698__auto____10171;
        return cljs.core.str.call(null, nspc__10172, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____10173 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____10173)) {
          var nspc__10174 = temp__3698__auto____10173;
          return cljs.core.str.call(null, nspc__10174, "/")
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
  var pr_pair__10175 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10175, "{", ", ", "}", opts, coll)
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
  var this__10176 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__10177 = this;
  var G__10178__10179 = cljs.core.seq.call(null, this__10177.watches);
  if(cljs.core.truth_(G__10178__10179)) {
    var G__10181__10183 = cljs.core.first.call(null, G__10178__10179);
    var vec__10182__10184 = G__10181__10183;
    var key__10185 = cljs.core.nth.call(null, vec__10182__10184, 0, null);
    var f__10186 = cljs.core.nth.call(null, vec__10182__10184, 1, null);
    var G__10178__10187 = G__10178__10179;
    var G__10181__10188 = G__10181__10183;
    var G__10178__10189 = G__10178__10187;
    while(true) {
      var vec__10190__10191 = G__10181__10188;
      var key__10192 = cljs.core.nth.call(null, vec__10190__10191, 0, null);
      var f__10193 = cljs.core.nth.call(null, vec__10190__10191, 1, null);
      var G__10178__10194 = G__10178__10189;
      f__10193.call(null, key__10192, this$, oldval, newval);
      var temp__3698__auto____10195 = cljs.core.next.call(null, G__10178__10194);
      if(cljs.core.truth_(temp__3698__auto____10195)) {
        var G__10178__10196 = temp__3698__auto____10195;
        var G__10203 = cljs.core.first.call(null, G__10178__10196);
        var G__10204 = G__10178__10196;
        G__10181__10188 = G__10203;
        G__10178__10189 = G__10204;
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
  var this__10197 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10197.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__10198 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10198.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__10199 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__10199.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__10200 = this;
  return this__10200.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__10201 = this;
  return this__10201.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__10202 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__10211 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__10212 = function() {
    var G__10214__delegate = function(x, p__10205) {
      var map__10206__10207 = p__10205;
      var map__10206__10208 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__10206__10207)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10206__10207) : map__10206__10207;
      var validator__10209 = cljs.core.get.call(null, map__10206__10208, "\ufdd0'validator");
      var meta__10210 = cljs.core.get.call(null, map__10206__10208, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__10210, validator__10209, null)
    };
    var G__10214 = function(x, var_args) {
      var p__10205 = null;
      if(goog.isDef(var_args)) {
        p__10205 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10214__delegate.call(this, x, p__10205)
    };
    G__10214.cljs$lang$maxFixedArity = 1;
    G__10214.cljs$lang$applyTo = function(arglist__10215) {
      var x = cljs.core.first(arglist__10215);
      var p__10205 = cljs.core.rest(arglist__10215);
      return G__10214__delegate.call(this, x, p__10205)
    };
    return G__10214
  }();
  atom = function(x, var_args) {
    var p__10205 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__10211.call(this, x);
      default:
        return atom__10212.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__10212.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____10216 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____10216)) {
    var validate__10217 = temp__3698__auto____10216;
    if(cljs.core.truth_(validate__10217.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3282)))));
    }
  }else {
  }
  var old_value__10218 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10218, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___10219 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___10220 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___10221 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___10222 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___10223 = function() {
    var G__10225__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10225 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10225__delegate.call(this, a, f, x, y, z, more)
    };
    G__10225.cljs$lang$maxFixedArity = 5;
    G__10225.cljs$lang$applyTo = function(arglist__10226) {
      var a = cljs.core.first(arglist__10226);
      var f = cljs.core.first(cljs.core.next(arglist__10226));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10226)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10226))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10226)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10226)))));
      return G__10225__delegate.call(this, a, f, x, y, z, more)
    };
    return G__10225
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___10219.call(this, a, f);
      case 3:
        return swap_BANG___10220.call(this, a, f, x);
      case 4:
        return swap_BANG___10221.call(this, a, f, x, y);
      case 5:
        return swap_BANG___10222.call(this, a, f, x, y, z);
      default:
        return swap_BANG___10223.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___10223.cljs$lang$applyTo;
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10227) {
    var iref = cljs.core.first(arglist__10227);
    var f = cljs.core.first(cljs.core.next(arglist__10227));
    var args = cljs.core.rest(cljs.core.next(arglist__10227));
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
  var gensym__10228 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__10229 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__10228.call(this);
      case 1:
        return gensym__10229.call(this, prefix_string)
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
  var this__10231 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__10231.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__10232 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__10232.state, function(p__10233) {
    var curr_state__10234 = p__10233;
    var curr_state__10235 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, curr_state__10234)) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__10234) : curr_state__10234;
    var done__10236 = cljs.core.get.call(null, curr_state__10235, "\ufdd0'done");
    if(cljs.core.truth_(done__10236)) {
      return curr_state__10235
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10232.f.call(null)})
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
    var map__10237__10238 = options;
    var map__10237__10239 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__10237__10238)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10237__10238) : map__10237__10238;
    var keywordize_keys__10240 = cljs.core.get.call(null, map__10237__10239, "\ufdd0'keywordize-keys");
    var keyfn__10241 = cljs.core.truth_(keywordize_keys__10240) ? cljs.core.keyword : cljs.core.str;
    var f__10247 = function thisfn(x) {
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
                var iter__520__auto____10246 = function iter__10242(s__10243) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__10243__10244 = s__10243;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__10243__10244))) {
                        var k__10245 = cljs.core.first.call(null, s__10243__10244);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10241.call(null, k__10245), thisfn.call(null, x[k__10245])]), iter__10242.call(null, cljs.core.rest.call(null, s__10243__10244)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__520__auto____10246.call(null, cljs.core.js_keys.call(null, x))
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
    return f__10247.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__10248) {
    var x = cljs.core.first(arglist__10248);
    var options = cljs.core.rest(arglist__10248);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__10249 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__10253__delegate = function(args) {
      var temp__3695__auto____10250 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__10249), args);
      if(cljs.core.truth_(temp__3695__auto____10250)) {
        var v__10251 = temp__3695__auto____10250;
        return v__10251
      }else {
        var ret__10252 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__10249, cljs.core.assoc, args, ret__10252);
        return ret__10252
      }
    };
    var G__10253 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10253__delegate.call(this, args)
    };
    G__10253.cljs$lang$maxFixedArity = 0;
    G__10253.cljs$lang$applyTo = function(arglist__10254) {
      var args = cljs.core.seq(arglist__10254);
      return G__10253__delegate.call(this, args)
    };
    return G__10253
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__10256 = function(f) {
    while(true) {
      var ret__10255 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__10255))) {
        var G__10259 = ret__10255;
        f = G__10259;
        continue
      }else {
        return ret__10255
      }
      break
    }
  };
  var trampoline__10257 = function() {
    var G__10260__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10260 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10260__delegate.call(this, f, args)
    };
    G__10260.cljs$lang$maxFixedArity = 1;
    G__10260.cljs$lang$applyTo = function(arglist__10261) {
      var f = cljs.core.first(arglist__10261);
      var args = cljs.core.rest(arglist__10261);
      return G__10260__delegate.call(this, f, args)
    };
    return G__10260
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__10256.call(this, f);
      default:
        return trampoline__10257.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__10257.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__10262 = function() {
    return rand.call(null, 1)
  };
  var rand__10263 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__10262.call(this);
      case 1:
        return rand__10263.call(this, n)
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
    var k__10265 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10265, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__10265, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___10274 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___10275 = function(h, child, parent) {
    var or__3548__auto____10266 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____10266)) {
      return or__3548__auto____10266
    }else {
      var or__3548__auto____10267 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____10267)) {
        return or__3548__auto____10267
      }else {
        var and__3546__auto____10268 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____10268)) {
          var and__3546__auto____10269 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____10269)) {
            var and__3546__auto____10270 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____10270)) {
              var ret__10271 = true;
              var i__10272 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____10273 = cljs.core.not.call(null, ret__10271);
                  if(cljs.core.truth_(or__3548__auto____10273)) {
                    return or__3548__auto____10273
                  }else {
                    return cljs.core._EQ_.call(null, i__10272, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__10271
                }else {
                  var G__10277 = isa_QMARK_.call(null, h, child.call(null, i__10272), parent.call(null, i__10272));
                  var G__10278 = i__10272 + 1;
                  ret__10271 = G__10277;
                  i__10272 = G__10278;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____10270
            }
          }else {
            return and__3546__auto____10269
          }
        }else {
          return and__3546__auto____10268
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___10274.call(this, h, child);
      case 3:
        return isa_QMARK___10275.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__10279 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__10280 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__10279.call(this, h);
      case 2:
        return parents__10280.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__10282 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__10283 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__10282.call(this, h);
      case 2:
        return ancestors__10283.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__10285 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__10286 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__10285.call(this, h);
      case 2:
        return descendants__10286.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__10296 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3566)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__10297 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3570)))));
    }
    var tp__10291 = "\ufdd0'parents".call(null, h);
    var td__10292 = "\ufdd0'descendants".call(null, h);
    var ta__10293 = "\ufdd0'ancestors".call(null, h);
    var tf__10294 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____10295 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__10291.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__10293.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__10293.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__10291, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__10294.call(null, "\ufdd0'ancestors".call(null, h), tag, td__10292, parent, ta__10293), "\ufdd0'descendants":tf__10294.call(null, "\ufdd0'descendants".call(null, h), parent, ta__10293, tag, td__10292)})
    }();
    if(cljs.core.truth_(or__3548__auto____10295)) {
      return or__3548__auto____10295
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__10296.call(this, h, tag);
      case 3:
        return derive__10297.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__10303 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__10304 = function(h, tag, parent) {
    var parentMap__10299 = "\ufdd0'parents".call(null, h);
    var childsParents__10300 = cljs.core.truth_(parentMap__10299.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10299.call(null, tag), parent) : cljs.core.set([]);
    var newParents__10301 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10300)) ? cljs.core.assoc.call(null, parentMap__10299, tag, childsParents__10300) : cljs.core.dissoc.call(null, parentMap__10299, tag);
    var deriv_seq__10302 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10288_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10288_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10288_SHARP_), cljs.core.second.call(null, p1__10288_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10301)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__10299.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__10289_SHARP_, p2__10290_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10289_SHARP_, p2__10290_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10302))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__10303.call(this, h, tag);
      case 3:
        return underive__10304.call(this, h, tag, parent)
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
  var xprefs__10306 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____10308 = cljs.core.truth_(function() {
    var and__3546__auto____10307 = xprefs__10306;
    if(cljs.core.truth_(and__3546__auto____10307)) {
      return xprefs__10306.call(null, y)
    }else {
      return and__3546__auto____10307
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____10308)) {
    return or__3548__auto____10308
  }else {
    var or__3548__auto____10310 = function() {
      var ps__10309 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__10309) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10309), prefer_table))) {
          }else {
          }
          var G__10313 = cljs.core.rest.call(null, ps__10309);
          ps__10309 = G__10313;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____10310)) {
      return or__3548__auto____10310
    }else {
      var or__3548__auto____10312 = function() {
        var ps__10311 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__10311) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10311), y, prefer_table))) {
            }else {
            }
            var G__10314 = cljs.core.rest.call(null, ps__10311);
            ps__10311 = G__10314;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____10312)) {
        return or__3548__auto____10312
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____10315 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____10315)) {
    return or__3548__auto____10315
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10324 = cljs.core.reduce.call(null, function(be, p__10316) {
    var vec__10317__10318 = p__10316;
    var k__10319 = cljs.core.nth.call(null, vec__10317__10318, 0, null);
    var ___10320 = cljs.core.nth.call(null, vec__10317__10318, 1, null);
    var e__10321 = vec__10317__10318;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10319))) {
      var be2__10323 = cljs.core.truth_(function() {
        var or__3548__auto____10322 = be === null;
        if(cljs.core.truth_(or__3548__auto____10322)) {
          return or__3548__auto____10322
        }else {
          return cljs.core.dominates.call(null, k__10319, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10321 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10323), k__10319, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__10319, " and ", cljs.core.first.call(null, be2__10323), ", and neither is preferred"));
      }
      return be2__10323
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10324)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10324));
      return cljs.core.second.call(null, best_entry__10324)
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
    var and__3546__auto____10325 = mf;
    if(cljs.core.truth_(and__3546__auto____10325)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____10325
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____10326 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____10326)) {
        return or__3548__auto____10326
      }else {
        var or__3548__auto____10327 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____10327)) {
          return or__3548__auto____10327
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10328 = mf;
    if(cljs.core.truth_(and__3546__auto____10328)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____10328
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____10329 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____10329)) {
        return or__3548__auto____10329
      }else {
        var or__3548__auto____10330 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____10330)) {
          return or__3548__auto____10330
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10331 = mf;
    if(cljs.core.truth_(and__3546__auto____10331)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____10331
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____10332 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____10332)) {
        return or__3548__auto____10332
      }else {
        var or__3548__auto____10333 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____10333)) {
          return or__3548__auto____10333
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10334 = mf;
    if(cljs.core.truth_(and__3546__auto____10334)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____10334
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____10335 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____10335)) {
        return or__3548__auto____10335
      }else {
        var or__3548__auto____10336 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____10336)) {
          return or__3548__auto____10336
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10337 = mf;
    if(cljs.core.truth_(and__3546__auto____10337)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____10337
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____10338 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____10338)) {
        return or__3548__auto____10338
      }else {
        var or__3548__auto____10339 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____10339)) {
          return or__3548__auto____10339
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10340 = mf;
    if(cljs.core.truth_(and__3546__auto____10340)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____10340
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____10341 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____10341)) {
        return or__3548__auto____10341
      }else {
        var or__3548__auto____10342 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____10342)) {
          return or__3548__auto____10342
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10343 = mf;
    if(cljs.core.truth_(and__3546__auto____10343)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____10343
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____10344 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____10344)) {
        return or__3548__auto____10344
      }else {
        var or__3548__auto____10345 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____10345)) {
          return or__3548__auto____10345
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10346 = mf;
    if(cljs.core.truth_(and__3546__auto____10346)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____10346
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____10347 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____10347)) {
        return or__3548__auto____10347
      }else {
        var or__3548__auto____10348 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____10348)) {
          return or__3548__auto____10348
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10349 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10350 = cljs.core._get_method.call(null, mf, dispatch_val__10349);
  if(cljs.core.truth_(target_fn__10350)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__10349));
  }
  return cljs.core.apply.call(null, target_fn__10350, args)
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
  var this__10351 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__10352 = this;
  cljs.core.swap_BANG_.call(null, this__10352.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__10352.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__10352.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__10352.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__10353 = this;
  cljs.core.swap_BANG_.call(null, this__10353.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10353.method_cache, this__10353.method_table, this__10353.cached_hierarchy, this__10353.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__10354 = this;
  cljs.core.swap_BANG_.call(null, this__10354.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10354.method_cache, this__10354.method_table, this__10354.cached_hierarchy, this__10354.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__10355 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10355.cached_hierarchy), cljs.core.deref.call(null, this__10355.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__10355.method_cache, this__10355.method_table, this__10355.cached_hierarchy, this__10355.hierarchy)
  }
  var temp__3695__auto____10356 = cljs.core.deref.call(null, this__10355.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____10356)) {
    var target_fn__10357 = temp__3695__auto____10356;
    return target_fn__10357
  }else {
    var temp__3695__auto____10358 = cljs.core.find_and_cache_best_method.call(null, this__10355.name, dispatch_val, this__10355.hierarchy, this__10355.method_table, this__10355.prefer_table, this__10355.method_cache, this__10355.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____10358)) {
      var target_fn__10359 = temp__3695__auto____10358;
      return target_fn__10359
    }else {
      return cljs.core.deref.call(null, this__10355.method_table).call(null, this__10355.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10360 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10360.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__10360.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10360.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10360.method_cache, this__10360.method_table, this__10360.cached_hierarchy, this__10360.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__10361 = this;
  return cljs.core.deref.call(null, this__10361.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__10362 = this;
  return cljs.core.deref.call(null, this__10362.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__10363 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10363.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10364__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__10364 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10364__delegate.call(this, _, args)
  };
  G__10364.cljs$lang$maxFixedArity = 1;
  G__10364.cljs$lang$applyTo = function(arglist__10365) {
    var _ = cljs.core.first(arglist__10365);
    var args = cljs.core.rest(arglist__10365);
    return G__10364__delegate.call(this, _, args)
  };
  return G__10364
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
onedit.open = function open(e) {
  return goog.dom.getElement.call(null, "file").click()
};
onedit.upload = function upload(e) {
  return goog.dom.getElement.call(null, "uploading").click()
};
onedit.uploaded = function uploaded(e) {
  return goog.dom.setTextContent.call(null, goog.dom.getElement.call(null, "buffer"), goog.dom.getTextContent.call(null, goog.dom.getFrameContentDocument.call(null, goog.dom.getElement.call(null, "uploading-target"))))
};
goog.events.listen.call(null, goog.dom.getElement.call(null, "open"), goog.events.EventType.CLICK, onedit.open);
goog.events.listen.call(null, goog.dom.getElement.call(null, "file"), goog.events.EventType.CHANGE, onedit.upload);
goog.events.listen.call(null, goog.dom.getElement.call(null, "uploading-target"), goog.events.EventType.LOAD, onedit.uploaded);
