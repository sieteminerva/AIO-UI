var AioUI = (function() {
	// \0rolldown/runtime.js
	var __defProp = Object.defineProperty;
	var __exportAll = (all, no_symbols) => {
		let target = {};
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
		if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
		return target;
	};
	// \0@oxc-project+runtime@0.156.0/helpers/esm/checkPrivateRedeclaration.js
	function _checkPrivateRedeclaration(e, t) {
		if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object");
	}
	// \0@oxc-project+runtime@0.156.0/helpers/esm/classPrivateMethodInitSpec.js
	function _classPrivateMethodInitSpec(e, a) {
		_checkPrivateRedeclaration(e, a), a.add(e);
	}
	// \0@oxc-project+runtime@0.156.0/helpers/esm/classPrivateFieldInitSpec.js
	function _classPrivateFieldInitSpec(e, t, a) {
		_checkPrivateRedeclaration(e, t), t.set(e, a);
	}
	// \0@oxc-project+runtime@0.156.0/helpers/esm/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	// \0@oxc-project+runtime@0.156.0/helpers/esm/toPrimitive.js
	function toPrimitive(t, r) {
		if ("object" != _typeof(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	// \0@oxc-project+runtime@0.156.0/helpers/esm/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	// \0@oxc-project+runtime@0.156.0/helpers/esm/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	// \0@oxc-project+runtime@0.156.0/helpers/esm/assertClassBrand.js
	function _assertClassBrand(e, t, n) {
		if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n;
		throw new TypeError("Private element is not present on this object");
	}
	// \0@oxc-project+runtime@0.156.0/helpers/esm/classPrivateFieldGet2.js
	function _classPrivateFieldGet2(s, a) {
		return s.get(_assertClassBrand(s, a));
	}
	// \0@oxc-project+runtime@0.156.0/helpers/esm/classPrivateFieldSet2.js
	function _classPrivateFieldSet2(s, a, r) {
		return s.set(_assertClassBrand(s, a), r), r;
	}
	// packages/base/dist/BaseAdapters/ReactiveGraph.js
	var ReactiveGraph$1 = class {
		constructor() {
			_defineProperty(this, "activeEffect", null);
			_defineProperty(this, "pendingEffects", /* @__PURE__ */ new Set());
			_defineProperty(this, "flushScheduled", false);
			_defineProperty(
				this,
				/** target → prop → dep(effects that read it) */
				"graph",
				/* @__PURE__ */ new WeakMap()
			);
			_defineProperty(
				this,
				/** effect → deps it touched (for cleanup when body re-runs / unwatch) */
				"owned",
				/* @__PURE__ */ new WeakMap()
			);
		}
		getDep(target, prop) {
			let props = this.graph.get(target);
			if (!props) {
				props = /* @__PURE__ */ new Map();
				this.graph.set(target, props);
			}
			let dep = props.get(prop);
			if (!dep) {
				dep = { effects: /* @__PURE__ */ new Set() };
				props.set(prop, dep);
			}
			return dep;
		}
		/** Called from the proxy `get` handler while an effect is running. */
		track(target, prop) {
			if (!this.activeEffect || typeof prop === "symbol") return;
			const dep = this.getDep(target, prop);
			if (dep.effects.has(this.activeEffect)) return;
			dep.effects.add(this.activeEffect);
			let list = this.owned.get(this.activeEffect);
			if (!list) {
				list = /* @__PURE__ */ new Set();
				this.owned.set(this.activeEffect, list);
			}
			list.add(dep);
		}
		/** Called from the proxy `set`/`deleteProperty` handlers. */
		notify(target, prop) {
			const dep = this.graph.get(target)?.get(prop);
			if (!dep) return;
			for (const fn of Array.from(dep.effects)) this.schedule(fn);
		}
		schedule(effect) {
			this.pendingEffects.add(effect);
			if (this.flushScheduled) return;
			this.flushScheduled = true;
			queueMicrotask(() => {
				this.flushScheduled = false;
				const batch = Array.from(this.pendingEffects);
				this.pendingEffects.clear();
				for (const fn of batch) fn();
			});
		}
		releaseDeps(effect) {
			const list = this.owned.get(effect);
			if (!list) return;
			for (const dep of list) dep.effects.delete(effect);
			list.clear();
		}
		/**
		* Runs `fn` immediately, then re-runs it whenever any proxied state
		* it read during the last run mutates. Returns an unwatch function.
		*/
		watchEffect(fn) {
			let disposed = false;
			const run = () => {
				if (disposed) return;
				this.releaseDeps(run);
				this.activeEffect = run;
				try {
					fn();
				} finally {
					this.activeEffect = null;
				}
			};
			run();
			return () => {
				if (disposed) return;
				disposed = true;
				this.releaseDeps(run);
				this.pendingEffects.delete(run);
			};
		}
	};
	// packages/base/dist/BaseAdapters/BuilderProxy.js
	var IS_PROXY$1 = Symbol("IS_PROXY");
	/**
	* Whether `value` is a proxy this module handed out.
	*
	* A builder that keeps writing to the raw object it passed to `makeReactive` bypasses
	* every `set` trap, so nothing is notified. The base asks this question before it wires a
	* model, which turns that silent half-binding into one console warning.
	*
	* @param value - Anything a builder returned from `model()`.
	* @returns True only for a live proxy.
	*/
	function isReactive$1(value) {
		return Boolean(value && typeof value === "object" && value[IS_PROXY$1] === true);
	}
	var BuilderProxy$1 = class {
		constructor(proxyCache) {
			_defineProperty(
				this,
				/** Identity cache: raw payload object → its reactive proxy. */
				"proxyCache",
				void 0
			);
			_defineProperty(
				this,
				/** 🧲 Per-proxy reactive effect graph (owned, not module-global). */
				"reactive",
				new ReactiveGraph$1()
			);
			this.proxyCache = proxyCache;
		}
		makeReactive(key, payload, onUpdateCallback) {
			const self = this;
			function _isProxy(obj) {
				return Boolean(obj && typeof obj === "object" && obj[IS_PROXY$1] === true);
			}
			function _isPlainObjectOrArray(obj) {
				if (obj === null || typeof obj !== "object") return false;
				if (obj instanceof String || obj instanceof Number || obj instanceof Boolean) return false;
				if (Array.isArray(obj)) return true;
				const proto = Object.getPrototypeOf(obj);
				return proto === Object.prototype || proto === null;
			}
			if (payload == null || typeof payload !== "object") return payload;
			if (!_isPlainObjectOrArray(payload)) return payload;
			if (_isProxy(payload)) return payload;
			if (payload instanceof Node) return payload;
			if (this.proxyCache.has(payload)) return this.proxyCache.get(payload);
			const singleProxyObj = new Proxy(payload, {
				get: (target, prop, receiver) => {
					if (prop === IS_PROXY$1) return true;
					const value = Reflect.get(target, prop, receiver);
					if (typeof prop !== "symbol") this.reactive.track(target, prop);
					if (value !== null && _isPlainObjectOrArray(value) && !(value instanceof Node)) {
						if (self.proxyCache.has(value)) return self.proxyCache.get(value);
						return self.makeReactive(key, value, onUpdateCallback);
					}
					return value;
				},
				set: (target, prop, value, receiver) => {
					const isArray = Array.isArray(target);
					if (value !== null && typeof value === "object" && !_isProxy(value) && !(value instanceof Node)) value = self.makeReactive(key, value, onUpdateCallback);
					const isValueEqual = target[prop] === value;
					const success = Reflect.set(target, prop, value, receiver);
					if (success) {
						const isArrayLengthChange = isArray && prop === "length";
						const isArrayMutated = isArray && !isNaN(Number(prop));
						if (!isValueEqual || isArrayLengthChange || isArrayMutated) {
							this.reactive.notify(target, prop);
							if (typeof onUpdateCallback === "function") onUpdateCallback(target, prop, value);
						}
					}
					return success;
				},
				deleteProperty: (target, prop) => {
					const hasProp = prop in target;
					const success = Reflect.deleteProperty(target, prop);
					if (success && hasProp) {
						this.reactive.notify(target, prop);
						if (typeof onUpdateCallback === "function") onUpdateCallback(target, prop, void 0);
					}
					return success;
				}
			});
			this.proxyCache.set(payload, singleProxyObj);
			return singleProxyObj;
		}
		getByPath(obj, path) {
			return path.split(".").reduce((acc, key) => acc?.[key], obj);
		}
		setByPath(obj, path, value) {
			const segments = path.split(".");
			const last = segments.pop();
			if (!last) return;
			const target = segments.reduce((acc, key) => {
				if (acc[key] == null || typeof acc[key] !== "object") acc[key] = {};
				return acc[key];
			}, obj);
			target[last] = value;
		}
		readValue(el) {
			if (el instanceof HTMLInputElement && el.type === "checkbox") {
				const trueValue = el.dataset.trueValue ?? "true";
				const falseValue = el.dataset.falseValue ?? "false";
				if (el.value && el.value !== "on") return el.checked ? trueValue ?? el.value : falseValue ?? "";
				return el.checked;
			}
			if (el instanceof HTMLSelectElement) return el.value;
			return el.value;
		}
		writeValue(el, value) {
			if (el instanceof HTMLInputElement && el.type === "checkbox") {
				const trueValue = el.dataset.trueValue ?? "true";
				if (el.value && el.value !== "on") {
					el.checked = String(value ?? false) === String(trueValue);
					return;
				}
				el.checked = Boolean(value);
				return;
			}
			if (el instanceof HTMLSelectElement) {
				el.value = String(value ?? "");
				return;
			}
			el.value = value ?? "";
		}
		bind(root, source) {
			if (!(root instanceof HTMLElement)) return;
			root.querySelectorAll("[data-bind],[name]").forEach((el) => {
				const path = this.getBindingPath(el);
				if (!path) return;
				const existing = el.__builderBinding;
				if (existing) {
					existing.syncFromState = () => this.writeValue(el, this.getByPath(source, path));
					existing.syncToState = () => this.setByPath(source, path, this.readValue(el));
					return;
				}
				const syncFromState = () => this.writeValue(el, this.getByPath(source, path));
				const syncToState = () => this.setByPath(source, path, this.readValue(el));
				el.__builderBinding = {
					path,
					syncFromState,
					syncToState
				};
				el.addEventListener("input", syncToState);
				el.addEventListener("change", syncToState);
				syncFromState();
			});
		}
		sync(root, source) {
			if (!(root instanceof HTMLElement)) return;
			root.querySelectorAll("[data-bind],[name]").forEach((el) => {
				const path = this.getBindingPath(el);
				if (!path) return;
				this.writeValue(el, this.getByPath(source, path));
			});
		}
		/**
		* 🧲 Runs `fn` immediately and re-runs it whenever proxied state read
		* inside it mutates. Delegates to the owned ReactiveGraph.
		*/
		watchEffect(fn) {
			return this.reactive.watchEffect(fn);
		}
		/**
		* 🔄 STATE → UI AUTO-SYNC (reactive one-way binding)
		* Watches every `[data-bind]` control under `root` inside one effect:
		* writing to any proxied state path the controls point at re-writes
		* the control values automatically. Returns an unwatch function.
		*/
		bindReactive(root, source) {
			if (!(root instanceof HTMLElement)) return () => {};
			const controls = Array.from(root.querySelectorAll("[data-bind]"));
			return this.reactive.watchEffect(() => {
				for (const el of controls) {
					const path = this.getBindingPath(el);
					if (!path) continue;
					this.writeValue(el, this.getByPath(source, path));
				}
			});
		}
		getBindingPath(el) {
			const bindPath = el.dataset?.bind;
			if (bindPath) return bindPath;
			return el.name || null;
		}
	};
	// packages/base/dist/BaseAdapters/Binding.js
	var _proxy$1 = /* @__PURE__ */ new WeakMap();
	var _scopes$1 = /* @__PURE__ */ new WeakMap();
	var _model$1 = /* @__PURE__ */ new WeakMap();
	var _paint$2 = /* @__PURE__ */ new WeakMap();
	var _stopEffect$1 = /* @__PURE__ */ new WeakMap();
	var _Binding_brand$1 = /* @__PURE__ */ new WeakSet();
	/**
	* The mirror wire between one builder's model and the controls inside its scopes.
	*
	* A builder never touches this class: `Builder` owns the instance and calls `wire()` at
	* the three points where a DOM scope starts living (the root from `create()`, the element
	* projected by `attach()`, the element mounted by `project()`). Everything below is the
	* consequence of that one call — and of `unwire()`, which is the only way out.
	*
	* One direction is delegated, the other is drawn:
	*
	* - **control → model** — one `input`/`change` pair per scope, captured at the scope root.
	*   A control created later inside that scope is served by the same pair, and a control
	*   removed with its scope is served by nobody: the `AbortController` belongs to the
	*   scope, not to the instance.
	* - **model → control** — one effect per instance that walks every wired scope. It is
	*   registered once and re-runs on a microtask, so attaching three keys to one builder
	*   still paints them from one state instead of three subscriptions.
	*
	* `data-bind` is the only binding attribute. `name` is form semantics and is deliberately
	* not consulted here, even though `BuilderProxy.getBindingPath` falls back to it.
	*/
	var Binding$1 = class {
		constructor(proxy) {
			_classPrivateMethodInitSpec(this, _Binding_brand$1);
			_classPrivateFieldInitSpec(this, _proxy$1, void 0);
			_classPrivateFieldInitSpec(this, _scopes$1, /* @__PURE__ */ new Map());
			_classPrivateFieldInitSpec(this, _model$1, null);
			_classPrivateFieldInitSpec(this, _paint$2, null);
			_classPrivateFieldInitSpec(this, _stopEffect$1, null);
			_classPrivateFieldSet2(_proxy$1, this, proxy);
		}
		/** Whether this instance is currently mirroring anything. */
		get active() {
			return _classPrivateFieldGet2(_scopes$1, this).size > 0;
		}
		/**
		* Starts mirroring one scope.
		*
		* Idempotent per scope: re-entering is a no-op, which is what makes `attach()` safe to
		* call repeatedly for the same key. Hydration runs first (model → control), so the first
		* paint already agrees with the model.
		*
		* @param scope - the element whose subtree holds the `[data-bind]` controls.
		* @param model - the builder's plain model; wrapped once, then shared by every scope.
		* @param paint - optional drawer for everything that is not a control value.
		*/
		wire(scope, model, paint) {
			if (!model || !(scope instanceof HTMLElement)) return;
			if (_classPrivateFieldGet2(_scopes$1, this).has(scope)) return;
			_classPrivateFieldGet2(_model$1, this) ?? _classPrivateFieldSet2(_model$1, this, _classPrivateFieldGet2(_proxy$1, this).makeReactive("model", model));
			_classPrivateFieldGet2(_paint$2, this) ?? _classPrivateFieldSet2(_paint$2, this, paint ?? null);
			const state = _classPrivateFieldGet2(_model$1, this);
			const controls = _assertClassBrand(_Binding_brand$1, this, _scan$1).call(this, scope);
			for (const control of controls) _classPrivateFieldGet2(_proxy$1, this).writeValue(control.element, _classPrivateFieldGet2(_proxy$1, this).getByPath(state, control.path));
			const abort = new AbortController();
			const onEvent = (event) => {
				const element = event.target?.closest?.("[data-bind]");
				if (!element || !scope.contains(element)) return;
				const path = element.dataset.bind;
				if (!path) return;
				_classPrivateFieldGet2(_proxy$1, this).setByPath(state, path, _classPrivateFieldGet2(_proxy$1, this).readValue(element));
			};
			scope.addEventListener("input", onEvent, { signal: abort.signal });
			scope.addEventListener("change", onEvent, { signal: abort.signal });
			_classPrivateFieldGet2(_scopes$1, this).set(scope, {
				controls,
				abort
			});
			_classPrivateFieldGet2(_stopEffect$1, this) ?? _classPrivateFieldSet2(_stopEffect$1, this, _classPrivateFieldGet2(_proxy$1, this).watchEffect(() => _assertClassBrand(_Binding_brand$1, this, _flush$1).call(this)));
		}
		/**
		* Stops mirroring one scope: its listeners die with the scope, and the effect dies with
		* the last scope. Detaching a key therefore leaves the builder with exactly the wiring
		* that is still on screen.
		*/
		unwire(scope) {
			const entry = _classPrivateFieldGet2(_scopes$1, this).get(scope);
			if (!entry) return;
			entry.abort.abort();
			_classPrivateFieldGet2(_scopes$1, this).delete(scope);
			if (!_classPrivateFieldGet2(_scopes$1, this).size) {
				_classPrivateFieldGet2(_stopEffect$1, this)?.call(this);
				_classPrivateFieldSet2(_stopEffect$1, this, null);
			}
		}
		/** Releases everything — called from `destroy()`, never from a builder. */
		dispose() {
			for (const scope of Array.from(_classPrivateFieldGet2(_scopes$1, this).keys())) this.unwire(scope);
			_classPrivateFieldGet2(_stopEffect$1, this)?.call(this);
			_classPrivateFieldSet2(_stopEffect$1, this, null);
			_classPrivateFieldSet2(_model$1, this, null);
			_classPrivateFieldSet2(_paint$2, this, null);
		}
		/**
		* Re-reads the controls of an already wired scope.
		*
		* Needed when a key is re-rendered inside a scope that stays mounted: the old elements
		* are gone, so the registry has to be rebuilt from the subtree that is there now.
		*/
		rescan(scope) {
			const entry = _classPrivateFieldGet2(_scopes$1, this).get(scope);
			if (!entry || !_classPrivateFieldGet2(_model$1, this)) return;
			entry.controls = _assertClassBrand(_Binding_brand$1, this, _scan$1).call(this, scope);
			for (const control of entry.controls) _classPrivateFieldGet2(_proxy$1, this).writeValue(control.element, _classPrivateFieldGet2(_proxy$1, this).getByPath(_classPrivateFieldGet2(_model$1, this), control.path));
		}
	};
	/** model → control, then model → everything the builder wants to draw. */
	function _flush$1() {
		const model = _classPrivateFieldGet2(_model$1, this);
		if (!model) return;
		for (const [scope, entry] of _classPrivateFieldGet2(_scopes$1, this)) {
			for (const control of entry.controls) {
				if (control.element === document.activeElement) continue;
				_classPrivateFieldGet2(_proxy$1, this).writeValue(control.element, _classPrivateFieldGet2(_proxy$1, this).getByPath(model, control.path));
			}
			_classPrivateFieldGet2(_paint$2, this)?.call(this, scope, model);
		}
	}
	function _scan$1(scope) {
		const found = [];
		for (const element of Array.from(scope.querySelectorAll("[data-bind]"))) {
			const path = element.dataset.bind;
			if (path) found.push({
				element,
				path
			});
		}
		return found;
	}
	// packages/base/dist/BaseAdapters/ContentContract.js
	var isRecord$1 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
	/** The word a developer sees in `received` — `array`, `null`, `string`, … */
	var typeName$1 = (value) => {
		if (value === null) return "null";
		if (Array.isArray(value)) return "array";
		return typeof value;
	};
	/** `content` or `content.title` or `content[2].title` */
	var childPath$1 = (path, key) => typeof key === "number" ? `${path}[${key}]` : path ? `${path}.${key}` : key;
	var issue$1 = (code, path, expected, received, message, severity = "error", allowed) => ({
		code,
		path,
		expected,
		received: typeName$1(received),
		allowed,
		message,
		severity
	});
	/**
	* Applies the contract's legacy spellings, once.
	*
	* `from` is a top-level key; `to` is the top-level field that replaces it (`""` means the
	* legacy value *is* the payload). A payload that already carries the new field wins, so the
	* pass cannot overwrite good input.
	*/
	function applyLegacy$1(contract, content, issues) {
		if (!contract.legacy?.length || !isRecord$1(content)) return content;
		let result = null;
		const mutable = () => result ?? (result = { ...content });
		for (const entry of contract.legacy) {
			if (!Object.prototype.hasOwnProperty.call(content, entry.from)) continue;
			const target = mutable();
			const value = target[entry.from];
			delete target[entry.from];
			if (entry.to === "") {
				issues.push(issue$1("INPUT_LEGACY_USED", "content", "payload directly", value, `body shape "${entry.from}" is legacy — ${entry.reason}`, "warning"));
				return value;
			}
			if (target[entry.to] === void 0) target[entry.to] = value;
			issues.push(issue$1("INPUT_LEGACY_USED", childPath$1("content", entry.from), childPath$1("content", entry.to), value, `"${entry.from}" is legacy, read as "${entry.to}" — ${entry.reason}`, "warning"));
		}
		return result ?? content;
	}
	/**
	* Structural fit — does `value` *look like* this spec? Never throws, collects nothing.
	*
	* A union uses it to pick a branch before normalising, so this is deliberately a cheap
	* type test, not a full validation: a `record` that is missing a required field still
	* fits, and `check()` reports the missing field on the chosen branch.
	*/
	function fits$1(spec, value) {
		switch (spec.t) {
			case "any": return true;
			case "string": return typeof value === "string";
			case "number": return typeof value === "number" && Number.isFinite(value);
			case "boolean": return typeof value === "boolean";
			case "enum": return spec.of.includes(value);
			case "record": return isRecord$1(value);
			case "list": return Array.isArray(value) || spec.single === true && isRecord$1(value);
			case "element": return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
			case "union": return spec.of.some((branch) => fits$1(branch, value));
		}
	}
	/** Walks one spec against one value, collecting issues and returning the normalised value. */
	function check$1(spec, value, path, issues) {
		if (value === void 0) {
			if (spec.req) issues.push(issue$1("INPUT_MISSING_FIELD", path, describe$1(spec), value, `required field is missing`));
			return value;
		}
		switch (spec.t) {
			case "any": return value;
			case "element":
				if (typeof HTMLElement === "undefined" || !(value instanceof HTMLElement)) issues.push(issue$1("INPUT_WRONG_TYPE", path, "element", value, `expected a DOM element`));
				return value;
			case "union": {
				const branch = spec.of.find((candidate) => fits$1(candidate, value));
				if (!branch) {
					issues.push(issue$1("INPUT_SHAPE", path, describe$1(spec), value, `fits none of: ${describe$1(spec)}`));
					return value;
				}
				return check$1(branch, value, path, issues);
			}
			case "string":
				if (typeof value !== "string") issues.push(issue$1("INPUT_WRONG_TYPE", path, "string", value, `expected string`));
				return value;
			case "number":
				if (typeof value !== "number" || !Number.isFinite(value)) issues.push(issue$1("INPUT_WRONG_TYPE", path, "number", value, `expected number`));
				return value;
			case "boolean":
				if (typeof value !== "boolean") issues.push(issue$1("INPUT_WRONG_TYPE", path, "boolean", value, `expected boolean`));
				return value;
			case "enum":
				if (!spec.of.includes(value)) issues.push(issue$1("INPUT_BAD_ENUM", path, `one of ${spec.of.join(" | ")}`, value, `value is not in the allowed set`, "error", spec.of));
				return value;
			case "record": {
				if (!isRecord$1(value)) {
					issues.push(issue$1("INPUT_WRONG_TYPE", path, "object", value, `expected object`));
					return value;
				}
				const fields = spec.of ?? {};
				let result = null;
				for (const [key, fieldSpec] of Object.entries(fields)) {
					const next = check$1(fieldSpec, value[key], childPath$1(path, key), issues);
					if (next !== value[key]) (result ?? (result = { ...value }))[key] = next;
				}
				for (const key of Object.keys(value)) {
					if (key in fields) continue;
					if (spec.open) continue;
					issues.push(issue$1("INPUT_UNKNOWN_FIELD", childPath$1(path, key), "a declared field", value[key], `"${key}" is not declared by this contract`, "warning"));
				}
				return result ?? value;
			}
			case "list": {
				let list = value;
				if (!Array.isArray(list)) {
					if (spec.single && isRecord$1(list)) list = [list];
					else {
						issues.push(issue$1("INPUT_WRONG_TYPE", path, "array", value, `expected array`));
						return value;
					}
				}
				const items = list;
				if (spec.min !== void 0 && items.length < spec.min) issues.push(issue$1("INPUT_TOO_FEW", path, `at least ${spec.min} item(s)`, items, `${items.length} item(s) received`));
				if (spec.max !== void 0 && items.length > spec.max) issues.push(issue$1("INPUT_TOO_MANY", path, `at most ${spec.max} item(s)`, items, `${items.length} item(s) received`));
				if (!spec.of) return list;
				let changed = list !== value;
				const next = items.map((item, index) => {
					const resolved = check$1(spec.of, item, childPath$1(path, index), issues);
					if (resolved !== item) changed = true;
					return resolved;
				});
				return changed ? next : list;
			}
		}
	}
	/** One-line description of a spec, used in `expected`. */
	function describe$1(spec) {
		switch (spec.t) {
			case "record": return "object";
			case "list": return "array";
			case "enum": return `one of ${spec.of.join(" | ")}`;
			case "union": return spec.of.map(describe$1).join(" | ");
			case "element": return "element";
			case "any": return "any value";
			default: return spec.t;
		}
	}
	/**
	* Normalises `content` against a contract.
	*
	* A builder with no contract gets its payload back untouched and no issues — the door
	* stays open for a component that has not declared a shape yet.
	*/
	function normalize$1(contract, content) {
		if (!contract) return {
			content,
			issues: []
		};
		const issues = [];
		const resolved = applyLegacy$1(contract, content, issues);
		return {
			content: check$1(contract.schema, resolved, "content", issues),
			issues
		};
	}
	// packages/core/dist/Registry/RegistryError.js
	/**
	* Typed error used by every registry kernel failure path.
	*
	* @summary Carries a stable `code`, the registry `scope`, and the offending `id`
	* so callers can branch on the failure kind without parsing messages.
	*
	* @example
	* try {
	*   registry.register("cascade", definition);
	* } catch (error) {
	*   if (error instanceof RegistryError && error.code === "DUPLICATE_ID") {
	*     // handle the duplicate registration
	*   }
	* }
	*/
	var RegistryError$1 = class extends Error {
		/**
		* @param code - Stable failure reason.
		* @param message - Human-readable message.
		* @param details - Registry scope and, when relevant, the offending id.
		*/
		constructor(code, message, details) {
			super(message);
			_defineProperty(
				this,
				/** Stable failure reason. */
				"code",
				void 0
			);
			_defineProperty(
				this,
				/** Registry scope that raised the error. */
				"scope",
				void 0
			);
			_defineProperty(
				this,
				/** Offending id, when the failure is id-specific. */
				"id",
				void 0
			);
			this.name = "RegistryError";
			this.code = code;
			this.scope = details.scope;
			this.id = details.id;
		}
	};
	// packages/core/dist/Registry/RegistryScope.js
	/** Scope labels must start with an alphanumeric character and contain no spaces. */
	var SCOPE_PATTERN$1 = /^[a-z0-9][a-z0-9._-]*$/i;
	/**
	* Validates and normalises a registry scope label.
	*
	* @summary Trims the label and rejects values that cannot be used as a stable
	* namespace key, so two registries cannot silently share a scope by accident.
	* @param scope - Candidate scope label, for example `"component"` or `"form"`.
	* @returns The trimmed scope label.
	* @throws {RegistryError} With code `INVALID_SCOPE` when the label is empty, padded-recoverable but malformed, or contains whitespace.
	* @example
	* assertValidScope("form"); // "form"
	* assertValidScope("  ");   // throws RegistryError
	*/
	function assertValidScope$1(scope) {
		const trimmed = typeof scope === "string" ? scope.trim() : "";
		if (!trimmed || !SCOPE_PATTERN$1.test(trimmed)) throw new RegistryError$1("INVALID_SCOPE", `Invalid registry scope "${String(scope)}". Use a non-empty label without whitespace.`, { scope: trimmed || String(scope) });
		return trimmed;
	}
	/**
	* Validates a registry entry id.
	*
	* @summary Rejects empty and whitespace-only ids so `register()` cannot create
	* entries that later lookups can never address.
	* @param id - Candidate identifier.
	* @param scope - Scope used for error reporting.
	* @returns The identifier unchanged.
	* @throws {RegistryError} With code `INVALID_ID` when the id is not a non-empty string.
	* @example
	* assertValidId("cascade", "form"); // "cascade"
	*/
	function assertValidId$1(id, scope) {
		if (typeof id !== "string" || !id.trim()) throw new RegistryError$1("INVALID_ID", `Invalid registry id "${String(id)}" in scope "${scope}". Ids must be non-empty strings.`, {
			scope,
			id: String(id)
		});
		return id;
	}
	// packages/core/dist/Registry/Registry.js
	/** Duplicate policy used when the caller does not provide one. */
	var DEFAULT_DUPLICATE_POLICY$1 = "error";
	var _scope$1 = /* @__PURE__ */ new WeakMap();
	var _duplicate$1 = /* @__PURE__ */ new WeakMap();
	var _onDispose$1 = /* @__PURE__ */ new WeakMap();
	var _values$1 = /* @__PURE__ */ new WeakMap();
	/**
	* 🧱 REGISTRY KERNEL — generic storage and resolution primitive.
	*
	* The kernel owns exactly one concern: mapping string ids to values inside an
	* isolated instance, with explicit duplicate handling and disposal. It knows
	* nothing about components, DOM, stylesheets, modules, pages, or lazy loading.
	* Those are adapter responsibilities (`ComponentRegistry`, future
	* `ModuleRegistry`, `PageRegistry`, `TemplateRegistry`).
	*
	* @example
	* const registry = new Registry<Definition>("module", { duplicate: "warn" });
	* registry.register("cascade", cascadeDefinition);
	* const definition = registry.resolve("cascade");
	*/
	var Registry$1 = class {
		/**
		* @param scope - Namespace label, for example `"component"` or `"form"`.
		* @param options - Duplicate policy and optional disposal hook.
		* @throws {RegistryError} With code `INVALID_SCOPE` when the scope label is malformed.
		*/
		constructor(scope, options = {}) {
			_classPrivateFieldInitSpec(this, _scope$1, void 0);
			_classPrivateFieldInitSpec(this, _duplicate$1, void 0);
			_classPrivateFieldInitSpec(this, _onDispose$1, void 0);
			_classPrivateFieldInitSpec(this, _values$1, /* @__PURE__ */ new Map());
			_classPrivateFieldSet2(_scope$1, this, assertValidScope$1(scope));
			_classPrivateFieldSet2(_duplicate$1, this, options.duplicate ?? DEFAULT_DUPLICATE_POLICY$1);
			_classPrivateFieldSet2(_onDispose$1, this, options.onDispose);
		}
		/** Scope label that isolates this instance from other registry instances. */
		get scope() {
			return _classPrivateFieldGet2(_scope$1, this);
		}
		/** Number of stored entries. */
		get size() {
			return _classPrivateFieldGet2(_values$1, this).size;
		}
		/**
		* Registers a value under an id.
		*
		* @summary Validates the id, applies the duplicate policy from the constructor
		* options, then stores the value.
		* @param id - Identifier unique inside this instance.
		* @param value - Value to store. The kernel never interprets it.
		* @returns The current instance, for fluent registration chains.
		* @throws {RegistryError} With code `INVALID_ID` for a malformed id, or `DUPLICATE_ID` when the policy is `"error"` and the id exists.
		* @example
		* registry.register("masonry", masonryDefinition);
		*/
		register(id, value) {
			const key = assertValidId$1(id, _classPrivateFieldGet2(_scope$1, this));
			if (_classPrivateFieldGet2(_values$1, this).has(key)) switch (_classPrivateFieldGet2(_duplicate$1, this)) {
				case "error": throw new RegistryError$1("DUPLICATE_ID", `Registry "${_classPrivateFieldGet2(_scope$1, this)}" already contains an entry for "${key}".`, {
					scope: _classPrivateFieldGet2(_scope$1, this),
					id: key
				});
				case "ignore": return this;
				case "warn": console.warn(`[Registry:${_classPrivateFieldGet2(_scope$1, this)}] Replacing duplicate entry "${key}".`);
			}
			_classPrivateFieldGet2(_values$1, this).set(key, value);
			return this;
		}
		/**
		* Resolves a value by id.
		*
		* @summary Read-only lookup. Missing ids and non-string inputs resolve to
		* `null` instead of throwing, so optional resolution stays branch-free at
		* call sites such as `resolve(id) ?? fallback`.
		* @param id - Identifier to look up.
		* @returns The stored value, or `null` when absent.
		* @example
		* const definition = registry.resolve("cascade");
		*/
		resolve(id) {
			if (typeof id !== "string") return null;
			return _classPrivateFieldGet2(_values$1, this).get(id) ?? null;
		}
		/**
		* Resolves a value by id and fails when it is missing.
		*
		* @summary Use this when a missing registration is a programming error rather
		* than an expected optional path.
		* @param id - Identifier to look up.
		* @returns The stored value.
		* @throws {RegistryError} With code `MISSING_ENTRY` when nothing is registered under `id`.
		* @example
		* const definition = registry.require("cascade");
		*/
		require(id) {
			const value = this.resolve(id);
			if (value === null) throw new RegistryError$1("MISSING_ENTRY", `Registry "${_classPrivateFieldGet2(_scope$1, this)}" has no entry for "${String(id)}".`, {
				scope: _classPrivateFieldGet2(_scope$1, this),
				id: String(id)
			});
			return value;
		}
		/**
		* Checks whether an id is registered.
		*
		* @param id - Identifier to test.
		* @returns `true` when an entry exists.
		* @example
		* registry.has("cascade"); // true
		*/
		has(id) {
			return typeof id === "string" && _classPrivateFieldGet2(_values$1, this).has(id);
		}
		/**
		* Removes an entry and disposes it.
		*
		* @summary Deletes the entry first, then calls the disposal hook, so a hook
		* that inspects the registry never observes the detached value.
		* @param id - Identifier to remove.
		* @returns `true` when an entry was removed, `false` when it was absent.
		* @example
		* registry.unregister("cascade");
		*/
		unregister(id) {
			if (typeof id !== "string" || !_classPrivateFieldGet2(_values$1, this).has(id)) return false;
			const value = _classPrivateFieldGet2(_values$1, this).get(id);
			_classPrivateFieldGet2(_values$1, this).delete(id);
			_classPrivateFieldGet2(_onDispose$1, this)?.call(this, value, id);
			return true;
		}
		/**
		* Removes every entry and disposes each one.
		*
		* @summary Clears storage before invoking the disposal hook for every removed
		* pair, so re-entrant lookups during disposal see an empty registry.
		* @returns Nothing.
		* @example
		* registry.clear();
		*/
		clear() {
			const detached = Array.from(_classPrivateFieldGet2(_values$1, this).entries());
			_classPrivateFieldGet2(_values$1, this).clear();
			for (const [id, value] of detached) _classPrivateFieldGet2(_onDispose$1, this)?.call(this, value, id);
		}
		/**
		* Lists stored pairs in registration order.
		*
		* @returns A new array that is safe to mutate.
		* @example
		* registry.entries(); // [{ id: "cascade", value: definition }]
		*/
		entries() {
			return Array.from(_classPrivateFieldGet2(_values$1, this), ([id, value]) => ({
				id,
				value
			}));
		}
		/**
		* Lists registered ids in registration order.
		*
		* @returns A new array that is safe to mutate.
		* @example
		* registry.ids(); // ["masonry", "article"]
		*/
		ids() {
			return Array.from(_classPrivateFieldGet2(_values$1, this).keys());
		}
	};
	// packages/core/dist/BuilderPort.js
	var builderAdapter$1 = null;
	/**
	* @summary Plug an implementation into the builder port.
	* @param adapter - The adapter to use, or `null` to detach it again.
	*/
	function setBuilderAdapter$1(adapter) {
		builderAdapter$1 = adapter;
	}
	/**
	* @summary Read the currently plugged adapter.
	* @returns The active adapter, or `null` when no builder package has loaded yet.
	*/
	function getBuilderAdapter$1() {
		return builderAdapter$1;
	}
	// packages/core/dist/Registry/BuilderInstances.js
	/**
	* Builder instances pinned to the element they produced.
	*
	* The app replaces the whole tree on every render pass, so the previous page's
	* builders are detached without anyone telling them. Nothing was calling
	* `destroy()` — and a builder's timers, observers and global listeners outlive
	* its nodes (see `docs/framework/APP-LIFECYCLE.md`).
	*
	* `ComponentRegistry.build()` pins the instance it just created on the element it
	* returns; `releaseBuilders()` walks a subtree, finds every pinned instance and
	* destroys it once. That is the whole mechanism: no per-route bookkeeping, and a
	* nested builder (a card inside a grid) is found because its root is a descendant.
	*
	* Registry-only on purpose. A builder created directly (a table inside a form field,
	* a component in a test) has no owner that would ever sweep it, so pinning there
	* would only write a symbol nobody reads — the mechanism exists because *the app*
	* replaces whole trees.
	*
	* The key is a `Symbol.for`, not a local symbol: a dev graph and a built bundle
	* can both be loaded on one page, and the pin has to mean the same thing to both.
	*/
	var BUILDER_INSTANCE$1 = Symbol.for("aio-ui.builder-instance");
	/**
	* Pins a builder instance on the root element it returned.
	*
	* @param root - The root of the tree the builder created.
	* @param instance - The builder itself.
	* @returns Nothing.
	*
	* @summary Called by `ComponentRegistry.build()`, the only owner that ever sweeps a
	*   subtree. The pin lives on the node, so it leaves with the node: an element collected
	*   by the GC cannot keep a builder alive.
	*/
	function attachBuilder$1(root, instance) {
		if (!root || !instance || typeof root !== "object") return;
		root[BUILDER_INSTANCE$1] = instance;
	}
	/**
	* Destroys every builder pinned inside a subtree that is about to be discarded.
	*
	* @param root - The subtree root (`AioApp`'s outgoing shell, a page's remembered shell).
	* @returns How many instances were destroyed.
	*
	* @example
	* releaseBuilders(app.root);   // before the next render replaces it
	*
	* @summary Each instance is unpinned *before* its `destroy()` runs, so a second sweep over
	*   the same tree — the page's `onDestroy` followed by the app's paint step — is a no-op
	*   instead of a double teardown. A builder that throws cannot stop the others: the error
	*   is reported and the sweep continues, because the alternative is leaking everything
	*   behind the first broken component.
	*/
	function releaseBuilders$1(root) {
		if (!root || typeof root.querySelectorAll !== "function") return 0;
		const elements = [root, ...root.querySelectorAll("*")];
		const released = /* @__PURE__ */ new Set();
		for (const element of elements) {
			const record = element;
			const instance = record[BUILDER_INSTANCE$1];
			if (!instance || released.has(instance)) continue;
			delete record[BUILDER_INSTANCE$1];
			released.add(instance);
			try {
				instance.destroy?.();
			} catch (error) {
				console.error("[builders] destroy failed:", error);
			}
		}
		return released.size;
	}
	// packages/core/dist/Stylesheets.js
	/**
	* Lazy stylesheet seam — one place that knows where a component's CSS lives.
	*
	* A component never imports its own stylesheet. A static `import "./Table.css"` is
	* resolved by the bundler, so the sheet rides inside the JS chunk: it is downloaded
	* with the component *and* injected again by the lazy loader, and it defeats the point
	* of loading the component on demand. Instead a builder declares
	* `stylesheet = "./X.css"`, the host declares where that file can be fetched, and this
	* module resolves the two.
	*
	* Two callers use it:
	*
	* - the `ComponentRegistry`, which injects through the `<style>` id scheme declared here;
	* - {@link ensureStylesheet} — any builder, including the ones created *outside* the
	*   registry (a table built inside a form field, a dropdown inside an input), asks for
	*   its own sheet by specifier.
	*
	* The anti-FOUC *hold* is deliberately absent: hiding an unstyled root is a lifecycle
	* detail of `Builder.create()` (which knows its own `loading()` mockup), so it lives next
	* to the builder in `@aio-ui/base/BaseAdapters/Hydration`. This module only answers "is
	* the sheet there" and "give me the sheet".
	*/
	/** Host-declared loaders, keyed by the module specifier the host chose. */
	var assets$1 = {};
	/** Specifiers already injected, so a second request never re-fetches or re-inserts. */
	var ready$1 = /* @__PURE__ */ new Set();
	var loading$1 = /* @__PURE__ */ new Map();
	/**
	* Registers the host's stylesheet loaders.
	*
	* @param styles - The same map the host hands the `ComponentRegistry`.
	* @returns Nothing.
	*
	* @summary Called by the registry constructor: the host already declares its asset
	* maps once, and this makes the same declaration usable by builders that never pass
	* through the registry.
	*/
	function useStylesheetAssets$1(styles) {
		assets$1 = styles ?? {};
	}
	/**
	* Normalizes a specifier to `/<specifier>` so two spellings of one sheet share a key.
	*
	* @param specifier - Specifier as declared by a component or the host.
	* @returns The normalized key (`""` for an empty specifier).
	*/
	function normalizeStylesheetPath$1(specifier) {
		if (!specifier) return "";
		let clean = specifier.trim().replace(/\\/g, "/");
		if (clean.startsWith("./")) clean = clean.slice(2);
		if (clean.startsWith("/")) clean = clean.slice(1);
		return `/${clean}`;
	}
	/** File name of a specifier: the fallback key when the host layout is unknown. */
	function baseNameOf$1(specifier) {
		return specifier.replace(/\\/g, "/").split("/").pop() ?? "";
	}
	/**
	* Finds the loader for a component's declared stylesheet.
	*
	* @param specifier - What the component declares, usually relative to itself (`"./Table.css"`).
	* @returns The loader and the key it was found under, or `undefined` when the host
	*   declares no such sheet.
	*
	* @summary A component cannot know the host's key layout, so the declaration is tried
	* as written, normalized, case-insensitively, and finally by file name — the sheet sits
	* next to the component under a name no sibling reuses.
	*/
	function resolveLoader$1(specifier) {
		if (!specifier) return void 0;
		const candidates = [specifier, normalizeStylesheetPath$1(specifier)];
		for (const candidate of candidates) if (typeof assets$1[candidate] === "function") return {
			key: normalizeStylesheetPath$1(candidate),
			load: assets$1[candidate]
		};
		const wanted = candidates.map((candidate) => candidate.toLowerCase());
		const exact = Object.keys(assets$1).find((key) => wanted.includes(key.toLowerCase()));
		if (exact) return {
			key: normalizeStylesheetPath$1(exact),
			load: assets$1[exact]
		};
		const file = baseNameOf$1(specifier).toLowerCase();
		const byName = file ? Object.keys(assets$1).find((key) => baseNameOf$1(key).toLowerCase() === file) : void 0;
		return byName ? {
			key: normalizeStylesheetPath$1(byName),
			load: assets$1[byName]
		} : void 0;
	}
	/** `<style>` id for one sheet: stable across the registry path and this one. */
	function styleTagId$1(specifier) {
		return `rajutan-lazy-css__${normalizeStylesheetPath$1(specifier).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
	}
	/** Whether this sheet is already part of the document (either injection path). */
	function isStyleInjected$1(specifier) {
		if (typeof document === "undefined") return true;
		return Boolean(document.getElementById(styleTagId$1(specifier)));
	}
	/**
	* Whether a component's own stylesheet is still on its way.
	*
	* @param specifier - The component's declared `stylesheet` (`"./Table.css"`).
	* @returns `true` only when the host declares a loader for this sheet and the document
	*   does not have it yet — the single state in which a builder must hold its root.
	*
	* @example
	* if (isStylesheetPending("./Table.css")) return "still coming";
	*
	* @summary A component without a loader is never "pending": waiting for a sheet nobody
	*   can serve would strand the anti-FOUC hold forever. A non-DOM host (SSR, tests) has no
	*   document to be styled, so it never holds either. This is the question the hold asks
	*   *before* a root is returned — hence synchronous, unlike {@link ensureStylesheet}.
	*/
	function isStylesheetPending$1(specifier) {
		const resolved = resolveLoader$1(specifier);
		if (!resolved) return false;
		return !isStyleInjected$1(resolved.key);
	}
	/**
	* Writes a stylesheet into the document as a real `<style>` element.
	*
	* @param rawCss - Stylesheet text as returned by the loader.
	* @param specifier - Specifier the text belongs to; drives the element id and dedupe.
	* @returns Nothing.
	*
	* @summary A `<style>` node (not `adoptedStyleSheets`) so the sheet is visible in
	* DevTools, and idempotent by id so the registry and {@link ensureStylesheet} can both
	* ask for the same sheet without duplicating rules.
	*/
	function injectLazyCss$1(rawCss, specifier) {
		if (!rawCss || typeof document === "undefined") return;
		const id = styleTagId$1(specifier);
		if (document.getElementById(id)) return;
		const style = document.createElement("style");
		style.id = id;
		style.setAttribute("data-lazy-component", "true");
		style.textContent = rawCss;
		document.head.appendChild(style);
	}
	/**
	* Makes sure one component's stylesheet is present.
	*
	* @param specifier - The component's declared `stylesheet` (`"./Table.css"`).
	* @returns A promise resolved once the sheet is in the document, or immediately when
	*   the host declares no loader for it (never a rejection: style is not fatal).
	*
	* @example
	* void ensureStylesheet("./Table.css"); // a table built outside the registry
	*
	* @summary The one call the hydration hold makes: `Builder.create()` asks for its own
	*   sheet, so a component a builder constructs directly (never through the registry) is
	*   styled by the same loader. It is a no-op when the sheet already arrived, so the two
	*   paths cannot double-inject.
	*/
	function ensureStylesheet$1(specifier) {
		const resolved = resolveLoader$1(specifier);
		if (!resolved) return Promise.resolve();
		if (ready$1.has(resolved.key)) {
			if (isStyleInjected$1(resolved.key)) return Promise.resolve();
			ready$1.delete(resolved.key);
		}
		if (isStyleInjected$1(resolved.key)) {
			ready$1.add(resolved.key);
			return Promise.resolve();
		}
		const inflight = loading$1.get(resolved.key);
		if (inflight) return inflight;
		const session = Promise.resolve().then(() => resolved.load()).then((module) => {
			const raw = typeof module === "string" ? module : module?.default;
			if (typeof raw !== "string") {
				console.warn(`[stylesheets] loader for "${resolved.key}" returned ${typeof module}, not CSS text — skipped`);
				return;
			}
			injectLazyCss$1(raw, resolved.key);
			ready$1.add(resolved.key);
		}).catch((error) => {
			console.warn(`[stylesheets] could not load "${resolved.key}":`, error);
		}).finally(() => {
			loading$1.delete(resolved.key);
		});
		loading$1.set(resolved.key, session);
		return session;
	}
	// packages/core/dist/ComponentRegistry.js
	/**
	* Layered config for one build: `theme < emitter < schema`.
	*
	* The emitter sits above the theme so every builder gets a publisher even when a theme
	* configured it, and below the schema so a component can still set its own — or silence it
	* with `emit: null`. Selectors are merged across the layers so a schema that overrides one
	* key keeps the rest.
	*
	* Pure and exported: the merge is the one part of `build()` that can be pinned down
	* without a DOM.
	*/
	function mergeBuildConfig$1(theme, emitter, schema) {
		const merged = { ...theme };
		if (emitter) merged.emit = emitter;
		const user = schema ?? {};
		Object.assign(merged, user);
		const selectors = {};
		for (const source of [theme, user]) {
			if (!source?.selectors || typeof source.selectors !== "object") continue;
			for (const [key, value] of Object.entries(source.selectors)) {
				const previous = selectors[key];
				selectors[key] = isPlainRecord$1(previous) && isPlainRecord$1(value) ? {
					...previous,
					...value
				} : value;
			}
		}
		if (Object.keys(selectors).length) merged.selectors = selectors;
		else delete merged.selectors;
		return merged;
	}
	function normalizeVitePath$1(pathStr) {
		if (!pathStr) return "";
		let clean = pathStr.trim().replace(/\\/g, "/");
		if (clean.startsWith("./")) clean = clean.slice(2);
		if (clean.startsWith("/")) clean = clean.slice(1);
		return `/${clean}`;
	}
	function resolveRelativePath$1(baseScriptPath, stylePath) {
		if (!stylePath) return "";
		if (!stylePath.startsWith("./") && !stylePath.startsWith("../")) return stylePath;
		if (!baseScriptPath) return stylePath;
		return (baseScriptPath.substring(0, baseScriptPath.lastIndexOf("/") + 1) + stylePath.replace(/^\.\//, "")).replace(/\/+/g, "/");
	}
	function findStyleLoader$1(map, key) {
		if (!key) return void 0;
		if (typeof map[key] === "function") return map[key];
		const lower = key.toLowerCase();
		const matched = Object.keys(map).find((k) => k.toLowerCase() === lower);
		return matched ? map[matched] : void 0;
	}
	/**
	* Narrow a value to a plain object record (not array, element, or null).
	*
	* The `Element` guard is skipped when the global is absent, so the registry can be
	* exercised outside a browser (tests, future server-side rendering).
	*/
	function isPlainRecord$1(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
		return typeof Element === "undefined" || !(value instanceof Element);
	}
	/**
	* Collects the component names a page source needs, in discovery order.
	*
	* Two shapes are recognised:
	*
	* - node trees: a `builder` field naming **one** component — the node the renderer
	*   builds. A route that mounts several components declares them on the registry
	*   (`iComponentRoute` in `@aio-ui/app`), not on a node;
	* - page blocks: a `type` field paired with a table binding (`{ type: "masonry",
	*   source: "portfolio" }`). The `source` requirement keeps input descriptors out,
	*   because they also carry a `type` (`{ type: "text" }`) that is not a component.
	*
	* `builder` is a reserved key, so a declaration there can never leak into the DOM.
	*
	* The walk is depth-first, cycle-safe, and ignores everything it does not recog-
	* nise, so it can be run on raw CMS output without validation.
	*
	* @param source - Page content, array, or any nested structure.
	* @returns Unique component names, in the order they were first seen.
	*/
	function collectComponentNames$1(source) {
		const found = [];
		const seen = /* @__PURE__ */ new Set();
		const visited = /* @__PURE__ */ new Set();
		const walk = (value) => {
			if (typeof value !== "object" || value === null || visited.has(value)) return;
			visited.add(value);
			if (Array.isArray(value)) {
				for (const item of value) walk(item);
				return;
			}
			const record = value;
			const declared = record.builder;
			const declaredNames = typeof declared === "string" ? [declared] : [];
			const type = typeof record.type === "string" && "source" in record ? record.type : void 0;
			const names = type ? [...declaredNames, type] : declaredNames;
			for (const name of names) if (!seen.has(name)) {
				seen.add(name);
				found.push(name);
			}
			for (const key of Object.keys(record)) walk(record[key]);
		};
		walk(source);
		return found;
	}
	var _assets$1 = /* @__PURE__ */ new WeakMap();
	var _emitter$1 = /* @__PURE__ */ new WeakMap();
	var ComponentRegistry$1 = class {
		/**
		* @summary Stores the host asset maps used for every lazy component load.
		* @param assets - Vite glob maps declared by the host application.
		*
		* The style map is also published to the shared stylesheet seam, so a component
		* built *outside* the registry (a table inside a form field) can still get its CSS
		* without importing it — a static CSS import would ride along in the JS chunk and be
		* injected twice.
		*/
		constructor(assets) {
			_defineProperty(
				this,
				/**
				* 🧱 Builder storage backed by the generic registry kernel.
				*
				* `duplicate: "replace"` preserves the previous silent-overwrite behaviour
				* that HMR and preset rebuilds depend on. Lazy loading and stylesheet injection
				* stay in this adapter — the kernel only stores values. The anti-FOUC hold is
				* not here: it belongs to the builder that owns the root.
				*/
				"builders",
				new Registry$1("component", { duplicate: "replace" })
			);
			_classPrivateFieldInitSpec(this, _assets$1, void 0);
			_classPrivateFieldInitSpec(this, _emitter$1, null);
			_defineProperty(this, "registeredSheets", /* @__PURE__ */ new Set());
			_defineProperty(this, "_resolvedCache", /* @__PURE__ */ new Map());
			_defineProperty(
				this,
				/** Sub-modules resolved per component name: `componentName → { moduleId → module }`. */
				"_modules",
				/* @__PURE__ */ new Map()
			);
			_defineProperty(this, "_dynamicConfigs", /* @__PURE__ */ new Map());
			_defineProperty(
				this,
				/** Components currently being loaded, so a `modules` cycle cannot recurse forever. */
				"_loading",
				/* @__PURE__ */ new Set()
			);
			_classPrivateFieldSet2(_assets$1, this, assets);
			useStylesheetAssets$1(assets.styles);
		}
		/**
		* Attaches the publisher every subsequent build receives.
		*
		* Optional by design: a host without an event bus never calls it, and the configs it
		* builds simply have no `emit`. Passing `null` detaches.
		*
		* @param emit - Publisher, or `null` to stop forwarding component events.
		* @returns The current registry instance.
		*/
		useEmitter(emit) {
			_classPrivateFieldSet2(_emitter$1, this, emit);
			return this;
		}
		/**
		* Registers a component factory under a stable name.
		*
		* @summary Delegates storage to the registry kernel, then returns this instance for fluent registration.
		* @param name - Public component identifier.
		* @param builderFn - Polymorphic registration function (direct builder, loadable builder, or manifest).
		* @returns The current registry instance.
		* @example
		* registry.register("masonry", masonryBuilder);
		*/
		register(name, builderFn) {
			this.builders.register(String(name), builderFn);
			return this;
		}
		/**
		* Lists every registered component name.
		*
		* @summary Exposes the kernel's insertion-ordered ids so callers can preload components.
		* @returns Registered component names in registration order.
		*/
		getRegisteredNames() {
			return this.builders.ids();
		}
		/**
		* Resolves a registered component factory.
		*
		* @summary Returns `undefined` for unknown names so legacy call sites that test the result keep working.
		* @param name - Public component identifier.
		* @returns The registration function, or `undefined` when the name is not registered.
		*/
		get(name) {
			if (this.has(name)) return this.builders.resolve(name) ?? void 0;
		}
		/**
		* Checks whether a component name is registered.
		*
		* @param name - Public component identifier.
		* @returns `true` when a factory is registered under `name`.
		*/
		has(name) {
			return this.builders.has(name);
		}
		async loadModule(script, stylesheet, componentName, exportName) {
			let jsModule = null;
			let rawCss = null;
			if (script) {
				const normScript = normalizeVitePath$1(script);
				const jsLoader = _classPrivateFieldGet2(_assets$1, this).modules[normScript] || _classPrivateFieldGet2(_assets$1, this).modules[script];
				if (typeof jsLoader === "function") jsModule = await jsLoader();
			}
			const builderClass = !jsModule ? null : exportName ? jsModule[exportName] ?? jsModule?.default?.[exportName] ?? null : jsModule.default || Object.values(jsModule).find((v) => typeof v === "function" || v && typeof v.create === "function") || jsModule;
			let effectiveStyle = stylesheet;
			if (!effectiveStyle && builderClass) effectiveStyle = builderClass?.stylesheet || builderClass.prototype?.stylesheet;
			if (!effectiveStyle && script && /\.[cm]?[jt]sx?$/.test(script)) effectiveStyle = script.replace(/\.[cm]?[jt]sx?$/, ".css");
			if (effectiveStyle) {
				if (typeof CSSStyleSheet !== "undefined" && effectiveStyle instanceof CSSStyleSheet) this.injectStyle(effectiveStyle);
				else if (typeof effectiveStyle === "string") {
					const resolvedCssPath = script ? resolveRelativePath$1(script, effectiveStyle) : effectiveStyle;
					const normCss = normalizeVitePath$1(resolvedCssPath);
					const cssLoader = findStyleLoader$1(_classPrivateFieldGet2(_assets$1, this).styles, normCss) || findStyleLoader$1(_classPrivateFieldGet2(_assets$1, this).styles, resolvedCssPath) || findStyleLoader$1(_classPrivateFieldGet2(_assets$1, this).styles, effectiveStyle);
					if (typeof cssLoader === "function") {
						rawCss = await cssLoader();
						if (rawCss && typeof rawCss === "object" && "default" in rawCss) rawCss = rawCss.default;
						if (typeof rawCss === "string") this.injectCssString(rawCss, normCss);
					}
				}
			} else if (componentName && !effectiveStyle) {}
			return builderClass;
		}
		/**
		* Resolves every component a page source needs, without the caller listing them.
		*
		* This is the default entry point: a route only has to hand over its content,
		* and the registry derives the set itself (see `collectComponentNames`). `load()`
		* stays public for callers that already know the names, or need query data.
		*
		* @param source - Page content, block list, or any nested structure.
		* @returns The component names that were resolved, in discovery order.
		*/
		async loadFor(source) {
			const names = collectComponentNames$1(source);
			if (names.length) await this.load(names, [source]);
			return names;
		}
		/**
		* Derives the component names a source needs, without loading anything.
		*
		* Exposed so a host (for example `@aio-ui/app`) can inspect a route before the
		* render pass without importing `collectComponentNames` directly — that keeps the
		* dependency between app and core type-only at runtime.
		*
		* @param source - Page content, block list, or any nested structure.
		* @returns Unique component names, in discovery order.
		*/
		collect(source) {
			return collectComponentNames$1(source);
		}
		/**
		* Resolves component modules and stylesheets ahead of a render pass.
		*
		* Paired with `build()`: `load()` is always asynchronous and fills the resolved
		* cache, while `build()` stays synchronous and reads from it. A component that
		* was never loaded cannot be built.
		*
		* @param componentNames - Registered component names to resolve.
		* @param pagesData - Source tree used to find each component's node config.
		*/
		async load(componentNames, pagesData = []) {
			for (const nameKey of componentNames) {
				const name = nameKey;
				if (this._loading.has(String(name))) continue;
				const fn = this.builders.resolve(String(name));
				if (!fn) continue;
				const matchedData = this.getBuilderNode(pagesData, name);
				try {
					this._loading.add(String(name));
					const manifest = fn(matchedData || {});
					if (manifest?.path || manifest?.stylesheet) {
						const loadedClass = await this.loadModule(manifest.path, manifest.stylesheet, name, manifest.export);
						if (loadedClass) this._resolvedCache.set(name, loadedClass);
					}
					await this.loadModules(name, manifest);
				} catch (err) {
					console.error(`[ComponentRegistry] load failed for "${String(nameKey)}":`, err);
					throw err;
				} finally {
					this._loading.delete(String(name));
				}
			}
		}
		/**
		* Resolves the sub-modules a component declares in its manifest.
		*
		* Each module is cached under a namespaced key (`form:table`) so a module id
		* shared by two components never collides. A module that cannot be resolved is
		* reported and skipped: the component still loads, and `Builder.module(id)`
		* decides how to degrade at use time.
		*
		* @param componentName - Owner of the modules.
		* @param manifest - The component manifest that declares them.
		*/
		async loadModules(componentName, manifest) {
			const refs = manifest.modules;
			if (!refs?.length) return;
			const resolved = this._modules.get(componentName) ?? {};
			for (const ref of refs) {
				if (resolved[ref.id] !== void 0) continue;
				if (!ref.path) {
					if (!this.has(ref.id)) continue;
					await this.load([ref.id]);
					const registered = this._resolvedCache.get(ref.id);
					if (registered !== void 0) {
						resolved[ref.id] = registered;
						this._resolvedCache.set(`${componentName}:${ref.id}`, registered);
					}
					continue;
				}
				const cacheKey = `${componentName}:${ref.id}`;
				const loaded = await this.loadModule(ref.path, ref.stylesheet, cacheKey, ref.export);
				if (loaded !== void 0 && loaded !== null) {
					resolved[ref.id] = loaded;
					this._resolvedCache.set(cacheKey, loaded);
				}
			}
			this._modules.set(componentName, resolved);
		}
		/**
		* ⚡ AMAN & SINKRONUS MURNI (.run Method)
		*/
		build(name, data) {
			const fn = this.builders.resolve(String(name));
			if (!fn) throw new Error(`[ComponentRegistry] No builder registered for "${String(name)}".`);
			const manifest = fn(data);
			const activeThemeConfig = this._dynamicConfigs.get(name) || {};
			const nodeData = isPlainRecord$1(data) && typeof data.builder === "string" ? data : null;
			const content = manifest.schema !== void 0 ? manifest.schema : nodeData ? nodeData.content : data;
			const userConfig = nodeData ? nodeData.config || {} : {};
			const schemaConfig = mergeBuildConfig$1(activeThemeConfig, _classPrivateFieldGet2(_emitter$1, this), userConfig);
			if (nodeData && nodeData.config) nodeData.config = schemaConfig;
			const cachedClass = this._resolvedCache.get(name);
			if (cachedClass && typeof cachedClass === "function") try {
				const instance = new cachedClass(schemaConfig);
				if (instance && typeof instance.create === "function") {
					const resolvedModules = this._modules.get(String(name));
					if (resolvedModules && typeof instance.provideModules === "function") instance.provideModules(resolvedModules);
					const builtElement = instance.create({
						content,
						config: schemaConfig
					});
					if (!builtElement) throw new Error(`[ComponentRegistry] Builder "${String(name)}" created a null element. Check prepare()/create() or selector definitions.`);
					attachBuilder$1(builtElement, instance);
					return builtElement;
				}
			} catch (error) {
				throw error instanceof Error ? error : /* @__PURE__ */ new Error(`[ComponentRegistry] Failed to instantiate "${String(name)}": ${String(error)}`);
			}
			throw new Error(`[ComponentRegistry] Builder "${String(name)}" could not produce a DOM element. Its module was not preloaded, or the class is not a Builder.`);
		}
		injectStyle(sheet) {
			if (!this.registeredSheets.has(sheet)) {
				this.registeredSheets.add(sheet);
				document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
			}
		}
		/**
		* 🎯 Penanam CSS mentah sebagai elemen <style id="…"> NYATA di <head>.
		*
		* Mengapa tidak lagi mengandalkan Constructable Stylesheet
		* (document.adoptedStyleSheets)? Stylesheet yang di-`adopt` TIDAK muncul
		* sebagai node DOM — Anda buka DevTools > Elements, cari <style>/<link>,
		* tidak ada → tampak "stylesheet tidak loaded" padahal sesungguhnya CSS
		* sudah ter-pakai. Elemen <style> nyata membuat inject gampang diverifikasi.
		*
		* Selain itu ini juga lebih andal daripada jalur CSSOM: beberapa browser
		* melempar SyntaxError dari replaceSync pada CSS modern mentah (nesting,
		* @starting-style, ::picker, position-area, dst) — yang dulu membuat
		* stylesheet diam-diam TIDAK pernah masuk DOM sama sekali.
		*
		* Id `<style>` dan dedupe-nya milik seam bersama (`Stylesheets`), sehingga
		* komponen yang dibangun DI LUAR registry (tabel di dalam field form) memakai
		* jalur injeksi yang sama dan tidak pernah menghasilkan style ganda.
		*/
		injectCssString(rawCss, normCss) {
			if (!rawCss || isStyleInjected$1(normCss)) return;
			injectLazyCss$1(rawCss, normCss);
		}
		setConfig(builderName, newConfig) {
			console.log(`[Registry Config Central] Storing live configuration inject request for: "${String(builderName)}"`);
			const existingConfig = this._dynamicConfigs.get(builderName) || {};
			this._dynamicConfigs.set(builderName, {
				...existingConfig,
				...newConfig,
				selectors: {
					...existingConfig.selectors || {},
					...newConfig.selectors || {}
				}
			});
			console.log(`[Registry Success] Configuration for "${String(builderName)}" officially sealed in dynamic config state.`);
		}
		clear() {
			this._dynamicConfigs.clear();
			this.registeredSheets = /* @__PURE__ */ new Set();
			getBuilderAdapter$1()?.resetCounters();
		}
		destroy() {}
		/**
		* Destroys every builder pinned inside a subtree the app is about to replace.
		*
		* @param root - The outgoing shell (or any subtree a page remembers).
		* @returns How many builder instances were destroyed.
		*
		* @summary The registry is where instances are created, so it is the natural door for
		*   releasing them: `AioApp` calls this on the tree it is about to swap out, and a page
		*   controller can call it from `onDestroy()` with its own shell. Idempotent — a
		*   builder is unpinned before its `destroy()` runs, so a second sweep does nothing.
		*/
		releaseBuilders(root) {
			return releaseBuilders$1(root);
		}
		getBuilderNode(nodes, name, visited = /* @__PURE__ */ new Set()) {
			if (typeof nodes !== "object" || nodes === null) return;
			if (visited.has(nodes)) return;
			visited.add(nodes);
			if ("builder" in nodes && nodes.builder === name) return nodes;
			if (Array.isArray(nodes)) for (const item of nodes) {
				const found = this.getBuilderNode(item, name, visited);
				if (found) return found;
			}
			else for (const key in nodes) if (Object.prototype.hasOwnProperty.call(nodes, key)) {
				const found = this.getBuilderNode(nodes[key], name, visited);
				if (found) return found;
			}
		}
	};
	_defineProperty(ComponentRegistry$1, "slot", "registry");
	// packages/core/dist/app/modules.js
	var _driver$1 = /* @__PURE__ */ new WeakMap();
	var _memory$1 = /* @__PURE__ */ new WeakMap();
	/**
	* Built-in app modules.
	*
	* A module is a **class**, and the class is the token: it declares the slot it
	* fills as a static member, and receives `(config, context)` in its constructor.
	* There is no wrapper class to write, no `defineModule()` alias and no factory
	* object — the repo's own classes already follow the convention:
	*
	* ```ts
	* app
	*   .registerModule(components)                        // instance you assembled
	*   .registerModule(HashRouter)                        // class, no config
	*   .registerModule(AppStorage, { driver: localStorage })
	*   .registerModule(AnimationsService)
	*   .registerModule(EventEmitter);
	* ```
	*
	* | Slot | Class | Package |
	* | --- | --- | --- |
	* | `registry` | `ComponentRegistry` | `@aio-ui/core` |
	* | `router` | `HashRouter` | `@aio-ui/router` |
	* | `renderer` | `DOMRenderer` (default) | `@aio-ui/core` |
	* | `animation` | `AnimationsService` | `@aio-ui/animations` |
	* | `events` | `EventEmitter` | `@aio-ui/event-emitter` |
	* | `storage` | `AppStorage` | this package |
	*
	* `registry` and `router` are required; the rest have safe fallbacks.
	*/
	/**
	* The `storage` port.
	*
	* The driver is wrapped instead of used directly: `localStorage` throws in private
	* mode and inside a sandboxed iframe, and a saved theme is never worth a broken page.
	* Without a driver the port stays usable and simply forgets between reloads.
	*/
	var AppStorage$1 = class {
		constructor(config = {}) {
			_classPrivateFieldInitSpec(this, _driver$1, void 0);
			_classPrivateFieldInitSpec(this, _memory$1, /* @__PURE__ */ new Map());
			_classPrivateFieldSet2(_driver$1, this, config.driver);
		}
		get(key) {
			if (!_classPrivateFieldGet2(_driver$1, this)) return _classPrivateFieldGet2(_memory$1, this).get(key) ?? null;
			try {
				return _classPrivateFieldGet2(_driver$1, this).getItem(key);
			} catch {
				return null;
			}
		}
		set(key, value) {
			if (!_classPrivateFieldGet2(_driver$1, this)) {
				_classPrivateFieldGet2(_memory$1, this).set(key, value);
				return;
			}
			try {
				_classPrivateFieldGet2(_driver$1, this).setItem(key, value);
			} catch {}
		}
	};
	_defineProperty(AppStorage$1, "slot", "storage");
	// packages/core/dist/TemplateRegistry.js
	var _handlers$1 = /* @__PURE__ */ new WeakMap();
	var _TemplateRegistry_brand$1 = /* @__PURE__ */ new WeakSet();
	/**
	* Template store.
	*
	* Keys are `themeId:selectorKey`: a theme overrides one token at a time, and the same
	* token may be overridden by several themes.
	*/
	var TemplateRegistry$1 = class {
		constructor() {
			_classPrivateMethodInitSpec(this, _TemplateRegistry_brand$1);
			_classPrivateFieldInitSpec(this, _handlers$1, new Registry$1("template", { duplicate: "replace" }));
		}
		/** Number of registered overrides. */
		get size() {
			return _classPrivateFieldGet2(_handlers$1, this).size;
		}
		/**
		* Resolves the override for a theme token.
		*
		* @param themeId - Theme that owns the override, e.g. `"cyberpunk"`.
		* @param key - Selector token, e.g. `"@masonry>item"`.
		* @param fallback - Handler to use when the theme has no override.
		*/
		resolve(themeId, key, fallback) {
			return _classPrivateFieldGet2(_handlers$1, this).resolve(_assertClassBrand(_TemplateRegistry_brand$1, this, _key$1).call(this, themeId, key)) ?? fallback;
		}
		/** Registers (or replaces) an override. */
		register(themeId, key, handler) {
			_classPrivateFieldGet2(_handlers$1, this).register(_assertClassBrand(_TemplateRegistry_brand$1, this, _key$1).call(this, themeId, key), handler);
		}
		/** Removes an override. Returns whether something was removed. */
		unregister(themeId, key) {
			return _classPrivateFieldGet2(_handlers$1, this).unregister(_assertClassBrand(_TemplateRegistry_brand$1, this, _key$1).call(this, themeId, key));
		}
		/** Removes every override. */
		clear() {
			_classPrivateFieldGet2(_handlers$1, this).clear();
		}
		/** All keys, for the debug channel. */
		keys() {
			return _classPrivateFieldGet2(_handlers$1, this).ids();
		}
	};
	function _key$1(themeId, key) {
		return `${themeId}:${key}`;
	}
	var installed$1 = new TemplateRegistry$1();
	/**
	* Installs the store `Base` and `DOMRenderer` read from.
	*
	* A theme package calls this with its own instance; passing `null` restores a fresh
	* empty store, which is what a test or an app teardown wants.
	*/
	function setTemplates$1(registry) {
		installed$1 = registry ?? new TemplateRegistry$1();
	}
	/** The store currently in use. Never `null`, so callers need no guard. */
	function getTemplates$1() {
		return installed$1;
	}
	// packages/utilities/dist/AttributeUtils.js
	/**
	* 🧱 ATTRIBUTE UTILS — shared element-attribute stamping helpers.
	*
	* Extracted from the three places that duplicated the same logic:
	* • `Builder._applyNodeAttributes` (Base.ts)
	* • `DOMRenderer.attributeProcessor` (DOMRenderer.ts)
	* • `Input.applyAttributes` (Form/Input.ts)
	*
	* Two canonical shapes of declared attributes are supported everywhere:
	* 1. Dictionary (`attrs: { name: value, ... }`) — plain setAttribute.
	* 2. Array (`attributes: [{ name, value }, ...]`) — with the event-handler
	*    special case: a `function` value on an `on*` attribute is assigned as
	*    an element property (`el.onclick = fn`), not serialized via setAttribute.
	*/
	/**
	* 🧩 APPLY ATTR DICTIONARY — stamp every `[name]: value` pair via setAttribute.
	* Values are stringified; `null`/`undefined` are skipped. Safe to call with
	* a missing dictionary (no-op).
	*/
	function applyAttrDictionary$1(el, attrs) {
		if (!attrs || typeof attrs !== "object") return;
		for (const [name, value] of Object.entries(attrs)) {
			if (value === null || value === void 0) continue;
			el.setAttribute(name, String(value));
		}
	}
	/**
	* 🧩 APPLY ATTRIBUTE LIST — stamp every `{ name, value }` pair.
	* Event-handler convention: `function` value + `on*` name → assigned as an
	* element property (live handler reference); anything else → setAttribute.
	*/
	function applyAttributeList$1(el, attributes) {
		if (!Array.isArray(attributes)) return;
		for (const attr of attributes) {
			if (!attr || typeof attr !== "object" || !attr.name) continue;
			if (typeof attr.value === "function" && attr.name.startsWith("on")) el[attr.name] = attr.value;
			else el.setAttribute(attr.name, attr.value);
		}
	}
	// packages/utilities/dist/Metadata.js
	function ensureMetadataIdentity$1(selector, scopeId = "", childSuffix = "", templateKey) {
		const cleanScope = scopeId || "";
		const cleanLocalKey = `${selector}${childSuffix ? "-" + childSuffix : ""}`;
		const finalizedGlobalKey = cleanScope ? `${cleanScope}:${cleanLocalKey}` : cleanLocalKey;
		return {
			tree: {
				scope: cleanScope,
				key: cleanLocalKey,
				template: templateKey || cleanLocalKey,
				parent: null,
				children: []
			},
			key: finalizedGlobalKey
		};
	}
	function setMetadata$1(element, localRecordsPool, _rootPartKey) {
		if (!element || !localRecordsPool) return;
		const capturedRecords = localRecordsPool.map((item) => ({
			...item,
			relations: item?.relations ? {
				...item.relations,
				children: item.relations.children ? [...item.relations.children] : []
			} : null
		}));
		element.getMetadata = (context) => {
			if (!context) return capturedRecords;
			const scopeId = context.scopeId ?? "";
			const parentKey = context.parentKey ?? null;
			const keyMap = /* @__PURE__ */ new Map();
			capturedRecords.forEach((item) => {
				const origin = item.relations || {};
				const originGlobalKey = ensureMetadataIdentity$1(origin.key, origin.scope).key;
				const rebasedGlobalKey = ensureMetadataIdentity$1(origin.key, scopeId).key;
				keyMap.set(originGlobalKey, rebasedGlobalKey);
			});
			capturedRecords.forEach((item) => {
				const origin = item.relations || {};
				const originGlobalKey = ensureMetadataIdentity$1(origin.key, origin.scope).key;
				const rebasedGlobalKey = keyMap.get(originGlobalKey) || ensureMetadataIdentity$1(origin.key, scopeId).key;
				if (!item.relations) item.relations = {};
				item.relations.scope = scopeId;
				item.relations.template = origin.template || origin.key;
				if (origin.parent === null || origin.parent === void 0 || origin.parent === "") item.relations.parent = parentKey;
				else if (origin.parent) item.relations.parent = keyMap.get(origin.parent) || origin.parent;
				const originChildren = Array.isArray(origin.children) ? origin.children : [];
				item.relations.children = originChildren.map((childKey) => keyMap.get(childKey) || childKey);
				item.relations.key = rebasedGlobalKey;
			});
			return capturedRecords;
		};
	}
	/**
	* @internal Generates a stable hash seed from content + config for namespace derivation.
	* Extracted from former buildNamespaceSeed() for internal use by ensureIdentity().
	*/
	function buildNamespace$1(content, config) {
		const stableHash = (input) => {
			let hash = 5381;
			for (let i = 0; i < input.length; i++) hash = (hash << 5) + hash ^ input.charCodeAt(i);
			return (hash >>> 0).toString(36);
		};
		const summarize = (value, depth = 0) => {
			if (value === null || value === void 0) return "";
			if (typeof value === "string") return value.trim();
			if (typeof value === "number" || typeof value === "boolean") return String(value);
			if (value instanceof HTMLElement) return `${value.tagName ? value.tagName.toLowerCase() : "element"}${value.id ? `#${value.id}` : ""}${value.className && typeof value.className === "string" ? `.${value.className.trim().split(/\s+/).filter(Boolean).join(".")}` : ""}`;
			if (Array.isArray(value)) {
				const firstItems = value.slice(0, 3).map((item) => summarize(item, depth + 1)).filter(Boolean);
				return `len${value.length}[${firstItems.join("|")}]`;
			}
			if (typeof value === "object") {
				const keys = Object.keys(value).filter((key) => {
					const current = value[key];
					return typeof current !== "function" && typeof current !== "undefined";
				}).sort();
				const preferredKeys = [
					"namespace",
					"id",
					"name",
					"title",
					"slug",
					"formId",
					"builder",
					"key",
					"category"
				];
				const picked = [];
				for (const key of preferredKeys) if (key in value) {
					const current = value[key];
					if (current instanceof HTMLElement) picked.push(`${key}=${summarize(current, depth + 1)}`);
					else if (Array.isArray(current)) picked.push(`${key}=${summarize(current, depth + 1)}`);
					else if (current && typeof current === "object") picked.push(`${key}=${summarize(current, depth + 1)}`);
					else if (typeof current !== "function" && typeof current !== "undefined") picked.push(`${key}=${String(current)}`);
				}
				if (picked.length > 0) return picked.join(";");
				const minimalShape = keys.slice(0, 5).map((key) => {
					const current = value[key];
					if (current instanceof HTMLElement) return `${key}:${summarize(current, depth + 1)}`;
					if (Array.isArray(current)) return `${key}:len${current.length}`;
					if (current && typeof current === "object") return `${key}:{${Object.keys(current).slice(0, 3).join(",")}}`;
					return `${key}:${String(current)}`;
				});
				return `keys${keys.length}[${minimalShape.join("|")}]`;
			}
			return "";
		};
		const configSeed = config?.namespace || config?.id || config?.formId || config?.name || config?.title || config?.slug || config?.key || "";
		const contentSeed = (content && typeof content === "object" ? content.id : "") || (content && typeof content === "object" ? content.name : "") || (content && typeof content === "object" ? content.title : "") || (content && typeof content === "object" ? content.formId : "") || (content && typeof content === "object" ? content.uid : "") || (content && typeof content === "object" ? content.slug : "") || summarize(content);
		const rawSeed = [String(configSeed || "").trim(), String(contentSeed || "").trim()].filter(Boolean).join("::");
		return rawSeed ? stableHash(rawSeed) : "anonymous";
	}
	// packages/core/dist/DOMRenderer.js
	var _cleanupMap$1 = /* @__PURE__ */ new WeakMap();
	var DOMRenderer$1 = class {
		constructor(config) {
			_defineProperty(this, "config", void 0);
			_classPrivateFieldInitSpec(this, _cleanupMap$1, /* @__PURE__ */ new Map());
			_defineProperty(this, "records", []);
			const defaultConfig = {
				selectors: {
					container: {
						tagName: "main",
						name: `page`,
						className: "page"
					},
					grid: {
						tagName: "div",
						isClass: true,
						name: "grid",
						className: "grid"
					},
					row: {
						tagName: "div",
						isClass: true,
						name: "row",
						className: "row"
					},
					column: {
						tagName: "div",
						isClass: true,
						name: "column",
						className: "column"
					}
				},
				separator: {
					id: "#",
					class: ".",
					ignored: "$",
					include: "-"
				}
			};
			this.config = {
				...defaultConfig,
				...config,
				selectors: {
					...defaultConfig.selectors,
					...config?.selectors
				}
			};
		}
		parseKey(key) {
			const { id: idSep, class: classSep, ignored } = this.config.separator;
			let cleanKey = key.includes(ignored) ? key.split(ignored)[0] : key;
			const parsedAttrs = {};
			const attrRegex = /\[\s*([a-zA-Z0-8_-]+)\s*=\s*['"]?([^'"]*)['"]?\s*\]/g;
			let attrMatch;
			while ((attrMatch = attrRegex.exec(cleanKey)) !== null) {
				const attrName = attrMatch[1];
				parsedAttrs[attrName] = attrMatch[2];
			}
			cleanKey = cleanKey.replace(/\[[^\]]*\]/g, "");
			const escId = idSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
			const escClass = classSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
			const baseNameMatch = cleanKey.match(new RegExp(`^([^${escId}${escClass}]+)`));
			let baseName = baseNameMatch ? baseNameMatch[1] : "div";
			const idMatch = cleanKey.match(new RegExp(`${escId}([^${escId}${escClass}]+)`));
			const id = idMatch ? idMatch[1] : void 0;
			const classRegex = new RegExp(`${escClass}([^${escId}${escClass}]+)`, "g");
			let classNames = [];
			let match;
			while ((match = classRegex.exec(cleanKey)) !== null) classNames.push(match[1]);
			return {
				id,
				classNames,
				baseName: baseName.replace(/-/g, " "),
				parsedAttrs
			};
		}
		/**
		* Main compilation gateway that transforms declarative iNodeContent schemas into live DOM trees.
		*/
		render(content, renderFn, builderFn, options) {
			const fragment = document.createDocumentFragment();
			this.records = [];
			this.buildStructure(content, fragment, renderFn, builderFn, {
				scopeId: options?.scopeId || "",
				parentKey: options?.parentKey || null,
				pathMap: /* @__PURE__ */ new Map()
			});
			let rootElement;
			if (fragment.childNodes.length === 1 && fragment.firstChild instanceof HTMLElement) rootElement = fragment.firstChild;
			else {
				rootElement = document.createElement("div");
				rootElement.appendChild(fragment);
			}
			setMetadata$1(rootElement, this.records, "");
			return rootElement;
		}
		buildStructure(structure, parentNode, renderFn, builderFn, context = {
			scopeId: "",
			parentKey: null,
			pathMap: /* @__PURE__ */ new Map()
		}) {
			const flatNodesMap = /* @__PURE__ */ new Map();
			for (const [key, value] of Object.entries(structure)) {
				if (!value || typeof value !== "object") continue;
				const pathParts = key.split(">");
				const isHierarchical = pathParts.length > 1;
				const cleanKeyForParsing = isHierarchical ? pathParts[pathParts.length - 1] : key;
				const { id, classNames, baseName, parsedAttrs } = this.parseKey(cleanKeyForParsing);
				if (isHierarchical) {
					const parentValue = structure[pathParts.slice(0, -1).join(">")];
					if (parentValue && (parentValue.isArray || key.includes("$isArray"))) continue;
				}
				let targetSelectorKey = key;
				if (!value.builder && (value.content instanceof HTMLElement || value.isRoot)) targetSelectorKey = value.content instanceof HTMLElement ? value.content.tagName.toLowerCase() : baseName;
				const relayKey = ensureMetadataIdentity$1(targetSelectorKey, context.scopeId, "", key).key;
				const relayedElement = globalThis.ElementCreatedEventBus?.relay?.(relayKey);
				let currentElement = relayedElement || this.nodeFactory(baseName, value);
				if (relayedElement) currentElement.replaceChildren();
				if (typeof value.builder === "string" && value.isRoot === true && typeof value.onCreated !== "function" && !!builderFn) {
					const builtRoot = builderFn(value.builder, value);
					if (builtRoot && builtRoot !== currentElement) currentElement = builtRoot;
					else if (!builtRoot) value.builder;
				}
				this.attributeProcessor(currentElement, value, id, classNames, parsedAttrs);
				const identity = ensureMetadataIdentity$1(targetSelectorKey, context.scopeId, "", key);
				const currentGlobalKey = identity.key;
				let resolvedParentKey = context.parentKey;
				if (isHierarchical) {
					const parentPathKey = pathParts.slice(0, -1).join(">");
					resolvedParentKey = context.pathMap.get(parentPathKey) || context.parentKey;
				}
				identity.tree.parent = resolvedParentKey;
				context.pathMap.set(key, identity.key);
				this.attachMetadata(currentGlobalKey, currentElement, value, identity.tree);
				this.mountHandler(currentGlobalKey, currentElement, identity.tree);
				this.contentEvaluator(currentElement, value, renderFn, builderFn, {
					scopeId: context.scopeId,
					parentKey: currentGlobalKey,
					pathMap: context.pathMap
				});
				flatNodesMap.set(key, currentElement);
				if (isHierarchical) {
					const parentPathKey = pathParts.slice(0, -1).join(">");
					const parentElement = flatNodesMap.get(parentPathKey);
					if (parentElement) {
						parentElement.appendChild(currentElement);
						continue;
					}
				}
				const reservedKeys = [
					"content",
					"onCreated",
					"onDestroy",
					"builder",
					"attrs",
					"attributes",
					"isRoot",
					"isArray",
					"config",
					"selectors",
					"options"
				];
				const childKeys = Object.keys(value).filter((k) => !reservedKeys.includes(k));
				if (childKeys.length > 0) {
					const subFragment = document.createDocumentFragment();
					const childStructure = {};
					for (const childKey of childKeys) childStructure[childKey] = value[childKey];
					this.buildStructure(childStructure, subFragment, renderFn, builderFn, {
						scopeId: context.scopeId,
						parentKey: currentGlobalKey,
						pathMap: context.pathMap
					});
					currentElement.appendChild(subFragment);
				}
				this.lifecycleManager(currentElement, value, renderFn, builderFn);
				parentNode.appendChild(currentElement);
			}
		}
		/**
		* 👑 ATTACH METADATA (SATU-SATUNYA PUSAT PENGENDALIAN MEMORI MARKUP MANUAL ANDA!)
		* Sekarang bertindak sebagai gerbang tunggal: Mencatat silsilah, menjahit children dua arah,
		* dan langsung menyuntikkan tangki lazy closure getMetadata ke kulit ari elemen!
		*/
		attachMetadata(globalKey, el, val, tree) {
			const elementSelector = (() => {
				return `${el.tagName ? el.tagName.toLowerCase() : "div"}${el.id ? `#${el.id}` : ""}${el.className && typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).filter(Boolean).join(".")}` : ""}`;
			})();
			const builderName = typeof val?.builder === "string" ? val.builder : null;
			const isBuilderRoot = !!builderName && !!val?.isRoot;
			const effectiveGlobalKey = globalKey;
			const builderTemplateKey = isBuilderRoot ? `@${builderName}` : null;
			const manualMarkupRecordItem = {
				key: globalKey,
				element: el,
				payload: null,
				relations: tree
			};
			if (manualMarkupRecordItem.relations) {
				if (isBuilderRoot) {
					manualMarkupRecordItem.relations.key = elementSelector;
					manualMarkupRecordItem.relations.template = builderTemplateKey || manualMarkupRecordItem.relations.template || elementSelector;
				} else manualMarkupRecordItem.relations.template = manualMarkupRecordItem.relations.template || manualMarkupRecordItem.relations.key;
			}
			this.records.push(manualMarkupRecordItem);
			const builderOutput = val.builder && val.content && typeof val.content.getMetadata === "function" ? val.content : isBuilderRoot && typeof el.getMetadata === "function" ? el : null;
			if (builderOutput) {
				const builderOutputMeta = builderOutput.getMetadata({
					scopeId: tree.scope,
					parentKey: effectiveGlobalKey
				});
				if (builderOutputMeta && builderOutputMeta.length > 0) {
					const builderRootMeta = builderOutputMeta.find((childRec) => {
						if (!childRec || !childRec.relations) return false;
						return childRec.relations.key === builderTemplateKey || childRec.relations.parent === null;
					}) || builderOutputMeta[0];
					const rootChildren = Array.isArray(builderRootMeta?.relations?.children) ? [...builderRootMeta.relations.children] : [];
					if (manualMarkupRecordItem.relations) {
						manualMarkupRecordItem.relations.children = rootChildren;
						manualMarkupRecordItem.payload = builderRootMeta?.payload ?? manualMarkupRecordItem.payload;
					}
					builderOutputMeta.forEach((childRec) => {
						if (!childRec) return;
						const childScope = childRec?.relations?.scope || tree.scope || "";
						const childGlobalKey = ensureMetadataIdentity$1(childRec?.relations?.key || childRec?.relations?.template || "", childScope).key;
						if (childRec === builderRootMeta || childRec.relations?.key === builderTemplateKey) {
							childRec.relations.scope = childScope;
							childRec.relations.parent = globalKey;
							childRec.relations.key = globalKey;
							childRec.relations.template = builderTemplateKey || childRec.relations.template || childRec.relations.key;
							return;
						}
						if (!this.records.some((r) => r.element === childRec.element)) this.records.push(childRec);
						if (childRec.relations.parent === globalKey || childRec.relations.parent === null) {
							childRec.relations.scope = childScope;
							childRec.relations.parent = childRec.relations.parent || globalKey;
							childRec.relations.template = childRec.relations.template || childRec.relations.key;
							const parentRelations = manualMarkupRecordItem.relations;
							if (!parentRelations.children) parentRelations.children = [];
							if (!parentRelations.children.includes(childGlobalKey)) {
								parentRelations.children.push(childGlobalKey);
								console.log(parentRelations.children);
								console.log(`📌 [JIT Emitter Bridge -> Connected]: Linked dynamic builder "${childGlobalKey}" into static parent trunk "${effectiveGlobalKey}"`);
							}
						}
					});
				}
			}
			setMetadata$1(el, this.records);
			const parentKey = tree?.parent;
			if (parentKey) {
				const parentItem = this.records.find((r) => ensureMetadataIdentity$1(r.relations?.key || "", r.relations?.scope || "").key === parentKey);
				if (parentItem && parentItem.relations) {
					if (!parentItem.relations.children) parentItem.relations.children = [];
					if (!parentItem.relations.children.includes(effectiveGlobalKey)) parentItem.relations.children.push(effectiveGlobalKey);
				}
			}
		}
		mountHandler(key, currentElement, treeRelations) {
			currentElement.mount = (compositeOutput) => {
				if (!compositeOutput) return;
				const childElement = compositeOutput.element || (compositeOutput instanceof HTMLElement ? compositeOutput : null);
				if (!childElement) return;
				currentElement.appendChild(childElement);
				if (compositeOutput.metadata && compositeOutput.metadata.records) compositeOutput.metadata.records.forEach((childItem) => {
					if (childItem.relations && childItem.relations.parent === null) {
						const childGlobalKey = ensureMetadataIdentity$1(childItem.relations.template || childItem.relations.key || "", childItem.relations.scope || "").key;
						childItem.relations.parent = key;
						if (treeRelations?.children && !treeRelations.children.includes(childGlobalKey)) {
							treeRelations.children.push(childGlobalKey);
							console.log(`🚀 [JIT .mount Link]: Fast-linked dynamic child node "${childGlobalKey}" into trunk "${key}"`);
						}
					}
				});
			};
		}
		/**
		* Phase 1: Spawns clean HTMLElement instances or intercepts live hijacked nodes.
		*/
		nodeFactory(baseName, value) {
			if (value.content instanceof HTMLElement) return value.content;
			return baseName ? document.createElement(baseName) : document.createElement("div");
		}
		/**
		* Phase 2: Stamps IDs, classNames list, and handles custom inline data attributes dictionary.
		* Pair-stamping delegated to Utility/AttributeUtils.
		*/
		attributeProcessor(el, value, id, classNames, parsedAttrs) {
			if (id && !el.id) el.id = id;
			if (classNames.length > 0) {
				const existingClasses = el.className ? el.className.trim().split(/\s+/) : [];
				const combinedClasses = new Set([...existingClasses, ...classNames].filter(Boolean));
				el.className = Array.from(combinedClasses).join(" ");
			}
			applyAttrDictionary$1(el, parsedAttrs);
			applyAttrDictionary$1(el, value.attrs);
			applyAttributeList$1(el, value.attributes);
		}
		/**
		* Phase 3: Triggers onCreated lifecycle bindings securely via sandbox proxies closures.
		*/
		lifecycleManager(el, value, renderFn, builderFnArgs) {
			if (typeof value.onCreated === "function") {
				const renderProxy = (schema) => {
					return renderFn ? renderFn(schema) : null;
				};
				const builderProxy = (name, data) => {
					return builderFnArgs ? builderFnArgs(name, data) : null;
				};
				value.onCreated(el, renderProxy, builderProxy, {
					/**
					* Lets a component register its own template override from inside `onCreated`.
					*/
					register: (themeId, selectorKey, handler) => {
						console.log(`[DOMRenderer Lifecycle] Manual template registration triggered for token: "${selectorKey}"`);
						getTemplates$1().register(themeId, selectorKey, handler);
					},
					/**
					* Lets a component withdraw its template override on unmount.
					*/
					unregister: (themeId, selectorKey) => {
						getTemplates$1().unregister(themeId, selectorKey);
					}
				});
			}
			if (typeof value.onDestroy === "function") _classPrivateFieldGet2(_cleanupMap$1, this).set(el, value.onDestroy);
		}
		/**
		* Phase 4: Hydrates the inner content node chambers dynamically using polymorphic sniffing.
		*/
		contentEvaluator(el, value, renderFn, builderFn, context = {
			scopeId: "page",
			parentKey: null,
			pathMap: /* @__PURE__ */ new Map()
		}) {
			if (value.content === void 0) return;
			if (value.builder) return;
			const nodePayload = value.content;
			const parentGlobalKey = context.parentKey;
			if (nodePayload instanceof Node) {
				if (nodePayload !== el && !el.contains(nodePayload)) el.appendChild(nodePayload);
			} else if (Array.isArray(nodePayload)) {
				const subFragment = document.createDocumentFragment();
				nodePayload.forEach((childItem) => {
					if (childItem && typeof childItem === "object") this.buildStructure(childItem, subFragment, renderFn, builderFn, {
						scopeId: context.scopeId,
						parentKey: parentGlobalKey,
						pathMap: context.pathMap
					});
				});
				el.appendChild(subFragment);
			} else if (typeof nodePayload === "object" && nodePayload !== null) {
				const subFragment = document.createDocumentFragment();
				this.buildStructure(nodePayload, subFragment, renderFn, builderFn, {
					scopeId: context.scopeId,
					parentKey: parentGlobalKey,
					pathMap: context.pathMap
				});
				el.appendChild(subFragment);
			} else el.insertAdjacentHTML("afterbegin", nodePayload);
		}
		/**
		* Safe Destroy Method: Unmounts an element tree from the DOM and recursively executes cleanup hooks.
		*/
		unmount(targetElement) {
			_classPrivateFieldGet2(_cleanupMap$1, this).forEach((onDestroyFn, element) => {
				if (targetElement.contains(element) || targetElement === element) {
					try {
						onDestroyFn(element);
					} catch (error) {
						console.error("Failed to execute onDestroy lifecycle hook:", error);
					}
					_classPrivateFieldGet2(_cleanupMap$1, this).delete(element);
				}
			});
			if (targetElement.parentNode) targetElement.parentNode.removeChild(targetElement);
		}
	};
	_defineProperty(DOMRenderer$1, "slot", "renderer");
	// packages/base/dist/BaseAdapters/Hydration.js
	/**
	* Hydration hold — what a component shows while its own stylesheet is on its way.
	*
	* A component never imports its own CSS: the host declares the lazy loaders and
	* `Stylesheets` in `@aio-ui/core` resolves them (that module owns the file, the loader and
	* the `<style>` injection). This module owns the other half — the DOM writes that keep an
	* unstyled tree off the screen — and it lives in `base`, next to the builder it serves,
	* because it is a lifecycle detail of `create()`, not a framework kernel.
	*
	* Two shapes, one decision:
	*
	* - **mockup** — the builder implements `loading()` and returns a throwaway silhouette.
	*   It is prepended to the root and the real children are hidden one by one (direct
	*   children only, never a walk), so showing it costs one small build and no bookkeeping.
	*   That is the point: a per-element placeholder pass knows the exact shape of a
	*   component, but it also tracks every node and dominates the render budget.
	* - **shimmer** — no `loading()` implementation: the root is marked (`data-hydrating` +
	*   `--is-loading: 1`) and the animation module paints a generic skin over it.
	*
	* Both paths release from the same `ensureStylesheet()` promise, which never rejects, so a
	* builder no registry ever sees still heals itself — and the same root is revealed even
	* when the sheet never arrives.
	*/
	/** Whether the current runtime can be styled at all (SSR and some test hosts cannot). */
	function hasDom$1() {
		return typeof document !== "undefined" && typeof HTMLElement !== "undefined";
	}
	/**
	* Writes the "styled" markers on a root — the only release writer.
	*
	* @param root - The top element of a component tree.
	* @returns Nothing.
	*
	* @summary Three writes, no observers: `--is-loading: 0` (children inherit it),
	*   `data-hydrating` removed (every shimmer rule stops matching), `data-loaded="true"` —
	*   a permanent pointer, because `[data-loaded="true"] * { --is-loading: 0 !important }`
	*   forces any stale marker below it back to `0`.
	*/
	function releaseMarkers$1(root) {
		root.style.setProperty("--is-loading", "0");
		root.removeAttribute("data-hydrating");
		root.setAttribute("data-loaded", "true");
	}
	/**
	* Marks the root for the generic shimmer skin: no mockup, no DOM surgery.
	*
	* @param root - The element the builder is about to return.
	* @returns A no-op restore function, so both hold shapes share one release path.
	*/
	function markShimmerHold$1(root) {
		root.style.setProperty("--is-loading", "1");
		root.setAttribute("data-hydrating", "");
		root.removeAttribute("data-loaded");
		return () => void 0;
	}
	/**
	* Prepends a mockup and hides the real children it replaces.
	*
	* @param root - The element the builder is about to return.
	* @param mockup - What `loading()` produced.
	* @returns The restore function: drop the mockup, unhide the children, forget the markers.
	*
	* @summary The real children stay in the tree (a `DocumentFragment` parking lot would
	*   detach the builders nested inside them, and a teardown sweep walks the tree), so the
	*   hide is `display: none` on each *direct* child — a handful of writes, restored from
	*   the value each child had. `data-hydrating` is deliberately not set: the shimmer must
	*   not paint over a component that is already showing its own silhouette.
	*/
	function mountMockup$1(root, mockup) {
		const hidden = [];
		for (const child of Array.from(root.children)) {
			if (child === mockup) continue;
			const element = child;
			hidden.push({
				element,
				display: element.style.display
			});
			element.style.display = "none";
		}
		mockup.setAttribute("aria-hidden", "true");
		root.prepend(mockup);
		root.setAttribute("data-mockup", "");
		root.setAttribute("aria-busy", "true");
		root.style.setProperty("--is-loading", "1");
		root.removeAttribute("data-loaded");
		return () => {
			mockup.remove();
			root.removeAttribute("data-mockup");
			root.removeAttribute("aria-busy");
			for (const { element, display } of hidden) element.style.display = display;
		};
	}
	/**
	* Runs a builder's `loading()` without letting it break `create()`.
	*
	* @param factory - The builder's mockup factory, or `null` when it has none.
	* @returns A usable element, or `null` to fall back to the shimmer skin.
	*
	* @summary A mockup is decoration: a throw, or a subclass that forgot to return an
	*   element, must degrade to the generic skin rather than leave `create()` without a root.
	*/
	function buildMockup$1(factory) {
		if (typeof factory !== "function") return null;
		try {
			const mockup = factory();
			return mockup instanceof HTMLElement ? mockup : null;
		} catch (error) {
			console.warn("[hydration] loading() threw — falling back to the shimmer hold:", error);
			return null;
		}
	}
	/**
	* Reads the visibility floor a mockup asked for.
	*
	* @param mockup - The element `loading()` returned.
	* @returns Milliseconds the mockup must stay mounted, or `0` for "release when the sheet does".
	*
	* @summary The skeleton owns the config (`duration: number | "auto"`) and writes a number
	*   as `data-skeleton-duration`; `"auto"` writes nothing. Reading it off the element keeps
	*   `iMockupFactory` a plain thunk — a builder never has to know the hold exists.
	*/
	function mockupFloor$1(mockup) {
		const value = Number(mockup.getAttribute("data-skeleton-duration"));
		return Number.isFinite(value) && value > 0 ? value : 0;
	}
	/**
	* The anti-FOUC gate: keep a component root off the screen until its stylesheet is there.
	*
	* @param root - The root the builder is about to return (pre-mount, pre-paint).
	* @param specifier - The builder's declared `stylesheet` (`"./Table.css"`).
	* @param mockup - Optional factory returning this component's own silhouette.
	* @returns Nothing. The reveal happens later, from the loader promise.
	*
	* @example
	* holdUntilStyled(root, "./Table.css");                    // shimmer skin
	* holdUntilStyled(root, "./Table.css", () => this.loading()); // component mockup
	*
	* @summary One function, one question, one release trigger — no gate object and no
	*   per-instance "already loaded" flag. The question is asked per *sheet*
	*   ({@link isStylesheetPending}) because two components built in one pass own two
	*   sheets, so a flag cannot answer "is *my* CSS here". Release rides
	*   {@link ensureStylesheet}, which never rejects: a builder no registry ever sees still
	*   heals itself.
	*
	*   A mockup may also ask for a minimum on-screen time (`duration` on its spec, surfaced as
	*   `data-skeleton-duration`). That is a **floor**, joined with the sheet promise via
	*   `Promise.all`: a fast sheet no longer flashes a skeleton for one frame, and a slow one
	*   is still waited for — the marker never lifts before the CSS is in.
	*/
	function holdUntilStyled$1(root, specifier, mockup) {
		if (!hasDom$1() || !(root instanceof HTMLElement)) return;
		if (!isStylesheetPending$1(specifier)) {
			releaseMarkers$1(root);
			return;
		}
		const skeleton = buildMockup$1(mockup);
		const restore = skeleton ? mountMockup$1(root, skeleton) : markShimmerHold$1(root);
		const floor = skeleton ? mockupFloor$1(skeleton) : 0;
		const minimum = floor > 0 ? new Promise((resolve) => {
			setTimeout(resolve, floor);
		}) : Promise.resolve();
		Promise.all([ensureStylesheet$1(specifier), minimum]).then(() => {
			restore();
			releaseMarkers$1(root);
		});
	}
	// packages/utilities/dist/SelectorToTree.js
	/**
	* 👑 THE SOVEREIGN SELECTOR GRAPH PARSER (SIHIR KILAT HASIL IDE DEWA ANDA!)
	* Membedah kamus selectors kaku milik anak komponen menggunakan split(">") JIT di RAM,
	* lalu memutahkan peta silsilah komposit utuh Record<TType, relations> untuk siap di-merge!
	* @param scopeId
	* @param selectors Kamus config.selectors milik komponen anak (e.g. this.config.selectors)
	* @returns Peta silsilah kedaulatan internal elemen yang suci bersih
	*/
	function selectorToTree$1(scopeId, selectors) {
		const allKeys = Object.keys(selectors);
		const hasContainerRoot = allKeys.includes("@container");
		const scopedRelation = {};
		for (const currentKey of allKeys) {
			const globalCurrentKey = `${scopeId}:${currentKey}`;
			if (!scopedRelation[currentKey]) scopedRelation[currentKey] = {
				scope: scopeId,
				key: currentKey,
				parent: null,
				children: []
			};
			if (currentKey.includes(">")) {
				const parts = currentKey.split(">");
				parts.pop();
				const parentTypeKey = parts.join(">");
				const globalParentKey = `${scopeId}:${parentTypeKey}`;
				if (!scopedRelation[parentTypeKey]) scopedRelation[parentTypeKey] = {
					scope: scopeId,
					key: parentTypeKey,
					parent: null,
					children: []
				};
				scopedRelation[currentKey].parent = globalParentKey;
				if (!scopedRelation[parentTypeKey].children?.includes(globalCurrentKey)) scopedRelation[parentTypeKey].children?.push(globalCurrentKey);
			} else if (currentKey !== "@container" && hasContainerRoot) {
				const globalContainerKey = `${scopeId}:@container`;
				if (!scopedRelation[globalContainerKey]) scopedRelation[globalContainerKey] = {
					scope: scopeId,
					key: "@container",
					parent: null,
					children: []
				};
				scopedRelation[currentKey].parent = globalContainerKey;
				if (!scopedRelation[globalContainerKey].children?.includes(globalCurrentKey)) scopedRelation[globalContainerKey].children?.push(globalCurrentKey);
			}
		}
		return scopedRelation;
	}
	// packages/base/dist/Base.js
	var _a;
	var GLOBAL_INSTANCE_COUNTER$1 = /* @__PURE__ */ new Map();
	var _caller$1 = /* @__PURE__ */ new WeakMap();
	var _projected$1 = /* @__PURE__ */ new WeakMap();
	var _issues$1 = /* @__PURE__ */ new WeakMap();
	var _Builder_brand$1 = /* @__PURE__ */ new WeakSet();
	var _staticHierarchy$1 = /* @__PURE__ */ new WeakMap();
	var _missingModules$1 = /* @__PURE__ */ new WeakMap();
	var _modules$2 = /* @__PURE__ */ new WeakMap();
	var _bindings$1 = /* @__PURE__ */ new WeakMap();
	var Builder$1 = class Builder$1 {
		static resetCounters() {
			GLOBAL_INSTANCE_COUNTER$1.clear();
			_namespaceStack$1._ = _assertClassBrand(Builder$1, this, []);
		}
		/**
		* @description
		* Resolves the component's stable runtime identity by generating a deterministic seed,
		* combining it with the current namespace context, and building a selector hierarchy tree.
		* This method also manages a static namespace stack for nested builders and supports
		* explicit overrides when a caller needs to pin a namespace manually.
		*
		* @param content - The source payload used to derive the namespace seed.
		* @param config - Optional builder configuration that can contribute selectors or namespace metadata.
		* @param options - Optional overrides for namespace stack behavior, explicit namespace assignment,
		*   or custom seed generation input.
		*
		* @returns An object containing the resolved namespace, selector hierarchy, seed, and whether
		*   the namespace was pushed to the internal stack during resolution.
		*
		* @protected
		*/
		ensureIdentity(content, config, options) {
			const seed = buildNamespace$1(content, options?.seedConfig ?? config);
			const explicitNamespace = options?.explicitNamespace ?? config?.namespace ? String(config.namespace).trim() : "";
			const parentNamespace = _assertClassBrand(Builder$1, _a, _namespaceStack$1)._[_assertClassBrand(Builder$1, _a, _namespaceStack$1)._.length - 1] || null;
			const baseNamespace = explicitNamespace || (parentNamespace ? `${parentNamespace}:${String(this.builderId)}:${seed}` : `${String(this.builderId)}:${seed}`);
			this.instanceNamespace = baseNamespace;
			let pushed = false;
			if (options?.pushNamespace) {
				_assertClassBrand(Builder$1, _a, _namespaceStack$1)._.push(baseNamespace);
				pushed = true;
			}
			const hierarchy = selectorToTree$1(baseNamespace, config?.selectors);
			if (options?.popNamespace && pushed) _assertClassBrand(Builder$1, _a, _namespaceStack$1)._.pop();
			return {
				namespace: baseNamespace,
				hierarchy,
				seed,
				pushed
			};
		}
		constructor() {
			_classPrivateMethodInitSpec(this, _Builder_brand$1);
			_classPrivateFieldInitSpec(this, _caller$1, _assertClassBrand(Builder$1, _a, _active$4)._);
			_classPrivateFieldInitSpec(this, _projected$1, /* @__PURE__ */ new Map());
			_defineProperty(
				this,
				/** 🧩 ROOT of the builder that hosts my projections — the shared ancestor
				*  token vars are painted on; null when I have no caller (standalone). Set
				*  in `attach()` the first time I project into a caller. */
				"rootElement",
				null
			);
			_classPrivateFieldInitSpec(this, _issues$1, []);
			_defineProperty(
				this,
				/**
				* The frozen state configuration container holding consolidated options, emitters, and structural selectors.
				*/
				"config",
				void 0
			);
			_defineProperty(this, "instanceNamespace", null);
			_defineProperty(
				this,
				/**
				* Internal reference holder pointing directly to the raw, unmutated data node extracted from the spreadsheet database.
				*/
				"activeLiveThemeId",
				"default"
			);
			_classPrivateFieldInitSpec(this, _staticHierarchy$1, {});
			_defineProperty(
				this,
				/**
				* 👑 LAZY HIERARCHY ENGINE
				* Mengisolasi pengerjaan rekonsiliasi silsilah agar tidak membebani loop render()
				*/
				"hierarchy",
				{
					get: () => {
						return _classPrivateFieldGet2(_staticHierarchy$1, this);
					},
					/**
					* 📝 STORE (registration-time, called by render()) — cheap: only ensures a
					* relations entry exists for the key (reusing the static selectorToTree
					* entry when present) and returns it. NO DOM reading here — template()
					* hasn't run yet, so the subtree would be invalid. render() stores the
					* returned object as the node record's `relations`, so the record and
					* hierarchy.get() share one object that update() later fills.
					*/
					store: (key) => {
						const existing = _classPrivateFieldGet2(_staticHierarchy$1, this)[key];
						if (existing) return existing;
						const fresh = {
							scope: this.instanceNamespace || "",
							key,
							template: key,
							parent: null,
							children: []
						};
						_classPrivateFieldGet2(_staticHierarchy$1, this)[key] = fresh;
						return fresh;
					},
					/**
					* ⚡ DIRECT-LAYER ELEMENT INVENTORY (same spirit as DOMRenderer.attachMetadata)
					* Called from create(), AFTER prepare()/initialize() — template() may do
					* arbitrary DOM operations, so only now is each node's subtree final.
					*
					* For every key in storage.nodes, searches through its live element and
					* stores the SELECTOR STRING (`tag#id.classes`) of every element found
					* inside it into `relations.elements`.
					*
					* Two hard rules:
					* 1. `relations.children` (the static record keys from selectorToTree,
					*    mapped via ">") is NEVER touched — key relations stay intact.
					* 2. The walk STOPS at key boundaries: when it reaches an element owned
					*    by another registered key (e.g. @colorizer>mode living inside
					*    @colorizer>header), that element is recorded once in `elements`
					*    but is NOT descended into — it inventories itself under its own
					*    key, so nothing duplicates across layers.
					*
					* Same elementSelector format as DOMRenderer's attachMetadata.
					* Idempotent: `elements` is rebuilt (deduped) on every run, and
					* node.relations is kept pointed at the same object as the map.
					*/
					update: () => {
						const elementSelector = (el) => {
							return `${el.tagName ? el.tagName.toLowerCase() : "div"}${el.id ? `#${el.id}` : ""}${el.className && typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).filter(Boolean).join(".")}` : ""}`;
						};
						const anchors = /* @__PURE__ */ new Map();
						this.storage.nodes.forEach((node, key) => {
							const el = node.element;
							const anchor = el?.__outer ?? el;
							if (anchor instanceof HTMLElement) anchors.set(anchor, key);
						});
						this.storage.nodes.forEach((node, key) => {
							const el = node.element;
							if (!(el instanceof HTMLElement)) return;
							const relations = this.hierarchy.store(key);
							node.relations = relations;
							const found = /* @__PURE__ */ new Set();
							const walk = (current) => {
								for (const child of Array.from(current.children)) {
									found.add(elementSelector(child));
									const ownerKey = anchors.get(child);
									if (ownerKey === void 0 || ownerKey === key) walk(child);
								}
							};
							walk(el);
							relations.elements = Array.from(found);
						});
						return _classPrivateFieldGet2(_staticHierarchy$1, this);
					}
				}
			);
			_classPrivateFieldInitSpec(this, _missingModules$1, /* @__PURE__ */ new Set());
			_classPrivateFieldInitSpec(this, _modules$2, {});
			_defineProperty(
				this,
				/** 📦 NODE STORE — registri node milik instance ini: typeKey → record. */
				"storage",
				{
					nodes: /* @__PURE__ */ new Map(),
					proxy: /* @__PURE__ */ new WeakMap()
				}
			);
			_defineProperty(this, "proxyRuntime", void 0);
			_classPrivateFieldInitSpec(this, _bindings$1, void 0);
			this.proxyRuntime = new BuilderProxy$1(this.storage.proxy);
			_classPrivateFieldSet2(_bindings$1, this, new Binding$1(this.proxyRuntime));
		}
		/**
		* @description
		* Merges the component's default configuration with runtime overrides into a single
		* immutable configuration object. Selector maps are merged deeply so structural rules
		* and HTML attributes from the user config can augment the defaults without replacing
		* them wholesale.
		*
		* @param defaultOptions - The default structural configuration for the builder, including
		*   core properties and selector definitions.
		* @param userConfig - Incoming runtime overrides provided by the caller, theme layer,
		*   or framework controller.
		*
		* @returns A strictly typed, fully populated configuration object ready for runtime ingestion.
		*
		* @template C - The concrete child configuration type that extends the builder's base config.
		* @protected
		*/
		resolveConfig(defaultOptions, userConfig = {}) {
			const mergedSelectors = { ...defaultOptions.selectors || {} };
			if (userConfig.selectors) Object.entries(userConfig.selectors).forEach(([key, selectorValue]) => {
				if (!selectorValue || typeof selectorValue !== "object") return;
				const override = selectorValue;
				mergedSelectors[key] = {
					...mergedSelectors[key] || {},
					...override,
					attrs: {
						...(mergedSelectors[key] || {}).attrs || {},
						...override.attrs || {}
					}
				};
			});
			return Object.freeze({
				...defaultOptions,
				...userConfig,
				selectors: mergedSelectors,
				slots: {
					...defaultOptions.slots || {},
					...userConfig.slots || {}
				}
			});
		}
		/**
		* 🧩 Declared slots of this builder: `typeKey → slotKey` (see resolveConfig).
		* A declared key is a RECEPTACLE: at the end of create() its element is
		* stamped with `data-slot="slotKey"` and published to the slot ledger, ready
		* for another builder's `attach()`.
		*/
		get slots() {
			return this.config?.slots ?? {};
		}
		/**
		* Receives the sub-modules the registry resolved for this component.
		*
		* Kept out of `config` on purpose: several components already own a
		* `config.modules` of their own, and `Required<iBuilderConfig>` would force
		* every default config to declare it.
		*
		* @param modules - Module id to resolved module.
		*/
		provideModules(modules) {
			_classPrivateFieldSet2(_modules$2, this, modules);
		}
		/**
		* Resolves a sub-module declared in this component's manifest `modules`.
		*
		* A missing module is a normal state (LITE edition): it warns once and returns
		* `undefined`, letting the caller decide how to degrade.
		*
		* @param id - Module id as declared in the manifest, e.g. `validation`.
		* @returns The resolved module, or `undefined` when it is not available.
		*/
		module(id) {
			const resolved = _classPrivateFieldGet2(_modules$2, this)[id];
			if (resolved !== void 0) return resolved;
			if (!_classPrivateFieldGet2(_missingModules$1, this).has(id)) {
				_classPrivateFieldGet2(_missingModules$1, this).add(id);
				console.warn(`[Builder:${String(this.builderId)}] module "${id}" is not available. Declare it in this component's manifest or install its package.`);
			}
		}
		setConfig(config) {
			this.config = this.resolveConfig(this.config, config);
		}
		errorHandler() {
			const id = this.builderId;
			console.warn(`⚠️ [Framework Degraded Mode]: TemplateRegistry is not present!
Global Slotting System and Cross-Builder Live Reactivity are disabled.
Falling back to standalone local memory buffer for builder: "${id}".`);
		}
		setProxy(key, payload, onUpdateCallback) {
			return this.proxyRuntime.makeReactive(key, payload, onUpdateCallback);
		}
		bindState(root, source) {
			this.proxyRuntime.bind(root, source);
		}
		/**
		* @description
		* Executes the full builder lifecycle from configuration resolution to DOM initialization.
		* The method resolves the effective configuration, derives a stable identity, clears prior
		* node state, renders the component tree, and calls the subclass initializer so interactive
		* bindings are attached only after the DOM has been materialized.
		*
		* @param schema - The schema door: `{ content, config }`. `content` is the payload the
		*   component renders, `config` the runtime overrides merged over the instance config.
		*
		* @returns The root DOM element produced by the builder's prepare/initialize pipeline.
		*
		* @public
		*/
		create(schema) {
			const input = schema ?? {};
			if (input.config) this.config = this.resolveConfig(this.config, input.config);
			const declared = this.constructor.contract;
			const normalized = normalize$1(declared, input.content ?? {});
			_classPrivateFieldSet2(_issues$1, this, normalized.issues);
			const content = normalized.content;
			const identity = this.ensureIdentity(content, this.config, {
				pushNamespace: true,
				popNamespace: true
			});
			_classPrivateFieldSet2(_staticHierarchy$1, this, identity.hierarchy);
			this.storage.nodes.clear();
			this.activeLiveThemeId = this.config?.themeId || document.body.dataset.theme?.replace(/^theme-/, "") || "default";
			const body = this.setProxy(identity.namespace, content);
			const previousActive = _assertClassBrand(Builder$1, _a, _active$4)._;
			_active$4._ = _assertClassBrand(Builder$1, _a, this);
			try {
				const DOMTree = this.prepare(body, this.config);
				if (!DOMTree || !(DOMTree instanceof HTMLElement)) throw new Error(`[Builder:${String(this.builderId)}] prepare() returned no valid DOM element. Check selectors, template(), and the builder's render path.`);
				this.initialize(DOMTree, body);
				_assertClassBrand(_Builder_brand$1, this, _wire$1).call(this, DOMTree);
				this.hierarchy.update();
				const mockup = typeof this.loading === "function" ? () => this.loading(body, this.config) : null;
				holdUntilStyled$1(DOMTree, _assertClassBrand(_Builder_brand$1, this, _stylesheetSpecifier$1).call(this), mockup);
				return DOMTree;
			} finally {
				_active$4._ = _assertClassBrand(Builder$1, _a, previousActive);
			}
		}
		/**
		* @description
		* Creates and registers a DOM element for the requested selector token using the builder's
		* render pipeline. This method resolves the selector, applies base attributes, stores the
		* element in the local node registry, invokes the subclass template hook, and optionally wraps
		* the element in a structural wrapper chain defined by the selector configuration.
		*
		* The method is intentionally scoped around layout containers and repeating nodes. The actual
		* content injection is delegated to the subclass `template()` implementation so that each builder
		* can populate the container with its own internal structure.
		*
		* @param typeKey - The selector token that identifies the target node in the current builder.
		* @param payload - The runtime data payload associated with the node.
		* @param multiple - When true, the node is treated as a repeatable instance and can coexist
		*   with other records for the same selector token.
		*
		* @returns The created element, or undefined when the selector is not defined for the current builder.
		*
		* @protected
		*/
		render(typeKey, payload) {
			const templates = getTemplates$1();
			const registerTheme = (key, element, payload, selector) => {
				try {
					const registryLookupKey = key === "@container" ? `@${String(this.builderId)}:container` : key;
					const activeHandler = templates.resolve(this.config.themeId ?? "default", registryLookupKey, null);
					if (typeof activeHandler === "function") activeHandler(registryLookupKey, element, payload, selector);
				} catch (securityError) {
					console.warn(`[Builder Security Bypass] template evaluation skipped for key "${String(key)}":`, securityError);
				}
			};
			const selector = this.config.selectors?.[typeKey];
			if (!selector) throw new Error(`[Builder:${String(this.builderId)}] Unknown selector "${String(typeKey)}". Check the selector map or template key name.`);
			let el;
			const tagName = selector.tagName || "div";
			el = document.createElement(tagName);
			this._applyNodeAttributes(el, selector);
			if (selector.wrapper) {
				const wrapperChain = this._wrapElement(selector.wrapper, el);
				if (wrapperChain) {
					el.__outer = wrapperChain.__outer;
					el.__inner = el;
				}
			}
			const slotKey = this.slots[typeKey];
			if (slotKey) el.dataset.slot = slotKey;
			const data = {
				key: typeKey,
				element: el,
				payload,
				relations: this.hierarchy.store(typeKey)
			};
			this.storage.nodes.set(typeKey, data);
			this.template(typeKey, el, payload, selector);
			setMetadata$1(el, [data || {}], typeKey);
			registerTheme(typeKey, el, payload, selector);
			if (this.config?.emit !== void 0) this.config.emit?.("elementAdded", {
				builder: this.builderId,
				type: typeKey,
				element: el,
				data: payload
			});
			return el;
		}
		load(key) {
			return this.storage.nodes.get(key)?.element;
		}
		payload(key) {
			return this.storage.nodes.get(key) || null;
		}
		/**
		* 🧩 HOST — find the receptacle element stamped for `slotKey` inside this builder's root.
		*
		* @param slotKey - slot name declared in this builder's config.slots.
		* @returns receptacle element if found, or null.
		*/
		host(slotKey) {
			const rootKey = Object.keys(this.hierarchy.get())[0];
			return (rootKey ? this.load(rootKey) ?? null : null)?.querySelector(`[data-slot="${slotKey}"]`) ?? null;
		}
		/**
		* 🧩 PROJECT — explicit slot door.
		*
		* Mounts a child DOM node or builder into a named slot of this host builder.
		* Replaces the slot receptacle, carries over receptacle classes and non-style
		* attributes, and keeps track of the displaced receptacle for later `detach()`.
		*
		* @param slotKey - slot name declared in this builder's config.slots.
		* @param child - child element or child Builder to project into the slot.
		* @param payload - optional payload passed to child's initialize() if child is Builder.
		* @returns the projected HTMLElement, or null if receptacle was not found.
		*/
		project(slotKey, child, payload) {
			const receptacle = this.host(slotKey);
			if (!receptacle) {
				console.warn(`[Builder:${String(this.builderId)}] project() found no receptacle for slot "${slotKey}" in "${String(this.builderId)}" — declare it in config.slots.`);
				return null;
			}
			let element;
			let childBuilder = null;
			let childTypeKey = slotKey;
			if (child instanceof _a) {
				childBuilder = child;
				if (!Object.keys(child.hierarchy.get()).length) {
					_classPrivateFieldSet2(_staticHierarchy$1, child, child.ensureIdentity(void 0, child.config, {
						pushNamespace: true,
						popNamespace: true
					}).hierarchy);
					child.storage.nodes.clear();
					child.activeLiveThemeId = child.config?.themeId || document.body.dataset.theme?.replace(/^theme-/, "") || "default";
				}
				childTypeKey = Object.keys(child.hierarchy.get())[0] ?? slotKey;
				const node = child.load(childTypeKey) ?? child.render(childTypeKey, payload);
				if (!node) return null;
				element = node.__outer ?? node;
				child.rootElement ?? (child.rootElement = this.load(Object.keys(this.hierarchy.get())[0]) ?? null);
			} else element = child;
			element.dataset.slot = slotKey;
			_classPrivateFieldGet2(_projected$1, this).set(childTypeKey, {
				slot: slotKey,
				element,
				receptacle
			});
			element.classList.add(...Array.from(receptacle.classList));
			for (const { name, value } of Array.from(receptacle.attributes)) {
				if (name === "style" || element.hasAttribute(name)) continue;
				element.setAttribute(name, value);
			}
			receptacle.replaceWith(element);
			if (childBuilder) {
				_classPrivateFieldGet2(_projected$1, childBuilder).set(childTypeKey, {
					slot: slotKey,
					element,
					receptacle
				});
				childBuilder.initialize(element, payload);
				_assertClassBrand(_Builder_brand$1, childBuilder, _wire$1).call(childBuilder, element);
			}
			return element;
		}
		/**
		* 🧩 ATTACH — project ONE of this builder's keys into a slot declared by the
		* caller's config (`slots`), and wire only that key.
		*
		* This is the default way a parent consumes a child:
		*
		*   const studio = new ColorThemeBuilder(config)
		*     .attach("@colorizer>configurator", "color-configurator")
		*     .attach("@colorizer>output", "color-output");
		*
		* No create(), so the rest of the child's tree is never built — only the keys
		* asked for. The key is rendered through the normal `render()` (so it lands in
		* the node store, `load(key)` keeps answering, and its own template() pulls in
		* the child keys that key is made of), then swapped in for the caller's
		* receptacle. The receptacle is found the cheap way: the caller's root key
		* anchors one `querySelector('[data-slot="…"]')` inside the caller's own tree.
		* Nothing is registered anywhere — `attach()` talks to `#caller`, the builder
		* that instantiated this one.
		*
		* Wiring is per-scope: initialize(node, payload) is what runs, so a builder
		* that wires by scope (see ColorTheme.initialize) binds exactly the attached
		* key — and attaching several keys to one instance keeps ONE state, ONE sync
		* effect and one binding per control (see `scopes()`).
		*
		* A builder without a caller (registry-built root / standalone page) keeps its
		* nodes in its own tree — that is the fallback, not an error.
		*
		* @param typeKey  key of this builder to project (a key of my selector map).
		* @param slotKey  slot declared by the caller's config.
		* @param payload  data this key's template() needs; omit it when the template
		*                 can derive what it needs from the builder's own state.
		* @returns the current builder for chaining.
		*/
		attach(typeKey, slotKey, payload) {
			if (!Object.keys(this.hierarchy.get()).length) {
				const identity = this.ensureIdentity(void 0, this.config, {
					pushNamespace: true,
					popNamespace: true
				});
				_classPrivateFieldSet2(_staticHierarchy$1, this, identity.hierarchy);
				this.storage.nodes.clear();
				this.activeLiveThemeId = this.config?.themeId || document.body.dataset.theme?.replace(/^theme-/, "") || "default";
			}
			const node = this.load(typeKey) ?? this.render(typeKey, payload);
			if (!node) return this;
			const caller = _classPrivateFieldGet2(_caller$1, this);
			if (!caller) return this;
			const receptacle = caller.host(slotKey);
			if (!receptacle) {
				console.warn(`[Builder:${String(this.builderId)}] attach("${String(typeKey)}") found no receptacle for slot "${slotKey}" in caller "${String(caller.builderId)}" — declare it in the caller's config.slots.`);
				return this;
			}
			const element = node.__outer ?? node;
			element.dataset.slot = slotKey;
			_classPrivateFieldGet2(_projected$1, this).set(typeKey, {
				slot: slotKey,
				element,
				receptacle
			});
			element.classList.add(...Array.from(receptacle.classList));
			for (const { name, value } of Array.from(receptacle.attributes)) {
				if (name === "style" || element.hasAttribute(name)) continue;
				element.setAttribute(name, value);
			}
			receptacle.replaceWith(element);
			const callerRootKey = Object.keys(caller.hierarchy.get())[0];
			this.rootElement ?? (this.rootElement = callerRootKey ? caller.load(callerRootKey) ?? null : null);
			this.initialize(element, payload);
			_assertClassBrand(_Builder_brand$1, this, _wire$1).call(this, element);
			return this;
		}
		/**
		* 🧷 DETACH — hand the caller its receptacle back and return the projected
		* node to its owner (still registered, ready to re-attach).
		*
		* @param slotKey  slot to release.
		* @returns current builder.
		*/
		detach(slotKey) {
			for (const [typeKey, entry] of _classPrivateFieldGet2(_projected$1, this)) {
				if (entry.slot !== slotKey) continue;
				if (entry.element.parentNode) entry.element.replaceWith(entry.receptacle);
				_classPrivateFieldGet2(_bindings$1, this).unwire(entry.element);
				_classPrivateFieldGet2(_projected$1, this).delete(typeKey);
			}
			return this;
		}
		/**
		* 🔌 WIRING SCOPES — every DOM location this instance paints: the builder
		* root first, then each node projected into my caller's slot.
		*
		* This is what makes initialize()/sync slot-aware: a builder is exactly as
		* multi-rooted as its projections, so initialize() runs once for the root and
		* loops `scopes()`, while the reactive sync loop repaints every scope — that
		* is how a projected panel stays wired and in sync with the owner's state.
		*/
		scopes() {
			const scopes = [];
			const ownRootKey = Object.keys(this.hierarchy.get())[0];
			const root = ownRootKey ? this.load(ownRootKey) : null;
			if (root) scopes.push(root);
			for (const { element } of _classPrivateFieldGet2(_projected$1, this).values()) {
				if (element === root || root?.contains(element)) continue;
				scopes.push(element);
			}
			return scopes;
		}
		/**
		* @description
		* Removes one or more registered nodes from the active builder instance in a single call.
		* The method detaches the underlying DOM elements from the page and clears the matching
		* records from the local node registry so the builder state stays consistent.
		*
		* @param typeKeys - One or more selector tokens whose live DOM nodes should be removed.
		*
		* @protected
		*/
		remove(...typeKeys) {
			typeKeys.forEach((key) => {
				const liveElement = this.load(key);
				if (liveElement) liveElement.remove();
				this.storage.nodes.delete(key);
			});
		}
		/**
		* @description
		* Cleans up the builder instance by notifying listeners, removing the root DOM element,
		* clearing the internal node registry, and releasing references held by the instance.
		* This method is the lifecycle termination point for a builder and should be invoked when
		* the component is unmounted or discarded.
		*
		* @param typeKey - Optional selector token used to target a specific root node for removal.
		*   When omitted, the builder attempts to remove the default container node.
		*
		* @public
		*/
		destroy(typeKey) {
			if (this.config?.emit) this.config.emit("elementRemoved", {
				builder: this.builderId,
				data: null
			});
			_classPrivateFieldGet2(_bindings$1, this).dispose();
			const rootElement = this.storage.nodes.get(typeKey || "@container")?.element;
			if (rootElement) {
				if (rootElement.parentNode) rootElement.parentNode.removeChild(rootElement);
				else rootElement.remove();
				console.log(`[Lifecycle Security] DOM Element Node for "${String(this.builderId)}" successfully unmounted.`);
			}
			this.storage.nodes.clear();
			for (const slotKey of new Set(Array.from(_classPrivateFieldGet2(_projected$1, this).values(), (entry) => entry.slot))) this.detach(slotKey);
			this.config = null;
			this.instanceNamespace = null;
		}
		/**
		* 🔎 INSPECT — what this instance built, as data instead of DOM.
		*
		* Designed for a caller that cannot look at a screen: a test, a generator or an agent.
		* It answers three questions in one synchronous call — *which keys exist*, *what markup
		* did they produce*, and *which elements does each key own* — without touching the
		* document, waiting for a stylesheet, or knowing this component's payload contract.
		*
		* Three properties are load-bearing, each pinned by a test next door:
		*
		* - **Deterministic.** The identity seed comes from the payload (`buildNamespace`, keys
		*   sorted), never from an instance counter, so the same payload yields the same markup.
		*   A snapshot diff is therefore a real diff.
		* - **Idempotent.** `hierarchy.elements` is rebuilt from the live tree, so reading twice
		*   returns the same data and re-walking changes nothing.
		* - **Hierarchy-first.** `records` on a builder root holds one item (its own); the page
		*   graph lives in `inspectPage()` on the renderer side. Reporting `keys`/`hierarchy`
		*   first keeps the useful half from being hidden behind the thin one.
		*
		* `html` is deliberately raw: attribute order and the anti-FOUC markers (`data-loaded`,
		* `--is-loading`) are left in. Normalising here would hide a regression from the caller.
		*
		* @returns Markup, keys, relations, namespace and the root records.
		*
		* @example
		* const builder = new SectionBuilder(config);
		* builder.create({ content: payload });
		* const { html, keys } = builder.inspect();
		*
		* @summary Lives in the class body on purpose: `Builder.prototype` is frozen at the
		*   bottom of this file, so this hook cannot be bolted on later.
		*/
		inspect() {
			const keys = Object.keys(this.hierarchy.get());
			const root = keys.length ? this.load(keys[0]) : null;
			return {
				html: root ? root.outerHTML : "",
				keys,
				hierarchy: this.hierarchy.get(),
				namespace: this.instanceNamespace,
				records: root?.getMetadata?.() ?? [],
				issues: [..._classPrivateFieldGet2(_issues$1, this)]
			};
		}
		/**
		* Recursively parses CSS selector chains (e.g., ".column>neon", "div.col-4>.card-wrapper")
		* into a nested DOM hierarchy.
		*/
		_wrapElement(wrapperStr, targetElement) {
			if (!wrapperStr || !targetElement) return null;
			const parts = wrapperStr.split(">").map((s) => s.trim()).filter(Boolean);
			if (parts.length === 0) return null;
			const parseNode = (segment) => {
				const parsedAttrs = {};
				const attrRegex = /\[\s*([a-zA-Z0-9_-]+)\s*=\s*['"]?([^'"]*)['"]?\s*\]/g;
				let match;
				while ((match = attrRegex.exec(segment)) !== null) {
					const attrName = match[1];
					parsedAttrs[attrName] = match[2];
				}
				const tokens = segment.replace(/\[[^\]]*\]/g, "").split(/(?=[.#])/);
				let tagName = "div";
				let id = "";
				const classList = [];
				if (tokens.length > 0 && !tokens[0].startsWith(".") && !tokens[0].startsWith("#")) tagName = tokens[0];
				tokens.forEach((token) => {
					if (!token) return;
					if (token.startsWith("#")) id = token.slice(1);
					else if (token.startsWith(".")) classList.push(token.slice(1));
				});
				const el = document.createElement(tagName);
				if (id) el.id = id;
				if (classList.length > 0) el.className = classList.join(" ");
				Object.entries(parsedAttrs).forEach(([aName, aValue]) => {
					el.setAttribute(aName, aValue);
				});
				return el;
			};
			const __outer = parseNode(parts[0]);
			let innerPointer = __outer;
			for (let i = 1; i < parts.length; i++) {
				const child = parseNode(parts[i]);
				innerPointer.appendChild(child);
				innerPointer = child;
			}
			innerPointer.appendChild(targetElement);
			return {
				__outer,
				__inner: targetElement
			};
		}
		/**
		* 🧱 THE ATTR AND METADATA WELDER (POS PENGURUS DATA ATRIBUT)
		* Melumat tuntas ID, ClassName, kustom attrs, hingga data- attributes bawaan database Sheets.
		* Pair-stamping delegated to Utility/AttributeUtils.
		*/
		_applyNodeAttributes(el, selector) {
			if (!selector) return;
			if (selector.id && selector.id !== "") el.id = selector.id;
			if (selector.className && selector.className !== "") el.className = selector.className;
			if (selector.textContent && selector.textContent !== "") el.textContent = selector.textContent;
			applyAttrDictionary$1(el, selector.attrs);
			applyAttributeList$1(el, selector.attributes);
		}
	};
	/**
	* ⚠️ STYLESHEET CONTRACT — STATIC, NOT INSTANCE:
	* The file path pointer target referencing the isolated CSS stylesheet asset assigned to this module.
	* Declare it on subclasses as a STATIC field — `static readonly stylesheet = "./MyComponent.css";`
	* ComponentRegistry.loadModule() reads it from the CLASS object (`BuilderClass.stylesheet`)
	* during lazy module resolution, BEFORE any instance exists. An instance-only class field is
	* invisible to the registry (class fields never land on the prototype), so the CSS would
	* never auto-load. (TS has no `abstract static`, hence documented convention instead.)
	*/
	/**
	* Stylesheet specifier declared by this builder, wherever it was put.
	*
	* @returns The specifier from the instance, else from the class (`static stylesheet`),
	*   else `""` — a builder without a sheet simply has none.
	*
	* @summary Subclasses disagree on where they declare it, and this is read on every
	* `create()`, so both places are checked instead of trusting one convention.
	*/
	function _stylesheetSpecifier$1() {
		const fromInstance = this.stylesheet;
		if (typeof fromInstance === "string" && fromInstance) return fromInstance;
		const fromClass = this.constructor.stylesheet;
		return typeof fromClass === "string" ? fromClass : "";
	}
	/**
	* 🔌 WIRE ONE SCOPE — the seam every `[data-bind]` control hangs off.
	*
	* A no-op unless the builder declares `model()`: the presence of that hook is the whole
	* opt-in, the same way `loading()` opts into its own mockup. Called right after
	* `initialize()` at the three places a scope starts living, so a builder wires its
	* commands first and the controls second.
	*
	* @param scope - root element, attached key, or mounted child element.
	*/
	function _wire$1(scope) {
		if (typeof this.model !== "function") return;
		const model = this.model();
		if (!model) return;
		if (!isReactive$1(model)) {
			console.warn(`[Builder:${String(this.builderId)}] model() returned a plain object. Create it once with this.setProxy(...) and return that proxy, or writes to it will never reach the mirror.`);
			return;
		}
		const paint = typeof this.paint === "function" ? this.paint.bind(this) : void 0;
		_classPrivateFieldGet2(_bindings$1, this).wire(scope, model, paint);
	}
	var _active$4 = { _: null };
	var _namespaceStack$1 = { _: [] };
	_defineProperty(Builder$1, "contract", void 0);
	_a = Builder$1;
	Object.freeze(Builder$1.prototype);
	setBuilderAdapter$1({ resetCounters: () => Builder$1.resetCounters() });
	// packages/components/skeleton/dist/Skeleton.js
	/**
	* Skeleton — the mandatory placeholder primitive.
	*
	* A builder that implements `loading()` has to show *something* while its own stylesheet
	* is still on its way, and that something cannot be styled by the sheet it is standing in
	* for. So the silhouette is a component of its own, loaded with the app shell (like a
	* design system's `<Skeleton>`): its sheet is always present, which is what makes a
	* precise mockup possible at the exact moment the real sheet is missing.
	*
	* Two doors, one DOM builder:
	*
	* - {@link Skeleton.create} — a pure factory. This is what `loading()` uses: no lifecycle,
	*   no node records, no payload loop. A mockup is a picture, and a picture must not cost a
	*   render pass.
	* - {@link SkeletonBuilder} — the registry face, so a page manifest can declare
	*   `"skeleton"` like any other component.
	*
	* Precision comes from the *spec*, not from the skin: shapes, sizes, aspect ratios and
	* counts are declared per real component (`ProductCard` mirrors its display/swatches/
	* caption/button rhythm, `Table` mirrors its header and row height).
	*/
	/** The attribute the hold reads its visibility floor from. */
	var SKELETON_DURATION_ATTRIBUTE$1 = "data-skeleton-duration";
	/**
	* Shape → class. Kept as a map so the DOM shape and the CSS shape cannot drift apart.
	*
	* @summary Bare words on purpose: the root always carries `.skeleton`, so the sheet can
	*   write `&.bone` (a compound) and the markup never needs a dash-joined name.
	*/
	var SHAPE_CLASS$1 = {
		stack: "stack",
		row: "row",
		line: "line",
		bone: "bone",
		circle: "circle"
	};
	var Skeleton$1 = class Skeleton$1 {
		/**
		* Builds one mockup subtree.
		*
		* @param spec - The silhouette: shapes, sizes and repetition.
		* @returns The mockup root element.
		*
		* @example
		* Skeleton.create({
		*   shape: "stack",
		*   children: [
		*     { shape: "bone", aspect: "1 / 1" },
		*     { shape: "line", width: "62%" },
		*     { shape: "line", width: "88%", count: 2 },
		*   ],
		* });
		*
		* @summary Direct `document.createElement` on purpose: no `render()`, no node records,
		*   no identity namespace. The caller (`Builder.create()`) hides the real tree and drops
		*   this one the moment the sheet lands, so tracking it would be pure waste.
		*/
		static create(spec = {}) {
			const shape = spec.shape ?? "bone";
			const node = document.createElement("div");
			node.className = [
				"skeleton",
				SHAPE_CLASS$1[shape],
				spec.className?.trim()
			].filter(Boolean).join(" ");
			node.setAttribute("data-skeleton", shape);
			if (spec.width) node.style.width = spec.width;
			if (spec.height) node.style.height = spec.height;
			if (spec.aspect) node.style.aspectRatio = spec.aspect;
			if (spec.gap) node.style.gap = spec.gap;
			if (typeof spec.duration === "number" && Number.isFinite(spec.duration) && spec.duration > 0) node.setAttribute(SKELETON_DURATION_ATTRIBUTE$1, String(Math.round(spec.duration)));
			for (const child of spec.children ?? []) {
				const count = Math.max(1, child.count ?? 1);
				for (let index = 0; index < count; index += 1) node.appendChild(Skeleton$1.create({
					...child,
					count: 1
				}));
			}
			return node;
		}
	};
	var SkeletonBuilder$1 = class extends Builder$1 {
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "skeleton");
			_defineProperty(this, "name", "skeleton");
			_defineProperty(this, "stylesheet", "./Skeleton.css");
			_defineProperty(this, "config", void 0);
			this.config = this.resolveConfig({
				themeId: "default",
				namespace: null,
				emit: () => {},
				selectors: {},
				spec: {},
				duration: 2e3,
				className: ""
			}, config);
		}
		prepare(content) {
			const fromContent = content && typeof content === "object" ? content : {};
			return Skeleton$1.create({
				duration: this.config.duration,
				className: this.config.className,
				...this.config.spec,
				...fromContent
			});
		}
		template() {}
		initialize() {}
	};
	_defineProperty(SkeletonBuilder$1, "contract", {
		schema: {
			t: "record",
			open: true
		},
		example: {
			shape: "line",
			width: "60%"
		}
	});
	// packages/components/accordion/Accordion.ts
	var AccordionBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — one open panel between two closed headers, drawn with the mandatory
		* `@aio-ui/skeleton` primitive. `Accordion.css` is the sheet that is still on its way, so
		* the skin cannot come from it; the rhythm comes from the spec instead.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [
					{
						shape: "bone",
						height: "3rem"
					},
					{
						shape: "line",
						count: 3
					},
					{
						shape: "bone",
						height: "3rem",
						count: 2
					}
				]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "accordion");
			_defineProperty(this, "name", "accordion");
			_defineProperty(this, "stylesheet", "./Accordion.css");
			_defineProperty(
				this,
				/** The shared `name` when `autoClose` is on — one group per builder instance, so two
				*  accordions on one page never close each other's sections. */
				"group",
				`accordion-${Math.random().toString(36).slice(2, 8)}`
			);
			const defaultConfig = {
				themeId: "default",
				selectors: {
					"@accordion": {
						tagName: "div",
						className: "accordion"
					},
					"@accordion>section": { tagName: "details" },
					"@accordion>section>title": { tagName: "summary" },
					"@accordion>section>content": {
						tagName: "div",
						className: "content"
					}
				},
				namespace: null,
				emit: () => {},
				appearance: "default",
				autoClose: false,
				expanded: false,
				animation: true
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		prepare(data, _config) {
			const items = (Array.isArray(data) ? data : [data]).filter(Boolean);
			return this.render("@accordion", items);
		}
		initialize() {}
		template(typeKey, el, payload) {
			switch (typeKey) {
				case "@accordion": {
					const items = payload;
					const sections = items.map((item) => this.render("@accordion>section", item));
					el.append(...sections);
					this.behaviour(el, sections, items);
					break;
				}
				case "@accordion>section":
					if (!payload) return;
					const title = this.render("@accordion>section>title", payload.title);
					const content = this.render("@accordion>section>content", payload.description);
					el.append(title, content);
					break;
				case "@accordion>section>title":
					el.textContent = payload || "Untitled Header";
					break;
				case "@accordion>section>content": if (payload instanceof HTMLElement) el.appendChild(payload);
				else {
					const p = document.createElement("p");
					p.className = "desc";
					p.textContent = typeof payload === "string" && payload ? payload : "Untitled Content";
					el.appendChild(p);
				}
			}
		}
		/** Root-level look and behaviour: `data-appearance`, `data-animation`, the shared `name`
		*  group that makes `autoClose` native, and the sections that start open. */
		behaviour(root, sections, items) {
			if (this.config.appearance !== "default") root.dataset.appearance = this.config.appearance;
			const animation = this.config.animation;
			if (animation === false) root.dataset.animation = "none";
			else if (typeof animation === "string") root.dataset.animation = animation;
			else if (animation && typeof animation === "object") {
				root.dataset.animation = "custom";
				root.style.setProperty("--accordion-anim-in-name", animation.in ?? "none");
			}
			sections.forEach((section, index) => {
				if (this.config.autoClose) section.setAttribute("name", this.group);
				if (this.opens(index, items[index])) section.setAttribute("open", "");
			});
		}
		/** `expanded: true` opens everything — or only index 0 when `autoClose` makes that the
		*  only section that can stay open. An array opens the sections whose key it lists. */
		opens(index, item) {
			const { expanded, autoClose } = this.config;
			if (expanded === true) return autoClose ? index === 0 : true;
			if (!Array.isArray(expanded)) return false;
			const key = this.keyOf(item);
			return key !== null && expanded.map(String).includes(key);
		}
		keyOf(item) {
			if (!item || typeof item !== "object") return null;
			const record = item;
			const key = record.id ?? record.key ?? record.title;
			return key === void 0 || key === null ? null : String(key);
		}
	};
	_defineProperty(AccordionBuilder, "contract", {
		schema: {
			t: "list",
			single: true,
			of: {
				t: "record",
				open: true,
				of: {
					title: { t: "string" },
					description: { t: "string" }
				}
			}
		},
		example: [{
			title: "Shipping",
			description: "Delivered in two working days."
		}]
	});
	// packages/components/accordion/index.ts
	var accordion_exports = /* @__PURE__ */ __exportAll({ AccordionBuilder: () => AccordionBuilder });
	// packages/modules/animations/behaviours/typewriter.ts
	var TypewriterBehaviour$1 = class {
		/**
		* Pemecah karakter menggunakan Intl.Segmenter (grapheme murni)
		*/
		static getCharacters(text) {
			return [...new Intl.Segmenter(document.documentElement.lang || "id", { granularity: "grapheme" }).segment(text)].map((s) => s.segment);
		}
		static sleep(ms) {
			return new Promise((resolve) => setTimeout(resolve, ms));
		}
		static rng(min, max) {
			return Math.floor(Math.random() * (max - min) + min);
		}
		/** Jeda antar karakter — ambil nilai acak bila interval berupa array (dikali faktor kecepatan) */
		static async _typingInterval(options, speedFactor = 1) {
			if (Array.isArray(options.interval)) await this.sleep(options.interval[this.rng(0, options.interval.length)] * speedFactor);
			else await this.sleep(options.interval * speedFactor);
		}
		/**
		* Hitung ritme jeda tanda baca (Anti-tabrakan Spasi):
		* - akhir kalimat (. ! ? diikuti spasi/baris baru/akhir teks) -> jeda penuh,
		*   atau setengahnya saat mode rewrite aktif;
		* - jeda pendek (; : ,) -> delay / 6.
		* Bila tanda pendek diikuti spasi, spasi langsung dilekatkan ke layar dan pemanggil
		* diminta melompati indeks spasi tersebut (swallowNextChar).
		*/
		static _punctuationRhythm(char, nextChar, el, options) {
			const sentenceEnders = [
				".",
				"!",
				"?"
			];
			const shortPauses = [
				",",
				";",
				":"
			];
			if (sentenceEnders.includes(char)) {
				if (!nextChar || nextChar === " " || nextChar === "\n") return {
					pauseMs: options.rewrite ? options.delay / 2 : options.delay,
					swallowNextChar: false
				};
			} else if (shortPauses.includes(char)) {
				const swallowNextChar = nextChar === " ";
				if (swallowNextChar) el.textContent += nextChar;
				return {
					pauseMs: options.delay / 6,
					swallowNextChar
				};
			}
			return {
				pauseMs: 0,
				swallowNextChar: false
			};
		}
		/** Fase ketik: tempelkan karakter satu-per-satu mengikuti ritme interval & jeda tanda baca */
		static async _typeOut(node, el, characters, options, isStopped = () => false) {
			for (let i = 0; i < characters.length; i++) {
				if (!node.isConnected || isStopped()) return;
				const char = characters[i];
				el.textContent += char;
				await this._typingInterval(options);
				const rhythm = this._punctuationRhythm(char, characters[i + 1], el, options);
				if (rhythm.swallowNextChar) i++;
				if (rhythm.pauseMs > 0) {
					el.classList.remove("tw-writing");
					await this.sleep(rhythm.pauseMs);
					if (!node.isConnected || isStopped()) return;
					el.classList.add("tw-writing");
				}
			}
		}
		/**
		* Fase hapus mundur: untuk kalimat bukan-terakhir (atau saat mode loop aktif),
		* teks dikosongkan kembali dengan efek hapus super cepat (interval x 0.1).
		*/
		static async _deleteBackwards(node, el, options, isLastSentence, isStopped = () => false) {
			if (!isLastSentence || options.loop) {
				el.classList.add("tw-writing");
				while (el.textContent !== "") {
					if (!node.isConnected || isStopped()) return;
					const currentChars = this.getCharacters(el.textContent);
					currentChars.pop();
					el.textContent = currentChars.join("");
					await this._typingInterval(options, .1);
				}
				await this.sleep(200);
			} else el.classList.remove("tw-writing");
		}
		/**
		* Core Engine Typewriter Effect (Konsisten & Unified):
		* merangkai fase ketik -> jeda membaca -> hapus mundur untuk SATU kalimat.
		*/
		static async _typewriterEffect(node, el, targetText, options, isLastSentence, isStopped = () => false) {
			const characters = this.getCharacters(targetText);
			el.textContent = "";
			el.style.whiteSpace = "normal";
			el.style.wordBreak = "break-word";
			el.classList.add("tw-writing");
			await this._typeOut(node, el, characters, options, isStopped);
			if (!node.isConnected || isStopped()) return;
			el.classList.remove("tw-writing");
			await this.sleep(options.delay);
			if (!node.isConnected || isStopped()) return;
			await this._deleteBackwards(node, el, options, isLastSentence, isStopped);
		}
		/** MODE REWRITE step-1: pecah teks tiap blok anak jadi daftar kalimat lalu kosongkan layarnya */
		static _extractRewriteBlocks(originalChildren) {
			const sentenceSegmenter = new Intl.Segmenter(document.documentElement.lang || "id", { granularity: "sentence" });
			return originalChildren.map((child) => {
				const rawText = (child.textContent || "").trim().replace(/\s+/g, " ");
				const sentences = [...sentenceSegmenter.segment(rawText)].map((s) => s.segment.trim()).filter(Boolean);
				child.textContent = "";
				child.style.visibility = "hidden";
				return {
					el: child,
					sentences
				};
			});
		}
		/** MODE REWRITE step-2: satu lintasan penuh — tampilkan blok bergantian sambil mengetik kalimatnya */
		static async _rewritePass(node, blockData, options, isStopped = () => false) {
			for (const block of blockData) {
				block.el.style.display = "";
				block.el.style.visibility = "visible";
				for (let sIndex = 0; sIndex < block.sentences.length; sIndex++) {
					if (!node.isConnected || isStopped()) return;
					const isLastBlock = block === blockData[blockData.length - 1];
					const isLastSentenceOfBlock = sIndex === block.sentences.length - 1;
					const isAbsoluteLast = isLastBlock && isLastSentenceOfBlock;
					await this._typewriterEffect(node, block.el, block.sentences[sIndex], options, isAbsoluteLast, isStopped);
				}
				if (block !== blockData[blockData.length - 1] || options.loop) block.el.style.display = "none";
			}
		}
		/**
		* SCENARIO A ENGINE — MODE REWRITE (Mendukung Struktur Bersarang Komponen Skema Anda):
		* sekali jalan, atau berputar tanpa henti selama opsi loop aktif.
		*/
		static async _rewriteEngine(node, options, onDone, isStopped = () => false) {
			const childElements = [...Array.from(node.children)];
			const originalChildren = childElements.length > 0 ? childElements : [node];
			const blockData = this._extractRewriteBlocks(originalChildren);
			if (options.loop) while (true) {
				if (!node.isConnected || isStopped()) break;
				await this._rewritePass(node, blockData, options, isStopped);
			}
			else {
				await this._rewritePass(node, blockData, options, isStopped);
				onDone();
			}
		}
		/**
		* SCENARIO B ENGINE — LOOP MULTI-ELEMENT (Berdasarkan Array Teks):
		* seluruh teks anak digabung menjadi satu paragraf dinamis lalu diputar terus.
		*/
		static async _loopMultiElement(node, options, isStopped = () => false) {
			const loopTexts = [...Array.from(node.children)].map((el) => el.textContent || "");
			const firstChild = node.firstElementChild;
			const loopParagraphTag = firstChild ? firstChild.tagName.toLowerCase() : "p";
			while (node.firstChild) node.removeChild(node.firstChild);
			const loopParagraph = document.createElement(loopParagraphTag);
			node.appendChild(loopParagraph);
			while (true) {
				if (!node.isConnected || isStopped()) break;
				for (const text of loopTexts) {
					if (!node.isConnected || isStopped()) break;
					await this._typewriterEffect(node, loopParagraph, text, options, false, isStopped);
				}
			}
		}
		/** True bila elemen hanya memuat satu anak bertipe Text murni */
		static _hasSingleTextNode(el) {
			return el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE;
		}
		/**
		* SCENARIO C ENGINE — SEKUENSIAL / PARALEL DEFAULT (Sekali Jalan Tanpa Rewrite):
		* teks setiap elemen anak diketik bergantian dari atas ke bawah.
		*/
		static async _runSequential(node, options, onDone, isStopped = () => false) {
			const sequentialData = [...Array.from(node.children)].map((el) => {
				const text = el.textContent || "";
				el.textContent = "";
				return {
					el,
					text
				};
			});
			for (let i = 0; i < sequentialData.length; i++) {
				if (!node.isConnected || isStopped()) return;
				const item = sequentialData[i];
				item.el.textContent = item.text;
				await this._typewriterEffect(node, item.el, item.text, options, true, isStopped);
			}
			onDone();
		}
		/**
		* Router utama untuk memproses efek typewriter pada DOM Node.
		* Port 1:1 dari AnimationsService._handleTypewriter (versi lama).
		*/
		static async animate(node, baseOptions, onDone, isStopped = () => false) {
			let loop = baseOptions.loop;
			if (node.hasAttribute("data-tw-loop")) {
				const attr = node.getAttribute("data-tw-loop");
				if (attr === "true") loop = true;
				else if (attr === "false") loop = false;
				else {
					const num = parseInt(attr || "", 10);
					loop = isNaN(num) ? false : num;
				}
			}
			const rewrite = node.hasAttribute("data-tw-rewrite") ? node.getAttribute("data-tw-rewrite") === "true" : baseOptions.rewrite;
			const options = {
				...baseOptions,
				loop,
				rewrite
			};
			node.style.visibility = "visible";
			if (options.rewrite) {
				await this._rewriteEngine(node, options, onDone, isStopped);
				return;
			}
			if (options.loop) {
				await this._loopMultiElement(node, options, isStopped);
				return;
			}
			if (this._hasSingleTextNode(node) || node.children.length === 0) {
				await this._typewriterEffect(node, node, node.textContent || "", options, true, isStopped);
				onDone();
			} else await this._runSequential(node, options, onDone, isStopped);
		}
	};
	/** `animation="typewriter"` — typing engine with rewrite and loop scenarios. */
	var typewriterBehaviour$1 = {
		type: "typewriter",
		animate: ({ node, options, delay, stopped, done }) => TypewriterBehaviour$1.animate(node, {
			...options,
			delay
		}, () => done(), stopped)
	};
	// packages/modules/animations/behaviours/stagger-fade.ts
	/**
	* MODUL: STAGGERING FADE IN (Tetap Menggunakan Native Masking Premium)
	*
	* Port 1:1 dari _handleStaggerFade lama di AnimationsService:
	* - konversi durasi '0.6s' | '600ms' -> ms tetap sama,
	* - delay bertingkat = index × delay,
	* - event 'animation:done' dipicu PER SEGMEN (bukan sekali di akhir) karena
	*   begitulah perilaku versi lama; listener rantai memakai { once: true },
	*   sehingga rantai bisa terpicu sedini segmen pertama selesai. Oleh karena
	*   itu callback-nya bernama onSegmentDone dan menerima elemen segmen.
	*/
	var StaggerFadeBehaviour$1 = class {
		/** Konversi string durasi CSS ('0.6s' | '600ms') ke angka milidetik untuk WAAPI */
		static _toMs(durationStr) {
			return durationStr.endsWith("ms") ? parseFloat(durationStr) : parseFloat(durationStr) * 1e3;
		}
		/**
		* Bangun daftar segmen sesuai mode:
		* - 'line': pakai anak elemen yang sudah ada, atau buat satu <p> per baris.
		* - default ('sentence'): pecah teks menjadi kalimat berdiri sendiri (<span>).
		* Catatan: fungsi ini memutasi node (mengosongkan lalu mengisi ulang),
		* persis seperti perilaku versi lama.
		*/
		static _buildSegments(node, mode) {
			if (mode === "line") {
				if (node.children.length > 0) return [...Array.from(node.children)];
				const lines = (node.textContent || "").split("\n").filter((line) => line.trim() !== "");
				node.textContent = "";
				const created = [];
				lines.forEach((line) => {
					const p = document.createElement("p");
					p.textContent = line;
					node.appendChild(p);
					created.push(p);
				});
				return created;
			}
			const rawText = (node.textContent || "").trim();
			node.textContent = "";
			const textSegments = [...new Intl.Segmenter(document.documentElement.lang || "id", { granularity: "sentence" }).segment(rawText)].map((s) => s.segment.trim());
			const segments = [];
			textSegments.forEach((sentence) => {
				if (sentence) {
					const span = document.createElement("span");
					span.textContent = sentence + " ";
					span.style.display = "inline-block";
					node.appendChild(span);
					segments.push(span);
				}
			});
			return segments;
		}
		/** Jalankan fade bertahap segmen-demi-segmen menggunakan Native Web Animations API */
		static animate(node, options, onSegmentDone) {
			const mode = node.getAttribute("data-stagger-mode") || "sentence";
			const durationMs = this._toMs(options.duration);
			this._buildSegments(node, mode).forEach((el, index) => {
				el.style.opacity = "0";
				el.style.transform = "translateY(15px)";
				el.animate([{
					opacity: 0,
					transform: "translateY(15px)"
				}, {
					opacity: 1,
					transform: "translateY(0)"
				}], {
					duration: durationMs,
					delay: index * options.delay,
					easing: "cubic-bezier(0.25, 1, 0.5, 1)",
					fill: "forwards"
				}).finished.then(() => {
					if (!el.isConnected) return;
					onSegmentDone(el);
				}).catch((error) => {
					if (!(error instanceof DOMException) || error.name !== "AbortError") console.error("[StaggerFadeBehaviour] Animation failed:", error);
				});
			});
		}
	};
	/** `animation="stagger-fade"` — segment-by-segment entrance. */
	var staggerFadeBehaviour$1 = {
		type: "stagger-fade",
		optionKey: "staggerFade",
		animate: ({ node, options, done }) => {
			StaggerFadeBehaviour$1.animate(node, options, (segment) => done(segment));
		}
	};
	// packages/modules/animations/behaviours/fade-in.ts
	/**
	* MODUL: FADE IN (Web Animations API)
	*
	* Port dari _handleFadeIn lama di AnimationsService:
	* - delay dinamis dibaca dari atribut data-fade-delay (default '0s'),
	* - variabel --fade-delay / --fade-duration di-set ulang tiap eksekusi,
	* - pre-hide CSS memakai visibility:hidden (elemen tetap memegang ruang
	*   layout) — dibuka inline saat animasi mulai, lalu opacity 0 -> 1 +
	*   translateY(10px) -> 0 (500ms, ease-out) via WAAPI fill:forwards,
	* - event 'animation:done' dipicu lewat Promise .finished bawaan WAAPI.
	*/
	var FadeInBehaviour$1 = class {
		static async animate(node, options, onDone) {
			const delay = node.getAttribute("data-fade-delay") || "0s";
			node.style.setProperty("--fade-delay", delay);
			node.style.setProperty("--fade-duration", options.duration);
			node.style.visibility = "visible";
			node.animate([{
				opacity: 0,
				transform: "translateY(10px)"
			}, {
				opacity: 1,
				transform: "translateY(0)"
			}], {
				duration: 500,
				easing: "ease-out",
				fill: "forwards"
			}).finished.then(() => {
				if (!node.isConnected) return;
				onDone();
			}).catch((error) => {
				if (!(error instanceof DOMException) || error.name !== "AbortError") console.error("[FadeInBehaviour] Animation failed:", error);
			});
		}
	};
	/** `animation="fade-in"` — WAAPI opacity/translate entrance. */
	var fadeInBehaviour$1 = {
		type: "fade-in",
		optionKey: "fade",
		animate: ({ node, options, done }) => FadeInBehaviour$1.animate(node, options, () => done())
	};
	// packages/modules/animations/behaviours/scramble.ts
	/**
	* MODUL: TEXT SCRAMBLE (Matrix/Cyberpunk)
	*
	* Port 1:1 dari _handleScramble lama di AnimationsService:
	* karakter diacak dari pool, dikunci satu-per-satu ke huruf asli,
	* dengan pengecekan node.isConnected di tiap loop utama dan sub-loop,
	* lalu memicu event 'animation:done' tepat setelah efek selesai total.
	*/
	var ScrambleBehaviour$1 = class {
		/** Utilitas jeda non-blocking */
		static sleep(ms) {
			return new Promise((resolve) => setTimeout(resolve, ms));
		}
		/** Bilangan bulat acak [min, max) — hasilnya identik dengan Math.floor(Math.random() * length) versi lama */
		static rng(min, max) {
			return Math.floor(Math.random() * (max - min) + min);
		}
		/** Core Engine Text-Scramble */
		static async animate(node, options, onDone, isStopped = () => false) {
			const targetText = (node.textContent || "").trim();
			node.textContent = "";
			node.style.opacity = "1";
			const pool = options.chars;
			const speed = options.speed;
			const targetChars = [...new Intl.Segmenter(document.documentElement.lang || "id", { granularity: "grapheme" }).segment(targetText)].map((s) => s.segment);
			let currentTextArray = new Array(targetChars.length).fill("");
			const maxCycles = 12;
			for (let i = 0; i < targetChars.length; i++) {
				if (!node.isConnected || isStopped()) return;
				for (let cycle = 0; cycle < maxCycles; cycle++) {
					if (!node.isConnected || isStopped()) return;
					currentTextArray[i] = pool[this.rng(0, pool.length)];
					for (let j = i + 1; j < Math.min(i + 3, targetChars.length); j++) currentTextArray[j] = pool[this.rng(0, pool.length)];
					node.textContent = currentTextArray.join("");
					await this.sleep(speed / 2);
				}
				currentTextArray[i] = targetChars[i];
				node.textContent = currentTextArray.join("");
				await this.sleep(speed);
			}
			onDone();
		}
	};
	/** `animation="text-scramble"` — Matrix/Cyberpunk decode entrance. */
	var scrambleBehaviour$1 = {
		type: "text-scramble",
		optionKey: "scramble",
		animate: ({ node, options, stopped, done }) => ScrambleBehaviour$1.animate(node, options, () => done(), stopped)
	};
	// packages/modules/animations/behaviours/count-up.ts
	var CountUpBehaviour$1 = class {
		static animate(node) {
			const targetNumber = parseInt(node.textContent || "", 10) || 0;
			node.setAttribute("data-target-number", String(targetNumber));
		}
	};
	/** `animation="count-up"` — reads the target number and hands it to the counter. */
	var countUpBehaviour$1 = {
		type: "count-up",
		animate: ({ node, done }) => {
			CountUpBehaviour$1.animate(node);
			done();
		}
	};
	// packages/modules/animations/behaviours/loading-placeholder.ts
	var LoadingPlaceholderBehaviour$1 = class {
		static async animate(node, options, onDone, isStopped = () => false) {
			const attrDuration = node.getAttribute("data-duration");
			const parsedAttrDelay = attrDuration !== null ? parseInt(attrDuration, 10) : NaN;
			const duration = Number.isFinite(parsedAttrDelay) ? parsedAttrDelay : Number(options.duration) || 500;
			const settledDelay = Number.isFinite(duration) ? Math.max(0, duration) : 0;
			window.setTimeout(() => {
				if (isStopped()) return;
				if (!node.isConnected) {
					onDone();
					return;
				}
				const releaseDuration = Math.max(200, parseInt(String(options.instantRevealDelayTime ?? 200), 10) || 200);
				const restoreOriginalOpacity = () => {
					const backupValue = node.getAttribute("data-anim-hold-opacity");
					if (backupValue === null) return;
					if (backupValue.trim() === "") {
						if (options.restoreFallbackOpacity !== void 0 && String(options.restoreFallbackOpacity).trim() !== "") node.style.opacity = String(options.restoreFallbackOpacity);
						else node.style.removeProperty("opacity");
					} else node.style.opacity = backupValue;
				};
				node.classList.remove("anim-placeholder-active");
				restoreOriginalOpacity();
				node.removeAttribute("data-anim-hold-opacity");
				if (node.getAttribute("animation") === "loading-placeholder") node.removeAttribute("animation");
				window.setTimeout(() => {
					node.style.removeProperty("transition");
				}, releaseDuration);
				onDone();
			}, settledDelay);
		}
	};
	// packages/modules/animations/behaviours/registry.ts
	/**
	* Built-in behaviours, in declaration order. Add a behaviour here only when it
	* belongs to the framework itself; project-specific effects register at runtime.
	*/
	var ANIMATION_BEHAVIOURS$1 = [
		typewriterBehaviour$1,
		staggerFadeBehaviour$1,
		fadeInBehaviour$1,
		scrambleBehaviour$1,
		countUpBehaviour$1,
		{
			type: "loading-placeholder",
			optionKey: "loadingPlaceholder",
			animate: ({ node, options, stopped, done }) => LoadingPlaceholderBehaviour$1.animate(node, options, () => done(), stopped)
		}
	];
	ANIMATION_BEHAVIOURS$1.map((b) => b.type);
	/**
	* Indexes a behaviour list by `type`.
	*
	* @throws {Error} On a duplicate type — silently keeping the last one hides a
	*   real configuration mistake (two packages claiming `animation="fade-in"`).
	*/
	function indexBehaviours$1(behaviours) {
		const index = /* @__PURE__ */ new Map();
		for (const behaviour of behaviours) {
			if (!behaviour?.type) throw new Error("[animations] A behaviour definition is missing its `type`.");
			if (index.has(behaviour.type)) throw new Error(`[animations] Duplicate animation behaviour: "${behaviour.type}".`);
			index.set(behaviour.type, behaviour);
		}
		return index;
	}
	// packages/modules/animations/Animations.ts
	var _behaviours$1 = /* @__PURE__ */ new WeakMap();
	var _pendingScan$1 = /* @__PURE__ */ new WeakMap();
	var _scanFrame$1 = /* @__PURE__ */ new WeakMap();
	/**
	* AnimationsService — unified lifecycle and execution engine for declarative DOM animations.
	*
	* Implements tree-agnostic document-order sequencing, WeakMap/Map node tracking,
	* dynamic mutation discovery, and viewport intersection entry/exit management.
	*/
	var AnimationsService$1 = class {
		constructor(config = {}) {
			_defineProperty(this, "globalDelay", void 0);
			_defineProperty(this, "config", void 0);
			_defineProperty(
				this,
				/** Registry of all active animation records keyed by element */
				"records",
				/* @__PURE__ */ new Map()
			);
			_defineProperty(
				this,
				/** Ordered list of chained elements per execution scope (e.g. fieldset, form, section) */
				"scopes",
				/* @__PURE__ */ new Map()
			);
			_defineProperty(
				this,
				/** Native DOM observers */
				"mutationObserver",
				null
			);
			_defineProperty(this, "viewObserver", null);
			_classPrivateFieldInitSpec(this, _behaviours$1, void 0);
			_classPrivateFieldInitSpec(this, _pendingScan$1, /* @__PURE__ */ new Set());
			_classPrivateFieldInitSpec(this, _scanFrame$1, null);
			_classPrivateFieldSet2(_behaviours$1, this, indexBehaviours$1([...ANIMATION_BEHAVIOURS$1, ...config.behaviours ?? []]));
			this.globalDelay = config.delay ?? 500;
			this.config = {
				typewriter: {
					loop: config.typewriter?.loop ?? false,
					interval: config.typewriter?.interval ?? 30,
					delay: config.typewriter?.delay ?? this.globalDelay,
					rewrite: config.typewriter?.rewrite ?? false
				},
				fade: { duration: config.fade?.duration ?? "0.5s" },
				staggerFade: {
					delay: config.staggerFade?.delay ?? 5e3,
					duration: config.staggerFade?.duration ?? "0.6s"
				},
				scramble: {
					chars: config.scramble?.chars ?? "!<>-_\\/[]{}—=+*^?#________",
					speed: config.scramble?.speed ?? 40
				},
				loadingPlaceholder: { duration: config.loadingPlaceholder?.duration ?? this.globalDelay },
				...config
			};
			this._observeMutations();
		}
		/**
		* Initializes the animation engine, scanning the target root and establishing observers.
		*/
		init(root = document.body) {
			this.scan(root);
			return this;
		}
		/**
		* Registers a behaviour at runtime, keyed by its `type`.
		*
		* Overrides an existing type deliberately: the engine keeps one definition per
		* attribute value, so a host can restyle `fade-in` without touching the DOM.
		*
		* @returns This service, for chaining.
		*/
		use(behaviour) {
			if (!behaviour?.type) throw new Error("[AnimationsService] A behaviour definition is missing its `type`.");
			_classPrivateFieldGet2(_behaviours$1, this).set(behaviour.type, behaviour);
			return this;
		}
		/** The `animation` attribute values this service can currently run. */
		get types() {
			return [..._classPrivateFieldGet2(_behaviours$1, this).keys()];
		}
		/**
		* Scans a subtree for elements with `[animation]` in document order and mounts them.
		*/
		scan(root = document.body) {
			if (!root || typeof root.querySelectorAll !== "function") return [];
			const nodes = [];
			if (root instanceof HTMLElement && root.hasAttribute("animation")) nodes.push(root);
			nodes.push(...Array.from(root.querySelectorAll("[animation]")));
			nodes.forEach((node) => this.mount(node));
			this.scopes.forEach((_, scope) => {
				if (this._inViewport(scope)) this._startScope(scope);
			});
			nodes.forEach((node) => {
				const rec = this.records.get(node);
				if (rec && !rec.chained && this._inViewport(node)) this.trigger(node);
			});
			return nodes;
		}
		/**
		* Mounts a single animated node into the registry and configures its initial state.
		*/
		mount(node) {
			if (this.records.has(node)) return;
			const type = node.getAttribute("animation") || "";
			if (!_classPrivateFieldGet2(_behaviours$1, this).has(type)) {
				console.warn(`[AnimationsService] Unknown animation type: "${type}"`);
				return;
			}
			const chained = node.getAttribute("animation-chain") === "true";
			const once = node.getAttribute("animated-once") === "true";
			const scope = this._scope(node);
			const snapshot = {
				opacity: node.style.opacity,
				pointerEvents: node.style.pointerEvents,
				html: node.innerHTML,
				text: node.textContent || ""
			};
			const record = {
				node,
				type,
				chained,
				once,
				played: false,
				scope,
				state: chained ? "waiting" : "idle",
				snapshot,
				controller: new AbortController()
			};
			if (chained) {
				let chainList = this.scopes.get(scope);
				if (!chainList) {
					chainList = [];
					this.scopes.set(scope, chainList);
				}
				if (!chainList.includes(node)) {
					chainList.push(node);
					chainList.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
				}
				if (chainList.indexOf(node) > 0 && type !== "fade-in" && type !== "typewriter") {
					node.style.opacity = "0";
					node.style.pointerEvents = "none";
				}
			}
			this.records.set(node, record);
			this.observe(node);
		}
		/**
		* Unmounts a node, canceling any active animation and cleaning up registry references.
		*/
		unmount(node) {
			const rec = this.records.get(node);
			if (!rec) return;
			this.stop(node);
			if (rec.chained) {
				const chainList = this.scopes.get(rec.scope);
				if (chainList) {
					const idx = chainList.indexOf(node);
					if (idx !== -1) chainList.splice(idx, 1);
					if (chainList.length === 0) {
						this.scopes.delete(rec.scope);
						this.viewObserver?.unobserve(rec.scope);
					}
				}
			} else this.viewObserver?.unobserve(node);
			this.records.delete(node);
		}
		/**
		* Observes a node or its host container for viewport visibility.
		*/
		observe(node) {
			this._ensureViewObserver();
			const rec = this.records.get(node);
			if (!rec) return;
			if (rec.chained) this.viewObserver?.observe(rec.scope);
			else this.viewObserver?.observe(node);
		}
		/**
		* Unobserves the element a record actually observes — for chained nodes that is
		* the scope container, not the node itself.
		*/
		unobserve(node) {
			if (!this.viewObserver) return;
			const rec = this.records.get(node);
			this.viewObserver.unobserve(rec?.chained ? rec.scope : node);
		}
		/**
		* Executes the appropriate animation behaviour for a node.
		*/
		trigger(node) {
			const rec = this.records.get(node);
			if (!rec) return;
			if (rec.once && rec.played) return;
			const behaviour = _classPrivateFieldGet2(_behaviours$1, this).get(rec.type);
			if (!behaviour) return;
			if (rec.state === "running") this.stop(node);
			rec.state = "running";
			rec.played = true;
			rec.controller = new AbortController();
			const signal = rec.controller.signal;
			this._release(node, rec.snapshot);
			const isStopped = () => signal.aborted || !node.isConnected;
			let reported = false;
			const done = (target) => {
				if (reported || rec.state !== "running") return;
				reported = true;
				rec.state = "done";
				this._dispatch(target ?? node, "animation:done");
				if (rec.chained) this.next(rec.scope);
			};
			const context = {
				node,
				options: this._optionsOf(behaviour),
				delay: this._delay(node),
				signal,
				stopped: isStopped,
				done
			};
			try {
				const result = behaviour.animate(context);
				if (result && typeof result.catch === "function") result.catch((error) => {
					if (!isStopped()) console.error(`[AnimationsService] Behaviour "${rec.type}" failed:`, error);
				});
			} catch (error) {
				console.error(`[AnimationsService] Behaviour "${rec.type}" failed:`, error);
				rec.state = "idle";
			}
		}
		/**
		* Advances a chain sequence in a scope by triggering the next waiting element in document order.
		*/
		next(scope) {
			const chain = this.scopes.get(scope);
			if (!chain || chain.length === 0) return;
			const nextNode = chain.find((n) => {
				const rec = this.records.get(n);
				return rec && (rec.state === "waiting" || rec.state === "idle");
			});
			if (!nextNode) {
				this._dispatch(scope, "animation:scope-done");
				return;
			}
			this.trigger(nextNode);
		}
		/**
		* Stops an active animation on a node.
		*/
		stop(node) {
			const rec = this.records.get(node);
			if (!rec) return;
			rec.controller.abort();
			if (rec.state === "running") rec.state = "idle";
			if (typeof node.getAnimations === "function") node.getAnimations().forEach((anim) => anim.cancel());
		}
		/**
		* Resets element(s) to initial state, enabling replay when the viewport or page is revisited.
		*/
		reset(target) {
			if (!target) {
				this.records.forEach((_, node) => this._resetNode(node));
				return;
			}
			if (target instanceof HTMLElement && this.records.has(target)) {
				this._resetNode(target);
				return;
			}
			this.records.forEach((_, node) => {
				if (target.contains(node) || target === node) this._resetNode(node);
			});
		}
		/**
		* Clears state for elements that have left the viewport or page. Alias for reset.
		*/
		clear(target) {
			this.reset(target);
		}
		/**
		* Releases loading placeholders frozen by lazy-loading anti-FOUC guards.
		*/
		release(root = document.body) {
			if (!root || typeof root.querySelectorAll !== "function") return;
			root.querySelectorAll("[animation=\"loading-placeholder\"]").forEach((node) => this.trigger(node));
		}
		/**
		* Backwards-compatibility alias for release().
		*/
		releaseLoadingPlaceholders(root = document.body) {
			this.release(root);
		}
		/**
		* Disconnects observers, stops all running animations, and clears internal maps.
		*/
		destroy() {
			if (this.mutationObserver) {
				this.mutationObserver.disconnect();
				this.mutationObserver = null;
			}
			if (this.viewObserver) {
				this.viewObserver.disconnect();
				this.viewObserver = null;
			}
			this.records.forEach((rec, node) => {
				rec.controller.abort();
				this.stop(node);
			});
			if (_classPrivateFieldGet2(_scanFrame$1, this) !== null) {
				cancelAnimationFrame(_classPrivateFieldGet2(_scanFrame$1, this));
				_classPrivateFieldSet2(_scanFrame$1, this, null);
			}
			_classPrivateFieldGet2(_pendingScan$1, this).clear();
			this.records.clear();
			this.scopes.clear();
		}
		_ensureViewObserver() {
			if (this.viewObserver) return;
			this.viewObserver = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					const target = entry.target;
					if (!target.isConnected) return;
					if (entry.isIntersecting) {
						if (this.scopes.has(target)) this._startScope(target);
						const rec = this.records.get(target);
						if (rec && !rec.chained && rec.state === "idle") this.trigger(target);
					} else if (this.records.has(target)) this.reset(target);
				});
			}, { threshold: 0 });
		}
		_startScope(scope) {
			const chain = this.scopes.get(scope);
			if (!chain || chain.length === 0) return;
			if (chain.some((n) => this.records.get(n)?.state === "running")) return;
			if (chain.every((n) => this.records.get(n)?.state === "done")) return;
			this.next(scope);
		}
		_resetNode(node) {
			const rec = this.records.get(node);
			if (!rec) return;
			if (rec.once && rec.played) return;
			this.stop(node);
			if (rec.chained) {
				rec.state = "waiting";
				node.style.opacity = "0";
				node.style.pointerEvents = "none";
			} else {
				rec.state = "idle";
				if (rec.snapshot.opacity !== "") node.style.opacity = rec.snapshot.opacity;
				else node.style.removeProperty("opacity");
				if (rec.snapshot.pointerEvents !== "") node.style.pointerEvents = rec.snapshot.pointerEvents;
				else node.style.removeProperty("pointer-events");
			}
			if (rec.type === "typewriter" && rec.snapshot.html !== void 0) {
				node.innerHTML = rec.snapshot.html;
				node.classList.remove("tw-writing");
			} else if (rec.type === "text-scramble" && rec.snapshot.text !== void 0) node.textContent = rec.snapshot.text;
			node.style.removeProperty("visibility");
		}
		_release(node, snapshot) {
			if (snapshot.pointerEvents !== "") node.style.pointerEvents = snapshot.pointerEvents;
			else node.style.removeProperty("pointer-events");
			if (snapshot.opacity !== "") node.style.opacity = snapshot.opacity;
			else node.style.removeProperty("opacity");
		}
		_scope(node) {
			return node.closest("fieldset, form, section, article, dialog, aside, header, footer, main, [data-animation-scope]") || document.body;
		}
		_inViewport(el) {
			const rect = el.getBoundingClientRect();
			return rect.bottom > 0 && rect.right > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.left < (window.innerWidth || document.documentElement.clientWidth) && rect.width > 0 && rect.height > 0;
		}
		_delay(node) {
			if (!node.hasAttribute("data-delay")) return this.globalDelay;
			const parsed = parseInt(node.getAttribute("data-delay") || "", 10);
			return Number.isFinite(parsed) ? parsed : this.globalDelay;
		}
		/**
		* Resolves a behaviour's options: definition defaults first, then the config
		* block for this behaviour (keyed by `optionKey`, else by `type`).
		*/
		_optionsOf(behaviour) {
			const key = behaviour.optionKey ?? behaviour.type;
			const provided = this.config[key];
			return {
				...behaviour.defaults ?? {},
				...provided ?? {}
			};
		}
		_dispatch(node, eventName, detail) {
			const event = new CustomEvent(eventName, {
				bubbles: true,
				composed: true,
				detail: {
					origin: node,
					...detail
				}
			});
			node.dispatchEvent(event);
		}
		_observeMutations() {
			this.mutationObserver = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					mutation.removedNodes.forEach((node) => {
						if (!(node instanceof HTMLElement)) return;
						if (this.records.has(node)) this.unmount(node);
						node.querySelectorAll("[animation]").forEach((child) => {
							this.unmount(child);
						});
					});
					mutation.addedNodes.forEach((node) => {
						if (!(node instanceof HTMLElement)) return;
						this._queueScan(node);
					});
				});
			});
			this.mutationObserver.observe(document.body, {
				childList: true,
				subtree: true
			});
		}
		/**
		* Batches added nodes into one scan.
		*
		* The previous implementation scheduled two animation frames *per node*, so a
		* single page swap queued hundreds of callbacks. Collecting the roots first
		* keeps the cost proportional to the number of mutations, not nodes.
		*/
		_queueScan(root) {
			_classPrivateFieldGet2(_pendingScan$1, this).add(root);
			if (_classPrivateFieldGet2(_scanFrame$1, this) !== null) return;
			_classPrivateFieldSet2(_scanFrame$1, this, requestAnimationFrame(() => {
				_classPrivateFieldSet2(_scanFrame$1, this, requestAnimationFrame(() => {
					_classPrivateFieldSet2(_scanFrame$1, this, null);
					const roots = [..._classPrivateFieldGet2(_pendingScan$1, this)];
					_classPrivateFieldGet2(_pendingScan$1, this).clear();
					roots.forEach((node) => {
						if (node.isConnected) this.scan(node);
					});
				}));
			}));
		}
	};
	_defineProperty(AnimationsService$1, "slot", "animation");
	// packages/modules/animations/index.ts
	var animations_exports = /* @__PURE__ */ __exportAll({ AnimationsService: () => AnimationsService$1 });
	// packages/utilities/dist/DomUtils.js
	function createImageError$1() {
		return `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <rect width="512" height="512" fill="lightgray" />
      <text
        x="50%"
        y="50%"
        font-family="sans-serif"
        font-size="3rem"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        Image Error
      </text>
    </svg>
  `)}`;
	}
	// packages/components/article/Article.ts
	/**
	* The DOM only carries the record's key; the component keeps the record itself.
	* Attaching objects to elements (`el._payload`) works until the node is cloned or
	* replaced, and then the data is silently gone.
	*/
	function stampArticleId(el, payload) {
		const id = payload?.slug ?? payload?.uid;
		if (id !== void 0 && id !== null) el.dataset.articleId = String(id);
	}
	var ArticleBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — a cover, a headline, a meta row and body lines, drawn with the
		* mandatory `@aio-ui/skeleton` primitive. `Article.css` decides whether the real box is a
		* list or a detail; both start with the same top-to-bottom rhythm.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [
					{
						shape: "bone",
						aspect: "16 / 9"
					},
					{
						shape: "line",
						width: "55%"
					},
					{
						shape: "row",
						gap: "0.5rem",
						children: [{
							shape: "circle",
							width: "1.5rem"
						}, {
							shape: "line",
							width: "30%"
						}]
					},
					{
						shape: "line",
						count: 3
					}
				]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "article");
			_defineProperty(this, "name", "article");
			_defineProperty(this, "stylesheet", "./Article.css");
			_defineProperty(this, "currentRawServerResponse", null);
			_defineProperty(this, "viewSpecs", []);
			_defineProperty(
				this,
				/** Simpan list view saat detail aktif, agar bisa dikembalikan via tombol back. */
				"listElement",
				null
			);
			_defineProperty(
				this,
				/** Records by id (`slug`/`uid`), so cards only carry a key. */
				"records",
				/* @__PURE__ */ new Map()
			);
			_defineProperty(this, "handleClick", (event) => {
				const container = event.currentTarget;
				const target = event.target;
				const card = target.closest("[data-article-id]");
				if (card) {
					const record = this.records.get(String(card.dataset.articleId));
					if (record) {
						this.showDetail(container, record);
						return;
					}
				}
				if (target.closest("[data-view=\"back\"], button.back")) {
					this.showList(container);
					return;
				}
				const pageBtn = target.closest(".pagination .item");
				if (pageBtn && pageBtn.dataset.url) this.config.emit?.("elementChanged", {
					builder: this.builderId,
					type: "@article>pagination",
					element: pageBtn,
					data: {
						endpoint: pageBtn.dataset.url,
						module: this
					}
				});
			});
			const defaultConfig = {
				themeId: "default",
				selectors: {
					"@container": {
						tagName: "section",
						className: "article"
					},
					"@article>list": {
						tagName: "div",
						className: "row"
					},
					"@article>pagination": {
						tagName: "div",
						className: "pagination"
					},
					"@article>figure": {
						tagName: "figure",
						className: "media"
					},
					"@article>header": {
						tagName: "header",
						className: "item"
					},
					"@article>header>title": {
						tagName: "h3",
						className: "title"
					},
					"@article>header>meta": {
						tagName: "div",
						className: "meta"
					},
					"@article>item": {
						tagName: "article",
						className: "item"
					},
					"@article>item>caption": {
						tagName: "p",
						className: "caption"
					},
					"@article>aside": {
						tagName: "aside",
						className: "aside"
					},
					"@article>aside>block": {
						tagName: "div",
						className: "block recommendations"
					},
					"@article>aside>title": {
						tagName: "button",
						className: "title"
					},
					"@article>aside>item": {
						tagName: "a",
						className: "item"
					},
					"@article>controls": {
						tagName: "div",
						className: "controls"
					},
					"@article>controls>back": {
						tagName: "button",
						className: "back"
					},
					"@article>controls>next": {
						tagName: "button",
						className: "next"
					},
					"@article>controls>pagination": {
						tagName: "div",
						className: "pagination"
					},
					"@article>controls>pagination>item": {
						tagName: "button",
						className: "item"
					},
					"@article>controls>filter": {
						tagName: "h2",
						className: "filter"
					},
					"@article>controls>view": {
						tagName: "button",
						className: "view"
					},
					"@article>detail": {
						tagName: "article",
						className: "detail"
					},
					"@article>detail>header": {
						tagName: "header",
						className: "header"
					},
					"@article>detail>body": {
						tagName: "div",
						className: "body"
					}
				},
				namespace: null,
				views: [],
				initialSlug: "",
				initialView: "list",
				view: "card",
				position: "right",
				recommendation: 5,
				items: 5,
				navigate: () => {},
				emit: () => {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
			const declaredViews = this.config.views ?? [];
			this.viewSpecs = declaredViews.length ? declaredViews : [
				{ view: "controls" },
				{
					view: "list",
					display: "card"
				},
				{
					view: "aside",
					count: this.config.items ?? 5
				}
			];
		}
		/**
		* 👑 COMPOSITION — membangun kontainer modul dan seluruh slot:
		* controls (back + pagination) → list grid (item[]) → aside (rekomendasi).
		* Interaksi terpasang via bindInteractions().
		*/
		prepare(content, _config) {
			this.currentRawServerResponse = content ?? {};
			this.listElement = null;
			this.records.clear();
			const container = this.render("@container", this.currentRawServerResponse);
			const records = Array.isArray(this.currentRawServerResponse?.data) ? this.currentRawServerResponse.data : [];
			records.forEach((article, index) => {
				const id = String(article?.slug ?? article?.uid ?? index);
				this.records.set(id, article);
			});
			const viewFor = (role) => this.viewSpecs.length === 0 || this.viewSpecs.some((s) => s.view === role);
			if (viewFor("controls")) {
				const controls = this.render("@article>controls", this.currentRawServerResponse);
				if (controls) {
					controls.dataset.view = "controls";
					const back = this.render("@article>controls>back", { label: "Kembali" });
					if (back) {
						back.dataset.view = "back";
						controls.appendChild(back);
					}
					const pagination = this.render("@article>controls>pagination", this.currentRawServerResponse);
					if (pagination) {
						pagination.dataset.view = "pagination";
						controls.appendChild(pagination);
					}
					container.appendChild(controls);
				}
			}
			if (viewFor("list")) {
				const grid = this.render("@article>list", this.currentRawServerResponse);
				if (grid) {
					grid.dataset.view = "list";
					grid.dataset.display = this.config.view || "card";
					records.forEach((article) => {
						const item = this.render("@article>item", article);
						if (!item) return;
						grid.appendChild(item);
					});
					container.appendChild(grid);
				}
			}
			if (this.config.recommendation && Array.isArray(this.currentRawServerResponse?.data)) {
				const aside = this.render("@article>aside", this.currentRawServerResponse);
				if (aside) {
					aside.dataset.view = "aside";
					container.appendChild(aside);
				}
			}
			if (this.config.initialView === "detail" && this.config.initialSlug) {
				const record = this.records.get(String(this.config.initialSlug));
				if (record) this.showDetail(container, record, { navigate: false });
			}
			return container;
		}
		/** Tampilkan view detail untuk satu artikel (menggantikan list atau detail aktif). */
		/**
		* Show the detail view for one record.
		*
		* @param container - The composition root that hosts the views.
		* @param article - Record to show.
		* @param options - `navigate: false` when the host already knows this record (first
		*   paint of a deep link): announcing a navigation there would send the host back to
		*   the URL it just rendered from.
		*/
		showDetail(container, article = null, options = {}) {
			if (!article) return;
			const announce = options.navigate !== false;
			const currentDetail = container.querySelector("article.detail");
			if (!currentDetail) {
				const grid = container.querySelector("[data-view=\"list\"]");
				if (!grid) return;
				this.listElement = grid;
			}
			const detail = this.render("@article>detail", article);
			if (!detail) return;
			detail.dataset.view = "detail";
			if (article.slug && announce) {
				if (typeof this.config.navigate === "function") this.config.navigate(article.slug);
				this.config.emit?.("elementChanged", {
					builder: this.builderId,
					type: "@article>detail",
					element: detail,
					data: {
						slug: article.slug,
						article
					}
				});
			}
			if (currentDetail) currentDetail.replaceWith(detail);
			else this.listElement.replaceWith(detail);
		}
		/** Kembalikan ke list view. */
		showList(container) {
			if (!this.listElement) return;
			const detail = container.querySelector("article.detail");
			if (detail) detail.replaceWith(this.listElement);
			if (typeof this.config.navigate === "function") this.config.navigate("");
			this.config.emit?.("elementChanged", {
				builder: this.builderId,
				type: "@article>list",
				element: this.listElement,
				data: { back: true }
			});
			this.listElement = null;
		}
		template(typeKey, el, payload, _props) {
			switch (typeKey) {
				case "@container": break;
				case "@article>figure":
					const image = document.createElement("img");
					image.src = encodeURI(payload);
					image.onerror = (_e) => {
						image.src = createImageError$1();
					};
					el.appendChild(image);
					break;
				case "@article>header":
					const titleX = this.render("@article>header>title", payload.title);
					if (titleX) el.appendChild(titleX);
					const metaX = this.render("@article>header>meta", {
						author: payload.author,
						date: payload.date
					});
					if (metaX) el.appendChild(metaX);
					break;
				case "@article>header>title":
					el.textContent = payload || "Untitled Article";
					break;
				case "@article>header>meta": {
					const author = payload.author;
					const date = payload.date || "Baru saja";
					if (author) {
						const authorEl = document.createElement("span");
						authorEl.className = "author";
						authorEl.append("Oleh: ");
						const strong = document.createElement("strong");
						strong.textContent = String(author);
						authorEl.appendChild(strong);
						el.appendChild(authorEl);
						const divider = document.createElement("span");
						divider.className = "divider";
						divider.textContent = "•";
						el.appendChild(divider);
					}
					const dateEl = document.createElement("span");
					dateEl.className = "date";
					dateEl.textContent = String(date);
					el.appendChild(dateEl);
					break;
				}
				case "@article>controls": break;
				case "@article>controls>back":
					const iconBack = document.createElement("i");
					iconBack.className = "icon arrow left";
					el.textContent = payload?.backLabel || payload?.label || "back";
					el.prepend(iconBack);
					break;
				case "@article>controls>next":
					const iconNext = document.createElement("i");
					iconNext.className = "icon arrow left";
					el.textContent = payload?.label || "next";
					el.append(iconNext);
					break;
				case "@article>controls>view":
					const iconDisplay = document.createElement("i");
					iconDisplay.className = "icon display list";
					el.title = payload?.label || "display list";
					el.append(iconDisplay);
					break;
				case "@article>controls>pagination":
					const links = payload?.meta?.links || payload?.links;
					if (!links) break;
					for (const [role, href] of Object.entries(links)) {
						if (!href) continue;
						const item = this.render("@article>controls>pagination>item", {
							role,
							href
						});
						if (item) el.appendChild(item);
					}
					break;
				case "@article>controls>pagination>item":
					el.textContent = String((payload?.role || "").toUpperCase());
					if (payload?.href) {
						el.dataset.role = payload.role;
						el.dataset.url = payload.href;
						el._hateoasServerUrl = payload.href;
					}
					if (payload?.active) el.classList.add("active-page");
					break;
				case "@article>controls>filter":
					el.textContent = payload?.filter || "";
					break;
				case "@article>item": {
					stampArticleId(el, payload);
					if (payload.thumbnail) {
						const thumb = this.render("@article>figure", payload.thumbnail);
						thumb.className = "thumbnail";
						if (thumb) el.appendChild(thumb);
					}
					const headerX = this.render("@article>header", {
						title: payload.title,
						author: payload.author,
						date: payload.date
					});
					if (headerX) el.appendChild(headerX);
					const caption = this.render("@article>item>caption", payload.summary);
					if (caption) el.appendChild(caption);
					break;
				}
				case "@article>item>caption":
					el.textContent = payload || "";
					break;
				case "@article>aside":
					if (this.config.recommendation && Array.isArray(payload?.data)) {
						el.setAttribute("position", this.config.position || "right");
						const title = this.render("@article>aside>title", { title: "Rekomendasi" });
						if (title) el.appendChild(title);
						const block = this.render("@article>aside>block", payload);
						if (block) el.appendChild(block);
					}
					break;
				case "@article>aside>title":
					el.textContent = payload?.title || "Rekomendasi";
					break;
				case "@article>aside>block":
					payload.data.slice(0, this.config.items ?? 5).forEach((item) => {
						const node = this.render("@article>aside>item", item);
						if (node) el.appendChild(node);
					});
					break;
				case "@article>aside>item":
					stampArticleId(el, payload);
					const thumbnail = this.render("@article>figure", payload.thumbnail);
					const h = this.render("@article>header", {
						title: payload.title,
						date: payload.date
					});
					el.append(thumbnail, h);
					break;
				case "@article>detail":
					const coverSource = payload.largeCover || payload.imageUrl || payload.thumbnail;
					if (coverSource) {
						const cover = this.render("@article>figure", coverSource);
						cover.className = "cover";
						if (cover) el.appendChild(cover);
					}
					const header = this.render("@article>header", payload);
					if (header) el.appendChild(header);
					const body = this.render("@article>detail>body", payload.body);
					if (body) el.appendChild(body);
					break;
				case "@article>detail>body": if (payload instanceof HTMLElement) el.appendChild(payload);
				else if (typeof payload === "string") el.textContent = payload;
			}
		}
		initialize(root, _payload, _context) {
			const container = root ?? this.load("@container");
			if (!container) return;
			container.removeEventListener("click", this.handleClick);
			container.addEventListener("click", this.handleClick);
		}
	};
	_defineProperty(ArticleBuilder, "contract", {
		schema: {
			t: "record",
			open: true,
			of: { data: {
				t: "list",
				of: {
					t: "record",
					open: true,
					of: {
						slug: {
							t: "string",
							req: true
						},
						title: { t: "string" },
						thumbnail: { t: "string" },
						date: { t: "string" },
						body: { t: "string" }
					}
				}
			} }
		},
		example: { data: [{
			slug: "article-1",
			title: "First article",
			body: "…"
		}] }
	});
	// packages/components/article/index.ts
	var article_exports = /* @__PURE__ */ __exportAll({ ArticleBuilder: () => ArticleBuilder });
	// packages/components/badge/Badge.kit.ts
	/**
	* Default shape per key. Themes and callers override this through `config.selectors`,
	* which is why the tests lock it: the contract is checkable without a DOM.
	*/
	var DEFAULT_SELECTORS$5 = {
		"@container": {
			tagName: "div",
			className: "badge-widget"
		},
		"@badge": {
			tagName: "div",
			className: "badge"
		},
		"@badge>item": {
			tagName: "div",
			className: "badge-item"
		},
		"@badge>item>label": {
			tagName: "span",
			className: "badge-label"
		},
		"@badge>item>desc": {
			tagName: "p",
			className: "badge-desc"
		}
	};
	// packages/components/badge/Badge.engine.ts
	/**
	* Normalises anything the caller might hand over into `iBadgeItem[]`.
	*
	*   - `[...]`                      bare array of records
	*   - `{ items: [...] }`           named collection
	*   - `{ label, description }`     a single record
	*   - `{}` / `null` / `undefined`  nothing
	*/
	function normalizePayload$2(data) {
		if (!data) return [];
		if (Array.isArray(data)) return data.filter(Boolean);
		if (typeof data === "object") {
			if (Array.isArray(data.items)) return data.items.filter(Boolean);
			if (data.label || data.description) return [data];
		}
		return [];
	}
	// packages/components/badge/Badge.ts
	var BadgeBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — three pill labels in a row, drawn with the mandatory
		* `@aio-ui/skeleton` primitive. A badge is inline, so the mockup is a row of short
		* bones rather than a full-width bar.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "row",
				gap: "0.5rem",
				children: [{
					shape: "bone",
					width: "5rem",
					height: "1.5rem",
					count: 3
				}]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "badge");
			_defineProperty(this, "name", "badge");
			_defineProperty(this, "stylesheet", "./Badge.css");
			_defineProperty(this, "config", void 0);
			const defaultConfig = {
				themeId: "default",
				namespace: null,
				emit: () => {},
				selectors: DEFAULT_SELECTORS$5,
				emphasis: false
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		/**
		* Build the tree. `render()` registers the node under its key, calls `template()`,
		* and returns the element. Append children explicitly — order is yours to decide, and
		* optional parts should simply not be appended instead of being appended empty.
		*/
		prepare(data) {
			const items = normalizePayload$2(data);
			const container = this.render("@container", { count: items.length });
			const root = this.render("@badge", { count: items.length });
			for (const item of items) {
				const node = this.render("@badge>item", item);
				if (!node) continue;
				if (item.label) {
					const label = this.render("@badge>item>label", item);
					if (label) node.appendChild(label);
				}
				if (item.description) {
					const desc = this.render("@badge>item>desc", item);
					if (desc) node.appendChild(desc);
				}
				root?.appendChild(node);
			}
			if (container && root) container.appendChild(root);
			return this.load("@container");
		}
		/**
		* Hydration valve. Text and attributes only — `textContent`, never `innerHTML`,
		* so content can never inject markup.
		*/
		template(typeKey, el, payload) {
			switch (typeKey) {
				case "@container":
					if (this.config.emphasis) el.classList.add("is-emphasis");
					break;
				case "@badge>item>label":
					el.textContent = payload?.label ?? "";
					break;
				case "@badge>item>desc": el.textContent = payload?.description ?? "";
			}
		}
		/**
		* Interaction wiring. Called once after the tree is attached; keep it idempotent
		* (stable listener refs + remove-before-add) so re-running it cannot stack handlers.
		* A purely visual component needs nothing here.
		*/
		initialize() {}
	};
	_defineProperty(BadgeBuilder, "contract", {
		schema: {
			t: "list",
			single: true,
			of: {
				t: "record",
				open: true,
				of: {
					label: { t: "string" },
					description: { t: "string" }
				}
			}
		},
		example: [{
			label: "New",
			description: "This week"
		}],
		legacy: [{
			from: "items",
			to: "",
			reason: "pre-0.3 wrapped the list in { items }"
		}]
	});
	// packages/components/badge/index.ts
	var badge_exports = /* @__PURE__ */ __exportAll({ BadgeBuilder: () => BadgeBuilder });
	// packages/base/src/BaseAdapters/ReactiveGraph.ts
	var ReactiveGraph = class {
		constructor() {
			_defineProperty(this, "activeEffect", null);
			_defineProperty(this, "pendingEffects", /* @__PURE__ */ new Set());
			_defineProperty(this, "flushScheduled", false);
			_defineProperty(
				this,
				/** target → prop → dep(effects that read it) */
				"graph",
				/* @__PURE__ */ new WeakMap()
			);
			_defineProperty(
				this,
				/** effect → deps it touched (for cleanup when body re-runs / unwatch) */
				"owned",
				/* @__PURE__ */ new WeakMap()
			);
		}
		getDep(target, prop) {
			let props = this.graph.get(target);
			if (!props) {
				props = /* @__PURE__ */ new Map();
				this.graph.set(target, props);
			}
			let dep = props.get(prop);
			if (!dep) {
				dep = { effects: /* @__PURE__ */ new Set() };
				props.set(prop, dep);
			}
			return dep;
		}
		/** Called from the proxy `get` handler while an effect is running. */
		track(target, prop) {
			if (!this.activeEffect || typeof prop === "symbol") return;
			const dep = this.getDep(target, prop);
			if (dep.effects.has(this.activeEffect)) return;
			dep.effects.add(this.activeEffect);
			let list = this.owned.get(this.activeEffect);
			if (!list) {
				list = /* @__PURE__ */ new Set();
				this.owned.set(this.activeEffect, list);
			}
			list.add(dep);
		}
		/** Called from the proxy `set`/`deleteProperty` handlers. */
		notify(target, prop) {
			const dep = this.graph.get(target)?.get(prop);
			if (!dep) return;
			for (const fn of Array.from(dep.effects)) this.schedule(fn);
		}
		schedule(effect) {
			this.pendingEffects.add(effect);
			if (this.flushScheduled) return;
			this.flushScheduled = true;
			queueMicrotask(() => {
				this.flushScheduled = false;
				const batch = Array.from(this.pendingEffects);
				this.pendingEffects.clear();
				for (const fn of batch) fn();
			});
		}
		releaseDeps(effect) {
			const list = this.owned.get(effect);
			if (!list) return;
			for (const dep of list) dep.effects.delete(effect);
			list.clear();
		}
		/**
		* Runs `fn` immediately, then re-runs it whenever any proxied state
		* it read during the last run mutates. Returns an unwatch function.
		*/
		watchEffect(fn) {
			let disposed = false;
			const run = () => {
				if (disposed) return;
				this.releaseDeps(run);
				this.activeEffect = run;
				try {
					fn();
				} finally {
					this.activeEffect = null;
				}
			};
			run();
			return () => {
				if (disposed) return;
				disposed = true;
				this.releaseDeps(run);
				this.pendingEffects.delete(run);
			};
		}
	};
	// packages/base/src/BaseAdapters/BuilderProxy.ts
	var IS_PROXY = Symbol("IS_PROXY");
	/**
	* Whether `value` is a proxy this module handed out.
	*
	* A builder that keeps writing to the raw object it passed to `makeReactive` bypasses
	* every `set` trap, so nothing is notified. The base asks this question before it wires a
	* model, which turns that silent half-binding into one console warning.
	*
	* @param value - Anything a builder returned from `model()`.
	* @returns True only for a live proxy.
	*/
	function isReactive(value) {
		return Boolean(value && typeof value === "object" && value[IS_PROXY] === true);
	}
	var BuilderProxy = class {
		constructor(proxyCache) {
			_defineProperty(
				this,
				/** Identity cache: raw payload object → its reactive proxy. */
				"proxyCache",
				void 0
			);
			_defineProperty(
				this,
				/** 🧲 Per-proxy reactive effect graph (owned, not module-global). */
				"reactive",
				new ReactiveGraph()
			);
			this.proxyCache = proxyCache;
		}
		makeReactive(key, payload, onUpdateCallback) {
			const self = this;
			function _isProxy(obj) {
				return Boolean(obj && typeof obj === "object" && obj[IS_PROXY] === true);
			}
			function _isPlainObjectOrArray(obj) {
				if (obj === null || typeof obj !== "object") return false;
				if (obj instanceof String || obj instanceof Number || obj instanceof Boolean) return false;
				if (Array.isArray(obj)) return true;
				const proto = Object.getPrototypeOf(obj);
				return proto === Object.prototype || proto === null;
			}
			if (payload == null || typeof payload !== "object") return payload;
			if (!_isPlainObjectOrArray(payload)) return payload;
			if (_isProxy(payload)) return payload;
			if (payload instanceof Node) return payload;
			if (this.proxyCache.has(payload)) return this.proxyCache.get(payload);
			const singleProxyObj = new Proxy(payload, {
				get: (target, prop, receiver) => {
					if (prop === IS_PROXY) return true;
					const value = Reflect.get(target, prop, receiver);
					if (typeof prop !== "symbol") this.reactive.track(target, prop);
					if (value !== null && _isPlainObjectOrArray(value) && !(value instanceof Node)) {
						if (self.proxyCache.has(value)) return self.proxyCache.get(value);
						return self.makeReactive(key, value, onUpdateCallback);
					}
					return value;
				},
				set: (target, prop, value, receiver) => {
					const isArray = Array.isArray(target);
					if (value !== null && typeof value === "object" && !_isProxy(value) && !(value instanceof Node)) value = self.makeReactive(key, value, onUpdateCallback);
					const isValueEqual = target[prop] === value;
					const success = Reflect.set(target, prop, value, receiver);
					if (success) {
						const isArrayLengthChange = isArray && prop === "length";
						const isArrayMutated = isArray && !isNaN(Number(prop));
						if (!isValueEqual || isArrayLengthChange || isArrayMutated) {
							this.reactive.notify(target, prop);
							if (typeof onUpdateCallback === "function") onUpdateCallback(target, prop, value);
						}
					}
					return success;
				},
				deleteProperty: (target, prop) => {
					const hasProp = prop in target;
					const success = Reflect.deleteProperty(target, prop);
					if (success && hasProp) {
						this.reactive.notify(target, prop);
						if (typeof onUpdateCallback === "function") onUpdateCallback(target, prop, void 0);
					}
					return success;
				}
			});
			this.proxyCache.set(payload, singleProxyObj);
			return singleProxyObj;
		}
		getByPath(obj, path) {
			return path.split(".").reduce((acc, key) => acc?.[key], obj);
		}
		setByPath(obj, path, value) {
			const segments = path.split(".");
			const last = segments.pop();
			if (!last) return;
			const target = segments.reduce((acc, key) => {
				if (acc[key] == null || typeof acc[key] !== "object") acc[key] = {};
				return acc[key];
			}, obj);
			target[last] = value;
		}
		readValue(el) {
			if (el instanceof HTMLInputElement && el.type === "checkbox") {
				const trueValue = el.dataset.trueValue ?? "true";
				const falseValue = el.dataset.falseValue ?? "false";
				if (el.value && el.value !== "on") return el.checked ? trueValue ?? el.value : falseValue ?? "";
				return el.checked;
			}
			if (el instanceof HTMLSelectElement) return el.value;
			return el.value;
		}
		writeValue(el, value) {
			if (el instanceof HTMLInputElement && el.type === "checkbox") {
				const trueValue = el.dataset.trueValue ?? "true";
				if (el.value && el.value !== "on") {
					el.checked = String(value ?? false) === String(trueValue);
					return;
				}
				el.checked = Boolean(value);
				return;
			}
			if (el instanceof HTMLSelectElement) {
				el.value = String(value ?? "");
				return;
			}
			el.value = value ?? "";
		}
		bind(root, source) {
			if (!(root instanceof HTMLElement)) return;
			root.querySelectorAll("[data-bind],[name]").forEach((el) => {
				const path = this.getBindingPath(el);
				if (!path) return;
				const existing = el.__builderBinding;
				if (existing) {
					existing.syncFromState = () => this.writeValue(el, this.getByPath(source, path));
					existing.syncToState = () => this.setByPath(source, path, this.readValue(el));
					return;
				}
				const syncFromState = () => this.writeValue(el, this.getByPath(source, path));
				const syncToState = () => this.setByPath(source, path, this.readValue(el));
				el.__builderBinding = {
					path,
					syncFromState,
					syncToState
				};
				el.addEventListener("input", syncToState);
				el.addEventListener("change", syncToState);
				syncFromState();
			});
		}
		sync(root, source) {
			if (!(root instanceof HTMLElement)) return;
			root.querySelectorAll("[data-bind],[name]").forEach((el) => {
				const path = this.getBindingPath(el);
				if (!path) return;
				this.writeValue(el, this.getByPath(source, path));
			});
		}
		/**
		* 🧲 Runs `fn` immediately and re-runs it whenever proxied state read
		* inside it mutates. Delegates to the owned ReactiveGraph.
		*/
		watchEffect(fn) {
			return this.reactive.watchEffect(fn);
		}
		/**
		* 🔄 STATE → UI AUTO-SYNC (reactive one-way binding)
		* Watches every `[data-bind]` control under `root` inside one effect:
		* writing to any proxied state path the controls point at re-writes
		* the control values automatically. Returns an unwatch function.
		*/
		bindReactive(root, source) {
			if (!(root instanceof HTMLElement)) return () => {};
			const controls = Array.from(root.querySelectorAll("[data-bind]"));
			return this.reactive.watchEffect(() => {
				for (const el of controls) {
					const path = this.getBindingPath(el);
					if (!path) continue;
					this.writeValue(el, this.getByPath(source, path));
				}
			});
		}
		getBindingPath(el) {
			const bindPath = el.dataset?.bind;
			if (bindPath) return bindPath;
			return el.name || null;
		}
	};
	// packages/base/src/BaseAdapters/Binding.ts
	var _proxy = /* @__PURE__ */ new WeakMap();
	var _scopes = /* @__PURE__ */ new WeakMap();
	var _model = /* @__PURE__ */ new WeakMap();
	var _paint$1 = /* @__PURE__ */ new WeakMap();
	var _stopEffect = /* @__PURE__ */ new WeakMap();
	var _Binding_brand = /* @__PURE__ */ new WeakSet();
	/**
	* The mirror wire between one builder's model and the controls inside its scopes.
	*
	* A builder never touches this class: `Builder` owns the instance and calls `wire()` at
	* the three points where a DOM scope starts living (the root from `create()`, the element
	* projected by `attach()`, the element mounted by `project()`). Everything below is the
	* consequence of that one call — and of `unwire()`, which is the only way out.
	*
	* One direction is delegated, the other is drawn:
	*
	* - **control → model** — one `input`/`change` pair per scope, captured at the scope root.
	*   A control created later inside that scope is served by the same pair, and a control
	*   removed with its scope is served by nobody: the `AbortController` belongs to the
	*   scope, not to the instance.
	* - **model → control** — one effect per instance that walks every wired scope. It is
	*   registered once and re-runs on a microtask, so attaching three keys to one builder
	*   still paints them from one state instead of three subscriptions.
	*
	* `data-bind` is the only binding attribute. `name` is form semantics and is deliberately
	* not consulted here, even though `BuilderProxy.getBindingPath` falls back to it.
	*/
	var Binding = class {
		constructor(proxy) {
			_classPrivateMethodInitSpec(this, _Binding_brand);
			_classPrivateFieldInitSpec(this, _proxy, void 0);
			_classPrivateFieldInitSpec(this, _scopes, /* @__PURE__ */ new Map());
			_classPrivateFieldInitSpec(this, _model, null);
			_classPrivateFieldInitSpec(this, _paint$1, null);
			_classPrivateFieldInitSpec(this, _stopEffect, null);
			_classPrivateFieldSet2(_proxy, this, proxy);
		}
		/** Whether this instance is currently mirroring anything. */
		get active() {
			return _classPrivateFieldGet2(_scopes, this).size > 0;
		}
		/**
		* Starts mirroring one scope.
		*
		* Idempotent per scope: re-entering is a no-op, which is what makes `attach()` safe to
		* call repeatedly for the same key. Hydration runs first (model → control), so the first
		* paint already agrees with the model.
		*
		* @param scope - the element whose subtree holds the `[data-bind]` controls.
		* @param model - the builder's plain model; wrapped once, then shared by every scope.
		* @param paint - optional drawer for everything that is not a control value.
		*/
		wire(scope, model, paint) {
			if (!model || !(scope instanceof HTMLElement)) return;
			if (_classPrivateFieldGet2(_scopes, this).has(scope)) return;
			_classPrivateFieldGet2(_model, this) ?? _classPrivateFieldSet2(_model, this, _classPrivateFieldGet2(_proxy, this).makeReactive("model", model));
			_classPrivateFieldGet2(_paint$1, this) ?? _classPrivateFieldSet2(_paint$1, this, paint ?? null);
			const state = _classPrivateFieldGet2(_model, this);
			const controls = _assertClassBrand(_Binding_brand, this, _scan).call(this, scope);
			for (const control of controls) _classPrivateFieldGet2(_proxy, this).writeValue(control.element, _classPrivateFieldGet2(_proxy, this).getByPath(state, control.path));
			const abort = new AbortController();
			const onEvent = (event) => {
				const element = event.target?.closest?.("[data-bind]");
				if (!element || !scope.contains(element)) return;
				const path = element.dataset.bind;
				if (!path) return;
				_classPrivateFieldGet2(_proxy, this).setByPath(state, path, _classPrivateFieldGet2(_proxy, this).readValue(element));
			};
			scope.addEventListener("input", onEvent, { signal: abort.signal });
			scope.addEventListener("change", onEvent, { signal: abort.signal });
			_classPrivateFieldGet2(_scopes, this).set(scope, {
				controls,
				abort
			});
			_classPrivateFieldGet2(_stopEffect, this) ?? _classPrivateFieldSet2(_stopEffect, this, _classPrivateFieldGet2(_proxy, this).watchEffect(() => _assertClassBrand(_Binding_brand, this, _flush).call(this)));
		}
		/**
		* Stops mirroring one scope: its listeners die with the scope, and the effect dies with
		* the last scope. Detaching a key therefore leaves the builder with exactly the wiring
		* that is still on screen.
		*/
		unwire(scope) {
			const entry = _classPrivateFieldGet2(_scopes, this).get(scope);
			if (!entry) return;
			entry.abort.abort();
			_classPrivateFieldGet2(_scopes, this).delete(scope);
			if (!_classPrivateFieldGet2(_scopes, this).size) {
				_classPrivateFieldGet2(_stopEffect, this)?.call(this);
				_classPrivateFieldSet2(_stopEffect, this, null);
			}
		}
		/** Releases everything — called from `destroy()`, never from a builder. */
		dispose() {
			for (const scope of Array.from(_classPrivateFieldGet2(_scopes, this).keys())) this.unwire(scope);
			_classPrivateFieldGet2(_stopEffect, this)?.call(this);
			_classPrivateFieldSet2(_stopEffect, this, null);
			_classPrivateFieldSet2(_model, this, null);
			_classPrivateFieldSet2(_paint$1, this, null);
		}
		/**
		* Re-reads the controls of an already wired scope.
		*
		* Needed when a key is re-rendered inside a scope that stays mounted: the old elements
		* are gone, so the registry has to be rebuilt from the subtree that is there now.
		*/
		rescan(scope) {
			const entry = _classPrivateFieldGet2(_scopes, this).get(scope);
			if (!entry || !_classPrivateFieldGet2(_model, this)) return;
			entry.controls = _assertClassBrand(_Binding_brand, this, _scan).call(this, scope);
			for (const control of entry.controls) _classPrivateFieldGet2(_proxy, this).writeValue(control.element, _classPrivateFieldGet2(_proxy, this).getByPath(_classPrivateFieldGet2(_model, this), control.path));
		}
	};
	/** model → control, then model → everything the builder wants to draw. */
	function _flush() {
		const model = _classPrivateFieldGet2(_model, this);
		if (!model) return;
		for (const [scope, entry] of _classPrivateFieldGet2(_scopes, this)) {
			for (const control of entry.controls) {
				if (control.element === document.activeElement) continue;
				_classPrivateFieldGet2(_proxy, this).writeValue(control.element, _classPrivateFieldGet2(_proxy, this).getByPath(model, control.path));
			}
			_classPrivateFieldGet2(_paint$1, this)?.call(this, scope, model);
		}
	}
	function _scan(scope) {
		const found = [];
		for (const element of Array.from(scope.querySelectorAll("[data-bind]"))) {
			const path = element.dataset.bind;
			if (path) found.push({
				element,
				path
			});
		}
		return found;
	}
	// packages/base/src/BaseAdapters/ContentContract.ts
	var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
	/** The word a developer sees in `received` — `array`, `null`, `string`, … */
	var typeName = (value) => {
		if (value === null) return "null";
		if (Array.isArray(value)) return "array";
		return typeof value;
	};
	/** `content` or `content.title` or `content[2].title` */
	var childPath = (path, key) => typeof key === "number" ? `${path}[${key}]` : path ? `${path}.${key}` : key;
	var issue = (code, path, expected, received, message, severity = "error", allowed) => ({
		code,
		path,
		expected,
		received: typeName(received),
		allowed,
		message,
		severity
	});
	/**
	* Applies the contract's legacy spellings, once.
	*
	* `from` is a top-level key; `to` is the top-level field that replaces it (`""` means the
	* legacy value *is* the payload). A payload that already carries the new field wins, so the
	* pass cannot overwrite good input.
	*/
	function applyLegacy(contract, content, issues) {
		if (!contract.legacy?.length || !isRecord(content)) return content;
		let result = null;
		const mutable = () => result ?? (result = { ...content });
		for (const entry of contract.legacy) {
			if (!Object.prototype.hasOwnProperty.call(content, entry.from)) continue;
			const target = mutable();
			const value = target[entry.from];
			delete target[entry.from];
			if (entry.to === "") {
				issues.push(issue("INPUT_LEGACY_USED", "content", "payload directly", value, `body shape "${entry.from}" is legacy — ${entry.reason}`, "warning"));
				return value;
			}
			if (target[entry.to] === void 0) target[entry.to] = value;
			issues.push(issue("INPUT_LEGACY_USED", childPath("content", entry.from), childPath("content", entry.to), value, `"${entry.from}" is legacy, read as "${entry.to}" — ${entry.reason}`, "warning"));
		}
		return result ?? content;
	}
	/**
	* Structural fit — does `value` *look like* this spec? Never throws, collects nothing.
	*
	* A union uses it to pick a branch before normalising, so this is deliberately a cheap
	* type test, not a full validation: a `record` that is missing a required field still
	* fits, and `check()` reports the missing field on the chosen branch.
	*/
	function fits(spec, value) {
		switch (spec.t) {
			case "any": return true;
			case "string": return typeof value === "string";
			case "number": return typeof value === "number" && Number.isFinite(value);
			case "boolean": return typeof value === "boolean";
			case "enum": return spec.of.includes(value);
			case "record": return isRecord(value);
			case "list": return Array.isArray(value) || spec.single === true && isRecord(value);
			case "element": return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
			case "union": return spec.of.some((branch) => fits(branch, value));
		}
	}
	/** Walks one spec against one value, collecting issues and returning the normalised value. */
	function check(spec, value, path, issues) {
		if (value === void 0) {
			if (spec.req) issues.push(issue("INPUT_MISSING_FIELD", path, describe(spec), value, `required field is missing`));
			return value;
		}
		switch (spec.t) {
			case "any": return value;
			case "element":
				if (typeof HTMLElement === "undefined" || !(value instanceof HTMLElement)) issues.push(issue("INPUT_WRONG_TYPE", path, "element", value, `expected a DOM element`));
				return value;
			case "union": {
				const branch = spec.of.find((candidate) => fits(candidate, value));
				if (!branch) {
					issues.push(issue("INPUT_SHAPE", path, describe(spec), value, `fits none of: ${describe(spec)}`));
					return value;
				}
				return check(branch, value, path, issues);
			}
			case "string":
				if (typeof value !== "string") issues.push(issue("INPUT_WRONG_TYPE", path, "string", value, `expected string`));
				return value;
			case "number":
				if (typeof value !== "number" || !Number.isFinite(value)) issues.push(issue("INPUT_WRONG_TYPE", path, "number", value, `expected number`));
				return value;
			case "boolean":
				if (typeof value !== "boolean") issues.push(issue("INPUT_WRONG_TYPE", path, "boolean", value, `expected boolean`));
				return value;
			case "enum":
				if (!spec.of.includes(value)) issues.push(issue("INPUT_BAD_ENUM", path, `one of ${spec.of.join(" | ")}`, value, `value is not in the allowed set`, "error", spec.of));
				return value;
			case "record": {
				if (!isRecord(value)) {
					issues.push(issue("INPUT_WRONG_TYPE", path, "object", value, `expected object`));
					return value;
				}
				const fields = spec.of ?? {};
				let result = null;
				for (const [key, fieldSpec] of Object.entries(fields)) {
					const next = check(fieldSpec, value[key], childPath(path, key), issues);
					if (next !== value[key]) (result ?? (result = { ...value }))[key] = next;
				}
				for (const key of Object.keys(value)) {
					if (key in fields) continue;
					if (spec.open) continue;
					issues.push(issue("INPUT_UNKNOWN_FIELD", childPath(path, key), "a declared field", value[key], `"${key}" is not declared by this contract`, "warning"));
				}
				return result ?? value;
			}
			case "list": {
				let list = value;
				if (!Array.isArray(list)) {
					if (spec.single && isRecord(list)) list = [list];
					else {
						issues.push(issue("INPUT_WRONG_TYPE", path, "array", value, `expected array`));
						return value;
					}
				}
				const items = list;
				if (spec.min !== void 0 && items.length < spec.min) issues.push(issue("INPUT_TOO_FEW", path, `at least ${spec.min} item(s)`, items, `${items.length} item(s) received`));
				if (spec.max !== void 0 && items.length > spec.max) issues.push(issue("INPUT_TOO_MANY", path, `at most ${spec.max} item(s)`, items, `${items.length} item(s) received`));
				if (!spec.of) return list;
				let changed = list !== value;
				const next = items.map((item, index) => {
					const resolved = check(spec.of, item, childPath(path, index), issues);
					if (resolved !== item) changed = true;
					return resolved;
				});
				return changed ? next : list;
			}
		}
	}
	/** One-line description of a spec, used in `expected`. */
	function describe(spec) {
		switch (spec.t) {
			case "record": return "object";
			case "list": return "array";
			case "enum": return `one of ${spec.of.join(" | ")}`;
			case "union": return spec.of.map(describe).join(" | ");
			case "element": return "element";
			case "any": return "any value";
			default: return spec.t;
		}
	}
	/**
	* Normalises `content` against a contract.
	*
	* A builder with no contract gets its payload back untouched and no issues — the door
	* stays open for a component that has not declared a shape yet.
	*/
	function normalize(contract, content) {
		if (!contract) return {
			content,
			issues: []
		};
		const issues = [];
		const resolved = applyLegacy(contract, content, issues);
		return {
			content: check(contract.schema, resolved, "content", issues),
			issues
		};
	}
	/** `normalize()` when only the verdict matters — what the per-component CI test calls. */
	function validate(contract, content) {
		return normalize(contract, content).issues;
	}
	// packages/base/src/BaseAdapters/Hydration.ts
	/**
	* Hydration hold — what a component shows while its own stylesheet is on its way.
	*
	* A component never imports its own CSS: the host declares the lazy loaders and
	* `Stylesheets` in `@aio-ui/core` resolves them (that module owns the file, the loader and
	* the `<style>` injection). This module owns the other half — the DOM writes that keep an
	* unstyled tree off the screen — and it lives in `base`, next to the builder it serves,
	* because it is a lifecycle detail of `create()`, not a framework kernel.
	*
	* Two shapes, one decision:
	*
	* - **mockup** — the builder implements `loading()` and returns a throwaway silhouette.
	*   It is prepended to the root and the real children are hidden one by one (direct
	*   children only, never a walk), so showing it costs one small build and no bookkeeping.
	*   That is the point: a per-element placeholder pass knows the exact shape of a
	*   component, but it also tracks every node and dominates the render budget.
	* - **shimmer** — no `loading()` implementation: the root is marked (`data-hydrating` +
	*   `--is-loading: 1`) and the animation module paints a generic skin over it.
	*
	* Both paths release from the same `ensureStylesheet()` promise, which never rejects, so a
	* builder no registry ever sees still heals itself — and the same root is revealed even
	* when the sheet never arrives.
	*/
	/** Whether the current runtime can be styled at all (SSR and some test hosts cannot). */
	function hasDom() {
		return typeof document !== "undefined" && typeof HTMLElement !== "undefined";
	}
	/**
	* Writes the "styled" markers on a root — the only release writer.
	*
	* @param root - The top element of a component tree.
	* @returns Nothing.
	*
	* @summary Three writes, no observers: `--is-loading: 0` (children inherit it),
	*   `data-hydrating` removed (every shimmer rule stops matching), `data-loaded="true"` —
	*   a permanent pointer, because `[data-loaded="true"] * { --is-loading: 0 !important }`
	*   forces any stale marker below it back to `0`.
	*/
	function releaseMarkers(root) {
		root.style.setProperty("--is-loading", "0");
		root.removeAttribute("data-hydrating");
		root.setAttribute("data-loaded", "true");
	}
	/**
	* Marks the root for the generic shimmer skin: no mockup, no DOM surgery.
	*
	* @param root - The element the builder is about to return.
	* @returns A no-op restore function, so both hold shapes share one release path.
	*/
	function markShimmerHold(root) {
		root.style.setProperty("--is-loading", "1");
		root.setAttribute("data-hydrating", "");
		root.removeAttribute("data-loaded");
		return () => void 0;
	}
	/**
	* Prepends a mockup and hides the real children it replaces.
	*
	* @param root - The element the builder is about to return.
	* @param mockup - What `loading()` produced.
	* @returns The restore function: drop the mockup, unhide the children, forget the markers.
	*
	* @summary The real children stay in the tree (a `DocumentFragment` parking lot would
	*   detach the builders nested inside them, and a teardown sweep walks the tree), so the
	*   hide is `display: none` on each *direct* child — a handful of writes, restored from
	*   the value each child had. `data-hydrating` is deliberately not set: the shimmer must
	*   not paint over a component that is already showing its own silhouette.
	*/
	function mountMockup(root, mockup) {
		const hidden = [];
		for (const child of Array.from(root.children)) {
			if (child === mockup) continue;
			const element = child;
			hidden.push({
				element,
				display: element.style.display
			});
			element.style.display = "none";
		}
		mockup.setAttribute("aria-hidden", "true");
		root.prepend(mockup);
		root.setAttribute("data-mockup", "");
		root.setAttribute("aria-busy", "true");
		root.style.setProperty("--is-loading", "1");
		root.removeAttribute("data-loaded");
		return () => {
			mockup.remove();
			root.removeAttribute("data-mockup");
			root.removeAttribute("aria-busy");
			for (const { element, display } of hidden) element.style.display = display;
		};
	}
	/**
	* Runs a builder's `loading()` without letting it break `create()`.
	*
	* @param factory - The builder's mockup factory, or `null` when it has none.
	* @returns A usable element, or `null` to fall back to the shimmer skin.
	*
	* @summary A mockup is decoration: a throw, or a subclass that forgot to return an
	*   element, must degrade to the generic skin rather than leave `create()` without a root.
	*/
	function buildMockup(factory) {
		if (typeof factory !== "function") return null;
		try {
			const mockup = factory();
			return mockup instanceof HTMLElement ? mockup : null;
		} catch (error) {
			console.warn("[hydration] loading() threw — falling back to the shimmer hold:", error);
			return null;
		}
	}
	/**
	* Reads the visibility floor a mockup asked for.
	*
	* @param mockup - The element `loading()` returned.
	* @returns Milliseconds the mockup must stay mounted, or `0` for "release when the sheet does".
	*
	* @summary The skeleton owns the config (`duration: number | "auto"`) and writes a number
	*   as `data-skeleton-duration`; `"auto"` writes nothing. Reading it off the element keeps
	*   `iMockupFactory` a plain thunk — a builder never has to know the hold exists.
	*/
	function mockupFloor(mockup) {
		const value = Number(mockup.getAttribute("data-skeleton-duration"));
		return Number.isFinite(value) && value > 0 ? value : 0;
	}
	/**
	* The anti-FOUC gate: keep a component root off the screen until its stylesheet is there.
	*
	* @param root - The root the builder is about to return (pre-mount, pre-paint).
	* @param specifier - The builder's declared `stylesheet` (`"./Table.css"`).
	* @param mockup - Optional factory returning this component's own silhouette.
	* @returns Nothing. The reveal happens later, from the loader promise.
	*
	* @example
	* holdUntilStyled(root, "./Table.css");                    // shimmer skin
	* holdUntilStyled(root, "./Table.css", () => this.loading()); // component mockup
	*
	* @summary One function, one question, one release trigger — no gate object and no
	*   per-instance "already loaded" flag. The question is asked per *sheet*
	*   ({@link isStylesheetPending}) because two components built in one pass own two
	*   sheets, so a flag cannot answer "is *my* CSS here". Release rides
	*   {@link ensureStylesheet}, which never rejects: a builder no registry ever sees still
	*   heals itself.
	*
	*   A mockup may also ask for a minimum on-screen time (`duration` on its spec, surfaced as
	*   `data-skeleton-duration`). That is a **floor**, joined with the sheet promise via
	*   `Promise.all`: a fast sheet no longer flashes a skeleton for one frame, and a slow one
	*   is still waited for — the marker never lifts before the CSS is in.
	*/
	function holdUntilStyled(root, specifier, mockup) {
		if (!hasDom() || !(root instanceof HTMLElement)) return;
		if (!isStylesheetPending$1(specifier)) {
			releaseMarkers(root);
			return;
		}
		const skeleton = buildMockup(mockup);
		const restore = skeleton ? mountMockup(root, skeleton) : markShimmerHold(root);
		const floor = skeleton ? mockupFloor(skeleton) : 0;
		const minimum = floor > 0 ? new Promise((resolve) => {
			setTimeout(resolve, floor);
		}) : Promise.resolve();
		Promise.all([ensureStylesheet$1(specifier), minimum]).then(() => {
			restore();
			releaseMarkers(root);
		});
	}
	// packages/base/src/Base.ts
	var GLOBAL_INSTANCE_COUNTER = /* @__PURE__ */ new Map();
	var _caller = /* @__PURE__ */ new WeakMap();
	var _projected = /* @__PURE__ */ new WeakMap();
	var _issues = /* @__PURE__ */ new WeakMap();
	var _Builder_brand = /* @__PURE__ */ new WeakSet();
	var _staticHierarchy = /* @__PURE__ */ new WeakMap();
	var _missingModules = /* @__PURE__ */ new WeakMap();
	var _modules$1 = /* @__PURE__ */ new WeakMap();
	var _bindings = /* @__PURE__ */ new WeakMap();
	var Builder = class Builder {
		static resetCounters() {
			GLOBAL_INSTANCE_COUNTER.clear();
			_namespaceStack._ = _assertClassBrand(Builder, this, []);
		}
		/**
		* @description
		* Resolves the component's stable runtime identity by generating a deterministic seed,
		* combining it with the current namespace context, and building a selector hierarchy tree.
		* This method also manages a static namespace stack for nested builders and supports
		* explicit overrides when a caller needs to pin a namespace manually.
		*
		* @param content - The source payload used to derive the namespace seed.
		* @param config - Optional builder configuration that can contribute selectors or namespace metadata.
		* @param options - Optional overrides for namespace stack behavior, explicit namespace assignment,
		*   or custom seed generation input.
		*
		* @returns An object containing the resolved namespace, selector hierarchy, seed, and whether
		*   the namespace was pushed to the internal stack during resolution.
		*
		* @protected
		*/
		ensureIdentity(content, config, options) {
			const seed = buildNamespace$1(content, options?.seedConfig ?? config);
			const explicitNamespace = options?.explicitNamespace ?? config?.namespace ? String(config.namespace).trim() : "";
			const parentNamespace = _namespaceStack._[_namespaceStack._.length - 1] || null;
			const baseNamespace = explicitNamespace || (parentNamespace ? `${parentNamespace}:${String(this.builderId)}:${seed}` : `${String(this.builderId)}:${seed}`);
			this.instanceNamespace = baseNamespace;
			let pushed = false;
			if (options?.pushNamespace) {
				_namespaceStack._.push(baseNamespace);
				pushed = true;
			}
			const hierarchy = selectorToTree$1(baseNamespace, config?.selectors);
			if (options?.popNamespace && pushed) _namespaceStack._.pop();
			return {
				namespace: baseNamespace,
				hierarchy,
				seed,
				pushed
			};
		}
		constructor() {
			_classPrivateMethodInitSpec(this, _Builder_brand);
			_classPrivateFieldInitSpec(this, _caller, _active$3._);
			_classPrivateFieldInitSpec(this, _projected, /* @__PURE__ */ new Map());
			_defineProperty(
				this,
				/** 🧩 ROOT of the builder that hosts my projections — the shared ancestor
				*  token vars are painted on; null when I have no caller (standalone). Set
				*  in `attach()` the first time I project into a caller. */
				"rootElement",
				null
			);
			_classPrivateFieldInitSpec(this, _issues, []);
			_defineProperty(
				this,
				/**
				* The frozen state configuration container holding consolidated options, emitters, and structural selectors.
				*/
				"config",
				void 0
			);
			_defineProperty(this, "instanceNamespace", null);
			_defineProperty(
				this,
				/**
				* Internal reference holder pointing directly to the raw, unmutated data node extracted from the spreadsheet database.
				*/
				"activeLiveThemeId",
				"default"
			);
			_classPrivateFieldInitSpec(this, _staticHierarchy, {});
			_defineProperty(
				this,
				/**
				* 👑 LAZY HIERARCHY ENGINE
				* Mengisolasi pengerjaan rekonsiliasi silsilah agar tidak membebani loop render()
				*/
				"hierarchy",
				{
					get: () => {
						return _classPrivateFieldGet2(_staticHierarchy, this);
					},
					/**
					* 📝 STORE (registration-time, called by render()) — cheap: only ensures a
					* relations entry exists for the key (reusing the static selectorToTree
					* entry when present) and returns it. NO DOM reading here — template()
					* hasn't run yet, so the subtree would be invalid. render() stores the
					* returned object as the node record's `relations`, so the record and
					* hierarchy.get() share one object that update() later fills.
					*/
					store: (key) => {
						const existing = _classPrivateFieldGet2(_staticHierarchy, this)[key];
						if (existing) return existing;
						const fresh = {
							scope: this.instanceNamespace || "",
							key,
							template: key,
							parent: null,
							children: []
						};
						_classPrivateFieldGet2(_staticHierarchy, this)[key] = fresh;
						return fresh;
					},
					/**
					* ⚡ DIRECT-LAYER ELEMENT INVENTORY (same spirit as DOMRenderer.attachMetadata)
					* Called from create(), AFTER prepare()/initialize() — template() may do
					* arbitrary DOM operations, so only now is each node's subtree final.
					*
					* For every key in storage.nodes, searches through its live element and
					* stores the SELECTOR STRING (`tag#id.classes`) of every element found
					* inside it into `relations.elements`.
					*
					* Two hard rules:
					* 1. `relations.children` (the static record keys from selectorToTree,
					*    mapped via ">") is NEVER touched — key relations stay intact.
					* 2. The walk STOPS at key boundaries: when it reaches an element owned
					*    by another registered key (e.g. @colorizer>mode living inside
					*    @colorizer>header), that element is recorded once in `elements`
					*    but is NOT descended into — it inventories itself under its own
					*    key, so nothing duplicates across layers.
					*
					* Same elementSelector format as DOMRenderer's attachMetadata.
					* Idempotent: `elements` is rebuilt (deduped) on every run, and
					* node.relations is kept pointed at the same object as the map.
					*/
					update: () => {
						const elementSelector = (el) => {
							return `${el.tagName ? el.tagName.toLowerCase() : "div"}${el.id ? `#${el.id}` : ""}${el.className && typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).filter(Boolean).join(".")}` : ""}`;
						};
						const anchors = /* @__PURE__ */ new Map();
						this.storage.nodes.forEach((node, key) => {
							const el = node.element;
							const anchor = el?.__outer ?? el;
							if (anchor instanceof HTMLElement) anchors.set(anchor, key);
						});
						this.storage.nodes.forEach((node, key) => {
							const el = node.element;
							if (!(el instanceof HTMLElement)) return;
							const relations = this.hierarchy.store(key);
							node.relations = relations;
							const found = /* @__PURE__ */ new Set();
							const walk = (current) => {
								for (const child of Array.from(current.children)) {
									found.add(elementSelector(child));
									const ownerKey = anchors.get(child);
									if (ownerKey === void 0 || ownerKey === key) walk(child);
								}
							};
							walk(el);
							relations.elements = Array.from(found);
						});
						return _classPrivateFieldGet2(_staticHierarchy, this);
					}
				}
			);
			_classPrivateFieldInitSpec(this, _missingModules, /* @__PURE__ */ new Set());
			_classPrivateFieldInitSpec(this, _modules$1, {});
			_defineProperty(
				this,
				/** 📦 NODE STORE — registri node milik instance ini: typeKey → record. */
				"storage",
				{
					nodes: /* @__PURE__ */ new Map(),
					proxy: /* @__PURE__ */ new WeakMap()
				}
			);
			_defineProperty(this, "proxyRuntime", void 0);
			_classPrivateFieldInitSpec(this, _bindings, void 0);
			this.proxyRuntime = new BuilderProxy(this.storage.proxy);
			_classPrivateFieldSet2(_bindings, this, new Binding(this.proxyRuntime));
		}
		/**
		* @description
		* Merges the component's default configuration with runtime overrides into a single
		* immutable configuration object. Selector maps are merged deeply so structural rules
		* and HTML attributes from the user config can augment the defaults without replacing
		* them wholesale.
		*
		* @param defaultOptions - The default structural configuration for the builder, including
		*   core properties and selector definitions.
		* @param userConfig - Incoming runtime overrides provided by the caller, theme layer,
		*   or framework controller.
		*
		* @returns A strictly typed, fully populated configuration object ready for runtime ingestion.
		*
		* @template C - The concrete child configuration type that extends the builder's base config.
		* @protected
		*/
		resolveConfig(defaultOptions, userConfig = {}) {
			const mergedSelectors = { ...defaultOptions.selectors || {} };
			if (userConfig.selectors) Object.entries(userConfig.selectors).forEach(([key, selectorValue]) => {
				if (!selectorValue || typeof selectorValue !== "object") return;
				const override = selectorValue;
				mergedSelectors[key] = {
					...mergedSelectors[key] || {},
					...override,
					attrs: {
						...(mergedSelectors[key] || {}).attrs || {},
						...override.attrs || {}
					}
				};
			});
			return Object.freeze({
				...defaultOptions,
				...userConfig,
				selectors: mergedSelectors,
				slots: {
					...defaultOptions.slots || {},
					...userConfig.slots || {}
				}
			});
		}
		/**
		* 🧩 Declared slots of this builder: `typeKey → slotKey` (see resolveConfig).
		* A declared key is a RECEPTACLE: at the end of create() its element is
		* stamped with `data-slot="slotKey"` and published to the slot ledger, ready
		* for another builder's `attach()`.
		*/
		get slots() {
			return this.config?.slots ?? {};
		}
		/**
		* Receives the sub-modules the registry resolved for this component.
		*
		* Kept out of `config` on purpose: several components already own a
		* `config.modules` of their own, and `Required<iBuilderConfig>` would force
		* every default config to declare it.
		*
		* @param modules - Module id to resolved module.
		*/
		provideModules(modules) {
			_classPrivateFieldSet2(_modules$1, this, modules);
		}
		/**
		* Resolves a sub-module declared in this component's manifest `modules`.
		*
		* A missing module is a normal state (LITE edition): it warns once and returns
		* `undefined`, letting the caller decide how to degrade.
		*
		* @param id - Module id as declared in the manifest, e.g. `validation`.
		* @returns The resolved module, or `undefined` when it is not available.
		*/
		module(id) {
			const resolved = _classPrivateFieldGet2(_modules$1, this)[id];
			if (resolved !== void 0) return resolved;
			if (!_classPrivateFieldGet2(_missingModules, this).has(id)) {
				_classPrivateFieldGet2(_missingModules, this).add(id);
				console.warn(`[Builder:${String(this.builderId)}] module "${id}" is not available. Declare it in this component's manifest or install its package.`);
			}
		}
		setConfig(config) {
			this.config = this.resolveConfig(this.config, config);
		}
		errorHandler() {
			const id = this.builderId;
			console.warn(`⚠️ [Framework Degraded Mode]: TemplateRegistry is not present!
Global Slotting System and Cross-Builder Live Reactivity are disabled.
Falling back to standalone local memory buffer for builder: "${id}".`);
		}
		setProxy(key, payload, onUpdateCallback) {
			return this.proxyRuntime.makeReactive(key, payload, onUpdateCallback);
		}
		bindState(root, source) {
			this.proxyRuntime.bind(root, source);
		}
		/**
		* @description
		* Executes the full builder lifecycle from configuration resolution to DOM initialization.
		* The method resolves the effective configuration, derives a stable identity, clears prior
		* node state, renders the component tree, and calls the subclass initializer so interactive
		* bindings are attached only after the DOM has been materialized.
		*
		* @param schema - The schema door: `{ content, config }`. `content` is the payload the
		*   component renders, `config` the runtime overrides merged over the instance config.
		*
		* @returns The root DOM element produced by the builder's prepare/initialize pipeline.
		*
		* @public
		*/
		create(schema) {
			const input = schema ?? {};
			if (input.config) this.config = this.resolveConfig(this.config, input.config);
			const declared = this.constructor.contract;
			const normalized = normalize(declared, input.content ?? {});
			_classPrivateFieldSet2(_issues, this, normalized.issues);
			const content = normalized.content;
			const identity = this.ensureIdentity(content, this.config, {
				pushNamespace: true,
				popNamespace: true
			});
			_classPrivateFieldSet2(_staticHierarchy, this, identity.hierarchy);
			this.storage.nodes.clear();
			this.activeLiveThemeId = this.config?.themeId || document.body.dataset.theme?.replace(/^theme-/, "") || "default";
			const body = this.setProxy(identity.namespace, content);
			const previousActive = _active$3._;
			_active$3._ = this;
			try {
				const DOMTree = this.prepare(body, this.config);
				if (!DOMTree || !(DOMTree instanceof HTMLElement)) throw new Error(`[Builder:${String(this.builderId)}] prepare() returned no valid DOM element. Check selectors, template(), and the builder's render path.`);
				this.initialize(DOMTree, body);
				_assertClassBrand(_Builder_brand, this, _wire).call(this, DOMTree);
				this.hierarchy.update();
				const mockup = typeof this.loading === "function" ? () => this.loading(body, this.config) : null;
				holdUntilStyled(DOMTree, _assertClassBrand(_Builder_brand, this, _stylesheetSpecifier).call(this), mockup);
				return DOMTree;
			} finally {
				_active$3._ = previousActive;
			}
		}
		/**
		* @description
		* Creates and registers a DOM element for the requested selector token using the builder's
		* render pipeline. This method resolves the selector, applies base attributes, stores the
		* element in the local node registry, invokes the subclass template hook, and optionally wraps
		* the element in a structural wrapper chain defined by the selector configuration.
		*
		* The method is intentionally scoped around layout containers and repeating nodes. The actual
		* content injection is delegated to the subclass `template()` implementation so that each builder
		* can populate the container with its own internal structure.
		*
		* @param typeKey - The selector token that identifies the target node in the current builder.
		* @param payload - The runtime data payload associated with the node.
		* @param multiple - When true, the node is treated as a repeatable instance and can coexist
		*   with other records for the same selector token.
		*
		* @returns The created element, or undefined when the selector is not defined for the current builder.
		*
		* @protected
		*/
		render(typeKey, payload) {
			const templates = getTemplates$1();
			const registerTheme = (key, element, payload, selector) => {
				try {
					const registryLookupKey = key === "@container" ? `@${String(this.builderId)}:container` : key;
					const activeHandler = templates.resolve(this.config.themeId ?? "default", registryLookupKey, null);
					if (typeof activeHandler === "function") activeHandler(registryLookupKey, element, payload, selector);
				} catch (securityError) {
					console.warn(`[Builder Security Bypass] template evaluation skipped for key "${String(key)}":`, securityError);
				}
			};
			const selector = this.config.selectors?.[typeKey];
			if (!selector) throw new Error(`[Builder:${String(this.builderId)}] Unknown selector "${String(typeKey)}". Check the selector map or template key name.`);
			let el;
			const tagName = selector.tagName || "div";
			el = document.createElement(tagName);
			this._applyNodeAttributes(el, selector);
			if (selector.wrapper) {
				const wrapperChain = this._wrapElement(selector.wrapper, el);
				if (wrapperChain) {
					el.__outer = wrapperChain.__outer;
					el.__inner = el;
				}
			}
			const slotKey = this.slots[typeKey];
			if (slotKey) el.dataset.slot = slotKey;
			const data = {
				key: typeKey,
				element: el,
				payload,
				relations: this.hierarchy.store(typeKey)
			};
			this.storage.nodes.set(typeKey, data);
			this.template(typeKey, el, payload, selector);
			setMetadata$1(el, [data || {}], typeKey);
			registerTheme(typeKey, el, payload, selector);
			if (this.config?.emit !== void 0) this.config.emit?.("elementAdded", {
				builder: this.builderId,
				type: typeKey,
				element: el,
				data: payload
			});
			return el;
		}
		load(key) {
			return this.storage.nodes.get(key)?.element;
		}
		payload(key) {
			return this.storage.nodes.get(key) || null;
		}
		/**
		* 🧩 HOST — find the receptacle element stamped for `slotKey` inside this builder's root.
		*
		* @param slotKey - slot name declared in this builder's config.slots.
		* @returns receptacle element if found, or null.
		*/
		host(slotKey) {
			const rootKey = Object.keys(this.hierarchy.get())[0];
			return (rootKey ? this.load(rootKey) ?? null : null)?.querySelector(`[data-slot="${slotKey}"]`) ?? null;
		}
		/**
		* 🧩 PROJECT — explicit slot door.
		*
		* Mounts a child DOM node or builder into a named slot of this host builder.
		* Replaces the slot receptacle, carries over receptacle classes and non-style
		* attributes, and keeps track of the displaced receptacle for later `detach()`.
		*
		* @param slotKey - slot name declared in this builder's config.slots.
		* @param child - child element or child Builder to project into the slot.
		* @param payload - optional payload passed to child's initialize() if child is Builder.
		* @returns the projected HTMLElement, or null if receptacle was not found.
		*/
		project(slotKey, child, payload) {
			const receptacle = this.host(slotKey);
			if (!receptacle) {
				console.warn(`[Builder:${String(this.builderId)}] project() found no receptacle for slot "${slotKey}" in "${String(this.builderId)}" — declare it in config.slots.`);
				return null;
			}
			let element;
			let childBuilder = null;
			let childTypeKey = slotKey;
			if (child instanceof Builder) {
				childBuilder = child;
				if (!Object.keys(child.hierarchy.get()).length) {
					_classPrivateFieldSet2(_staticHierarchy, child, child.ensureIdentity(void 0, child.config, {
						pushNamespace: true,
						popNamespace: true
					}).hierarchy);
					child.storage.nodes.clear();
					child.activeLiveThemeId = child.config?.themeId || document.body.dataset.theme?.replace(/^theme-/, "") || "default";
				}
				childTypeKey = Object.keys(child.hierarchy.get())[0] ?? slotKey;
				const node = child.load(childTypeKey) ?? child.render(childTypeKey, payload);
				if (!node) return null;
				element = node.__outer ?? node;
				child.rootElement ?? (child.rootElement = this.load(Object.keys(this.hierarchy.get())[0]) ?? null);
			} else element = child;
			element.dataset.slot = slotKey;
			_classPrivateFieldGet2(_projected, this).set(childTypeKey, {
				slot: slotKey,
				element,
				receptacle
			});
			element.classList.add(...Array.from(receptacle.classList));
			for (const { name, value } of Array.from(receptacle.attributes)) {
				if (name === "style" || element.hasAttribute(name)) continue;
				element.setAttribute(name, value);
			}
			receptacle.replaceWith(element);
			if (childBuilder) {
				_classPrivateFieldGet2(_projected, childBuilder).set(childTypeKey, {
					slot: slotKey,
					element,
					receptacle
				});
				childBuilder.initialize(element, payload);
				_assertClassBrand(_Builder_brand, childBuilder, _wire).call(childBuilder, element);
			}
			return element;
		}
		/**
		* 🧩 ATTACH — project ONE of this builder's keys into a slot declared by the
		* caller's config (`slots`), and wire only that key.
		*
		* This is the default way a parent consumes a child:
		*
		*   const studio = new ColorThemeBuilder(config)
		*     .attach("@colorizer>configurator", "color-configurator")
		*     .attach("@colorizer>output", "color-output");
		*
		* No create(), so the rest of the child's tree is never built — only the keys
		* asked for. The key is rendered through the normal `render()` (so it lands in
		* the node store, `load(key)` keeps answering, and its own template() pulls in
		* the child keys that key is made of), then swapped in for the caller's
		* receptacle. The receptacle is found the cheap way: the caller's root key
		* anchors one `querySelector('[data-slot="…"]')` inside the caller's own tree.
		* Nothing is registered anywhere — `attach()` talks to `#caller`, the builder
		* that instantiated this one.
		*
		* Wiring is per-scope: initialize(node, payload) is what runs, so a builder
		* that wires by scope (see ColorTheme.initialize) binds exactly the attached
		* key — and attaching several keys to one instance keeps ONE state, ONE sync
		* effect and one binding per control (see `scopes()`).
		*
		* A builder without a caller (registry-built root / standalone page) keeps its
		* nodes in its own tree — that is the fallback, not an error.
		*
		* @param typeKey  key of this builder to project (a key of my selector map).
		* @param slotKey  slot declared by the caller's config.
		* @param payload  data this key's template() needs; omit it when the template
		*                 can derive what it needs from the builder's own state.
		* @returns the current builder for chaining.
		*/
		attach(typeKey, slotKey, payload) {
			if (!Object.keys(this.hierarchy.get()).length) {
				const identity = this.ensureIdentity(void 0, this.config, {
					pushNamespace: true,
					popNamespace: true
				});
				_classPrivateFieldSet2(_staticHierarchy, this, identity.hierarchy);
				this.storage.nodes.clear();
				this.activeLiveThemeId = this.config?.themeId || document.body.dataset.theme?.replace(/^theme-/, "") || "default";
			}
			const node = this.load(typeKey) ?? this.render(typeKey, payload);
			if (!node) return this;
			const caller = _classPrivateFieldGet2(_caller, this);
			if (!caller) return this;
			const receptacle = caller.host(slotKey);
			if (!receptacle) {
				console.warn(`[Builder:${String(this.builderId)}] attach("${String(typeKey)}") found no receptacle for slot "${slotKey}" in caller "${String(caller.builderId)}" — declare it in the caller's config.slots.`);
				return this;
			}
			const element = node.__outer ?? node;
			element.dataset.slot = slotKey;
			_classPrivateFieldGet2(_projected, this).set(typeKey, {
				slot: slotKey,
				element,
				receptacle
			});
			element.classList.add(...Array.from(receptacle.classList));
			for (const { name, value } of Array.from(receptacle.attributes)) {
				if (name === "style" || element.hasAttribute(name)) continue;
				element.setAttribute(name, value);
			}
			receptacle.replaceWith(element);
			const callerRootKey = Object.keys(caller.hierarchy.get())[0];
			this.rootElement ?? (this.rootElement = callerRootKey ? caller.load(callerRootKey) ?? null : null);
			this.initialize(element, payload);
			_assertClassBrand(_Builder_brand, this, _wire).call(this, element);
			return this;
		}
		/**
		* 🧷 DETACH — hand the caller its receptacle back and return the projected
		* node to its owner (still registered, ready to re-attach).
		*
		* @param slotKey  slot to release.
		* @returns current builder.
		*/
		detach(slotKey) {
			for (const [typeKey, entry] of _classPrivateFieldGet2(_projected, this)) {
				if (entry.slot !== slotKey) continue;
				if (entry.element.parentNode) entry.element.replaceWith(entry.receptacle);
				_classPrivateFieldGet2(_bindings, this).unwire(entry.element);
				_classPrivateFieldGet2(_projected, this).delete(typeKey);
			}
			return this;
		}
		/**
		* 🔌 WIRING SCOPES — every DOM location this instance paints: the builder
		* root first, then each node projected into my caller's slot.
		*
		* This is what makes initialize()/sync slot-aware: a builder is exactly as
		* multi-rooted as its projections, so initialize() runs once for the root and
		* loops `scopes()`, while the reactive sync loop repaints every scope — that
		* is how a projected panel stays wired and in sync with the owner's state.
		*/
		scopes() {
			const scopes = [];
			const ownRootKey = Object.keys(this.hierarchy.get())[0];
			const root = ownRootKey ? this.load(ownRootKey) : null;
			if (root) scopes.push(root);
			for (const { element } of _classPrivateFieldGet2(_projected, this).values()) {
				if (element === root || root?.contains(element)) continue;
				scopes.push(element);
			}
			return scopes;
		}
		/**
		* @description
		* Removes one or more registered nodes from the active builder instance in a single call.
		* The method detaches the underlying DOM elements from the page and clears the matching
		* records from the local node registry so the builder state stays consistent.
		*
		* @param typeKeys - One or more selector tokens whose live DOM nodes should be removed.
		*
		* @protected
		*/
		remove(...typeKeys) {
			typeKeys.forEach((key) => {
				const liveElement = this.load(key);
				if (liveElement) liveElement.remove();
				this.storage.nodes.delete(key);
			});
		}
		/**
		* @description
		* Cleans up the builder instance by notifying listeners, removing the root DOM element,
		* clearing the internal node registry, and releasing references held by the instance.
		* This method is the lifecycle termination point for a builder and should be invoked when
		* the component is unmounted or discarded.
		*
		* @param typeKey - Optional selector token used to target a specific root node for removal.
		*   When omitted, the builder attempts to remove the default container node.
		*
		* @public
		*/
		destroy(typeKey) {
			if (this.config?.emit) this.config.emit("elementRemoved", {
				builder: this.builderId,
				data: null
			});
			_classPrivateFieldGet2(_bindings, this).dispose();
			const rootElement = this.storage.nodes.get(typeKey || "@container")?.element;
			if (rootElement) {
				if (rootElement.parentNode) rootElement.parentNode.removeChild(rootElement);
				else rootElement.remove();
				console.log(`[Lifecycle Security] DOM Element Node for "${String(this.builderId)}" successfully unmounted.`);
			}
			this.storage.nodes.clear();
			for (const slotKey of new Set(Array.from(_classPrivateFieldGet2(_projected, this).values(), (entry) => entry.slot))) this.detach(slotKey);
			this.config = null;
			this.instanceNamespace = null;
		}
		/**
		* 🔎 INSPECT — what this instance built, as data instead of DOM.
		*
		* Designed for a caller that cannot look at a screen: a test, a generator or an agent.
		* It answers three questions in one synchronous call — *which keys exist*, *what markup
		* did they produce*, and *which elements does each key own* — without touching the
		* document, waiting for a stylesheet, or knowing this component's payload contract.
		*
		* Three properties are load-bearing, each pinned by a test next door:
		*
		* - **Deterministic.** The identity seed comes from the payload (`buildNamespace`, keys
		*   sorted), never from an instance counter, so the same payload yields the same markup.
		*   A snapshot diff is therefore a real diff.
		* - **Idempotent.** `hierarchy.elements` is rebuilt from the live tree, so reading twice
		*   returns the same data and re-walking changes nothing.
		* - **Hierarchy-first.** `records` on a builder root holds one item (its own); the page
		*   graph lives in `inspectPage()` on the renderer side. Reporting `keys`/`hierarchy`
		*   first keeps the useful half from being hidden behind the thin one.
		*
		* `html` is deliberately raw: attribute order and the anti-FOUC markers (`data-loaded`,
		* `--is-loading`) are left in. Normalising here would hide a regression from the caller.
		*
		* @returns Markup, keys, relations, namespace and the root records.
		*
		* @example
		* const builder = new SectionBuilder(config);
		* builder.create({ content: payload });
		* const { html, keys } = builder.inspect();
		*
		* @summary Lives in the class body on purpose: `Builder.prototype` is frozen at the
		*   bottom of this file, so this hook cannot be bolted on later.
		*/
		inspect() {
			const keys = Object.keys(this.hierarchy.get());
			const root = keys.length ? this.load(keys[0]) : null;
			return {
				html: root ? root.outerHTML : "",
				keys,
				hierarchy: this.hierarchy.get(),
				namespace: this.instanceNamespace,
				records: root?.getMetadata?.() ?? [],
				issues: [..._classPrivateFieldGet2(_issues, this)]
			};
		}
		/**
		* Recursively parses CSS selector chains (e.g., ".column>neon", "div.col-4>.card-wrapper")
		* into a nested DOM hierarchy.
		*/
		_wrapElement(wrapperStr, targetElement) {
			if (!wrapperStr || !targetElement) return null;
			const parts = wrapperStr.split(">").map((s) => s.trim()).filter(Boolean);
			if (parts.length === 0) return null;
			const parseNode = (segment) => {
				const parsedAttrs = {};
				const attrRegex = /\[\s*([a-zA-Z0-9_-]+)\s*=\s*['"]?([^'"]*)['"]?\s*\]/g;
				let match;
				while ((match = attrRegex.exec(segment)) !== null) {
					const attrName = match[1];
					parsedAttrs[attrName] = match[2];
				}
				const tokens = segment.replace(/\[[^\]]*\]/g, "").split(/(?=[.#])/);
				let tagName = "div";
				let id = "";
				const classList = [];
				if (tokens.length > 0 && !tokens[0].startsWith(".") && !tokens[0].startsWith("#")) tagName = tokens[0];
				tokens.forEach((token) => {
					if (!token) return;
					if (token.startsWith("#")) id = token.slice(1);
					else if (token.startsWith(".")) classList.push(token.slice(1));
				});
				const el = document.createElement(tagName);
				if (id) el.id = id;
				if (classList.length > 0) el.className = classList.join(" ");
				Object.entries(parsedAttrs).forEach(([aName, aValue]) => {
					el.setAttribute(aName, aValue);
				});
				return el;
			};
			const __outer = parseNode(parts[0]);
			let innerPointer = __outer;
			for (let i = 1; i < parts.length; i++) {
				const child = parseNode(parts[i]);
				innerPointer.appendChild(child);
				innerPointer = child;
			}
			innerPointer.appendChild(targetElement);
			return {
				__outer,
				__inner: targetElement
			};
		}
		/**
		* 🧱 THE ATTR AND METADATA WELDER (POS PENGURUS DATA ATRIBUT)
		* Melumat tuntas ID, ClassName, kustom attrs, hingga data- attributes bawaan database Sheets.
		* Pair-stamping delegated to Utility/AttributeUtils.
		*/
		_applyNodeAttributes(el, selector) {
			if (!selector) return;
			if (selector.id && selector.id !== "") el.id = selector.id;
			if (selector.className && selector.className !== "") el.className = selector.className;
			if (selector.textContent && selector.textContent !== "") el.textContent = selector.textContent;
			applyAttrDictionary$1(el, selector.attrs);
			applyAttributeList$1(el, selector.attributes);
		}
	};
	/**
	* ⚠️ STYLESHEET CONTRACT — STATIC, NOT INSTANCE:
	* The file path pointer target referencing the isolated CSS stylesheet asset assigned to this module.
	* Declare it on subclasses as a STATIC field — `static readonly stylesheet = "./MyComponent.css";`
	* ComponentRegistry.loadModule() reads it from the CLASS object (`BuilderClass.stylesheet`)
	* during lazy module resolution, BEFORE any instance exists. An instance-only class field is
	* invisible to the registry (class fields never land on the prototype), so the CSS would
	* never auto-load. (TS has no `abstract static`, hence documented convention instead.)
	*/
	/**
	* Stylesheet specifier declared by this builder, wherever it was put.
	*
	* @returns The specifier from the instance, else from the class (`static stylesheet`),
	*   else `""` — a builder without a sheet simply has none.
	*
	* @summary Subclasses disagree on where they declare it, and this is read on every
	* `create()`, so both places are checked instead of trusting one convention.
	*/
	function _stylesheetSpecifier() {
		const fromInstance = this.stylesheet;
		if (typeof fromInstance === "string" && fromInstance) return fromInstance;
		const fromClass = this.constructor.stylesheet;
		return typeof fromClass === "string" ? fromClass : "";
	}
	/**
	* 🔌 WIRE ONE SCOPE — the seam every `[data-bind]` control hangs off.
	*
	* A no-op unless the builder declares `model()`: the presence of that hook is the whole
	* opt-in, the same way `loading()` opts into its own mockup. Called right after
	* `initialize()` at the three places a scope starts living, so a builder wires its
	* commands first and the controls second.
	*
	* @param scope - root element, attached key, or mounted child element.
	*/
	function _wire(scope) {
		if (typeof this.model !== "function") return;
		const model = this.model();
		if (!model) return;
		if (!isReactive(model)) {
			console.warn(`[Builder:${String(this.builderId)}] model() returned a plain object. Create it once with this.setProxy(...) and return that proxy, or writes to it will never reach the mirror.`);
			return;
		}
		const paint = typeof this.paint === "function" ? this.paint.bind(this) : void 0;
		_classPrivateFieldGet2(_bindings, this).wire(scope, model, paint);
	}
	var _active$3 = { _: null };
	var _namespaceStack = { _: [] };
	_defineProperty(Builder, "contract", void 0);
	Object.freeze(Builder.prototype);
	setBuilderAdapter$1({ resetCounters: () => Builder.resetCounters() });
	// packages/base/src/index.ts
	var src_exports$6 = /* @__PURE__ */ __exportAll({
		Builder: () => Builder,
		GLOBAL_INSTANCE_COUNTER: () => GLOBAL_INSTANCE_COUNTER,
		normalize: () => normalize,
		validate: () => validate
	});
	// packages/components/carousel/Carousel.kit.ts
	var AttrsConfigMap = {
		"data-carousel": "carousel",
		"data-show-control": "showControl",
		"data-show-navigation": "showNavigation",
		"data-autoplay": "autoPlay",
		"data-vertical": "vertical",
		"data-slides-per-view": "slidesPerView",
		"data-animation": "animation",
		"data-loop": "loop",
		"data-slide-height": "slideHeight",
		"data-slide-width": "slideWidth",
		"data-pause-on-hover": "pauseOnHover"
	};
	// packages/components/carousel/Carousel.ts
	var CarouselBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — one media box and its dot row, drawn with the mandatory
		* `@aio-ui/skeleton` primitive. The slide count is a payload detail: a picture of the
		* widget only needs the frame and the navigation rhythm.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [{
					shape: "bone",
					aspect: "16 / 9"
				}, {
					shape: "row",
					gap: "0.4rem",
					children: [{
						shape: "circle",
						width: "0.5rem",
						count: 5
					}]
				}]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "carousel");
			_defineProperty(this, "name", "carousel");
			_defineProperty(this, "stylesheet", "./Carousel.css");
			_defineProperty(this, "currentIndex", 0);
			_defineProperty(this, "autoPlayTimer", void 0);
			_defineProperty(this, "rConfig", void 0);
			_defineProperty(this, "container", void 0);
			_defineProperty(this, "track", void 0);
			_defineProperty(this, "slides", []);
			_defineProperty(this, "dots", []);
			_defineProperty(this, "buttons", []);
			_defineProperty(this, "handleEnter", (event) => {
				const el = event.currentTarget;
				if (this.config.pauseOnHover && this.autoPlayTimer) {
					window.clearInterval(this.autoPlayTimer);
					this.autoPlayTimer = void 0;
				}
				el.classList.add("hovering");
			});
			_defineProperty(this, "handleLeave", (event) => {
				const el = event.currentTarget;
				if (this.config.pauseOnHover && this.rConfig.autoPlay) this.startAutoPlay();
				el.classList.remove("hovering");
			});
			_defineProperty(this, "next", () => this._navigateTo(this.currentIndex + 1));
			_defineProperty(this, "previous", () => this._navigateTo(this.currentIndex - 1));
			_defineProperty(this, "resetAutoPlay", () => {
				if (this.autoPlayTimer) {
					window.clearInterval(this.autoPlayTimer);
					this.startAutoPlay();
				}
			});
			const defaultConfig = {
				themeId: "default",
				container: "",
				showNavigation: true,
				showControl: "auto",
				autoPlay: 4e3,
				animation: "fade",
				slidesPerView: 1,
				vertical: false,
				loop: true,
				pauseOnHover: true,
				slideHeight: "",
				slideWidth: "",
				selectors: {
					"@container": {
						tagName: "div",
						className: "carousel-widget-wrapper"
					},
					"@carousel": {
						tagName: "div",
						className: "carousel"
					},
					"@carousel>control": {
						tagName: "div",
						className: "control-group"
					},
					"@carousel>control>prev": {
						tagName: "button",
						className: "control prev"
					},
					"@carousel>control>next": {
						tagName: "button",
						className: "control next"
					},
					"@carousel>navigations": {
						tagName: "div",
						className: "navigations"
					},
					"@carousel>navigations>dot": {
						tagName: "button",
						className: "dot"
					},
					"@carousel>track": {
						tagName: "div",
						className: "track"
					},
					"@carousel>track>slide": {
						tagName: "div",
						className: "slide"
					},
					"@carousel>track>slide>inner": {
						tagName: "div",
						className: "slide-inner"
					},
					"@carousel>track>slide>caption": {
						tagName: "div",
						className: "caption"
					},
					"@carousel>track>slide>title": {
						tagName: "h3",
						className: "title"
					},
					"@carousel>track>slide>desc": {
						tagName: "p",
						className: "desc"
					},
					"@carousel>track>slide>image": {
						tagName: "img",
						className: "img-fluid"
					}
				},
				namespace: null,
				emit: null
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		prepare(data, _config) {
			this.unmount();
			this.currentIndex = 0;
			this.slides = [];
			this.dots = [];
			this.buttons = [];
			if (data?.config) this.config = this.resolveConfig(this.config, data.config);
			const host = this.resolveContainer(this.config.container);
			const carousel = this.render("@carousel", data);
			if (host) {
				host.appendChild(carousel);
				this.container = host;
			} else this.container = carousel;
			return this.container;
		}
		/** Accept `"#id"`, `".class"`, an element, or nothing. Nothing means "I am the root". */
		resolveContainer(target) {
			if (!target) return null;
			if (target instanceof HTMLElement) return target;
			if (typeof target === "string") return document.querySelector(target);
			return null;
		}
		initialize(carousel) {
			if (!this.rConfig) this.rConfig = this.resolveRuntimeConfig(carousel, {}, this.slides.length);
			if (!this.track || this.slides.length === 0) return;
			if (this.rConfig.showControl && this.slides.length > 1) this.attachControls(carousel);
			if (this.rConfig.showNavigation && this.slides.length > 1) {
				const maxDotsLimit = this.rConfig.maxDots || this.slides.length;
				this.attachNavigation(carousel, this.slides.slice(0, maxDotsLimit));
			}
			if (this.rConfig.vertical) this.renderVerticalMode(carousel);
			else this.renderHorizontalMode(carousel);
			if (this.rConfig.autoPlay) this.startAutoPlay();
			carousel.removeEventListener("mouseenter", this.handleEnter);
			carousel.removeEventListener("mouseleave", this.handleLeave);
			if (this.config.pauseOnHover || this.config.showControl === "auto" || this.config.showNavigation === "auto") {
				carousel.addEventListener("mouseenter", this.handleEnter);
				carousel.addEventListener("mouseleave", this.handleLeave);
			}
		}
		template(typeKey, el, payload) {
			const isVert = this.config?.vertical;
			switch (typeKey) {
				case "@carousel":
					el.className = `carousel anim-${this.config.animation} ${el.className || ""}`.trim();
					el.setAttribute("role", "region");
					el.setAttribute("aria-roledescription", "carousel");
					if (this.config.showControl === "auto" || this.config.showNavigation === "auto") el.classList.add("auto-controls");
					const slideData = Array.isArray(payload) ? payload : void 0;
					if (this.slides.length === 0 && Array.isArray(slideData)) {
						this.rConfig = this.resolveRuntimeConfig(el, payload, slideData.length);
						const track = this.render("@carousel>track", slideData);
						this.track = track;
						if (track) el.appendChild(track);
					}
					break;
				case "@carousel>track":
					const items = Array.isArray(payload) ? payload : [];
					this.slides = items.map((item, index) => {
						const slide = this.render("@carousel>track>slide", {
							...item,
							index,
							total: items.length
						});
						if (slide) el.appendChild(slide);
						return slide;
					});
					break;
				case "@carousel>track>slide": {
					el.setAttribute("role", "group");
					el.setAttribute("aria-roledescription", "slide");
					if (typeof payload?.index === "number") {
						const total = payload.total ?? this.slides.length ?? "?";
						el.setAttribute("aria-label", `${payload.index + 1} / ${total}`);
					}
					const inner = this.render("@carousel>track>slide>inner", payload);
					if (inner) el.appendChild(inner);
					break;
				}
				case "@carousel>track>slide>inner":
					if (payload?.image || payload?.imageUrl) {
						const img = this.render("@carousel>track>slide>image", payload);
						if (img) el.appendChild(img);
					}
					if (payload?.title || payload?.description) {
						const caption = this.render("@carousel>track>slide>caption", payload);
						if (caption) el.appendChild(caption);
					}
					break;
				case "@carousel>track>slide>caption":
					if (payload?.title) {
						const title = this.render("@carousel>track>slide>title", payload);
						if (title) el.appendChild(title);
					}
					if (payload?.description) {
						const desc = this.render("@carousel>track>slide>desc", payload);
						if (desc) el.appendChild(desc);
					}
					break;
				case "@carousel>track>slide>image": {
					const img = el;
					img.src = encodeURI(payload?.image || payload?.imageUrl || "");
					img.alt = payload?.title || "carousel-slide-graphic";
					break;
				}
				case "@carousel>track>slide>title":
					el.textContent = payload?.title || "";
					break;
				case "@carousel>track>slide>desc":
					el.textContent = payload?.description || "";
					break;
				case "@carousel>control>prev":
					el.innerHTML = isVert ? "&#9650;" : "&#10094;";
					el.setAttribute("aria-label", "Previous slide");
					el.setAttribute("type", "button");
					if (typeof payload?.onSelect === "function") el.onclick = payload.onSelect;
					break;
				case "@carousel>control>next":
					el.innerHTML = isVert ? "&#9660;" : "&#10095;";
					el.setAttribute("aria-label", "Next slide");
					el.setAttribute("type", "button");
					if (typeof payload?.onSelect === "function") el.onclick = payload.onSelect;
					break;
				case "@carousel>navigations": {
					el.className = `navigations ${payload?.vertical ? "vertical-dots" : "horizontal-dots"}`;
					el.setAttribute("role", "group");
					el.setAttribute("aria-label", "Slide navigation");
					const count = payload?.count ?? 0;
					const onSelect = payload?.onSelect;
					for (let index = 0; index < count; index++) {
						const dot = this.render("@carousel>navigations>dot", {
							active: index === 0,
							index,
							onSelect: typeof onSelect === "function" ? () => onSelect(index) : void 0
						});
						this.dots.push(dot);
						el.appendChild(dot);
					}
					break;
				}
				case "@carousel>navigations>dot":
					el.className = "dot";
					el.setAttribute("type", "button");
					el.setAttribute("aria-label", `Go to slide ${(payload?.index ?? 0) + 1}`);
					if (payload?.active) {
						el.classList.add("active");
						el.setAttribute("aria-current", "true");
					}
					if (typeof payload?.onSelect === "function") el.onclick = payload.onSelect;
			}
		}
		/**
		* 👑 THE UNIVERSAL PROGRESSIVE BOOTSTRAPPER (THE FINAL HOLY GRAIL)
		* 100% Menggunakan logika cerdas Anda! Memanfaatkan render() resmi untuk meregistrasikan 
		* elemen manual secara legal, aman, dan kebal dari pembatasan Private Fields #nodes!
		*/
		run(el) {
			let targetCarousel = el;
			if (!targetCarousel) targetCarousel = document.querySelector(".carousel");
			if (!targetCarousel) {
				console.warn("🚨 [Carousel Bootstrapper Warning]: Failed to manually activate Carousel.\nReason: No active live element matching selector \".carousel\" was found in the DOM Tree.");
				return;
			}
			this.destroy();
			if (this.autoPlayTimer) {
				window.clearInterval(this.autoPlayTimer);
				this.autoPlayTimer = void 0;
			}
			console.log(`🚀 [Carousel Bootstrapper]: Bootstrapping live markup for #${targetCarousel.id || "vanilla-carousel"}.`);
			this.slides = Array.from(targetCarousel.querySelectorAll(".slide"));
			this.track = targetCarousel.querySelector(".track") || targetCarousel;
			this.resolveRuntimeConfig(targetCarousel, {}, this.slides.length);
			this.render("@carousel", {});
			this.initialize(targetCarousel);
			console.log(`✨ [Carousel Bootstrapper]: Manual HTML markup successfully activated via Legal #nodes Registration!`);
		}
		/**
		* TERMINAL MODUL 1: Menghidupkan total penataan jalur mendatar (Horizontal)
		*/
		renderHorizontalMode(carousel) {
			carousel.classList.add("orient-horizontal");
			const totalSlides = this.slides.length;
			const slidesPerView = this.rConfig.slidesPerView || 1;
			if (this.rConfig.animation === "fade") {
				this.track.style.display = "";
				this.track.style.position = "";
				this.track.style.width = "";
				this.track.style.height = "";
			} else {
				this.track.style.display = "flex";
				this.track.style.flexDirection = this.rConfig.animation === "slide-right" ? "row-reverse" : "row";
				this.track.style.height = "100%";
				const trackWidthPercentage = totalSlides / slidesPerView * 100;
				this.track.style.width = `${trackWidthPercentage}%`;
				const slideSizeInTrack = 100 / totalSlides;
				this.slides.forEach((slide) => {
					slide.style.position = "relative";
					slide.style.flex = this.rConfig.slideWidth && this.rConfig.slideWidth !== "auto" ? "none" : `0 0 ${slideSizeInTrack}%`;
					slide.style.width = this.rConfig.slideWidth || `${slideSizeInTrack}%`;
					slide.style.height = this.rConfig.slideHeight || "100%";
				});
			}
			this.animate(true);
		}
		/**
		* TERMINAL MODUL 2: Menghidupkan total penataan jalur tegak lurus (Vertical)
		*/
		renderVerticalMode(carousel) {
			carousel.classList.add("orient-vertical");
			this.track.style.display = "flex";
			this.track.style.flexDirection = this.rConfig.animation === "slide-down" ? "column-reverse" : "column";
			this.track.style.width = "100%";
			const totalSlides = this.slides.length;
			const trackHeightPercentage = totalSlides / (this.rConfig.slidesPerView || 1) * 100;
			this.track.style.height = `${trackHeightPercentage}%`;
			const slideSizeInTrack = 100 / totalSlides;
			this.slides.forEach((slide) => {
				slide.style.position = "relative";
				slide.style.flex = this.rConfig.slideHeight && this.rConfig.slideHeight !== "auto" ? "none" : `0 0 ${slideSizeInTrack}%`;
				slide.style.height = this.rConfig.slideHeight || `${slideSizeInTrack}%`;
				if (!this.rConfig.slideHeight || this.rConfig.slideHeight === "auto") slide.style.maxHeight = `${slideSizeInTrack}%`;
				slide.style.width = this.rConfig.slideWidth || "100%";
			});
			this.animate(true);
		}
		/**
		* 🎢 PUSAT KENDALI PENGANIMASIAN MODULAR (ANTI-JUMPING GUARANTEED)
		*/
		animate(immediate = false) {
			if (this.rConfig.animation === "fade" && !this.rConfig.vertical) {
				if (immediate) this.slides.forEach((slide) => {
					slide.style.transition = "none";
				});
				this.slides.forEach((slide, idx) => {
					if (idx === this.currentIndex) slide.classList.add("active");
					else slide.classList.remove("active");
				});
				this.track.style.transform = "none";
				if (immediate) requestAnimationFrame(() => {
					this.slides.forEach((slide) => {
						slide.style.transition = "";
					});
				});
				return;
			}
			if (immediate) this.track.style.transition = "none";
			else this.track.style.transition = this.rConfig.vertical ? "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)" : "transform 0.5s ease-in-out";
			const totalSlides = this.slides.length;
			if (totalSlides === 0) return;
			if (this.rConfig.vertical) {
				const slideSizeInTrack = 100 / totalSlides;
				const direction = this.rConfig.animation === "slide-down" ? 1 : -1;
				const offset = this.currentIndex * slideSizeInTrack * direction;
				this.track.style.transform = `translateY(${offset}%)`;
			} else {
				const slideSizeInTrack = 100 / totalSlides;
				const direction = this.rConfig.animation === "slide-right" ? 1 : -1;
				const offset = this.currentIndex * slideSizeInTrack * direction;
				this.track.style.transform = `translateX(${offset}%)`;
			}
			this.slides.forEach((slide, idx) => {
				if (idx === this.currentIndex) slide.classList.add("active");
				else slide.classList.remove("active");
			});
		}
		_navigateTo(index, immediate = false) {
			if (this.slides.length === 0) return;
			const maxIndex = this.rConfig.maxIndex;
			const loop = Boolean(this.rConfig.loop);
			let targetIndex;
			if (loop) targetIndex = index > maxIndex ? 0 : index < 0 ? maxIndex : index;
			else {
				targetIndex = Math.min(Math.max(index, 0), maxIndex);
				if (index > maxIndex || index < 0) this.stopAutoPlay();
			}
			this.currentIndex = targetIndex;
			this.animate(immediate);
			this.renderDots();
		}
		startAutoPlay() {
			if (this.rConfig.autoPlay && this.slides.length > 1 && !this.autoPlayTimer) {
				const interval = typeof this.rConfig.autoPlay === "number" ? this.rConfig.autoPlay : 3e3;
				this.autoPlayTimer = window.setInterval(this.next, interval);
			}
		}
		stopAutoPlay() {
			if (this.autoPlayTimer) {
				window.clearInterval(this.autoPlayTimer);
				this.autoPlayTimer = void 0;
			}
		}
		renderDots() {
			if (!this.rConfig.showNavigation || this.dots.length === 0) return;
			this.dots.forEach((dot, index) => {
				const isActive = index === this.currentIndex;
				dot.classList.toggle("active", isActive);
				if (isActive) dot.setAttribute("aria-current", "true");
				else dot.removeAttribute("aria-current");
			});
		}
		attachControls(carousel) {
			const group = this.render("@carousel>control", {});
			const prevBtn = this.render("@carousel>control>prev", { onSelect: () => {
				this.previous();
				this.resetAutoPlay();
			} });
			const nextBtn = this.render("@carousel>control>next", { onSelect: () => {
				this.next();
				this.resetAutoPlay();
			} });
			this.buttons.push(prevBtn, nextBtn);
			group.append(prevBtn, nextBtn);
			carousel.appendChild(group);
		}
		attachNavigation(carousel, navigableSlides) {
			const navContainer = this.render("@carousel>navigations", {
				count: navigableSlides.length,
				vertical: this.rConfig.vertical,
				onSelect: (index) => {
					this._navigateTo(index);
					this.resetAutoPlay();
				}
			});
			carousel.appendChild(navContainer);
		}
		unmount() {
			this.stopAutoPlay();
			this.buttons.forEach((b) => b.onclick = null);
			this.dots.forEach((d) => d.onclick = null);
			this.slides = [];
			this.dots = [];
			this.buttons = [];
			if (this.container && this.config.container) this.container.innerHTML = "";
		}
		/**
		* Releases instance state, then the DOM.
		*
		* `Base.destroy()` unhooks the root element only: the autoplay interval and the hover
		* listeners are state this class owns, so they are released here. Before this override a
		* destroyed carousel kept calling `next()` every `autoPlay` ms on a detached tree — one
		* interval per mount, `clearInterval` never called (see `docs/framework/APP-LIFECYCLE.md`).
		*/
		destroy(typeKey) {
			this.unmount();
			this.container?.removeEventListener("mouseenter", this.handleEnter);
			this.container?.removeEventListener("mouseleave", this.handleLeave);
			super.destroy(typeKey);
		}
		resolveRuntimeConfig(element, payload, totalSlides) {
			const mergeAttributes = (attrs) => {
				for (const [dataKey, rawValue] of Object.entries(attrs)) {
					const targetKey = AttrsConfigMap[dataKey];
					if (targetKey && targetKey in this.config) {
						let finalValue = rawValue;
						const defaultType = typeof this.config[targetKey];
						if (defaultType === "boolean" && typeof rawValue === "string") finalValue = rawValue === "true";
						else if (defaultType === "number" && typeof rawValue === "string") finalValue = Number(rawValue);
						this.config[targetKey] = finalValue;
					}
				}
			};
			let dataAttrs = {};
			const secureAttributes = payload?.attrs || payload?.config || {};
			if (element instanceof HTMLElement) {
				for (const attr of Array.from(element.attributes)) if (attr.name.startsWith("data-") || attr.name === "container") dataAttrs[attr.name] = attr.value;
			}
			totalSlides = totalSlides ?? (Array.isArray(payload) ? payload.length : 0);
			mergeAttributes({
				...secureAttributes,
				...dataAttrs
			});
			const slidesPerView = this.config.slidesPerView || 1;
			let animation = this.config.animation || "fade";
			const vertical = this.config.vertical === true;
			if (vertical && animation === "fade") animation = "slide-up";
			if (!vertical && slidesPerView > 1 && animation === "fade") animation = "slide-left";
			const isSliding = animation.startsWith("slide");
			const maxIndex = isSliding ? totalSlides - slidesPerView : totalSlides - 1;
			const maxDots = isSliding ? totalSlides - slidesPerView + 1 : totalSlides;
			return {
				showControl: this.config.showControl ?? true,
				showNavigation: this.config.showNavigation ?? true,
				autoPlay: this.config.autoPlay ?? 4e3,
				animation,
				slidesPerView,
				vertical,
				loop: this.config.loop ?? true,
				slideHeight: this.config.slideHeight,
				slideWidth: this.config.slideWidth,
				pauseOnHover: this.config.pauseOnHover ?? true,
				isSliding,
				maxIndex: maxIndex > 0 ? maxIndex : 0,
				maxDots: maxDots > 0 ? maxDots : 1
			};
		}
	};
	_defineProperty(CarouselBuilder, "contract", {
		schema: {
			t: "list",
			min: 1,
			of: {
				t: "record",
				open: true,
				of: {
					image: { t: "string" },
					imageUrl: { t: "string" },
					title: { t: "string" },
					desc: { t: "string" }
				}
			}
		},
		example: [{
			image: "first.png",
			title: "First",
			desc: "…"
		}, {
			image: "second.png",
			title: "Second"
		}]
	});
	// packages/components/carousel/index.ts
	var carousel_exports = /* @__PURE__ */ __exportAll({ CarouselBuilder: () => CarouselBuilder });
	// packages/components/code-block/CodeBlock.ts
	/**
	* Default shape per key. The root is a real `section` (it is a block of source text, and it
	* holds one or more panels); the panel itself is a real `pre`, so a caller that only knows
	* "this is code" still gets a correct element even when it overrides the wrapper.
	*/
	var DEFAULT_SELECTORS$4 = {
		"@container": {
			tagName: "section",
			className: "code-block"
		},
		"@container>figure": {
			tagName: "figure",
			className: "frame"
		},
		"@container>figure>label": {
			tagName: "figcaption",
			className: "label"
		},
		"@container>figure>block": {
			tagName: "pre",
			className: "paper"
		},
		"@container>figure>block>source": {
			tagName: "code",
			className: "body"
		},
		"@container>figure>actions": {
			tagName: "div",
			className: "actions"
		},
		"@container>figure>actions>copy": {
			tagName: "button",
			className: "copy"
		},
		"@container>figure>actions>edit": {
			tagName: "button",
			className: "edit"
		},
		"@container>figure>actions>save": {
			tagName: "button",
			className: "save"
		},
		"@container>figure>actions>custom": {
			tagName: "button",
			className: "custom"
		}
	};
	/** Default button text per action type. */
	var ACTION_LABELS = {
		copy: "Copy",
		edit: "Edit",
		save: "Save",
		custom: "Run"
	};
	/**
	* Payload normalizer.
	*
	* Accepted shapes:
	*
	*   - `{ code, label?, language? }`   one block
	*   - `{ blocks: [...] }`             several labelled blocks in one call
	*   - `[...]`                         bare array of the same records
	*   - `"…"`                           source only, no label
	*   - `{ content: … }`                the registry's default unwrapping
	*   - `{}` / `null` / `undefined`     nothing
	*/
	function normalizePayload$1(data) {
		const toEntry = (value) => {
			if (typeof value === "string") return value ? { code: value } : null;
			if (!value || typeof value !== "object") return null;
			if (typeof value.code !== "string") return null;
			return {
				code: value.code,
				label: value.label,
				language: value.language
			};
		};
		const collect = (value) => {
			if (Array.isArray(value)) return value.map(toEntry).filter(Boolean);
			const entry = toEntry(value);
			return entry ? [entry] : [];
		};
		if (data === null || data === void 0) return [];
		if (typeof data === "string") return collect(data);
		if (typeof data !== "object") return [];
		if (Array.isArray(data)) return collect(data);
		if (Array.isArray(data.blocks)) return collect(data.blocks);
		if (typeof data.code === "string") return collect(data);
		return [];
	}
	var _CodeBlockBuilder_brand = /* @__PURE__ */ new WeakSet();
	var CodeBlockBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — the frame's own anatomy (label, paper, action row), drawn with the
		* mandatory `@aio-ui/skeleton` primitive. The line count is the payload's business; the
		* mockup only reserves the box the sheet will take over.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [
					{
						shape: "row",
						gap: "0.5rem",
						children: [{
							shape: "bone",
							width: "30%",
							height: "0.9rem"
						}]
					},
					{
						shape: "bone",
						height: "12rem"
					},
					{
						shape: "row",
						gap: "0.5rem",
						children: [{
							shape: "bone",
							width: "4.5rem",
							height: "1.75rem",
							count: 3
						}]
					}
				]
			});
		}
		constructor(config = {}) {
			super();
			_classPrivateMethodInitSpec(this, _CodeBlockBuilder_brand);
			_defineProperty(this, "builderId", "code-block");
			_defineProperty(this, "name", "code-block");
			_defineProperty(this, "stylesheet", "./CodeBlock.css");
			_defineProperty(this, "config", void 0);
			const defaultConfig = {
				themeId: "default",
				namespace: null,
				emit: () => {},
				selectors: DEFAULT_SELECTORS$4,
				actions: []
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		/**
		* Build the tree: one `figure` per entry (label above, `pre > code` below), and one
		* stack that holds them all. A block without a label simply has no caption node.
		*/
		prepare(data) {
			const entries = normalizePayload$1(data);
			const container = this.render("@container", { count: entries.length });
			for (const entry of entries) {
				const figure = this.render("@container>figure", entry);
				if (!figure) continue;
				if (entry.label) {
					const label = this.render("@container>figure>label", entry);
					if (label) figure.appendChild(label);
				}
				const block = this.render("@container>figure>block", entry);
				if (block) {
					const source = this.render("@container>figure>block>source", entry);
					if (source) block.appendChild(source);
					figure.appendChild(block);
				}
				const actions = this.config.actions ?? [];
				if (actions.length) {
					const row = this.render("@container>figure>actions", { count: actions.length });
					for (const action of actions) {
						const key = `@container>figure>actions>${action.type}`;
						const button = this.render(key, action);
						if (button) row?.appendChild(button);
					}
					if (row) figure.appendChild(row);
				}
				container?.appendChild(figure);
			}
			return this.load("@container");
		}
		/**
		* Hydration valve. Text and attributes only — `textContent`, never `innerHTML`, so
		* source that happens to contain markup is printed instead of parsed.
		*/
		template(typeKey, el, payload) {
			switch (typeKey) {
				case "@container>figure>label":
					el.textContent = payload?.label ?? "";
					break;
				case "@container>figure>block":
					if (payload?.language) el.dataset.language = String(payload.language);
					break;
				case "@container>figure>block>source":
					el.textContent = payload?.code ?? "";
					break;
				case "@container>figure>actions>copy":
				case "@container>figure>actions>edit":
				case "@container>figure>actions>save":
				case "@container>figure>actions>custom": {
					const button = el;
					const type = typeKey.split(">").pop();
					const label = payload?.label ?? ACTION_LABELS[type];
					button.type = "button";
					button.dataset.action = type;
					button.textContent = label;
					button.title = label;
					break;
				}
			}
		}
		/**
		* Wire the action buttons — one listener per button, resolved against `config.actions`.
		*
		* `edit` / `save` only flip the `contentEditable` attribute on the panel's `<code>`; the
		* committed text goes back through `textContent`, so nothing is ever parsed as HTML.
		* Reporting is the caller's: the action's own `onClick` is the sink, exactly like an
		* input field's action set — there is no separate event name to learn.
		*/
		initialize(el) {
			const container = el ?? this.load("@container");
			if (!container) return;
			container.querySelectorAll("button[data-action]").forEach((button) => {
				button.addEventListener("click", (event) => _assertClassBrand(_CodeBlockBuilder_brand, this, _runAction).call(this, event, button));
			});
		}
	};
	function _runAction(event, button) {
		event.preventDefault();
		const type = button.dataset.action;
		const action = (this.config.actions ?? []).find((entry) => entry.type === type);
		if (!type || !action || !button.closest("figure")) return;
		const figure = button.closest("figure");
		const code = figure.querySelector("code") ?? null;
		const panel = figure.querySelector("pre") ?? null;
		if (type === "edit" && code) {
			code.contentEditable = "true";
			figure.classList.add("editing");
			code.focus();
		}
		if (type === "save" && code) {
			code.textContent = (code.textContent ?? "").replace(/\s+$/, "");
			code.contentEditable = "false";
			figure.classList.remove("editing");
		}
		const value = code?.textContent ?? "";
		if (type === "copy") {
			const clipboard = navigator.clipboard;
			if (clipboard) clipboard.writeText(value).catch(() => void 0);
		}
		const context = {
			action: type,
			element: code,
			parentElement: figure,
			value,
			label: action.label,
			language: panel?.dataset.language,
			index: Array.from(figure.parentElement?.children ?? []).indexOf(figure),
			button,
			event
		};
		const outcome = action.onClick(figure, context);
		if (outcome) outcome.catch(() => void 0);
	}
	_defineProperty(CodeBlockBuilder, "contract", {
		schema: {
			t: "union",
			of: [
				{
					t: "record",
					open: true,
					of: {
						code: { t: "string" },
						label: { t: "string" },
						language: { t: "string" }
					}
				},
				{
					t: "record",
					open: true,
					of: { blocks: {
						t: "list",
						of: {
							t: "record",
							open: true
						}
					} }
				},
				{
					t: "list",
					of: {
						t: "record",
						open: true
					}
				},
				{ t: "string" }
			]
		},
		example: {
			code: "const app = new AioApp({ container: \"#app\" });",
			label: "ts · mount",
			language: "ts"
		}
	});
	// packages/components/code-block/index.ts
	var code_block_exports = /* @__PURE__ */ __exportAll({ CodeBlockBuilder: () => CodeBlockBuilder });
	// packages/core/src/Registry/RegistryError.ts
	/**
	* Typed error used by every registry kernel failure path.
	*
	* @summary Carries a stable `code`, the registry `scope`, and the offending `id`
	* so callers can branch on the failure kind without parsing messages.
	*
	* @example
	* try {
	*   registry.register("cascade", definition);
	* } catch (error) {
	*   if (error instanceof RegistryError && error.code === "DUPLICATE_ID") {
	*     // handle the duplicate registration
	*   }
	* }
	*/
	var RegistryError = class extends Error {
		/**
		* @param code - Stable failure reason.
		* @param message - Human-readable message.
		* @param details - Registry scope and, when relevant, the offending id.
		*/
		constructor(code, message, details) {
			super(message);
			_defineProperty(
				this,
				/** Stable failure reason. */
				"code",
				void 0
			);
			_defineProperty(
				this,
				/** Registry scope that raised the error. */
				"scope",
				void 0
			);
			_defineProperty(
				this,
				/** Offending id, when the failure is id-specific. */
				"id",
				void 0
			);
			this.name = "RegistryError";
			this.code = code;
			this.scope = details.scope;
			this.id = details.id;
		}
	};
	// packages/core/src/Registry/RegistryScope.ts
	/** Scope labels must start with an alphanumeric character and contain no spaces. */
	var SCOPE_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;
	/**
	* Validates and normalises a registry scope label.
	*
	* @summary Trims the label and rejects values that cannot be used as a stable
	* namespace key, so two registries cannot silently share a scope by accident.
	* @param scope - Candidate scope label, for example `"component"` or `"form"`.
	* @returns The trimmed scope label.
	* @throws {RegistryError} With code `INVALID_SCOPE` when the label is empty, padded-recoverable but malformed, or contains whitespace.
	* @example
	* assertValidScope("form"); // "form"
	* assertValidScope("  ");   // throws RegistryError
	*/
	function assertValidScope(scope) {
		const trimmed = typeof scope === "string" ? scope.trim() : "";
		if (!trimmed || !SCOPE_PATTERN.test(trimmed)) throw new RegistryError("INVALID_SCOPE", `Invalid registry scope "${String(scope)}". Use a non-empty label without whitespace.`, { scope: trimmed || String(scope) });
		return trimmed;
	}
	/**
	* Validates a registry entry id.
	*
	* @summary Rejects empty and whitespace-only ids so `register()` cannot create
	* entries that later lookups can never address.
	* @param id - Candidate identifier.
	* @param scope - Scope used for error reporting.
	* @returns The identifier unchanged.
	* @throws {RegistryError} With code `INVALID_ID` when the id is not a non-empty string.
	* @example
	* assertValidId("cascade", "form"); // "cascade"
	*/
	function assertValidId(id, scope) {
		if (typeof id !== "string" || !id.trim()) throw new RegistryError("INVALID_ID", `Invalid registry id "${String(id)}" in scope "${scope}". Ids must be non-empty strings.`, {
			scope,
			id: String(id)
		});
		return id;
	}
	/**
	* Builds a fully qualified key from a scope and an id.
	*
	* @summary Useful for adapters that flatten several instances into one shared
	* store while keeping their scopes readable in logs and debugging tools.
	* @param scope - Registry scope label.
	* @param id - Entry identifier.
	* @returns A `scope:id` string.
	* @example
	* qualifyId("form", "cascade"); // "form:cascade"
	*/
	function qualifyId(scope, id) {
		return `${assertValidScope(scope)}:${assertValidId(id, scope)}`;
	}
	/**
	* Splits a previously qualified `scope:id` key.
	*
	* @summary Inverse of {@link qualifyId}; splits on the first colon so ids may
	* themselves contain colons.
	* @param qualifiedId - Value produced by {@link qualifyId}.
	* @returns The parsed parts, or `null` when the input has no `scope:id` shape.
	* @example
	* splitQualifiedId("form:cascade"); // { scope: "form", id: "cascade" }
	*/
	function splitQualifiedId(qualifiedId) {
		if (typeof qualifiedId !== "string") return null;
		const separator = qualifiedId.indexOf(":");
		if (separator <= 0 || separator === qualifiedId.length - 1) return null;
		return {
			scope: qualifiedId.slice(0, separator),
			id: qualifiedId.slice(separator + 1)
		};
	}
	// packages/core/src/Registry/Registry.ts
	/** Duplicate policy used when the caller does not provide one. */
	var DEFAULT_DUPLICATE_POLICY = "error";
	var _scope = /* @__PURE__ */ new WeakMap();
	var _duplicate = /* @__PURE__ */ new WeakMap();
	var _onDispose = /* @__PURE__ */ new WeakMap();
	var _values = /* @__PURE__ */ new WeakMap();
	/**
	* 🧱 REGISTRY KERNEL — generic storage and resolution primitive.
	*
	* The kernel owns exactly one concern: mapping string ids to values inside an
	* isolated instance, with explicit duplicate handling and disposal. It knows
	* nothing about components, DOM, stylesheets, modules, pages, or lazy loading.
	* Those are adapter responsibilities (`ComponentRegistry`, future
	* `ModuleRegistry`, `PageRegistry`, `TemplateRegistry`).
	*
	* @example
	* const registry = new Registry<Definition>("module", { duplicate: "warn" });
	* registry.register("cascade", cascadeDefinition);
	* const definition = registry.resolve("cascade");
	*/
	var Registry = class {
		/**
		* @param scope - Namespace label, for example `"component"` or `"form"`.
		* @param options - Duplicate policy and optional disposal hook.
		* @throws {RegistryError} With code `INVALID_SCOPE` when the scope label is malformed.
		*/
		constructor(scope, options = {}) {
			_classPrivateFieldInitSpec(this, _scope, void 0);
			_classPrivateFieldInitSpec(this, _duplicate, void 0);
			_classPrivateFieldInitSpec(this, _onDispose, void 0);
			_classPrivateFieldInitSpec(this, _values, /* @__PURE__ */ new Map());
			_classPrivateFieldSet2(_scope, this, assertValidScope(scope));
			_classPrivateFieldSet2(_duplicate, this, options.duplicate ?? DEFAULT_DUPLICATE_POLICY);
			_classPrivateFieldSet2(_onDispose, this, options.onDispose);
		}
		/** Scope label that isolates this instance from other registry instances. */
		get scope() {
			return _classPrivateFieldGet2(_scope, this);
		}
		/** Number of stored entries. */
		get size() {
			return _classPrivateFieldGet2(_values, this).size;
		}
		/**
		* Registers a value under an id.
		*
		* @summary Validates the id, applies the duplicate policy from the constructor
		* options, then stores the value.
		* @param id - Identifier unique inside this instance.
		* @param value - Value to store. The kernel never interprets it.
		* @returns The current instance, for fluent registration chains.
		* @throws {RegistryError} With code `INVALID_ID` for a malformed id, or `DUPLICATE_ID` when the policy is `"error"` and the id exists.
		* @example
		* registry.register("masonry", masonryDefinition);
		*/
		register(id, value) {
			const key = assertValidId(id, _classPrivateFieldGet2(_scope, this));
			if (_classPrivateFieldGet2(_values, this).has(key)) switch (_classPrivateFieldGet2(_duplicate, this)) {
				case "error": throw new RegistryError("DUPLICATE_ID", `Registry "${_classPrivateFieldGet2(_scope, this)}" already contains an entry for "${key}".`, {
					scope: _classPrivateFieldGet2(_scope, this),
					id: key
				});
				case "ignore": return this;
				case "warn": console.warn(`[Registry:${_classPrivateFieldGet2(_scope, this)}] Replacing duplicate entry "${key}".`);
			}
			_classPrivateFieldGet2(_values, this).set(key, value);
			return this;
		}
		/**
		* Resolves a value by id.
		*
		* @summary Read-only lookup. Missing ids and non-string inputs resolve to
		* `null` instead of throwing, so optional resolution stays branch-free at
		* call sites such as `resolve(id) ?? fallback`.
		* @param id - Identifier to look up.
		* @returns The stored value, or `null` when absent.
		* @example
		* const definition = registry.resolve("cascade");
		*/
		resolve(id) {
			if (typeof id !== "string") return null;
			return _classPrivateFieldGet2(_values, this).get(id) ?? null;
		}
		/**
		* Resolves a value by id and fails when it is missing.
		*
		* @summary Use this when a missing registration is a programming error rather
		* than an expected optional path.
		* @param id - Identifier to look up.
		* @returns The stored value.
		* @throws {RegistryError} With code `MISSING_ENTRY` when nothing is registered under `id`.
		* @example
		* const definition = registry.require("cascade");
		*/
		require(id) {
			const value = this.resolve(id);
			if (value === null) throw new RegistryError("MISSING_ENTRY", `Registry "${_classPrivateFieldGet2(_scope, this)}" has no entry for "${String(id)}".`, {
				scope: _classPrivateFieldGet2(_scope, this),
				id: String(id)
			});
			return value;
		}
		/**
		* Checks whether an id is registered.
		*
		* @param id - Identifier to test.
		* @returns `true` when an entry exists.
		* @example
		* registry.has("cascade"); // true
		*/
		has(id) {
			return typeof id === "string" && _classPrivateFieldGet2(_values, this).has(id);
		}
		/**
		* Removes an entry and disposes it.
		*
		* @summary Deletes the entry first, then calls the disposal hook, so a hook
		* that inspects the registry never observes the detached value.
		* @param id - Identifier to remove.
		* @returns `true` when an entry was removed, `false` when it was absent.
		* @example
		* registry.unregister("cascade");
		*/
		unregister(id) {
			if (typeof id !== "string" || !_classPrivateFieldGet2(_values, this).has(id)) return false;
			const value = _classPrivateFieldGet2(_values, this).get(id);
			_classPrivateFieldGet2(_values, this).delete(id);
			_classPrivateFieldGet2(_onDispose, this)?.call(this, value, id);
			return true;
		}
		/**
		* Removes every entry and disposes each one.
		*
		* @summary Clears storage before invoking the disposal hook for every removed
		* pair, so re-entrant lookups during disposal see an empty registry.
		* @returns Nothing.
		* @example
		* registry.clear();
		*/
		clear() {
			const detached = Array.from(_classPrivateFieldGet2(_values, this).entries());
			_classPrivateFieldGet2(_values, this).clear();
			for (const [id, value] of detached) _classPrivateFieldGet2(_onDispose, this)?.call(this, value, id);
		}
		/**
		* Lists stored pairs in registration order.
		*
		* @returns A new array that is safe to mutate.
		* @example
		* registry.entries(); // [{ id: "cascade", value: definition }]
		*/
		entries() {
			return Array.from(_classPrivateFieldGet2(_values, this), ([id, value]) => ({
				id,
				value
			}));
		}
		/**
		* Lists registered ids in registration order.
		*
		* @returns A new array that is safe to mutate.
		* @example
		* registry.ids(); // ["masonry", "article"]
		*/
		ids() {
			return Array.from(_classPrivateFieldGet2(_values, this).keys());
		}
	};
	// packages/core/src/BuilderPort.ts
	var builderAdapter = null;
	/**
	* @summary Plug an implementation into the builder port.
	* @param adapter - The adapter to use, or `null` to detach it again.
	*/
	function setBuilderAdapter(adapter) {
		builderAdapter = adapter;
	}
	/**
	* @summary Read the currently plugged adapter.
	* @returns The active adapter, or `null` when no builder package has loaded yet.
	*/
	function getBuilderAdapter() {
		return builderAdapter;
	}
	// packages/core/src/Registry/BuilderInstances.ts
	/**
	* Builder instances pinned to the element they produced.
	*
	* The app replaces the whole tree on every render pass, so the previous page's
	* builders are detached without anyone telling them. Nothing was calling
	* `destroy()` — and a builder's timers, observers and global listeners outlive
	* its nodes (see `docs/framework/APP-LIFECYCLE.md`).
	*
	* `ComponentRegistry.build()` pins the instance it just created on the element it
	* returns; `releaseBuilders()` walks a subtree, finds every pinned instance and
	* destroys it once. That is the whole mechanism: no per-route bookkeeping, and a
	* nested builder (a card inside a grid) is found because its root is a descendant.
	*
	* Registry-only on purpose. A builder created directly (a table inside a form field,
	* a component in a test) has no owner that would ever sweep it, so pinning there
	* would only write a symbol nobody reads — the mechanism exists because *the app*
	* replaces whole trees.
	*
	* The key is a `Symbol.for`, not a local symbol: a dev graph and a built bundle
	* can both be loaded on one page, and the pin has to mean the same thing to both.
	*/
	var BUILDER_INSTANCE = Symbol.for("aio-ui.builder-instance");
	/**
	* Pins a builder instance on the root element it returned.
	*
	* @param root - The root of the tree the builder created.
	* @param instance - The builder itself.
	* @returns Nothing.
	*
	* @summary Called by `ComponentRegistry.build()`, the only owner that ever sweeps a
	*   subtree. The pin lives on the node, so it leaves with the node: an element collected
	*   by the GC cannot keep a builder alive.
	*/
	function attachBuilder(root, instance) {
		if (!root || !instance || typeof root !== "object") return;
		root[BUILDER_INSTANCE] = instance;
	}
	/**
	* Destroys every builder pinned inside a subtree that is about to be discarded.
	*
	* @param root - The subtree root (`AioApp`'s outgoing shell, a page's remembered shell).
	* @returns How many instances were destroyed.
	*
	* @example
	* releaseBuilders(app.root);   // before the next render replaces it
	*
	* @summary Each instance is unpinned *before* its `destroy()` runs, so a second sweep over
	*   the same tree — the page's `onDestroy` followed by the app's paint step — is a no-op
	*   instead of a double teardown. A builder that throws cannot stop the others: the error
	*   is reported and the sweep continues, because the alternative is leaking everything
	*   behind the first broken component.
	*/
	function releaseBuilders(root) {
		if (!root || typeof root.querySelectorAll !== "function") return 0;
		const elements = [root, ...root.querySelectorAll("*")];
		const released = /* @__PURE__ */ new Set();
		for (const element of elements) {
			const record = element;
			const instance = record[BUILDER_INSTANCE];
			if (!instance || released.has(instance)) continue;
			delete record[BUILDER_INSTANCE];
			released.add(instance);
			try {
				instance.destroy?.();
			} catch (error) {
				console.error("[builders] destroy failed:", error);
			}
		}
		return released.size;
	}
	// packages/core/src/Stylesheets.ts
	/** Host-declared loaders, keyed by the module specifier the host chose. */
	var assets = {};
	/** Specifiers already injected, so a second request never re-fetches or re-inserts. */
	var ready = /* @__PURE__ */ new Set();
	var loading = /* @__PURE__ */ new Map();
	/**
	* Registers the host's stylesheet loaders.
	*
	* @param styles - The same map the host hands the `ComponentRegistry`.
	* @returns Nothing.
	*
	* @summary Called by the registry constructor: the host already declares its asset
	* maps once, and this makes the same declaration usable by builders that never pass
	* through the registry.
	*/
	function useStylesheetAssets(styles) {
		assets = styles ?? {};
	}
	/**
	* Normalizes a specifier to `/<specifier>` so two spellings of one sheet share a key.
	*
	* @param specifier - Specifier as declared by a component or the host.
	* @returns The normalized key (`""` for an empty specifier).
	*/
	function normalizeStylesheetPath(specifier) {
		if (!specifier) return "";
		let clean = specifier.trim().replace(/\\/g, "/");
		if (clean.startsWith("./")) clean = clean.slice(2);
		if (clean.startsWith("/")) clean = clean.slice(1);
		return `/${clean}`;
	}
	/** File name of a specifier: the fallback key when the host layout is unknown. */
	function baseNameOf(specifier) {
		return specifier.replace(/\\/g, "/").split("/").pop() ?? "";
	}
	/**
	* Finds the loader for a component's declared stylesheet.
	*
	* @param specifier - What the component declares, usually relative to itself (`"./Table.css"`).
	* @returns The loader and the key it was found under, or `undefined` when the host
	*   declares no such sheet.
	*
	* @summary A component cannot know the host's key layout, so the declaration is tried
	* as written, normalized, case-insensitively, and finally by file name — the sheet sits
	* next to the component under a name no sibling reuses.
	*/
	function resolveLoader(specifier) {
		if (!specifier) return void 0;
		const candidates = [specifier, normalizeStylesheetPath(specifier)];
		for (const candidate of candidates) if (typeof assets[candidate] === "function") return {
			key: normalizeStylesheetPath(candidate),
			load: assets[candidate]
		};
		const wanted = candidates.map((candidate) => candidate.toLowerCase());
		const exact = Object.keys(assets).find((key) => wanted.includes(key.toLowerCase()));
		if (exact) return {
			key: normalizeStylesheetPath(exact),
			load: assets[exact]
		};
		const file = baseNameOf(specifier).toLowerCase();
		const byName = file ? Object.keys(assets).find((key) => baseNameOf(key).toLowerCase() === file) : void 0;
		return byName ? {
			key: normalizeStylesheetPath(byName),
			load: assets[byName]
		} : void 0;
	}
	/** `<style>` id for one sheet: stable across the registry path and this one. */
	function styleTagId(specifier) {
		return `rajutan-lazy-css__${normalizeStylesheetPath(specifier).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
	}
	/** Whether this sheet is already part of the document (either injection path). */
	function isStyleInjected(specifier) {
		if (typeof document === "undefined") return true;
		return Boolean(document.getElementById(styleTagId(specifier)));
	}
	/**
	* Whether a component's own stylesheet is still on its way.
	*
	* @param specifier - The component's declared `stylesheet` (`"./Table.css"`).
	* @returns `true` only when the host declares a loader for this sheet and the document
	*   does not have it yet — the single state in which a builder must hold its root.
	*
	* @example
	* if (isStylesheetPending("./Table.css")) return "still coming";
	*
	* @summary A component without a loader is never "pending": waiting for a sheet nobody
	*   can serve would strand the anti-FOUC hold forever. A non-DOM host (SSR, tests) has no
	*   document to be styled, so it never holds either. This is the question the hold asks
	*   *before* a root is returned — hence synchronous, unlike {@link ensureStylesheet}.
	*/
	function isStylesheetPending(specifier) {
		const resolved = resolveLoader(specifier);
		if (!resolved) return false;
		return !isStyleInjected(resolved.key);
	}
	/**
	* Writes a stylesheet into the document as a real `<style>` element.
	*
	* @param rawCss - Stylesheet text as returned by the loader.
	* @param specifier - Specifier the text belongs to; drives the element id and dedupe.
	* @returns Nothing.
	*
	* @summary A `<style>` node (not `adoptedStyleSheets`) so the sheet is visible in
	* DevTools, and idempotent by id so the registry and {@link ensureStylesheet} can both
	* ask for the same sheet without duplicating rules.
	*/
	function injectLazyCss(rawCss, specifier) {
		if (!rawCss || typeof document === "undefined") return;
		const id = styleTagId(specifier);
		if (document.getElementById(id)) return;
		const style = document.createElement("style");
		style.id = id;
		style.setAttribute("data-lazy-component", "true");
		style.textContent = rawCss;
		document.head.appendChild(style);
	}
	/**
	* Replaces the text of an already injected sheet — the dev-only hot path.
	*
	* @param rawCss - New stylesheet text.
	* @param specifier - Specifier the text belongs to; the same one the sheet was injected under.
	* @returns Nothing.
	*
	* @summary Injection stays lazy by default: {@link injectLazyCss} never touches an
	* existing sheet, so editing a file changes nothing on screen until something asks again.
	* A stylesheet watcher (Vite's HMR, a file watcher) needs the opposite: keep the element,
	* swap its text, and skip the reload. That is why this is a **separate, opt-in function**
	* instead of a flag on the injector — no production path can reach it by accident, and a
	* sheet that has not arrived yet simply falls back to the normal lazy injection.
	*
	* ```ts
	* import.meta.hot?.on("vite:afterUpdate", async ({ updates }) => {
	*   for (const file of updates) replaceLazyCss(await textOf(file), specifierOf(file));
	* });
	* ```
	*/
	function replaceLazyCss(rawCss, specifier) {
		if (!rawCss || typeof document === "undefined") return;
		const tag = document.getElementById(styleTagId(specifier));
		if (!tag) {
			injectLazyCss(rawCss, specifier);
			return;
		}
		tag.textContent = rawCss;
	}
	/**
	* Makes sure one component's stylesheet is present.
	*
	* @param specifier - The component's declared `stylesheet` (`"./Table.css"`).
	* @returns A promise resolved once the sheet is in the document, or immediately when
	*   the host declares no loader for it (never a rejection: style is not fatal).
	*
	* @example
	* void ensureStylesheet("./Table.css"); // a table built outside the registry
	*
	* @summary The one call the hydration hold makes: `Builder.create()` asks for its own
	*   sheet, so a component a builder constructs directly (never through the registry) is
	*   styled by the same loader. It is a no-op when the sheet already arrived, so the two
	*   paths cannot double-inject.
	*/
	function ensureStylesheet(specifier) {
		const resolved = resolveLoader(specifier);
		if (!resolved) return Promise.resolve();
		if (ready.has(resolved.key)) {
			if (isStyleInjected(resolved.key)) return Promise.resolve();
			ready.delete(resolved.key);
		}
		if (isStyleInjected(resolved.key)) {
			ready.add(resolved.key);
			return Promise.resolve();
		}
		const inflight = loading.get(resolved.key);
		if (inflight) return inflight;
		const session = Promise.resolve().then(() => resolved.load()).then((module) => {
			const raw = typeof module === "string" ? module : module?.default;
			if (typeof raw !== "string") {
				console.warn(`[stylesheets] loader for "${resolved.key}" returned ${typeof module}, not CSS text — skipped`);
				return;
			}
			injectLazyCss(raw, resolved.key);
			ready.add(resolved.key);
		}).catch((error) => {
			console.warn(`[stylesheets] could not load "${resolved.key}":`, error);
		}).finally(() => {
			loading.delete(resolved.key);
		});
		loading.set(resolved.key, session);
		return session;
	}
	// packages/core/src/ComponentRegistry.ts
	/**
	* Layered config for one build: `theme < emitter < schema`.
	*
	* The emitter sits above the theme so every builder gets a publisher even when a theme
	* configured it, and below the schema so a component can still set its own — or silence it
	* with `emit: null`. Selectors are merged across the layers so a schema that overrides one
	* key keeps the rest.
	*
	* Pure and exported: the merge is the one part of `build()` that can be pinned down
	* without a DOM.
	*/
	function mergeBuildConfig(theme, emitter, schema) {
		const merged = { ...theme };
		if (emitter) merged.emit = emitter;
		const user = schema ?? {};
		Object.assign(merged, user);
		const selectors = {};
		for (const source of [theme, user]) {
			if (!source?.selectors || typeof source.selectors !== "object") continue;
			for (const [key, value] of Object.entries(source.selectors)) {
				const previous = selectors[key];
				selectors[key] = isPlainRecord(previous) && isPlainRecord(value) ? {
					...previous,
					...value
				} : value;
			}
		}
		if (Object.keys(selectors).length) merged.selectors = selectors;
		else delete merged.selectors;
		return merged;
	}
	function normalizeVitePath(pathStr) {
		if (!pathStr) return "";
		let clean = pathStr.trim().replace(/\\/g, "/");
		if (clean.startsWith("./")) clean = clean.slice(2);
		if (clean.startsWith("/")) clean = clean.slice(1);
		return `/${clean}`;
	}
	function resolveRelativePath(baseScriptPath, stylePath) {
		if (!stylePath) return "";
		if (!stylePath.startsWith("./") && !stylePath.startsWith("../")) return stylePath;
		if (!baseScriptPath) return stylePath;
		return (baseScriptPath.substring(0, baseScriptPath.lastIndexOf("/") + 1) + stylePath.replace(/^\.\//, "")).replace(/\/+/g, "/");
	}
	function findStyleLoader(map, key) {
		if (!key) return void 0;
		if (typeof map[key] === "function") return map[key];
		const lower = key.toLowerCase();
		const matched = Object.keys(map).find((k) => k.toLowerCase() === lower);
		return matched ? map[matched] : void 0;
	}
	/**
	* Narrow a value to a plain object record (not array, element, or null).
	*
	* The `Element` guard is skipped when the global is absent, so the registry can be
	* exercised outside a browser (tests, future server-side rendering).
	*/
	function isPlainRecord(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
		return typeof Element === "undefined" || !(value instanceof Element);
	}
	/**
	* Collects the component names a page source needs, in discovery order.
	*
	* Two shapes are recognised:
	*
	* - node trees: a `builder` field naming **one** component — the node the renderer
	*   builds. A route that mounts several components declares them on the registry
	*   (`iComponentRoute` in `@aio-ui/app`), not on a node;
	* - page blocks: a `type` field paired with a table binding (`{ type: "masonry",
	*   source: "portfolio" }`). The `source` requirement keeps input descriptors out,
	*   because they also carry a `type` (`{ type: "text" }`) that is not a component.
	*
	* `builder` is a reserved key, so a declaration there can never leak into the DOM.
	*
	* The walk is depth-first, cycle-safe, and ignores everything it does not recog-
	* nise, so it can be run on raw CMS output without validation.
	*
	* @param source - Page content, array, or any nested structure.
	* @returns Unique component names, in the order they were first seen.
	*/
	function collectComponentNames(source) {
		const found = [];
		const seen = /* @__PURE__ */ new Set();
		const visited = /* @__PURE__ */ new Set();
		const walk = (value) => {
			if (typeof value !== "object" || value === null || visited.has(value)) return;
			visited.add(value);
			if (Array.isArray(value)) {
				for (const item of value) walk(item);
				return;
			}
			const record = value;
			const declared = record.builder;
			const declaredNames = typeof declared === "string" ? [declared] : [];
			const type = typeof record.type === "string" && "source" in record ? record.type : void 0;
			const names = type ? [...declaredNames, type] : declaredNames;
			for (const name of names) if (!seen.has(name)) {
				seen.add(name);
				found.push(name);
			}
			for (const key of Object.keys(record)) walk(record[key]);
		};
		walk(source);
		return found;
	}
	var _assets = /* @__PURE__ */ new WeakMap();
	var _emitter = /* @__PURE__ */ new WeakMap();
	var ComponentRegistry = class {
		/**
		* @summary Stores the host asset maps used for every lazy component load.
		* @param assets - Vite glob maps declared by the host application.
		*
		* The style map is also published to the shared stylesheet seam, so a component
		* built *outside* the registry (a table inside a form field) can still get its CSS
		* without importing it — a static CSS import would ride along in the JS chunk and be
		* injected twice.
		*/
		constructor(assets) {
			_defineProperty(
				this,
				/**
				* 🧱 Builder storage backed by the generic registry kernel.
				*
				* `duplicate: "replace"` preserves the previous silent-overwrite behaviour
				* that HMR and preset rebuilds depend on. Lazy loading and stylesheet injection
				* stay in this adapter — the kernel only stores values. The anti-FOUC hold is
				* not here: it belongs to the builder that owns the root.
				*/
				"builders",
				new Registry("component", { duplicate: "replace" })
			);
			_classPrivateFieldInitSpec(this, _assets, void 0);
			_classPrivateFieldInitSpec(this, _emitter, null);
			_defineProperty(this, "registeredSheets", /* @__PURE__ */ new Set());
			_defineProperty(this, "_resolvedCache", /* @__PURE__ */ new Map());
			_defineProperty(
				this,
				/** Sub-modules resolved per component name: `componentName → { moduleId → module }`. */
				"_modules",
				/* @__PURE__ */ new Map()
			);
			_defineProperty(this, "_dynamicConfigs", /* @__PURE__ */ new Map());
			_defineProperty(
				this,
				/** Components currently being loaded, so a `modules` cycle cannot recurse forever. */
				"_loading",
				/* @__PURE__ */ new Set()
			);
			_classPrivateFieldSet2(_assets, this, assets);
			useStylesheetAssets(assets.styles);
		}
		/**
		* Attaches the publisher every subsequent build receives.
		*
		* Optional by design: a host without an event bus never calls it, and the configs it
		* builds simply have no `emit`. Passing `null` detaches.
		*
		* @param emit - Publisher, or `null` to stop forwarding component events.
		* @returns The current registry instance.
		*/
		useEmitter(emit) {
			_classPrivateFieldSet2(_emitter, this, emit);
			return this;
		}
		/**
		* Registers a component factory under a stable name.
		*
		* @summary Delegates storage to the registry kernel, then returns this instance for fluent registration.
		* @param name - Public component identifier.
		* @param builderFn - Polymorphic registration function (direct builder, loadable builder, or manifest).
		* @returns The current registry instance.
		* @example
		* registry.register("masonry", masonryBuilder);
		*/
		register(name, builderFn) {
			this.builders.register(String(name), builderFn);
			return this;
		}
		/**
		* Lists every registered component name.
		*
		* @summary Exposes the kernel's insertion-ordered ids so callers can preload components.
		* @returns Registered component names in registration order.
		*/
		getRegisteredNames() {
			return this.builders.ids();
		}
		/**
		* Resolves a registered component factory.
		*
		* @summary Returns `undefined` for unknown names so legacy call sites that test the result keep working.
		* @param name - Public component identifier.
		* @returns The registration function, or `undefined` when the name is not registered.
		*/
		get(name) {
			if (this.has(name)) return this.builders.resolve(name) ?? void 0;
		}
		/**
		* Checks whether a component name is registered.
		*
		* @param name - Public component identifier.
		* @returns `true` when a factory is registered under `name`.
		*/
		has(name) {
			return this.builders.has(name);
		}
		async loadModule(script, stylesheet, componentName, exportName) {
			let jsModule = null;
			let rawCss = null;
			if (script) {
				const normScript = normalizeVitePath(script);
				const jsLoader = _classPrivateFieldGet2(_assets, this).modules[normScript] || _classPrivateFieldGet2(_assets, this).modules[script];
				if (typeof jsLoader === "function") jsModule = await jsLoader();
			}
			const builderClass = !jsModule ? null : exportName ? jsModule[exportName] ?? jsModule?.default?.[exportName] ?? null : jsModule.default || Object.values(jsModule).find((v) => typeof v === "function" || v && typeof v.create === "function") || jsModule;
			let effectiveStyle = stylesheet;
			if (!effectiveStyle && builderClass) effectiveStyle = builderClass?.stylesheet || builderClass.prototype?.stylesheet;
			if (!effectiveStyle && script && /\.[cm]?[jt]sx?$/.test(script)) effectiveStyle = script.replace(/\.[cm]?[jt]sx?$/, ".css");
			if (effectiveStyle) {
				if (typeof CSSStyleSheet !== "undefined" && effectiveStyle instanceof CSSStyleSheet) this.injectStyle(effectiveStyle);
				else if (typeof effectiveStyle === "string") {
					const resolvedCssPath = script ? resolveRelativePath(script, effectiveStyle) : effectiveStyle;
					const normCss = normalizeVitePath(resolvedCssPath);
					const cssLoader = findStyleLoader(_classPrivateFieldGet2(_assets, this).styles, normCss) || findStyleLoader(_classPrivateFieldGet2(_assets, this).styles, resolvedCssPath) || findStyleLoader(_classPrivateFieldGet2(_assets, this).styles, effectiveStyle);
					if (typeof cssLoader === "function") {
						rawCss = await cssLoader();
						if (rawCss && typeof rawCss === "object" && "default" in rawCss) rawCss = rawCss.default;
						if (typeof rawCss === "string") this.injectCssString(rawCss, normCss);
					}
				}
			} else if (componentName && !effectiveStyle) {}
			return builderClass;
		}
		/**
		* Resolves every component a page source needs, without the caller listing them.
		*
		* This is the default entry point: a route only has to hand over its content,
		* and the registry derives the set itself (see `collectComponentNames`). `load()`
		* stays public for callers that already know the names, or need query data.
		*
		* @param source - Page content, block list, or any nested structure.
		* @returns The component names that were resolved, in discovery order.
		*/
		async loadFor(source) {
			const names = collectComponentNames(source);
			if (names.length) await this.load(names, [source]);
			return names;
		}
		/**
		* Derives the component names a source needs, without loading anything.
		*
		* Exposed so a host (for example `@aio-ui/app`) can inspect a route before the
		* render pass without importing `collectComponentNames` directly — that keeps the
		* dependency between app and core type-only at runtime.
		*
		* @param source - Page content, block list, or any nested structure.
		* @returns Unique component names, in discovery order.
		*/
		collect(source) {
			return collectComponentNames(source);
		}
		/**
		* Resolves component modules and stylesheets ahead of a render pass.
		*
		* Paired with `build()`: `load()` is always asynchronous and fills the resolved
		* cache, while `build()` stays synchronous and reads from it. A component that
		* was never loaded cannot be built.
		*
		* @param componentNames - Registered component names to resolve.
		* @param pagesData - Source tree used to find each component's node config.
		*/
		async load(componentNames, pagesData = []) {
			for (const nameKey of componentNames) {
				const name = nameKey;
				if (this._loading.has(String(name))) continue;
				const fn = this.builders.resolve(String(name));
				if (!fn) continue;
				const matchedData = this.getBuilderNode(pagesData, name);
				try {
					this._loading.add(String(name));
					const manifest = fn(matchedData || {});
					if (manifest?.path || manifest?.stylesheet) {
						const loadedClass = await this.loadModule(manifest.path, manifest.stylesheet, name, manifest.export);
						if (loadedClass) this._resolvedCache.set(name, loadedClass);
					}
					await this.loadModules(name, manifest);
				} catch (err) {
					console.error(`[ComponentRegistry] load failed for "${String(nameKey)}":`, err);
					throw err;
				} finally {
					this._loading.delete(String(name));
				}
			}
		}
		/**
		* Resolves the sub-modules a component declares in its manifest.
		*
		* Each module is cached under a namespaced key (`form:table`) so a module id
		* shared by two components never collides. A module that cannot be resolved is
		* reported and skipped: the component still loads, and `Builder.module(id)`
		* decides how to degrade at use time.
		*
		* @param componentName - Owner of the modules.
		* @param manifest - The component manifest that declares them.
		*/
		async loadModules(componentName, manifest) {
			const refs = manifest.modules;
			if (!refs?.length) return;
			const resolved = this._modules.get(componentName) ?? {};
			for (const ref of refs) {
				if (resolved[ref.id] !== void 0) continue;
				if (!ref.path) {
					if (!this.has(ref.id)) continue;
					await this.load([ref.id]);
					const registered = this._resolvedCache.get(ref.id);
					if (registered !== void 0) {
						resolved[ref.id] = registered;
						this._resolvedCache.set(`${componentName}:${ref.id}`, registered);
					}
					continue;
				}
				const cacheKey = `${componentName}:${ref.id}`;
				const loaded = await this.loadModule(ref.path, ref.stylesheet, cacheKey, ref.export);
				if (loaded !== void 0 && loaded !== null) {
					resolved[ref.id] = loaded;
					this._resolvedCache.set(cacheKey, loaded);
				}
			}
			this._modules.set(componentName, resolved);
		}
		/**
		* ⚡ AMAN & SINKRONUS MURNI (.run Method)
		*/
		build(name, data) {
			const fn = this.builders.resolve(String(name));
			if (!fn) throw new Error(`[ComponentRegistry] No builder registered for "${String(name)}".`);
			const manifest = fn(data);
			const activeThemeConfig = this._dynamicConfigs.get(name) || {};
			const nodeData = isPlainRecord(data) && typeof data.builder === "string" ? data : null;
			const content = manifest.schema !== void 0 ? manifest.schema : nodeData ? nodeData.content : data;
			const userConfig = nodeData ? nodeData.config || {} : {};
			const schemaConfig = mergeBuildConfig(activeThemeConfig, _classPrivateFieldGet2(_emitter, this), userConfig);
			if (nodeData && nodeData.config) nodeData.config = schemaConfig;
			const cachedClass = this._resolvedCache.get(name);
			if (cachedClass && typeof cachedClass === "function") try {
				const instance = new cachedClass(schemaConfig);
				if (instance && typeof instance.create === "function") {
					const resolvedModules = this._modules.get(String(name));
					if (resolvedModules && typeof instance.provideModules === "function") instance.provideModules(resolvedModules);
					const builtElement = instance.create({
						content,
						config: schemaConfig
					});
					if (!builtElement) throw new Error(`[ComponentRegistry] Builder "${String(name)}" created a null element. Check prepare()/create() or selector definitions.`);
					attachBuilder(builtElement, instance);
					return builtElement;
				}
			} catch (error) {
				throw error instanceof Error ? error : /* @__PURE__ */ new Error(`[ComponentRegistry] Failed to instantiate "${String(name)}": ${String(error)}`);
			}
			throw new Error(`[ComponentRegistry] Builder "${String(name)}" could not produce a DOM element. Its module was not preloaded, or the class is not a Builder.`);
		}
		injectStyle(sheet) {
			if (!this.registeredSheets.has(sheet)) {
				this.registeredSheets.add(sheet);
				document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
			}
		}
		/**
		* 🎯 Penanam CSS mentah sebagai elemen <style id="…"> NYATA di <head>.
		*
		* Mengapa tidak lagi mengandalkan Constructable Stylesheet
		* (document.adoptedStyleSheets)? Stylesheet yang di-`adopt` TIDAK muncul
		* sebagai node DOM — Anda buka DevTools > Elements, cari <style>/<link>,
		* tidak ada → tampak "stylesheet tidak loaded" padahal sesungguhnya CSS
		* sudah ter-pakai. Elemen <style> nyata membuat inject gampang diverifikasi.
		*
		* Selain itu ini juga lebih andal daripada jalur CSSOM: beberapa browser
		* melempar SyntaxError dari replaceSync pada CSS modern mentah (nesting,
		* @starting-style, ::picker, position-area, dst) — yang dulu membuat
		* stylesheet diam-diam TIDAK pernah masuk DOM sama sekali.
		*
		* Id `<style>` dan dedupe-nya milik seam bersama (`Stylesheets`), sehingga
		* komponen yang dibangun DI LUAR registry (tabel di dalam field form) memakai
		* jalur injeksi yang sama dan tidak pernah menghasilkan style ganda.
		*/
		injectCssString(rawCss, normCss) {
			if (!rawCss || isStyleInjected(normCss)) return;
			injectLazyCss(rawCss, normCss);
		}
		setConfig(builderName, newConfig) {
			console.log(`[Registry Config Central] Storing live configuration inject request for: "${String(builderName)}"`);
			const existingConfig = this._dynamicConfigs.get(builderName) || {};
			this._dynamicConfigs.set(builderName, {
				...existingConfig,
				...newConfig,
				selectors: {
					...existingConfig.selectors || {},
					...newConfig.selectors || {}
				}
			});
			console.log(`[Registry Success] Configuration for "${String(builderName)}" officially sealed in dynamic config state.`);
		}
		clear() {
			this._dynamicConfigs.clear();
			this.registeredSheets = /* @__PURE__ */ new Set();
			getBuilderAdapter()?.resetCounters();
		}
		destroy() {}
		/**
		* Destroys every builder pinned inside a subtree the app is about to replace.
		*
		* @param root - The outgoing shell (or any subtree a page remembers).
		* @returns How many builder instances were destroyed.
		*
		* @summary The registry is where instances are created, so it is the natural door for
		*   releasing them: `AioApp` calls this on the tree it is about to swap out, and a page
		*   controller can call it from `onDestroy()` with its own shell. Idempotent — a
		*   builder is unpinned before its `destroy()` runs, so a second sweep does nothing.
		*/
		releaseBuilders(root) {
			return releaseBuilders(root);
		}
		getBuilderNode(nodes, name, visited = /* @__PURE__ */ new Set()) {
			if (typeof nodes !== "object" || nodes === null) return;
			if (visited.has(nodes)) return;
			visited.add(nodes);
			if ("builder" in nodes && nodes.builder === name) return nodes;
			if (Array.isArray(nodes)) for (const item of nodes) {
				const found = this.getBuilderNode(item, name, visited);
				if (found) return found;
			}
			else for (const key in nodes) if (Object.prototype.hasOwnProperty.call(nodes, key)) {
				const found = this.getBuilderNode(nodes[key], name, visited);
				if (found) return found;
			}
		}
	};
	_defineProperty(ComponentRegistry, "slot", "registry");
	// packages/core/src/app/AioApp.ts
	/** Storage key of the persisted theme id. Kept identical to the legacy key. */
	var THEME_STORAGE_KEY = "active_theme";
	/** Class added to the wrapper the shell creates when it owns menu/footer slots. */
	var SHELL_CLASS = "aio-shell";
	/** Placeholder entry-file fallback. */
	var DEFAULT_ROUTE = "home";
	/** Slots that must be registered before `render()` can run. */
	var REQUIRED_SLOTS = [
		"registry",
		"router",
		"renderer"
	];
	/** Canonical route key: trimmed, no leading `#`, no trailing slash, lower case. */
	function normalizeRoute(route, fallback = DEFAULT_ROUTE) {
		return ((typeof route === "string" ? route.trim().replace(/^#+/, "").replace(/\/+$/, "") : "") || fallback).toLowerCase();
	}
	/** A page document is recognised by its `blocks` list; anything else is a node tree. */
	function isPageDocument(value) {
		return !!value && typeof value === "object" && Array.isArray(value.blocks);
	}
	/**
	* Converts one block into a renderer node.
	*
	* A block is a component plus its payload, so it becomes a builder root. Only
	* keys the renderer reserves are emitted — a `source`/`query` binding is never
	* copied into the node, because the renderer would turn it into an attribute.
	* Filling a tabled block with records is the job of a controller (`onPrepare`)
	* or of a CMS transformer; the shell itself never fetches.
	*/
	function blockToNode(block) {
		const node = {
			builder: block.type,
			isRoot: true
		};
		if (block.id) node.id = block.id;
		if (block.className) node.className = block.className;
		if (block.attrs) node.attrs = block.attrs;
		const payload = (Array.isArray(block.children) && block.children.length ? block.children.map(blockToNode) : void 0) ?? block.props;
		if (payload !== void 0) node.content = payload;
		return node;
	}
	/** Normalises any page content into a node tree the renderer understands. */
	function pageToNode(page, route = "") {
		if (!isPageDocument(page)) return page;
		const id = page.route || route;
		const node = {
			tagName: "main",
			className: id ? `page route-${id}` : "page",
			content: (page.blocks ?? []).map(blockToNode)
		};
		if (page.theme) node.attrs = { "data-theme": page.theme };
		return node;
	}
	/** Resolves a container from a selector or an element, failing fast. */
	function resolveContainer(target) {
		const element = typeof target === "string" ? document.querySelector(target) : target;
		if (!(element instanceof HTMLElement)) throw new Error(`[AioApp] Container not found: ${String(target)}`);
		return element;
	}
	/**
	* Wraps the page in a shell, but only when the source declares menu/footer slots.
	*
	* A LITE page tree usually carries its own nav and footer, so the page itself stays the
	* root and the authored DOM remains byte-identical.
	*/
	function assembleShell(menu, page, footer) {
		if (!menu && !footer) return page;
		const shell = document.createElement("div");
		shell.className = SHELL_CLASS;
		if (menu) shell.appendChild(menu);
		shell.appendChild(page);
		if (footer) shell.appendChild(footer);
		return shell;
	}
	/** What `ctx.http` is when no data module was registered: a failure with a hint, not a crash. */
	var NO_HTTP = {
		get: () => Promise.reject(/* @__PURE__ */ new Error("[AioApp] No module registered for slot \"http\" (HttpService).")),
		post: () => Promise.reject(/* @__PURE__ */ new Error("[AioApp] No module registered for slot \"http\" (HttpService)."))
	};
	/**
	* Creates the port for one slot.
	*
	* An instance registration is used as-is; a class registration is constructed with
	* `(config, context)` — the single constructor rule of the module convention.
	*/
	function createPort(slot, registration, context) {
		if (!registration.module) return registration.instance;
		try {
			return new registration.module(registration.config, context);
		} catch (error) {
			throw new Error(`[AioApp] Failed to create module for slot "${slot}": ${error.message}`);
		}
	}
	var _source = /* @__PURE__ */ new WeakMap();
	var _containerTarget = /* @__PURE__ */ new WeakMap();
	var _defaultRoute = /* @__PURE__ */ new WeakMap();
	var _initialTheme = /* @__PURE__ */ new WeakMap();
	var _debug = /* @__PURE__ */ new WeakMap();
	var _pages = /* @__PURE__ */ new WeakMap();
	var _pageDefinitions = /* @__PURE__ */ new WeakMap();
	var _componentRoutes = /* @__PURE__ */ new WeakMap();
	var _registrations = /* @__PURE__ */ new WeakMap();
	var _controllers = /* @__PURE__ */ new WeakMap();
	var _active$2 = /* @__PURE__ */ new WeakMap();
	var _abort = /* @__PURE__ */ new WeakMap();
	var _ports = /* @__PURE__ */ new WeakMap();
	var _AioApp_brand = /* @__PURE__ */ new WeakSet();
	var _container = /* @__PURE__ */ new WeakMap();
	var _root = /* @__PURE__ */ new WeakMap();
	var _route = /* @__PURE__ */ new WeakMap();
	var _theme = /* @__PURE__ */ new WeakMap();
	var _fragment = /* @__PURE__ */ new WeakMap();
	var _sequence = /* @__PURE__ */ new WeakMap();
	var _rendered = /* @__PURE__ */ new WeakMap();
	var _pendingThemes = /* @__PURE__ */ new WeakMap();
	var AioApp = class {
		constructor(config) {
			_classPrivateMethodInitSpec(this, _AioApp_brand);
			_classPrivateFieldInitSpec(this, _source, void 0);
			_classPrivateFieldInitSpec(this, _containerTarget, void 0);
			_classPrivateFieldInitSpec(this, _defaultRoute, void 0);
			_classPrivateFieldInitSpec(this, _initialTheme, void 0);
			_classPrivateFieldInitSpec(this, _debug, void 0);
			_classPrivateFieldInitSpec(this, _pages, /* @__PURE__ */ new Map());
			_classPrivateFieldInitSpec(this, _pageDefinitions, /* @__PURE__ */ new Map());
			_classPrivateFieldInitSpec(this, _componentRoutes, /* @__PURE__ */ new Map());
			_classPrivateFieldInitSpec(this, _registrations, /* @__PURE__ */ new Map());
			_classPrivateFieldInitSpec(this, _controllers, /* @__PURE__ */ new Map());
			_classPrivateFieldInitSpec(this, _active$2, null);
			_classPrivateFieldInitSpec(this, _abort, null);
			_classPrivateFieldInitSpec(this, _ports, /* @__PURE__ */ new Map());
			_classPrivateFieldInitSpec(this, _container, null);
			_classPrivateFieldInitSpec(this, _root, null);
			_classPrivateFieldInitSpec(this, _route, "");
			_classPrivateFieldInitSpec(this, _theme, void 0);
			_classPrivateFieldInitSpec(this, _fragment, "");
			_classPrivateFieldInitSpec(this, _sequence, 0);
			_classPrivateFieldInitSpec(this, _rendered, false);
			_classPrivateFieldInitSpec(this, _pendingThemes, []);
			_classPrivateFieldSet2(_source, this, config.source ?? { pages: {} });
			_classPrivateFieldSet2(_containerTarget, this, config.container);
			_classPrivateFieldSet2(_defaultRoute, this, normalizeRoute(config.defaultRoute));
			_classPrivateFieldSet2(_initialTheme, this, config.theme || "default");
			_classPrivateFieldSet2(_theme, this, _classPrivateFieldGet2(_initialTheme, this));
			_classPrivateFieldSet2(_debug, this, config.debug === true);
			for (const [route, page] of Object.entries(_classPrivateFieldGet2(_source, this).pages ?? {})) _classPrivateFieldGet2(_pages, this).set(normalizeRoute(route), page);
		}
		/**
		* Theme controls: `app.theme.register(theme)` and `app.theme.use(id)`.
		*
		* A namespace rather than another `register*` method, because adding a theme does not
		* fill a slot or own a route — it appends to a collection that already has an owner.
		* `register()` works before or after `render()`; `use()` re-renders the current route
		* through the router so the URL and the stored choice stay truthful.
		*/
		get theme() {
			const app = this;
			return {
				register(theme) {
					_assertClassBrand(_AioApp_brand, app, _registerTheme).call(app, theme);
					return app;
				},
				use(themeId) {
					if (themeId === _classPrivateFieldGet2(_theme, app)) return;
					if (_get_router.call(_assertClassBrand(_AioApp_brand, app))) {
						_get_router.call(_assertClassBrand(_AioApp_brand, app)).navigate(_classPrivateFieldGet2(_route, app) || _classPrivateFieldGet2(_defaultRoute, app), themeId, _classPrivateFieldGet2(_fragment, app));
						return;
					}
					_classPrivateFieldSet2(_theme, app, themeId);
					_assertClassBrand(_AioApp_brand, app, _log).call(app, "theme:changed", {
						themeId,
						via: "direct"
					});
				},
				get ids() {
					return _get_themes.call(_assertClassBrand(_AioApp_brand, app))?.ids ?? [];
				},
				get current() {
					return _classPrivateFieldGet2(_theme, app);
				}
			};
		}
		/** Route currently rendered. Empty until `render()` finishes. */
		get currentRoute() {
			return _classPrivateFieldGet2(_route, this);
		}
		/** Root element of the mounted page, `null` before `render()`. */
		get shell() {
			return _classPrivateFieldGet2(_root, this);
		}
		/** Route list derived from content, controllers, and page definitions — what the router validates. */
		get routes() {
			return [.../* @__PURE__ */ new Set([
				..._classPrivateFieldGet2(_pages, this).keys(),
				..._classPrivateFieldGet2(_controllers, this).keys(),
				..._classPrivateFieldGet2(_pageDefinitions, this).keys()
			])];
		}
		/** Registers per-route behaviour or declarative page-level component definition. */
		registerPage(routeOrDefinition, controller, config) {
			if (_classPrivateFieldGet2(_rendered, this)) throw new Error("[AioApp] registerPage() must be called before render().");
			if (typeof routeOrDefinition === "object" && routeOrDefinition !== null) {
				const def = routeOrDefinition;
				const baseRoute = normalizeRoute(def.route);
				_classPrivateFieldGet2(_pageDefinitions, this).set(baseRoute, def);
				const requiredComponents = [.../* @__PURE__ */ new Set([def.builder, ...def.requires ?? []])].filter((name) => typeof name === "string" && name !== "");
				const merged = _classPrivateFieldGet2(_componentRoutes, this).get(baseRoute) ?? [];
				_classPrivateFieldGet2(_componentRoutes, this).set(baseRoute, [.../* @__PURE__ */ new Set([...merged, ...requiredComponents])]);
				if (Array.isArray(def.routes)) for (const sub of def.routes) {
					if (!sub.path) continue;
					const subRouteKey = `${baseRoute}/${sub.path.replace(/^\/+/, "")}`;
					_classPrivateFieldGet2(_pageDefinitions, this).set(subRouteKey, def);
					const subMerged = _classPrivateFieldGet2(_componentRoutes, this).get(subRouteKey) ?? [];
					_classPrivateFieldGet2(_componentRoutes, this).set(subRouteKey, [.../* @__PURE__ */ new Set([...subMerged, ...requiredComponents])]);
				}
				return this;
			}
			const key = normalizeRoute(routeOrDefinition);
			if (_classPrivateFieldGet2(_controllers, this).has(key)) console.warn(`[AioApp] Route "${key}" already has a controller; replacing it.`);
			if (!controller) throw new Error(`[AioApp] Controller class required when registering route "${key}".`);
			_classPrivateFieldGet2(_controllers, this).set(key, {
				module: controller,
				config
			});
			return this;
		}
		registerModule(target, config) {
			if (_classPrivateFieldGet2(_rendered, this)) throw new Error("[AioApp] registerModule() must be called before render().");
			const isClass = typeof target === "function";
			const plan = !isClass && Array.isArray(config) ? config : null;
			const slot = isClass ? target.slot : plan ? target?.constructor?.slot : config ?? target?.constructor?.slot;
			if (!slot) throw new Error("[AioApp] Cannot tell which slot this module fills. Add `static readonly slot = \"<slot>\"` to a class, or pass the slot as the second argument: registerModule(instance, \"router\").");
			if (plan) {
				if (slot !== "registry") throw new Error(`[AioApp] A component plan belongs to the "registry" slot, not "${slot}".`);
				for (const entry of plan) {
					if (!entry?.route || !Array.isArray(entry.components)) throw new Error("[AioApp] Every component route needs { route, components: [] }.");
					const route = normalizeRoute(entry.route);
					const merged = _classPrivateFieldGet2(_componentRoutes, this).get(route) ?? [];
					_classPrivateFieldGet2(_componentRoutes, this).set(route, [.../* @__PURE__ */ new Set([...merged, ...entry.components])]);
				}
			}
			if (_classPrivateFieldGet2(_registrations, this).has(slot)) console.warn(`[AioApp] Slot "${slot}" already has a module; replacing it.`);
			_classPrivateFieldGet2(_registrations, this).set(slot, {
				module: isClass ? target : null,
				config: isClass ? config : void 0,
				instance: isClass ? null : target
			});
			return this;
		}
		/**
		* Resolves the container, creates the registered modules and renders the route the URL
		* already points at.
		*
		* `render`, not `mount`: this call does not attach something that already exists — it is
		* the entry point that turns a source description plus a URL into a live DOM tree. It runs
		* once; later route changes go through the router.
		*
		* Modules are created here, not at registration, because a module may need data that only
		* exists at this moment (the route list, the restored theme, the change callback).
		*/
		async render() {
			if (_classPrivateFieldGet2(_rendered, this)) return;
			_classPrivateFieldSet2(_container, this, resolveContainer(_classPrivateFieldGet2(_containerTarget, this)));
			_assertClassBrand(_AioApp_brand, this, _createModules).call(this);
			_classPrivateFieldSet2(_rendered, this, true);
			_assertClassBrand(_AioApp_brand, this, _log).call(this, "render:init", {
				routes: this.routes,
				theme: _classPrivateFieldGet2(_theme, this),
				slots: [..._classPrivateFieldGet2(_registrations, this).keys()]
			});
			const initial = _get_router.call(_assertClassBrand(_AioApp_brand, this)).parseUrlHash();
			await _assertClassBrand(_AioApp_brand, this, _renderRoute).call(this, initial.route, initial.fragment);
		}
		/** Navigates through the router so the URL stays the single source of truth. */
		navigate(route, fragment = "") {
			if (!_get_router.call(_assertClassBrand(_AioApp_brand, this))) return;
			_get_router.call(_assertClassBrand(_AioApp_brand, this)).navigate(route, _classPrivateFieldGet2(_theme, this), fragment);
		}
		/** Runs controller teardown, cancels in-flight work, releases modules, unmounts. */
		destroy() {
			_classPrivateFieldGet2(_abort, this)?.abort();
			_assertClassBrand(_AioApp_brand, this, _release$2).call(this);
			_get_events.call(_assertClassBrand(_AioApp_brand, this))?.emit("destroyed", { route: _classPrivateFieldGet2(_route, this) });
			_assertClassBrand(_AioApp_brand, this, _releasePorts).call(this, [..._classPrivateFieldGet2(_ports, this).keys()].reverse());
			_classPrivateFieldGet2(_root, this)?.remove();
			_classPrivateFieldSet2(_root, this, null);
			_classPrivateFieldSet2(_container, this, null);
			_classPrivateFieldGet2(_controllers, this).clear();
			_classPrivateFieldSet2(_rendered, this, false);
			_classPrivateFieldSet2(_route, this, "");
			_assertClassBrand(_AioApp_brand, this, _log).call(this, "destroy", {});
		}
	};
	function _get_registry() {
		return _classPrivateFieldGet2(_ports, this).get("registry") ?? null;
	}
	function _get_router() {
		return _classPrivateFieldGet2(_ports, this).get("router") ?? null;
	}
	function _get_renderer() {
		return _classPrivateFieldGet2(_ports, this).get("renderer") ?? null;
	}
	function _get_animation() {
		return _classPrivateFieldGet2(_ports, this).get("animation") ?? null;
	}
	function _get_events() {
		return _classPrivateFieldGet2(_ports, this).get("events") ?? null;
	}
	function _get_storage() {
		return _classPrivateFieldGet2(_ports, this).get("storage") ?? null;
	}
	function _get_themes() {
		return _classPrivateFieldGet2(_ports, this).get("theme") ?? null;
	}
	/** Data access degrades to a loud stub instead of `undefined` at the call site. */
	function _get_http() {
		return _classPrivateFieldGet2(_ports, this).get("http") ?? NO_HTTP;
	}
	function _registerTheme(theme) {
		if (!_get_themes.call(_assertClassBrand(_AioApp_brand, this))) {
			_classPrivateFieldGet2(_pendingThemes, this).push(theme);
			return;
		}
		if (typeof _get_themes.call(_assertClassBrand(_AioApp_brand, this)).register !== "function") throw new Error(`[AioApp] The registered theme module cannot accept "${theme?.themeId ?? "?"}" after render: its port has no register(). Pass the themes in registerModule(ThemeRenderer, { themes }).`);
		_get_themes.call(_assertClassBrand(_AioApp_brand, this)).register(theme);
		_assertClassBrand(_AioApp_brand, this, _log).call(this, "theme:registered", { themeId: theme.themeId });
	}
	/**
	* Creates every registered module in two phases.
	*
	* Storage goes first: the persisted theme has to be known *before* the router is
	* built, because a router is constructed with its initial theme. Everything else
	* then follows registration order.
	*/
	function _createModules() {
		const context = {
			routes: this.routes,
			defaultRoute: _classPrivateFieldGet2(_defaultRoute, this),
			theme: _classPrivateFieldGet2(_initialTheme, this),
			debug: _classPrivateFieldGet2(_debug, this),
			onRouteChanged: (state) => _assertClassBrand(_AioApp_brand, this, _onRouteChanged).call(this, state)
		};
		const missing = REQUIRED_SLOTS.filter((slot) => !_classPrivateFieldGet2(_registrations, this).has(slot));
		if (missing.length) throw new Error(`[AioApp] Missing required module(s): ${missing.join(", ")}. Register them with registerModule(...) before render().`);
		const storage = _classPrivateFieldGet2(_registrations, this).get("storage");
		if (storage) {
			_classPrivateFieldGet2(_ports, this).set("storage", createPort("storage", storage, context));
			const persisted = _get_storage.call(_assertClassBrand(_AioApp_brand, this))?.get(THEME_STORAGE_KEY);
			if (persisted) {
				_classPrivateFieldSet2(_theme, this, persisted);
				context.theme = persisted;
			}
		}
		const created = storage ? ["storage"] : [];
		try {
			for (const [slot, registration] of _classPrivateFieldGet2(_registrations, this)) {
				if (slot === "storage") continue;
				_classPrivateFieldGet2(_ports, this).set(slot, createPort(slot, registration, context));
				created.push(slot);
			}
		} catch (error) {
			_assertClassBrand(_AioApp_brand, this, _releasePorts).call(this, created.reverse());
			throw error;
		}
		for (const theme of _classPrivateFieldGet2(_pendingThemes, this)) _assertClassBrand(_AioApp_brand, this, _registerTheme).call(this, theme);
		_classPrivateFieldSet2(_pendingThemes, this, []);
		_get_registry.call(_assertClassBrand(_AioApp_brand, this))?.useEmitter?.((event, data) => _get_events.call(_assertClassBrand(_AioApp_brand, this))?.emit(event, data));
		_assertClassBrand(_AioApp_brand, this, _log).call(this, "modules:created", { slots: created });
	}
	/**
	* Releases ports in the given order and forgets them.
	*
	* A port owns its resources when it exposes `destroy()`; nothing else is assumed, so a
	* module that needs no teardown simply has no such method.
	*/
	function _releasePorts(slots) {
		for (const slot of slots) {
			const port = _classPrivateFieldGet2(_ports, this).get(slot);
			_classPrivateFieldGet2(_ports, this).delete(slot);
			if (!port || typeof port.destroy !== "function") continue;
			try {
				port.destroy();
			} catch (error) {
				console.error(`[AioApp] destroy of module "${slot}" failed:`, error);
			}
		}
	}
	function _onRouteChanged(state) {
		if (state.theme && state.theme !== _classPrivateFieldGet2(_theme, this)) {
			const previous = _classPrivateFieldGet2(_theme, this);
			_classPrivateFieldSet2(_theme, this, state.theme);
			_get_storage.call(_assertClassBrand(_AioApp_brand, this))?.set(THEME_STORAGE_KEY, state.theme);
			try {
				_get_themes.call(_assertClassBrand(_AioApp_brand, this))?.use?.(state.theme);
			} catch (error) {
				console.error("[AioApp] theme switch failed:", error);
			}
			_get_events.call(_assertClassBrand(_AioApp_brand, this))?.emit("themeChanged", {
				theme: state.theme,
				previous,
				shell: _classPrivateFieldGet2(_root, this)
			});
			_assertClassBrand(_AioApp_brand, this, _log).call(this, "themeChanged", { theme: state.theme });
		}
		return _assertClassBrand(_AioApp_brand, this, _renderRoute).call(this, state.route, state.fragment);
	}
	/**
	* One complete render pass: instantiate controller, prepare, preload, render, swap.
	*
	* Every step after an `await` re-checks the sequence number, and the pass carries an
	* `AbortSignal` that fires as soon as a newer navigation starts — so a slow fetch can
	* never paint over the route the visitor already moved to.
	*/
	async function _renderRoute(route, fragment) {
		var _this$sequence;
		const sequence = _classPrivateFieldSet2(_sequence, this, (_this$sequence = _classPrivateFieldGet2(_sequence, this), ++_this$sequence));
		const target = _assertClassBrand(_AioApp_brand, this, _resolveRoute).call(this, route);
		_get_events.call(_assertClassBrand(_AioApp_brand, this))?.emit("pageChanged", {
			route: target,
			previous: _classPrivateFieldGet2(_route, this) || null
		});
		_assertClassBrand(_AioApp_brand, this, _log).call(this, "render:start", {
			route: target,
			sequence
		});
		_classPrivateFieldGet2(_abort, this)?.abort();
		const abort = _classPrivateFieldSet2(_abort, this, new AbortController());
		try {
			_assertClassBrand(_AioApp_brand, this, _release$2).call(this);
			const { controller, context } = _assertClassBrand(_AioApp_brand, this, _createPage).call(this, target, fragment, abort.signal);
			let prepared = void 0;
			if (controller?.onPrepare) try {
				prepared = await controller.onPrepare(context);
			} catch (error) {
				if (!context.signal.aborted) _assertClassBrand(_AioApp_brand, this, _fail).call(this, target, "prepare", "onPrepare failed", error);
			}
			if (sequence !== _classPrivateFieldGet2(_sequence, this)) return _assertClassBrand(_AioApp_brand, this, _supersede).call(this, target, sequence);
			const page = prepared ?? context.page;
			if (!page) throw new Error(`[AioApp] Route "${target}" has no page: declare it in source.pages or return one from onPrepare().`);
			const themed = _get_themes.call(_assertClassBrand(_AioApp_brand, this))?.prepare(page, target, _classPrivateFieldGet2(_theme, this)) ?? page;
			const pageNode = pageToNode(themed, target);
			const menuNode = _assertClassBrand(_AioApp_brand, this, _menu).call(this, controller);
			const footerNode = _classPrivateFieldGet2(_source, this).footer ?? null;
			const nodes = [
				menuNode,
				pageNode,
				footerNode
			].filter(Boolean);
			const names = [.../* @__PURE__ */ new Set([..._classPrivateFieldGet2(_componentRoutes, this).get(target) ?? [], ..._get_registry.call(_assertClassBrand(_AioApp_brand, this)).collect(nodes)])];
			const known = names.filter((name) => _get_registry.call(_assertClassBrand(_AioApp_brand, this)).has(name));
			const missing = names.filter((name) => !_get_registry.call(_assertClassBrand(_AioApp_brand, this)).has(name));
			_assertClassBrand(_AioApp_brand, this, _log).call(this, "preload", {
				route: target,
				components: names,
				missing,
				sequence
			});
			_get_events.call(_assertClassBrand(_AioApp_brand, this))?.emit("beforeRender", {
				route: target,
				components: names,
				missing,
				sequence
			});
			if (known.length) await _get_registry.call(_assertClassBrand(_AioApp_brand, this)).load(known, nodes);
			if (sequence !== _classPrivateFieldGet2(_sequence, this)) return _assertClassBrand(_AioApp_brand, this, _supersede).call(this, target, sequence);
			const pageEl = _assertClassBrand(_AioApp_brand, this, _renderNode).call(this, pageNode);
			if (!pageEl) throw new Error(`[AioApp] Renderer returned no element for route "${target}"`);
			const menuEl = menuNode ? _assertClassBrand(_AioApp_brand, this, _renderNode).call(this, menuNode) : null;
			const footerEl = footerNode ? _assertClassBrand(_AioApp_brand, this, _renderNode).call(this, footerNode) : null;
			const tree = assembleShell(menuEl, pageEl, footerEl);
			_classPrivateFieldSet2(_route, this, target);
			_classPrivateFieldSet2(_fragment, this, fragment || "");
			_assertClassBrand(_AioApp_brand, this, _paint).call(this, tree, themed);
			if (sequence !== _classPrivateFieldGet2(_sequence, this)) return _assertClassBrand(_AioApp_brand, this, _supersede).call(this, target, sequence);
			const blocks = _assertClassBrand(_AioApp_brand, this, _ready).call(this, target, themed, tree, controller, menuEl, footerEl);
			_get_events.call(_assertClassBrand(_AioApp_brand, this))?.emit("ready", {
				route: target,
				shell: tree,
				elements: blocks,
				sequence
			});
			_assertClassBrand(_AioApp_brand, this, _log).call(this, "render:done", {
				route: target,
				sequence
			});
		} catch (error) {
			if (abort.signal.aborted) return _assertClassBrand(_AioApp_brand, this, _supersede).call(this, target, sequence);
			_assertClassBrand(_AioApp_brand, this, _fail).call(this, target, "render", "Render failed", error);
		}
	}
	/** Creates the controller for this pass and the context handed to it. */
	function _createPage(route, fragment, signal) {
		let pageDef = _classPrivateFieldGet2(_pageDefinitions, this).get(route);
		let matchedBaseRoute = route;
		if (!pageDef && route.includes("/")) {
			const base = route.split("/")[0];
			const candidateDef = _classPrivateFieldGet2(_pageDefinitions, this).get(base);
			if (candidateDef) {
				pageDef = candidateDef;
				matchedBaseRoute = base;
			}
		}
		const declared = _classPrivateFieldGet2(_pages, this).get(route) ?? (pageDef?.builder ? { [pageDef.builder]: { builder: pageDef.builder } } : null);
		const context = {
			route,
			page: declared,
			fragment,
			theme: _classPrivateFieldGet2(_theme, this),
			builders: [.../* @__PURE__ */ new Set([..._classPrivateFieldGet2(_componentRoutes, this).get(route) ?? _classPrivateFieldGet2(_componentRoutes, this).get(matchedBaseRoute) ?? [], ...declared ? _get_registry.call(_assertClassBrand(_AioApp_brand, this)).collect(pageToNode(declared, route)) : []])],
			http: _get_http.call(_assertClassBrand(_AioApp_brand, this)),
			signal
		};
		const entry = _classPrivateFieldGet2(_controllers, this).get(route);
		if (entry) {
			const controller = new entry.module(entry.config, context);
			_classPrivateFieldSet2(_active$2, this, controller);
			return {
				controller,
				context
			};
		}
		if (pageDef) {
			const subPath = route.split("/").slice(1).join("/");
			const params = {};
			if (Array.isArray(pageDef.routes)) {
				for (const spec of pageDef.routes) if (spec.path.startsWith(":") && subPath) {
					const paramKey = spec.path.slice(1);
					params[paramKey] = subPath;
				}
			}
			const app = this;
			const port = {
				route,
				subPath,
				params,
				fragment,
				data: {},
				navigate: (r, f) => app.navigate(r, f),
				build: (name, data) => _get_registry.call(_assertClassBrand(_AioApp_brand, app)).build(name, data),
				events: _get_events.call(_assertClassBrand(_AioApp_brand, app)) ?? {
					emit: () => {},
					on: () => {}
				},
				signal
			};
			let customControllerInstance = null;
			if (pageDef.controller) customControllerInstance = new pageDef.controller(port);
			const controller = {
				async onPrepare(ctx) {
					if (Array.isArray(pageDef.data) && pageDef.data.length > 0) {
						for (const item of pageDef.data) if (item.sheet) try {
							const res = await ctx.http.get({
								table: item.sheet,
								...item.query ?? {}
							});
							port.data[item.id] = res;
						} catch (err) {
							console.warn(`[AioApp] failed loading data for sheet "${item.sheet}":`, err);
						}
					}
					return ctx.page ?? void 0;
				},
				onReady(readyCtx) {
					customControllerInstance?.onReady?.(readyCtx.shell);
				},
				onDestroy() {
					customControllerInstance?.onDestroy?.();
				}
			};
			_classPrivateFieldSet2(_active$2, this, controller);
			return {
				controller,
				context
			};
		}
		return {
			controller: null,
			context
		};
	}
	/** Lets the controller rewrite the menu node. The app calls it, once per render. */
	function _menu(controller) {
		const menu = _classPrivateFieldGet2(_source, this).menu ?? null;
		if (!menu || !controller?.attachMenu || menu instanceof HTMLElement) return menu;
		try {
			return controller.attachMenu(menu);
		} catch (error) {
			console.error("[AioApp] attachMenu failed:", error);
			return menu;
		}
	}
	/**
	* Reports the mounted page to its controller and to the theme.
	*
	* @returns The `id → element` map of the painted shell — the same map the caller
	*   publishes with `ready`, so a listener sees what the controller saw.
	*/
	function _ready(route, page, shell, controller, menu, footer) {
		const blocks = /* @__PURE__ */ new Map();
		for (const element of shell.querySelectorAll("[id]")) blocks.set(element.id, element);
		try {
			_get_themes.call(_assertClassBrand(_AioApp_brand, this))?.activate(shell, blocks, route);
		} catch (error) {
			console.error(`[AioApp] theme activate failed for route "${route}":`, error);
		}
		if (!controller?.onReady) return blocks;
		const context = {
			route,
			page,
			shell,
			menu,
			footer,
			blocks
		};
		try {
			controller.onReady(context);
		} catch (error) {
			console.error(`[AioApp] onReady failed for route "${route}":`, error);
			_assertClassBrand(_AioApp_brand, this, _fail).call(this, route, "ready", "onReady failed", error);
		}
		return blocks;
	}
	/**
	* Releases the controller being replaced.
	*
	* Runs at the start of every render pass. `onDestroy` means "this controller is being
	* superseded", not "this route name is going away": the same route re-renders on a
	* fragment switch and on a theme switch, and both create a new instance.
	*/
	function _release$2() {
		const controller = _classPrivateFieldGet2(_active$2, this);
		_classPrivateFieldSet2(_active$2, this, null);
		if (_classPrivateFieldGet2(_root, this)) try {
			_get_themes.call(_assertClassBrand(_AioApp_brand, this))?.deactivate?.(_classPrivateFieldGet2(_root, this));
		} catch (error) {
			console.error("[AioApp] theme deactivate failed:", error);
		}
		if (!controller?.onDestroy) return;
		try {
			controller.onDestroy();
		} catch (error) {
			console.error("[AioApp] onDestroy failed:", error);
		}
	}
	/** Builds the renderer callbacks once and reuses them for nested nodes. */
	function _renderNode(node) {
		const renderer = _get_renderer.call(_assertClassBrand(_AioApp_brand, this));
		if (!renderer) throw new Error("[AioApp] No renderer module registered for slot \"renderer\".");
		const renderFn = (child) => renderer.render(child, renderFn, buildFn);
		const buildFn = (name, data) => {
			if (!_get_registry.call(_assertClassBrand(_AioApp_brand, this)).has(name)) {
				_assertClassBrand(_AioApp_brand, this, _log).call(this, "miss", { component: name });
				return null;
			}
			return _get_registry.call(_assertClassBrand(_AioApp_brand, this)).build(name, data);
		};
		return renderer.render(node, renderFn, buildFn, { scopeId: _classPrivateFieldGet2(_route, this) });
	}
	/**
	* Builds the tree and paints it.
	*
	* These steps are never used apart — replace the children, set the title, release any
	* scroll lock a previous route left, animate, honour a deep link — so they live in one
	* place instead of a chain of one-call helpers.
	*/
	function _paint(tree, page) {
		const container = _classPrivateFieldGet2(_container, this);
		if (!container) return;
		if (_classPrivateFieldGet2(_root, this)) _get_registry.call(_assertClassBrand(_AioApp_brand, this))?.releaseBuilders?.(_classPrivateFieldGet2(_root, this));
		container.replaceChildren(tree);
		_classPrivateFieldSet2(_root, this, tree);
		document.body.style.overflow = "";
		const title = isPageDocument(page) ? page.title : void 0;
		if (title) document.title = title;
		_get_animation.call(_assertClassBrand(_AioApp_brand, this))?.init(tree);
		const fragment = _classPrivateFieldGet2(_fragment, this);
		_classPrivateFieldSet2(_fragment, this, "");
		if (!fragment || typeof requestAnimationFrame !== "function") return;
		requestAnimationFrame(() => {
			document.getElementById(fragment)?.scrollIntoView({
				block: "start",
				behavior: "auto"
			});
		});
	}
	/** Reports a failed pass. The previous DOM stays mounted on purpose. */
	function _fail(route, phase, message, error) {
		console.error(`[AioApp] ${message} for route "${route}":`, error);
		_get_events.call(_assertClassBrand(_AioApp_brand, this))?.emit("error", {
			message,
			route,
			phase,
			error
		});
	}
	/** Reports a pass a newer navigation replaced. Nothing is painted from it. */
	function _supersede(route, sequence) {
		_assertClassBrand(_AioApp_brand, this, _log).call(this, "render:superseded", {
			route,
			sequence
		});
		_get_events.call(_assertClassBrand(_AioApp_brand, this))?.emit("superseded", {
			route,
			sequence,
			by: _classPrivateFieldGet2(_sequence, this)
		});
	}
	/** Falls back to the default route, then to the first known route, for an unknown hash. */
	function _resolveRoute(route) {
		const known = (name) => {
			if (_classPrivateFieldGet2(_pages, this).has(name) || _classPrivateFieldGet2(_controllers, this).has(name) || _classPrivateFieldGet2(_pageDefinitions, this).has(name)) return true;
			if (name.includes("/")) {
				const base = name.split("/")[0];
				if (_classPrivateFieldGet2(_pageDefinitions, this).has(base)) return true;
			}
			return false;
		};
		const candidate = normalizeRoute(route, _classPrivateFieldGet2(_defaultRoute, this));
		if (known(candidate)) return candidate;
		if (known(_classPrivateFieldGet2(_defaultRoute, this))) return _classPrivateFieldGet2(_defaultRoute, this);
		return this.routes[0] ?? _classPrivateFieldGet2(_defaultRoute, this);
	}
	function _log(event, payload) {
		if (!_classPrivateFieldGet2(_debug, this)) return;
		console.debug(`[AioApp] ${event}`, payload);
	}
	// packages/core/src/app/modules.ts
	var _driver = /* @__PURE__ */ new WeakMap();
	var _memory = /* @__PURE__ */ new WeakMap();
	/**
	* The `storage` port.
	*
	* The driver is wrapped instead of used directly: `localStorage` throws in private
	* mode and inside a sandboxed iframe, and a saved theme is never worth a broken page.
	* Without a driver the port stays usable and simply forgets between reloads.
	*/
	var AppStorage = class {
		constructor(config = {}) {
			_classPrivateFieldInitSpec(this, _driver, void 0);
			_classPrivateFieldInitSpec(this, _memory, /* @__PURE__ */ new Map());
			_classPrivateFieldSet2(_driver, this, config.driver);
		}
		get(key) {
			if (!_classPrivateFieldGet2(_driver, this)) return _classPrivateFieldGet2(_memory, this).get(key) ?? null;
			try {
				return _classPrivateFieldGet2(_driver, this).getItem(key);
			} catch {
				return null;
			}
		}
		set(key, value) {
			if (!_classPrivateFieldGet2(_driver, this)) {
				_classPrivateFieldGet2(_memory, this).set(key, value);
				return;
			}
			try {
				_classPrivateFieldGet2(_driver, this).setItem(key, value);
			} catch {}
		}
	};
	_defineProperty(AppStorage, "slot", "storage");
	// packages/core/src/TemplateRegistry.ts
	var _handlers = /* @__PURE__ */ new WeakMap();
	var _TemplateRegistry_brand = /* @__PURE__ */ new WeakSet();
	/**
	* Template store.
	*
	* Keys are `themeId:selectorKey`: a theme overrides one token at a time, and the same
	* token may be overridden by several themes.
	*/
	var TemplateRegistry = class {
		constructor() {
			_classPrivateMethodInitSpec(this, _TemplateRegistry_brand);
			_classPrivateFieldInitSpec(this, _handlers, new Registry("template", { duplicate: "replace" }));
		}
		/** Number of registered overrides. */
		get size() {
			return _classPrivateFieldGet2(_handlers, this).size;
		}
		/**
		* Resolves the override for a theme token.
		*
		* @param themeId - Theme that owns the override, e.g. `"cyberpunk"`.
		* @param key - Selector token, e.g. `"@masonry>item"`.
		* @param fallback - Handler to use when the theme has no override.
		*/
		resolve(themeId, key, fallback) {
			return _classPrivateFieldGet2(_handlers, this).resolve(_assertClassBrand(_TemplateRegistry_brand, this, _key).call(this, themeId, key)) ?? fallback;
		}
		/** Registers (or replaces) an override. */
		register(themeId, key, handler) {
			_classPrivateFieldGet2(_handlers, this).register(_assertClassBrand(_TemplateRegistry_brand, this, _key).call(this, themeId, key), handler);
		}
		/** Removes an override. Returns whether something was removed. */
		unregister(themeId, key) {
			return _classPrivateFieldGet2(_handlers, this).unregister(_assertClassBrand(_TemplateRegistry_brand, this, _key).call(this, themeId, key));
		}
		/** Removes every override. */
		clear() {
			_classPrivateFieldGet2(_handlers, this).clear();
		}
		/** All keys, for the debug channel. */
		keys() {
			return _classPrivateFieldGet2(_handlers, this).ids();
		}
	};
	function _key(themeId, key) {
		return `${themeId}:${key}`;
	}
	var installed = new TemplateRegistry();
	/**
	* Installs the store `Base` and `DOMRenderer` read from.
	*
	* A theme package calls this with its own instance; passing `null` restores a fresh
	* empty store, which is what a test or an app teardown wants.
	*/
	function setTemplates(registry) {
		installed = registry ?? new TemplateRegistry();
	}
	/** The store currently in use. Never `null`, so callers need no guard. */
	function getTemplates() {
		return installed;
	}
	// packages/core/src/DOMRenderer/index.ts
	var _cleanupMap = /* @__PURE__ */ new WeakMap();
	var DOMRenderer = class {
		constructor(config) {
			_defineProperty(this, "config", void 0);
			_classPrivateFieldInitSpec(this, _cleanupMap, /* @__PURE__ */ new Map());
			_defineProperty(this, "records", []);
			const defaultConfig = {
				selectors: {
					container: {
						tagName: "main",
						name: `page`,
						className: "page"
					},
					grid: {
						tagName: "div",
						isClass: true,
						name: "grid",
						className: "grid"
					},
					row: {
						tagName: "div",
						isClass: true,
						name: "row",
						className: "row"
					},
					column: {
						tagName: "div",
						isClass: true,
						name: "column",
						className: "column"
					}
				},
				separator: {
					id: "#",
					class: ".",
					ignored: "$",
					include: "-"
				}
			};
			this.config = {
				...defaultConfig,
				...config,
				selectors: {
					...defaultConfig.selectors,
					...config?.selectors
				}
			};
		}
		parseKey(key) {
			const { id: idSep, class: classSep, ignored } = this.config.separator;
			let cleanKey = key.includes(ignored) ? key.split(ignored)[0] : key;
			const parsedAttrs = {};
			const attrRegex = /\[\s*([a-zA-Z0-8_-]+)\s*=\s*['"]?([^'"]*)['"]?\s*\]/g;
			let attrMatch;
			while ((attrMatch = attrRegex.exec(cleanKey)) !== null) {
				const attrName = attrMatch[1];
				parsedAttrs[attrName] = attrMatch[2];
			}
			cleanKey = cleanKey.replace(/\[[^\]]*\]/g, "");
			const escId = idSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
			const escClass = classSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
			const baseNameMatch = cleanKey.match(new RegExp(`^([^${escId}${escClass}]+)`));
			let baseName = baseNameMatch ? baseNameMatch[1] : "div";
			const idMatch = cleanKey.match(new RegExp(`${escId}([^${escId}${escClass}]+)`));
			const id = idMatch ? idMatch[1] : void 0;
			const classRegex = new RegExp(`${escClass}([^${escId}${escClass}]+)`, "g");
			let classNames = [];
			let match;
			while ((match = classRegex.exec(cleanKey)) !== null) classNames.push(match[1]);
			return {
				id,
				classNames,
				baseName: baseName.replace(/-/g, " "),
				parsedAttrs
			};
		}
		/**
		* Main compilation gateway that transforms declarative iNodeContent schemas into live DOM trees.
		*/
		render(content, renderFn, builderFn, options) {
			const fragment = document.createDocumentFragment();
			this.records = [];
			this.buildStructure(content, fragment, renderFn, builderFn, {
				scopeId: options?.scopeId || "",
				parentKey: options?.parentKey || null,
				pathMap: /* @__PURE__ */ new Map()
			});
			let rootElement;
			if (fragment.childNodes.length === 1 && fragment.firstChild instanceof HTMLElement) rootElement = fragment.firstChild;
			else {
				rootElement = document.createElement("div");
				rootElement.appendChild(fragment);
			}
			setMetadata$1(rootElement, this.records, "");
			return rootElement;
		}
		buildStructure(structure, parentNode, renderFn, builderFn, context = {
			scopeId: "",
			parentKey: null,
			pathMap: /* @__PURE__ */ new Map()
		}) {
			const flatNodesMap = /* @__PURE__ */ new Map();
			for (const [key, value] of Object.entries(structure)) {
				if (!value || typeof value !== "object") continue;
				const pathParts = key.split(">");
				const isHierarchical = pathParts.length > 1;
				const cleanKeyForParsing = isHierarchical ? pathParts[pathParts.length - 1] : key;
				const { id, classNames, baseName, parsedAttrs } = this.parseKey(cleanKeyForParsing);
				if (isHierarchical) {
					const parentValue = structure[pathParts.slice(0, -1).join(">")];
					if (parentValue && (parentValue.isArray || key.includes("$isArray"))) continue;
				}
				let targetSelectorKey = key;
				if (!value.builder && (value.content instanceof HTMLElement || value.isRoot)) targetSelectorKey = value.content instanceof HTMLElement ? value.content.tagName.toLowerCase() : baseName;
				const relayKey = ensureMetadataIdentity$1(targetSelectorKey, context.scopeId, "", key).key;
				const relayedElement = globalThis.ElementCreatedEventBus?.relay?.(relayKey);
				let currentElement = relayedElement || this.nodeFactory(baseName, value);
				if (relayedElement) currentElement.replaceChildren();
				if (typeof value.builder === "string" && value.isRoot === true && typeof value.onCreated !== "function" && !!builderFn) {
					const builtRoot = builderFn(value.builder, value);
					if (builtRoot && builtRoot !== currentElement) currentElement = builtRoot;
					else if (!builtRoot) value.builder;
				}
				this.attributeProcessor(currentElement, value, id, classNames, parsedAttrs);
				const identity = ensureMetadataIdentity$1(targetSelectorKey, context.scopeId, "", key);
				const currentGlobalKey = identity.key;
				let resolvedParentKey = context.parentKey;
				if (isHierarchical) {
					const parentPathKey = pathParts.slice(0, -1).join(">");
					resolvedParentKey = context.pathMap.get(parentPathKey) || context.parentKey;
				}
				identity.tree.parent = resolvedParentKey;
				context.pathMap.set(key, identity.key);
				this.attachMetadata(currentGlobalKey, currentElement, value, identity.tree);
				this.mountHandler(currentGlobalKey, currentElement, identity.tree);
				this.contentEvaluator(currentElement, value, renderFn, builderFn, {
					scopeId: context.scopeId,
					parentKey: currentGlobalKey,
					pathMap: context.pathMap
				});
				flatNodesMap.set(key, currentElement);
				if (isHierarchical) {
					const parentPathKey = pathParts.slice(0, -1).join(">");
					const parentElement = flatNodesMap.get(parentPathKey);
					if (parentElement) {
						parentElement.appendChild(currentElement);
						continue;
					}
				}
				const reservedKeys = [
					"content",
					"onCreated",
					"onDestroy",
					"builder",
					"attrs",
					"attributes",
					"isRoot",
					"isArray",
					"config",
					"selectors",
					"options"
				];
				const childKeys = Object.keys(value).filter((k) => !reservedKeys.includes(k));
				if (childKeys.length > 0) {
					const subFragment = document.createDocumentFragment();
					const childStructure = {};
					for (const childKey of childKeys) childStructure[childKey] = value[childKey];
					this.buildStructure(childStructure, subFragment, renderFn, builderFn, {
						scopeId: context.scopeId,
						parentKey: currentGlobalKey,
						pathMap: context.pathMap
					});
					currentElement.appendChild(subFragment);
				}
				this.lifecycleManager(currentElement, value, renderFn, builderFn);
				parentNode.appendChild(currentElement);
			}
		}
		/**
		* 👑 ATTACH METADATA (SATU-SATUNYA PUSAT PENGENDALIAN MEMORI MARKUP MANUAL ANDA!)
		* Sekarang bertindak sebagai gerbang tunggal: Mencatat silsilah, menjahit children dua arah,
		* dan langsung menyuntikkan tangki lazy closure getMetadata ke kulit ari elemen!
		*/
		attachMetadata(globalKey, el, val, tree) {
			const elementSelector = (() => {
				return `${el.tagName ? el.tagName.toLowerCase() : "div"}${el.id ? `#${el.id}` : ""}${el.className && typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).filter(Boolean).join(".")}` : ""}`;
			})();
			const builderName = typeof val?.builder === "string" ? val.builder : null;
			const isBuilderRoot = !!builderName && !!val?.isRoot;
			const effectiveGlobalKey = globalKey;
			const builderTemplateKey = isBuilderRoot ? `@${builderName}` : null;
			const manualMarkupRecordItem = {
				key: globalKey,
				element: el,
				payload: null,
				relations: tree
			};
			if (manualMarkupRecordItem.relations) {
				if (isBuilderRoot) {
					manualMarkupRecordItem.relations.key = elementSelector;
					manualMarkupRecordItem.relations.template = builderTemplateKey || manualMarkupRecordItem.relations.template || elementSelector;
				} else manualMarkupRecordItem.relations.template = manualMarkupRecordItem.relations.template || manualMarkupRecordItem.relations.key;
			}
			this.records.push(manualMarkupRecordItem);
			const builderOutput = val.builder && val.content && typeof val.content.getMetadata === "function" ? val.content : isBuilderRoot && typeof el.getMetadata === "function" ? el : null;
			if (builderOutput) {
				const builderOutputMeta = builderOutput.getMetadata({
					scopeId: tree.scope,
					parentKey: effectiveGlobalKey
				});
				if (builderOutputMeta && builderOutputMeta.length > 0) {
					const builderRootMeta = builderOutputMeta.find((childRec) => {
						if (!childRec || !childRec.relations) return false;
						return childRec.relations.key === builderTemplateKey || childRec.relations.parent === null;
					}) || builderOutputMeta[0];
					const rootChildren = Array.isArray(builderRootMeta?.relations?.children) ? [...builderRootMeta.relations.children] : [];
					if (manualMarkupRecordItem.relations) {
						manualMarkupRecordItem.relations.children = rootChildren;
						manualMarkupRecordItem.payload = builderRootMeta?.payload ?? manualMarkupRecordItem.payload;
					}
					builderOutputMeta.forEach((childRec) => {
						if (!childRec) return;
						const childScope = childRec?.relations?.scope || tree.scope || "";
						const childGlobalKey = ensureMetadataIdentity$1(childRec?.relations?.key || childRec?.relations?.template || "", childScope).key;
						if (childRec === builderRootMeta || childRec.relations?.key === builderTemplateKey) {
							childRec.relations.scope = childScope;
							childRec.relations.parent = globalKey;
							childRec.relations.key = globalKey;
							childRec.relations.template = builderTemplateKey || childRec.relations.template || childRec.relations.key;
							return;
						}
						if (!this.records.some((r) => r.element === childRec.element)) this.records.push(childRec);
						if (childRec.relations.parent === globalKey || childRec.relations.parent === null) {
							childRec.relations.scope = childScope;
							childRec.relations.parent = childRec.relations.parent || globalKey;
							childRec.relations.template = childRec.relations.template || childRec.relations.key;
							const parentRelations = manualMarkupRecordItem.relations;
							if (!parentRelations.children) parentRelations.children = [];
							if (!parentRelations.children.includes(childGlobalKey)) {
								parentRelations.children.push(childGlobalKey);
								console.log(parentRelations.children);
								console.log(`📌 [JIT Emitter Bridge -> Connected]: Linked dynamic builder "${childGlobalKey}" into static parent trunk "${effectiveGlobalKey}"`);
							}
						}
					});
				}
			}
			setMetadata$1(el, this.records);
			const parentKey = tree?.parent;
			if (parentKey) {
				const parentItem = this.records.find((r) => ensureMetadataIdentity$1(r.relations?.key || "", r.relations?.scope || "").key === parentKey);
				if (parentItem && parentItem.relations) {
					if (!parentItem.relations.children) parentItem.relations.children = [];
					if (!parentItem.relations.children.includes(effectiveGlobalKey)) parentItem.relations.children.push(effectiveGlobalKey);
				}
			}
		}
		mountHandler(key, currentElement, treeRelations) {
			currentElement.mount = (compositeOutput) => {
				if (!compositeOutput) return;
				const childElement = compositeOutput.element || (compositeOutput instanceof HTMLElement ? compositeOutput : null);
				if (!childElement) return;
				currentElement.appendChild(childElement);
				if (compositeOutput.metadata && compositeOutput.metadata.records) compositeOutput.metadata.records.forEach((childItem) => {
					if (childItem.relations && childItem.relations.parent === null) {
						const childGlobalKey = ensureMetadataIdentity$1(childItem.relations.template || childItem.relations.key || "", childItem.relations.scope || "").key;
						childItem.relations.parent = key;
						if (treeRelations?.children && !treeRelations.children.includes(childGlobalKey)) {
							treeRelations.children.push(childGlobalKey);
							console.log(`🚀 [JIT .mount Link]: Fast-linked dynamic child node "${childGlobalKey}" into trunk "${key}"`);
						}
					}
				});
			};
		}
		/**
		* Phase 1: Spawns clean HTMLElement instances or intercepts live hijacked nodes.
		*/
		nodeFactory(baseName, value) {
			if (value.content instanceof HTMLElement) return value.content;
			return baseName ? document.createElement(baseName) : document.createElement("div");
		}
		/**
		* Phase 2: Stamps IDs, classNames list, and handles custom inline data attributes dictionary.
		* Pair-stamping delegated to Utility/AttributeUtils.
		*/
		attributeProcessor(el, value, id, classNames, parsedAttrs) {
			if (id && !el.id) el.id = id;
			if (classNames.length > 0) {
				const existingClasses = el.className ? el.className.trim().split(/\s+/) : [];
				const combinedClasses = new Set([...existingClasses, ...classNames].filter(Boolean));
				el.className = Array.from(combinedClasses).join(" ");
			}
			applyAttrDictionary$1(el, parsedAttrs);
			applyAttrDictionary$1(el, value.attrs);
			applyAttributeList$1(el, value.attributes);
		}
		/**
		* Phase 3: Triggers onCreated lifecycle bindings securely via sandbox proxies closures.
		*/
		lifecycleManager(el, value, renderFn, builderFnArgs) {
			if (typeof value.onCreated === "function") {
				const renderProxy = (schema) => {
					return renderFn ? renderFn(schema) : null;
				};
				const builderProxy = (name, data) => {
					return builderFnArgs ? builderFnArgs(name, data) : null;
				};
				value.onCreated(el, renderProxy, builderProxy, {
					/**
					* Lets a component register its own template override from inside `onCreated`.
					*/
					register: (themeId, selectorKey, handler) => {
						console.log(`[DOMRenderer Lifecycle] Manual template registration triggered for token: "${selectorKey}"`);
						getTemplates().register(themeId, selectorKey, handler);
					},
					/**
					* Lets a component withdraw its template override on unmount.
					*/
					unregister: (themeId, selectorKey) => {
						getTemplates().unregister(themeId, selectorKey);
					}
				});
			}
			if (typeof value.onDestroy === "function") _classPrivateFieldGet2(_cleanupMap, this).set(el, value.onDestroy);
		}
		/**
		* Phase 4: Hydrates the inner content node chambers dynamically using polymorphic sniffing.
		*/
		contentEvaluator(el, value, renderFn, builderFn, context = {
			scopeId: "page",
			parentKey: null,
			pathMap: /* @__PURE__ */ new Map()
		}) {
			if (value.content === void 0) return;
			if (value.builder) return;
			const nodePayload = value.content;
			const parentGlobalKey = context.parentKey;
			if (nodePayload instanceof Node) {
				if (nodePayload !== el && !el.contains(nodePayload)) el.appendChild(nodePayload);
			} else if (Array.isArray(nodePayload)) {
				const subFragment = document.createDocumentFragment();
				nodePayload.forEach((childItem) => {
					if (childItem && typeof childItem === "object") this.buildStructure(childItem, subFragment, renderFn, builderFn, {
						scopeId: context.scopeId,
						parentKey: parentGlobalKey,
						pathMap: context.pathMap
					});
				});
				el.appendChild(subFragment);
			} else if (typeof nodePayload === "object" && nodePayload !== null) {
				const subFragment = document.createDocumentFragment();
				this.buildStructure(nodePayload, subFragment, renderFn, builderFn, {
					scopeId: context.scopeId,
					parentKey: parentGlobalKey,
					pathMap: context.pathMap
				});
				el.appendChild(subFragment);
			} else el.insertAdjacentHTML("afterbegin", nodePayload);
		}
		/**
		* Safe Destroy Method: Unmounts an element tree from the DOM and recursively executes cleanup hooks.
		*/
		unmount(targetElement) {
			_classPrivateFieldGet2(_cleanupMap, this).forEach((onDestroyFn, element) => {
				if (targetElement.contains(element) || targetElement === element) {
					try {
						onDestroyFn(element);
					} catch (error) {
						console.error("Failed to execute onDestroy lifecycle hook:", error);
					}
					_classPrivateFieldGet2(_cleanupMap, this).delete(element);
				}
			});
			if (targetElement.parentNode) targetElement.parentNode.removeChild(targetElement);
		}
	};
	_defineProperty(DOMRenderer, "slot", "renderer");
	// packages/core/src/Inspect.ts
	/**
	* Reads a rendered page back as data.
	*
	* @param root - The element `DOMRenderer.render()` returned.
	* @returns Markup plus the complete record pool. A missing closure yields an empty pool
	*   rather than throwing: an un-recorded tree is a normal state for a host that rendered
	*   nothing, and a snapshot helper must never be the reason a page fails.
	*/
	function inspectPage(root) {
		const records = root?.getMetadata?.() ?? [];
		return {
			html: root ? root.outerHTML : "",
			records,
			nodeCount: records.length
		};
	}
	// packages/core/src/index.ts
	var src_exports$5 = /* @__PURE__ */ __exportAll({
		AioApp: () => AioApp,
		AppStorage: () => AppStorage,
		ComponentRegistry: () => ComponentRegistry,
		DEFAULT_REGISTRY_SCOPE: () => "app",
		DOMRenderer: () => DOMRenderer,
		Registry: () => Registry,
		RegistryError: () => RegistryError,
		TemplateRegistry: () => TemplateRegistry,
		assertValidId: () => assertValidId,
		assertValidScope: () => assertValidScope,
		blockToNode: () => blockToNode,
		ensureStylesheet: () => ensureStylesheet,
		getBuilderAdapter: () => getBuilderAdapter,
		getTemplates: () => getTemplates,
		injectLazyCss: () => injectLazyCss,
		inspectPage: () => inspectPage,
		isPageDocument: () => isPageDocument,
		isStyleInjected: () => isStyleInjected,
		isStylesheetPending: () => isStylesheetPending,
		mergeBuildConfig: () => mergeBuildConfig,
		normalizeRoute: () => normalizeRoute,
		normalizeStylesheetPath: () => normalizeStylesheetPath,
		pageToNode: () => pageToNode,
		qualifyId: () => qualifyId,
		releaseBuilders: () => releaseBuilders,
		replaceLazyCss: () => replaceLazyCss,
		setBuilderAdapter: () => setBuilderAdapter,
		setTemplates: () => setTemplates,
		splitQualifiedId: () => splitQualifiedId,
		styleTagId: () => styleTagId,
		useStylesheetAssets: () => useStylesheetAssets
	});
	// packages/modules/event-emitter/EventEmitter.ts
	/**
	* Small synchronous event bus.
	*
	* Two kinds of event travel through it: component-level ones (`elementAdded`, …) that a
	* builder reports through `config.emit`, and page-level ones the shell emits around a
	* render pass. The registry receives this emitter's `emit` once
	* (`registry.useEmitter(emitter.emit)`) and injects it into every builder config, so a
	* component never has to be told that the application has a bus.
	*
	* Unknown event names are accepted on purpose: a component may name its own
	* (`formValidation`, `tabs:content-loaded`) without registering anything first.
	*/
	var EventEmitter$1 = class {
		constructor() {
			_defineProperty(this, "listeners", {});
			_defineProperty(
				this,
				/**
				* Publishes an event.
				*
				* A throwing listener cannot stop the others: its error is logged and the loop
				* continues, because an event bus is reporting, not control flow.
				*/
				"emit",
				(event, data) => {
					const callbacks = this.listeners[event];
					if (!callbacks) return;
					for (const callback of callbacks) try {
						callback(data);
					} catch (err) {
						console.error(`[EventEmitter] Error executing callback for event "${event}":`, err);
					}
				}
			);
		}
		/**
		* Subscribes to an event.
		*
		* @param event - Known page/component event, or any custom component event name.
		* @param callback - Receives the payload; known events are typed, custom ones are not.
		*/
		on(event, callback) {
			if (!this.listeners[event]) this.listeners[event] = [];
			this.listeners[event].push(callback);
		}
		off(event, callback) {
			if (!this.listeners[event]) return;
			this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
		}
		clear() {
			this.listeners = {};
		}
		/**
		* Releases every listener.
		*
		* Named `destroy` so a host that releases its modules generically
		* (`port.destroy?.()`) does not need a special case for this class.
		*/
		destroy() {
			this.clear();
		}
	};
	_defineProperty(EventEmitter$1, "slot", "events");
	// packages/modules/event-emitter/index.ts
	var event_emitter_exports = /* @__PURE__ */ __exportAll({ EventEmitter: () => EventEmitter$1 });
	// packages/components/fab-menu/FabMenu.ts
	var FabMenuBuilder = class extends Builder$1 {
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "fab-menu");
			_defineProperty(this, "name", "fab-menu");
			_defineProperty(this, "stylesheet", "./FabMenu.css");
			_defineProperty(this, "config", void 0);
			_defineProperty(this, "isMenuOpen", false);
			_defineProperty(this, "idleTimer", void 0);
			const defaultConfig = {
				themeId: "default",
				container: null,
				position: "bottom-left",
				closeOnSelected: true,
				duration: 1e4,
				closeIcon: "✕",
				displayIcon: "⚙️",
				selectors: {
					"@fab": {
						tagName: "div",
						className: "fab"
					},
					"@fab>panel": {
						tagName: "div",
						className: "panel"
					},
					"@fab>panel>title": {
						tagName: "span",
						className: "title"
					},
					"@fab>panel>item": {
						tagName: "button",
						className: "item option"
					},
					"@fab>panel>trigger": {
						tagName: "button",
						className: "trigger"
					}
				},
				namespace: null,
				emit: () => {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		prepare(content, _config) {
			this._clearIdleTimer();
			this.isMenuOpen = false;
			const isElement = content instanceof HTMLElement;
			const fab = this.render("@fab");
			const panel = this.render("@fab>panel", isElement ? [content] : content.actions);
			const title = this.render("@fab>panel>title", isElement ? null : content.title);
			if (title && panel) panel?.prepend(title);
			const trigger = this.render("@fab>panel>trigger", this.config);
			if (this.config.position.startsWith("bottom")) {
				if (panel) fab?.appendChild(panel);
				if (trigger) fab?.appendChild(trigger);
			} else {
				if (trigger) fab?.appendChild(trigger);
				if (panel) fab?.appendChild(panel);
			}
			return fab;
		}
		/**
		* 👑 THE SEPARATED HYDRATION VALVE
		*/
		template(typeKey, el, payload, props) {
			switch (typeKey) {
				case "@fab":
					el.className = `fab ${this.config.position} ${props.className || ""}`.trim();
					break;
				case "@fab>panel":
					for (const p of payload ?? []) {
						if (p instanceof HTMLElement) {
							el.appendChild(p);
							continue;
						}
						const item = this.render("@fab>panel>item", p);
						el.appendChild(item);
					}
					break;
				case "@fab>panel>title":
					el.textContent = (payload || "MENU").toUpperCase();
					break;
				case "@fab>panel>item":
					el.type = payload.type || "button";
					el.textContent = payload.label || "Option";
					if (payload.id) el.id = payload.id;
					if (payload.isActive) el.classList.add("active");
					if (payload.className) el.className = `${el.className} ${payload.className}`.trim();
					el.onclick = (e) => {
						if (payload.onClick) payload.onClick(e);
						if (this.config.closeOnSelected) this.close();
						else this._resetIdleTimer();
					};
					break;
				case "@fab>panel>trigger":
					el.title = "Click for switching options";
					el.textContent = payload.displayIcon;
			}
		}
		initialize() {
			const triggerBtn = this.load("@fab>panel>trigger");
			if (triggerBtn) triggerBtn.onclick = () => {
				if (this.isMenuOpen) this.close();
				else this.open();
			};
		}
		/**
		* 🔓 STATE MANAGEMENT: Membuka panel menu secara reaktif
		*/
		open() {
			if (this.isMenuOpen) return;
			this.isMenuOpen = true;
			const panel = this.load("@fab>panel");
			const trigger = this.load("@fab>panel>trigger");
			if (panel) panel.classList.add("is-open");
			if (trigger) trigger.textContent = this.config.closeIcon;
			this._resetIdleTimer();
		}
		/**
		* 🔒 STATE MANAGEMENT: Menutup panel menu secara reaktif
		*/
		close() {
			if (!this.isMenuOpen) return;
			this.isMenuOpen = false;
			const panel = this.load("@fab>panel");
			const trigger = this.load("@fab>panel>trigger");
			if (panel) panel.classList.remove("is-open");
			if (trigger) trigger.textContent = this.config.displayIcon;
			this._clearIdleTimer();
		}
		unmount() {
			this._clearIdleTimer();
			const trigger = this.load("@fab>panel>trigger");
			if (trigger) trigger.onclick = null;
			this.destroy();
		}
		_resetIdleTimer() {
			this._clearIdleTimer();
			if (!this.config.duration || this.config.duration <= 0) return;
			this.idleTimer = window.setTimeout(() => {
				if (this.isMenuOpen) this.close();
			}, this.config.duration);
		}
		_clearIdleTimer() {
			if (this.idleTimer) {
				window.clearTimeout(this.idleTimer);
				this.idleTimer = void 0;
			}
		}
	};
	_defineProperty(FabMenuBuilder, "contract", {
		schema: {
			t: "union",
			of: [{ t: "element" }, {
				t: "record",
				open: true,
				of: {
					title: { t: "string" },
					actions: {
						t: "list",
						of: {
							t: "union",
							of: [{ t: "element" }, {
								t: "record",
								open: true
							}]
						}
					}
				}
			}]
		},
		example: {
			title: "Menu",
			actions: [{
				label: "WhatsApp",
				id: "wa",
				type: "button"
			}]
		}
	});
	// packages/components/fab-menu/index.ts
	var fab_menu_exports = /* @__PURE__ */ __exportAll({ FabMenuBuilder: () => FabMenuBuilder });
	// packages/components/footer/Footer.ts
	/**
	* Turn a data value into a usable link target.
	*
	* The source data stores contact details as plain values (`halo@seributrip.id`,
	* `+628123456789`, a street address), so the scheme is inferred instead of asking the
	* content author to write `mailto:` themselves. A value that is not addressable at all
	* (a street address) becomes an inert `#` — and the visible text still shows it.
	*/
	function resolveHref(value) {
		const raw = (value ?? "").trim();
		if (!raw) return "#";
		if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(raw)) return raw;
		if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return `mailto:${raw}`;
		if (/^[+]?[\d][\d\s\-()]{6,}$/.test(raw)) return `tel:${raw.replace(/[\s\-()]/g, "")}`;
		return "#";
	}
	var FooterBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — three column headers over their link lines, then the copyright row,
		* drawn with the mandatory `@aio-ui/skeleton` primitive. Widths stay under a third so the
		* columns read as columns before `Footer.css` arrives.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [
					{
						shape: "row",
						gap: "1rem",
						children: [{
							shape: "bone",
							width: "28%",
							height: "1rem",
							count: 3
						}]
					},
					{
						shape: "row",
						gap: "1rem",
						children: [{
							shape: "line",
							width: "28%",
							count: 3
						}]
					},
					{
						shape: "row",
						gap: "1rem",
						children: [{
							shape: "line",
							width: "28%",
							count: 3
						}]
					},
					{
						shape: "line",
						width: "35%"
					}
				]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "footer");
			_defineProperty(this, "name", "footer");
			_defineProperty(this, "stylesheet", "./Footer.css");
			_defineProperty(this, "config", void 0);
			const defaultConfig = {
				themeId: "default",
				useInfo: true,
				useCopyright: true,
				selectors: {
					"@footer": {
						tagName: "footer",
						className: "footer"
					},
					"@footer>row": {
						tagName: "div",
						className: "row"
					},
					"@footer>row>column": {
						tagName: "div",
						className: "column"
					},
					"@footer>row>column>header": {
						tagName: "h2",
						className: "header"
					},
					"@footer>row>column>desc": {
						tagName: "p",
						className: "desc"
					},
					"@footer>row>column>list": {
						tagName: "ul",
						className: "unstyled-list"
					},
					"@footer>row>column>list>item": {
						tagName: "li",
						className: "item"
					},
					"@footer>copyright": {
						tagName: "div",
						className: "row bottom"
					}
				},
				namespace: null,
				emit: () => {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		prepare(data) {
			const content = data ?? {};
			const columns = Array.isArray(content.columns) && content.columns.length ? content.columns : content.title || content.description || content.actions ? [{
				title: content.title,
				description: content.description,
				actions: content.actions
			}] : [];
			const footer = this.render("@footer", content);
			if (this.config.useInfo && columns.length) {
				const row = this.render("@footer>row", content);
				for (const col of columns) {
					const column = this.render("@footer>row>column", col);
					if (!column) continue;
					if (col.title) {
						const header = this.render("@footer>row>column>header", col);
						if (header) column.appendChild(header);
					}
					if (col.description) {
						const desc = this.render("@footer>row>column>desc", col);
						if (desc) column.appendChild(desc);
					}
					const actions = Array.isArray(col.actions) ? col.actions : [];
					if (actions.length) {
						const list = this.render("@footer>row>column>list", col);
						if (list) {
							for (const action of actions) {
								const item = this.render("@footer>row>column>list>item", action);
								if (item) list.appendChild(item);
							}
							column.appendChild(list);
						}
					}
					row?.appendChild(column);
				}
				if (row) footer?.appendChild(row);
			}
			if (this.config.useCopyright) {
				const row = this.render("@footer>copyright", content);
				if (row) footer?.appendChild(row);
			}
			return this.load("@footer");
		}
		/**
		* 👑 THE SEPARATED HYDRATION VALVE (POS PENYIRAMAN DATA KEBAL XSS)
		* Mengunci pengisian nilai teks dan transformasi tag dinamis (Anchor) di RAM.
		*/
		template(typeKey, el, payload) {
			if (!payload) return;
			switch (typeKey) {
				case "@footer":
					if (payload.id) el.id = payload.id;
					if (payload.className) el.className = payload.className;
					break;
				case "@footer>row>column>header":
					el.textContent = payload.title || payload.header || "";
					break;
				case "@footer>row>column>desc":
					el.textContent = payload.description || "";
					break;
				case "@footer>row>column>list>item": {
					const a = document.createElement("a");
					if (payload.id) a.id = payload.id;
					if (payload.className) a.className = payload.className;
					a.href = resolveHref(payload.href ?? payload.value);
					const value = payload.value ?? payload.href;
					a.textContent = [payload.label, value].filter(Boolean).join(" ").trim();
					el.appendChild(a);
					break;
				}
				case "@footer>copyright": {
					const pCopy = document.createElement("p");
					const year = String((/* @__PURE__ */ new Date()).getFullYear());
					const company = (payload.company ?? payload.title ?? "").trim();
					pCopy.textContent = payload.copyright ? String(payload.copyright).replace(/\{year\}/g, year).replace(/\{company\}/g, company) : `© ${year}${company ? ` ${company}` : ""}. All rights reserved.`;
					el.appendChild(pCopy);
					break;
				}
			}
		}
		initialize() {}
	};
	_defineProperty(FooterBuilder, "contract", {
		schema: {
			t: "record",
			open: true,
			of: {
				columns: {
					t: "list",
					of: { t: "any" }
				},
				copyright: { t: "string" }
			}
		},
		example: {
			columns: [{
				title: "Product",
				description: "Built for teams",
				actions: [{
					label: "Docs",
					href: "#docs"
				}]
			}],
			copyright: "© 2026 AIO"
		}
	});
	// packages/components/footer/index.ts
	var footer_exports = /* @__PURE__ */ __exportAll({ FooterBuilder: () => FooterBuilder });
	// packages/components/form/FormModuleTypes.ts
	/**
	* Stable ids for Form sub-modules.
	*
	* Kept in a leaf file so module definitions can import an id without importing
	* the runtime composition module, which would create a circular import.
	*/
	var FORM_MODULE_IDS = {
		validation: "validation",
		cascade: "cascade",
		multistep: "multistep",
		calculation: "calculation",
		input: "input",
		idAddress: "idAddress",
		table: "table",
		message: "message"
	};
	// packages/modules/module-loader/dist/ModuleRegistry.js
	var _definitions$1 = /* @__PURE__ */ new WeakMap();
	/**
	* 🧩 MODULE REGISTRY — storage for module definitions.
	*
	* Owns one concern: which definitions exist, keyed by id. It never loads,
	* instantiates, or destroys anything; that is `ModuleLoader`'s job. Keeping the
	* two apart means a definition store can be shared or inspected without creating
	* live objects.
	*
	* @example
	* const modules = new ModuleRegistry<iFormModuleContext>("form");
	* modules.register(validationFormAdapter);
	* modules.has("validation"); // true
	*/
	var ModuleRegistry$1 = class {
		/**
		* @param scope - Namespace label, for example `"form"` or `"animation"`.
		* @param options - Duplicate policy for module ids.
		* @throws {RegistryError} With code `INVALID_SCOPE` when the scope label is malformed.
		*/
		constructor(scope, options = {}) {
			_classPrivateFieldInitSpec(this, _definitions$1, void 0);
			_classPrivateFieldSet2(_definitions$1, this, new Registry$1(scope, { duplicate: options.duplicate ?? "warn" }));
		}
		/** Scope label that isolates this registry from other module registries. */
		get scope() {
			return _classPrivateFieldGet2(_definitions$1, this).scope;
		}
		/** Number of registered definitions. */
		get size() {
			return _classPrivateFieldGet2(_definitions$1, this).size;
		}
		/**
		* Registers a module definition.
		*
		* @summary A definition is `{ id, load }`. A **manifest ref** — `{ id, path, export }`, the
		* shape an AST declares — is not a definition: only `ComponentRegistry` (or
		* `resolveModuleDefinitions()`) can turn a specifier into a live module. Registering a ref used
		* to succeed silently and fail three layers later inside a consumer's form, so the door now
		* names the mistake instead of storing it.
		* @param definition - Definition to register; its `id` becomes the lookup key.
		* @returns The current registry instance, for fluent registration chains.
		* @throws {RegistryError} With code `INVALID_ID` for a malformed id, `INVALID_DEFINITION` when
		*   `load` is missing, or `DUPLICATE_ID` when the policy is `"error"` and the id exists.
		* @example
		* modules.register(validationFormAdapter);
		*/
		register(definition) {
			if (typeof definition?.load !== "function") {
				const ref = definition;
				const shape = ref && (ref.path || ref.export) ? `it looks like a manifest ref ({ path: "${ref.path ?? "?"}", export: "${ref.export ?? "?"}" })` : "it has no load() function";
				throw new RegistryError$1("INVALID_DEFINITION", `[${this.scope}] module "${String(ref?.id ?? "?")}" is not a definition — ${shape}. A loader takes definitions (in this package: FORM_ADAPTER_DEFINITIONS, or one adapter exported from its own subpath). Manifest refs belong to ComponentRegistry, or can be resolved first with resolveModuleDefinitions().`, {
					scope: this.scope,
					id: String(ref?.id ?? "?")
				});
			}
			_classPrivateFieldGet2(_definitions$1, this).register(definition.id, definition);
			return this;
		}
		/**
		* Resolves a registered definition.
		*
		* @param id - Module identifier.
		* @returns The definition, or `null` when the module is not registered.
		* @example
		* modules.resolve("validation")?.requires;
		*/
		resolve(id) {
			return _classPrivateFieldGet2(_definitions$1, this).resolve(id);
		}
		/**
		* Checks whether a module definition is registered.
		*
		* @param id - Module identifier.
		* @returns `true` when registered.
		*/
		has(id) {
			return _classPrivateFieldGet2(_definitions$1, this).has(id);
		}
		/**
		* Lists registered module ids in registration order.
		*
		* @returns A new array that is safe to mutate.
		*/
		ids() {
			return _classPrivateFieldGet2(_definitions$1, this).ids();
		}
	};
	// packages/modules/module-loader/dist/ModuleLoader.js
	var _registry$1 = /* @__PURE__ */ new WeakMap();
	var _instances$1 = /* @__PURE__ */ new WeakMap();
	var _ModuleLoader_brand$1 = /* @__PURE__ */ new WeakSet();
	/**
	* 🚚 MODULE LOADER — lifecycle for optional modules.
	*
	* Loads, tracks, and destroys module instances on top of a `ModuleRegistry`.
	* Dependency ordering, rebuild-safe reload, and reverse-order teardown live here
	* so the registry can stay a plain definition store.
	*
	* @example
	* const loader = new ModuleLoader<iFormModuleContext, any>("form", FULL_FORM_MODULES);
	* const feature = loader.load("validation", { form, builder: "form", ... });
	* loader.unloadAll();
	*/
	var ModuleLoader$1 = class {
		/**
		* @param scope - Namespace label, for example `"form"`.
		* @param definitions - Definitions to register up front. Empty by default, so a
		*   Lite consumer passes nothing and keeps the built-in behaviour.
		* @param options - Duplicate policy for module ids.
		* @throws {RegistryError} With code `INVALID_SCOPE` when the scope label is malformed.
		*/
		constructor(scope, definitions = [], options = {}) {
			_classPrivateMethodInitSpec(this, _ModuleLoader_brand$1);
			_classPrivateFieldInitSpec(this, _registry$1, void 0);
			_classPrivateFieldInitSpec(this, _instances$1, /* @__PURE__ */ new Map());
			_classPrivateFieldSet2(_registry$1, this, new ModuleRegistry$1(scope, { duplicate: options.duplicate }));
			for (const definition of definitions) _classPrivateFieldGet2(_registry$1, this).register(definition);
		}
		/** The definition store backing this loader. */
		get registry() {
			return _classPrivateFieldGet2(_registry$1, this);
		}
		/** Scope label shared with the backing registry. */
		get scope() {
			return _classPrivateFieldGet2(_registry$1, this).scope;
		}
		/**
		* Lists registered module ids in registration order.
		*
		* @returns A new array that is safe to mutate.
		*/
		ids() {
			return _classPrivateFieldGet2(_registry$1, this).ids();
		}
		/**
		* Checks whether a module definition is registered.
		*
		* @param id - Module identifier.
		* @returns `true` when registered.
		*/
		has(id) {
			return _classPrivateFieldGet2(_registry$1, this).has(id);
		}
		/**
		* Resolves a registered definition without loading it.
		*
		* @param id - Module identifier.
		* @returns The definition, or `null` when the module is not registered.
		*/
		resolve(id) {
			return _classPrivateFieldGet2(_registry$1, this).resolve(id);
		}
		/**
		* Lists ids of modules that currently hold a live instance.
		*
		* @returns A new array in load order.
		*/
		loadedIds() {
			return Array.from(_classPrivateFieldGet2(_instances$1, this).keys());
		}
		/**
		* Returns the instance already held by a module, without loading it.
		*
		* @summary Use this after `resolveAll()` when a caller needs a typed handle on a
		* module the loader already settled, such as an engine it will call directly.
		* @param id - Module identifier.
		* @returns The live instance, or `null` when the module is not loaded.
		* @example
		* loader.resolveAll(context);
		* const feature = loader.loaded("validation");
		*/
		loaded(id) {
			if (!_classPrivateFieldGet2(_instances$1, this).has(id)) return null;
			return _classPrivateFieldGet2(_instances$1, this).get(id);
		}
		/**
		* Checks whether a module currently holds a live instance.
		*
		* @param id - Module identifier.
		* @returns `true` when loaded.
		*/
		isLoaded(id) {
			return _classPrivateFieldGet2(_instances$1, this).has(id);
		}
		/**
		* Loads a module by id.
		*
		* @summary Resolves required dependencies first, destroys any previous instance
		* of the same module (rebuild semantics), then delegates to `definition.load()`.
		* @param id - Module identifier.
		* @param context - Host context forwarded to `definition.load()`.
		* @returns The live module object, or `null` when the module is not registered.
		* @throws {RegistryError} With code `MISSING_DEPENDENCY` when a required module is not registered, or `CYCLIC_DEPENDENCY` when `requires` forms a loop.
		* @example
		* const feature = loader.load("validation", context);
		*/
		load(id, context) {
			return _assertClassBrand(_ModuleLoader_brand$1, this, _load$1).call(this, id, context, /* @__PURE__ */ new Set());
		}
		/**
		* Loads every module whose `matches()` accepts the context.
		*
		* @summary Idempotent: modules that already hold an instance are skipped, so a
		* caller can run `resolveAll()` once per lifecycle phase and only the modules
		* that become applicable in that phase are loaded. Modules without `matches`
		* always apply. Iteration follows registration order.
		* @param context - Host context forwarded to `matches()` and `load()`.
		* @returns Only the instances loaded by this call, in registration order.
		* @throws {RegistryError} Same failure modes as {@link load}.
		*/
		resolveAll(context) {
			const loaded = [];
			for (const id of _classPrivateFieldGet2(_registry$1, this).ids()) {
				if (_classPrivateFieldGet2(_instances$1, this).has(id)) continue;
				const instance = this.load(id, context);
				if (instance !== null) loaded.push(instance);
			}
			return loaded;
		}
		/**
		* Destroys and forgets one loaded module.
		*
		* @param id - Module identifier.
		* @returns `true` when a live instance was released, `false` when it was not loaded.
		*/
		unload(id) {
			return _assertClassBrand(_ModuleLoader_brand$1, this, _release$1).call(this, id);
		}
		/**
		* Destroys and forgets every loaded module, newest first.
		*
		* @summary Reverse order matches dependency direction: dependants unload before
		* the modules they require.
		* @returns Nothing.
		*/
		unloadAll() {
			for (const id of Array.from(_classPrivateFieldGet2(_instances$1, this).keys()).reverse()) _assertClassBrand(_ModuleLoader_brand$1, this, _release$1).call(this, id);
		}
	};
	/**
	* Loads a module and its dependency chain.
	*
	* @param id - Module identifier.
	* @param context - Host context forwarded to `definition.load()`.
	* @param visiting - Ids currently on the dependency stack, used for cycle detection.
	* @returns The live module object, or `null` when unregistered.
	*/
	function _load$1(id, context, visiting) {
		const definition = _classPrivateFieldGet2(_registry$1, this).resolve(id);
		if (!definition) return null;
		if (typeof definition.matches === "function" && !definition.matches(context)) return null;
		if (visiting.has(id)) throw new RegistryError$1("CYCLIC_DEPENDENCY", `Module "${id}" in scope "${this.scope}" takes part in a dependency cycle.`, {
			scope: this.scope,
			id
		});
		visiting.add(id);
		for (const dependencyId of definition.requires ?? []) {
			if (!_classPrivateFieldGet2(_registry$1, this).has(dependencyId)) throw new RegistryError$1("MISSING_DEPENDENCY", `Module "${id}" requires "${dependencyId}", which is not registered in scope "${this.scope}".`, {
				scope: this.scope,
				id: dependencyId
			});
			_assertClassBrand(_ModuleLoader_brand$1, this, _load$1).call(this, dependencyId, context, visiting);
		}
		visiting.delete(id);
		_assertClassBrand(_ModuleLoader_brand$1, this, _release$1).call(this, id);
		const instance = definition.load(context);
		_classPrivateFieldGet2(_instances$1, this).set(id, instance);
		return instance;
	}
	/**
	* Destroys and forgets a loaded instance.
	*
	* @param id - Module identifier.
	* @returns `true` when something was released.
	*/
	function _release$1(id) {
		if (!_classPrivateFieldGet2(_instances$1, this).has(id)) return false;
		const instance = _classPrivateFieldGet2(_instances$1, this).get(id);
		_classPrivateFieldGet2(_instances$1, this).delete(id);
		_classPrivateFieldGet2(_registry$1, this).resolve(id)?.destroy?.(instance);
		return true;
	}
	// packages/modules/module-loader/dist/Resolve.js
	/**
	* 🧩 Turns manifest refs into module definitions a `ModuleLoader` accepts.
	*
	* @summary Two shapes describe the same module and nothing used to say which was which:
	* a **manifest ref** (`{ id, path, export }`, what an AST declares and `ComponentRegistry`
	* resolves) and a **definition** (`{ id, load }`, what a `ModuleLoader` takes). This is the
	* explicit bridge — async, called by the consumer **before** it builds anything, because a
	* builder's render is synchronous and must never own module I/O.
	*
	* @param refs - Manifest refs, in the order the modules should load.
	* @param options - Importer override.
	* @returns One definition per ref, in the same order. Each `load()` returns the very symbol the
	*   ref named, so a module is instantiated once and shared.
	* @throws {RegistryError} `INVALID_DEFINITION` when a ref names no `export`, when the import
	*   fails, or when the exported symbol is not a definition (no `load`) — a class or a live
	*   instance cannot be registered without knowing how to construct it.
	*
	* @example
	* import { ModuleLoader, resolveModuleDefinitions } from "@aio-ui/module-loader";
	* import { FORM_ADAPTER_MANIFEST } from "@aio-ui/form/FormRegistry";
	*
	* const definitions = await resolveModuleDefinitions(FORM_ADAPTER_MANIFEST);
	* const form = new FormBuilder({ modules: new ModuleLoader("form", definitions) });
	*/
	async function resolveModuleDefinitions$1(refs, options = {}) {
		const load = options.import ?? ((specifier) => import(specifier));
		return (await Promise.all(refs.map(async (ref) => {
			if (!ref.export) throw new RegistryError$1("INVALID_DEFINITION", `Module ref "${ref.id}" names no "export". A ref must say which symbol it wants (for example export: "validationFormAdapter") — this resolver does not guess.`, {
				scope: "module-loader",
				id: ref.id
			});
			if (!ref.path) throw new RegistryError$1("MISSING_ENTRY", `Module ref "${ref.id}" names no "path" — there is nothing to import.`, {
				scope: "module-loader",
				id: ref.id
			});
			let namespace;
			try {
				namespace = await load(ref.path);
			} catch (error) {
				throw new RegistryError$1("MISSING_ENTRY", `Module ref "${ref.id}" could not import "${ref.path}": ${error?.message ?? error}`, {
					scope: "module-loader",
					id: ref.id
				});
			}
			const symbol = namespace?.[ref.export];
			if (symbol === void 0 || symbol === null) throw new RegistryError$1("MISSING_ENTRY", `Module ref "${ref.id}" → "${ref.path}" has no exported object "${ref.export}".`, {
				scope: "module-loader",
				id: ref.id
			});
			return {
				ref,
				symbol
			};
		}))).map(({ ref, symbol }) => {
			const definition = symbol;
			if (typeof definition.load !== "function") throw new RegistryError$1("INVALID_DEFINITION", `Module ref "${ref.id}" → "${ref.path}" exports "${ref.export}", which is not a module definition (no load()). Export the definition itself — every adapter in this repo does, for example "validationFormAdapter".`, {
				scope: "module-loader",
				id: ref.id
			});
			return definition;
		});
	}
	// packages/components/input/dist/InputModuleTypes.js
	/**
	* Input module contract — ids and types only.
	*
	* Kept in a leaf file on purpose: a module definition needs its own id, and importing
	* that id from `InputRegistry.ts` (which imports the definitions) would close a cycle and
	* leave `INPUT_MODULE_IDS` undefined while the definitions are being built. The Form family
	* solves the same problem the same way (`FormModuleTypes.ts`).
	*/
	/** Stable ids for input sub-modules. */
	var INPUT_MODULE_IDS$1 = {
		dropdown: "dropdown",
		file: "file",
		controls: "controls",
		popover: "popover",
		picker: "picker"
	};
	// packages/components/input/dist/InputRegistry.js
	/**
	* The stack as manifest refs, so a parent component can declare it without importing
	* classes and the registry can resolve one entry at a time.
	*
	* @summary `scope` is deliberately absent here: these are input-layer modules, and it is
	* the *nesting* component (`form`) that labels them `scope: "input"` when it re-declares
	* the list in its own manifest.
	*/
	var INPUT_MODULE_MANIFEST$1 = [
		{
			id: "dropdown",
			path: "@aio-ui/input/dropdown/module",
			export: "dropdownInputModule"
		},
		{
			id: "picker",
			path: "@aio-ui/input/picker/module",
			export: "pickerInputModule"
		},
		{
			id: "file",
			path: "@aio-ui/input/file-uploader/module",
			export: "fileUploaderInputModule"
		},
		{
			id: "controls",
			path: "@aio-ui/input/controls/module",
			export: "inputControlsInputModule"
		},
		{
			id: "popover",
			path: "@aio-ui/input/popover/module",
			export: "popoverInputModule"
		}
	];
	/**
	* Clamps the column count into a usable range.
	*
	* @param value - `column` from the schema; anything non-numeric falls back to the default.
	* @returns Integer between 1 and {@link MAX_ROW_COLUMNS}.
	*/
	function columnsOf(value) {
		if (value === void 0 || value === null || value === "") return 2;
		const numeric = typeof value === "number" ? value : Number(value);
		if (!Number.isFinite(numeric)) return 2;
		return Math.min(16, Math.max(1, Math.round(numeric)));
	}
	/**
	* Turns a `wide` hint into a column span.
	*
	* Three spellings are accepted, because a schema read from a sheet writes whatever the
	* author typed:
	*
	* - `"auto"` → the whole row (a textarea or an address line wants the full width);
	* - `0 < n ≤ 1` → fraction of the row (`0.5` = half);
	* - anything else numeric → percentage (`50` = half, `33` = a third).
	*
	* @param wide - Width hint from `config.wide` (or the node's own `wide`).
	* @param columns - Column count of the row this child lives in.
	* @returns Span between 1 and `columns`.
	*/
	function spanOf(wide, columns) {
		const total = Math.max(1, Math.round(columns));
		if (wide === "auto" || wide === "full") return total;
		const numeric = typeof wide === "number" ? wide : Number(wide);
		if (!Number.isFinite(numeric) || numeric <= 0) return 1;
		const ratio = numeric <= 1 ? numeric : numeric / 100;
		return Math.min(total, Math.max(1, Math.round(ratio * total)));
	}
	/**
	* Applies a span to a child element.
	*
	* `data-span` is the human/debug marker; `--span` carries the number, because CSS cannot
	* read an attribute inside `grid-column: span …`.
	*
	* @param element - Child element of a row container.
	* @param span - Column span, already clamped by {@link spanOf}.
	*/
	function applyRowSpan(element, span) {
		element.dataset.span = String(span);
		element.style.setProperty("--span", String(span));
	}
	/**
	* Declares the grid of a row container.
	*
	* @param element - Row container.
	* @param columns - Column count, already clamped by {@link columnsOf}.
	*/
	function applyRowColumns(element, columns) {
		element.dataset.column = String(columns);
		element.style.setProperty("--items", String(columns));
	}
	/**
	* Resolves the span a row child asked for, explicit `span` first, then `wide`.
	*
	* @param child - Row child node.
	* @param columns - Column count of the parent row.
	* @returns Span between 1 and `columns`.
	*/
	function childSpanOf(child, columns) {
		if (!child || typeof child !== "object") return 1;
		const node = child;
		if (node.span !== void 0) return Math.min(columns, Math.max(1, Math.round(Number(node.span) || 1)));
		return spanOf(node.config?.wide ?? node.wide, columns);
	}
	// packages/components/input/dist/FormValues.js
	/**
	* Submit values — what a form actually contains.
	*
	* `Object.fromEntries(new FormData(form))` is not enough for a form builder: it drops every
	* unchecked checkbox, collapses a group of checkboxes that share a name to the last value,
	* and keeps only the last selected option of a multi-select. A payload that lies is worse
	* than no payload, because the consumer cannot tell the difference.
	*
	* The rules are deliberately explicit:
	*
	* | Control                  | Value                                             |
	* | ------------------------ | ------------------------------------------------- |
	* | text / number / date / … | the string in the field                           |
	* | `select`                 | the selected value                                |
	* | `select[multiple]`       | array of selected values                          |
	* | `checkbox` (lone)        | `true` / `false` — "not ticked" is information    |
	* | `checkbox` (shared name) | array of the ticked values                        |
	* | `radio` group            | value of the checked option, or omitted           |
	* | `file`                   | never — uploads are a decision (`config.files`)   |
	*
	* Disabled controls and buttons are skipped, exactly like a real submission would.
	*/
	/** Controls that never contribute a value to the payload. */
	var SKIPPED_TYPES = /* @__PURE__ */ new Set([
		"file",
		"submit",
		"button",
		"reset",
		"image"
	]);
	/**
	* Reads every successful control of a form — or of any container holding controls.
	*
	* @param form - Live form element, a `<fieldset>` group, or any wrapper (a `.field`).
	* @param options - Collection options; see {@link iCollectValuesOptions}.
	* @returns Payload keyed by control name.
	*
	* @summary A `<fieldset>` and a `.field` wrapper are scopes a control set can own, and
	* `search` has to read them with the same vocabulary a submit uses — one definition of
	* "what this form holds", not two that drift apart. `elements` is used when the root has
	* it (it skips nothing and keeps document order); a plain wrapper falls back to a query.
	*/
	function collectFormValues(form, options = {}) {
		const controls = Array.from(typeof HTMLFieldSetElement !== "undefined" && form instanceof HTMLFieldSetElement || form instanceof HTMLFormElement ? form.elements : form.querySelectorAll("input, select, textarea"));
		const entries = [];
		for (const control of controls) {
			if (!control || !control.name) continue;
			if (SKIPPED_TYPES.has(control.type)) continue;
			if (control.disabled) continue;
			if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) {
				entries.push({
					name: control.name,
					kind: "toggle",
					toggle: control.type,
					value: control.value,
					checked: control.checked
				});
				continue;
			}
			if (control instanceof HTMLSelectElement && control.multiple) {
				entries.push({
					name: control.name,
					kind: "field",
					toggle: null,
					value: Array.from(control.selectedOptions).map((option) => option.value),
					checked: true
				});
				continue;
			}
			entries.push({
				name: control.name,
				kind: "field",
				toggle: null,
				value: control.value,
				checked: true
			});
		}
		return options.excludeEmpty ? stripEmpty(assemble(entries)) : assemble(entries);
	}
	/**
	* Removes values a consumer would treat as "nothing".
	*
	* @param data - Assembled payload.
	* @returns Payload without `""`, `false` and empty arrays.
	*/
	function stripEmpty(data) {
		const kept = {};
		for (const [name, value] of Object.entries(data)) {
			if (value === "" || value === false) continue;
			if (Array.isArray(value) && value.length === 0) continue;
			kept[name] = value;
		}
		return kept;
	}
	/** A toggle's contribution: `true` when it was left at the browser's default value. */
	function toggleValue(entry) {
		return entry.value === "on" ? true : entry.value;
	}
	/**
	* Collapses per-control entries into one value per name.
	*
	* @param entries - Raw contributions, in document order.
	* @returns Payload.
	*/
	function assemble(entries) {
		const grouped = /* @__PURE__ */ new Map();
		for (const entry of entries) {
			const bucket = grouped.get(entry.name);
			if (bucket) bucket.push(entry);
			else grouped.set(entry.name, [entry]);
		}
		const data = {};
		for (const [name, bucket] of grouped) {
			const fields = bucket.filter((entry) => entry.kind === "field");
			const toggles = bucket.filter((entry) => entry.kind === "toggle");
			if (fields.length) {
				data[name] = fields[fields.length - 1].value;
				continue;
			}
			const radios = toggles.filter((entry) => entry.toggle === "radio");
			const boxes = toggles.filter((entry) => entry.toggle === "checkbox");
			const ticked = toggles.filter((entry) => entry.checked);
			if (radios.length) {
				if (ticked.length) data[name] = toggleValue(ticked[0]);
				continue;
			}
			if (boxes.length === 1) {
				data[name] = boxes[0].checked ? toggleValue(boxes[0]) : false;
				continue;
			}
			data[name] = ticked.map(toggleValue);
		}
		return data;
	}
	// packages/components/form/FormMessages.ts
	/**
	* Built-in sentences.
	*
	* These are the exact strings the form used to hard-code, moved here so that
	* *not configuring* `messages` behaves identically to before.
	*/
	var DEFAULT_FORM_MESSAGES = {
		validation: {
			title: "Periksa Kembali",
			type: "error",
			icon: "icon error",
			invalidField: "{label} belum diisi / tidak valid.",
			field: "\"{label}\" — {fallback}",
			form: "Pastikan seluruh isian wajib telah diisi dengan benar."
		},
		cascade: {
			title: "Selangkah Lagi",
			type: "warning",
			icon: "notification icon",
			gate: "Lengkapi isian sebelumnya untuk membuka langkah berikutnya.",
			branch: "Pilihan ini tidak tersedia untuk cabang yang sedang aktif."
		},
		multistep: {
			title: "Langkah Belum Lengkap",
			type: "warning",
			icon: "notification icon",
			incomplete: "Lengkapi langkah {stepIndex} sebelum melanjutkan.",
			lastStep: "Ini langkah terakhir — gunakan tombol kirim."
		},
		calculation: {
			title: "Perhitungan Gagal",
			type: "warning",
			icon: "notification icon",
			failed: "Perhitungan {formula} tidak dapat dijalankan."
		},
		submit: {
			titles: {
				success: "Operasi Sukses!",
				error: "Terjadi Kendala"
			},
			types: {
				success: "success",
				error: "error"
			},
			icons: {
				success: "checkmark circle icon",
				error: "icon error"
			},
			durations: {
				success: 4e3,
				error: 6e3
			},
			success: "Data Anda telah diproses.",
			error: "Data Anda gagal diproses. Silakan coba lagi."
		}
	};
	/** Reads one slot (sentence) out of a group without tripping over style keys. */
	function readSlot(group, slot) {
		if (!group || typeof group !== "object") return void 0;
		const value = group[slot];
		return typeof value === "string" || typeof value === "function" ? value : void 0;
	}
	/**
	* Fills `{token}` placeholders.
	*
	* Deliberately dumb: unknown tokens collapse to empty text instead of being
	* left visible, so a typo cannot leak `{maxx}` into the interface.
	*/
	function fillTemplate(template, compose) {
		const tokens = {
			...compose.params,
			label: compose.field?.label,
			name: compose.field?.name,
			id: compose.field?.id,
			type: compose.field?.type,
			formId: compose.formId,
			code: compose.code,
			slot: compose.slot,
			category: compose.category,
			fallback: compose.fallback
		};
		return template.replace(/\{(\w+)\}/g, (_match, key) => {
			const value = tokens[key];
			return value === void 0 || value === null ? "" : String(value);
		});
	}
	/** Renders one message value against a draft. */
	function renderMessage(value, compose) {
		if (typeof value === "function") return value(compose);
		if (typeof value === "string") return fillTemplate(value, compose);
		return compose.fallback;
	}
	/**
	* Resolves the final sentence for a draft.
	*
	* Order: the configured `codes[code]` entry, then the configured slot, then the
	* built-in slot, then `compose.fallback`. A composer's return value is used
	* as-is — it replaces the sentence rather than being appended to it.
	*/
	function composeMessage(messages, compose) {
		const group = messages?.[compose.category];
		const fallbackGroup = DEFAULT_FORM_MESSAGES[compose.category];
		return renderMessage(group?.codes?.[compose.code] ?? readSlot(group, compose.slot) ?? readSlot(fallbackGroup, compose.slot), compose) || compose.fallback;
	}
	/**
	* Resolves title/type/icon/duration for a draft.
	*
	* Order per property: user slot override → user group value → default slot
	* override → default group value. Missing values resolve to empty strings so a
	* caller can fall back without guessing.
	*/
	function resolveStyle(messages, compose) {
		const group = messages?.[compose.category] ?? {};
		const fallbackGroup = DEFAULT_FORM_MESSAGES[compose.category];
		const title = group.titles?.[compose.slot] ?? group.title ?? fallbackGroup.titles?.[compose.slot] ?? fallbackGroup.title;
		const type = group.types?.[compose.slot] ?? group.type ?? fallbackGroup.types?.[compose.slot] ?? fallbackGroup.type;
		const icon = group.icons?.[compose.slot] ?? group.icon ?? fallbackGroup.icons?.[compose.slot] ?? fallbackGroup.icon;
		const duration = group.durations?.[compose.slot] ?? group.duration ?? fallbackGroup.durations?.[compose.slot] ?? fallbackGroup.duration;
		return {
			title: renderMessage(title, compose),
			type: typeof type === "string" ? type : "",
			icon: typeof icon === "string" ? icon : "",
			duration: typeof duration === "number" ? duration : void 0
		};
	}
	/** Builds a draft without repeating every field at each call site. */
	function messageDraft(init) {
		return {
			...init,
			params: init.params ?? {}
		};
	}
	// packages/components/form/Form.ts
	var _inputs = /* @__PURE__ */ new WeakMap();
	var _cascade = /* @__PURE__ */ new WeakMap();
	var _multistep = /* @__PURE__ */ new WeakMap();
	var _validation = /* @__PURE__ */ new WeakMap();
	var _onStepMounted = /* @__PURE__ */ new WeakMap();
	var _loader$1 = /* @__PURE__ */ new WeakMap();
	var _features = /* @__PURE__ */ new WeakMap();
	var _inputModules = /* @__PURE__ */ new WeakMap();
	var _providedLoader = /* @__PURE__ */ new WeakMap();
	var _providedLive = /* @__PURE__ */ new WeakMap();
	var _FormBuilder_brand = /* @__PURE__ */ new WeakSet();
	var FormBuilder = class extends Builder$1 {
		/**
		* Memisahkan modul yang diserahkan registry menurut lapisannya.
		*
		* @param modules - Id modul → modul hasil resolve.
		*
		* @summary `Form` menaungi builder lain (`input`), jadi satu manifest memuat dua
		* lapisan: id milik `INPUT_MODULE_IDS` menjadi preset field, sisanya milik form.
		* Id tetap yang menentukan — `scope` di manifest hanya menyatakan niat, dan
		* mencocokkan lewat id membuat manifest lama tanpa `scope` tetap benar.
		*/
		provideModules(modules) {
			super.provideModules(modules);
			const inputIds = new Set(Object.values(INPUT_MODULE_IDS$1));
			const definitions = [];
			_classPrivateFieldSet2(_inputModules, this, []);
			_classPrivateFieldGet2(_providedLive, this).clear();
			_classPrivateFieldSet2(_providedLoader, this, null);
			for (const [id, module] of Object.entries(modules)) {
				if (inputIds.has(id)) {
					_classPrivateFieldGet2(_inputModules, this).push(module);
					continue;
				}
				if (typeof module?.load === "function") definitions.push(module);
				else _classPrivateFieldGet2(_providedLive, this).set(id, module);
			}
			if (definitions.length) _classPrivateFieldSet2(_providedLoader, this, new ModuleLoader$1("form", definitions));
		}
		/**
		* 🪶 LOADING MOCKUP — a title, three labelled fields and the action row, drawn with the
		* mandatory `@aio-ui/skeleton` primitive. Field count and types are payload detail; the
		* mockup only promises the column the sheet will take over.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [
					{
						shape: "line",
						width: "40%"
					},
					{
						shape: "stack",
						count: 3,
						children: [{
							shape: "line",
							width: "25%"
						}, {
							shape: "bone",
							height: "2.75rem"
						}]
					},
					{
						shape: "bone",
						width: "30%",
						height: "2.75rem"
					}
				]
			});
		}
		constructor(config = {}) {
			super();
			_classPrivateMethodInitSpec(this, _FormBuilder_brand);
			_defineProperty(this, "builderId", "form");
			_defineProperty(this, "name", "form");
			_defineProperty(this, "stylesheet", "./Form.css");
			_defineProperty(this, "submitButtonId", void 0);
			_classPrivateFieldInitSpec(this, _inputs, []);
			_classPrivateFieldInitSpec(this, _cascade, null);
			_classPrivateFieldInitSpec(this, _multistep, null);
			_classPrivateFieldInitSpec(this, _validation, null);
			_classPrivateFieldInitSpec(this, _onStepMounted, null);
			_classPrivateFieldInitSpec(this, _loader$1, void 0);
			_classPrivateFieldInitSpec(this, _features, []);
			_classPrivateFieldInitSpec(this, _inputModules, []);
			_classPrivateFieldInitSpec(this, _providedLoader, null);
			_classPrivateFieldInitSpec(this, _providedLive, /* @__PURE__ */ new Map());
			const defaultConfig = {
				id: "",
				name: "",
				title: "",
				description: "",
				method: "post",
				action: "submit",
				className: "",
				submitButton: true,
				buttonText: "Submit",
				buttonClass: "",
				resetOnSubmit: false,
				resetOnComplete: true,
				createEventListener: true,
				minHeight: "400px",
				footer: null,
				themeId: "default",
				selectors: {
					"@container": {
						tagName: "div",
						className: "form-widget-wrapper"
					},
					"@form": {
						tagName: "form",
						className: "native form"
					},
					"@form>group": {
						tagName: "fieldset",
						className: "form-group"
					},
					"@form>group>legend": {
						tagName: "legend",
						className: "title"
					},
					"@form>group>desc": {
						tagName: "p",
						className: "desc"
					},
					"@form>title": {
						tagName: "h2",
						className: "title"
					},
					"@form>desc": {
						tagName: "p",
						className: "desc"
					},
					"@form>row": {
						tagName: "div",
						className: "field group"
					},
					"@form>row>title": {
						tagName: "p",
						className: "title"
					},
					"@form>actions": {
						tagName: "div",
						className: "form-actions"
					},
					"@form>actions>submit": {
						tagName: "button",
						className: "submit",
						type: "submit"
					},
					"@form>actions>submit-group": {
						tagName: "button",
						className: "submit",
						type: "button"
					},
					"@form>footer": {
						tagName: "div",
						className: "form-footer"
					},
					"@form>buttons-set": {
						tagName: "div",
						className: "buttons set"
					}
				},
				multistep: false,
				cascading: false,
				cascadeMode: "template",
				autoDisableNextStep: false,
				onCascade: null,
				calculation: false,
				namespace: null,
				emit: null,
				onSubmit: (_data) => {},
				files: "ignore",
				excludeEmpty: false,
				address: null,
				modules: null,
				inputModules: null,
				messages: {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
			_classPrivateFieldSet2(_loader$1, this, this.config.modules ?? new ModuleLoader$1("form", []));
			_classPrivateFieldSet2(_inputModules, this, [...this.config.inputModules ?? []]);
		}
		/**
		* REFACTOR TOTAL: Merakit Form menggunakan struktur iBasicNode[] murni
		*/
		prepare(inputs, _config = {}) {
			if (!_get_activeLoader.call(_assertClassBrand(_FormBuilder_brand, this)).ids().length && !_classPrivateFieldGet2(_providedLive, this).size) throw new Error("[FormBuilder] No modules configured, so not one field can be rendered. Pass the stack: new ModuleLoader(\"form\", FORM_ADAPTER_DEFINITIONS) — those definitions are exported by @aio-ui/form/adapters — or, at minimum, [inputFormAdapter], exported by @aio-ui/form/Input.FormAdapter.");
			_classPrivateFieldSet2(_inputs, this, Array.isArray(inputs) ? inputs : [inputs]);
			_assertClassBrand(_FormBuilder_brand, this, _routeInputModules).call(this);
			_get_activeLoader.call(_assertClassBrand(_FormBuilder_brand, this)).unloadAll();
			_classPrivateFieldSet2(_features, this, []);
			_classPrivateFieldSet2(_cascade, this, null);
			_classPrivateFieldSet2(_multistep, this, null);
			_classPrivateFieldSet2(_validation, this, null);
			_classPrivateFieldSet2(_onStepMounted, this, null);
			const form = this.render("@form", inputs);
			const formId = form.id;
			const isCascading = this.config.cascading === true;
			if (this.config.title) form.appendChild(this.render("@form>title", this.config.title));
			if (this.config.description) form.appendChild(this.render("@form>desc", this.config.description));
			const moduleContext = this._buildModuleContext(form, "prepare");
			_classPrivateFieldSet2(_features, this, _assertClassBrand(_FormBuilder_brand, this, _resolved).call(this, moduleContext));
			_classPrivateFieldSet2(_validation, this, _assertClassBrand(_FormBuilder_brand, this, _loaded).call(this, FORM_MODULE_IDS.validation));
			_classPrivateFieldSet2(_cascade, this, _assertClassBrand(_FormBuilder_brand, this, _loaded).call(this, FORM_MODULE_IDS.cascade));
			_classPrivateFieldSet2(_multistep, this, _assertClassBrand(_FormBuilder_brand, this, _loaded).call(this, FORM_MODULE_IDS.multistep));
			for (const [index, input] of Object.entries(_classPrivateFieldGet2(_inputs, this))) if (input instanceof HTMLElement) {
				const btn = this.scanForSubmitButton(input, formId);
				if (btn) {
					this.submitButtonId = btn.id || this.submitButtonId;
					form.append(btn);
				} else form.append(input);
			} else if (typeof input === "string") {
				const btn = this.scanForSubmitButton(input, formId);
				if (btn) {
					this.submitButtonId = btn.id;
					form.appendChild(btn);
				} else form.insertAdjacentHTML("beforeend", input);
			} else if (input && typeof input === "object" && "group" in input) {
				if (isCascading && _classPrivateFieldGet2(_cascade, this)?.isCascadeItem(input)) {
					_classPrivateFieldGet2(_cascade, this)?.hold(form, String(index), input);
					continue;
				}
				if (this.config.multistep) {
					_classPrivateFieldGet2(_multistep, this)?.hold(form, Number(index), input);
					continue;
				}
				const fieldset = this.renderGroup(input, formId, isCascading ? String(index) : void 0);
				if (input.id) fieldset.id = input.id;
				if (input.className) fieldset.classList.add(...String(input.className).split(/\s+/).filter(Boolean));
				form.appendChild(fieldset);
			} else if (input && typeof input === "object" && "row" in input) {
				if (isCascading && _classPrivateFieldGet2(_cascade, this)?.isCascadeItem(input)) {
					_classPrivateFieldGet2(_cascade, this)?.hold(form, String(index), input);
					continue;
				}
				form.appendChild(this.renderRow(input, formId, isCascading ? String(index) : void 0));
			} else {
				if (isCascading && _classPrivateFieldGet2(_cascade, this)?.isCascadeItem(input)) {
					_classPrivateFieldGet2(_cascade, this)?.hold(form, String(index), input);
					continue;
				}
				const inputEl = this._renderField(input, formId);
				form.append(inputEl);
			}
			if (isCascading || this.config.autoDisableNextStep === true) _classPrivateFieldGet2(_cascade, this)?.attach(form);
			if (!this.submitButtonId && this.config.submitButton && !this.config.multistep) {
				const defaultSubmitBtn = this.render("@form>actions>submit", {
					isGroupBtn: false,
					formId
				});
				this.submitButtonId = defaultSubmitBtn.id;
				form.append(defaultSubmitBtn);
			}
			if (this.config.footer) {
				if (this.config.footer instanceof HTMLElement) form.appendChild(this.config.footer);
				else {
					const footerEl = this.render("@form>footer", this.config.footer);
					form.appendChild(footerEl);
				}
			}
			return form;
		}
		/**
		* Recursively renders a group (fieldset) and its child inputs or sub-groups.
		* Param `cascade` opsional: saat aktif, anak-anak group yang membawa `.condition`
		* ditahan ke registry kaskade alih-alih langsung dirender.
		*/
		renderGroup(groupInput, formId, cascadePath) {
			const fieldset = this.render("@form>group", groupInput);
			const cascadeActive = this.config.cascading === true && cascadePath !== void 0;
			if (groupInput.group && Array.isArray(groupInput.group)) groupInput.group.forEach((innerInput, _index) => {
				if (cascadeActive && _classPrivateFieldGet2(_cascade, this)?.isCascadeItem(innerInput)) {
					_classPrivateFieldGet2(_cascade, this)?.hold(fieldset, `${cascadePath}.group.${_index}`, innerInput);
					return;
				}
				if (typeof innerInput === "string") {
					const btn = this.scanForSubmitButton(innerInput, formId);
					if (btn) this.submitButtonId = btn.id;
					fieldset.insertAdjacentHTML("beforeend", innerInput);
					const s = fieldset.querySelector("[type='submit']");
					if (s) s.id = this.submitButtonId;
				} else if (innerInput && typeof innerInput === "object" && "row" in innerInput) {
					const nestedRow = this.renderRow(innerInput, formId, cascadeActive ? `${cascadePath}.group.${_index}` : void 0);
					if (innerInput.id) nestedRow.id = innerInput.id;
					fieldset.appendChild(nestedRow);
				} else if (innerInput && typeof innerInput === "object" && "group" in innerInput) {
					const nestedFieldset = this.renderGroup(innerInput, formId, cascadeActive ? `${cascadePath}.group.${_index}` : void 0);
					if (innerInput.id) nestedFieldset.id = innerInput.id;
					if (innerInput.table !== void 0) {
						const groupSubmitBtn = this.render("@form>actions>submit", {
							isGroupBtn: false,
							groupId: innerInput.id
						});
						for (const feature of _classPrivateFieldGet2(_features, this)) {
							const nodes = feature.renderTable?.(innerInput.table, {
								fieldset: nestedFieldset,
								submitButton: groupSubmitBtn,
								groupId: innerInput.id
							});
							if (nodes && nodes.length) {
								nestedFieldset.append(groupSubmitBtn, ...nodes);
								break;
							}
						}
					}
					fieldset.appendChild(nestedFieldset);
				} else {
					const inputEl = innerInput instanceof HTMLElement ? innerInput : this._renderField(innerInput, formId);
					const btn = this.scanForSubmitButton(inputEl, formId);
					if (btn) this.submitButtonId = btn.id;
					fieldset.append(inputEl);
				}
			});
			if (groupInput.submitButton) {
				const submitBtn = this.render("@form>actions>submit", {
					isGroupBtn: true,
					formId
				});
				this.submitButtonId = submitBtn.id;
				fieldset.appendChild(submitBtn);
			}
			_assertClassBrand(_FormBuilder_brand, this, _appendActions).call(this, fieldset, groupInput);
			return fieldset;
		}
		/**
		* Renders a row: fields side by side in a CSS grid.
		*
		* A row is **layout only** — it produces no legend, no fieldset and no field data, which
		* is why `group` (fieldset + legend) stays a separate word in the schema. Children wrap
		* on their own once the declared column count is exhausted; a child's width comes from
		* its `wide` hint (`50` → half, `"auto"` → full row) or an explicit `span`.
		*
		* Nesting works: a row inside a row is just another grid cell, so a stacked column is
		* `{ column: 1, wide: 50, row: [...] }`.
		*
		* @param rowInput - Row node (`{ label, column, row: [...] }`).
		* @param formId - Id of the owning form.
		* @param cascadePath - Path segment when cascade is active, so a conditional child can
		*   be held and mounted later with the same key the engine walks.
		* @returns The row container element.
		*/
		renderRow(rowInput, formId, cascadePath) {
			const container = this.render("@form>row", rowInput);
			const columns = columnsOf(rowInput.column);
			applyRowColumns(container, columns);
			if (rowInput.id) container.id = rowInput.id;
			if (rowInput.className) container.classList.add(...String(rowInput.className).split(" ").filter(Boolean));
			if (rowInput.label) container.appendChild(this.render("@form>row>title", rowInput.label));
			if (rowInput.description) container.appendChild(this.render("@form>group>desc", rowInput.description));
			const cascadeActive = this.config.cascading === true && cascadePath !== void 0;
			(Array.isArray(rowInput.row) ? rowInput.row : []).forEach((child, index) => {
				const childPath = `${cascadePath}.row.${index}`;
				if (cascadeActive && _classPrivateFieldGet2(_cascade, this)?.isCascadeItem(child)) {
					_classPrivateFieldGet2(_cascade, this)?.hold(container, childPath, child);
					return;
				}
				let element = null;
				if (typeof child === "string") {
					container.insertAdjacentHTML("beforeend", child);
					element = container.lastElementChild;
				} else if (child instanceof HTMLElement) element = child;
				else if (child && typeof child === "object" && "row" in child) element = this.renderRow(child, formId, cascadeActive ? childPath : void 0);
				else if (child && typeof child === "object" && "group" in child) element = this.renderGroup(child, formId, cascadeActive ? childPath : void 0);
				else element = this._renderField(child, formId);
				if (!element) return;
				const submitBtn = this.scanForSubmitButton(element, formId);
				if (submitBtn) this.submitButtonId = submitBtn.id;
				applyRowSpan(element, childSpanOf(child, columns));
				container.appendChild(element);
			});
			_assertClassBrand(_FormBuilder_brand, this, _appendActions).call(this, container, rowInput);
			return container;
		}
		/**
		* Renders one field through the loaded input module.
		*
		* @summary Keeps `InputBuilder` out of the builder: the module owns field
		* creation, the form only asks for an element.
		* @param input - Input schema or raw descriptor.
		* @param formId - Id of the owning form.
		* @returns The rendered field element.
		* @throws {Error} When no loaded module can render fields, meaning the `input`
		*   module is missing from the presets.
		*/
		_renderField(input, formId) {
			for (const feature of _classPrivateFieldGet2(_features, this)) {
				const element = feature.renderField?.(input, formId);
				if (element) return element;
			}
			throw new Error("[FormBuilder] No module rendered the field. Register the input module in the loader preset.");
		}
		_buildModuleContext(form, phase) {
			return {
				builder: String(this.builderId),
				form,
				inputs: _classPrivateFieldGet2(_inputs, this),
				phase,
				emit: typeof this.config.emit === "function" ? this.config.emit : null,
				builderConfig: {
					themeId: this.config.themeId,
					namespace: this.config.namespace,
					emit: typeof this.config.emit === "function" ? this.config.emit : null
				},
				inputModules: _classPrivateFieldGet2(_inputModules, this),
				showMessage: (content) => this._notify(form, false, content),
				config: this.config,
				cascadeHost: () => this._buildCascadeHost(),
				multistepHost: () => this._buildMultistepHost()
			};
		}
		_buildCascadeHost() {
			return {
				builder: this.builderId,
				inputs: _classPrivateFieldGet2(_inputs, this),
				multistep: this.config.multistep === true,
				cascadeMode: this.config.cascadeMode ?? "template",
				autoDisableNextStep: this.config.autoDisableNextStep ?? (this.config.cascading === true && this.config.multistep === true),
				onCascade: typeof this.config.onCascade === "function" ? this.config.onCascade : null,
				emit: typeof this.config.emit === "function" ? this.config.emit : null,
				renderGroup: (group, formId, path) => this.renderGroup(group, formId, path),
				renderRow: (row, formId, path) => this.renderRow(row, formId, path),
				renderField: (item, formId) => this._renderField(item, formId),
				mountInputs: (root) => {
					for (const feature of _classPrivateFieldGet2(_features, this)) feature.mount?.(root);
				},
				refreshSteps: (form) => _classPrivateFieldGet2(_multistep, this)?.refresh(form),
				reportCascadeBlocked: (info) => _classPrivateFieldGet2(_validation, this)?.reportCascadeBlocked(info)
			};
		}
		_buildMultistepHost() {
			return {
				builder: this.builderId,
				inputs: _classPrivateFieldGet2(_inputs, this),
				renderGroup: (group, formId, path) => this.renderGroup(group, formId, path),
				renderButtonsSet: (payload) => this.render("@form>buttons-set", payload),
				onStepMount: (fieldset) => _classPrivateFieldGet2(_onStepMounted, this)?.call(this, fieldset),
				onStepChange: () => _classPrivateFieldGet2(_cascade, this)?.gate(),
				reportNativeInvalid: (form, step) => _classPrivateFieldGet2(_validation, this)?.reportNative(form, step)
			};
		}
		/** Set nilai field secara programatik — engine memantik evaluasi via event change */
		setCascadeValue(field, value) {
			_classPrivateFieldGet2(_cascade, this)?.setValue(field, value);
		}
		/**
		* 🪜 Multistep: posisi langkah aktif, gerbang validasi, dan pelahirkan
		* fieldset langkah kini sepenuhnya dikelola engine FormMultistepHandler
		* (Handlers/Multistep.ts) — lihat _buildMultistepHost().
		*/
		initialize(formElement) {
			if (formElement && this.config.createEventListener) this.attachFormListener(formElement);
			_classPrivateFieldGet2(_features, this).push(..._assertClassBrand(_FormBuilder_brand, this, _loadFeatures).call(this, this._buildModuleContext(formElement, "initialize")));
		}
		template(typeKey, el, payload) {
			switch (typeKey) {
				case "@container":
					el.style.minHeight = this.config.minHeight;
					break;
				case "@form": {
					const form = el;
					const randomSuffix = Math.random().toString(36).substring(7);
					form.id = this.config.id ? `form-${this.config.id}`.replace(/\s+/g, "-") : `form-${randomSuffix}`;
					if (this.config.className) form.classList.add(...String(this.config.className).split(/\s+/).filter(Boolean));
					if (this.config.multistep) form.classList.add("multistep");
					form.method = this.config.method;
					if (this.config.action) form.action = this.config.action;
					if (this.config.name) form.name = String(this.config.name);
					break;
				}
				case "@form>group": {
					if (payload?.class) el.className = `${el.className} ${payload.class}`.trim();
					const legendText = payload?.legend || payload?.title;
					if (legendText) {
						const legend = document.createElement("legend");
						legend.className = "title";
						legend.textContent = String(legendText);
						el.appendChild(legend);
					}
					if (payload?.description) {
						const desc = document.createElement("p");
						desc.className = "desc";
						desc.textContent = String(payload.description);
						el.appendChild(desc);
					}
					if (payload?.infos) {
						const list = document.createElement("ul");
						list.className = "group-infos";
						if (Array.isArray(payload.infos)) for (const i of payload.infos) {
							const item = document.createElement("li");
							item.className = "item";
							item.textContent = String(i);
							list.appendChild(item);
						}
						el.appendChild(list);
					}
					break;
				}
				case "@form>row>title":
					el.textContent = typeof payload === "string" ? payload : String(payload?.label ?? "");
					break;
				case "@form>title":
				case "@form>desc":
					el.textContent = typeof payload === "string" ? payload : String(payload?.label ?? payload?.description ?? "");
					break;
				case "@form>group>desc":
					el.textContent = typeof payload === "string" ? payload : String(payload?.description ?? "");
					break;
				case "@form>actions>submit": {
					const btn = el;
					btn.className = `${this.config.buttonClass} ${btn.className || ""}`.trim();
					btn.type = "submit";
					btn.textContent = this.config.buttonText;
					const sIcon = document.createElement("i");
					sIcon.className = "icon checkmark";
					btn.appendChild(sIcon);
					if (payload?.isGroupBtn) btn.id = payload.formId ? `btn-${payload.formId}` : `btn-group-${Math.random().toString(36).substring(7)}`;
					else btn.id = `btn-${payload?.formId || "default"}`;
					break;
				}
				case "@form>buttons-set": {
					const next = document.createElement("button");
					next.className = "next";
					next.type = "button";
					const nIcon = document.createElement("i");
					nIcon.className = "icon arrow right";
					next.textContent = "next";
					next.appendChild(nIcon);
					const back = document.createElement("button");
					back.className = "back";
					back.type = "button";
					const bIcon = document.createElement("i");
					bIcon.className = "icon arrow left";
					back.textContent = "back";
					back.prepend(bIcon);
					if (Number(payload.index) === 0) el.append(next);
					else if (payload.isLast) {
						const submit = this.render("@form>actions>submit");
						el.append(back, submit);
					} else el.append(back, next);
					break;
				}
				case "@form>footer": el.textContent = typeof payload === "string" ? payload : payload?.text || "";
			}
		}
		unmount() {
			_get_activeLoader.call(_assertClassBrand(_FormBuilder_brand, this)).unloadAll();
			_classPrivateFieldSet2(_features, this, []);
			_classPrivateFieldSet2(_validation, this, null);
			_classPrivateFieldSet2(_cascade, this, null);
			_classPrivateFieldSet2(_multistep, this, null);
			_classPrivateFieldSet2(_onStepMounted, this, null);
			this.destroy();
		}
		/**
		* Listener submit/klik + orkestrasi hook kolaborator (mount, beforeSubmit).
		*/
		attachFormListener(form) {
			const toggleLoadingState = (success) => {
				form.classList.remove("loading");
				form.querySelectorAll(".field").forEach((f) => f.classList.remove("error"));
				if (!success) form.querySelectorAll(".field").forEach((f) => f.classList.add("error"));
			};
			form.addEventListener("scopeAdded", () => {
				_classPrivateFieldGet2(_cascade, this)?.sync();
				_classPrivateFieldGet2(_multistep, this)?.refresh(form);
			});
			_classPrivateFieldSet2(_onStepMounted, this, (fieldset) => {
				for (const feature of _classPrivateFieldGet2(_features, this)) feature.mount?.(fieldset);
				_classPrivateFieldGet2(_cascade, this)?.sync();
			});
			_classPrivateFieldGet2(_multistep, this)?.attach(form);
			for (const feature of _classPrivateFieldGet2(_features, this)) feature.mount?.(form);
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				if (!form.checkValidity()) {
					_classPrivateFieldGet2(_validation, this)?.reportNative(form);
					return;
				}
				form.classList.add("loading");
				const data = collectFormValues(form, { excludeEmpty: this.config.excludeEmpty });
				for (const feature of _classPrivateFieldGet2(_features, this)) await feature.beforeSubmit?.(data);
				if (this.config.resetOnSubmit) _assertClassBrand(_FormBuilder_brand, this, _resetForm).call(this, form);
				if (typeof this.config.onSubmit === "function") try {
					this.config.onSubmit(data);
				} catch (error) {
					console.error("[FormBuilder] onSubmit failed:", error);
				}
				form.dispatchEvent(new CustomEvent("formSubmit", {
					bubbles: true,
					detail: {
						formId: form.id,
						data,
						complete: (success, messageConfig, resetForm) => {
							toggleLoadingState(success);
							this._notify(form, success, messageConfig);
							if (resetForm || this.config.resetOnComplete) _assertClassBrand(_FormBuilder_brand, this, _resetForm).call(this, form);
						},
						reset: () => _assertClassBrand(_FormBuilder_brand, this, _resetForm).call(this, form)
					}
				}));
			});
			form.addEventListener("click", (event) => {
				const button = event.target?.closest?.("button[type=submit], input[type=submit]");
				if (!button) return;
				if (!form.contains(button) && button.getAttribute("form") !== form.id) return;
				event.preventDefault();
				if (!form.checkValidity()) {
					_classPrivateFieldGet2(_validation, this)?.reportNative(form);
					return;
				}
				form.requestSubmit(button);
			});
		}
		/**
		* Presents a status message through the loaded message module.
		*
		* @summary `FormBuilder` owns no message renderer: the module that implements
		* `notify` decides how the message appears. Without such a module the builder
		* warns instead of failing, so plugging the module out never breaks rendering.
		* @param form - Form the message belongs to.
		* @param success - Whether the action that produced the message succeeded.
		* @param content - Message content, possibly already filled by the caller.
		* @returns Nothing.
		*/
		_notify(form, success, content) {
			if (!content) return;
			for (const feature of _classPrivateFieldGet2(_features, this)) {
				if (!feature.notify) continue;
				feature.notify(content, {
					form,
					success
				});
				return;
			}
			console.warn("[FormBuilder] No module handles messages. Register the message module in the loader preset.");
		}
		/**
		* Helper internal untuk memindai string HTML mentah atau element hidup 
		* guna mencari tombol submit yang sudah ada (untuk link ID)
		*/
		scanForSubmitButton(input, formId) {
			if (!input) return null;
			let btn = null;
			if (input instanceof HTMLButtonElement) btn = input.type === "submit" ? input : input.querySelector("button[type=submit], input[type=submit]");
			else if (typeof input === "string") {
				const wrapper = document.createElement("div");
				wrapper.insertAdjacentHTML("beforeend", input.trim());
				btn = wrapper.querySelector("button[type=submit], input[type=submit]");
			}
			if (btn) {
				if (!btn.id) btn.id = `btn-${formId}`;
				btn.setAttribute("form", formId);
				return btn;
			}
			return null;
		}
	};
	/**
	* Loader yang benar-benar dipakai: bawaan form, dari `config.modules`, atau dari
	* definisi yang diserahkan registry.
	*/
	function _get_activeLoader() {
		return _classPrivateFieldGet2(_providedLoader, this) ?? _classPrivateFieldGet2(_loader$1, this);
	}
	/**
	* Modul form untuk satu fase: definisi yang diserahkan registry dimenangkan.
	*
	* @param context - Konteks host yang dioper ke definisi.
	* @returns Hasil modul, satu per adapter.
	*
	* @summary Sama persis dengan `resolveAll()` — hanya modul yang belum hidup yang
	* dimuat — kecuali satu hal: id milik `INPUT_MODULE_IDS` dilewati. Id itu bukan
	* perilaku form, melainkan preset sebuah field, dan `#routeInputModules()` yang
	* menyerahkannya ke lapisan input. Tanpa aturan ini
	* `@aio-ui/form/adapters` (stack penuh) akan memuat dropdown sebagai fitur form.
	*/
	function _resolved(context) {
		return [..._assertClassBrand(_FormBuilder_brand, this, _loadFeatures).call(this, context), ..._classPrivateFieldGet2(_providedLive, this).values()];
	}
	/**
	* Memuat modul form yang baru hidup pada satu fase.
	*
	* @param context - Konteks host yang dioper ke definisi.
	* @returns Instance yang lahir pada pemanggilan ini saja.
	*
	* @summary Sama persis dengan `resolveAll()` — hanya modul yang belum hidup yang
	* dimuat, urutan registrasi dipertahankan — kecuali satu hal: id milik
	* `INPUT_MODULE_IDS` dilewati. Id itu bukan perilaku form, melainkan preset sebuah
	* field, dan `#routeInputModules()` yang menyerahkannya ke lapisan input.
	*/
	function _loadFeatures(context) {
		const inputIds = new Set(Object.values(INPUT_MODULE_IDS$1));
		const features = [];
		for (const id of _get_activeLoader.call(_assertClassBrand(_FormBuilder_brand, this)).ids()) {
			if (inputIds.has(id)) continue;
			if (_get_activeLoader.call(_assertClassBrand(_FormBuilder_brand, this)).isLoaded(id)) continue;
			const instance = _get_activeLoader.call(_assertClassBrand(_FormBuilder_brand, this)).load(id, context);
			if (instance) features.push(instance);
		}
		return features;
	}
	/**
	* Memindahkan id lapisan field dari loader ke preset field.
	*
	* @summary `FORM_ADAPTER_DEFINITIONS` adalah stack **penuh**, jadi loader form juga
	* membawa empat definisi input. Keempatnya bukan perilaku form: mereka preset yang
	* dipakai saat sebuah field dibangun. Definisi diserahkan apa adanya (bukan instance)
	* karena `InputBuilder` yang memiliki siklus hidupnya — satu instance per render field,
	* dilepas oleh builder yang membuatnya.
	*
	* Id yang sudah diserahkan manifest (`provideModules()`) menang: host sudah menyatakan
	* setnya, dan stack bawaan tidak boleh menimpanya.
	*/
	function _routeInputModules() {
		const inputIds = new Set(Object.values(INPUT_MODULE_IDS$1));
		const routed = [];
		for (const id of _get_activeLoader.call(_assertClassBrand(_FormBuilder_brand, this)).ids()) {
			if (!inputIds.has(id)) continue;
			if (_classPrivateFieldGet2(_inputModules, this).some((item) => String(item.id) === id)) continue;
			const definition = _get_activeLoader.call(_assertClassBrand(_FormBuilder_brand, this)).resolve(id);
			if (definition) routed.push(definition);
		}
		if (routed.length) _classPrivateFieldSet2(_inputModules, this, [..._classPrivateFieldGet2(_inputModules, this), ...routed]);
	}
	/**
	* Satu adapter form menurut id-nya.
	*
	* @param id - Id sub-modul (`FORM_MODULE_IDS`).
	* @returns Modulnya, atau `null` bila tidak tersedia.
	*/
	function _loaded(id) {
		if (_classPrivateFieldGet2(_providedLive, this).has(id)) return _classPrivateFieldGet2(_providedLive, this).get(id);
		return _get_activeLoader.call(_assertClassBrand(_FormBuilder_brand, this)).loaded(id) ?? null;
	}
	/**
	* Offers a group/row container to the loaded modules for a control set.
	*
	* @param container - `<fieldset>` or row `<div>` that declares `actions`.
	* @param node - Group/row schema node.
	*
	* @summary The first module that answers wins, exactly like `renderTable`: the form never
	* imports the controls builder, and a preset without it simply renders no buttons.
	*/
	function _appendActions(container, node) {
		const actions = node.actions ?? node.config?.actions;
		if (!actions) return;
		for (const feature of _classPrivateFieldGet2(_features, this)) {
			const nodes = feature.renderActions?.(container, {
				actions,
				position: node.actionsPosition ?? node.config?.position
			});
			if (nodes && nodes.length) {
				container.append(...nodes);
				return;
			}
		}
	}
	/**
	* Resets the form and tells every adapter to drop its own state.
	*
	* @summary `form.reset()` restores controls the browser knows about; a preview table, an
	* uploader's file list or an address picker keep showing the old values unless their
	* module is told. The shell owns the controls, the modules own the rest.
	* @param form - Form to reset.
	*/
	function _resetForm(form) {
		form.reset();
		for (const feature of _classPrivateFieldGet2(_features, this)) try {
			feature.reset?.(form);
		} catch (error) {
			console.warn("[FormBuilder] module reset failed:", error);
		}
	}
	_defineProperty(FormBuilder, "contract", {
		schema: {
			t: "list",
			single: true,
			of: {
				t: "record",
				open: true,
				of: { group: {
					t: "list",
					of: { t: "any" }
				} }
			}
		},
		example: [{
			id: "group-1",
			title: "Shipping",
			group: [{
				type: "text",
				id: "name",
				title: "Name"
			}]
		}]
	});
	// packages/components/form/FormRegistry.ts
	/**
	* The stack as manifest refs, plus the input sub-modules a form normally wants.
	*
	* @summary `scope` is what makes the split work: a parent that nests another builder
	* declares both layers here, and `Form.provideModules()` routes by id — `"input"` entries
	* become the field-level preset (`@aio-ui/input` owns them, the form only mounts them),
	* everything else stays with the form. Adapters owned by yet other packages (`table`,
	* `message`, `id-address`) are deliberately absent: the host composes those.
	*/
	var FORM_ADAPTER_MANIFEST = [
		{
			id: "validation",
			path: "@aio-ui/form/validation-adapter",
			export: "validationFormAdapter",
			scope: "form"
		},
		{
			id: "cascade",
			path: "@aio-ui/form/cascade-adapter",
			export: "cascadeFormAdapter",
			scope: "form"
		},
		{
			id: "multistep",
			path: "@aio-ui/form/multistep-adapter",
			export: "multistepFormAdapter",
			scope: "form"
		},
		{
			id: "calculation",
			path: "@aio-ui/form/calculation-adapter",
			export: "calculationFormAdapter",
			scope: "form"
		},
		{
			id: "input",
			path: "@aio-ui/form/Input.FormAdapter",
			export: "inputFormAdapter",
			scope: "form"
		},
		...INPUT_MODULE_MANIFEST$1.map((ref) => ({
			...ref,
			scope: "input"
		}))
	];
	// packages/components/form/index.ts
	var form_exports = /* @__PURE__ */ __exportAll({
		DEFAULT_FORM_MESSAGES: () => DEFAULT_FORM_MESSAGES,
		FORM_ADAPTER_MANIFEST: () => FORM_ADAPTER_MANIFEST,
		FORM_MODULE_IDS: () => FORM_MODULE_IDS,
		FormBuilder: () => FormBuilder,
		composeMessage: () => composeMessage,
		messageDraft: () => messageDraft,
		resolveStyle: () => resolveStyle
	});
	// packages/modules/http-service/HttpService.ts
	var HttpService$1 = class {
		constructor(config = {}) {
			_defineProperty(
				this,
				/**
				* @property {boolean} _destroyed
				* @description Whether this instance has been destroyed and should ignore async work.
				*/
				"_destroyed",
				false
			);
			_defineProperty(
				this,
				/**
				* @property {Set<AbortController>} _abortControllers
				* @description Active request controllers used to cancel pending API calls.
				*/
				"_abortControllers",
				/* @__PURE__ */ new Set()
			);
			_defineProperty(
				this,
				/**
				* @property {iHttpServiceConfig} _config
				* @description Merged runtime configuration for API, cache, text, container, and adapter behavior.
				*/
				"config",
				void 0
			);
			const defaultConfig = {
				url: "",
				cacheEnabled: false,
				cacheTtlDays: 1,
				cachePrefix: "app",
				timeout: 1e4,
				delay: 1e3
			};
			this.config = {
				...defaultConfig,
				...config
			};
			if (this.config.cacheEnabled) this._validateCache();
		}
		/**
		* Releases in-flight requests and stops accepting new ones.
		*
		* The app contract calls `port.destroy?.()` on every module, and a consumer that built
		* its own service (the address picker does) needs the same door to close it.
		*/
		destroy() {
			this._destroyed = true;
			for (const controller of this._abortControllers) try {
				controller.abort();
			} catch {}
			this._abortControllers.clear();
		}
		/**
		* Retrieves administrative regional data either from the local cache or by calling the remote API.
		*
		* @param {Object} [query={}] - The query parameters for the data request.
		* @returns {Promise<Array|Object>} A promise that resolves to the requested regional data.
		* @throws {Error} If the API request fails or cache retrieval encounters a critical error.
		*
		* @example
		* const cities = await service.get({ level: 'kota', parentId: 11 });
		*
		* @description
		* This method acts as a data proxy. It generates a unique cache key based on the query parameters,
		* checks if valid data exists in `localStorage`, and if not, performs a network fetch.
		* To ensure a consistent UI experience, it introduces a configurable artificial delay
		* when serving data from the cache.
		*/
		async get(query) {
			const cacheKey = this._constructCacheKey(query, "get");
			let isLocal = false;
			let data = null;
			if (this.config.cacheEnabled) {
				const cached = this._loadCache(cacheKey);
				if (cached) {
					isLocal = true;
					data = cached;
				}
			}
			if (!data) {
				isLocal = false;
				data = await this._fetchAPI(query);
				if (this.config.cacheEnabled) this._writeCache(cacheKey, data);
			}
			try {
				if (isLocal && this.config.delay > 0) await new Promise((resolve) => setTimeout(resolve, this.config.delay));
				if (this.config.debug) console.log(`[HttpService] ${isLocal ? "cache" : "api"}`, query, data);
				return data;
			} catch (error) {
				localStorage.removeItem(`${this.config.cachePrefix}:${cacheKey}`);
				throw error;
			}
		}
		/**
		* Submits data to the remote API using a POST request and caches the successful response.
		*
		* @param {Object} query - Configuration parameter to determine the cache structural key.
		* @param {Object} payload - The JavaScript object containing the body data to be sent as JSON.
		* @returns {Promise<Array|Object>} A promise that resolves to the processed data returned by the API.
		* @throws {Error} If the API request fails.
		*/
		async post(query, payload) {
			const fetchOptions = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			};
			const data = await this._fetchAPI(query, fetchOptions);
			if (this.config.cacheEnabled) {
				const cacheKey = this._constructCacheKey(query, "post");
				this._writeCache(cacheKey, data);
			}
			if (this.config.debug) console.log(`[HttpService] POST`, query, data);
			return data;
		}
		/**
		* Constructing key for storing data in `localStorage` cache
		* @param query 
		* @param suffix 
		* @returns Cache Key for `localStorage`
		*/
		_constructCacheKey(query, suffix) {
			return `${Object.entries(query ?? {}).filter(([, value]) => value !== void 0 && value !== null).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}-${String(value)}`).join("|") || "root"}-${suffix}`;
		}
		/**
		* Default URL builder: the configured base plus every defined query parameter.
		*
		* Kept separate so `config.endpoint` can replace it without duplicating the
		* parameter sanitising.
		*/
		_buildUrl(query) {
			const baseUrl = (this.config.url ?? "").replace(/\/+$/, "");
			const params = new URLSearchParams();
			for (const [k, v] of Object.entries(query)) if (v !== void 0 && v !== null) params.append(k, v);
			return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
		}
		/**
		* Performs a network request to the configured API endpoint with automatic timeout and abort handling.
		*
		* @param {Object} [query={}] - Key-value pairs to be appended as URL search parameters.
		* @param {RequestInit} [options={}] - Standard fetch options (method, headers, etc.).
		* @param {number} [timeout=10000] - Maximum time in milliseconds to wait before aborting the request.
		* @returns {Promise<any>} A promise that resolves to the 'data' property of the successful JSON response.
		* @throws {Error} If the request times out, returns a non-2xx status, or the JSON payload indicates failure.
		*
		* @example
		* const data = await service._fetchAPI({ level: 'propinsi' });
		*
		* @description
		* This method wraps the native `fetch` API with a lifecycle management system. It creates an
		* `AbortController` for every request, registers it in an internal set for cleanup during
		* instance destruction, and sets a timer to trigger an abort if the server doesn't respond
		* within the specified window. It also normalizes the API response format.
		*/
		async _fetchAPI(query = {}, options = {}, timeout = 1e4) {
			if (this._destroyed) return;
			const controller = new AbortController();
			this._abortControllers.add(controller);
			const requestTimeout = this.config.timeout ?? timeout;
			let timeoutId;
			if (typeof AbortSignal.timeout === "function") options.signal = AbortSignal.any([controller.signal, AbortSignal.timeout(requestTimeout)]);
			else {
				timeoutId = setTimeout(() => controller.abort(), requestTimeout);
				options.signal = controller.signal;
			}
			const url = this.config.endpoint?.(query) ?? this._buildUrl(query);
			if (this.config.debug) console.log(`[HttpService] GET ${url}`, query);
			try {
				const res = await fetch(url, options);
				if (timeoutId) clearTimeout(timeoutId);
				if (!res.ok) throw new Error(res.statusText || `HTTP Error ${res.status}`);
				const json = await res.json();
				if (json && (json.success === true || json.status === "success")) return json;
				throw new Error(json?.message || "Invalid response");
			} catch (err) {
				console.error("❌ Fetching Data Faild", err);
				if (timeoutId) clearTimeout(timeoutId);
				if (err instanceof Error && err.name === "AbortError") throw new Error("Request timed out");
				throw err;
			} finally {
				this._abortControllers.delete(controller);
			}
		}
		/**
		* Checks whether the builder cache is still valid and clears expired entries when needed.
		*
		* @param {boolean} [clearNow=false] - Forces cache clearing even when the stored expiration is still valid.
		* @returns {void} Does not return a value; it updates `localStorage` cache metadata as a side effect.
		* @throws {void} Storage errors are caught and logged instead of being thrown.
		*
		* @example
		* const service = new HttpService({ url: '/api/address', cacheEnabled: true });
		* service._validateCache(true); // Force all HttpService cache entries to be refreshed.
		*
		* @description
		* How it works: the method reads the cache expiration marker, exits early when the marker
		* is still in the future, otherwise removes every `localStorage` item using the configured
		* cache prefix and writes a new expiration timestamp based on `cache.ttlDays`.
		*/
		_validateCache(clearNow = false) {
			if (!this.config.cacheEnabled) return;
			try {
				const expiredTimeKey = `${this.config.cachePrefix}:expired-time`;
				const storedExpiredTime = localStorage.getItem(expiredTimeKey);
				const now = Date.now();
				if (!clearNow || storedExpiredTime && parseInt(storedExpiredTime, 10) <= now) {
					for (let i = localStorage.length - 1; i >= 0; i--) {
						const key = localStorage.key(i);
						if (key?.startsWith(this.config.cachePrefix + ":")) localStorage.removeItem(key);
					}
					const ttl = this.config.cacheTtlDays * 24 * 3600 * 1e3;
					localStorage.setItem(expiredTimeKey, (now + ttl).toString());
					console.info(`Cache namespace synchronized and cleared.`);
				} else if (!storedExpiredTime) {
					const ttl = this.config.cacheTtlDays * 24 * 3600 * 1e3;
					localStorage.setItem(expiredTimeKey, (now + ttl).toString());
				}
			} catch (error) {
				console.warn("Cache clear failed", error);
			}
		}
		/**
		* Writes one API response payload into the configured `localStorage` cache namespace.
		*
		* @param {string} key - Cache key suffix, without the configured prefix.
		* @param {*} data - Serializable data to store in the cache entry.
		* @returns {void} Does not return a value; it persists the cache entry in `localStorage`.
		* @throws {Error} Throws `Cache write failed` when serialization or storage fails.
		*
		* @example
		* service._writeCache('propinsi-root', [{ propinsi_id: 31, propinsi_name: 'DKI Jakarta' }]);
		*
		* @description
		* How it works: the method computes an absolute expiration time from `cache.ttlDays`,
		* wraps the payload and expiration in a cache entry object, serializes it to JSON,
		* and stores it under `<prefix>:<key>`.
		*/
		_writeCache(key, data) {
			try {
				const ttl = this.config.cacheTtlDays * 24 * 3600 * 1e3;
				const obj = {
					data,
					expire: Date.now() + ttl
				};
				localStorage.setItem(`${this.config.cachePrefix}:${key}`, JSON.stringify(obj));
			} catch (error) {
				console.warn("⚠️ localStorage quota exceeded or unavailable. Skipping write.", error);
				this._purgeExpiredKeysOnly();
			}
		}
		/**
		* Reads one cached API response payload from the configured `localStorage` cache namespace.
		*
		* @param {string} key - Cache key suffix, without the configured prefix.
		* @returns {*|null} Returns cached data when present, otherwise `null`.
		* @throws {void} Read and parse errors are caught and logged instead of being thrown.
		*
		* @example
		* const cachedCities = service._loadCache('propinsi-31');
		* if (cachedCities) {
		*   console.log(cachedCities.length);
		* }
		*
		* @description
		* How it works: the method builds the namespaced cache key, reads the raw JSON string
		* from `localStorage`, parses it into a cache entry, removes stale or invalid entries,
		* and returns only the stored `data` payload.
		*/
		_loadCache(key) {
			const storageKey = `${this.config.cachePrefix}:${key}`;
			try {
				const raw = localStorage.getItem(storageKey);
				if (!raw) return null;
				const obj = JSON.parse(raw);
				if (!obj || typeof obj.expire !== "number" || obj.expire <= Date.now()) {
					localStorage.removeItem(storageKey);
					return null;
				}
				return obj.data;
			} catch (error) {
				console.warn("Cache load failed", error);
				localStorage.removeItem(storageKey);
				return null;
			}
		}
		/**
		* Helper utility to safely clean out stale data when space runs tight
		* without destroying freshly cached items.
		*/
		_purgeExpiredKeysOnly() {
			try {
				for (let i = localStorage.length - 1; i >= 0; i--) {
					const key = localStorage.key(i);
					if (key?.startsWith(this.config.cachePrefix + ":") && !key.endsWith(":expired-time")) {
						const raw = localStorage.getItem(key);
						if (raw) {
							const obj = JSON.parse(raw);
							if (obj && typeof obj.expire === "number" && obj.expire <= Date.now()) localStorage.removeItem(key);
						}
					}
				}
			} catch (e) {}
		}
	};
	_defineProperty(HttpService$1, "slot", "http");
	// packages/modules/http-service/index.ts
	var http_service_exports = /* @__PURE__ */ __exportAll({ HttpService: () => HttpService$1 });
	// packages/modules/http-service/dist/HttpService.js
	var HttpService = class {
		constructor(config = {}) {
			_defineProperty(
				this,
				/**
				* @property {boolean} _destroyed
				* @description Whether this instance has been destroyed and should ignore async work.
				*/
				"_destroyed",
				false
			);
			_defineProperty(
				this,
				/**
				* @property {Set<AbortController>} _abortControllers
				* @description Active request controllers used to cancel pending API calls.
				*/
				"_abortControllers",
				/* @__PURE__ */ new Set()
			);
			_defineProperty(
				this,
				/**
				* @property {iHttpServiceConfig} _config
				* @description Merged runtime configuration for API, cache, text, container, and adapter behavior.
				*/
				"config",
				void 0
			);
			const defaultConfig = {
				url: "",
				cacheEnabled: false,
				cacheTtlDays: 1,
				cachePrefix: "app",
				timeout: 1e4,
				delay: 1e3
			};
			this.config = {
				...defaultConfig,
				...config
			};
			if (this.config.cacheEnabled) this._validateCache();
		}
		/**
		* Releases in-flight requests and stops accepting new ones.
		*
		* The app contract calls `port.destroy?.()` on every module, and a consumer that built
		* its own service (the address picker does) needs the same door to close it.
		*/
		destroy() {
			this._destroyed = true;
			for (const controller of this._abortControllers) try {
				controller.abort();
			} catch {}
			this._abortControllers.clear();
		}
		/**
		* Retrieves administrative regional data either from the local cache or by calling the remote API.
		*
		* @param {Object} [query={}] - The query parameters for the data request.
		* @returns {Promise<Array|Object>} A promise that resolves to the requested regional data.
		* @throws {Error} If the API request fails or cache retrieval encounters a critical error.
		*
		* @example
		* const cities = await service.get({ level: 'kota', parentId: 11 });
		*
		* @description
		* This method acts as a data proxy. It generates a unique cache key based on the query parameters,
		* checks if valid data exists in `localStorage`, and if not, performs a network fetch.
		* To ensure a consistent UI experience, it introduces a configurable artificial delay
		* when serving data from the cache.
		*/
		async get(query) {
			const cacheKey = this._constructCacheKey(query, "get");
			let isLocal = false;
			let data = null;
			if (this.config.cacheEnabled) {
				const cached = this._loadCache(cacheKey);
				if (cached) {
					isLocal = true;
					data = cached;
				}
			}
			if (!data) {
				isLocal = false;
				data = await this._fetchAPI(query);
				if (this.config.cacheEnabled) this._writeCache(cacheKey, data);
			}
			try {
				if (isLocal && this.config.delay > 0) await new Promise((resolve) => setTimeout(resolve, this.config.delay));
				if (this.config.debug) console.log(`[HttpService] ${isLocal ? "cache" : "api"}`, query, data);
				return data;
			} catch (error) {
				localStorage.removeItem(`${this.config.cachePrefix}:${cacheKey}`);
				throw error;
			}
		}
		/**
		* Submits data to the remote API using a POST request and caches the successful response.
		*
		* @param {Object} query - Configuration parameter to determine the cache structural key.
		* @param {Object} payload - The JavaScript object containing the body data to be sent as JSON.
		* @returns {Promise<Array|Object>} A promise that resolves to the processed data returned by the API.
		* @throws {Error} If the API request fails.
		*/
		async post(query, payload) {
			const fetchOptions = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			};
			const data = await this._fetchAPI(query, fetchOptions);
			if (this.config.cacheEnabled) {
				const cacheKey = this._constructCacheKey(query, "post");
				this._writeCache(cacheKey, data);
			}
			if (this.config.debug) console.log(`[HttpService] POST`, query, data);
			return data;
		}
		/**
		* Constructing key for storing data in `localStorage` cache
		* @param query
		* @param suffix
		* @returns Cache Key for `localStorage`
		*/
		_constructCacheKey(query, suffix) {
			return `${Object.entries(query ?? {}).filter(([, value]) => value !== void 0 && value !== null).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}-${String(value)}`).join("|") || "root"}-${suffix}`;
		}
		/**
		* Default URL builder: the configured base plus every defined query parameter.
		*
		* Kept separate so `config.endpoint` can replace it without duplicating the
		* parameter sanitising.
		*/
		_buildUrl(query) {
			const baseUrl = (this.config.url ?? "").replace(/\/+$/, "");
			const params = new URLSearchParams();
			for (const [k, v] of Object.entries(query)) if (v !== void 0 && v !== null) params.append(k, v);
			return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
		}
		/**
		* Performs a network request to the configured API endpoint with automatic timeout and abort handling.
		*
		* @param {Object} [query={}] - Key-value pairs to be appended as URL search parameters.
		* @param {RequestInit} [options={}] - Standard fetch options (method, headers, etc.).
		* @param {number} [timeout=10000] - Maximum time in milliseconds to wait before aborting the request.
		* @returns {Promise<any>} A promise that resolves to the 'data' property of the successful JSON response.
		* @throws {Error} If the request times out, returns a non-2xx status, or the JSON payload indicates failure.
		*
		* @example
		* const data = await service._fetchAPI({ level: 'propinsi' });
		*
		* @description
		* This method wraps the native `fetch` API with a lifecycle management system. It creates an
		* `AbortController` for every request, registers it in an internal set for cleanup during
		* instance destruction, and sets a timer to trigger an abort if the server doesn't respond
		* within the specified window. It also normalizes the API response format.
		*/
		async _fetchAPI(query = {}, options = {}, timeout = 1e4) {
			if (this._destroyed) return;
			const controller = new AbortController();
			this._abortControllers.add(controller);
			const requestTimeout = this.config.timeout ?? timeout;
			let timeoutId;
			if (typeof AbortSignal.timeout === "function") options.signal = AbortSignal.any([controller.signal, AbortSignal.timeout(requestTimeout)]);
			else {
				timeoutId = setTimeout(() => controller.abort(), requestTimeout);
				options.signal = controller.signal;
			}
			const url = this.config.endpoint?.(query) ?? this._buildUrl(query);
			if (this.config.debug) console.log(`[HttpService] GET ${url}`, query);
			try {
				const res = await fetch(url, options);
				if (timeoutId) clearTimeout(timeoutId);
				if (!res.ok) throw new Error(res.statusText || `HTTP Error ${res.status}`);
				const json = await res.json();
				if (json && (json.success === true || json.status === "success")) return json;
				throw new Error(json?.message || "Invalid response");
			} catch (err) {
				console.error("❌ Fetching Data Faild", err);
				if (timeoutId) clearTimeout(timeoutId);
				if (err instanceof Error && err.name === "AbortError") throw new Error("Request timed out");
				throw err;
			} finally {
				this._abortControllers.delete(controller);
			}
		}
		/**
		* Checks whether the builder cache is still valid and clears expired entries when needed.
		*
		* @param {boolean} [clearNow=false] - Forces cache clearing even when the stored expiration is still valid.
		* @returns {void} Does not return a value; it updates `localStorage` cache metadata as a side effect.
		* @throws {void} Storage errors are caught and logged instead of being thrown.
		*
		* @example
		* const service = new HttpService({ url: '/api/address', cacheEnabled: true });
		* service._validateCache(true); // Force all HttpService cache entries to be refreshed.
		*
		* @description
		* How it works: the method reads the cache expiration marker, exits early when the marker
		* is still in the future, otherwise removes every `localStorage` item using the configured
		* cache prefix and writes a new expiration timestamp based on `cache.ttlDays`.
		*/
		_validateCache(clearNow = false) {
			if (!this.config.cacheEnabled) return;
			try {
				const expiredTimeKey = `${this.config.cachePrefix}:expired-time`;
				const storedExpiredTime = localStorage.getItem(expiredTimeKey);
				const now = Date.now();
				if (!clearNow || storedExpiredTime && parseInt(storedExpiredTime, 10) <= now) {
					for (let i = localStorage.length - 1; i >= 0; i--) {
						const key = localStorage.key(i);
						if (key?.startsWith(this.config.cachePrefix + ":")) localStorage.removeItem(key);
					}
					const ttl = this.config.cacheTtlDays * 24 * 3600 * 1e3;
					localStorage.setItem(expiredTimeKey, (now + ttl).toString());
					console.info(`Cache namespace synchronized and cleared.`);
				} else if (!storedExpiredTime) {
					const ttl = this.config.cacheTtlDays * 24 * 3600 * 1e3;
					localStorage.setItem(expiredTimeKey, (now + ttl).toString());
				}
			} catch (error) {
				console.warn("Cache clear failed", error);
			}
		}
		/**
		* Writes one API response payload into the configured `localStorage` cache namespace.
		*
		* @param {string} key - Cache key suffix, without the configured prefix.
		* @param {*} data - Serializable data to store in the cache entry.
		* @returns {void} Does not return a value; it persists the cache entry in `localStorage`.
		* @throws {Error} Throws `Cache write failed` when serialization or storage fails.
		*
		* @example
		* service._writeCache('propinsi-root', [{ propinsi_id: 31, propinsi_name: 'DKI Jakarta' }]);
		*
		* @description
		* How it works: the method computes an absolute expiration time from `cache.ttlDays`,
		* wraps the payload and expiration in a cache entry object, serializes it to JSON,
		* and stores it under `<prefix>:<key>`.
		*/
		_writeCache(key, data) {
			try {
				const ttl = this.config.cacheTtlDays * 24 * 3600 * 1e3;
				const obj = {
					data,
					expire: Date.now() + ttl
				};
				localStorage.setItem(`${this.config.cachePrefix}:${key}`, JSON.stringify(obj));
			} catch (error) {
				console.warn("⚠️ localStorage quota exceeded or unavailable. Skipping write.", error);
				this._purgeExpiredKeysOnly();
			}
		}
		/**
		* Reads one cached API response payload from the configured `localStorage` cache namespace.
		*
		* @param {string} key - Cache key suffix, without the configured prefix.
		* @returns {*|null} Returns cached data when present, otherwise `null`.
		* @throws {void} Read and parse errors are caught and logged instead of being thrown.
		*
		* @example
		* const cachedCities = service._loadCache('propinsi-31');
		* if (cachedCities) {
		*   console.log(cachedCities.length);
		* }
		*
		* @description
		* How it works: the method builds the namespaced cache key, reads the raw JSON string
		* from `localStorage`, parses it into a cache entry, removes stale or invalid entries,
		* and returns only the stored `data` payload.
		*/
		_loadCache(key) {
			const storageKey = `${this.config.cachePrefix}:${key}`;
			try {
				const raw = localStorage.getItem(storageKey);
				if (!raw) return null;
				const obj = JSON.parse(raw);
				if (!obj || typeof obj.expire !== "number" || obj.expire <= Date.now()) {
					localStorage.removeItem(storageKey);
					return null;
				}
				return obj.data;
			} catch (error) {
				console.warn("Cache load failed", error);
				localStorage.removeItem(storageKey);
				return null;
			}
		}
		/**
		* Helper utility to safely clean out stale data when space runs tight
		* without destroying freshly cached items.
		*/
		_purgeExpiredKeysOnly() {
			try {
				for (let i = localStorage.length - 1; i >= 0; i--) {
					const key = localStorage.key(i);
					if (key?.startsWith(this.config.cachePrefix + ":") && !key.endsWith(":expired-time")) {
						const raw = localStorage.getItem(key);
						if (raw) {
							const obj = JSON.parse(raw);
							if (obj && typeof obj.expire === "number" && obj.expire <= Date.now()) localStorage.removeItem(key);
						}
					}
				}
			} catch (e) {}
		}
	};
	_defineProperty(HttpService, "slot", "http");
	// packages/components/id-address/id-address-adapter.ts
	var setPlaceholderText = (element, text) => {
		element.innerHTML = "";
		element && element.tagName === "INPUT" && element instanceof HTMLInputElement ? element.placeholder = text : element.textContent = text;
		return element;
	};
	function __setloadingState(el, level, state = "loading", placeholderEl = null) {
		if (state === "start") {
			setPlaceholderText(placeholderEl, `Loading ${level} `);
			if (el instanceof HTMLInputElement) el?.parentElement?.classList.add("loading");
			if (el instanceof HTMLSelectElement) el.classList.add("loading");
		} else if (state === "complete") {
			el.classList.remove("error");
			if (el instanceof HTMLInputElement) el?.parentElement?.classList.remove("loading");
			if (el instanceof HTMLSelectElement) el.classList.remove("loading");
			setPlaceholderText(placeholderEl, level === "kodepos" ? "Isi kodepos tujuan" : `Pilih ${level}`);
		} else {
			el.classList.remove("error");
			if (el instanceof HTMLInputElement) el?.parentElement?.classList.remove("loading");
			if (el instanceof HTMLSelectElement) el.classList.remove("loading");
		}
	}
	function __setErrorState(el, level, _message, placeholderEl = null) {
		el.classList.remove("loading");
		el.classList.add("error");
		setPlaceholderText(placeholderEl, `Terjadi kesalahan saat memuat ${level}`);
	}
	// packages/components/id-address/id-address-adapter.native.ts
	var IdAddressAdapterNative = {
		init(_el) {},
		setOptions(el, args) {
			const level = el.dataset.level;
			const isAddressValue = el instanceof HTMLInputElement && el.type === "hidden" && !!level;
			const visibleInput = isAddressValue ? el.parentElement?.querySelector("input.dropdown") : el;
			const { options = [], state = "complete", onLevelChange } = args;
			let placeholderEl = el instanceof HTMLSelectElement ? el.options[0] : el;
			if (!placeholderEl && el instanceof HTMLSelectElement) {
				placeholderEl = document.createElement("option");
				placeholderEl.classList.add("placeholder");
				el.add(placeholderEl, 1);
			}
			if (isAddressValue || el instanceof HTMLInputElement && el.classList.contains("dropdown")) {
				const searchInput = visibleInput || el;
				const listId = searchInput.getAttribute("list");
				const datalist = listId ? document.getElementById(listId) : null;
				if (datalist) {
					datalist.dataset.options = JSON.stringify(options.map((option) => ({
						id: option[`${level}_id`],
						label: option[`${level}_name`]
					})));
					datalist.replaceChildren(...options.map((option) => {
						const optionEl = document.createElement("option");
						optionEl.value = option[`${level}_name`];
						optionEl.dataset.id = String(option[`${level}_id`]);
						return optionEl;
					}));
				}
				el.__onLevelChange = onLevelChange;
				__setloadingState(searchInput, level, state, searchInput);
				return;
			}
			if (el.tagName === "SELECT" && el instanceof HTMLSelectElement) while (el.options.length > 1) el.remove(1);
			__setloadingState(el, level, state, placeholderEl);
			if (el.tagName === "INPUT" && el instanceof HTMLInputElement && state === "complete") el.value = options?.[0][`${level}_name`];
			else if (el.tagName === "SELECT" && el instanceof HTMLSelectElement && state === "complete") {
				for (const option of options) {
					const opt = document.createElement("option");
					opt.value = option[`${level}_id`];
					opt.textContent = option[`${level}_name`];
					el.appendChild(opt);
				}
				el.__onLevelChange = onLevelChange;
			}
		},
		setSelectedOption(el, value) {
			if (el.classList.contains("error")) el.classList.remove("error");
			if (el instanceof HTMLInputElement && (el.type === "hidden" || el.classList.contains("dropdown"))) {
				const visibleInput = el.type === "hidden" ? el.parentElement?.querySelector("input.dropdown") : el;
				const listId = visibleInput?.getAttribute("list");
				const option = listId ? document.getElementById(listId)?.querySelector(`option[data-id="${CSS.escape(String(value))}"]`) : null;
				if (visibleInput) visibleInput.value = option?.getAttribute("value") || String(value);
				if (el.type !== "hidden") {
					const hidden = el.parentElement?.querySelector("input[type='hidden']");
					if (hidden) hidden.value = String(value);
				} else el.value = String(value);
				return;
			}
			el.value = value;
			if (el.tagName === "SELECT" && el instanceof HTMLSelectElement) {
				const selectedOptEl = el.selectedOptions?.[0];
				selectedOptEl?.setAttribute("selected", "");
				selectedOptEl?.classList.add("active", "selected");
			}
		},
		onLevelChange(el) {
			const level = el.dataset.level;
			if (el instanceof HTMLInputElement && (el.type === "hidden" || el.classList.contains("dropdown"))) return;
			if (el.tagName === "SELECT" && el instanceof HTMLSelectElement) {
				const selectEl = el;
				if (selectEl.__nativeChangeHandler) selectEl.removeEventListener("change", selectEl.__nativeChangeHandler);
				selectEl.__nativeChangeHandler = (_e) => {
					const selected = {
						[`${level}_id`]: Number(el.value),
						[`${level}_name`]: el.selectedOptions?.[0]?.textContent
					};
					const selectedOptEl = el.selectedOptions?.[0];
					selectedOptEl?.setAttribute("selected", "");
					selectedOptEl?.classList.add("active", "selected");
					selectEl.__onLevelChange?.(el.value === "" ? null : selected);
				};
				selectEl.addEventListener("change", selectEl.__nativeChangeHandler);
			}
		},
		onError(el, message) {
			const level = el.dataset.level;
			el.classList.add("error");
			el.value = "";
			__setErrorState(el, level, message, el.tagName === "SELECT" && el instanceof HTMLSelectElement ? el.options[0] : el);
		},
		getValue(el) {
			return el.value;
		},
		clear(el) {
			if (el instanceof HTMLInputElement && (el.type === "hidden" || el.classList.contains("dropdown"))) {
				const visibleInput = el.type === "hidden" ? el.parentElement?.querySelector("input.dropdown") : el;
				if (visibleInput) visibleInput.value = "";
				if (el.type === "hidden") el.value = "";
				const listId = visibleInput?.getAttribute("list");
				document.getElementById(listId || "")?.replaceChildren();
				visibleInput?.classList.remove("loading");
				return;
			}
			if (el.tagName === "SELECT" && el instanceof HTMLSelectElement) {
				let placeholder = el.options[0].cloneNode(true);
				placeholder.textContent = "Pilih " + el.dataset.level;
				el.innerHTML = "";
				el.appendChild(placeholder);
			}
			el.value = "";
			el.classList.remove("loading");
		},
		destroy(el) {
			if (el.__nativeChangeHandler) {
				el.removeEventListener("change", el.__nativeChangeHandler);
				delete el.__nativeChangeHandler;
			}
			delete el.__onLevelChange;
			delete el.__isDropdown;
			el.classList.remove("loading", "error", "active", "selected");
		}
	};
	// packages/components/id-address/id-address-adapter.base.ts
	var IdAddressAdapterBase = {
		init(_el) {
			console.info("IAddressBuilder Headless/Base Adapter Initialized");
		},
		setOptions() {},
		setSelectedOption() {},
		onLevelChange() {},
		onError() {},
		getValue() {
			return null;
		},
		clear() {},
		destroy() {}
	};
	// packages/components/id-address/id-address-adapter.aio.ts
	/** The visible box of a custom dropdown: the text input the visitor types into. */
	function visibleOf(box) {
		if (!box) return null;
		return box.querySelector(":scope > input[type=\"text\"], :scope > input:not([type=\"hidden\"])");
	}
	/** Resolves the elements a level is built from, per flavour. */
	function carrierOf(el) {
		const box = el.closest(".dropdown");
		const hidden = el instanceof HTMLInputElement && el.type === "hidden" ? el : null;
		if (el instanceof HTMLElement && el.classList.contains("dropdown")) {
			const carrier = box?.querySelector(":scope > input[type=\"hidden\"]") ?? null;
			return {
				visible: visibleOf(box) ?? el,
				hidden: carrier,
				box
			};
		}
		if (hidden) return {
			visible: visibleOf(box) ?? hidden,
			hidden,
			box
		};
		if (el instanceof HTMLInputElement) return {
			visible: el,
			hidden: box?.querySelector(":scope > input[type=\"hidden\"]") ?? null,
			box
		};
		return {
			visible: el,
			hidden: null,
			box
		};
	}
	/** The `.field` a control lives in: the element that carries aio's loading/error state. */
	function fieldOf(el) {
		return el.closest(".field");
	}
	/** Options of the `style: "select"` flavour: `.menu > .item` rows. */
	function menuOf(box) {
		return box?.querySelector(":scope > .menu") ?? null;
	}
	/** The prompt of a select: a real `option.placeholder`, created when missing. */
	function placeholderOf(select) {
		const existing = select.querySelector("option.placeholder");
		if (existing) return existing;
		const option = document.createElement("option");
		option.className = "placeholder";
		option.value = "";
		option.disabled = true;
		option.selected = true;
		select.prepend(option);
		return option;
	}
	/**
	* What a level says when it has nothing to offer yet.
	*
	* @param level - Level name (`propinsi`, `kota`, …).
	* @param state - Current load state.
	* @returns Prompt text for the control.
	*/
	function promptTextOf(level, state) {
		if (state === "start" || state === "loading") return `Loading ${level} `;
		if (state === "empty") return `Tidak ada ${level}`;
		if (state === "error") return `Gagal memuat ${level}`;
		return level === "kodepos" ? "Isi kodepos tujuan" : `Pilih ${level}`;
	}
	/**
	* Writes the prompt without touching the rows.
	*
	* @param el - Select or visible input of a custom dropdown.
	* @param text - Prompt text.
	*
	* @summary The native helpers (`setPlaceholderText` / `__setloadingState`) clear the
	* element with `innerHTML = ""` before writing — fatal for a `<select>`, whose options
	* *are* its content: every state change wiped the prompt and the loaded rows, so the
	* placeholder vanished while loading and stayed an empty option afterwards even though
	* the request had answered.
	*/
	function setPromptText(el, text) {
		if (el instanceof HTMLSelectElement) {
			const prompt = placeholderOf(el);
			prompt.textContent = text;
			prompt.selected = true;
			return;
		}
		el.placeholder = text;
	}
	/** Drops the rows of a level, keeping its prompt. */
	function dropRows(el, visible, box) {
		if (el instanceof HTMLSelectElement) {
			while (el.options.length > 1) el.remove(1);
			el.selectedIndex = 0;
			return;
		}
		menuOf(box)?.replaceChildren();
		const listId = visible.getAttribute("list");
		if (listId) document.getElementById(listId)?.replaceChildren();
		visible.value = "";
	}
	/**
	* Marker on the events this adapter dispatches itself.
	*
	* @summary The carrier that announces an answer is the same element `onLevelChange()`
	* listens to, so a naive `dispatchEvent()` re-entered the builder: write → `change` →
	* "level changed" → load next → write → … until the stack overflowed. The marker keeps the
	* announcement outward-only: components and pages of the host still see it, this adapter's
	* own listener ignores it.
	*/
	var SYNTHETIC = "__aioSyntheticAnswer";
	/** Whether an event was dispatched by this adapter rather than by a visitor. */
	function isSynthetic(event) {
		return Boolean(event[SYNTHETIC]);
	}
	/**
	* Tells the page that a level changed.
	*
	* @param el - The element carrying the answer (the hidden input for a custom dropdown).
	*
	* @summary `native` called the builder's private callback; an aio control is a component
	* with listeners of its own, so the standard event has to be dispatched as well — marked,
	* so the adapter does not answer its own announcement.
	*/
	function announce(el) {
		for (const type of ["change", "input"]) {
			const event = new Event(type, { bubbles: true });
			event[SYNTHETIC] = true;
			el.dispatchEvent(event);
		}
	}
	var IdAddressAdapterAio = {
		init(_el) {},
		setOptions(el, args) {
			const level = el.dataset.level;
			const { options = [], state = "complete", onLevelChange } = args ?? {};
			const { visible, hidden, box } = carrierOf(el);
			const field = fieldOf(el);
			const busy = state === "start" || state === "loading";
			if (box) {
				box.classList.toggle("loading", busy);
				field?.classList.remove("loading");
			} else {
				el.classList.toggle("loading", busy);
				if (!(el instanceof HTMLSelectElement)) field?.classList.toggle("loading", busy);
			}
			field?.classList.toggle("error", state === "error");
			setPromptText(el instanceof HTMLSelectElement ? el : visible, promptTextOf(level, state));
			if (state !== "complete") {
				dropRows(el, visible, box);
				if (hidden) hidden.value = "";
				el.__onLevelChange = onLevelChange;
				return;
			}
			if (el instanceof HTMLSelectElement) {
				dropRows(el, visible, box);
				for (const row of options) {
					const option = document.createElement("option");
					option.value = String(row[`${level}_id`]);
					option.textContent = String(row[`${level}_name`]);
					option.dataset.id = String(row[`${level}_id`]);
					el.appendChild(option);
				}
				el.__onLevelChange = onLevelChange;
				return;
			}
			const menu = menuOf(box);
			if (menu) {
				const rows = options.map((row) => ({
					id: String(row[`${level}_id`]),
					label: String(row[`${level}_name`])
				}));
				menu.dataset.options = JSON.stringify(rows);
				menu.replaceChildren(...rows.map((row) => {
					const item = document.createElement("div");
					item.className = "item";
					item.dataset.id = row.id;
					item.dataset.label = row.label;
					item.textContent = row.label;
					return item;
				}));
				visible.value = "";
				if (visible instanceof HTMLInputElement && !visible.placeholder) visible.placeholder = `Pilih ${level}`;
				if (hidden) hidden.value = "";
				el.__onLevelChange = onLevelChange;
				return;
			}
			const listId = visible.getAttribute("list");
			const datalist = listId ? document.getElementById(listId) : null;
			if (datalist) {
				datalist.replaceChildren(...options.map((row) => {
					const option = document.createElement("option");
					option.value = String(row[`${level}_name`]);
					option.dataset.id = String(row[`${level}_id`]);
					return option;
				}));
				datalist.dataset.options = JSON.stringify(options.map((row) => ({
					id: row[`${level}_id`],
					label: row[`${level}_name`]
				})));
				visible.value = "";
				if (hidden) hidden.value = "";
				el.__onLevelChange = onLevelChange;
				return;
			}
			const first = options[0];
			if (first) {
				const answer = first[`${level}_name`] ?? first[`${level}_id`] ?? "";
				visible.value = answer === null || answer === void 0 ? "" : String(answer);
			}
			el.__onLevelChange = onLevelChange;
		},
		setSelectedOption(el, value) {
			if (el.classList.contains("error")) el.classList.remove("error");
			if (el instanceof HTMLSelectElement) {
				el.value = value;
				const chosen = el.selectedOptions?.[0] ?? null;
				el.querySelectorAll("option[selected]").forEach((option) => option.removeAttribute("selected"));
				chosen?.setAttribute("selected", "");
				chosen?.classList.add("active", "selected");
				announce(el);
				return;
			}
			const { visible, hidden } = carrierOf(el);
			const listId = visible.getAttribute("list");
			visible.value = (listId ? document.getElementById(listId) : null)?.querySelector(`option[data-id="${CSS.escape(String(value))}"]`)?.getAttribute("value") ?? menuOf(el.closest(".dropdown"))?.querySelector(`.item[data-id="${CSS.escape(String(value))}"]`)?.textContent ?? String(value);
			if (hidden) hidden.value = String(value);
			else if (el !== visible) el.value = String(value);
			menuOf(el.closest(".dropdown"))?.querySelectorAll(".item").forEach((item) => {
				item.classList.toggle("selected", item.getAttribute("data-id") === String(value));
			});
			announce(hidden ?? visible);
		},
		onLevelChange(el) {
			const level = el.dataset.level;
			const { hidden } = carrierOf(el);
			const source = hidden ?? el;
			if (source.dataset.level !== level) source.dataset.level = String(level);
			if (source.__aioChangeHandler) source.removeEventListener("change", source.__aioChangeHandler);
			source.__aioChangeHandler = (event) => {
				if (isSynthetic(event)) return;
				const carrier = carrierOf(el);
				const value = carrier.hidden ? carrier.hidden.value : el instanceof HTMLSelectElement ? el.value : el.value;
				const label = carrier.hidden ? carrier.visible.value : el instanceof HTMLSelectElement ? el.selectedOptions?.[0]?.textContent?.trim() : el.value;
				el.__onLevelChange?.(value === "" || value === null || value === void 0 ? null : {
					[`${level}_id`]: value,
					[`${level}_name`]: label
				});
			};
			source.addEventListener("change", source.__aioChangeHandler);
		},
		onError(el, message) {
			const level = el.dataset.level;
			const { visible, hidden, box } = carrierOf(el);
			el.classList.add("error");
			box?.classList.add("error");
			fieldOf(el)?.classList.add("error");
			dropRows(el, visible, box);
			el.value = "";
			if (hidden) hidden.value = "";
			if (visible !== el) visible.value = "";
			setPromptText(el instanceof HTMLSelectElement ? el : visible, message || promptTextOf(level, "error"));
			el.dataset.error = message;
		},
		getValue(el) {
			const { hidden } = carrierOf(el);
			return hidden ? hidden.value : el.value;
		},
		clear(el) {
			const { visible, hidden, box } = carrierOf(el);
			box?.classList.remove("loading", "error", "selected");
			fieldOf(el)?.classList.remove("loading", "error");
			el.classList.remove("loading", "error", "active", "selected");
			if (el instanceof HTMLSelectElement) {
				const prompt = placeholderOf(el);
				while (el.options.length > 1) el.remove(1);
				el.selectedIndex = 0;
				prompt.selected = true;
				announce(el);
				return;
			}
			menuOf(box)?.replaceChildren();
			const listId = visible.getAttribute("list");
			document.getElementById(listId ?? "")?.replaceChildren();
			visible.value = "";
			if (hidden) hidden.value = "";
			if (visible !== el) el.value = "";
		},
		destroy(el) {
			const { hidden } = carrierOf(el);
			const source = hidden ?? el;
			if (source.__aioChangeHandler) {
				source.removeEventListener("change", source.__aioChangeHandler);
				delete source.__aioChangeHandler;
			}
			delete el.__onLevelChange;
			delete el.__isDropdown;
			el.classList.remove("loading", "error", "active", "selected");
			fieldOf(el)?.classList.remove("loading", "error");
		}
	};
	// packages/components/id-address/id-address.kit.ts
	/**
	* id-address — kit.
	*
	* The column vocabulary and the runtime guard that enforces it: which keys a detail
	* record may carry, and what type each one accepts. Both are machinery — the picker
	* itself never exposes them.
	*
	* Not published: `index.ts` is the only entry and does not mention this file.
	*/
	var ADDRESS_DETAIL_KEYS = [
		"propinsi",
		"propinsi_id",
		"propinsi_name",
		"kota",
		"kota_id",
		"kota_name",
		"kecamatan",
		"kecamatan_id",
		"kecamatan_name",
		"kelurahan",
		"kelurahan_id",
		"kelurahan_name",
		"kodepos",
		"kodepos_id",
		"kodepos_name",
		"latitude",
		"longitude",
		"formatted_address"
	];
	/**
	* Runtime type guard for IAddressDetail
	* @param {IAddressDetail} obj
	* @returns {boolean}
	*/
	function isAddressDetail(obj) {
		if (typeof obj !== "object" || obj === null) return false;
		const entries = Object.entries(obj);
		for (const [key, value] of entries) {
			if (!ADDRESS_DETAIL_KEYS.includes(key)) {
				console.error(`Invalid key: "${key}" is not a valid IdAddressDetailKey.`);
				return false;
			}
			if (!isValidAddressDetailValue(key, value)) {
				console.error(`Invalid value type for key "${key}":`, value);
				return false;
			}
		}
		return true;
	}
	/**
	* Validates the data type of a specific address detail field based on its key name.
	*
	* @param {IdAddressDetailKey} key - The property name to validate (e.g., 'propinsi_id', 'latitude').
	* @param {any} value - The value to check against the expected type for the given key.
	* @returns {boolean} True if the value matches the expected type or is nullable; otherwise false.
	*
	* @example
	* isValidAddressDetailValue('propinsi_id', 31); // true
	* isValidAddressDetailValue('latitude', ' -6.2000'); // true
	* isValidAddressDetailValue('formatted_address', 123); // false
	*
	* @description
	* How it works: The function uses a series of conditional checks based on key suffixes or
	* exact matches. It allows null/undefined for all keys, ensures IDs and coordinates are
	* numeric (or numeric strings), and verifies that names and addresses are strings.
	*/
	function isValidAddressDetailValue(key, value) {
		if (value === null || value === void 0) return true;
		if (key.endsWith("_id")) return typeof value === "number" || typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value));
		if (key.endsWith("_name")) return typeof value === "string" || key === "kodepos_name" && typeof value === "number";
		if (key === "latitude" || key === "longitude") return typeof value === "number" || typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value));
		if (key === "formatted_address") return typeof value === "string";
		return false;
	}
	// packages/components/id-address/id-address-builder.ts
	var ADDRESS_LEVELS = [
		"propinsi",
		"kota",
		"kecamatan",
		"kelurahan",
		"kodepos"
	];
	var DEFAULT_CONFIG = {
		url: null,
		geocode: false,
		cache: {
			enabled: true,
			ttlDays: 1,
			prefix: "IdAddressBuilder",
			delay: 0,
			timeout: 1e4
		},
		container: null,
		useAdapter: null,
		headless: false,
		textContent: {
			loading: "Loading #{level}  ",
			placeholder: "Pilih #{level}",
			notFound: "Tidak menemukan hasil",
			error: "Terjadi kesalahan"
		}
	};
	var _http = /* @__PURE__ */ new WeakMap();
	var _ownsHttp = /* @__PURE__ */ new WeakMap();
	var _IdAddressBuilder_brand = /* @__PURE__ */ new WeakSet();
	/**
	* Indonesian administrative address cascade builder.
	*
	* @classdesc
	* Creates a province-to-postal-code address picker backed by a public API. The
	* builder can render native controls, delegate rendering to a registered UI
	* adapter, or run in headless mode for frameworks and server-shaped workflows
	* that only need the data cascade. It supports response caching, reverse lookup
	* by kodepos, optional geocode loading, and lifecycle cleanup through destroy().
	*
	* @example
	* // Native browser controls with geocode enabled.
	* const picker = new IdAddressBuilder({
	*   url: "https://script.google.com/macros/s/example/exec",
	*   container: "#address-form",
	*   useAdapter: "native",
	*   geocode: true,
	* });
	*
	* picker.onLevelChanged((schema, data, complete) => {
	*   if (complete() === "complete") console.log(schema.name, data, picker.detail);
	* });
	*
	* picker.onGeocodeLoaded((schema, data) => {
	*   console.log("Coordinates:", data);
	* });
	*
	* picker.init();
	*
	* @example
	* // Cache tuning or disabling.
	* const fastCache = new IdAddressBuilder({
	*   url: API_URL,
	*   container: document.querySelector("#address-form"),
	*   cache: {
	*     enabled: true,
	*     ttlDays: 7,
	*     prefix: "checkout-address",
	*     delay: 0,
	*     timeout: 8000,
	*   },
	* });
	*
	* fastCache.init();
	*
	* const noCache = new IdAddressBuilder({
	*   url: API_URL,
	*   container: "#address-form",
	*   cache: { enabled: false },
	* });
	*
	* noCache.init();
	*
	* @example
	* // Register and switch to a custom adapter.
	* import { IAddressAdapterSemanticUi } from "./id-address-adapter.semantic-ui.js";
	*
	* const picker = new IdAddressBuilder({
	*   url: API_URL,
	*   container: "#semantic-address-form",
	*   useAdapter: "semantic-ui",
	* });
	*
	* picker.registerAdapter("semantic-ui", IAddressAdapterSemanticUi);
	* picker.init();
	*
	* @example
	* // Use the public data API without waiting for UI interaction.
	* const picker = new IdAddressBuilder({ url: API_URL, container: "#address-form" });
	* picker.init();
	*
	* const cities = await picker.getRegionalData({ level: "kota", parentId: 11 });
	* const detail = await picker.getDetailByKodepos("10110", true);
	* const geocode = await picker.getGeocodeLocation(detail[0]);
	*
	* console.log({ cities, detail, geocode });
	*
	* @example
	* // Headless cascade for framework-managed rendering.
	* const picker = new IdAddressBuilder({
	*   url: API_URL,
	*   container: document.createElement("div"),
	*   headless: true,
	*   cache: { delay: 0 },
	* });
	*
	* picker.onLevelLoaded(async (schema, data, complete) => {
	*   if (complete() !== "complete" || !data.length) return;
	*   if (schema.next) await schema.next.load(data[0][`${schema.name}_id`]);
	* });
	*
	* picker.init();
	* const districts = await picker.loadNextLevel("kecamatan", "3171");
	*
	* @todo Document the expected public API response shape once the endpoint contract is finalized.
	*/
	var IdAddressBuilder = class {
		/**
		* Initializes a new instance of IdAddressBuilder with the provided configuration.
		*
		* @param {IdAddressConfig} [config={}] - Configuration object for the builder.
		* @throws {Error} If the container is not provided in the configuration.
		*
		* @example
		* const picker = new IdAddressBuilder({ url: 'https://api.example.com', container: '#address-form' });
		*
		* @description
		* How it works: The constructor merges user configuration with defaults, registers the built-in
		* adapters (base and native), initializes internal state tracking (detail, schema, listeners),
		* and triggers an immediate cache validation check to ensure stored data is fresh.
		*/
		constructor(config) {
			_classPrivateMethodInitSpec(this, _IdAddressBuilder_brand);
			_defineProperty(
				this,
				/**
				* @property {IdAddressConfig} _config
				* @description Merged runtime configuration for API, cache, text, container, and adapter behavior.
				*/
				"_config",
				void 0
			);
			_defineProperty(
				this,
				/**
				* @property {Object<string, import("./id-address-adapter").IAddressAdapter>} adapters
				* @description Registry of available UI adapters by adapter name.
				*/
				"adapters",
				void 0
			);
			_defineProperty(
				this,
				/**
				* @property {boolean} _destroyed
				* @description Whether this instance has been destroyed and should ignore async work.
				*/
				"_destroyed",
				void 0
			);
			_defineProperty(
				this,
				/**
				* @property {boolean} _initialized
				* @description Whether this instance has already completed initialization.
				*/
				"_initialized",
				void 0
			);
			_classPrivateFieldInitSpec(this, _http, null);
			_classPrivateFieldInitSpec(this, _ownsHttp, false);
			_defineProperty(
				this,
				/**
				* @property {HTMLElement|null} containerEl
				* @description Resolved container element that hosts the address controls.
				*/
				"containerEl",
				void 0
			);
			_defineProperty(
				this,
				/**
				* @property {Object} _detail
				* @description Current accumulated address detail selected or resolved by the builder.
				*/
				"_detail",
				void 0
			);
			_defineProperty(
				this,
				/**
				* @property {Array<IdAddressSchemaRef>} schema
				* @description Runtime schema entries for each configured address level.
				*/
				"schema",
				void 0
			);
			_defineProperty(
				this,
				/**
				* @property {Object<string, Array<IdAddressEventHandler>>} _listeners
				* @description Event listeners grouped by event name.
				*/
				"_listeners",
				void 0
			);
			_defineProperty(
				this,
				/**
				* @property {boolean} _skipChangeListener
				* @description Guard flag used while programmatically updating selected values.
				*/
				"_skipChangeListener",
				void 0
			);
			_defineProperty(
				this,
				/**
				* @property {number} _kodeposRunId
				* @description Monotonic token for kodepos reverse-lookup runs; a newer lookup
				* supersedes an in-flight older one so rapid retyping cannot interleave results.
				*/
				"_kodeposRunId",
				0
			);
			_defineProperty(
				this,
				/**
				* @property {Set<string>} _loadedLevels
				* @description Levels that actually rendered rows in the current cascade run.
				* `_settleLevels` uses it to tell "filled" apart from "asked but came back empty" —
				* an empty level still has an id in the detail, so the id alone cannot decide.
				*/
				"_loadedLevels",
				/* @__PURE__ */ new Set()
			);
			_defineProperty(
				this,
				/**
				* @property {Array<string>} _levelOrder
				* @description Ordered administrative levels used to build and traverse the cascade.
				*/
				"_levelOrder",
				void 0
			);
			this._config = {
				...DEFAULT_CONFIG,
				...config,
				cache: {
					...DEFAULT_CONFIG.cache,
					...config?.cache
				},
				textContent: {
					...DEFAULT_CONFIG.textContent,
					...config?.textContent
				}
			};
			this.adapters = {
				base: IdAddressAdapterBase,
				native: IdAddressAdapterNative,
				aio: IdAddressAdapterAio
			};
			this._destroyed = false;
			this._initialized = false;
			this.containerEl = null;
			this._detail = {};
			this.schema = [];
			this._listeners = {};
			this._skipChangeListener = false;
			if (!this.config.container) throw new Error("[IdAddressBuilder] container is required");
			this._levelOrder = [...ADDRESS_LEVELS];
		}
		/**
		* Registers a new UI adapter to handle element manipulation and event binding.
		*
		* @param {string} name - The unique identifier for the adapter (e.g., 'semantic-ui').
		* @param {IAddressAdapter} adapter - An object implementing the adapter interface.
		* @returns {void}
		* @throws {TypeError} If the name is invalid, adapter is not an object, or required methods are missing.
		*
		* @example
		* picker.registerAdapter('my-theme', {
		*   setOptions: (el, config) => { ... },
		*   setSelectedOption: (el, val) => { ... },
		*   onLevelChange: (el) => { ... },
		*   clear: (el) => { ... }
		* });
		*
		* @description
		* This method validates the provided adapter object against a set of required methods
		* defined in the `IAddressAdapter` interface. If valid, it stores the adapter in the
		* `adapters` registry, making it available for use during initialization via the `useAdapter` config.
		*/
		registerAdapter(name, adapter) {
			const requiredMethods = [
				"setOptions",
				"setSelectedOption",
				"onLevelChange",
				"clear"
			];
			if (!name || typeof name !== "string") throw new TypeError("[IdAddressBuilder] adapter name must be a non-empty string");
			if (!adapter || typeof adapter !== "object") throw new TypeError(`[IdAddressBuilder] adapter '${name}' must be an object`);
			const missingMethods = requiredMethods.filter((method) => typeof adapter[method] !== "function");
			if (missingMethods.length) throw new TypeError(`[IdAddressBuilder] adapter '${name}' is missing required method(s): ${missingMethods.join(", ")}`);
			this.adapters[name] = adapter;
		}
		/**
		* Retrieves the current configuration object for the builder.
		*
		* @returns {IdAddressConfig} The merged configuration settings.
		*
		* @example
		* const currentUrl = picker.config.url;
		*
		* @description
		* This getter provides access to the internal `_config` object, which contains
		* API settings, cache parameters, and UI preferences.
		*/
		get config() {
			return this._config;
		}
		/**
		* Updates the builder configuration by merging new settings with the existing ones.
		*
		* @param {IdAddressConfig} _config - An object containing configuration overrides.
		*
		* @example
		* picker.config = { geocode: true };
		*
		* @description
		* This setter merges the provided object into the internal `_config` state while
		* preserving nested defaults for cache and text content settings.
		*/
		set config(_config) {
			this._config = {
				...this._config,
				..._config,
				cache: {
					...this._config.cache,
					..._config?.cache
				},
				textContent: {
					...this._config.textContent,
					..._config?.textContent
				}
			};
		}
		/**
		* The elements that actually carry a level's value.
		*
		* @param container - Element holding the `[data-level]` markup.
		* @returns One node per level, in document order.
		*
		* @summary `[data-level]` is not unique to the value carrier: a custom dropdown marks
		* its wrapper *and* its hidden input (the same attribute list is applied to both), so a
		* naive `querySelectorAll` returned two nodes per level — the wrapper took the level's
		* slot and the real carrier became a duplicate that never received its rows. Only
		* controls are levels; everything else that mentions the level is decoration.
		*/
		_levelNodes(container) {
			const carriers = [...container.querySelectorAll("[data-level]")].filter((el) => el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement);
			const seen = /* @__PURE__ */ new Set();
			return carriers.filter((el) => {
				const level = el.dataset.level ?? "";
				if (seen.has(level)) return false;
				seen.add(level);
				return true;
			});
		}
		/**
		* Initializes the address builder by mapping DOM elements to the internal schema,
		* setting up adapters, and triggering the initial data load.
		*
		* @returns {void}
		* @throws {Error} If the API URL is missing, container is invalid, or a specified adapter is not found.
		*
		* @example
		* const picker = new IdAddressBuilder({ url: '...', container: '#form' });
		* picker.init();
		*
		* @description
		* This method performs the core setup: it validates configuration, identifies target
		* DOM nodes (or creates virtual ones for headless mode), initializes UI adapters
		* for each level, links levels into a cascade chain, and starts the root data fetch.
		*/
		init() {
			if (this._initialized) {
				console.warn("IdAddressBuilder already initialized.");
				return;
			}
			ensureStylesheet$1("./id-address.css").catch(() => null);
			this._initialized = true;
			this._destroyed = false;
			let containerEl = null;
			if (!this.config.url && !this.config.service && typeof this.config.loader !== "function") throw new Error("[IdAddressBuilder] a loader, service or url is required");
			if (typeof this.config.container === "string") containerEl = document.querySelector(this.config.container);
			else if (this.config.container instanceof HTMLElement) containerEl = this.config.container;
			else throw new Error("Invalid Type Container");
			if (!containerEl) throw new Error("[IdAddressBuilder] container not found");
			this.containerEl = containerEl;
			let nodes = [];
			if (!this.config.headless) nodes = this._levelNodes(containerEl);
			else {
				this.config.useAdapter = "base";
				nodes = this._levelOrder.map((level) => ({
					dataset: { level },
					__virtual: true
				}));
			}
			this.schema = nodes.map((el, index) => {
				const adapterName = this.config.useAdapter;
				const adapter = this.adapters[adapterName] ?? (this.config.headless ? this.adapters.base : this.adapters.native);
				if (!adapter) throw new Error(`[Adapter '${adapterName}' not found]`);
				const name = el.dataset.level;
				const isDropdown = name === "kodepos" ? false : true;
				el.__isDropdown = isDropdown;
				adapter.init?.(el);
				adapter.onLevelChange?.(el);
				const schemaRef = {
					el,
					name,
					adapterName,
					adapter,
					isDropdown,
					getDetail: () => this.detail,
					next: null,
					index,
					load: (parentId = void 0, selectedValue = null) => {
						return this._loadLevel(schemaRef, parentId, selectedValue);
					},
					select: async () => {}
				};
				return schemaRef;
			});
			this.schema.forEach((schema, i) => {
				schema.next = this.schema[i + 1] ?? null;
			});
			this._bindInternalEvents();
			this._loadLevel(this.schema[0], void 0, null).catch((e) => {
				this._throwError(this.schema[0], "Error loading root level:", e);
			});
			const kodeposSchema = this.schema.find((s) => s.name === "kodepos");
			if (kodeposSchema) this._bindKodeposInputListener(kodeposSchema);
		}
		/**
		* Tears down the instance by aborting network requests, removing event listeners,
		* and cleaning up DOM references to prevent memory leaks.
		*
		* @returns {void}
		*
		* @example
		* const picker = new IdAddressBuilder({ ... });
		* picker.init();
		* // later...
		* picker.destroy();
		*
		* @description
		* This method performs a comprehensive cleanup: it flags the instance as destroyed,
		* aborts all pending fetch requests via AbortControllers, iterates through the
		* schema to remove DOM event listeners (including custom kodepos handlers),
		* invokes adapter-specific destroy logic, and resets internal state variables.
		*/
		destroy() {
			if (this._destroyed) return;
			console.log("Destroying IdAddressBuilder...");
			this._destroyed = true;
			this._initialized = false;
			if (_classPrivateFieldGet2(_ownsHttp, this)) _classPrivateFieldGet2(_http, this)?.destroy();
			_classPrivateFieldSet2(_http, this, null);
			for (const schema of this.schema) try {
				const { el, adapter } = schema;
				if (el?.__kodeposHandler) {
					el.removeEventListener("change", el.__kodeposHandler);
					el.removeEventListener("input", el.__kodeposHandler);
					delete el.__kodeposHandler;
				}
				delete el.__onLevelChange;
				delete el.__isDropdown;
				adapter?.destroy?.(el);
			} catch (err) {
				console.error(`Destroy failed for schema '${schema?.name}':`, err);
			}
			this.schema = [];
			this._listeners = {};
			this._detail = {};
			this.containerEl = null;
			console.log("IdAddressBuilder destroyed.");
		}
		/**
		* Binds a change listener to the postal code (kodepos) input field to handle
		* manual entry and trigger reverse-lookup of administrative levels.
		*
		* @param {Object} schema - The schema reference object for the 'kodepos' level.
		* @returns {void}
		*
		* @example
		* const kodeposSchema = picker.schema.find(s => s.name === 'kodepos');
		* picker._bindKodeposInputListener(kodeposSchema);
		*
		* @description
		* This method attaches an asynchronous listener to the kodepos element on both
		* `change` (commit via blur/Enter, any format) and `input` (live typing — fires
		* as soon as the code looks complete, i.e. 5 digits, without waiting for blur).
		* When a user enters a postal code, it clears previous errors, updates the internal
		* detail state, fetches the full administrative hierarchy (Propinsi to Kelurahan)
		* associated with that code, and triggers a cascading update of all UI dropdowns.
		* Each distinct code is processed once, and a newer lookup supersedes an
		* in-flight older one (staleness token) so rapid retyping cannot interleave.
		*/
		_bindKodeposInputListener(schema) {
			const { el, name: level } = schema;
			if (!this.config.headless) {
				el.removeEventListener("change", el.__kodeposHandler);
				el.removeEventListener("input", el.__kodeposHandler);
				let lastProcessed = null;
				el.__kodeposHandler = async (e) => {
					if (this._skipChangeListener) return;
					const inputHasError = el.parentElement?.querySelector(".error");
					if (inputHasError) inputHasError.classList.remove("error");
					const kodeposValue = String(e.target?.value ?? "").trim();
					if (!kodeposValue) return;
					if (e.type === "input" && !/^\d{5}$/.test(kodeposValue)) return;
					if (kodeposValue === lastProcessed) return;
					lastProcessed = kodeposValue;
					const runId = ++this._kodeposRunId;
					const kodepos = { [`${level}_name`]: Number(kodeposValue) };
					this._setDetail(kodepos, true);
					this.__emitChange("onLevelChanged", {
						schema,
						data: kodepos,
						state: "complete"
					});
					this._setLevelsState("loading");
					try {
						const detail = await this.getDetailByKodepos(kodeposValue, this.config.geocode);
						if (runId !== this._kodeposRunId || this._destroyed) return;
						if (!detail || !detail[0]) throw new Error("Kodepos not found");
						this._setDetail({ [`${level}_id`]: detail[0][`${level}_id`] });
						if (this.config.geocode) this.__emitChange("onGeocodeLoaded", {
							schema,
							data: detail[0],
							state: "complete"
						});
						await this._updateLevelsByKodepos(detail[0], runId);
					} catch (error) {
						if (runId !== this._kodeposRunId) return;
						lastProcessed = null;
						this._settleLevels(runId);
						this._throwError(schema, "Failed lookup detail from kodepos", error instanceof Error ? error : new Error(String(error)));
					}
				};
				el.addEventListener("change", el.__kodeposHandler);
				el.addEventListener("input", el.__kodeposHandler);
			}
		}
		/**
		* Recursively loads administrative data for a specific level, handles UI state transitions,
		* and manages cascading updates between parent and child levels.
		*
		* @param {IdAddressSchemaRef} levelSchema - The schema reference object for the level to be loaded.
		* @param {number|string|null} [parentId=null] - The ID of the parent level used to filter results.
		* @param {number|null} [selectedValue=null] - An optional ID to automatically select after loading.
		* @returns {Promise<void>} A promise that resolves when the level and its immediate UI state are updated.
		* @throws {Error} If data fetching fails or if a required parent ID is missing for non-root levels.
		*
		* @example
		* const kotaSchema = picker.schema.find(s => s.name === 'kota');
		* await picker._loadLevel(kotaSchema, 11); // Loads cities for Propinsi ID 11
		*
		* @description
		* This method manages the lifecycle of a level load: it triggers "start" events for UI loaders,
		* fetches data from the API or cache, handles empty states, and defines the `onLevelChange`
		* logic that allows child levels to react when this level's value changes.
		*/
		async _loadLevel(levelSchema, parentId = void 0, selectedValue = null) {
			if (this._destroyed) return;
			if (!levelSchema) return;
			const level = levelSchema.name;
			if (level !== "propinsi" && !parentId && selectedValue == null) return;
			this.__emitChange("onLevelLoaded", {
				schema: levelSchema,
				data: [],
				state: "start",
				complete: (s = "start") => s
			});
			let options = [];
			try {
				options = await this.getRegionalData({
					level,
					parentId
				});
				if (this._destroyed) return;
				if (!options) throw new Error(`Failed to fetch ${level}`);
				if (level === "kodepos") this.__emitChange("onLevelChanged", {
					schema: levelSchema,
					data: { ...options[0] },
					state: "complete",
					complete: () => "complete"
				});
			} catch (error) {
				this._throwError(levelSchema, `Failed to fetch ${level}:`, error instanceof Error ? error : new Error(String(error)));
				return;
			}
			if (!options || options.length === 0) {
				this.__emitChange("onLevelLoaded", {
					schema: levelSchema,
					data: [],
					state: "empty",
					complete: () => "empty",
					onLevelChange: void 0
				});
				return;
			}
			const onLevelChangeFn = async (selectedParent) => {
				try {
					if (!selectedParent) {
						this.clearNextLevel(level, true);
						this.__emitChange("onLevelChanged", {
							schema: levelSchema,
							data: {},
							state: "complete",
							complete: () => "complete"
						});
						return;
					}
					if (!this._skipChangeListener) {
						this.clearNextLevel(level);
						this.__emitChange("onLevelChanged", {
							schema: levelSchema,
							data: { ...selectedParent },
							state: "complete",
							complete: () => "complete"
						});
						await this._loadLevel(levelSchema.next, selectedParent[level + "_id"]);
						if (levelSchema.next?.name === "kodepos" && this.config.geocode) {
							const geo = await this.getGeocodeLocation(levelSchema.getDetail());
							if (this._destroyed) return;
							this.__emitChange("onGeocodeLoaded", {
								schema: levelSchema,
								data: geo,
								state: "complete"
							});
						}
					}
				} catch (error) {
					this._throwError(levelSchema, "Error during cascade onChange", error instanceof Error ? error : new Error(String(error)));
				}
			};
			levelSchema.select = onLevelChangeFn;
			this._loadedLevels.add(level);
			this.__emitChange("onLevelLoaded", {
				schema: levelSchema,
				data: options,
				state: "complete",
				complete: () => "complete",
				onLevelChange: onLevelChangeFn
			});
			if (selectedValue != null) this.__emitChange("onLevelChanged", {
				schema: levelSchema,
				data: { [`${level}_id`]: selectedValue },
				state: "complete",
				complete: () => "complete"
			});
		}
		/**
		* Synchronizes all administrative dropdowns based on a provided detail object,
		* typically used for reverse-filling the form from a postal code lookup.
		*
		* @param {Object} detail - An object containing the full administrative hierarchy (IDs and names).
		* @returns {Promise<void>} A promise that resolves when all levels have been updated.
		*
		* @example
		* const detail = await picker.getDetailByKodepos('12345');
		* await picker._updateLevelsByKodepos(detail[0]);
		*
		* @description
		* This method iterates through the schema levels, identifies the correct parent IDs
		* from the detail object, and triggers a silent load for each level. It uses a
		* `_skipChangeListener` flag to prevent the standard cascading logic from
		* interfering with the manual synchronization process. A `runId` staleness token
		* lets a newer kodepos lookup abandon the remainder of an older, still-running fill.
		* @param {Object} [detail={}] - The full address detail resolved from the kodepos lookup.
		* @param {number} [runId] - Token of the lookup run that triggered this fill; omit
		*   for programmatic calls to keep the unconditional `_skipChangeListener` release.
		*/
		async _updateLevelsByKodepos(detail = {}, runId) {
			this._skipChangeListener = true;
			try {
				for (const schemaItem of this.schema) {
					if (runId !== void 0 && runId !== this._kodeposRunId) return;
					const level = schemaItem.name;
					let selectedValue = detail[level + "_id"];
					if (!selectedValue) continue;
					if (schemaItem.isDropdown) {
						const parentId = detail[`${this._getRelatedLevel(level, false)}_id`];
						try {
							this._setDetail({
								[level + "_id"]: detail[level + "_id"],
								[level + "_name"]: detail[level + "_name"]
							});
							await this._loadLevel(schemaItem, parentId, selectedValue);
						} catch (error) {
							this._throwError(schemaItem, "Error during reverse-fill by kodepos", error instanceof Error ? error : new Error(String(error)));
						} finally {
							selectedValue = null;
						}
					}
				}
			} finally {
				if (runId === void 0 || runId === this._kodeposRunId) {
					this._skipChangeListener = false;
					this._settleLevels(runId);
				}
			}
		}
		/**
		* Handles error reporting by logging to the console and delegating UI state
		* updates to the appropriate adapter.
		*
		* @param {Object} schema - The schema reference object for the level where the error occurred.
		* @param {string} message - A descriptive error message.
		* @param {Error|null} [error=null] - The original error object, if available.
		* @returns {void}
		*
		* @example
		* picker._throwError(kotaSchema, "Failed to load cities", new Error("Network Timeout"));
		*
		* @description
		* This method centralizes error handling. It logs a formatted error to the console,
		* then attempts to call the `onError` method of the level's UI adapter to show
		* visual feedback. If the adapter fails or doesn't implement the method, it
		* applies a fallback CSS class to the element.
		*/
		_throwError(schema, message, error = null) {
			console.error(`[${schema?.name ?? "unknown"}] ❌`, message, error);
			if (!schema) return;
			const { el, adapter } = schema;
			if (adapter?.onError) try {
				adapter.onError(el, message);
				return;
			} catch (err) {
				console.warn("adapter.onError failed:", err);
			}
			el.classList.add("error");
		}
		/**
		* Clears the values and UI states of all administrative levels following a specified level.
		*
		* @param {IdAddressLevel} level - The name of the level from which to start clearing (e.g., 'propinsi').
		* @param {boolean} [refresh=false] - If true, also clears the data for the current level itself.
		* @returns {void}
		*
		* @example
		* // Clears Kota, Kecamatan, Kelurahan, and Kodepos when Propinsi changes
		* picker.clearNextLevel('propinsi');
		*
		* @description
		* This method manages the reset logic for the cascading dropdowns. It identifies the starting
		* point in the schema, optionally nullifies the current level's data, and then iterates
		* through all subsequent levels to reset their internal state and trigger the UI
		* adapter's `clear` method to update the DOM.
		*/
		clearNextLevel(level, refresh = false) {
			const schema = this.schema.find((s) => s.name === level);
			if (refresh) this._setDetail({
				[`${level}_id`]: null,
				[`${level}_name`]: null
			});
			let nextLevelSchema = schema?.next;
			if (this._skipChangeListener) return;
			while (nextLevelSchema) {
				this._setDetail({
					[`${nextLevelSchema.name}_id`]: null,
					[`${nextLevelSchema.name}_name`]: null
				});
				nextLevelSchema.adapter.clear?.(nextLevelSchema.el);
				nextLevelSchema = nextLevelSchema.next;
			}
		}
		/**
		* Puts every dropdown level into, or out of, the loading state without touching
		* which level is loading next.
		*
		* @param state - `"loading"` clears the current rows and flags the level busy;
		*   `"idle"` only drops the busy marker so the level shows its placeholder again.
		*
		* @example
		* picker._setLevelsState("loading"); // kodepos typed — old address must go
		*
		* @description
		* A kodepos change invalidates the entire chain above it, but resolving the new
		* hierarchy costs a round trip. Without this step the previous province, city and
		* district stay on screen looking valid while the new ones are being fetched — the
		* user reads a complete address that does not belong to the code they just typed.
		* Clearing them up front (and saying "loading" while doing it) makes that gap
		* honest; `_updateLevelsByKodepos` then refills the chain top-down, so each level
		* swaps its spinner for real rows in the order the user reads them.
		*/
		_setLevelsState(state) {
			for (const item of this.schema) {
				if (!item.isDropdown) continue;
				this._setDetail({
					[`${item.name}_id`]: null,
					[`${item.name}_name`]: null
				});
				this._loadedLevels.delete(item.name);
				if (state === "loading") {
					this.__emitChange("onLevelLoaded", {
						schema: item,
						data: [],
						state: "start",
						complete: () => "start"
					});
					delete item.el.__onLevelChange;
				} else item.adapter.clear?.(item.el);
			}
		}
		/**
		* Releases the dropdown levels a kodepos fill never got to.
		*
		* @param runId - Token of the fill that asked, so an older run cannot un-load
		*   levels a newer one is still filling (omit for programmatic calls).
		*
		* @example
		* picker._settleLevels(runId); // after _updateLevelsByKodepos finished
		*
		* @description
		* The endpoint answers with the hierarchy it knows; a parent without districts
		* leaves `kecamatan` — and everything under it — with no rows. Those levels were
		* flagged loading by `_setLevelsState("loading")` and would otherwise keep the
		* "Loading …" placeholder forever, so anything that did not actually render goes
		* back to its idle placeholder. Membership is decided by `_loadedLevels`, not by
		* the detail object: an empty level is still recorded in the detail.
		*/
		_settleLevels(runId) {
			if (runId !== void 0 && runId !== this._kodeposRunId) return;
			for (const item of this.schema) {
				if (!item.isDropdown) continue;
				if (this._loadedLevels.has(item.name)) continue;
				item.adapter.clear?.(item.el);
			}
		}
		async loadNextLevel(level, parentId, selectedValue = null) {
			const schema = this.schema.find((s) => s.name === level);
			if (!schema) throw new Error(`Level '${level}' not found`);
			return this._loadLevel(schema, parentId, selectedValue);
		}
		/**
		* Retrieves administrative regional data either from the local cache or by calling the remote API.
		*
		* @param {IdAddressQuery} [query={}] - The query parameters for the data request.
		* @returns {Promise<Array|Object>} A promise that resolves to the requested regional data.
		* @throws {Error} If the API request fails or cache retrieval encounters a critical error.
		*
		* @example
		* const cities = await picker.getRegionalData({ level: 'kota', parentId: 11 });
		*
		* @description
		* This method acts as a data proxy. It generates a unique cache key based on the query parameters,
		* checks if valid data exists in `localStorage`, and if not, performs a network fetch.
		* To ensure a consistent UI experience, it introduces a configurable artificial delay
		* when serving data from the cache.
		*/
		async getRegionalData(query) {
			if (typeof this.config.loader === "function") return this.config.loader(query);
			return this._fetchAPI(query);
		}
		/**
		* Fetches comprehensive administrative details and optional geolocation data
		* based on a specific postal code.
		*
		* @param {string|number} kodepos - The postal code to look up.
		* @param {boolean} [location=false] - Whether to include latitude and longitude in the response.
		* @returns {Promise<Array<Object>>} A promise that resolves to an array containing the address hierarchy.
		* @throws {Error} If the network request fails or the postal code is not found.
		*
		* @example
		* const details = await picker.getDetailByKodepos('12345', true);
		* console.log(details[0].propinsi_name); // "DKI Jakarta"
		*
		* @description
		* This method serves as a high-level wrapper around `getRegionalData`. It specifically
		* requests the 'detail' level, which triggers the API to return the full
		* administrative chain (Province down to Kelurahan) associated with the provided
		* postal code, rather than just a list of options for a single level.
		*/
		async getDetailByKodepos(kodepos, location = false) {
			return await this.getRegionalData({
				level: "detail",
				kodepos: String(kodepos),
				location
			});
		}
		/**
		* Fetches geographic coordinates (latitude and longitude) for a specific address hierarchy.
		*
		* @param {Object} [detail={}] - An object containing administrative names (propinsi_name, kota_name, etc.).
		* @returns {Promise<Object>} A promise that resolves to an object containing geocode data.
		* @throws {Error} If the API request fails or the network times out.
		*
		* @example
		* const detail = picker.detail;
		* const geo = await picker.getGeocodeLocation(detail);
		* console.log(geo.latitude, geo.longitude);
		*
		* @description
		* This method maps the internal address detail state to a set of query parameters
		* required by the geocoding service. It performs a network fetch via the central
		* `_fetchAPI` method using the 'geocode' level, which triggers the backend to
		* resolve the text-based address into spatial coordinates.
		*/
		async getGeocodeLocation(detail) {
			const params = {
				kodepos: detail.kodepos_name,
				kelurahan: detail.kelurahan_name,
				kecamatan: detail.kecamatan_name,
				kota: detail.kota_name,
				propinsi: detail.propinsi_name
			};
			return await this._fetchAPI({
				level: "geocode",
				...params
			});
		}
		/**
		* Retrieves the current administrative detail state, filtering out null values.
		*
		* @returns {Object} An object containing the current address details (IDs and names).
		*
		* @example
		* const currentAddress = picker.detail;
		* console.log(currentAddress.propinsi_name);
		*
		* @description
		* How it works: The getter iterates through the internal `_detail` object. It uses
		* `Object.hasOwn` to ensure only instance properties are processed, and it
		* deletes any keys that have a value of `null` to provide a clean, active state
		* representation of the selected address.
		*/
		get detail() {
			for (const key in this._detail) {
				if (!Object.hasOwn(this._detail, key)) continue;
				if (this._detail[key] === null) delete this._detail[key];
			}
			return this._detail;
		}
		/**
		* Updates the internal address detail state with new values, optionally resetting the state first.
		*
		* @param {Object} value - An object containing address detail keys (e.g., propinsi_id, kota_name).
		* @param {boolean} [refresh=false] - If true, clears the existing detail state before merging the new value.
		* @returns {void}
		* @throws {TypeError} If the provided value fails the `_isIAddressDetail` validation.
		*
		* @example
		* builder._setDetail({ propinsi_id: 31, propinsi_name: 'DKI Jakarta' });
		* builder._setDetail({ kodepos_name: 12345 }, true); // Resets other fields
		*
		* @description
		* This method serves as the central state manager for the selected address. It validates the
		* input against a strict schema of allowed keys and types, handles the merging of new data
		* into the existing `_detail` object, and supports a "refresh" mode to start with a clean slate.
		*/
		_setDetail(value, refresh = false) {
			if (!isAddressDetail(value)) throw new TypeError("Invalid value: expected an IAddressDetail-like object");
			if (refresh) this._detail = {};
			this._detail = {
				...this.detail,
				...value
			};
		}
		/**
		* Performs a network request to the configured API endpoint with automatic timeout and abort handling.
		*
		* @param {IdAddressQuery} [query={}] - Key-value pairs to be appended as URL search parameters.
		* @param {RequestInit} [options={}] - Standard fetch options (method, headers, etc.).
		* @param {number} [timeout=10000] - Maximum time in milliseconds to wait before aborting the request.
		* @returns {Promise<any>} A promise that resolves to the 'data' property of the successful JSON response.
		* @throws {Error} If the request times out, returns a non-2xx status, or the JSON payload indicates failure.
		*
		* @example
		* const data = await picker._fetchAPI({ level: 'propinsi' });
		*
		* @description
		* This method wraps the native `fetch` API with a lifecycle management system. It creates an
		* `AbortController` for every request, registers it in an internal set for cleanup during
		* instance destruction, and sets a timer to trigger an abort if the server doesn't respond
		* within the specified window. It also normalizes the API response format.
		*/
		/**
		* Requests one level through the HTTP service.
		*
		* The builder used to own a transport (fetch + AbortController + timeout + its own
		* localStorage cache), which meant a second, slightly different HTTP stack inside a
		* form component. `HttpService` already does all of it, so this is a thin adapter: it
		* forwards the query and unwraps the response envelope the registry returns
		* (`{ success, data, meta }` → `data`).
		*
		* @param query - Level query (`{ level, parentId }`, `{ level: "kodepos" }`, …).
		* @returns The rows of that level, or `undefined` when the instance is destroyed.
		*/
		async _fetchAPI(query) {
			if (this._destroyed) return;
			if (!this.config.service && !this.config.url) throw new Error("[IdAddress] No data source configured. Pass a `loader` (preferred), a `service`, or a `url` when constructing the picker.");
			const envelope = await _assertClassBrand(_IdAddressBuilder_brand, this, _httpService).call(this).get(query);
			return envelope && typeof envelope === "object" && "data" in envelope ? envelope.data : envelope;
		}
		/**
		* Retrieves the name of the administrative level immediately preceding or following a given level.
		*
		* @param {IdAddressLevel} level - The reference level name (e.g., 'kota').
		* @param {boolean} [next=true] - If true, returns the child level; if false, returns the parent level.
		* @returns {string|null} The name of the related level, or null if the boundary is reached or level is invalid.
		*
		* @example
		* const parent = builder._getRelatedLevel('kota', false); // returns 'propinsi'
		* const child = builder._getRelatedLevel('kota', true);   // returns 'kecamatan'
		*
		* @description
		* How it works: The method looks up the index of the provided level within the `_levelOrder` array.
		* It then calculates the target index by adding or subtracting 1 based on the `next` flag.
		* Finally, it returns the value at that index if it falls within the array bounds.
		*/
		_getRelatedLevel(level, next = true) {
			const index = this._levelOrder.indexOf(level);
			const targetIndex = index + (next ? 1 : -1);
			return index >= 0 && targetIndex >= 0 && targetIndex < this._levelOrder.length ? this._levelOrder[targetIndex] : null;
		}
		/**
		* Binds internal event listeners to the builder's event system to coordinate
		* communication between the data logic and UI adapters.
		*
		* @returns {void}
		*
		* @example
		* this._bindInternalEvents();
		*
		* @description
		* This method sets up the core reactive loop of the builder. It listens for
		* `onLevelLoaded` to trigger UI updates (populating dropdowns) and
		* `onLevelChanged` to synchronize the internal state and handle programmatic
		* selection updates across different adapters.
		*/
		_bindInternalEvents() {
			this.__on("onLevelLoaded", (schema, data, complete, rest) => {
				if (this._destroyed) return;
				try {
					const { el, adapter } = schema;
					const onLevelChange = rest?.onLevelChange;
					adapter.setOptions?.(el, {
						options: data,
						state: complete(),
						onLevelChange
					});
				} catch (err) {
					console.error("onLevelLoaded handler failed:", err);
				}
			});
			this.__on("onLevelChanged", (schema, data) => {
				if (this._destroyed) return;
				try {
					const { el, adapter, name: level } = schema;
					if (!this._skipChangeListener) this._setDetail(data);
					if (data?.[`${level}_id`] && el.__isDropdown) adapter.setSelectedOption?.(el, data[`${level}_id`]);
				} catch (err) {
					console.error("onLevelChanged handler failed:", err);
				}
			});
		}
		/**
		* Registers an event handler in the builder's internal listener registry.
		*
		* @param {string} event - Internal event name to subscribe to.
		* @param {IdAddressEventHandler} handler - Callback invoked when the event is emitted.
		* @returns {void} Does not return a value; it stores the handler in `_listeners`.
		* @throws {void} This method does not throw; invalid handlers will fail later when emitted.
		*
		* @example
		* builder.__on('onLevelLoaded', (schema, data, complete) => {
		*   console.log(schema.name, complete(), data);
		* });
		*
		* @description
		* How it works: the method creates an array for the event name if one does not exist,
		* then appends the callback so `__emitChange` can call it later.
		*/
		__on(event, handler) {
			if (!this._listeners[event]) this._listeners[event] = [];
			this._listeners[event].push(handler);
		}
		/**
		* Emits one internal builder event to all registered listeners.
		*
		* @param {string} event - Internal event name to emit.
		* @param {IdAddressEventArgs} [args={}] - Event payload and lifecycle metadata.
		* @returns {void} Does not return a value; listeners receive the normalized event arguments.
		* @throws {void} Listener errors are caught and logged so one failing callback does not stop the rest.
		*
		* @example
		* builder.__emitChange('onLevelChanged', {
		*   schema: builder.schema[0],
		*   data: { propinsi_id: 31 },
		*   state: 'complete',
		* });
		*
		* @description
		* How it works: the method normalizes event arguments, looks up all registered
		* listeners for the event, and invokes each listener with protected error handling.
		*/
		__emitChange(event, args = {}) {
			const { schema = null, data = {}, state = "start", complete = (status = state) => status, ...rest } = args || {};
			const listeners = this._listeners?.[event];
			if (!listeners || !listeners.length) return;
			for (const fn of listeners) try {
				fn(schema, data, complete, rest);
			} catch (err) {
				console.error(`[IdAddressBuilder:_emit] Listener error on '${event}':`, err);
			}
		}
		/**
		* Emits both a level-specific change event and the shared `onLevelChanged` event.
		*
		* @param {IdAddressLevel} level - Administrative level name used to build the level-specific event.
		* @param {IdAddressEventArgs} fn - Event payload used for both emitted change events.
		* @returns {void} Does not return a value; it emits events and synchronizes detail state.
		* @throws {TypeError} May throw if `fn.data` is not a valid address detail object.
		*
		* @example
		* builder.__emitLevelChange('propinsi', {
		*   schema: builder.schema[0],
		*   data: { propinsi_id: 31, propinsi_name: 'DKI Jakarta' },
		*   state: 'complete',
		* });
		*
		* @description
		* How it works: the method first emits `<level>Changed` for targeted subscribers,
		* then emits the generic `onLevelChanged` event, and finally merges the payload
		* data into the builder detail state.
		*/
		__emitLevelChange(level, fn) {
			this.__emitChange(`${level}Changed`, fn);
			this.__emitChange(`onLevelChanged`, fn);
			this._setDetail(fn?.data);
		}
		/**
		* Registers a callback that runs when a level finishes loading options or enters a loading state.
		*
		* @param {IdAddressEventHandler} fn - Listener invoked with the loaded level schema, data, state resolver, and metadata.
		* @returns {void} Does not return a value; it registers the listener.
		*
		* @example
		* builder.onLevelLoaded((schema, data, complete) => {
		*   console.log(`${schema.name}: ${complete()}`, data);
		* });
		*
		* @description
		* This is the public subscription helper for the internal `onLevelLoaded` event.
		*/
		onLevelLoaded(fn) {
			this.__on("onLevelLoaded", fn);
		}
		/**
		* Registers a callback that runs after an administrative level selection changes.
		*
		* @param {IdAddressEventHandler} fn - Listener invoked with the changed level schema and selected data.
		* @returns {void} Does not return a value; it registers the listener.
		*
		* @example
		* builder.onLevelChanged((schema, data) => {
		*   console.log(schema.name, data);
		* });
		*
		* @description
		* This is the public subscription helper for the internal `onLevelChanged` event.
		*/
		onLevelChanged(fn) {
			this.__on("onLevelChanged", fn);
		}
		/**
		* Registers a callback that runs when geocode data has been loaded.
		*
		* @param {IdAddressEventHandler} fn - Listener invoked with the active schema and geocode payload.
		* @returns {void} Does not return a value; it registers the listener.
		*
		* @example
		* builder.onGeocodeLoaded((schema, data) => {
		*   console.log(data.latitude, data.longitude);
		* });
		*
		* @description
		* This is the public subscription helper for the internal `onGeocodeLoaded` event.
		*/
		onGeocodeLoaded(fn) {
			this.__on("onGeocodeLoaded", fn);
		}
	};
	/**
	* The HTTP service this picker talks through.
	*
	* Built once from `config.service`, or from `url` + `cache` when none was injected.
	*
	* @returns The service instance.
	*/
	function _httpService() {
		if (!_classPrivateFieldGet2(_http, this)) {
			_classPrivateFieldSet2(_ownsHttp, this, !this.config.service);
			_classPrivateFieldSet2(_http, this, this.config.service ?? new HttpService({
				url: this.config.url ?? "",
				cacheEnabled: this.config.cache?.enabled ?? true,
				cacheTtlDays: this.config.cache?.ttlDays ?? 1,
				cachePrefix: this.config.cache?.prefix ?? "IdAddressBuilder",
				delay: this.config.cache?.delay ?? 0,
				timeout: this.config.cache?.timeout ?? 1e4
			}));
		}
		return _classPrivateFieldGet2(_http, this);
	}
	// packages/components/id-address/index.ts
	var id_address_exports = /* @__PURE__ */ __exportAll({ IdAddressBuilder: () => IdAddressBuilder });
	// packages/components/input/FieldTypes.ts
	/** Attributes shared by every free-text control. */
	var TEXTUAL = [
		"placeholder",
		"name",
		"required",
		"disabled",
		"readonly"
	];
	/** Attributes shared by every control that holds a scalar value. */
	var SCALAR = [
		"name",
		"value",
		"required",
		"disabled"
	];
	/** The matrix. Every `InputType` must appear, so a new type cannot be half-added. */
	var INPUT_TYPE_REGISTRY = {
		text: {
			control: "@field>input",
			attributes: [
				...TEXTUAL,
				"maxlength",
				"minlength",
				"pattern",
				"autocomplete",
				"inputmode",
				"value"
			]
		},
		textarea: {
			control: "@field>textarea",
			attributes: [
				...TEXTUAL,
				"rows",
				"cols",
				"maxlength",
				"minlength"
			]
		},
		number: {
			control: "@field>input",
			attributes: [
				...TEXTUAL,
				"min",
				"max",
				"step",
				"value"
			]
		},
		select: {
			control: "@field>select",
			attributes: [
				"name",
				"required",
				"disabled",
				"multiple",
				"value"
			]
		},
		dropdown: {
			control: null,
			attributes: [
				"name",
				"required",
				"disabled",
				"value"
			]
		},
		picker: {
			control: null,
			attributes: [
				"name",
				"required",
				"disabled",
				"value"
			]
		},
		actions: {
			control: "@field>input",
			attributes: [...SCALAR]
		},
		checkbox: {
			control: "@field>checkbox",
			attributes: [...SCALAR, "checked"]
		},
		radio: {
			control: "@field>radio",
			attributes: [...SCALAR, "checked"]
		},
		range: {
			control: "@field>input",
			attributes: [
				...SCALAR,
				"min",
				"max",
				"step"
			]
		},
		date: {
			control: "@field>input",
			attributes: [
				...SCALAR,
				"min",
				"max"
			]
		},
		time: {
			control: "@field>input",
			attributes: [
				...SCALAR,
				"min",
				"max"
			]
		},
		"datetime-local": {
			control: "@field>input",
			attributes: [
				...SCALAR,
				"min",
				"max"
			]
		},
		file: {
			control: "@field>file",
			attributes: [
				"name",
				"required",
				"disabled",
				"accept",
				"multiple"
			]
		},
		color: {
			control: "@field>input",
			attributes: [...SCALAR]
		},
		email: {
			control: "@field>input",
			attributes: [
				...TEXTUAL,
				"maxlength",
				"minlength",
				"pattern",
				"value"
			]
		},
		password: {
			control: "@field>input",
			attributes: [
				...TEXTUAL,
				"maxlength",
				"minlength",
				"pattern",
				"value"
			]
		},
		url: {
			control: "@field>input",
			attributes: [
				...TEXTUAL,
				"maxlength",
				"pattern",
				"value"
			]
		},
		tel: {
			control: "@field>input",
			attributes: [
				...TEXTUAL,
				"maxlength",
				"pattern",
				"value"
			]
		},
		hidden: {
			control: "@field>input",
			attributes: [
				"name",
				"value",
				"required",
				"disabled"
			]
		}
	};
	/** The `text` row: the fallback for an unknown or missing type. */
	function inputTypeOf(type) {
		return INPUT_TYPE_REGISTRY[type ?? "text"] ?? INPUT_TYPE_REGISTRY.text;
	}
	// packages/components/input/InputModuleTypes.ts
	/** Stable ids for input sub-modules. */
	var INPUT_MODULE_IDS = {
		dropdown: "dropdown",
		file: "file",
		controls: "controls",
		popover: "popover",
		picker: "picker"
	};
	// packages/components/input/InputRegistry.ts
	/**
	* Input module registry — **data and helpers only, zero implementations.**
	*
	* The input layer has its own sub-modules — controls nobody should pay for unless the
	* field asks for them: a dropdown (a whole builder), the uploader (~1.8k lines), the
	* action button set, and popovers. This file declares them as **refs** (`InputModuleManifest`,
	* strings) and offers the helpers that walk a preset; the live definitions
	* (`INPUT_MODULE_DEFINITIONS`, `{ id, load }`) live in `./InputModules`, behind the
	* `@aio-ui/input/modules` subpath.
	*
	* That split is deliberate: importing `@aio-ui/input` must not compile the four modules.
	* `scripts/bundle-probe.mjs` proves it against the parsed module graph — which is also why
	* no helper here may name a default preset: a default parameter is an import edge.
	*
	* The helpers therefore take an **optional** preset and do nothing without one. There is
	* nothing to mount, read or offer when the host declared no modules — that is a capability,
	* not an error.
	*
	* This is *not* the field-type matrix — that is `FieldTypes.ts`. This file decides who is
	* allowed to touch a field while it is being built.
	*/
	/** Whether a preset item is a definition (needs loading) or a live adapter. */
	function isDefinition(item) {
		return typeof item.load === "function";
	}
	/**
	* Turns any accepted preset into adapters, plus a disposer for the ones it created.
	*
	* @param preset - Definitions, live adapters, or a mix of both.
	* @param context - Host configuration handed to freshly loaded modules.
	* @returns The adapters to use and the matching cleanup.
	*/
	function adaptersOf(preset, context) {
		const definitions = preset.filter(isDefinition);
		const live = preset.filter((item) => !isDefinition(item));
		if (!definitions.length) return {
			adapters: live,
			dispose: () => {}
		};
		const loader = new ModuleLoader$1("input", definitions);
		return {
			adapters: [...loader.resolveAll(context), ...live],
			dispose: () => loader.unloadAll()
		};
	}
	/**
	* The stack as manifest refs, so a parent component can declare it without importing
	* classes and the registry can resolve one entry at a time.
	*
	* @summary `scope` is deliberately absent here: these are input-layer modules, and it is
	* the *nesting* component (`form`) that labels them `scope: "input"` when it re-declares
	* the list in its own manifest.
	*/
	var INPUT_MODULE_MANIFEST = [
		{
			id: "dropdown",
			path: "@aio-ui/input/dropdown/module",
			export: "dropdownInputModule"
		},
		{
			id: "picker",
			path: "@aio-ui/input/picker/module",
			export: "pickerInputModule"
		},
		{
			id: "file",
			path: "@aio-ui/input/file-uploader/module",
			export: "fileUploaderInputModule"
		},
		{
			id: "controls",
			path: "@aio-ui/input/controls/module",
			export: "inputControlsInputModule"
		},
		{
			id: "popover",
			path: "@aio-ui/input/popover/module",
			export: "popoverInputModule"
		}
	];
	/**
	* Offers a subtree to every module in the preset.
	*
	* This is the only entry point a host needs for "fields that were not built by
	* `InputBuilder`" (raw HTML in a form, a multistep step that was just mounted): the
	* registry walks its own set, so the caller never names `FileUploader` — or any other
	* adapter — and a preset without the `file` module simply has nothing to mount.
	*
	* @param root - Subtree to scan.
	* @param preset - Definitions to resolve. Omit it and nothing is mounted: without a
	*   declared preset there is no module to run, and guessing one would undo the split.
	*/
	function mountInputModules(root, preset) {
		if (!preset?.length) return;
		const { adapters, dispose } = adaptersOf(preset, { builderConfig: { themeId: "default" } });
		for (const module of adapters) module.mount?.(root);
		dispose();
	}
	/**
	* The files currently selected inside a form, keyed by input name.
	*
	* @param formId - Id of the form that owns the file inputs.
	* @param preset - Definitions to resolve. Omit it and the answer is "no files", because
	*   no module can read them.
	* @returns Raw files; empty when the preset has no module that can read them.
	*/
	function inputFilesOf(formId, preset) {
		if (!preset?.length) return {};
		const { adapters, dispose } = adaptersOf(preset, { builderConfig: { themeId: "default" } });
		const module = adapters.find((m) => typeof m.getFiles === "function");
		const files = module?.getFiles ? module.getFiles(formId) : {};
		dispose();
		return files;
	}
	// packages/components/input/Missing.ts
	/**
	* Reports one missing capability — once per builder, or not at all when it is fatal.
	*
	* @param report - Capability, module, fix, consequence and severity.
	* @param options - Owner label, the builder's dedupe set, and the host emitter.
	* @returns Nothing. Throws for `severity: "error"`.
	* @throws {Error} With the capability, the module id and the fixing subpath in the message.
	*
	* @example
	* // A field fell back to a native select, so say it once.
	* reportMissing({ capability: "dropdown", module: "dropdown", fix: "@aio-ui/input/dropdown/module (dropdownInputModule)", consequence: "the field falls back to a native select with the same options", severity: "warn" }, { seen });
	*/
	function reportMissing(report, options = {}) {
		const { owner = "InputBuilder", seen, emit = null } = options;
		const detail = {
			builder: owner,
			capability: report.capability,
			module: report.module,
			fix: report.fix,
			consequence: report.consequence,
			severity: report.severity
		};
		if (report.severity === "error") {
			emit?.("moduleMissing", detail);
			throw new Error(`[${owner}] ${report.capability}: the "${report.module}" module is not in this builder's set, so ${report.consequence} Add it with ${report.fix}.`);
		}
		if (seen?.has(report.capability)) return;
		seen?.add(report.capability);
		console.warn(`[${owner}] ${report.capability}: the "${report.module}" module is not in this builder's set, so ${report.consequence} Add it with ${report.fix}.`);
		emit?.("moduleMissing", detail);
	}
	// packages/components/input/Input.ts
	/**
	* Attributes `applyAttributes` knows how to map, in application order.
	*
	* A key not listed here is not applied by the builder (it can still be passed through
	* `config.attributes`), and a key listed here is still dropped for a type whose registry
	* row does not accept it.
	*/
	var ATTRIBUTE_ORDER = [
		"value",
		"checked",
		"placeholder",
		"required",
		"disabled",
		"readonly",
		"multiple",
		"accept",
		"min",
		"max",
		"minlength",
		"maxlength",
		"step",
		"pattern",
		"rows",
		"cols",
		"autocomplete",
		"inputmode"
	];
	/** Attributes whose presence is the value: `required`, `disabled`, `multiple`, … */
	var BOOLEAN_ATTRIBUTES = /* @__PURE__ */ new Set([
		"required",
		"disabled",
		"readonly",
		"multiple"
	]);
	var _input = /* @__PURE__ */ new WeakMap();
	var _loader = /* @__PURE__ */ new WeakMap();
	var _live = /* @__PURE__ */ new WeakMap();
	var _declared = /* @__PURE__ */ new WeakMap();
	var _warned = /* @__PURE__ */ new WeakMap();
	var _modules = /* @__PURE__ */ new WeakMap();
	var _InputBuilder_brand = /* @__PURE__ */ new WeakSet();
	var InputBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — one label and one control box, drawn with the mandatory
		* `@aio-ui/skeleton` primitive. The control type (select, textarea, switch) changes the
		* skin, never the box: a field reserves one line plus one control.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [{
					shape: "line",
					width: "25%"
				}, {
					shape: "bone",
					height: "2.75rem"
				}]
			});
		}
		constructor(config = {}) {
			super();
			_classPrivateMethodInitSpec(this, _InputBuilder_brand);
			_defineProperty(this, "builderId", "input");
			_defineProperty(this, "name", "input");
			_defineProperty(this, "stylesheet", "./input.css");
			_classPrivateFieldInitSpec(this, _input, {});
			_classPrivateFieldInitSpec(this, _loader, void 0);
			_classPrivateFieldInitSpec(this, _live, void 0);
			_classPrivateFieldInitSpec(this, _declared, void 0);
			_classPrivateFieldInitSpec(this, _warned, /* @__PURE__ */ new Set());
			_classPrivateFieldInitSpec(this, _modules, []);
			const defaultConfig = {
				themeId: "default",
				selectors: {
					"@field": {
						tagName: "div",
						className: "field"
					},
					"@field>label": { tagName: "label" },
					"@field>input": { tagName: "input" },
					"@field>textarea": { tagName: "textarea" },
					"@field>select": { tagName: "select" },
					"@field>select>option": { tagName: "option" },
					"@field>checkbox": {
						tagName: "input",
						type: "checkbox",
						wrapper: ".switch.control"
					},
					"@field>radio": {
						tagName: "input",
						type: "radio"
					},
					"@field>toggle": {
						tagName: "input",
						wrapper: ".switch.control"
					},
					"@field>file": {
						tagName: "input",
						type: "file"
					},
					"@field>info": {
						tagName: "small",
						className: "info"
					}
				},
				namespace: null,
				emit: () => {},
				modules: null
			};
			this.config = this.resolveConfig(defaultConfig, config);
			if (Array.isArray(this.config.modules)) {
				const preset = this.config.modules;
				const definitions = preset.filter((item) => typeof item.load === "function");
				_classPrivateFieldSet2(_live, this, preset.filter((item) => typeof item.load !== "function"));
				_classPrivateFieldSet2(_loader, this, definitions.length ? new ModuleLoader$1("input", definitions) : null);
			} else {
				_classPrivateFieldSet2(_live, this, []);
				_classPrivateFieldSet2(_loader, this, this.config.modules ?? new ModuleLoader$1("input", []));
			}
			_classPrivateFieldSet2(_declared, this, new Set(_classPrivateFieldGet2(_loader, this)?.ids() ?? []));
		}
		resolvePayload(inputObj) {
			const defaultPayload = {
				type: "text",
				id: this._sanitizeId(inputObj.id || inputObj.title || `input-${Math.random().toString(36).slice(2, 10)}`),
				title: "",
				placeholder: "",
				rows: 3,
				multiple: false,
				disabled: false,
				readonly: false,
				required: false,
				checked: false,
				config: {
					attributes: [],
					style: "",
					className: "",
					options: [],
					useLabel: true,
					display: void 0,
					createEventListener: false,
					popover: void 0,
					actions: void 0
				}
			};
			const inputPayload = {
				...defaultPayload,
				...inputObj,
				config: {
					...defaultPayload.config,
					...inputObj.config
				}
			};
			if (!inputPayload.placeholder && inputPayload.title) inputPayload.placeholder = inputPayload.type === "select" || inputPayload.type === "textarea" ? `Pilih ${inputPayload.title}` : `Isi ${inputPayload.title}`;
			const rawOptions = inputObj.config?.options ?? inputObj.options;
			if (Array.isArray(rawOptions)) inputPayload.config.options = rawOptions.map((option) => typeof option === "string" ? {
				value: option,
				label: option
			} : option);
			return inputPayload;
		}
		prepare(inputObj, _config) {
			_classPrivateFieldSet2(_input, this, this.resolvePayload(inputObj));
			const cfg = _classPrivateFieldGet2(_input, this).config;
			const definition = inputTypeOf(_classPrivateFieldGet2(_input, this).type);
			_classPrivateFieldSet2(_modules, this, [..._classPrivateFieldGet2(_loader, this)?.resolveAll(_get_moduleContext.call(_assertClassBrand(_InputBuilder_brand, this))) ?? [], ..._classPrivateFieldGet2(_live, this)]);
			if (cfg?.actions && !_assertClassBrand(_InputBuilder_brand, this, _offers).call(this, "renderActions")) _assertClassBrand(_InputBuilder_brand, this, _missing).call(this, "actions", INPUT_MODULE_IDS.controls, "@aio-ui/input/controls/module (inputControlsInputModule)", "the declared action buttons would never render.", "error");
			const wrapper = this.render("@field", _classPrivateFieldGet2(_input, this));
			const labelText = _classPrivateFieldGet2(_input, this).label ?? _classPrivateFieldGet2(_input, this).title;
			const isToggle = _classPrivateFieldGet2(_input, this).type === "checkbox" || _classPrivateFieldGet2(_input, this).type === "radio";
			const labelPosition = _classPrivateFieldGet2(_input, this).config?.position ?? _classPrivateFieldGet2(_input, this).position ?? (isToggle ? "right" : void 0);
			const label = labelText && _classPrivateFieldGet2(_input, this).config?.useLabel !== false ? this.render("@field>label", {
				text: labelText,
				position: labelPosition,
				id: _classPrivateFieldGet2(_input, this).id
			}) : null;
			if (label) wrapper.appendChild(label);
			let inputEl = null;
			for (const module of _classPrivateFieldGet2(_modules, this)) {
				const rendered = module.renderControl?.(_classPrivateFieldGet2(_input, this), _get_moduleContext.call(_assertClassBrand(_InputBuilder_brand, this)));
				if (rendered) {
					inputEl = rendered;
					break;
				}
			}
			const controlKey = _classPrivateFieldGet2(_input, this).type === "radio" && _assertClassBrand(_InputBuilder_brand, this, _isToggleStyle).call(this) ? "@field>toggle" : definition.control;
			if (!inputEl && controlKey) inputEl = this.render(controlKey, _classPrivateFieldGet2(_input, this));
			if (!inputEl) {
				inputEl = controlKey ? this.render("@field>input", _classPrivateFieldGet2(_input, this)) : this.render("@field>select", _classPrivateFieldGet2(_input, this));
				if (!controlKey) {
					const type = String(_classPrivateFieldGet2(_input, this).type ?? "");
					const module = INPUT_MODULE_IDS[type] ?? type;
					_assertClassBrand(_InputBuilder_brand, this, _missing).call(this, type, module, `@aio-ui/input/${module}/module (${module}InputModule)`, "the field falls back to a native select over the same options.");
				}
				if ((_classPrivateFieldGet2(_input, this).type === "text" || _classPrivateFieldGet2(_input, this).type === "number") && cfg?.className === "loading") inputEl.classList.add("loading");
			}
			if (_classPrivateFieldGet2(_input, this).type === "file" && !_assertClassBrand(_InputBuilder_brand, this, _offers).call(this, "getFiles")) _assertClassBrand(_InputBuilder_brand, this, _missing).call(this, "file", INPUT_MODULE_IDS.file, "@aio-ui/input/file-uploader/module (fileUploaderInputModule)", "the field is a plain file input: no preview, and onFileSelected never fires.");
			if (inputEl) this.applyAttributes(inputEl, _classPrivateFieldGet2(_input, this));
			if (_classPrivateFieldGet2(_input, this).editable === true || cfg?.editable === true) wrapper.setAttribute("data-editable", "true");
			if (_classPrivateFieldGet2(_input, this).info) {
				const info = this.render("@field>info", _classPrivateFieldGet2(_input, this).info);
				wrapper.appendChild(info);
			}
			if (inputEl) inputEl.__outer ? wrapper.appendChild(inputEl.__outer) : wrapper.appendChild(inputEl);
			if (inputEl) {
				for (const module of _classPrivateFieldGet2(_modules, this)) module.decorate?.(wrapper, inputEl, _classPrivateFieldGet2(_input, this), _get_moduleContext.call(_assertClassBrand(_InputBuilder_brand, this)));
				if (cfg?.popover && _get_popoverMissing.call(_assertClassBrand(_InputBuilder_brand, this))) _assertClassBrand(_InputBuilder_brand, this, _missing).call(this, "popover", INPUT_MODULE_IDS.popover, "@aio-ui/input/popover/module (popoverInputModule)", "config.popover is ignored and no anchor attaches to the control.");
			}
			return wrapper;
		}
		template(typeKey, el, payload) {
			if (!payload) return;
			const cfg = payload.config;
			switch (typeKey) {
				case "@field":
					if (payload?.className && payload?.className !== "loading") el.classList.add(...payload.className.split(" ").filter(Boolean));
					if (payload?.display) el.setAttribute("data-display", payload.display ?? cfg.display);
					break;
				case "@field>label":
					el.setAttribute("for", payload.id);
					el.textContent = payload.text;
					if (payload.position) el.setAttribute("data-position", payload.position);
					break;
				case "@field>checkbox":
					el.type = "checkbox";
					const slider = document.createElement("div");
					slider.className = "slider";
					slider.setAttribute("data-shape", "round");
					el.__outer.appendChild(slider);
					break;
				case "@field>input":
					el.type = payload.type || "text";
					el.autocomplete = "off";
					break;
				case "@field>textarea":
					el.rows = payload.rows;
					break;
				case "@field>select":
					if (cfg?.className === "loading") el.classList.add("loading");
					const placeholderOpt = document.createElement("option");
					placeholderOpt.value = "";
					placeholderOpt.textContent = payload.placeholder || "Pilih Opsi...";
					placeholderOpt.disabled = true;
					placeholderOpt.selected = true;
					el.appendChild(placeholderOpt);
					const options = cfg?.options || [];
					for (const option of options) {
						const optionEl = this.render("@field>select>option", {
							option,
							parentValue: payload.value
						});
						el.appendChild(optionEl);
						if (placeholderOpt.selected && optionEl.hasAttribute("selected")) placeholderOpt.selected = false;
					}
					break;
				case "@field>radio":
					el.type = payload.type;
					el.checked = payload.checked === true;
					break;
				case "@field>toggle": {
					const toggle = el;
					toggle.type = payload.type === "radio" ? "radio" : "checkbox";
					toggle.checked = payload.checked === true;
					const slider = document.createElement("div");
					slider.className = "slider";
					slider.setAttribute("data-shape", payload.config?.shape ?? "round");
					el.__outer.appendChild(slider);
					break;
				}
				case "@field>file":
					el.type = "file";
					el.setAttribute("data-uploader", "");
					el.setAttribute("data-view", `${cfg?.view || "list"}`);
					el.setAttribute("data-render-thumbnail", `${cfg?.thumbnail ?? "true"}`);
					if (cfg?.csv === true) el.setAttribute("data-uploader-csv", "");
					break;
				case "@field>select>option":
					const option = el;
					option.value = payload.option.value;
					option.textContent = payload.option.label;
					if (payload.parentValue !== void 0 && String(payload.option.value) === String(payload.parentValue)) option.setAttribute("selected", "selected");
					break;
				case "@field>info": el.textContent = payload;
			}
		}
		initialize(_el, _payload, _context) {
			if (_classPrivateFieldGet2(_input, this).config?.popover) {
				if (_classPrivateFieldGet2(_input, this).config?.popover instanceof HTMLElement) _el?.appendChild(_classPrivateFieldGet2(_input, this).config?.popover);
				else if (typeof _classPrivateFieldGet2(_input, this).config?.popover === "string") _el?.insertAdjacentHTML("beforeend", _classPrivateFieldGet2(_input, this).config?.popover);
			}
		}
		/**
		* Applies a schema to a live control.
		*
		* The registry decides what a type may carry: an attribute that means nothing for the
		* type is dropped instead of landing in the markup (`maxlength` on a `checkbox`, a
		* `min` on a `file`). `id` and `name` are structural and always set; `config.attributes`
		* is applied last, so an escape hatch still wins.
		*/
		applyAttributes(el, payload) {
			const cfg = payload.config ?? {};
			const allowed = inputTypeOf(payload.type).attributes;
			el.id = payload.id;
			el.name = payload.name ? String(payload.name) : payload.id;
			const read = (key) => payload[key] !== void 0 ? payload[key] : cfg[key];
			for (const key of ATTRIBUTE_ORDER) {
				if (!allowed.includes(key)) continue;
				const value = read(key);
				if (key === "value") {
					if (value !== void 0 && value !== null && "value" in el) el.value = String(value);
					continue;
				}
				if (key === "checked") {
					if (el instanceof HTMLInputElement) el.checked = Boolean(value);
					continue;
				}
				if (BOOLEAN_ATTRIBUTES.has(key)) {
					if (!value) continue;
					el.setAttribute(key, "");
					if (key in el) el[key] = true;
					continue;
				}
				if (value === void 0 || value === null || value === "") continue;
				el.setAttribute(key, String(value));
			}
			if (el instanceof HTMLInputElement && el.type === "number" && !el.getAttribute("step")) el.step = "any";
			if (cfg?.attributes && Array.isArray(cfg.attributes)) cfg.attributes.forEach((attr) => {
				if (attr?.name) {
					if (typeof attr.value === "function" && attr.name.startsWith("on")) el[attr.name] = attr.value;
					else el.setAttribute(attr.name, attr.value);
				}
			});
		}
		_sanitizeId(value) {
			return value.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
		}
	};
	/** Host data a module may read: the builder's own configuration. */
	function _get_moduleContext() {
		return { builderConfig: this.config };
	}
	/**
	* Whether any resolved adapter implements a hook.
	*
	* Method sniffing, never id matching: a project may ship its own uploader under another
	* id, and "can this set read files" is the question — not "is the built-in one here".
	*
	* @param hook - Adapter method that *is* the capability.
	* @returns `true` when at least one module offers it.
	*/
	function _offers(hook) {
		return _classPrivateFieldGet2(_modules, this).some((module) => typeof module[hook] === "function");
	}
	/**
	* Whether the popover module is provably absent.
	*
	* The popover is the one capability with no hook to sniff — it only *decorates*. So the
	* answer comes from the ids the preset declared: nothing declared and nothing live means
	* there is nothing to attach a popover with. A host that hands live adapters is not
	* second-guessed; the builder cannot see inside an instance.
	*/
	function _get_popoverMissing() {
		if (_classPrivateFieldGet2(_declared, this).size > 0) return !_classPrivateFieldGet2(_declared, this).has(INPUT_MODULE_IDS.popover);
		return _classPrivateFieldGet2(_modules, this).length === 0;
	}
	/**
	* Reports one degraded capability through `Missing.ts`.
	*
	* @param capability - Schema vocabulary (`dropdown`, `file`, `actions`, `popover`).
	* @param module - Module id that would have provided it.
	* @param fix - Subpath and export that fix it.
	* @param consequence - What the visitor gets instead, in one clause.
	* @param severity - `warn` (default) keeps the field, `error` throws.
	* @throws {Error} For `severity: "error"`, with the module id and the fix in the message.
	*/
	function _missing(capability, module, fix, consequence, severity = "warn") {
		reportMissing({
			capability,
			module,
			fix,
			consequence,
			severity
		}, {
			owner: "InputBuilder",
			seen: _classPrivateFieldGet2(_warned, this),
			emit: this.config.emit
		});
	}
	/** Whether this field asked for the switch shell (`config.style: "toggle"`). */
	function _isToggleStyle() {
		return String(_classPrivateFieldGet2(_input, this).config?.style ?? "").toLowerCase() === "toggle";
	}
	_defineProperty(InputBuilder, "contract", {
		schema: {
			t: "record",
			open: true,
			of: {
				type: { t: "string" },
				id: { t: "string" },
				name: { t: "string" },
				title: { t: "string" },
				label: { t: "string" },
				placeholder: { t: "string" },
				required: { t: "boolean" }
			}
		},
		example: {
			type: "text",
			id: "email",
			title: "Email address",
			placeholder: "you@example.com"
		}
	});
	// packages/components/input/index.ts
	var input_exports = /* @__PURE__ */ __exportAll({
		INPUT_MODULE_IDS: () => INPUT_MODULE_IDS,
		INPUT_MODULE_MANIFEST: () => INPUT_MODULE_MANIFEST,
		InputBuilder: () => InputBuilder,
		inputFilesOf: () => inputFilesOf,
		mountInputModules: () => mountInputModules
	});
	// packages/components/markdown/Markdown.engine.ts
	var FENCE = /^```(.*)$/;
	var HEADING = /^(#{1,6})\s+(.*)$/;
	var RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
	var QUOTE = /^\s*>\s?(.*)$/;
	var BULLET = /^(\s*)([-*+])\s+(.*)$/;
	var ORDERED = /^(\s*)(\d+)[.)]\s+(.*)$/;
	var SEPARATOR = /^\s*\|?[\s:|-]*-[\s:|-]*\|[\s:|-]*$/;
	/** `<!-- part: id=x role=y -->` — the default marker spelling. */
	var COMMENT_MARKER = /^\s*<!--\s*([A-Za-z0-9_-]+)\s*:\s*(.*?)\s*-->\s*$/;
	/** A single-line HTML comment, marker or not. */
	var COMMENT_LINE = /^\s*<!--.*-->\s*$/;
	/** The start of a comment, which may or may not close on the same line. */
	var COMMENT_OPEN = /^\s*<!--/;
	/** `[part:id=x role=y]: #` — a definition nobody references, so no renderer shows it. */
	var LINK_MARKER = /^\s*\[([A-Za-z0-9_-]+):([^\]]*)\]\s*:\s*#\s*$/;
	/** Marker options with the defaults filled in. */
	function markerConfig(config) {
		return {
			keyword: config?.keyword?.trim() || "part",
			forms: config?.forms?.length ? config.forms : ["comment"]
		};
	}
	/** `id=x role=y` → `{ id: "x", role: "y" }`. Anything without a value is ignored. */
	function markerValues(text) {
		const values = {};
		for (const token of text.split(/\s+/)) {
			const pair = /^([A-Za-z0-9_-]+)=(.*)$/.exec(token);
			const value = pair?.[2].trim();
			if (pair && value) values[pair[1]] = value;
		}
		return values;
	}
	/**
	* Read one line as a marker, a plain comment, or neither.
	*
	* A comment that is *not* a marker is still dropped: an HTML comment is invisible in every
	* Markdown renderer, so printing it would be the surprise. It is only a marker when its
	* keyword matches — the keyword is what makes the line an instruction instead of a note.
	*/
	function readMarker(line, config) {
		for (const form of config.forms) {
			const hit = form === "comment" ? COMMENT_MARKER.exec(line) : LINK_MARKER.exec(line);
			if (!hit || hit[1] !== config.keyword) continue;
			return {
				kind: "marker",
				values: markerValues(hit[2])
			};
		}
		return COMMENT_LINE.test(line) ? { kind: "comment" } : null;
	}
	/** True for a line that can start a block other than a paragraph. */
	function startsBlock(line) {
		return FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || BULLET.test(line) || ORDERED.test(line);
	}
	/** A GFM table needs a header row and a `|---|` separator under it. */
	function isTableStart(lines, index) {
		const head = lines[index];
		const separator = lines[index + 1];
		if (head === void 0 || separator === void 0) return false;
		return head.includes("|") && SEPARATOR.test(separator);
	}
	/**
	* Split one table row on pipes that are NOT inside a code span.
	*
	* `` `a | b` `` is one cell: splitting naively would cut an inline code span in half, which
	* is the exact bug the fixtures pin down.
	*/
	function splitTableRow(line) {
		const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
		const cells = [];
		let buffer = "";
		let inCode = false;
		for (const char of trimmed) {
			if (char === "`") {
				inCode = !inCode;
				buffer += char;
				continue;
			}
			if (char === "|" && !inCode) {
				cells.push(buffer.trim());
				buffer = "";
				continue;
			}
			buffer += char;
		}
		cells.push(buffer.trim());
		return cells;
	}
	/**
	* Inline parser.
	*
	* One pass, left to right, longest-marker-first so `**bold**` is not read as two `*em*`.
	* Unclosed markers are literal text — a document is not required to be well formed here.
	*/
	function parseInline(source) {
		const out = [];
		let buffer = "";
		const flush = () => {
			if (buffer) out.push({
				type: "text",
				value: buffer
			});
			buffer = "";
		};
		let index = 0;
		while (index < source.length) {
			const rest = source.slice(index);
			const code = /^`([^`]+)`/.exec(rest);
			if (code) {
				flush();
				out.push({
					type: "code",
					value: code[1]
				});
				index += code[0].length;
				continue;
			}
			const link = /^\[([^\]]*)\]\(([^)\s]+)\)/.exec(rest);
			if (link) {
				flush();
				out.push({
					type: "link",
					href: link[2],
					content: parseInline(link[1])
				});
				index += link[0].length;
				continue;
			}
			const strong = /^\*\*([^*]+)\*\*/.exec(rest);
			if (strong) {
				flush();
				out.push({
					type: "strong",
					content: parseInline(strong[1])
				});
				index += strong[0].length;
				continue;
			}
			const emphasis = /^\*([^*]+)\*/.exec(rest) ?? /^_([^_]+)_/.exec(rest);
			if (emphasis) {
				flush();
				out.push({
					type: "emphasis",
					content: parseInline(emphasis[1])
				});
				index += emphasis[0].length;
				continue;
			}
			buffer += source[index];
			index += 1;
		}
		flush();
		return out;
	}
	/**
	* Block parser.
	*
	* Line based on purpose: the documents this reads are written by hand and edited line by
	* line, so a line-oriented pass keeps every construct local and debuggable.
	*
	* Marker lines are consumed here, not by a renderer: a marker that reached the AST as text
	* would print `<!-- part: id=x -->` in the middle of a page.
	*/
	function parseMarkdown(source, options = {}) {
		const lines = source.replace(/\r\n?/g, "\n").split("\n");
		const blocks = [];
		const config = markerConfig(options.marker);
		/** A marker waits for the heading under it; blank lines in between are harmless. */
		let pending = null;
		let inComment = false;
		let index = 0;
		while (index < lines.length) {
			const line = lines[index];
			if (!line.trim()) {
				index += 1;
				continue;
			}
			const fence = FENCE.exec(line);
			if (fence) {
				const code = [];
				index += 1;
				while (index < lines.length && !FENCE.test(lines[index])) {
					code.push(lines[index]);
					index += 1;
				}
				index += 1;
				blocks.push({
					type: "fence",
					language: fence[1].trim(),
					code: code.join("\n")
				});
				continue;
			}
			if (inComment) {
				if (line.includes("-->")) inComment = false;
				index += 1;
				continue;
			}
			const marked = readMarker(line, config);
			if (marked) {
				if (marked.kind === "marker") pending = marked.values;
				index += 1;
				continue;
			}
			if (COMMENT_OPEN.test(line)) {
				inComment = !line.includes("-->");
				index += 1;
				continue;
			}
			const heading = HEADING.exec(line);
			if (heading) {
				const node = {
					type: "heading",
					level: heading[1].length,
					content: parseInline(heading[2].trim())
				};
				if (pending) {
					node.marker = pending;
					pending = null;
				}
				blocks.push(node);
				index += 1;
				continue;
			}
			if (RULE.test(line)) {
				blocks.push({ type: "rule" });
				index += 1;
				continue;
			}
			if (QUOTE.test(line)) {
				const inner = [];
				let match = QUOTE.exec(line);
				while (match) {
					inner.push(match[1]);
					index += 1;
					match = index < lines.length ? QUOTE.exec(lines[index]) : null;
				}
				blocks.push({
					type: "quote",
					blocks: parseMarkdown(inner.join("\n"), options)
				});
				continue;
			}
			if (isTableStart(lines, index)) {
				const head = splitTableRow(lines[index]).map(parseInline);
				const rows = [];
				index += 2;
				while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
					rows.push(splitTableRow(lines[index]).map(parseInline));
					index += 1;
				}
				blocks.push({
					type: "table",
					head,
					rows
				});
				continue;
			}
			const bullet = BULLET.exec(line);
			const ordered = ORDERED.exec(line);
			if (bullet || ordered) {
				const isOrdered = Boolean(ordered);
				const items = [];
				while (index < lines.length) {
					const current = lines[index];
					const nextBullet = BULLET.exec(current);
					const nextOrdered = ORDERED.exec(current);
					const match = isOrdered ? nextOrdered : nextBullet;
					if (!match) {
						if (current.trim() && items.length && !startsBlock(current) && !isTableStart(lines, index)) {
							const previous = items[items.length - 1];
							const last = previous[previous.length - 1];
							if (last && last.type === "text") last.value += ` ${current.trim()}`;
							else previous.push({
								type: "text",
								value: ` ${current.trim()}`
							});
							index += 1;
							continue;
						}
						break;
					}
					items.push(parseInline(match[3].trim()));
					index += 1;
				}
				blocks.push({
					type: "list",
					ordered: isOrdered,
					items
				});
				continue;
			}
			const paragraph = [];
			while (index < lines.length && lines[index].trim() && !startsBlock(lines[index]) && !isTableStart(lines, index) && !readMarker(lines[index], config) && !COMMENT_OPEN.test(lines[index])) {
				paragraph.push(lines[index].trim());
				index += 1;
			}
			if (paragraph.length) blocks.push({
				type: "paragraph",
				content: parseInline(paragraph.join(" "))
			});
			else index += 1;
		}
		return blocks;
	}
	/** Inline content flattened to plain text — headings are matched as text, not as runs. */
	function inlineText(nodes) {
		let text = "";
		for (const node of nodes) if (node.type === "text" || node.type === "code") text += node.value;
		else text += inlineText(node.content);
		return text;
	}
	/** Heading text → anchor: `Supported syntax` → `supported-syntax`. */
	function slugify(text) {
		return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
	}
	/** Adds a numeric suffix until the id is free, so `#id` always names one section. */
	function uniqueId(id, seen) {
		let candidate = id;
		let count = 1;
		while (seen.has(candidate)) {
			count += 1;
			candidate = `${id}-${count}`;
		}
		seen.add(candidate);
		return candidate;
	}
	/**
	* Section a parsed document.
	*
	* A section owns the blocks between its heading and the next heading of **any** level, so an
	* H2 keeps its H3s: `Config` renders complete, while `Supported syntax > Cascade` renders one
	* block. The trail is what makes both resolvable without a hand-written index.
	*/
	function outline(blocks) {
		const sections = [];
		const open = [];
		const seen = /* @__PURE__ */ new Set();
		const lead = [];
		let title = null;
		for (const block of blocks) {
			if (block.type !== "heading") {
				(open.length ? open[open.length - 1].blocks : lead).push(block);
				continue;
			}
			const text = inlineText(block.content).trim();
			if (!title && block.level === 1) {
				title = block;
				continue;
			}
			while (open.length && open[open.length - 1].level >= block.level) open.pop();
			const id = uniqueId(block.marker?.id?.trim().toLowerCase() || slugify(text) || "section", seen);
			const section = {
				level: block.level,
				heading: text,
				id,
				role: block.marker?.role ?? null,
				marker: block.marker ?? null,
				trail: [...open.map((entry) => entry.heading), text],
				headingBlock: block,
				blocks: []
			};
			sections.push(section);
			open.push(section);
		}
		return {
			title,
			lead,
			sections
		};
	}
	/**
	* Resolve one path to the blocks behind it.
	*
	*   `@title`       the H1 block
	*   `@lead`        everything before the first section opener
	*   `#anchor`      the section that declared (or slugged to) that id, and its subsections
	*   `role:name`    every section declaring that role, in document order, with its subsections
	*   `A` / `A > B`  a heading trail, compared case-insensitively on text
	*
	* An unresolvable path returns `[]` — a template never guesses, and a caller that needs the
	* section to exist asserts it in a test.
	*/
	function selectOutline(doc, path) {
		const wanted = path.trim();
		if (!wanted) return [];
		if (wanted === "@title") return doc.title ? [{
			heading: null,
			blocks: [doc.title]
		}] : [];
		if (wanted === "@lead") return doc.lead.length ? [{
			heading: null,
			blocks: doc.lead
		}] : [];
		if (wanted.startsWith("#")) {
			const id = wanted.slice(1).trim().toLowerCase();
			return subtreeOf(doc.sections, doc.sections.filter((section) => section.id === id));
		}
		if (wanted.startsWith("role:")) {
			const role = wanted.slice(5).trim().toLowerCase();
			if (!role) return [];
			return subtreeOf(doc.sections, doc.sections.filter((section) => section.role?.toLowerCase() === role));
		}
		const trail = wanted.split(">").map((entry) => entry.trim()).filter(Boolean);
		if (!trail.length) return [];
		return subtreeOf(doc.sections, doc.sections.filter((section) => sameTrail(section.trail, trail)));
	}
	/**
	* One pick per matched section **and** per section nested under it, in document order.
	*
	* A selection names a section, not the paragraph box that ends at its first H3: `#config` has
	* to render the `### Adapters` blocks under it, or a README would need one pointer per level.
	* A trail keeps its own meaning — `A > B` is a leaf when nothing is nested deeper.
	*/
	function subtreeOf(sections, matched) {
		if (!matched.length) return [];
		const picked = /* @__PURE__ */ new Set();
		for (const section of matched) {
			picked.add(section);
			const start = sections.indexOf(section);
			for (let i = start + 1; i < sections.length && sections[i].level > section.level; i++) picked.add(sections[i]);
		}
		return sections.filter((section) => picked.has(section)).map(pickOf);
	}
	/** A section as a renderer consumes it: heading separate, so it can be dropped on its own. */
	function pickOf(section) {
		return {
			heading: section.headingBlock,
			blocks: section.blocks
		};
	}
	/** Trails match on text and length: `Config` must not resolve to `Config > Notes`. */
	function sameTrail(trail, wanted) {
		if (trail.length !== wanted.length) return false;
		return trail.every((entry, index) => entry.trim().toLowerCase() === wanted[index].toLowerCase());
	}
	// packages/components/markdown/Markdown.ts
	/** Default shape per key. The root is a real `article`; headings clamp at `h4`. */
	var DEFAULT_SELECTORS$3 = {
		"@markdown": {
			tagName: "article",
			className: "markdown"
		},
		"@markdown>section": {
			tagName: "section",
			className: "markdown-section"
		},
		"@markdown>heading-1": {
			tagName: "h1",
			className: "markdown-h1"
		},
		"@markdown>heading-2": {
			tagName: "h2",
			className: "markdown-h2"
		},
		"@markdown>heading-3": {
			tagName: "h3",
			className: "markdown-h3"
		},
		"@markdown>heading-4": {
			tagName: "h4",
			className: "markdown-h4"
		},
		"@markdown>paragraph": {
			tagName: "p",
			className: "markdown-p"
		},
		"@markdown>fence": {
			tagName: "figure",
			className: "code-block frame"
		},
		"@markdown>fence>label": {
			tagName: "figcaption",
			className: "label"
		},
		"@markdown>fence>code": {
			tagName: "pre",
			className: "paper"
		},
		"@markdown>fence>code>source": {
			tagName: "code",
			className: "body"
		},
		"@markdown>unordered": {
			tagName: "ul",
			className: "markdown-list"
		},
		"@markdown>unordered>item": {
			tagName: "li",
			className: "markdown-item"
		},
		"@markdown>ordered": {
			tagName: "ol",
			className: "markdown-list"
		},
		"@markdown>ordered>item": {
			tagName: "li",
			className: "markdown-item"
		},
		"@markdown>table": {
			tagName: "table",
			className: "markdown-table"
		},
		"@markdown>table>row": {
			tagName: "tr",
			className: "markdown-row"
		},
		"@markdown>table>row>head": {
			tagName: "th",
			className: "markdown-head"
		},
		"@markdown>table>row>cell": {
			tagName: "td",
			className: "markdown-cell"
		},
		"@markdown>quote": {
			tagName: "blockquote",
			className: "markdown-quote"
		},
		"@markdown>quote>paragraph": {
			tagName: "p",
			className: "markdown-p"
		},
		"@markdown>rule": {
			tagName: "hr",
			className: "markdown-rule"
		},
		"@markdown>strong": {
			tagName: "strong",
			className: "markdown-strong"
		},
		"@markdown>emphasis": {
			tagName: "em",
			className: "markdown-em"
		},
		"@markdown>inline-code": {
			tagName: "code",
			className: "markdown-code"
		},
		"@markdown>link": {
			tagName: "a",
			className: "markdown-link"
		}
	};
	/**
	* Payload normalizer: `{ source }`, a bare string, or `{ source, outline, marker }`.
	* Anything else renders nothing, because guessing at a document shape would print the wrong
	* thing with confidence.
	*/
	function normalizePayload(data) {
		if (typeof data === "string") return {
			source: data,
			outline: null,
			marker: null
		};
		if (!data || typeof data !== "object") return {
			source: "",
			outline: null,
			marker: null
		};
		return {
			source: typeof data.source === "string" ? data.source : "",
			outline: data.outline ?? null,
			marker: data.marker ?? null
		};
	}
	var MarkdownBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — heading, paragraph, subheading, paragraph, fence, closing line:
		* the document rhythm, drawn with the mandatory `@aio-ui/skeleton` primitive. The real
		* block order is the payload's business and never read here.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [
					{
						shape: "bone",
						width: "55%",
						height: "2rem"
					},
					{
						shape: "line",
						count: 3
					},
					{
						shape: "bone",
						width: "40%",
						height: "1.5rem"
					},
					{
						shape: "line",
						count: 2
					},
					{
						shape: "bone",
						height: "8rem"
					},
					{
						shape: "line",
						width: "80%"
					}
				]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "markdown");
			_defineProperty(this, "name", "markdown");
			_defineProperty(this, "stylesheet", "./Markdown.css");
			_defineProperty(this, "config", void 0);
			const defaultConfig = {
				themeId: "default",
				namespace: null,
				emit: () => {},
				selectors: DEFAULT_SELECTORS$3,
				marker: null,
				outline: null
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		/**
		* Parse the source, then render every block — or only the parts an outline names.
		*
		* The outline is answered from the same parse: selection happens on the AST, so a part is
		* never rebuilt as Markdown text and parsed a second time.
		*/
		prepare(data) {
			const payload = normalizePayload(data);
			const marker = payload.marker ?? this.config.marker;
			const spec = payload.outline ?? this.config.outline;
			const blocks = payload.source ? parseMarkdown(payload.source, { marker }) : [];
			const root = this.render("@markdown", { count: blocks.length });
			if (!root) return this.load("@markdown");
			if (Boolean(spec?.parts?.length) && spec) this.appendParts(root, blocks, spec);
			else for (const block of blocks) this.appendBlock(root, block);
			return this.load("@markdown");
		}
		/** Render the outline's parts in declaration order, each optionally wrapped. */
		appendParts(root, blocks, spec) {
			const doc = outline(blocks);
			for (const path of spec.parts) for (const pick of selectOutline(doc, path)) {
				const target = spec.section ? this.render("@markdown>section", { path }) : root;
				if (!target) continue;
				if (spec.heading !== "drop" && pick.heading) this.appendBlock(target, pick.heading);
				for (const block of pick.blocks) this.appendBlock(target, block);
				if (target !== root) root.appendChild(target);
			}
		}
		/**
		* Hydration valve. Only the leaf payloads are written here; structure is built in
		* `prepare()` because a document nests arbitrary runs of inline content.
		*/
		template(typeKey, el, payload) {
			switch (typeKey) {
				case "@markdown>fence>code": {
					const language = String(payload?.language ?? "").trim();
					if (language) el.dataset.language = language;
					break;
				}
				case "@markdown>fence>label":
					el.textContent = String(payload?.language ?? "").trim();
					break;
				case "@markdown>fence>code>source":
					el.textContent = payload?.code ?? "";
					break;
				case "@markdown>inline-code":
					el.textContent = payload?.value ?? "";
					break;
				case "@markdown>link": {
					const href = String(payload?.href ?? "");
					el.setAttribute("href", /^(https?:|mailto:|#|\/|\.)/i.test(href) ? href : "#");
					break;
				}
			}
		}
		/**
		* Interaction wiring. A rendered document is inert by design: links are links, and the
		* caller decides whether to intercept them.
		*/
		initialize() {}
		/** One block → its key. Unknown kinds are skipped, never guessed at. */
		appendBlock(root, block) {
			if (!root) return;
			switch (block.type) {
				case "heading": {
					const level = Math.min(Math.max(block.level, 1), 4);
					const heading = this.render(`@markdown>heading-${level}`, block);
					if (!heading) return;
					this.appendInline(heading, block.content);
					root.appendChild(heading);
					return;
				}
				case "paragraph": {
					const paragraph = this.render("@markdown>paragraph", block);
					if (!paragraph) return;
					this.appendInline(paragraph, block.content);
					root.appendChild(paragraph);
					return;
				}
				case "fence": {
					const figure = this.render("@markdown>fence", block);
					if (!figure) return;
					if (block.language) {
						const label = this.render("@markdown>fence>label", block);
						if (label) figure.appendChild(label);
					}
					const code = this.render("@markdown>fence>code", block);
					if (code) {
						const source = this.render("@markdown>fence>code>source", block);
						if (source) code.appendChild(source);
						figure.appendChild(code);
					}
					root.appendChild(figure);
					return;
				}
				case "list": {
					const list = this.render(block.ordered ? "@markdown>ordered" : "@markdown>unordered", block);
					if (!list) return;
					const itemKey = block.ordered ? "@markdown>ordered>item" : "@markdown>unordered>item";
					for (const item of block.items) {
						const entry = this.render(itemKey, {});
						if (!entry) continue;
						this.appendInline(entry, item);
						list.appendChild(entry);
					}
					root.appendChild(list);
					return;
				}
				case "table": {
					const table = this.render("@markdown>table", block);
					if (!table) return;
					const head = this.render("@markdown>table>row", {});
					if (head) {
						for (const cell of block.head) {
							const column = this.render("@markdown>table>row>head", {});
							if (!column) continue;
							this.appendInline(column, cell);
							head.appendChild(column);
						}
						table.appendChild(head);
					}
					for (const row of block.rows) {
						const line = this.render("@markdown>table>row", {});
						if (!line) continue;
						for (const cell of row) {
							const column = this.render("@markdown>table>row>cell", {});
							if (!column) continue;
							this.appendInline(column, cell);
							line.appendChild(column);
						}
						table.appendChild(line);
					}
					root.appendChild(table);
					return;
				}
				case "quote": {
					const quote = this.render("@markdown>quote", block);
					if (!quote) return;
					for (const child of block.blocks) {
						if (child.type !== "paragraph") {
							this.appendBlock(quote, child);
							continue;
						}
						const paragraph = this.render("@markdown>quote>paragraph", child);
						if (!paragraph) continue;
						this.appendInline(paragraph, child.content);
						quote.appendChild(paragraph);
					}
					root.appendChild(quote);
					return;
				}
				case "rule": {
					const rule = this.render("@markdown>rule", {});
					if (rule) root.appendChild(rule);
					return;
				}
				default: return;
			}
		}
		/**
		* Inline runs. A text node is the safe primitive — `innerHTML` is never used in this
		* package, which is why source that contains markup is displayed instead of parsed.
		*/
		appendInline(parent, nodes) {
			for (const node of nodes) switch (node.type) {
				case "text":
					parent.appendChild(document.createTextNode(node.value));
					break;
				case "code": {
					const code = this.render("@markdown>inline-code", node);
					if (code) parent.appendChild(code);
					break;
				}
				case "strong": {
					const strong = this.render("@markdown>strong", node);
					if (!strong) break;
					this.appendInline(strong, node.content);
					parent.appendChild(strong);
					break;
				}
				case "emphasis": {
					const em = this.render("@markdown>emphasis", node);
					if (!em) break;
					this.appendInline(em, node.content);
					parent.appendChild(em);
					break;
				}
				case "link": {
					const link = this.render("@markdown>link", node);
					if (!link) break;
					this.appendInline(link, node.content);
					parent.appendChild(link);
					break;
				}
			}
		}
	};
	_defineProperty(MarkdownBuilder, "contract", {
		schema: {
			t: "union",
			of: [{
				t: "record",
				open: true,
				of: { source: {
					t: "string",
					req: true
				} }
			}, { t: "string" }]
		},
		example: { source: "# Title\n\nSome **text**." }
	});
	// packages/components/markdown/index.ts
	var markdown_exports = /* @__PURE__ */ __exportAll({ MarkdownBuilder: () => MarkdownBuilder });
	// packages/components/masonry/Masonry.ts
	var _items$2 = /* @__PURE__ */ new WeakMap();
	var MasonryBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — the filter row and three staggered boards, drawn with the mandatory
		* `@aio-ui/skeleton` primitive. The aspect ratios (not a payload loop) are what make the
		* grid read as masonry, and they are geometry, not data.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [{
					shape: "row",
					gap: "0.5rem",
					children: [{
						shape: "bone",
						width: "4.5rem",
						height: "1.4rem",
						count: 3
					}]
				}, {
					shape: "row",
					gap: "0.9rem",
					children: [
						{
							shape: "bone",
							width: "28%",
							aspect: "3 / 4"
						},
						{
							shape: "bone",
							width: "28%",
							aspect: "1 / 1.6"
						},
						{
							shape: "bone",
							width: "28%",
							aspect: "3 / 5"
						}
					]
				}]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "masonry");
			_defineProperty(this, "name", "masonry");
			_defineProperty(this, "stylesheet", "./Masonry.css");
			_classPrivateFieldInitSpec(this, _items$2, []);
			_defineProperty(this, "displayedCount", 0);
			_defineProperty(this, "selectedCategory", null);
			_defineProperty(this, "currentPage", 1);
			_defineProperty(this, "isServerFetching", false);
			_defineProperty(this, "modal", void 0);
			_defineProperty(this, "observer", void 0);
			_defineProperty(this, "_updateSlider", (activeBtn, isInit = false) => {
				const slider = this.load("@masonry>filter>slider");
				if (!slider || !activeBtn) return;
				if (isInit) slider.style.transition = "none";
				else slider.style.transition = "";
				const leftPosition = activeBtn.offsetLeft;
				const topPosition = activeBtn.offsetTop;
				const width = activeBtn.offsetWidth;
				const height = activeBtn.offsetHeight;
				slider.style.width = `${width}px`;
				slider.style.height = `${height}px`;
				slider.style.transform = `translate3d(${leftPosition}px, ${topPosition}px, 0)`;
				if (activeBtn.offsetWidth === 0 && isInit) {
					requestAnimationFrame(() => {
						this._updateSlider(activeBtn, true);
					});
					return;
				}
				if (isInit) {
					const settle = () => this._measureSlider(activeBtn);
					requestAnimationFrame(() => requestAnimationFrame(settle));
					window.setTimeout(settle, 350);
				}
				if (isInit) requestAnimationFrame(() => {
					setTimeout(() => {
						slider.style.transition = "";
					}, 50);
				});
			});
			_defineProperty(
				this,
				/**
				* Pengukur ulang slider dengan transisi dimatikan (untuk koreksi posisi saat init).
				* Dipisah dari _updateSlider agar panggilan berulang warnanya bersih tanpa animasi lompat.
				*/
				"_measureSlider",
				(activeBtn) => {
					const slider = this.load("@masonry>filter>slider");
					if (!slider || !activeBtn) return;
					slider.style.transition = "none";
					slider.style.width = `${activeBtn.offsetWidth}px`;
					slider.style.height = `${activeBtn.offsetHeight}px`;
					slider.style.transform = `translate3d(${activeBtn.offsetLeft}px, ${activeBtn.offsetTop}px, 0)`;
					requestAnimationFrame(() => {
						slider.style.transition = "";
					});
				}
			);
			const defaultConfig = {
				themeId: "default",
				container: null,
				column: 3,
				lazyload: true,
				maxDisplayed: 5,
				useLoadButton: true,
				category: null,
				defaultCategory: null,
				selectors: {
					"@container": {
						tagName: "section",
						className: "masonry gallery"
					},
					"@masonry": {
						tagName: "div",
						className: "grid"
					},
					"@masonry>filter": {
						tagName: "nav",
						className: "filter menu"
					},
					"@masonry>filter>item": {
						tagName: "button",
						className: "item"
					},
					"@masonry>filter>slider": {
						tagName: "span",
						className: "slider"
					},
					"@masonry>item": {
						tagName: "figure",
						className: "item is-fade-in"
					},
					"@masonry>item>image": { tagName: "img" },
					"@masonry>item>title": {
						tagName: "h3",
						className: "title"
					},
					"@masonry>item>desc": {
						tagName: "p",
						className: "desc"
					},
					"@masonry>item>actions": {
						tagName: "div",
						className: "actions"
					},
					"@masonry>modal": {
						tagName: "div",
						className: "modal hidden"
					},
					"@masonry>modal>stage": {
						tagName: "figure",
						className: "stage"
					},
					"@masonry>modal>image": {
						tagName: "img",
						className: "img"
					},
					"@masonry>modal>caption": {
						tagName: "figcaption",
						className: "caption"
					},
					"@masonry>modal>title": {
						tagName: "h3",
						className: "title"
					},
					"@masonry>modal>desc": {
						tagName: "p",
						className: "desc"
					},
					"@masonry>modal>close": {
						tagName: "i",
						className: "icon close",
						wrapper: ".close"
					},
					"@masonry>modal>next": {
						tagName: "i",
						className: "icon right arrow",
						wrapper: ".next"
					},
					"@masonry>modal>previous": {
						tagName: "i",
						className: "icon left arrow",
						wrapper: ".previous"
					},
					"@masonry>spinner": {
						tagName: "div",
						className: "spinner hidden"
					},
					"@masonry>sentinel": {
						tagName: "div",
						className: "sentinel"
					},
					"@masonry>trigger": {
						tagName: "button",
						className: "more"
					}
				},
				loadFn: null,
				onScrollEnd: null,
				onLoadTriggered: null,
				namespace: null,
				emit: null
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		/**
		* SETTER: Tempat validasi pusat untuk mengamankan data sebelum masuk ke aplikasi
		*/
		set items(newItems) {
			if (!Array.isArray(newItems)) {
				console.error("Validasi Gagal: Data masonry harus berupa array.");
				return;
			}
			_classPrivateFieldSet2(_items$2, this, newItems.map((item) => {
				if (item instanceof HTMLElement) return item;
				return Object.freeze({
					...item,
					title: item.title ? String(item.title).trim() : void 0,
					description: item.description ? String(item.description).trim() : void 0,
					category: item.category ? String(item.category).trim() : void 0,
					image: item.image || item.imageUrl ? String(item.image || item.imageUrl).trim() : void 0
				});
			}));
		}
		/**
		* GETTER KATEGORI: record yang AKTIF dan SUDAH TER-RENDER di layar.
		*
		* The whole record, not just its URL: the grid is a preview, so the lightbox has to repeat
		* the picture **and** the text the card only reveals on hover. Filtering by "is on screen"
		* is what keeps the arrows inside the current filter instead of walking hidden records.
		*/
		get currentVisibleRecords() {
			return _classPrivateFieldGet2(_items$2, this).filter((item) => {
				if (item instanceof HTMLElement) return false;
				return this.selectedCategory === null || item.category === this.selectedCategory;
			}).slice(0, this.displayedCount).filter((item) => !!(item.image || item.imageUrl));
		}
		prepare(data, _config) {
			let normalizedData = data;
			if (Array.isArray(data)) normalizedData = {
				id: this.config.container instanceof HTMLElement ? this.config.container.id : "masonry-legacy-root",
				className: "section masonry gallery",
				items: data
			};
			this.items = normalizedData.items || [];
			this.displayedCount = 0;
			this.currentPage = 1;
			const rootContainer = this.render("@container", normalizedData);
			const categoriesSet = /* @__PURE__ */ new Set();
			_classPrivateFieldGet2(_items$2, this).forEach((item) => {
				if (!(item instanceof HTMLElement) && item.category) categoriesSet.add(item.category.trim());
			});
			const categories = Array.from(categoriesSet);
			const preferred = this.config.defaultCategory;
			this.selectedCategory = preferred && categories.includes(preferred) ? preferred : null;
			if (categories.length > 0) {
				const filterMenuElement = this._renderFilterMenu(categories, this.selectedCategory);
				rootContainer?.appendChild(filterMenuElement);
			}
			const gridElement = this.render("@masonry", data);
			rootContainer?.appendChild(gridElement);
			this.modal = this._initModal();
			this._applyFilter(this.selectedCategory);
			return this.load("@container");
		}
		template(typeKey, el, payload) {
			switch (typeKey) {
				case "@container":
					if (this.config.container instanceof HTMLElement) {
						el.id = this.config.container.id || el.id;
						el.className = `${this.config.container.className} ${el.className}`.trim();
					} else if (typeof this.config.container === "string") {
						const target = document.querySelector(this.config.container);
						if (target) el.id = target.id;
					}
					break;
				case "@masonry":
					el.style.setProperty("--masonry-columns", this.config.column.toString());
					break;
				case "@masonry>filter": {
					const categories = payload?.categories || [];
					const selected = payload?.selected ?? null;
					const onSelect = payload?.onSelect;
					const allBtn = this.render("@masonry>filter>item", {
						label: "All",
						active: selected === null,
						onSelect
					});
					if (allBtn) el.appendChild(allBtn);
					categories.forEach((catName) => {
						const btn = this.render("@masonry>filter>item", {
							label: catName,
							active: selected === catName,
							onSelect
						});
						if (btn) el.appendChild(btn);
					});
					const slider = this.render("@masonry>filter>slider");
					if (slider) el.appendChild(slider);
					break;
				}
				case "@masonry>filter>item":
					el.textContent = payload?.label || "";
					el.classList.toggle("active", !!payload?.active);
					el._categoryToken = payload?.label;
					if (typeof payload?.onSelect === "function") el.onclick = () => payload.onSelect(payload.label, el);
					break;
				case "@masonry>item": {
					const content = payload?.item ?? payload;
					const modalIndex = payload?.modalIndex ?? -1;
					if (content instanceof HTMLElement) {
						el.appendChild(content);
						break;
					}
					const item = content;
					if (item.className) el.classList.add(...String(item.className).split(" "));
					if (item.id) el.id = item.id;
					if (item.image || item.imageUrl) {
						const img = this.render("@masonry>item>image", {
							...item,
							modalIndex
						});
						if (img) el.appendChild(img);
					}
					if (item.title || item.description) {
						const overlay = document.createElement("header");
						overlay.className = "caption";
						if (item.title) {
							const h2 = this.render("@masonry>item>title", item);
							if (h2) overlay.appendChild(h2);
						}
						if (item.description) {
							const p = this.render("@masonry>item>desc", item);
							if (p) overlay.appendChild(p);
						}
						el.appendChild(overlay);
					}
					if (item.actions && Array.isArray(item.actions)) {
						const actionsEl = this.render("@masonry>item>actions", item.actions);
						if (actionsEl) el.appendChild(actionsEl);
					}
					if (payload?.modalIndex !== void 0 && payload?.modalIndex !== -1) el.onclick = (event) => {
						event.stopPropagation();
						this.modal.show(payload.modalIndex);
					};
					break;
				}
				case "@masonry>item>image": {
					const img = el;
					img.src = encodeURI(payload?.image || payload?.imageUrl || "");
					img.alt = payload?.title || "Gallery image";
					if (this.config.lazyload) img.loading = "lazy";
					img.onerror = () => {
						img.src = createImageError$1();
					};
					break;
				}
				case "@masonry>item>title":
					el.textContent = payload?.title || "";
					break;
				case "@masonry>item>desc":
					el.textContent = payload?.description || "";
					break;
				case "@masonry>item>actions": {
					const actions = Array.isArray(payload) ? payload : [];
					for (const action of actions) {
						const btn = action.href ? document.createElement("a") : document.createElement("button");
						if (action.id) btn.id = action.id;
						if (btn instanceof HTMLAnchorElement && action.href) btn.href = action.href;
						btn.textContent = action.label || "Click";
						if (action.onClick) btn.addEventListener("click", (e) => action.onClick(e));
						el.appendChild(btn);
					}
					break;
				}
				case "@masonry>modal": {
					const previous = this.render("@masonry>modal>previous", payload);
					const stage = this.render("@masonry>modal>stage", payload);
					const next = this.render("@masonry>modal>next", payload);
					const close = this.render("@masonry>modal>close", payload);
					if (previous) el.appendChild(previous.__outer ?? previous);
					if (stage) el.appendChild(stage);
					if (next) el.appendChild(next.__outer ?? next);
					if (close) el.appendChild(close.__outer ?? close);
					break;
				}
				case "@masonry>modal>stage": {
					const image = this.render("@masonry>modal>image", payload);
					const caption = this.render("@masonry>modal>caption", payload);
					if (image) el.appendChild(image);
					if (caption) el.appendChild(caption);
					break;
				}
				case "@masonry>modal>caption": {
					const title = this.render("@masonry>item>title", payload);
					const desc = this.render("@masonry>item>desc", payload);
					if (title) el.appendChild(title);
					if (desc) el.appendChild(desc);
					break;
				}
				case "@masonry>modal>image": {
					const img = el;
					img.decoding = "async";
					img.src = encodeURI(String(payload?.image || ""));
					img.alt = payload?.title || "Gallery image";
					break;
				}
				case "@masonry>modal>close":
					(el.closest("button") ?? el.parentElement ?? el).setAttribute("aria-label", "Close image");
					break;
				case "@masonry>modal>next":
					(el.closest("button") ?? el.parentElement ?? el).setAttribute("aria-label", "Next image");
					break;
				case "@masonry>modal>previous":
					(el.closest("button") ?? el.parentElement ?? el).setAttribute("aria-label", "Previous image");
					break;
				case "@masonry>trigger": el.textContent = "Load More";
			}
		}
		initialize() {
			const activeBtn = this.load("@masonry>filter")?.querySelector(".item.active");
			if (activeBtn) requestAnimationFrame(() => this._updateSlider(activeBtn, true));
		}
		unmount() {
			if (this.observer) {
				this.observer.disconnect();
				this.observer = void 0;
			}
			if (this.modal && typeof this.modal.destroy === "function") this.modal.destroy();
			this.remove("@masonry>trigger", "@masonry>spinner");
			this.destroy();
		}
		_initPaginationTrigger(root) {
			if (this.config.useLoadButton) {
				const button = this.load("@masonry>trigger") || this.render("@masonry>trigger");
				button.onclick = () => this._handleNextBatchTrigger();
				root.append(button);
			} else {
				const sentinel = this.load("@masonry>sentinel") || this.render("@masonry>sentinel");
				root.insertBefore(sentinel, this.load("@masonry>spinner") || null);
				this.observer = new IntersectionObserver((entries) => {
					entries.forEach((entry) => {
						const totalInActiveCat = _classPrivateFieldGet2(_items$2, this).filter((item) => {
							if (item instanceof HTMLElement) return false;
							return this.selectedCategory === null || item.category === this.selectedCategory;
						}).length;
						if (entry.isIntersecting && this.displayedCount < totalInActiveCat) this._handleNextBatchTrigger();
					});
				}, { rootMargin: "200px" });
				this.observer.observe(sentinel);
			}
			this._handleNextBatchTrigger();
		}
		async _handleNextBatchTrigger() {
			const filteredPool = _classPrivateFieldGet2(_items$2, this).filter((item) => this.selectedCategory === null || item.category === this.selectedCategory);
			if (this.displayedCount < filteredPool.length) {
				this._loadNextBatch();
				return;
			}
			if (typeof this.config.loadFn === "function" && !this.isServerFetching) {
				this.isServerFetching = true;
				this.currentPage++;
				if (this.config.onLoadTriggered && typeof this.config.onLoadTriggered === "function") this.config.onLoadTriggered(this.currentPage);
				this.load("@masonry>spinner")?.classList.remove("hidden");
				try {
					console.log(`🚀 [GAS Data Stream] Querying page ${this.currentPage} for category: ${this.selectedCategory}`);
					const freshServerItems = await this.config.loadFn(this.currentPage, this.selectedCategory);
					if (freshServerItems && freshServerItems.length > 0) {
						const itemNodesRecord = Array.from(this.load("@masonry").querySelectorAll(".item"));
						if (itemNodesRecord.length > 24) {
							console.log(`🧹 [RAM Shield]: Flushing past batch elements to optimize physical RAM memory.`);
							for (let i = 0; i < 8; i++) itemNodesRecord.shift()?.remove();
						}
						_classPrivateFieldSet2(_items$2, this, [..._classPrivateFieldGet2(_items$2, this), ...freshServerItems]);
						this._loadNextBatch();
					} else {
						console.log(`🏁 [GAS Data Stream] Reach end of server rows database table.`);
						if (this.config.onScrollEnd && typeof this.config.onScrollEnd === "function") this.config.onScrollEnd();
						this._killPaginationControls();
					}
				} catch (streamError) {
					console.error(`[GAS Data Stream Error]:`, streamError);
				} finally {
					this.isServerFetching = false;
					this.load("@masonry>spinner")?.classList.add("hidden");
				}
			}
		}
		_loadNextBatch() {
			const filtered = _classPrivateFieldGet2(_items$2, this).filter((item) => {
				if (item instanceof HTMLElement) return false;
				return this.selectedCategory === null || item.category === this.selectedCategory;
			});
			const start = this.displayedCount;
			const end = Math.min(start + this.config.maxDisplayed, filtered.length);
			this._syncColumnCount();
			if (start >= end) return;
			const spinner = this.load("@masonry>spinner");
			spinner?.classList.remove("hidden");
			const fragment = document.createDocumentFragment();
			let imageIndexCounter = this.load("@masonry").querySelectorAll(".item").length;
			let batchIndex = 0;
			for (let i = start; i < end; i++) {
				const content = filtered[i];
				let assignedIndex = -1;
				if (!(content instanceof HTMLElement) && (content.image || content.imageUrl)) {
					assignedIndex = imageIndexCounter;
					imageIndexCounter++;
				}
				const item = this._createItem(content, assignedIndex);
				item.style.setProperty("--batch-index", batchIndex.toString());
				batchIndex++;
				fragment.appendChild(item);
			}
			this.load("@masonry").appendChild(fragment);
			this.displayedCount = end;
			if (this.displayedCount >= filtered.length && !this.config.loadFn) this._killPaginationControls();
			setTimeout(() => {
				spinner?.classList.add("hidden");
			}, 200);
			if (this.displayedCount >= filtered.length) {
				if (this.observer) this.observer.disconnect();
				this.remove("@masonry>spinner");
			}
		}
		/**
		* Pins the column count to the configuration, never to how many items a filter
		* happened to leave behind.
		*
		* A card is one column wide, so its size must not change when the visitor filters:
		* clamping the count to the item total (`min(configured, itemCount)`) made a single
		* match stretch across the whole grid, and two matches each half of it — the same
		* card, three different sizes, depending only on how many siblings it had.
		* The responsive clamps live in `Masonry.css`, which is where viewport width belongs.
		*/
		_syncColumnCount() {
			const grid = this.load("@masonry");
			if (!grid) return;
			const configuredColumns = Math.max(1, Number(this.config.column) || 1);
			grid.style.setProperty("--masonry-columns", String(configuredColumns));
		}
		_killPaginationControls() {
			if (this.observer) this.observer.disconnect();
			this.remove("@masonry>trigger", "@masonry>spinner");
		}
		_renderFilterMenu(categories, selectedCategory) {
			return this.render("@masonry>filter", {
				categories,
				selected: selectedCategory,
				onSelect: (category, activeBtn) => {
					this._handleCategoryChange(category === "All" ? null : category, activeBtn);
				}
			});
		}
		_handleCategoryChange(category, activeBtn) {
			const splitActive = "active";
			this.load("@masonry>filter")?.querySelectorAll(".item").forEach((btn) => {
				btn.classList.remove(splitActive);
			});
			activeBtn.classList.add(splitActive);
			this._updateSlider(activeBtn);
			this.selectedCategory = category;
			this._applyFilter(category);
		}
		_applyFilter(category) {
			if (this.observer) {
				this.observer.disconnect();
				this.observer = void 0;
			}
			this.remove("@masonry>item", "@masonry>item>actions", "@masonry>item>image", "@masonry>item>title", "@masonry>item>desc", "@masonry>spinner", "@masonry>trigger");
			this.load("@masonry").replaceChildren();
			this.displayedCount = 0;
			this.currentPage = 1;
			this.selectedCategory = category;
			this._syncColumnCount();
			const container = this.load("@container");
			this._createSpinner(container);
			this._initPaginationTrigger(container);
		}
		_createSpinner(root) {
			const spinner = this.load("@masonry>spinner") || this.render("@masonry>spinner");
			root.appendChild(spinner);
		}
		_createItem(content, modalIndex) {
			const card = this.render("@masonry>item", {
				item: content,
				modalIndex
			});
			card?.addEventListener("animationend", () => {
				card.classList.remove("is-fade-in");
			}, { once: true });
			return card;
		}
		/**
		* The lightbox: one record at a time, re-rendered per open.
		*
		* The markup is `template()`'s, so opening a card is a `render("@masonry>modal", payload)`
		* with the record reduced to what the modal shows. Nothing here writes text or touches an
		* `img` — that is why this method is only about payload, wiring and teardown.
		*/
		_initModal() {
			let currentIndex = 0;
			let isModalOpen = false;
			let modalEl = null;
			const container = this.load("@container");
			/** What the modal shows of a record: the grid is a preview, so the text comes along. */
			const payloadOf = (record) => ({
				image: record.image || record.imageUrl || "",
				title: record.title,
				description: record.description
			});
			const hide = () => {
				if (!modalEl) return;
				modalEl.classList.add("hidden");
				isModalOpen = false;
			};
			const handleKeyDown = (event) => {
				if (!isModalOpen) return;
				if (event.key === "ArrowRight") {
					event.preventDefault();
					show(currentIndex + 1);
				}
				if (event.key === "ArrowLeft") {
					event.preventDefault();
					show(currentIndex - 1);
				}
				if (event.key === "Escape") {
					event.preventDefault();
					hide();
				}
			};
			/** A click on the backdrop (i.e. outside the stage) closes the lightbox. */
			const handleBackdropClick = (event) => {
				if (event.target === modalEl) hide();
			};
			/**
			* Wires one freshly rendered lightbox. The arrow handlers read `currentIndex` live, so
			* a re-render can never leave them pointing at a record that is no longer shown — which
			* is why nothing outside has to refresh them.
			*/
			const wire = (element) => {
				element.setAttribute("tabindex", "-1");
				element.addEventListener("keydown", handleKeyDown);
				element.addEventListener("click", handleBackdropClick);
				const close = element.querySelector(".close");
				const next = element.querySelector(".next");
				const previous = element.querySelector(".previous");
				if (close) close.onclick = hide;
				if (next) next.onclick = () => show(currentIndex + 1);
				if (previous) previous.onclick = () => show(currentIndex - 1);
			};
			const show = (index) => {
				const records = this.currentVisibleRecords;
				if (!records.length) return;
				currentIndex = (index + records.length) % records.length;
				if (modalEl) this.remove("@masonry>modal");
				modalEl = this.render("@masonry>modal", payloadOf(records[currentIndex]));
				wire(modalEl);
				container.appendChild(modalEl);
				modalEl.classList.remove("hidden");
				isModalOpen = true;
				setTimeout(() => modalEl?.focus(), 50);
			};
			const destroy = () => {
				modalEl?.removeEventListener("keydown", handleKeyDown);
				modalEl?.removeEventListener("click", handleBackdropClick);
				modalEl?.remove();
				modalEl = null;
				isModalOpen = false;
			};
			return {
				show,
				destroy
			};
		}
	};
	_defineProperty(MasonryBuilder, "contract", {
		schema: {
			t: "union",
			of: [{
				t: "record",
				open: true,
				of: { items: {
					t: "list",
					req: true,
					of: {
						t: "union",
						of: [{ t: "element" }, {
							t: "record",
							open: true
						}]
					}
				} }
			}, {
				t: "list",
				of: {
					t: "union",
					of: [{ t: "element" }, {
						t: "record",
						open: true
					}]
				}
			}]
		},
		example: { items: [{
			image: "a.png",
			category: "Branding",
			title: "Project A"
		}] }
	});
	// packages/components/masonry/index.ts
	var masonry_exports = /* @__PURE__ */ __exportAll({ MasonryBuilder: () => MasonryBuilder });
	// packages/components/menu/Menu.kit.ts
	var DEFAULT_MENU_SELECTORS = {
		"@container": {
			tagName: "aside",
			className: "sidebar"
		},
		"@menu": {
			tagName: "nav",
			className: "nav"
		},
		"@menu>brand": {
			tagName: "div",
			className: "brand",
			attrs: { src: "" }
		},
		"@menu>hamburger": {
			tagName: "button",
			className: "hamburger-btn",
			attrs: { "aria-label": "Toggle menu" }
		},
		"@menu>navigations": {
			tagName: "ul",
			className: "menus navigations"
		},
		"@menu>navigations>item": {
			tagName: "li",
			className: "item"
		},
		"@menu>actions": {
			tagName: "div",
			className: "actions"
		},
		"@menu>menus": {
			tagName: "ul",
			className: "menus"
		},
		"@menu>menus>item": {
			tagName: "li",
			className: "item"
		},
		"@menu>item>link": { tagName: "a" },
		"@menu>item>icon": {
			tagName: "i",
			className: "icon"
		}
	};
	// packages/components/menu/Menu.engine.ts
	/**
	* Split one flat navigation list into three sections.
	*
	* The source data is linear (a header row plus links plus a CTA), so the split is a
	* convention rather than a structure:
	*
	* - the **first** entry is the brand,
	* - an entry whose `className` is `button`, or whose `href` is a `tel:` link, is an action,
	* - everything else is a navigation link.
	*
	* Exported and pure so the rule is testable without a DOM.
	*/
	function splitMenuContent(content) {
		const navigations = Array.isArray(content?.navigations) ? content.navigations : content?.navigations ? [content.navigations] : [];
		const brand = content?.brand ? content.brand : navigations[0] ?? {
			label: "Brand",
			href: "#home"
		};
		const rest = content?.brand ? navigations : navigations.slice(1);
		const isAction = (link) => link?.className === "button" || Boolean(link?.href?.includes("tel:"));
		const actions = Array.isArray(content?.actions) ? [...content.actions] : content?.actions ? [content.actions] : [];
		const cta = rest.find(isAction);
		if (cta && !actions.includes(cta)) actions.push(cta);
		return {
			brand,
			navigations: rest.filter((link) => !isAction(link)),
			actions
		};
	}
	// packages/components/menu/Menu.ts
	var MenuBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — brand, four navigation labels and the action button, drawn with the
		* mandatory `@aio-ui/skeleton` primitive. One row serves both the horizontal bar and the
		* sidebar: the sheet that is still missing is the one that decides the direction.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "row",
				gap: "1rem",
				children: [
					{
						shape: "bone",
						width: "5rem",
						height: "1.75rem"
					},
					{
						shape: "line",
						width: "3rem",
						count: 4
					},
					{
						shape: "bone",
						width: "2.5rem",
						height: "1.75rem"
					}
				]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "menu");
			_defineProperty(this, "name", "menu");
			_defineProperty(this, "stylesheet", "./Menu.css");
			_defineProperty(this, "isMenuOpened", false);
			_defineProperty(this, "hamburger", null);
			_defineProperty(this, "navigations", null);
			_defineProperty(this, "handleEscape", (event) => {
				if (event.key === "Escape") this.closeSubmenus();
			});
			_defineProperty(this, "handleToggle", () => {
				this.isMenuOpened = !this.isMenuOpened;
				let isDefaultPrevented = false;
				this.config.emit?.("builder:menu-toggle", {
					opened: this.isMenuOpened,
					element: this.hamburger,
					preventDefault: () => {
						isDefaultPrevented = true;
					}
				});
				if (isDefaultPrevented) {
					this.isMenuOpened = !this.isMenuOpened;
					return;
				}
				this.setOpen(this.isMenuOpened);
			});
			const defaultSelectors = DEFAULT_MENU_SELECTORS;
			const defaultConfig = {
				themeId: "default",
				defaultRoute: "home",
				routes: [
					"home",
					"package",
					"gallery",
					"dashboard",
					"wizard"
				],
				emit: () => {},
				onNavigate(href) {
					return href ? true : false;
				},
				namespace: null,
				position: "top",
				multilevel: null,
				...config,
				selectors: {
					...defaultSelectors,
					...config?.selectors || {}
				}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		prepare(content, _config) {
			const payload = this.resolvePayload(content);
			const nav = this.render("@menu", payload["@menu"]);
			const brand = this.render("@menu>brand", payload["@menu>brand"]);
			const hamburger = this.render("@menu>hamburger", payload["@menu>hamburger"]);
			const navigations = this.render("@menu>navigations", payload["@menu>navigations"]);
			const actions = this.render("@menu>actions", payload["@menu>actions"]);
			if (brand) nav.appendChild(brand);
			if (hamburger) nav.appendChild(hamburger);
			if (navigations) {
				navigations.id = "primary-navigations";
				nav.appendChild(navigations);
				hamburger?.setAttribute("aria-controls", navigations.id);
			}
			if (actions) nav.appendChild(actions);
			if (this.config.position === "left" || this.config.position === "right") {
				const sidebar = this.render("@container", content);
				sidebar.appendChild(nav);
				return sidebar;
			}
			return nav;
		}
		/**
		* Maps one flat navigation list onto the keys `template()` expects. The splitting rule
		* itself lives in `splitMenuContent()` so it can be tested on its own.
		*/
		resolvePayload(content) {
			const { brand, navigations, actions } = splitMenuContent(content);
			return {
				"@menu": content,
				"@menu>brand": brand,
				"@menu>hamburger": {},
				"@menu>navigations": navigations,
				"@menu>navigations>item": null,
				"@menu>menus": null,
				"@menu>menus>item": null,
				"@menu>actions": actions
			};
		}
		initialize(root) {
			const nav = root ?? this.load("@menu");
			if (!nav) return;
			const hamburger = nav.querySelector(".hamburger-btn");
			const navigations = nav.querySelector(".navigations");
			if (!hamburger || !navigations) return;
			this.hamburger = hamburger;
			this.navigations = navigations;
			hamburger.removeEventListener("click", this.handleToggle);
			hamburger.addEventListener("click", this.handleToggle);
			nav.removeEventListener("keydown", this.handleEscape);
			nav.addEventListener("keydown", this.handleEscape);
			this.setOpen(this.isMenuOpened);
		}
		setOpen(open) {
			this.navigations?.classList.toggle("open", open);
			this.hamburger?.classList.toggle("active", open);
			this.hamburger?.setAttribute("aria-expanded", open ? "true" : "false");
		}
		template(typeKey, el, payload, props) {
			switch (typeKey) {
				case "@container":
					if (payload.id) el.id = payload.id;
					break;
				case "@menu":
					el.dataset.position = this.config.position;
					if (this.config.multilevel && typeof this.config.multilevel.activation === "string") el.dataset.multilevel = this.config.multilevel.activation;
					break;
				case "@menu>brand":
					const brandLink = this.render("@menu>item>link", payload);
					if (brandLink) el.appendChild(brandLink);
					break;
				case "@menu>navigations":
					this.paintList(el, payload, "@menu>navigations>item");
					break;
				case "@menu>menus":
					this.paintList(el, payload, "@menu>menus>item");
					break;
				case "@menu>navigations>item":
				case "@menu>menus>item":
					this.paintItem(el, payload);
					break;
				case "@menu>item>link":
					if (payload?.className) for (const token of String(payload.className).split(/\s+/).filter(Boolean)) el.classList.add(token);
					if (payload?.src) {
						const img = document.createElement("img");
						img.src = payload.src;
						img.alt = payload.label || "logo";
						img.className = "brand-image";
						el.appendChild(img);
					} else if (payload?.label) el.textContent = payload.label;
					if (payload?.icon) {
						const icon = this.render("@menu>item>icon", payload.icon);
						el.appendChild(icon);
					}
					if (payload?.attrs) for (const key in payload.attrs) {
						if (!Object.hasOwn(payload.attrs, key)) continue;
						const value = payload.attrs[key];
						el.setAttribute(key, value);
					}
					if (payload?.onClick && typeof payload.onClick === "function") el.addEventListener("click", payload.onClick);
					else this.bindNavigation(el, payload?.href);
					break;
				case "@menu>item>icon":
					el.className = payload;
					break;
				case "@menu>actions": {
					const actions = Array.isArray(payload) ? payload : [];
					for (const action of actions) {
						const link = this.render("@menu>item>link", action);
						if (link) {
							link.classList.add("item");
							el.appendChild(link);
						}
					}
					break;
				}
				case "@menu>hamburger":
					if (props.tagName?.toLowerCase() === "button") el.type = "button";
					el.setAttribute("aria-expanded", "false");
					if (!el.firstChild) {
						const svgNs = "http://www.w3.org/2000/svg";
						const svg = document.createElementNS(svgNs, "svg");
						svg.setAttribute("width", "24");
						svg.setAttribute("height", "24");
						svg.setAttribute("viewBox", "0 0 24 24");
						svg.setAttribute("fill", "none");
						svg.setAttribute("stroke", "currentColor");
						svg.setAttribute("stroke-width", "2");
						svg.setAttribute("aria-hidden", "true");
						const path = document.createElementNS(svgNs, "path");
						path.setAttribute("d", "M3 12h18M3 6h18M3 18h18");
						svg.appendChild(path);
						el.appendChild(svg);
					}
			}
		}
		/**
		* The children of one entry, or `null` when it is a leaf.
		*
		* The holding property is the host's choice (`config.multilevel.property`), so the data
		* keeps whatever shape it already had — `children`, `menus`, `submenu`. There is no depth
		* limit because nothing here recurses by hand: `paintList()` renders `@menu>menus`, and
		* each of those items comes straight back through this method.
		*/
		childrenOf(entry) {
			const property = this.config.multilevel?.property ?? "children";
			const raw = entry?.[property];
			if (!raw) return null;
			const children = Array.isArray(raw) ? raw : [raw];
			return children.length ? children : null;
		}
		paintList(list, payload, itemKey) {
			const entries = Array.isArray(payload) ? payload : payload ? [payload] : [];
			for (const entry of entries) {
				const item = this.render(itemKey, entry);
				if (item) list.appendChild(item);
			}
		}
		/**
		* One `li`. A leaf is a link; a branch is a link plus the same `.menus` list one level
		* down, marked `.submenu` so the sheet knows it is a disclosure.
		*
		* A branch never navigates — its click belongs to the disclosure. A group that is also a
		* page is expressed by making that page its first child, otherwise one click would have
		* to mean two things and the pointer would get whichever handler happened to run first.
		*/
		paintItem(item, payload) {
			const children = this.childrenOf(payload);
			const activation = this.config.multilevel?.activation ?? "hover";
			if (!children) {
				const leaf = this.render("@menu>item>link", payload);
				if (leaf) item.appendChild(leaf);
				return;
			}
			item.classList.add("submenu");
			item.classList.toggle("open", activation === "always");
			item.classList.toggle("closed", activation !== "always");
			if (children.some((child) => /\bis-active\b/.test(String(child?.className ?? "")))) item.classList.add("is-active");
			const isOpen = item.classList.contains("open");
			const link = this.render("@menu>item>link", {
				...payload,
				icon: payload?.icon ?? "icon arrow right",
				onClick: (event) => {
					event.preventDefault();
					if (activation === "click") this.toggleSubmenu(item);
					payload?.onClick?.(event);
				}
			});
			if (!link) return;
			link.setAttribute("aria-haspopup", "true");
			link.setAttribute("aria-expanded", String(isOpen));
			link.setAttribute("tabindex", "0");
			link.setAttribute("role", "button");
			link.addEventListener("keydown", (event) => {
				if (event.key !== "Enter" && event.key !== " ") return;
				event.preventDefault();
				link.click();
			});
			item.appendChild(link);
			const nested = this.render("@menu>menus", children);
			if (nested) item.appendChild(nested);
		}
		toggleSubmenu(item) {
			const open = item.classList.toggle("open");
			item.classList.toggle("closed", !open);
			item.querySelector(":scope > a")?.setAttribute("aria-expanded", String(open));
		}
		/** Escape closes what a click opened. A hover branch closes by leaving it. */
		closeSubmenus() {
			if (this.config.multilevel?.activation === "always") return;
			const nav = this.load("@menu");
			for (const item of nav?.querySelectorAll(".item.submenu.open") ?? []) {
				item.classList.remove("open");
				item.classList.add("closed");
				item.querySelector(":scope > a")?.setAttribute("aria-expanded", "false");
			}
		}
		navigate(href) {
			if (href) window.location.hash = href.replace(/^#/, "");
		}
		bindNavigation(element, href) {
			let rawTargetHref = (href || element.getAttribute("href") || this.config.defaultRoute || "home").trim();
			if (rawTargetHref.includes(window.location.origin) || rawTargetHref.includes(window.location.host)) {
				if (rawTargetHref.includes("#")) rawTargetHref = rawTargetHref.split("#").filter(Boolean).filter((part) => !part.includes("://") && !part.includes("localhost") && !part.includes(".com")).join("#").trim();
			}
			element.href = rawTargetHref.startsWith("#") ? rawTargetHref : `#${rawTargetHref}`;
			element.addEventListener("click", (e) => {
				e.preventDefault();
				if (!rawTargetHref.includes("://") && !rawTargetHref.startsWith("//") && !rawTargetHref.startsWith("www.")) {
					let cleanRoute = String(rawTargetHref).replace(/^#/, "").trim();
					if (cleanRoute.includes(":")) cleanRoute = String(cleanRoute.split(":")[0]).trim();
					if (cleanRoute.includes("?")) cleanRoute = String(cleanRoute.split("?")[0]).trim();
					const finalRouteString = cleanRoute || "home";
					if (this.config.onNavigate(finalRouteString) === true) return;
					this.navigate(finalRouteString);
				} else window.open(rawTargetHref, "_blank");
			});
		}
	};
	_defineProperty(MenuBuilder, "contract", {
		schema: {
			t: "record",
			open: true,
			of: {
				brand: { t: "any" },
				actions: {
					t: "list",
					of: { t: "any" }
				},
				navigations: {
					t: "list",
					single: true,
					of: {
						t: "record",
						open: true,
						of: {
							label: { t: "string" },
							href: { t: "string" },
							className: { t: "string" }
						}
					}
				}
			}
		},
		example: { navigations: [{
			label: "Home",
			href: "#home"
		}, {
			label: "Contact",
			href: "tel:+620000",
			className: "button"
		}] }
	});
	// packages/components/menu/index.ts
	var menu_exports = /* @__PURE__ */ __exportAll({ MenuBuilder: () => MenuBuilder });
	// packages/components/message/Message.ts
	var MessageBuilder = class extends Builder$1 {
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "message");
			_defineProperty(this, "name", "message");
			_defineProperty(this, "stylesheet", "./Message.css");
			_defineProperty(this, "config", void 0);
			_defineProperty(this, "_activeTimers", /* @__PURE__ */ new Map());
			const defaultConfig = {
				themeId: "default",
				id: "global-status-message",
				element: document.body,
				duration: 3e3,
				selectors: {
					"@message": {
						tagName: "div",
						className: "toast"
					},
					"@message>close": {
						tagName: "i",
						className: "close circle icon",
						wrapper: "button.close"
					},
					"@message>content": {
						tagName: "div",
						className: "content"
					},
					"@message>content>header": {
						tagName: "h2",
						className: "header"
					},
					"@message>content>desc": {
						tagName: "p",
						className: "message"
					},
					"@message>content>icon": { tagName: "i" }
				},
				persist: false,
				namespace: null,
				emit: () => {},
				onOpen: () => {},
				onClose: () => {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		prepare(content, _config = {}) {
			if (_config) this.config = this.resolveConfig(this.config, _config);
			const messageContent = {
				header: "Congrats!",
				icon: "bell icon",
				type: "info",
				message: "",
				...content
			};
			if (document.getElementById(this.config.id)) this.unmount(this.config.id, this.config.onClose);
			const messageElement = this.render("@message", messageContent);
			let containerElement = null;
			if (typeof this.config.element === "string") containerElement = document.getElementById(this.config.element);
			else containerElement = this.config.element;
			if (!containerElement) containerElement = document.body;
			containerElement.prepend(messageElement);
			this.config.onOpen(messageElement);
			this._startTimeoutCounter(this.config.id, this.config.duration, messageElement, this.config.onClose);
			return this.load("@message");
		}
		template(typeKey, el, payload) {
			if (!payload) return;
			switch (typeKey) {
				case "@message":
					el.id = this.config.id;
					el.className = `visible ${payload.type || "info"} ${payload.icon ? "icon" : ""} ${el.className || ""}`.trim();
					el.style.boxShadow = "0 1px 2px 0 rgba(34, 36, 38, .15)";
					const closeIcon = this.render("@message>close").__outer;
					const msgContainer = this.render("@message>content");
					const icon = this.render("@message>content>icon", payload.icon);
					const header = this.render("@message>content>header", payload.header);
					const message = this.render("@message>content>desc", payload.message);
					if (header && payload.header) msgContainer?.appendChild(header);
					if (message) msgContainer?.appendChild(message);
					if (closeIcon && !this.config.persist) el.appendChild(closeIcon);
					if (icon && payload.icon) el.appendChild(icon);
					if (msgContainer) el.appendChild(msgContainer);
					break;
				case "@message>close":
					el.style.cursor = "pointer";
					break;
				case "@message>content>icon":
					if (payload) el.className = payload || "notification icon";
					break;
				case "@message>content>header":
					el.textContent = payload || "";
					break;
				case "@message>content>desc": el.textContent = payload || "";
			}
		}
		initialize() {
			const closeIcon = this.load("@message>close");
			if (closeIcon) closeIcon.addEventListener("click", () => {
				this.unmount(this.config.id, this.config.onClose);
			});
		}
		unmount(id, onCloseCallback) {
			const activeTimer = this._activeTimers.get(id);
			if (activeTimer) {
				window.clearTimeout(activeTimer);
				this._activeTimers.delete(id);
			}
			const targetElement = this.load("@message") ?? document.getElementById(id);
			if (targetElement) {
				if (typeof onCloseCallback === "function") onCloseCallback(targetElement);
				targetElement.remove();
				console.log(`[Message Engine] Instance #${id} wiped out from DOM and memory stacks successfully.`);
			}
		}
		_startTimeoutCounter(id, duration, el, onCloseCallback) {
			if (el) {
				const activeTimer = this._activeTimers.get(id);
				if (activeTimer) {
					window.clearTimeout(activeTimer);
					this._activeTimers.delete(id);
				}
				if (duration && duration > 0 && !this.config.persist) {
					const newTimer = window.setTimeout(() => {
						this.unmount(id, onCloseCallback);
					}, duration);
					this._activeTimers.set(id, newTimer);
				}
			}
		}
	};
	_defineProperty(MessageBuilder, "contract", {
		schema: {
			t: "record",
			open: true,
			of: {
				message: {
					t: "string",
					req: true
				},
				header: { t: "string" },
				type: {
					t: "enum",
					of: [
						"success",
						"error",
						"info",
						"warning"
					]
				},
				icon: { t: "string" }
			}
		},
		example: {
			header: "Saved",
			message: "Your changes are stored.",
			type: "success"
		}
	});
	// packages/components/message/index.ts
	var message_exports = /* @__PURE__ */ __exportAll({ MessageBuilder: () => MessageBuilder });
	// packages/components/modal/Modal.ts
	var _destroyed = /* @__PURE__ */ new WeakMap();
	var _ModalBuilder_brand = /* @__PURE__ */ new WeakSet();
	var ModalBuilder = class extends Builder$1 {
		constructor(config = {}) {
			super();
			_classPrivateMethodInitSpec(this, _ModalBuilder_brand);
			_defineProperty(this, "builderId", "modal");
			_defineProperty(this, "name", "modal");
			_defineProperty(this, "stylesheet", "./Modal.css");
			_defineProperty(this, "currentModal", null);
			_classPrivateFieldInitSpec(this, _destroyed, false);
			_defineProperty(
				this,
				/** Kept so teardown removes exactly the listener that was added. */
				"closeBtn",
				null
			);
			_defineProperty(this, "handleCloseClick", () => this.close());
			_defineProperty(this, "handleBackdropClick", (event) => {
				if (event.target === this.currentModal) this.close();
			});
			const defaultConfig = {
				themeId: "default",
				id: "modal-default",
				className: "",
				title: "Notification",
				modalClass: "",
				destroyOnClose: true,
				selectors: {
					"@container": {
						tagName: "div",
						className: "dialog hidden"
					},
					"@modal": {
						tagName: "div",
						className: "modal"
					},
					"@modal>header": {
						tagName: "div",
						className: "header"
					},
					"@modal>closeBtn": {
						tagName: "",
						className: "close"
					}
				},
				namespace: null,
				emit: () => {},
				onClose: () => {},
				onOpen: () => {},
				onReady: () => {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		/**
		* Builds the overlay and returns it.
		*
		* Three things changed from the version that misbehaved:
		*
		* 1. it **returns the element** instead of control handles, so the registry can mount
		*    it (`build()` requires an element); the handles now arrive through `onReady`;
		* 2. it no longer appends itself to `document.body` — whoever renders it decides
		*    where it lives, which is what made overlays stack up before;
		* 3. a leftover node with the same id is **removed first**, so the id always has
		*    exactly one owner instead of silently reusing a stale element.
		*/
		prepare(contentPayload) {
			document.getElementById(this.config.id)?.remove();
			_classPrivateFieldSet2(_destroyed, this, false);
			const overlay = this.render("@container", contentPayload);
			const modalBox = this.render("@modal", contentPayload);
			const header = this.render("@modal>header", contentPayload);
			const closeBtn = this.render("@modal>closeBtn", contentPayload);
			const bodyContent = this._compileContent(contentPayload);
			bodyContent.classList.add("body");
			if (header && closeBtn) header.appendChild(closeBtn);
			if (modalBox && header) modalBox.appendChild(header);
			if (modalBox && bodyContent) modalBox.appendChild(bodyContent);
			if (overlay && modalBox) overlay.appendChild(modalBox);
			this.currentModal = overlay;
			this.closeBtn = closeBtn ?? null;
			this.bind();
			this.config.onReady?.(this._getControlInterfaces());
			return overlay;
		}
		/** Attaches the two ways out, using references that teardown can remove. */
		bind() {
			this.closeBtn?.addEventListener("click", this.handleCloseClick);
			this.currentModal?.addEventListener("click", this.handleBackdropClick);
		}
		/** Removes exactly the listeners `bind()` added. */
		unbind() {
			this.closeBtn?.removeEventListener("click", this.handleCloseClick);
			this.currentModal?.removeEventListener("click", this.handleBackdropClick);
		}
		template(typeKey, el, _payload) {
			switch (typeKey) {
				case "@container":
					el.id = this.config.id;
					if (this.config.className) el.classList.add(`${this.config.className}`.trim(), "hidden");
					break;
				case "@modal":
					if (this.config.modalClass) el.classList.add("modal", ` ${this.config.modalClass}.trim()`);
					break;
				case "@modal>header": {
					const title = document.createElement("h2");
					title.className = "title";
					title.textContent = this.config.title || "Formulir Pesanan";
					el.appendChild(title);
					break;
				}
				case "@modal>closeBtn": {
					const btn = el;
					btn.type = "button";
					btn.innerHTML = "&times;";
					break;
				}
			}
		}
		/**
		* Kept for compatibility: listeners are bound in `prepare()`, so nothing happens here.
		* Binding lazily is what made a reused element arrive without working listeners.
		*/
		initialize(_el, _payload, _context) {}
		/** Whether this instance has been torn down. A destroyed modal cannot be reopened. */
		get isDestroyed() {
			return _classPrivateFieldGet2(_destroyed, this);
		}
		open() {
			const overlay = this.currentModal;
			if (_classPrivateFieldGet2(_destroyed, this) || !overlay) {
				console.warn(`[Modal] open() ignored: ${_assertClassBrand(_ModalBuilder_brand, this, _label).call(this)} was destroyed. Rebuild it, or use destroyOnClose: false.`);
				return;
			}
			overlay.classList.remove("hidden");
			document.body.style.overflow = "hidden";
			this.config.onOpen?.(overlay);
		}
		close() {
			const overlay = this.currentModal;
			if (_classPrivateFieldGet2(_destroyed, this) || !overlay) return;
			overlay.classList.add("hidden");
			document.body.style.overflow = "";
			this.config.onClose?.(overlay);
			if (this.config.destroyOnClose) this.destroy();
		}
		_compileContent(content) {
			if (content instanceof HTMLElement) return content;
			if (typeof content === "string") {
				const wrapper = document.createElement("div");
				wrapper.innerHTML = content;
				return wrapper.firstElementChild instanceof HTMLElement ? wrapper.firstElementChild : wrapper;
			}
			if (typeof content === "function") {
				const renderedNode = content();
				if (renderedNode instanceof HTMLElement) return renderedNode;
			}
			const fallbackDiv = document.createElement("div");
			fallbackDiv.textContent = typeof content === "object" ? JSON.stringify(content) : String(content);
			return fallbackDiv;
		}
		_getControlInterfaces() {
			return {
				element: this.currentModal,
				open: () => this.open(),
				close: () => this.close(),
				unmount: () => this.destroy()
			};
		}
		/**
		* Releases everything this builder owns. Idempotent on purpose: it is called by
		* `close()` (when `destroyOnClose`), by a controller, and by route teardown.
		*/
		destroy() {
			this.unbind();
			document.body.style.overflow = "";
			this.currentModal?.remove();
			this.currentModal = null;
			this.closeBtn = null;
			_classPrivateFieldSet2(_destroyed, this, true);
			super.destroy();
		}
		/** Alias kept so existing callers keep working. */
		unmount() {
			this.destroy();
		}
	};
	/** Id kept outside `config`, which is cleared by `Base.destroy()`. */
	function _label() {
		return `#${this.config?.id ?? "modal"}`;
	}
	_defineProperty(ModalBuilder, "contract", {
		schema: {
			t: "union",
			of: [
				{ t: "element" },
				{ t: "string" },
				{
					t: "record",
					open: true
				}
			]
		},
		example: "<p>Hello from the modal body.</p>"
	});
	// packages/components/modal/index.ts
	var modal_exports = /* @__PURE__ */ __exportAll({ ModalBuilder: () => ModalBuilder });
	// packages/components/mode-switcher/ModeSwitcher.ts
	var ModeSwitcherBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — the track and the label next to it, drawn with the mandatory
		* `@aio-ui/skeleton` primitive. Two short bones, because the whole widget is short.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "row",
				gap: "0.5rem",
				children: [{
					shape: "bone",
					width: "2.5rem",
					height: "1.5rem"
				}, {
					shape: "line",
					width: "3rem"
				}]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "mode-switcher");
			_defineProperty(this, "name", "mode-switcher");
			_defineProperty(this, "stylesheet", "./ModeSwitcher.css");
			_defineProperty(this, "mode", "light");
			_defineProperty(this, "config", void 0);
			this.mode = this.getMode();
			const defaultConfig = {
				themeId: "default",
				selectors: {
					"@mode-switcher": {
						tagName: "div",
						className: "mode-switcher"
					},
					"@mode-switcher>toggle": {
						tagName: "toggle",
						className: "toggle",
						attrs: {
							"data-theme-toggle": "",
							"aria-label": "Toggle theme"
						}
					},
					"@mode-switcher>track": {
						tagName: "span",
						className: "track"
					},
					"@mode-switcher>thumb": {
						tagName: "span",
						className: "thumb"
					},
					"@mode-switcher>label": {
						tagName: "span",
						className: "label"
					}
				},
				namespace: null,
				emit: () => {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		prepare() {
			return this.render("@mode-switcher");
		}
		template(typeKey, el, _payload) {
			switch (typeKey) {
				case "@mode-switcher":
					const toggle = this.render("@mode-switcher>toggle");
					const thumb = this.render("@mode-switcher>thumb");
					const track = this.render("@mode-switcher>track");
					if (thumb && track) track.appendChild(thumb);
					const label = this.render("@mode-switcher>label");
					if (toggle) {
						if (track) toggle.appendChild(track);
						if (label) toggle.appendChild(label);
					}
					if (toggle) el.appendChild(toggle);
					break;
				case "@mode-switcher>toggle":
					el.type = "button";
					el?.classList.toggle("is-dark", this.mode === "dark");
					break;
				case "@mode-switcher>thumb": break;
				case "@mode-switcher>track": break;
				case "@mode-switcher>label": el.textContent = this.mode === "dark" ? "Light" : "Dark";
			}
		}
		initialize() {
			const toggleBtn = this.load("@mode-switcher>toggle");
			const label = this.load("@mode-switcher>label");
			if (toggleBtn && label) toggleBtn.addEventListener("click", (e) => {
				e.preventDefault();
				this.mode = this.mode === "dark" ? "light" : "dark";
				document.documentElement.dataset.mode = this.mode;
				toggleBtn?.classList.toggle("is-dark", this.mode === "dark");
				label.textContent = this.mode === "dark" ? "Light" : "Dark";
				this.config.emit?.("modeChanged", {
					mode: this.mode,
					element: toggleBtn
				});
			});
		}
		normalizeMode(mode) {
			return mode?.toLowerCase() === "dark" ? "dark" : "light";
		}
		getMode() {
			return this.normalizeMode(document.documentElement.dataset.mode);
		}
	};
	_defineProperty(ModeSwitcherBuilder, "contract", {
		schema: { t: "any" },
		example: {}
	});
	// packages/components/mode-switcher/index.ts
	var mode_switcher_exports = /* @__PURE__ */ __exportAll({ ModeSwitcherBuilder: () => ModeSwitcherBuilder });
	// packages/modules/module-loader/ModuleRegistry.ts
	var _definitions = /* @__PURE__ */ new WeakMap();
	/**
	* 🧩 MODULE REGISTRY — storage for module definitions.
	*
	* Owns one concern: which definitions exist, keyed by id. It never loads,
	* instantiates, or destroys anything; that is `ModuleLoader`'s job. Keeping the
	* two apart means a definition store can be shared or inspected without creating
	* live objects.
	*
	* @example
	* const modules = new ModuleRegistry<iFormModuleContext>("form");
	* modules.register(validationFormAdapter);
	* modules.has("validation"); // true
	*/
	var ModuleRegistry = class {
		/**
		* @param scope - Namespace label, for example `"form"` or `"animation"`.
		* @param options - Duplicate policy for module ids.
		* @throws {RegistryError} With code `INVALID_SCOPE` when the scope label is malformed.
		*/
		constructor(scope, options = {}) {
			_classPrivateFieldInitSpec(this, _definitions, void 0);
			_classPrivateFieldSet2(_definitions, this, new Registry$1(scope, { duplicate: options.duplicate ?? "warn" }));
		}
		/** Scope label that isolates this registry from other module registries. */
		get scope() {
			return _classPrivateFieldGet2(_definitions, this).scope;
		}
		/** Number of registered definitions. */
		get size() {
			return _classPrivateFieldGet2(_definitions, this).size;
		}
		/**
		* Registers a module definition.
		*
		* @summary A definition is `{ id, load }`. A **manifest ref** — `{ id, path, export }`, the
		* shape an AST declares — is not a definition: only `ComponentRegistry` (or
		* `resolveModuleDefinitions()`) can turn a specifier into a live module. Registering a ref used
		* to succeed silently and fail three layers later inside a consumer's form, so the door now
		* names the mistake instead of storing it.
		* @param definition - Definition to register; its `id` becomes the lookup key.
		* @returns The current registry instance, for fluent registration chains.
		* @throws {RegistryError} With code `INVALID_ID` for a malformed id, `INVALID_DEFINITION` when
		*   `load` is missing, or `DUPLICATE_ID` when the policy is `"error"` and the id exists.
		* @example
		* modules.register(validationFormAdapter);
		*/
		register(definition) {
			if (typeof definition?.load !== "function") {
				const ref = definition;
				const shape = ref && (ref.path || ref.export) ? `it looks like a manifest ref ({ path: "${ref.path ?? "?"}", export: "${ref.export ?? "?"}" })` : "it has no load() function";
				throw new RegistryError$1("INVALID_DEFINITION", `[${this.scope}] module "${String(ref?.id ?? "?")}" is not a definition — ${shape}. A loader takes definitions (in this package: FORM_ADAPTER_DEFINITIONS, or one adapter exported from its own subpath). Manifest refs belong to ComponentRegistry, or can be resolved first with resolveModuleDefinitions().`, {
					scope: this.scope,
					id: String(ref?.id ?? "?")
				});
			}
			_classPrivateFieldGet2(_definitions, this).register(definition.id, definition);
			return this;
		}
		/**
		* Resolves a registered definition.
		*
		* @param id - Module identifier.
		* @returns The definition, or `null` when the module is not registered.
		* @example
		* modules.resolve("validation")?.requires;
		*/
		resolve(id) {
			return _classPrivateFieldGet2(_definitions, this).resolve(id);
		}
		/**
		* Checks whether a module definition is registered.
		*
		* @param id - Module identifier.
		* @returns `true` when registered.
		*/
		has(id) {
			return _classPrivateFieldGet2(_definitions, this).has(id);
		}
		/**
		* Lists registered module ids in registration order.
		*
		* @returns A new array that is safe to mutate.
		*/
		ids() {
			return _classPrivateFieldGet2(_definitions, this).ids();
		}
	};
	// packages/modules/module-loader/ModuleLoader.ts
	var _registry = /* @__PURE__ */ new WeakMap();
	var _instances = /* @__PURE__ */ new WeakMap();
	var _ModuleLoader_brand = /* @__PURE__ */ new WeakSet();
	/**
	* 🚚 MODULE LOADER — lifecycle for optional modules.
	*
	* Loads, tracks, and destroys module instances on top of a `ModuleRegistry`.
	* Dependency ordering, rebuild-safe reload, and reverse-order teardown live here
	* so the registry can stay a plain definition store.
	*
	* @example
	* const loader = new ModuleLoader<iFormModuleContext, any>("form", FULL_FORM_MODULES);
	* const feature = loader.load("validation", { form, builder: "form", ... });
	* loader.unloadAll();
	*/
	var ModuleLoader = class {
		/**
		* @param scope - Namespace label, for example `"form"`.
		* @param definitions - Definitions to register up front. Empty by default, so a
		*   Lite consumer passes nothing and keeps the built-in behaviour.
		* @param options - Duplicate policy for module ids.
		* @throws {RegistryError} With code `INVALID_SCOPE` when the scope label is malformed.
		*/
		constructor(scope, definitions = [], options = {}) {
			_classPrivateMethodInitSpec(this, _ModuleLoader_brand);
			_classPrivateFieldInitSpec(this, _registry, void 0);
			_classPrivateFieldInitSpec(this, _instances, /* @__PURE__ */ new Map());
			_classPrivateFieldSet2(_registry, this, new ModuleRegistry(scope, { duplicate: options.duplicate }));
			for (const definition of definitions) _classPrivateFieldGet2(_registry, this).register(definition);
		}
		/** The definition store backing this loader. */
		get registry() {
			return _classPrivateFieldGet2(_registry, this);
		}
		/** Scope label shared with the backing registry. */
		get scope() {
			return _classPrivateFieldGet2(_registry, this).scope;
		}
		/**
		* Lists registered module ids in registration order.
		*
		* @returns A new array that is safe to mutate.
		*/
		ids() {
			return _classPrivateFieldGet2(_registry, this).ids();
		}
		/**
		* Checks whether a module definition is registered.
		*
		* @param id - Module identifier.
		* @returns `true` when registered.
		*/
		has(id) {
			return _classPrivateFieldGet2(_registry, this).has(id);
		}
		/**
		* Resolves a registered definition without loading it.
		*
		* @param id - Module identifier.
		* @returns The definition, or `null` when the module is not registered.
		*/
		resolve(id) {
			return _classPrivateFieldGet2(_registry, this).resolve(id);
		}
		/**
		* Lists ids of modules that currently hold a live instance.
		*
		* @returns A new array in load order.
		*/
		loadedIds() {
			return Array.from(_classPrivateFieldGet2(_instances, this).keys());
		}
		/**
		* Returns the instance already held by a module, without loading it.
		*
		* @summary Use this after `resolveAll()` when a caller needs a typed handle on a
		* module the loader already settled, such as an engine it will call directly.
		* @param id - Module identifier.
		* @returns The live instance, or `null` when the module is not loaded.
		* @example
		* loader.resolveAll(context);
		* const feature = loader.loaded("validation");
		*/
		loaded(id) {
			if (!_classPrivateFieldGet2(_instances, this).has(id)) return null;
			return _classPrivateFieldGet2(_instances, this).get(id);
		}
		/**
		* Checks whether a module currently holds a live instance.
		*
		* @param id - Module identifier.
		* @returns `true` when loaded.
		*/
		isLoaded(id) {
			return _classPrivateFieldGet2(_instances, this).has(id);
		}
		/**
		* Loads a module by id.
		*
		* @summary Resolves required dependencies first, destroys any previous instance
		* of the same module (rebuild semantics), then delegates to `definition.load()`.
		* @param id - Module identifier.
		* @param context - Host context forwarded to `definition.load()`.
		* @returns The live module object, or `null` when the module is not registered.
		* @throws {RegistryError} With code `MISSING_DEPENDENCY` when a required module is not registered, or `CYCLIC_DEPENDENCY` when `requires` forms a loop.
		* @example
		* const feature = loader.load("validation", context);
		*/
		load(id, context) {
			return _assertClassBrand(_ModuleLoader_brand, this, _load).call(this, id, context, /* @__PURE__ */ new Set());
		}
		/**
		* Loads every module whose `matches()` accepts the context.
		*
		* @summary Idempotent: modules that already hold an instance are skipped, so a
		* caller can run `resolveAll()` once per lifecycle phase and only the modules
		* that become applicable in that phase are loaded. Modules without `matches`
		* always apply. Iteration follows registration order.
		* @param context - Host context forwarded to `matches()` and `load()`.
		* @returns Only the instances loaded by this call, in registration order.
		* @throws {RegistryError} Same failure modes as {@link load}.
		*/
		resolveAll(context) {
			const loaded = [];
			for (const id of _classPrivateFieldGet2(_registry, this).ids()) {
				if (_classPrivateFieldGet2(_instances, this).has(id)) continue;
				const instance = this.load(id, context);
				if (instance !== null) loaded.push(instance);
			}
			return loaded;
		}
		/**
		* Destroys and forgets one loaded module.
		*
		* @param id - Module identifier.
		* @returns `true` when a live instance was released, `false` when it was not loaded.
		*/
		unload(id) {
			return _assertClassBrand(_ModuleLoader_brand, this, _release).call(this, id);
		}
		/**
		* Destroys and forgets every loaded module, newest first.
		*
		* @summary Reverse order matches dependency direction: dependants unload before
		* the modules they require.
		* @returns Nothing.
		*/
		unloadAll() {
			for (const id of Array.from(_classPrivateFieldGet2(_instances, this).keys()).reverse()) _assertClassBrand(_ModuleLoader_brand, this, _release).call(this, id);
		}
	};
	/**
	* Loads a module and its dependency chain.
	*
	* @param id - Module identifier.
	* @param context - Host context forwarded to `definition.load()`.
	* @param visiting - Ids currently on the dependency stack, used for cycle detection.
	* @returns The live module object, or `null` when unregistered.
	*/
	function _load(id, context, visiting) {
		const definition = _classPrivateFieldGet2(_registry, this).resolve(id);
		if (!definition) return null;
		if (typeof definition.matches === "function" && !definition.matches(context)) return null;
		if (visiting.has(id)) throw new RegistryError$1("CYCLIC_DEPENDENCY", `Module "${id}" in scope "${this.scope}" takes part in a dependency cycle.`, {
			scope: this.scope,
			id
		});
		visiting.add(id);
		for (const dependencyId of definition.requires ?? []) {
			if (!_classPrivateFieldGet2(_registry, this).has(dependencyId)) throw new RegistryError$1("MISSING_DEPENDENCY", `Module "${id}" requires "${dependencyId}", which is not registered in scope "${this.scope}".`, {
				scope: this.scope,
				id: dependencyId
			});
			_assertClassBrand(_ModuleLoader_brand, this, _load).call(this, dependencyId, context, visiting);
		}
		visiting.delete(id);
		_assertClassBrand(_ModuleLoader_brand, this, _release).call(this, id);
		const instance = definition.load(context);
		_classPrivateFieldGet2(_instances, this).set(id, instance);
		return instance;
	}
	/**
	* Destroys and forgets a loaded instance.
	*
	* @param id - Module identifier.
	* @returns `true` when something was released.
	*/
	function _release(id) {
		if (!_classPrivateFieldGet2(_instances, this).has(id)) return false;
		const instance = _classPrivateFieldGet2(_instances, this).get(id);
		_classPrivateFieldGet2(_instances, this).delete(id);
		_classPrivateFieldGet2(_registry, this).resolve(id)?.destroy?.(instance);
		return true;
	}
	// packages/modules/module-loader/Resolve.ts
	/**
	* 🧩 Turns manifest refs into module definitions a `ModuleLoader` accepts.
	*
	* @summary Two shapes describe the same module and nothing used to say which was which:
	* a **manifest ref** (`{ id, path, export }`, what an AST declares and `ComponentRegistry`
	* resolves) and a **definition** (`{ id, load }`, what a `ModuleLoader` takes). This is the
	* explicit bridge — async, called by the consumer **before** it builds anything, because a
	* builder's render is synchronous and must never own module I/O.
	*
	* @param refs - Manifest refs, in the order the modules should load.
	* @param options - Importer override.
	* @returns One definition per ref, in the same order. Each `load()` returns the very symbol the
	*   ref named, so a module is instantiated once and shared.
	* @throws {RegistryError} `INVALID_DEFINITION` when a ref names no `export`, when the import
	*   fails, or when the exported symbol is not a definition (no `load`) — a class or a live
	*   instance cannot be registered without knowing how to construct it.
	*
	* @example
	* import { ModuleLoader, resolveModuleDefinitions } from "@aio-ui/module-loader";
	* import { FORM_ADAPTER_MANIFEST } from "@aio-ui/form/FormRegistry";
	*
	* const definitions = await resolveModuleDefinitions(FORM_ADAPTER_MANIFEST);
	* const form = new FormBuilder({ modules: new ModuleLoader("form", definitions) });
	*/
	async function resolveModuleDefinitions(refs, options = {}) {
		const load = options.import ?? ((specifier) => import(specifier));
		return (await Promise.all(refs.map(async (ref) => {
			if (!ref.export) throw new RegistryError$1("INVALID_DEFINITION", `Module ref "${ref.id}" names no "export". A ref must say which symbol it wants (for example export: "validationFormAdapter") — this resolver does not guess.`, {
				scope: "module-loader",
				id: ref.id
			});
			if (!ref.path) throw new RegistryError$1("MISSING_ENTRY", `Module ref "${ref.id}" names no "path" — there is nothing to import.`, {
				scope: "module-loader",
				id: ref.id
			});
			let namespace;
			try {
				namespace = await load(ref.path);
			} catch (error) {
				throw new RegistryError$1("MISSING_ENTRY", `Module ref "${ref.id}" could not import "${ref.path}": ${error?.message ?? error}`, {
					scope: "module-loader",
					id: ref.id
				});
			}
			const symbol = namespace?.[ref.export];
			if (symbol === void 0 || symbol === null) throw new RegistryError$1("MISSING_ENTRY", `Module ref "${ref.id}" → "${ref.path}" has no exported object "${ref.export}".`, {
				scope: "module-loader",
				id: ref.id
			});
			return {
				ref,
				symbol
			};
		}))).map(({ ref, symbol }) => {
			const definition = symbol;
			if (typeof definition.load !== "function") throw new RegistryError$1("INVALID_DEFINITION", `Module ref "${ref.id}" → "${ref.path}" exports "${ref.export}", which is not a module definition (no load()). Export the definition itself — every adapter in this repo does, for example "validationFormAdapter".`, {
				scope: "module-loader",
				id: ref.id
			});
			return definition;
		});
	}
	// packages/modules/module-loader/index.ts
	var module_loader_exports = /* @__PURE__ */ __exportAll({
		ModuleLoader: () => ModuleLoader,
		ModuleRegistry: () => ModuleRegistry,
		resolveModuleDefinitions: () => resolveModuleDefinitions
	});
	// packages/modules/router/dist/HashRouter.js
	var HashRouter$1 = class {
		/**
		* @param config - Options for standalone use (`{ defaultRoute, initialTheme, validRoutes, onRouteChanged }`).
		* @param context - Host-supplied runtime data; wins over `config` when both are given.
		*/
		constructor(config = {}, context) {
			_defineProperty(this, "defaultRoute", void 0);
			_defineProperty(this, "currentThemeId", void 0);
			_defineProperty(this, "onRouteChanged", void 0);
			_defineProperty(this, "validRoutes", []);
			_defineProperty(this, "_handleHashChange", () => {
				const state = this.parseUrlHash();
				if (state.theme) this.currentThemeId = state.theme;
				this.onRouteChanged(state);
			});
			const defaultRoute = context?.defaultRoute ?? config.defaultRoute ?? "home";
			const initialTheme = context?.theme ?? config.initialTheme ?? "default";
			const validRoutes = context?.routes ?? config.validRoutes ?? [];
			const onRouteChanged = context?.onRouteChanged ?? config.onRouteChanged;
			this.defaultRoute = this._normalizeRoute(defaultRoute);
			this.currentThemeId = this._normalizeTheme(initialTheme) || "default";
			this.onRouteChanged = onRouteChanged ?? (() => void 0);
			this.validRoutes = validRoutes.map((r) => r.trim().toLowerCase());
			window.addEventListener("hashchange", this._handleHashChange);
		}
		redirect(targetRoute, themeId, fragmentId = "") {
			const activeTheme = this._normalizeTheme(themeId || this.currentThemeId);
			const redirectState = {
				route: this._normalizeRoute(targetRoute),
				theme: activeTheme,
				fragment: fragmentId.trim().replace(/^#/, "")
			};
			this.currentThemeId = activeTheme;
			localStorage.setItem("active_theme", activeTheme);
			const targetHash = this._buildHash(redirectState);
			window.history.replaceState(null, "", targetHash);
			return redirectState;
		}
		navigate(routeId, themeId, fragmentId, _isValidRoute = false) {
			const activeTheme = this._normalizeTheme(themeId || this.currentThemeId);
			let targetRoute = this._normalizeRoute(routeId);
			let targetFragment = fragmentId?.trim().replace(/^#/, "") || "";
			if (!this.validRoutes.includes(targetRoute.toLowerCase()) && !_isValidRoute) {
				console.warn(`[Router] Redirecting dynamic section anchor click to default page path.`);
				const correctedState = this.redirect(this.defaultRoute, activeTheme, targetRoute);
				this.onRouteChanged(correctedState);
				return;
			}
			const normalizedState = {
				route: targetRoute,
				theme: activeTheme,
				fragment: targetFragment
			};
			window.history.pushState(null, "", this._buildHash(normalizedState));
			this.currentThemeId = activeTheme;
			localStorage.setItem("active_theme", activeTheme);
			this.onRouteChanged(normalizedState);
		}
		parseUrlHash() {
			const rawHash = window.location.hash.trim().replace(/^#/, "");
			const persistedTheme = this._normalizeTheme(localStorage.getItem("active_theme"));
			if (!rawHash) {
				console.log("[Router] Empty URL hash. Executing central auto-redirect to home launcher...");
				return this.redirect(this.defaultRoute, persistedTheme);
			}
			const [rawPathPart, queryString = ""] = rawHash.split("?");
			const pathPart = rawPathPart.trim().replace(/^\/+/, "");
			const queryTheme = new URLSearchParams(queryString).get("theme");
			let extractedTheme = queryTheme ? this._normalizeTheme(queryTheme) : null;
			let targetRoute = "";
			let targetFragment = "";
			const segments = pathPart.split("/").map((part) => part.trim()).filter(Boolean);
			if (segments.length > 1) {
				const firstPart = segments[0];
				const remainder = segments.slice(1).join("/");
				if (queryTheme) {
					targetRoute = firstPart;
					targetFragment = remainder;
				} else if (this.validRoutes.includes(firstPart.toLowerCase())) {
					targetRoute = firstPart;
					targetFragment = remainder;
				} else if (this.validRoutes.includes(remainder.toLowerCase())) {
					extractedTheme = this._normalizeTheme(firstPart);
					targetRoute = remainder;
				} else {
					targetRoute = firstPart;
					targetFragment = remainder;
				}
			} else targetRoute = segments[0] || pathPart.trim();
			let finalRoute = this._normalizeRoute(targetRoute);
			let finalFragment = this._safeDecode(targetFragment);
			if (!this.validRoutes.includes(finalRoute.toLowerCase())) {
				console.log(`[Router Live] Route "${finalRoute}" is unrecognized. Delegating central redirect.`);
				return this.redirect(this.defaultRoute, extractedTheme || persistedTheme, finalRoute);
			}
			const resolvedState = {
				route: finalRoute,
				theme: extractedTheme || persistedTheme || this.currentThemeId || "default",
				fragment: finalFragment
			};
			this.currentThemeId = resolvedState.theme || this.currentThemeId;
			if (resolvedState.theme) localStorage.setItem("active_theme", resolvedState.theme);
			this._syncAddressBar(resolvedState, true);
			return resolvedState;
		}
		/**
		* Mengupdate daftar rute yang valid secara dinamis (misalnya ketika mendaftarkan controller baru)
		*/
		updateValidRoutes(validRoutes) {
			this.validRoutes = validRoutes.map((r) => r.trim().toLowerCase());
		}
		updateValidRoute(route) {
			this.validRoutes.push(route);
		}
		/**
		* Pembersih memory leak saat instance dihancurkan
		*/
		destroy() {
			window.removeEventListener("hashchange", this._handleHashChange);
		}
		/**
		* HELPER
		*/
		_normalizeRoute(route) {
			return route.trim().replace(/^#/, "").replace(/^\/+/, "") || "home";
		}
		_normalizeTheme(theme) {
			return (theme || "").trim().replace(/^#/, "");
		}
		_buildHash(state) {
			const route = this._normalizeRoute(state.route);
			const theme = this._normalizeTheme(state.theme || this.currentThemeId) || "default";
			const fragment = state.fragment?.trim().replace(/^#/, "");
			const query = `?theme=${encodeURIComponent(theme)}`;
			return `#${route}${fragment ? `/${fragment}` : ""}${query}`;
		}
		_safeDecode(value) {
			try {
				return decodeURIComponent(value);
			} catch {
				return value;
			}
		}
		_syncAddressBar(state, replace = false) {
			const normalizedHash = this._buildHash(state);
			if (window.location.hash === normalizedHash) return;
			if (replace) window.history.replaceState(null, "", normalizedHash);
			else window.history.pushState(null, "", normalizedHash);
		}
	};
	_defineProperty(HashRouter$1, "slot", "router");
	// packages/modules/event-emitter/dist/EventEmitter.js
	/**
	* Small synchronous event bus.
	*
	* Two kinds of event travel through it: component-level ones (`elementAdded`, …) that a
	* builder reports through `config.emit`, and page-level ones the shell emits around a
	* render pass. The registry receives this emitter's `emit` once
	* (`registry.useEmitter(emitter.emit)`) and injects it into every builder config, so a
	* component never has to be told that the application has a bus.
	*
	* Unknown event names are accepted on purpose: a component may name its own
	* (`formValidation`, `tabs:content-loaded`) without registering anything first.
	*/
	var EventEmitter = class {
		constructor() {
			_defineProperty(this, "listeners", {});
			_defineProperty(
				this,
				/**
				* Publishes an event.
				*
				* A throwing listener cannot stop the others: its error is logged and the loop
				* continues, because an event bus is reporting, not control flow.
				*/
				"emit",
				(event, data) => {
					const callbacks = this.listeners[event];
					if (!callbacks) return;
					for (const callback of callbacks) try {
						callback(data);
					} catch (err) {
						console.error(`[EventEmitter] Error executing callback for event "${event}":`, err);
					}
				}
			);
		}
		/**
		* Subscribes to an event.
		*
		* @param event - Known page/component event, or any custom component event name.
		* @param callback - Receives the payload; known events are typed, custom ones are not.
		*/
		on(event, callback) {
			if (!this.listeners[event]) this.listeners[event] = [];
			this.listeners[event].push(callback);
		}
		off(event, callback) {
			if (!this.listeners[event]) return;
			this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
		}
		clear() {
			this.listeners = {};
		}
		/**
		* Releases every listener.
		*
		* Named `destroy` so a host that releases its modules generically
		* (`port.destroy?.()`) does not need a special case for this class.
		*/
		destroy() {
			this.clear();
		}
	};
	_defineProperty(EventEmitter, "slot", "events");
	// packages/modules/theme/dist/ThemeRegistry.js
	var _themes$3 = /* @__PURE__ */ new WeakMap();
	/**
	* Theme store.
	*
	* Same shape as every other registry in the framework: an instance over the `Registry`
	* kernel, keyed by `themeId`. It stores modules only — applying a theme to the DOM is
	* `ThemeRenderer`'s job.
	*/
	var ThemeRegistry$1 = class {
		constructor() {
			_classPrivateFieldInitSpec(this, _themes$3, new Registry$1("theme", { duplicate: "warn" }));
		}
		/** Number of registered themes. */
		get size() {
			return _classPrivateFieldGet2(_themes$3, this).size;
		}
		/** Registers (or replaces) a theme module. */
		register(theme) {
			_classPrivateFieldGet2(_themes$3, this).register(theme.themeId, theme);
			return this;
		}
		/** The theme for `themeId`, or `null`. */
		resolve(themeId) {
			return _classPrivateFieldGet2(_themes$3, this).resolve(themeId);
		}
		/** Whether a theme id is registered. */
		has(themeId) {
			return _classPrivateFieldGet2(_themes$3, this).has(themeId);
		}
		/** Registered theme ids, in registration order. */
		ids() {
			return _classPrivateFieldGet2(_themes$3, this).ids();
		}
		/** All registered themes. */
		all() {
			return _classPrivateFieldGet2(_themes$3, this).entries().map((entry) => entry.value);
		}
		/** Removes every theme. */
		clear() {
			_classPrivateFieldGet2(_themes$3, this).clear();
		}
	};
	// packages/modules/theme/dist/ThemeRenderer.js
	var _themes$2 = /* @__PURE__ */ new WeakMap();
	var _templates$1 = /* @__PURE__ */ new WeakMap();
	var _id$1 = /* @__PURE__ */ new WeakMap();
	var _active$1 = /* @__PURE__ */ new WeakMap();
	var _ThemeRenderer_brand$1 = /* @__PURE__ */ new WeakSet();
	/**
	* Theme renderer — the `theme` slot.
	*
	* It is a plain object with three phases, not an event subscriber: the app calls
	* `prepare` before the DOM is built, `activate` after it is attached, and `deactivate`
	* before the page is replaced. That is why no listener has to guess the right moment,
	* and why two apps on one page cannot steal each other's theme.
	*
	* Templates land in an instance `TemplateRegistry` which installs itself into the core
	* port, replacing the old `globalThis.TemplateRegistry`.
	*
	* Typed structurally (`page: any`) on purpose: this package must not depend on
	* `@aio-ui/app`, so the app's `iThemePort` accepts it by shape.
	*/
	var ThemeRenderer$1 = class {
		constructor(config = {}) {
			_classPrivateMethodInitSpec(this, _ThemeRenderer_brand$1);
			_classPrivateFieldInitSpec(this, _themes$2, new ThemeRegistry$1());
			_classPrivateFieldInitSpec(this, _templates$1, new TemplateRegistry$1());
			_classPrivateFieldInitSpec(this, _id$1, void 0);
			_classPrivateFieldInitSpec(this, _active$1, null);
			for (const theme of config.themes ?? []) _classPrivateFieldGet2(_themes$2, this).register(theme);
			setTemplates$1(_classPrivateFieldGet2(_templates$1, this));
			for (const theme of _classPrivateFieldGet2(_themes$2, this).all()) _assertClassBrand(_ThemeRenderer_brand$1, this, _registerTemplates$1).call(this, theme);
			_classPrivateFieldSet2(_id$1, this, _classPrivateFieldGet2(_themes$2, this).ids()[0] ?? "default");
			_classPrivateFieldSet2(_active$1, this, _classPrivateFieldGet2(_themes$2, this).resolve(_classPrivateFieldGet2(_id$1, this)));
		}
		/** Registered theme ids. */
		get ids() {
			return _classPrivateFieldGet2(_themes$2, this).ids();
		}
		/** Currently applied theme id. */
		get current() {
			return _classPrivateFieldGet2(_id$1, this);
		}
		/**
		* Adds a theme after construction.
		*
		* Registration is not tied to the constructor: a theme is just an id plus hooks, and
		* its templates are per-instance, so adding one later is safe. If no theme was active
		* yet (unknown id), the new one becomes the active theme.
		*/
		register(theme) {
			_classPrivateFieldGet2(_themes$2, this).register(theme);
			_assertClassBrand(_ThemeRenderer_brand$1, this, _registerTemplates$1).call(this, theme);
			if (!_classPrivateFieldGet2(_active$1, this)) {
				_classPrivateFieldSet2(_active$1, this, theme);
				_classPrivateFieldSet2(_id$1, this, theme.themeId);
			}
		}
		/** Switches the active theme. Unknown ids are reported and ignored. */
		use(themeId) {
			const next = _classPrivateFieldGet2(_themes$2, this).resolve(themeId);
			if (!next) {
				console.warn(`[ThemeRenderer] Unknown theme "${themeId}"; keeping "${_classPrivateFieldGet2(_id$1, this)}".`);
				return;
			}
			_classPrivateFieldSet2(_active$1, this, next);
			_classPrivateFieldSet2(_id$1, this, themeId);
		}
		/** Structural hook: lets the active theme rewrite the page before rendering. */
		prepare(page, _route, themeId) {
			this.use(themeId);
			const theme = _classPrivateFieldGet2(_active$1, this);
			if (!theme?.beforePageRender) return page;
			const isDocument = Array.isArray(page?.blocks);
			const nodes = isDocument ? page.blocks : [page];
			const result = theme.beforePageRender(nodes, null, null);
			if (!result) return page;
			return isDocument ? {
				...page,
				blocks: result.pages
			} : result.pages[0] ?? page;
		}
		/** Behavioural hook: runs once the page is live. */
		activate(shell, blocks) {
			_classPrivateFieldGet2(_active$1, this)?.activate(shell, Array.from(blocks.values()), { setConfig: () => void 0 });
		}
		/** Cleanup hook: runs before the page is replaced. */
		deactivate(shell) {
			_classPrivateFieldGet2(_active$1, this)?.deactivate?.(shell);
		}
		/** Releases the template store so a destroyed app leaves nothing installed. */
		destroy() {
			setTemplates$1(null);
			_classPrivateFieldGet2(_templates$1, this).clear();
			_classPrivateFieldGet2(_themes$2, this).clear();
		}
	};
	function _registerTemplates$1(theme) {
		const templates = theme.templates?.();
		if (!templates) return;
		for (const [key, handler] of Object.entries(templates)) _classPrivateFieldGet2(_templates$1, this).register(theme.themeId, key, handler);
	}
	_defineProperty(ThemeRenderer$1, "slot", "theme");
	// packages/modules/animations/dist/behaviours/typewriter.js
	var TypewriterBehaviour = class {
		/**
		* Pemecah karakter menggunakan Intl.Segmenter (grapheme murni)
		*/
		static getCharacters(text) {
			return [...new Intl.Segmenter(document.documentElement.lang || "id", { granularity: "grapheme" }).segment(text)].map((s) => s.segment);
		}
		static sleep(ms) {
			return new Promise((resolve) => setTimeout(resolve, ms));
		}
		static rng(min, max) {
			return Math.floor(Math.random() * (max - min) + min);
		}
		/** Jeda antar karakter — ambil nilai acak bila interval berupa array (dikali faktor kecepatan) */
		static async _typingInterval(options, speedFactor = 1) {
			if (Array.isArray(options.interval)) await this.sleep(options.interval[this.rng(0, options.interval.length)] * speedFactor);
			else await this.sleep(options.interval * speedFactor);
		}
		/**
		* Hitung ritme jeda tanda baca (Anti-tabrakan Spasi):
		* - akhir kalimat (. ! ? diikuti spasi/baris baru/akhir teks) -> jeda penuh,
		*   atau setengahnya saat mode rewrite aktif;
		* - jeda pendek (; : ,) -> delay / 6.
		* Bila tanda pendek diikuti spasi, spasi langsung dilekatkan ke layar dan pemanggil
		* diminta melompati indeks spasi tersebut (swallowNextChar).
		*/
		static _punctuationRhythm(char, nextChar, el, options) {
			const sentenceEnders = [
				".",
				"!",
				"?"
			];
			const shortPauses = [
				",",
				";",
				":"
			];
			if (sentenceEnders.includes(char)) {
				if (!nextChar || nextChar === " " || nextChar === "\n") return {
					pauseMs: options.rewrite ? options.delay / 2 : options.delay,
					swallowNextChar: false
				};
			} else if (shortPauses.includes(char)) {
				const swallowNextChar = nextChar === " ";
				if (swallowNextChar) el.textContent += nextChar;
				return {
					pauseMs: options.delay / 6,
					swallowNextChar
				};
			}
			return {
				pauseMs: 0,
				swallowNextChar: false
			};
		}
		/** Fase ketik: tempelkan karakter satu-per-satu mengikuti ritme interval & jeda tanda baca */
		static async _typeOut(node, el, characters, options, isStopped = () => false) {
			for (let i = 0; i < characters.length; i++) {
				if (!node.isConnected || isStopped()) return;
				const char = characters[i];
				el.textContent += char;
				await this._typingInterval(options);
				const rhythm = this._punctuationRhythm(char, characters[i + 1], el, options);
				if (rhythm.swallowNextChar) i++;
				if (rhythm.pauseMs > 0) {
					el.classList.remove("tw-writing");
					await this.sleep(rhythm.pauseMs);
					if (!node.isConnected || isStopped()) return;
					el.classList.add("tw-writing");
				}
			}
		}
		/**
		* Fase hapus mundur: untuk kalimat bukan-terakhir (atau saat mode loop aktif),
		* teks dikosongkan kembali dengan efek hapus super cepat (interval x 0.1).
		*/
		static async _deleteBackwards(node, el, options, isLastSentence, isStopped = () => false) {
			if (!isLastSentence || options.loop) {
				el.classList.add("tw-writing");
				while (el.textContent !== "") {
					if (!node.isConnected || isStopped()) return;
					const currentChars = this.getCharacters(el.textContent);
					currentChars.pop();
					el.textContent = currentChars.join("");
					await this._typingInterval(options, .1);
				}
				await this.sleep(200);
			} else el.classList.remove("tw-writing");
		}
		/**
		* Core Engine Typewriter Effect (Konsisten & Unified):
		* merangkai fase ketik -> jeda membaca -> hapus mundur untuk SATU kalimat.
		*/
		static async _typewriterEffect(node, el, targetText, options, isLastSentence, isStopped = () => false) {
			const characters = this.getCharacters(targetText);
			el.textContent = "";
			el.style.whiteSpace = "normal";
			el.style.wordBreak = "break-word";
			el.classList.add("tw-writing");
			await this._typeOut(node, el, characters, options, isStopped);
			if (!node.isConnected || isStopped()) return;
			el.classList.remove("tw-writing");
			await this.sleep(options.delay);
			if (!node.isConnected || isStopped()) return;
			await this._deleteBackwards(node, el, options, isLastSentence, isStopped);
		}
		/** MODE REWRITE step-1: pecah teks tiap blok anak jadi daftar kalimat lalu kosongkan layarnya */
		static _extractRewriteBlocks(originalChildren) {
			const sentenceSegmenter = new Intl.Segmenter(document.documentElement.lang || "id", { granularity: "sentence" });
			return originalChildren.map((child) => {
				const rawText = (child.textContent || "").trim().replace(/\s+/g, " ");
				const sentences = [...sentenceSegmenter.segment(rawText)].map((s) => s.segment.trim()).filter(Boolean);
				child.textContent = "";
				child.style.visibility = "hidden";
				return {
					el: child,
					sentences
				};
			});
		}
		/** MODE REWRITE step-2: satu lintasan penuh — tampilkan blok bergantian sambil mengetik kalimatnya */
		static async _rewritePass(node, blockData, options, isStopped = () => false) {
			for (const block of blockData) {
				block.el.style.display = "";
				block.el.style.visibility = "visible";
				for (let sIndex = 0; sIndex < block.sentences.length; sIndex++) {
					if (!node.isConnected || isStopped()) return;
					const isLastBlock = block === blockData[blockData.length - 1];
					const isLastSentenceOfBlock = sIndex === block.sentences.length - 1;
					const isAbsoluteLast = isLastBlock && isLastSentenceOfBlock;
					await this._typewriterEffect(node, block.el, block.sentences[sIndex], options, isAbsoluteLast, isStopped);
				}
				if (block !== blockData[blockData.length - 1] || options.loop) block.el.style.display = "none";
			}
		}
		/**
		* SCENARIO A ENGINE — MODE REWRITE (Mendukung Struktur Bersarang Komponen Skema Anda):
		* sekali jalan, atau berputar tanpa henti selama opsi loop aktif.
		*/
		static async _rewriteEngine(node, options, onDone, isStopped = () => false) {
			const childElements = [...Array.from(node.children)];
			const originalChildren = childElements.length > 0 ? childElements : [node];
			const blockData = this._extractRewriteBlocks(originalChildren);
			if (options.loop) while (true) {
				if (!node.isConnected || isStopped()) break;
				await this._rewritePass(node, blockData, options, isStopped);
			}
			else {
				await this._rewritePass(node, blockData, options, isStopped);
				onDone();
			}
		}
		/**
		* SCENARIO B ENGINE — LOOP MULTI-ELEMENT (Berdasarkan Array Teks):
		* seluruh teks anak digabung menjadi satu paragraf dinamis lalu diputar terus.
		*/
		static async _loopMultiElement(node, options, isStopped = () => false) {
			const loopTexts = [...Array.from(node.children)].map((el) => el.textContent || "");
			const firstChild = node.firstElementChild;
			const loopParagraphTag = firstChild ? firstChild.tagName.toLowerCase() : "p";
			while (node.firstChild) node.removeChild(node.firstChild);
			const loopParagraph = document.createElement(loopParagraphTag);
			node.appendChild(loopParagraph);
			while (true) {
				if (!node.isConnected || isStopped()) break;
				for (const text of loopTexts) {
					if (!node.isConnected || isStopped()) break;
					await this._typewriterEffect(node, loopParagraph, text, options, false, isStopped);
				}
			}
		}
		/** True bila elemen hanya memuat satu anak bertipe Text murni */
		static _hasSingleTextNode(el) {
			return el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE;
		}
		/**
		* SCENARIO C ENGINE — SEKUENSIAL / PARALEL DEFAULT (Sekali Jalan Tanpa Rewrite):
		* teks setiap elemen anak diketik bergantian dari atas ke bawah.
		*/
		static async _runSequential(node, options, onDone, isStopped = () => false) {
			const sequentialData = [...Array.from(node.children)].map((el) => {
				const text = el.textContent || "";
				el.textContent = "";
				return {
					el,
					text
				};
			});
			for (let i = 0; i < sequentialData.length; i++) {
				if (!node.isConnected || isStopped()) return;
				const item = sequentialData[i];
				item.el.textContent = item.text;
				await this._typewriterEffect(node, item.el, item.text, options, true, isStopped);
			}
			onDone();
		}
		/**
		* Router utama untuk memproses efek typewriter pada DOM Node.
		* Port 1:1 dari AnimationsService._handleTypewriter (versi lama).
		*/
		static async animate(node, baseOptions, onDone, isStopped = () => false) {
			let loop = baseOptions.loop;
			if (node.hasAttribute("data-tw-loop")) {
				const attr = node.getAttribute("data-tw-loop");
				if (attr === "true") loop = true;
				else if (attr === "false") loop = false;
				else {
					const num = parseInt(attr || "", 10);
					loop = isNaN(num) ? false : num;
				}
			}
			const rewrite = node.hasAttribute("data-tw-rewrite") ? node.getAttribute("data-tw-rewrite") === "true" : baseOptions.rewrite;
			const options = {
				...baseOptions,
				loop,
				rewrite
			};
			node.style.visibility = "visible";
			if (options.rewrite) {
				await this._rewriteEngine(node, options, onDone, isStopped);
				return;
			}
			if (options.loop) {
				await this._loopMultiElement(node, options, isStopped);
				return;
			}
			if (this._hasSingleTextNode(node) || node.children.length === 0) {
				await this._typewriterEffect(node, node, node.textContent || "", options, true, isStopped);
				onDone();
			} else await this._runSequential(node, options, onDone, isStopped);
		}
	};
	/** `animation="typewriter"` — typing engine with rewrite and loop scenarios. */
	var typewriterBehaviour = {
		type: "typewriter",
		animate: ({ node, options, delay, stopped, done }) => TypewriterBehaviour.animate(node, {
			...options,
			delay
		}, () => done(), stopped)
	};
	// packages/modules/animations/dist/behaviours/stagger-fade.js
	/**
	* MODUL: STAGGERING FADE IN (Tetap Menggunakan Native Masking Premium)
	*
	* Port 1:1 dari _handleStaggerFade lama di AnimationsService:
	* - konversi durasi '0.6s' | '600ms' -> ms tetap sama,
	* - delay bertingkat = index × delay,
	* - event 'animation:done' dipicu PER SEGMEN (bukan sekali di akhir) karena
	*   begitulah perilaku versi lama; listener rantai memakai { once: true },
	*   sehingga rantai bisa terpicu sedini segmen pertama selesai. Oleh karena
	*   itu callback-nya bernama onSegmentDone dan menerima elemen segmen.
	*/
	var StaggerFadeBehaviour = class {
		/** Konversi string durasi CSS ('0.6s' | '600ms') ke angka milidetik untuk WAAPI */
		static _toMs(durationStr) {
			return durationStr.endsWith("ms") ? parseFloat(durationStr) : parseFloat(durationStr) * 1e3;
		}
		/**
		* Bangun daftar segmen sesuai mode:
		* - 'line': pakai anak elemen yang sudah ada, atau buat satu <p> per baris.
		* - default ('sentence'): pecah teks menjadi kalimat berdiri sendiri (<span>).
		* Catatan: fungsi ini memutasi node (mengosongkan lalu mengisi ulang),
		* persis seperti perilaku versi lama.
		*/
		static _buildSegments(node, mode) {
			if (mode === "line") {
				if (node.children.length > 0) return [...Array.from(node.children)];
				const lines = (node.textContent || "").split("\n").filter((line) => line.trim() !== "");
				node.textContent = "";
				const created = [];
				lines.forEach((line) => {
					const p = document.createElement("p");
					p.textContent = line;
					node.appendChild(p);
					created.push(p);
				});
				return created;
			}
			const rawText = (node.textContent || "").trim();
			node.textContent = "";
			const textSegments = [...new Intl.Segmenter(document.documentElement.lang || "id", { granularity: "sentence" }).segment(rawText)].map((s) => s.segment.trim());
			const segments = [];
			textSegments.forEach((sentence) => {
				if (sentence) {
					const span = document.createElement("span");
					span.textContent = sentence + " ";
					span.style.display = "inline-block";
					node.appendChild(span);
					segments.push(span);
				}
			});
			return segments;
		}
		/** Jalankan fade bertahap segmen-demi-segmen menggunakan Native Web Animations API */
		static animate(node, options, onSegmentDone) {
			const mode = node.getAttribute("data-stagger-mode") || "sentence";
			const durationMs = this._toMs(options.duration);
			this._buildSegments(node, mode).forEach((el, index) => {
				el.style.opacity = "0";
				el.style.transform = "translateY(15px)";
				el.animate([{
					opacity: 0,
					transform: "translateY(15px)"
				}, {
					opacity: 1,
					transform: "translateY(0)"
				}], {
					duration: durationMs,
					delay: index * options.delay,
					easing: "cubic-bezier(0.25, 1, 0.5, 1)",
					fill: "forwards"
				}).finished.then(() => {
					if (!el.isConnected) return;
					onSegmentDone(el);
				}).catch((error) => {
					if (!(error instanceof DOMException) || error.name !== "AbortError") console.error("[StaggerFadeBehaviour] Animation failed:", error);
				});
			});
		}
	};
	/** `animation="stagger-fade"` — segment-by-segment entrance. */
	var staggerFadeBehaviour = {
		type: "stagger-fade",
		optionKey: "staggerFade",
		animate: ({ node, options, done }) => {
			StaggerFadeBehaviour.animate(node, options, (segment) => done(segment));
		}
	};
	// packages/modules/animations/dist/behaviours/fade-in.js
	/**
	* MODUL: FADE IN (Web Animations API)
	*
	* Port dari _handleFadeIn lama di AnimationsService:
	* - delay dinamis dibaca dari atribut data-fade-delay (default '0s'),
	* - variabel --fade-delay / --fade-duration di-set ulang tiap eksekusi,
	* - pre-hide CSS memakai visibility:hidden (elemen tetap memegang ruang
	*   layout) — dibuka inline saat animasi mulai, lalu opacity 0 -> 1 +
	*   translateY(10px) -> 0 (500ms, ease-out) via WAAPI fill:forwards,
	* - event 'animation:done' dipicu lewat Promise .finished bawaan WAAPI.
	*/
	var FadeInBehaviour = class {
		static async animate(node, options, onDone) {
			const delay = node.getAttribute("data-fade-delay") || "0s";
			node.style.setProperty("--fade-delay", delay);
			node.style.setProperty("--fade-duration", options.duration);
			node.style.visibility = "visible";
			node.animate([{
				opacity: 0,
				transform: "translateY(10px)"
			}, {
				opacity: 1,
				transform: "translateY(0)"
			}], {
				duration: 500,
				easing: "ease-out",
				fill: "forwards"
			}).finished.then(() => {
				if (!node.isConnected) return;
				onDone();
			}).catch((error) => {
				if (!(error instanceof DOMException) || error.name !== "AbortError") console.error("[FadeInBehaviour] Animation failed:", error);
			});
		}
	};
	/** `animation="fade-in"` — WAAPI opacity/translate entrance. */
	var fadeInBehaviour = {
		type: "fade-in",
		optionKey: "fade",
		animate: ({ node, options, done }) => FadeInBehaviour.animate(node, options, () => done())
	};
	// packages/modules/animations/dist/behaviours/scramble.js
	/**
	* MODUL: TEXT SCRAMBLE (Matrix/Cyberpunk)
	*
	* Port 1:1 dari _handleScramble lama di AnimationsService:
	* karakter diacak dari pool, dikunci satu-per-satu ke huruf asli,
	* dengan pengecekan node.isConnected di tiap loop utama dan sub-loop,
	* lalu memicu event 'animation:done' tepat setelah efek selesai total.
	*/
	var ScrambleBehaviour = class {
		/** Utilitas jeda non-blocking */
		static sleep(ms) {
			return new Promise((resolve) => setTimeout(resolve, ms));
		}
		/** Bilangan bulat acak [min, max) — hasilnya identik dengan Math.floor(Math.random() * length) versi lama */
		static rng(min, max) {
			return Math.floor(Math.random() * (max - min) + min);
		}
		/** Core Engine Text-Scramble */
		static async animate(node, options, onDone, isStopped = () => false) {
			const targetText = (node.textContent || "").trim();
			node.textContent = "";
			node.style.opacity = "1";
			const pool = options.chars;
			const speed = options.speed;
			const targetChars = [...new Intl.Segmenter(document.documentElement.lang || "id", { granularity: "grapheme" }).segment(targetText)].map((s) => s.segment);
			let currentTextArray = new Array(targetChars.length).fill("");
			const maxCycles = 12;
			for (let i = 0; i < targetChars.length; i++) {
				if (!node.isConnected || isStopped()) return;
				for (let cycle = 0; cycle < maxCycles; cycle++) {
					if (!node.isConnected || isStopped()) return;
					currentTextArray[i] = pool[this.rng(0, pool.length)];
					for (let j = i + 1; j < Math.min(i + 3, targetChars.length); j++) currentTextArray[j] = pool[this.rng(0, pool.length)];
					node.textContent = currentTextArray.join("");
					await this.sleep(speed / 2);
				}
				currentTextArray[i] = targetChars[i];
				node.textContent = currentTextArray.join("");
				await this.sleep(speed);
			}
			onDone();
		}
	};
	/** `animation="text-scramble"` — Matrix/Cyberpunk decode entrance. */
	var scrambleBehaviour = {
		type: "text-scramble",
		optionKey: "scramble",
		animate: ({ node, options, stopped, done }) => ScrambleBehaviour.animate(node, options, () => done(), stopped)
	};
	// packages/modules/animations/dist/behaviours/count-up.js
	var CountUpBehaviour = class {
		static animate(node) {
			const targetNumber = parseInt(node.textContent || "", 10) || 0;
			node.setAttribute("data-target-number", String(targetNumber));
		}
	};
	/** `animation="count-up"` — reads the target number and hands it to the counter. */
	var countUpBehaviour = {
		type: "count-up",
		animate: ({ node, done }) => {
			CountUpBehaviour.animate(node);
			done();
		}
	};
	// packages/modules/animations/dist/behaviours/loading-placeholder.js
	var LoadingPlaceholderBehaviour = class {
		static async animate(node, options, onDone, isStopped = () => false) {
			const attrDuration = node.getAttribute("data-duration");
			const parsedAttrDelay = attrDuration !== null ? parseInt(attrDuration, 10) : NaN;
			const duration = Number.isFinite(parsedAttrDelay) ? parsedAttrDelay : Number(options.duration) || 500;
			const settledDelay = Number.isFinite(duration) ? Math.max(0, duration) : 0;
			window.setTimeout(() => {
				if (isStopped()) return;
				if (!node.isConnected) {
					onDone();
					return;
				}
				const releaseDuration = Math.max(200, parseInt(String(options.instantRevealDelayTime ?? 200), 10) || 200);
				const restoreOriginalOpacity = () => {
					const backupValue = node.getAttribute("data-anim-hold-opacity");
					if (backupValue === null) return;
					if (backupValue.trim() === "") {
						if (options.restoreFallbackOpacity !== void 0 && String(options.restoreFallbackOpacity).trim() !== "") node.style.opacity = String(options.restoreFallbackOpacity);
						else node.style.removeProperty("opacity");
					} else node.style.opacity = backupValue;
				};
				node.classList.remove("anim-placeholder-active");
				restoreOriginalOpacity();
				node.removeAttribute("data-anim-hold-opacity");
				if (node.getAttribute("animation") === "loading-placeholder") node.removeAttribute("animation");
				window.setTimeout(() => {
					node.style.removeProperty("transition");
				}, releaseDuration);
				onDone();
			}, settledDelay);
		}
	};
	// packages/modules/animations/dist/behaviours/registry.js
	/**
	* Built-in behaviours, in declaration order. Add a behaviour here only when it
	* belongs to the framework itself; project-specific effects register at runtime.
	*/
	var ANIMATION_BEHAVIOURS = [
		typewriterBehaviour,
		staggerFadeBehaviour,
		fadeInBehaviour,
		scrambleBehaviour,
		countUpBehaviour,
		{
			type: "loading-placeholder",
			optionKey: "loadingPlaceholder",
			animate: ({ node, options, stopped, done }) => LoadingPlaceholderBehaviour.animate(node, options, () => done(), stopped)
		}
	];
	ANIMATION_BEHAVIOURS.map((b) => b.type);
	/**
	* Indexes a behaviour list by `type`.
	*
	* @throws {Error} On a duplicate type — silently keeping the last one hides a
	*   real configuration mistake (two packages claiming `animation="fade-in"`).
	*/
	function indexBehaviours(behaviours) {
		const index = /* @__PURE__ */ new Map();
		for (const behaviour of behaviours) {
			if (!behaviour?.type) throw new Error("[animations] A behaviour definition is missing its `type`.");
			if (index.has(behaviour.type)) throw new Error(`[animations] Duplicate animation behaviour: "${behaviour.type}".`);
			index.set(behaviour.type, behaviour);
		}
		return index;
	}
	// packages/modules/animations/dist/Animations.js
	var _behaviours = /* @__PURE__ */ new WeakMap();
	var _pendingScan = /* @__PURE__ */ new WeakMap();
	var _scanFrame = /* @__PURE__ */ new WeakMap();
	/**
	* AnimationsService — unified lifecycle and execution engine for declarative DOM animations.
	*
	* Implements tree-agnostic document-order sequencing, WeakMap/Map node tracking,
	* dynamic mutation discovery, and viewport intersection entry/exit management.
	*/
	var AnimationsService = class {
		constructor(config = {}) {
			_defineProperty(this, "globalDelay", void 0);
			_defineProperty(this, "config", void 0);
			_defineProperty(
				this,
				/** Registry of all active animation records keyed by element */
				"records",
				/* @__PURE__ */ new Map()
			);
			_defineProperty(
				this,
				/** Ordered list of chained elements per execution scope (e.g. fieldset, form, section) */
				"scopes",
				/* @__PURE__ */ new Map()
			);
			_defineProperty(
				this,
				/** Native DOM observers */
				"mutationObserver",
				null
			);
			_defineProperty(this, "viewObserver", null);
			_classPrivateFieldInitSpec(this, _behaviours, void 0);
			_classPrivateFieldInitSpec(this, _pendingScan, /* @__PURE__ */ new Set());
			_classPrivateFieldInitSpec(this, _scanFrame, null);
			_classPrivateFieldSet2(_behaviours, this, indexBehaviours([...ANIMATION_BEHAVIOURS, ...config.behaviours ?? []]));
			this.globalDelay = config.delay ?? 500;
			this.config = {
				typewriter: {
					loop: config.typewriter?.loop ?? false,
					interval: config.typewriter?.interval ?? 30,
					delay: config.typewriter?.delay ?? this.globalDelay,
					rewrite: config.typewriter?.rewrite ?? false
				},
				fade: { duration: config.fade?.duration ?? "0.5s" },
				staggerFade: {
					delay: config.staggerFade?.delay ?? 5e3,
					duration: config.staggerFade?.duration ?? "0.6s"
				},
				scramble: {
					chars: config.scramble?.chars ?? "!<>-_\\/[]{}—=+*^?#________",
					speed: config.scramble?.speed ?? 40
				},
				loadingPlaceholder: { duration: config.loadingPlaceholder?.duration ?? this.globalDelay },
				...config
			};
			this._observeMutations();
		}
		/**
		* Initializes the animation engine, scanning the target root and establishing observers.
		*/
		init(root = document.body) {
			this.scan(root);
			return this;
		}
		/**
		* Registers a behaviour at runtime, keyed by its `type`.
		*
		* Overrides an existing type deliberately: the engine keeps one definition per
		* attribute value, so a host can restyle `fade-in` without touching the DOM.
		*
		* @returns This service, for chaining.
		*/
		use(behaviour) {
			if (!behaviour?.type) throw new Error("[AnimationsService] A behaviour definition is missing its `type`.");
			_classPrivateFieldGet2(_behaviours, this).set(behaviour.type, behaviour);
			return this;
		}
		/** The `animation` attribute values this service can currently run. */
		get types() {
			return [..._classPrivateFieldGet2(_behaviours, this).keys()];
		}
		/**
		* Scans a subtree for elements with `[animation]` in document order and mounts them.
		*/
		scan(root = document.body) {
			if (!root || typeof root.querySelectorAll !== "function") return [];
			const nodes = [];
			if (root instanceof HTMLElement && root.hasAttribute("animation")) nodes.push(root);
			nodes.push(...Array.from(root.querySelectorAll("[animation]")));
			nodes.forEach((node) => this.mount(node));
			this.scopes.forEach((_, scope) => {
				if (this._inViewport(scope)) this._startScope(scope);
			});
			nodes.forEach((node) => {
				const rec = this.records.get(node);
				if (rec && !rec.chained && this._inViewport(node)) this.trigger(node);
			});
			return nodes;
		}
		/**
		* Mounts a single animated node into the registry and configures its initial state.
		*/
		mount(node) {
			if (this.records.has(node)) return;
			const type = node.getAttribute("animation") || "";
			if (!_classPrivateFieldGet2(_behaviours, this).has(type)) {
				console.warn(`[AnimationsService] Unknown animation type: "${type}"`);
				return;
			}
			const chained = node.getAttribute("animation-chain") === "true";
			const once = node.getAttribute("animated-once") === "true";
			const scope = this._scope(node);
			const snapshot = {
				opacity: node.style.opacity,
				pointerEvents: node.style.pointerEvents,
				html: node.innerHTML,
				text: node.textContent || ""
			};
			const record = {
				node,
				type,
				chained,
				once,
				played: false,
				scope,
				state: chained ? "waiting" : "idle",
				snapshot,
				controller: new AbortController()
			};
			if (chained) {
				let chainList = this.scopes.get(scope);
				if (!chainList) {
					chainList = [];
					this.scopes.set(scope, chainList);
				}
				if (!chainList.includes(node)) {
					chainList.push(node);
					chainList.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
				}
				if (chainList.indexOf(node) > 0 && type !== "fade-in" && type !== "typewriter") {
					node.style.opacity = "0";
					node.style.pointerEvents = "none";
				}
			}
			this.records.set(node, record);
			this.observe(node);
		}
		/**
		* Unmounts a node, canceling any active animation and cleaning up registry references.
		*/
		unmount(node) {
			const rec = this.records.get(node);
			if (!rec) return;
			this.stop(node);
			if (rec.chained) {
				const chainList = this.scopes.get(rec.scope);
				if (chainList) {
					const idx = chainList.indexOf(node);
					if (idx !== -1) chainList.splice(idx, 1);
					if (chainList.length === 0) {
						this.scopes.delete(rec.scope);
						this.viewObserver?.unobserve(rec.scope);
					}
				}
			} else this.viewObserver?.unobserve(node);
			this.records.delete(node);
		}
		/**
		* Observes a node or its host container for viewport visibility.
		*/
		observe(node) {
			this._ensureViewObserver();
			const rec = this.records.get(node);
			if (!rec) return;
			if (rec.chained) this.viewObserver?.observe(rec.scope);
			else this.viewObserver?.observe(node);
		}
		/**
		* Unobserves the element a record actually observes — for chained nodes that is
		* the scope container, not the node itself.
		*/
		unobserve(node) {
			if (!this.viewObserver) return;
			const rec = this.records.get(node);
			this.viewObserver.unobserve(rec?.chained ? rec.scope : node);
		}
		/**
		* Executes the appropriate animation behaviour for a node.
		*/
		trigger(node) {
			const rec = this.records.get(node);
			if (!rec) return;
			if (rec.once && rec.played) return;
			const behaviour = _classPrivateFieldGet2(_behaviours, this).get(rec.type);
			if (!behaviour) return;
			if (rec.state === "running") this.stop(node);
			rec.state = "running";
			rec.played = true;
			rec.controller = new AbortController();
			const signal = rec.controller.signal;
			this._release(node, rec.snapshot);
			const isStopped = () => signal.aborted || !node.isConnected;
			let reported = false;
			const done = (target) => {
				if (reported || rec.state !== "running") return;
				reported = true;
				rec.state = "done";
				this._dispatch(target ?? node, "animation:done");
				if (rec.chained) this.next(rec.scope);
			};
			const context = {
				node,
				options: this._optionsOf(behaviour),
				delay: this._delay(node),
				signal,
				stopped: isStopped,
				done
			};
			try {
				const result = behaviour.animate(context);
				if (result && typeof result.catch === "function") result.catch((error) => {
					if (!isStopped()) console.error(`[AnimationsService] Behaviour "${rec.type}" failed:`, error);
				});
			} catch (error) {
				console.error(`[AnimationsService] Behaviour "${rec.type}" failed:`, error);
				rec.state = "idle";
			}
		}
		/**
		* Advances a chain sequence in a scope by triggering the next waiting element in document order.
		*/
		next(scope) {
			const chain = this.scopes.get(scope);
			if (!chain || chain.length === 0) return;
			const nextNode = chain.find((n) => {
				const rec = this.records.get(n);
				return rec && (rec.state === "waiting" || rec.state === "idle");
			});
			if (!nextNode) {
				this._dispatch(scope, "animation:scope-done");
				return;
			}
			this.trigger(nextNode);
		}
		/**
		* Stops an active animation on a node.
		*/
		stop(node) {
			const rec = this.records.get(node);
			if (!rec) return;
			rec.controller.abort();
			if (rec.state === "running") rec.state = "idle";
			if (typeof node.getAnimations === "function") node.getAnimations().forEach((anim) => anim.cancel());
		}
		/**
		* Resets element(s) to initial state, enabling replay when the viewport or page is revisited.
		*/
		reset(target) {
			if (!target) {
				this.records.forEach((_, node) => this._resetNode(node));
				return;
			}
			if (target instanceof HTMLElement && this.records.has(target)) {
				this._resetNode(target);
				return;
			}
			this.records.forEach((_, node) => {
				if (target.contains(node) || target === node) this._resetNode(node);
			});
		}
		/**
		* Clears state for elements that have left the viewport or page. Alias for reset.
		*/
		clear(target) {
			this.reset(target);
		}
		/**
		* Releases loading placeholders frozen by lazy-loading anti-FOUC guards.
		*/
		release(root = document.body) {
			if (!root || typeof root.querySelectorAll !== "function") return;
			root.querySelectorAll("[animation=\"loading-placeholder\"]").forEach((node) => this.trigger(node));
		}
		/**
		* Backwards-compatibility alias for release().
		*/
		releaseLoadingPlaceholders(root = document.body) {
			this.release(root);
		}
		/**
		* Disconnects observers, stops all running animations, and clears internal maps.
		*/
		destroy() {
			if (this.mutationObserver) {
				this.mutationObserver.disconnect();
				this.mutationObserver = null;
			}
			if (this.viewObserver) {
				this.viewObserver.disconnect();
				this.viewObserver = null;
			}
			this.records.forEach((rec, node) => {
				rec.controller.abort();
				this.stop(node);
			});
			if (_classPrivateFieldGet2(_scanFrame, this) !== null) {
				cancelAnimationFrame(_classPrivateFieldGet2(_scanFrame, this));
				_classPrivateFieldSet2(_scanFrame, this, null);
			}
			_classPrivateFieldGet2(_pendingScan, this).clear();
			this.records.clear();
			this.scopes.clear();
		}
		_ensureViewObserver() {
			if (this.viewObserver) return;
			this.viewObserver = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					const target = entry.target;
					if (!target.isConnected) return;
					if (entry.isIntersecting) {
						if (this.scopes.has(target)) this._startScope(target);
						const rec = this.records.get(target);
						if (rec && !rec.chained && rec.state === "idle") this.trigger(target);
					} else if (this.records.has(target)) this.reset(target);
				});
			}, { threshold: 0 });
		}
		_startScope(scope) {
			const chain = this.scopes.get(scope);
			if (!chain || chain.length === 0) return;
			if (chain.some((n) => this.records.get(n)?.state === "running")) return;
			if (chain.every((n) => this.records.get(n)?.state === "done")) return;
			this.next(scope);
		}
		_resetNode(node) {
			const rec = this.records.get(node);
			if (!rec) return;
			if (rec.once && rec.played) return;
			this.stop(node);
			if (rec.chained) {
				rec.state = "waiting";
				node.style.opacity = "0";
				node.style.pointerEvents = "none";
			} else {
				rec.state = "idle";
				if (rec.snapshot.opacity !== "") node.style.opacity = rec.snapshot.opacity;
				else node.style.removeProperty("opacity");
				if (rec.snapshot.pointerEvents !== "") node.style.pointerEvents = rec.snapshot.pointerEvents;
				else node.style.removeProperty("pointer-events");
			}
			if (rec.type === "typewriter" && rec.snapshot.html !== void 0) {
				node.innerHTML = rec.snapshot.html;
				node.classList.remove("tw-writing");
			} else if (rec.type === "text-scramble" && rec.snapshot.text !== void 0) node.textContent = rec.snapshot.text;
			node.style.removeProperty("visibility");
		}
		_release(node, snapshot) {
			if (snapshot.pointerEvents !== "") node.style.pointerEvents = snapshot.pointerEvents;
			else node.style.removeProperty("pointer-events");
			if (snapshot.opacity !== "") node.style.opacity = snapshot.opacity;
			else node.style.removeProperty("opacity");
		}
		_scope(node) {
			return node.closest("fieldset, form, section, article, dialog, aside, header, footer, main, [data-animation-scope]") || document.body;
		}
		_inViewport(el) {
			const rect = el.getBoundingClientRect();
			return rect.bottom > 0 && rect.right > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.left < (window.innerWidth || document.documentElement.clientWidth) && rect.width > 0 && rect.height > 0;
		}
		_delay(node) {
			if (!node.hasAttribute("data-delay")) return this.globalDelay;
			const parsed = parseInt(node.getAttribute("data-delay") || "", 10);
			return Number.isFinite(parsed) ? parsed : this.globalDelay;
		}
		/**
		* Resolves a behaviour's options: definition defaults first, then the config
		* block for this behaviour (keyed by `optionKey`, else by `type`).
		*/
		_optionsOf(behaviour) {
			const key = behaviour.optionKey ?? behaviour.type;
			const provided = this.config[key];
			return {
				...behaviour.defaults ?? {},
				...provided ?? {}
			};
		}
		_dispatch(node, eventName, detail) {
			const event = new CustomEvent(eventName, {
				bubbles: true,
				composed: true,
				detail: {
					origin: node,
					...detail
				}
			});
			node.dispatchEvent(event);
		}
		_observeMutations() {
			this.mutationObserver = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					mutation.removedNodes.forEach((node) => {
						if (!(node instanceof HTMLElement)) return;
						if (this.records.has(node)) this.unmount(node);
						node.querySelectorAll("[animation]").forEach((child) => {
							this.unmount(child);
						});
					});
					mutation.addedNodes.forEach((node) => {
						if (!(node instanceof HTMLElement)) return;
						this._queueScan(node);
					});
				});
			});
			this.mutationObserver.observe(document.body, {
				childList: true,
				subtree: true
			});
		}
		/**
		* Batches added nodes into one scan.
		*
		* The previous implementation scheduled two animation frames *per node*, so a
		* single page swap queued hundreds of callbacks. Collecting the roots first
		* keeps the cost proportional to the number of mutations, not nodes.
		*/
		_queueScan(root) {
			_classPrivateFieldGet2(_pendingScan, this).add(root);
			if (_classPrivateFieldGet2(_scanFrame, this) !== null) return;
			_classPrivateFieldSet2(_scanFrame, this, requestAnimationFrame(() => {
				_classPrivateFieldSet2(_scanFrame, this, requestAnimationFrame(() => {
					_classPrivateFieldSet2(_scanFrame, this, null);
					const roots = [..._classPrivateFieldGet2(_pendingScan, this)];
					_classPrivateFieldGet2(_pendingScan, this).clear();
					roots.forEach((node) => {
						if (node.isConnected) this.scan(node);
					});
				}));
			}));
		}
	};
	_defineProperty(AnimationsService, "slot", "animation");
	// packages/kits/modules/index.ts
	var modules_exports = /* @__PURE__ */ __exportAll({
		AnimationsService: () => AnimationsService,
		EventEmitter: () => EventEmitter,
		HashRouter: () => HashRouter$1,
		HttpService: () => HttpService,
		ModuleLoader: () => ModuleLoader$1,
		ModuleRegistry: () => ModuleRegistry$1,
		ThemeRegistry: () => ThemeRegistry$1,
		ThemeRenderer: () => ThemeRenderer$1,
		resolveModuleDefinitions: () => resolveModuleDefinitions$1
	});
	// packages/components/pricing-card/PricingCard.ts
	var PricingCardBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — plan name, price, feature list and the action row, drawn with the
		* mandatory `@aio-ui/skeleton` primitive. One card only: the mockup is a picture of the
		* box, not a loop over the plans the payload happens to carry.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [
					{
						shape: "line",
						width: "45%"
					},
					{
						shape: "bone",
						width: "40%",
						height: "2.5rem"
					},
					{
						shape: "line",
						count: 4
					},
					{
						shape: "bone",
						height: "2.75rem"
					}
				]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "pricing-card");
			_defineProperty(this, "name", "pricing-card");
			_defineProperty(this, "stylesheet", "./PricingCard.css");
			_defineProperty(this, "rawDataNode", null);
			const defaultConfig = {
				themeId: "default",
				namespace: null,
				emit: () => {},
				selectors: {
					"@container": {
						tagName: "div",
						className: "row"
					},
					"@card": {
						tagName: "div",
						className: "card pricing",
						wrapper: ".column"
					},
					"@card>header": {
						tagName: "div",
						className: "header"
					},
					"@card>price": {
						tagName: "div",
						className: "item price-tag"
					},
					"@card>divider": {
						tagName: "hr",
						className: "divider"
					},
					"@card>body": {
						tagName: "div",
						className: "body"
					},
					"@card>body>item": {
						tagName: "li",
						className: "item"
					},
					"@card>actions": {
						tagName: "div",
						className: "actions"
					}
				}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		prepare(data, _config) {
			const container = this.render("@container", data);
			(Array.isArray(data) ? data : [data]).forEach((item) => {
				const card = this.render("@card", item);
				container?.append(card.__outer);
			});
			return this.load("@container");
		}
		/**
		* Nothing to hydrate here: a card group repeats `@card>actions` under one selector key, so
		* `load()` would only ever answer for the last card. The click handler is bound inside
		* `template()` on the node that actually renders the button.
		*/
		initialize() {}
		template(typeKey, el, payload) {
			if (typeKey === "@card" && !payload) return;
			switch (typeKey) {
				case "@card":
					const card = el.__inner ? el.__inner : el;
					if (payload.className) el.classList.add(...String(payload.className).split(" "));
					const headerText = payload.header ?? payload.title;
					if (headerText) {
						const header = this.render("@card>header", headerText);
						const divider = this.render("@card>divider");
						card.append(header, divider);
					}
					const bodyContent = payload.body || [];
					if (bodyContent.length > 0) {
						const body = this.render("@card>body", bodyContent);
						card.append(body);
					}
					if (payload.price !== void 0 && payload.price !== null) {
						const price = this.render("@card>price", payload.price);
						const actions = this.render("@card>actions", {
							featured: payload.featured ?? String(payload.className ?? "").split(" ").includes("is-featured"),
							label: payload.action?.label ?? payload.label,
							onClick: payload.onClick
						});
						const dividerBottom = this.render("@card>divider");
						dividerBottom.style.marginBottom = "0";
						card.append(price, dividerBottom, actions);
					}
					break;
				case "@card>header":
					const eyebrow = document.createElement("span");
					eyebrow.textContent = payload;
					el.appendChild(eyebrow);
					break;
				case "@card>body":
					const features = document.createElement("ul");
					features.className = "features";
					for (const i of payload) {
						const li = this.render("@card>body>item", i);
						features.appendChild(li);
					}
					el.appendChild(features);
					break;
				case "@card>price":
					const content = `Mulai dari <strong>${new Intl.NumberFormat("id-ID", {
						style: "currency",
						currency: "IDR",
						currencyDisplay: "symbol"
					}).format(payload)}</strong> / pax`;
					el.insertAdjacentHTML("afterbegin", content);
					el.style.marginBottom = "1.5em";
					break;
				case "@card>body>item":
					el.textContent = payload?.title ?? "";
					if (payload && payload.className) el.classList.add(payload.className);
					break;
				case "@card>actions": {
					const button = document.createElement("button");
					button.type = "button";
					button.className = "button";
					button.textContent = payload?.label ?? "Pilih";
					if (payload?.featured) button.classList.add("primary");
					if (typeof payload?.onClick === "function") button.addEventListener("click", payload.onClick);
					el.appendChild(button);
					break;
				}
			}
		}
	};
	_defineProperty(PricingCardBuilder, "contract", {
		schema: {
			t: "list",
			single: true,
			of: {
				t: "record",
				open: true,
				of: {
					header: { t: "string" },
					price: { t: "number" },
					body: {
						t: "list",
						of: {
							t: "record",
							open: true,
							of: {
								title: { t: "string" },
								value: { t: "string" }
							}
						}
					},
					className: { t: "string" }
				}
			}
		},
		example: [{
			header: "Basic",
			price: 25e4,
			body: [{ title: "1 project" }]
		}]
	});
	// packages/components/pricing-card/index.ts
	var pricing_card_exports = /* @__PURE__ */ __exportAll({ PricingCardBuilder: () => PricingCardBuilder });
	// packages/components/product/Product.kit.ts
	var DEFAULT_SELECTORS$2 = { "@product": {
		tagName: "div",
		className: "product"
	} };
	// packages/components/product/ProductDetail.kit.ts
	var DEFAULT_SELECTORS$1 = {
		"@detail": {
			tagName: "article",
			className: "product-detail"
		},
		"@detail>media": {
			tagName: "div",
			className: "product-detail-media"
		},
		"@detail>media>image": {
			tagName: "img",
			className: "product-detail-image"
		},
		"@detail>body": {
			tagName: "div",
			className: "product-detail-body"
		},
		"@detail>body>eyebrow": {
			tagName: "div",
			className: "product-detail-eyebrow"
		},
		"@detail>body>title": {
			tagName: "h2",
			className: "product-detail-title"
		},
		"@detail>body>desc": {
			tagName: "p",
			className: "product-detail-desc"
		},
		"@detail>body>price": {
			tagName: "div",
			className: "product-detail-price"
		},
		"@detail>body>colors": {
			tagName: "div",
			className: "product-detail-colors"
		},
		"@detail>body>colors>item": {
			tagName: "button",
			className: "product-detail-color"
		},
		"@detail>body>actions": {
			tagName: "div",
			className: "product-detail-actions"
		},
		"@detail>body>actions>back": {
			tagName: "button",
			className: "product-detail-back"
		},
		"@detail>body>actions>checkout": {
			tagName: "button",
			className: "button primary product-detail-checkout"
		}
	};
	// packages/components/product/ProductDetail.engine.ts
	/** One record, accepting the `artwork.src` shape from the Sheets data as well as `imageUrl`. */
	function normalizeProduct(data) {
		return data && typeof data === "object" ? data : {};
	}
	/** The image of a record: per-colour artwork wins, then the product artwork. */
	function imageOf(record, color) {
		return color?.imageUrl ?? color?.src ?? record.artwork?.src ?? record.imageUrl ?? record.image ?? record.src ?? "";
	}
	/** `85000` → `Rp 85.000`; a string is passed through untouched. */
	function formatPrice(value, currency = "Rp") {
		if (value === void 0 || value === null || value === "") return "";
		if (typeof value === "string") return value;
		return `${currency} ${value.toLocaleString("id-ID")}`;
	}
	// packages/components/product/ProductDetail.ts
	var ProductDetailBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — the detail column top to bottom: media, eyebrow, title, copy, price,
		* swatch row and checkout. Drawn with the mandatory `@aio-ui/skeleton` primitive, so it
		* never waits for `ProductDetail.css` (the sheet it is standing in for).
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [
					{
						shape: "bone",
						aspect: "1 / 1"
					},
					{
						shape: "line",
						width: "25%"
					},
					{
						shape: "bone",
						width: "70%",
						height: "1.75rem"
					},
					{
						shape: "line",
						count: 2
					},
					{
						shape: "bone",
						width: "30%",
						height: "1.4rem"
					},
					{
						shape: "row",
						gap: "0.5rem",
						children: [{
							shape: "circle",
							width: "1.5rem",
							count: 4
						}]
					},
					{
						shape: "bone",
						height: "2.75rem"
					}
				]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "product-detail");
			_defineProperty(this, "name", "product-detail");
			_defineProperty(this, "stylesheet", "./ProductDetail.css");
			_defineProperty(this, "config", void 0);
			_defineProperty(this, "record", {});
			_defineProperty(this, "selectedColor", void 0);
			_defineProperty(this, "handleClick", (event) => {
				const target = event.target;
				const colorButton = target.closest(".product-detail-color");
				if (colorButton) {
					this.selectColor(Number(colorButton.dataset.index ?? 0));
					return;
				}
				if (target.closest(".product-detail-back")) {
					this.config.onBack();
					return;
				}
				if (target.closest(".product-detail-checkout")) this.config.onAddToCart({
					product: this.record,
					color: this.selectedColor
				});
			});
			const defaultConfig = {
				themeId: "default",
				selectors: DEFAULT_SELECTORS$1,
				namespace: null,
				emit: () => {},
				buttonText: "Add to cart",
				backText: "Back to products",
				onAddToCart: () => {},
				onBack: () => {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		prepare(data) {
			const record = normalizeProduct(data);
			this.record = record;
			const colors = Array.isArray(record.colors) ? record.colors : [];
			this.selectedColor = colors[0];
			const detail = this.render("@detail", record);
			const media = this.render("@detail>media", record);
			if (media) {
				const image = this.render("@detail>media>image", {
					...record,
					src: imageOf(record, this.selectedColor)
				});
				if (image) media.appendChild(image);
				detail?.appendChild(media);
			}
			const body = this.render("@detail>body", record);
			if (body) {
				if (record.category || record.name) {
					const eyebrow = this.render("@detail>body>eyebrow", record);
					if (eyebrow) body.appendChild(eyebrow);
				}
				const title = this.render("@detail>body>title", record);
				if (title) body.appendChild(title);
				if (record.description) {
					const desc = this.render("@detail>body>desc", record);
					if (desc) body.appendChild(desc);
				}
				const price = this.render("@detail>body>price", record);
				if (price) body.appendChild(price);
				if (colors.length) {
					const group = this.render("@detail>body>colors", record);
					if (group) {
						colors.forEach((color, index) => {
							const item = this.render("@detail>body>colors>item", {
								...color,
								index,
								active: index === 0
							});
							if (item) group.appendChild(item);
						});
						body.appendChild(group);
					}
				}
				const actions = this.render("@detail>body>actions", record);
				if (actions) {
					const back = this.render("@detail>body>actions>back", record);
					if (back) actions.appendChild(back);
					const checkout = this.render("@detail>body>actions>checkout", record);
					if (checkout) actions.appendChild(checkout);
					body.appendChild(actions);
				}
				detail?.appendChild(body);
			}
			return this.load("@detail");
		}
		template(typeKey, el, payload) {
			switch (typeKey) {
				case "@detail":
					if (payload?.uid) el.dataset.uid = String(payload.uid);
					break;
				case "@detail>media>image": {
					const img = el;
					img.src = encodeURI(payload?.src ?? "");
					img.alt = payload?.title ?? payload?.name ?? "";
					img.loading = "lazy";
					img.decoding = "async";
					break;
				}
				case "@detail>body>eyebrow":
					el.textContent = payload?.category ?? payload?.name ?? "";
					break;
				case "@detail>body>title":
					el.textContent = payload?.title ?? payload?.name ?? "";
					break;
				case "@detail>body>desc":
					el.textContent = payload?.description ?? "";
					break;
				case "@detail>body>price":
					el.textContent = formatPrice(payload?.price, payload?.currency);
					break;
				case "@detail>body>colors>item": {
					const color = payload;
					el.setAttribute("type", "button");
					el.setAttribute("role", "radio");
					el.setAttribute("aria-checked", String(Boolean(color.active)));
					el.setAttribute("aria-label", color.name || color.value || "colour");
					el.title = color.name || color.value || "";
					el.dataset.index = String(color.index);
					el.classList.toggle("active", Boolean(color.active));
					if (color.value) el.style.backgroundColor = color.value;
					break;
				}
				case "@detail>body>actions>back":
					el.setAttribute("type", "button");
					el.textContent = this.config.backText;
					break;
				case "@detail>body>actions>checkout":
					el.setAttribute("type", "button");
					el.textContent = this.config.buttonText;
			}
		}
		initialize(root) {
			const detail = root ?? this.load("@detail");
			if (!detail) return;
			detail.addEventListener("click", this.handleClick);
		}
		/** Swap the selected colour and re-point the media at that colour's artwork. */
		selectColor(index) {
			const color = (Array.isArray(this.record.colors) ? this.record.colors : [])[index];
			if (!color) return;
			this.selectedColor = color;
			const detail = this.load("@detail");
			detail?.querySelectorAll(".product-detail-color").forEach((node, nodeIndex) => {
				const active = nodeIndex === index;
				node.classList.toggle("active", active);
				node.setAttribute("aria-checked", String(active));
			});
			const image = detail?.querySelector(".product-detail-image");
			if (image) image.src = encodeURI(imageOf(this.record, color));
		}
	};
	// packages/components/product/ProductCard.ts
	var _item = /* @__PURE__ */ new WeakMap();
	var ProductCardBuilder = class extends Builder$1 {
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "product-card");
			_defineProperty(this, "name", "product-card");
			_defineProperty(this, "stylesheet", "./ProductCard.css");
			_defineProperty(this, "currentDisplayIndex", 0);
			_defineProperty(this, "autoplayTimer", void 0);
			_defineProperty(this, "_boundKeyDownHandler", void 0);
			_classPrivateFieldInitSpec(this, _item, {});
			const defaultConfig = {
				id: "",
				optionShape: "round",
				showCaption: true,
				animation: "fade",
				autoplay: true,
				duration: 3e3,
				pauseOnHover: true,
				mode: "auto",
				buttonText: "Add To Card",
				themeId: "default",
				selectors: {
					"@product": {
						tagName: "div",
						className: "product"
					},
					"@product>display": {
						tagName: "div",
						className: "display"
					},
					"@product>display>image": {
						tagName: "img",
						className: "img-fluid product-shadow-blend"
					},
					"@product>options": {
						tagName: "div",
						className: "option"
					},
					"@product>options>item": {
						tagName: "div",
						className: "item"
					},
					"@product>price": {
						tagName: "div",
						className: "price"
					},
					"@product>caption": {
						tagName: "div",
						className: "caption"
					},
					"@product>caption>title": {
						tagName: "div",
						className: "title"
					},
					"@product>caption>desc": {
						tagName: "div",
						className: "desc"
					},
					"@product>checkout": {
						tagName: "button",
						className: "button primary btn-checkout"
					}
				},
				onSelected: () => {},
				onCheckout: () => {},
				namespace: null,
				emit: () => {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		/**
		* 👑 PINTU 1: THE PREPARE ENGINE (SILSILAH COMPOSITION RAJUTAN DOM LINEAR)
		*/
		prepare(content, _config) {
			const rawItem = content ?? {};
			this.currentDisplayIndex = 0;
			_classPrivateFieldSet2(_item, this, rawItem);
			return this.render("@product", rawItem);
		}
		/**
		* 👑 PINTU 2: THE TEMPLATE DRIVER (POS RIAS PENYUAPAN TEKS & TRIK CSS WARNA ANDA)
		*/
		template(typeKey, el, payload) {
			switch (typeKey) {
				case "@product": {
					el.classList.add(`mode-${this.config.mode}`.trim());
					const item = payload || {};
					const displayWrapper = this.render("@product>display", item);
					const displayImage = this.render("@product>display>image", item);
					if (displayImage && displayWrapper) displayWrapper.appendChild(displayImage);
					if (displayWrapper) el.appendChild(displayWrapper);
					const variants = Array.isArray(item.variants) ? item.variants : [];
					if (variants.length > 0) {
						const optionsContainer = this.render("@product>options", {
							variants,
							onSelect: (idx) => {
								this.navigate(idx, el);
							}
						});
						if (optionsContainer) el.appendChild(optionsContainer);
					}
					if (this.config.showCaption) {
						const captionContainer = this.render("@product>caption", item);
						if (captionContainer) el.appendChild(captionContainer);
					}
					const priceTag = this.render("@product>price", item);
					if (priceTag) el.appendChild(priceTag);
					const checkoutBtn = this.render("@product>checkout", item);
					if (checkoutBtn) {
						checkoutBtn.onclick = (e) => {
							e.stopPropagation();
							this.checkout();
						};
						el.appendChild(checkoutBtn);
					}
					break;
				}
				case "@product>display":
					el.style.transition = `background-color ${this.config.duration * .15}ms ease`;
					break;
				case "@product>display>image": {
					const img = el;
					img.src = `/${(payload?.variants?.[0])?.imageUrl || payload?.imageUrl || ""}`;
					img.alt = payload?.title || "product-thumbnail";
					break;
				}
				case "@product>options":
					(Array.isArray(payload?.variants) ? payload.variants : []).forEach((variantObj, idx) => {
						const itemBtn = this.render("@product>options>item", {
							...variantObj,
							index: idx,
							onSelect: payload?.onSelect
						});
						if (itemBtn) el.appendChild(itemBtn);
					});
					break;
				case "@product>options>item":
					el.setAttribute("role", "radio");
					el.setAttribute("aria-checked", payload?.index === 0 ? "true" : "false");
					el.setAttribute("tabindex", payload?.index === 0 ? "0" : "-1");
					if (typeof payload?.onSelect === "function") el.onclick = (e) => {
						e.stopPropagation();
						payload.onSelect(payload.index);
					};
					if (payload?.color) {
						el.style.backgroundColor = payload.color;
						el.setAttribute("title", payload.name || payload.color);
					}
					el.className = `option-bubble shape-${this.config.optionShape} ${el.className || ""}`.trim();
					break;
				case "@product>caption": {
					const title = this.render("@product>caption>title", payload);
					const desc = this.render("@product>caption>desc", payload);
					if (title) el.appendChild(title);
					if (desc) el.appendChild(desc);
					break;
				}
				case "@product>caption>title":
					el.textContent = payload?.title || "";
					break;
				case "@product>caption>desc":
					el.textContent = payload?.description || payload?.desc || "";
					break;
				case "@product>price":
					el.textContent = typeof payload === "object" ? payload.price || "Rp 0" : String(payload);
					break;
				case "@product>checkout": el.textContent = this.config.buttonText || "Add to Cart";
			}
		}
		/**
		* 🪶 LOADING MOCKUP — the card's silhouette, composed from the mandatory
		* `@aio-ui/skeleton` primitive.
		*
		* The skin has to exist before `ProductCard.css` does, so it cannot come from this
		* component's sheet; precision comes from the spec instead — the display box reserves the
		* same square, the swatch row mirrors the real variants, the caption keeps two lines and
		* the button keeps its height. No `render()`, no node records, no payload loop.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [
					{
						shape: "bone",
						aspect: "1 / 1"
					},
					{
						shape: "row",
						gap: "0.5rem",
						children: [
							{
								shape: "circle",
								width: "1.25rem"
							},
							{
								shape: "circle",
								width: "1.25rem"
							},
							{
								shape: "circle",
								width: "1.25rem"
							}
						]
					},
					{
						shape: "line",
						width: "62%"
					},
					{
						shape: "line",
						width: "88%"
					},
					{
						shape: "bone",
						width: "35%",
						height: "1.1rem"
					},
					{
						shape: "bone",
						height: "2.5rem"
					}
				]
			});
		}
		/**
		* 👑 PINTU 3: THE INITIALIZE DETONATOR (SUCI BERSIH SETIPIS SILET)
		*/
		initialize(_el, _payload, _context) {
			const productRoot = _el || this.load("@product");
			const optionsWrapper = this.load("@product>options");
			if (!productRoot) return;
			if (optionsWrapper) {
				this._boundKeyDownHandler = (e) => this._handleKeyDown(e, _el);
				optionsWrapper.addEventListener("keydown", this._boundKeyDownHandler);
			}
			this.navigate(0, _el);
			if (this.config.autoplay) {
				this.play(_el);
				if (this.config.pauseOnHover) {
					productRoot.addEventListener("mouseenter", () => {
						if (this.autoplayTimer) {
							window.clearInterval(this.autoplayTimer);
							this.autoplayTimer = void 0;
						}
					});
					productRoot.addEventListener("mouseleave", () => {
						this.play();
					});
				}
			}
		}
		unmount() {
			if (this.autoplayTimer) {
				window.clearInterval(this.autoplayTimer);
				this.autoplayTimer = void 0;
			}
			const optionsWrapper = this.load("@product>options");
			if (optionsWrapper && this._boundKeyDownHandler) optionsWrapper.removeEventListener("keydown", this._boundKeyDownHandler);
			this.destroy();
		}
		navigate(index, productRoot) {
			const variants = _classPrivateFieldGet2(_item, this).variants || [];
			if (!variants.length) return;
			const targetIndex = (index + variants.length) % variants.length;
			productRoot._currentDisplayIndex = targetIndex;
			this.currentDisplayIndex = targetIndex;
			const displayBox = productRoot.querySelector(".display");
			const displayImg = productRoot.querySelector(".img-fluid");
			const buttons = productRoot.querySelectorAll(".option-bubble");
			const activeVariant = variants[targetIndex];
			if (!activeVariant) return;
			buttons.forEach((btn, idx) => {
				btn.classList.toggle("active", idx === targetIndex);
			});
			if (displayBox && displayImg) {
				displayImg.style.opacity = "0.3";
				setTimeout(() => {
					if (activeVariant.color) displayBox.style.backgroundColor = activeVariant.color;
					if (activeVariant.src) displayImg.src = encodeURI(activeVariant.src);
					displayImg.style.opacity = "1";
				}, 80);
			}
			if (typeof this.config.onSelected === "function") this.config.onSelected(activeVariant);
		}
		_handleKeyDown(e, el) {
			const buttons = el.querySelectorAll(".option-bubble");
			if (!buttons || !buttons.length) return;
			let nextIndex = this.currentDisplayIndex;
			if (e.key === "ArrowRight") nextIndex = (this.currentDisplayIndex + 1) % buttons.length;
			else if (e.key === "ArrowLeft") nextIndex = (this.currentDisplayIndex - 1 + buttons.length) % buttons.length;
			else if (e.key === "Home") nextIndex = 0;
			else if (e.key === "End") nextIndex = buttons.length - 1;
			else if (e.key === "ArrowDown") nextIndex = (this.currentDisplayIndex + 1) % buttons.length;
			else if (e.key === "ArrowUp") nextIndex = (this.currentDisplayIndex - 1 + buttons.length) % buttons.length;
			else if (e.key === "Home") nextIndex = 0;
			else if (e.key === "End") nextIndex = buttons.length - 1;
			else return;
			e.preventDefault();
			buttons[nextIndex].focus();
			this.navigate(nextIndex, el);
		}
		play(el) {
			const variants = _classPrivateFieldGet2(_item, this).variants || [];
			if (!variants || variants.length <= 1) return;
			if (this.autoplayTimer) window.clearInterval(this.autoplayTimer);
			this.autoplayTimer = window.setInterval(() => {
				this.navigate(this.currentDisplayIndex + 1, el);
			}, this.config.duration);
		}
		checkout() {
			const selectedVariant = (_classPrivateFieldGet2(_item, this).variants || [])[this.currentDisplayIndex] || {};
			const checkoutPackagePayload = {
				productId: _classPrivateFieldGet2(_item, this).id,
				productTitle: _classPrivateFieldGet2(_item, this).title,
				selectedVariant,
				price: _classPrivateFieldGet2(_item, this).price
			};
			if (typeof this.config.onCheckout === "function") this.config.onCheckout(checkoutPackagePayload);
			if (this.config.emit && typeof this.config.emit === "function") this.config.emit("elementChanged", {
				builder: this.builderId,
				type: "@product:checkout",
				element: this.load("@product>checkout"),
				data: checkoutPackagePayload
			});
		}
	};
	// packages/components/product/ProductGrid.engine.ts
	/**
	* ProductGrid — engine.
	*
	* `normalizeProducts` — collection shape.
	*
	* Not published: `index.ts` is the only entry and does not mention this file.
	*/
	/** `[...]` or `{ data: [...] }` — the registry hands the payload directly, no `{ content }` envelope. */
	function normalizeProducts(data) {
		if (Array.isArray(data)) return data.filter(Boolean);
		if (Array.isArray(data?.data)) return data.data.filter(Boolean);
		return [];
	}
	// packages/components/product/ProductGrid.ts
	var ProductGridBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — three cards of the grid's own aspect, drawn with the mandatory
		* `@aio-ui/skeleton` primitive. Counting the real products would be a second render;
		* three boards are enough to reserve the row.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "row",
				gap: "1rem",
				children: [{
					shape: "bone",
					width: "30%",
					aspect: "3 / 4",
					count: 3
				}]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "product-card-grid");
			_defineProperty(this, "name", "product-card-grid");
			_defineProperty(this, "stylesheet", "./ProductGrid.css");
			_defineProperty(this, "config", void 0);
			const defaultConfig = {
				themeId: "default",
				namespace: null,
				emit: () => {},
				selectors: {
					"@grid": {
						tagName: "section",
						className: "grid"
					},
					"@grid>container": {
						tagName: "div",
						className: "row full-width"
					}
				},
				card: {},
				onOpen: () => {},
				onCheckout: () => {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		/**
		* 👑 PINTU PREPARE: Melumat array massal kiriman dari ProductController pusat
		*/
		prepare(data) {
			const list = normalizeProducts(data);
			const gridRoot = this.render("@grid", list);
			const container = this.render("@grid>container", list);
			list.forEach((productData) => {
				const cardComponent = new ProductCardBuilder({
					optionShape: "round",
					autoplay: false,
					duration: 3500,
					mode: "auto",
					...this.config.card
				});
				const rawFabrics = Array.isArray(productData.colors) ? productData.colors : [];
				const baseImage = productData.imageUrl || productData.src || productData.artwork?.src || "";
				const mappedVariants = rawFabrics.map((color) => ({
					name: color.name,
					color: color.value,
					imageUrl: color.imageUrl || baseImage,
					src: color.imageUrl || baseImage
				}));
				const productItem = {
					id: productData.uid || `prod-${Math.random().toString(36).substring(7)}`,
					title: productData.title || productData.name || "T-Shirt",
					description: productData.description || "",
					imageUrl: baseImage,
					price: typeof productData.price === "number" ? `Rp ${productData.price.toLocaleString("id-ID")}` : String(productData.price ?? ""),
					variants: mappedVariants
				};
				const cardDOMElement = cardComponent.create({ content: productItem });
				if (cardDOMElement instanceof HTMLElement && container) {
					cardDOMElement.dataset.uid = productItem.id;
					cardDOMElement.addEventListener("click", () => this.config.onOpen(productData));
					container.appendChild(cardDOMElement);
				}
			});
			if (container && gridRoot) gridRoot.appendChild(container);
			return this.load("@grid");
		}
		template(_typeKey, _el, _payload) {}
		initialize() {}
	};
	// packages/components/product/ProductBuilder.ts
	/** The sub-modules this component owns. Hosts pass this to `register`. */
	function productModules() {
		return [{
			id: "grid",
			scope: "grid",
			path: "@aio-ui/product",
			export: "ProductGridBuilder",
			stylesheet: "@aio-ui/product/ProductGrid.css"
		}, {
			id: "detail",
			scope: "detail",
			path: "@aio-ui/product",
			export: "ProductDetailBuilder",
			stylesheet: "@aio-ui/product/ProductDetail.css"
		}];
	}
	var _host = /* @__PURE__ */ new WeakMap();
	var _list = /* @__PURE__ */ new WeakMap();
	var _ProductBuilder_brand = /* @__PURE__ */ new WeakSet();
	var ProductBuilder = class extends Builder$1 {
		constructor(config = {}) {
			super();
			_classPrivateMethodInitSpec(this, _ProductBuilder_brand);
			_defineProperty(this, "builderId", "product");
			_defineProperty(this, "name", "product");
			_defineProperty(
				this,
				/** No sheet of its own: the wrapper is one class, and each view brings its stylesheet. */
				"stylesheet",
				""
			);
			_classPrivateFieldInitSpec(this, _host, null);
			_classPrivateFieldInitSpec(this, _list, []);
			const defaultConfig = {
				themeId: "default",
				namespace: null,
				emit: () => {},
				selectors: DEFAULT_SELECTORS$2,
				view: "grid",
				grid: {},
				detail: {},
				onOpen: () => {},
				onBack: () => {},
				onAddToCart: () => {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		prepare(data) {
			const content = data ?? {};
			const items = _assertClassBrand(_ProductBuilder_brand, this, _items$1).call(this, content);
			const record = content?.record ?? content?.product ?? null;
			const host = this.render("@product", content);
			if (!host) throw new Error("[ProductBuilder] @product did not render; check the selector map.");
			_classPrivateFieldSet2(_host, this, host);
			_classPrivateFieldSet2(_list, this, items);
			if (this.config.view === "detail" || !items.length && record) _assertClassBrand(_ProductBuilder_brand, this, _showDetail).call(this, host, record ?? items[0]);
			else _assertClassBrand(_ProductBuilder_brand, this, _showGrid).call(this, host, items);
			return host;
		}
		/** The composition root renders no text of its own — the views do. */
		template() {}
		initialize() {}
		/** Re-renders the list — a filter changed, or the shopper came back. */
		showList(items) {
			if (!_classPrivateFieldGet2(_host, this)) return;
			_assertClassBrand(_ProductBuilder_brand, this, _showGrid).call(this, _classPrivateFieldGet2(_host, this), items);
		}
	};
	/** Accepts an array, a named collection, or the raw `{ data: [...] }` envelope. */
	function _items$1(content) {
		if (Array.isArray(content)) return content.filter(Boolean);
		for (const key of [
			"items",
			"products",
			"data"
		]) if (Array.isArray(content?.[key])) return content[key].filter(Boolean);
		return [];
	}
	function _showGrid(host, items) {
		const grid = new ((this.module("grid")) ?? ProductGridBuilder)({
			...this.config.grid,
			themeId: this.config.themeId,
			namespace: this.config.namespace,
			emit: this.config.emit,
			onOpen: (product) => {
				this.config.onOpen(product);
				_assertClassBrand(_ProductBuilder_brand, this, _showDetail).call(this, host, product);
			}
		});
		_classPrivateFieldSet2(_list, this, items);
		const renderedGrid = grid.create({ content: items });
		if (this.host("grid")) this.project("grid", renderedGrid);
		else host.replaceChildren(renderedGrid);
		this.config.emit?.("elementChanged", {
			builder: this.builderId,
			type: "@product>grid",
			element: renderedGrid,
			data: { count: items.length }
		});
	}
	function _showDetail(host, record) {
		const renderedDetail = new ((this.module("detail")) ?? ProductDetailBuilder)({
			...this.config.detail,
			themeId: this.config.themeId,
			namespace: this.config.namespace,
			emit: this.config.emit,
			onBack: () => {
				this.config.onBack?.();
				this.showList(_classPrivateFieldGet2(_list, this));
			},
			onAddToCart: (payload) => {
				this.config.onAddToCart?.(payload);
				this.config.emit?.("elementChanged", {
					builder: this.builderId,
					type: "@product>cart",
					element: host,
					data: payload
				});
			}
		}).create({ content: record });
		if (this.host("detail")) this.project("detail", renderedDetail);
		else host.replaceChildren(renderedDetail);
		this.config.emit?.("elementChanged", {
			builder: this.builderId,
			type: "@product>detail",
			element: renderedDetail,
			data: { record }
		});
	}
	_defineProperty(ProductBuilder, "contract", {
		schema: {
			t: "union",
			of: [
				{
					t: "list",
					of: {
						t: "record",
						open: true
					}
				},
				{
					t: "record",
					open: true,
					of: { record: {
						t: "record",
						open: true
					} }
				},
				{
					t: "record",
					open: true,
					of: { items: {
						t: "list",
						of: {
							t: "record",
							open: true
						}
					} }
				}
			]
		},
		example: { items: [{
			id: "p1",
			title: "T-shirt",
			price: 12e4,
			image: "p1.png"
		}] }
	});
	// packages/components/product/index.ts
	var product_exports = /* @__PURE__ */ __exportAll({
		ProductBuilder: () => ProductBuilder,
		ProductCardBuilder: () => ProductCardBuilder,
		ProductDetailBuilder: () => ProductDetailBuilder,
		ProductGridBuilder: () => ProductGridBuilder,
		productModules: () => productModules
	});
	// packages/components/rating/Rating.ts
	var RatingBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — five stars over the numeric bar, drawn with the mandatory
		* `@aio-ui/skeleton` primitive. The score is data; the silhouette is the widget.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [{
					shape: "row",
					gap: "0.25rem",
					children: [{
						shape: "bone",
						width: "1.25rem",
						height: "1.25rem",
						count: 5
					}]
				}, {
					shape: "line",
					width: "60%"
				}]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "rating");
			_defineProperty(this, "name", "rating");
			_defineProperty(this, "stylesheet", "");
			_defineProperty(this, "config", void 0);
			const defaultConfig = {
				themeId: "default",
				type: "count-up",
				max: 5,
				animate: true,
				selectors: {
					"@container": {
						tagName: "div",
						className: "rating-widget-wrapper"
					},
					"@rating": {
						tagName: "div",
						className: "rating-core-display"
					},
					"@rating>track": {
						tagName: "div",
						className: "bar-track"
					},
					"@rating>fill": {
						tagName: "div",
						className: "bar-fill"
					},
					"@rating>label": {
						tagName: "span",
						className: "rating-numerical-label"
					},
					"@rating>stars-group": {
						tagName: "div",
						className: "stars-row"
					},
					"@rating>stars-item": {
						tagName: "span",
						className: "star-icon"
					}
				},
				namespace: null,
				emit: () => {}
			};
			this.config = {
				...defaultConfig,
				...config
			};
		}
		/**
		* 👑 THE POLYMORPHIC RATING COMPILER
		* Membaca properti config.type JIT untuk merakit organ tubuh secara otonom!
		*/
		prepare(data) {
			const score = typeof data === "number" ? data : data.value || 0;
			const container = this.render("@container", { score });
			const coreWidget = this.render("@rating", { score });
			if (this.config.type === "star") {
				const starsGroup = this.render("@rating>stars-group", { score });
				for (let i = 1; i <= this.config.max; i++) {
					const isFull = i <= Math.floor(score);
					const isHalf = !isFull && i - score < 1 && i - score > 0;
					const starItem = this.render("@rating>stars-item", {
						isFull,
						isHalf,
						index: i
					});
					if (starItem && starsGroup) starsGroup.appendChild(starItem);
				}
				if (starsGroup) coreWidget?.appendChild(starsGroup);
			} else if (this.config.type === "line-bar" || this.config.type === "round-bar") {
				const track = this.render("@rating>track", { score });
				const fill = this.render("@rating>fill", { score });
				if (track && fill) {
					track.appendChild(fill);
					coreWidget?.appendChild(track);
				}
			}
			const label = this.render("@rating>label", { score });
			if (label) coreWidget?.appendChild(label);
			if (container && coreWidget) container.appendChild(coreWidget);
			return this.load("@container");
		}
		/**
		* 👑 ULTRA-CLEAN HYDRATION VALVE
		* 0% Teks XML Markup! Murni hanya bertugas mengelola status kelas logika (Class State Driver).
		*/
		template(typeKey, el, payload) {
			if (!payload) return;
			const ratio = Math.min(Math.max(payload.score / this.config.max, 0), 1);
			const percentage = Math.round(ratio * 100);
			switch (typeKey) {
				case "@container":
					el.classList.add("rating-widget-wrapper", `type-${this.config.type}`);
					break;
				case "@rating>track":
					el.style.setProperty("--progress-ratio", ratio.toString());
					el.style.setProperty("--progress-percent", `${percentage}%`);
					break;
				case "@rating>fill":
					if (this.config.type === "line-bar") {
						el.style.width = this.config.animate ? "0%" : `${percentage}%`;
						if (this.config.animate) window.requestAnimationFrame(() => {
							el.style.width = `${percentage}%`;
						});
					}
					break;
				case "@rating>stars-item":
					if (payload.isFull) el.className = `${el.className} star-full`.trim();
					else if (payload.isHalf) el.className = `${el.className} star-half`.trim();
					else el.className = `${el.className} star-empty`.trim();
					break;
				case "@rating>label": if (this.config.type === "count-up" || this.config.type === "round-bar" || this.config.type === "line-bar") el.textContent = `${percentage}%`;
				else el.textContent = `${payload.score} / ${this.config.max}`;
			}
		}
		/**
		* 👑 THE ENCAPSULATED INTERACTIVE EVENT BINDINGS
		* Mengatur detonasi jiwa interaksi, seperti efek animasi Count-Up angka persentase secara live.
		*/
		initialize() {
			const label = this.load("@rating>label");
			if (this.config.type === "count-up" && this.config.animate && label) {
				const targetPercent = parseInt(label.textContent || "0", 10);
				if (isNaN(targetPercent) || targetPercent === 0) return;
				let currentCount = 0;
				label.textContent = "0%";
				const stepDuration = Math.max(Math.floor(1500 / targetPercent), 10);
				const counterTimer = window.setInterval(() => {
					currentCount++;
					label.textContent = `${currentCount}%`;
					if (currentCount >= targetPercent) window.clearInterval(counterTimer);
				}, stepDuration);
				label._activeCountTimer = counterTimer;
			}
		}
	};
	_defineProperty(RatingBuilder, "contract", {
		schema: {
			t: "union",
			of: [{ t: "number" }, {
				t: "record",
				open: true,
				of: { value: { t: "number" } }
			}]
		},
		example: 4.5
	});
	// packages/components/rating/index.ts
	var rating_exports = /* @__PURE__ */ __exportAll({ RatingBuilder: () => RatingBuilder });
	// packages/modules/router/HashRouter.ts
	var HashRouter = class {
		/**
		* @param config - Options for standalone use (`{ defaultRoute, initialTheme, validRoutes, onRouteChanged }`).
		* @param context - Host-supplied runtime data; wins over `config` when both are given.
		*/
		constructor(config = {}, context) {
			_defineProperty(this, "defaultRoute", void 0);
			_defineProperty(this, "currentThemeId", void 0);
			_defineProperty(this, "onRouteChanged", void 0);
			_defineProperty(this, "validRoutes", []);
			_defineProperty(this, "_handleHashChange", () => {
				const state = this.parseUrlHash();
				if (state.theme) this.currentThemeId = state.theme;
				this.onRouteChanged(state);
			});
			const defaultRoute = context?.defaultRoute ?? config.defaultRoute ?? "home";
			const initialTheme = context?.theme ?? config.initialTheme ?? "default";
			const validRoutes = context?.routes ?? config.validRoutes ?? [];
			const onRouteChanged = context?.onRouteChanged ?? config.onRouteChanged;
			this.defaultRoute = this._normalizeRoute(defaultRoute);
			this.currentThemeId = this._normalizeTheme(initialTheme) || "default";
			this.onRouteChanged = onRouteChanged ?? (() => void 0);
			this.validRoutes = validRoutes.map((r) => r.trim().toLowerCase());
			window.addEventListener("hashchange", this._handleHashChange);
		}
		redirect(targetRoute, themeId, fragmentId = "") {
			const activeTheme = this._normalizeTheme(themeId || this.currentThemeId);
			const redirectState = {
				route: this._normalizeRoute(targetRoute),
				theme: activeTheme,
				fragment: fragmentId.trim().replace(/^#/, "")
			};
			this.currentThemeId = activeTheme;
			localStorage.setItem("active_theme", activeTheme);
			const targetHash = this._buildHash(redirectState);
			window.history.replaceState(null, "", targetHash);
			return redirectState;
		}
		navigate(routeId, themeId, fragmentId, _isValidRoute = false) {
			const activeTheme = this._normalizeTheme(themeId || this.currentThemeId);
			let targetRoute = this._normalizeRoute(routeId);
			let targetFragment = fragmentId?.trim().replace(/^#/, "") || "";
			if (!this.validRoutes.includes(targetRoute.toLowerCase()) && !_isValidRoute) {
				console.warn(`[Router] Redirecting dynamic section anchor click to default page path.`);
				const correctedState = this.redirect(this.defaultRoute, activeTheme, targetRoute);
				this.onRouteChanged(correctedState);
				return;
			}
			const normalizedState = {
				route: targetRoute,
				theme: activeTheme,
				fragment: targetFragment
			};
			window.history.pushState(null, "", this._buildHash(normalizedState));
			this.currentThemeId = activeTheme;
			localStorage.setItem("active_theme", activeTheme);
			this.onRouteChanged(normalizedState);
		}
		parseUrlHash() {
			const rawHash = window.location.hash.trim().replace(/^#/, "");
			const persistedTheme = this._normalizeTheme(localStorage.getItem("active_theme"));
			if (!rawHash) {
				console.log("[Router] Empty URL hash. Executing central auto-redirect to home launcher...");
				return this.redirect(this.defaultRoute, persistedTheme);
			}
			const [rawPathPart, queryString = ""] = rawHash.split("?");
			const pathPart = rawPathPart.trim().replace(/^\/+/, "");
			const queryTheme = new URLSearchParams(queryString).get("theme");
			let extractedTheme = queryTheme ? this._normalizeTheme(queryTheme) : null;
			let targetRoute = "";
			let targetFragment = "";
			const segments = pathPart.split("/").map((part) => part.trim()).filter(Boolean);
			if (segments.length > 1) {
				const firstPart = segments[0];
				const remainder = segments.slice(1).join("/");
				if (queryTheme) {
					targetRoute = firstPart;
					targetFragment = remainder;
				} else if (this.validRoutes.includes(firstPart.toLowerCase())) {
					targetRoute = firstPart;
					targetFragment = remainder;
				} else if (this.validRoutes.includes(remainder.toLowerCase())) {
					extractedTheme = this._normalizeTheme(firstPart);
					targetRoute = remainder;
				} else {
					targetRoute = firstPart;
					targetFragment = remainder;
				}
			} else targetRoute = segments[0] || pathPart.trim();
			let finalRoute = this._normalizeRoute(targetRoute);
			let finalFragment = this._safeDecode(targetFragment);
			if (!this.validRoutes.includes(finalRoute.toLowerCase())) {
				console.log(`[Router Live] Route "${finalRoute}" is unrecognized. Delegating central redirect.`);
				return this.redirect(this.defaultRoute, extractedTheme || persistedTheme, finalRoute);
			}
			const resolvedState = {
				route: finalRoute,
				theme: extractedTheme || persistedTheme || this.currentThemeId || "default",
				fragment: finalFragment
			};
			this.currentThemeId = resolvedState.theme || this.currentThemeId;
			if (resolvedState.theme) localStorage.setItem("active_theme", resolvedState.theme);
			this._syncAddressBar(resolvedState, true);
			return resolvedState;
		}
		/**
		* Mengupdate daftar rute yang valid secara dinamis (misalnya ketika mendaftarkan controller baru)
		*/
		updateValidRoutes(validRoutes) {
			this.validRoutes = validRoutes.map((r) => r.trim().toLowerCase());
		}
		updateValidRoute(route) {
			this.validRoutes.push(route);
		}
		/**
		* Pembersih memory leak saat instance dihancurkan
		*/
		destroy() {
			window.removeEventListener("hashchange", this._handleHashChange);
		}
		/**
		* HELPER
		*/
		_normalizeRoute(route) {
			return route.trim().replace(/^#/, "").replace(/^\/+/, "") || "home";
		}
		_normalizeTheme(theme) {
			return (theme || "").trim().replace(/^#/, "");
		}
		_buildHash(state) {
			const route = this._normalizeRoute(state.route);
			const theme = this._normalizeTheme(state.theme || this.currentThemeId) || "default";
			const fragment = state.fragment?.trim().replace(/^#/, "");
			const query = `?theme=${encodeURIComponent(theme)}`;
			return `#${route}${fragment ? `/${fragment}` : ""}${query}`;
		}
		_safeDecode(value) {
			try {
				return decodeURIComponent(value);
			} catch {
				return value;
			}
		}
		_syncAddressBar(state, replace = false) {
			const normalizedHash = this._buildHash(state);
			if (window.location.hash === normalizedHash) return;
			if (replace) window.history.replaceState(null, "", normalizedHash);
			else window.history.pushState(null, "", normalizedHash);
		}
	};
	_defineProperty(HashRouter, "slot", "router");
	// packages/modules/router/index.ts
	var router_exports = /* @__PURE__ */ __exportAll({ HashRouter: () => HashRouter });
	// packages/components/section/Section.kit.ts
	var DEFAULT_SELECTORS = {
		"@section": {
			tagName: "section",
			className: "section"
		},
		"@section>content": {
			tagName: "div",
			className: "section-column"
		},
		"@section>content>image": {
			tagName: "img",
			className: "section-image"
		},
		"@section>content>eyebrow": {
			tagName: "div",
			className: "section-eyebrow"
		},
		"@section>content>header": {
			tagName: "h2",
			className: "section-title"
		},
		"@section>content>desc": {
			tagName: "p",
			className: "section-desc"
		},
		"@section>content>actions": {
			tagName: "div",
			className: "section-actions"
		},
		"@section>content>actions>item": {
			tagName: "a",
			className: "section-cta"
		}
	};
	// packages/components/section/Section.engine.ts
	/**
	* Normalize the payload into columns of blocks.
	*
	* Accepts a column array or a single column object. A column owns its block list under
	* `blocks`; a column whose own fields look like a block is treated as one block, which is
	* what makes the flat shape work without a nested array of one.
	*/
	function normalizeColumns(data) {
		const content = data;
		if (!content) return [];
		if (!Array.isArray(content) && typeof content === "object" && Object.keys(content).length === 0) return [];
		return (Array.isArray(content) ? content : [content]).filter(Boolean).map((column) => {
			const className = typeof column.className === "string" ? column.className : void 0;
			const inner = column.blocks;
			if (Array.isArray(inner)) return {
				className,
				blocks: inner.filter(Boolean)
			};
			if (typeof HTMLElement !== "undefined" && inner instanceof HTMLElement) return {
				className,
				blocks: [],
				element: inner
			};
			if (column.eyebrow || column.title || column.description || column.image || column.imageUrl || column.actions) return {
				className,
				blocks: [column]
			};
			return {
				className,
				blocks: []
			};
		});
	}
	// packages/components/section/Section.ts
	/** Add a space-separated class list without wiping the selector's own classes. */
	function addClasses(el, value) {
		if (typeof value !== "string") return;
		for (const token of value.split(/\s+/).filter(Boolean)) el.classList.add(token);
	}
	var SectionBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — eyebrow, header, copy and the action row, drawn with the mandatory
		* `@aio-ui/skeleton` primitive. Column count is a payload detail; one column is the
		* layout the sheet will stack first anyway.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [
					{
						shape: "line",
						width: "35%"
					},
					{
						shape: "bone",
						width: "65%",
						height: "2rem"
					},
					{
						shape: "line",
						count: 2
					},
					{
						shape: "row",
						gap: "0.5rem",
						children: [{
							shape: "bone",
							width: "7rem",
							height: "2.5rem",
							count: 2
						}]
					}
				]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "section");
			_defineProperty(this, "name", "section");
			_defineProperty(this, "stylesheet", "./Section.css");
			_defineProperty(this, "config", void 0);
			const defaultConfig = {
				themeId: "default",
				selectors: DEFAULT_SELECTORS,
				namespace: null,
				emit: () => {},
				id: "",
				className: ""
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		prepare(data) {
			const section = this.render("@section", data);
			for (const column of normalizeColumns(data)) {
				const box = this.render("@section>content", column);
				if (!box) continue;
				if (column.element) box.appendChild(column.element);
				for (const block of column.blocks) {
					if (block.imageUrl ?? block.image) {
						const image = this.render("@section>content>image", block);
						if (image) box.appendChild(image);
					}
					if (block.eyebrow) {
						const eyebrow = this.render("@section>content>eyebrow", block);
						if (eyebrow) box.appendChild(eyebrow);
					}
					if (block.title) {
						const header = this.render("@section>content>header", block);
						if (header) box.appendChild(header);
					}
					if (block.description) {
						const desc = this.render("@section>content>desc", block);
						if (desc) box.appendChild(desc);
					}
					const actions = Array.isArray(block.actions) ? block.actions : [];
					if (actions.length) {
						const group = this.render("@section>content>actions", block);
						if (group) {
							for (const action of actions) {
								const item = this.render("@section>content>actions>item", action);
								if (item) group.appendChild(item);
							}
							box.appendChild(group);
						}
					}
				}
				section?.appendChild(box);
			}
			return this.load("@section");
		}
		template(typeKey, el, payload) {
			switch (typeKey) {
				case "@section":
					if (this.config.id) el.id = this.config.id;
					addClasses(el, this.config.className);
					break;
				case "@section>content":
					if (payload?.className) addClasses(el, payload.className);
					break;
				case "@section>content>image": {
					const img = el;
					img.src = encodeURI(payload?.imageUrl ?? payload?.image ?? "");
					img.alt = payload?.alt || payload?.title || "";
					img.loading = "lazy";
					img.decoding = "async";
					break;
				}
				case "@section>content>eyebrow":
					el.textContent = payload?.eyebrow ?? "";
					break;
				case "@section>content>header":
					el.textContent = payload?.title ?? "";
					break;
				case "@section>content>desc":
					el.textContent = payload?.description ?? "";
					break;
				case "@section>content>actions>item":
					el.textContent = payload?.label ?? "";
					if (payload?.href) el.setAttribute("href", payload.href);
					else {
						el.setAttribute("role", "button");
						el.tabIndex = 0;
						if (typeof payload?.onClick === "function") el.addEventListener("click", payload.onClick);
					}
			}
		}
		initialize() {}
	};
	_defineProperty(SectionBuilder, "contract", {
		schema: {
			t: "list",
			single: true,
			of: {
				t: "record",
				open: true,
				of: {
					className: { t: "string" },
					blocks: {
						t: "list",
						of: {
							t: "record",
							open: true,
							of: {
								imageUrl: { t: "string" },
								image: { t: "string" },
								alt: { t: "string" },
								eyebrow: { t: "string" },
								title: { t: "string" },
								description: { t: "string" },
								actions: {
									t: "list",
									of: {
										t: "record",
										open: true,
										of: {
											label: {
												t: "string",
												req: true
											},
											href: { t: "string" },
											value: { t: "string" }
										}
									}
								}
							}
						}
					}
				}
			}
		},
		example: [{
			className: "hero",
			blocks: [{
				eyebrow: "New",
				title: "Built for teams",
				description: "…"
			}]
		}]
	});
	// packages/components/section/index.ts
	var section_exports = /* @__PURE__ */ __exportAll({ SectionBuilder: () => SectionBuilder });
	// packages/components/skeleton/Skeleton.ts
	/** The attribute the hold reads its visibility floor from. */
	var SKELETON_DURATION_ATTRIBUTE = "data-skeleton-duration";
	/**
	* Shape → class. Kept as a map so the DOM shape and the CSS shape cannot drift apart.
	*
	* @summary Bare words on purpose: the root always carries `.skeleton`, so the sheet can
	*   write `&.bone` (a compound) and the markup never needs a dash-joined name.
	*/
	var SHAPE_CLASS = {
		stack: "stack",
		row: "row",
		line: "line",
		bone: "bone",
		circle: "circle"
	};
	var Skeleton = class Skeleton {
		/**
		* Builds one mockup subtree.
		*
		* @param spec - The silhouette: shapes, sizes and repetition.
		* @returns The mockup root element.
		*
		* @example
		* Skeleton.create({
		*   shape: "stack",
		*   children: [
		*     { shape: "bone", aspect: "1 / 1" },
		*     { shape: "line", width: "62%" },
		*     { shape: "line", width: "88%", count: 2 },
		*   ],
		* });
		*
		* @summary Direct `document.createElement` on purpose: no `render()`, no node records,
		*   no identity namespace. The caller (`Builder.create()`) hides the real tree and drops
		*   this one the moment the sheet lands, so tracking it would be pure waste.
		*/
		static create(spec = {}) {
			const shape = spec.shape ?? "bone";
			const node = document.createElement("div");
			node.className = [
				"skeleton",
				SHAPE_CLASS[shape],
				spec.className?.trim()
			].filter(Boolean).join(" ");
			node.setAttribute("data-skeleton", shape);
			if (spec.width) node.style.width = spec.width;
			if (spec.height) node.style.height = spec.height;
			if (spec.aspect) node.style.aspectRatio = spec.aspect;
			if (spec.gap) node.style.gap = spec.gap;
			if (typeof spec.duration === "number" && Number.isFinite(spec.duration) && spec.duration > 0) node.setAttribute(SKELETON_DURATION_ATTRIBUTE, String(Math.round(spec.duration)));
			for (const child of spec.children ?? []) {
				const count = Math.max(1, child.count ?? 1);
				for (let index = 0; index < count; index += 1) node.appendChild(Skeleton.create({
					...child,
					count: 1
				}));
			}
			return node;
		}
	};
	var SkeletonBuilder = class extends Builder$1 {
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "skeleton");
			_defineProperty(this, "name", "skeleton");
			_defineProperty(this, "stylesheet", "./Skeleton.css");
			_defineProperty(this, "config", void 0);
			this.config = this.resolveConfig({
				themeId: "default",
				namespace: null,
				emit: () => {},
				selectors: {},
				spec: {},
				duration: 2e3,
				className: ""
			}, config);
		}
		prepare(content) {
			const fromContent = content && typeof content === "object" ? content : {};
			return Skeleton.create({
				duration: this.config.duration,
				className: this.config.className,
				...this.config.spec,
				...fromContent
			});
		}
		template() {}
		initialize() {}
	};
	_defineProperty(SkeletonBuilder, "contract", {
		schema: {
			t: "record",
			open: true
		},
		example: {
			shape: "line",
			width: "60%"
		}
	});
	// packages/components/skeleton/index.ts
	var skeleton_exports = /* @__PURE__ */ __exportAll({
		Skeleton: () => Skeleton,
		SkeletonBuilder: () => SkeletonBuilder
	});
	// packages/components/tab/Tab.ts
	var _items = /* @__PURE__ */ new WeakMap();
	var TabBuilder = class extends Builder$1 {
		/**
		* 🪶 LOADING MOCKUP — the tab bar over an empty panel, drawn with the mandatory
		* `@aio-ui/skeleton` primitive. Tab count stays at three: the panel is what reserves the
		* vertical space, and it is geometry, not data.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [{
					shape: "row",
					gap: "0.5rem",
					children: [{
						shape: "bone",
						width: "6rem",
						height: "2.25rem",
						count: 3
					}]
				}, {
					shape: "bone",
					height: "10rem"
				}]
			});
		}
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "tab");
			_defineProperty(this, "name", "tab");
			_defineProperty(this, "stylesheet", "./Tab.css");
			_classPrivateFieldInitSpec(this, _items, []);
			_defineProperty(this, "currentTabIndex", 0);
			_defineProperty(this, "_listenersTabChanged", []);
			_defineProperty(this, "_listenersContentLoaded", []);
			_defineProperty(this, "_boundKeyDownHandler", void 0);
			const defaultConfig = {
				themeId: "default",
				container: null,
				menuPosition: "top",
				appearance: "default",
				lazyload: true,
				name: "tab-" + Math.random().toString(36).substring(7),
				minHeight: "400px",
				destroyPrevious: false,
				active: 0,
				animation: true,
				selectors: {
					"@container": {
						tagName: "div",
						className: "tab-widget-wrapper"
					},
					"@tab": {
						tagName: "div",
						className: "tab"
					},
					"@tab>menu": {
						tagName: "div",
						className: "menu"
					},
					"@tab>menu>item": {
						tagName: "button",
						className: "button"
					},
					"@tab>menu>item>label": {
						tagName: "span",
						className: "btn-label"
					},
					"@tab>menu>item>title": {
						tagName: "span",
						className: "btn-title"
					},
					"@tab>body": {
						tagName: "div",
						className: "body"
					},
					"@tab>panel": {
						tagName: "div",
						className: "panel hidden"
					},
					"@tab>panel>content": {
						tagName: "div",
						className: "content"
					},
					"@tab>panel>content>eyebrow": {
						tagName: "span",
						className: "eyebrow"
					},
					"@tab>panel>content>title": {
						tagName: "h3",
						className: "title"
					},
					"@tab>panel>content>desc": {
						tagName: "p",
						className: "desc"
					},
					"@tab>footer": {
						tagName: "div",
						className: "footer"
					},
					"@tab>spinner": {
						tagName: "div",
						className: "spinner hidden"
					}
				},
				namespace: null,
				emit: () => {}
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		set items(newItems) {
			if (!Array.isArray(newItems)) {
				console.error("TabBuilder validation failed: Items must be an array.");
				return;
			}
			_classPrivateFieldSet2(_items, this, newItems.map((item) => {
				if (item instanceof HTMLElement) return item;
				return Object.freeze({ ...item });
			}));
		}
		/** Local DOM lookup for the tab root. Named `tabRoot` because `rootElement`
		*  is already the slot-host field declared by `Builder`. */
		get tabRoot() {
			return this.load("@tab");
		}
		prepare(data, _config) {
			if (_config) this.config = this.resolveConfig(this.config, _config);
			const content = data ?? { body: [] };
			this.items = content.body || [];
			this.currentTabIndex = 0;
			return this.render("@tab", content);
		}
		template(typeKey, el, payload) {
			switch (typeKey) {
				case "@tab": {
					el.classList.add("tab");
					el.dataset.menu = this.config.menuPosition;
					if (this.config.appearance !== "default") el.dataset.appearance = this.config.appearance;
					this.applyAnimation(el);
					el.style.minHeight = this.config.minHeight;
					if (this.config.container instanceof HTMLElement) el.id = this.config.container.id || el.id;
					const fragment = document.createDocumentFragment();
					const spinner = this.render("@tab>spinner", null);
					if (spinner) fragment.appendChild(spinner);
					let menuElement = null;
					if (payload.menu && Array.isArray(payload.menu)) menuElement = this.render("@tab>menu", payload.menu);
					const bodyElement = this.render("@tab>body", _classPrivateFieldGet2(_items, this));
					let footerElement = null;
					if (payload.footer) footerElement = this.render("@tab>footer", payload.footer);
					if (this.config.menuPosition === "bottom") {
						fragment.appendChild(bodyElement);
						if (menuElement) fragment.appendChild(menuElement);
					} else {
						if (menuElement) fragment.appendChild(menuElement);
						fragment.appendChild(bodyElement);
					}
					if (footerElement) fragment.appendChild(footerElement);
					el.appendChild(fragment);
					break;
				}
				case "@tab>menu":
					el.setAttribute("role", "tablist");
					el.setAttribute("aria-label", "Tab Navigation");
					payload.forEach((meta, idx) => {
						if (meta instanceof HTMLElement) {
							el.appendChild(meta);
							return;
						}
						const btn = this.render("@tab>menu>item", {
							meta,
							idx
						});
						if (typeof meta === "object" && meta !== null && !!meta.link) {
							const a = document.createElement("a");
							a.className = btn.className;
							if (btn.id) a.id = btn.id;
							a.href = meta.link;
							while (btn.firstChild) a.appendChild(btn.firstChild);
							Array.from(btn.attributes).forEach((attr) => {
								if (attr.name !== "class" && attr.name !== "id") a.setAttribute(attr.name, attr.value);
							});
							a.onclick = btn.onclick;
							el.appendChild(a);
						} else el.appendChild(btn);
					});
					break;
				case "@tab>menu>item": {
					const { meta, idx } = payload;
					const rootId = this.tabRoot?.id || "gen";
					el.setAttribute("role", "tab");
					el.setAttribute("aria-selected", "false");
					el.setAttribute("tabindex", "-1");
					el.setAttribute("aria-controls", `tabpanel-${rootId}-${idx}`);
					if (!meta.id) el.id = `tabbtn-${rootId}-${idx}`;
					const spanLabel = this.render("@tab>menu>item>label", meta);
					const spanTitle = this.render("@tab>menu>item>title", meta);
					el.append(spanLabel, spanTitle);
					if (meta.className) el.classList.add(...meta.className.split(" "));
					const isLink = typeof meta === "object" && meta !== null && !!meta.link;
					el.onclick = (e) => {
						if (!isLink) e.preventDefault();
						this.navigateTo(idx);
					};
					break;
				}
				case "@tab>menu>item>label":
					el.textContent = typeof payload === "string" ? payload : (!payload.value ? payload?.label : payload.value) || "";
					break;
				case "@tab>menu>item>title":
					el.title = typeof payload === "string" ? payload : (!payload.value ? payload?.label : payload.value) || "";
					break;
				case "@tab>body":
					payload.forEach((item, idx) => {
						const panel = this.render("@tab>panel", {
							item,
							idx
						});
						el.appendChild(panel);
					});
					break;
				case "@tab>panel": {
					const { item, idx } = payload;
					const rootId = this.tabRoot?.id || "gen";
					el.setAttribute("role", "tabpanel");
					el.setAttribute("aria-labelledby", `tabbtn-${rootId}-${idx}`);
					if (item?.id) el.id = item.id;
					else el.id = `tabpanel-${rootId}-${idx}`;
					if (item?.className) el.classList.add(...String(item.className).split(" ").filter(Boolean));
					el.classList.add("hidden");
					el.style.display = "none";
					if (!this.config.lazyload) this._renderPanelContent(el, item, idx);
					break;
				}
				case "@tab>panel>content":
					if (payload.eyebrow) {
						const span = this.render("@tab>panel>content>eyebrow", payload);
						el.appendChild(span);
					}
					if (payload.title) {
						const h3 = this.render("@tab>panel>content>title", payload);
						el.appendChild(h3);
					}
					if (payload.description) {
						const p = this.render("@tab>panel>content>desc", payload);
						el.appendChild(p);
					}
					break;
				case "@tab>panel>content>eyebrow":
					el.textContent = payload?.eyebrow || "";
					break;
				case "@tab>panel>content>title":
					el.textContent = payload?.title || "";
					break;
				case "@tab>panel>content>desc":
					el.textContent = payload?.description || "";
					break;
				case "@tab>footer":
					if (payload?.id) el.id = payload.id;
					if (payload?.className) el.classList.add(...String(payload.className).split(" ").filter(Boolean));
					el.textContent = payload?.text || "";
			}
		}
		initialize() {
			const menuElement = this.load("@tab>menu");
			if (menuElement) {
				this._boundKeyDownHandler = (e) => this._handleKeyDown(e);
				menuElement.addEventListener("keydown", this._boundKeyDownHandler);
			}
			this.navigateTo(this.config.active);
		}
		/**
		* Mengisi dan merender konten item ke dalam tab panel fisik
		*/
		_renderPanelContent(panel, item, index) {
			if (panel.dataset.loaded === "true") return;
			const content = item?.panel ? item.panel : item;
			if (content instanceof HTMLElement) panel.append(content);
			else {
				const contentWrapper = this.render("@tab>panel>content", content);
				panel.appendChild(contentWrapper);
			}
			panel.dataset.loaded = "true";
			this.config.emit?.("tabs:content-loaded", {
				index,
				element: panel
			});
		}
		navigateTo(target) {
			const targetIndex = this.resolve(target);
			if (targetIndex < 0 || targetIndex >= _classPrivateFieldGet2(_items, this).length) return;
			const spinner = this.load("@tab>spinner");
			if (spinner) spinner.classList.remove("hidden");
			this._handleChange(targetIndex);
			setTimeout(() => {
				if (spinner) spinner.classList.add("hidden");
			}, 150);
		}
		_handleChange(index) {
			const buttons = this.buttons();
			const panels = Array.from(this.load("@tab>body")?.querySelectorAll(".panel") ?? []);
			if (buttons[this.currentTabIndex]) {
				const prevBtn = buttons[this.currentTabIndex];
				prevBtn.classList.remove("active");
				prevBtn.setAttribute("aria-selected", "false");
				prevBtn.setAttribute("tabindex", "-1");
			}
			if (panels[this.currentTabIndex]) this.leave(panels[this.currentTabIndex]);
			this.currentTabIndex = index;
			if (buttons[index]) {
				const activeBtn = buttons[index];
				activeBtn.classList.add("active");
				activeBtn.setAttribute("aria-selected", "true");
				activeBtn.setAttribute("tabindex", "0");
				if (document.activeElement && document.activeElement.parentElement === activeBtn.parentElement) activeBtn.focus();
			}
			if (panels[index]) {
				const activePanel = panels[index];
				if (this.config.lazyload) this._renderPanelContent(activePanel, _classPrivateFieldGet2(_items, this)[index], index);
				activePanel.classList.remove("hidden");
				activePanel.style.display = "block";
			}
			if (this.config.emit && typeof this.config.emit === "function") this.config.emit?.("elementChanged", {
				builder: this.builderId,
				type: "tab:changed",
				data: {
					index,
					name: this.config.name
				},
				element: panels[index] || null
			});
		}
		/** `animation: false` disables panel motion, `true` keeps the default fade, and an object
		*  carries `@keyframes` names the sheet reads through two custom properties. */
		applyAnimation(root) {
			const animation = this.config.animation;
			if (animation === false) {
				root.dataset.animation = "none";
				return;
			}
			if (animation && typeof animation === "object") {
				root.dataset.animation = "custom";
				if (animation.in) root.style.setProperty("--tab-anim-in", animation.in);
				if (animation.out) root.style.setProperty("--tab-anim-out", animation.out);
			}
		}
		buttons() {
			return Array.from(this.load("@tab>menu")?.querySelectorAll("button") ?? []);
		}
		/** A number is an index; a string is matched against the button id, the panel it controls,
		*  then its label and title — so `active` accepts whichever the caller already has. */
		resolve(target) {
			if (typeof target === "number") return target;
			const buttons = this.buttons();
			for (let i = 0; i < buttons.length; i += 1) {
				const button = buttons[i];
				if (button.id === target || button.getAttribute("aria-controls") === target || button.querySelector(".btn-label")?.textContent === target || button.querySelector(".btn-title")?.textContent === target) return i;
			}
			return -1;
		}
		/** Hide the panel we just left. With `destroyPrevious` its content is wiped — but only
		*  after the `out` animation ends, so the wipe never reads as a jump. */
		leave(panel) {
			const hide = () => {
				panel.classList.add("hidden");
				panel.style.display = "none";
			};
			const wipe = () => {
				panel.replaceChildren();
				panel.dataset.loaded = "false";
			};
			if (!this.config.destroyPrevious) {
				hide();
				return;
			}
			if (!this.config.animation) {
				wipe();
				hide();
				return;
			}
			let settled = false;
			const finish = () => {
				if (settled) return;
				settled = true;
				panel.removeEventListener("animationend", finish);
				panel.classList.remove("is-leaving");
				wipe();
				hide();
			};
			panel.classList.add("is-leaving");
			panel.addEventListener("animationend", finish);
			setTimeout(finish, 700);
		}
		_handleKeyDown(e) {
			const buttons = this.buttons();
			if (!buttons || !buttons.length) return;
			let nextIndex = this.currentTabIndex;
			if (this.config.menuPosition === "top" || this.config.menuPosition === "bottom") {
				if (e.key === "ArrowRight") nextIndex = (this.currentTabIndex + 1) % buttons.length;
				else if (e.key === "ArrowLeft") nextIndex = (this.currentTabIndex - 1 + buttons.length) % buttons.length;
				else if (e.key === "Home") nextIndex = 0;
				else if (e.key === "End") nextIndex = buttons.length - 1;
				else return;
			} else if (e.key === "ArrowDown") nextIndex = (this.currentTabIndex + 1) % buttons.length;
			else if (e.key === "ArrowUp") nextIndex = (this.currentTabIndex - 1 + buttons.length) % buttons.length;
			else if (e.key === "Home") nextIndex = 0;
			else if (e.key === "End") nextIndex = buttons.length - 1;
			else return;
			e.preventDefault();
			this.navigateTo(nextIndex);
			buttons[nextIndex].focus();
		}
		onTabChanged(callback) {
			if (typeof callback === "function") this._listenersTabChanged.push(callback);
		}
		onContentLoaded(callback) {
			if (typeof callback === "function") this._listenersContentLoaded.push(callback);
		}
		unmount() {
			const menuElement = this.load("@tab>menu");
			if (menuElement && this._boundKeyDownHandler) menuElement.removeEventListener("keydown", this._boundKeyDownHandler);
			this.destroy();
		}
	};
	_defineProperty(TabBuilder, "contract", {
		schema: {
			t: "record",
			open: true,
			of: {
				menu: {
					t: "list",
					single: true,
					of: {
						t: "record",
						open: true,
						of: {
							label: { t: "string" },
							title: { t: "string" },
							id: { t: "string" },
							className: { t: "string" }
						}
					}
				},
				body: {
					t: "list",
					single: true,
					of: {
						t: "record",
						open: true,
						of: {
							panel: { t: "any" },
							body: { t: "any" }
						}
					}
				},
				footer: { t: "any" }
			}
		},
		example: {
			menu: [{
				label: "Overview",
				title: "Overview"
			}],
			body: [{ panel: {
				title: "Overview",
				description: "…"
			} }]
		}
	});
	// packages/components/tab/index.ts
	var tab_exports = /* @__PURE__ */ __exportAll({ TabBuilder: () => TabBuilder });
	// packages/components/table/Table.helper.ts
	/**
	* Convert Number to text 1-16 only refers to semantic-ui el wide
	* @param {number} number
	* @returns {string}
	*/
	function numberToText$1(number) {
		const numberMap = {
			1: "one",
			2: "two",
			3: "three",
			4: "four",
			5: "five",
			6: "six",
			7: "seven",
			8: "eight",
			9: "nine",
			10: "ten",
			11: "eleven",
			12: "twelve",
			13: "thirteen",
			14: "fourteen",
			15: "fifteen",
			16: "sixteen"
		};
		if (number && typeof number !== "number") throw Error("parameter must be a number");
		else if (number && (number < 1 || number > 16)) throw Error("number must be between 1 and 16 inclusive");
		else if (!number) return;
		else return numberMap[number];
	}
	/**
	* Applies custom CSS classes to a given HTML table element based on the provided configuration.
	*/
	function __applyTableClasses(table, config) {
		const classes = ["table"];
		if (config.className) classes.push(config.className);
		if (config.size) classes.push(`${config.size}`);
		if (config.type) classes.push(`${config.type}`);
		if (config.color) classes.push(`${config.color}`);
		if (config.sortable) classes.push("sortable");
		if (config.selectable) classes.push("selectable");
		if (config.scrolling) classes.push("scrolling");
		if (config.textAlign) classes.push(`${config.textAlign}`);
		if (config.verticalAlign) classes.push(`${config.verticalAlign}`);
		table.className = classes.join(" ").trim();
	}
	/**
	* Normalizes a cell value into a standard structure.
	*/
	function __normalizeCell(cell) {
		if (cell == null) return {
			text: null,
			options: {}
		};
		if (cell instanceof HTMLElement) return {
			text: cell,
			options: {}
		};
		if (typeof cell === "object" && "text" in cell) return {
			text: cell.text ?? null,
			options: cell.options || {}
		};
		return {
			text: cell,
			options: {}
		};
	}
	/**
	* Apply options (styling + formatting) to a table cell.
	*/
	function __applyCellOptions(el, options = {}, rawValue) {
		if (!el || typeof el !== "object") return el;
		if (options.rowSpan) el.rowSpan = options.rowSpan;
		if (options.colSpan) el.colSpan = options.colSpan;
		const cls = [];
		if (options.class) el.className = options.class;
		if (options.color) cls.push(options.color);
		if (options.wide) {
			const w = typeof options.wide === "number" ? numberToText$1(options.wide) : String(options.wide);
			if (w) cls.push(`${w} wide`);
		}
		if (options.textAlign) cls.push(`${options.textAlign} aligned`);
		if (options.verticalAlign) cls.push(`${options.verticalAlign} aligned`);
		if (cls.length) el.className = (el.className ? el.className + " " : "") + cls.join(" ");
		else if (!el.className || el.className === "" || el.className === void 0) el.removeAttribute("class");
		if (rawValue !== void 0) {
			if (rawValue && typeof rawValue === "object" && "subrowOfUid" in rawValue && Array.isArray(rawValue.data)) rawValue = rawValue.data;
			const display = __formatValue(rawValue, options);
			if (display instanceof HTMLElement) {
				el.innerHTML = "";
				el.appendChild(display);
			} else el.textContent = display;
		}
		return el;
	}
	/**
	* Calculate a single cell value based on formula.
	*/
	function __calculateRow(headers, rowData, colIndex, formula) {
		const ARITHMETIC_REGEX = /^[\d\s\+\-\*\/\%\.\(\)]+$/;
		const value = formula.replace(/=| /g, "").replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (name) => {
			const ci = __findColIndexByHeader(headers, name);
			return rowData[ci]?.text ? rowData[ci].text : rowData[ci];
		});
		if (!ARITHMETIC_REGEX.test(value)) {
			console.error("Formula validation failed: The formula contains unsafe characters after substitution.", value);
			rowData[colIndex] = null;
			return null;
		}
		try {
			rowData[colIndex] = new Function(`return ${value}`)();
		} catch {
			rowData[colIndex] = null;
		}
		return rowData[colIndex];
	}
	/**
	* Applies a mathematical formula to a cell, calculating its value based on other cell values.
	*/
	function __applyRowFormula(cells, ci, formula) {
		if (typeof formula === "string") {
			const ARITHMETIC_REGEX = /^[\d\s\+\-\*\/\%\.\(\)]+$/;
			const value = formula.replace(/=| /g, "").replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (headerTitle) => {
				const i = cells.findIndex((c) => c.header === headerTitle);
				const cellValue = cells[i] ? cells[i].value : null;
				return (typeof cellValue === "number" ? cellValue : Number(cellValue) || 0).toString();
			});
			if (!ARITHMETIC_REGEX.test(value)) {
				console.error("Formula validation failed: The formula contains unsafe characters after substitution.", value);
				cells[ci].value = null;
				return null;
			}
			try {
				const calculate = new Function(`return ${value}`);
				cells[ci].value = calculate();
			} catch (e) {
				console.error(`Error calculating formula "${formula}":`, e);
				cells[ci].value = null;
			}
			return cells[ci].value;
		}
		if (typeof formula === "function") {
			try {
				cells[ci].value = formula(cells, ci);
			} catch (e) {
				console.error(`Error calculating formula function:`, e);
				cells[ci].value = null;
			}
			return cells[ci].value;
		}
		return null;
	}
	/**
	* Find header column index by given title
	*/
	function __findColIndexByHeader(headers, title) {
		return headers.findIndex((h) => {
			if (typeof h === "string") return h.toLowerCase() === title.toLowerCase();
			if (typeof h === "object" && h !== null) return h.text?.toLowerCase() === title.toLowerCase();
			return false;
		});
	}
	/**
	* Convert edited text back into the correct typed value based on format/type.
	*/
	function __parseValue(text, type = "text") {
		if (text == null) return "";
		const trimmed = String(text).trim();
		switch (type) {
			case "number": {
				const cleaned = trimmed.replace(/,/g, "");
				const n = Number(cleaned);
				return Number.isNaN(n) ? trimmed : n;
			}
			case "boolean": return trimmed.toLowerCase() === "true" || trimmed === "1";
			case "object": try {
				return JSON.parse(trimmed);
			} catch {
				return trimmed;
			}
			case "currency": {
				const cleaned = trimmed.replace(/[^0-9.-]+/g, "");
				const n = Number(cleaned);
				return Number.isNaN(n) ? trimmed : n;
			}
			case "status": return trimmed.toLowerCase() === "yes" || trimmed === "1" || trimmed.toLowerCase() === "true";
			case "date": {
				const d = new Date(trimmed);
				return isNaN(d.getTime()) ? trimmed : d.toISOString();
			}
			case "image": return trimmed;
			default: return trimmed;
		}
	}
	/**
	* Convert raw value into a display string (or element) based on options.format.
	*/
	function __formatValue(rawValue, options = {}) {
		if (rawValue == null) return "";
		let display = rawValue;
		switch (options.format) {
			case "number":
				display = Number(rawValue).toLocaleString();
				break;
			case "currency":
				display = Number(rawValue).toLocaleString(options.locale, {
					style: "currency",
					currency: options.currency || "USD",
					minimumFractionDigits: 2
				});
				break;
			case "status":
				display = rawValue ? "YES" : "NO";
				break;
			case "image":
				if (typeof rawValue === "string") {
					const img = document.createElement("img");
					img.src = rawValue;
					img.alt = options.alt || "";
					img.className = "cell-image";
					return img;
				}
				break;
			case "date":
				try {
					display = new Date(rawValue).toLocaleDateString();
				} catch {
					display = String(rawValue);
				}
				break;
			default: display = String(rawValue);
		}
		if (options.prefix) display = options.prefix + " " + display;
		if (options.suffix) display = display + " " + options.suffix;
		return display;
	}
	function __getRowData(row) {
		return Array.isArray(row) ? row : row?.data ?? [];
	}
	/**
	* Count visible subrows for a parent UID inside the current page slice.
	*/
	function __countVisibleSubRowsByUid(body, parentUid, { pageSize, currentPage, start = null, end = null }) {
		const s = start != null ? start : pageSize ? (currentPage - 1) * pageSize : 0;
		const e = end != null ? end : pageSize ? Math.min(body.length, s + pageSize) : body.length;
		let count = 0;
		for (let i = s; i < e; i++) {
			const r = body[i];
			if (r && typeof r === "object" && r.subrowOfUid === parentUid) count++;
		}
		return count;
	}
	function __computeRowTotalValue(body, parentIndex, formulaIndex) {
		if (formulaIndex < 0) return null;
		const parentRow = body[parentIndex];
		if (!parentRow) return null;
		const parentUid = parentRow._uid;
		if (!parentUid) return null;
		function sumRow(row, startIndex) {
			const rowArr = __getRowData(row);
			let total = Number(rowArr?.[formulaIndex] ?? 0);
			for (let i = startIndex; i < body.length; i++) {
				const r = body[i];
				if (!r || typeof r !== "object") continue;
				if (r.subrowOfUid === row._uid) total += sumRow(r, i + 1);
				else if (!r.subrowOfUid || r.subrowOfUid === parentUid) break;
			}
			return total;
		}
		const total = sumRow(parentRow, parentIndex + 1);
		return Number.isFinite(total) ? total : null;
	}
	/**
	* Fluent builder for creating table cell model objects.
	*/
	function tcell(key) {
		const _c = {
			key,
			value: null,
			options: {}
		};
		return {
			header(v) {
				_c.header = v;
				return this;
			},
			value(v) {
				_c.value = v;
				return this;
			},
			rowspan(n) {
				_c.options.rowSpan = Number(n);
				return this;
			},
			colspan(n) {
				_c.options.colSpan = Number(n);
				return this;
			},
			wide(n) {
				_c.options.wide = n;
				return this;
			},
			align(pos) {
				_c.options.textAlign = pos;
				return this;
			},
			valign(pos) {
				_c.options.verticalAlign = pos;
				return this;
			},
			format(f) {
				_c.options.format = f;
				return this;
			},
			prefix(p) {
				_c.options.prefix = p;
				return this;
			},
			suffix(s) {
				_c.options.suffix = s;
				return this;
			},
			locale(l) {
				_c.options.locale = l;
				return this;
			},
			currency(c) {
				_c.options.currency = c;
				return this;
			},
			editable(flag = true) {
				_c.options.contentEditable = !!flag;
				return this;
			},
			spellcheck(flag = true) {
				_c.options.spellcheck = !!flag;
				return this;
			},
			class(c) {
				_c.options.class = c;
				return this;
			},
			color(c) {
				_c.options.color = c;
				return this;
			},
			option(key, value) {
				_c.options[key] = value;
				return this;
			},
			options(opts) {
				Object.assign(_c.options, opts);
				return this;
			},
			create() {
				return { ..._c };
			}
		};
	}
	// packages/components/table/Table.ts
	var TableBuilder = class extends Builder$1 {
		constructor(config = {}) {
			super();
			_defineProperty(this, "builderId", "table");
			_defineProperty(this, "name", "table");
			_defineProperty(this, "stylesheet", "./Table.css");
			_defineProperty(this, "currentPage", 1);
			_defineProperty(this, "pageRows", []);
			_defineProperty(this, "_uidCounter", 0);
			_defineProperty(this, "_generateRowUID", () => `row_${++this._uidCounter}`);
			_defineProperty(this, "_isRowTotalRendered", false);
			_defineProperty(this, "_totalColumns", null);
			_defineProperty(this, "table", void 0);
			_defineProperty(this, "thead", void 0);
			_defineProperty(this, "tbody", void 0);
			_defineProperty(this, "tfoot", void 0);
			_defineProperty(this, "data", void 0);
			_defineProperty(this, "domModel", {
				header: [],
				body: [],
				footer: []
			});
			const defaultConfig = {
				themeId: "default",
				container: null,
				size: null,
				type: null,
				color: null,
				textAlign: null,
				sortable: false,
				selectable: false,
				editable: true,
				renderAsCard: false,
				autoFreezeAt: null,
				autoNumbering: true,
				pageSize: 8,
				disableSubRow: false,
				headerOptions: {},
				bodyOptions: [],
				footerOptions: {},
				className: "",
				selectors: {
					"@container": {
						tagName: "div",
						className: "table-container"
					},
					"@table": {
						tagName: "table",
						className: "table"
					},
					"@table>thead": { tagName: "thead" },
					"@table>tbody": { tagName: "tbody" },
					"@table>tbody>actions": {
						tagName: "div",
						className: "actions-set",
						wrapper: "td.actions"
					},
					"@table>tbody>actions>edit": {
						tagName: "button",
						className: "edit-btn",
						icon: "edit"
					},
					"@table>tbody>actions>remove": {
						tagName: "button",
						className: "remove-btn",
						icon: "trash"
					},
					"@table>tbody>actions>add": {
						tagName: "button",
						className: "add-btn",
						icon: "plus square"
					},
					"@table>tfoot": { tagName: "tfoot" },
					"@table>tfoot>pagination": {
						tagName: "div",
						className: "pagination menu"
					},
					"@table>tfoot>pagination>item": {
						tagName: "a",
						className: "item"
					},
					"@table>tfoot>pagination>prev": {
						tagName: "a",
						className: "item prev",
						icon: "arrow left"
					},
					"@table>tfoot>pagination>next": {
						tagName: "a",
						className: "item next",
						icon: "arrow right"
					},
					"@table>tfoot>add-row": {
						tagName: "button",
						className: "add-row-btn",
						icon: "plus"
					},
					"@table>trow": { tagName: "tr" },
					"@table>trow>th": { tagName: "th" },
					"@table>trow>cell": { tagName: "td" },
					"@table>trow>total": {
						tagName: "div",
						className: "cell grand"
					},
					"@table>icon": {
						tagName: "i",
						className: "icon"
					}
				},
				namespace: null,
				emit: null
			};
			this.config = this.resolveConfig(defaultConfig, config);
		}
		/**
		* Public entry point for materializing the table component from input data.
		* Transforms the incoming payload into a DOM fragment while preserving the shared builder lifecycle.
		*/
		prepare(content, _config) {
			const container = this.render("@container");
			this.currentPage = 1;
			this.pageRows = [];
			this._uidCounter = 0;
			this._generateRowUID = () => `row_${++this._uidCounter}`;
			this._isRowTotalRendered = false;
			this._totalColumns = null;
			this.domModel = {
				header: [],
				body: [],
				footer: []
			};
			this.data = content;
			if (!this.data.header) this.data.header = [];
			if (!this.data.body) this.data.body = [];
			if (!this.data.footer) this.data.footer = null;
			this.table = this.render("@table", this.data);
			if (this.table) __applyTableClasses(this.table, this.config);
			this.renderTable();
			container?.appendChild(this.table);
			this.hierarchy.update();
			return container;
		}
		renderTable() {
			this.domModel = this.resolvePayload(this.data);
			this.thead = this.render("@table>thead", this.domModel.header);
			this.tbody = this.render("@table>tbody", this.domModel.body);
			this.tfoot = this.render("@table>tfoot", this.domModel.footer);
			this.table.replaceChildren(this.thead, this.tbody, this.tfoot);
			this._applyFreezeColumns(this.table);
			return this.table;
		}
		/**
		* 🪶 LOADING MOCKUP — one header bar and four placeholder rows, drawn with the mandatory
		* `@aio-ui/skeleton` primitive.
		*
		* Deliberately independent of the payload: a skeleton that mirrored every real row would
		* be the per-element placeholder pass again. `Table.css` is what is still loading, so the
		* skin cannot come from it — the skeleton sheet ships with the app shell.
		*/
		loading() {
			return Skeleton$1.create({
				shape: "stack",
				children: [{
					shape: "bone",
					height: "2.75rem"
				}, {
					shape: "line",
					count: 4
				}]
			});
		}
		/**
		* Runtime event-binding hook.
		* Triggered at the very end of the creation lifecycle to lock persistent browser
		* click/drag/swipe interactive listeners onto the completed DOM structure.
		*/
		initialize(el, _payload) {
			const table = el?.firstElementChild;
			if (!table) return;
			if (this._totalColumns > 5 && !this._isRowTotalRendered && this.config.renderAsCard) table.classList.add("stacked");
			table?.addEventListener("click", (e) => {
				const target = e.target;
				if (!target) return;
				const actionEl = target.closest("[data-action]");
				if (!actionEl) return;
				const action = actionEl.dataset.action;
				const parentTr = actionEl.closest("tr[data-global-index]");
				const rawRowIndex = actionEl.dataset.rowIndex ?? parentTr?.dataset.globalIndex;
				const rowIndex = rawRowIndex !== void 0 ? Number(rawRowIndex) : NaN;
				switch (action) {
					case "remove":
						if (!isNaN(rowIndex)) this.removeRow(rowIndex);
						break;
					case "edit": {
						const tr = parentTr ?? this.tbody?.querySelector(`tr[data-global-index="${rowIndex}"]`);
						if (!tr) return;
						const editing = tr.classList.toggle("editing");
						actionEl.classList.toggle("active", editing);
						this.toggleEdit(tr, editing);
						if (editing) {
							const firstCell = tr.cells.item(0);
							if (firstCell instanceof HTMLElement) firstCell.focus();
						}
						break;
					}
					case "add":
						this.addRow();
						break;
					case "add-subrow":
						if (!isNaN(rowIndex)) this.insertSubRow([], rowIndex);
						break;
					case "previous":
						if (this.currentPage > 1) this.switchPage(this.currentPage - 1);
						break;
					case "next":
						this.switchPage(this.currentPage + 1);
						break;
					case "page": {
						const page = Number(actionEl.textContent);
						if (!isNaN(page) && page !== this.currentPage) this.switchPage(page);
						break;
					}
				}
			});
			if (this.config.renderAsCard) {
				el.style.overflowX = "hidden";
				el.style.width = "100%";
			}
		}
		toJson() {
			const data = this.getData();
			return data.body.map((row) => data.header.reduce((obj, header, index) => {
				obj[header] = row[index];
				return obj;
			}, {}));
		}
		getData({ includeMeta = false } = {}) {
			return {
				header: this.data.header.slice(),
				body: this.data.body.map((r) => {
					if (!includeMeta) return Array.isArray(r) ? r.map((v) => v && typeof v === "object" && v.text ? v.text : v).slice() : r.data && Array.isArray(r.data) ? r.data.map((dv) => dv && dv.text ? dv.text : dv).slice() : [];
					else {
						if (Array.isArray(r)) return r.slice();
						return includeMeta ? {
							subrowOfUid: r.subrowOfUid,
							data: r.data.slice()
						} : r.data.slice();
					}
				}),
				footer: this.data.footer ? this.data.footer.slice() : []
			};
		}
		addRow(inputRowData = null) {
			const cols = Math.max(0, this.data.header.length);
			const newRow = Array.isArray(inputRowData) ? inputRowData.slice(0, cols).concat(Array(Math.max(0, cols - inputRowData.length)).fill("")) : Array(cols).fill("");
			this.data.body.push(newRow);
			if (this.config.pageSize) {
				const pages = Math.ceil(this.data.body.length / this.config.pageSize);
				this.currentPage = pages;
			}
			const newGlobalIndex = this.data.body.length - 1;
			this.renderTable();
			this._openRowForEditByGlobalIndex(newGlobalIndex);
		}
		toggleEdit(tr, editable) {
			const formulaIndex = (this.config.bodyOptions || []).findIndex((opt) => !!opt?.formula);
			const g = Number(tr.dataset.globalIndex ?? tr.sectionRowIndex);
			tr.querySelectorAll("td").forEach((td) => {
				const ci = td.cellIndex - 1;
				td.spellcheck = false;
				if (td.classList.contains("actions") || td.classList.contains("row-total") || td.dataset.colIndex === void 0 || ci === -1 || ci === formulaIndex) return;
				if (editable) {
					const rawVal = td.dataset.originalValue ?? __getRowData(this.data.body[g])[ci] ?? "";
					td.innerHTML = `<div class="cell">${rawVal == null ? "" : String(rawVal)}</div>`;
					td.contentEditable = "true";
					td.focus();
				} else {
					const finalVal = __parseValue(td.firstChild?.textContent == null ? "" : td.firstChild?.textContent.trim(), td.dataset.format || "text");
					const row = this.data.body[g];
					if (Array.isArray(row)) row[ci] = finalVal;
					else if (row && row.subrowOfUid != null && Array.isArray(row.data)) row.data[ci] = finalVal;
					td.dataset.originalValue = finalVal;
					td.innerHTML = `<div class="cell">${__formatValue(finalVal, td.__cellOptions) || {}}</div>`;
					td.contentEditable = "false";
				}
			});
			if (!editable) this.renderTable();
		}
		removeRow(globalIndex) {
			if (globalIndex < 0 || globalIndex >= this.data.body.length) return;
			const target = this.data.body?.[globalIndex];
			const parentUid = target && target._uid;
			if (parentUid) for (let i = this.data.body.length - 1; i > globalIndex; i--) {
				const r = this.data.body?.[i];
				if (r && typeof r === "object" && r.subrowOfUid === parentUid) this.data.body.splice(i, 1);
			}
			this.data.body.splice(globalIndex, 1);
			if (this.config.pageSize) {
				const pages = Math.max(1, Math.ceil(this.data.body.length / this.config.pageSize));
				if (this.currentPage > pages) this.currentPage = pages;
			}
			this.renderTable();
		}
		insertSubRow(inputRowData = null, parentIndex) {
			const cols = Math.max(0, this.data.header.length);
			const normalized = Array.isArray(inputRowData) ? inputRowData.slice(0, cols).concat(Array(Math.max(0, cols - inputRowData.length)).fill("")) : Array(cols).fill("");
			const parent = this.data.body?.[parentIndex];
			if (!parent) throw new Error("insertSubRow: invalid parentIndex");
			if (!parent._uid) parent._uid = this._generateRowUID();
			const parentUid = parent._uid;
			const newSubRow = {
				subrowOfUid: parentUid,
				data: normalized,
				_uid: this._generateRowUID()
			};
			let insertIndex = parentIndex + 1;
			while (insertIndex < this.data.body.length && (this.data.body?.[insertIndex]).subrowOfUid === parentUid) insertIndex++;
			this.data.body.splice(insertIndex, 0, newSubRow);
			this.renderTable();
			this._openRowForEditByGlobalIndex(insertIndex);
		}
		switchPage(pageNumber) {
			const pages = this.config.pageSize ? Math.max(1, Math.ceil(this.data.body.length / this.config.pageSize)) : 1;
			if (pageNumber < 1 || pageNumber > pages) return;
			this.currentPage = pageNumber;
			this.renderTable();
		}
		sort(propertyName) {
			this.domModel.body.sort((a, b) => a[propertyName] - b[propertyName]);
		}
		/**
		* Template hook for atomic data injection into specific element types.
		* This is called by the base render() method for each element created.
		*/
		template(typeKey, el, payload, selector) {
			switch (typeKey) {
				case "@table>tbody":
					for (let rowIdx = 0; rowIdx < payload.length; rowIdx++) {
						const rowModel = payload[rowIdx];
						const tr = this.render("@table>trow", {
							useCell: true,
							...rowModel
						});
						if (tr) el.appendChild(tr);
					}
					break;
				case "@table>thead":
					for (const row of payload) {
						const tr = this.render("@table>trow", row);
						el.appendChild(tr);
					}
					break;
				case "@table>tfoot":
					for (const row of payload) {
						const tr = this.render("@table>trow", row);
						el.appendChild(tr);
					}
					break;
				case "@table>trow":
					el.dataset.globalIndex = String(payload.rowIndex);
					if (payload.uid) el.dataset.uid = payload.uid;
					const rawRow = this.data.body[payload.rowIndex];
					if (rawRow && typeof rawRow === "object" && rawRow.subrowOfUid != null) el.classList.add("subrow");
					if (payload.cells) {
						if (payload.useCell) {
							el.dataset.globalIndex = String(payload.rowIndex);
							if (payload.uid) el.dataset.uid = payload.uid;
							const rawRow = this.data.body[payload.rowIndex];
							if (rawRow && typeof rawRow === "object" && rawRow.subrowOfUid != null) el.classList.add("subrow");
							for (let ci = 0; ci < payload.cells.length; ci++) {
								let cell = payload.cells[ci];
								if (this._totalColumns > 5 && !this.config.renderAsCard) {
									if (ci === 2) cell.options.class = (cell.options.class ? cell.options.class + " " : "") + "freeze".trim();
								}
								let td = this.render("@table>trow>cell", {
									index: ci,
									...cell
								});
								el.insertBefore(td, el.children[ci] || null);
							}
						} else for (let ci = 0; ci < payload.cells.length; ci++) {
							const cell = payload.cells[ci];
							const th = this.render("@table>trow>th", {
								index: ci,
								...cell
							});
							el.appendChild(th);
						}
					}
					break;
				case "@table>trow>th":
					if (payload.options) __applyCellOptions(el, payload.options);
					const ColIndex = payload.index - (this.config.autoNumbering ? 1 : 0);
					el.dataset.colIndex = String(ColIndex);
					if (payload.value) {
						if (typeof payload.value === "string" || payload.text) el.innerHTML = payload.value || payload.text;
						else if (payload?.value instanceof HTMLElement) el.append(payload.value);
						else el.innerHTML = "";
					}
					break;
				case "@table>trow>cell":
					const cell = document.createElement("div");
					cell.className = "cell";
					if (payload.value) {
						const formattedValue = __formatValue(payload.value, payload.options || {});
						if (payload.value instanceof HTMLElement) el.appendChild(payload.value);
						else if (formattedValue instanceof HTMLElement) el.appendChild(formattedValue);
						else {
							cell.textContent = payload.value;
							el.appendChild(cell);
						}
					}
					if (payload.options) __applyCellOptions(el, payload.options);
					const relativeColIndex = payload.index - (this.config.autoNumbering ? 1 : 0);
					el.dataset.colIndex = String(relativeColIndex);
					el.dataset.header = (payload.header ? payload.header : payload.key === "autoNumber" ? "#" : payload.key).toLowerCase();
					el.dataset.format = payload.options && payload.options.format || typeof payload.value === "object" && payload.value instanceof Element ? "Element" : typeof payload.value;
					if (!(payload.value instanceof Element)) el.dataset.originalValue = payload.value != null ? payload.value.toString() : "";
					el.__cellOptions = payload.options || {};
					break;
				case "@table>icon":
					el.className = el.className + " " + payload;
					break;
				case "@table>tfoot>add-row":
					el.type = "button";
					if (["small", "very compact"].includes(this.config.size)) el.classList.add("mini");
					const addRowIcon = this.render("@table>icon", selector.icon);
					const span = document.createElement("span");
					span.textContent = "Add Row";
					span.style.marginLeft = "0.3em";
					el.append(addRowIcon, span);
					el.setAttribute("aria-label", "Add Row");
					el.setAttribute("data-action", "add");
					break;
				case "@table>tfoot>pagination":
					if (this.config.size === "small" || this.config.size === "very compact") el.classList.add("mini");
					const totalPages = Math.max(1, Math.ceil(payload.body.length / this.config.pageSize));
					const prev = this.render("@table>tfoot>pagination>prev", null);
					el.appendChild(prev);
					for (let i = 1; i <= totalPages; i++) {
						const item = this.render("@table>tfoot>pagination>item", i);
						el.appendChild(item);
					}
					const next = this.render("@table>tfoot>pagination>next", totalPages);
					el.appendChild(next);
					break;
				case "@table>tfoot>pagination>prev":
					const previousArrow = this.render("@table>icon", selector.icon);
					el.appendChild(previousArrow);
					el.setAttribute("aria-label", "Previous page");
					el.setAttribute("data-action", "previous");
					el.addEventListener("click", () => this.switchPage(this.currentPage - 1));
					el.style.pointerEvents = this.currentPage <= 1 ? "none" : "";
					break;
				case "@table>tfoot>pagination>next":
					const nextArrow = this.render("@table>icon", selector.icon);
					el.appendChild(nextArrow);
					el.setAttribute("aria-label", "Next page");
					el.setAttribute("data-action", "next");
					el.addEventListener("click", () => this.switchPage(this.currentPage - 1));
					el.style.pointerEvents = this.currentPage >= payload ? "none" : "";
					break;
				case "@table>tfoot>pagination>item":
					el.textContent = String(payload);
					if (this.currentPage === payload) el.classList.add("active");
					el.setAttribute("aria-label", "Selected page");
					el.setAttribute("data-action", "page");
					break;
				case "@table>tbody>actions":
					if (!payload.isSubRow) {
						const addBtn = this.render("@table>tbody>actions>add", payload);
						el.appendChild(addBtn);
					}
					const editBtn = this.render("@table>tbody>actions>edit", payload);
					el.appendChild(editBtn);
					const removeBtn = this.render("@table>tbody>actions>remove", payload);
					el.appendChild(removeBtn);
					if (["small", "very compact"].includes(this.config.size)) el.querySelectorAll("button").forEach((b) => b.classList.add("mini"));
					break;
				case "@table>tbody>actions>edit":
					const editIcon = this.render("@table>icon", selector.icon);
					el.type = "button";
					el.appendChild(editIcon);
					el.setAttribute("aria-label", "Edit row");
					el.setAttribute("data-action", "edit");
					if (payload?.rowUid) el.dataset.rowUid = payload.rowUid;
					break;
				case "@table>tbody>actions>remove":
					const removeIcon = this.render("@table>icon", selector.icon);
					el.type = "button";
					el.appendChild(removeIcon);
					el.setAttribute("aria-label", "Remove row");
					el.setAttribute("data-action", "remove");
					if (payload?.rowUid) el.dataset.rowUid = payload.rowUid;
					break;
				case "@table>tbody>actions>add":
					const addIcon = this.render("@table>icon", selector.icon);
					el.type = "button";
					el.appendChild(addIcon);
					el.setAttribute("aria-label", "Add Subrow");
					el.setAttribute("data-action", "add-subrow");
					if (payload?.rowUid) el.dataset.rowUid = payload.rowUid;
					break;
				case "@table>trow>total": for (const p of payload) {
					const title = document.createElement("div");
					title.className = "title";
					title.textContent = p.title;
					const value = document.createElement("div");
					value.className = "value";
					value.textContent = p.value;
					el.append(title, value);
				}
			}
		}
		resolvePayload(data) {
			this._totalColumns = this._countRenderedColumns();
			const hasSubRow = this._hasSubRows();
			const headerModel = this._createHeaderDomModel(data.header);
			const bodyModel = this._createBodyDomModel(data.body);
			const footerModel = this._createFooterDomModel(data.footer);
			this._insertMetadataRowUids(data);
			const domModel = {
				header: headerModel,
				body: bodyModel,
				footer: footerModel
			};
			if (this.config.autoNumbering) this._applyInsertionAutoNumbering(domModel);
			if (this.config.editable) this._applyInsertionActionButtons(domModel);
			if (this.config.footerOptions?.renderTotal) this._applyInsertionFooterRenderTotal(domModel, this.config);
			if (hasSubRow) this._applyInsertionRowTotalColumns(domModel);
			if (this.config.pageSize) this._applyInsertionPagination(domModel);
			this._totalColumns = this._countRenderedColumns(domModel);
			return domModel;
		}
		_createHeaderDomModel(headerInput) {
			const headerOptions = this.config.headerOptions;
			const normalized = (headerInput || []).map((h, i) => {
				if (h == null) return {
					text: "",
					options: {},
					group: null,
					sourceIndex: i
				};
				if (h instanceof HTMLElement) return {
					text: h,
					options: {},
					group: null,
					sourceIndex: i
				};
				if (typeof h === "object") return {
					text: h.text ?? "",
					options: h.options ?? {},
					group: h.group ?? null,
					sourceIndex: i
				};
				return {
					text: String(h),
					options: {},
					group: null,
					sourceIndex: i
				};
			});
			if (!normalized.some((n) => n.group != null)) return [{ cells: normalized.map((cell) => tcell(`col${cell.sourceIndex}`).value(cell.text).options(headerOptions, cell.options).create()) }];
			const groups = [];
			for (const cell of normalized) if (cell.group) {
				const last = groups[groups.length - 1];
				if (last && !last.isStandalone && last.name === cell.group) {
					last.span += 1;
					last.items.push(cell);
				} else groups.push({
					name: cell.group,
					span: 1,
					items: [cell],
					isStandalone: false
				});
			} else groups.push({
				name: cell.text,
				span: 1,
				items: [cell],
				isStandalone: true
			});
			const topRow = {
				rowIndex: 0,
				cells: []
			};
			const bottomRow = {
				rowIndex: 1,
				cells: []
			};
			for (const g of groups) if (g.isStandalone) {
				const child = g.items[0];
				topRow.cells.push(tcell(`col${child.sourceIndex}`).value(child.text).rowspan("2").options(headerOptions, child.options).create());
			} else {
				topRow.cells.push(tcell(`group-${g.name}-${topRow.cells.length}`).value(g.name).class("parent-title").colspan(g.span).options(headerOptions).create());
				g.items.forEach((child) => {
					bottomRow.cells.push(tcell(`col${child.sourceIndex}`).value(child.text).class("child-title").options(headerOptions, child.options).create());
				});
			}
			return [topRow, bottomRow];
		}
		_createBodyDomModel(bodyInput) {
			const pageSize = this.config.pageSize;
			const bodyOptions = this.config.bodyOptions;
			const start = pageSize ? (this.currentPage - 1) * pageSize : 0;
			const end = pageSize ? Math.min(bodyInput.length, start + pageSize) : bodyInput.length;
			const body = [];
			this.pageRows = [];
			let displayIndex = 0;
			for (let i = 0; i < start; i++) {
				const raw = bodyInput[i];
				if (!(raw && typeof raw === "object" && raw.subrowOfUid != null)) displayIndex += 1;
			}
			for (let i = start; i < end; i++) {
				const raw = bodyInput[i];
				const isSubRow = raw && typeof raw === "object" && raw.subrowOfUid != null;
				const normalizedRow = isSubRow ? raw.data : raw;
				if (!raw._uid) raw._uid = this._generateRowUID();
				const uid = raw._uid;
				this.pageRows.push(Array.isArray(normalizedRow) ? normalizedRow : []);
				const cells = [];
				const dataColsCount = Math.max(0, (this.data.header || []).length);
				for (let ci = 0; ci < dataColsCount; ci++) {
					const norm = __normalizeCell(Array.isArray(normalizedRow) ? normalizedRow[ci] : void 0);
					const headerTitle = typeof this.data.header?.[ci] === "string" ? this.data.header[ci] : (this.data.header?.[ci]).text;
					const model = tcell(`col${ci}`).header(headerTitle).value(norm.text).options({
						...bodyOptions?.[ci] || {},
						...norm.options
					}).create();
					model.proxy = normalizedRow[ci];
					model.columnIndex = ci;
					cells.push(model);
					if (bodyOptions && bodyOptions[ci] && bodyOptions[ci].formula) {
						__applyRowFormula(cells, ci, bodyOptions[ci].formula);
						const computedValue = cells[ci].value;
						if (normalizedRow[ci] !== computedValue) Reflect.set(normalizedRow, ci, computedValue);
					}
				}
				const autoNumber = isSubRow ? 0 : ++displayIndex;
				body.push({
					autoNumber,
					rowIndex: i,
					uid,
					parentUid: raw.subrowOfUid || null,
					cells,
					data: normalizedRow,
					rowOptions: isSubRow ? raw.rowOptions || {} : {}
				});
			}
			return body;
		}
		_createFooterDomModel(footerInput) {
			const { editable, pageSize, autoNumbering, footerOptions } = this.config;
			let footer = [];
			if (!footerInput && !footerOptions?.renderTotal && !editable && !pageSize) return null;
			let addButtonPlaced = false;
			if (Array.isArray(footerOptions?.renderTotal)) {
				const row = {
					rowIndex: footer.length,
					cells: []
				};
				const footerColumns = this._totalColumns;
				const formulaIndex = this._getFormulaColumnIndex();
				const hasRowTotal = formulaIndex !== -1 && this._hasSubRows();
				for (let i = 0; i < footerColumns; i++) row.cells.push(tcell("placeholder").value("").create());
				footerOptions.renderTotal.forEach((title) => {
					const colIdx = __findColIndexByHeader(this.data.header, title);
					if (colIdx !== -1) {
						const pos = (autoNumbering ? 1 : 0) + colIdx;
						const cell = tcell(`render-total-${title}`).value(`${title.toUpperCase()}_PLACEHOLDER`).create();
						if (hasRowTotal && colIdx === formulaIndex) {
							cell.options.colSpan = 2;
							row.cells.splice(pos + 1, 1);
						}
						row.cells[pos] = cell;
					}
				});
				if (editable) {
					row.cells[row.cells.length - 1] = tcell("add-button").value("ADD_BTN_PLACEHOLDER").create();
					addButtonPlaced = true;
				}
				footer.push(row);
			}
			if (footerInput) {
				const row = {
					rowIndex: footer.length,
					cells: []
				};
				if (Array.isArray(footerInput) && footerInput.length > 0) for (let i = 0; i < this._totalColumns; i++) row.cells.push(tcell(`data-footer-${i}`).value(footerInput[i]).create());
				else if (footerInput instanceof HTMLElement || typeof footerInput === "string") row.cells[0] = tcell("data-footer").value(footerInput).valign("middle").colspan(this._totalColumns).create();
				footer.push(row);
			}
			if (pageSize) {
				const row = {
					rowIndex: footer.length,
					cells: []
				};
				if (editable) {
					row.cells.push(tcell("pagination").value("PAGINATION_PLACEHOLDER").colspan(this._totalColumns - 1).create());
					if (!addButtonPlaced) {
						row.cells.push(tcell("add-button").value("ADD_BTN_PLACEHOLDER").create());
						addButtonPlaced = true;
					} else row.cells.push(tcell("placeholder").value("").create());
				} else row.cells.push(tcell("pagination").value("PAGINATION_PLACEHOLDER").colspan(this._totalColumns).create());
				footer.push(row);
			}
			return footer;
		}
		_createGrandTotalColumnPayload(headerTitle, config) {
			const payload = [];
			const colIndex = headerTitle.colIndex - (config.autoNumbering ? 1 : 0);
			const sum = this.data.body.map((r) => {
				const formula = config.bodyOptions?.[colIndex]?.formula;
				if (formula) return __calculateRow(this.data.header, __getRowData(r), colIndex, formula);
				else return __getRowData(r)[colIndex];
			}).filter((v) => typeof v === "number").reduce((a, b) => a + b, 0);
			payload.push({
				title: "Grand Total",
				value: __formatValue(sum, config.bodyOptions?.[colIndex] || {})
			});
			if (config.pageSize) {
				const pageSum = this.pageRows.map((r) => {
					if (r[colIndex]?.hasOwnProperty("text")) return r[colIndex].text;
					else return r[colIndex];
				}).filter((v) => typeof v === "number").reduce((a, b) => a + b, 0);
				payload.push({
					title: `Page ${this.currentPage} Total`,
					value: __formatValue(pageSum, config.bodyOptions?.[colIndex] || {})
				});
			}
			this._isRowTotalRendered = true;
			return payload.reverse();
		}
		/**
		* Determine whether the current data contains any sub-rows.
		* Covers both the modern `subrowOfUid` reference and the legacy `subrowOf` numeric marker.
		*/
		_hasSubRows() {
			return (this.data?.body || []).some((r) => r && typeof r === "object" && (r.subrowOfUid != null || r.subrowOf != null));
		}
		/**
		* Determine whether a "Row Total" column will be rendered for the current data.
		* A Row Total column is inserted only when a body column has a `formula` AND sub-rows exist.
		* This is the live-data equivalent of `_isRowTotalRendered` (which is only set *after* the
		* column is inserted, so it is useless for pre-computing `_totalColumns`).
		*/
		_hasRowTotalColumn() {
			return this._getFormulaColumnIndex() !== -1 && this._hasSubRows();
		}
		/**
		* Index (within `bodyOptions`) of the column configured with a `formula`, or -1 if none.
		*/
		_getFormulaColumnIndex() {
			return (this.config.bodyOptions || []).findIndex((opt) => !!opt?.formula);
		}
		_countRenderedColumns(domModel = null) {
			if (domModel && domModel.header && domModel.header.length > 0) {
				const top = domModel.header[0];
				let count = 0;
				for (const cell of top.cells || []) {
					const cs = Number(cell.options?.colSpan ?? cell.options?.colSpan ?? 1);
					count += Math.max(1, cs);
				}
				return count;
			}
			const cfg = this.config;
			const headerCols = this.data?.header?.length || 0;
			return (cfg.autoNumbering ? 1 : 0) + headerCols + (this._hasRowTotalColumn() ? 1 : 0) + (cfg.editable ? 1 : 0);
		}
		_openRowForEditByGlobalIndex(globalIndex) {
			if (!this.tbody?.querySelector(`tr[data-global-index="${globalIndex}"]`)) {
				if (this.config.pageSize) {
					const page = Math.floor(globalIndex / this.config.pageSize) + 1;
					if (page > this.currentPage) this.switchPage(page);
				}
			}
			const tr2 = this.tbody?.querySelector(`tr[data-global-index="${globalIndex}"]`);
			if (tr2) {
				const editBtn = tr2.querySelector("button.edit-btn");
				if (editBtn && editBtn instanceof HTMLButtonElement) editBtn.click();
				if (tr2 && tr2 instanceof HTMLTableRowElement) {
					const firstCell = tr2.cells.item(0);
					if (firstCell && firstCell instanceof HTMLTableCellElement) firstCell.focus();
				}
			}
		}
		_insertMetadataRowUids(data) {
			for (let i = 0; i < data.body.length; i++) {
				const row = data.body?.[i];
				if (Array.isArray(row)) continue;
				if (!row?._uid) row._uid = this._generateRowUID();
				if (row && typeof row === "object") {
					if (row.subrowOf != null && row.subrowOfUid == null) {
						const parentIndex = Number(row.subrowOf);
						const parent = data.body?.[parentIndex];
						if (parent) {
							if (!parent._uid) parent._uid = this._generateRowUID();
							row.subrowOfUid = parent._uid;
						} else row.subrowOfUid = String(row.subrowOf);
					}
				}
			}
		}
		_applyInsertionAutoNumbering(domModel) {
			const key = "autoNumber";
			const label = typeof this.config.autoNumbering === "string" ? this.config.autoNumbering : "#";
			domModel.header.forEach((row, rowIndex) => {
				if (rowIndex === 0) row.cells.unshift(tcell(key).value(label).rowspan(domModel.header.length).align("center").options(this.config.headerOptions).create());
			});
			domModel.body.forEach((row, _idx) => {
				if (!!!row.parentUid) row.cells.unshift(tcell(key).value(row[key]).class(key).align("center").create());
				else row.cells.unshift(tcell(key).value("•").align("right").create());
			});
		}
		_applyInsertionActionButtons(domModel) {
			const cfg = this.config;
			const label = typeof cfg.editable === "string" ? cfg.editable : "Actions";
			const key = label.toLowerCase();
			const headerRows = domModel.header || [];
			if (headerRows.length === 0) domModel.header = [{
				rowIndex: 0,
				cells: [tcell(key).value(label).align("center").options(cfg.headerOptions).create()]
			}];
			else if (headerRows.length === 1) headerRows[0].cells.push(tcell(key).value(label).align("center").options(cfg.headerOptions).create());
			else headerRows[0].cells.push(tcell(key).value(label).rowspan(2).align("center").options(cfg.headerOptions).create());
			(domModel.body || []).forEach((rowModel) => {
				const rawRow = this.data.body[rowModel.rowIndex];
				const isSubRow = rawRow && typeof rawRow === "object" && rawRow.subrowOfUid != null;
				rowModel.cells.push(tcell(key).value(this.render("@table>tbody>actions", {
					isSubRow: isSubRow || this.config.disableSubRow,
					...rowModel
				})).class("actions cell").align(isSubRow ? "right" : "center").create());
			});
			for (const row of domModel.footer) {
				const idx = row.cells.findIndex((c) => c.key === "add-button");
				if (idx >= 0) row.cells[idx] = tcell("add-button").value(this.render("@table>tfoot>add-row")).create();
			}
		}
		_applyInsertionFooterRenderTotal(domModel, config) {
			if (!Array.isArray(config.footerOptions?.renderTotal) || config.footerOptions.renderTotal.length === 0) return;
			for (const row of domModel.footer) row.cells.forEach((c, idx) => {
				if (c.key && c.key.startsWith("render-total-")) {
					const title = c.key.replace("render-total-", "");
					row.cells[idx] = tcell(title).value(this.render("@table>trow>total", this._createGrandTotalColumnPayload({
						title,
						colIndex: idx
					}, this.config))).class(`sum ${title}`).options({ ...c.options || {} }).create();
				}
			});
		}
		_applyInsertionPagination(domModel) {
			for (const row of domModel.footer) {
				const idx = row.cells.findIndex((c) => c.key === "pagination");
				if (idx >= 0) row.cells[idx] = tcell("pagination").value(this.render("@table>tfoot>pagination", this.data)).colspan(row.cells[idx].options?.colSpan || row.cells[idx].options?.colSpan || 1).create();
			}
		}
		_applyInsertionRowTotalColumns(domModel) {
			const config = this.config;
			const formulaIndex = this._getFormulaColumnIndex();
			if (formulaIndex === -1) return;
			const insertPos = (config.autoNumbering ? 1 : 0) + formulaIndex + 1;
			const headerRows = domModel.header || [];
			if (headerRows.length) {
				const headerCellObj = tcell("row-total").value("Row Total").class("row-total").align("center").rowspan(headerRows.length).create();
				if (headerRows.length === 1) headerRows[0].cells.splice(insertPos, 0, headerCellObj);
				else {
					const top = headerRows[0];
					const bottom = headerRows[headerRows.length - 1];
					const formulaGrid = (config.autoNumbering ? 1 : 0) + formulaIndex;
					let grid = 0;
					let coveringIdx = -1;
					let coveringEnd = -1;
					for (let i = 0; i < top.cells.length; i++) {
						const span = top.cells[i].options?.colSpan || 1;
						if (coveringIdx === -1 && grid + span - 1 >= formulaGrid) {
							coveringIdx = i;
							coveringEnd = grid + span - 1;
						}
						grid += span;
					}
					if (coveringIdx !== -1 && coveringEnd >= insertPos) {
						top.cells[coveringIdx].options.colSpan = (top.cells[coveringIdx].options.colSpan || 1) + 1;
						headerCellObj.options.rowSpan = 1;
						let hIdx = bottom.cells.findIndex((c) => c.key === `col${formulaIndex}`);
						if (hIdx === -1) hIdx = bottom.cells.findIndex((c) => c.columnIndex === formulaIndex);
						hIdx = hIdx === -1 ? insertPos : hIdx + 1;
						bottom.cells.splice(hIdx, 0, headerCellObj);
					} else {
						const insertIdx = coveringIdx === -1 ? top.cells.length : coveringIdx + 1;
						top.cells.splice(insertIdx, 0, headerCellObj);
					}
				}
			}
			const pageSize = config.pageSize;
			const currentPage = this.currentPage;
			const start = pageSize ? (currentPage - 1) * pageSize : 0;
			const end = pageSize ? Math.min(this.data.body.length, start + pageSize) : this.data.body.length;
			for (const rowModel of domModel.body) {
				const gIdx = Number(rowModel.rowIndex);
				const rawRow = this.data.body[gIdx];
				const isSubRow = rawRow && typeof rawRow === "object" && rawRow.subrowOfUid != null;
				if (!isSubRow) {
					const parentUid = rawRow._uid;
					const rowSpan = 1 + (__countVisibleSubRowsByUid(this.data.body, parentUid, {
						pageSize,
						currentPage,
						start,
						end
					}) || 0);
					const totalVal = __computeRowTotalValue(this.data.body, gIdx, formulaIndex);
					const totalCell = tcell("row-total").value(totalVal).class("row-total").rowspan(rowSpan).align("center").options(config.bodyOptions?.[formulaIndex]).create();
					rowModel.cells.splice(insertPos, 0, totalCell);
				}
				if (isSubRow && !domModel.body.some((rowModel) => rowModel.uid === rawRow.subrowOfUid)) {
					const spacer = tcell("spacer").class("row-total spacer").value("").create();
					rowModel.cells.splice(insertPos, 0, spacer);
				}
			}
			this._isRowTotalRendered = true;
		}
		_applyFreezeColumns(table) {
			const autoFreezeAt = this.config.autoFreezeAt;
			if (!this.config.renderAsCard && autoFreezeAt !== null) requestAnimationFrame(() => {
				let currentLeft = 0;
				for (let ci = 0; ci <= autoFreezeAt; ci++) {
					const targetCells = table.querySelectorAll(`[data-col-index="${ci}"]`);
					if (targetCells.length === 0) continue;
					const cellWidth = targetCells[0].offsetWidth || 100;
					targetCells.forEach((cell) => {
						const zIndex = cell.tagName === "TH" ? "3" : "2";
						const borderWidth = ci === autoFreezeAt ? "3px" : "0px";
						cell.setAttribute("style", `--border-width: ${borderWidth}; --current-left: ${currentLeft}px; --z-index: ${zIndex};`.trim());
						!cell.classList.contains("sticky") ? cell.classList.add("sticky") : cell.classList.remove("sticky");
					});
					currentLeft += cellWidth;
				}
			});
		}
		_applyKeydownHandler(e) {
			if (e?.key === "ArrowRight") e.preventDefault();
			if (e?.key === "ArrowLeft") e.preventDefault();
			if (e?.key === "Escape") e.preventDefault();
			if (e?.key === "Enter") e.preventDefault();
		}
	};
	_defineProperty(TableBuilder, "contract", {
		schema: {
			t: "record",
			open: true,
			of: {
				header: {
					t: "list",
					of: { t: "any" }
				},
				body: {
					t: "list",
					of: {
						t: "list",
						of: { t: "any" }
					}
				},
				footer: { t: "any" }
			}
		},
		example: {
			header: ["Name", "Qty"],
			body: [["Coffee", 2]]
		}
	});
	// packages/components/table/index.ts
	var table_exports = /* @__PURE__ */ __exportAll({ TableBuilder: () => TableBuilder });
	// packages/modules/theme/src/ThemeRegistry.ts
	var _themes$1 = /* @__PURE__ */ new WeakMap();
	/**
	* Theme store.
	*
	* Same shape as every other registry in the framework: an instance over the `Registry`
	* kernel, keyed by `themeId`. It stores modules only — applying a theme to the DOM is
	* `ThemeRenderer`'s job.
	*/
	var ThemeRegistry = class {
		constructor() {
			_classPrivateFieldInitSpec(this, _themes$1, new Registry$1("theme", { duplicate: "warn" }));
		}
		/** Number of registered themes. */
		get size() {
			return _classPrivateFieldGet2(_themes$1, this).size;
		}
		/** Registers (or replaces) a theme module. */
		register(theme) {
			_classPrivateFieldGet2(_themes$1, this).register(theme.themeId, theme);
			return this;
		}
		/** The theme for `themeId`, or `null`. */
		resolve(themeId) {
			return _classPrivateFieldGet2(_themes$1, this).resolve(themeId);
		}
		/** Whether a theme id is registered. */
		has(themeId) {
			return _classPrivateFieldGet2(_themes$1, this).has(themeId);
		}
		/** Registered theme ids, in registration order. */
		ids() {
			return _classPrivateFieldGet2(_themes$1, this).ids();
		}
		/** All registered themes. */
		all() {
			return _classPrivateFieldGet2(_themes$1, this).entries().map((entry) => entry.value);
		}
		/** Removes every theme. */
		clear() {
			_classPrivateFieldGet2(_themes$1, this).clear();
		}
	};
	// packages/modules/theme/src/ThemeRenderer.ts
	var _themes = /* @__PURE__ */ new WeakMap();
	var _templates = /* @__PURE__ */ new WeakMap();
	var _id = /* @__PURE__ */ new WeakMap();
	var _active = /* @__PURE__ */ new WeakMap();
	var _ThemeRenderer_brand = /* @__PURE__ */ new WeakSet();
	/**
	* Theme renderer — the `theme` slot.
	*
	* It is a plain object with three phases, not an event subscriber: the app calls
	* `prepare` before the DOM is built, `activate` after it is attached, and `deactivate`
	* before the page is replaced. That is why no listener has to guess the right moment,
	* and why two apps on one page cannot steal each other's theme.
	*
	* Templates land in an instance `TemplateRegistry` which installs itself into the core
	* port, replacing the old `globalThis.TemplateRegistry`.
	*
	* Typed structurally (`page: any`) on purpose: this package must not depend on
	* `@aio-ui/app`, so the app's `iThemePort` accepts it by shape.
	*/
	var ThemeRenderer = class {
		constructor(config = {}) {
			_classPrivateMethodInitSpec(this, _ThemeRenderer_brand);
			_classPrivateFieldInitSpec(this, _themes, new ThemeRegistry());
			_classPrivateFieldInitSpec(this, _templates, new TemplateRegistry$1());
			_classPrivateFieldInitSpec(this, _id, void 0);
			_classPrivateFieldInitSpec(this, _active, null);
			for (const theme of config.themes ?? []) _classPrivateFieldGet2(_themes, this).register(theme);
			setTemplates$1(_classPrivateFieldGet2(_templates, this));
			for (const theme of _classPrivateFieldGet2(_themes, this).all()) _assertClassBrand(_ThemeRenderer_brand, this, _registerTemplates).call(this, theme);
			_classPrivateFieldSet2(_id, this, _classPrivateFieldGet2(_themes, this).ids()[0] ?? "default");
			_classPrivateFieldSet2(_active, this, _classPrivateFieldGet2(_themes, this).resolve(_classPrivateFieldGet2(_id, this)));
		}
		/** Registered theme ids. */
		get ids() {
			return _classPrivateFieldGet2(_themes, this).ids();
		}
		/** Currently applied theme id. */
		get current() {
			return _classPrivateFieldGet2(_id, this);
		}
		/**
		* Adds a theme after construction.
		*
		* Registration is not tied to the constructor: a theme is just an id plus hooks, and
		* its templates are per-instance, so adding one later is safe. If no theme was active
		* yet (unknown id), the new one becomes the active theme.
		*/
		register(theme) {
			_classPrivateFieldGet2(_themes, this).register(theme);
			_assertClassBrand(_ThemeRenderer_brand, this, _registerTemplates).call(this, theme);
			if (!_classPrivateFieldGet2(_active, this)) {
				_classPrivateFieldSet2(_active, this, theme);
				_classPrivateFieldSet2(_id, this, theme.themeId);
			}
		}
		/** Switches the active theme. Unknown ids are reported and ignored. */
		use(themeId) {
			const next = _classPrivateFieldGet2(_themes, this).resolve(themeId);
			if (!next) {
				console.warn(`[ThemeRenderer] Unknown theme "${themeId}"; keeping "${_classPrivateFieldGet2(_id, this)}".`);
				return;
			}
			_classPrivateFieldSet2(_active, this, next);
			_classPrivateFieldSet2(_id, this, themeId);
		}
		/** Structural hook: lets the active theme rewrite the page before rendering. */
		prepare(page, _route, themeId) {
			this.use(themeId);
			const theme = _classPrivateFieldGet2(_active, this);
			if (!theme?.beforePageRender) return page;
			const isDocument = Array.isArray(page?.blocks);
			const nodes = isDocument ? page.blocks : [page];
			const result = theme.beforePageRender(nodes, null, null);
			if (!result) return page;
			return isDocument ? {
				...page,
				blocks: result.pages
			} : result.pages[0] ?? page;
		}
		/** Behavioural hook: runs once the page is live. */
		activate(shell, blocks) {
			_classPrivateFieldGet2(_active, this)?.activate(shell, Array.from(blocks.values()), { setConfig: () => void 0 });
		}
		/** Cleanup hook: runs before the page is replaced. */
		deactivate(shell) {
			_classPrivateFieldGet2(_active, this)?.deactivate?.(shell);
		}
		/** Releases the template store so a destroyed app leaves nothing installed. */
		destroy() {
			setTemplates$1(null);
			_classPrivateFieldGet2(_templates, this).clear();
			_classPrivateFieldGet2(_themes, this).clear();
		}
	};
	function _registerTemplates(theme) {
		const templates = theme.templates?.();
		if (!templates) return;
		for (const [key, handler] of Object.entries(templates)) _classPrivateFieldGet2(_templates, this).register(theme.themeId, key, handler);
	}
	_defineProperty(ThemeRenderer, "slot", "theme");
	// packages/modules/theme/src/index.ts
	var src_exports$4 = /* @__PURE__ */ __exportAll({
		ThemeRegistry: () => ThemeRegistry,
		ThemeRenderer: () => ThemeRenderer
	});
	// packages/themes/cyberpunk/src/CyberpunkTheme.ts
	/**
	* Cyberpunk theme — tokens only.
	*
	* A theme can do three things: reshape the page tree (`beforePageRender`), decorate the
	* live shell (`activate`), and undo that (`deactivate`). This one only flips a marker
	* attribute; everything visual comes from `CyberpunkTheme.css`, which overrides the
	* `--app-*` tokens. That is the cheapest possible theme: no listeners, no DOM surgery,
	* no per-component code — every component that reads the tokens restyles itself.
	*
	* Host responsibility: import `@aio-ui/theme-cyberpunk/CyberpunkTheme.css` once.
	*/
	var THEME_ID$1 = "cyberpunk";
	var CyberpunkTheme$1 = class {
		constructor() {
			_defineProperty(this, "themeId", THEME_ID$1);
			_defineProperty(this, "name", "Cyberpunk");
		}
		/** Structural hook — the page tree is authored as-is. */
		beforePageRender(pages, menu, footer) {
			return {
				pages,
				menu,
				footer
			};
		}
		/** Behavioural hook — the CSS does the work; this only marks the scope. */
		activate(shell, _elements, _context) {
			shell.dataset.theme = THEME_ID$1;
		}
		/** Unmount hook — leave the shell as found. */
		deactivate(shell) {
			if (shell.dataset.theme === THEME_ID$1) delete shell.dataset.theme;
		}
	};
	// packages/themes/cyberpunk/src/index.ts
	var src_exports$3 = /* @__PURE__ */ __exportAll({ CyberpunkTheme: () => CyberpunkTheme$1 });
	// packages/themes/default/src/DefaultTheme.ts
	/**
	* Default theme.
	*
	* The reference implementation of `iThemeModule`, kept deliberately small: it adds no
	* classes, no overrides, no listeners. Every other theme is a diff against this one.
	*/
	var DefaultTheme$1 = class {
		constructor() {
			_defineProperty(this, "themeId", "default");
			_defineProperty(this, "name", "Default");
		}
		/** Structural hook — runs before the DOM is built. */
		beforePageRender(pages, menu, footer) {
			return {
				pages,
				menu,
				footer
			};
		}
		/** Behavioural hook — runs once the page is live. */
		activate(shell, _elements, _context) {
			shell.style.display = "block";
			shell.style.overflow = "initial";
		}
		/** Unmount hook. */
		deactivate(shell) {
			shell.removeAttribute("style");
		}
	};
	// packages/themes/default/src/index.ts
	var src_exports$2 = /* @__PURE__ */ __exportAll({ DefaultTheme: () => DefaultTheme$1 });
	// packages/themes/horizontal/src/HorizontalScrolling.ts
	var HorizontalScrollingPage$1 = class {
		constructor(config = {}) {
			_defineProperty(this, "config", void 0);
			_defineProperty(this, "currentShell", null);
			_defineProperty(this, "menuRef", null);
			_defineProperty(this, "toggleButton", null);
			_defineProperty(this, "timelineLabelElement", null);
			_defineProperty(this, "panelElementsCache", []);
			_defineProperty(this, "styleElement", null);
			_defineProperty(this, "scrollTimeout", null);
			_defineProperty(this, "panelListeners", /* @__PURE__ */ new Map());
			_defineProperty(this, "resizeListener", () => {
				this.pageScrollListener();
			});
			_defineProperty(this, "touchStartX", 0);
			_defineProperty(this, "touchStartY", 0);
			_defineProperty(this, "scrollLeftStart", 0);
			_defineProperty(this, "wheelHijackListener", (e) => {
				if (!this.currentShell) return;
				const cursorY = e.clientY;
				const bottomZoneThreshold = window.innerHeight - this.config.bottomZoneHeight;
				const activePanel = e.target;
				const panelSelector = this.resolveSelector("@panel");
				const basePanelClass = panelSelector.includes(".") ? panelSelector.split(".")[1] : panelSelector;
				const closestPanel = activePanel.closest(`.${basePanelClass}`);
				if (cursorY >= bottomZoneThreshold) {
					e.preventDefault();
					this.currentShell.scrollLeft += e.deltaY * this.config.horizontalMultiplier;
					return;
				}
				if (closestPanel) {
					const scrollHeight = closestPanel.scrollHeight;
					const clientHeight = closestPanel.clientHeight;
					if (scrollHeight > clientHeight) {
						const isAtTop = closestPanel.scrollTop === 0;
						const isAtBottom = Math.abs(scrollHeight - clientHeight - closestPanel.scrollTop) < 1;
						if (!(isAtTop && e.deltaY < 0) && !(isAtBottom && e.deltaY > 0)) {
							closestPanel.scrollTop += e.deltaY;
							e.preventDefault();
							return;
						}
					}
				}
			});
			_defineProperty(this, "mouseMoveListener", (e) => {
				if (!this.currentShell || !this.timelineLabelElement) return;
				if (e.clientY >= window.innerHeight - this.config.bottomZoneHeight) {
					this.currentShell.classList.add("show-scrollbar");
					this.timelineLabelElement.classList.add("visible");
				} else {
					this.currentShell.classList.remove("show-scrollbar");
					this.timelineLabelElement.classList.remove("visible");
				}
			});
			_defineProperty(this, "mouseLeaveListener", () => {
				if (!this.currentShell || !this.timelineLabelElement) return;
				this.currentShell.classList.remove("show-scrollbar");
				this.timelineLabelElement.classList.remove("visible");
			});
			_defineProperty(this, "touchStartListener", (e) => {
				if (!this.currentShell) return;
				this.touchStartX = e.touches[0].clientX;
				this.touchStartY = e.touches[0].clientY;
				this.scrollLeftStart = this.currentShell.scrollLeft;
			});
			_defineProperty(this, "touchMoveListener", (e) => {
				if (!this.currentShell) return;
				const touchX = e.touches[0].clientX;
				const touchY = e.touches[0].clientY;
				const deltaX = this.touchStartX - touchX;
				const deltaY = this.touchStartY - touchY;
				const activePanel = e.target;
				const panelSelector = this.resolveSelector("@panel");
				const basePanelClass = panelSelector.includes(".") ? panelSelector.split(".")[1] : panelSelector;
				const closestPanel = activePanel.closest(`.${basePanelClass}`);
				if (closestPanel && closestPanel.scrollHeight > closestPanel.clientHeight) {
					if (Math.abs(deltaY) > Math.abs(deltaX)) return;
				}
				this.currentShell.scrollLeft = this.scrollLeftStart + deltaX;
				e.preventDefault();
			});
			_defineProperty(this, "pageScrollListener", () => {
				if (!this.timelineLabelElement || this.panelElementsCache.length === 0) return;
				if (this.scrollTimeout) return;
				this.scrollTimeout = window.requestAnimationFrame(() => {
					this.scrollTimeout = null;
					let currentActiveName = this.config.defaultSectionName;
					const viewportCenterX = window.innerWidth / 2;
					for (const panel of this.panelElementsCache) {
						const rect = panel.getBoundingClientRect();
						if (rect.left <= viewportCenterX && rect.right >= viewportCenterX) {
							currentActiveName = panel.getAttribute("data-name") || panel.id || "SECTION";
							break;
						}
					}
					if (this.timelineLabelElement && this.timelineLabelElement.textContent !== currentActiveName) this.timelineLabelElement.textContent = currentActiveName;
				});
			});
			this.config = {
				bottomZoneHeight: config.bottomZoneHeight ?? 150,
				horizontalMultiplier: config.horizontalMultiplier ?? 15,
				fallbackMultiplier: config.fallbackMultiplier ?? 1.2,
				defaultSectionName: config.defaultSectionName ?? "EXPLORE",
				autoInjectNavLayout: config.autoInjectNavLayout ?? true,
				selectors: {
					"@shell": {
						tagName: "div",
						className: "theme-horizontal"
					},
					"@panel": {
						tagName: "section",
						className: "horizontal"
					},
					"@nav": {
						tagName: "nav",
						className: "nav"
					},
					"@trigger": {
						tagName: "button",
						className: "sidebar trigger"
					},
					...config.selectors || {}
				},
				onNavFound: config.onNavFound ?? ((navElement, toggleButton) => {
					navElement.insertBefore(toggleButton, navElement.firstElementChild);
					toggleButton.addEventListener("click", () => {
						navElement.classList.toggle("expanded");
					});
				})
			};
		}
		resolveSelector(key) {
			const prop = this.config.selectors[key];
			if (!prop) return "";
			const tag = prop.tagName ? prop.tagName.trim() : "";
			const classes = prop.className ? prop.className.trim().split(/\s+/).join(".") : "";
			if (tag && classes) return `${tag}.${classes}`;
			else if (tag) return tag;
			else if (classes) return `.${classes}`;
			return "";
		}
		injectDynamicStyles() {
			const shellProp = this.config.selectors["@shell"];
			const panelProp = this.config.selectors["@panel"];
			const shellClassName = shellProp?.className ? shellProp.className.split(" ")[0] : "theme-horizontal";
			const navSelector = this.resolveSelector("@nav");
			const panelClassName = panelProp?.className ? panelProp.className.split(" ")[0] : "horizontal";
			this.styleElement = document.createElement("style");
			this.styleElement.id = "horizontal-scrolling-page-styles";
			this.styleElement.textContent = `
      .timeline.label {
        position: fixed;
        bottom: 35px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1001;
        background: var(--app-primary-color, #333);
        color: #ffffff;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        pointer-events: none;
        backdrop-filter: blur(4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.1);
        opacity: 0;
        transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.2s;
      }
      .timeline.label.visible {
        opacity: 1;
      }

      .${shellClassName} {
        scrollbar-width: none;
        -ms-overflow-style: none;
        --sidebar-width: var(--sidebar-collapsed-width, 70px);
        margin-left: var(--sidebar-width);
        transition: margin-left 0.3s ease;
      }
      .${shellClassName}::-webkit-scrollbar {
        height: 6px;
        display: none;
      }
      .${shellClassName}.show-scrollbar::-webkit-scrollbar {
        display: block;
      }
      .${shellClassName}.show-scrollbar {
        scrollbar-width: thin;
      }

      body:has(${navSelector}.expanded) .${shellClassName} {
        --sidebar-width: var(--sidebar-expanded-width, 260px);
      }

      .${shellClassName} .${panelClassName} {
        overflow-y: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        scrollbar-gutter: stable;
      }
      .${shellClassName} .${panelClassName}::-webkit-scrollbar {
        width: 6px;
        display: none;
      }
      .${shellClassName} .${panelClassName}.show-scrollbar {
        scrollbar-width: thin !important;
      }
      .${shellClassName} .${panelClassName}.show-scrollbar::-webkit-scrollbar {
        display: block !important;
      }

      ${this.config.autoInjectNavLayout ? `
        .${shellClassName} ${navSelector} {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box;
          z-index: 1000;
          transition: width 0.3s ease;
          width: var(--sidebar-collapsed-width, 70px);
        }
        .${shellClassName} ${navSelector}.expanded {
          width: var(--sidebar-expanded-width, 260px);
        }
        .${shellClassName} ${navSelector} > .navigations {
          display: flex !important;
          flex-direction: column !important;
          flex: 1;
          overflow-y: auto;
        }
        .${shellClassName} ${navSelector} > .actions {
          margin-top: auto;
        }
      ` : ""}
    `;
			document.head.appendChild(this.styleElement);
		}
		createTimelineLabel() {
			this.injectDynamicStyles();
			const el = document.createElement("div");
			el.className = "timeline label";
			document.body.append(el);
			return el;
		}
		activate(shell, elements) {
			this.currentShell = shell;
			const shellProp = this.config.selectors["@shell"];
			const shellClassName = shellProp?.className ? shellProp.className.split(" ")[0] : "theme-horizontal";
			shell.classList.add(shellClassName);
			document.body.dataset.theme = shellClassName;
			const rawElements = Array.from(elements);
			const panelSelector = this.resolveSelector("@panel");
			const panelClassName = panelSelector.includes(".") ? panelSelector.split(".")[1] : panelSelector;
			this.panelElementsCache = rawElements.filter((el) => el.classList.contains(panelClassName));
			if (this.panelElementsCache.length === 0) this.panelElementsCache = rawElements;
			this.panelElementsCache.forEach((panel) => {
				const enterListener = () => {
					if (panel.scrollHeight > panel.clientHeight) panel.classList.add("show-scrollbar");
				};
				const leaveListener = () => panel.classList.remove("show-scrollbar");
				panel.addEventListener("mouseenter", enterListener);
				panel.addEventListener("mouseleave", leaveListener);
				this.panelListeners.set(panel, {
					enter: enterListener,
					leave: leaveListener
				});
			});
			this.timelineLabelElement = this.createTimelineLabel();
			if (!this.timelineLabelElement.textContent) this.timelineLabelElement.textContent = this.config.defaultSectionName;
			const navSelector = this.resolveSelector("@nav");
			this.menuRef = shell.querySelector(navSelector) || document.querySelector(navSelector);
			if (this.menuRef && this.config.onNavFound) {
				this.toggleButton = document.createElement("button");
				this.toggleButton.className = this.config.selectors["@trigger"]?.className || "sidebar trigger";
				this.config.onNavFound(this.menuRef, this.toggleButton);
			}
			shell.addEventListener("wheel", this.wheelHijackListener, { passive: false });
			shell.addEventListener("mousemove", this.mouseMoveListener);
			shell.addEventListener("mouseleave", this.mouseLeaveListener);
			shell.addEventListener("scroll", this.pageScrollListener, { passive: true });
			shell.addEventListener("touchstart", this.touchStartListener, { passive: true });
			shell.addEventListener("touchmove", this.touchMoveListener, { passive: false });
			window.addEventListener("resize", this.resizeListener);
			this.pageScrollListener();
		}
		deactivate(shell) {
			if (this.currentShell) {
				this.currentShell.removeEventListener("wheel", this.wheelHijackListener);
				this.currentShell.removeEventListener("mousemove", this.mouseMoveListener);
				this.currentShell.removeEventListener("mouseleave", this.mouseLeaveListener);
				this.currentShell.removeEventListener("scroll", this.pageScrollListener);
				this.currentShell.removeEventListener("touchstart", this.touchStartListener);
				this.currentShell.removeEventListener("touchmove", this.touchMoveListener);
			}
			window.removeEventListener("resize", this.resizeListener);
			this.panelListeners.forEach((listeners, panel) => {
				panel.removeEventListener("mouseenter", listeners.enter);
				panel.removeEventListener("mouseleave", listeners.leave);
				panel.classList.remove("show-scrollbar");
			});
			this.panelListeners.clear();
			if (this.scrollTimeout) {
				window.cancelAnimationFrame(this.scrollTimeout);
				this.scrollTimeout = null;
			}
			if (this.timelineLabelElement && this.timelineLabelElement.parentNode) this.timelineLabelElement.parentNode.removeChild(this.timelineLabelElement);
			if (this.styleElement && this.styleElement.parentNode) this.styleElement.parentNode.removeChild(this.styleElement);
			if (this.toggleButton && this.toggleButton.parentNode) this.toggleButton.parentNode.removeChild(this.toggleButton);
			if (this.menuRef) this.menuRef.classList.remove("expanded");
			if (shell) {
				const shellProp = this.config.selectors["@shell"];
				const shellClassName = shellProp?.className ? shellProp.className.split(" ")[0] : "theme-horizontal";
				shell.classList.remove(shellClassName);
				shell.removeAttribute("style");
			}
			delete document.body.dataset.theme;
			this.currentShell = null;
			this.menuRef = null;
			this.toggleButton = null;
			this.timelineLabelElement = null;
			this.styleElement = null;
			this.panelElementsCache = [];
			console.log("[HorizontalTheme] Clean unmount executed. Framework is ready for the next transformation.");
		}
	};
	// packages/themes/horizontal/src/HorizontalTheme.ts
	var _scroller$1 = /* @__PURE__ */ new WeakMap();
	/**
	* Horizontal theme.
	*
	* The scrolling behaviour already existed as `HorizontalScrollingPage`, a standalone
	* module with `activate(shell, elements)` and `deactivate(shell)` — the same two hooks a
	* theme needs. This class is the adapter that makes it a first-class theme without
	* duplicating a line of the scroll logic.
	*
	* Note: a theme applies to **every** route, which is the point of a layout theme. A page
	* that ships its own `new HorizontalScrollingPage().activate(...)` inside `onCreated`
	* would double-apply it, so that call belongs to the theme from now on.
	*/
	var HorizontalTheme$1 = class {
		constructor(config = {}) {
			_defineProperty(this, "themeId", "horizontal");
			_defineProperty(this, "name", "Horizontal");
			_classPrivateFieldInitSpec(this, _scroller$1, void 0);
			_classPrivateFieldSet2(_scroller$1, this, new HorizontalScrollingPage$1(config));
		}
		/** Structural hook — a horizontal layout keeps the page tree as authored. */
		beforePageRender(pages, menu, footer) {
			return {
				pages,
				menu,
				footer
			};
		}
		/** Behavioural hook — wires the scroll engine to the live page. */
		activate(shell, elements, _context) {
			_classPrivateFieldGet2(_scroller$1, this).activate(shell, elements);
		}
		/** Unmount hook — releases listeners and injected styles. */
		deactivate(shell) {
			_classPrivateFieldGet2(_scroller$1, this).deactivate(shell);
		}
	};
	// packages/themes/horizontal/src/index.ts
	var src_exports$1 = /* @__PURE__ */ __exportAll({
		HorizontalScrollingPage: () => HorizontalScrollingPage$1,
		HorizontalTheme: () => HorizontalTheme$1
	});
	// packages/themes/default/dist/DefaultTheme.js
	/**
	* Default theme.
	*
	* The reference implementation of `iThemeModule`, kept deliberately small: it adds no
	* classes, no overrides, no listeners. Every other theme is a diff against this one.
	*/
	var DefaultTheme = class {
		constructor() {
			_defineProperty(this, "themeId", "default");
			_defineProperty(this, "name", "Default");
		}
		/** Structural hook — runs before the DOM is built. */
		beforePageRender(pages, menu, footer) {
			return {
				pages,
				menu,
				footer
			};
		}
		/** Behavioural hook — runs once the page is live. */
		activate(shell, _elements, _context) {
			shell.style.display = "block";
			shell.style.overflow = "initial";
		}
		/** Unmount hook. */
		deactivate(shell) {
			shell.removeAttribute("style");
		}
	};
	// packages/themes/cyberpunk/dist/CyberpunkTheme.js
	/**
	* Cyberpunk theme — tokens only.
	*
	* A theme can do three things: reshape the page tree (`beforePageRender`), decorate the
	* live shell (`activate`), and undo that (`deactivate`). This one only flips a marker
	* attribute; everything visual comes from `CyberpunkTheme.css`, which overrides the
	* `--app-*` tokens. That is the cheapest possible theme: no listeners, no DOM surgery,
	* no per-component code — every component that reads the tokens restyles itself.
	*
	* Host responsibility: import `@aio-ui/theme-cyberpunk/CyberpunkTheme.css` once.
	*/
	var THEME_ID = "cyberpunk";
	var CyberpunkTheme = class {
		constructor() {
			_defineProperty(this, "themeId", THEME_ID);
			_defineProperty(this, "name", "Cyberpunk");
		}
		/** Structural hook — the page tree is authored as-is. */
		beforePageRender(pages, menu, footer) {
			return {
				pages,
				menu,
				footer
			};
		}
		/** Behavioural hook — the CSS does the work; this only marks the scope. */
		activate(shell, _elements, _context) {
			shell.dataset.theme = THEME_ID;
		}
		/** Unmount hook — leave the shell as found. */
		deactivate(shell) {
			if (shell.dataset.theme === THEME_ID) delete shell.dataset.theme;
		}
	};
	// packages/themes/horizontal/dist/HorizontalScrolling.js
	var HorizontalScrollingPage = class {
		constructor(config = {}) {
			_defineProperty(this, "config", void 0);
			_defineProperty(this, "currentShell", null);
			_defineProperty(this, "menuRef", null);
			_defineProperty(this, "toggleButton", null);
			_defineProperty(this, "timelineLabelElement", null);
			_defineProperty(this, "panelElementsCache", []);
			_defineProperty(this, "styleElement", null);
			_defineProperty(this, "scrollTimeout", null);
			_defineProperty(this, "panelListeners", /* @__PURE__ */ new Map());
			_defineProperty(this, "resizeListener", () => {
				this.pageScrollListener();
			});
			_defineProperty(this, "touchStartX", 0);
			_defineProperty(this, "touchStartY", 0);
			_defineProperty(this, "scrollLeftStart", 0);
			_defineProperty(this, "wheelHijackListener", (e) => {
				if (!this.currentShell) return;
				const cursorY = e.clientY;
				const bottomZoneThreshold = window.innerHeight - this.config.bottomZoneHeight;
				const activePanel = e.target;
				const panelSelector = this.resolveSelector("@panel");
				const basePanelClass = panelSelector.includes(".") ? panelSelector.split(".")[1] : panelSelector;
				const closestPanel = activePanel.closest(`.${basePanelClass}`);
				if (cursorY >= bottomZoneThreshold) {
					e.preventDefault();
					this.currentShell.scrollLeft += e.deltaY * this.config.horizontalMultiplier;
					return;
				}
				if (closestPanel) {
					const scrollHeight = closestPanel.scrollHeight;
					const clientHeight = closestPanel.clientHeight;
					if (scrollHeight > clientHeight) {
						const isAtTop = closestPanel.scrollTop === 0;
						const isAtBottom = Math.abs(scrollHeight - clientHeight - closestPanel.scrollTop) < 1;
						if (!(isAtTop && e.deltaY < 0) && !(isAtBottom && e.deltaY > 0)) {
							closestPanel.scrollTop += e.deltaY;
							e.preventDefault();
							return;
						}
					}
				}
			});
			_defineProperty(this, "mouseMoveListener", (e) => {
				if (!this.currentShell || !this.timelineLabelElement) return;
				if (e.clientY >= window.innerHeight - this.config.bottomZoneHeight) {
					this.currentShell.classList.add("show-scrollbar");
					this.timelineLabelElement.classList.add("visible");
				} else {
					this.currentShell.classList.remove("show-scrollbar");
					this.timelineLabelElement.classList.remove("visible");
				}
			});
			_defineProperty(this, "mouseLeaveListener", () => {
				if (!this.currentShell || !this.timelineLabelElement) return;
				this.currentShell.classList.remove("show-scrollbar");
				this.timelineLabelElement.classList.remove("visible");
			});
			_defineProperty(this, "touchStartListener", (e) => {
				if (!this.currentShell) return;
				this.touchStartX = e.touches[0].clientX;
				this.touchStartY = e.touches[0].clientY;
				this.scrollLeftStart = this.currentShell.scrollLeft;
			});
			_defineProperty(this, "touchMoveListener", (e) => {
				if (!this.currentShell) return;
				const touchX = e.touches[0].clientX;
				const touchY = e.touches[0].clientY;
				const deltaX = this.touchStartX - touchX;
				const deltaY = this.touchStartY - touchY;
				const activePanel = e.target;
				const panelSelector = this.resolveSelector("@panel");
				const basePanelClass = panelSelector.includes(".") ? panelSelector.split(".")[1] : panelSelector;
				const closestPanel = activePanel.closest(`.${basePanelClass}`);
				if (closestPanel && closestPanel.scrollHeight > closestPanel.clientHeight) {
					if (Math.abs(deltaY) > Math.abs(deltaX)) return;
				}
				this.currentShell.scrollLeft = this.scrollLeftStart + deltaX;
				e.preventDefault();
			});
			_defineProperty(this, "pageScrollListener", () => {
				if (!this.timelineLabelElement || this.panelElementsCache.length === 0) return;
				if (this.scrollTimeout) return;
				this.scrollTimeout = window.requestAnimationFrame(() => {
					this.scrollTimeout = null;
					let currentActiveName = this.config.defaultSectionName;
					const viewportCenterX = window.innerWidth / 2;
					for (const panel of this.panelElementsCache) {
						const rect = panel.getBoundingClientRect();
						if (rect.left <= viewportCenterX && rect.right >= viewportCenterX) {
							currentActiveName = panel.getAttribute("data-name") || panel.id || "SECTION";
							break;
						}
					}
					if (this.timelineLabelElement && this.timelineLabelElement.textContent !== currentActiveName) this.timelineLabelElement.textContent = currentActiveName;
				});
			});
			this.config = {
				bottomZoneHeight: config.bottomZoneHeight ?? 150,
				horizontalMultiplier: config.horizontalMultiplier ?? 15,
				fallbackMultiplier: config.fallbackMultiplier ?? 1.2,
				defaultSectionName: config.defaultSectionName ?? "EXPLORE",
				autoInjectNavLayout: config.autoInjectNavLayout ?? true,
				selectors: {
					"@shell": {
						tagName: "div",
						className: "theme-horizontal"
					},
					"@panel": {
						tagName: "section",
						className: "horizontal"
					},
					"@nav": {
						tagName: "nav",
						className: "nav"
					},
					"@trigger": {
						tagName: "button",
						className: "sidebar trigger"
					},
					...config.selectors || {}
				},
				onNavFound: config.onNavFound ?? ((navElement, toggleButton) => {
					navElement.insertBefore(toggleButton, navElement.firstElementChild);
					toggleButton.addEventListener("click", () => {
						navElement.classList.toggle("expanded");
					});
				})
			};
		}
		resolveSelector(key) {
			const prop = this.config.selectors[key];
			if (!prop) return "";
			const tag = prop.tagName ? prop.tagName.trim() : "";
			const classes = prop.className ? prop.className.trim().split(/\s+/).join(".") : "";
			if (tag && classes) return `${tag}.${classes}`;
			else if (tag) return tag;
			else if (classes) return `.${classes}`;
			return "";
		}
		injectDynamicStyles() {
			const shellProp = this.config.selectors["@shell"];
			const panelProp = this.config.selectors["@panel"];
			const shellClassName = shellProp?.className ? shellProp.className.split(" ")[0] : "theme-horizontal";
			const navSelector = this.resolveSelector("@nav");
			const panelClassName = panelProp?.className ? panelProp.className.split(" ")[0] : "horizontal";
			this.styleElement = document.createElement("style");
			this.styleElement.id = "horizontal-scrolling-page-styles";
			this.styleElement.textContent = `
      .timeline.label {
        position: fixed;
        bottom: 35px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1001;
        background: var(--app-primary-color, #333);
        color: #ffffff;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        pointer-events: none;
        backdrop-filter: blur(4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.1);
        opacity: 0;
        transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.2s;
      }
      .timeline.label.visible {
        opacity: 1;
      }

      .${shellClassName} {
        scrollbar-width: none;
        -ms-overflow-style: none;
        --sidebar-width: var(--sidebar-collapsed-width, 70px);
        margin-left: var(--sidebar-width);
        transition: margin-left 0.3s ease;
      }
      .${shellClassName}::-webkit-scrollbar {
        height: 6px;
        display: none;
      }
      .${shellClassName}.show-scrollbar::-webkit-scrollbar {
        display: block;
      }
      .${shellClassName}.show-scrollbar {
        scrollbar-width: thin;
      }

      body:has(${navSelector}.expanded) .${shellClassName} {
        --sidebar-width: var(--sidebar-expanded-width, 260px);
      }

      .${shellClassName} .${panelClassName} {
        overflow-y: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        scrollbar-gutter: stable;
      }
      .${shellClassName} .${panelClassName}::-webkit-scrollbar {
        width: 6px;
        display: none;
      }
      .${shellClassName} .${panelClassName}.show-scrollbar {
        scrollbar-width: thin !important;
      }
      .${shellClassName} .${panelClassName}.show-scrollbar::-webkit-scrollbar {
        display: block !important;
      }

      ${this.config.autoInjectNavLayout ? `
        .${shellClassName} ${navSelector} {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box;
          z-index: 1000;
          transition: width 0.3s ease;
          width: var(--sidebar-collapsed-width, 70px);
        }
        .${shellClassName} ${navSelector}.expanded {
          width: var(--sidebar-expanded-width, 260px);
        }
        .${shellClassName} ${navSelector} > .navigations {
          display: flex !important;
          flex-direction: column !important;
          flex: 1;
          overflow-y: auto;
        }
        .${shellClassName} ${navSelector} > .actions {
          margin-top: auto;
        }
      ` : ""}
    `;
			document.head.appendChild(this.styleElement);
		}
		createTimelineLabel() {
			this.injectDynamicStyles();
			const el = document.createElement("div");
			el.className = "timeline label";
			document.body.append(el);
			return el;
		}
		activate(shell, elements) {
			this.currentShell = shell;
			const shellProp = this.config.selectors["@shell"];
			const shellClassName = shellProp?.className ? shellProp.className.split(" ")[0] : "theme-horizontal";
			shell.classList.add(shellClassName);
			document.body.dataset.theme = shellClassName;
			const rawElements = Array.from(elements);
			const panelSelector = this.resolveSelector("@panel");
			const panelClassName = panelSelector.includes(".") ? panelSelector.split(".")[1] : panelSelector;
			this.panelElementsCache = rawElements.filter((el) => el.classList.contains(panelClassName));
			if (this.panelElementsCache.length === 0) this.panelElementsCache = rawElements;
			this.panelElementsCache.forEach((panel) => {
				const enterListener = () => {
					if (panel.scrollHeight > panel.clientHeight) panel.classList.add("show-scrollbar");
				};
				const leaveListener = () => panel.classList.remove("show-scrollbar");
				panel.addEventListener("mouseenter", enterListener);
				panel.addEventListener("mouseleave", leaveListener);
				this.panelListeners.set(panel, {
					enter: enterListener,
					leave: leaveListener
				});
			});
			this.timelineLabelElement = this.createTimelineLabel();
			if (!this.timelineLabelElement.textContent) this.timelineLabelElement.textContent = this.config.defaultSectionName;
			const navSelector = this.resolveSelector("@nav");
			this.menuRef = shell.querySelector(navSelector) || document.querySelector(navSelector);
			if (this.menuRef && this.config.onNavFound) {
				this.toggleButton = document.createElement("button");
				this.toggleButton.className = this.config.selectors["@trigger"]?.className || "sidebar trigger";
				this.config.onNavFound(this.menuRef, this.toggleButton);
			}
			shell.addEventListener("wheel", this.wheelHijackListener, { passive: false });
			shell.addEventListener("mousemove", this.mouseMoveListener);
			shell.addEventListener("mouseleave", this.mouseLeaveListener);
			shell.addEventListener("scroll", this.pageScrollListener, { passive: true });
			shell.addEventListener("touchstart", this.touchStartListener, { passive: true });
			shell.addEventListener("touchmove", this.touchMoveListener, { passive: false });
			window.addEventListener("resize", this.resizeListener);
			this.pageScrollListener();
		}
		deactivate(shell) {
			if (this.currentShell) {
				this.currentShell.removeEventListener("wheel", this.wheelHijackListener);
				this.currentShell.removeEventListener("mousemove", this.mouseMoveListener);
				this.currentShell.removeEventListener("mouseleave", this.mouseLeaveListener);
				this.currentShell.removeEventListener("scroll", this.pageScrollListener);
				this.currentShell.removeEventListener("touchstart", this.touchStartListener);
				this.currentShell.removeEventListener("touchmove", this.touchMoveListener);
			}
			window.removeEventListener("resize", this.resizeListener);
			this.panelListeners.forEach((listeners, panel) => {
				panel.removeEventListener("mouseenter", listeners.enter);
				panel.removeEventListener("mouseleave", listeners.leave);
				panel.classList.remove("show-scrollbar");
			});
			this.panelListeners.clear();
			if (this.scrollTimeout) {
				window.cancelAnimationFrame(this.scrollTimeout);
				this.scrollTimeout = null;
			}
			if (this.timelineLabelElement && this.timelineLabelElement.parentNode) this.timelineLabelElement.parentNode.removeChild(this.timelineLabelElement);
			if (this.styleElement && this.styleElement.parentNode) this.styleElement.parentNode.removeChild(this.styleElement);
			if (this.toggleButton && this.toggleButton.parentNode) this.toggleButton.parentNode.removeChild(this.toggleButton);
			if (this.menuRef) this.menuRef.classList.remove("expanded");
			if (shell) {
				const shellProp = this.config.selectors["@shell"];
				const shellClassName = shellProp?.className ? shellProp.className.split(" ")[0] : "theme-horizontal";
				shell.classList.remove(shellClassName);
				shell.removeAttribute("style");
			}
			delete document.body.dataset.theme;
			this.currentShell = null;
			this.menuRef = null;
			this.toggleButton = null;
			this.timelineLabelElement = null;
			this.styleElement = null;
			this.panelElementsCache = [];
			console.log("[HorizontalTheme] Clean unmount executed. Framework is ready for the next transformation.");
		}
	};
	// packages/themes/horizontal/dist/HorizontalTheme.js
	var _scroller = /* @__PURE__ */ new WeakMap();
	/**
	* Horizontal theme.
	*
	* The scrolling behaviour already existed as `HorizontalScrollingPage`, a standalone
	* module with `activate(shell, elements)` and `deactivate(shell)` — the same two hooks a
	* theme needs. This class is the adapter that makes it a first-class theme without
	* duplicating a line of the scroll logic.
	*
	* Note: a theme applies to **every** route, which is the point of a layout theme. A page
	* that ships its own `new HorizontalScrollingPage().activate(...)` inside `onCreated`
	* would double-apply it, so that call belongs to the theme from now on.
	*/
	var HorizontalTheme = class {
		constructor(config = {}) {
			_defineProperty(this, "themeId", "horizontal");
			_defineProperty(this, "name", "Horizontal");
			_classPrivateFieldInitSpec(this, _scroller, void 0);
			_classPrivateFieldSet2(_scroller, this, new HorizontalScrollingPage(config));
		}
		/** Structural hook — a horizontal layout keeps the page tree as authored. */
		beforePageRender(pages, menu, footer) {
			return {
				pages,
				menu,
				footer
			};
		}
		/** Behavioural hook — wires the scroll engine to the live page. */
		activate(shell, elements, _context) {
			_classPrivateFieldGet2(_scroller, this).activate(shell, elements);
		}
		/** Unmount hook — releases listeners and injected styles. */
		deactivate(shell) {
			_classPrivateFieldGet2(_scroller, this).deactivate(shell);
		}
	};
	// packages/kits/themes/index.ts
	var themes_exports = /* @__PURE__ */ __exportAll({
		CyberpunkTheme: () => CyberpunkTheme,
		DefaultTheme: () => DefaultTheme,
		HorizontalScrollingPage: () => HorizontalScrollingPage,
		HorizontalTheme: () => HorizontalTheme
	});
	// packages/utilities/src/AttributeUtils.ts
	/**
	* 🧩 APPLY ATTR DICTIONARY — stamp every `[name]: value` pair via setAttribute.
	* Values are stringified; `null`/`undefined` are skipped. Safe to call with
	* a missing dictionary (no-op).
	*/
	function applyAttrDictionary(el, attrs) {
		if (!attrs || typeof attrs !== "object") return;
		for (const [name, value] of Object.entries(attrs)) {
			if (value === null || value === void 0) continue;
			el.setAttribute(name, String(value));
		}
	}
	/**
	* 🧩 APPLY ATTRIBUTE LIST — stamp every `{ name, value }` pair.
	* Event-handler convention: `function` value + `on*` name → assigned as an
	* element property (live handler reference); anything else → setAttribute.
	*/
	function applyAttributeList(el, attributes) {
		if (!Array.isArray(attributes)) return;
		for (const attr of attributes) {
			if (!attr || typeof attr !== "object" || !attr.name) continue;
			if (typeof attr.value === "function" && attr.name.startsWith("on")) el[attr.name] = attr.value;
			else el.setAttribute(attr.name, attr.value);
		}
	}
	// packages/utilities/src/color.utils.ts
	function hexToRgb(hex) {
		return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_m, r, g, b) => "#" + r + r + g + g + b + b).substring(1).match(/.{2}/g).map((x) => parseInt(x, 16));
	}
	function generateRandomColor(Options, alpha, ColorSets) {
		const defaultColorSets = ColorSets ? ColorSets : [
			"#ff3700",
			"#ef9b26",
			"#fcf014",
			"#6cfc14",
			"#14f4fc",
			"#ac68ff",
			"#ff68d6",
			"#c9b7ff",
			"#2d8afc",
			"#f6b2ff"
		];
		const randomColor = defaultColorSets[Math.floor(Math.random() * defaultColorSets.length)];
		if (!Options || Options === "hex") return randomColor;
		else if (Options === "rgb") {
			const rgb = hexToRgb(randomColor);
			return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
		} else if (Options === "rgba") {
			const rgb = hexToRgb(randomColor);
			return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha ? alpha : 0})`;
		}
	}
	function hexToRgba(hex, alpha) {
		const rgb = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_m, r, g, b) => "#" + r + r + g + g + b + b).substring(1).match(/.{2}/g).map((x) => parseInt(x, 16));
		return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha ? alpha : 0})`;
	}
	// packages/utilities/src/DomUtils.ts
	function createImageError() {
		return `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <rect width="512" height="512" fill="lightgray" />
      <text
        x="50%"
        y="50%"
        font-family="sans-serif"
        font-size="3rem"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        Image Error
      </text>
    </svg>
  `)}`;
	}
	// packages/utilities/src/helper.ts
	function mergeInputConfig(data, item, watchAttr = [
		"required",
		"multiple",
		"disabled",
		"checked"
	]) {
		const normalizedData = {};
		for (const key in data) {
			const parts = key.split("-");
			let newKey = "";
			let value = data[key];
			if (value === "on") value = true;
			if (parts[1] === "data") {
				newKey = parts.slice(1).join("-");
				normalizedData[newKey] = value;
			} else {
				newKey = parts[parts.length - 1];
				normalizedData[newKey] = value;
			}
		}
		const result = { ...item };
		for (const key in normalizedData) result[key] = normalizedData[key];
		for (const key of watchAttr) if (!(key in normalizedData) && key in result) delete result[key];
		return result;
	}
	/**
	* Convert Number to text 1-16 only refers to semantic-ui el wide
	* @param {number} number
	* @returns {string}
	*/
	function numberToText(number) {
		const numberMap = {
			1: "one",
			2: "two",
			3: "three",
			4: "four",
			5: "five",
			6: "six",
			7: "seven",
			8: "eight",
			9: "nine",
			10: "ten",
			11: "eleven",
			12: "twelve",
			13: "thirteen",
			14: "fourteen",
			15: "fifteen",
			16: "sixteen"
		};
		if (number && typeof number !== "number") throw Error("parameter must be a number");
		else if (number && (number < 1 || number > 16)) throw Error("number must be between 1 and 16 inclusive");
		else if (!number) return;
		else return numberMap[number];
	}
	/**
	* Utility for building class-like strings with conditional chaining.
	*/
	var ToBeString = class {
		/**
		* @param base - Initial base value.
		*/
		constructor(base = "") {
			_defineProperty(this, "parts", void 0);
			_defineProperty(this, "settings", void 0);
			/** @private @type {string[]} */
			this.parts = [];
			/** @private @type {ToBeStringOptions} */
			this.settings = {
				ignoreDuplicate: false,
				separator: " ",
				prefix: "",
				suffix: ""
			};
			if (base) this.parts.push(base);
		}
		/**
		* Update configuration.
		* @param {ToBeStringOptions} options
		* @returns {this}
		*/
		config(options = {}) {
			Object.assign(this.settings, options);
			return this;
		}
		/**
		* Conditionally add class(es).
		* @param condition - If boolean, decides whether to add. If object, adds keys with truthy values.
		* @param className - String or array of strings to add.
		* @returns {this}
		*/
		add(condition, className) {
			if (typeof condition === "boolean" && condition && className) {
				if (Array.isArray(className)) className.forEach((v) => this._push(v));
				else this._push(className);
			} else if (typeof condition === "object" && condition !== null) {
				for (const [k, v] of Object.entries(condition)) if (v) this._push(k);
			} else if (typeof condition === "string" && !className) this._push(condition);
			return this;
		}
		/**
		* Conditionally add class(es) before the last added or even base .
		* @param condition - If boolean, decides whether to add. If object, adds keys with truthy classNames.
		* @param className - String or array of strings to add.
		* @returns {this}
		*/
		insertBefore(condition, className) {
			if (typeof condition === "boolean" && condition && className) {
				if (Array.isArray(className)) className.forEach((v) => this._unshift(v));
				else this._unshift(className);
			} else if (typeof condition === "object" && condition !== null) {
				for (const [k, v] of Object.entries(condition)) if (v) this._unshift(k);
			} else if (typeof condition === "string" && !className) this._unshift(condition);
			return this;
		}
		/**
		* Merge in entire class strings.
		* @param strings - One or more strings containing classes.
		* @returns {this}
		*/
		merge(...strings) {
			strings.forEach((str) => str.split(/\s+/).filter(Boolean).forEach((v) => this._push(v)));
			return this;
		}
		/**
		* Finalize the builder and return string.
		* @param className- Extra className to append before finalizing.
		* @returns {string}
		*/
		end(className = "") {
			if (className) this._push(className);
			return this._build();
		}
		/**
		* Convert to lowercase string.
		* @returns {string}
		*/
		toLowerCase() {
			return this._build().toLowerCase();
		}
		/**
		* Convert to uppercase string.
		* @returns {string}
		*/
		toUpperCase() {
			return this._build().toUpperCase();
		}
		/**
		* Convert to camelCase string.
		* @returns {string}
		*/
		toCamelCase() {
			return this._build().split(this.settings.separator).map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
		}
		/**
		* Convert to Sentence case string.
		* @returns {string}
		*/
		toSentenceCase() {
			const str = this._build().toLowerCase();
			return str.charAt(0).toUpperCase() + str.slice(1);
		}
		/** @private */
		_push(val) {
			if (!val) return;
			if (this.settings.ignoreDuplicate && this.parts.includes(val)) return;
			this.parts.push(val);
		}
		/** @private */
		_unshift(val) {
			if (!val) return;
			if (this.settings.ignoreDuplicate && this.parts.includes(val)) return;
			this.parts.unshift(val);
		}
		/** @private */
		_build() {
			return this.settings.prefix + this.parts.join(this.settings.separator).replace(/\s+/g, " ").trim() + this.settings.suffix;
		}
	};
	/**
	* Factory helper for convenience.
	* @param {string} [base=""]
	* @returns {ToBeString}
	*/
	function toBeString(base = "") {
		return new ToBeString(base);
	}
	/**
	* Truncate a filename so the total length (including extension) is at most maxLength.
	* If truncation happens, the returned string WILL have length === maxLength.
	*
	* @param {string} name - full filename, e.g. "very long name.mp3"
	* @param {number} maxLength - desired max length (positive integer)
	* @param {string} marker - truncation marker to show in the middle (default "(..)")
	* @returns {string}
	*/
	function truncateText(name, maxLength = 20, marker = "..") {
		if (typeof name !== "string") return name;
		if (!Number.isInteger(maxLength) || maxLength <= 0) return "";
		if (name.length <= maxLength) return name;
		const dotIndex = name.lastIndexOf(".");
		const hasExt = dotIndex > 0;
		const base = hasExt ? name.slice(0, dotIndex) : name;
		const ext = hasExt ? name.slice(dotIndex) : "";
		const extLen = ext.length;
		if (extLen >= maxLength) return name.slice(-maxLength);
		const prefixLen = maxLength - marker.length - extLen;
		if (prefixLen > 0) {
			const suffix = base.slice(-3);
			return base.slice(0, prefixLen - suffix.length) + marker + suffix + ext;
		}
		const truncatedMarkerLen = Math.max(0, maxLength - extLen);
		return marker.slice(0, truncatedMarkerLen) + ext;
	}
	// packages/utilities/src/Metadata.ts
	function ensureMetadataIdentity(selector, scopeId = "", childSuffix = "", templateKey) {
		const cleanScope = scopeId || "";
		const cleanLocalKey = `${selector}${childSuffix ? "-" + childSuffix : ""}`;
		const finalizedGlobalKey = cleanScope ? `${cleanScope}:${cleanLocalKey}` : cleanLocalKey;
		return {
			tree: {
				scope: cleanScope,
				key: cleanLocalKey,
				template: templateKey || cleanLocalKey,
				parent: null,
				children: []
			},
			key: finalizedGlobalKey
		};
	}
	function setMetadata(element, localRecordsPool, _rootPartKey) {
		if (!element || !localRecordsPool) return;
		const capturedRecords = localRecordsPool.map((item) => ({
			...item,
			relations: item?.relations ? {
				...item.relations,
				children: item.relations.children ? [...item.relations.children] : []
			} : null
		}));
		element.getMetadata = (context) => {
			if (!context) return capturedRecords;
			const scopeId = context.scopeId ?? "";
			const parentKey = context.parentKey ?? null;
			const keyMap = /* @__PURE__ */ new Map();
			capturedRecords.forEach((item) => {
				const origin = item.relations || {};
				const originGlobalKey = ensureMetadataIdentity(origin.key, origin.scope).key;
				const rebasedGlobalKey = ensureMetadataIdentity(origin.key, scopeId).key;
				keyMap.set(originGlobalKey, rebasedGlobalKey);
			});
			capturedRecords.forEach((item) => {
				const origin = item.relations || {};
				const originGlobalKey = ensureMetadataIdentity(origin.key, origin.scope).key;
				const rebasedGlobalKey = keyMap.get(originGlobalKey) || ensureMetadataIdentity(origin.key, scopeId).key;
				if (!item.relations) item.relations = {};
				item.relations.scope = scopeId;
				item.relations.template = origin.template || origin.key;
				if (origin.parent === null || origin.parent === void 0 || origin.parent === "") item.relations.parent = parentKey;
				else if (origin.parent) item.relations.parent = keyMap.get(origin.parent) || origin.parent;
				const originChildren = Array.isArray(origin.children) ? origin.children : [];
				item.relations.children = originChildren.map((childKey) => keyMap.get(childKey) || childKey);
				item.relations.key = rebasedGlobalKey;
			});
			return capturedRecords;
		};
	}
	/**
	* @internal Generates a stable hash seed from content + config for namespace derivation.
	* Extracted from former buildNamespaceSeed() for internal use by ensureIdentity().
	*/
	function buildNamespace(content, config) {
		const stableHash = (input) => {
			let hash = 5381;
			for (let i = 0; i < input.length; i++) hash = (hash << 5) + hash ^ input.charCodeAt(i);
			return (hash >>> 0).toString(36);
		};
		const summarize = (value, depth = 0) => {
			if (value === null || value === void 0) return "";
			if (typeof value === "string") return value.trim();
			if (typeof value === "number" || typeof value === "boolean") return String(value);
			if (value instanceof HTMLElement) return `${value.tagName ? value.tagName.toLowerCase() : "element"}${value.id ? `#${value.id}` : ""}${value.className && typeof value.className === "string" ? `.${value.className.trim().split(/\s+/).filter(Boolean).join(".")}` : ""}`;
			if (Array.isArray(value)) {
				const firstItems = value.slice(0, 3).map((item) => summarize(item, depth + 1)).filter(Boolean);
				return `len${value.length}[${firstItems.join("|")}]`;
			}
			if (typeof value === "object") {
				const keys = Object.keys(value).filter((key) => {
					const current = value[key];
					return typeof current !== "function" && typeof current !== "undefined";
				}).sort();
				const preferredKeys = [
					"namespace",
					"id",
					"name",
					"title",
					"slug",
					"formId",
					"builder",
					"key",
					"category"
				];
				const picked = [];
				for (const key of preferredKeys) if (key in value) {
					const current = value[key];
					if (current instanceof HTMLElement) picked.push(`${key}=${summarize(current, depth + 1)}`);
					else if (Array.isArray(current)) picked.push(`${key}=${summarize(current, depth + 1)}`);
					else if (current && typeof current === "object") picked.push(`${key}=${summarize(current, depth + 1)}`);
					else if (typeof current !== "function" && typeof current !== "undefined") picked.push(`${key}=${String(current)}`);
				}
				if (picked.length > 0) return picked.join(";");
				const minimalShape = keys.slice(0, 5).map((key) => {
					const current = value[key];
					if (current instanceof HTMLElement) return `${key}:${summarize(current, depth + 1)}`;
					if (Array.isArray(current)) return `${key}:len${current.length}`;
					if (current && typeof current === "object") return `${key}:{${Object.keys(current).slice(0, 3).join(",")}}`;
					return `${key}:${String(current)}`;
				});
				return `keys${keys.length}[${minimalShape.join("|")}]`;
			}
			return "";
		};
		const configSeed = config?.namespace || config?.id || config?.formId || config?.name || config?.title || config?.slug || config?.key || "";
		const contentSeed = (content && typeof content === "object" ? content.id : "") || (content && typeof content === "object" ? content.name : "") || (content && typeof content === "object" ? content.title : "") || (content && typeof content === "object" ? content.formId : "") || (content && typeof content === "object" ? content.uid : "") || (content && typeof content === "object" ? content.slug : "") || summarize(content);
		const rawSeed = [String(configSeed || "").trim(), String(contentSeed || "").trim()].filter(Boolean).join("::");
		return rawSeed ? stableHash(rawSeed) : "anonymous";
	}
	// packages/utilities/src/parseTableFile.ts
	/** Empty result — used when there is no file, or the file is empty. */
	var EMPTY_TABLE = {
		header: [],
		body: [],
		footer: null
	};
	/**
	* Detects the delimiter from the header line.
	*
	* Counted **outside quotes only**, and only on the first record: a text cell is free to
	* contain semicolons, and quoted headers may contain newlines.
	*
	* @param headerLine - First record, before parsing.
	* @returns `";"` when it wins, `","` otherwise.
	*/
	function detectDelimiter(headerLine) {
		const countOutsideQuotes = (text, target) => {
			let quoted = false;
			let count = 0;
			for (const char of text) if (char === "\"") quoted = !quoted;
			else if (!quoted && char === target) count++;
			return count;
		};
		return countOutsideQuotes(headerLine, ";") > countOutsideQuotes(headerLine, ",") ? ";" : ",";
	}
	/**
	* Splits CSV text into records.
	*
	* A state machine, because a cell may contain the delimiter, a quote, or a newline: a
	* naive `split(",")` breaks on the first quoted address. `""` inside a quoted cell is a
	* literal quote, and CRLF counts as one record break.
	*
	* @param text - Whole file contents.
	* @param separator - Delimiter chosen by {@link detectDelimiter}.
	* @returns Rows of raw cell strings; blank rows are dropped.
	*/
	function splitCsvRows(text, separator) {
		const rows = [];
		let row = [];
		let cell = "";
		let quoted = false;
		let index = 0;
		const pushCell = () => {
			row.push(cell);
			cell = "";
		};
		const pushRow = () => {
			pushCell();
			if (row.some((value) => value.trim() !== "")) rows.push(row);
			row = [];
		};
		while (index < text.length) {
			const char = text[index];
			if (quoted) {
				if (char === "\"") {
					if (text[index + 1] === "\"") {
						cell += "\"";
						index += 2;
						continue;
					}
					quoted = false;
					index++;
					continue;
				}
				cell += char;
				index++;
				continue;
			}
			if (char === "\"") {
				quoted = true;
				index++;
				continue;
			}
			if (char === separator) {
				pushCell();
				index++;
				continue;
			}
			if (char === "\n" || char === "\r") {
				if (char === "\r" && text[index + 1] === "\n") index++;
				pushRow();
				index++;
				continue;
			}
			cell += char;
			index++;
		}
		if (cell !== "" || row.length > 0) {
			pushCell();
			if (row.some((value) => value.trim() !== "")) rows.push(row);
		}
		return rows;
	}
	/** Trims a cell and casts a plain numeric value to a number. */
	function castCell(cell) {
		const value = cell.trim();
		return value !== "" && !Number.isNaN(Number(value)) ? Number(value) : value;
	}
	/**
	* Parses CSV text into table data.
	*
	* @param text - Whole file contents.
	* @returns Header from the first record, body from the rest, `footer` left null for the
	*   table layer to decide.
	*/
	function parseTableText(text) {
		if (!text || text.trim() === "") return { ...EMPTY_TABLE };
		const [header = [], ...body] = splitCsvRows(text, detectDelimiter((() => {
			let quoted = false;
			for (let index = 0; index < text.length; index++) {
				const char = text[index];
				if (char === "\"") quoted = !quoted;
				if (!quoted && (char === "\n" || char === "\r")) return text.slice(0, index);
			}
			return text;
		})()));
		return {
			header: header.map(castCell),
			body: body.map((row) => row.map(castCell)),
			footer: null
		};
	}
	/**
	* Parses an array of records into table data, keeping the key order of the first record.
	*
	* @param records - Parsed JSON records.
	* @returns Header from the first record's keys, body from its values.
	*/
	function parseTableRecords(records) {
		if (!Array.isArray(records) || records.length === 0) return { ...EMPTY_TABLE };
		const first = records[0];
		if (typeof first !== "object" || first === null) return { ...EMPTY_TABLE };
		return {
			header: Object.keys(first),
			body: records.map((record) => Object.values(record)),
			footer: null
		};
	}
	// packages/utilities/src/SelectorToTree.ts
	/**
	* 👑 THE SOVEREIGN SELECTOR GRAPH PARSER (SIHIR KILAT HASIL IDE DEWA ANDA!)
	* Membedah kamus selectors kaku milik anak komponen menggunakan split(">") JIT di RAM,
	* lalu memutahkan peta silsilah komposit utuh Record<TType, relations> untuk siap di-merge!
	* @param scopeId
	* @param selectors Kamus config.selectors milik komponen anak (e.g. this.config.selectors)
	* @returns Peta silsilah kedaulatan internal elemen yang suci bersih
	*/
	function selectorToTree(scopeId, selectors) {
		const allKeys = Object.keys(selectors);
		const hasContainerRoot = allKeys.includes("@container");
		const scopedRelation = {};
		for (const currentKey of allKeys) {
			const globalCurrentKey = `${scopeId}:${currentKey}`;
			if (!scopedRelation[currentKey]) scopedRelation[currentKey] = {
				scope: scopeId,
				key: currentKey,
				parent: null,
				children: []
			};
			if (currentKey.includes(">")) {
				const parts = currentKey.split(">");
				parts.pop();
				const parentTypeKey = parts.join(">");
				const globalParentKey = `${scopeId}:${parentTypeKey}`;
				if (!scopedRelation[parentTypeKey]) scopedRelation[parentTypeKey] = {
					scope: scopeId,
					key: parentTypeKey,
					parent: null,
					children: []
				};
				scopedRelation[currentKey].parent = globalParentKey;
				if (!scopedRelation[parentTypeKey].children?.includes(globalCurrentKey)) scopedRelation[parentTypeKey].children?.push(globalCurrentKey);
			} else if (currentKey !== "@container" && hasContainerRoot) {
				const globalContainerKey = `${scopeId}:@container`;
				if (!scopedRelation[globalContainerKey]) scopedRelation[globalContainerKey] = {
					scope: scopeId,
					key: "@container",
					parent: null,
					children: []
				};
				scopedRelation[currentKey].parent = globalContainerKey;
				if (!scopedRelation[globalContainerKey].children?.includes(globalCurrentKey)) scopedRelation[globalContainerKey].children?.push(globalCurrentKey);
			}
		}
		return scopedRelation;
	}
	// temp/bundle/entry.js
	var AioUI = {
		version: "0.2.4",
		packages: {
			accordion: accordion_exports,
			animations: animations_exports,
			article: article_exports,
			badge: badge_exports,
			base: src_exports$6,
			carousel: carousel_exports,
			codeBlock: code_block_exports,
			core: src_exports$5,
			eventEmitter: event_emitter_exports,
			fabMenu: fab_menu_exports,
			footer: footer_exports,
			form: form_exports,
			httpService: http_service_exports,
			idAddress: id_address_exports,
			input: input_exports,
			markdown: markdown_exports,
			masonry: masonry_exports,
			menu: menu_exports,
			message: message_exports,
			modal: modal_exports,
			modeSwitcher: mode_switcher_exports,
			moduleLoader: module_loader_exports,
			modules: modules_exports,
			pricingCard: pricing_card_exports,
			product: product_exports,
			rating: rating_exports,
			router: router_exports,
			section: section_exports,
			skeleton: skeleton_exports,
			tab: tab_exports,
			table: table_exports,
			theme: src_exports$4,
			themeCyberpunk: src_exports$3,
			themeDefault: src_exports$2,
			themeHorizontal: src_exports$1,
			themes: themes_exports,
			utilities: /* @__PURE__ */ __exportAll({
				EMPTY_TABLE: () => EMPTY_TABLE,
				applyAttrDictionary: () => applyAttrDictionary,
				applyAttributeList: () => applyAttributeList,
				buildNamespace: () => buildNamespace,
				createImageError: () => createImageError,
				detectDelimiter: () => detectDelimiter,
				ensureMetadataIdentity: () => ensureMetadataIdentity,
				generateRandomColor: () => generateRandomColor,
				hexToRgb: () => hexToRgb,
				hexToRgba: () => hexToRgba,
				mergeInputConfig: () => mergeInputConfig,
				numberToText: () => numberToText,
				parseTableRecords: () => parseTableRecords,
				parseTableText: () => parseTableText,
				selectorToTree: () => selectorToTree,
				setMetadata: () => setMetadata,
				splitCsvRows: () => splitCsvRows,
				toBeString: () => toBeString,
				truncateText: () => truncateText
			})
		}
	};
	AioUI.AccordionBuilder = AccordionBuilder;
	AioUI.AnimationsService = AnimationsService$1;
	AioUI.ArticleBuilder = ArticleBuilder;
	AioUI.BadgeBuilder = BadgeBuilder;
	AioUI.Builder = Builder;
	AioUI.GLOBAL_INSTANCE_COUNTER = GLOBAL_INSTANCE_COUNTER;
	AioUI.normalize = normalize;
	AioUI.validate = validate;
	AioUI.CarouselBuilder = CarouselBuilder;
	AioUI.CodeBlockBuilder = CodeBlockBuilder;
	AioUI.ComponentRegistry = ComponentRegistry;
	AioUI.mergeBuildConfig = mergeBuildConfig;
	AioUI.AioApp = AioApp;
	AioUI.AppStorage = AppStorage;
	AioUI.blockToNode = blockToNode;
	AioUI.isPageDocument = isPageDocument;
	AioUI.normalizeRoute = normalizeRoute;
	AioUI.pageToNode = pageToNode;
	AioUI.DOMRenderer = DOMRenderer;
	AioUI.inspectPage = inspectPage;
	AioUI.getBuilderAdapter = getBuilderAdapter;
	AioUI.setBuilderAdapter = setBuilderAdapter;
	AioUI.ensureStylesheet = ensureStylesheet;
	AioUI.injectLazyCss = injectLazyCss;
	AioUI.isStyleInjected = isStyleInjected;
	AioUI.isStylesheetPending = isStylesheetPending;
	AioUI.normalizeStylesheetPath = normalizeStylesheetPath;
	AioUI.replaceLazyCss = replaceLazyCss;
	AioUI.styleTagId = styleTagId;
	AioUI.useStylesheetAssets = useStylesheetAssets;
	AioUI.releaseBuilders = releaseBuilders;
	AioUI.TemplateRegistry = TemplateRegistry;
	AioUI.getTemplates = getTemplates;
	AioUI.setTemplates = setTemplates;
	AioUI.DEFAULT_REGISTRY_SCOPE = "app";
	AioUI.Registry = Registry;
	AioUI.RegistryError = RegistryError;
	AioUI.assertValidId = assertValidId;
	AioUI.assertValidScope = assertValidScope;
	AioUI.qualifyId = qualifyId;
	AioUI.splitQualifiedId = splitQualifiedId;
	AioUI.EventEmitter = EventEmitter$1;
	AioUI.FabMenuBuilder = FabMenuBuilder;
	AioUI.FooterBuilder = FooterBuilder;
	AioUI.DEFAULT_FORM_MESSAGES = DEFAULT_FORM_MESSAGES;
	AioUI.FormBuilder = FormBuilder;
	AioUI.composeMessage = composeMessage;
	AioUI.messageDraft = messageDraft;
	AioUI.resolveStyle = resolveStyle;
	AioUI.FORM_ADAPTER_MANIFEST = FORM_ADAPTER_MANIFEST;
	AioUI.FORM_MODULE_IDS = FORM_MODULE_IDS;
	AioUI.HttpService = HttpService$1;
	AioUI.IdAddressBuilder = IdAddressBuilder;
	AioUI.InputBuilder = InputBuilder;
	AioUI.INPUT_MODULE_IDS = INPUT_MODULE_IDS;
	AioUI.INPUT_MODULE_MANIFEST = INPUT_MODULE_MANIFEST;
	AioUI.inputFilesOf = inputFilesOf;
	AioUI.mountInputModules = mountInputModules;
	AioUI.MarkdownBuilder = MarkdownBuilder;
	AioUI.MasonryBuilder = MasonryBuilder;
	AioUI.MenuBuilder = MenuBuilder;
	AioUI.MessageBuilder = MessageBuilder;
	AioUI.ModalBuilder = ModalBuilder;
	AioUI.ModeSwitcherBuilder = ModeSwitcherBuilder;
	AioUI.ModuleLoader = ModuleLoader;
	AioUI.ModuleRegistry = ModuleRegistry;
	AioUI.resolveModuleDefinitions = resolveModuleDefinitions;
	AioUI.PricingCardBuilder = PricingCardBuilder;
	AioUI.ProductBuilder = ProductBuilder;
	AioUI.productModules = productModules;
	AioUI.ProductCardBuilder = ProductCardBuilder;
	AioUI.ProductDetailBuilder = ProductDetailBuilder;
	AioUI.ProductGridBuilder = ProductGridBuilder;
	AioUI.RatingBuilder = RatingBuilder;
	AioUI.HashRouter = HashRouter;
	AioUI.SectionBuilder = SectionBuilder;
	AioUI.Skeleton = Skeleton;
	AioUI.SkeletonBuilder = SkeletonBuilder;
	AioUI.TabBuilder = TabBuilder;
	AioUI.TableBuilder = TableBuilder;
	AioUI.ThemeRegistry = ThemeRegistry;
	AioUI.ThemeRenderer = ThemeRenderer;
	AioUI.CyberpunkTheme = CyberpunkTheme$1;
	AioUI.DefaultTheme = DefaultTheme$1;
	AioUI.HorizontalTheme = HorizontalTheme$1;
	AioUI.HorizontalScrollingPage = HorizontalScrollingPage$1;
	AioUI.applyAttrDictionary = applyAttrDictionary;
	AioUI.applyAttributeList = applyAttributeList;
	AioUI.generateRandomColor = generateRandomColor;
	AioUI.hexToRgb = hexToRgb;
	AioUI.hexToRgba = hexToRgba;
	AioUI.createImageError = createImageError;
	AioUI.mergeInputConfig = mergeInputConfig;
	AioUI.numberToText = numberToText;
	AioUI.toBeString = toBeString;
	AioUI.truncateText = truncateText;
	AioUI.buildNamespace = buildNamespace;
	AioUI.ensureMetadataIdentity = ensureMetadataIdentity;
	AioUI.setMetadata = setMetadata;
	AioUI.EMPTY_TABLE = EMPTY_TABLE;
	AioUI.detectDelimiter = detectDelimiter;
	AioUI.parseTableRecords = parseTableRecords;
	AioUI.parseTableText = parseTableText;
	AioUI.splitCsvRows = splitCsvRows;
	AioUI.selectorToTree = selectorToTree;
	globalThis.AioUI = AioUI;
	return AioUI;
})();
