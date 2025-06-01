import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    {
      input: "./src/main",
      name: "index",
    },
  ],
  declaration: true,
  clean: true,
  externals: ["classcat"],
  rollup: {
    emitCJS: true,
    esbuild: {
      minify: true,
      treeShaking: true,
    },
    output: {
      compact: true,
    },
  },
});
