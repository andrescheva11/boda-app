import index from "./frontend/index.html";

Bun.serve({
  routes: {
    "/": index,
  },
  development: {
    hmr: true,
    console: true,
  },
  port: 5173,
});

console.log("🌸 Boda App running at http://localhost:5173");
