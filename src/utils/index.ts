/**
 * Calculates the visual length of a string after removing ANSI escape sequences.
 * @param str The string to measure
 * @returns The length of the string without ANSI escape sequences
 */
export function getDisplayLength(str: string): number {
    // Use unicode escape syntax to avoid ESLint no-control-regex warning
    const ansiRegex = new RegExp('\u001b' + '\\[[0-?]*[ -/]*[@-~]', 'g');
    const strippedString = str.replace(ansiRegex, '');
    return strippedString.length;
}

export default {};
