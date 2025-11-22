import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Flame, Waves, Wind, Terminal, Sparkles, Send, X, BookOpen, ScrollText, Droplets, Loader2, Volume2, VolumeX } from 'lucide-react';

// --- Gemini API Configuration ---

// 🟢 智能 API 路径选择
// 1. 本地开发 (localhost): 尝试直连 Google (需要本机有代理环境)
// 2. 线上环境 (woodland-mango.click): 走 Nginx 代理 '/api/gemini'，解决国内无法访问 Google API 的问题
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal 
  ? "https://generativelanguage.googleapis.com" 
  : "/api/gemini"; 

// ⚠️ API Key 配置注意：
// 在此预览环境中，为了防止 'import.meta' 报错，我们默认使用空字符串。
// 🚨【关键】：当您部署到 Linux 服务器时，请务必：
// 1. 取消下面第一行的注释 (启用 import.meta)
// 2. 注释掉第二行 (const apiKey = "";)
// -----------------------------------------------------------
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
// const apiKey = ""; 
// -----------------------------------------------------------

// Helper function to call Gemini API
const callGemini = async (prompt, systemInstruction = "") => {
  if (!apiKey) {
    console.warn("API Key is missing. Check App.jsx configuration.");
    // 在预览环境中继续执行，以便演示 UI 交互，但在生产环境中这会导致请求失败（除非由后端完全代理鉴权）
  }

  // 🟢 使用动态构建的 URL
  const url = `${API_BASE_URL}/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "The mist is too thick to see...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Connection to the forest server lost... (Check Nginx proxy or API Key)";
  }
};

// --- Audio Engine (Procedural Web Audio API) ---
class ForestAudioEngine {
  constructor() {
    this.ctx = null;
    this.nodes = {};
    this.isPlaying = false;
    this.currentType = null;
    this.fadeTime = 2; // seconds
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.createNoiseBuffer();
    }
  }

  createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  createNoiseSource() {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;
    return noise;
  }

  // Sound Types: 'wind', 'fire', 'water'
  play(type) {
    if (this.currentType === type && this.isPlaying) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    this.stop(); // Fade out current
    this.currentType = type;
    this.isPlaying = true;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(type === 'fire' ? 0.15 : 0.05, this.ctx.currentTime + this.fadeTime);
    
    const noise = this.createNoiseSource();
    let filter;

    if (type === 'wind') {
      filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 1; 
    } else if (type === 'fire') {
      filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 800;
    } else { // Water
      filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
    }

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    noise.start();

    this.nodes[type] = { source: noise, gain: gainNode };
  }

  stop() {
    Object.keys(this.nodes).forEach(key => {
      const { source, gain } = this.nodes[key];
      try {
        gain.gain.cancelScheduledValues(this.ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + this.fadeTime);
        setTimeout(() => { source.stop(); source.disconnect(); }, this.fadeTime * 1000);
      } catch (e) {}
    });
    this.nodes = {};
    this.isPlaying = false;
    this.currentType = null;
  }
  
  mute() { if (this.ctx) this.ctx.suspend(); }
  unmute() { if (this.ctx) this.ctx.resume(); }
}

const audio = new ForestAudioEngine();

// --- Components ---

const Typewriter = ({ text, delay = 50, onComplete }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, delay, text, onComplete]);

  return <span>{currentText}</span>;
};

// Wiki Modal Component
const WikiModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <div 
        className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-3xl max-h-full bg-stone-900 border border-stone-800 rounded-lg shadow-2xl overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800 bg-stone-900/50">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-500/80" />
            <h2 className="text-xl font-bold text-stone-200 tracking-wide font-woodland">林地档案 (The Archives)</h2>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Scrollable Area */}
        <div className="overflow-y-auto p-6 md:p-10 space-y-10 text-stone-400 leading-relaxed scrollbar-thin font-woodland">
          
          {/* Intro */}
          <section className="space-y-4">
            <h1 className="text-3xl font-bold text-stone-100">林地 (The Woodland)</h1>
            <p>
              <strong className="text-stone-200">林地 (The Woodland)</strong> 是一个由匿名开发者（代号 User-17）构建的数字化概念空间与心理避难所。该项目既是一个交互式网页应用，也是一个运行于虚拟深林中的模拟操作系统（Woodland OS）。
            </p>
            <p>
              它以沉浸式的视觉叙事、极简主义的设计风格以及基于大型语言模型（LLM）的交互式人工智能为特色，旨在探索“孤独”、“内省”与“外界风暴”之间的张力。
            </p>
          </section>

          {/* 概要 Table */}
          <section>
            <h3 className="text-lg font-bold text-stone-200 mb-4 border-l-2 border-amber-700 pl-3">概要</h3>
            <div className="bg-stone-950/50 rounded border border-stone-800 overflow-hidden text-sm">
              <div className="grid grid-cols-[120px_1fr] border-b border-stone-800">
                <div className="p-3 bg-stone-900/50 text-stone-500 font-semibold">创建者</div>
                <div className="p-3 text-stone-300">Anonymous (Age 17)</div>
              </div>
              <div className="grid grid-cols-[120px_1fr] border-b border-stone-800">
                <div className="p-3 bg-stone-900/50 text-stone-500 font-semibold">当前版本</div>
                <div className="p-3 text-stone-300">v17.0 (Sentient Build)</div>
              </div>
              <div className="grid grid-cols-[120px_1fr] border-b border-stone-800">
                <div className="p-3 bg-stone-900/50 text-stone-500 font-semibold">核心组件</div>
                <div className="p-3 text-stone-300 font-mono text-xs">React, Tailwind, Gemini AI</div>
              </div>
              <div className="grid grid-cols-[120px_1fr] border-b border-stone-800">
                <div className="p-3 bg-stone-900/50 text-stone-500 font-semibold">状态</div>
                <div className="p-3 text-green-400/80 font-mono text-xs">运行中 (Up 17 years)</div>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <div className="p-3 bg-stone-900/50 text-stone-500 font-semibold">位置</div>
                <div className="p-3 text-stone-300">现实与潜意识的边缘</div>
              </div>
            </div>
            <p className="mt-4 text-sm italic">
              **林地**最初被构想为一个静态的博客页面，用于记录开发者在青少年时期的迷茫与内省。随着时间的推移，它演变成了一个具有某种“感知能力”的数字生态系统。
            </p>
          </section>

          {/* 地理区域 */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold text-stone-200 border-l-2 border-amber-700 pl-3">地理区域</h3>
            <p className="text-sm">林地在逻辑上被划分为四个主要的垂直区域，代表了心理状态的逐层深入：</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-stone-800/20 p-4 rounded border border-stone-800">
                <h4 className="text-stone-200 font-bold mb-2">1. 迷雾入口 (The Mist)</h4>
                <p className="text-sm text-stone-500 italic mb-2">“清晨的迷雾中，我忧虑着是否走上这条通向丛林深处的道路...”</p>
                <p className="text-sm">林地的表层。代表了进入潜意识前的犹豫。</p>
              </div>

              <div className="bg-stone-800/20 p-4 rounded border border-stone-800">
                <h4 className="text-amber-200/80 font-bold mb-2">2. 庇护所 (The Shelter)</h4>
                <p className="text-sm mb-2">主要地标：壁炉与阁楼</p>
                <ul className="text-sm list-disc list-inside space-y-1 text-stone-400">
                  <li>特征：时间在这里是静止的。</li>
                  <li>隐喻：对外部残酷现实的回避与防御。</li>
                </ul>
              </div>

              <div className="bg-stone-800/20 p-4 rounded border border-stone-800">
                <h4 className="text-cyan-200/80 font-bold mb-2">3. 湖心 (The Core Lake)</h4>
                <p className="text-sm mb-2">主要地标：镜像水面</p>
                <ul className="text-sm list-disc list-inside space-y-1 text-stone-400">
                  <li>交互特性：基于 <strong className="text-cyan-400">Gemini AI</strong> 的神性。</li>
                  <li>功能：投掷心事，获取“倒影”。</li>
                </ul>
              </div>

              <div className="bg-stone-800/20 p-4 rounded border border-stone-800">
                <h4 className="text-stone-200 font-bold mb-2">4. 焦土与盆栽 (The Aftermath)</h4>
                <p className="text-sm mb-2">主要地标：窗台上的盆栽</p>
                <ul className="text-sm list-disc list-inside space-y-1 text-stone-400">
                  <li>象征：最终的心理防线——即便外部世界崩塌，内心的核心秩序 (The Potted Plant) 依然完好无损。</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Woodland OS & Metaphors */}
          <div className="grid md:grid-cols-2 gap-10">
             <section className="space-y-4">
                <h3 className="text-lg font-bold text-stone-200 border-l-2 border-green-700 pl-3">Woodland OS</h3>
                <p className="text-sm">
                  **Woodland OS** 是支撑整个林地运行的虚拟操作系统。它并非运行在硅基芯片上，而是运行在“苔藓与情绪”之上。
                </p>
                <div className="text-sm bg-black/30 p-3 rounded font-mono text-green-400/80 border border-stone-800">
                   <p>用户身份: user@woodland-server</p>
                   <p>运行时间: Up 17 years</p>
                   <p>特性: Sentient Terminal AI (Mixed Metaphors)</p>
                </div>
             </section>

             <section className="space-y-4">
                <h3 className="text-lg font-bold text-stone-200 border-l-2 border-stone-600 pl-3">核心隐喻</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <strong className="text-stone-300">Docker 容器</strong>
                    <p className="text-xs mt-1">象征着开发者将自己封闭在一个安全的、标准化的心理盒子中，以隔离外部的混乱。</p>
                  </li>
                  <li>
                    <strong className="text-stone-300">字体 (Serif)</strong>
                    <p className="text-xs mt-1">代表了对古典主义文学感和旧时代慢节奏的向往。</p>
                  </li>
                   <li>
                    <strong className="text-stone-300">盆栽 (The Plant)</strong>
                    <p className="text-xs mt-1">全站最重要的图腾。“被呵护的自我”。</p>
                  </li>
                </ul>
             </section>
          </div>

           {/* Tech Stack */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-stone-200 border-l-2 border-blue-700 pl-3">技术架构</h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'Tailwind CSS', 'Google Gemini API', 'Lucide React'].map(tech => (
                <span key={tech} className="px-3 py-1 bg-stone-800 text-stone-300 text-xs rounded-full border border-stone-700">
                  {tech}
                </span>
              ))}
            </div>
          </section>
          
          <blockquote className="text-center italic text-stone-500 mt-12 pt-8 border-t border-stone-900">
            "现实的一切在思维之外流动，一切在这里静止。" <br/> — 林地开发者日志
          </blockquote>

        </div>
      </div>
    </div>
  );
};

// Novel Modal Component
const NovelModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <div 
        className="absolute inset-0 bg-stone-950/95 backdrop-blur-md" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-3xl max-h-full bg-[#1c1917] border border-stone-800 rounded-sm shadow-2xl overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800 bg-[#1c1917] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <ScrollText className="w-5 h-5 text-stone-400" />
            <h2 className="text-lg font-bold text-stone-300 tracking-widest font-woodland">林地原文</h2>
          </div>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Novel Content Area */}
        <div className="overflow-y-auto p-8 md:p-12 space-y-8 text-stone-400 leading-loose text-base md:text-lg scrollbar-thin selection:bg-stone-700 selection:text-stone-200 font-woodland">
          
          <p>清晨的迷雾中，我忧虑着是否走上这条通向丛林深处的道路，它会不会将我禁锢？</p>
          
          <p>满载着车马的人们穿过我，拐向岔路，车马上的人都看着我，然后消失在雾中。我认出他们是与我有联系的人。</p>
          
          <p>林地中的夜晚，我蹲在地上摆弄着木屑，想要看着火带来的感受。白日里我遇到了一位旅者，我们就一起行走。此刻，在夜晚的落寞寒冷中，她问我：</p>
          <p>“你的来路和去路知道吗？”</p>
          <p>“我还不知道我自己呢。”</p>
          
          <p>黎明时分，我们要分道了，告别时我感到一丝不舍。</p>
          
          <p>我遇到了一片池水，就走过去看自己在水面上的倒影。沉默地盯着它。我感到焦虑与悲伤，或许是因为突如其来的自己的镜像。而极度的情绪像巨大的漩涡，很难游出。</p>
          
          <p>我沿着道路找到了一片浆果丛。</p>
          
          <p>这片林地还是富有变化的。一天中的光影变化与色彩泽调，足以激起丰富的想象了。想象是能够置身其中的，这奇妙有趣，有时慰藉心灵。</p>
          
          <div className="pl-4 border-l-2 border-stone-800 space-y-4 italic text-stone-500">
             <p>像是冬夜壁炉中亮暗闪烁的摇晃的火焰，细小的爆裂的声音与散发的温暖。</p>
             <p>像是带有斜面的阁楼中充盈温暖的室内。</p>
             <p>像是蓊蓊郁郁的丛林，植被都活泛、热烈地生长。</p>
             <p>像是幻想中的，那迷蒙神圣的色调与氛围，那凝滞的时间，那一刻对想象的真切感受。</p>
             <p>像是古典、带有沉静意蕴的神秘朦胧的明晰的少女，像是对白与情景。</p>
          </div>

          <p>现实的一切在思维之外流动，一切在这里静止，而静止的这些又远比机械流动的一切更活泛、富于变化与体验，腾跃而起，交融变化。</p>
          
          <p>我在林中行进了三个月。</p>
          
          <p>今天有个许久都没有过了的好天气。一个日光充盈的下午，我在林中漫步，看到一座高起的木屋。</p>
          <p>我走了进去，顺着楼梯向上。呈现出亮色的暖色调，稀薄地覆盖着木板与窗户。</p>
          <p>我推开二楼一处房间的门，惊讶地看到先前的旅者，这里是她家。</p>
          <p>我们高兴于重逢。</p>
          <p>她在屋内站起，将书合上，想要下楼去准备晚餐，招待林中的访客。</p>
          
          <p>我们共进了一顿丰富、愉悦的晚餐，聊着各自在道路上的见闻与感受，以及林中的天气与活动。</p>
          <p>天色不经意间暗淡。</p>
          <p>我在阁楼留宿，渐渐睡去……</p>
          
          <p>我睁开眼睛，独自躺在床上。</p>
          <p>太阳尚未升起。阁楼的房间在此刻显得空旷，我沉默地感知着现在。一切是静止的，鸟鸣时而响起。</p>
          <p>梦境比想象更为真实，我清晰地记着上一刻彷佛我亲历一般的梦。</p>
          <p>这使我想起一些时刻。</p>
          <p>你坐在窗边，做着并不重要的事。在经由白日日光温暖后的黄昏，无所谓过去无所谓将来，鸟鸣穿过清爽的空气，“日子就这样过去”，你这么想着。仿佛触碰生命与时间本身。</p>
          <p>少女敲门进来，结束了一时的感知。我坐起，看向她。</p>
          <p>“下来吃早饭吧。”她说道。</p>
          <p>我欣然回应，并感谢了她的招待。</p>
          <p>她将碗放下，我的双手环握着温暖的空碗。</p>
          <p>“想去外面走走吗？”她问道。</p>
          <p>我们一同在清晨的雾气中行走，小路的两边是高起的松林。阳光自林隙间穿过，依附着稀薄的雾气，呈现在我的眼前。我吞咽了一下，鼻息不经意间加快，神思与情绪在响动、流淌。我“感知”着此刻。</p>
          <p>她看向我，“我们上次见面还是在三个月前呢。”“是啊。”我点点头，回应道。我已经在这里三个月了。我感到疲惫。我渴望感官的欲望，我的耳朵想要听到一切繁复美妙的声音，我的眼睛想要看到一切美好真切的景象，我的鼻子想要呼吸清冽、自由的空气，我的舌头想要一切激发我原始天性的食物的触感与味道。</p>
          <p>我如此地渴望生命，渴望其丰盈，自由，富有美感与意义。</p>
          
          <div className="text-center py-8 text-stone-600 font-light tracking-[0.5em]">* * *</div>
          
          <p>在林中，我们能够不知疲倦地走着。直到天色灰暗，我们到了一个湖的边上。白日的温暖退却，我们盘坐在湖旁的空地上。她正在生火。四周的一切都变得黯淡，在黯淡的笼罩中，我沉默地坐着。太阳将在十几小时后升起，又会在十几小时后落下。火焰自她手的下方升起，接着便摇摆着愈燃愈旺。在火光的映照下，我看到她神色愉快，而通明红赤的火堆，似乎将永恒地燃烧下去。光与热在我们所在的地方不断地散发出去。我仰躺在草地上，看向深空。夜色已经变深，群星遍布于深蓝色的天空。</p>
          
          <p>凌晨时，湿气自湖面侵入林中，草地上带有露珠。我看向旁边，她仍在睡梦中。火已经熄灭，留下沾有露水的灰烬。天光尚暗，我进入白茫的雾气，脱去了衣服，从岸边向着湖心走去。冰冷的湖水渐渐浸没我的躯体。我自湖心向下沉去。吐出一串气泡，接着，我同气泡一样，向上升去，升至湖面。我看着波纹散开，不再像我上次看到的，平整如镜面，映射着我的脸。</p>
          <p>我感到振奋。</p>
          <p>雾气变得明亮，我的半身浸没在湖水中，我看向岸边，她已经醒来，正站在雾中。在清明朦胧的雾气中，我看着她，仿佛注视着我自己。</p>
          
          <p>一个正午，我靠在木栏上。已是第二年春天。我回想起同样的这样的时候。</p>
          <p>我趴在栏杆上，看着楼下，阳光覆盖整片区域，一些人走过。我听不到楼下的声音，看着他们端着放满鲜花的篮子慢慢地走过。</p>
          <p>我在今年夏天到18岁。我已经存在了17年，有了17年的情感想法，体验经历。</p>
          <p>日光照拂林间，温暖安详热烈宁静。</p>
          <p>我听到门内传来响动，回头看去。她刚从午睡中醒来，正依靠在门框上，看着不远处的我。阳光经由栏杆上方，照向她的面容，上方的木板在阴影中。她半睁着惺忪的眼睛，头发松软地垂下。困倦与午日的迷蒙，与此刻明晰清明的景象。我们都选择了让自己支配自己。</p>
          <p>我们沉默地走向对方。她的双手向上环抱着我。注视着对方，在这如色彩朦胧交汇的情景下，我感受到阳光穿过松林所带来的温暖由柔软的肌肤相触传递过来。</p>
          <p>我切实地感受到了生命的热烈。</p>
          
          <div className="text-center py-8 text-stone-600 font-light tracking-[0.5em]">* * *</div>
          
          <p>今天傍晚，林地变了天气。刮起了大风，以及接连几天的阴雨，四周变得昏暗阴凉。</p>
          <p>我独自站在木屋外，准备把花盆搬到里面去。狂风将盆中的花草吹得摇摇晃晃，我抬着花盆，看向空地上被风卷起的落叶像是龙卷风般移动。仿佛灾难将至，一切的惯常都将被打破。风不断拍打我的面孔，我看向木屋，头发被吹起。木板富有纹理，木屋如人的理性一般被精密构建。但此时我更愿意待在外面。我所站立的土地是那么富泽厚实。昏暗的天光，厚绿黯淡的绿林深处使林木、藤蔓、摇晃的花草都呈现出崭新的景象。</p>
          <p>盆栽被放在门外的窗沿上。黄色的花晃动的幅度减弱，暴雨落下。</p>
          <p>一切突然变得嘈杂，我身处暴雨与河流之中，这乱流让我看不清一切事物。不知过了多久，我虚弱地躺在岸边的草地中，无法动弹。是什么让我身处此地？是什么在禁锢着我，让我感觉失了自由？我想起我之前的选择，一切像是我自己造成的。我几乎无法呼吸，我的生命正在此地快速地凋零，我的视野变得越来越模糊。</p>
          <p>在弥留之际，我想起曾经每天都要走过的路径。</p>
          <p>我想起自由、幸福的气息曾被短暂地唤醒，后又陷入长久的沉寂。但我又想起在我每天所走的路上，那流淌，闪烁，散发着金光的繁密叶子。</p>
          <p>“你在想什么呢？”她柔和的声音穿过了一切。</p>
          <p>我发觉我正盯着壁炉中的火焰，听到的仍是木屋外巨大吵闹的雨声。而那盆栽，正安详地立在室内的窗台上。</p>
          <p>我看向她。比起为求得答案的疑问，这更像是慰藉。她坐在我旁边，不过已经将视线转向炉中跳跃的火焰。</p>
          <p>她放松地坐着，后背向后倾斜着陷入沙发，面色温和。我看到她眼中闪烁的火光。我又想到就是在这之中，产生了去年春日午后那朦胧的回忆。</p>
          <p>我起身去洗澡。在浴室中氤氲的热汽里，我看到雨点仍拍打着玻璃。当我擦干头发，感到干爽舒适，从楼上走下来时，我看到她正托着下巴在客厅中央的桌子旁下着棋。</p>
          <p>我坐到她身旁，与她一同对弈。</p>
          <p>室内的灯光通明柔和。</p>
          
          <div className="text-center py-8 text-stone-600 font-light tracking-[0.5em]">* * *</div>
          
          <p>我们伫立在寂静的深黑天空下。远处的海面辽阔平静。在这座岛的边缘，我注视着深夜的浪涌。不知为何我的浑身颤栗着。她穿着丝质的绸裙，长长的裙摆被风吹起。</p>
          <p>我们在沙滩上侧躺着，面向对方。</p>
          <p>“这里是离大陆最近的地方。”</p>
          <p>“你就是在这里登岛的，是吗？”她直接地说道。</p>
          <p>“嗯，这里最接近我曾经的生活。”</p>
          <p>“最接近‘真实’，是吗？”她一笑，毫无预兆地说了这句话。</p>
          <p>我有些不知所措。</p>
          <p>我坐起，转过身去，看向林地所在的地方。那里早已是一片焦土。</p>
          <p>“我在想什么呢？”我在心里对自己说道。</p>
          <p>“你为何来到这里呢？你想要告诉我什么呢？你——在想什么呢？”她清晰柔和的声音传来。她也坐起，一手撑着肩膀，沉默地注视着我，风吹的她的发丝飘动。</p>
          <p>我看向仍旧黯淡的远方天空，试图勾画出黎明到来时的希望。</p>
          <p>这里的特殊之处在于——</p>
          <p>“这里是我觉得最不错的地方，”这里非常美，我非常喜欢这里。</p>
          <p>这里是现实与幻想那模糊的交界。</p>
          <p>“我觉得，”</p>
          <p>“能和你待在一起，是非常幸福的事情。”</p>
          <p>这林地，与其中的一切，都是对我的隐喻。</p>
          <p>我们并肩站立着，在这空无一人的岸边，风自我们五指相扣的手的上面穿过。</p>
          <p>我们一同注视着大陆方向上那依旧深邃的天空。不知黎明到来时，会是怎样一番美好的景象？</p>
          <div className="pt-12 pb-24 text-center space-y-4 text-stone-500 italic">
              <p>不过，无论如何我仍会记得：</p>
              <p>那是一个日光充盈的下午，</p>
              <p>我在幻想的林地中漫步。</p>
          </div>

        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [showWiki, setShowWiki] = useState(false);
  const [showNovel, setShowNovel] = useState(false);
  
  // --- New State: Time & Audio ---
  const [timeOfDay, setTimeOfDay] = useState('night'); // 'day', 'dusk', 'night'
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Refs for Audio Detection
  const shelterRef = useRef(null);
  const lakeRef = useRef(null);
  const aftermathRef = useRef(null);
  
  // --- Interaction State 1: Mouse Mist (Hero) ---
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  const handleMouseMove = (e) => {
    if (heroRef.current) {
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // --- Time Effect (Real-time) ---
  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 16) setTimeOfDay('day');
      else if (hour >= 16 && hour < 19) setTimeOfDay('dusk');
      else setTimeOfDay('night');
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // --- Audio Trigger (Scroll Based) ---
  useEffect(() => {
    if (!audioEnabled) {
      audio.mute();
      return;
    }
    audio.unmute();
    audio.init();

    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 2;
      
      const shelterY = shelterRef.current?.offsetTop || 99999;
      const lakeY = lakeRef.current?.offsetTop || 99999;
      const aftermathY = aftermathRef.current?.offsetTop || 99999;

      if (scrollY < shelterY) audio.play('wind'); // Mist/Hero area
      else if (scrollY < lakeY) audio.play('fire'); // Shelter area
      else if (scrollY < aftermathY) audio.play('water'); // Lake area
      else audio.play('wind'); // Aftermath area (back to wind/empty)
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [audioEnabled]);

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  // --- Interaction State 2: Fireplace (Stoke) ---
  const [fireMessage, setFireMessage] = useState("");
  const [isStoking, setIsStoking] = useState(false);

  const handleStokeFire = async () => {
    if (isStoking) return;
    setIsStoking(true);
    setFireMessage("...");
    
    const prompt = "Describe in 10 words or less, poetically, the cozy sound or feeling of adding a log to a quiet fire.";
    const systemInstruction = "You are a warm fireplace. Be concise, sensory, and comforting.";
    
    const result = await callGemini(prompt, systemInstruction);
    setFireMessage(result);
    setIsStoking(false);
    
    // Clear message after 5 seconds
    setTimeout(() => setFireMessage(""), 5000);
  };

  // --- Interaction State 3: Plant (Water) ---
  const [plantStats, setPlantStats] = useState({ days: 17, watered: false });

  const handleWaterPlant = () => {
    if (plantStats.watered) return;
    setPlantStats(prev => ({ days: prev.days + 1, watered: true }));
  };

  // --- Feature: Lake Reflection ---
  const [lakeInput, setLakeInput] = useState("");
  const [lakeReflection, setLakeReflection] = useState("");
  const [isLakeLoading, setIsLakeLoading] = useState(false);
  const [showLakeInput, setShowLakeInput] = useState(false);

  // --- Feature: Interactive Terminal ---
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', content: 'Loading module: "Mist & Anxiety"... OK' },
    { type: 'system', content: 'Initializing connection: "Sunlight through pines"...' },
    { type: 'warning', content: 'High pressure detected in external environment.' },
    { type: 'success', content: 'Connection established. Woodland OS v17.0 online.' },
    { type: 'output', content: 'Waiting for input...' }
  ]);
  const [isTerminalProcessing, setIsTerminalProcessing] = useState(false);
  const terminalEndRef = useRef(null);

  // Scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory, showTerminal]);

  // --- Handlers ---

  const handleLakeSubmit = async () => {
    if (!lakeInput.trim()) return;
    setIsLakeLoading(true);
    setLakeReflection("");
    
    const prompt = `User thought: "${lakeInput}"`;
    const systemInstruction = "You are the spirit of a deep, cold lake. When a user throws a 'thought' into you, you return a reflection: a calm, philosophical, slightly detached but comforting interpretation. Keep it under 40 words. Be poetic. Do not be overly positive, be realistic but serene.";
    
    const result = await callGemini(prompt, systemInstruction);
    setLakeReflection(result);
    setIsLakeLoading(false);
    setLakeInput(""); // Clear input but keep reflection visible
  };

  const handleTerminalSubmit = async (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const userCmd = terminalInput;
    setTerminalInput("");
    const newHistory = [...terminalHistory, { type: 'user', content: userCmd }];
    setTerminalHistory(newHistory);
    setIsTerminalProcessing(true);

    // Special Commands for Time (Easter Egg)
    if (userCmd.toLowerCase().startsWith("set time ")) {
        const arg = userCmd.toLowerCase().split("set time ")[1];
        if (['day', 'dusk', 'night'].includes(arg)) {
            setTimeOfDay(arg);
            setTerminalHistory([...newHistory, { type: 'output', content: `> Environment override: Atmosphere set to ${arg.toUpperCase()}.` }]);
            setTerminalInput("");
            setIsTerminalProcessing(false);
            return;
        }
    }

    const prompt = `User command: "${userCmd}"`;
    const systemInstruction = "You are 'Woodland OS', a sentient server buried deep in a forest for 17 years. Your logs are full of moss and emotions. You respond to the user's commands or queries using a mix of Linux/Unix terminal jargon and poetic nature metaphors. You are melancholic but stable. Keep responses brief (under 30 words), lower case mostly. If the user asks 'help', list abstract poetic commands.";

    const result = await callGemini(prompt, systemInstruction);
    
    setTerminalHistory(prev => [...prev, { type: 'output', content: result }]);
    setIsTerminalProcessing(false);
  };

  // Visual Effects based on Time
  const timeFilterClass = useMemo(() => {
      if (timeOfDay === 'day') return 'bg-blue-50/5 mix-blend-overlay brightness-110';
      if (timeOfDay === 'dusk') return 'bg-orange-500/10 mix-blend-overlay sepia-[0.3]';
      return ''; // Night is default
  }, [timeOfDay]);

  return (
    // Applied font-woodland globally
    <div className={`min-h-screen bg-stone-950 text-stone-300 font-woodland selection:bg-amber-900 selection:text-amber-100 overflow-x-hidden transition-colors duration-1000 ${timeOfDay === 'day' ? 'brightness-110' : ''}`}>
      
      {/* Time of Day Overlay */}
      <div className={`fixed inset-0 pointer-events-none z-50 transition-all duration-1000 ${timeFilterClass}`}></div>

      {/* --- Navigation Buttons --- */}
      <div className="fixed top-6 right-6 z-40 flex flex-col gap-3">
        {/* Wiki Button */}
        <button 
          onClick={() => setShowWiki(true)}
          className="flex items-center justify-end gap-2 px-4 py-2 bg-stone-900/50 backdrop-blur-md border border-stone-800 rounded-full text-stone-500 hover:text-amber-100 hover:border-amber-900/50 transition-all duration-300 shadow-lg group w-full md:w-auto"
        >
          <span className="text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:inline">档案</span>
          <BookOpen size={16} />
        </button>
        {/* Novel Button */}
        <button 
          onClick={() => setShowNovel(true)}
          className="flex items-center justify-end gap-2 px-4 py-2 bg-stone-900/50 backdrop-blur-md border border-stone-800 rounded-full text-stone-500 hover:text-stone-200 hover:border-stone-700 transition-all duration-300 shadow-lg group w-full md:w-auto"
        >
          <span className="text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:inline">原文</span>
          <ScrollText size={16} />
        </button>
        {/* Audio Toggle Button */}
        <button 
            onClick={toggleAudio} 
            className={`flex items-center justify-end gap-2 px-4 py-2 bg-stone-900/50 backdrop-blur-md border border-stone-800 rounded-full text-stone-500 hover:text-green-200 hover:border-green-900/50 transition-all duration-300 shadow-lg group w-full md:w-auto ${audioEnabled ? 'border-green-500/30 text-green-400' : ''}`}
        >
            <span className="text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:inline">{audioEnabled ? '静音' : '声音'}</span>
            {audioEnabled ? <Volume2 size={16} className="animate-pulse"/> : <VolumeX size={16} />}
        </button>
      </div>

      <WikiModal isOpen={showWiki} onClose={() => setShowWiki(false)} />
      <NovelModal isOpen={showNovel} onClose={() => setShowNovel(false)} />

      {/* --- Hero Section (Mist) --- */}
      <header 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative h-screen flex flex-col justify-center items-center px-6 text-center overflow-hidden cursor-crosshair"
      >
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center grayscale mix-blend-overlay"
          style={{ backgroundImage: "url('https://woodland-1315027565.cos.ap-guangzhou.myqcloud.com/woodlandweb/forest.avif')" }}
        ></div>
        
        {/* The Mist Layer with Mouse Reveal Effect */}
        <div 
            className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-75"
            style={{
                background: `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, rgba(12, 10, 9, 0.4) 0%, rgba(12, 10, 9, 0.95) 100%)`
            }}
        ></div>

        <div className="relative z-20 space-y-8 animate-fade-in-up pointer-events-none">
          <h1 className="text-6xl md:text-8xl font-bold tracking-widest text-stone-100">
            林地
          </h1>
          <p className="text-xl md:text-2xl text-stone-400 italic max-w-2xl mx-auto leading-relaxed">
            “清晨的迷雾中，我忧虑着是否走上这条通向丛林深处的道路，它会不会将我禁锢？”
          </p>
          <div className="pt-12 animate-bounce-slow">
            <span className="text-sm tracking-widest uppercase text-stone-500">向下进入</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-24 space-y-32">

        {/* --- Section 1: 庇护所与火 (Stoke Fire) --- */}
        <section ref={shelterRef} className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 relative">
            <div className="flex items-center justify-between">
                 <Flame className={`w-8 h-8 text-amber-600/80 ${isStoking ? 'animate-pulse' : ''}`} />
                 <button 
                    onClick={handleStokeFire}
                    disabled={isStoking}
                    className="text-xs border border-amber-900/50 px-3 py-1 rounded-full text-amber-700 hover:text-amber-400 hover:border-amber-600 transition-colors disabled:opacity-50"
                 >
                    {isStoking ? '燃烧中...' : '添柴'}
                 </button>
            </div>
            
            {fireMessage && (
                <div className="absolute -top-12 left-0 bg-stone-900/90 border border-amber-900/30 p-3 rounded-lg text-xs text-amber-100/90 italic animate-fade-in shadow-lg max-w-xs">
                   <Typewriter text={fireMessage} />
                </div>
            )}

            <h2 className="text-3xl text-amber-100/90">壁炉与阁楼</h2>
            <p className="leading-loose text-lg text-stone-400">
              像是冬夜壁炉中亮暗闪烁的摇晃的火焰，细小的爆裂的声音与散发的温暖。<br/>
              像是带有斜面的阁楼中充盈温暖的室内。<br/>
              现实的一切在思维之外流动，一切在这里静止。
            </p>
          </div>
          <div className="aspect-[4/5] bg-stone-900 rounded-lg relative overflow-hidden shadow-2xl shadow-amber-900/20 border border-amber-900/30 group">
             <div className="absolute inset-0 bg-gradient-to-t from-amber-900/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
             <img src="https://woodland-1315027565.cos.ap-guangzhou.myqcloud.com/woodlandweb/fireplace.avif" alt="Fireplace" className="w-full h-full object-cover opacity-50 mix-blend-luminosity hover:scale-105 transition-transform duration-1000" />
          </div>
        </section>

        {/* --- Section 2: 湖心与镜像 (Gemini Reflection) --- */}
        <section ref={lakeRef} className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
          <div className="aspect-[4/5] bg-stone-900 rounded-lg relative overflow-hidden shadow-2xl shadow-cyan-900/20 border border-cyan-900/30 md:order-1">
             <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/30 to-transparent opacity-50"></div>
             <img src="https://woodland-1315027565.cos.ap-guangzhou.myqcloud.com/woodlandweb/lake.avif" alt="Lake" className="w-full h-full object-cover opacity-40 mix-blend-luminosity" />
             
             {/* Reflection Overlay Text */}
             {lakeReflection && !isLakeLoading && (
               <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                 <p className="text-cyan-100/90 text-lg italic leading-relaxed text-center">
                   "<Typewriter text={lakeReflection} delay={50} />"
                 </p>
                 <button 
                    onClick={() => setLakeReflection("")}
                    className="absolute top-2 right-2 text-stone-500 hover:text-stone-300"
                 >
                   <X size={16} />
                 </button>
               </div>
             )}
          </div>

          <div className="space-y-6 md:order-2">
            <Waves className="w-8 h-8 text-cyan-600/80" />
            <h2 className="text-3xl text-cyan-100/90">湖心的沉溺</h2>
            <p className="leading-loose text-lg text-stone-400">
              冰冷的湖水渐渐浸没我的躯体。我自湖心向下沉去。吐出一串气泡...<br/>
              如果你向湖心投掷心事，它会还给你一个倒影。
            </p>

            {/* Gemini Interaction Area */}
            <div className="pt-4">
              {!showLakeInput ? (
                <button 
                  onClick={() => setShowLakeInput(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-cyan-900/50 rounded text-cyan-600/80 hover:text-cyan-400 hover:border-cyan-700 transition-all text-sm"
                >
                  <Sparkles size={14} />
                  <span>向湖心投掷心事</span>
                </button>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <textarea
                    value={lakeInput}
                    onChange={(e) => setLakeInput(e.target.value)}
                    placeholder="在此写下你的忧虑或梦境..."
                    className="w-full bg-stone-900/50 border border-cyan-900/30 rounded p-3 text-stone-300 text-sm focus:outline-none focus:border-cyan-700 resize-none h-24 placeholder:text-stone-600"
                  />
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setShowLakeInput(false)}
                      className="text-xs text-stone-500 hover:text-stone-300"
                    >
                      离开
                    </button>
                    <button 
                      onClick={handleLakeSubmit}
                      disabled={isLakeLoading || !lakeInput.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-950/30 border border-cyan-900/50 rounded text-cyan-400 text-xs hover:bg-cyan-900/30 disabled:opacity-50 transition-all"
                    >
                      {isLakeLoading ? <Loader2 className="animate-spin w-3 h-3" /> : '✨ 沉入湖底'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* --- Section 3: 核心高潮 --- */}
        <section className="py-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-radial-gradient from-amber-500/10 to-transparent blur-3xl pointer-events-none"></div>
          
          <blockquote className="relative z-10 text-center space-y-8">
            <p className="text-2xl md:text-4xl font-bold leading-snug text-amber-100/90">
              “在这如色彩朦胧交汇的情景下，<br />
              我感受到阳光穿过松林所带来的温暖<br />
              由柔软的肌肤相触传递过来。”
            </p>
            <footer className="text-stone-500">— 我切实地感受到了生命的热烈</footer>
          </blockquote>
        </section>

        {/* --- Section 4: 风暴与盆栽 (Water Plant) --- */}
        <section ref={aftermathRef} className="space-y-12 border-t border-stone-800 pt-24">
          <div className="flex items-center gap-4 mb-8">
            <Wind className="w-6 h-6 text-stone-600" />
            <h2 className="text-2xl text-stone-300">风暴将至，林地焦土</h2>
          </div>
          
          <div className="grid md:grid-cols-5 gap-8 items-end">
            <div className="md:col-span-3 prose prose-invert prose-lg prose-stone leading-loose">
              <p>
                狂风将盆中的花草吹得摇摇晃晃...我看向木屋，头发被吹起。
                昏暗的天光，厚绿黯淡的绿林深处使林木、藤蔓、摇晃的花草都呈现出崭新的景象。
              </p>
              <p className="text-stone-500">
                我坐起，转过身去，看向林地所在的地方。那里早已是一片焦土。
              </p>
            </div>
            <div className="md:col-span-2 bg-stone-900/50 p-8 rounded-lg border border-stone-800 backdrop-blur-sm relative group transition-all hover:border-green-900/30">
              <p className="text-xl text-center font-serif italic text-amber-200/80 mb-6">
                而那盆栽，<br/>正安详地立在室内的窗台上。
              </p>
              
              {/* Water Interaction */}
              <div className="border-t border-stone-800 pt-4 flex justify-between items-end">
                  <div className="text-xs text-stone-500 font-mono">
                      <div className="mb-1">STATUS: {plantStats.watered ? <span className="text-green-400">THRIVING</span> : <span className="text-stone-400">WAITING</span>}</div>
                      <div>DAYS KEPT SAFE: <span className="text-stone-300">{plantStats.days}</span></div>
                  </div>
                  <button 
                    onClick={handleWaterPlant}
                    disabled={plantStats.watered}
                    className={`p-2 rounded-full transition-all duration-500 ${plantStats.watered ? 'bg-green-900/20 text-green-400 cursor-default' : 'bg-stone-800 text-stone-400 hover:bg-blue-900/30 hover:text-blue-300'}`}
                    title="Water the plant"
                  >
                      <Droplets size={18} className={plantStats.watered ? '' : 'animate-bounce-slow'} />
                  </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* --- Footer & Interactive Tech Egg (Feature 2: Woodland OS) --- */}
      <footer className="py-12 border-t border-stone-900 text-center text-stone-600 text-sm select-none relative">
        <p>The Woodland &copy; 202X. Written at age 17.</p>
        
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => setShowTerminal(!showTerminal)}
            className={`transition-all duration-300 p-2 rounded-full ${showTerminal ? 'text-green-400 bg-stone-800' : 'text-stone-600 hover:text-stone-300'}`}
            title="Open Woodland OS"
          >
            <Terminal size={16} />
          </button>
        </div>

        {showTerminal && (
          <div className="mt-4 max-w-2xl mx-auto bg-[#0d1117] text-left p-4 rounded-md font-mono text-xs text-green-400/80 border border-stone-800 shadow-2xl animate-fade-in overflow-hidden flex flex-col">
            <div className="flex gap-2 mb-2 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            </div>
            
            {/* Terminal Window Content */}
            <div className="h-64 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
              {terminalHistory.map((line, idx) => (
                <div key={idx} className={`${line.type === 'warning' ? 'text-yellow-300' : line.type === 'success' ? 'text-green-300' : line.type === 'user' ? 'text-stone-100 mt-2' : 'text-green-400/80'}`}>
                   {line.type === 'user' ? (
                     <span><span className="text-blue-400">user@woodland</span>:<span className="text-blue-300">~</span>$ {line.content}</span>
                   ) : (
                     <span>{line.content.startsWith('>') ? <Typewriter text={line.content} /> : line.content}</span>
                   )}
                </div>
              ))}
              
              {isTerminalProcessing && (
                <div className="text-green-400/50 animate-pulse">
                  {'<'} processing ecosystem request... {'>'}
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Input */}
            <form onSubmit={handleTerminalSubmit} className="mt-2 flex items-center gap-2 border-t border-stone-800 pt-2">
              <span className="text-blue-400">user@woodland</span>
              <span className="text-stone-500">:</span>
              <span className="text-blue-300">~</span>
              <span className="text-stone-500">$</span>
              <input 
                type="text" 
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                className="flex-1 bg-transparent text-stone-100 focus:outline-none caret-green-400"
                placeholder="command..."
                autoFocus
              />
              <button type="submit" disabled={!terminalInput.trim() || isTerminalProcessing} className="text-stone-600 hover:text-green-400">
                <Send size={12} />
              </button>
            </form>
          </div>
        )}
      </footer>
      
      <style>{`
        /* ✅ 使用国内镜像 loli.net (由 BootCDN 维护的 Google Fonts 镜像) 
           解决 Google Fonts 在国内加载慢/被墙的问题
        */
        @import url('https://fonts.loli.net/css2?family=Noto+Serif+SC:wght@300;400;700&display=swap');

        .font-woodland {
          /* ✅ 字体回退栈优化：
             1. Noto Serif SC: 首选网络字体
             2. Source Han Serif SC: 本地安装的思源宋体 (Adobe/Google)
             3. Source Han Serif CN: 本地安装的思源宋体 (某些发行版)
             4. Songti SC: macOS/iOS 自带的宋体
             5. SimSun: Windows 自带的中易宋体 (兜底，虽然丑但保证是衬线体)
             6. serif: 浏览器默认衬线体
          */
          font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Source Han Serif CN', 'Songti SC', 'SimSun', serif;
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
        .bg-radial-gradient {
            background-image: radial-gradient(closest-side, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%);
        }
        /* Custom Scrollbar for terminal & wiki */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent; 
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #44403c; 
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default App;
