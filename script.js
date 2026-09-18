/* =====================================================
   CCOMPILER RUN
   Online C Compiler Engine
   Creator: Aaditya Kumar YV
   ===================================================== */


/*
   Judge0 API

   Judge0 supports:
   - C compilation
   - program input
   - stdout
   - stderr
   - compilation errors
   - runtime errors
   - execution time
   - memory
*/

const API_URL = "https://ce.judge0.com";

const C_LANGUAGE_ID = 4;


/* ================= DEFAULT CODE ================= */

const DEFAULT_CODE = `#include <stdio.h>

int main(void)
{
    int a, b;

    printf("Enter two numbers: ");
    scanf("%d %d", &a, &b);

    printf("Sum = %d\\\\n", a + b);

    return 0;
}`;


/* ================= DOM ================= */

const codeEditor =
    document.getElementById("code");

const inputEditor =
    document.getElementById("input");

const outputBox =
    document.getElementById("output");

const runButton =
    document.getElementById("runButton");

const runText =
    document.getElementById("runText");

const runIcon =
    document.getElementById("runIcon");

const codeStatus =
    document.getElementById("codeStatus");

const resultStatus =
    document.getElementById("resultStatus");

const lineNumbers =
    document.getElementById("lineNumbers");

const executionInfo =
    document.getElementById("executionInfo");


/* ================= INITIALIZE ================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateLineNumbers();

        codeEditor.focus();

    }
);


/* ================= LINE NUMBERS ================= */

function updateLineNumbers() {

    const lines =
        codeEditor.value.split("\n").length;

    let numbers = "";

    for (let i = 1; i <= lines; i++) {

        numbers += i + "\n";

    }

    lineNumbers.textContent =
        numbers;

}


/* ================= SCROLL SYNC ================= */

function syncEditorScroll() {

    lineNumbers.scrollTop =
        codeEditor.scrollTop;

}


/* ================= EDITOR KEYBOARD ================= */

function handleEditorKeydown(event) {

    /*
       Tab key
       Insert 4 spaces instead of
       leaving the textarea.
    */

    if (event.key === "Tab") {

        event.preventDefault();

        insertText("    ");

        return;

    }


    /*
       Auto-close brackets.
    */

    const pairs = {

        "{": "}",
        "(": ")",
        "[": "]",
        "\"": "\""

    };


    if (pairs[event.key]) {

        const start =
            codeEditor.selectionStart;

        const end =
            codeEditor.selectionEnd;

        const selected =
            codeEditor.value.substring(
                start,
                end
            );

        event.preventDefault();

        const closing =
            pairs[event.key];

        codeEditor.value =
            codeEditor.value.substring(0, start) +
            event.key +
            selected +
            closing +
            codeEditor.value.substring(end);

        codeEditor.selectionStart =
            start + 1;

        codeEditor.selectionEnd =
            start + 1 + selected.length;

        updateLineNumbers();

    }

}


/* ================= INSERT TEXT ================= */

function insertText(text) {

    const start =
        codeEditor.selectionStart;

    const end =
        codeEditor.selectionEnd;

    codeEditor.value =
        codeEditor.value.substring(0, start) +
        text +
        codeEditor.value.substring(end);

    codeEditor.focus();

    const position =
        start + text.length;

    codeEditor.selectionStart =
        position;

    codeEditor.selectionEnd =
        position;

    updateLineNumbers();

}


/* ================= SYMBOL BUTTON ================= */

function insertSymbol(symbol) {

    insertText(symbol);

}


/* ================= COPY ================= */

async function copyCode() {

    try {

        await navigator.clipboard.writeText(
            codeEditor.value
        );

        codeStatus.textContent =
            "Copied";

        setTimeout(
            () => {
                codeStatus.textContent =
                    "Ready";
            },
            1500
        );

    } catch (error) {

        codeStatus.textContent =
            "Copy failed";

    }

}


/* ================= CLEAR ================= */

function clearCode() {

    codeEditor.value = "";

    updateLineNumbers();

    codeEditor.focus();

    codeStatus.textContent =
        "Editor cleared";

}


/* ================= RESET ================= */

function resetCode() {

    codeEditor.value =
        DEFAULT_CODE;

    inputEditor.value =
        "10 20";

    outputBox.innerHTML =
        `<span class="output-placeholder">
            Your program output will appear here.
        </span>`;

    executionInfo.textContent =
        "";

    resultStatus.textContent =
        "Waiting for program";

    codeStatus.textContent =
        "Reset";

    updateLineNumbers();

    codeEditor.focus();

}


/* ================= RUN CODE ================= */

async function runCode() {

    const sourceCode =
        codeEditor.value;

    const stdin =
        inputEditor.value;


    /* Empty code check */

    if (!sourceCode.trim()) {

        showError(
            "INPUT ERROR",
            "Please enter a C program first."
        );

        return;

    }


    /* Loading state */

    setRunning(true);

    outputBox.innerHTML =
        `<span class="output-warning">
            Compiling and running your C program...
        </span>`;

    resultStatus.textContent =
        "Running";

    executionInfo.textContent =
        "";


    try {

        /*
           Create submission
        */

        const response =
            await fetch(
                `${API_URL}/submissions/?base64_encoded=false&wait=false`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        source_code:
                            sourceCode,

                        language_id:
                            C_LANGUAGE_ID,

                        stdin:
                            stdin

                    })

                }
            );


        /*
           HTTP error
        */

        if (!response.ok) {

            let message =
                `Compiler service returned HTTP ${response.status}.`;

            try {

                const errorData =
                    await response.json();

                if (errorData.error) {

                    message =
                        errorData.error;

                }

            } catch (_) {}

            throw new Error(message);

        }


        /*
           Submission response
        */

        const submission =
            await response.json();


        if (!submission.token) {

            throw new Error(
                "Compiler did not return a submission token."
            );

        }


        /*
           Wait for result
        */

        const result =
            await waitForResult(
                submission.token
            );


        /*
           Display result
        */

        displayResult(result);


    } catch (error) {

        showError(
            "CONNECTION ERROR",
            error.message
        );

    } finally {

        setRunning(false);

    }

}


/* ================= WAIT FOR RESULT ================= */

async function waitForResult(token) {

    const maxAttempts = 45;

    for (
        let attempt = 0;
        attempt < maxAttempts;
        attempt++
    ) {

        await sleep(1000);


        const response =
            await fetch(
                `${API_URL}/submissions/${token}?base64_encoded=false`
            );


        if (!response.ok) {

            throw new Error(
                `Could not retrieve compiler result (${response.status}).`
            );

        }


        const result =
            await response.json();


        /*
           Judge0:
           1 = In Queue
           2 = Processing
           >2 = Finished
        */

        if (
            result.status &&
            result.status.id > 2
        ) {

            return result;

        }

    }


    throw new Error(
        "The compiler took too long to respond. Please try again."
    );

}


/* ================= DISPLAY RESULT ================= */

function displayResult(result) {

    const statusId =
        result.status?.id;

    const statusDescription =
        result.status?.description ||
        "Unknown";


    /*
       Compilation error
    */

    if (result.compile_output) {

        showError(
            "COMPILATION ERROR",
            result.compile_output
        );

        resultStatus.textContent =
            "Compilation failed";

        return;

    }


    /*
       Runtime error
    */

    if (result.stderr) {

        showError(
            "RUNTIME ERROR",
            result.stderr
        );

        resultStatus.textContent =
            "Runtime error";

        showExecutionInfo(
            result
        );

        return;

    }


    /*
       Judge0 message
    */

    if (result.message) {

        showError(
            "EXECUTION ERROR",
            result.message
        );

        resultStatus.textContent =
            statusDescription;

        showExecutionInfo(
            result
        );

        return;

    }


    /*
       Time limit
    */

    if (statusId === 5) {

        showError(
            "TIME LIMIT EXCEEDED",
            "Your program exceeded the allowed execution time."
        );

        resultStatus.textContent =
            "Time limit";

        showExecutionInfo(
            result
        );

        return;

    }


    /*
       Memory limit
    */

    if (statusId === 6) {

        showError(
            "MEMORY LIMIT EXCEEDED",
            "Your program used more memory than allowed."
        );

        resultStatus.textContent =
            "Memory limit";

        showExecutionInfo(
            result
        );

        return;

    }


    /*
       Successful execution
    */

    const stdout =
        result.stdout ?? "";


    if (stdout.trim() === "") {

        outputBox.innerHTML =
            `<span class="output-success">
                Program executed successfully.
                No output was produced.
            </span>`;

    } else {

        outputBox.textContent =
            stdout;

        outputBox.className =
            "output-box output-success";

    }


    resultStatus.textContent =
        "Accepted";

    showExecutionInfo(
        result
    );

}


/* ================= ERROR DISPLAY ================= */

function showError(title, message) {

    outputBox.className =
        "output-box output-error";

    outputBox.textContent =
        `${title}\n\n${message}`;

    executionInfo.textContent =
        "";

}


/* ================= EXECUTION INFO ================= */

function showExecutionInfo(result) {

    const parts = [];

    if (result.time) {

        parts.push(
            `Time: ${result.time}s`
        );

    }

    if (result.memory !== null &&
        result.memory !== undefined) {

        parts.push(
            `Memory: ${result.memory} KB`
        );

    }


    executionInfo.textContent =
        parts.join("  •  ");

}


/* ================= RUNNING STATE ================= */

function setRunning(running) {

    runButton.disabled =
        running;


    if (running) {

        runIcon.textContent =
            "⏳";

        runText.textContent =
            "Running...";

        codeStatus.textContent =
            "Compiling";

    } else {

        runIcon.textContent =
            "▶";

        runText.textContent =
            "Run Code";

        codeStatus.textContent =
            "Ready";

    }

}


/* ================= SLEEP ================= */

function sleep(milliseconds) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}
