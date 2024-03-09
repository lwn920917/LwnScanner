(function () {
    let appContainer;  // 只声明，不初始化

    // 尝试获取页面上的容器元素
    appContainer = document.getElementById('app');

    if (appContainer) {
        // 如果元素已经存在，只修改其样式
        appContainer.style.display = 'block';
    } else {
        // 如果容器不存在，则创建并添加到页面中
        appContainer = document.createElement('div');
        appContainer.id = 'app'; // 与 Vue 应用中的挂载点 ID 相匹配
        appContainer.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 800px;
      height: 200px;
      z-index: 10000;
      background: white;
      border: 1px solid #ccc;
      box-shadow: -2px 2px 5px rgba(0,0,0,0.2);
      display: block; // 确保新创建的容器是可见的
    `;

        // 创建关闭按钮
        let closeButton = document.createElement('button');
        closeButton.innerText = '关闭';
        closeButton.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      cursor: pointer;
      border: none;
      background-color: #f44336;
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
    `;

        // 为关闭按钮添加点击事件，用于隐藏容器而不是移除
        closeButton.addEventListener('click', function () {
            appContainer.style.display = 'none';
        });

        appContainer.appendChild(closeButton);
        document.body.appendChild(appContainer);
    }

    // 在 appContainer 已经准备好之后，加载 Vue 应用
    let script = document.createElement('script');
    script.src = chrome.runtime.getURL('app.js'); // 确保路径正确
    script.onload = function () {
        console.log("Vue 应用已加载");
        // 在 Vue 应用加载完成后可执行的代码
    };
    script.onerror = function () {
        console.error("无法加载 Vue 应用脚本");
        // 处理脚本加载失败的情况
    };

    // 将 <script> 标签添加到 appContainer 中
    appContainer.appendChild(script);
})();