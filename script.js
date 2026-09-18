const JUDGE0_URL = "https://ce.judge0.com";

const editor = document.getElementById("codeEditor");
const inputBox = document.getElementById("programInput");
const outputBox = document.getElementById("output");
const runButton = document.getElementById("runButton");


function showOutput(text) {
    outputBox.textContent = text;
}


/* Convert text to Base64 */
function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}


/* Convert Base64 back to normal text */
function decodeBase64(text) {
    if (!text) return "";

    try {
        const binary = atob(text);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return new TextDecoder().decode(bytes);
    } catch {
        return text;
    }
}


/* Find an available C compiler */
async function getCLanguage() {

    const response = await fetch(
        `${JUDGE0_URL}/languages/`,
        {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            `Unable to connect to compiler. HTTP ${response.status}`
        );
    }

    const languages = data.filter(language => {

        const name = String(language.name || "").toLowerCase();

        return (
            name.startsWith("c (") &&
            name.includes("gcc")
        );
    });

    if (languages.length === 0) {
        throw new Error("C compiler is currently unavailable.");
    }

    return languages[languages.length - 1];
}


/* Send C program to compiler */
async function submitCode(sourceCode, input, languageId) {

    const requestData = {
        source_code: encodeBase64(sourceCode),
        language_id: languageId,
        stdin: encodeBase64(input)
    };

    const response = await fetch(
        `${JUDGE0_URL}/submissions/?base64_encoded=true&wait=false`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify(requestData)
        }
    );

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        data = { error: text };
    }

    if (!response.ok) {

        throw new Error(
            `Compiler error HTTP ${response.status}\n\n` +
            (data.error || JSON.stringify(data))
        );
    }

    if (!data.token) {
        throw new Error("Compiler did not return a token.");
    }

    return data.token;
}


/* Get result */
async function getResult(token) {

    const response = await fetch(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=true`,
        {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            `Result error HTTP ${response.status}`
        );
    }

    return data;
}


/* Wait for compilation */
async function waitForResult(token) {

    for (let i = 0; i < 60; i++) {

        const result = await getResult(token);

        if (
            result.status &&
            Number(result.status.id) >= 3
        ) {
            return result;
        }

        await new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    throw new Error("Compiler timed out.");
}


/* Show compiler result */
function displayResult(result) {

    const status =
        result.status?.description || "Unknown";

    const output =
        decodeBase64(result.stdout);

    const compilerError =
        decodeBase64(result.compile_output);

    const runtimeError =
        decodeBase64(result.stderr);

    let text = `Status: ${status}\n\n`;

    if (output) {
        text += "OUTPUT\n";
        text += "-------------------------\n";
        text += output;
        text += "\n\n";
    }

    if (compilerError) {
        text += "COMPILER ERROR\n";
        text += "-------------------------\n";
        text += compilerError;
        text += "\n\n";
    }

    if (runtimeError) {
        text += "RUNTIME ERROR\n";
        text += "-------------------------\n";
        text += runtimeError;
        text += "\n\n";
    }

    if (result.message) {
        text += "MESSAGE\n";
        text += "-------------------------\n";
        text += result.message;
    }

    if (
        !output &&
        !compilerError &&
        !runtimeError &&
        !result.message
    ) {
        text += "Program finished successfully.";
    }

    showOutput(text.trim());
}


/* RUN BUTTON */
async function runCode() {

    const code = editor.value;
    const input = inputBox.value;

    /* Do not run empty editor */
    if (!code.trim()) {
        showOutput("Please write C code first.");
        return;
    }

    runButton.disabled = true;
    runButton.textContent = "Running...";

    showOutput("Connecting to C compiler...");

    try {

        const language = await getCLanguage();

        showOutput(
            `Compiler: ${language.name}\n\n` +
            "Submitting code..."
        );

        const token = await submitCode(
            code,
            input,
            language.id
        );

        showOutput(
            "Code submitted.\n\n" +
            "Compiling and running..."
        );

        const result =
            await waitForResult(token);

        displayResult(result);

    } catch (error) {

        console.error(error);

        showOutput(
            "ERROR\n" +
            "=========================\n\n" +
            error.message
        );

    } finally {

        runButton.disabled = false;
        runButton.textContent = "Run Code";
    }
}


/* Run button */
runButton.addEventListener(
    "click",
    runCode
);


/* Ctrl + Enter */
editor.addEventListener(
    "keydown",
    function(event) {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "Enter"
        ) {
            event.preventDefault();
            runCode();
        }

    }
);


/* Symbol keyboard */
function insertSymbol(symbol) {

    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    editor.value =
        editor.value.substring(0, start) +
        symbol +
        editor.value.substring(end);

    const position =
        start + symbol.length;

    editor.focus();

    editor.selectionStart = position;
    editor.selectionEnd = position;
}

window.insertSymbol = insertSymbol;
window.runCode = runCode;
