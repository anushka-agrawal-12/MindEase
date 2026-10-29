var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/postgres/cf/polyfills.js
import { EventEmitter } from "node:events";
import { Buffer as Buffer2 } from "node:buffer";
var Crypto = globalThis.crypto;
var ids = 1;
var tasks = /* @__PURE__ */ new Set();
var v4Seg = "(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])";
var v4Str = `(${v4Seg}[.]){3}${v4Seg}`;
var IPv4Reg = new RegExp(`^${v4Str}$`);
var v6Seg = "(?:[0-9a-fA-F]{1,4})";
var IPv6Reg = new RegExp(
  `^((?:${v6Seg}:){7}(?:${v6Seg}|:)|(?:${v6Seg}:){6}(?:${v4Str}|:${v6Seg}|:)|(?:${v6Seg}:){5}(?::${v4Str}|(:${v6Seg}){1,2}|:)|(?:${v6Seg}:){4}(?:(:${v6Seg}){0,1}:${v4Str}|(:${v6Seg}){1,3}|:)|(?:${v6Seg}:){3}(?:(:${v6Seg}){0,2}:${v4Str}|(:${v6Seg}){1,4}|:)|(?:${v6Seg}:){2}(?:(:${v6Seg}){0,3}:${v4Str}|(:${v6Seg}){1,5}|:)|(?:${v6Seg}:){1}(?:(:${v6Seg}){0,4}:${v4Str}|(:${v6Seg}){1,6}|:)|(?::((?::${v6Seg}){0,5}:${v4Str}|(?::${v6Seg}){1,7}|:)))(%[0-9a-zA-Z-.:]{1,})?$`
);
var textEncoder = new TextEncoder();
var crypto2 = {
  randomBytes: /* @__PURE__ */ __name((l) => Crypto.getRandomValues(Buffer2.alloc(l)), "randomBytes"),
  pbkdf2Sync: /* @__PURE__ */ __name(async (password, salt, iterations, keylen) => Crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations
    },
    await Crypto.subtle.importKey(
      "raw",
      textEncoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    ),
    keylen * 8,
    ["deriveBits"]
  ), "pbkdf2Sync"),
  createHash: /* @__PURE__ */ __name((type) => ({
    update: /* @__PURE__ */ __name((x) => ({
      digest: /* @__PURE__ */ __name((encoding) => {
        if (!(x instanceof Uint8Array)) {
          x = textEncoder.encode(x);
        }
        let prom;
        if (type === "sha256") {
          prom = Crypto.subtle.digest("SHA-256", x);
        } else if (type === "md5") {
          prom = Crypto.subtle.digest("md5", x);
        } else {
          throw Error("createHash only supports sha256 or md5 in this environment, not ${type}.");
        }
        if (encoding === "hex") {
          return prom.then((arrayBuf) => Buffer2.from(arrayBuf).toString("hex"));
        } else if (encoding) {
          throw Error(`createHash only supports hex encoding or unencoded in this environment, not ${encoding}`);
        } else {
          return prom;
        }
      }, "digest")
    }), "update")
  }), "createHash"),
  createHmac: /* @__PURE__ */ __name((type, key) => ({
    update: /* @__PURE__ */ __name((x) => ({
      digest: /* @__PURE__ */ __name(async () => Buffer2.from(
        await Crypto.subtle.sign(
          "HMAC",
          await Crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
          textEncoder.encode(x)
        )
      ), "digest")
    }), "update")
  }), "createHmac")
};
var performance = globalThis.performance;
var process = {
  env: {}
};
var os = {
  userInfo() {
    return { username: "postgres" };
  }
};
var fs = {
  readFile() {
    throw new Error("Reading files not supported on CloudFlare");
  }
};
var net = {
  isIP: /* @__PURE__ */ __name((x) => IPv4Reg.test(x) ? 4 : IPv6Reg.test(x) ? 6 : 0, "isIP"),
  Socket
};
var tls = {
  connect({ socket: tcp, servername }) {
    tcp.writer.releaseLock();
    tcp.reader.releaseLock();
    tcp.readyState = "upgrading";
    tcp.raw = tcp.raw.startTls({ servername });
    tcp.raw.closed.then(
      () => tcp.emit("close"),
      (e) => tcp.emit("error", e)
    );
    tcp.writer = tcp.raw.writable.getWriter();
    tcp.reader = tcp.raw.readable.getReader();
    tcp.writer.ready.then(() => {
      tcp.read();
      tcp.readyState = "upgrade";
    });
    return tcp;
  }
};
function Socket() {
  const tcp = Object.assign(new EventEmitter(), {
    readyState: "open",
    raw: null,
    writer: null,
    reader: null,
    connect,
    write,
    end,
    destroy,
    read
  });
  return tcp;
  async function connect(port, host) {
    try {
      tcp.readyState = "opening";
      const { connect: connect2 } = await import("cloudflare:sockets");
      tcp.raw = connect2(host + ":" + port, tcp.ssl ? { secureTransport: "starttls" } : {});
      tcp.raw.closed.then(
        () => {
          tcp.readyState !== "upgrade" ? close() : (tcp.readyState = "open", tcp.emit("secureConnect"));
        },
        (e) => tcp.emit("error", e)
      );
      tcp.writer = tcp.raw.writable.getWriter();
      tcp.reader = tcp.raw.readable.getReader();
      tcp.ssl ? readFirst() : read();
      tcp.writer.ready.then(() => {
        tcp.readyState = "open";
        tcp.emit("connect");
      });
    } catch (err2) {
      error(err2);
    }
  }
  __name(connect, "connect");
  function close() {
    if (tcp.readyState === "closed")
      return;
    tcp.readyState = "closed";
    tcp.emit("close");
  }
  __name(close, "close");
  function write(data, cb) {
    tcp.writer.write(data).then(cb, error);
    return true;
  }
  __name(write, "write");
  function end(data) {
    return data ? tcp.write(data, () => tcp.raw.close()) : tcp.raw.close();
  }
  __name(end, "end");
  function destroy() {
    tcp.destroyed = true;
    tcp.end();
  }
  __name(destroy, "destroy");
  async function read() {
    try {
      let done, value;
      while ({ done, value } = await tcp.reader.read(), !done)
        tcp.emit("data", Buffer2.from(value));
    } catch (err2) {
      error(err2);
    }
  }
  __name(read, "read");
  async function readFirst() {
    const { value } = await tcp.reader.read();
    tcp.emit("data", Buffer2.from(value));
  }
  __name(readFirst, "readFirst");
  function error(err2) {
    tcp.emit("error", err2);
    tcp.emit("close");
  }
  __name(error, "error");
}
__name(Socket, "Socket");
function setImmediate(fn) {
  const id = ids++;
  tasks.add(id);
  queueMicrotask(() => {
    if (tasks.has(id)) {
      fn();
      tasks.delete(id);
    }
  });
  return id;
}
__name(setImmediate, "setImmediate");
function clearImmediate(id) {
  tasks.delete(id);
}
__name(clearImmediate, "clearImmediate");

// node_modules/postgres/cf/src/types.js
import { Buffer as Buffer3 } from "node:buffer";

// node_modules/postgres/cf/src/query.js
var originCache = /* @__PURE__ */ new Map();
var originStackCache = /* @__PURE__ */ new Map();
var originError = /* @__PURE__ */ Symbol("OriginError");
var CLOSE = {};
var Query = class extends Promise {
  static {
    __name(this, "Query");
  }
  constructor(strings, args, handler, canceller, options = {}) {
    let resolve, reject;
    super((a, b2) => {
      resolve = a;
      reject = b2;
    });
    this.tagged = Array.isArray(strings.raw);
    this.strings = strings;
    this.args = args;
    this.handler = handler;
    this.canceller = canceller;
    this.options = options;
    this.state = null;
    this.statement = null;
    this.resolve = (x) => (this.active = false, resolve(x));
    this.reject = (x) => (this.active = false, reject(x));
    this.active = false;
    this.cancelled = null;
    this.executed = false;
    this.signature = "";
    this[originError] = this.handler.debug ? new Error() : this.tagged && cachedError(this.strings);
  }
  get origin() {
    return (this.handler.debug ? this[originError].stack : this.tagged && originStackCache.has(this.strings) ? originStackCache.get(this.strings) : originStackCache.set(this.strings, this[originError].stack).get(this.strings)) || "";
  }
  static get [Symbol.species]() {
    return Promise;
  }
  cancel() {
    return this.canceller && (this.canceller(this), this.canceller = null);
  }
  simple() {
    this.options.simple = true;
    this.options.prepare = false;
    return this;
  }
  async readable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  async writable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  cursor(rows = 1, fn) {
    this.options.simple = false;
    if (typeof rows === "function") {
      fn = rows;
      rows = 1;
    }
    this.cursorRows = rows;
    if (typeof fn === "function")
      return this.cursorFn = fn, this;
    let prev;
    return {
      [Symbol.asyncIterator]: () => ({
        next: /* @__PURE__ */ __name(() => {
          if (this.executed && !this.active)
            return { done: true };
          prev && prev();
          const promise = new Promise((resolve, reject) => {
            this.cursorFn = (value) => {
              resolve({ value, done: false });
              return new Promise((r) => prev = r);
            };
            this.resolve = () => (this.active = false, resolve({ done: true }));
            this.reject = (x) => (this.active = false, reject(x));
          });
          this.execute();
          return promise;
        }, "next"),
        return() {
          prev && prev(CLOSE);
          return { done: true };
        }
      })
    };
  }
  describe() {
    this.options.simple = false;
    this.onlyDescribe = this.options.prepare = true;
    return this;
  }
  stream() {
    throw new Error(".stream has been renamed to .forEach");
  }
  forEach(fn) {
    this.forEachFn = fn;
    this.handle();
    return this;
  }
  raw() {
    this.isRaw = true;
    return this;
  }
  values() {
    this.isRaw = "values";
    return this;
  }
  async handle() {
    !this.executed && (this.executed = true) && await 1 && this.handler(this);
  }
  execute() {
    this.handle();
    return this;
  }
  then() {
    this.handle();
    return super.then.apply(this, arguments);
  }
  catch() {
    this.handle();
    return super.catch.apply(this, arguments);
  }
  finally() {
    this.handle();
    return super.finally.apply(this, arguments);
  }
};
function cachedError(xs) {
  if (originCache.has(xs))
    return originCache.get(xs);
  const x = Error.stackTraceLimit;
  Error.stackTraceLimit = 4;
  originCache.set(xs, new Error());
  Error.stackTraceLimit = x;
  return originCache.get(xs);
}
__name(cachedError, "cachedError");

// node_modules/postgres/cf/src/errors.js
var PostgresError = class extends Error {
  static {
    __name(this, "PostgresError");
  }
  constructor(x) {
    super(x.message);
    this.name = this.constructor.name;
    Object.assign(this, x);
  }
};
var Errors = {
  connection,
  postgres,
  generic,
  notSupported
};
function connection(x, options, socket) {
  const { host, port } = socket || options;
  const error = Object.assign(
    new Error("write " + x + " " + (options.path || host + ":" + port)),
    {
      code: x,
      errno: x,
      address: options.path || host
    },
    options.path ? {} : { port }
  );
  Error.captureStackTrace(error, connection);
  return error;
}
__name(connection, "connection");
function postgres(x) {
  const error = new PostgresError(x);
  Error.captureStackTrace(error, postgres);
  return error;
}
__name(postgres, "postgres");
function generic(code, message) {
  const error = Object.assign(new Error(code + ": " + message), { code });
  Error.captureStackTrace(error, generic);
  return error;
}
__name(generic, "generic");
function notSupported(x) {
  const error = Object.assign(
    new Error(x + " (B) is not supported"),
    {
      code: "MESSAGE_NOT_SUPPORTED",
      name: x
    }
  );
  Error.captureStackTrace(error, notSupported);
  return error;
}
__name(notSupported, "notSupported");

// node_modules/postgres/cf/src/types.js
var types = {
  string: {
    to: 25,
    from: null,
    // defaults to string
    serialize: /* @__PURE__ */ __name((x) => "" + x, "serialize")
  },
  number: {
    to: 0,
    from: [21, 23, 26, 700, 701],
    serialize: /* @__PURE__ */ __name((x) => "" + x, "serialize"),
    parse: /* @__PURE__ */ __name((x) => +x, "parse")
  },
  json: {
    to: 114,
    from: [114, 3802],
    serialize: /* @__PURE__ */ __name((x) => JSON.stringify(x), "serialize"),
    parse: /* @__PURE__ */ __name((x) => JSON.parse(x), "parse")
  },
  boolean: {
    to: 16,
    from: 16,
    serialize: /* @__PURE__ */ __name((x) => x === true ? "t" : "f", "serialize"),
    parse: /* @__PURE__ */ __name((x) => x === "t", "parse")
  },
  date: {
    to: 1184,
    from: [1082, 1114, 1184],
    serialize: /* @__PURE__ */ __name((x) => (x instanceof Date ? x : new Date(x)).toISOString(), "serialize"),
    parse: /* @__PURE__ */ __name((x) => new Date(x), "parse")
  },
  bytea: {
    to: 17,
    from: 17,
    serialize: /* @__PURE__ */ __name((x) => "\\x" + Buffer3.from(x).toString("hex"), "serialize"),
    parse: /* @__PURE__ */ __name((x) => Buffer3.from(x.slice(2), "hex"), "parse")
  }
};
var NotTagged = class {
  static {
    __name(this, "NotTagged");
  }
  then() {
    notTagged();
  }
  catch() {
    notTagged();
  }
  finally() {
    notTagged();
  }
};
var Identifier = class extends NotTagged {
  static {
    __name(this, "Identifier");
  }
  constructor(value) {
    super();
    this.value = escapeIdentifier(value);
  }
};
var Parameter = class extends NotTagged {
  static {
    __name(this, "Parameter");
  }
  constructor(value, type, array) {
    super();
    this.value = value;
    this.type = type;
    this.array = array;
  }
};
var Builder = class extends NotTagged {
  static {
    __name(this, "Builder");
  }
  constructor(first, rest) {
    super();
    this.first = first;
    this.rest = rest;
  }
  build(before, parameters, types2, options) {
    const keyword = builders.map(([x, fn]) => ({ fn, i: before.search(x) })).sort((a, b2) => a.i - b2.i).pop();
    return keyword.i === -1 ? escapeIdentifiers(this.first, options) : keyword.fn(this.first, this.rest, parameters, types2, options);
  }
};
function handleValue(x, parameters, types2, options) {
  let value = x instanceof Parameter ? x.value : x;
  if (value === void 0) {
    x instanceof Parameter ? x.value = options.transform.undefined : value = x = options.transform.undefined;
    if (value === void 0)
      throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
  }
  return "$" + types2.push(
    x instanceof Parameter ? (parameters.push(x.value), x.array ? x.array[x.type || inferType(x.value)] || x.type || firstIsString(x.value) : x.type) : (parameters.push(x), inferType(x))
  );
}
__name(handleValue, "handleValue");
var defaultHandlers = typeHandlers(types);
function stringify(q, string, value, parameters, types2, options) {
  for (let i = 1; i < q.strings.length; i++) {
    string += stringifyValue(string, value, parameters, types2, options) + q.strings[i];
    value = q.args[i];
  }
  return string;
}
__name(stringify, "stringify");
function stringifyValue(string, value, parameters, types2, o) {
  return value instanceof Builder ? value.build(string, parameters, types2, o) : value instanceof Query ? fragment(value, parameters, types2, o) : value instanceof Identifier ? value.value : value && value[0] instanceof Query ? value.reduce((acc, x) => acc + " " + fragment(x, parameters, types2, o), "") : handleValue(value, parameters, types2, o);
}
__name(stringifyValue, "stringifyValue");
function fragment(q, parameters, types2, options) {
  q.fragment = true;
  return stringify(q, q.strings[0], q.args[0], parameters, types2, options);
}
__name(fragment, "fragment");
function valuesBuilder(first, parameters, types2, columns, options) {
  return first.map(
    (row) => "(" + columns.map(
      (column) => stringifyValue("values", row[column], parameters, types2, options)
    ).join(",") + ")"
  ).join(",");
}
__name(valuesBuilder, "valuesBuilder");
function values(first, rest, parameters, types2, options) {
  const multi = Array.isArray(first[0]);
  const columns = rest.length ? rest.flat() : Object.keys(multi ? first[0] : first);
  return valuesBuilder(multi ? first : [first], parameters, types2, columns, options);
}
__name(values, "values");
function select(first, rest, parameters, types2, options) {
  typeof first === "string" && (first = [first].concat(rest));
  if (Array.isArray(first))
    return escapeIdentifiers(first, options);
  let value;
  const columns = rest.length ? rest.flat() : Object.keys(first);
  return columns.map((x) => {
    value = first[x];
    return (value instanceof Query ? fragment(value, parameters, types2, options) : value instanceof Identifier ? value.value : handleValue(value, parameters, types2, options)) + " as " + escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x);
  }).join(",");
}
__name(select, "select");
var builders = Object.entries({
  values,
  in: /* @__PURE__ */ __name((...xs) => {
    const x = values(...xs);
    return x === "()" ? "(null)" : x;
  }, "in"),
  select,
  as: select,
  returning: select,
  "\\(": select,
  update(first, rest, parameters, types2, options) {
    return (rest.length ? rest.flat() : Object.keys(first)).map(
      (x) => escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x) + "=" + stringifyValue("values", first[x], parameters, types2, options)
    );
  },
  insert(first, rest, parameters, types2, options) {
    const columns = rest.length ? rest.flat() : Object.keys(Array.isArray(first) ? first[0] : first);
    return "(" + escapeIdentifiers(columns, options) + ")values" + valuesBuilder(Array.isArray(first) ? first : [first], parameters, types2, columns, options);
  }
}).map(([x, fn]) => [new RegExp("((?:^|[\\s(])" + x + "(?:$|[\\s(]))(?![\\s\\S]*\\1)", "i"), fn]);
function notTagged() {
  throw Errors.generic("NOT_TAGGED_CALL", "Query not called as a tagged template literal");
}
__name(notTagged, "notTagged");
var serializers = defaultHandlers.serializers;
var parsers = defaultHandlers.parsers;
function firstIsString(x) {
  if (Array.isArray(x))
    return firstIsString(x[0]);
  return typeof x === "string" ? 1009 : 0;
}
__name(firstIsString, "firstIsString");
var mergeUserTypes = /* @__PURE__ */ __name(function(types2) {
  const user = typeHandlers(types2 || {});
  return {
    serializers: Object.assign({}, serializers, user.serializers),
    parsers: Object.assign({}, parsers, user.parsers)
  };
}, "mergeUserTypes");
function typeHandlers(types2) {
  return Object.keys(types2).reduce((acc, k) => {
    types2[k].from && [].concat(types2[k].from).forEach((x) => acc.parsers[x] = types2[k].parse);
    if (types2[k].serialize) {
      acc.serializers[types2[k].to] = types2[k].serialize;
      types2[k].from && [].concat(types2[k].from).forEach((x) => acc.serializers[x] = types2[k].serialize);
    }
    return acc;
  }, { parsers: {}, serializers: {} });
}
__name(typeHandlers, "typeHandlers");
function escapeIdentifiers(xs, { transform: { column } }) {
  return xs.map((x) => escapeIdentifier(column.to ? column.to(x) : x)).join(",");
}
__name(escapeIdentifiers, "escapeIdentifiers");
var escapeIdentifier = /* @__PURE__ */ __name(function escape(str) {
  return '"' + str.replace(/"/g, '""').replace(/\./g, '"."') + '"';
}, "escape");
var inferType = /* @__PURE__ */ __name(function inferType2(x) {
  return x instanceof Parameter ? x.type : x instanceof Date ? 1184 : x instanceof Uint8Array ? 17 : x === true || x === false ? 16 : typeof x === "bigint" ? 20 : Array.isArray(x) ? inferType2(x[0]) : 0;
}, "inferType");
var escapeBackslash = /\\/g;
var escapeQuote = /"/g;
function arrayEscape(x) {
  return x.replace(escapeBackslash, "\\\\").replace(escapeQuote, '\\"');
}
__name(arrayEscape, "arrayEscape");
var arraySerializer = /* @__PURE__ */ __name(function arraySerializer2(xs, serializer, options, typarray) {
  if (Array.isArray(xs) === false)
    return xs;
  if (!xs.length)
    return "{}";
  const first = xs[0];
  const delimiter = typarray === 1020 ? ";" : ",";
  if (Array.isArray(first) && !first.type)
    return "{" + xs.map((x) => arraySerializer2(x, serializer, options, typarray)).join(delimiter) + "}";
  return "{" + xs.map((x) => {
    if (x === void 0) {
      x = options.transform.undefined;
      if (x === void 0)
        throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
    }
    return x === null ? "null" : '"' + arrayEscape(serializer ? serializer(x.type ? x.value : x) : "" + x) + '"';
  }).join(delimiter) + "}";
}, "arraySerializer");
var arrayParserState = {
  i: 0,
  char: null,
  str: "",
  quoted: false,
  last: 0
};
var arrayParser = /* @__PURE__ */ __name(function arrayParser2(x, parser, typarray) {
  arrayParserState.i = arrayParserState.last = 0;
  return arrayParserLoop(arrayParserState, x, parser, typarray);
}, "arrayParser");
function arrayParserLoop(s, x, parser, typarray) {
  const xs = [];
  const delimiter = typarray === 1020 ? ";" : ",";
  for (; s.i < x.length; s.i++) {
    s.char = x[s.i];
    if (s.quoted) {
      if (s.char === "\\") {
        s.str += x[++s.i];
      } else if (s.char === '"') {
        xs.push(parser ? parser(s.str) : s.str);
        s.str = "";
        s.quoted = x[s.i + 1] === '"';
        s.last = s.i + 2;
      } else {
        s.str += s.char;
      }
    } else if (s.char === '"') {
      s.quoted = true;
    } else if (s.char === "{") {
      s.last = ++s.i;
      xs.push(arrayParserLoop(s, x, parser, typarray));
    } else if (s.char === "}") {
      s.quoted = false;
      s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
      break;
    } else if (s.char === delimiter && s.p !== "}" && s.p !== '"') {
      xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
    }
    s.p = s.char;
  }
  s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i + 1)) : x.slice(s.last, s.i + 1));
  return xs;
}
__name(arrayParserLoop, "arrayParserLoop");
var toCamel = /* @__PURE__ */ __name((x) => {
  let str = x[0];
  for (let i = 1; i < x.length; i++)
    str += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str;
}, "toCamel");
var toPascal = /* @__PURE__ */ __name((x) => {
  let str = x[0].toUpperCase();
  for (let i = 1; i < x.length; i++)
    str += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str;
}, "toPascal");
var toKebab = /* @__PURE__ */ __name((x) => x.replace(/_/g, "-"), "toKebab");
var fromCamel = /* @__PURE__ */ __name((x) => x.replace(/([A-Z])/g, "_$1").toLowerCase(), "fromCamel");
var fromPascal = /* @__PURE__ */ __name((x) => (x.slice(0, 1) + x.slice(1).replace(/([A-Z])/g, "_$1")).toLowerCase(), "fromPascal");
var fromKebab = /* @__PURE__ */ __name((x) => x.replace(/-/g, "_"), "fromKebab");
function createJsonTransform(fn) {
  return /* @__PURE__ */ __name(function jsonTransform(x, column) {
    return typeof x === "object" && x !== null && (column.type === 114 || column.type === 3802) ? Array.isArray(x) ? x.map((x2) => jsonTransform(x2, column)) : Object.entries(x).reduce((acc, [k, v]) => Object.assign(acc, { [fn(k)]: jsonTransform(v, column) }), {}) : x;
  }, "jsonTransform");
}
__name(createJsonTransform, "createJsonTransform");
toCamel.column = { from: toCamel };
toCamel.value = { from: createJsonTransform(toCamel) };
fromCamel.column = { to: fromCamel };
var camel = { ...toCamel };
camel.column.to = fromCamel;
toPascal.column = { from: toPascal };
toPascal.value = { from: createJsonTransform(toPascal) };
fromPascal.column = { to: fromPascal };
var pascal = { ...toPascal };
pascal.column.to = fromPascal;
toKebab.column = { from: toKebab };
toKebab.value = { from: createJsonTransform(toKebab) };
fromKebab.column = { to: fromKebab };
var kebab = { ...toKebab };
kebab.column.to = fromKebab;

// node_modules/postgres/cf/src/connection.js
import { Buffer as Buffer5 } from "node:buffer";
import Stream from "node:stream";

// node_modules/postgres/cf/src/result.js
var Result = class extends Array {
  static {
    __name(this, "Result");
  }
  constructor() {
    super();
    Object.defineProperties(this, {
      count: { value: null, writable: true },
      state: { value: null, writable: true },
      command: { value: null, writable: true },
      columns: { value: null, writable: true },
      statement: { value: null, writable: true }
    });
  }
  static get [Symbol.species]() {
    return Array;
  }
};

// node_modules/postgres/cf/src/queue.js
var queue_default = Queue;
function Queue(initial = []) {
  let xs = initial.slice();
  let index = 0;
  return {
    get length() {
      return xs.length - index;
    },
    remove: /* @__PURE__ */ __name((x) => {
      const index2 = xs.indexOf(x);
      return index2 === -1 ? null : (xs.splice(index2, 1), x);
    }, "remove"),
    push: /* @__PURE__ */ __name((x) => (xs.push(x), x), "push"),
    shift: /* @__PURE__ */ __name(() => {
      const out = xs[index++];
      if (index === xs.length) {
        index = 0;
        xs = [];
      } else {
        xs[index - 1] = void 0;
      }
      return out;
    }, "shift")
  };
}
__name(Queue, "Queue");

// node_modules/postgres/cf/src/bytes.js
import { Buffer as Buffer4 } from "node:buffer";
var size = 256;
var buffer = Buffer4.allocUnsafe(size);
var messages = "BCcDdEFfHPpQSX".split("").reduce((acc, x) => {
  const v = x.charCodeAt(0);
  acc[x] = () => {
    buffer[0] = v;
    b.i = 5;
    return b;
  };
  return acc;
}, {});
var b = Object.assign(reset, messages, {
  N: String.fromCharCode(0),
  i: 0,
  inc(x) {
    b.i += x;
    return b;
  },
  str(x) {
    const length = Buffer4.byteLength(x);
    fit(length);
    b.i += buffer.write(x, b.i, length, "utf8");
    return b;
  },
  i16(x) {
    fit(2);
    buffer.writeUInt16BE(x, b.i);
    b.i += 2;
    return b;
  },
  i32(x, i) {
    if (i || i === 0) {
      buffer.writeUInt32BE(x, i);
      return b;
    }
    fit(4);
    buffer.writeUInt32BE(x, b.i);
    b.i += 4;
    return b;
  },
  z(x) {
    fit(x);
    buffer.fill(0, b.i, b.i + x);
    b.i += x;
    return b;
  },
  raw(x) {
    buffer = Buffer4.concat([buffer.subarray(0, b.i), x]);
    b.i = buffer.length;
    return b;
  },
  end(at = 1) {
    buffer.writeUInt32BE(b.i - at, at);
    const out = buffer.subarray(0, b.i);
    b.i = 0;
    buffer = Buffer4.allocUnsafe(size);
    return out;
  }
});
var bytes_default = b;
function fit(x) {
  if (buffer.length - b.i < x) {
    const prev = buffer, length = prev.length;
    buffer = Buffer4.allocUnsafe(length + (length >> 1) + x);
    prev.copy(buffer);
  }
}
__name(fit, "fit");
function reset() {
  b.i = 0;
  return b;
}
__name(reset, "reset");

// node_modules/postgres/cf/src/connection.js
var connection_default = Connection;
var uid = 1;
var Sync = bytes_default().S().end();
var Flush = bytes_default().H().end();
var SSLRequest = bytes_default().i32(8).i32(80877103).end(8);
var ExecuteUnnamed = Buffer5.concat([bytes_default().E().str(bytes_default.N).i32(0).end(), Sync]);
var DescribeUnnamed = bytes_default().D().str("S").str(bytes_default.N).end();
var noop = /* @__PURE__ */ __name(() => {
}, "noop");
var retryRoutines = /* @__PURE__ */ new Set([
  "FetchPreparedStatement",
  "RevalidateCachedQuery",
  "transformAssignedExpr"
]);
var errorFields = {
  83: "severity_local",
  // S
  86: "severity",
  // V
  67: "code",
  // C
  77: "message",
  // M
  68: "detail",
  // D
  72: "hint",
  // H
  80: "position",
  // P
  112: "internal_position",
  // p
  113: "internal_query",
  // q
  87: "where",
  // W
  115: "schema_name",
  // s
  116: "table_name",
  // t
  99: "column_name",
  // c
  100: "data type_name",
  // d
  110: "constraint_name",
  // n
  70: "file",
  // F
  76: "line",
  // L
  82: "routine"
  // R
};
function Connection(options, queues = {}, { onopen = noop, onend = noop, onclose = noop } = {}) {
  const {
    sslnegotiation,
    ssl,
    max,
    user,
    host,
    port,
    database,
    parsers: parsers2,
    transform,
    onnotice,
    onnotify,
    onparameter,
    max_pipeline,
    keep_alive,
    backoff: backoff2,
    target_session_attrs
  } = options;
  const sent = queue_default(), id = uid++, backend = { pid: null, secret: null }, idleTimer = timer(end, options.idle_timeout), lifeTimer = timer(end, options.max_lifetime), connectTimer = timer(connectTimedOut, options.connect_timeout);
  let socket = null, cancelMessage, errorResponse = null, result = new Result(), incoming = Buffer5.alloc(0), needsTypes = options.fetch_types, backendParameters = {}, statements = {}, statementId = Math.random().toString(36).slice(2), statementCount = 1, closedTime = 0, remaining = 0, hostIndex = 0, retries = 0, length = 0, delay = 0, rows = 0, serverSignature = null, nextWriteTimer = null, terminated = false, incomings = null, results = null, initial = null, ending = null, stream = null, chunk = null, ended = null, nonce = null, query = null, final = null;
  const connection2 = {
    queue: queues.closed,
    idleTimer,
    connect(query2) {
      initial = query2;
      reconnect();
    },
    terminate,
    execute,
    cancel,
    end,
    count: 0,
    id
  };
  queues.closed && queues.closed.push(connection2);
  return connection2;
  async function createSocket() {
    let x;
    try {
      x = options.socket ? await Promise.resolve(options.socket(options)) : new net.Socket();
    } catch (e) {
      error(e);
      return;
    }
    x.on("error", error);
    x.on("close", closed);
    x.on("drain", drain);
    return x;
  }
  __name(createSocket, "createSocket");
  async function cancel({ pid, secret }, resolve, reject) {
    try {
      cancelMessage = bytes_default().i32(16).i32(80877102).i32(pid).i32(secret).end(16);
      await connect();
      socket.once("error", reject);
      socket.once("close", resolve);
    } catch (error2) {
      reject(error2);
    }
  }
  __name(cancel, "cancel");
  function execute(q) {
    if (terminated)
      return queryError(q, Errors.connection("CONNECTION_DESTROYED", options));
    if (stream)
      return queryError(q, Errors.generic("COPY_IN_PROGRESS", "You cannot execute queries during copy"));
    if (q.cancelled)
      return;
    try {
      q.state = backend;
      query ? sent.push(q) : (query = q, query.active = true);
      build(q);
      return write(toBuffer(q)) && !q.describeFirst && !q.cursorFn && sent.length < max_pipeline && (!q.options.onexecute || q.options.onexecute(connection2));
    } catch (error2) {
      sent.length === 0 && write(Sync);
      errored(error2);
      return true;
    }
  }
  __name(execute, "execute");
  function toBuffer(q) {
    if (q.parameters.length >= 65534)
      throw Errors.generic("MAX_PARAMETERS_EXCEEDED", "Max number of parameters (65534) exceeded");
    return q.options.simple ? bytes_default().Q().str(q.statement.string + bytes_default.N).end() : q.describeFirst ? Buffer5.concat([describe(q), Flush]) : q.prepare ? q.prepared ? prepared(q) : Buffer5.concat([describe(q), prepared(q)]) : unnamed(q);
  }
  __name(toBuffer, "toBuffer");
  function describe(q) {
    return Buffer5.concat([
      Parse(q.statement.string, q.parameters, q.statement.types, q.statement.name),
      Describe("S", q.statement.name)
    ]);
  }
  __name(describe, "describe");
  function prepared(q) {
    return Buffer5.concat([
      Bind(q.parameters, q.statement.types, q.statement.name, q.cursorName),
      q.cursorFn ? Execute("", q.cursorRows) : ExecuteUnnamed
    ]);
  }
  __name(prepared, "prepared");
  function unnamed(q) {
    return Buffer5.concat([
      Parse(q.statement.string, q.parameters, q.statement.types),
      DescribeUnnamed,
      prepared(q)
    ]);
  }
  __name(unnamed, "unnamed");
  function build(q) {
    const parameters = [], types2 = [];
    const string = stringify(q, q.strings[0], q.args[0], parameters, types2, options);
    !q.tagged && q.args.forEach((x) => handleValue(x, parameters, types2, options));
    q.prepare = options.prepare && ("prepare" in q.options ? q.options.prepare : true);
    q.string = string;
    q.signature = q.prepare && types2 + string;
    q.onlyDescribe && delete statements[q.signature];
    q.parameters = q.parameters || parameters;
    q.prepared = q.prepare && q.signature in statements;
    q.describeFirst = q.onlyDescribe || parameters.length && !q.prepared;
    q.statement = q.prepared ? statements[q.signature] : { string, types: types2, name: q.prepare ? statementId + statementCount++ : "" };
    typeof options.debug === "function" && options.debug(id, string, parameters, types2);
  }
  __name(build, "build");
  function write(x, fn) {
    chunk = chunk ? Buffer5.concat([chunk, x]) : Buffer5.from(x);
    if (fn || chunk.length >= 1024)
      return nextWrite(fn);
    nextWriteTimer === null && (nextWriteTimer = setImmediate(nextWrite));
    return true;
  }
  __name(write, "write");
  function nextWrite(fn) {
    const x = socket.write(chunk, fn);
    nextWriteTimer !== null && clearImmediate(nextWriteTimer);
    chunk = nextWriteTimer = null;
    return x;
  }
  __name(nextWrite, "nextWrite");
  function connectTimedOut() {
    errored(Errors.connection("CONNECT_TIMEOUT", options, socket));
    socket.destroy();
  }
  __name(connectTimedOut, "connectTimedOut");
  async function secure() {
    if (sslnegotiation !== "direct") {
      write(SSLRequest);
      const canSSL = await new Promise((r) => socket.once("data", (x) => r(x[0] === 83)));
      if (!canSSL && ssl === "prefer")
        return connected();
    }
    const options2 = {
      socket,
      servername: net.isIP(socket.host) ? void 0 : socket.host
    };
    if (sslnegotiation === "direct")
      options2.ALPNProtocols = ["postgresql"];
    if (ssl === "require" || ssl === "allow" || ssl === "prefer")
      options2.rejectUnauthorized = false;
    else if (typeof ssl === "object")
      Object.assign(options2, ssl);
    socket.removeAllListeners();
    socket = tls.connect(options2);
    socket.on("secureConnect", connected);
    socket.on("error", error);
    socket.on("close", closed);
    socket.on("drain", drain);
  }
  __name(secure, "secure");
  function drain() {
    !query && onopen(connection2);
  }
  __name(drain, "drain");
  function data(x) {
    if (incomings) {
      incomings.push(x);
      remaining -= x.length;
      if (remaining > 0)
        return;
    }
    incoming = incomings ? Buffer5.concat(incomings, length - remaining) : incoming.length === 0 ? x : Buffer5.concat([incoming, x], incoming.length + x.length);
    while (incoming.length > 4) {
      length = incoming.readUInt32BE(1);
      if (length >= incoming.length) {
        remaining = length - incoming.length;
        incomings = [incoming];
        break;
      }
      try {
        handle2(incoming.subarray(0, length + 1));
      } catch (e) {
        query && (query.cursorFn || query.describeFirst) && write(Sync);
        errored(e);
      }
      incoming = incoming.subarray(length + 1);
      remaining = 0;
      incomings = null;
    }
  }
  __name(data, "data");
  async function connect() {
    terminated = false;
    backendParameters = {};
    socket || (socket = await createSocket());
    if (!socket)
      return;
    connectTimer.start();
    if (options.socket)
      return ssl ? secure() : connected();
    socket.on("connect", ssl ? secure : connected);
    if (options.path)
      return socket.connect(options.path);
    socket.ssl = ssl;
    socket.connect(port[hostIndex], host[hostIndex]);
    socket.host = host[hostIndex];
    socket.port = port[hostIndex];
    hostIndex = (hostIndex + 1) % port.length;
  }
  __name(connect, "connect");
  function reconnect() {
    setTimeout(connect, closedTime ? Math.max(0, closedTime + delay - performance.now()) : 0);
  }
  __name(reconnect, "reconnect");
  function connected() {
    try {
      statements = {};
      needsTypes = options.fetch_types;
      statementId = Math.random().toString(36).slice(2);
      statementCount = 1;
      lifeTimer.start();
      socket.on("data", data);
      keep_alive && socket.setKeepAlive && socket.setKeepAlive(true, 1e3 * keep_alive);
      const s = StartupMessage();
      write(s);
    } catch (err2) {
      error(err2);
    }
  }
  __name(connected, "connected");
  function error(err2) {
    if (connection2.queue === queues.connecting && options.host[retries + 1])
      return;
    errored(err2);
    while (sent.length)
      queryError(sent.shift(), err2);
  }
  __name(error, "error");
  function errored(err2) {
    stream && (stream.destroy(err2), stream = null);
    query && queryError(query, err2);
    initial && (queryError(initial, err2), initial = null);
  }
  __name(errored, "errored");
  function queryError(query2, err2) {
    if (query2.reserve)
      return query2.reject(err2);
    if (!err2 || typeof err2 !== "object")
      err2 = new Error(err2);
    "query" in err2 || "parameters" in err2 || Object.defineProperties(err2, {
      stack: { value: err2.stack + query2.origin.replace(/.*\n/, "\n"), enumerable: options.debug },
      query: { value: query2.string, enumerable: options.debug },
      parameters: { value: query2.parameters, enumerable: options.debug },
      args: { value: query2.args, enumerable: options.debug },
      types: { value: query2.statement && query2.statement.types, enumerable: options.debug }
    });
    query2.reject(err2);
  }
  __name(queryError, "queryError");
  function end() {
    return ending || (!connection2.reserved && onend(connection2), !connection2.reserved && !initial && !query && sent.length === 0 ? (terminate(), new Promise((r) => socket && socket.readyState !== "closed" ? socket.once("close", r) : r())) : ending = new Promise((r) => ended = r));
  }
  __name(end, "end");
  function terminate() {
    terminated = true;
    if (stream || query || initial || sent.length)
      error(Errors.connection("CONNECTION_DESTROYED", options));
    clearImmediate(nextWriteTimer);
    if (socket) {
      socket.removeListener("data", data);
      socket.removeListener("connect", connected);
      socket.readyState === "open" && socket.end(bytes_default().X().end());
    }
    ended && (ended(), ending = ended = null);
  }
  __name(terminate, "terminate");
  async function closed(hadError) {
    incoming = Buffer5.alloc(0);
    remaining = 0;
    incomings = null;
    clearImmediate(nextWriteTimer);
    socket.removeListener("data", data);
    socket.removeListener("connect", connected);
    idleTimer.cancel();
    lifeTimer.cancel();
    connectTimer.cancel();
    socket.removeAllListeners();
    socket = null;
    if (initial)
      return reconnect();
    !hadError && (query || sent.length) && error(Errors.connection("CONNECTION_CLOSED", options, socket));
    closedTime = performance.now();
    hadError && options.shared.retries++;
    delay = (typeof backoff2 === "function" ? backoff2(options.shared.retries) : backoff2) * 1e3;
    onclose(connection2, Errors.connection("CONNECTION_CLOSED", options, socket));
  }
  __name(closed, "closed");
  function handle2(xs, x = xs[0]) {
    (x === 68 ? DataRow : (
      // D
      x === 100 ? CopyData : (
        // d
        x === 65 ? NotificationResponse : (
          // A
          x === 83 ? ParameterStatus : (
            // S
            x === 90 ? ReadyForQuery : (
              // Z
              x === 67 ? CommandComplete : (
                // C
                x === 50 ? BindComplete : (
                  // 2
                  x === 49 ? ParseComplete : (
                    // 1
                    x === 116 ? ParameterDescription : (
                      // t
                      x === 84 ? RowDescription : (
                        // T
                        x === 82 ? Authentication : (
                          // R
                          x === 110 ? NoData : (
                            // n
                            x === 75 ? BackendKeyData : (
                              // K
                              x === 69 ? ErrorResponse : (
                                // E
                                x === 115 ? PortalSuspended : (
                                  // s
                                  x === 51 ? CloseComplete : (
                                    // 3
                                    x === 71 ? CopyInResponse : (
                                      // G
                                      x === 78 ? NoticeResponse : (
                                        // N
                                        x === 72 ? CopyOutResponse : (
                                          // H
                                          x === 99 ? CopyDone : (
                                            // c
                                            x === 73 ? EmptyQueryResponse : (
                                              // I
                                              x === 86 ? FunctionCallResponse : (
                                                // V
                                                x === 118 ? NegotiateProtocolVersion : (
                                                  // v
                                                  x === 87 ? CopyBothResponse : (
                                                    // W
                                                    /* c8 ignore next */
                                                    UnknownMessage
                                                  )
                                                )
                                              )
                                            )
                                          )
                                        )
                                      )
                                    )
                                  )
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    ))(xs);
  }
  __name(handle2, "handle");
  function DataRow(x) {
    let index = 7;
    let length2;
    let column;
    let value;
    const row = query.isRaw ? new Array(query.statement.columns.length) : {};
    for (let i = 0; i < query.statement.columns.length; i++) {
      column = query.statement.columns[i];
      length2 = x.readInt32BE(index);
      index += 4;
      value = length2 === -1 ? null : query.isRaw === true ? x.subarray(index, index += length2) : column.parser === void 0 ? x.toString("utf8", index, index += length2) : column.parser.array === true ? column.parser(x.toString("utf8", index + 1, index += length2)) : column.parser(x.toString("utf8", index, index += length2));
      query.isRaw ? row[i] = query.isRaw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
    }
    query.forEachFn ? query.forEachFn(transform.row.from ? transform.row.from(row) : row, result) : result[rows++] = transform.row.from ? transform.row.from(row) : row;
  }
  __name(DataRow, "DataRow");
  function ParameterStatus(x) {
    const [k, v] = x.toString("utf8", 5, x.length - 1).split(bytes_default.N);
    backendParameters[k] = v;
    if (options.parameters[k] !== v) {
      options.parameters[k] = v;
      onparameter && onparameter(k, v);
    }
  }
  __name(ParameterStatus, "ParameterStatus");
  function ReadyForQuery(x) {
    if (query) {
      if (errorResponse) {
        query.retried ? errored(query.retried) : query.prepared && retryRoutines.has(errorResponse.routine) ? retry(query, errorResponse) : errored(errorResponse);
      } else {
        query.resolve(results || result);
      }
    } else if (errorResponse) {
      errored(errorResponse);
    }
    query = results = errorResponse = null;
    result = new Result();
    connectTimer.cancel();
    if (initial) {
      if (target_session_attrs) {
        if (!backendParameters.in_hot_standby || !backendParameters.default_transaction_read_only)
          return fetchState();
        else if (tryNext(target_session_attrs, backendParameters))
          return terminate();
      }
      if (needsTypes) {
        initial.reserve && (initial = null);
        return fetchArrayTypes();
      }
      initial && !initial.reserve && execute(initial);
      options.shared.retries = retries = 0;
      initial = null;
      return;
    }
    while (sent.length && (query = sent.shift()) && (query.active = true, query.cancelled))
      Connection(options).cancel(query.state, query.cancelled.resolve, query.cancelled.reject);
    if (query)
      return;
    connection2.reserved ? !connection2.reserved.release && x[5] === 73 ? ending ? terminate() : (connection2.reserved = null, onopen(connection2)) : connection2.reserved() : ending ? terminate() : onopen(connection2);
  }
  __name(ReadyForQuery, "ReadyForQuery");
  function CommandComplete(x) {
    rows = 0;
    for (let i = x.length - 1; i > 0; i--) {
      if (x[i] === 32 && x[i + 1] < 58 && result.count === null)
        result.count = +x.toString("utf8", i + 1, x.length - 1);
      if (x[i - 1] >= 65) {
        result.command = x.toString("utf8", 5, i);
        result.state = backend;
        break;
      }
    }
    final && (final(), final = null);
    if (result.command === "BEGIN" && max !== 1 && !connection2.reserved)
      return errored(Errors.generic("UNSAFE_TRANSACTION", "Only use sql.begin, sql.reserved or max: 1"));
    if (query.options.simple)
      return BindComplete();
    if (query.cursorFn) {
      result.count && query.cursorFn(result);
      write(Sync);
    }
  }
  __name(CommandComplete, "CommandComplete");
  function ParseComplete() {
    query.parsing = false;
  }
  __name(ParseComplete, "ParseComplete");
  function BindComplete() {
    !result.statement && (result.statement = query.statement);
    result.columns = query.statement.columns;
  }
  __name(BindComplete, "BindComplete");
  function ParameterDescription(x) {
    const length2 = x.readUInt16BE(5);
    for (let i = 0; i < length2; ++i)
      !query.statement.types[i] && (query.statement.types[i] = x.readUInt32BE(7 + i * 4));
    query.prepare && (statements[query.signature] = query.statement);
    query.describeFirst && !query.onlyDescribe && (write(prepared(query)), query.describeFirst = false);
  }
  __name(ParameterDescription, "ParameterDescription");
  function RowDescription(x) {
    if (result.command) {
      results = results || [result];
      results.push(result = new Result());
      result.count = null;
      query.statement.columns = null;
    }
    const length2 = x.readUInt16BE(5);
    let index = 7;
    let start;
    query.statement.columns = Array(length2);
    for (let i = 0; i < length2; ++i) {
      start = index;
      while (x[index++] !== 0) ;
      const table = x.readUInt32BE(index);
      const number = x.readUInt16BE(index + 4);
      const type = x.readUInt32BE(index + 6);
      query.statement.columns[i] = {
        name: transform.column.from ? transform.column.from(x.toString("utf8", start, index - 1)) : x.toString("utf8", start, index - 1),
        parser: parsers2[type],
        table,
        number,
        type
      };
      index += 18;
    }
    result.statement = query.statement;
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  __name(RowDescription, "RowDescription");
  async function Authentication(x, type = x.readUInt32BE(5)) {
    (type === 3 ? AuthenticationCleartextPassword : type === 5 ? AuthenticationMD5Password : type === 10 ? SASL : type === 11 ? SASLContinue : type === 12 ? SASLFinal : type !== 0 ? UnknownAuth : noop)(x, type);
  }
  __name(Authentication, "Authentication");
  async function AuthenticationCleartextPassword() {
    const payload = await Pass();
    write(
      bytes_default().p().str(payload).z(1).end()
    );
  }
  __name(AuthenticationCleartextPassword, "AuthenticationCleartextPassword");
  async function AuthenticationMD5Password(x) {
    const payload = "md5" + await md5(
      Buffer5.concat([
        Buffer5.from(await md5(await Pass() + user)),
        x.subarray(9)
      ])
    );
    write(
      bytes_default().p().str(payload).z(1).end()
    );
  }
  __name(AuthenticationMD5Password, "AuthenticationMD5Password");
  async function SASL() {
    nonce = (await crypto2.randomBytes(18)).toString("base64");
    bytes_default().p().str("SCRAM-SHA-256" + bytes_default.N);
    const i = bytes_default.i;
    write(bytes_default.inc(4).str("n,,n=*,r=" + nonce).i32(bytes_default.i - i - 4, i).end());
  }
  __name(SASL, "SASL");
  async function SASLContinue(x) {
    const res = x.toString("utf8", 9).split(",").reduce((acc, x2) => (acc[x2[0]] = x2.slice(2), acc), {});
    const saltedPassword = await crypto2.pbkdf2Sync(
      await Pass(),
      Buffer5.from(res.s, "base64"),
      parseInt(res.i),
      32,
      "sha256"
    );
    const clientKey = await hmac(saltedPassword, "Client Key");
    const auth = "n=*,r=" + nonce + ",r=" + res.r + ",s=" + res.s + ",i=" + res.i + ",c=biws,r=" + res.r;
    serverSignature = (await hmac(await hmac(saltedPassword, "Server Key"), auth)).toString("base64");
    const payload = "c=biws,r=" + res.r + ",p=" + xor(
      clientKey,
      Buffer5.from(await hmac(await sha256(clientKey), auth))
    ).toString("base64");
    write(
      bytes_default().p().str(payload).end()
    );
  }
  __name(SASLContinue, "SASLContinue");
  function SASLFinal(x) {
    if (x.toString("utf8", 9).split(bytes_default.N, 1)[0].slice(2) === serverSignature)
      return;
    errored(Errors.generic("SASL_SIGNATURE_MISMATCH", "The server did not return the correct signature"));
    socket.destroy();
  }
  __name(SASLFinal, "SASLFinal");
  function Pass() {
    return Promise.resolve(
      typeof options.pass === "function" ? options.pass() : options.pass
    );
  }
  __name(Pass, "Pass");
  function NoData() {
    result.statement = query.statement;
    result.statement.columns = [];
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  __name(NoData, "NoData");
  function BackendKeyData(x) {
    backend.pid = x.readUInt32BE(5);
    backend.secret = x.readUInt32BE(9);
  }
  __name(BackendKeyData, "BackendKeyData");
  async function fetchArrayTypes() {
    needsTypes = false;
    const types2 = await new Query([`
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b on b.oid = a.typelem
      where a.typcategory = 'A'
      group by b.oid, b.typarray
      order by b.oid
    `], [], execute);
    types2.forEach(({ oid, typarray }) => addArrayType(oid, typarray));
  }
  __name(fetchArrayTypes, "fetchArrayTypes");
  function addArrayType(oid, typarray) {
    if (!!options.parsers[typarray] && !!options.serializers[typarray]) return;
    const parser = options.parsers[oid];
    options.shared.typeArrayMap[oid] = typarray;
    options.parsers[typarray] = (xs) => arrayParser(xs, parser, typarray);
    options.parsers[typarray].array = true;
    options.serializers[typarray] = (xs) => arraySerializer(xs, options.serializers[oid], options, typarray);
  }
  __name(addArrayType, "addArrayType");
  function tryNext(x, xs) {
    return x === "read-write" && xs.default_transaction_read_only === "on" || x === "read-only" && xs.default_transaction_read_only === "off" || x === "primary" && xs.in_hot_standby === "on" || x === "standby" && xs.in_hot_standby === "off" || x === "prefer-standby" && xs.in_hot_standby === "off" && options.host[retries];
  }
  __name(tryNext, "tryNext");
  function fetchState() {
    const query2 = new Query([`
      show transaction_read_only;
      select pg_catalog.pg_is_in_recovery()
    `], [], execute, null, { simple: true });
    query2.resolve = ([[a], [b2]]) => {
      backendParameters.default_transaction_read_only = a.transaction_read_only;
      backendParameters.in_hot_standby = b2.pg_is_in_recovery ? "on" : "off";
    };
    query2.execute();
  }
  __name(fetchState, "fetchState");
  function ErrorResponse(x) {
    if (query) {
      (query.cursorFn || query.describeFirst) && write(Sync);
      errorResponse = Errors.postgres(parseError(x));
    } else {
      errored(Errors.postgres(parseError(x)));
    }
  }
  __name(ErrorResponse, "ErrorResponse");
  function retry(q, error2) {
    delete statements[q.signature];
    q.retried = error2;
    execute(q);
  }
  __name(retry, "retry");
  function NotificationResponse(x) {
    if (!onnotify)
      return;
    let index = 9;
    while (x[index++] !== 0) ;
    onnotify(
      x.toString("utf8", 9, index - 1),
      x.toString("utf8", index, x.length - 1)
    );
  }
  __name(NotificationResponse, "NotificationResponse");
  async function PortalSuspended() {
    try {
      const x = await Promise.resolve(query.cursorFn(result));
      rows = 0;
      x === CLOSE ? write(Close(query.portal)) : (result = new Result(), write(Execute("", query.cursorRows)));
    } catch (err2) {
      write(Sync);
      query.reject(err2);
    }
  }
  __name(PortalSuspended, "PortalSuspended");
  function CloseComplete() {
    result.count && query.cursorFn(result);
    query.resolve(result);
  }
  __name(CloseComplete, "CloseComplete");
  function CopyInResponse() {
    stream = new Stream.Writable({
      autoDestroy: true,
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
        stream = null;
      }
    });
    query.resolve(stream);
  }
  __name(CopyInResponse, "CopyInResponse");
  function CopyOutResponse() {
    stream = new Stream.Readable({
      read() {
        socket.resume();
      }
    });
    query.resolve(stream);
  }
  __name(CopyOutResponse, "CopyOutResponse");
  function CopyBothResponse() {
    stream = new Stream.Duplex({
      autoDestroy: true,
      read() {
        socket.resume();
      },
      /* c8 ignore next 11 */
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
      }
    });
    query.resolve(stream);
  }
  __name(CopyBothResponse, "CopyBothResponse");
  function CopyData(x) {
    stream && (stream.push(x.subarray(5)) || socket.pause());
  }
  __name(CopyData, "CopyData");
  function CopyDone() {
    stream && stream.push(null);
    stream = null;
  }
  __name(CopyDone, "CopyDone");
  function NoticeResponse(x) {
    onnotice ? onnotice(parseError(x)) : console.log(parseError(x));
  }
  __name(NoticeResponse, "NoticeResponse");
  function EmptyQueryResponse() {
  }
  __name(EmptyQueryResponse, "EmptyQueryResponse");
  function FunctionCallResponse() {
    errored(Errors.notSupported("FunctionCallResponse"));
  }
  __name(FunctionCallResponse, "FunctionCallResponse");
  function NegotiateProtocolVersion() {
    errored(Errors.notSupported("NegotiateProtocolVersion"));
  }
  __name(NegotiateProtocolVersion, "NegotiateProtocolVersion");
  function UnknownMessage(x) {
    console.error("Postgres.js : Unknown Message:", x[0]);
  }
  __name(UnknownMessage, "UnknownMessage");
  function UnknownAuth(x, type) {
    console.error("Postgres.js : Unknown Auth:", type);
  }
  __name(UnknownAuth, "UnknownAuth");
  function Bind(parameters, types2, statement = "", portal = "") {
    let prev, type;
    bytes_default().B().str(portal + bytes_default.N).str(statement + bytes_default.N).i16(0).i16(parameters.length);
    parameters.forEach((x, i) => {
      if (x === null)
        return bytes_default.i32(4294967295);
      type = types2[i];
      parameters[i] = x = type in options.serializers ? options.serializers[type](x) : "" + x;
      prev = bytes_default.i;
      bytes_default.inc(4).str(x).i32(bytes_default.i - prev - 4, prev);
    });
    bytes_default.i16(0);
    return bytes_default.end();
  }
  __name(Bind, "Bind");
  function Parse(str, parameters, types2, name = "") {
    bytes_default().P().str(name + bytes_default.N).str(str + bytes_default.N).i16(parameters.length);
    parameters.forEach((x, i) => bytes_default.i32(types2[i] || 0));
    return bytes_default.end();
  }
  __name(Parse, "Parse");
  function Describe(x, name = "") {
    return bytes_default().D().str(x).str(name + bytes_default.N).end();
  }
  __name(Describe, "Describe");
  function Execute(portal = "", rows2 = 0) {
    return Buffer5.concat([
      bytes_default().E().str(portal + bytes_default.N).i32(rows2).end(),
      Flush
    ]);
  }
  __name(Execute, "Execute");
  function Close(portal = "") {
    return Buffer5.concat([
      bytes_default().C().str("P").str(portal + bytes_default.N).end(),
      bytes_default().S().end()
    ]);
  }
  __name(Close, "Close");
  function StartupMessage() {
    return cancelMessage || bytes_default().inc(4).i16(3).z(2).str(
      Object.entries(Object.assign(
        {
          user,
          database,
          client_encoding: "UTF8"
        },
        options.connection
      )).filter(([, v]) => v).map(([k, v]) => k + bytes_default.N + v).join(bytes_default.N)
    ).z(2).end(0);
  }
  __name(StartupMessage, "StartupMessage");
}
__name(Connection, "Connection");
function parseError(x) {
  const error = {};
  let start = 5;
  for (let i = 5; i < x.length - 1; i++) {
    if (x[i] === 0) {
      error[errorFields[x[start]]] = x.toString("utf8", start + 1, i);
      start = i + 1;
    }
  }
  return error;
}
__name(parseError, "parseError");
function md5(x) {
  return crypto2.createHash("md5").update(x).digest("hex");
}
__name(md5, "md5");
function hmac(key, x) {
  return crypto2.createHmac("sha256", key).update(x).digest();
}
__name(hmac, "hmac");
function sha256(x) {
  return crypto2.createHash("sha256").update(x).digest();
}
__name(sha256, "sha256");
function xor(a, b2) {
  const length = Math.max(a.length, b2.length);
  const buffer2 = Buffer5.allocUnsafe(length);
  for (let i = 0; i < length; i++)
    buffer2[i] = a[i] ^ b2[i];
  return buffer2;
}
__name(xor, "xor");
function timer(fn, seconds) {
  seconds = typeof seconds === "function" ? seconds() : seconds;
  if (!seconds)
    return { cancel: noop, start: noop };
  let timer2;
  return {
    cancel() {
      timer2 && (clearTimeout(timer2), timer2 = null);
    },
    start() {
      timer2 && clearTimeout(timer2);
      timer2 = setTimeout(done, seconds * 1e3, arguments);
    }
  };
  function done(args) {
    fn.apply(null, args);
    timer2 = null;
  }
  __name(done, "done");
}
__name(timer, "timer");

// node_modules/postgres/cf/src/subscribe.js
import { Buffer as Buffer6 } from "node:buffer";
var noop2 = /* @__PURE__ */ __name(() => {
}, "noop");
function Subscribe(postgres2, options) {
  const subscribers = /* @__PURE__ */ new Map(), slot = "postgresjs_" + Math.random().toString(36).slice(2), state = {};
  let connection2, stream, ended = false;
  const sql = subscribe.sql = postgres2({
    ...options,
    transform: { column: {}, value: {}, row: {} },
    max: 1,
    fetch_types: false,
    idle_timeout: null,
    max_lifetime: null,
    connection: {
      ...options.connection,
      replication: "database"
    },
    onclose: /* @__PURE__ */ __name(async function() {
      if (ended)
        return;
      stream = null;
      state.pid = state.secret = void 0;
      connected(await init(sql, slot, options.publications));
      subscribers.forEach((event) => event.forEach(({ onsubscribe }) => onsubscribe()));
    }, "onclose"),
    no_subscribe: true
  });
  const end = sql.end, close = sql.close;
  sql.end = async () => {
    ended = true;
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return end();
  };
  sql.close = async () => {
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return close();
  };
  return subscribe;
  async function subscribe(event, fn, onsubscribe = noop2, onerror = noop2) {
    event = parseEvent(event);
    if (!connection2)
      connection2 = init(sql, slot, options.publications);
    const subscriber = { fn, onsubscribe };
    const fns = subscribers.has(event) ? subscribers.get(event).add(subscriber) : subscribers.set(event, /* @__PURE__ */ new Set([subscriber])).get(event);
    const unsubscribe = /* @__PURE__ */ __name(() => {
      fns.delete(subscriber);
      fns.size === 0 && subscribers.delete(event);
    }, "unsubscribe");
    return connection2.then((x) => {
      connected(x);
      onsubscribe();
      stream && stream.on("error", onerror);
      return { unsubscribe, state, sql };
    });
  }
  __name(subscribe, "subscribe");
  function connected(x) {
    stream = x.stream;
    state.pid = x.state.pid;
    state.secret = x.state.secret;
  }
  __name(connected, "connected");
  async function init(sql2, slot2, publications) {
    if (!publications)
      throw new Error("Missing publication names");
    const xs = await sql2.unsafe(
      `CREATE_REPLICATION_SLOT ${slot2} TEMPORARY LOGICAL pgoutput NOEXPORT_SNAPSHOT`
    );
    const [x] = xs;
    const stream2 = await sql2.unsafe(
      `START_REPLICATION SLOT ${slot2} LOGICAL ${x.consistent_point} (proto_version '1', publication_names '${publications}')`
    ).writable();
    const state2 = {
      lsn: Buffer6.concat(x.consistent_point.split("/").map((x2) => Buffer6.from(("00000000" + x2).slice(-8), "hex")))
    };
    stream2.on("data", data);
    stream2.on("error", error);
    stream2.on("close", sql2.close);
    return { stream: stream2, state: xs.state };
    function error(e) {
      console.error("Unexpected error during logical streaming - reconnecting", e);
    }
    __name(error, "error");
    function data(x2) {
      if (x2[0] === 119) {
        parse(x2.subarray(25), state2, sql2.options.parsers, handle2, options.transform);
      } else if (x2[0] === 107 && x2[17]) {
        state2.lsn = x2.subarray(1, 9);
        pong();
      }
    }
    __name(data, "data");
    function handle2(a, b2) {
      const path = b2.relation.schema + "." + b2.relation.table;
      call("*", a, b2);
      call("*:" + path, a, b2);
      b2.relation.keys.length && call("*:" + path + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
      call(b2.command, a, b2);
      call(b2.command + ":" + path, a, b2);
      b2.relation.keys.length && call(b2.command + ":" + path + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
    }
    __name(handle2, "handle");
    function pong() {
      const x2 = Buffer6.alloc(34);
      x2[0] = "r".charCodeAt(0);
      x2.fill(state2.lsn, 1);
      x2.writeBigInt64BE(BigInt(Date.now() - Date.UTC(2e3, 0, 1)) * BigInt(1e3), 25);
      stream2.write(x2);
    }
    __name(pong, "pong");
  }
  __name(init, "init");
  function call(x, a, b2) {
    subscribers.has(x) && subscribers.get(x).forEach(({ fn }) => fn(a, b2, x));
  }
  __name(call, "call");
}
__name(Subscribe, "Subscribe");
function Time(x) {
  return new Date(Date.UTC(2e3, 0, 1) + Number(x / BigInt(1e3)));
}
__name(Time, "Time");
function parse(x, state, parsers2, handle2, transform) {
  const char = /* @__PURE__ */ __name((acc, [k, v]) => (acc[k.charCodeAt(0)] = v, acc), "char");
  Object.entries({
    R: /* @__PURE__ */ __name((x2) => {
      let i = 1;
      const r = state[x2.readUInt32BE(i)] = {
        schema: x2.toString("utf8", i += 4, i = x2.indexOf(0, i)) || "pg_catalog",
        table: x2.toString("utf8", i + 1, i = x2.indexOf(0, i + 1)),
        columns: Array(x2.readUInt16BE(i += 2)),
        keys: []
      };
      i += 2;
      let columnIndex = 0, column;
      while (i < x2.length) {
        column = r.columns[columnIndex++] = {
          key: x2[i++],
          name: transform.column.from ? transform.column.from(x2.toString("utf8", i, i = x2.indexOf(0, i))) : x2.toString("utf8", i, i = x2.indexOf(0, i)),
          type: x2.readUInt32BE(i += 1),
          parser: parsers2[x2.readUInt32BE(i)],
          atttypmod: x2.readUInt32BE(i += 4)
        };
        column.key && r.keys.push(column);
        i += 4;
      }
    }, "R"),
    Y: /* @__PURE__ */ __name(() => {
    }, "Y"),
    // Type
    O: /* @__PURE__ */ __name(() => {
    }, "O"),
    // Origin
    B: /* @__PURE__ */ __name((x2) => {
      state.date = Time(x2.readBigInt64BE(9));
      state.lsn = x2.subarray(1, 9);
    }, "B"),
    I: /* @__PURE__ */ __name((x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      const { row } = tuples(x2, relation.columns, i += 7, transform);
      handle2(row, {
        command: "insert",
        relation
      });
    }, "I"),
    D: /* @__PURE__ */ __name((x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      handle2(
        key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform).row : null,
        {
          command: "delete",
          relation,
          key
        }
      );
    }, "D"),
    U: /* @__PURE__ */ __name((x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      const xs = key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform) : null;
      xs && (i = xs.i);
      const { row } = tuples(x2, relation.columns, i + 3, transform);
      handle2(row, {
        command: "update",
        relation,
        key,
        old: xs && xs.row
      });
    }, "U"),
    T: /* @__PURE__ */ __name(() => {
    }, "T"),
    // Truncate,
    C: /* @__PURE__ */ __name(() => {
    }, "C")
    // Commit
  }).reduce(char, {})[x[0]](x);
}
__name(parse, "parse");
function tuples(x, columns, xi, transform) {
  let type, column, value;
  const row = transform.raw ? new Array(columns.length) : {};
  for (let i = 0; i < columns.length; i++) {
    type = x[xi++];
    column = columns[i];
    value = type === 110 ? null : type === 117 ? void 0 : column.parser === void 0 ? x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)) : column.parser.array === true ? column.parser(x.toString("utf8", xi + 5, xi += 4 + x.readUInt32BE(xi))) : column.parser(x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)));
    transform.raw ? row[i] = transform.raw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
  }
  return { i: xi, row: transform.row.from ? transform.row.from(row) : row };
}
__name(tuples, "tuples");
function parseEvent(x) {
  const xs = x.match(/^(\*|insert|update|delete)?:?([^.]+?\.?[^=]+)?=?(.+)?/i) || [];
  if (!xs)
    throw new Error("Malformed subscribe pattern: " + x);
  const [, command, path, key] = xs;
  return (command || "*") + (path ? ":" + (path.indexOf(".") === -1 ? "public." + path : path) : "") + (key ? "=" + key : "");
}
__name(parseEvent, "parseEvent");

// node_modules/postgres/cf/src/large.js
import Stream2 from "node:stream";
function largeObject(sql, oid, mode = 131072 | 262144) {
  return new Promise(async (resolve, reject) => {
    await sql.begin(async (sql2) => {
      let finish;
      !oid && ([{ oid }] = await sql2`select lo_creat(-1) as oid`);
      const [{ fd }] = await sql2`select lo_open(${oid}, ${mode}) as fd`;
      const lo = {
        writable,
        readable,
        close: /* @__PURE__ */ __name(() => sql2`select lo_close(${fd})`.then(finish), "close"),
        tell: /* @__PURE__ */ __name(() => sql2`select lo_tell64(${fd})`, "tell"),
        read: /* @__PURE__ */ __name((x) => sql2`select loread(${fd}, ${x}) as data`, "read"),
        write: /* @__PURE__ */ __name((x) => sql2`select lowrite(${fd}, ${x})`, "write"),
        truncate: /* @__PURE__ */ __name((x) => sql2`select lo_truncate64(${fd}, ${x})`, "truncate"),
        seek: /* @__PURE__ */ __name((x, whence = 0) => sql2`select lo_lseek64(${fd}, ${x}, ${whence})`, "seek"),
        size: /* @__PURE__ */ __name(() => sql2`
          select
            lo_lseek64(${fd}, location, 0) as position,
            seek.size
          from (
            select
              lo_lseek64($1, 0, 2) as size,
              tell.location
            from (select lo_tell64($1) as location) tell
          ) seek
        `, "size")
      };
      resolve(lo);
      return new Promise(async (r) => finish = r);
      async function readable({
        highWaterMark = 2048 * 8,
        start = 0,
        end = Infinity
      } = {}) {
        let max = end - start;
        start && await lo.seek(start);
        return new Stream2.Readable({
          highWaterMark,
          async read(size2) {
            const l = size2 > max ? size2 - max : size2;
            max -= size2;
            const [{ data }] = await lo.read(l);
            this.push(data);
            if (data.length < size2)
              this.push(null);
          }
        });
      }
      __name(readable, "readable");
      async function writable({
        highWaterMark = 2048 * 8,
        start = 0
      } = {}) {
        start && await lo.seek(start);
        return new Stream2.Writable({
          highWaterMark,
          write(chunk, encoding, callback) {
            lo.write(chunk).then(() => callback(), callback);
          }
        });
      }
      __name(writable, "writable");
    }).catch(reject);
  });
}
__name(largeObject, "largeObject");

// node_modules/postgres/cf/src/index.js
Object.assign(Postgres, {
  PostgresError,
  toPascal,
  pascal,
  toCamel,
  camel,
  toKebab,
  kebab,
  fromPascal,
  fromCamel,
  fromKebab,
  BigInt: {
    to: 20,
    from: [20],
    parse: /* @__PURE__ */ __name((x) => BigInt(x), "parse"),
    // eslint-disable-line
    serialize: /* @__PURE__ */ __name((x) => x.toString(), "serialize")
  }
});
var src_default = Postgres;
function Postgres(a, b2) {
  const options = parseOptions(a, b2), subscribe = options.no_subscribe || Subscribe(Postgres, { ...options });
  let ending = false;
  const queries = queue_default(), connecting = queue_default(), reserved = queue_default(), closed = queue_default(), ended = queue_default(), open = queue_default(), busy = queue_default(), full = queue_default(), queues = { connecting, reserved, closed, ended, open, busy, full };
  const connections = [...Array(options.max)].map(() => connection_default(options, queues, { onopen, onend, onclose }));
  const sql = Sql(handler);
  Object.assign(sql, {
    get parameters() {
      return options.parameters;
    },
    largeObject: largeObject.bind(null, sql),
    subscribe,
    CLOSE,
    END: CLOSE,
    PostgresError,
    options,
    reserve,
    listen,
    begin,
    close,
    end
  });
  return sql;
  function Sql(handler2) {
    handler2.debug = options.debug;
    Object.entries(options.types).reduce((acc, [name, type]) => {
      acc[name] = (x) => new Parameter(x, type.to);
      return acc;
    }, typed);
    Object.assign(sql2, {
      types: typed,
      typed,
      unsafe,
      notify,
      array,
      json: json2,
      file
    });
    return sql2;
    function typed(value, type) {
      return new Parameter(value, type);
    }
    __name(typed, "typed");
    function sql2(strings, ...args) {
      const query = strings && Array.isArray(strings.raw) ? new Query(strings, args, handler2, cancel) : typeof strings === "string" && !args.length ? new Identifier(options.transform.column.to ? options.transform.column.to(strings) : strings) : new Builder(strings, args);
      return query;
    }
    __name(sql2, "sql");
    function unsafe(string, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([string], args, handler2, cancel, {
        prepare: false,
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
    __name(unsafe, "unsafe");
    function file(path, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([], args, (query2) => {
        fs.readFile(path, "utf8", (err2, string) => {
          if (err2)
            return query2.reject(err2);
          query2.strings = [string];
          handler2(query2);
        });
      }, cancel, {
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
    __name(file, "file");
  }
  __name(Sql, "Sql");
  async function listen(name, fn, onlisten) {
    const listener = { fn, onlisten };
    const sql2 = listen.sql || (listen.sql = Postgres({
      ...options,
      max: 1,
      idle_timeout: null,
      max_lifetime: null,
      fetch_types: false,
      onclose() {
        Object.entries(listen.channels).forEach(([name2, { listeners }]) => {
          delete listen.channels[name2];
          Promise.all(listeners.map((l) => listen(name2, l.fn, l.onlisten).catch(() => {
          })));
        });
      },
      onnotify(c, x) {
        c in listen.channels && listen.channels[c].listeners.forEach((l) => l.fn(x));
      }
    }));
    const channels = listen.channels || (listen.channels = {}), exists = name in channels;
    if (exists) {
      channels[name].listeners.push(listener);
      const result2 = await channels[name].result;
      listener.onlisten && listener.onlisten();
      return { state: result2.state, unlisten };
    }
    channels[name] = { result: sql2`listen ${sql2.unsafe('"' + name.replace(/"/g, '""') + '"')}`, listeners: [listener] };
    const result = await channels[name].result;
    listener.onlisten && listener.onlisten();
    return { state: result.state, unlisten };
    async function unlisten() {
      if (name in channels === false)
        return;
      channels[name].listeners = channels[name].listeners.filter((x) => x !== listener);
      if (channels[name].listeners.length)
        return;
      delete channels[name];
      return sql2`unlisten ${sql2.unsafe('"' + name.replace(/"/g, '""') + '"')}`;
    }
    __name(unlisten, "unlisten");
  }
  __name(listen, "listen");
  async function notify(channel, payload) {
    return await sql`select pg_notify(${channel}, ${"" + payload})`;
  }
  __name(notify, "notify");
  async function reserve() {
    const queue = queue_default();
    const c = open.length ? open.shift() : await new Promise((resolve, reject) => {
      const query = { reserve: resolve, reject };
      queries.push(query);
      closed.length && connect(closed.shift(), query);
    });
    move(c, reserved);
    c.reserved = () => queue.length ? c.execute(queue.shift()) : move(c, reserved);
    c.reserved.release = true;
    const sql2 = Sql(handler2);
    sql2.release = () => {
      c.reserved = null;
      onopen(c);
    };
    return sql2;
    function handler2(q) {
      c.queue === full ? queue.push(q) : c.execute(q) || move(c, full);
    }
    __name(handler2, "handler");
  }
  __name(reserve, "reserve");
  async function begin(options2, fn) {
    !fn && (fn = options2, options2 = "");
    const queries2 = queue_default();
    let savepoints = 0, connection2, prepare = null;
    try {
      await sql.unsafe("begin " + options2.replace(/[^a-z ]/ig, ""), [], { onexecute }).execute();
      return await Promise.race([
        scope(connection2, fn),
        new Promise((_, reject) => connection2.onclose = reject)
      ]);
    } catch (error) {
      throw error;
    }
    async function scope(c, fn2, name) {
      const sql2 = Sql(handler2);
      sql2.savepoint = savepoint;
      sql2.prepare = (x) => prepare = x.replace(/[^a-z0-9$-_. ]/gi);
      let uncaughtError, result;
      name && await sql2`savepoint ${sql2(name)}`;
      try {
        result = await new Promise((resolve, reject) => {
          const x = fn2(sql2);
          Promise.resolve(Array.isArray(x) ? Promise.all(x) : x).then(resolve, reject);
        });
        if (uncaughtError)
          throw uncaughtError;
      } catch (e) {
        await (name ? sql2`rollback to ${sql2(name)}` : sql2`rollback`);
        throw e instanceof PostgresError && e.code === "25P02" && uncaughtError || e;
      }
      if (!name) {
        prepare ? await sql2`prepare transaction '${sql2.unsafe(prepare)}'` : await sql2`commit`;
      }
      return result;
      function savepoint(name2, fn3) {
        if (name2 && Array.isArray(name2.raw))
          return savepoint((sql3) => sql3.apply(sql3, arguments));
        arguments.length === 1 && (fn3 = name2, name2 = null);
        return scope(c, fn3, "s" + savepoints++ + (name2 ? "_" + name2 : ""));
      }
      __name(savepoint, "savepoint");
      function handler2(q) {
        q.catch((e) => uncaughtError || (uncaughtError = e));
        c.queue === full ? queries2.push(q) : c.execute(q) || move(c, full);
      }
      __name(handler2, "handler");
    }
    __name(scope, "scope");
    function onexecute(c) {
      connection2 = c;
      move(c, reserved);
      c.reserved = () => queries2.length ? c.execute(queries2.shift()) : move(c, reserved);
    }
    __name(onexecute, "onexecute");
  }
  __name(begin, "begin");
  function move(c, queue) {
    c.queue.remove(c);
    queue.push(c);
    c.queue = queue;
    queue === open ? c.idleTimer.start() : c.idleTimer.cancel();
    return c;
  }
  __name(move, "move");
  function json2(x) {
    return new Parameter(x, 3802);
  }
  __name(json2, "json");
  function array(x, type) {
    if (!Array.isArray(x))
      return array(Array.from(arguments));
    return new Parameter(x, type || (x.length ? inferType(x) || 25 : 0), options.shared.typeArrayMap);
  }
  __name(array, "array");
  function handler(query) {
    if (ending)
      return query.reject(Errors.connection("CONNECTION_ENDED", options, options));
    if (open.length)
      return go(open.shift(), query);
    if (closed.length)
      return connect(closed.shift(), query);
    busy.length ? go(busy.shift(), query) : queries.push(query);
  }
  __name(handler, "handler");
  function go(c, query) {
    return c.execute(query) ? move(c, busy) : move(c, full);
  }
  __name(go, "go");
  function cancel(query) {
    return new Promise((resolve, reject) => {
      query.state ? query.active ? connection_default(options).cancel(query.state, resolve, reject) : query.cancelled = { resolve, reject } : (queries.remove(query), query.cancelled = true, query.reject(Errors.generic("57014", "canceling statement due to user request")), resolve());
    });
  }
  __name(cancel, "cancel");
  async function end({ timeout = null } = {}) {
    if (ending)
      return ending;
    await 1;
    let timer2;
    return ending = Promise.race([
      new Promise((r) => timeout !== null && (timer2 = setTimeout(destroy, timeout * 1e3, r))),
      Promise.all(connections.map((c) => c.end()).concat(
        listen.sql ? listen.sql.end({ timeout: 0 }) : [],
        subscribe.sql ? subscribe.sql.end({ timeout: 0 }) : []
      ))
    ]).then(() => clearTimeout(timer2));
  }
  __name(end, "end");
  async function close() {
    await Promise.all(connections.map((c) => c.end()));
  }
  __name(close, "close");
  async function destroy(resolve) {
    await Promise.all(connections.map((c) => c.terminate()));
    while (queries.length)
      queries.shift().reject(Errors.connection("CONNECTION_DESTROYED", options));
    resolve();
  }
  __name(destroy, "destroy");
  function connect(c, query) {
    move(c, connecting);
    c.connect(query);
    return c;
  }
  __name(connect, "connect");
  function onend(c) {
    move(c, ended);
  }
  __name(onend, "onend");
  function onopen(c) {
    if (queries.length === 0)
      return move(c, open);
    let max = Math.ceil(queries.length / (connecting.length + 1)), ready = true;
    while (ready && queries.length && max-- > 0) {
      const query = queries.shift();
      if (query.reserve)
        return query.reserve(c);
      ready = c.execute(query);
    }
    ready ? move(c, busy) : move(c, full);
  }
  __name(onopen, "onopen");
  function onclose(c, e) {
    move(c, closed);
    c.reserved = null;
    c.onclose && (c.onclose(e), c.onclose = null);
    options.onclose && options.onclose(c.id);
    queries.length && connect(c, queries.shift());
  }
  __name(onclose, "onclose");
}
__name(Postgres, "Postgres");
function parseOptions(a, b2) {
  if (a && a.shared)
    return a;
  const env = process.env, o = (!a || typeof a === "string" ? b2 : a) || {}, { url, multihost } = parseUrl(a), query = [...url.searchParams].reduce((a2, [b3, c]) => (a2[b3] = c, a2), {}), host = o.hostname || o.host || multihost || url.hostname || env.PGHOST || "localhost", port = o.port || url.port || env.PGPORT || 5432, user = o.user || o.username || url.username || env.PGUSERNAME || env.PGUSER || osUsername();
  o.no_prepare && (o.prepare = false);
  query.sslmode && (query.ssl = query.sslmode, delete query.sslmode);
  "timeout" in o && (console.log("The timeout option is deprecated, use idle_timeout instead"), o.idle_timeout = o.timeout);
  query.sslrootcert === "system" && (query.ssl = "verify-full");
  const ints = ["idle_timeout", "connect_timeout", "max_lifetime", "max_pipeline", "backoff", "keep_alive"];
  const defaults = {
    max: globalThis.Cloudflare ? 3 : 10,
    ssl: false,
    sslnegotiation: null,
    idle_timeout: null,
    connect_timeout: 30,
    max_lifetime,
    max_pipeline: 100,
    backoff,
    keep_alive: 60,
    prepare: true,
    debug: false,
    fetch_types: true,
    publications: "alltables",
    target_session_attrs: null
  };
  return {
    host: Array.isArray(host) ? host : host.split(",").map((x) => x.split(":")[0]),
    port: Array.isArray(port) ? port : host.split(",").map((x) => parseInt(x.split(":")[1] || port)),
    path: o.path || host.indexOf("/") > -1 && host + "/.s.PGSQL." + port,
    database: o.database || o.db || (url.pathname || "").slice(1) || env.PGDATABASE || user,
    user,
    pass: o.pass || o.password || url.password || env.PGPASSWORD || "",
    ...Object.entries(defaults).reduce(
      (acc, [k, d]) => {
        const value = k in o ? o[k] : k in query ? query[k] === "disable" || query[k] === "false" ? false : query[k] : env["PG" + k.toUpperCase()] || d;
        acc[k] = typeof value === "string" && ints.includes(k) ? +value : value;
        return acc;
      },
      {}
    ),
    connection: {
      application_name: env.PGAPPNAME || "postgres.js",
      ...o.connection,
      ...Object.entries(query).reduce((acc, [k, v]) => (k in defaults || (acc[k] = v), acc), {})
    },
    types: o.types || {},
    target_session_attrs: tsa(o, url, env),
    onnotice: o.onnotice,
    onnotify: o.onnotify,
    onclose: o.onclose,
    onparameter: o.onparameter,
    socket: o.socket,
    transform: parseTransform(o.transform || { undefined: void 0 }),
    parameters: {},
    shared: { retries: 0, typeArrayMap: {} },
    ...mergeUserTypes(o.types)
  };
}
__name(parseOptions, "parseOptions");
function tsa(o, url, env) {
  const x = o.target_session_attrs || url.searchParams.get("target_session_attrs") || env.PGTARGETSESSIONATTRS;
  if (!x || ["read-write", "read-only", "primary", "standby", "prefer-standby"].includes(x))
    return x;
  throw new Error("target_session_attrs " + x + " is not supported");
}
__name(tsa, "tsa");
function backoff(retries) {
  return (0.5 + Math.random() / 2) * Math.min(3 ** retries / 100, 20);
}
__name(backoff, "backoff");
function max_lifetime() {
  return 60 * (30 + Math.random() * 30);
}
__name(max_lifetime, "max_lifetime");
function parseTransform(x) {
  return {
    undefined: x.undefined,
    column: {
      from: typeof x.column === "function" ? x.column : x.column && x.column.from,
      to: x.column && x.column.to
    },
    value: {
      from: typeof x.value === "function" ? x.value : x.value && x.value.from,
      to: x.value && x.value.to
    },
    row: {
      from: typeof x.row === "function" ? x.row : x.row && x.row.from,
      to: x.row && x.row.to
    }
  };
}
__name(parseTransform, "parseTransform");
function parseUrl(url) {
  if (!url || typeof url !== "string")
    return { url: { searchParams: /* @__PURE__ */ new Map() } };
  let host = url;
  host = host.slice(host.indexOf("://") + 3).split(/[?/]/)[0];
  host = decodeURIComponent(host.slice(host.indexOf("@") + 1));
  const urlObj = new URL(url.replace(host, host.split(",")[0]));
  return {
    url: {
      username: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      searchParams: urlObj.searchParams
    },
    multihost: host.indexOf(",") > -1 && host
  };
}
__name(parseUrl, "parseUrl");
function osUsername() {
  try {
    return os.userInfo().username;
  } catch (_) {
    return process.env.USERNAME || process.env.USER || process.env.LOGNAME;
  }
}
__name(osUsername, "osUsername");

// worker.js
var MOODS = /* @__PURE__ */ new Set(["veryhappy", "happy", "grateful", "calm", "neutral", "tired", "sad", "anxious", "overwhelmed", "angry"]);
var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
var DATE = /^\d{4}-\d{2}-\d{2}$/;
var TAG = /^[a-z0-9-]{1,20}$/;
var EXTRA_KEYS = ["programs", "safety", "study", "prefs", "daily"];
var MAX_LOGS = 500;
var MAX_JOURNAL = 800;
var MAX_LIST = 500;
var SCOPE_KEYS = ["moods", "tags", "notes", "journal", "daily", "alerts"];
var DEFAULT_SCOPE = { moods: true, tags: true, notes: false, journal: false, daily: true, alerts: true };
var HEAVY = /* @__PURE__ */ new Set(["sad", "anxious", "overwhelmed", "angry"]);
var CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var MAX_SHARES = 5;
var INVITE_DAYS = 7;
var DAY = 864e5;
var PBKDF2_ITER = 1e5;
var COOKIE = "mi_session";
var SESSION_DAYS = 30;
var enc = new TextEncoder();
var json = /* @__PURE__ */ __name((data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...headers } }), "json");
var err = /* @__PURE__ */ __name((message, status) => json({ error: message }, status), "err");
var b64u = /* @__PURE__ */ __name((buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "b64u");
var unb64u = /* @__PURE__ */ __name((s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)), "unb64u");
var nowIso = /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toISOString(), "nowIso");
function loads(text, fallback) {
  try {
    const v = JSON.parse(text);
    return v !== null && typeof v === typeof fallback && Array.isArray(v) === Array.isArray(fallback) ? v : fallback;
  } catch {
    return fallback;
  }
}
__name(loads, "loads");
function jsonText(value, fallback, maxChars) {
  if (value === null || typeof value !== typeof fallback || Array.isArray(value) !== Array.isArray(fallback)) return JSON.stringify(fallback);
  if (Array.isArray(value)) value = value.slice(0, MAX_LIST);
  const t = JSON.stringify(value);
  return t.length <= maxChars ? t : JSON.stringify(fallback);
}
__name(jsonText, "jsonText");
var isObj = /* @__PURE__ */ __name((v) => v !== null && typeof v === "object" && !Array.isArray(v), "isObj");
async function pbkdf2(password, salt, iter) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, key, 256));
}
__name(pbkdf2, "pbkdf2");
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITER}$${b64u(salt)}$${b64u(await pbkdf2(password, salt, PBKDF2_ITER))}`;
}
__name(hashPassword, "hashPassword");
function sameBytes(a, b2) {
  if (a.length !== b2.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b2[i];
  return d === 0;
}
__name(sameBytes, "sameBytes");
var DUMMY_HASH = `pbkdf2$${PBKDF2_ITER}$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
async function verifyPassword(password, stored) {
  const [kind, iter, salt, hash] = String(stored).split("$");
  if (kind !== "pbkdf2") return false;
  const got = await pbkdf2(password, unb64u(salt), Number(iter));
  return sameBytes(got, unb64u(hash));
}
__name(verifyPassword, "verifyPassword");
async function hmacKey(env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 16) throw new Error("SESSION_SECRET is not set");
  return crypto.subtle.importKey("raw", enc.encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
__name(hmacKey, "hmacKey");
async function makeSession(env, uid2) {
  const body = b64u(enc.encode(JSON.stringify({ uid: uid2, exp: Date.now() + SESSION_DAYS * DAY })));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode(body));
  return `${body}.${b64u(sig)}`;
}
__name(makeSession, "makeSession");
async function readSession(env, request) {
  const raw = (request.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (!raw) return null;
  const [body, sig] = raw.slice(COOKIE.length + 1).split(".");
  if (!body || !sig) return null;
  try {
    if (!await crypto.subtle.verify("HMAC", await hmacKey(env), unb64u(sig), enc.encode(body))) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64u(body)));
    return p.exp > Date.now() ? p.uid : null;
  } catch {
    return null;
  }
}
__name(readSession, "readSession");
var cookieHeader = /* @__PURE__ */ __name((value, maxAge, secure) => `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`, "cookieHeader");
async function tooMany(sql, bucket) {
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM auth_attempts WHERE bucket = ${bucket} AND at > ${Date.now() - 6e5}`;
  return n >= 8;
}
__name(tooMany, "tooMany");
async function recordFail(sql, bucket) {
  await sql`INSERT INTO auth_attempts (bucket, at) VALUES (${bucket}, ${Date.now()})`;
  if (Math.random() < 0.05) await sql`DELETE FROM auth_attempts WHERE at < ${Date.now() - 36e5}`;
}
__name(recordFail, "recordFail");
function clientIp(request) {
  return (request.headers.get("cf-connecting-ip") || (request.headers.get("x-forwarded-for") || "").split(",")[0] || "local").trim().slice(0, 64);
}
__name(clientIp, "clientIp");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/") && url.pathname !== "/healthz") {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 });
    }
    const sql = src_default(env.DATABASE_URL, {
      max: 1,
      prepare: false,
      fetch_types: false,
      idle_timeout: 5,
      connect_timeout: 10,
      onnotice() {
      },
      types: { bigint: { to: 20, from: [20], serialize: /* @__PURE__ */ __name((x) => String(x), "serialize"), parse: /* @__PURE__ */ __name((x) => Number(x), "parse") } }
    });
    try {
      const res = await handle(request, env, sql, url);
      res.headers.set("Cache-Control", "no-store");
      res.headers.set("X-Content-Type-Options", "nosniff");
      return res;
    } catch (e) {
      console.error(e && e.stack ? e.stack : e);
      return err("Something went wrong on our side. Please try again.", 500);
    } finally {
      ctx.waitUntil(sql.end({ timeout: 2 }));
    }
  }
};
async function handle(request, env, sql, url) {
  const method = request.method, path = url.pathname, secure = url.protocol === "https:";
  if (path === "/healthz") {
    await sql`SELECT 1`;
    return json({ ok: true });
  }
  let body = {};
  if (method === "POST" || method === "PUT") {
    const len = Number(request.headers.get("content-length") || 0);
    if (len > 2 * 1024 * 1024) return err("That is too large.", 413);
    if (len && !(request.headers.get("content-type") || "").includes("application/json")) return err("Expected JSON.", 415);
    body = await request.json().catch(() => null) ?? {};
  }
  const ip = clientIp(request);
  const user = /* @__PURE__ */ __name(async () => {
    const uid2 = await readSession(env, request);
    if (!uid2) return null;
    const [u] = await sql`SELECT * FROM users WHERE id = ${uid2}`;
    return u || null;
  }, "user");
  const need = /* @__PURE__ */ __name(async () => await user() || null, "need");
  const signIn = /* @__PURE__ */ __name(async (u) => ({ "set-cookie": cookieHeader(await makeSession(env, u.id), SESSION_DAYS * 86400, secure) }), "signIn");
  const userJson = /* @__PURE__ */ __name((u) => ({ signedIn: true, name: u.name, email: u.email }), "userJson");
  const unauth = /* @__PURE__ */ __name(() => err("Please sign in first.", 401), "unauth");
  let m;
  if (path === "/api/auth/me" && method === "GET") {
    const u = await user();
    return json(u ? userJson(u) : { signedIn: false });
  }
  if (path === "/api/auth/register" && method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    let name = String(body.name || "").trim();
    if (email.length > 254 || !EMAIL.test(email)) return err("Please enter a valid email address.", 400);
    if (password.length < 8) return err("Password needs at least 8 characters.", 400);
    if (password.length > 128) return err("Password is too long (128 characters max).", 400);
    const bucket = `register|${ip}`;
    if (await tooMany(sql, bucket)) return err("Too many tries. Please wait a few minutes and try again.", 429);
    await recordFail(sql, bucket);
    if (!name) name = email.split("@")[0];
    name = name.slice(0, 60);
    const [dup] = await sql`SELECT 1 FROM users WHERE email = ${email}`;
    if (dup) return err("An account with this email already exists. Try signing in.", 400);
    let u;
    try {
      [u] = await sql`INSERT INTO users (email, name, password_hash, created_at) VALUES (${email}, ${name}, ${await hashPassword(password)}, ${nowIso()}) RETURNING id, email, name`;
    } catch (e) {
      if (e.code === "23505") return err("An account with this email already exists. Try signing in.", 400);
      throw e;
    }
    return json({ signedIn: true, name: u.name, email: u.email }, 200, await signIn(u));
  }
  if (path === "/api/auth/login" && method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const bucket = `login|${ip}|${email}`;
    if (await tooMany(sql, bucket)) return err("Too many tries. Please wait a few minutes and try again.", 429);
    const [u] = await sql`SELECT * FROM users WHERE email = ${email}`;
    const ok = await verifyPassword(password, u ? u.password_hash : DUMMY_HASH);
    if (!u || !ok) {
      await recordFail(sql, bucket);
      return err("That email and password do not match.", 401);
    }
    return json(userJson(u), 200, await signIn(u));
  }
  if (path === "/api/auth/logout" && method === "POST") {
    return json({ signedIn: false }, 200, { "set-cookie": cookieHeader("", 0, secure) });
  }
  if (path === "/api/auth/delete" && method === "POST") {
    const u = await need();
    if (!u) return unauth();
    if (!await verifyPassword(String(body.password || ""), u.password_hash)) return err("That password is not correct.", 400);
    await sql`DELETE FROM users WHERE id = ${u.id}`;
    return json({ signedIn: false }, 200, { "set-cookie": cookieHeader("", 0, secure) });
  }
  if (path === "/api/sync" && method === "GET") {
    const u = await need();
    if (!u) return unauth();
    return json(await loadState(sql, u));
  }
  if (path === "/api/export" && method === "GET") {
    const u = await need();
    if (!u) return unauth();
    const data = { ...await loadState(sql, u), name: u.name, email: u.email, exportedAt: nowIso() };
    return json(data, 200, { "content-disposition": "attachment; filename=mindease-export.json" });
  }
  if (path === "/api/sync" && method === "PUT") {
    const u = await need();
    if (!u) return unauth();
    if (!isObj(body)) return err("Expected a JSON object.", 400);
    await saveState(sql, u, body);
    return json({ ok: true });
  }
  if (path === "/api/share/mine" && method === "GET") {
    const u = await need();
    if (!u) return unauth();
    const rows = await sql`SELECT s.*, k.name AS kname FROM shares s LEFT JOIN users k ON k.id = s.keeper_id
      WHERE s.owner_id = ${u.id} AND s.status != 'revoked' ORDER BY s.id DESC`;
    const cutoff = new Date(Date.now() - INVITE_DAYS * DAY).toISOString();
    const out = [];
    for (const r of rows) {
      if (r.status === "pending" && r.created_at < cutoff) {
        await sql`DELETE FROM shares WHERE id = ${r.id}`;
        continue;
      }
      out.push(shareJson(r, r.kname));
    }
    return json({ shares: out });
  }
  if (path === "/api/share/invite" && method === "POST") {
    const u = await need();
    if (!u) return unauth();
    const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM shares WHERE owner_id = ${u.id} AND status != 'revoked'`;
    if (n >= MAX_SHARES) return err(`You can share with up to ${MAX_SHARES} people. Stop sharing with someone first.`, 400);
    const label = String(body.label || "").trim().slice(0, 40);
    const code = await newCode(sql);
    const [r] = await sql`INSERT INTO shares (owner_id, code, label, scope_json, status, created_at)
      VALUES (${u.id}, ${code}, ${label}, ${JSON.stringify(scopeOf(body.scope))}, 'pending', ${nowIso()}) RETURNING id`;
    return json({ id: r.id, code });
  }
  if ((m = path.match(/^\/api\/share\/(\d+)$/)) && (method === "PUT" || method === "DELETE")) {
    const u = await need();
    if (!u) return unauth();
    const sid = Number(m[1]);
    if (method === "DELETE") {
      const r2 = await sql`DELETE FROM shares WHERE id = ${sid} AND owner_id = ${u.id} RETURNING id`;
      return r2.length ? json({ ok: true }) : err("Not found.", 404);
    }
    const [r] = await sql`SELECT * FROM shares WHERE id = ${sid} AND owner_id = ${u.id} AND status != 'revoked'`;
    if (!r) return err("Not found.", 404);
    const scope = scopeOf(loads(r.scope_json, {}));
    if (isObj(body.scope)) {
      for (const k of SCOPE_KEYS) if (typeof body.scope[k] === "boolean") scope[k] = body.scope[k];
    }
    const label = typeof body.label === "string" ? body.label.trim().slice(0, 40) : r.label;
    await sql`UPDATE shares SET scope_json = ${JSON.stringify(scope)}, label = ${label} WHERE id = ${sid}`;
    return json({ ok: true });
  }
  if (path === "/api/share/accept" && method === "POST") {
    const u = await need();
    if (!u) return unauth();
    const bucket = `accept|${ip}`;
    if (await tooMany(sql, bucket)) return err("Too many tries. Please wait a few minutes.", 429);
    const code = String(body.code || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const [r] = code ? await sql`SELECT * FROM shares WHERE code = ${code} AND status = 'pending'` : [];
    if (!r || r.created_at < new Date(Date.now() - INVITE_DAYS * DAY).toISOString()) {
      await recordFail(sql, bucket);
      return err("That code did not work. It may have expired. Ask them for a new one.", 400);
    }
    if (r.owner_id === u.id) return err("That is your own code. Send it to the person who will keep an eye on you.", 400);
    const [dup] = await sql`SELECT 1 FROM shares WHERE owner_id = ${r.owner_id} AND keeper_id = ${u.id} AND status = 'active'`;
    if (dup) return err("You already look after this person.", 400);
    await sql`UPDATE shares SET keeper_id = ${u.id}, status = 'active', code = NULL, accepted_at = ${nowIso()} WHERE id = ${r.id}`;
    return json({ ok: true });
  }
  if (path === "/api/keeper/people" && method === "GET") {
    const u = await need();
    if (!u) return unauth();
    const rows = await sql`SELECT s.id, s.scope_json, s.accepted_at, o.id AS oid, o.name FROM shares s JOIN users o ON o.id = s.owner_id
      WHERE s.keeper_id = ${u.id} AND s.status = 'active' ORDER BY s.id DESC`;
    const people = [];
    for (const r of rows) {
      const sc = scopeOf(loads(r.scope_json, {}));
      const logs = (await sql`SELECT mood_key, energy, logged_at FROM mood_logs WHERE user_id = ${r.oid} ORDER BY logged_at DESC LIMIT 5`).map((x) => ({ k: x.mood_key, energy: x.energy, t: x.logged_at }));
      people.push({
        id: r.id,
        name: r.name,
        lastCheckin: logs.length && sc.moods ? logs[0].t : null,
        lastMood: logs.length && sc.moods ? logs[0].k : null,
        alerts: sc.alerts ? alertsFor(logs) : [],
        since: r.accepted_at
      });
    }
    return json({ people });
  }
  if ((m = path.match(/^\/api\/keeper\/(\d+)$/)) && (method === "GET" || method === "DELETE")) {
    const u = await need();
    if (!u) return unauth();
    const sid = Number(m[1]);
    if (method === "DELETE") {
      const r2 = await sql`DELETE FROM shares WHERE id = ${sid} AND keeper_id = ${u.id} RETURNING id`;
      return r2.length ? json({ ok: true }) : err("Not found.", 404);
    }
    const [r] = await sql`SELECT s.*, o.name AS oname, o.extra_json AS oextra FROM shares s JOIN users o ON o.id = s.owner_id
      WHERE s.id = ${sid} AND s.keeper_id = ${u.id} AND s.status = 'active'`;
    if (!r) return err("Not found.", 404);
    return json(await keeperView(sql, r));
  }
  return err("Not found.", 404);
}
__name(handle, "handle");
async function loadState(sql, u) {
  const logs = (await sql`SELECT * FROM mood_logs WHERE user_id = ${u.id} ORDER BY logged_at DESC`).map((r) => ({ k: r.mood_key, note: r.note || "", energy: r.energy, t: r.logged_at, tags: loads(r.tags, []) }));
  const journal = {};
  for (const r of await sql`SELECT * FROM journal_entries WHERE user_id = ${u.id}`) journal[r.entry_date] = { text: r.text, u: r.updated_at };
  return {
    logs,
    journal,
    gratitude: loads(u.gratitude_json, []),
    saved: loads(u.saved_json, []),
    remind: loads(u.remind_json, {}),
    extra: loads(u.extra_json, {})
  };
}
__name(loadState, "loadState");
function parseTime(text) {
  const d = new Date(String(text));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
__name(parseTime, "parseTime");
async function saveState(sql, u, s) {
  const logs = [];
  for (const l of Array.isArray(s.logs) ? s.logs : []) {
    if (logs.length >= MAX_LOGS) break;
    if (!isObj(l) || !MOODS.has(l.k)) continue;
    const when = parseTime(l.t);
    if (!when) continue;
    let energy = parseInt(l.energy ?? 5, 10);
    energy = Number.isNaN(energy) ? 5 : Math.max(1, Math.min(10, energy));
    const tags = Array.isArray(l.tags) ? l.tags.filter((t) => typeof t === "string" && TAG.test(t)).slice(0, 8) : [];
    logs.push({ user_id: u.id, mood_key: l.k, note: String(l.note || "").slice(0, 500), energy, logged_at: when, tags: JSON.stringify(tags) });
  }
  const entries = [];
  if (isObj(s.journal)) {
    for (const [day, d] of Object.entries(s.journal)) {
      if (entries.length >= MAX_JOURNAL) break;
      if (!DATE.test(day) || !isObj(d)) continue;
      const stamp = parseInt(d.u || 0, 10);
      entries.push({ user_id: u.id, entry_date: day, text: String(d.text || "").slice(0, 2e4), updated_at: Number.isNaN(stamp) ? 0 : stamp });
    }
  }
  const extra = {};
  if (isObj(s.extra)) {
    for (const k of EXTRA_KEYS) if (isObj(s.extra[k])) extra[k] = s.extra[k];
  }
  await sql.begin(async (tx) => {
    await tx`DELETE FROM mood_logs WHERE user_id = ${u.id}`;
    if (logs.length) await tx`INSERT INTO mood_logs ${tx(logs, "user_id", "mood_key", "note", "energy", "logged_at", "tags")}`;
    await tx`DELETE FROM journal_entries WHERE user_id = ${u.id}`;
    if (entries.length) await tx`INSERT INTO journal_entries ${tx(entries, "user_id", "entry_date", "text", "updated_at")}`;
    await tx`UPDATE users SET gratitude_json = ${jsonText(s.gratitude, [], 1e5)}, saved_json = ${jsonText(s.saved, [], 1e5)},
      remind_json = ${jsonText(s.remind, {}, 2e3)}, extra_json = ${jsonText(extra, {}, 6e4)} WHERE id = ${u.id}`;
  });
}
__name(saveState, "saveState");
function scopeOf(raw) {
  const out = { ...DEFAULT_SCOPE };
  if (isObj(raw)) {
    for (const k of SCOPE_KEYS) if (typeof raw[k] === "boolean") out[k] = raw[k];
  }
  return out;
}
__name(scopeOf, "scopeOf");
function shareJson(r, keeperName) {
  return {
    id: r.id,
    label: r.label,
    status: r.status,
    scope: scopeOf(loads(r.scope_json, {})),
    created: r.created_at,
    accepted: r.accepted_at,
    lastViewed: r.last_viewed_at,
    views: r.views,
    keeperName: keeperName ?? null,
    code: r.status === "pending" ? r.code : null
  };
}
__name(shareJson, "shareJson");
async function newCode(sql) {
  for (let i = 0; i < 20; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const c = [...bytes].map((b2) => CODE_ALPHABET[b2 % CODE_ALPHABET.length]).join("");
    const [hit] = await sql`SELECT 1 FROM shares WHERE code = ${c}`;
    if (!hit) return c;
  }
  throw new Error("could not make a code");
}
__name(newCode, "newCode");
function alertsFor(logs) {
  const out = [];
  if (!logs.length) return out;
  const quiet = Math.floor((Date.now() - new Date(logs[0].t).getTime()) / DAY);
  if (quiet >= 2) out.push({ kind: "quiet", text: `No check-in for ${quiet} days.` });
  const recent = logs.slice(0, 5);
  if (recent.length >= 3 && recent.filter((l) => HEAVY.has(l.k)).length >= 3) out.push({ kind: "heavy", text: "Most of the last few check-ins have felt heavy." });
  const low = logs.slice(0, 3);
  if (low.length === 3 && low.reduce((a, l) => a + l.energy, 0) / 3 <= 3) out.push({ kind: "energy", text: "Energy has been low in the last few check-ins." });
  return out;
}
__name(alertsFor, "alertsFor");
function streakOf(days) {
  const d = /* @__PURE__ */ new Date();
  d.setUTCHours(12, 0, 0, 0);
  let n = 0;
  if (!days.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}
__name(streakOf, "streakOf");
async function keeperView(sql, r) {
  const sc = scopeOf(loads(r.scope_json, {})), oid = r.owner_id;
  const all = (await sql`SELECT * FROM mood_logs WHERE user_id = ${oid} ORDER BY logged_at DESC`).map((x) => ({ k: x.mood_key, note: x.note || "", energy: x.energy, t: x.logged_at, tags: loads(x.tags, []) }));
  const since = new Date(Date.now() - 90 * DAY).toISOString();
  const logs = [];
  if (sc.moods) {
    for (const l of all) {
      if (l.t < since) continue;
      const item = { k: l.k, energy: l.energy, t: l.t };
      if (sc.tags) item.tags = l.tags;
      if (sc.notes) item.note = l.note;
      logs.push(item);
    }
  }
  const journal = {};
  if (sc.journal) for (const x of await sql`SELECT entry_date, text FROM journal_entries WHERE user_id = ${oid} ORDER BY entry_date DESC LIMIT 30`) journal[x.entry_date] = x.text;
  let daily = null;
  if (sc.daily) {
    const d = loads(r.oextra, {}).daily;
    if (isObj(d) && isObj(d.done)) {
      const tasks2 = (Array.isArray(d.tasks) ? d.tasks : []).filter((t) => isObj(t) && t.on !== false);
      const done = {};
      for (const [k, v] of Object.entries(d.done).slice(-60)) if (Array.isArray(v) && DATE.test(k)) done[k] = v.length;
      daily = { total: tasks2.length, done };
    }
  }
  const days = new Set(all.map((l) => l.t.slice(0, 10)));
  await sql`UPDATE shares SET last_viewed_at = ${nowIso()}, views = views + 1 WHERE id = ${r.id}`;
  return {
    name: r.oname,
    scope: sc,
    logs,
    journal,
    daily,
    streak: sc.moods ? streakOf(days) : null,
    total: sc.moods ? all.length : null,
    alerts: sc.alerts ? alertsFor(all) : []
  };
}
__name(keeperView, "keeperView");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
