(function() {
  // 💬 BUBBLE
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

  // 🧠 CHAT WINDOW
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

  // 🔔 NOTIFICATION MESSAGE
  const notification = document.createElement("div");
  notification.innerHTML = "Hi 👋 Looking to book a dental appointment?";
  notification.style.position = "fixed";
  notification.style.bottom = "90px";
  notification.style.right = "90px";
  notification.style.background = "#fff";
  notification.style.padding = "10px 14px";
  notification.style.borderRadius = "10px";
  notification.style.boxShadow = "0 5px 15px rgba(0,0,0,0.2)";
  notification.style.fontSize = "14px";
  notification.style.cursor = "pointer";
  notification.style.zIndex = "9999";
  notification.style.maxWidth = "220px";

  // ✨ SHOW AFTER DELAY
  setTimeout(() => {
    document.body.appendChild(notification);
  }, 2000);

  // ❌ CLICK NOTIFICATION → OPEN CHAT
  notification.onclick = () => {
    iframe.style.display = "block";
    notification.remove();
  };

  // 💬 CLICK BUBBLE
  bubble.onclick = () => {
    iframe.style.display =
      iframe.style.display === "none" ? "block" : "none";
    notification.remove();
  };

  document.body.appendChild(bubble);
  document.body.appendChild(iframe);
})();