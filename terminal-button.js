(function () {
  const btn = document.createElement("a");
  btn.href = "index.html"; // pas aan indien nodig
  btn.textContent = "↩ Terminal";

  Object.assign(btn.style, {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: "9999",
    padding: "10px 12px",
    border: "1px solid #1fb85a",
    background: "#071107",
    color: "#34ff7a",
    textDecoration: "none",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
    fontSize: "14px",
    borderRadius: "10px",
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(btn);
  });
})();
