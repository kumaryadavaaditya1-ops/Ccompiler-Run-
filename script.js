function insertSymbol(symbol) {
    const editor = document.getElementById("code");

    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    editor.value =
        editor.value.substring(0, start) +
        symbol +
        editor.value.substring(end);

    editor.focus();

    editor.selectionStart = start + symbol.length;
    editor.selectionEnd = start + symbol.length;
}

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
            "A real C compiler backend is required to execute this program.";
    }
}
