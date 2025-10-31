import { useState, useRef, useEffect } from 'react';
import { Input, Tooltip } from 'antd';
import { useSpellCheck } from '../hooks/useSpellCheck';

const { TextArea } = Input;

export function SpellCheckInput({ value, onChange, spellCheck = true, ...props }) {
  const [showHighlight, setShowHighlight] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const { errors, getHighlightedHTML } = useSpellCheck(internalValue, { 
    enabled: spellCheck,
    debounceMs: 1500,
    minLength: 5
  });

  const hasErrors = errors.length > 0;

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <Input
        {...props}
        value={internalValue}
        onChange={handleChange}
        onFocus={() => setShowHighlight(false)}
        onBlur={() => setShowHighlight(true)}
        style={{
          ...props.style,
          borderColor: hasErrors && showHighlight ? '#ff4d4f' : undefined,
        }}
      />
      {hasErrors && showHighlight && (
        <Tooltip title={`พบคำผิด ${errors.length} คำ`} placement="topLeft">
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              padding: '4px 11px',
              fontSize: props.style?.fontSize || '14px',
              lineHeight: '1.5715',
              color: 'rgba(0, 0, 0, 0.88)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none',
              zIndex: 1,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
            }}
            dangerouslySetInnerHTML={{ __html: getHighlightedHTML(internalValue) }}
          />
        </Tooltip>
      )}
    </div>
  );
}

export function SpellCheckTextArea({ value, onChange, spellCheck = true, ...props }) {
  const [showHighlight, setShowHighlight] = useState(false);
  const [internalValue, setInternalValue] = useState('');
  
  // Sync with external value (from Form.Item)
  useEffect(() => {
    const newValue = value || '';
    if (newValue !== internalValue) {
      setInternalValue(newValue);
    }
  }, [value]);

  const { errors, getHighlightedHTML } = useSpellCheck(internalValue, { 
    enabled: spellCheck,
    debounceMs: 1500,
    minLength: 5
  });

  const hasErrors = errors.length > 0;

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <TextArea
        {...props}
        value={internalValue}
        onChange={handleChange}
        onFocus={() => setShowHighlight(false)}
        onBlur={() => setShowHighlight(true)}
        style={{
          ...props.style,
          borderColor: hasErrors && showHighlight ? '#ff7875' : undefined,
          boxShadow: hasErrors && showHighlight ? '0 0 0 2px rgba(255, 77, 79, 0.1)' : undefined,
          transition: 'all 0.3s ease',
        }}
      />
      {hasErrors && showHighlight && (
        <div
          style={{
            position: 'absolute',
            top: '1px',
            left: '1px',
            right: '1px',
            bottom: '1px',
            padding: '4px 11px',
            fontSize: props.style?.fontSize || '14px',
            lineHeight: '1.5715',
            color: 'transparent',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 1,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            background: 'transparent',
          }}
          dangerouslySetInnerHTML={{ __html: getHighlightedHTML(internalValue) }}
        />
      )}
      {hasErrors && showHighlight && (
        <div
          style={{
            position: 'absolute',
            bottom: '-24px',
            left: '0',
            fontSize: '12px',
            color: '#ff4d4f',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <span style={{ 
            display: 'inline-block',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: '#ff4d4f',
          }} />
          พบคำผิด {errors.length} คำ
        </div>
      )}
    </div>
  );
}
