/* =========================================================
   Ccompiler Run - Real Online C Compiler
   Compiler engine: Judge0 CE
   ========================================================= */

const JUDGE0_URL = "https://ce.judge0.com";

const editor = document.getElementById("codeEditor");
const inputBox = document.getElementById("programInput");
const outputBox = document.getElementById("output");
const runButton = document.getElementById("runButton");

/* ---------------------------------------------------------
   Default C program
   --------------------------------------------------------- */

if (editor && !editor.value.trim()) {
    editor.value =
`#include <stdio.h>

int main(void)
{
    int a, b;

    printf("Enter two numbers: ");
    scanf("%d %d", &a, &b);

    printf("Sum = %d\\n", a + b);

    return 0;
}`;
}

/* ---------------------------------------------------------
   Output helper
   --------------------------------------------------------- */

function showOutput(text) {
    if (!outputBox) return;
    outputBox.textContent = text;
}

/* ---------------------------------------------------------
   UTF-8 Base64
   Judge0 supports base64_encoded=true.
   This makes special characters safer.
   --------------------------------------------------------- */

function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

function decodeBase64(text) {
    if (!text) return "";

    try {
        const binary = atob(text);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return new TextDecoder().decode(bytes);
    } catch (error) {
        return text;
    }
}

/* ---------------------------------------------------------
   Find an available C compiler automatically
   --------------------------------------------------------- */

async function getCLanguage() {

    const response = await fetch(`${JUDGE0_URL}/languages/`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        },
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            `Cannot load compiler languages. HTTP ${response.status}`
        );
    }

    const languages = await response.json();

    /*
       Prefer newer GCC C versions when available.
       Current Judge0 CE examples include:
       48 = C GCC 7.4.0
       49 = C GCC 8.3.0
       50 = C GCC 9.2.0
    */

    const cLanguages = languages.filter(language => {
        const name = String(language.name || "").toLowerCase();

        return (
            name.startsWith("c (") &&
            name.includes("gcc")
        );
    });

    if (!cLanguages.length) {
        throw new Error("No C/GCC compiler is currently available.");
    }

    function gccVersion(language) {
        const match = String(language.name).match(
            /gcc\s+(\d+)\.(\d+)\.(\d+)/i
        );

        if (!match) return 0;

        return (
            Number(match[1]) * 1000000 +
            Number(match[2]) * 1000 +
            Number(match[3])
        );
    }

    cLanguages.sort((a, b) => gccVersion(b) - gccVersion(a));

    return cLanguages[0];
}

/* ---------------------------------------------------------
   Create Judge0 submission
   --------------------------------------------------------- */

async function createSubmission(sourceCode, stdin, languageId) {

    const body = {
        source_code: encodeBase64(sourceCode),
        language_id: languageId,
        stdin: encodeBase64(stdin || "")
    };

    const response = await fetch(
        `${JUDGE0_URL}/submissions/?base64_encoded=true&wait=false`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify(body)
        }
    );

    /*
       IMPORTANT:
       Read the response body even when HTTP is 422.
       This tells us the real Judge0 error.
    */

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        data = {
            error: text
        };
    }

    if (!response.ok) {

        let details = "";

        if (data && typeof data === "object") {

            if (data.error) {
                details = String(data.error);
            } else {
                details = JSON.stringify(data, null, 2);
            }

        } else {
            details = String(data);
        }

        throw new Error(
            `Compiler request failed (HTTP ${response.status})\n\n${details}`
        );
    }

    if (!data.token) {
        throw new Error(
            "Compiler did not return a submission token."
        );
    }

    return data.token;
}

/* ---------------------------------------------------------
   Get submission result
   --------------------------------------------------------- */

async function getSubmission(token) {

    const response = await fetch(
        `${JUDGE0_URL}/submissions/${encodeURIComponent(token)}?base64_encoded=true`,
        {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        }
    );

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        data = {
            error: text
        };
    }

    if (!response.ok) {
        throw new Error(
            `Compiler result request failed (HTTP ${response.status})\n\n` +
            JSON.stringify(data, null, 2)
        );
    }

    return data;
}

/* ---------------------------------------------------------
   Wait until compilation/execution finishes
   --------------------------------------------------------- */

async function waitForResult(token) {

    const maxAttempts = 60;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {

        const result = await getSubmission(token);

        /*
           Judge0:
           1 = In Queue
           2 = Processing
           3+ = Finished
        */

        const statusId =
            result.status && Number(result.status.id);

        if (statusId >= 3) {
            return result;
        }

        await new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    throw new Error(
        "Compilation timed out while waiting for the compiler service."
    );
}

/* ---------------------------------------------------------
   Format final result
   --------------------------------------------------------- */

function formatResult(result) {

    const status =
        result.status &&
        result.status.description
            ? result.status.description
            : "Unknown";

    const stdout = decodeBase64(result.stdout);
    const stderr = decodeBase64(result.stderr);
    const compileOutput = decodeBase64(result.compile_output);
    const message = result.message || "";

    let finalText = "";

    finalText += `Status: ${status}\n`;

    if (result.time !== null && result.time !== undefined) {
        finalText += `Time: ${result.time} s\n`;
    }

    if (result.memory !== null && result.memory !== undefined) {
        finalText += `Memory: ${result.memory} KB\n`;
    }

    finalText += "\n";

    if (stdout) {
        finalText += "OUTPUT\n";
        finalText += "------------------------------\n";
        finalText += stdout;
        if (!stdout.endsWith("\n")) finalText += "\n";
        finalText += "\n";
    }

    if (compileOutput) {
        finalText += "COMPILER ERROR\n";
        finalText += "------------------------------\n";
        finalText += compileOutput;
        if (!compileOutput.endsWith("\n")) finalText += "\n";
        finalText += "\n";
    }

    if (stderr) {
        finalText += "RUNTIME ERROR\n";
        finalText += "------------------------------\n";
        finalText += stderr;
        if (!stderr.endsWith("\n")) finalText += "\n";
        finalText += "\n";
    }

    if (message) {
        finalText += "MESSAGE\n";
        finalText += "------------------------------\n";
        finalText += message;
        finalText += "\n";
    }

    if (
        !stdout &&
        !compileOutput &&
        !stderr &&
        !message &&
        status === "Accepted"
    ) {
        finalText += "Program finished successfully with no output.\n";
    }

    return finalText.trim();
}

/* ---------------------------------------------------------
   RUN C PROGRAM
   --------------------------------------------------------- */

async function runCode() {

    if (!editor) {
        alert("C code editor was not found.");
        return;
    }

    const sourceCode = editor.value;
    const stdin = inputBox ? inputBox.value : "";

    if (!sourceCode.trim()) {
        showOutput("Error: Please write some C code first.");
        return;
    }

    if (runButton) {
        runButton.disabled = true;
        runButton.textContent = "Running...";
    }

    showOutput("Connecting to C compiler...\n");

    try {

        /* Step 1: Find C compiler */

        showOutput(
            "Finding available C/GCC compiler..."
        );

        const language = await getCLanguage();

        showOutput(
            `Using ${language.name}\n\nSubmitting program...`
        );

        /* Step 2: Submit */

        const token = await createSubmission(
            sourceCode,
            stdin,
            language.id
        );

        /* Step 3: Wait */

        showOutput(
            `Compiler: ${language.name}\n` +
            `Submission created.\n\n` +
            `Compiling and running...`
        );

        const result = await waitForResult(token);

        /* Step 4: Display */

        showOutput(formatResult(result));

    } catch (error) {

        console.error(error);

        showOutput(
            "COMPILER CONNECTION ERROR\n" +
            "==============================\n\n" +
            error.message +
            "\n\n" +
            "Check your internet connection and try again."
        );

    } finally {

        if (runButton) {
            runButton.disabled = false;
            runButton.textContent = "Run Code";
        }
    }
}

/* ---------------------------------------------------------
   Run button
   --------------------------------------------------------- */

if (runButton) {
    runButton.addEventListener("click", runCode);
}

/* ---------------------------------------------------------
   Ctrl + Enter / Android keyboard alternative
   --------------------------------------------------------- */

if (editor) {

    editor.addEventListener("keydown", function(event) {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "Enter"
        ) {
            event.preventDefault();
            runCode();
        }

    });
}

/* ---------------------------------------------------------
   Symbol keyboard
   --------------------------------------------------------- */

function insertSymbol(symbol) {

    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    editor.value =
        editor.value.substring(0, start) +
        symbol +
        editor.value.substring(end);

    const newPosition = start + symbol.length;

    editor.focus();

    editor.selectionStart = newPosition;
    editor.selectionEnd = newPosition;
}

/*
   Make insertSymbol available to HTML onclick buttons.
*/

window.insertSymbol = insertSymbol;
window.runCode = runCode;
