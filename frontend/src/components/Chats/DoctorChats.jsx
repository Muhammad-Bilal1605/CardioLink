import React, { useState } from 'react';

const DoctorChats = () => {
  const [messages, setMessages] = useState([
    { sender: 'patient', text: 'Hello Doctor, I have a headache.' },
    { sender: 'doctor', text: 'Please take rest and drink water. I’ll prescribe medicine.' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    setMessages([...messages, { sender: 'doctor', text: input }]);
    setInput('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h2>Doctor Chat</h2>
      <div style={{ border: '1px solid #ccc', padding: '10px', height: '300px', overflowY: 'scroll', marginBottom: '10px' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              textAlign: msg.sender === 'doctor' ? 'right' : 'left',
              margin: '5px 0',
            }}
          >
            <span
              style={{
                background: msg.sender === 'doctor' ? '#daf0ff' : '#f0f0f0',
                padding: '8px 12px',
                borderRadius: '15px',
                display: 'inline-block',
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: '80%', padding: '8px' }}
        />
        <button type="submit" style={{ padding: '8px 12px', marginLeft: '5px' }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default DoctorChats;
