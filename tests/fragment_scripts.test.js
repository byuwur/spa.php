const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class FakeScript {
  constructor(document, attributes = [], textContent = "") {
    this.document = document;
    this.attributes = attributes.map(([name, value]) => ({ name, value }));
    this.textContent = textContent;
    this.listeners = new Map();
    this.isConnected = false;
  }

  setAttribute(name, value) {
    const attr = this.attributes.find((item) => item.name === name);
    if (attr) attr.value = String(value);
    else this.attributes.push({ name, value: String(value) });
  }

  getAttribute(name) {
    return this.attributes.find((item) => item.name === name)?.value ?? null;
  }

  hasAttribute(name) {
    return this.attributes.some((item) => item.name === name);
  }

  get src() {
    return this.getAttribute("src") || "";
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type, listener) {
    if (this.listeners.get(type) === listener) this.listeners.delete(type);
  }

  dispatch(type) {
    this.listeners.get(type)?.();
  }

  replaceWith(node) {
    this.container.replace(this, node);
  }
}

class FakePlaceholder {
  constructor(document) {
    this.document = document;
    this.isConnected = false;
  }

  replaceWith(script) {
    if (!this.isConnected) return;
    this.container.replace(this, script);
    this.document.execute(script);
  }
}

class FakeContent {
  constructor(nodes) {
    this.nodes = nodes;
    nodes.forEach((node) => (node.container = this));
  }

  querySelectorAll(selector) {
    return selector === "script" ? this.nodes.filter((node) => node instanceof FakeScript) : [];
  }

  replace(oldNode, newNode) {
    const index = this.nodes.indexOf(oldNode);
    this.nodes[index] = newNode;
    newNode.container = this;
  }
}

class FakeTarget {
  constructor(document) {
    this.document = document;
    this.nodes = [];
  }

  replaceChildren(content) {
    this.nodes.forEach((node) => (node.isConnected = false));
    this.nodes = content.nodes;
    this.nodes.forEach((node) => {
      node.container = this;
      node.isConnected = true;
    });
  }

  set innerHTML(html) {
    this.nodes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].map((match) => new FakeScript(this.document, parseAttributes(match[1]), match[2]));
    this.nodes.forEach((node) => {
      node.container = this;
      node.isConnected = true;
    });
  }

  querySelectorAll(selector) {
    return selector === "script" ? this.nodes.filter((node) => node instanceof FakeScript) : [];
  }

  replace(oldNode, newNode) {
    const index = this.nodes.indexOf(oldNode);
    this.nodes[index] = newNode;
    oldNode.isConnected = false;
    newNode.container = this;
    newNode.isConnected = true;
  }
}

function parseAttributes(source) {
  return [...source.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)].map((match) => [match[1], match[2] ?? match[3] ?? match[4] ?? ""]);
}

function createHarness(plans = {}) {
  const order = [];
  const errors = [];
  const createdScripts = [];
  const fakeDocument = {
    createElement(tag) {
      if (tag === "template") {
        const template = {};
        Object.defineProperty(template, "innerHTML", {
          set(html) {
            const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].map((match) => new FakeScript(fakeDocument, parseAttributes(match[1]), match[2]));
            template.content = new FakeContent(scripts);
          }
        });
        return template;
      }
      const script = new FakeScript(fakeDocument);
      createdScripts.push(script);
      return script;
    },
    createComment() {
      return new FakePlaceholder(fakeDocument);
    },
    execute(script) {
      const src = script.getAttribute("src");
      const type = (script.getAttribute("type") || "").toLowerCase();
      const runInline = () => {
        try {
          Function("record", script.textContent)((value) => order.push(value));
        } catch (error) {
          errors.push(error);
        }
      };
      if (src !== null) {
        const plan = plans[src] || {};
        setTimeout(() => {
          if (plan.fail) script.dispatch("error");
          else {
            order.push(plan.label || src);
            script.dispatch("load");
          }
        }, plan.delay || 0);
      } else if (type === "module") {
        setTimeout(() => {
          runInline();
          script.dispatch("load");
        }, 0);
      } else runInline();
    }
  };
  const source = fs
    .readFileSync(path.join(__dirname, "..", "_spa.js"), "utf8")
    .replace("async function setHTML(", "bySPA.__setHTMLForTest = async function (")
    .replace(/\r?\n  init\(\);\r?\n(?=\}\)\(typeof window)/, "\n");
  const window = { bySPA: {} };
  const consoleMessages = [];
  vm.runInNewContext(source, {
    window,
    document: fakeDocument,
    byStorage: { getItem() { return null; } },
    byCommon: {},
    parse_json() { return null; },
    URL,
    URLSearchParams,
    console: { error(message) { consoleMessages.push(message); } }
  });
  window.bySPA.NAVIGATION_ID = 1;
  return { bySPA: window.bySPA, target: new FakeTarget(fakeDocument), order, errors, createdScripts, consoleMessages };
}

test("cold and cached external dependencies execute before dependent inline scripts", async () => {
  for (const delay of [25, 0]) {
    const harness = createHarness({ "viewer.js": { delay, label: "viewer" } });
    await harness.bySPA.__setHTMLForTest(harness.target, '<script src="viewer.js"></script><script>record("inline")</script>', 1);
    assert.deepEqual(harness.order, ["viewer", "inline"]);
  }
});

test("mixed ordered scripts preserve source order and defer remains ordered", async () => {
  const harness = createHarness({ "b.js": { delay: 10, label: "B" }, "d.js": { label: "D" } });
  await harness.bySPA.__setHTMLForTest(
    harness.target,
    '<script>record("A")</script><script src="b.js"></script><script>record("C")</script><script src="d.js" defer></script><script>record("E")</script>',
    1
  );
  assert.deepEqual(harness.order, ["A", "B", "C", "D", "E"]);
});

test("full-document error pages reuse ordered script processing", async () => {
  const harness = createHarness({ "error-dependency.js": { delay: 10, label: "dependency" } });
  await harness.bySPA.__setHTMLForTest(
    harness.target,
    '<html><body><script src="error-dependency.js"></script><script>record("dependent")</script></body></html>',
    1,
    true
  );
  assert.deepEqual(harness.order, ["dependency", "dependent"]);
});

test("missing and broken application scripts are non-fatal", async () => {
  const harness = createHarness({ "missing.js": { fail: true } });
  const result = await harness.bySPA.__setHTMLForTest(
    harness.target,
    '<script src="missing.js"></script><script>throw new Error("application error")</script><script>const =</script><script>record("later")</script>',
    1
  );
  assert.equal(result.includes("missing.js"), true);
  assert.equal(harness.errors.length, 2);
  assert.deepEqual(harness.order, ["later"]);
  assert.deepEqual(harness.consoleMessages, ["SPA fragment script failed to load: missing.js"]);
});

test("stale navigation stops remaining scripts and lifecycle work", async () => {
  const harness = createHarness({ "slow.js": { delay: 20, label: "slow" } });
  const insertion = harness.bySPA.__setHTMLForTest(harness.target, '<script src="slow.js"></script><script>record("stale")</script>', 1);
  harness.bySPA.NAVIGATION_ID = 2;
  assert.equal(await insertion, null);
  assert.deepEqual(harness.order, ["slow"]);
});

test("components, modules, attributes, async scripts, and repeat insertion keep their semantics", async () => {
  const harness = createHarness({ "async.js": { delay: 20, label: "async" } });
  const html = '<script src="async.js" async integrity="sha256-test" data-owner="component"></script><script>record("component")</script><script type="module">record("module")</script>';
  await harness.bySPA.__setHTMLForTest(harness.target, html, 1);
  assert.deepEqual(harness.order, ["component", "module"]);
  assert.equal(harness.createdScripts[0].getAttribute("integrity"), "sha256-test");
  assert.equal(harness.createdScripts[0].getAttribute("data-owner"), "component");
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.deepEqual(harness.order, ["component", "module", "async"]);

  await harness.bySPA.__setHTMLForTest(harness.target, '<script>record("repeat")</script>', 1);
  assert.deepEqual(harness.order, ["component", "module", "async", "repeat"]);
  assert.ok(harness.createdScripts.every((script) => script.listeners.size === 0));
});

test("route and component insertion share the private helper and lifecycle waits for both", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "_spa.js"), "utf8");
  assert.match(source, /setHTML\(document\.querySelector\(componentId\), data, navigationId\)/);
  assert.match(source, /setHTML\(document\.querySelector\("#spa-content"\), data, navigationId\)\.then/);
  assert.match(source, /setHTML\(document\.documentElement, data, navigationId, true\)/);
  assert.match(source, /window\.location\.reload\(\);[\s\S]*\{ once: true \}/);
  assert.ok(source.indexOf("Promise.allSettled(componentLoads") < source.indexOf("afterLoad({ ...routing, navigationId })"));
});

test("implementation-only SPA functions stay private", () => {
  const harness = createHarness();
  const privateFunctions = ["setRouteState", "historyPush", "historyReplace", "validateQuerySelector", "parseQuerySelector", "componentIdExists", "routeURL", "afterLoad", "init"];
  privateFunctions.forEach((name) => assert.equal(harness.bySPA[name], undefined));
  assert.equal(typeof harness.bySPA.load, "function");
});

test("implementation-only common initializers stay private", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "_common.js"), "utf8");
  ["initSidebar", "initMisc", "initCaptcha", "initCookieConsent", "initParticles"].forEach((name) => {
    assert.doesNotMatch(source, new RegExp(`byCommon\\.${name}\\s*=`));
  });
  assert.match(source, /byCommon\.initBootstrap\s*=/);
  assert.match(source, /byCommon\.init\s*=/);
});
