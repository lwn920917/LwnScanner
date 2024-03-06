<template>
  <div id="app">
    <div class="container">
      <div class="info-viewer" id="infoViewer" :class="{ 'loading': isLoading }" @paste="handlePaste"
        @mousedown="handleStart" @mouseup="handleEnd" @touchstart="handleStart" @touchend="handleEnd">
        <div v-if="isLoading">Loading...</div> <!-- 显示加载状态 -->
        <div class="content-wrapper" v-else-if="infoContent" v-html="infoContent"></div>
        <div v-else>📋 Click here or paste a screenshot</div>
      </div>

      <div class="button-container">
        <button @click="copyContent">Copy Content</button>
      </div>
    </div>
  </div>
</template>


<script>
// 在 Vue 组件的 <script> 部分
import { MathpixMarkdownModel } from 'mathpix-markdown-it';
import TurndownService from 'turndown';
export default {
  name: 'App',
  data() {
    return {
      infoContent: '',
      touchStartTime: 0, // 触摸开始时间
      isLoading: false,
    };
  },
  mounted() {
  },

  methods: {
    handleStart() {
      this.touchStartTime = Date.now(); // 记录触摸开始的时间
    },
    handleEnd() {
      const touchDuration = Date.now() - this.touchStartTime; // 计算触摸持续时间
      if (touchDuration < 500) { // 如果触摸时间少于500毫秒，视为点击
        this.localAction();
      }
    },
    localAction() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => this.handleImageSelect(event);
      input.click();
    },
    handleImageSelect(event) {
      this.infoContent = "";
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const base64String = e.target.result.split(',')[1];
        this.requestServer(base64String);
      };
    },

    handlePaste(event) {
      if (event.clipboardData && event.clipboardData.items) {
        const items = event.clipboardData.items;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            // 找到了图像数据，创建一个Blob对象
            const blob = items[i].getAsFile();

            // 可以将Blob对象转换为DataURL，或直接使用Blob对象
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64String = e.target.result.split(',')[1];
              this.requestServer(base64String);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    },

    requestServer(base64String) {
      console.log("requestServer start...");
      this.isLoading = true;
      fetch('http://39.105.195.249:3334/upload_image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ base64: base64String })
      })
        .then(response => response.json())
        .then(data => {
          this.showInfo(data.text);
        })
        .catch(error => {
          this.showInfo(error);
        })
        .finally(() => {
          this.isLoading = false; // 加载结束
        });
    },


    showInfo(serverLatex) {
      console.log(serverLatex);
      const options = {
      };
      // 将 LaTeX 转换为 HTML
      const htmlContent = MathpixMarkdownModel.markdownToHTML(serverLatex, options);
      // 设置转换后的 HTML 到 infoContent 以在页面上显示
      this.infoContent = htmlContent;
    },

    convertHtmlToMarkdown(html) {
      const turndownService = new TurndownService();

      turndownService.addRule('tables', {
        // 这个filter函数用来指定哪些元素会被当前规则处理
        filter: function (node) {
          return node.nodeName === 'TABLE';
        },

        // replacement函数定义了如何将捕获的HTML元素转换为Markdown
        replacement: function (content, node) {
          var markdown = '';
          var rows = node.querySelectorAll('tr');

          // 遍历所有的行 <tr>
          rows.forEach(function (row, rowIndex) {
            var cells = row.querySelectorAll('td, th');
            var rowMarkdown = '|';

            // 遍历所有的单元格 <td> 或 <th>
            cells.forEach(function (cell) {
              // 获取单元格的文本内容，并添加到Markdown表格行
              rowMarkdown += cell.textContent.trim() + '|';
            });

            // 添加当前行到Markdown表格，并添加一个换行符
            markdown += rowMarkdown + '\n';

            // 对于第一行，添加Markdown表格头分隔符
            if (rowIndex === 0) {
              markdown += '|' + ' --- |'.repeat(cells.length) + '\n';
            }
          });

          return markdown;
        }
      });
      return turndownService.turndown(html);
    },
    copyContent() {

      // 调用convertHtmlToMarkdown方法进行转换
      const markdown = this.convertHtmlToMarkdown(this.infoContent);
      // 输出转换后的Markdown内容
      //console.log(markdown);
      // 使用navigator.clipboard.writeText复制文本到剪贴板
      navigator.clipboard.writeText(markdown).then(() => {
        // 复制成功后，你可以在这里执行一些操作，比如显示提示信息
        ('文本复制成功！');
      }).catch(err => {
        // 如果复制失败，你可以在这里处理错误，比如显示错误提示
        console.error('复制文本失败：', err);
      });
    },


  }
};
</script>


<style>
.container {
  /* 不设置最大宽度或固定宽度，允许容器根据内容调整大小 */
  margin-left: 20px;
  margin-right: 20px;
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
  justify-content: space-evenly;
  /* 在按钮周围均匀分配空间 */
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
</style>