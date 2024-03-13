<template>
  <div id="app">
    <div class="container">
      <div class="image-container" :class="{ 'no-image': !imageUrl, 'drag-over': isDragOver }" @paste="handlePaste"
        @dragover.prevent="handleDragOver" @dragenter.prevent="handleDragEnter" @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop">
        <img v-if="imageUrl" :src="imageUrl" alt="截屏Alt+s/本地" class="fixed-image">
        <div v-else class="no-image-text">
          此区域支持粘贴、拖拽、本地、截屏(Ctrl+Shift+S)<br>
        </div>
      </div>

      <div class="info-viewer" id="infoViewer" :class="{ 'loading': isLoading }">
        <div v-if="isLoading">Loading...</div>
        <div class="content-wrapper" v-else-if="infoContent" v-html="infoContent"></div>
        <div v-else></div>
      </div>

      <div class="button-container">
        <button @click="localAction">本地</button>
        <button @click="copyContent">复制</button>
      </div>
    </div>
  </div>
</template>

<script>
import { MathpixMarkdownModel } from 'mathpix-markdown-it';
import TurndownService from 'turndown';

export default {
  name: 'App',
  data() {
    return {
      imageUrl: '',
      infoContent: '',
      isLoading: false,
      isDragOver: false,
    };
  },

  created() {
    this.setupChromeExtensionListener();
  },

  methods: {
    setupChromeExtensionListener() {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request) => {
          if (request.action === "update-image") {
            this.processImage(request.imageUrl);
          }
        });
      } else {
        console.log("Running outside of a Chrome Extension.");
      }
    },

    processImage(imageDataUrl) {
      this.imageUrl = imageDataUrl;
      if (imageDataUrl) {
        const base64String = imageDataUrl.split(',')[1];
        this.requestServer(base64String);
      }
    },

    localAction() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => this.processImage(e.target.result);
          reader.readAsDataURL(file);
        }
      };
      input.click();
    },

    handleDragEnter() {
      this.isDragOver = true;
    },

    handleDragLeave() {
      this.isDragOver = false;
    },

    handleDrop(event) {
      this.isDragOver = false;
      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => this.processImage(e.target.result);
        reader.readAsDataURL(file);
      } else {
        this.showToast('请拖拽图片文件');
      }
    },

    handlePaste(event) {
      const items = event.clipboardData?.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (e) => this.processImage(e.target.result);
          reader.readAsDataURL(blob);
          break;
        } else {
          // 如果找到的不是图片类型，可以在这里给出提示
          this.showToast('请粘贴图片内容');
        }
      }
    },

    requestServer(base64String) {
      this.infoContent = "";
      this.isLoading = true;
      fetch('http://39.105.195.249:3334/upload_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: base64String })
      })
        .then(response => response.ok ? response.json() : Promise.reject(`网络错误: ${response.statusText}`))
        .then(data => {
          if (data?.text) {
            this.showInfo(data.text);
          } else {
            this.showToast('服务器未返回预期数据');
          }
        })
        .catch(error => console.log(`请求失败: ${error}`))
        .finally(() => this.isLoading = false);
    },

    showToast(message) {
      alert(message);
    },

    showInfo(serverLatex) {
      const htmlContent = MathpixMarkdownModel.markdownToHTML(serverLatex, {});
      this.infoContent = htmlContent;
    },

    convertHtmlToMarkdown(html) {
      const turndownService = new TurndownService();
      turndownService.addRule('tables', {
        filter: node => node.nodeName === 'TABLE',
        replacement: function (content, node) {
          return [...node.querySelectorAll('tr')].map(row =>
            `| ${[...row.querySelectorAll('td, th')].map(cell => cell.textContent.trim()).join(' | ')} |`
          ).join('\n') + '\n';
        }
      });
      return turndownService.turndown(html);
    },

    copyContent() {
      const markdown = this.convertHtmlToMarkdown(this.infoContent);
      navigator.clipboard.writeText(markdown)
        .then(() => this.showToast('文本复制成功！'))
        .catch(err => console.error('复制文本失败：', err));
    },
  }
};
</script>


<style>
.container {
  /* 不设置最大宽度或固定宽度，允许容器根据内容调整大小 */
  margin-left: 20px;
  margin-right: 20px;
  margin-bottom: 40px;
  margin-top: 10px;
}


.image-container {
  margin-bottom: 5px;
  border-radius: 10px;
  background: #f0f9ff;
  min-width: 400px;
  /* 你想要的固定宽度 */
  height: 300px;
  /* 你想要的固定高度 */
  overflow: auto;
  /* 如果内容超出容器，显示滚动条 */
  border: 1px solid #ccc;
}

.no-image-text {
  font-size: 20px;
  text-align: center;
  /* 保持文本水平居中 */
  display: flex;
  /* 将 .no-image-text 也设置为 Flex 容器 */
  justify-content: center;
  /* 在主轴方向上（默认为水平）居中对齐子元素 */
  align-items: center;
  /* 在交叉轴方向上（默认为垂直）居中对齐子元素 */
  height: 100%;
  /* 让 .no-image-text 占满整个 .image-container 的高度 */
}

img.fixed-image {
  display: block;
  /* 避免底部空白 */
}



.info-viewer {
  cursor: pointer;
  padding: 20px;
  border-radius: 10px;
  background: #f0f9ff;
  min-width: 400px;
  /* 设置最小宽度 */
  min-height: 400px;
  /* 设置最小高度 */
  border: 2px dashed #007BFF;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
  font-size: 20px;
  /* 在 info-viewer 下方添加一些空间 */
  overflow: auto;
  /* 如果内容超出了视图，显示滚动条 */
  /* 容器宽度将根据父容器或浏览器窗口的宽度自适应 */
  transition: all 0.3s ease;
  /* 平滑过渡效果 */
}

.info-viewer:hover {
  background-color: #e2f3ff;
  /* 鼠标悬停时的背景色 */
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
  /* 鼠标悬停时的阴影 */
}

.info-viewer:before {
  display: block;
  /* 使伪元素像块级元素一样显示 */
  margin-bottom: 10px;
  /* 伪元素和内容之间的间距 */
}

.button-container {
  width: calc(100% - 20px);
  /* 减去边距的总宽度 */
  display: flex;
  justify-content: space-between;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin: 10px;
  /* 增加顶部和底部的边距 */
}

button:hover {
  background-color: #367B37;
}

button:active {
  background-color: #2E6E2E;
}

/* 加载动画样式 */
.loader {
  border: 5px solid #f3f3f3;
  /* Light grey */
  border-top: 5px solid #3498db;
  /* Blue */
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 加载时禁用info-viewer的交互 */
.loading {
  pointer-events: none;
  /* 禁用鼠标事件 */
  opacity: 0.5;
  /* 降低透明度以表示不可交互 */
}

.image-container.drag-over {
  border-color: #007BFF;
  /* 拖拽时的边框颜色 */
  background-color: #f0f9ff;
  /* 可选：拖拽时的背景色 */
}
</style>