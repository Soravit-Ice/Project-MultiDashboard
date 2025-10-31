import { useState, useCallback, useEffect } from 'react';
import { checkSpelling } from '../api/spellCheck';

let debounceTimer = null;

export function useSpellCheck(text, options = {}) {
  const { enabled = true, debounceMs = 1000, minLength = 3 } = options;
  const [errors, setErrors] = useState([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkText = useCallback(async (textToCheck) => {
    if (!enabled || !textToCheck || textToCheck.trim().length < minLength) {
      setErrors([]);
      return;
    }

    try {
      setIsChecking(true);
      const response = await checkSpelling(textToCheck);
      
      if (response.success && response.data.errors) {
        setErrors(response.data.errors);
      } else {
        setErrors([]);
      }
    } catch (error) {
      console.error('Spell check error:', error);
      setErrors([]);
    } finally {
      setIsChecking(false);
    }
  }, [enabled, minLength]);

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      checkText(text);
    }, debounceMs);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [text, checkText, debounceMs]);

  const getHighlightedHTML = useCallback((inputText) => {
    if (!errors || errors.length === 0 || !inputText) {
      return inputText;
    }

    const errorWords = new Set(errors.map(e => e.word));
    const words = inputText.match(/[\u0E00-\u0E7F]+|[a-zA-Z]+|[^\u0E00-\u0E7Fa-zA-Z]+/g) || [];
    
    return words.map(word => {
      if (errorWords.has(word)) {
        return `<span style="
          color: #ff4d4f;
          text-decoration: underline wavy #ff4d4f;
          text-decoration-thickness: 2px;
          text-underline-offset: 3px;
          text-decoration-skip-ink: none;
          background: linear-gradient(to bottom, transparent 0%, transparent 85%, rgba(255, 77, 79, 0.1) 85%, rgba(255, 77, 79, 0.1) 100%);
          padding: 0 1px;
          border-radius: 2px;
          font-weight: 500;
        ">${word}</span>`;
      }
      return word;
    }).join('');
  }, [errors]);

  return {
    errors,
    isChecking,
    hasErrors: errors.length > 0,
    getHighlightedHTML,
  };
}
