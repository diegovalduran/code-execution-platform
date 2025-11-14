/**
 * Parse named parameter input string
 * Example: "nums = [3, 2, 4], target = 6"
 * Returns: { nums: "[3, 2, 4]", target: "6" }
 * 
 * Supports:
 * - Lists/Arrays: [1, 2, 3]
 * - Dicts/Objects: {"key": "value"}
 * - Tuples: (1, 2, 3) - converted to lists
 * - Strings: "hello" or 'hello'
 * - Primitives: numbers, booleans, null
 * - Nested structures
 */
export function parseNamedParameters(input: string, paramNames: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (!input || !paramNames.length) {
    return result;
  }
  
  // Check if input contains "=" (named parameter format)
  if (input.includes('=')) {
    // Split by comma, but be careful with commas inside arrays/objects/tuples/strings
    const parts: string[] = [];
    let current = '';
    let depth = 0; // Track bracket/parenthesis depth
    let inString = false;
    let stringChar = ''; // Track which quote character started the string
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const prevChar = i > 0 ? input[i - 1] : '';
      
      // Handle string literals
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
        current += char;
      } else if (inString) {
        // Inside a string, add everything as-is
        current += char;
      } else {
        // Track bracket/parenthesis depth for arrays, objects, tuples
        if (char === '[' || char === '{' || char === '(') {
          depth++;
          current += char;
        } else if (char === ']' || char === '}') {
          depth--;
          current += char;
        } else if (char === ')') {
          depth--;
          // Convert tuples to lists for consistency
          current += ']';
        } else if (char === ',' && depth === 0) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    // Parse each part as "paramName = value"
    for (const part of parts) {
      const equalsIndex = part.indexOf('=');
      if (equalsIndex !== -1) {
        const name = part.substring(0, equalsIndex).trim();
        let value = part.substring(equalsIndex + 1).trim();
        
        // Normalize value: convert tuples to lists, ensure proper JSON format
        value = normalizeValue(value);
        
        if (paramNames.includes(name)) {
          result[name] = value;
        }
      }
    }
    
    if (Object.keys(result).length > 0) {
      return result;
    }
  }
  
  // Fallback: try to parse as array and map to parameter names by position
  try {
    // Try to parse as JSON array
    let normalizedInput = input.trim();
    // Convert tuples to lists for JSON parsing
    normalizedInput = normalizedInput.replace(/\(/g, '[').replace(/\)/g, ']');
    const parsed = JSON.parse(`[${normalizedInput}]`);
    if (Array.isArray(parsed)) {
      paramNames.forEach((name, index) => {
        if (index < parsed.length) {
          result[name] = JSON.stringify(parsed[index]);
        }
      });
    }
  } catch {
    // If parsing fails, return empty
  }
  
  return result;
}

/**
 * Normalize a value string to ensure it's in proper format for execution
 * - Converts tuples (1, 2, 3) to lists [1, 2, 3]
 * - Ensures proper JSON format
 * - Handles strings, numbers, booleans, null
 */
function normalizeValue(value: string): string {
  value = value.trim();
  
  // Convert Python tuples to lists
  if (value.startsWith('(') && value.endsWith(')')) {
    value = '[' + value.slice(1, -1) + ']';
  }
  
  // Try to parse and re-stringify to ensure valid JSON
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed);
  } catch {
    // If not valid JSON, try to handle common cases
    // Handle Python booleans
    if (value === 'True') return 'true';
    if (value === 'False') return 'false';
    if (value === 'None') return 'null';
    
    // If it's a number, return as-is (will be parsed correctly)
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return value;
    }
    
    // If it's a string without quotes, add them
    if (!value.startsWith('"') && !value.startsWith("'")) {
      // Check if it looks like it should be a string
      if (!value.startsWith('[') && !value.startsWith('{') && !value.match(/^-?\d/)) {
        return JSON.stringify(value);
      }
    }
    
    // Return as-is if we can't normalize
    return value;
  }
}

/**
 * Get code template from structured function definition
 * Returns Python or JavaScript code with the function signature
 */
export function getCodeTemplateFromStructured(
  functionName: string,
  parameters: Array<{ name: string; type: string }>,
  returnType: string,
  language: string
): string {
  // Clean up function name: remove "solution" completely (as prefix or anywhere)
  let cleanFunctionName = functionName.trim();
  
  // Remove "solution" if it appears at the start
  if (cleanFunctionName.toLowerCase().startsWith('solution')) {
    const afterSolution = cleanFunctionName.substring('solution'.length);
    if (afterSolution.length > 0) {
      cleanFunctionName = afterSolution;
    } else {
      // If it's just "solution", use a default
      cleanFunctionName = 'solve';
    }
  }
  
  // Also remove "solution" if it appears anywhere else (e.g., "twoSumsolution" -> "twoSum")
  cleanFunctionName = cleanFunctionName.replace(/solution/gi, '');
  
  // If we removed everything, use a default
  if (!cleanFunctionName || cleanFunctionName.trim().length === 0) {
    cleanFunctionName = 'solve';
  }
  
  if (language === 'javascript' || language === 'js') {
    const paramNames = parameters.map(p => p.name).join(', ');
    return `function ${cleanFunctionName}(${paramNames}) {
    // Write your solution here
    // Your function will be called automatically with test inputs
}`;
  } else {
    // Python - build signature from structured data
    const paramStr = parameters.map(p => `${p.name}: ${p.type}`).join(', ');
    const returnTypeStr = returnType !== 'None' ? ` -> ${returnType}` : '';
    return `def ${cleanFunctionName}(${paramStr})${returnTypeStr}:
    # Write your solution here
    # Your function will be called automatically with test inputs
    pass`;
  }
}

