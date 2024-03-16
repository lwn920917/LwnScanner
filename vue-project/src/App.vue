<template>
  <div id="app">
    <div class="container">
      <div class="image-container" :class="{ 'no-image': !imageUrl, 'drag-over': isDragOver }" @paste="handlePaste"
        @dragover.prevent="handleDragOver" @dragenter.prevent="handleDragEnter" @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop">
        <img v-if="imageUrl" :src="imageUrl" alt="截屏Alt+s/本地" class="fixed-image">
        <div v-else class="no-image-text"><br>
        </div>
      </div>

      <div class="info-viewer" id="infoViewer" :class="{ 'loading': isLoading }">
        <div v-if="isLoading">Loading...</div>
        <div class="content-wrapper" v-else-if="infoContent" v-html="infoContent"></div>
        <div v-else></div>
      </div>
    </div>
  </div>
</template>

<script>
import { MathpixMarkdownModel } from 'mathpix-markdown-it';
import TurndownService from 'turndown';
//import MarkdownIt from 'markdown-it'

export default {
  name: 'App',
  data() {
    return {
      imageUrl: '',
      infoContent: '',
      infoCopy: '',
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
        chrome.runtime.onMessage.addListener((request) => { // 确保这里的 request 参数已经声明
          if (request.action === "update-image") {
            this.processImage(request.imageUrl);
          } else if (request.action === "copyResponse") {
            // 处理复制响应
            if (request.success) {
              //console.log(request.message);
              this.showToast(request.message); // 显示成功提示
            } else {
              //console.error(request.message); // 记录失败信息
              this.showToast(request.message); // 显示失败提示
            }
          } else if (request.action === "upload") {
            this.localAction();
          } else if (request.action === "copy") {
            this.copyContent();
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
      this.infoCopy = "";
      this.isLoading = true;
      fetch('https://tslwn.com.cn:3334/upload_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: base64String })
      })
        .then(response => response.ok ? response.json() : Promise.reject(`网络错误: ${response.statusText}`))
        .then(data => {
          if (data?.markdown) {
            this.showInfo(data.markdown);
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

    showInfo(markdown) {
      //const mdUtil = new MarkdownIt();
      //const htmlContent = mdUtil.render(markdown);
      this.infoCopy = markdown;
      const htmlContent = MathpixMarkdownModel.markdownToHTML(markdown,
        {
          htmlTags: true,
          breaks: true,
          linkify: true,
          emoji: true,
          mathjax: true,
          sanitize: true,
          highlightCode: true,
          langPrefix: 'language-'
        });
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
      const markdown = this.infoCopy;
      //this.convertHtmlToMarkdown(this.infoContent);
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTabId = tabs[0].id;
        chrome.tabs.sendMessage(currentTabId, { action: "copyText", text: markdown });
      });
    },
  }
};
</script>


<style>
.container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 20px);
  /* 边框和内边距包含在宽高内 */
  background-color: #fff;
}

.image-container {
  flex: 1;
  max-height: 33vh;
  overflow: hidden;
  background-color: #fff;
  margin-bottom: 10px;
  border-bottom: 1px solid #ccc;
  /* 在底部添加一条线 */
}

.fixed-image {
  max-width: 100%;
  /* 限制图片宽度，保持它在容器内 */
  max-height: 100%;
  /* 限制图片高度，防止它超出容器 */
  display: block;
  /* 防止图片下方有空隙 */
  margin: 0 auto;
  /* 居中显示图片 */
}

.info-viewer {
  position: relative;
  /* 添加相对定位 */
  flex: 2;
  overflow: auto;
  background-color: #fff;
}


/* 表格样式 */
table {
  border-collapse: collapse;
  /* 使表格边框合并为单一边框 */
  width: 100%;
  /* 可根据需要调整宽度 */
}

table,
th,
td {
  border: 1px solid black;
  /* 为表格、表头和单元格添加边框 */
}

th,
td {
  padding: 8px;
  /* 添加一些内边距使表格内容更易读 */
  text-align: left;
  /* 根据需要调整文本对齐方式 */
}
</style>
