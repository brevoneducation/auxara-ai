(function() {

  // 💬 BUBBLE BUTTON
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
  bubble.style.transition = "transform 0.2s ease";

  // ✨ HOVER EFFECT
  bubble.onmouseenter = () => bubble.style.transform = "scale(1.1)";
  bubble.onmouseleave = () => bubble.style.transform = "scale(1)";

  // 🔴 NOTIFICATION DOT
  const dot = document.createElement("div");
  dot.style.position = "absolute";
  dot.style.top = "6px";
  dot.style.right = "6px";
  dot.style.width = "12px";
  dot.style.height = "12px";
  dot.style.background = "red";
  dot.style.borderRadius = "50%";
  dot.style.boxShadow = "0 0 6px rgba(255,0,0,0.7)";

  bubble.appendChild(dot);

  // 🧠 CHAT WINDOW (IFRAME)
  const iframe = document.createElement("iframe");
  iframe.src = "https://auxara-ai.vercel.app";
  iframe.style.position = "fixed";
  iframe.style.bottom = "90px";
  iframe.style.right = "20px";
  iframe.style.width = "350px";
  iframe.style.height = "500px";
  iframe.style.border = "none";
  iframe.style.borderRadius = "12px";
  iframe.style.boxShadow = "0 8px 25px rgba(0,0,0,0.25)";
  iframe.style.display = "none";
  iframe.style.opacity = "0";
  iframe.style.transition = "opacity 0.3s ease";
  iframe.style.zIndex = "9999";

  // 🔔 SMART NOTIFICATION POPUP
  const notification = document.createElement("div");
  notification.innerHTML = "Hi 👋 Need help booking a dental appointment?";
  notification.style.position = "fixed";
  notification.style.bottom = "95px";
  notification.style.right = "90px";
  notification.style.background = "#fff";
  notification.style.padding = "10px 14px";
  notification.style.borderRadius = "10px";
  notification.style.boxShadow = "0 5px 15px rgba(0,0,0,0.2)";
  notification.style.fontSize = "14px";
  notification.style.cursor = "pointer";
  notification.style.zIndex = "9999";
  notification.style.maxWidth = "220px";
  notification.style.opacity = "0";
  notification.style.transition = "opacity 0.4s ease, transform 0.4s ease";
  notification.style.transform = "translateY(10px)";

  // ✨ SHOW NOTIFICATION AFTER DELAY
  setTimeout(() => {
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 50);
  }, 2000);

  // ❌ CLICK NOTIFICATION → OPEN CHAT
  notification.onclick = () => {
    openChat();
  };

  // 💬 TOGGLE CHAT FUNCTION
  function openChat() {
    iframe.style.display = "block";
    setTimeout(() => iframe.style.opacity = "1", 10);

    // remove notification + dot
    notification.remove();
    dot.remove();
  }

  function closeChat() {
    iframe.style.opacity = "0";
    setTimeout(() => iframe.style.display = "none", 300);
  }

  bubble.onclick = () => {
    if (iframe.style.display === "none") {
      openChat();
    } else {
      closeChat();
    }
  };

  // 🚀 AUTO-OPEN AFTER 6 SECONDS (POWER MOVE)
  setTimeout(() => {
    openChat();
  }, 6000);

  document.body.appendChild(bubble);
  document.body.appendChild(iframe);

})();