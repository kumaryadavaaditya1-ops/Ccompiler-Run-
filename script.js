/* =====================================
   CCompiler Run - Main JavaScript
===================================== */

const codeEditor = document.getElementById("code");
const inputBox = document.getElementById("input");
const outputBox = document.getElementById("output");
const lineNumbers = document.getElementById("lineNumbers");

const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");

const formatBtn = document.getElementById("formatBtn");

const clearInputBtn =
    document.getElementById("clearInputBtn");

const clearOutputBtn =
    document.getElementById("clearOutputBtn");

const exampleSelect =
    document.getElementById("exampleSelect");

const statusText =
    document.getElementById("status");

const themeBtn =
    document.getElementById("themeBtn");

const aboutBtn =
    document.getElementById("aboutBtn");

const closeModal =
    document.getElementById("closeModal");

const aboutModal =
    document.getElementById("aboutModal");

const year =
    document.getElementById("year");


/* =====================================
   YEAR
===================================== */

year.textContent = new Date().getFullYear();


/* =====================================
   LINE NUMBERS
===================================== */

function updateLineNumbers() {

    const lines =
        codeEditor.value.split("\n").length;

    let numbers = "";

    for (let i = 1; i <= lines; i++) {
        numbers += i + "\n";
    }

    lineNumbers.textContent = numbers;
}

updateLineNumbers();


/* =====================================
   SYNC SCROLL
===================================== */

codeEditor.addEventListener("scroll", () => {

    lineNumbers.scrollTop =
        codeEditor.scrollTop;
});


codeEditor.addEventListener("input", () => {

    updateLineNumbers();

    statusText.textContent = "Editing";
});


/* =====================================
   TAB SUPPORT
===================================== */

codeEditor.addEventListener("keydown", (event) => {

    if (event.key === "Tab") {

        event.preventDefault();

        const start =
            codeEditor.selectionStart;

        const end =
            codeEditor.selectionEnd;

        codeEditor.value =
            codeEditor.value.substring(0, start) +
            "    " +
            codeEditor.value.substring(end);

        codeEditor.selectionStart =
            codeEditor.selectionEnd =
            start + 4;

        updateLineNumbers();
    }
});


/* =====================================
   RUN CODE
===================================== */

async function runCode() {

    const code =
        codeEditor.value.trim();

    const input =
        inputBox.value;

    if (!code) {

        outputBox.textContent =
            "Error: Please write some C code first.";

        statusText.textContent =
            "No code";

        return;
    }


    runBtn.disabled = true;

    runBtn.classList.add("running");

    runBtn.textContent =
        "⏳ Running...";

    statusText.textContent =
        "Compiling...";

    outputBox.textContent =
        "Compiling your C program...";


    try {

        /*
         * IMPORTANT:
         *
         * Replace this URL with your own
         * secure C compiler backend API.
         *
         * Example:
         *
         * https://your-domain.com/api/compile
         */

        const response = await fetch(
            "YOUR_COMPILER_API_URL",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    language: "c",
                    code: code,
                    stdin: input
                })
            }
        );


        if (!response.ok) {
            throw new Error(
                "Compiler server returned an error."
            );
        }


        const result =
            await response.json();


        /*
         * Expected backend response:
         *
         * {
         *   output: "...",
         *   error: "...",
         *   status: "success"
         * }
         */


        if (result.error) {

            outputBox.textContent =
                result.error;

            statusText.textContent =
                "Compilation error";

        } else {

            outputBox.textContent =
                result.output || "Program finished with no output.";

            statusText.textContent =
                "Finished";
        }


    } catch (error) {

        console.error(error);

        outputBox.textContent =
            "Unable to connect to the compiler server.\n\n" +
            "Your frontend is working, but you need to connect " +
            "a C compiler backend API.\n\n" +
            "Error: " +
            error.message;

        statusText.textContent =
            "Backend required";

    } finally {

        runBtn.disabled = false;

        runBtn.classList.remove("running");

        runBtn.textContent =
            "▶ Run Code";
    }
}


runBtn.addEventListener(
    "click",
    runCode
);


/* =====================================
   CLEAR CODE
===================================== */

clearBtn.addEventListener("click", () => {

    codeEditor.value = "";

    updateLineNumbers();

    outputBox.textContent =
        "Program output will appear here...";

    statusText.textContent =
        "Ready";

    codeEditor.focus();
});


/* =====================================
   CLEAR INPUT
===================================== */

clearInputBtn.addEventListener(
    "click",
    () => {

        inputBox.value = "";

        inputBox.focus();
    }
);


/* =====================================
   CLEAR OUTPUT
===================================== */

clearOutputBtn.addEventListener(
    "click",
    () => {

        outputBox.textContent =
            "Program output will appear here...";

        statusText.textContent =
            "Ready";
    }
);


/* =====================================
   COPY CODE
===================================== */

copyBtn.addEventListener("click", async () => {

    try {

        await navigator.clipboard.writeText(
            codeEditor.value
        );

        copyBtn.textContent =
            "Copied!";

        setTimeout(() => {

            copyBtn.textContent =
                "Copy";

        }, 1500);

    } catch {

        alert(
            "Unable to copy code."
        );
    }
});


/* =====================================
   DOWNLOAD C FILE
===================================== */

downloadBtn.addEventListener(
    "click",
    () => {

        const code =
            codeEditor.value;

        const blob =
            new Blob(
                [code],
                {
                    type: "text/plain"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "main.c";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }
);


/* =====================================
   FORMAT CODE
===================================== */

formatBtn.addEventListener(
    "click",
    () => {

        let code =
            codeEditor.value;

        /*
         * Basic browser formatting.
         * A real C formatter can be connected
         * to the backend later.
         */

        code =
            code
            .replace(/\{\s*/g, "{\n    ")
            .replace(/\s*\}/g, "\n}")
            .replace(/;\s*/g, ";\n")
            .replace(/\n\s*\n+/g, "\n\n");


        codeEditor.value =
            code.trim();

        updateLineNumbers();

        statusText.textContent =
            "Formatted";
    }
);


/* =====================================
   EXAMPLES
===================================== */

const examples = {

    hello:
`#include <stdio.h>

int main()
{
    printf("Hello, World!");

    return 0;
}`,


    sum:
`#include <stdio.h>

int main()
{
    int a, b, sum;

    printf("Enter two numbers: ");
    scanf("%d %d", &a, &b);

    sum = a + b;

    printf("Sum = %d", sum);

    return 0;
}`,


    factorial:
`#include <stdio.h>

int main()
{
    int n;
    long long factorial = 1;

    printf("Enter a number: ");
    scanf("%d", &n);

    for (int i = 1; i <= n; i++)
    {
        factorial *= i;
    }

    printf("Factorial = %lld", factorial);

    return 0;
}`,


    prime:
`#include <stdio.h>

int main()
{
    int n;
    int prime = 1;

    printf("Enter a number: ");
    scanf("%d", &n);

    if (n <= 1)
    {
        prime = 0;
    }

    for (int i = 2; i * i <= n; i++)
    {
        if (n % i == 0)
        {
            prime = 0;
            break;
        }
    }

    if (prime)
        printf("%d is a prime number.", n);
    else
        printf("%d is not a prime number.", n);

    return 0;
}`,


    fibonacci:
`#include <stdio.h>

int main()
{
    int n;
    int a = 0;
    int b = 1;

    printf("Enter number of terms: ");
    scanf("%d", &n);

    for (int i = 1; i <= n; i++)
    {
        printf("%d ", a);

        int next = a + b;

        a = b;
        b = next;
    }

    return 0;
}`,


    calculator:
`#include <stdio.h>

int main()
{
    double a, b;
    char operator;

    printf("Enter expression: ");
    scanf("%lf %c %lf",
          &a,
          &operator,
          &b);

    switch (operator)
    {
        case '+':
            printf("Result = %.2lf", a + b);
            break;

        case '-':
            printf("Result = %.2lf", a - b);
            break;

        case '*':
            printf("Result = %.2lf", a * b);
            break;

        case '/':
            if (b != 0)
                printf("Result = %.2lf", a / b);
            else
                printf("Cannot divide by zero.");
            break;

        default:
            printf("Invalid operator.");
    }

    return 0;
}`
};


/* =====================================
   LOAD EXAMPLE
===================================== */

exampleSelect.addEventListener(
    "change",
    () => {

        const selected =
            exampleSelect.value;

        if (!selected) return;

        codeEditor.value =
            examples[selected];

        updateLineNumbers();

        outputBox.textContent =
            "Program output will appear here...";

        statusText.textContent =
            "Example loaded";

        codeEditor.focus();
    }
);


/* =====================================
   KEYBOARD SHORTCUT
===================================== */

document.addEventListener(
    "keydown",
    (event) => {

        /*
         * Ctrl + Enter
         * Run program
         */

        if (
            event.ctrlKey &&
            event.key === "Enter"
        ) {

            event.preventDefault();

            runCode();
        }


        /*
         * Ctrl + S
         * Download C file
         */

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "s"
        ) {

            event.preventDefault();

            downloadBtn.click();
        }
    }
);


/* =====================================
   DARK / LIGHT MODE
===================================== */

const savedTheme =
    localStorage.getItem("theme");


if (savedTheme === "light") {

    document.body.classList.add("light");

    themeBtn.textContent =
        "🌙";
}


themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light"
        );

        const light =
            document.body.classList.contains(
                "light"
            );


        localStorage.setItem(
            "theme",
            light ? "light" : "dark"
        );


        themeBtn.textContent =
            light ? "🌙" : "☀️";
    }
);


/* =====================================
   ABOUT MODAL
===================================== */

aboutBtn.addEventListener(
    "click",
    () => {

        aboutModal.classList.add(
            "show"
        );
    }
);


closeModal.addEventListener(
    "click",
    () => {

        aboutModal.classList.remove(
            "show"
        );
    }
);


aboutModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === aboutModal
        ) {

            aboutModal.classList.remove(
                "show"
            );
        }
    }
);
