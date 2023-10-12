if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/serviceworker.js")
        .then((registration) => {
          console.log("Service worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    });
  }