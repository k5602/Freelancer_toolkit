/**
 * Copy a given text string to the clipboard.
 * Returns a Promise that resolves to true if successful, false otherwise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            const success = document.execCommand("copy");
            document.body.removeChild(textarea);
            return success;
        } catch {
            document.body.removeChild(textarea);
            return false;
        }
    }
}
