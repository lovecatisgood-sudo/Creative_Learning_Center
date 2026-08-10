(function () {
  const status = document.getElementById("selection-status");
  const choices = document.querySelectorAll("[data-language-choice]");

  choices.forEach((choice) => {
    choice.addEventListener("focus", () => {
      const language = choice.getAttribute("data-language-choice");
      status.textContent = language === "th"
        ? "เลือกเวอร์ชันภาษาไทยแล้ว / Thai edition selected. Press Enter to start."
        : "English edition selected. Press Enter to start. / เลือกเวอร์ชันภาษาอังกฤษแล้ว";
    });
  });
}());
