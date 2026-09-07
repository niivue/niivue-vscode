(function() {
	var e, r = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, o = Object.getOwnPropertyNames, a = Object.getPrototypeOf, s = Object.prototype.hasOwnProperty, i = (e, r) => () => (r || (e((r = { exports: {} }).exports, r), e = null), r.exports), l = (e, i, l) => (l = null != e ? r(a(e)) : {}, ((e, r, a, i) => {
		if (r && "object" == typeof r || "function" == typeof r) for (var l, c = o(r), d = 0, u = c.length; d < u; d++) l = c[d], s.call(e, l) || l === a || t(e, l, {
			get: ((e) => r[e]).bind(null, l),
			enumerable: !(i = n(r, l)) || i.enumerable
		});
		return e;
	})(!i && e && e.__esModule && s.call(e, "default") ? l : t(l, "default", {
		value: e,
		enumerable: !0
	}), e)), c = i((e, r) => {
		r.exports = {};
	}), d = (e = self.location.href, async function(r = {}) {
		var t, n, o = r, a = new Promise((e, r) => {
			t = e, n = r;
		}), s = "object" == typeof window, i = "undefined" != typeof WorkerGlobalScope, d = "object" == typeof process && "object" == typeof process.versions && "string" == typeof process.versions.node && "renderer" != process.type;
		if (d) {
			const { createRequire: e } = await Promise.resolve().then(() => l(c()));
			var u = e("/");
		}
		var f, h, m = Object.assign({}, o), p = [], w = "./this.program", v = (e, r) => {
			throw r;
		}, g = "";
		if (d) {
			var y = u("fs"), E = u("path");
			self.location.href.startsWith("data:") || (g = E.dirname(u("url").fileURLToPath(self.location.href)) + "/"), h = (e) => (e = L(e) ? new URL(e) : e, y.readFileSync(e)), f = async (e, r = !0) => (e = L(e) ? new URL(e) : e, y.readFileSync(e, r ? void 0 : "utf8")), !o.thisProgram && process.argv.length > 1 && (w = process.argv[1].replace(/\\/g, "/")), p = process.argv.slice(2), v = (e, r) => {
				throw process.exitCode = e, r;
			};
		} else (s || i) && (i ? g = self.location.href : "undefined" != typeof document && document.currentScript && (g = document.currentScript.src), e && (g = e), g = g.startsWith("blob:") ? "" : g.substr(0, g.replace(/[?#].*/, "").lastIndexOf("/") + 1), i && (h = (e) => {
			var r = new XMLHttpRequest();
			return r.open("GET", e, !1), r.responseType = "arraybuffer", r.send(null), new Uint8Array(r.response);
		}), f = async (e) => {
			if (L(e)) return new Promise((r, t) => {
				var n = new XMLHttpRequest();
				n.open("GET", e, !0), n.responseType = "arraybuffer", n.onload = () => {
					200 == n.status || 0 == n.status && n.response ? r(n.response) : t(n.status);
				}, n.onerror = t, n.send(null);
			});
			var r = await fetch(e, { credentials: "same-origin" });
			if (r.ok) return r.arrayBuffer();
			throw new Error(r.status + " : " + r.url);
		});
		var k = o.print || console.log.bind(console), _ = o.printErr || console.error.bind(console);
		Object.assign(o, m), m = null, o.arguments && (p = o.arguments), o.thisProgram && (w = o.thisProgram);
		var b, S, F, D, P, A, x, M, R, j, N = o.wasmBinary, z = !1, C = (e) => e.startsWith("data:application/octet-stream;base64,"), L = (e) => e.startsWith("file://");
		function T() {
			if (!z) {
				var e = Qe();
				0 == e && (e += 4);
				var r = x[e >> 2], t = x[e + 4 >> 2];
				34821223 == r && 2310721022 == t || Y(`Stack overflow! Stack cookie has been overwritten at ${fe(e)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${fe(t)} ${fe(r)}`), 1668509029 != x[0] && Y("Runtime error: The application has corrupted its heap memory area (address zero)!");
			}
		}
		function B() {
			var e = b.buffer;
			o.HEAP8 = F = new Int8Array(e), o.HEAP16 = P = new Int16Array(e), o.HEAPU8 = D = new Uint8Array(e), o.HEAPU16 = new Uint16Array(e), o.HEAP32 = A = new Int32Array(e), o.HEAPU32 = x = new Uint32Array(e), o.HEAPF32 = M = new Float32Array(e), o.HEAPF64 = j = new Float64Array(e), o.HEAP64 = R = new BigInt64Array(e), o.HEAPU64 = new BigUint64Array(e);
		}
		var I = [], O = [], U = [], H = [];
		function $(e) {
			I.unshift(e);
		}
		function W(e) {
			H.unshift(e);
		}
		var q, G = 0, X = null;
		function K(e) {
			G++, o.monitorRunDependencies?.(G);
		}
		function V(e) {
			if (G--, o.monitorRunDependencies?.(G), 0 == G && X) {
				var r = X;
				X = null, r();
			}
		}
		function Y(e) {
			o.onAbort?.(e), _(e = "Aborted(" + e + ")"), z = !0, e += ". Build with -sASSERTIONS for more info.";
			var r = new WebAssembly.RuntimeError(e);
			throw n(r), r;
		}
		function Z() {
			if (o.locateFile) {
				var e = "dcm2niix.jpeg.wasm";
				return C(e) ? e : (r = e, o.locateFile ? o.locateFile(r, g) : g + r);
			}
			var r;
			return new URL("/niivue-vscode/pr-294/assets/dcm2niix.jpeg-CR3ddVLp.wasm", "" + self.location.href).href;
		}
		async function J(e) {
			if (!N) try {
				var r = await f(e);
				return new Uint8Array(r);
			} catch {}
			return function(e) {
				if (e == q && N) return new Uint8Array(N);
				if (h) return h(e);
				throw "both async and sync fetching of the wasm failed";
			}(e);
		}
		async function Q(e, r, t) {
			if (!(e || "function" != typeof WebAssembly.instantiateStreaming || C(r) || L(r) || d)) try {
				var n = fetch(r, { credentials: "same-origin" });
				return await WebAssembly.instantiateStreaming(n, t);
			} catch (o) {
				_(`wasm streaming compile failed: ${o}`), _("falling back to ArrayBuffer instantiation");
			}
			return async function(e, r) {
				try {
					var t = await J(e);
					return await WebAssembly.instantiate(t, r);
				} catch (o) {
					_(`failed to asynchronously prepare wasm: ${o}`), Y(o);
				}
			}(r, t);
		}
		class ee {
			name = "ExitStatus";
			constructor(e) {
				this.message = `Program terminated with exit(${e})`, this.status = e;
			}
		}
		var re = (e) => {
			for (; e.length > 0;) e.shift()(o);
		}, te = () => tr(), ne = (e) => {
			for (var r = 0, t = 0; t < e.length; ++t) {
				var n = e.charCodeAt(t);
				n <= 127 ? r++ : n <= 2047 ? r += 2 : n >= 55296 && n <= 57343 ? (r += 4, ++t) : r += 3;
			}
			return r;
		}, oe = (e, r, t, n) => {
			if (!(n > 0)) return 0;
			for (var o = t, a = t + n - 1, s = 0; s < e.length; ++s) {
				var i = e.charCodeAt(s);
				if (i >= 55296 && i <= 57343 && (i = 65536 + ((1023 & i) << 10) | 1023 & e.charCodeAt(++s)), i <= 127) {
					if (t >= a) break;
					r[t++] = i;
				} else if (i <= 2047) {
					if (t + 1 >= a) break;
					r[t++] = 192 | i >> 6, r[t++] = 128 | 63 & i;
				} else if (i <= 65535) {
					if (t + 2 >= a) break;
					r[t++] = 224 | i >> 12, r[t++] = 128 | i >> 6 & 63, r[t++] = 128 | 63 & i;
				} else {
					if (t + 3 >= a) break;
					r[t++] = 240 | i >> 18, r[t++] = 128 | i >> 12 & 63, r[t++] = 128 | i >> 6 & 63, r[t++] = 128 | 63 & i;
				}
			}
			return r[t] = 0, t - o;
		}, ae = (e, r, t) => oe(e, D, r, t), se = (e) => rr(e), ie = (e) => {
			var r = ne(e) + 1, t = se(r);
			return ae(e, t, r), t;
		}, le = "undefined" != typeof TextDecoder ? new TextDecoder() : void 0, ce = (e, r = 0, t = NaN) => {
			for (var n = r + t, o = r; e[o] && !(o >= n);) ++o;
			if (o - r > 16 && e.buffer && le) return le.decode(e.subarray(r, o));
			for (var a = ""; r < o;) {
				var s = e[r++];
				if (128 & s) {
					var i = 63 & e[r++];
					if (192 != (224 & s)) {
						var l = 63 & e[r++];
						if ((s = 224 == (240 & s) ? (15 & s) << 12 | i << 6 | l : (7 & s) << 18 | i << 12 | l << 6 | 63 & e[r++]) < 65536) a += String.fromCharCode(s);
						else {
							var c = s - 65536;
							a += String.fromCharCode(55296 | c >> 10, 56320 | 1023 & c);
						}
					} else a += String.fromCharCode((31 & s) << 6 | i);
				} else a += String.fromCharCode(s);
			}
			return a;
		}, de = (e, r) => e ? ce(D, e, r) : "", ue = o.noExitRuntime || !0, fe = (e) => "0x" + (e >>>= 0).toString(16).padStart(8, "0"), he = () => {
			nr(Je(), Qe());
		};
		class me {
			constructor(e) {
				this.excPtr = e, this.ptr = e - 24;
			}
			set_type(e) {
				x[this.ptr + 4 >> 2] = e;
			}
			get_type() {
				return x[this.ptr + 4 >> 2];
			}
			set_destructor(e) {
				x[this.ptr + 8 >> 2] = e;
			}
			get_destructor() {
				return x[this.ptr + 8 >> 2];
			}
			set_caught(e) {
				e = e ? 1 : 0, F[this.ptr + 12] = e;
			}
			get_caught() {
				return 0 != F[this.ptr + 12];
			}
			set_rethrown(e) {
				e = e ? 1 : 0, F[this.ptr + 13] = e;
			}
			get_rethrown() {
				return 0 != F[this.ptr + 13];
			}
			init(e, r) {
				this.set_adjusted_ptr(0), this.set_type(e), this.set_destructor(r);
			}
			set_adjusted_ptr(e) {
				x[this.ptr + 16 >> 2] = e;
			}
			get_adjusted_ptr() {
				return x[this.ptr + 16 >> 2];
			}
		}
		var pe = {
			isAbs: (e) => "/" === e.charAt(0),
			splitPath: (e) => /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(e).slice(1),
			normalizeArray: (e, r) => {
				for (var t = 0, n = e.length - 1; n >= 0; n--) {
					var o = e[n];
					"." === o ? e.splice(n, 1) : ".." === o ? (e.splice(n, 1), t++) : t && (e.splice(n, 1), t--);
				}
				if (r) for (; t; t--) e.unshift("..");
				return e;
			},
			normalize: (e) => {
				var r = pe.isAbs(e), t = "/" === e.substr(-1);
				return (e = pe.normalizeArray(e.split("/").filter((e) => !!e), !r).join("/")) || r || (e = "."), e && t && (e += "/"), (r ? "/" : "") + e;
			},
			dirname: (e) => {
				var r = pe.splitPath(e), t = r[0], n = r[1];
				return t || n ? (n && (n = n.substr(0, n.length - 1)), t + n) : ".";
			},
			basename: (e) => e && e.match(/([^\/]+|\/)\/*$/)[1],
			join: (...e) => pe.normalize(e.join("/")),
			join2: (e, r) => pe.normalize(e + "/" + r)
		}, we = (e) => {
			(we = (() => {
				if (d) {
					var e = u("crypto");
					return (r) => e.randomFillSync(r);
				}
				return (e) => crypto.getRandomValues(e);
			})())(e);
		}, ve = {
			resolve: (...e) => {
				for (var r = "", t = !1, n = e.length - 1; n >= -1 && !t; n--) {
					var o = n >= 0 ? e[n] : Ae.cwd();
					if ("string" != typeof o) throw new TypeError("Arguments to path.resolve must be strings");
					if (!o) return "";
					r = o + "/" + r, t = pe.isAbs(o);
				}
				return (t ? "/" : "") + (r = pe.normalizeArray(r.split("/").filter((e) => !!e), !t).join("/")) || ".";
			},
			relative: (e, r) => {
				function t(e) {
					for (var r = 0; r < e.length && "" === e[r]; r++);
					for (var t = e.length - 1; t >= 0 && "" === e[t]; t--);
					return r > t ? [] : e.slice(r, t - r + 1);
				}
				e = ve.resolve(e).substr(1), r = ve.resolve(r).substr(1);
				for (var n = t(e.split("/")), o = t(r.split("/")), a = Math.min(n.length, o.length), s = a, i = 0; i < a; i++) if (n[i] !== o[i]) {
					s = i;
					break;
				}
				var l = [];
				for (i = s; i < n.length; i++) l.push("..");
				return (l = l.concat(o.slice(s))).join("/");
			}
		}, ge = [];
		function ye(e, r, t) {
			var n = t > 0 ? t : ne(e) + 1, o = new Array(n), a = oe(e, o, 0, o.length);
			return r && (o.length = a), o;
		}
		var Ee = {
			ttys: [],
			init() {},
			shutdown() {},
			register(e, r) {
				Ee.ttys[e] = {
					input: [],
					output: [],
					ops: r
				}, Ae.registerDevice(e, Ee.stream_ops);
			},
			stream_ops: {
				open(e) {
					var r = Ee.ttys[e.node.rdev];
					if (!r) throw new Ae.ErrnoError(43);
					e.tty = r, e.seekable = !1;
				},
				close(e) {
					e.tty.ops.fsync(e.tty);
				},
				fsync(e) {
					e.tty.ops.fsync(e.tty);
				},
				read(e, r, t, n, o) {
					if (!e.tty || !e.tty.ops.get_char) throw new Ae.ErrnoError(60);
					for (var a = 0, s = 0; s < n; s++) {
						var i;
						try {
							i = e.tty.ops.get_char(e.tty);
						} catch (l) {
							throw new Ae.ErrnoError(29);
						}
						if (void 0 === i && 0 === a) throw new Ae.ErrnoError(6);
						if (null == i) break;
						a++, r[t + s] = i;
					}
					return a && (e.node.atime = Date.now()), a;
				},
				write(e, r, t, n, o) {
					if (!e.tty || !e.tty.ops.put_char) throw new Ae.ErrnoError(60);
					try {
						for (var a = 0; a < n; a++) e.tty.ops.put_char(e.tty, r[t + a]);
					} catch (s) {
						throw new Ae.ErrnoError(29);
					}
					return n && (e.node.mtime = e.node.ctime = Date.now()), a;
				}
			},
			default_tty_ops: {
				get_char: (e) => (() => {
					if (!ge.length) {
						var e = null;
						if (d) {
							var r = Buffer.alloc(256), t = 0, n = process.stdin.fd;
							try {
								t = y.readSync(n, r, 0, 256);
							} catch (o) {
								if (!o.toString().includes("EOF")) throw o;
								t = 0;
							}
							t > 0 && (e = r.slice(0, t).toString("utf-8"));
						} else "undefined" != typeof window && "function" == typeof window.prompt && null !== (e = window.prompt("Input: ")) && (e += "\n");
						if (!e) return null;
						ge = ye(e, !0);
					}
					return ge.shift();
				})(),
				put_char(e, r) {
					null === r || 10 === r ? (k(ce(e.output)), e.output = []) : 0 != r && e.output.push(r);
				},
				fsync(e) {
					e.output && e.output.length > 0 && (k(ce(e.output)), e.output = []);
				},
				ioctl_tcgets: (e) => ({
					c_iflag: 25856,
					c_oflag: 5,
					c_cflag: 191,
					c_lflag: 35387,
					c_cc: [
						3,
						28,
						127,
						21,
						4,
						0,
						1,
						0,
						17,
						19,
						26,
						0,
						18,
						15,
						23,
						22,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0
					]
				}),
				ioctl_tcsets: (e, r, t) => 0,
				ioctl_tiocgwinsz: (e) => [24, 80]
			},
			default_tty1_ops: {
				put_char(e, r) {
					null === r || 10 === r ? (_(ce(e.output)), e.output = []) : 0 != r && e.output.push(r);
				},
				fsync(e) {
					e.output && e.output.length > 0 && (_(ce(e.output)), e.output = []);
				}
			}
		}, ke = (e, r) => Math.ceil(e / r) * r, _e = (e) => {
			Y();
		}, be = {
			ops_table: null,
			mount: (e) => be.createNode(null, "/", 16895, 0),
			createNode(e, r, t, n) {
				if (Ae.isBlkdev(t) || Ae.isFIFO(t)) throw new Ae.ErrnoError(63);
				be.ops_table ||= {
					dir: {
						node: {
							getattr: be.node_ops.getattr,
							setattr: be.node_ops.setattr,
							lookup: be.node_ops.lookup,
							mknod: be.node_ops.mknod,
							rename: be.node_ops.rename,
							unlink: be.node_ops.unlink,
							rmdir: be.node_ops.rmdir,
							readdir: be.node_ops.readdir,
							symlink: be.node_ops.symlink
						},
						stream: { llseek: be.stream_ops.llseek }
					},
					file: {
						node: {
							getattr: be.node_ops.getattr,
							setattr: be.node_ops.setattr
						},
						stream: {
							llseek: be.stream_ops.llseek,
							read: be.stream_ops.read,
							write: be.stream_ops.write,
							allocate: be.stream_ops.allocate,
							mmap: be.stream_ops.mmap,
							msync: be.stream_ops.msync
						}
					},
					link: {
						node: {
							getattr: be.node_ops.getattr,
							setattr: be.node_ops.setattr,
							readlink: be.node_ops.readlink
						},
						stream: {}
					},
					chrdev: {
						node: {
							getattr: be.node_ops.getattr,
							setattr: be.node_ops.setattr
						},
						stream: Ae.chrdev_stream_ops
					}
				};
				var o = Ae.createNode(e, r, t, n);
				return Ae.isDir(o.mode) ? (o.node_ops = be.ops_table.dir.node, o.stream_ops = be.ops_table.dir.stream, o.contents = {}) : Ae.isFile(o.mode) ? (o.node_ops = be.ops_table.file.node, o.stream_ops = be.ops_table.file.stream, o.usedBytes = 0, o.contents = null) : Ae.isLink(o.mode) ? (o.node_ops = be.ops_table.link.node, o.stream_ops = be.ops_table.link.stream) : Ae.isChrdev(o.mode) && (o.node_ops = be.ops_table.chrdev.node, o.stream_ops = be.ops_table.chrdev.stream), o.atime = o.mtime = o.ctime = Date.now(), e && (e.contents[r] = o, e.atime = e.mtime = e.ctime = o.atime), o;
			},
			getFileDataAsTypedArray: (e) => e.contents ? e.contents.subarray ? e.contents.subarray(0, e.usedBytes) : new Uint8Array(e.contents) : /* @__PURE__ */ new Uint8Array(0),
			expandFileStorage(e, r) {
				var t = e.contents ? e.contents.length : 0;
				if (!(t >= r)) {
					r = Math.max(r, t * (t < 1048576 ? 2 : 1.125) >>> 0), 0 != t && (r = Math.max(r, 256));
					var n = e.contents;
					e.contents = new Uint8Array(r), e.usedBytes > 0 && e.contents.set(n.subarray(0, e.usedBytes), 0);
				}
			},
			resizeFileStorage(e, r) {
				if (e.usedBytes != r) if (0 == r) e.contents = null, e.usedBytes = 0;
				else {
					var t = e.contents;
					e.contents = new Uint8Array(r), t && e.contents.set(t.subarray(0, Math.min(r, e.usedBytes))), e.usedBytes = r;
				}
			},
			node_ops: {
				getattr(e) {
					var r = {};
					return r.dev = Ae.isChrdev(e.mode) ? e.id : 1, r.ino = e.id, r.mode = e.mode, r.nlink = 1, r.uid = 0, r.gid = 0, r.rdev = e.rdev, Ae.isDir(e.mode) ? r.size = 4096 : Ae.isFile(e.mode) ? r.size = e.usedBytes : Ae.isLink(e.mode) ? r.size = e.link.length : r.size = 0, r.atime = new Date(e.atime), r.mtime = new Date(e.mtime), r.ctime = new Date(e.ctime), r.blksize = 4096, r.blocks = Math.ceil(r.size / r.blksize), r;
				},
				setattr(e, r) {
					for (const t of [
						"mode",
						"atime",
						"mtime",
						"ctime"
					]) null != r[t] && (e[t] = r[t]);
					void 0 !== r.size && be.resizeFileStorage(e, r.size);
				},
				lookup(e, r) {
					throw be.doesNotExistError;
				},
				mknod: (e, r, t, n) => be.createNode(e, r, t, n),
				rename(e, r, t) {
					var n;
					try {
						n = Ae.lookupNode(r, t);
					} catch (a) {}
					if (n) {
						if (Ae.isDir(e.mode)) for (var o in n.contents) throw new Ae.ErrnoError(55);
						Ae.hashRemoveNode(n);
					}
					delete e.parent.contents[e.name], r.contents[t] = e, e.name = t, r.ctime = r.mtime = e.parent.ctime = e.parent.mtime = Date.now();
				},
				unlink(e, r) {
					delete e.contents[r], e.ctime = e.mtime = Date.now();
				},
				rmdir(e, r) {
					for (var t in Ae.lookupNode(e, r).contents) throw new Ae.ErrnoError(55);
					delete e.contents[r], e.ctime = e.mtime = Date.now();
				},
				readdir: (e) => [
					".",
					"..",
					...Object.keys(e.contents)
				],
				symlink(e, r, t) {
					var n = be.createNode(e, r, 41471, 0);
					return n.link = t, n;
				},
				readlink(e) {
					if (!Ae.isLink(e.mode)) throw new Ae.ErrnoError(28);
					return e.link;
				}
			},
			stream_ops: {
				read(e, r, t, n, o) {
					var a = e.node.contents;
					if (o >= e.node.usedBytes) return 0;
					var s = Math.min(e.node.usedBytes - o, n);
					if (s > 8 && a.subarray) r.set(a.subarray(o, o + s), t);
					else for (var i = 0; i < s; i++) r[t + i] = a[o + i];
					return s;
				},
				write(e, r, t, n, o, a) {
					if (r.buffer === F.buffer && (a = !1), !n) return 0;
					var s = e.node;
					if (s.mtime = s.ctime = Date.now(), r.subarray && (!s.contents || s.contents.subarray)) {
						if (a) return s.contents = r.subarray(t, t + n), s.usedBytes = n, n;
						if (0 === s.usedBytes && 0 === o) return s.contents = r.slice(t, t + n), s.usedBytes = n, n;
						if (o + n <= s.usedBytes) return s.contents.set(r.subarray(t, t + n), o), n;
					}
					if (be.expandFileStorage(s, o + n), s.contents.subarray && r.subarray) s.contents.set(r.subarray(t, t + n), o);
					else for (var i = 0; i < n; i++) s.contents[o + i] = r[t + i];
					return s.usedBytes = Math.max(s.usedBytes, o + n), n;
				},
				llseek(e, r, t) {
					var n = r;
					if (1 === t ? n += e.position : 2 === t && Ae.isFile(e.node.mode) && (n += e.node.usedBytes), n < 0) throw new Ae.ErrnoError(28);
					return n;
				},
				allocate(e, r, t) {
					be.expandFileStorage(e.node, r + t), e.node.usedBytes = Math.max(e.node.usedBytes, r + t);
				},
				mmap(e, r, t, n, o) {
					if (!Ae.isFile(e.node.mode)) throw new Ae.ErrnoError(43);
					var a, s, i = e.node.contents;
					if (2 & o || !i || i.buffer !== F.buffer) {
						if (s = !0, !(a = _e())) throw new Ae.ErrnoError(48);
						i && ((t > 0 || t + r < i.length) && (i = i.subarray ? i.subarray(t, t + r) : Array.prototype.slice.call(i, t, t + r)), F.set(i, a));
					} else s = !1, a = i.byteOffset;
					return {
						ptr: a,
						allocated: s
					};
				},
				msync: (e, r, t, n, o) => (be.stream_ops.write(e, r, 0, n, t, !1), 0)
			}
		}, Se = (e, r, t, n, o, a) => {
			Ae.createDataFile(e, r, t, n, o, a);
		}, Fe = o.preloadPlugins || [], De = (e, r, t, n, o, a, s, i, l, c) => {
			var d = r ? ve.resolve(pe.join2(e, r)) : e;
			function u(t) {
				function u(t) {
					c?.(), i || Se(e, r, t, n, o, l), a?.(), V();
				}
				((e, r, t, n) => {
					"undefined" != typeof Browser && Browser.init();
					var o = !1;
					return Fe.forEach((a) => {
						o || a.canHandle(r) && (a.handle(e, r, t, n), o = !0);
					}), o;
				})(t, d, u, () => {
					s?.(), V();
				}) || u(t);
			}
			K(), "string" == typeof t ? (async (e) => {
				var r = await f(e);
				return new Uint8Array(r);
			})(t).then(u, s) : u(t);
		}, Pe = (e, r) => {
			var t = 0;
			return e && (t |= 365), r && (t |= 146), t;
		}, Ae = {
			root: null,
			mounts: [],
			devices: {},
			streams: [],
			nextInode: 1,
			nameTable: null,
			currentPath: "/",
			initialized: !1,
			ignorePermissions: !0,
			ErrnoError: class {
				name = "ErrnoError";
				constructor(e) {
					this.errno = e;
				}
			},
			filesystems: null,
			syncFSRequests: 0,
			readFiles: {},
			FSStream: class {
				shared = {};
				get object() {
					return this.node;
				}
				set object(e) {
					this.node = e;
				}
				get isRead() {
					return 1 != (2097155 & this.flags);
				}
				get isWrite() {
					return !!(2097155 & this.flags);
				}
				get isAppend() {
					return 1024 & this.flags;
				}
				get flags() {
					return this.shared.flags;
				}
				set flags(e) {
					this.shared.flags = e;
				}
				get position() {
					return this.shared.position;
				}
				set position(e) {
					this.shared.position = e;
				}
			},
			FSNode: class {
				node_ops = {};
				stream_ops = {};
				readMode = 365;
				writeMode = 146;
				mounted = null;
				constructor(e, r, t, n) {
					e || (e = this), this.parent = e, this.mount = e.mount, this.id = Ae.nextInode++, this.name = r, this.mode = t, this.rdev = n, this.atime = this.mtime = this.ctime = Date.now();
				}
				get read() {
					return (this.mode & this.readMode) === this.readMode;
				}
				set read(e) {
					e ? this.mode |= this.readMode : this.mode &= ~this.readMode;
				}
				get write() {
					return (this.mode & this.writeMode) === this.writeMode;
				}
				set write(e) {
					e ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
				}
				get isFolder() {
					return Ae.isDir(this.mode);
				}
				get isDevice() {
					return Ae.isChrdev(this.mode);
				}
			},
			lookupPath(e, r = {}) {
				if (!e) throw new Ae.ErrnoError(44);
				r.follow_mount ??= !0, pe.isAbs(e) || (e = Ae.cwd() + "/" + e);
				e: for (var t = 0; t < 40; t++) {
					for (var n = e.split("/").filter((e) => !!e), o = Ae.root, a = "/", s = 0; s < n.length; s++) {
						var i = s === n.length - 1;
						if (i && r.parent) break;
						if ("." !== n[s]) if (".." !== n[s]) {
							a = pe.join2(a, n[s]);
							try {
								o = Ae.lookupNode(o, n[s]);
							} catch (c) {
								if (44 === c?.errno && i && r.noent_okay) return { path: a };
								throw c;
							}
							if (!Ae.isMountpoint(o) || i && !r.follow_mount || (o = o.mounted.root), Ae.isLink(o.mode) && (!i || r.follow)) {
								if (!o.node_ops.readlink) throw new Ae.ErrnoError(52);
								var l = o.node_ops.readlink(o);
								pe.isAbs(l) || (l = pe.dirname(a) + "/" + l), e = l + "/" + n.slice(s + 1).join("/");
								continue e;
							}
						} else a = pe.dirname(a), o = o.parent;
					}
					return {
						path: a,
						node: o
					};
				}
				throw new Ae.ErrnoError(32);
			},
			getPath(e) {
				for (var r;;) {
					if (Ae.isRoot(e)) {
						var t = e.mount.mountpoint;
						return r ? "/" !== t[t.length - 1] ? `${t}/${r}` : t + r : t;
					}
					r = r ? `${e.name}/${r}` : e.name, e = e.parent;
				}
			},
			hashName(e, r) {
				for (var t = 0, n = 0; n < r.length; n++) t = (t << 5) - t + r.charCodeAt(n) | 0;
				return (e + t >>> 0) % Ae.nameTable.length;
			},
			hashAddNode(e) {
				var r = Ae.hashName(e.parent.id, e.name);
				e.name_next = Ae.nameTable[r], Ae.nameTable[r] = e;
			},
			hashRemoveNode(e) {
				var r = Ae.hashName(e.parent.id, e.name);
				if (Ae.nameTable[r] === e) Ae.nameTable[r] = e.name_next;
				else for (var t = Ae.nameTable[r]; t;) {
					if (t.name_next === e) {
						t.name_next = e.name_next;
						break;
					}
					t = t.name_next;
				}
			},
			lookupNode(e, r) {
				var t = Ae.mayLookup(e);
				if (t) throw new Ae.ErrnoError(t);
				for (var n = Ae.hashName(e.id, r), o = Ae.nameTable[n]; o; o = o.name_next) {
					var a = o.name;
					if (o.parent.id === e.id && a === r) return o;
				}
				return Ae.lookup(e, r);
			},
			createNode(e, r, t, n) {
				var o = new Ae.FSNode(e, r, t, n);
				return Ae.hashAddNode(o), o;
			},
			destroyNode(e) {
				Ae.hashRemoveNode(e);
			},
			isRoot: (e) => e === e.parent,
			isMountpoint: (e) => !!e.mounted,
			isFile: (e) => 32768 == (61440 & e),
			isDir: (e) => 16384 == (61440 & e),
			isLink: (e) => 40960 == (61440 & e),
			isChrdev: (e) => 8192 == (61440 & e),
			isBlkdev: (e) => 24576 == (61440 & e),
			isFIFO: (e) => 4096 == (61440 & e),
			isSocket: (e) => !(49152 & ~e),
			flagsToPermissionString(e) {
				var r = [
					"r",
					"w",
					"rw"
				][3 & e];
				return 512 & e && (r += "w"), r;
			},
			nodePermissions: (e, r) => Ae.ignorePermissions || (!r.includes("r") || 292 & e.mode) && (!r.includes("w") || 146 & e.mode) && (!r.includes("x") || 73 & e.mode) ? 0 : 2,
			mayLookup(e) {
				if (!Ae.isDir(e.mode)) return 54;
				return Ae.nodePermissions(e, "x") || (e.node_ops.lookup ? 0 : 2);
			},
			mayCreate(e, r) {
				if (!Ae.isDir(e.mode)) return 54;
				try {
					return Ae.lookupNode(e, r), 20;
				} catch (t) {}
				return Ae.nodePermissions(e, "wx");
			},
			mayDelete(e, r, t) {
				var n;
				try {
					n = Ae.lookupNode(e, r);
				} catch (a) {
					return a.errno;
				}
				var o = Ae.nodePermissions(e, "wx");
				if (o) return o;
				if (t) {
					if (!Ae.isDir(n.mode)) return 54;
					if (Ae.isRoot(n) || Ae.getPath(n) === Ae.cwd()) return 10;
				} else if (Ae.isDir(n.mode)) return 31;
				return 0;
			},
			mayOpen: (e, r) => e ? Ae.isLink(e.mode) ? 32 : Ae.isDir(e.mode) && ("r" !== Ae.flagsToPermissionString(r) || 576 & r) ? 31 : Ae.nodePermissions(e, Ae.flagsToPermissionString(r)) : 44,
			checkOpExists(e, r) {
				if (!e) throw new Ae.ErrnoError(r);
				return e;
			},
			MAX_OPEN_FDS: 4096,
			nextfd() {
				for (var e = 0; e <= Ae.MAX_OPEN_FDS; e++) if (!Ae.streams[e]) return e;
				throw new Ae.ErrnoError(33);
			},
			getStreamChecked(e) {
				var r = Ae.getStream(e);
				if (!r) throw new Ae.ErrnoError(8);
				return r;
			},
			getStream: (e) => Ae.streams[e],
			createStream: (e, r = -1) => (e = Object.assign(new Ae.FSStream(), e), -1 == r && (r = Ae.nextfd()), e.fd = r, Ae.streams[r] = e, e),
			closeStream(e) {
				Ae.streams[e] = null;
			},
			dupStream(e, r = -1) {
				var t = Ae.createStream(e, r);
				return t.stream_ops?.dup?.(t), t;
			},
			chrdev_stream_ops: {
				open(e) {
					e.stream_ops = Ae.getDevice(e.node.rdev).stream_ops, e.stream_ops.open?.(e);
				},
				llseek() {
					throw new Ae.ErrnoError(70);
				}
			},
			major: (e) => e >> 8,
			minor: (e) => 255 & e,
			makedev: (e, r) => e << 8 | r,
			registerDevice(e, r) {
				Ae.devices[e] = { stream_ops: r };
			},
			getDevice: (e) => Ae.devices[e],
			getMounts(e) {
				for (var r = [], t = [e]; t.length;) {
					var n = t.pop();
					r.push(n), t.push(...n.mounts);
				}
				return r;
			},
			syncfs(e, r) {
				"function" == typeof e && (r = e, e = !1), Ae.syncFSRequests++, Ae.syncFSRequests > 1 && _(`warning: ${Ae.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
				var t = Ae.getMounts(Ae.root.mount), n = 0;
				function o(e) {
					return Ae.syncFSRequests--, r(e);
				}
				function a(e) {
					if (e) return a.errored ? void 0 : (a.errored = !0, o(e));
					++n >= t.length && o(null);
				}
				t.forEach((r) => {
					if (!r.type.syncfs) return a(null);
					r.type.syncfs(r, e, a);
				});
			},
			mount(e, r, t) {
				var n, o = "/" === t, a = !t;
				if (o && Ae.root) throw new Ae.ErrnoError(10);
				if (!o && !a) {
					var s = Ae.lookupPath(t, { follow_mount: !1 });
					if (t = s.path, n = s.node, Ae.isMountpoint(n)) throw new Ae.ErrnoError(10);
					if (!Ae.isDir(n.mode)) throw new Ae.ErrnoError(54);
				}
				var i = {
					type: e,
					opts: r,
					mountpoint: t,
					mounts: []
				}, l = e.mount(i);
				return l.mount = i, i.root = l, o ? Ae.root = l : n && (n.mounted = i, n.mount && n.mount.mounts.push(i)), l;
			},
			unmount(e) {
				var r = Ae.lookupPath(e, { follow_mount: !1 });
				if (!Ae.isMountpoint(r.node)) throw new Ae.ErrnoError(28);
				var t = r.node, n = t.mounted, o = Ae.getMounts(n);
				Object.keys(Ae.nameTable).forEach((e) => {
					for (var r = Ae.nameTable[e]; r;) {
						var t = r.name_next;
						o.includes(r.mount) && Ae.destroyNode(r), r = t;
					}
				}), t.mounted = null;
				var a = t.mount.mounts.indexOf(n);
				t.mount.mounts.splice(a, 1);
			},
			lookup: (e, r) => e.node_ops.lookup(e, r),
			mknod(e, r, t) {
				var n = Ae.lookupPath(e, { parent: !0 }).node, o = pe.basename(e);
				if (!o) throw new Ae.ErrnoError(28);
				if ("." === o || ".." === o) throw new Ae.ErrnoError(20);
				var a = Ae.mayCreate(n, o);
				if (a) throw new Ae.ErrnoError(a);
				if (!n.node_ops.mknod) throw new Ae.ErrnoError(63);
				return n.node_ops.mknod(n, o, r, t);
			},
			statfs: (e) => Ae.statfsNode(Ae.lookupPath(e, { follow: !0 }).node),
			statfsStream: (e) => Ae.statfsNode(e.node),
			statfsNode(e) {
				var r = {
					bsize: 4096,
					frsize: 4096,
					blocks: 1e6,
					bfree: 5e5,
					bavail: 5e5,
					files: Ae.nextInode,
					ffree: Ae.nextInode - 1,
					fsid: 42,
					flags: 2,
					namelen: 255
				};
				return e.node_ops.statfs && Object.assign(r, e.node_ops.statfs(e.mount.opts.root)), r;
			},
			create: (e, r = 438) => (r &= 4095, r |= 32768, Ae.mknod(e, r, 0)),
			mkdir: (e, r = 511) => (r &= 1023, r |= 16384, Ae.mknod(e, r, 0)),
			mkdirTree(e, r) {
				for (var t = e.split("/"), n = "", o = 0; o < t.length; ++o) if (t[o]) {
					n += "/" + t[o];
					try {
						Ae.mkdir(n, r);
					} catch (a) {
						if (20 != a.errno) throw a;
					}
				}
			},
			mkdev: (e, r, t) => (void 0 === t && (t = r, r = 438), r |= 8192, Ae.mknod(e, r, t)),
			symlink(e, r) {
				if (!ve.resolve(e)) throw new Ae.ErrnoError(44);
				var t = Ae.lookupPath(r, { parent: !0 }).node;
				if (!t) throw new Ae.ErrnoError(44);
				var n = pe.basename(r), o = Ae.mayCreate(t, n);
				if (o) throw new Ae.ErrnoError(o);
				if (!t.node_ops.symlink) throw new Ae.ErrnoError(63);
				return t.node_ops.symlink(t, n, e);
			},
			rename(e, r) {
				var t, n = pe.dirname(e), o = pe.dirname(r), a = pe.basename(e), s = pe.basename(r), i = Ae.lookupPath(e, { parent: !0 }), l = i.node;
				if (t = (i = Ae.lookupPath(r, { parent: !0 })).node, !l || !t) throw new Ae.ErrnoError(44);
				if (l.mount !== t.mount) throw new Ae.ErrnoError(75);
				var c, d = Ae.lookupNode(l, a), u = ve.relative(e, o);
				if ("." !== u.charAt(0)) throw new Ae.ErrnoError(28);
				if ("." !== (u = ve.relative(r, n)).charAt(0)) throw new Ae.ErrnoError(55);
				try {
					c = Ae.lookupNode(t, s);
				} catch (m) {}
				if (d !== c) {
					var f = Ae.isDir(d.mode), h = Ae.mayDelete(l, a, f);
					if (h) throw new Ae.ErrnoError(h);
					if (h = c ? Ae.mayDelete(t, s, f) : Ae.mayCreate(t, s)) throw new Ae.ErrnoError(h);
					if (!l.node_ops.rename) throw new Ae.ErrnoError(63);
					if (Ae.isMountpoint(d) || c && Ae.isMountpoint(c)) throw new Ae.ErrnoError(10);
					if (t !== l && (h = Ae.nodePermissions(l, "w"))) throw new Ae.ErrnoError(h);
					Ae.hashRemoveNode(d);
					try {
						l.node_ops.rename(d, t, s), d.parent = t;
					} catch (m) {
						throw m;
					} finally {
						Ae.hashAddNode(d);
					}
				}
			},
			rmdir(e) {
				var r = Ae.lookupPath(e, { parent: !0 }).node, t = pe.basename(e), n = Ae.lookupNode(r, t), o = Ae.mayDelete(r, t, !0);
				if (o) throw new Ae.ErrnoError(o);
				if (!r.node_ops.rmdir) throw new Ae.ErrnoError(63);
				if (Ae.isMountpoint(n)) throw new Ae.ErrnoError(10);
				r.node_ops.rmdir(r, t), Ae.destroyNode(n);
			},
			readdir(e) {
				var r = Ae.lookupPath(e, { follow: !0 }).node;
				return Ae.checkOpExists(r.node_ops.readdir, 54)(r);
			},
			unlink(e) {
				var r = Ae.lookupPath(e, { parent: !0 }).node;
				if (!r) throw new Ae.ErrnoError(44);
				var t = pe.basename(e), n = Ae.lookupNode(r, t), o = Ae.mayDelete(r, t, !1);
				if (o) throw new Ae.ErrnoError(o);
				if (!r.node_ops.unlink) throw new Ae.ErrnoError(63);
				if (Ae.isMountpoint(n)) throw new Ae.ErrnoError(10);
				r.node_ops.unlink(r, t), Ae.destroyNode(n);
			},
			readlink(e) {
				var r = Ae.lookupPath(e).node;
				if (!r) throw new Ae.ErrnoError(44);
				if (!r.node_ops.readlink) throw new Ae.ErrnoError(28);
				return r.node_ops.readlink(r);
			},
			stat(e, r) {
				var t = Ae.lookupPath(e, { follow: !r }).node;
				return Ae.checkOpExists(t.node_ops.getattr, 63)(t);
			},
			lstat: (e) => Ae.stat(e, !0),
			chmod(e, r, t) {
				var n = "string" == typeof e ? Ae.lookupPath(e, { follow: !t }).node : e;
				Ae.checkOpExists(n.node_ops.setattr, 63)(n, {
					mode: 4095 & r | -4096 & n.mode,
					ctime: Date.now(),
					dontFollow: t
				});
			},
			lchmod(e, r) {
				Ae.chmod(e, r, !0);
			},
			fchmod(e, r) {
				var t = Ae.getStreamChecked(e);
				Ae.chmod(t.node, r);
			},
			chown(e, r, t, n) {
				var o = "string" == typeof e ? Ae.lookupPath(e, { follow: !n }).node : e;
				Ae.checkOpExists(o.node_ops.setattr, 63)(o, {
					timestamp: Date.now(),
					dontFollow: n
				});
			},
			lchown(e, r, t) {
				Ae.chown(e, r, t, !0);
			},
			fchown(e, r, t) {
				var n = Ae.getStreamChecked(e);
				Ae.chown(n.node, r, t);
			},
			truncate(e, r) {
				if (r < 0) throw new Ae.ErrnoError(28);
				var t;
				if (t = "string" == typeof e ? Ae.lookupPath(e, { follow: !0 }).node : e, Ae.isDir(t.mode)) throw new Ae.ErrnoError(31);
				if (!Ae.isFile(t.mode)) throw new Ae.ErrnoError(28);
				var n = Ae.nodePermissions(t, "w");
				if (n) throw new Ae.ErrnoError(n);
				Ae.checkOpExists(t.node_ops.setattr, 63)(t, {
					size: r,
					timestamp: Date.now()
				});
			},
			ftruncate(e, r) {
				var t = Ae.getStreamChecked(e);
				if (!(2097155 & t.flags)) throw new Ae.ErrnoError(28);
				Ae.truncate(t.node, r);
			},
			utime(e, r, t) {
				var n = Ae.lookupPath(e, { follow: !0 }).node;
				Ae.checkOpExists(n.node_ops.setattr, 63)(n, {
					atime: r,
					mtime: t
				});
			},
			open(e, r, t = 438) {
				if ("" === e) throw new Ae.ErrnoError(44);
				var n, a;
				if (t = 64 & (r = "string" == typeof r ? ((e) => {
					var r = {
						r: 0,
						"r+": 2,
						w: 577,
						"w+": 578,
						a: 1089,
						"a+": 1090
					}[e];
					if (void 0 === r) throw new Error(`Unknown file open mode: ${e}`);
					return r;
				})(r) : r) ? 4095 & t | 32768 : 0, "object" == typeof e) n = e;
				else {
					a = e.endsWith("/");
					var s = Ae.lookupPath(e, {
						follow: !(131072 & r),
						noent_okay: !0
					});
					n = s.node, e = s.path;
				}
				var i = !1;
				if (64 & r) if (n) {
					if (128 & r) throw new Ae.ErrnoError(20);
				} else {
					if (a) throw new Ae.ErrnoError(31);
					n = Ae.mknod(e, 511 | t, 0), i = !0;
				}
				if (!n) throw new Ae.ErrnoError(44);
				if (Ae.isChrdev(n.mode) && (r &= -513), 65536 & r && !Ae.isDir(n.mode)) throw new Ae.ErrnoError(54);
				if (!i) {
					var l = Ae.mayOpen(n, r);
					if (l) throw new Ae.ErrnoError(l);
				}
				512 & r && !i && Ae.truncate(n, 0), r &= -131713;
				var c = Ae.createStream({
					node: n,
					path: Ae.getPath(n),
					flags: r,
					seekable: !0,
					position: 0,
					stream_ops: n.stream_ops,
					ungotten: [],
					error: !1
				});
				return c.stream_ops.open && c.stream_ops.open(c), i && Ae.chmod(n, 511 & t), !o.logReadFiles || 1 & r || e in Ae.readFiles || (Ae.readFiles[e] = 1), c;
			},
			close(e) {
				if (Ae.isClosed(e)) throw new Ae.ErrnoError(8);
				e.getdents && (e.getdents = null);
				try {
					e.stream_ops.close && e.stream_ops.close(e);
				} catch (r) {
					throw r;
				} finally {
					Ae.closeStream(e.fd);
				}
				e.fd = null;
			},
			isClosed: (e) => null === e.fd,
			llseek(e, r, t) {
				if (Ae.isClosed(e)) throw new Ae.ErrnoError(8);
				if (!e.seekable || !e.stream_ops.llseek) throw new Ae.ErrnoError(70);
				if (0 != t && 1 != t && 2 != t) throw new Ae.ErrnoError(28);
				return e.position = e.stream_ops.llseek(e, r, t), e.ungotten = [], e.position;
			},
			read(e, r, t, n, o) {
				if (n < 0 || o < 0) throw new Ae.ErrnoError(28);
				if (Ae.isClosed(e)) throw new Ae.ErrnoError(8);
				if (1 == (2097155 & e.flags)) throw new Ae.ErrnoError(8);
				if (Ae.isDir(e.node.mode)) throw new Ae.ErrnoError(31);
				if (!e.stream_ops.read) throw new Ae.ErrnoError(28);
				var a = void 0 !== o;
				if (a) {
					if (!e.seekable) throw new Ae.ErrnoError(70);
				} else o = e.position;
				var s = e.stream_ops.read(e, r, t, n, o);
				return a || (e.position += s), s;
			},
			write(e, r, t, n, o, a) {
				if (n < 0 || o < 0) throw new Ae.ErrnoError(28);
				if (Ae.isClosed(e)) throw new Ae.ErrnoError(8);
				if (!(2097155 & e.flags)) throw new Ae.ErrnoError(8);
				if (Ae.isDir(e.node.mode)) throw new Ae.ErrnoError(31);
				if (!e.stream_ops.write) throw new Ae.ErrnoError(28);
				e.seekable && 1024 & e.flags && Ae.llseek(e, 0, 2);
				var s = void 0 !== o;
				if (s) {
					if (!e.seekable) throw new Ae.ErrnoError(70);
				} else o = e.position;
				var i = e.stream_ops.write(e, r, t, n, o, a);
				return s || (e.position += i), i;
			},
			allocate(e, r, t) {
				if (Ae.isClosed(e)) throw new Ae.ErrnoError(8);
				if (r < 0 || t <= 0) throw new Ae.ErrnoError(28);
				if (!(2097155 & e.flags)) throw new Ae.ErrnoError(8);
				if (!Ae.isFile(e.node.mode) && !Ae.isDir(e.node.mode)) throw new Ae.ErrnoError(43);
				if (!e.stream_ops.allocate) throw new Ae.ErrnoError(138);
				e.stream_ops.allocate(e, r, t);
			},
			mmap(e, r, t, n, o) {
				if (2 & n && !(2 & o) && 2 != (2097155 & e.flags)) throw new Ae.ErrnoError(2);
				if (1 == (2097155 & e.flags)) throw new Ae.ErrnoError(2);
				if (!e.stream_ops.mmap) throw new Ae.ErrnoError(43);
				if (!r) throw new Ae.ErrnoError(28);
				return e.stream_ops.mmap(e, r, t, n, o);
			},
			msync: (e, r, t, n, o) => e.stream_ops.msync ? e.stream_ops.msync(e, r, t, n, o) : 0,
			ioctl(e, r, t) {
				if (!e.stream_ops.ioctl) throw new Ae.ErrnoError(59);
				return e.stream_ops.ioctl(e, r, t);
			},
			readFile(e, r = {}) {
				if (r.flags = r.flags || 0, r.encoding = r.encoding || "binary", "utf8" !== r.encoding && "binary" !== r.encoding) throw new Error(`Invalid encoding type "${r.encoding}"`);
				var t, n = Ae.open(e, r.flags), o = Ae.stat(e).size, a = new Uint8Array(o);
				return Ae.read(n, a, 0, o, 0), "utf8" === r.encoding ? t = ce(a) : "binary" === r.encoding && (t = a), Ae.close(n), t;
			},
			writeFile(e, r, t = {}) {
				t.flags = t.flags || 577;
				var n = Ae.open(e, t.flags, t.mode);
				if ("string" == typeof r) {
					var o = new Uint8Array(ne(r) + 1), a = oe(r, o, 0, o.length);
					Ae.write(n, o, 0, a, void 0, t.canOwn);
				} else {
					if (!ArrayBuffer.isView(r)) throw new Error("Unsupported data type");
					Ae.write(n, r, 0, r.byteLength, void 0, t.canOwn);
				}
				Ae.close(n);
			},
			cwd: () => Ae.currentPath,
			chdir(e) {
				var r = Ae.lookupPath(e, { follow: !0 });
				if (null === r.node) throw new Ae.ErrnoError(44);
				if (!Ae.isDir(r.node.mode)) throw new Ae.ErrnoError(54);
				var t = Ae.nodePermissions(r.node, "x");
				if (t) throw new Ae.ErrnoError(t);
				Ae.currentPath = r.path;
			},
			createDefaultDirectories() {
				Ae.mkdir("/tmp"), Ae.mkdir("/home"), Ae.mkdir("/home/web_user");
			},
			createDefaultDevices() {
				Ae.mkdir("/dev"), Ae.registerDevice(Ae.makedev(1, 3), {
					read: () => 0,
					write: (e, r, t, n, o) => n,
					llseek: () => 0
				}), Ae.mkdev("/dev/null", Ae.makedev(1, 3)), Ee.register(Ae.makedev(5, 0), Ee.default_tty_ops), Ee.register(Ae.makedev(6, 0), Ee.default_tty1_ops), Ae.mkdev("/dev/tty", Ae.makedev(5, 0)), Ae.mkdev("/dev/tty1", Ae.makedev(6, 0));
				var e = /* @__PURE__ */ new Uint8Array(1024), r = 0, t = () => (0 === r && (we(e), r = e.byteLength), e[--r]);
				Ae.createDevice("/dev", "random", t), Ae.createDevice("/dev", "urandom", t), Ae.mkdir("/dev/shm"), Ae.mkdir("/dev/shm/tmp");
			},
			createSpecialDirectories() {
				Ae.mkdir("/proc");
				var e = Ae.mkdir("/proc/self");
				Ae.mkdir("/proc/self/fd"), Ae.mount({ mount() {
					var r = Ae.createNode(e, "fd", 16895, 73);
					return r.stream_ops = { llseek: be.stream_ops.llseek }, r.node_ops = {
						lookup(e, r) {
							var t = +r, n = Ae.getStreamChecked(t), o = {
								parent: null,
								mount: { mountpoint: "fake" },
								node_ops: { readlink: () => n.path },
								id: t + 1
							};
							return o.parent = o, o;
						},
						readdir: () => Array.from(Ae.streams.entries()).filter(([e, r]) => r).map(([e, r]) => e.toString())
					}, r;
				} }, {}, "/proc/self/fd");
			},
			createStandardStreams(e, r, t) {
				e ? Ae.createDevice("/dev", "stdin", e) : Ae.symlink("/dev/tty", "/dev/stdin"), r ? Ae.createDevice("/dev", "stdout", null, r) : Ae.symlink("/dev/tty", "/dev/stdout"), t ? Ae.createDevice("/dev", "stderr", null, t) : Ae.symlink("/dev/tty1", "/dev/stderr"), Ae.open("/dev/stdin", 0), Ae.open("/dev/stdout", 1), Ae.open("/dev/stderr", 1);
			},
			staticInit() {
				Ae.nameTable = new Array(4096), Ae.mount(be, {}, "/"), Ae.createDefaultDirectories(), Ae.createDefaultDevices(), Ae.createSpecialDirectories(), Ae.filesystems = { MEMFS: be };
			},
			init(e, r, t) {
				Ae.initialized = !0, e ??= o.stdin, r ??= o.stdout, t ??= o.stderr, Ae.createStandardStreams(e, r, t);
			},
			quit() {
				Ae.initialized = !1;
				for (var e = 0; e < Ae.streams.length; e++) {
					var r = Ae.streams[e];
					r && Ae.close(r);
				}
			},
			findObject(e, r) {
				var t = Ae.analyzePath(e, r);
				return t.exists ? t.object : null;
			},
			analyzePath(e, r) {
				try {
					e = (n = Ae.lookupPath(e, { follow: !r })).path;
				} catch (o) {}
				var t = {
					isRoot: !1,
					exists: !1,
					error: 0,
					name: null,
					path: null,
					object: null,
					parentExists: !1,
					parentPath: null,
					parentObject: null
				};
				try {
					var n = Ae.lookupPath(e, { parent: !0 });
					t.parentExists = !0, t.parentPath = n.path, t.parentObject = n.node, t.name = pe.basename(e), n = Ae.lookupPath(e, { follow: !r }), t.exists = !0, t.path = n.path, t.object = n.node, t.name = n.node.name, t.isRoot = "/" === n.path;
				} catch (o) {
					t.error = o.errno;
				}
				return t;
			},
			createPath(e, r, t, n) {
				e = "string" == typeof e ? e : Ae.getPath(e);
				for (var o = r.split("/").reverse(); o.length;) {
					var a = o.pop();
					if (a) {
						var s = pe.join2(e, a);
						try {
							Ae.mkdir(s);
						} catch (i) {}
						e = s;
					}
				}
				return s;
			},
			createFile(e, r, t, n, o) {
				var a = pe.join2("string" == typeof e ? e : Ae.getPath(e), r), s = Pe(n, o);
				return Ae.create(a, s);
			},
			createDataFile(e, r, t, n, o, a) {
				var s = r;
				e && (e = "string" == typeof e ? e : Ae.getPath(e), s = r ? pe.join2(e, r) : e);
				var i = Pe(n, o), l = Ae.create(s, i);
				if (t) {
					if ("string" == typeof t) {
						for (var c = new Array(t.length), d = 0, u = t.length; d < u; ++d) c[d] = t.charCodeAt(d);
						t = c;
					}
					Ae.chmod(l, 146 | i);
					var f = Ae.open(l, 577);
					Ae.write(f, t, 0, t.length, 0, a), Ae.close(f), Ae.chmod(l, i);
				}
			},
			createDevice(e, r, t, n) {
				var o = pe.join2("string" == typeof e ? e : Ae.getPath(e), r), a = Pe(!!t, !!n);
				Ae.createDevice.major ??= 64;
				var s = Ae.makedev(Ae.createDevice.major++, 0);
				return Ae.registerDevice(s, {
					open(e) {
						e.seekable = !1;
					},
					close(e) {
						n?.buffer?.length && n(10);
					},
					read(e, r, n, o, a) {
						for (var s = 0, i = 0; i < o; i++) {
							var l;
							try {
								l = t();
							} catch (c) {
								throw new Ae.ErrnoError(29);
							}
							if (void 0 === l && 0 === s) throw new Ae.ErrnoError(6);
							if (null == l) break;
							s++, r[n + i] = l;
						}
						return s && (e.node.atime = Date.now()), s;
					},
					write(e, r, t, o, a) {
						for (var s = 0; s < o; s++) try {
							n(r[t + s]);
						} catch (i) {
							throw new Ae.ErrnoError(29);
						}
						return o && (e.node.mtime = e.node.ctime = Date.now()), s;
					}
				}), Ae.mkdev(o, a, s);
			},
			forceLoadFile(e) {
				if (e.isDevice || e.isFolder || e.link || e.contents) return !0;
				if ("undefined" != typeof XMLHttpRequest) throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
				try {
					e.contents = h(e.url), e.usedBytes = e.contents.length;
				} catch (r) {
					throw new Ae.ErrnoError(29);
				}
			},
			createLazyFile(e, r, t, n, o) {
				class a {
					lengthKnown = !1;
					chunks = [];
					get(e) {
						if (!(e > this.length - 1 || e < 0)) {
							var r = e % this.chunkSize, t = e / this.chunkSize | 0;
							return this.getter(t)[r];
						}
					}
					setDataGetter(e) {
						this.getter = e;
					}
					cacheLength() {
						var e = new XMLHttpRequest();
						if (e.open("HEAD", t, !1), e.send(null), !(e.status >= 200 && e.status < 300 || 304 === e.status)) throw new Error("Couldn't load " + t + ". Status: " + e.status);
						var r, n = Number(e.getResponseHeader("Content-length")), o = (r = e.getResponseHeader("Accept-Ranges")) && "bytes" === r, a = (r = e.getResponseHeader("Content-Encoding")) && "gzip" === r, s = 1048576;
						o || (s = n);
						var i = this;
						i.setDataGetter((e) => {
							var r = e * s, o = (e + 1) * s - 1;
							if (o = Math.min(o, n - 1), void 0 === i.chunks[e] && (i.chunks[e] = ((e, r) => {
								if (e > r) throw new Error("invalid range (" + e + ", " + r + ") or no bytes requested!");
								if (r > n - 1) throw new Error("only " + n + " bytes available! programmer error!");
								var o = new XMLHttpRequest();
								if (o.open("GET", t, !1), n !== s && o.setRequestHeader("Range", "bytes=" + e + "-" + r), o.responseType = "arraybuffer", o.overrideMimeType && o.overrideMimeType("text/plain; charset=x-user-defined"), o.send(null), !(o.status >= 200 && o.status < 300 || 304 === o.status)) throw new Error("Couldn't load " + t + ". Status: " + o.status);
								return void 0 !== o.response ? new Uint8Array(o.response || []) : ye(o.responseText || "", !0);
							})(r, o)), void 0 === i.chunks[e]) throw new Error("doXHR failed!");
							return i.chunks[e];
						}), !a && n || (s = n = 1, n = this.getter(0).length, s = n, k("LazyFiles on gzip forces download of the whole file when length is accessed")), this._length = n, this._chunkSize = s, this.lengthKnown = !0;
					}
					get length() {
						return this.lengthKnown || this.cacheLength(), this._length;
					}
					get chunkSize() {
						return this.lengthKnown || this.cacheLength(), this._chunkSize;
					}
				}
				if ("undefined" != typeof XMLHttpRequest) {
					if (!i) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
					var s = {
						isDevice: !1,
						contents: new a()
					};
				} else s = {
					isDevice: !1,
					url: t
				};
				var l = Ae.createFile(e, r, s, n, o);
				s.contents ? l.contents = s.contents : s.url && (l.contents = null, l.url = s.url), Object.defineProperties(l, { usedBytes: { get: function() {
					return this.contents.length;
				} } });
				var c = {};
				function d(e, r, t, n, o) {
					var a = e.node.contents;
					if (o >= a.length) return 0;
					var s = Math.min(a.length - o, n);
					if (a.slice) for (var i = 0; i < s; i++) r[t + i] = a[o + i];
					else for (i = 0; i < s; i++) r[t + i] = a.get(o + i);
					return s;
				}
				return Object.keys(l.stream_ops).forEach((e) => {
					var r = l.stream_ops[e];
					c[e] = (...e) => (Ae.forceLoadFile(l), r(...e));
				}), c.read = (e, r, t, n, o) => (Ae.forceLoadFile(l), d(e, r, t, n, o)), c.mmap = (e, r, t, n, o) => {
					Ae.forceLoadFile(l);
					var a = _e();
					if (!a) throw new Ae.ErrnoError(48);
					return d(e, F, a, r, t), {
						ptr: a,
						allocated: !0
					};
				}, l.stream_ops = c, l;
			}
		}, xe = {
			DEFAULT_POLLMASK: 5,
			calculateAt(e, r, t) {
				if (pe.isAbs(r)) return r;
				var n;
				if (n = -100 === e ? Ae.cwd() : xe.getStreamFromFD(e).path, 0 == r.length) {
					if (!t) throw new Ae.ErrnoError(44);
					return n;
				}
				return n + "/" + r;
			},
			writeStat(e, r) {
				A[e >> 2] = r.dev, A[e + 4 >> 2] = r.mode, x[e + 8 >> 2] = r.nlink, A[e + 12 >> 2] = r.uid, A[e + 16 >> 2] = r.gid, A[e + 20 >> 2] = r.rdev, R[e + 24 >> 3] = BigInt(r.size), A[e + 32 >> 2] = 4096, A[e + 36 >> 2] = r.blocks;
				var t = r.atime.getTime(), n = r.mtime.getTime(), o = r.ctime.getTime();
				return R[e + 40 >> 3] = BigInt(Math.floor(t / 1e3)), x[e + 48 >> 2] = t % 1e3 * 1e3 * 1e3, R[e + 56 >> 3] = BigInt(Math.floor(n / 1e3)), x[e + 64 >> 2] = n % 1e3 * 1e3 * 1e3, R[e + 72 >> 3] = BigInt(Math.floor(o / 1e3)), x[e + 80 >> 2] = o % 1e3 * 1e3 * 1e3, R[e + 88 >> 3] = BigInt(r.ino), 0;
			},
			writeStatFs(e, r) {
				A[e + 4 >> 2] = r.bsize, A[e + 40 >> 2] = r.bsize, A[e + 8 >> 2] = r.blocks, A[e + 12 >> 2] = r.bfree, A[e + 16 >> 2] = r.bavail, A[e + 20 >> 2] = r.files, A[e + 24 >> 2] = r.ffree, A[e + 28 >> 2] = r.fsid, A[e + 44 >> 2] = r.flags, A[e + 36 >> 2] = r.namelen;
			},
			doMsync(e, r, t, n, o) {
				if (!Ae.isFile(r.node.mode)) throw new Ae.ErrnoError(43);
				if (2 & n) return 0;
				var a = D.slice(e, e + t);
				Ae.msync(r, a, o, t, n);
			},
			getStreamFromFD: (e) => Ae.getStreamChecked(e),
			varargs: void 0,
			getStr: (e) => de(e)
		}, Me = () => {
			var e = A[+xe.varargs >> 2];
			return xe.varargs += 4, e;
		}, Re = Me, je = () => Date.now(), Ne = (e) => e < -9007199254740992 || e > 9007199254740992 ? NaN : Number(e), ze = (e) => {
			var r = (e - b.buffer.byteLength + 65535) / 65536 | 0;
			try {
				return b.grow(r), B(), 1;
			} catch (t) {}
		}, Ce = {}, Le = () => {
			if (!Le.strings) {
				var e = {
					USER: "web_user",
					LOGNAME: "web_user",
					PATH: "/",
					PWD: "/",
					HOME: "/home/web_user",
					LANG: ("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
					_: w || "./this.program"
				};
				for (var r in Ce) void 0 === Ce[r] ? delete e[r] : e[r] = Ce[r];
				var t = [];
				for (var r in e) t.push(`${r}=${e[r]}`);
				Le.strings = t;
			}
			return Le.strings;
		}, Te = (e) => {
			S = e, ue || (o.onExit?.(e), z = !0), v(e, new ee(e));
		}, Be = (e, r) => {
			S = e, Te(e);
		}, Ie = Be, Oe = (e) => o["_" + e], Ue = (e, r, t, n, o) => {
			var a = {
				string: (e) => {
					var r = 0;
					return null != e && 0 !== e && (r = ie(e)), r;
				},
				array: (e) => {
					var r, t, n = se(e.length);
					return r = e, t = n, F.set(r, t), n;
				}
			}, s = Oe(e), i = [], l = 0;
			if (n) for (var c = 0; c < n.length; c++) {
				var d = a[t[c]];
				d ? (0 === l && (l = te()), i[c] = d(n[c])) : i[c] = n[c];
			}
			var u = s(...i);
			return u = function(e) {
				return 0 !== l && er(l), function(e) {
					return "string" === r ? de(e) : "boolean" === r ? Boolean(e) : e;
				}(e);
			}(u);
		}, He = Ae.readFile, $e = (e) => {
			var r = ne(e) + 1, t = Ye(r);
			return t && ae(e, t, r), t;
		}, We = Ae.createPath, qe = Ae.createLazyFile, Ge = Ae.createDevice;
		Ae.createPreloadedFile = De, Ae.staticInit(), o.FS_createDataFile = Ae.createDataFile, o.FS_readFile = Ae.readFile, o.FS_unlink = Ae.unlink, o.FS_createPath = Ae.createPath, o.FS_createDataFile = Ae.createDataFile, o.FS_createPreloadedFile = Ae.createPreloadedFile, o.FS_unlink = Ae.unlink, o.FS_createLazyFile = Ae.createLazyFile, o.FS_createDevice = Ae.createDevice, be.doesNotExistError = new Ae.ErrnoError(44), be.doesNotExistError.stack = "<generic error, no stack>";
		var Xe = {
			c: (e, r, t, n) => Y(`Assertion failed: ${de(e)}, at: ` + [
				r ? de(r) : "unknown filename",
				t,
				n ? de(n) : "unknown function"
			]),
			b: (e, r, t) => {
				throw new me(e).init(r, t), e;
			},
			a: (e) => {
				var r = Je(), t = Qe();
				Y(`stack overflow (Attempt to set SP to ${fe(e)}, with stack limits [${fe(t)} - ${fe(r)}]). If you require more stack space build with -sSTACK_SIZE=<bytes>`);
			},
			l: function(e, r, t, n) {
				try {
					if (r = xe.getStr(r), r = xe.calculateAt(e, r), -8 & t) return -28;
					var o = Ae.lookupPath(r, { follow: !0 }).node;
					if (!o) return -44;
					var a = "";
					return 4 & t && (a += "r"), 2 & t && (a += "w"), 1 & t && (a += "x"), a && Ae.nodePermissions(o, a) ? -2 : 0;
				} catch (s) {
					if (void 0 === Ae || "ErrnoError" !== s.name) throw s;
					return -s.errno;
				}
			},
			e: function(e, r, t) {
				xe.varargs = t;
				try {
					var n = xe.getStreamFromFD(e);
					switch (r) {
						case 0:
							if ((o = Me()) < 0) return -28;
							for (; Ae.streams[o];) o++;
							return Ae.dupStream(n, o).fd;
						case 1:
						case 2:
						case 13:
						case 14: return 0;
						case 3: return n.flags;
						case 4:
							var o = Me();
							return n.flags |= o, 0;
						case 12: return o = Re(), P[o + 0 >> 1] = 2, 0;
					}
					return -28;
				} catch (a) {
					if (void 0 === Ae || "ErrnoError" !== a.name) throw a;
					return -a.errno;
				}
			},
			A: function(e, r) {
				try {
					if (0 === r) return -28;
					var t = Ae.cwd(), n = ne(t) + 1;
					return r < n ? -68 : (ae(t, e, r), n);
				} catch (o) {
					if (void 0 === Ae || "ErrnoError" !== o.name) throw o;
					return -o.errno;
				}
			},
			t: function(e, r, t) {
				try {
					var n = xe.getStreamFromFD(e);
					n.getdents ||= Ae.readdir(n.path);
					for (var o = 280, a = 0, s = Ae.llseek(n, 0, 1), i = Math.floor(s / o), l = Math.min(n.getdents.length, i + Math.floor(t / o)), c = i; c < l; c++) {
						var d, u, f = n.getdents[c];
						if ("." === f) d = n.node.id, u = 4;
						else if (".." === f) d = Ae.lookupPath(n.path, { parent: !0 }).node.id, u = 4;
						else {
							var h;
							try {
								h = Ae.lookupNode(n.node, f);
							} catch (m) {
								if (28 === m?.errno) continue;
								throw m;
							}
							d = h.id, u = Ae.isChrdev(h.mode) ? 2 : Ae.isDir(h.mode) ? 4 : Ae.isLink(h.mode) ? 10 : 8;
						}
						R[r + a >> 3] = BigInt(d), R[r + a + 8 >> 3] = BigInt((c + 1) * o), P[r + a + 16 >> 1] = 280, F[r + a + 18] = u, ae(f, r + a + 19, 256), a += o;
					}
					return Ae.llseek(n, c * o, 0), a;
				} catch (m) {
					if (void 0 === Ae || "ErrnoError" !== m.name) throw m;
					return -m.errno;
				}
			},
			i: function(e, r, t) {
				xe.varargs = t;
				try {
					var n = xe.getStreamFromFD(e);
					switch (r) {
						case 21509:
						case 21510:
						case 21511:
						case 21512:
						case 21524:
						case 21515: return n.tty ? 0 : -59;
						case 21505:
							if (!n.tty) return -59;
							if (n.tty.ops.ioctl_tcgets) {
								var o = n.tty.ops.ioctl_tcgets(n), a = Re();
								A[a >> 2] = o.c_iflag || 0, A[a + 4 >> 2] = o.c_oflag || 0, A[a + 8 >> 2] = o.c_cflag || 0, A[a + 12 >> 2] = o.c_lflag || 0;
								for (var s = 0; s < 32; s++) F[a + s + 17] = o.c_cc[s] || 0;
								return 0;
							}
							return 0;
						case 21506:
						case 21507:
						case 21508:
							if (!n.tty) return -59;
							if (n.tty.ops.ioctl_tcsets) {
								a = Re();
								var i = A[a >> 2], l = A[a + 4 >> 2], c = A[a + 8 >> 2], d = A[a + 12 >> 2], u = [];
								for (s = 0; s < 32; s++) u.push(F[a + s + 17]);
								return n.tty.ops.ioctl_tcsets(n.tty, r, {
									c_iflag: i,
									c_oflag: l,
									c_cflag: c,
									c_lflag: d,
									c_cc: u
								});
							}
							return 0;
						case 21519: return n.tty ? (a = Re(), A[a >> 2] = 0, 0) : -59;
						case 21520: return n.tty ? -28 : -59;
						case 21531: return a = Re(), Ae.ioctl(n, r, a);
						case 21523:
							if (!n.tty) return -59;
							if (n.tty.ops.ioctl_tiocgwinsz) {
								var f = n.tty.ops.ioctl_tiocgwinsz(n.tty);
								a = Re(), P[a >> 1] = f[0], P[a + 2 >> 1] = f[1];
							}
							return 0;
						default: return -28;
					}
				} catch (h) {
					if (void 0 === Ae || "ErrnoError" !== h.name) throw h;
					return -h.errno;
				}
			},
			v: function(e, r, t) {
				try {
					return r = xe.getStr(r), r = xe.calculateAt(e, r), Ae.mkdir(r, t, 0), 0;
				} catch (n) {
					if (void 0 === Ae || "ErrnoError" !== n.name) throw n;
					return -n.errno;
				}
			},
			f: function(e, r, t, n) {
				xe.varargs = n;
				try {
					r = xe.getStr(r), r = xe.calculateAt(e, r);
					var o = n ? Me() : 0;
					return Ae.open(r, t, o).fd;
				} catch (a) {
					if (void 0 === Ae || "ErrnoError" !== a.name) throw a;
					return -a.errno;
				}
			},
			s: function(e, r, t, n) {
				try {
					if (r = xe.getStr(r), r = xe.calculateAt(e, r), n <= 0) return -28;
					var o = Ae.readlink(r), a = Math.min(n, ne(o)), s = F[t + a];
					return ae(o, t, n + 1), F[t + a] = s, a;
				} catch (i) {
					if (void 0 === Ae || "ErrnoError" !== i.name) throw i;
					return -i.errno;
				}
			},
			q: function(e) {
				try {
					return e = xe.getStr(e), Ae.rmdir(e), 0;
				} catch (r) {
					if (void 0 === Ae || "ErrnoError" !== r.name) throw r;
					return -r.errno;
				}
			},
			w: function(e, r) {
				try {
					return e = xe.getStr(e), xe.writeStat(r, Ae.stat(e));
				} catch (t) {
					if (void 0 === Ae || "ErrnoError" !== t.name) throw t;
					return -t.errno;
				}
			},
			r: function(e, r, t) {
				try {
					return r = xe.getStr(r), r = xe.calculateAt(e, r), 0 === t ? Ae.unlink(r) : 512 === t ? Ae.rmdir(r) : Y("Invalid flags passed to unlinkat"), 0;
				} catch (n) {
					if (void 0 === Ae || "ErrnoError" !== n.name) throw n;
					return -n.errno;
				}
			},
			m: () => Y(""),
			o: (e) => {
				if (d) {
					if (!e) return 1;
					var r = de(e);
					if (!r.length) return 0;
					var t = u("child_process").spawnSync(r, [], {
						shell: !0,
						stdio: "inherit"
					}), n = (e, r) => e << 8 | r;
					return null === t.status ? n(0, ((e) => {
						switch (e) {
							case "SIGHUP": return 1;
							case "SIGQUIT": return 3;
							case "SIGFPE": return 8;
							case "SIGKILL": return 9;
							case "SIGALRM": return 14;
							case "SIGTERM": return 15;
							default: return 2;
						}
					})(t.signal)) : n(t.status, 0);
				}
				return e ? -52 : 0;
			},
			u: (e, r, t, n) => {
				var o = (/* @__PURE__ */ new Date()).getFullYear(), a = new Date(o, 0, 1), s = new Date(o, 6, 1), i = a.getTimezoneOffset(), l = s.getTimezoneOffset(), c = Math.max(i, l);
				x[e >> 2] = 60 * c, A[r >> 2] = Number(i != l);
				var d = (e) => {
					var r = e >= 0 ? "-" : "+", t = Math.abs(e);
					return `UTC${r}${String(Math.floor(t / 60)).padStart(2, "0")}${String(t % 60).padStart(2, "0")}`;
				}, u = d(i), f = d(l);
				l < i ? (ae(u, t, 17), ae(f, n, 17)) : (ae(u, n, 17), ae(f, t, 17));
			},
			k: function(e, r, t) {
				if (r = Ne(r), !((n = e) >= 0 && n <= 3)) return 28;
				var n, o = 0 === e ? je() : performance.now();
				var a = Math.round(1e3 * o * 1e3);
				return R[t >> 3] = BigInt(a), 0;
			},
			j: je,
			p: () => 2147483648,
			n: (e) => {
				var r = D.length, t = 2147483648;
				if ((e >>>= 0) > t) return !1;
				for (var n = 1; n <= 4; n *= 2) {
					var o = r * (1 + .2 / n);
					if (o = Math.min(o, e + 100663296), ze(Math.min(t, ke(Math.max(e, o), 65536)))) return !0;
				}
				return !1;
			},
			y: (e, r) => {
				var t = 0;
				return Le().forEach((n, o) => {
					var a = r + t;
					x[e + 4 * o >> 2] = a, ((e, r) => {
						for (var t = 0; t < e.length; ++t) F[r++] = e.charCodeAt(t);
						F[r] = 0;
					})(n, a), t += n.length + 1;
				}), 0;
			},
			z: (e, r) => {
				var t = Le();
				x[e >> 2] = t.length;
				var n = 0;
				return t.forEach((e) => n += e.length + 1), x[r >> 2] = n, 0;
			},
			g: Ie,
			d: function(e) {
				try {
					var r = xe.getStreamFromFD(e);
					return Ae.close(r), 0;
				} catch (t) {
					if (void 0 === Ae || "ErrnoError" !== t.name) throw t;
					return t.errno;
				}
			},
			B: function(e, r, t, n) {
				try {
					var o = ((e, r, t, n) => {
						for (var o = 0, a = 0; a < t; a++) {
							var s = x[r >> 2], i = x[r + 4 >> 2];
							r += 8;
							var l = Ae.read(e, F, s, i, n);
							if (l < 0) return -1;
							if (o += l, l < i) break;
							void 0 !== n && (n += l);
						}
						return o;
					})(xe.getStreamFromFD(e), r, t);
					return x[n >> 2] = o, 0;
				} catch (a) {
					if (void 0 === Ae || "ErrnoError" !== a.name) throw a;
					return a.errno;
				}
			},
			x: function(e, r, t, n) {
				r = Ne(r);
				try {
					if (isNaN(r)) return 61;
					var o = xe.getStreamFromFD(e);
					return Ae.llseek(o, r, t), R[n >> 3] = BigInt(o.position), o.getdents && 0 === r && 0 === t && (o.getdents = null), 0;
				} catch (a) {
					if (void 0 === Ae || "ErrnoError" !== a.name) throw a;
					return a.errno;
				}
			},
			h: function(e, r, t, n) {
				try {
					var o = ((e, r, t, n) => {
						for (var o = 0, a = 0; a < t; a++) {
							var s = x[r >> 2], i = x[r + 4 >> 2];
							r += 8;
							var l = Ae.write(e, F, s, i, n);
							if (l < 0) return -1;
							if (o += l, l < i) break;
							void 0 !== n && (n += l);
						}
						return o;
					})(xe.getStreamFromFD(e), r, t);
					return x[n >> 2] = o, 0;
				} catch (a) {
					if (void 0 === Ae || "ErrnoError" !== a.name) throw a;
					return a.errno;
				}
			}
		}, Ke = await async function() {
			function e(e, r) {
				var t;
				return Ke = e.exports, b = Ke.C, B(), t = Ke.D, O.unshift(t), V(), Ke;
			}
			K();
			var r = { a: Xe };
			if (o.instantiateWasm) try {
				return o.instantiateWasm(r, e);
			} catch (t) {
				_(`Module.instantiateWasm callback failed with error: ${t}`), n(t);
			}
			q ??= Z();
			try {
				return e((await Q(N, q, r)).instance);
			} catch (t) {
				return n(t), Promise.reject(t);
			}
		}();
		Ke.D;
		var Ve = o._main = Ke.F, Ye = o._malloc = Ke.G;
		o._free = Ke.H;
		var Ze = Ke.I, Je = Ke.J, Qe = Ke.K, er = Ke.L, rr = Ke.M, tr = Ke.N;
		Ke.O;
		var nr = o.___set_stack_limits = Ke.P;
		function or() {
			var e;
			Ze(), 0 == (e = Qe()) && (e += 4), x[e >> 2] = 34821223, x[e + 4 >> 2] = 2310721022, x[0] = 1668509029;
		}
		if (o.addRunDependency = K, o.removeRunDependency = V, o.callMain = function(e) {
			var r = Ve;
			e.unshift(w);
			var t = e.length, n = se(4 * (t + 1)), o = n;
			e.forEach((e) => {
				x[o >> 2] = ie(e), o += 4;
			}), x[o >> 2] = 0;
			try {
				var a = r(t, n);
				return Be(a), a;
			} catch (s) {
				return ((e) => {
					if (e instanceof ee || "unwind" == e) return S;
					T(), e instanceof WebAssembly.RuntimeError && tr() <= 0 && _("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 16777216)"), v(1, e);
				})(s);
			}
		}, o.ccall = Ue, o.cwrap = (e, r, t, n) => {
			var o = !t || t.every((e) => "number" === e || "boolean" === e);
			return "string" !== r && o && !n ? Oe(e) : (...n) => Ue(e, r, t, n);
		}, o.setValue = function(e, r, t = "i8") {
			switch (t.endsWith("*") && (t = "*"), t) {
				case "i1":
				case "i8":
					F[e] = r;
					break;
				case "i16":
					P[e >> 1] = r;
					break;
				case "i32":
					A[e >> 2] = r;
					break;
				case "i64":
					R[e >> 3] = BigInt(r);
					break;
				case "float":
					M[e >> 2] = r;
					break;
				case "double":
					j[e >> 3] = r;
					break;
				case "*":
					x[e >> 2] = r;
					break;
				default: Y(`invalid type for setValue: ${t}`);
			}
		}, o.getValue = function(e, r = "i8") {
			switch (r.endsWith("*") && (r = "*"), r) {
				case "i1":
				case "i8": return F[e];
				case "i16": return P[e >> 1];
				case "i32": return A[e >> 2];
				case "i64": return R[e >> 3];
				case "float": return M[e >> 2];
				case "double": return j[e >> 3];
				case "*": return x[e >> 2];
				default: Y(`invalid type for getValue: ${r}`);
			}
		}, o.stringToUTF8 = ae, o.FS_createPreloadedFile = De, o.FS_unlink = (e) => Ae.unlink(e), o.FS_createPath = We, o.FS_createDevice = Ge, o.FS_readFile = He, o.FS = Ae, o.FS_createDataFile = Se, o.FS_createLazyFile = qe, o.allocateUTF8 = $e, o.preInit) for ("function" == typeof o.preInit && (o.preInit = [o.preInit]); o.preInit.length > 0;) o.preInit.pop()();
		return function e(r = p) {
			function n() {
				o.calledRun = !0, z || (T(), he(), o.noFSInit || Ae.initialized || Ae.init(), Ae.ignorePermissions = !1, Ee.init(), re(O), T(), re(U), t(o), o.onRuntimeInitialized?.(), o.noInitialRun, function() {
					if (T(), o.postRun) for ("function" == typeof o.postRun && (o.postRun = [o.postRun]); o.postRun.length;) W(o.postRun.shift());
					re(H);
				}());
			}
			G > 0 ? X = e : (or(), function() {
				if (o.preRun) for ("function" == typeof o.preRun && (o.preRun = [o.preRun]); o.preRun.length;) $(o.preRun.shift());
				re(I);
			}(), G > 0 ? X = e : (o.setStatus ? (o.setStatus("Running..."), setTimeout(() => {
				setTimeout(() => o.setStatus(""), 1), n();
			}, 1)) : n(), T()));
		}(), a;
	});
	let u = null;
	d().then((e) => {
		u = e, self.postMessage({ type: "ready" });
	}), self.onerror = (e, r) => {
		self.postMessage({
			type: "error",
			message: e,
			error: r ? r.stack : null
		});
	}, self.onunhandledrejection = (e) => {
		self.postMessage({
			type: "error",
			message: e.reason ? e.reason.message : "Unhandled rejection",
			error: e.reason ? e.reason.stack : null
		});
	};
	const f = (e) => {
		switch (e.split(".").pop()) {
			case "nii": return "application/sla";
			case "json": return "application/json";
			case "txt":
			case "bvec":
			case "bval": return "text/plain";
			case "gz": return "application/gzip";
			default: return "application/octet-stream";
		}
	};
	self.addEventListener("message", async (e) => {
		try {
			const r = "/input", t = "/output", n = e.data.fileList, o = e.data.cmd;
			if (o.unshift("-o", t), !n || o.length < 1) throw new Error("Expected a flat file list and at least one command");
			if (!Array.isArray(o)) throw new Error("Expected args to be an array");
			if (!u) throw new Error("WASM module not loaded yet!");
			await (async (e, r, t) => {
				u.FS.mkdir(r), u.FS.mkdir(t);
				const n = [];
				for (let o of e) {
					const e = o.file, t = o.webkitRelativePath || e.name, a = new Promise((n, o) => {
						const a = new FileReader();
						a.onload = (e) => {
							try {
								const o = new Uint8Array(e.target.result), a = `${t.split("/").join("_")}`;
								u.FS.createDataFile(r, a, o, !0, !0), n();
							} catch (a) {
								console.error(a), o(a);
							}
						}, a.onerror = () => {
							console.error(a.error), o(a.error);
						}, a.readAsArrayBuffer(e);
					});
					n.push(a);
				}
				return Promise.all(n);
			})(n, r, t), o.push(r);
			const a = u.callMain(o), s = u.FS.readdir(t).filter((e) => !e.startsWith(".")), i = [];
			for (let e of s) {
				const r = "/output/" + e, t = u.FS.readFile(r), n = new File([t], e, { type: f(e) });
				i.push(n);
			}
			self.postMessage({
				convertedFiles: i,
				exitCode: a
			});
		} catch (r) {
			self.postMessage({
				type: "error",
				message: r.message,
				error: r.stack
			});
		}
	}, !1);
})();

//# sourceMappingURL=worker.jpeg-qtTvncCT.js.map