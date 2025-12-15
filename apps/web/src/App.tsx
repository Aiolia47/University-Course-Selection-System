import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>BMAD7 课程管理系统</h1>
        <p>
          欢迎使用 BMAD7 在线课程管理平台！
        </p>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<div>首页 - 正在开发中...</div>} />
          <Route path="/courses" element={<div>课程页面 - 正在开发中...</div>} />
          <Route path="/about" element={<div>关于页面 - 正在开发中...</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;