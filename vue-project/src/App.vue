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
        <button @click="showInfo">Show Info</button>
      </div>
    </div>
  </div>
</template>

<script>
// 在 Vue 组件的 <script> 部分
import { MathpixMarkdownModel } from 'mathpix-markdown-it';
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
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        this.imageUrl = e.target.result;
      };

      reader.readAsDataURL(file);
    },

    showInfo() {
      /* 这里 */
      this.infoContent = "";

      // 示例 LaTeX 字符串
      const latexString =
        `
   
  `;
      const options = {
      };
      // 将 LaTeX 转换为 HTML
      const htmlContent = MathpixMarkdownModel.markdownToHTML(latexString, options);

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
