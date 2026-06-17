(function() {
	var e, r = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, o = Object.getOwnPropertyNames, a = Object.getPrototypeOf, s = Object.prototype.hasOwnProperty, i = (e, r) => () => (r || (e((r = { exports: {} }).exports, r), e = null), r.exports), l = (e, i, l) => (l = null != e ? r(a(e)) : {}, ((e, r, a, i) => {
		if (r && "object" == typeof r || "function" == typeof r) for (var l, c = o(r), d = 0, u = c.length; d < u; d++) l = c[d], s.call(e, l) || l === a || t(e, l, {
			get: ((e) => r[e]).bind(null, l),
			enumerable: !(i = n(r, l)) || i.enumerable
		});
		return e;
	})(!i && e && e.__esModule ? l : t(l, "default", {
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
				var e = er();
				0 == e && (e += 4);
				var r = x[e >> 2], t = x[e + 4 >> 2];
				34821223 == r && 2310721022 == t || Y(`Stack overflow! Stack cookie has been overwritten at ${he(e)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${he(t)} ${he(r)}`), 1668509029 != x[0] && Y("Runtime error: The application has corrupted its heap memory area (address zero)!");
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
			return new URL("/niivue-vscode/pr-249/assets/dcm2niix.jpeg-CR3ddVLp.wasm", "" + self.location.href).href;
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
		}, te = () => nr(), ne = (e) => rr(e), oe = (e) => {
			for (var r = 0, t = 0; t < e.length; ++t) {
				var n = e.charCodeAt(t);
				n <= 127 ? r++ : n <= 2047 ? r += 2 : n >= 55296 && n <= 57343 ? (r += 4, ++t) : r += 3;
			}
			return r;
		}, ae = (e, r, t, n) => {
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
		}, se = (e, r, t) => ae(e, D, r, t), ie = (e) => tr(e), le = (e) => {
			var r = oe(e) + 1, t = ie(r);
			return se(e, t, r), t;
		}, ce = "undefined" != typeof TextDecoder ? new TextDecoder() : void 0, de = (e, r = 0, t = NaN) => {
			for (var n = r + t, o = r; e[o] && !(o >= n);) ++o;
			if (o - r > 16 && e.buffer && ce) return ce.decode(e.subarray(r, o));
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
		}, ue = (e, r) => e ? de(D, e, r) : "", fe = o.noExitRuntime || !0, he = (e) => "0x" + (e >>>= 0).toString(16).padStart(8, "0"), me = () => {
			or(Qe(), er());
		};
		class pe {
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
		var we = {
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
				var r = we.isAbs(e), t = "/" === e.substr(-1);
				return (e = we.normalizeArray(e.split("/").filter((e) => !!e), !r).join("/")) || r || (e = "."), e && t && (e += "/"), (r ? "/" : "") + e;
			},
			dirname: (e) => {
				var r = we.splitPath(e), t = r[0], n = r[1];
				return t || n ? (n && (n = n.substr(0, n.length - 1)), t + n) : ".";
			},
			basename: (e) => e && e.match(/([^\/]+|\/)\/*$/)[1],
			join: (...e) => we.normalize(e.join("/")),
			join2: (e, r) => we.normalize(e + "/" + r)
		}, ve = (e) => {
			(ve = (() => {
				if (d) {
					var e = u("crypto");
					return (r) => e.randomFillSync(r);
				}
				return (e) => crypto.getRandomValues(e);
			})())(e);
		}, ge = {
			resolve: (...e) => {
				for (var r = "", t = !1, n = e.length - 1; n >= -1 && !t; n--) {
					var o = n >= 0 ? e[n] : xe.cwd();
					if ("string" != typeof o) throw new TypeError("Arguments to path.resolve must be strings");
					if (!o) return "";
					r = o + "/" + r, t = we.isAbs(o);
				}
				return (t ? "/" : "") + (r = we.normalizeArray(r.split("/").filter((e) => !!e), !t).join("/")) || ".";
			},
			relative: (e, r) => {
				function t(e) {
					for (var r = 0; r < e.length && "" === e[r]; r++);
					for (var t = e.length - 1; t >= 0 && "" === e[t]; t--);
					return r > t ? [] : e.slice(r, t - r + 1);
				}
				e = ge.resolve(e).substr(1), r = ge.resolve(r).substr(1);
				for (var n = t(e.split("/")), o = t(r.split("/")), a = Math.min(n.length, o.length), s = a, i = 0; i < a; i++) if (n[i] !== o[i]) {
					s = i;
					break;
				}
				var l = [];
				for (i = s; i < n.length; i++) l.push("..");
				return (l = l.concat(o.slice(s))).join("/");
			}
		}, ye = [];
		function Ee(e, r, t) {
			var n = t > 0 ? t : oe(e) + 1, o = new Array(n), a = ae(e, o, 0, o.length);
			return r && (o.length = a), o;
		}
		var ke = {
			ttys: [],
			init() {},
			shutdown() {},
			register(e, r) {
				ke.ttys[e] = {
					input: [],
					output: [],
					ops: r
				}, xe.registerDevice(e, ke.stream_ops);
			},
			stream_ops: {
				open(e) {
					var r = ke.ttys[e.node.rdev];
					if (!r) throw new xe.ErrnoError(43);
					e.tty = r, e.seekable = !1;
				},
				close(e) {
					e.tty.ops.fsync(e.tty);
				},
				fsync(e) {
					e.tty.ops.fsync(e.tty);
				},
				read(e, r, t, n, o) {
					if (!e.tty || !e.tty.ops.get_char) throw new xe.ErrnoError(60);
					for (var a = 0, s = 0; s < n; s++) {
						var i;
						try {
							i = e.tty.ops.get_char(e.tty);
						} catch (l) {
							throw new xe.ErrnoError(29);
						}
						if (void 0 === i && 0 === a) throw new xe.ErrnoError(6);
						if (null == i) break;
						a++, r[t + s] = i;
					}
					return a && (e.node.atime = Date.now()), a;
				},
				write(e, r, t, n, o) {
					if (!e.tty || !e.tty.ops.put_char) throw new xe.ErrnoError(60);
					try {
						for (var a = 0; a < n; a++) e.tty.ops.put_char(e.tty, r[t + a]);
					} catch (s) {
						throw new xe.ErrnoError(29);
					}
					return n && (e.node.mtime = e.node.ctime = Date.now()), a;
				}
			},
			default_tty_ops: {
				get_char: (e) => (() => {
					if (!ye.length) {
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
						ye = Ee(e, !0);
					}
					return ye.shift();
				})(),
				put_char(e, r) {
					null === r || 10 === r ? (k(de(e.output)), e.output = []) : 0 != r && e.output.push(r);
				},
				fsync(e) {
					e.output && e.output.length > 0 && (k(de(e.output)), e.output = []);
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
					null === r || 10 === r ? (_(de(e.output)), e.output = []) : 0 != r && e.output.push(r);
				},
				fsync(e) {
					e.output && e.output.length > 0 && (_(de(e.output)), e.output = []);
				}
			}
		}, _e = (e, r) => Math.ceil(e / r) * r, be = (e) => {
			Y();
		}, Se = {
			ops_table: null,
			mount: (e) => Se.createNode(null, "/", 16895, 0),
			createNode(e, r, t, n) {
				if (xe.isBlkdev(t) || xe.isFIFO(t)) throw new xe.ErrnoError(63);
				Se.ops_table ||= {
					dir: {
						node: {
							getattr: Se.node_ops.getattr,
							setattr: Se.node_ops.setattr,
							lookup: Se.node_ops.lookup,
							mknod: Se.node_ops.mknod,
							rename: Se.node_ops.rename,
							unlink: Se.node_ops.unlink,
							rmdir: Se.node_ops.rmdir,
							readdir: Se.node_ops.readdir,
							symlink: Se.node_ops.symlink
						},
						stream: { llseek: Se.stream_ops.llseek }
					},
					file: {
						node: {
							getattr: Se.node_ops.getattr,
							setattr: Se.node_ops.setattr
						},
						stream: {
							llseek: Se.stream_ops.llseek,
							read: Se.stream_ops.read,
							write: Se.stream_ops.write,
							allocate: Se.stream_ops.allocate,
							mmap: Se.stream_ops.mmap,
							msync: Se.stream_ops.msync
						}
					},
					link: {
						node: {
							getattr: Se.node_ops.getattr,
							setattr: Se.node_ops.setattr,
							readlink: Se.node_ops.readlink
						},
						stream: {}
					},
					chrdev: {
						node: {
							getattr: Se.node_ops.getattr,
							setattr: Se.node_ops.setattr
						},
						stream: xe.chrdev_stream_ops
					}
				};
				var o = xe.createNode(e, r, t, n);
				return xe.isDir(o.mode) ? (o.node_ops = Se.ops_table.dir.node, o.stream_ops = Se.ops_table.dir.stream, o.contents = {}) : xe.isFile(o.mode) ? (o.node_ops = Se.ops_table.file.node, o.stream_ops = Se.ops_table.file.stream, o.usedBytes = 0, o.contents = null) : xe.isLink(o.mode) ? (o.node_ops = Se.ops_table.link.node, o.stream_ops = Se.ops_table.link.stream) : xe.isChrdev(o.mode) && (o.node_ops = Se.ops_table.chrdev.node, o.stream_ops = Se.ops_table.chrdev.stream), o.atime = o.mtime = o.ctime = Date.now(), e && (e.contents[r] = o, e.atime = e.mtime = e.ctime = o.atime), o;
			},
			getFileDataAsTypedArray: (e) => e.contents ? e.contents.subarray ? e.contents.subarray(0, e.usedBytes) : new Uint8Array(e.contents) : new Uint8Array(0),
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
					return r.dev = xe.isChrdev(e.mode) ? e.id : 1, r.ino = e.id, r.mode = e.mode, r.nlink = 1, r.uid = 0, r.gid = 0, r.rdev = e.rdev, xe.isDir(e.mode) ? r.size = 4096 : xe.isFile(e.mode) ? r.size = e.usedBytes : xe.isLink(e.mode) ? r.size = e.link.length : r.size = 0, r.atime = new Date(e.atime), r.mtime = new Date(e.mtime), r.ctime = new Date(e.ctime), r.blksize = 4096, r.blocks = Math.ceil(r.size / r.blksize), r;
				},
				setattr(e, r) {
					for (const t of [
						"mode",
						"atime",
						"mtime",
						"ctime"
					]) null != r[t] && (e[t] = r[t]);
					void 0 !== r.size && Se.resizeFileStorage(e, r.size);
				},
				lookup(e, r) {
					throw Se.doesNotExistError;
				},
				mknod: (e, r, t, n) => Se.createNode(e, r, t, n),
				rename(e, r, t) {
					var n;
					try {
						n = xe.lookupNode(r, t);
					} catch (a) {}
					if (n) {
						if (xe.isDir(e.mode)) for (var o in n.contents) throw new xe.ErrnoError(55);
						xe.hashRemoveNode(n);
					}
					delete e.parent.contents[e.name], r.contents[t] = e, e.name = t, r.ctime = r.mtime = e.parent.ctime = e.parent.mtime = Date.now();
				},
				unlink(e, r) {
					delete e.contents[r], e.ctime = e.mtime = Date.now();
				},
				rmdir(e, r) {
					for (var t in xe.lookupNode(e, r).contents) throw new xe.ErrnoError(55);
					delete e.contents[r], e.ctime = e.mtime = Date.now();
				},
				readdir: (e) => [
					".",
					"..",
					...Object.keys(e.contents)
				],
				symlink(e, r, t) {
					var n = Se.createNode(e, r, 41471, 0);
					return n.link = t, n;
				},
				readlink(e) {
					if (!xe.isLink(e.mode)) throw new xe.ErrnoError(28);
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
					if (Se.expandFileStorage(s, o + n), s.contents.subarray && r.subarray) s.contents.set(r.subarray(t, t + n), o);
					else for (var i = 0; i < n; i++) s.contents[o + i] = r[t + i];
					return s.usedBytes = Math.max(s.usedBytes, o + n), n;
				},
				llseek(e, r, t) {
					var n = r;
					if (1 === t ? n += e.position : 2 === t && xe.isFile(e.node.mode) && (n += e.node.usedBytes), n < 0) throw new xe.ErrnoError(28);
					return n;
				},
				allocate(e, r, t) {
					Se.expandFileStorage(e.node, r + t), e.node.usedBytes = Math.max(e.node.usedBytes, r + t);
				},
				mmap(e, r, t, n, o) {
					if (!xe.isFile(e.node.mode)) throw new xe.ErrnoError(43);
					var a, s, i = e.node.contents;
					if (2 & o || !i || i.buffer !== F.buffer) {
						if (s = !0, !(a = be())) throw new xe.ErrnoError(48);
						i && ((t > 0 || t + r < i.length) && (i = i.subarray ? i.subarray(t, t + r) : Array.prototype.slice.call(i, t, t + r)), F.set(i, a));
					} else s = !1, a = i.byteOffset;
					return {
						ptr: a,
						allocated: s
					};
				},
				msync: (e, r, t, n, o) => (Se.stream_ops.write(e, r, 0, n, t, !1), 0)
			}
		}, Fe = (e, r, t, n, o, a) => {
			xe.createDataFile(e, r, t, n, o, a);
		}, De = o.preloadPlugins || [], Pe = (e, r, t, n, o, a, s, i, l, c) => {
			var d = r ? ge.resolve(we.join2(e, r)) : e;
			function u(t) {
				function u(t) {
					c?.(), i || Fe(e, r, t, n, o, l), a?.(), V();
				}
				((e, r, t, n) => {
					"undefined" != typeof Browser && Browser.init();
					var o = !1;
					return De.forEach((a) => {
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
		}, Ae = (e, r) => {
			var t = 0;
			return e && (t |= 365), r && (t |= 146), t;
		}, xe = {
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
					e || (e = this), this.parent = e, this.mount = e.mount, this.id = xe.nextInode++, this.name = r, this.mode = t, this.rdev = n, this.atime = this.mtime = this.ctime = Date.now();
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
					return xe.isDir(this.mode);
				}
				get isDevice() {
					return xe.isChrdev(this.mode);
				}
			},
			lookupPath(e, r = {}) {
				if (!e) throw new xe.ErrnoError(44);
				r.follow_mount ??= !0, we.isAbs(e) || (e = xe.cwd() + "/" + e);
				e: for (var t = 0; t < 40; t++) {
					for (var n = e.split("/").filter((e) => !!e), o = xe.root, a = "/", s = 0; s < n.length; s++) {
						var i = s === n.length - 1;
						if (i && r.parent) break;
						if ("." !== n[s]) if (".." !== n[s]) {
							a = we.join2(a, n[s]);
							try {
								o = xe.lookupNode(o, n[s]);
							} catch (c) {
								if (44 === c?.errno && i && r.noent_okay) return { path: a };
								throw c;
							}
							if (!xe.isMountpoint(o) || i && !r.follow_mount || (o = o.mounted.root), xe.isLink(o.mode) && (!i || r.follow)) {
								if (!o.node_ops.readlink) throw new xe.ErrnoError(52);
								var l = o.node_ops.readlink(o);
								we.isAbs(l) || (l = we.dirname(a) + "/" + l), e = l + "/" + n.slice(s + 1).join("/");
								continue e;
							}
						} else a = we.dirname(a), o = o.parent;
					}
					return {
						path: a,
						node: o
					};
				}
				throw new xe.ErrnoError(32);
			},
			getPath(e) {
				for (var r;;) {
					if (xe.isRoot(e)) {
						var t = e.mount.mountpoint;
						return r ? "/" !== t[t.length - 1] ? `${t}/${r}` : t + r : t;
					}
					r = r ? `${e.name}/${r}` : e.name, e = e.parent;
				}
			},
			hashName(e, r) {
				for (var t = 0, n = 0; n < r.length; n++) t = (t << 5) - t + r.charCodeAt(n) | 0;
				return (e + t >>> 0) % xe.nameTable.length;
			},
			hashAddNode(e) {
				var r = xe.hashName(e.parent.id, e.name);
				e.name_next = xe.nameTable[r], xe.nameTable[r] = e;
			},
			hashRemoveNode(e) {
				var r = xe.hashName(e.parent.id, e.name);
				if (xe.nameTable[r] === e) xe.nameTable[r] = e.name_next;
				else for (var t = xe.nameTable[r]; t;) {
					if (t.name_next === e) {
						t.name_next = e.name_next;
						break;
					}
					t = t.name_next;
				}
			},
			lookupNode(e, r) {
				var t = xe.mayLookup(e);
				if (t) throw new xe.ErrnoError(t);
				for (var n = xe.hashName(e.id, r), o = xe.nameTable[n]; o; o = o.name_next) {
					var a = o.name;
					if (o.parent.id === e.id && a === r) return o;
				}
				return xe.lookup(e, r);
			},
			createNode(e, r, t, n) {
				var o = new xe.FSNode(e, r, t, n);
				return xe.hashAddNode(o), o;
			},
			destroyNode(e) {
				xe.hashRemoveNode(e);
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
			nodePermissions: (e, r) => xe.ignorePermissions || (!r.includes("r") || 292 & e.mode) && (!r.includes("w") || 146 & e.mode) && (!r.includes("x") || 73 & e.mode) ? 0 : 2,
			mayLookup(e) {
				if (!xe.isDir(e.mode)) return 54;
				return xe.nodePermissions(e, "x") || (e.node_ops.lookup ? 0 : 2);
			},
			mayCreate(e, r) {
				if (!xe.isDir(e.mode)) return 54;
				try {
					return xe.lookupNode(e, r), 20;
				} catch (t) {}
				return xe.nodePermissions(e, "wx");
			},
			mayDelete(e, r, t) {
				var n;
				try {
					n = xe.lookupNode(e, r);
				} catch (a) {
					return a.errno;
				}
				var o = xe.nodePermissions(e, "wx");
				if (o) return o;
				if (t) {
					if (!xe.isDir(n.mode)) return 54;
					if (xe.isRoot(n) || xe.getPath(n) === xe.cwd()) return 10;
				} else if (xe.isDir(n.mode)) return 31;
				return 0;
			},
			mayOpen: (e, r) => e ? xe.isLink(e.mode) ? 32 : xe.isDir(e.mode) && ("r" !== xe.flagsToPermissionString(r) || 576 & r) ? 31 : xe.nodePermissions(e, xe.flagsToPermissionString(r)) : 44,
			checkOpExists(e, r) {
				if (!e) throw new xe.ErrnoError(r);
				return e;
			},
			MAX_OPEN_FDS: 4096,
			nextfd() {
				for (var e = 0; e <= xe.MAX_OPEN_FDS; e++) if (!xe.streams[e]) return e;
				throw new xe.ErrnoError(33);
			},
			getStreamChecked(e) {
				var r = xe.getStream(e);
				if (!r) throw new xe.ErrnoError(8);
				return r;
			},
			getStream: (e) => xe.streams[e],
			createStream: (e, r = -1) => (e = Object.assign(new xe.FSStream(), e), -1 == r && (r = xe.nextfd()), e.fd = r, xe.streams[r] = e, e),
			closeStream(e) {
				xe.streams[e] = null;
			},
			dupStream(e, r = -1) {
				var t = xe.createStream(e, r);
				return t.stream_ops?.dup?.(t), t;
			},
			chrdev_stream_ops: {
				open(e) {
					e.stream_ops = xe.getDevice(e.node.rdev).stream_ops, e.stream_ops.open?.(e);
				},
				llseek() {
					throw new xe.ErrnoError(70);
				}
			},
			major: (e) => e >> 8,
			minor: (e) => 255 & e,
			makedev: (e, r) => e << 8 | r,
			registerDevice(e, r) {
				xe.devices[e] = { stream_ops: r };
			},
			getDevice: (e) => xe.devices[e],
			getMounts(e) {
				for (var r = [], t = [e]; t.length;) {
					var n = t.pop();
					r.push(n), t.push(...n.mounts);
				}
				return r;
			},
			syncfs(e, r) {
				"function" == typeof e && (r = e, e = !1), xe.syncFSRequests++, xe.syncFSRequests > 1 && _(`warning: ${xe.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
				var t = xe.getMounts(xe.root.mount), n = 0;
				function o(e) {
					return xe.syncFSRequests--, r(e);
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
				if (o && xe.root) throw new xe.ErrnoError(10);
				if (!o && !a) {
					var s = xe.lookupPath(t, { follow_mount: !1 });
					if (t = s.path, n = s.node, xe.isMountpoint(n)) throw new xe.ErrnoError(10);
					if (!xe.isDir(n.mode)) throw new xe.ErrnoError(54);
				}
				var i = {
					type: e,
					opts: r,
					mountpoint: t,
					mounts: []
				}, l = e.mount(i);
				return l.mount = i, i.root = l, o ? xe.root = l : n && (n.mounted = i, n.mount && n.mount.mounts.push(i)), l;
			},
			unmount(e) {
				var r = xe.lookupPath(e, { follow_mount: !1 });
				if (!xe.isMountpoint(r.node)) throw new xe.ErrnoError(28);
				var t = r.node, n = t.mounted, o = xe.getMounts(n);
				Object.keys(xe.nameTable).forEach((e) => {
					for (var r = xe.nameTable[e]; r;) {
						var t = r.name_next;
						o.includes(r.mount) && xe.destroyNode(r), r = t;
					}
				}), t.mounted = null;
				var a = t.mount.mounts.indexOf(n);
				t.mount.mounts.splice(a, 1);
			},
			lookup: (e, r) => e.node_ops.lookup(e, r),
			mknod(e, r, t) {
				var n = xe.lookupPath(e, { parent: !0 }).node, o = we.basename(e);
				if (!o) throw new xe.ErrnoError(28);
				if ("." === o || ".." === o) throw new xe.ErrnoError(20);
				var a = xe.mayCreate(n, o);
				if (a) throw new xe.ErrnoError(a);
				if (!n.node_ops.mknod) throw new xe.ErrnoError(63);
				return n.node_ops.mknod(n, o, r, t);
			},
			statfs: (e) => xe.statfsNode(xe.lookupPath(e, { follow: !0 }).node),
			statfsStream: (e) => xe.statfsNode(e.node),
			statfsNode(e) {
				var r = {
					bsize: 4096,
					frsize: 4096,
					blocks: 1e6,
					bfree: 5e5,
					bavail: 5e5,
					files: xe.nextInode,
					ffree: xe.nextInode - 1,
					fsid: 42,
					flags: 2,
					namelen: 255
				};
				return e.node_ops.statfs && Object.assign(r, e.node_ops.statfs(e.mount.opts.root)), r;
			},
			create: (e, r = 438) => (r &= 4095, r |= 32768, xe.mknod(e, r, 0)),
			mkdir: (e, r = 511) => (r &= 1023, r |= 16384, xe.mknod(e, r, 0)),
			mkdirTree(e, r) {
				for (var t = e.split("/"), n = "", o = 0; o < t.length; ++o) if (t[o]) {
					n += "/" + t[o];
					try {
						xe.mkdir(n, r);
					} catch (a) {
						if (20 != a.errno) throw a;
					}
				}
			},
			mkdev: (e, r, t) => (void 0 === t && (t = r, r = 438), r |= 8192, xe.mknod(e, r, t)),
			symlink(e, r) {
				if (!ge.resolve(e)) throw new xe.ErrnoError(44);
				var t = xe.lookupPath(r, { parent: !0 }).node;
				if (!t) throw new xe.ErrnoError(44);
				var n = we.basename(r), o = xe.mayCreate(t, n);
				if (o) throw new xe.ErrnoError(o);
				if (!t.node_ops.symlink) throw new xe.ErrnoError(63);
				return t.node_ops.symlink(t, n, e);
			},
			rename(e, r) {
				var t, n = we.dirname(e), o = we.dirname(r), a = we.basename(e), s = we.basename(r), i = xe.lookupPath(e, { parent: !0 }), l = i.node;
				if (t = (i = xe.lookupPath(r, { parent: !0 })).node, !l || !t) throw new xe.ErrnoError(44);
				if (l.mount !== t.mount) throw new xe.ErrnoError(75);
				var c, d = xe.lookupNode(l, a), u = ge.relative(e, o);
				if ("." !== u.charAt(0)) throw new xe.ErrnoError(28);
				if ("." !== (u = ge.relative(r, n)).charAt(0)) throw new xe.ErrnoError(55);
				try {
					c = xe.lookupNode(t, s);
				} catch (m) {}
				if (d !== c) {
					var f = xe.isDir(d.mode), h = xe.mayDelete(l, a, f);
					if (h) throw new xe.ErrnoError(h);
					if (h = c ? xe.mayDelete(t, s, f) : xe.mayCreate(t, s)) throw new xe.ErrnoError(h);
					if (!l.node_ops.rename) throw new xe.ErrnoError(63);
					if (xe.isMountpoint(d) || c && xe.isMountpoint(c)) throw new xe.ErrnoError(10);
					if (t !== l && (h = xe.nodePermissions(l, "w"))) throw new xe.ErrnoError(h);
					xe.hashRemoveNode(d);
					try {
						l.node_ops.rename(d, t, s), d.parent = t;
					} catch (m) {
						throw m;
					} finally {
						xe.hashAddNode(d);
					}
				}
			},
			rmdir(e) {
				var r = xe.lookupPath(e, { parent: !0 }).node, t = we.basename(e), n = xe.lookupNode(r, t), o = xe.mayDelete(r, t, !0);
				if (o) throw new xe.ErrnoError(o);
				if (!r.node_ops.rmdir) throw new xe.ErrnoError(63);
				if (xe.isMountpoint(n)) throw new xe.ErrnoError(10);
				r.node_ops.rmdir(r, t), xe.destroyNode(n);
			},
			readdir(e) {
				var r = xe.lookupPath(e, { follow: !0 }).node;
				return xe.checkOpExists(r.node_ops.readdir, 54)(r);
			},
			unlink(e) {
				var r = xe.lookupPath(e, { parent: !0 }).node;
				if (!r) throw new xe.ErrnoError(44);
				var t = we.basename(e), n = xe.lookupNode(r, t), o = xe.mayDelete(r, t, !1);
				if (o) throw new xe.ErrnoError(o);
				if (!r.node_ops.unlink) throw new xe.ErrnoError(63);
				if (xe.isMountpoint(n)) throw new xe.ErrnoError(10);
				r.node_ops.unlink(r, t), xe.destroyNode(n);
			},
			readlink(e) {
				var r = xe.lookupPath(e).node;
				if (!r) throw new xe.ErrnoError(44);
				if (!r.node_ops.readlink) throw new xe.ErrnoError(28);
				return r.node_ops.readlink(r);
			},
			stat(e, r) {
				var t = xe.lookupPath(e, { follow: !r }).node;
				return xe.checkOpExists(t.node_ops.getattr, 63)(t);
			},
			lstat: (e) => xe.stat(e, !0),
			chmod(e, r, t) {
				var n = "string" == typeof e ? xe.lookupPath(e, { follow: !t }).node : e;
				xe.checkOpExists(n.node_ops.setattr, 63)(n, {
					mode: 4095 & r | -4096 & n.mode,
					ctime: Date.now(),
					dontFollow: t
				});
			},
			lchmod(e, r) {
				xe.chmod(e, r, !0);
			},
			fchmod(e, r) {
				var t = xe.getStreamChecked(e);
				xe.chmod(t.node, r);
			},
			chown(e, r, t, n) {
				var o = "string" == typeof e ? xe.lookupPath(e, { follow: !n }).node : e;
				xe.checkOpExists(o.node_ops.setattr, 63)(o, {
					timestamp: Date.now(),
					dontFollow: n
				});
			},
			lchown(e, r, t) {
				xe.chown(e, r, t, !0);
			},
			fchown(e, r, t) {
				var n = xe.getStreamChecked(e);
				xe.chown(n.node, r, t);
			},
			truncate(e, r) {
				if (r < 0) throw new xe.ErrnoError(28);
				var t;
				if (t = "string" == typeof e ? xe.lookupPath(e, { follow: !0 }).node : e, xe.isDir(t.mode)) throw new xe.ErrnoError(31);
				if (!xe.isFile(t.mode)) throw new xe.ErrnoError(28);
				var n = xe.nodePermissions(t, "w");
				if (n) throw new xe.ErrnoError(n);
				xe.checkOpExists(t.node_ops.setattr, 63)(t, {
					size: r,
					timestamp: Date.now()
				});
			},
			ftruncate(e, r) {
				var t = xe.getStreamChecked(e);
				if (!(2097155 & t.flags)) throw new xe.ErrnoError(28);
				xe.truncate(t.node, r);
			},
			utime(e, r, t) {
				var n = xe.lookupPath(e, { follow: !0 }).node;
				xe.checkOpExists(n.node_ops.setattr, 63)(n, {
					atime: r,
					mtime: t
				});
			},
			open(e, r, t = 438) {
				if ("" === e) throw new xe.ErrnoError(44);
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
					var s = xe.lookupPath(e, {
						follow: !(131072 & r),
						noent_okay: !0
					});
					n = s.node, e = s.path;
				}
				var i = !1;
				if (64 & r) if (n) {
					if (128 & r) throw new xe.ErrnoError(20);
				} else {
					if (a) throw new xe.ErrnoError(31);
					n = xe.mknod(e, 511 | t, 0), i = !0;
				}
				if (!n) throw new xe.ErrnoError(44);
				if (xe.isChrdev(n.mode) && (r &= -513), 65536 & r && !xe.isDir(n.mode)) throw new xe.ErrnoError(54);
				if (!i) {
					var l = xe.mayOpen(n, r);
					if (l) throw new xe.ErrnoError(l);
				}
				512 & r && !i && xe.truncate(n, 0), r &= -131713;
				var c = xe.createStream({
					node: n,
					path: xe.getPath(n),
					flags: r,
					seekable: !0,
					position: 0,
					stream_ops: n.stream_ops,
					ungotten: [],
					error: !1
				});
				return c.stream_ops.open && c.stream_ops.open(c), i && xe.chmod(n, 511 & t), !o.logReadFiles || 1 & r || e in xe.readFiles || (xe.readFiles[e] = 1), c;
			},
			close(e) {
				if (xe.isClosed(e)) throw new xe.ErrnoError(8);
				e.getdents && (e.getdents = null);
				try {
					e.stream_ops.close && e.stream_ops.close(e);
				} catch (r) {
					throw r;
				} finally {
					xe.closeStream(e.fd);
				}
				e.fd = null;
			},
			isClosed: (e) => null === e.fd,
			llseek(e, r, t) {
				if (xe.isClosed(e)) throw new xe.ErrnoError(8);
				if (!e.seekable || !e.stream_ops.llseek) throw new xe.ErrnoError(70);
				if (0 != t && 1 != t && 2 != t) throw new xe.ErrnoError(28);
				return e.position = e.stream_ops.llseek(e, r, t), e.ungotten = [], e.position;
			},
			read(e, r, t, n, o) {
				if (n < 0 || o < 0) throw new xe.ErrnoError(28);
				if (xe.isClosed(e)) throw new xe.ErrnoError(8);
				if (1 == (2097155 & e.flags)) throw new xe.ErrnoError(8);
				if (xe.isDir(e.node.mode)) throw new xe.ErrnoError(31);
				if (!e.stream_ops.read) throw new xe.ErrnoError(28);
				var a = void 0 !== o;
				if (a) {
					if (!e.seekable) throw new xe.ErrnoError(70);
				} else o = e.position;
				var s = e.stream_ops.read(e, r, t, n, o);
				return a || (e.position += s), s;
			},
			write(e, r, t, n, o, a) {
				if (n < 0 || o < 0) throw new xe.ErrnoError(28);
				if (xe.isClosed(e)) throw new xe.ErrnoError(8);
				if (!(2097155 & e.flags)) throw new xe.ErrnoError(8);
				if (xe.isDir(e.node.mode)) throw new xe.ErrnoError(31);
				if (!e.stream_ops.write) throw new xe.ErrnoError(28);
				e.seekable && 1024 & e.flags && xe.llseek(e, 0, 2);
				var s = void 0 !== o;
				if (s) {
					if (!e.seekable) throw new xe.ErrnoError(70);
				} else o = e.position;
				var i = e.stream_ops.write(e, r, t, n, o, a);
				return s || (e.position += i), i;
			},
			allocate(e, r, t) {
				if (xe.isClosed(e)) throw new xe.ErrnoError(8);
				if (r < 0 || t <= 0) throw new xe.ErrnoError(28);
				if (!(2097155 & e.flags)) throw new xe.ErrnoError(8);
				if (!xe.isFile(e.node.mode) && !xe.isDir(e.node.mode)) throw new xe.ErrnoError(43);
				if (!e.stream_ops.allocate) throw new xe.ErrnoError(138);
				e.stream_ops.allocate(e, r, t);
			},
			mmap(e, r, t, n, o) {
				if (2 & n && !(2 & o) && 2 != (2097155 & e.flags)) throw new xe.ErrnoError(2);
				if (1 == (2097155 & e.flags)) throw new xe.ErrnoError(2);
				if (!e.stream_ops.mmap) throw new xe.ErrnoError(43);
				if (!r) throw new xe.ErrnoError(28);
				return e.stream_ops.mmap(e, r, t, n, o);
			},
			msync: (e, r, t, n, o) => e.stream_ops.msync ? e.stream_ops.msync(e, r, t, n, o) : 0,
			ioctl(e, r, t) {
				if (!e.stream_ops.ioctl) throw new xe.ErrnoError(59);
				return e.stream_ops.ioctl(e, r, t);
			},
			readFile(e, r = {}) {
				if (r.flags = r.flags || 0, r.encoding = r.encoding || "binary", "utf8" !== r.encoding && "binary" !== r.encoding) throw new Error(`Invalid encoding type "${r.encoding}"`);
				var t, n = xe.open(e, r.flags), o = xe.stat(e).size, a = new Uint8Array(o);
				return xe.read(n, a, 0, o, 0), "utf8" === r.encoding ? t = de(a) : "binary" === r.encoding && (t = a), xe.close(n), t;
			},
			writeFile(e, r, t = {}) {
				t.flags = t.flags || 577;
				var n = xe.open(e, t.flags, t.mode);
				if ("string" == typeof r) {
					var o = new Uint8Array(oe(r) + 1), a = ae(r, o, 0, o.length);
					xe.write(n, o, 0, a, void 0, t.canOwn);
				} else {
					if (!ArrayBuffer.isView(r)) throw new Error("Unsupported data type");
					xe.write(n, r, 0, r.byteLength, void 0, t.canOwn);
				}
				xe.close(n);
			},
			cwd: () => xe.currentPath,
			chdir(e) {
				var r = xe.lookupPath(e, { follow: !0 });
				if (null === r.node) throw new xe.ErrnoError(44);
				if (!xe.isDir(r.node.mode)) throw new xe.ErrnoError(54);
				var t = xe.nodePermissions(r.node, "x");
				if (t) throw new xe.ErrnoError(t);
				xe.currentPath = r.path;
			},
			createDefaultDirectories() {
				xe.mkdir("/tmp"), xe.mkdir("/home"), xe.mkdir("/home/web_user");
			},
			createDefaultDevices() {
				xe.mkdir("/dev"), xe.registerDevice(xe.makedev(1, 3), {
					read: () => 0,
					write: (e, r, t, n, o) => n,
					llseek: () => 0
				}), xe.mkdev("/dev/null", xe.makedev(1, 3)), ke.register(xe.makedev(5, 0), ke.default_tty_ops), ke.register(xe.makedev(6, 0), ke.default_tty1_ops), xe.mkdev("/dev/tty", xe.makedev(5, 0)), xe.mkdev("/dev/tty1", xe.makedev(6, 0));
				var e = new Uint8Array(1024), r = 0, t = () => (0 === r && (ve(e), r = e.byteLength), e[--r]);
				xe.createDevice("/dev", "random", t), xe.createDevice("/dev", "urandom", t), xe.mkdir("/dev/shm"), xe.mkdir("/dev/shm/tmp");
			},
			createSpecialDirectories() {
				xe.mkdir("/proc");
				var e = xe.mkdir("/proc/self");
				xe.mkdir("/proc/self/fd"), xe.mount({ mount() {
					var r = xe.createNode(e, "fd", 16895, 73);
					return r.stream_ops = { llseek: Se.stream_ops.llseek }, r.node_ops = {
						lookup(e, r) {
							var t = +r, n = xe.getStreamChecked(t), o = {
								parent: null,
								mount: { mountpoint: "fake" },
								node_ops: { readlink: () => n.path },
								id: t + 1
							};
							return o.parent = o, o;
						},
						readdir: () => Array.from(xe.streams.entries()).filter(([e, r]) => r).map(([e, r]) => e.toString())
					}, r;
				} }, {}, "/proc/self/fd");
			},
			createStandardStreams(e, r, t) {
				e ? xe.createDevice("/dev", "stdin", e) : xe.symlink("/dev/tty", "/dev/stdin"), r ? xe.createDevice("/dev", "stdout", null, r) : xe.symlink("/dev/tty", "/dev/stdout"), t ? xe.createDevice("/dev", "stderr", null, t) : xe.symlink("/dev/tty1", "/dev/stderr"), xe.open("/dev/stdin", 0), xe.open("/dev/stdout", 1), xe.open("/dev/stderr", 1);
			},
			staticInit() {
				xe.nameTable = new Array(4096), xe.mount(Se, {}, "/"), xe.createDefaultDirectories(), xe.createDefaultDevices(), xe.createSpecialDirectories(), xe.filesystems = { MEMFS: Se };
			},
			init(e, r, t) {
				xe.initialized = !0, e ??= o.stdin, r ??= o.stdout, t ??= o.stderr, xe.createStandardStreams(e, r, t);
			},
			quit() {
				xe.initialized = !1;
				for (var e = 0; e < xe.streams.length; e++) {
					var r = xe.streams[e];
					r && xe.close(r);
				}
			},
			findObject(e, r) {
				var t = xe.analyzePath(e, r);
				return t.exists ? t.object : null;
			},
			analyzePath(e, r) {
				try {
					e = (n = xe.lookupPath(e, { follow: !r })).path;
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
					var n = xe.lookupPath(e, { parent: !0 });
					t.parentExists = !0, t.parentPath = n.path, t.parentObject = n.node, t.name = we.basename(e), n = xe.lookupPath(e, { follow: !r }), t.exists = !0, t.path = n.path, t.object = n.node, t.name = n.node.name, t.isRoot = "/" === n.path;
				} catch (o) {
					t.error = o.errno;
				}
				return t;
			},
			createPath(e, r, t, n) {
				e = "string" == typeof e ? e : xe.getPath(e);
				for (var o = r.split("/").reverse(); o.length;) {
					var a = o.pop();
					if (a) {
						var s = we.join2(e, a);
						try {
							xe.mkdir(s);
						} catch (i) {}
						e = s;
					}
				}
				return s;
			},
			createFile(e, r, t, n, o) {
				var a = we.join2("string" == typeof e ? e : xe.getPath(e), r), s = Ae(n, o);
				return xe.create(a, s);
			},
			createDataFile(e, r, t, n, o, a) {
				var s = r;
				e && (e = "string" == typeof e ? e : xe.getPath(e), s = r ? we.join2(e, r) : e);
				var i = Ae(n, o), l = xe.create(s, i);
				if (t) {
					if ("string" == typeof t) {
						for (var c = new Array(t.length), d = 0, u = t.length; d < u; ++d) c[d] = t.charCodeAt(d);
						t = c;
					}
					xe.chmod(l, 146 | i);
					var f = xe.open(l, 577);
					xe.write(f, t, 0, t.length, 0, a), xe.close(f), xe.chmod(l, i);
				}
			},
			createDevice(e, r, t, n) {
				var o = we.join2("string" == typeof e ? e : xe.getPath(e), r), a = Ae(!!t, !!n);
				xe.createDevice.major ??= 64;
				var s = xe.makedev(xe.createDevice.major++, 0);
				return xe.registerDevice(s, {
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
								throw new xe.ErrnoError(29);
							}
							if (void 0 === l && 0 === s) throw new xe.ErrnoError(6);
							if (null == l) break;
							s++, r[n + i] = l;
						}
						return s && (e.node.atime = Date.now()), s;
					},
					write(e, r, t, o, a) {
						for (var s = 0; s < o; s++) try {
							n(r[t + s]);
						} catch (i) {
							throw new xe.ErrnoError(29);
						}
						return o && (e.node.mtime = e.node.ctime = Date.now()), s;
					}
				}), xe.mkdev(o, a, s);
			},
			forceLoadFile(e) {
				if (e.isDevice || e.isFolder || e.link || e.contents) return !0;
				if ("undefined" != typeof XMLHttpRequest) throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
				try {
					e.contents = h(e.url), e.usedBytes = e.contents.length;
				} catch (r) {
					throw new xe.ErrnoError(29);
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
								return void 0 !== o.response ? new Uint8Array(o.response || []) : Ee(o.responseText || "", !0);
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
				var l = xe.createFile(e, r, s, n, o);
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
					c[e] = (...e) => (xe.forceLoadFile(l), r(...e));
				}), c.read = (e, r, t, n, o) => (xe.forceLoadFile(l), d(e, r, t, n, o)), c.mmap = (e, r, t, n, o) => {
					xe.forceLoadFile(l);
					var a = be();
					if (!a) throw new xe.ErrnoError(48);
					return d(e, F, a, r, t), {
						ptr: a,
						allocated: !0
					};
				}, l.stream_ops = c, l;
			}
		}, Me = {
			DEFAULT_POLLMASK: 5,
			calculateAt(e, r, t) {
				if (we.isAbs(r)) return r;
				var n;
				if (n = -100 === e ? xe.cwd() : Me.getStreamFromFD(e).path, 0 == r.length) {
					if (!t) throw new xe.ErrnoError(44);
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
				if (!xe.isFile(r.node.mode)) throw new xe.ErrnoError(43);
				if (2 & n) return 0;
				var a = D.slice(e, e + t);
				xe.msync(r, a, o, t, n);
			},
			getStreamFromFD: (e) => xe.getStreamChecked(e),
			varargs: void 0,
			getStr: (e) => ue(e)
		}, Re = () => {
			var e = A[+Me.varargs >> 2];
			return Me.varargs += 4, e;
		}, je = Re, Ne = () => Date.now(), ze = (e) => e < -9007199254740992 || e > 9007199254740992 ? NaN : Number(e), Ce = (e) => {
			var r = (e - b.buffer.byteLength + 65535) / 65536 | 0;
			try {
				return b.grow(r), B(), 1;
			} catch (t) {}
		}, Le = {}, Te = () => {
			if (!Te.strings) {
				var e = {
					USER: "web_user",
					LOGNAME: "web_user",
					PATH: "/",
					PWD: "/",
					HOME: "/home/web_user",
					LANG: ("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
					_: w || "./this.program"
				};
				for (var r in Le) void 0 === Le[r] ? delete e[r] : e[r] = Le[r];
				var t = [];
				for (var r in e) t.push(`${r}=${e[r]}`);
				Te.strings = t;
			}
			return Te.strings;
		}, Be = (e) => {
			S = e, fe || (o.onExit?.(e), z = !0), v(e, new ee(e));
		}, Ie = (e, r) => {
			S = e, Be(e);
		}, Oe = Ie, Ue = (e) => o["_" + e], He = (e, r, t, n, o) => {
			var a = {
				string: (e) => {
					var r = 0;
					return null != e && 0 !== e && (r = le(e)), r;
				},
				array: (e) => {
					var r, t, n = ie(e.length);
					return r = e, t = n, F.set(r, t), n;
				}
			}, s = Ue(e), i = [], l = 0;
			if (n) for (var c = 0; c < n.length; c++) {
				var d = a[t[c]];
				d ? (0 === l && (l = te()), i[c] = d(n[c])) : i[c] = n[c];
			}
			var u = s(...i);
			return u = function(e) {
				return 0 !== l && ne(l), function(e) {
					return "string" === r ? ue(e) : "boolean" === r ? Boolean(e) : e;
				}(e);
			}(u);
		}, $e = xe.readFile, We = (e) => {
			var r = oe(e) + 1, t = Ze(r);
			return t && se(e, t, r), t;
		}, qe = xe.createPath, Ge = xe.createLazyFile, Xe = xe.createDevice;
		xe.createPreloadedFile = Pe, xe.staticInit(), o.FS_createDataFile = xe.createDataFile, o.FS_readFile = xe.readFile, o.FS_unlink = xe.unlink, o.FS_createPath = xe.createPath, o.FS_createDataFile = xe.createDataFile, o.FS_createPreloadedFile = xe.createPreloadedFile, o.FS_unlink = xe.unlink, o.FS_createLazyFile = xe.createLazyFile, o.FS_createDevice = xe.createDevice, Se.doesNotExistError = new xe.ErrnoError(44), Se.doesNotExistError.stack = "<generic error, no stack>";
		var Ke = {
			c: (e, r, t, n) => Y(`Assertion failed: ${ue(e)}, at: ` + [
				r ? ue(r) : "unknown filename",
				t,
				n ? ue(n) : "unknown function"
			]),
			b: (e, r, t) => {
				throw new pe(e).init(r, t), e;
			},
			a: (e) => {
				var r = Qe(), t = er();
				Y(`stack overflow (Attempt to set SP to ${he(e)}, with stack limits [${he(t)} - ${he(r)}]). If you require more stack space build with -sSTACK_SIZE=<bytes>`);
			},
			l: function(e, r, t, n) {
				try {
					if (r = Me.getStr(r), r = Me.calculateAt(e, r), -8 & t) return -28;
					var o = xe.lookupPath(r, { follow: !0 }).node;
					if (!o) return -44;
					var a = "";
					return 4 & t && (a += "r"), 2 & t && (a += "w"), 1 & t && (a += "x"), a && xe.nodePermissions(o, a) ? -2 : 0;
				} catch (s) {
					if (void 0 === xe || "ErrnoError" !== s.name) throw s;
					return -s.errno;
				}
			},
			e: function(e, r, t) {
				Me.varargs = t;
				try {
					var n = Me.getStreamFromFD(e);
					switch (r) {
						case 0:
							if ((o = Re()) < 0) return -28;
							for (; xe.streams[o];) o++;
							return xe.dupStream(n, o).fd;
						case 1:
						case 2:
						case 13:
						case 14: return 0;
						case 3: return n.flags;
						case 4:
							var o = Re();
							return n.flags |= o, 0;
						case 12: return o = je(), P[o + 0 >> 1] = 2, 0;
					}
					return -28;
				} catch (a) {
					if (void 0 === xe || "ErrnoError" !== a.name) throw a;
					return -a.errno;
				}
			},
			A: function(e, r) {
				try {
					if (0 === r) return -28;
					var t = xe.cwd(), n = oe(t) + 1;
					return r < n ? -68 : (se(t, e, r), n);
				} catch (o) {
					if (void 0 === xe || "ErrnoError" !== o.name) throw o;
					return -o.errno;
				}
			},
			t: function(e, r, t) {
				try {
					var n = Me.getStreamFromFD(e);
					n.getdents ||= xe.readdir(n.path);
					for (var o = 280, a = 0, s = xe.llseek(n, 0, 1), i = Math.floor(s / o), l = Math.min(n.getdents.length, i + Math.floor(t / o)), c = i; c < l; c++) {
						var d, u, f = n.getdents[c];
						if ("." === f) d = n.node.id, u = 4;
						else if (".." === f) d = xe.lookupPath(n.path, { parent: !0 }).node.id, u = 4;
						else {
							var h;
							try {
								h = xe.lookupNode(n.node, f);
							} catch (m) {
								if (28 === m?.errno) continue;
								throw m;
							}
							d = h.id, u = xe.isChrdev(h.mode) ? 2 : xe.isDir(h.mode) ? 4 : xe.isLink(h.mode) ? 10 : 8;
						}
						R[r + a >> 3] = BigInt(d), R[r + a + 8 >> 3] = BigInt((c + 1) * o), P[r + a + 16 >> 1] = 280, F[r + a + 18] = u, se(f, r + a + 19, 256), a += o;
					}
					return xe.llseek(n, c * o, 0), a;
				} catch (m) {
					if (void 0 === xe || "ErrnoError" !== m.name) throw m;
					return -m.errno;
				}
			},
			i: function(e, r, t) {
				Me.varargs = t;
				try {
					var n = Me.getStreamFromFD(e);
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
								var o = n.tty.ops.ioctl_tcgets(n), a = je();
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
								a = je();
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
						case 21519: return n.tty ? (a = je(), A[a >> 2] = 0, 0) : -59;
						case 21520: return n.tty ? -28 : -59;
						case 21531: return a = je(), xe.ioctl(n, r, a);
						case 21523:
							if (!n.tty) return -59;
							if (n.tty.ops.ioctl_tiocgwinsz) {
								var f = n.tty.ops.ioctl_tiocgwinsz(n.tty);
								a = je(), P[a >> 1] = f[0], P[a + 2 >> 1] = f[1];
							}
							return 0;
						default: return -28;
					}
				} catch (h) {
					if (void 0 === xe || "ErrnoError" !== h.name) throw h;
					return -h.errno;
				}
			},
			v: function(e, r, t) {
				try {
					return r = Me.getStr(r), r = Me.calculateAt(e, r), xe.mkdir(r, t, 0), 0;
				} catch (n) {
					if (void 0 === xe || "ErrnoError" !== n.name) throw n;
					return -n.errno;
				}
			},
			f: function(e, r, t, n) {
				Me.varargs = n;
				try {
					r = Me.getStr(r), r = Me.calculateAt(e, r);
					var o = n ? Re() : 0;
					return xe.open(r, t, o).fd;
				} catch (a) {
					if (void 0 === xe || "ErrnoError" !== a.name) throw a;
					return -a.errno;
				}
			},
			s: function(e, r, t, n) {
				try {
					if (r = Me.getStr(r), r = Me.calculateAt(e, r), n <= 0) return -28;
					var o = xe.readlink(r), a = Math.min(n, oe(o)), s = F[t + a];
					return se(o, t, n + 1), F[t + a] = s, a;
				} catch (i) {
					if (void 0 === xe || "ErrnoError" !== i.name) throw i;
					return -i.errno;
				}
			},
			q: function(e) {
				try {
					return e = Me.getStr(e), xe.rmdir(e), 0;
				} catch (r) {
					if (void 0 === xe || "ErrnoError" !== r.name) throw r;
					return -r.errno;
				}
			},
			w: function(e, r) {
				try {
					return e = Me.getStr(e), Me.writeStat(r, xe.stat(e));
				} catch (t) {
					if (void 0 === xe || "ErrnoError" !== t.name) throw t;
					return -t.errno;
				}
			},
			r: function(e, r, t) {
				try {
					return r = Me.getStr(r), r = Me.calculateAt(e, r), 0 === t ? xe.unlink(r) : 512 === t ? xe.rmdir(r) : Y("Invalid flags passed to unlinkat"), 0;
				} catch (n) {
					if (void 0 === xe || "ErrnoError" !== n.name) throw n;
					return -n.errno;
				}
			},
			m: () => Y(""),
			o: (e) => {
				if (d) {
					if (!e) return 1;
					var r = ue(e);
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
				l < i ? (se(u, t, 17), se(f, n, 17)) : (se(u, n, 17), se(f, t, 17));
			},
			k: function(e, r, t) {
				if (r = ze(r), !((n = e) >= 0 && n <= 3)) return 28;
				var n, o = 0 === e ? Ne() : performance.now();
				var a = Math.round(1e3 * o * 1e3);
				return R[t >> 3] = BigInt(a), 0;
			},
			j: Ne,
			p: () => 2147483648,
			n: (e) => {
				var r = D.length, t = 2147483648;
				if ((e >>>= 0) > t) return !1;
				for (var n = 1; n <= 4; n *= 2) {
					var o = r * (1 + .2 / n);
					if (o = Math.min(o, e + 100663296), Ce(Math.min(t, _e(Math.max(e, o), 65536)))) return !0;
				}
				return !1;
			},
			y: (e, r) => {
				var t = 0;
				return Te().forEach((n, o) => {
					var a = r + t;
					x[e + 4 * o >> 2] = a, ((e, r) => {
						for (var t = 0; t < e.length; ++t) F[r++] = e.charCodeAt(t);
						F[r] = 0;
					})(n, a), t += n.length + 1;
				}), 0;
			},
			z: (e, r) => {
				var t = Te();
				x[e >> 2] = t.length;
				var n = 0;
				return t.forEach((e) => n += e.length + 1), x[r >> 2] = n, 0;
			},
			g: Oe,
			d: function(e) {
				try {
					var r = Me.getStreamFromFD(e);
					return xe.close(r), 0;
				} catch (t) {
					if (void 0 === xe || "ErrnoError" !== t.name) throw t;
					return t.errno;
				}
			},
			B: function(e, r, t, n) {
				try {
					var o = ((e, r, t, n) => {
						for (var o = 0, a = 0; a < t; a++) {
							var s = x[r >> 2], i = x[r + 4 >> 2];
							r += 8;
							var l = xe.read(e, F, s, i, n);
							if (l < 0) return -1;
							if (o += l, l < i) break;
							void 0 !== n && (n += l);
						}
						return o;
					})(Me.getStreamFromFD(e), r, t);
					return x[n >> 2] = o, 0;
				} catch (a) {
					if (void 0 === xe || "ErrnoError" !== a.name) throw a;
					return a.errno;
				}
			},
			x: function(e, r, t, n) {
				r = ze(r);
				try {
					if (isNaN(r)) return 61;
					var o = Me.getStreamFromFD(e);
					return xe.llseek(o, r, t), R[n >> 3] = BigInt(o.position), o.getdents && 0 === r && 0 === t && (o.getdents = null), 0;
				} catch (a) {
					if (void 0 === xe || "ErrnoError" !== a.name) throw a;
					return a.errno;
				}
			},
			h: function(e, r, t, n) {
				try {
					var o = ((e, r, t, n) => {
						for (var o = 0, a = 0; a < t; a++) {
							var s = x[r >> 2], i = x[r + 4 >> 2];
							r += 8;
							var l = xe.write(e, F, s, i, n);
							if (l < 0) return -1;
							if (o += l, l < i) break;
							void 0 !== n && (n += l);
						}
						return o;
					})(Me.getStreamFromFD(e), r, t);
					return x[n >> 2] = o, 0;
				} catch (a) {
					if (void 0 === xe || "ErrnoError" !== a.name) throw a;
					return a.errno;
				}
			}
		}, Ve = await async function() {
			function e(e, r) {
				var t;
				return Ve = e.exports, b = Ve.C, B(), t = Ve.D, O.unshift(t), V(), Ve;
			}
			K();
			var r = { a: Ke };
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
		Ve.D;
		var Ye = o._main = Ve.F, Ze = o._malloc = Ve.G, Je = (o._free = Ve.H, Ve.I), Qe = Ve.J, er = Ve.K, rr = Ve.L, tr = Ve.M, nr = Ve.N, or = (Ve.O, o.___set_stack_limits = Ve.P);
		function ar() {
			var e;
			Je(), 0 == (e = er()) && (e += 4), x[e >> 2] = 34821223, x[e + 4 >> 2] = 2310721022, x[0] = 1668509029;
		}
		if (o.addRunDependency = K, o.removeRunDependency = V, o.callMain = function(e) {
			var r = Ye;
			e.unshift(w);
			var t = e.length, n = ie(4 * (t + 1)), o = n;
			e.forEach((e) => {
				x[o >> 2] = le(e), o += 4;
			}), x[o >> 2] = 0;
			try {
				var a = r(t, n);
				return Ie(a), a;
			} catch (s) {
				return ((e) => {
					if (e instanceof ee || "unwind" == e) return S;
					T(), e instanceof WebAssembly.RuntimeError && nr() <= 0 && _("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 16777216)"), v(1, e);
				})(s);
			}
		}, o.ccall = He, o.cwrap = (e, r, t, n) => {
			var o = !t || t.every((e) => "number" === e || "boolean" === e);
			return "string" !== r && o && !n ? Ue(e) : (...n) => He(e, r, t, n);
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
		}, o.stringToUTF8 = se, o.FS_createPreloadedFile = Pe, o.FS_unlink = (e) => xe.unlink(e), o.FS_createPath = qe, o.FS_createDevice = Xe, o.FS_readFile = $e, o.FS = xe, o.FS_createDataFile = Fe, o.FS_createLazyFile = Ge, o.allocateUTF8 = We, o.preInit) for ("function" == typeof o.preInit && (o.preInit = [o.preInit]); o.preInit.length > 0;) o.preInit.pop()();
		return function e(r = p) {
			function n() {
				o.calledRun = !0, z || (T(), me(), o.noFSInit || xe.initialized || xe.init(), xe.ignorePermissions = !1, ke.init(), re(O), T(), re(U), t(o), o.onRuntimeInitialized?.(), o.noInitialRun, function() {
					if (T(), o.postRun) for ("function" == typeof o.postRun && (o.postRun = [o.postRun]); o.postRun.length;) W(o.postRun.shift());
					re(H);
				}());
			}
			G > 0 ? X = e : (ar(), function() {
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

//# sourceMappingURL=worker.jpeg-81GtmSti.js.map