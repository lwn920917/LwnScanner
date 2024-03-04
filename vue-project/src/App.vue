<template>
  <div id="app">
    <!-- 一级标题 -->
    <h1 class="title">Welcome use scanner!</h1>
    <div class="container">
      <!-- 左侧区域 -->
      <div class="image-viewer-container">
        <!-- 图片 -->
        <div class="image-viewer">
          <img :src="imageUrl" alt="Image">
        </div>
        <!-- 选择图片 -->
        <button @click="handleClick">Choose Image</button>
        <input type="file" @change="handleImageSelect">
      </div>

      <!-- 右侧区域 -->
      <div class="info-viewer-container">
        <div class="info-viewer" id="infoViewer">
          <div class="content-wrapper" v-if="infoContent" v-html="infoContent"></div>
          <div v-else>No Information</div>
        </div>

        <div class="button-container" style="display: flex; justify-content: space-between;">
          <!--  <button @click="showInfo">Show Info</button> -->
          <!-- 新增的第二个按钮 -->
          <button @click="anotherAction">Another Action</button>
        </div>
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
      imageUrl: '',
      infoContent: '',
    };
  },
  mounted() {
    // 从window对象显式访问MathJax
    if (window.MathJax) {
      window.MathJax.typeset();
    }
  },

  methods: {
    handleClick() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => this.handleImageSelect(event);
      input.click();
    },
    handleImageSelect(event) {
      /* 这里 */
      this.infoContent = "";
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        this.imageUrl = e.target.result;


        // 创建 FormData 对象并添加文件
        const formData = new FormData();
        formData.append('image', file); // 假设后端接收的字段名为'image'

        // 使用 fetch 发送 POST 请求
        fetch('http://39.105.195.249:3334/upload_image', {
          method: 'POST',
          //body: formData, // 将文件作为请求体发送
        })
          .then(response => response.json()) // 解析JSON响应
          .then(data => {
            //console.log(data); // 打印响应数据
            this.showInfo(data.text);
          })
          .catch(error => {
            //console.error('Error:', error); // 打印遇到的错误
            this.showInfo(error);
          });


      };

      reader.readAsDataURL(file);
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
    anotherAction() {

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

    showInfo(serverLatex) {
      const options = {
      };
      // 将 LaTeX 转换为 HTML
      const htmlContent = MathpixMarkdownModel.markdownToHTML(serverLatex, options);

      // 设置转换后的 HTML 到 infoContent 以在页面上显示
      this.infoContent = htmlContent;

      this.$nextTick(() => {
        if (window.MathJax) {
          window.MathJax.typesetPromise().then(() => {
            console.log('MathJax typeset finished.');
          }).catch((err) => console.error('MathJax typesetPromise error:', err));
        }
      });
    }

  }
};
</script>

<style>
#app {
  text-align: center;
}

.container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  /* 使子容器分布在左右两侧 */
}

.title {
  font-size: 24px;
  margin-bottom: 20px;
}

.image-viewer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-viewer {
  width: 400px;
  height: 400px;
  border: 1px solid #ccc;
  margin-right: 20px;
}

.image-viewer img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

button {
  padding: 10px 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #4CAF50;
  color: #fff;
  cursor: pointer;
  margin: 0 10px;
  margin-top: 10px;
}

input[type="file"] {
  display: none;
}

.info-viewer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-viewer {
  width: 400px;
  height: 400px;
  border: 1px solid #ccc;
  margin-left: 20px;
  /* 保持与图片查看器一致的间距 */
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.content-wrapper {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  /* 水平滚动 */
  overflow-y: auto;
  /* 垂直滚动 */
}
</style>
