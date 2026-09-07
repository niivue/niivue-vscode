(function() {
	var e, r = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, o = Object.getOwnPropertyNames, a = Object.getPrototypeOf, s = Object.prototype.hasOwnProperty, i = (e, r) => () => (r || (e((r = { exports: {} }).exports, r), e = null), r.exports), l = (e, i, l) => (l = null != e ? r(a(e)) : {}, ((e, r, a, i) => {
		if (r && "object" == typeof r || "function" == typeof r) for (var l, u = o(r), d = 0, c = u.length; d < c; d++) l = u[d], s.call(e, l) || l === a || t(e, l, {
			get: ((e) => r[e]).bind(null, l),
			enumerable: !(i = n(r, l)) || i.enumerable
		});
		return e;
	})(!i && e && e.__esModule && s.call(e, "default") ? l : t(l, "default", {
		value: e,
		enumerable: !0
	}), e)), u = i((e, r) => {
		r.exports = {};
	}), d = (e = self.location.href, async function(r = {}) {
		var t, n, o = Object.assign({}, r), a = new Promise((e, r) => {
			t = e, n = r;
		}), s = "object" == typeof window, i = "function" == typeof importScripts, d = "object" == typeof process && "object" == typeof process.versions && "string" == typeof process.versions.node;
		if (d) {
			const { createRequire: e } = await Promise.resolve().then(() => l(u()));
			var c = e(self.location.href);
		}
		var f, h, m, p = Object.assign({}, o), w = [], v = "./this.program", g = (e, r) => {
			throw r;
		}, y = "";
		if (d) {
			var E = c("fs"), _ = c("path");
			y = i ? _.dirname(y) + "/" : c("url").fileURLToPath(new URL("/niivue-vscode/pr-298/assets/index-DiwRhbxb.js", "" + self.location.href)), f = (e, r) => (e = ee(e) ? new URL(e) : _.normalize(e), E.readFileSync(e, r ? void 0 : "utf8")), m = (e) => {
				var r = f(e, !0);
				return r.buffer || (r = new Uint8Array(r)), r;
			}, h = (e, r, t, n = !0) => {
				e = ee(e) ? new URL(e) : _.normalize(e), E.readFile(e, n ? void 0 : "utf8", (e, o) => {
					e ? t(e) : r(n ? o.buffer : o);
				});
			}, !o.thisProgram && process.argv.length > 1 && (v = process.argv[1].replace(/\\/g, "/")), w = process.argv.slice(2), g = (e, r) => {
				throw process.exitCode = e, r;
			};
		} else (s || i) && (i ? y = self.location.href : "undefined" != typeof document && document.currentScript && (y = document.currentScript.src), e && (y = e), y = y.startsWith("blob:") ? "" : y.substr(0, y.replace(/[?#].*/, "").lastIndexOf("/") + 1), f = (e) => {
			var r = new XMLHttpRequest();
			return r.open("GET", e, !1), r.send(null), r.responseText;
		}, i && (m = (e) => {
			var r = new XMLHttpRequest();
			return r.open("GET", e, !1), r.responseType = "arraybuffer", r.send(null), new Uint8Array(r.response);
		}), h = (e, r, t) => {
			var n = new XMLHttpRequest();
			n.open("GET", e, !0), n.responseType = "arraybuffer", n.onload = () => {
				200 == n.status || 0 == n.status && n.response ? r(n.response) : t();
			}, n.onerror = t, n.send(null);
		});
		var k, b, S = o.print || console.log.bind(console), F = o.printErr || console.error.bind(console);
		Object.assign(o, p), p = null, o.arguments && (w = o.arguments), o.thisProgram && (v = o.thisProgram), o.quit && (g = o.quit), o.wrapException || (o.wrapException = (e) => e), o.wasmBinary && (k = o.wasmBinary);
		var D, M, P, A, x, R, j, z, T = !1;
		function L() {
			var e = b.buffer;
			o.HEAP8 = M = new Int8Array(e), o.HEAP16 = A = new Int16Array(e), o.HEAPU8 = P = new Uint8Array(e), o.HEAPU16 = new Uint16Array(e), o.HEAP32 = x = new Int32Array(e), o.HEAPU32 = R = new Uint32Array(e), o.HEAPF32 = j = new Float32Array(e), o.HEAPF64 = z = new Float64Array(e);
		}
		function O() {
			if (!T) {
				var e = er();
				0 == e && (e += 4);
				var r = R[e >> 2], t = R[e + 4 >> 2];
				34821223 == r && 2310721022 == t || X(`Stack overflow! Stack cookie has been overwritten at ${pe(e)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${pe(t)} ${pe(r)}`), 1668509029 != R[0] && X("Runtime error: The application has corrupted its heap memory area (address zero)!");
			}
		}
		var C = [], I = [], N = [], B = [];
		function U(e) {
			C.unshift(e);
		}
		function H(e) {
			B.unshift(e);
		}
		var $ = 0, W = null, q = null;
		function Y(e) {
			$++, o.monitorRunDependencies?.($);
		}
		function G(e) {
			if ($--, o.monitorRunDependencies?.($), 0 == $ && (null !== W && (clearInterval(W), W = null), q)) {
				var r = q;
				q = null, r();
			}
		}
		function X(e) {
			o.onAbort?.(e), F(e = "Aborted(" + e + ")"), T = !0, D = 1, e += ". Build with -sASSERTIONS for more info.";
			var r = new WebAssembly.RuntimeError(e);
			throw n(r), r;
		}
		var V, K, J, Q, Z = (e) => e.startsWith("data:application/octet-stream;base64,"), ee = (e) => e.startsWith("file://");
		function re(e) {
			if (e == V && k) return new Uint8Array(k);
			if (m) return m(e);
			throw "both async and sync fetching of the wasm failed";
		}
		function te(e, r, t) {
			return function(e) {
				if (!k && (s || i)) {
					if ("function" == typeof fetch && !ee(e)) return fetch(e, { credentials: "same-origin" }).then((r) => {
						if (!r.ok) throw `failed to load wasm binary file at '${e}'`;
						return r.arrayBuffer();
					}).catch(() => re(e));
					if (h) return new Promise((r, t) => {
						h(e, (e) => r(new Uint8Array(e)), t);
					});
				}
				return Promise.resolve().then(() => re(e));
			}(e).then((e) => WebAssembly.instantiate(e, r)).then(t, (e) => {
				F(`failed to asynchronously prepare wasm: ${e}`), X(e);
			});
		}
		function ne(e) {
			this.name = "ExitStatus", this.message = `Program terminated with exit(${e})`, this.status = e;
		}
		o.locateFile ? Z(V = "dcm2niix.jpeg.wasm") || (K = V, V = o.locateFile ? o.locateFile(K, y) : y + K) : V = new URL("/niivue-vscode/pr-298/assets/dcm2niix.jpeg-CQkhdqTF.wasm", "" + self.location.href).href;
		var oe = (e) => {
			for (; e.length > 0;) e.shift()(o);
		}, ae = () => nr(), se = (e) => {
			for (var r = 0, t = 0; t < e.length; ++t) {
				var n = e.charCodeAt(t);
				n <= 127 ? r++ : n <= 2047 ? r += 2 : n >= 55296 && n <= 57343 ? (r += 4, ++t) : r += 3;
			}
			return r;
		}, ie = (e, r, t, n) => {
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
		}, le = (e, r, t) => ie(e, P, r, t), ue = (e) => tr(e), de = (e) => {
			var r = se(e) + 1, t = ue(r);
			return le(e, t, r), t;
		}, ce = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0, fe = (e, r, t) => {
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
							var u = s - 65536;
							a += String.fromCharCode(55296 | u >> 10, 56320 | 1023 & u);
						}
					} else a += String.fromCharCode((31 & s) << 6 | i);
				} else a += String.fromCharCode(s);
			}
			return a;
		}, he = (e, r) => e ? fe(P, e, r) : "", me = o.noExitRuntime || !0, pe = (e) => "0x" + (e >>>= 0).toString(16).padStart(8, "0"), we = () => {
			var e = Ze(), r = er();
			ar(e, r);
		};
		class ve {
			constructor(e) {
				this.excPtr = e, this.ptr = e - 24;
			}
			set_type(e) {
				R[this.ptr + 4 >> 2] = e;
			}
			get_type() {
				return R[this.ptr + 4 >> 2];
			}
			set_destructor(e) {
				R[this.ptr + 8 >> 2] = e;
			}
			get_destructor() {
				return R[this.ptr + 8 >> 2];
			}
			set_caught(e) {
				e = e ? 1 : 0, M[this.ptr + 12] = e;
			}
			get_caught() {
				return 0 != M[this.ptr + 12];
			}
			set_rethrown(e) {
				e = e ? 1 : 0, M[this.ptr + 13] = e;
			}
			get_rethrown() {
				return 0 != M[this.ptr + 13];
			}
			init(e, r) {
				this.set_adjusted_ptr(0), this.set_type(e), this.set_destructor(r);
			}
			set_adjusted_ptr(e) {
				R[this.ptr + 16 >> 2] = e;
			}
			get_adjusted_ptr() {
				return R[this.ptr + 16 >> 2];
			}
			get_exception_ptr() {
				if (or(this.get_type())) return R[this.excPtr >> 2];
				var e = this.get_adjusted_ptr();
				return 0 !== e ? e : this.excPtr;
			}
		}
		var ge = 0, ye = {
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
				var r = ye.isAbs(e), t = "/" === e.substr(-1);
				return (e = ye.normalizeArray(e.split("/").filter((e) => !!e), !r).join("/")) || r || (e = "."), e && t && (e += "/"), (r ? "/" : "") + e;
			},
			dirname: (e) => {
				var r = ye.splitPath(e), t = r[0], n = r[1];
				return t || n ? (n && (n = n.substr(0, n.length - 1)), t + n) : ".";
			},
			basename: (e) => {
				if ("/" === e) return "/";
				var r = (e = (e = ye.normalize(e)).replace(/\/$/, "")).lastIndexOf("/");
				return -1 === r ? e : e.substr(r + 1);
			},
			join: (...e) => ye.normalize(e.join("/")),
			join2: (e, r) => ye.normalize(e + "/" + r)
		}, Ee = (e) => (Ee = (() => {
			if ("object" == typeof crypto && "function" == typeof crypto.getRandomValues) return (e) => crypto.getRandomValues(e);
			if (d) try {
				var e = c("crypto");
				if (e.randomFillSync) return (r) => e.randomFillSync(r);
				var r = e.randomBytes;
				return (e) => (e.set(r(e.byteLength)), e);
			} catch (t) {}
			X("initRandomDevice");
		})())(e), _e = {
			resolve: (...e) => {
				for (var r = "", t = !1, n = e.length - 1; n >= -1 && !t; n--) {
					var o = n >= 0 ? e[n] : Ae.cwd();
					if ("string" != typeof o) throw new TypeError("Arguments to path.resolve must be strings");
					if (!o) return "";
					r = o + "/" + r, t = ye.isAbs(o);
				}
				return (t ? "/" : "") + (r = ye.normalizeArray(r.split("/").filter((e) => !!e), !t).join("/")) || ".";
			},
			relative: (e, r) => {
				function t(e) {
					for (var r = 0; r < e.length && "" === e[r]; r++);
					for (var t = e.length - 1; t >= 0 && "" === e[t]; t--);
					return r > t ? [] : e.slice(r, t - r + 1);
				}
				e = _e.resolve(e).substr(1), r = _e.resolve(r).substr(1);
				for (var n = t(e.split("/")), o = t(r.split("/")), a = Math.min(n.length, o.length), s = a, i = 0; i < a; i++) if (n[i] !== o[i]) {
					s = i;
					break;
				}
				var l = [];
				for (i = s; i < n.length; i++) l.push("..");
				return (l = l.concat(o.slice(s))).join("/");
			}
		}, ke = [];
		function be(e, r, t) {
			var n = t > 0 ? t : se(e) + 1, o = new Array(n), a = ie(e, o, 0, o.length);
			return r && (o.length = a), o;
		}
		var Se = {
			ttys: [],
			init() {},
			shutdown() {},
			register(e, r) {
				Se.ttys[e] = {
					input: [],
					output: [],
					ops: r
				}, Ae.registerDevice(e, Se.stream_ops);
			},
			stream_ops: {
				open(e) {
					var r = Se.ttys[e.node.rdev];
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
					return a && (e.node.timestamp = Date.now()), a;
				},
				write(e, r, t, n, o) {
					if (!e.tty || !e.tty.ops.put_char) throw new Ae.ErrnoError(60);
					try {
						for (var a = 0; a < n; a++) e.tty.ops.put_char(e.tty, r[t + a]);
					} catch (s) {
						throw new Ae.ErrnoError(29);
					}
					return n && (e.node.timestamp = Date.now()), a;
				}
			},
			default_tty_ops: {
				get_char: (e) => (() => {
					if (!ke.length) {
						var e = null;
						if (d) {
							var r = Buffer.alloc(256), t = 0, n = process.stdin.fd;
							try {
								t = E.readSync(n, r);
							} catch (o) {
								if (!o.toString().includes("EOF")) throw o;
								t = 0;
							}
							e = t > 0 ? r.slice(0, t).toString("utf-8") : null;
						} else "undefined" != typeof window && "function" == typeof window.prompt ? null !== (e = window.prompt("Input: ")) && (e += "\n") : "function" == typeof readline && null !== (e = readline()) && (e += "\n");
						if (!e) return null;
						ke = be(e, !0);
					}
					return ke.shift();
				})(),
				put_char(e, r) {
					null === r || 10 === r ? (S(fe(e.output, 0)), e.output = []) : 0 != r && e.output.push(r);
				},
				fsync(e) {
					e.output && e.output.length > 0 && (S(fe(e.output, 0)), e.output = []);
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
					null === r || 10 === r ? (F(fe(e.output, 0)), e.output = []) : 0 != r && e.output.push(r);
				},
				fsync(e) {
					e.output && e.output.length > 0 && (F(fe(e.output, 0)), e.output = []);
				}
			}
		}, Fe = (e) => {
			X();
		}, De = {
			ops_table: null,
			mount: (e) => De.createNode(null, "/", 16895, 0),
			createNode(e, r, t, n) {
				if (Ae.isBlkdev(t) || Ae.isFIFO(t)) throw new Ae.ErrnoError(63);
				De.ops_table ||= {
					dir: {
						node: {
							getattr: De.node_ops.getattr,
							setattr: De.node_ops.setattr,
							lookup: De.node_ops.lookup,
							mknod: De.node_ops.mknod,
							rename: De.node_ops.rename,
							unlink: De.node_ops.unlink,
							rmdir: De.node_ops.rmdir,
							readdir: De.node_ops.readdir,
							symlink: De.node_ops.symlink
						},
						stream: { llseek: De.stream_ops.llseek }
					},
					file: {
						node: {
							getattr: De.node_ops.getattr,
							setattr: De.node_ops.setattr
						},
						stream: {
							llseek: De.stream_ops.llseek,
							read: De.stream_ops.read,
							write: De.stream_ops.write,
							allocate: De.stream_ops.allocate,
							mmap: De.stream_ops.mmap,
							msync: De.stream_ops.msync
						}
					},
					link: {
						node: {
							getattr: De.node_ops.getattr,
							setattr: De.node_ops.setattr,
							readlink: De.node_ops.readlink
						},
						stream: {}
					},
					chrdev: {
						node: {
							getattr: De.node_ops.getattr,
							setattr: De.node_ops.setattr
						},
						stream: Ae.chrdev_stream_ops
					}
				};
				var o = Ae.createNode(e, r, t, n);
				return Ae.isDir(o.mode) ? (o.node_ops = De.ops_table.dir.node, o.stream_ops = De.ops_table.dir.stream, o.contents = {}) : Ae.isFile(o.mode) ? (o.node_ops = De.ops_table.file.node, o.stream_ops = De.ops_table.file.stream, o.usedBytes = 0, o.contents = null) : Ae.isLink(o.mode) ? (o.node_ops = De.ops_table.link.node, o.stream_ops = De.ops_table.link.stream) : Ae.isChrdev(o.mode) && (o.node_ops = De.ops_table.chrdev.node, o.stream_ops = De.ops_table.chrdev.stream), o.timestamp = Date.now(), e && (e.contents[r] = o, e.timestamp = o.timestamp), o;
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
					return r.dev = Ae.isChrdev(e.mode) ? e.id : 1, r.ino = e.id, r.mode = e.mode, r.nlink = 1, r.uid = 0, r.gid = 0, r.rdev = e.rdev, Ae.isDir(e.mode) ? r.size = 4096 : Ae.isFile(e.mode) ? r.size = e.usedBytes : Ae.isLink(e.mode) ? r.size = e.link.length : r.size = 0, r.atime = new Date(e.timestamp), r.mtime = new Date(e.timestamp), r.ctime = new Date(e.timestamp), r.blksize = 4096, r.blocks = Math.ceil(r.size / r.blksize), r;
				},
				setattr(e, r) {
					void 0 !== r.mode && (e.mode = r.mode), void 0 !== r.timestamp && (e.timestamp = r.timestamp), void 0 !== r.size && De.resizeFileStorage(e, r.size);
				},
				lookup(e, r) {
					throw Ae.genericErrors[44];
				},
				mknod: (e, r, t, n) => De.createNode(e, r, t, n),
				rename(e, r, t) {
					if (Ae.isDir(e.mode)) {
						var n;
						try {
							n = Ae.lookupNode(r, t);
						} catch (a) {}
						if (n) for (var o in n.contents) throw new Ae.ErrnoError(55);
					}
					delete e.parent.contents[e.name], e.parent.timestamp = Date.now(), e.name = t, r.contents[t] = e, r.timestamp = e.parent.timestamp, e.parent = r;
				},
				unlink(e, r) {
					delete e.contents[r], e.timestamp = Date.now();
				},
				rmdir(e, r) {
					for (var t in Ae.lookupNode(e, r).contents) throw new Ae.ErrnoError(55);
					delete e.contents[r], e.timestamp = Date.now();
				},
				readdir(e) {
					var r = [".", ".."];
					for (var t of Object.keys(e.contents)) r.push(t);
					return r;
				},
				symlink(e, r, t) {
					var n = De.createNode(e, r, 41471, 0);
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
					if (r.buffer === M.buffer && (a = !1), !n) return 0;
					var s = e.node;
					if (s.timestamp = Date.now(), r.subarray && (!s.contents || s.contents.subarray)) {
						if (a) return s.contents = r.subarray(t, t + n), s.usedBytes = n, n;
						if (0 === s.usedBytes && 0 === o) return s.contents = r.slice(t, t + n), s.usedBytes = n, n;
						if (o + n <= s.usedBytes) return s.contents.set(r.subarray(t, t + n), o), n;
					}
					if (De.expandFileStorage(s, o + n), s.contents.subarray && r.subarray) s.contents.set(r.subarray(t, t + n), o);
					else for (var i = 0; i < n; i++) s.contents[o + i] = r[t + i];
					return s.usedBytes = Math.max(s.usedBytes, o + n), n;
				},
				llseek(e, r, t) {
					var n = r;
					if (1 === t ? n += e.position : 2 === t && Ae.isFile(e.node.mode) && (n += e.node.usedBytes), n < 0) throw new Ae.ErrnoError(28);
					return n;
				},
				allocate(e, r, t) {
					De.expandFileStorage(e.node, r + t), e.node.usedBytes = Math.max(e.node.usedBytes, r + t);
				},
				mmap(e, r, t, n, o) {
					if (!Ae.isFile(e.node.mode)) throw new Ae.ErrnoError(43);
					var a, s, i = e.node.contents;
					if (2 & o || i.buffer !== M.buffer) {
						if ((t > 0 || t + r < i.length) && (i = i.subarray ? i.subarray(t, t + r) : Array.prototype.slice.call(i, t, t + r)), s = !0, !(a = Fe())) throw new Ae.ErrnoError(48);
						M.set(i, a);
					} else s = !1, a = i.byteOffset;
					return {
						ptr: a,
						allocated: s
					};
				},
				msync: (e, r, t, n, o) => (De.stream_ops.write(e, r, 0, n, t, !1), 0)
			}
		}, Me = o.preloadPlugins || [], Pe = (e, r) => {
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
				constructor(e) {
					this.name = "ErrnoError", this.errno = e;
				}
			},
			genericErrors: {},
			filesystems: null,
			syncFSRequests: 0,
			FSStream: class {
				constructor() {
					this.shared = {};
				}
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
				constructor(e, r, t, n) {
					e || (e = this), this.parent = e, this.mount = e.mount, this.mounted = null, this.id = Ae.nextInode++, this.name = r, this.mode = t, this.node_ops = {}, this.stream_ops = {}, this.rdev = n, this.readMode = 365, this.writeMode = 146;
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
				if (!(e = _e.resolve(e))) return {
					path: "",
					node: null
				};
				if ((r = Object.assign({
					follow_mount: !0,
					recurse_count: 0
				}, r)).recurse_count > 8) throw new Ae.ErrnoError(32);
				for (var t = e.split("/").filter((e) => !!e), n = Ae.root, o = "/", a = 0; a < t.length; a++) {
					var s = a === t.length - 1;
					if (s && r.parent) break;
					if (n = Ae.lookupNode(n, t[a]), o = ye.join2(o, t[a]), Ae.isMountpoint(n) && (!s || s && r.follow_mount) && (n = n.mounted.root), !s || r.follow) for (var i = 0; Ae.isLink(n.mode);) {
						var l = Ae.readlink(o);
						if (o = _e.resolve(ye.dirname(o), l), n = Ae.lookupPath(o, { recurse_count: r.recurse_count + 1 }).node, i++ > 40) throw new Ae.ErrnoError(32);
					}
				}
				return {
					path: o,
					node: n
				};
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
			mayOpen: (e, r) => e ? Ae.isLink(e.mode) ? 32 : Ae.isDir(e.mode) && ("r" !== Ae.flagsToPermissionString(r) || 512 & r) ? 31 : Ae.nodePermissions(e, Ae.flagsToPermissionString(r)) : 44,
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
				"function" == typeof e && (r = e, e = !1), Ae.syncFSRequests++, Ae.syncFSRequests > 1 && F(`warning: ${Ae.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
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
				var n = Ae.lookupPath(e, { parent: !0 }).node, o = ye.basename(e);
				if (!o || "." === o || ".." === o) throw new Ae.ErrnoError(28);
				var a = Ae.mayCreate(n, o);
				if (a) throw new Ae.ErrnoError(a);
				if (!n.node_ops.mknod) throw new Ae.ErrnoError(63);
				return n.node_ops.mknod(n, o, r, t);
			},
			create: (e, r) => (r = void 0 !== r ? r : 438, r &= 4095, r |= 32768, Ae.mknod(e, r, 0)),
			mkdir: (e, r) => (r = void 0 !== r ? r : 511, r &= 1023, r |= 16384, Ae.mknod(e, r, 0)),
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
				if (!_e.resolve(e)) throw new Ae.ErrnoError(44);
				var t = Ae.lookupPath(r, { parent: !0 }).node;
				if (!t) throw new Ae.ErrnoError(44);
				var n = ye.basename(r), o = Ae.mayCreate(t, n);
				if (o) throw new Ae.ErrnoError(o);
				if (!t.node_ops.symlink) throw new Ae.ErrnoError(63);
				return t.node_ops.symlink(t, n, e);
			},
			rename(e, r) {
				var t, n = ye.dirname(e), o = ye.dirname(r), a = ye.basename(e), s = ye.basename(r), i = Ae.lookupPath(e, { parent: !0 }), l = i.node;
				if (t = (i = Ae.lookupPath(r, { parent: !0 })).node, !l || !t) throw new Ae.ErrnoError(44);
				if (l.mount !== t.mount) throw new Ae.ErrnoError(75);
				var u, d = Ae.lookupNode(l, a), c = _e.relative(e, o);
				if ("." !== c.charAt(0)) throw new Ae.ErrnoError(28);
				if ("." !== (c = _e.relative(r, n)).charAt(0)) throw new Ae.ErrnoError(55);
				try {
					u = Ae.lookupNode(t, s);
				} catch (m) {}
				if (d !== u) {
					var f = Ae.isDir(d.mode), h = Ae.mayDelete(l, a, f);
					if (h) throw new Ae.ErrnoError(h);
					if (h = u ? Ae.mayDelete(t, s, f) : Ae.mayCreate(t, s)) throw new Ae.ErrnoError(h);
					if (!l.node_ops.rename) throw new Ae.ErrnoError(63);
					if (Ae.isMountpoint(d) || u && Ae.isMountpoint(u)) throw new Ae.ErrnoError(10);
					if (t !== l && (h = Ae.nodePermissions(l, "w"))) throw new Ae.ErrnoError(h);
					Ae.hashRemoveNode(d);
					try {
						l.node_ops.rename(d, t, s);
					} catch (m) {
						throw m;
					} finally {
						Ae.hashAddNode(d);
					}
				}
			},
			rmdir(e) {
				var r = Ae.lookupPath(e, { parent: !0 }).node, t = ye.basename(e), n = Ae.lookupNode(r, t), o = Ae.mayDelete(r, t, !0);
				if (o) throw new Ae.ErrnoError(o);
				if (!r.node_ops.rmdir) throw new Ae.ErrnoError(63);
				if (Ae.isMountpoint(n)) throw new Ae.ErrnoError(10);
				r.node_ops.rmdir(r, t), Ae.destroyNode(n);
			},
			readdir(e) {
				var r = Ae.lookupPath(e, { follow: !0 }).node;
				if (!r.node_ops.readdir) throw new Ae.ErrnoError(54);
				return r.node_ops.readdir(r);
			},
			unlink(e) {
				var r = Ae.lookupPath(e, { parent: !0 }).node;
				if (!r) throw new Ae.ErrnoError(44);
				var t = ye.basename(e), n = Ae.lookupNode(r, t), o = Ae.mayDelete(r, t, !1);
				if (o) throw new Ae.ErrnoError(o);
				if (!r.node_ops.unlink) throw new Ae.ErrnoError(63);
				if (Ae.isMountpoint(n)) throw new Ae.ErrnoError(10);
				r.node_ops.unlink(r, t), Ae.destroyNode(n);
			},
			readlink(e) {
				var r = Ae.lookupPath(e).node;
				if (!r) throw new Ae.ErrnoError(44);
				if (!r.node_ops.readlink) throw new Ae.ErrnoError(28);
				return _e.resolve(Ae.getPath(r.parent), r.node_ops.readlink(r));
			},
			stat(e, r) {
				var t = Ae.lookupPath(e, { follow: !r }).node;
				if (!t) throw new Ae.ErrnoError(44);
				if (!t.node_ops.getattr) throw new Ae.ErrnoError(63);
				return t.node_ops.getattr(t);
			},
			lstat: (e) => Ae.stat(e, !0),
			chmod(e, r, t) {
				var n;
				if (!(n = "string" == typeof e ? Ae.lookupPath(e, { follow: !t }).node : e).node_ops.setattr) throw new Ae.ErrnoError(63);
				n.node_ops.setattr(n, {
					mode: 4095 & r | -4096 & n.mode,
					timestamp: Date.now()
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
				var o;
				if (!(o = "string" == typeof e ? Ae.lookupPath(e, { follow: !n }).node : e).node_ops.setattr) throw new Ae.ErrnoError(63);
				o.node_ops.setattr(o, { timestamp: Date.now() });
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
				if (!(t = "string" == typeof e ? Ae.lookupPath(e, { follow: !0 }).node : e).node_ops.setattr) throw new Ae.ErrnoError(63);
				if (Ae.isDir(t.mode)) throw new Ae.ErrnoError(31);
				if (!Ae.isFile(t.mode)) throw new Ae.ErrnoError(28);
				var n = Ae.nodePermissions(t, "w");
				if (n) throw new Ae.ErrnoError(n);
				t.node_ops.setattr(t, {
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
				n.node_ops.setattr(n, { timestamp: Math.max(r, t) });
			},
			open(e, r, t) {
				if ("" === e) throw new Ae.ErrnoError(44);
				var n;
				if (t = void 0 === t ? 438 : t, t = 64 & (r = "string" == typeof r ? ((e) => {
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
					e = ye.normalize(e);
					try {
						n = Ae.lookupPath(e, { follow: !(131072 & r) }).node;
					} catch (l) {}
				}
				var a = !1;
				if (64 & r) if (n) {
					if (128 & r) throw new Ae.ErrnoError(20);
				} else n = Ae.mknod(e, t, 0), a = !0;
				if (!n) throw new Ae.ErrnoError(44);
				if (Ae.isChrdev(n.mode) && (r &= -513), 65536 & r && !Ae.isDir(n.mode)) throw new Ae.ErrnoError(54);
				if (!a) {
					var s = Ae.mayOpen(n, r);
					if (s) throw new Ae.ErrnoError(s);
				}
				512 & r && !a && Ae.truncate(n, 0), r &= -131713;
				var i = Ae.createStream({
					node: n,
					path: Ae.getPath(n),
					flags: r,
					seekable: !0,
					position: 0,
					stream_ops: n.stream_ops,
					ungotten: [],
					error: !1
				});
				return i.stream_ops.open && i.stream_ops.open(i), !o.logReadFiles || 1 & r || (Ae.readFiles || (Ae.readFiles = {}), e in Ae.readFiles || (Ae.readFiles[e] = 1)), i;
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
				return Ae.read(n, a, 0, o, 0), "utf8" === r.encoding ? t = fe(a, 0) : "binary" === r.encoding && (t = a), Ae.close(n), t;
			},
			writeFile(e, r, t = {}) {
				t.flags = t.flags || 577;
				var n = Ae.open(e, t.flags, t.mode);
				if ("string" == typeof r) {
					var o = new Uint8Array(se(r) + 1), a = ie(r, o, 0, o.length);
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
					write: (e, r, t, n, o) => n
				}), Ae.mkdev("/dev/null", Ae.makedev(1, 3)), Se.register(Ae.makedev(5, 0), Se.default_tty_ops), Se.register(Ae.makedev(6, 0), Se.default_tty1_ops), Ae.mkdev("/dev/tty", Ae.makedev(5, 0)), Ae.mkdev("/dev/tty1", Ae.makedev(6, 0));
				var e = /* @__PURE__ */ new Uint8Array(1024), r = 0, t = () => (0 === r && (r = Ee(e).byteLength), e[--r]);
				Ae.createDevice("/dev", "random", t), Ae.createDevice("/dev", "urandom", t), Ae.mkdir("/dev/shm"), Ae.mkdir("/dev/shm/tmp");
			},
			createSpecialDirectories() {
				Ae.mkdir("/proc");
				var e = Ae.mkdir("/proc/self");
				Ae.mkdir("/proc/self/fd"), Ae.mount({ mount() {
					var r = Ae.createNode(e, "fd", 16895, 73);
					return r.node_ops = { lookup(e, r) {
						var t = +r, n = Ae.getStreamChecked(t), o = {
							parent: null,
							mount: { mountpoint: "fake" },
							node_ops: { readlink: () => n.path }
						};
						return o.parent = o, o;
					} }, r;
				} }, {}, "/proc/self/fd");
			},
			createStandardStreams() {
				o.stdin ? Ae.createDevice("/dev", "stdin", o.stdin) : Ae.symlink("/dev/tty", "/dev/stdin"), o.stdout ? Ae.createDevice("/dev", "stdout", null, o.stdout) : Ae.symlink("/dev/tty", "/dev/stdout"), o.stderr ? Ae.createDevice("/dev", "stderr", null, o.stderr) : Ae.symlink("/dev/tty1", "/dev/stderr"), Ae.open("/dev/stdin", 0), Ae.open("/dev/stdout", 1), Ae.open("/dev/stderr", 1);
			},
			staticInit() {
				[44].forEach((e) => {
					Ae.genericErrors[e] = new Ae.ErrnoError(e), Ae.genericErrors[e].stack = "<generic error, no stack>";
				}), Ae.nameTable = new Array(4096), Ae.mount(De, {}, "/"), Ae.createDefaultDirectories(), Ae.createDefaultDevices(), Ae.createSpecialDirectories(), Ae.filesystems = { MEMFS: De };
			},
			init(e, r, t) {
				Ae.init.initialized = !0, o.stdin = e || o.stdin, o.stdout = r || o.stdout, o.stderr = t || o.stderr, Ae.createStandardStreams();
			},
			quit() {
				Ae.init.initialized = !1;
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
					t.parentExists = !0, t.parentPath = n.path, t.parentObject = n.node, t.name = ye.basename(e), n = Ae.lookupPath(e, { follow: !r }), t.exists = !0, t.path = n.path, t.object = n.node, t.name = n.node.name, t.isRoot = "/" === n.path;
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
						var s = ye.join2(e, a);
						try {
							Ae.mkdir(s);
						} catch (i) {}
						e = s;
					}
				}
				return s;
			},
			createFile(e, r, t, n, o) {
				var a = ye.join2("string" == typeof e ? e : Ae.getPath(e), r), s = Pe(n, o);
				return Ae.create(a, s);
			},
			createDataFile(e, r, t, n, o, a) {
				var s = r;
				e && (e = "string" == typeof e ? e : Ae.getPath(e), s = r ? ye.join2(e, r) : e);
				var i = Pe(n, o), l = Ae.create(s, i);
				if (t) {
					if ("string" == typeof t) {
						for (var u = new Array(t.length), d = 0, c = t.length; d < c; ++d) u[d] = t.charCodeAt(d);
						t = u;
					}
					Ae.chmod(l, 146 | i);
					var f = Ae.open(l, 577);
					Ae.write(f, t, 0, t.length, 0, a), Ae.close(f), Ae.chmod(l, i);
				}
			},
			createDevice(e, r, t, n) {
				var o = ye.join2("string" == typeof e ? e : Ae.getPath(e), r), a = Pe(!!t, !!n);
				Ae.createDevice.major || (Ae.createDevice.major = 64);
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
							} catch (u) {
								throw new Ae.ErrnoError(29);
							}
							if (void 0 === l && 0 === s) throw new Ae.ErrnoError(6);
							if (null == l) break;
							s++, r[n + i] = l;
						}
						return s && (e.node.timestamp = Date.now()), s;
					},
					write(e, r, t, o, a) {
						for (var s = 0; s < o; s++) try {
							n(r[t + s]);
						} catch (i) {
							throw new Ae.ErrnoError(29);
						}
						return o && (e.node.timestamp = Date.now()), s;
					}
				}), Ae.mkdev(o, a, s);
			},
			forceLoadFile(e) {
				if (e.isDevice || e.isFolder || e.link || e.contents) return !0;
				if ("undefined" != typeof XMLHttpRequest) throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
				if (!f) throw new Error("Cannot load without read() or XMLHttpRequest.");
				try {
					e.contents = be(f(e.url), !0), e.usedBytes = e.contents.length;
				} catch (r) {
					throw new Ae.ErrnoError(29);
				}
			},
			createLazyFile(e, r, t, n, o) {
				class a {
					constructor() {
						this.lengthKnown = !1, this.chunks = [];
					}
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
								return void 0 !== o.response ? new Uint8Array(o.response || []) : be(o.responseText || "", !0);
							})(r, o)), void 0 === i.chunks[e]) throw new Error("doXHR failed!");
							return i.chunks[e];
						}), !a && n || (s = n = 1, n = this.getter(0).length, s = n, S("LazyFiles on gzip forces download of the whole file when length is accessed")), this._length = n, this._chunkSize = s, this.lengthKnown = !0;
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
				var u = {};
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
					u[e] = (...e) => (Ae.forceLoadFile(l), r(...e));
				}), u.read = (e, r, t, n, o) => (Ae.forceLoadFile(l), d(e, r, t, n, o)), u.mmap = (e, r, t, n, o) => {
					Ae.forceLoadFile(l);
					var a = Fe();
					if (!a) throw new Ae.ErrnoError(48);
					return d(e, M, a, r, t), {
						ptr: a,
						allocated: !0
					};
				}, l.stream_ops = u, l;
			}
		}, xe = {
			DEFAULT_POLLMASK: 5,
			calculateAt(e, r, t) {
				if (ye.isAbs(r)) return r;
				var n;
				if (n = -100 === e ? Ae.cwd() : xe.getStreamFromFD(e).path, 0 == r.length) {
					if (!t) throw new Ae.ErrnoError(44);
					return n;
				}
				return ye.join2(n, r);
			},
			doStat(e, r, t) {
				var n = e(r);
				x[t >> 2] = n.dev, x[t + 4 >> 2] = n.mode, R[t + 8 >> 2] = n.nlink, x[t + 12 >> 2] = n.uid, x[t + 16 >> 2] = n.gid, x[t + 20 >> 2] = n.rdev, Q = [n.size >>> 0, (J = n.size, +Math.abs(J) >= 1 ? J > 0 ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)], x[t + 24 >> 2] = Q[0], x[t + 28 >> 2] = Q[1], x[t + 32 >> 2] = 4096, x[t + 36 >> 2] = n.blocks;
				var o = n.atime.getTime(), a = n.mtime.getTime(), s = n.ctime.getTime();
				return Q = [Math.floor(o / 1e3) >>> 0, (J = Math.floor(o / 1e3), +Math.abs(J) >= 1 ? J > 0 ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)], x[t + 40 >> 2] = Q[0], x[t + 44 >> 2] = Q[1], R[t + 48 >> 2] = o % 1e3 * 1e3, Q = [Math.floor(a / 1e3) >>> 0, (J = Math.floor(a / 1e3), +Math.abs(J) >= 1 ? J > 0 ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)], x[t + 56 >> 2] = Q[0], x[t + 60 >> 2] = Q[1], R[t + 64 >> 2] = a % 1e3 * 1e3, Q = [Math.floor(s / 1e3) >>> 0, (J = Math.floor(s / 1e3), +Math.abs(J) >= 1 ? J > 0 ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)], x[t + 72 >> 2] = Q[0], x[t + 76 >> 2] = Q[1], R[t + 80 >> 2] = s % 1e3 * 1e3, Q = [n.ino >>> 0, (J = n.ino, +Math.abs(J) >= 1 ? J > 0 ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)], x[t + 88 >> 2] = Q[0], x[t + 92 >> 2] = Q[1], 0;
			},
			doMsync(e, r, t, n, o) {
				if (!Ae.isFile(r.node.mode)) throw new Ae.ErrnoError(43);
				if (2 & n) return 0;
				var a = P.slice(e, e + t);
				Ae.msync(r, a, o, t, n);
			},
			getStreamFromFD: (e) => Ae.getStreamChecked(e),
			varargs: void 0,
			getStr: (e) => he(e)
		};
		function Re() {
			var e = x[+xe.varargs >> 2];
			return xe.varargs += 4, e;
		}
		var je = Re, ze = (e) => {
			var r = (e - b.buffer.byteLength + 65535) / 65536;
			try {
				return b.grow(r), L(), 1;
			} catch (t) {}
		}, Te = {}, Le = () => {
			if (!Le.strings) {
				var e = {
					USER: "web_user",
					LOGNAME: "web_user",
					PATH: "/",
					PWD: "/",
					HOME: "/home/web_user",
					LANG: ("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
					_: v || "./this.program"
				};
				for (var r in Te) void 0 === Te[r] ? delete e[r] : e[r] = Te[r];
				var t = [];
				for (var r in e) t.push(`${r}=${e[r]}`);
				Le.strings = t;
			}
			return Le.strings;
		}, Oe = (e) => {
			D = e, me || (o.onExit?.(e), T = !0), g(e, new ne(e));
		}, Ce = (e, r) => {
			D = e, Oe(e);
		}, Ie = Ce, Ne = (e) => e % 4 == 0 && (e % 100 != 0 || e % 400 == 0), Be = [
			31,
			29,
			31,
			30,
			31,
			30,
			31,
			31,
			30,
			31,
			30,
			31
		], Ue = [
			31,
			28,
			31,
			30,
			31,
			30,
			31,
			31,
			30,
			31,
			30,
			31
		], He = (e, r) => {
			M.set(e, r);
		}, $e = (e, r, t, n) => {
			var o = R[n + 40 >> 2], a = {
				tm_sec: x[n >> 2],
				tm_min: x[n + 4 >> 2],
				tm_hour: x[n + 8 >> 2],
				tm_mday: x[n + 12 >> 2],
				tm_mon: x[n + 16 >> 2],
				tm_year: x[n + 20 >> 2],
				tm_wday: x[n + 24 >> 2],
				tm_yday: x[n + 28 >> 2],
				tm_isdst: x[n + 32 >> 2],
				tm_gmtoff: x[n + 36 >> 2],
				tm_zone: o ? he(o) : ""
			}, s = he(t), i = {
				"%c": "%a %b %d %H:%M:%S %Y",
				"%D": "%m/%d/%y",
				"%F": "%Y-%m-%d",
				"%h": "%b",
				"%r": "%I:%M:%S %p",
				"%R": "%H:%M",
				"%T": "%H:%M:%S",
				"%x": "%m/%d/%y",
				"%X": "%H:%M:%S",
				"%Ec": "%c",
				"%EC": "%C",
				"%Ex": "%m/%d/%y",
				"%EX": "%H:%M:%S",
				"%Ey": "%y",
				"%EY": "%Y",
				"%Od": "%d",
				"%Oe": "%e",
				"%OH": "%H",
				"%OI": "%I",
				"%Om": "%m",
				"%OM": "%M",
				"%OS": "%S",
				"%Ou": "%u",
				"%OU": "%U",
				"%OV": "%V",
				"%Ow": "%w",
				"%OW": "%W",
				"%Oy": "%y"
			};
			for (var l in i) s = s.replace(new RegExp(l, "g"), i[l]);
			var u = [
				"Sunday",
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday"
			], d = [
				"January",
				"February",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December"
			];
			function c(e, r, t) {
				for (var n = "number" == typeof e ? e.toString() : e || ""; n.length < r;) n = t[0] + n;
				return n;
			}
			function f(e, r) {
				return c(e, r, "0");
			}
			function h(e, r) {
				function t(e) {
					return e < 0 ? -1 : e > 0 ? 1 : 0;
				}
				var n;
				return 0 === (n = t(e.getFullYear() - r.getFullYear())) && 0 === (n = t(e.getMonth() - r.getMonth())) && (n = t(e.getDate() - r.getDate())), n;
			}
			function m(e) {
				switch (e.getDay()) {
					case 0: return new Date(e.getFullYear() - 1, 11, 29);
					case 1: return e;
					case 2: return new Date(e.getFullYear(), 0, 3);
					case 3: return new Date(e.getFullYear(), 0, 2);
					case 4: return new Date(e.getFullYear(), 0, 1);
					case 5: return new Date(e.getFullYear() - 1, 11, 31);
					case 6: return new Date(e.getFullYear() - 1, 11, 30);
				}
			}
			function p(e) {
				var r = ((e, r) => {
					for (var t = new Date(e.getTime()); r > 0;) {
						var n = Ne(t.getFullYear()), o = t.getMonth(), a = (n ? Be : Ue)[o];
						if (!(r > a - t.getDate())) return t.setDate(t.getDate() + r), t;
						r -= a - t.getDate() + 1, t.setDate(1), o < 11 ? t.setMonth(o + 1) : (t.setMonth(0), t.setFullYear(t.getFullYear() + 1));
					}
					return t;
				})(new Date(e.tm_year + 1900, 0, 1), e.tm_yday), t = new Date(r.getFullYear(), 0, 4), n = new Date(r.getFullYear() + 1, 0, 4), o = m(t), a = m(n);
				return h(o, r) <= 0 ? h(a, r) <= 0 ? r.getFullYear() + 1 : r.getFullYear() : r.getFullYear() - 1;
			}
			var w = {
				"%a": (e) => u[e.tm_wday].substring(0, 3),
				"%A": (e) => u[e.tm_wday],
				"%b": (e) => d[e.tm_mon].substring(0, 3),
				"%B": (e) => d[e.tm_mon],
				"%C": (e) => f((e.tm_year + 1900) / 100 | 0, 2),
				"%d": (e) => f(e.tm_mday, 2),
				"%e": (e) => c(e.tm_mday, 2, " "),
				"%g": (e) => p(e).toString().substring(2),
				"%G": p,
				"%H": (e) => f(e.tm_hour, 2),
				"%I": (e) => {
					var r = e.tm_hour;
					return 0 == r ? r = 12 : r > 12 && (r -= 12), f(r, 2);
				},
				"%j": (e) => f(e.tm_mday + ((e, r) => {
					for (var t = 0, n = 0; n <= r; t += e[n++]);
					return t;
				})(Ne(e.tm_year + 1900) ? Be : Ue, e.tm_mon - 1), 3),
				"%m": (e) => f(e.tm_mon + 1, 2),
				"%M": (e) => f(e.tm_min, 2),
				"%n": () => "\n",
				"%p": (e) => e.tm_hour >= 0 && e.tm_hour < 12 ? "AM" : "PM",
				"%S": (e) => f(e.tm_sec, 2),
				"%t": () => "	",
				"%u": (e) => e.tm_wday || 7,
				"%U": (e) => {
					var r = e.tm_yday + 7 - e.tm_wday;
					return f(Math.floor(r / 7), 2);
				},
				"%V": (e) => {
					var r = Math.floor((e.tm_yday + 7 - (e.tm_wday + 6) % 7) / 7);
					if ((e.tm_wday + 371 - e.tm_yday - 2) % 7 <= 2 && r++, r) {
						if (53 == r) {
							var t = (e.tm_wday + 371 - e.tm_yday) % 7;
							4 == t || 3 == t && Ne(e.tm_year) || (r = 1);
						}
					} else {
						r = 52;
						var n = (e.tm_wday + 7 - e.tm_yday - 1) % 7;
						(4 == n || 5 == n && Ne(e.tm_year % 400 - 1)) && r++;
					}
					return f(r, 2);
				},
				"%w": (e) => e.tm_wday,
				"%W": (e) => {
					var r = e.tm_yday + 7 - (e.tm_wday + 6) % 7;
					return f(Math.floor(r / 7), 2);
				},
				"%y": (e) => (e.tm_year + 1900).toString().substring(2),
				"%Y": (e) => e.tm_year + 1900,
				"%z": (e) => {
					var r = e.tm_gmtoff, t = r >= 0;
					return r = (r = Math.abs(r) / 60) / 60 * 100 + r % 60, (t ? "+" : "-") + String("0000" + r).slice(-4);
				},
				"%Z": (e) => e.tm_zone,
				"%%": () => "%"
			};
			for (var l in s = s.replace(/%%/g, "\0\0"), w) s.includes(l) && (s = s.replace(new RegExp(l, "g"), w[l](a)));
			var v = be(s = s.replace(/\0\0/g, "%"), !1);
			return v.length > r ? 0 : (He(v, e), v.length - 1);
		}, We = (e) => o["_" + e], qe = (e, r, t, n, o) => {
			var a = {
				string: (e) => {
					var r = 0;
					return null != e && 0 !== e && (r = de(e)), r;
				},
				array: (e) => {
					var r = ue(e.length);
					return He(e, r), r;
				}
			}, s = We(e), i = [], l = 0;
			if (n) for (var u = 0; u < n.length; u++) {
				var d = a[t[u]];
				d ? (0 === l && (l = ae()), i[u] = d(n[u])) : i[u] = n[u];
			}
			var c = s(...i);
			return c = function(e) {
				return 0 !== l && rr(l), function(e) {
					return "string" === r ? he(e) : "boolean" === r ? Boolean(e) : e;
				}(e);
			}(c);
		}, Ye = (e) => {
			var r = se(e) + 1, t = Ke(r);
			return t && le(e, t, r), t;
		};
		Ae.createPreloadedFile = (e, r, t, n, o, a, s, i, l, u) => {
			var d = r ? _e.resolve(ye.join2(e, r)) : e;
			function c(t) {
				function c(t) {
					u?.(), i || ((e, r, t, n, o, a) => {
						Ae.createDataFile(e, r, t, n, o, a);
					})(e, r, t, n, o, l), a?.(), G();
				}
				((e, r, t, n) => {
					"undefined" != typeof Browser && Browser.init();
					var o = !1;
					return Me.forEach((a) => {
						o || a.canHandle(r) && (a.handle(e, r, t, n), o = !0);
					}), o;
				})(t, d, c, () => {
					s?.(), G();
				}) || c(t);
			}
			Y(), "string" == typeof t ? ((e, r, t, n) => {
				var o = n ? "" : `al ${e}`;
				h(e, (e) => {
					r(new Uint8Array(e)), o && G();
				}, (r) => {
					if (!t) throw `Loading data file "${e}" failed.`;
					t();
				}), o && Y();
			})(t, c, s) : c(t);
		}, Ae.staticInit(), o.FS_createDataFile = Ae.createDataFile, o.FS_readFile = Ae.readFile, o.FS_unlink = Ae.unlink, o.FS_createPath = Ae.createPath, o.FS_createDataFile = Ae.createDataFile, o.FS_createPreloadedFile = Ae.createPreloadedFile, o.FS_unlink = Ae.unlink, o.FS_createLazyFile = Ae.createLazyFile, o.FS_createDevice = Ae.createDevice;
		var Ge, Xe = {
			c: (e, r, t, n) => {
				X(`Assertion failed: ${he(e)}, at: ` + [
					r ? he(r) : "unknown filename",
					t,
					n ? he(n) : "unknown function"
				]);
			},
			b: (e, r, t) => {
				throw new ve(e).init(r, t), ge = e, o.wrapException(ge);
			},
			a: (e) => {
				var r = Ze(), t = er();
				X(`stack overflow (Attempt to set SP to ${pe(e)}, with stack limits [${pe(t)} - ${pe(r)}]). If you require more stack space build with -sSTACK_SIZE=<bytes>`);
			},
			n: function(e, r, t, n) {
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
			g: function(e, r, t) {
				xe.varargs = t;
				try {
					var n = xe.getStreamFromFD(e);
					switch (r) {
						case 0:
							if ((o = Re()) < 0) return -28;
							for (; Ae.streams[o];) o++;
							return Ae.dupStream(n, o).fd;
						case 1:
						case 2:
						case 13:
						case 14: return 0;
						case 3: return n.flags;
						case 4:
							var o = Re();
							return n.flags |= o, 0;
						case 12: return o = je(), A[o + 0 >> 1] = 2, 0;
					}
					return -28;
				} catch (a) {
					if (void 0 === Ae || "ErrnoError" !== a.name) throw a;
					return -a.errno;
				}
			},
			B: function(e, r) {
				try {
					if (0 === r) return -28;
					var t = Ae.cwd(), n = se(t) + 1;
					return r < n ? -68 : (le(t, e, r), n);
				} catch (o) {
					if (void 0 === Ae || "ErrnoError" !== o.name) throw o;
					return -o.errno;
				}
			},
			w: function(e, r, t) {
				try {
					var n = xe.getStreamFromFD(e);
					n.getdents ||= Ae.readdir(n.path);
					for (var o = 280, a = 0, s = Ae.llseek(n, 0, 1), i = Math.floor(s / o); i < n.getdents.length && a + o <= t;) {
						var l, u, d = n.getdents[i];
						if ("." === d) l = n.node.id, u = 4;
						else if (".." === d) l = Ae.lookupPath(n.path, { parent: !0 }).node.id, u = 4;
						else {
							var c = Ae.lookupNode(n.node, d);
							l = c.id, u = Ae.isChrdev(c.mode) ? 2 : Ae.isDir(c.mode) ? 4 : Ae.isLink(c.mode) ? 10 : 8;
						}
						Q = [l >>> 0, (J = l, +Math.abs(J) >= 1 ? J > 0 ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)], x[r + a >> 2] = Q[0], x[r + a + 4 >> 2] = Q[1], Q = [(i + 1) * o >>> 0, (J = (i + 1) * o, +Math.abs(J) >= 1 ? J > 0 ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)], x[r + a + 8 >> 2] = Q[0], x[r + a + 12 >> 2] = Q[1], A[r + a + 16 >> 1] = 280, M[r + a + 18] = u, le(d, r + a + 19, 256), a += o, i += 1;
					}
					return Ae.llseek(n, i * o, 0), a;
				} catch (f) {
					if (void 0 === Ae || "ErrnoError" !== f.name) throw f;
					return -f.errno;
				}
			},
			l: function(e, r, t) {
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
								var o = n.tty.ops.ioctl_tcgets(n), a = je();
								x[a >> 2] = o.c_iflag || 0, x[a + 4 >> 2] = o.c_oflag || 0, x[a + 8 >> 2] = o.c_cflag || 0, x[a + 12 >> 2] = o.c_lflag || 0;
								for (var s = 0; s < 32; s++) M[a + s + 17] = o.c_cc[s] || 0;
								return 0;
							}
							return 0;
						case 21506:
						case 21507:
						case 21508:
							if (!n.tty) return -59;
							if (n.tty.ops.ioctl_tcsets) {
								a = je();
								var i = x[a >> 2], l = x[a + 4 >> 2], u = x[a + 8 >> 2], d = x[a + 12 >> 2], c = [];
								for (s = 0; s < 32; s++) c.push(M[a + s + 17]);
								return n.tty.ops.ioctl_tcsets(n.tty, r, {
									c_iflag: i,
									c_oflag: l,
									c_cflag: u,
									c_lflag: d,
									c_cc: c
								});
							}
							return 0;
						case 21519: return n.tty ? (a = je(), x[a >> 2] = 0, 0) : -59;
						case 21520: return n.tty ? -28 : -59;
						case 21531: return a = je(), Ae.ioctl(n, r, a);
						case 21523:
							if (!n.tty) return -59;
							if (n.tty.ops.ioctl_tiocgwinsz) {
								var f = n.tty.ops.ioctl_tiocgwinsz(n.tty);
								a = je(), A[a >> 1] = f[0], A[a + 2 >> 1] = f[1];
							}
							return 0;
						default: return -28;
					}
				} catch (h) {
					if (void 0 === Ae || "ErrnoError" !== h.name) throw h;
					return -h.errno;
				}
			},
			x: function(e, r, t) {
				try {
					return r = xe.getStr(r), r = xe.calculateAt(e, r), "/" === (r = ye.normalize(r))[r.length - 1] && (r = r.substr(0, r.length - 1)), Ae.mkdir(r, t, 0), 0;
				} catch (n) {
					if (void 0 === Ae || "ErrnoError" !== n.name) throw n;
					return -n.errno;
				}
			},
			h: function(e, r, t, n) {
				xe.varargs = n;
				try {
					r = xe.getStr(r), r = xe.calculateAt(e, r);
					var o = n ? Re() : 0;
					return Ae.open(r, t, o).fd;
				} catch (a) {
					if (void 0 === Ae || "ErrnoError" !== a.name) throw a;
					return -a.errno;
				}
			},
			v: function(e, r, t, n) {
				try {
					if (r = xe.getStr(r), r = xe.calculateAt(e, r), n <= 0) return -28;
					var o = Ae.readlink(r), a = Math.min(n, se(o)), s = M[t + a];
					return le(o, t, n + 1), M[t + a] = s, a;
				} catch (i) {
					if (void 0 === Ae || "ErrnoError" !== i.name) throw i;
					return -i.errno;
				}
			},
			t: function(e, r, t, n) {
				try {
					return r = xe.getStr(r), n = xe.getStr(n), r = xe.calculateAt(e, r), n = xe.calculateAt(t, n), Ae.rename(r, n), 0;
				} catch (o) {
					if (void 0 === Ae || "ErrnoError" !== o.name) throw o;
					return -o.errno;
				}
			},
			u: function(e) {
				try {
					return e = xe.getStr(e), Ae.rmdir(e), 0;
				} catch (r) {
					if (void 0 === Ae || "ErrnoError" !== r.name) throw r;
					return -r.errno;
				}
			},
			y: function(e, r) {
				try {
					return e = xe.getStr(e), xe.doStat(Ae.stat, e, r);
				} catch (t) {
					if (void 0 === Ae || "ErrnoError" !== t.name) throw t;
					return -t.errno;
				}
			},
			j: function(e, r, t) {
				try {
					return r = xe.getStr(r), r = xe.calculateAt(e, r), 0 === t ? Ae.unlink(r) : 512 === t ? Ae.rmdir(r) : X("Invalid flags passed to unlinkat"), 0;
				} catch (n) {
					if (void 0 === Ae || "ErrnoError" !== n.name) throw n;
					return -n.errno;
				}
			},
			m: (e, r, t) => P.copyWithin(e, r, r + t),
			r: (e) => {
				if (d) {
					if (!e) return 1;
					var r = he(e);
					if (!r.length) return 0;
					var t = c("child_process").spawnSync(r, [], {
						shell: !0,
						stdio: "inherit"
					}), n = (e, r) => e << 8 | r;
					return null === t.status ? n(0, ((e) => {
						switch (e) {
							case "SIGHUP": return 1;
							case "SIGINT": return 2;
							case "SIGQUIT": return 3;
							case "SIGFPE": return 8;
							case "SIGKILL": return 9;
							case "SIGALRM": return 14;
							case "SIGTERM": return 15;
						}
						return 2;
					})(t.signal)) : n(t.status, 0);
				}
				return e ? -52 : 0;
			},
			f: () => {
				X("");
			},
			e: () => Date.now(),
			s: () => 2147483648,
			q: (e) => {
				var r = P.length, t = 2147483648;
				if ((e >>>= 0) > t) return !1;
				for (var n = (e, r) => e + (r - e % r) % r, o = 1; o <= 4; o *= 2) {
					var a = r * (1 + .2 / o);
					if (a = Math.min(a, e + 100663296), ze(Math.min(t, n(Math.max(e, a), 65536)))) return !0;
				}
				return !1;
			},
			z: (e, r) => {
				var t = 0;
				return Le().forEach((n, o) => {
					var a = r + t;
					R[e + 4 * o >> 2] = a, ((e, r) => {
						for (var t = 0; t < e.length; ++t) M[r++] = e.charCodeAt(t);
						M[r] = 0;
					})(n, a), t += n.length + 1;
				}), 0;
			},
			A: (e, r) => {
				var t = Le();
				R[e >> 2] = t.length;
				var n = 0;
				return t.forEach((e) => n += e.length + 1), R[r >> 2] = n, 0;
			},
			i: Ie,
			d: function(e) {
				try {
					var r = xe.getStreamFromFD(e);
					return Ae.close(r), 0;
				} catch (t) {
					if (void 0 === Ae || "ErrnoError" !== t.name) throw t;
					return t.errno;
				}
			},
			C: function(e, r, t, n) {
				try {
					var o = ((e, r, t, n) => {
						for (var o = 0, a = 0; a < t; a++) {
							var s = R[r >> 2], i = R[r + 4 >> 2];
							r += 8;
							var l = Ae.read(e, M, s, i, n);
							if (l < 0) return -1;
							if (o += l, l < i) break;
							void 0 !== n && (n += l);
						}
						return o;
					})(xe.getStreamFromFD(e), r, t);
					return R[n >> 2] = o, 0;
				} catch (a) {
					if (void 0 === Ae || "ErrnoError" !== a.name) throw a;
					return a.errno;
				}
			},
			o: function(e, r, t, n, o) {
				var a, s, i = (s = t) + 2097152 >>> 0 < 4194305 - !!(a = r) ? (a >>> 0) + 4294967296 * s : NaN;
				try {
					if (isNaN(i)) return 61;
					var l = xe.getStreamFromFD(e);
					return Ae.llseek(l, i, n), Q = [l.position >>> 0, (J = l.position, +Math.abs(J) >= 1 ? J > 0 ? +Math.floor(J / 4294967296) >>> 0 : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0 : 0)], x[o >> 2] = Q[0], x[o + 4 >> 2] = Q[1], l.getdents && 0 === i && 0 === n && (l.getdents = null), 0;
				} catch (u) {
					if (void 0 === Ae || "ErrnoError" !== u.name) throw u;
					return u.errno;
				}
			},
			k: function(e, r, t, n) {
				try {
					var o = ((e, r, t, n) => {
						for (var o = 0, a = 0; a < t; a++) {
							var s = R[r >> 2], i = R[r + 4 >> 2];
							r += 8;
							var l = Ae.write(e, M, s, i, n);
							if (l < 0) return -1;
							o += l, void 0 !== n && (n += l);
						}
						return o;
					})(xe.getStreamFromFD(e), r, t);
					return R[n >> 2] = o, 0;
				} catch (a) {
					if (void 0 === Ae || "ErrnoError" !== a.name) throw a;
					return a.errno;
				}
			},
			p: (e, r, t, n, o) => $e(e, r, t, n)
		}, Ve = function() {
			var e, r, t, a, s = { a: Xe };
			function i(e, r) {
				var t;
				return Ve = e.exports, b = Ve.D, L(), t = Ve.E, I.unshift(t), G(), Ve;
			}
			if (o.adjustWasmImports && o.adjustWasmImports(s), Y(), o.instantiateWasm) try {
				return o.instantiateWasm(s, i);
			} catch (l) {
				F(`Module.instantiateWasm callback failed with error: ${l}`), n(l);
			}
			return (e = k, r = V, t = s, a = function(e) {
				i(e.instance);
			}, e || "function" != typeof WebAssembly.instantiateStreaming || Z(r) || ee(r) || d || "function" != typeof fetch ? te(r, t, a) : fetch(r, { credentials: "same-origin" }).then((e) => WebAssembly.instantiateStreaming(e, t).then(a, function(e) {
				return F(`wasm streaming compile failed: ${e}`), F("falling back to ArrayBuffer instantiation"), te(r, t, a);
			}))).catch(n), {};
		}(), Ke = (o._free = (e) => (o._free = Ve.F)(e), o._malloc = (e) => (Ke = o._malloc = Ve.G)(e)), Je = o._main = (e, r) => (Je = o._main = Ve.I)(e, r), Qe = () => (Qe = Ve.J)(), Ze = () => (Ze = Ve.K)(), er = () => (er = Ve.L)(), rr = (e) => (rr = Ve.M)(e), tr = (e) => (tr = Ve.N)(e), nr = () => (nr = Ve.O)(), or = (e) => (or = Ve.Q)(e), ar = o.___set_stack_limits = (e, r) => (ar = o.___set_stack_limits = Ve.R)(e, r);
		function sr(e) {
			var r = Je;
			e.unshift(v);
			var t = e.length, n = ue(4 * (t + 1)), o = n;
			e.forEach((e) => {
				R[o >> 2] = de(e), o += 4;
			}), R[o >> 2] = 0;
			try {
				var a = r(t, n);
				return Ce(a), a;
			} catch (s) {
				return ((e) => {
					if (e instanceof ne || "unwind" == e) return D;
					O(), e instanceof WebAssembly.RuntimeError && nr() <= 0 && F("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 16777216)"), g(1, e);
				})(s);
			}
		}
		function ir() {
			var e;
			Qe(), 0 == (e = er()) && (e += 4), R[e >> 2] = 34821223, R[e + 4 >> 2] = 2310721022, R[0] = 1668509029;
		}
		function lr(e = w) {
			function r() {
				Ge || (Ge = !0, o.calledRun = !0, T || (O(), we(), o.noFSInit || Ae.init.initialized || Ae.init(), Ae.ignorePermissions = !1, Se.init(), oe(I), O(), oe(N), t(o), o.onRuntimeInitialized && o.onRuntimeInitialized(), ur && sr(e), function() {
					if (O(), o.postRun) for ("function" == typeof o.postRun && (o.postRun = [o.postRun]); o.postRun.length;) H(o.postRun.shift());
					oe(B);
				}()));
			}
			$ > 0 || (ir(), function() {
				if (o.preRun) for ("function" == typeof o.preRun && (o.preRun = [o.preRun]); o.preRun.length;) U(o.preRun.shift());
				oe(C);
			}(), $ > 0 || (o.setStatus ? (o.setStatus("Running..."), setTimeout(function() {
				setTimeout(function() {
					o.setStatus("");
				}, 1), r();
			}, 1)) : r(), O()));
		}
		if (o.addRunDependency = Y, o.removeRunDependency = G, o.FS_createPath = Ae.createPath, o.FS_createLazyFile = Ae.createLazyFile, o.FS_createDevice = Ae.createDevice, o.FS_readFile = Ae.readFile, o.callMain = sr, o.ccall = qe, o.cwrap = (e, r, t, n) => {
			var o = !t || t.every((e) => "number" === e || "boolean" === e);
			return "string" !== r && o && !n ? We(e) : (...n) => qe(e, r, t, n);
		}, o.setValue = function(e, r, t = "i8") {
			switch (t.endsWith("*") && (t = "*"), t) {
				case "i1":
				case "i8":
					M[e] = r;
					break;
				case "i16":
					A[e >> 1] = r;
					break;
				case "i32":
					x[e >> 2] = r;
					break;
				case "i64": X("to do setValue(i64) use WASM_BIGINT");
				case "float":
					j[e >> 2] = r;
					break;
				case "double":
					z[e >> 3] = r;
					break;
				case "*":
					R[e >> 2] = r;
					break;
				default: X(`invalid type for setValue: ${t}`);
			}
		}, o.getValue = function(e, r = "i8") {
			switch (r.endsWith("*") && (r = "*"), r) {
				case "i1":
				case "i8": return M[e];
				case "i16": return A[e >> 1];
				case "i32": return x[e >> 2];
				case "i64": X("to do getValue(i64) use WASM_BIGINT");
				case "float": return j[e >> 2];
				case "double": return z[e >> 3];
				case "*": return R[e >> 2];
				default: X(`invalid type for getValue: ${r}`);
			}
		}, o.stringToUTF8 = le, o.FS_createPreloadedFile = Ae.createPreloadedFile, o.FS = Ae, o.FS_createDataFile = Ae.createDataFile, o.FS_unlink = Ae.unlink, o.allocateUTF8 = Ye, q = function e() {
			Ge || lr(), Ge || (q = e);
		}, o.preInit) for ("function" == typeof o.preInit && (o.preInit = [o.preInit]); o.preInit.length > 0;) o.preInit.pop()();
		var ur = !1;
		return o.noInitialRun && (ur = !1), lr(), a;
	});
	let c = null;
	d().then((e) => {
		c = e, self.postMessage({ type: "ready" });
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
			const t = "/input", n = "/output", o = e.data.fileList, a = e.data.cmd;
			if (a.unshift("-o", n), !o || a.length < 1) throw new Error("Expected a flat file list and at least one command");
			if (!Array.isArray(a)) throw new Error("Expected args to be an array");
			if (!c) throw new Error("WASM module not loaded yet!");
			await (async (e, r, t) => {
				c.FS.mkdir(r), c.FS.mkdir(t);
				const n = [];
				for (let o of e) {
					const e = o.file, t = o.webkitRelativePath || e.name, a = new Promise((n, o) => {
						const a = new FileReader();
						a.onload = (e) => {
							try {
								const o = new Uint8Array(e.target.result), a = `${t.split("/").join("_")}`;
								c.FS.createDataFile(r, a, o, !0, !0), n();
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
			})(o, t, n), a.push(t);
			let s = 0;
			try {
				s = c.callMain(a);
			} catch (r) {
				if (!r || "object" != typeof r || !("status" in r)) throw r;
				s = r.status;
			}
			const i = c.FS.readdir(n).filter((e) => !e.startsWith(".")), l = [];
			for (let e of i) {
				const r = "/output/" + e, t = c.FS.readFile(r), n = new File([t], e, { type: f(e) });
				l.push(n);
			}
			self.postMessage({
				convertedFiles: l,
				exitCode: s
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

//# sourceMappingURL=worker.jpeg-ECN154l2.js.map