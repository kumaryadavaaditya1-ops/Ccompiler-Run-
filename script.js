function runCode() {
    const code = document.getElementById("code").value;
    const output = document.getElementById("output");

    if (code.trim() === "") {
        output.textContent = "Please enter C code.";
        return;
    }

    if (code.includes('printf("Hello World!");')) {
        output.textContent = "Hello World!";
    } else {
        output.textContent =
            "Code received successfully.\n\n" +
            "Note: A real C compiler backend is required to execute arbitrary C code.";
    }
}
