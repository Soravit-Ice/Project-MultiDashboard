import { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Alert, Tag, Space, Tooltip, Spin, Typography, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, CopyOutlined } from '@ant-design/icons';
import { checkSpelling, autoCorrectText } from '../api/spellCheck';
import { SpellCheckTextArea } from './SpellCheckInput';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

export default function SpellChecker() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedCorrections, setSelectedCorrections] = useState({});
  const [correctedText, setCorrectedText] = useState('');

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleCheck = async () => {
    if (!text.trim()) {
      return;
    }

    setLoading(true);
    setResult(null);
    setSelectedCorrections({});
    setCorrectedText('');

    try {
      const response = await checkSpelling(text);
      if (response.success) {
        setResult(response.data);
        
        // Auto-select first suggestion for each error
        const autoCorrections = {};
        response.data.errors.forEach(error => {
          const suggestions = response.data.suggestions[error.word];
          if (suggestions && suggestions.length > 0) {
            autoCorrections[error.word] = suggestions[0];
          }
        });
        setSelectedCorrections(autoCorrections);
      }
    } catch (error) {
      console.error('Spell check error:', error);
      alert('เกิดข้อผิดพลาดในการตรวจสอบคำผิด');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCorrect = async () => {
    if (!text.trim() || Object.keys(selectedCorrections).length === 0) {
      return;
    }

    setLoading(true);
    try {
      const response = await autoCorrectText(text, selectedCorrections);
      if (response.success) {
        setCorrectedText(response.data.correctedText);
      }
    } catch (error) {
      console.error('Auto-correct error:', error);
      alert('เกิดข้อผิดพลาดในการแก้ไขอัตโนมัติ');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (word, suggestion) => {
    setSelectedCorrections(prev => ({
      ...prev,
      [word]: suggestion
    }));
  };

  const handleCopy = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    alert('คัดลอกข้อความแล้ว');
  };

  const handleReset = () => {
    setText('');
    setResult(null);
    setSelectedCorrections({});
    setCorrectedText('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="shadow-lg">
        <Title level={2} className="text-center mb-6">
          🔍 ตรวจสอบคำผิด (Spell Checker)
        </Title>
        
        <Paragraph className="text-center text-gray-600 mb-8">
          ตรวจสอบและแก้ไขคำผิด คำพิมพ์ผิด ทั้งภาษาไทยและภาษาอังกฤษ
        </Paragraph>

        <div className="space-y-6">
          {/* Input Section */}
          <div>
            <Text strong className="block mb-2">
              พิมพ์ข้อความที่ต้องการตรวจสอบ:
            </Text>
            <SpellCheckTextArea
              value={text}
              onChange={handleTextChange}
              placeholder="พิมพ์ข้อความที่นี่... เช่น สวัสดิ ครัป ขอบคุน มาก I liek to plaay games"
              rows={6}
              className="text-lg"
              spellCheck={true}
            />
          </div>

          {/* Action Buttons */}
          <Space className="w-full justify-center">
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleCheck}
              loading={loading}
              disabled={!text.trim()}
            >
              ตรวจสอบคำผิด
            </Button>
            
            {result && result.errors.length > 0 && (
              <Button
                type="default"
                size="large"
                icon={<SyncOutlined />}
                onClick={handleAutoCorrect}
                loading={loading}
                disabled={Object.keys(selectedCorrections).length === 0}
              >
                แก้ไขอัตโนมัติ
              </Button>
            )}
            
            <Button
              size="large"
              onClick={handleReset}
            >
              ล้างข้อมูล
            </Button>
          </Space>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <Spin size="large" />
              <Text className="block mt-4 text-gray-600">กำลังตรวจสอบ...</Text>
            </div>
          )}

          {/* Results Section */}
          {!loading && result && (
            <div className="space-y-6">
              <Divider />
              
              {/* Statistics */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <Title level={4}>📊 สถิติ</Title>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <Text className="block text-2xl font-bold text-blue-600">
                      {result.statistics.totalWords}
                    </Text>
                    <Text className="text-gray-600">คำทั้งหมด</Text>
                  </div>
                  <div className="text-center">
                    <Text className="block text-2xl font-bold text-red-600">
                      {result.statistics.errorsFound}
                    </Text>
                    <Text className="text-gray-600">คำผิด</Text>
                  </div>
                  <div className="text-center">
                    <Text className="block text-2xl font-bold text-green-600">
                      {result.statistics.thaiWords}
                    </Text>
                    <Text className="text-gray-600">คำภาษาไทย</Text>
                  </div>
                  <div className="text-center">
                    <Text className="block text-2xl font-bold text-purple-600">
                      {result.statistics.englishWords}
                    </Text>
                    <Text className="text-gray-600">คำภาษาอังกฤษ</Text>
                  </div>
                </div>
              </Card>

              {/* Errors and Suggestions */}
              {result.errors.length > 0 ? (
                <Card className="bg-red-50">
                  <Title level={4}>
                    <CloseCircleOutlined className="text-red-600 mr-2" />
                    พบคำผิด {result.errors.length} คำ
                  </Title>
                  
                  <div className="space-y-4 mt-4">
                    {result.errors.map((error, index) => (
                      <Card key={index} size="small" className="bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Space>
                              <Tag color="red" className="text-lg px-3 py-1">
                                {error.word}
                              </Tag>
                              <Tag color={error.language === 'thai' ? 'blue' : 'purple'}>
                                {error.language === 'thai' ? 'ภาษาไทย' : 'English'}
                              </Tag>
                            </Space>
                            
                            <div className="mt-3">
                              <Text strong className="block mb-2">คำแนะนำ:</Text>
                              <Space wrap>
                                {result.suggestions[error.word]?.map((suggestion, idx) => (
                                  <Tooltip key={idx} title="คลิกเพื่อเลือก">
                                    <Tag
                                      color={selectedCorrections[error.word] === suggestion ? 'green' : 'default'}
                                      className="cursor-pointer text-base px-3 py-1 hover:scale-105 transition-transform"
                                      onClick={() => handleSuggestionSelect(error.word, suggestion)}
                                    >
                                      {suggestion}
                                      {selectedCorrections[error.word] === suggestion && (
                                        <CheckCircleOutlined className="ml-2" />
                                      )}
                                    </Tag>
                                  </Tooltip>
                                ))}
                              </Space>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              ) : (
                <Alert
                  message="ไม่พบคำผิด"
                  description="ข้อความของคุณถูกต้องแล้ว ไม่พบคำผิดหรือคำพิมพ์ผิด"
                  type="success"
                  icon={<CheckCircleOutlined />}
                  showIcon
                  className="text-lg"
                />
              )}

              {/* Corrected Text */}
              {correctedText && (
                <Card className="bg-green-50">
                  <div className="flex justify-between items-center mb-3">
                    <Title level={4} className="mb-0">
                      <CheckCircleOutlined className="text-green-600 mr-2" />
                      ข้อความที่แก้ไขแล้ว
                    </Title>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(correctedText)}
                    >
                      คัดลอก
                    </Button>
                  </div>
                  <Card className="bg-white">
                    <Paragraph className="text-lg mb-0 whitespace-pre-wrap">
                      {correctedText}
                    </Paragraph>
                  </Card>
                </Card>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
