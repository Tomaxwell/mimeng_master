class TitleGenerator {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.currentFile = null;
        this.currentTab = 'file';
        this.sessions = JSON.parse(localStorage.getItem('titleSessions') || '[]');
        this.currentSessionId = null;
        this.loadSessions();
    }

    initElements() {
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.fileInfo = document.getElementById('file-info');
        this.removeFileBtn = document.getElementById('remove-file');
        this.urlInput = document.getElementById('url-input');
        this.textInput = document.getElementById('text-input');
        this.generateBtn = document.getElementById('generate-btn');
        this.resultSection = document.getElementById('result-section');
        this.titlesContainer = document.getElementById('titles-container');
        this.generateAgainBtn = document.getElementById('generate-again-btn');
        this.toast = document.getElementById('toast');
        
        // 侧边栏元素
        this.newSessionBtn = document.getElementById('new-session-btn');
        this.sessionList = document.getElementById('session-list');
        this.currentSession = document.getElementById('current-session');
    }

    bindEvents() {
        // Tab切换
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // 文件上传相关
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.uploadArea.addEventListener('dragleave', () => this.uploadArea.classList.remove('dragover'));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.removeFileBtn.addEventListener('click', () => this.removeFile());

        // 生成按钮
        this.generateBtn.addEventListener('click', () => this.generateTitles());
        this.generateAgainBtn.addEventListener('click', () => this.generateTitles());
        
        // 会话管理
        this.newSessionBtn.addEventListener('click', () => this.createNewSession());
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // 更新tab按钮状态
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 更新tab内容显示
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        // 检查文件类型
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown'
        ];
        
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            this.showToast('不支持的文件格式，请上传PDF、Word、TXT或Markdown文件', 'error');
            return;
        }

        // 检查文件大小（限制为10MB）
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('文件大小不能超过10MB', 'error');
            return;
        }

        this.currentFile = file;
        this.showFileInfo(file);
    }

    showFileInfo(file) {
        const fileName = file.name;
        const fileSize = this.formatFileSize(file.size);
        
        this.fileInfo.querySelector('.file-name').textContent = fileName;
        this.fileInfo.querySelector('.file-size').textContent = fileSize;
        
        this.uploadArea.style.display = 'none';
        this.fileInfo.style.display = 'flex';
    }

    removeFile() {
        this.currentFile = null;
        this.fileInput.value = '';
        this.uploadArea.style.display = 'block';
        this.fileInfo.style.display = 'none';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async generateTitles() {
        let content = '';
        let sessionTitle = '新会话';
        
        try {
            // 根据当前tab获取内容
            if (this.currentTab === 'file') {
                if (!this.currentFile) {
                    this.showToast('请先选择文件', 'error');
                    return;
                }
                content = await this.extractFileContent(this.currentFile);
                sessionTitle = await this.getFileSessionTitle(this.currentFile, content);
            } else if (this.currentTab === 'url') {
                const url = this.urlInput.value.trim();
                if (!url) {
                    this.showToast('请输入文章链接', 'error');
                    return;
                }
                content = await this.fetchUrlContent(url);
                sessionTitle = await this.getUrlSessionTitle(url);
            } else if (this.currentTab === 'text') {
                content = this.textInput.value.trim();
                if (!content) {
                    this.showToast('请输入文章内容', 'error');
                    return;
                }
                sessionTitle = this.getTextSessionTitle(content);
            }

            if (!content || content.length < 50) {
                this.showToast('内容太短，请提供至少50个字符的内容', 'error');
                return;
            }

            this.setLoading(true);
            const titles = await this.callTitleGenerationAPI(content);
            
            if (!titles || titles.length === 0) {
                throw new Error('未能生成有效标题，请稍后重试');
            }
            
            this.displayTitles(titles);
            this.saveSessionResults(titles);
            this.updateSessionTitle(sessionTitle);
            this.saveSession();
            this.resultSection.style.display = 'block';
            this.resultSection.scrollIntoView({ behavior: 'smooth' });
            this.showToast(`成功生成${titles.length}个标题`, 'success');
            
        } catch (error) {
            console.error('生成标题失败:', error);
            let errorMessage = '生成标题失败';
            
            // 根据不同的错误类型显示不同的提示
            if (error.message.includes('API密钥')) {
                errorMessage = '配置错误，请联系管理员';
            } else if (error.message.includes('内容太短')) {
                errorMessage = '内容太短，请提供更多内容';
            } else if (error.message.includes('网络')) {
                errorMessage = '网络连接失败，请稍后重试';
            } else if (error.message.includes('超时')) {
                errorMessage = '请求超时，请稍后重试';
            } else {
                errorMessage = error.message || '生成标题失败，请稍后重试';
            }
            
            this.showToast(errorMessage, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async extractFileContent(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/extract-content', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('文件解析失败');
        }
        
        const result = await response.json();
        return result.content;
    }

    async fetchUrlContent(url) {
        const response = await fetch('/api/fetch-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        
        if (!response.ok) {
            throw new Error('链接内容获取失败');
        }
        
        const result = await response.json();
        return result.content;
    }

    async callTitleGenerationAPI(content) {
        const response = await fetch('/api/generate-titles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: '服务器错误' }));
            throw new Error(errorData.error || `HTTP错误 ${response.status}`);
        }
        
        const result = await response.json();
        return result.titles;
    }

    displayTitles(titles) {
        this.titlesContainer.innerHTML = '';
        
        titles.forEach((titleData, index) => {
            const titleElement = this.createTitleElement(titleData, index + 1);
            this.titlesContainer.appendChild(titleElement);
        });
    }

    createTitleElement(titleData, rank) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'title-item';
        
        titleDiv.innerHTML = `
            <div class="title-header">
                <span class="title-rank">${rank}</span>
                <div class="title-text">${titleData.title}</div>
                <span class="copy-icon" title="点击复制标题">📋</span>
            </div>
            <div class="title-method">${titleData.method}</div>
            <div class="title-analysis">${titleData.analysis}</div>
        `;
        
        // 添加点击复制功能
        const copyIcon = titleDiv.querySelector('.copy-icon');
        const titleElement = titleDiv.querySelector('.title-text');
        
        const copyHandler = (e) => {
            e.stopPropagation();
            this.copyTitle(titleData.title, titleDiv);
        };
        
        copyIcon.addEventListener('click', copyHandler);
        titleElement.addEventListener('click', copyHandler);
        
        return titleDiv;
    }

    copyTitle(title, titleElement) {
        navigator.clipboard.writeText(title).then(() => {
            this.showToast('标题已复制到剪贴板', 'success');
            
            // 添加复制成功的视觉反馈
            if (titleElement) {
                titleElement.classList.add('copied');
                setTimeout(() => {
                    titleElement.classList.remove('copied');
                }, 1000);
            }
        }).catch(() => {
            // 备用复制方法
            const textArea = document.createElement('textarea');
            textArea.value = title;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.showToast('标题已复制到剪贴板', 'success');
                if (titleElement) {
                    titleElement.classList.add('copied');
                    setTimeout(() => {
                        titleElement.classList.remove('copied');
                    }, 1000);
                }
            } catch (err) {
                this.showToast('复制失败，请手动选择文本复制', 'error');
            }
            document.body.removeChild(textArea);
        });
    }

    setLoading(isLoading) {
        this.generateBtn.disabled = isLoading;
        const btnText = this.generateBtn.querySelector('.btn-text');
        const loading = this.generateBtn.querySelector('.loading');
        
        if (isLoading) {
            btnText.style.display = 'none';
            loading.style.display = 'inline';
        } else {
            btnText.style.display = 'inline';
            loading.style.display = 'none';
        }
    }

    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    // 会话管理方法
    loadSessions() {
        this.renderSessionList();
        if (this.sessions.length === 0) {
            this.createNewSession();
        } else {
            this.currentSessionId = this.sessions[0].id;
            this.loadSession(this.currentSessionId);
        }
    }

    createNewSession() {
        const sessionId = 'session_' + Date.now();
        const newSession = {
            id: sessionId,
            title: '新会话',
            content: '',
            results: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.sessions.unshift(newSession);
        this.currentSessionId = sessionId;
        this.saveSessionsToStorage();
        this.renderSessionList();
        this.clearContent();
        this.resultSection.style.display = 'none';
    }

    loadSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        this.currentSessionId = sessionId;
        
        // 加载会话内容
        if (session.content) {
            this.textInput.value = session.content;
            this.switchTab('text');
        }
        
        // 加载会话结果
        if (session.results && session.results.length > 0) {
            this.displayTitles(session.results);
            this.resultSection.style.display = 'block';
        } else {
            this.resultSection.style.display = 'none';
        }
        
        this.renderSessionList();
    }

    saveSession() {
        if (!this.currentSessionId) return;
        
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (!session) return;
        
        // 更新会话内容
        let content = '';
        if (this.currentTab === 'text') {
            content = this.textInput.value.trim();
        } else if (this.currentTab === 'url') {
            content = this.urlInput.value.trim();
        }
        
        session.content = content;
        session.updatedAt = new Date().toISOString();
        
        // 如果有标题，更新会话标题
        if (content) {
            const shortTitle = content.substring(0, 20) + (content.length > 20 ? '...' : '');
            session.title = shortTitle || '新会话';
        }
        
        this.saveSessionsToStorage();
        this.renderSessionList();
    }

    saveSessionResults(titles) {
        if (!this.currentSessionId) return;
        
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (!session) return;
        
        session.results = titles;
        session.updatedAt = new Date().toISOString();
        this.saveSessionsToStorage();
    }

    renderSessionList() {
        // 渲染历史会话
        this.sessionList.innerHTML = '';
        
        const historySessions = this.sessions.filter(s => s.id !== this.currentSessionId);
        
        historySessions.forEach(session => {
            const sessionElement = this.createSessionElement(session);
            this.sessionList.appendChild(sessionElement);
        });
        
        // 渲染当前会话
        const currentSession = this.sessions.find(s => s.id === this.currentSessionId);
        if (currentSession) {
            this.currentSession.innerHTML = '';
            const currentElement = this.createSessionElement(currentSession, true);
            this.currentSession.appendChild(currentElement);
        }
    }

    createSessionElement(session, isCurrent = false) {
        const sessionDiv = document.createElement('div');
        sessionDiv.className = `session-item ${isCurrent ? 'active' : ''}`;
        sessionDiv.dataset.sessionId = session.id;
        
        const timeAgo = this.formatTimeAgo(new Date(session.updatedAt));
        
        sessionDiv.innerHTML = `
            <div class="session-title">${session.title}</div>
            <div class="session-time">${timeAgo}</div>
        `;
        
        if (!isCurrent) {
            sessionDiv.addEventListener('click', () => this.loadSession(session.id));
        }
        
        return sessionDiv;
    }

    formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;
        return date.toLocaleDateString('zh-CN');
    }

    saveSessionsToStorage() {
        localStorage.setItem('titleSessions', JSON.stringify(this.sessions));
    }

    clearContent() {
        this.textInput.value = '';
        this.urlInput.value = '';
        this.removeFile();
        this.titlesContainer.innerHTML = '';
    }

    // 会话标题生成方法
    async getFileSessionTitle(file, content) {
        try {
            // 获取文件第一行作为标题
            const firstLine = content.split('\n')[0].trim();
            if (firstLine && firstLine.length > 0) {
                return firstLine.substring(0, 40) + (firstLine.length > 40 ? '...' : '');
            }
            // 如果第一行为空，使用文件名
            return file.name.replace(/\.[^/.]+$/, "").substring(0, 40);
        } catch (error) {
            return file.name.replace(/\.[^/.]+$/, "").substring(0, 40);
        }
    }

    async getUrlSessionTitle(url) {
        try {
            // 尝试获取网页标题
            const response = await fetch('/api/get-page-title', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.title) {
                    return result.title.substring(0, 40) + (result.title.length > 40 ? '...' : '');
                }
            }
            
            // 备用方案：从URL中提取域名
            const urlObj = new URL(url);
            return urlObj.hostname + urlObj.pathname.substring(0, 20);
        } catch (error) {
            // 如果获取失败，使用URL的域名
            try {
                const urlObj = new URL(url);
                return urlObj.hostname;
            } catch {
                return '链接内容';
            }
        }
    }

    getTextSessionTitle(content) {
        // 获取文本第一行的前40个字符
        const firstLine = content.split('\n')[0].trim();
        if (firstLine && firstLine.length > 0) {
            return firstLine.substring(0, 40) + (firstLine.length > 40 ? '...' : '');
        }
        return '文本内容';
    }

    updateSessionTitle(title) {
        if (!this.currentSessionId) return;
        
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (session) {
            session.title = title;
            session.updatedAt = new Date().toISOString();
            this.saveSessionsToStorage();
            this.renderSessionList();
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new TitleGenerator();
});