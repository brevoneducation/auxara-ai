(function() {
  const bubble = document.createElement("div");
  bubble.innerHTML = "💬";
  bubble.style.position = "fixed";
  bubble.style.bottom = "20px";
  bubble.style.right = "20px";
  bubble.style.width = "60px";
  bubble.style.height = "60px";
  bubble.style.background = "#4CAF50";
  bubble.style.color = "#fff";
  bubble.style.borderRadius = "50%";
  bubble.style.display = "flex";
  bubble.style.alignItems = "center";
  bubble.style.justifyContent = "center";
  bubble.style.fontSize = "26px";
  bubble.style.cursor = "pointer";
  bubble.style.zIndex = "9999";
  bubble.style.boxShadow = "0 8px 20px rgba(0,0,0,0.3)";

  const iframe = document.createElement("iframe");
  iframe.src = "https://auxara-ai.vercel.app";
  iframe.style.position = "fixed";
  iframe.style.bottom = "90px";
  iframe.style.right = "20px";
  iframe.style.width = "350px";
  iframe.style.height = "500px";
  iframe.style.border = "none";
  iframe.style.borderRadius = "12px";
  iframe.style.boxShadow = "0 8px 25px rgba(0,0,0,0.2)";
  iframe.style.display = "none";
  iframe.style.zIndex = "9999";

  bubble.onclick = () => {
    iframe.style.display =
      iframe.style.display === "none" ? "block" : "none";
  };

  document.body.appendChild(bubble);
  document.body.appendChild(iframe);
})();