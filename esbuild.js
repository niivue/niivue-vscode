const { build } = require("esbuild");

const baseConfig = {
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
};

const extensionConfig = {
  ...baseConfig,
  platform: "node",
  mainFields: ["module", "main"],
  format: "cjs",
  entryPoints: ["./src/extension.ts"],
  outfile: "./out/extension.js",
  external: ["vscode"],
};

(async () => {
    try {
      await build(extensionConfig);
      console.log("build complete");
    } catch (err) {
      process.stderr.write(err.stderr);
      process.exit(1);
    }
  })();

// const webviewConfig = {
//     ...baseConfig,
//     target: "es2020",
//     format: "esm",
//     entryPoints: ["./niivue/build/assets/index.js"],
//     outfile: "./out/webview.js",
//   };
  
//   (async () => {
//     const args = process.argv.slice(2);
//     try {
//       if (args.includes("--watch")) {
//         // Build and watch extension and webview code
//         console.log("[watch] build started");
//         await build({
//           ...extensionConfig,
//           ...watchConfig,
//         });
//         await build({
//           ...webviewConfig,
//           ...watchConfig,
//         });
//         console.log("[watch] build finished");
//       } else {
//         // Build extension and webview code
//         await build(extensionConfig);
//         await build(webviewConfig);
//         console.log("build complete");
//       }
//     } catch (err) {
//       process.stderr.write(err.stderr);
//       process.exit(1);
//     }
//   })();
