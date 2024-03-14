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
      fetch('https://tslwn.com.cn:3334/upload_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: base64String })
      })
        .then(response => response.ok ? response.json() : Promise.reject(`网络错误: ${response.statusText}`))
        .then(data => {
          if (data?.text) {
            this.showInfo(data.text);
          } else {
            this.showInfo('未检测到文本信息');
          }
        })
        .catch(error => {
          //console.log(`请求失败: ${error}`);
          // 在这里添加额外的代码
          this.showInfo(`请求失败: ${error}`);
        })
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
  padding: 10px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 20px); /* 调整为视口高度减去上下内边距 */
  box-sizing: border-box; /* 边框和内边距包含在宽高内 */
  background-color: #eef1f5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-container,
.info-viewer {
  overflow: auto;
  border: 1px solid #ccc;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  box-sizing: border-box; /* 确保内边距不会影响到容器尺寸 */
}

.image-container {
  flex: 1;
  max-height: 33vh; /* 限制图片容器的最大高度 */
}

.info-viewer {
  flex: 2;
  padding: 15px; /* 文本区域的内边距 */
}

.button-container {
  display: flex;
  justify-content: center;
  gap: 20px; /* 按钮之间的间距 */
  margin-top: 10px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  background-color: #007bff; /* 导航栏相同的蓝色 */
  color: white;
  cursor: pointer;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

button:hover {
  background-color: #0056b3;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

button:active {
  background-color: #004080;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>

