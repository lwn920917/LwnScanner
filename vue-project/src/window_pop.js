console.log("window script ...");

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "captureWindow") {
        console.log("Content script received captureWindow message");
        createSidebar();
    }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "captureScreen") {
        console.log("Content script received captureScreen message");
        removeExistingSidebar();
        createCovers();
    }
});

function removeExistingSidebar() {
    const existingSidebar = document.getElementById('customSidebar');
    if (existingSidebar) {
        existingSidebar.remove();
        console.log("Existing sidebar removed.");
    }
}


function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'customSidebar';
    sidebar.style.position = 'fixed';
    sidebar.style.top = '0';
    sidebar.style.right = '5px';
    sidebar.style.width = '25%'; // 初始宽度为屏幕的四分之一
    sidebar.style.height = '100%';
    sidebar.style.backgroundColor = '#ffffff'; // 侧边栏背景色改为白色
    sidebar.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    sidebar.style.zIndex = '9999';
    sidebar.style.display = 'flex';
    sidebar.style.flexDirection = 'column';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'row';
    buttonContainer.style.justifyContent = 'flex-start';
    buttonContainer.style.padding = '10px 20px'; // 增加内边距
    buttonContainer.style.backgroundColor = '#007bff'; // 标题栏背景色
    buttonContainer.style.color = '#ffffff'; // 文本颜色
    buttonContainer.style.borderBottom = '2px solid #0056b3'; // 底部边框
    buttonContainer.style.width = '100%'; // 使背景色覆盖整个宽度
    buttonContainer.style.boxSizing = 'border-box'; // 确保 padding 包含在宽度内

    const closeButton = document.createElement('button');
    closeButton.innerText = 'X';
    styleButton(closeButton);
    closeButton.onclick = function () {
        sidebar.remove();
    };

    const expandButton = document.createElement('button');
    expandButton.innerText = '⇱';
    styleButton(expandButton);
    expandButton.style.marginLeft = '10px'; // 按钮之间的间距
    let isExpanded = false;
    expandButton.onclick = function () {
        if (isExpanded) {
            sidebar.style.width = '25%';
        } else {
            sidebar.style.width = '100%';
        }
        isExpanded = !isExpanded;
    };

    buttonContainer.appendChild(closeButton);
    buttonContainer.appendChild(expandButton);

    const iframe = document.createElement('iframe');
    iframe.style.flexGrow = '1';
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.src = chrome.runtime.getURL('index.html');

    sidebar.appendChild(buttonContainer);
    sidebar.appendChild(iframe);

    document.body.appendChild(sidebar);
}

function styleButton(button) {
    button.style.fontSize = '16px';
    button.style.padding = '10px 15px';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = '#0056b3'; // 按钮背景色稍微深一点
    button.style.color = '#ffffff';
    button.style.transition = 'background-color 0.3s';

    button.onmouseover = function () {
        this.style.backgroundColor = '#003d7a'; // 深蓝色背景，悬停效果
    };
    button.onmouseout = function () {
        this.style.backgroundColor = '#0056b3'; // 恢复原始背景色
    };
}

chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.action === "copyText") {
        navigator.clipboard.writeText(request.text).then(() => {
            showToast('复制成功');
            //console.log('复制成功');
            // 直接使用 chrome.runtime.sendMessage 发送响应消息
            //chrome.runtime.sendMessage({ action: "copyResponse", success: true, message: '复制成功！' });
        }).catch(err => {
            showToast('复制失败');
            //console.error('复制失败: ', err);
            // 发送失败消息
            //chrome.runtime.sendMessage({ action: "copyResponse", success: false, message: '复制失败：' + err });
        });
    }
});







let startX, startY, endX, endY;
let topCover, bottomCover, leftCover, rightCover;
let isCapturing = false;

function createCovers() {
    removeExistingCovers();
    // 创建四个覆盖层
    topCover = document.createElement('div');
    bottomCover = document.createElement('div');
    leftCover = document.createElement('div');
    rightCover = document.createElement('div');

    // 初始化覆盖层样式
    [topCover, bottomCover, leftCover, rightCover].forEach(cover => {
        cover.style.position = 'fixed';
        cover.style.backgroundColor = 'rgba(0,0,0,0.15)';
        cover.style.zIndex = '9999';
        document.body.appendChild(cover);
    });

    // 初始全屏覆盖
    updateCovers(0, 0, 0, 0);

    document.addEventListener('mousedown', startCapture);

    // 添加特定事件监听器
    document.addEventListener('keydown', handleKeydown);
}

function removeExistingCovers() {
    [topCover, bottomCover, leftCover, rightCover].forEach(cover => {
        if (cover && cover.parentNode) {
            cover.parentNode.removeChild(cover);
        }
    });
}

function handleKeydown(e) {
    if (e.key === 'Escape') {
        discardCapture();
    }
}

function discardCapture() {
    isCapturing = false;
    document.removeEventListener('mousemove', resizeCapture);
    document.removeEventListener('mouseup', endCapture);
    document.removeEventListener('mousedown', startCapture);
    document.removeEventListener('keydown', handleKeydown);

    removeExistingCovers();
}

let lx, ly, lwidth, lheight;
const pixelRatio = window.devicePixelRatio;

function startCapture(e) {
    startX = e.clientX;
    startY = e.clientY;
    isCapturing = true; // 设置截屏状态为 true

    // 初始化 lx 和 ly
    // 考虑设备像素比调整 lx 和 ly
    lx = startX;
    ly = startY;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    //console.log(lx, ly, viewportWidth, viewportHeight);

    document.addEventListener('mousemove', resizeCapture);
    document.addEventListener('mouseup', endCapture);
}

function resizeCapture(e) {
    if (!isCapturing) return; // 如果不在截屏状态，则不执行后续操作
    endX = e.clientX;
    endY = e.clientY;
    updateCovers(startX, startY, endX, endY);

    // 考虑设备像素比调整 lwidth 和 lheight
    lwidth = Math.abs(endX - startX);
    lheight = Math.abs(endY - startY);
}

function endCapture(e) {
    isCapturing = false; // 截屏结束
    document.removeEventListener('mousemove', resizeCapture);
    document.removeEventListener('mouseup', endCapture);
    document.removeEventListener('mousedown', startCapture);

    [topCover, bottomCover, leftCover, rightCover].forEach(cover => cover.style.display = 'none');


    const selectedRegion = {
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY)
    };

    // 确保在最后更新 lwidth 和 lheight，以防 resizeCapture 没有被触发
    // 在截屏结束时，确保最终的 lwidth 和 lheight 也考虑了设备像素比
    lwidth = Math.abs(endX - startX);
    lheight = Math.abs(endY - startY);
    const selectedRegion2 = {
        x: lx,
        y: ly,
        width: lwidth,
        height: lheight
    };

    //captureRegion(selectedRegion);

    // 清理
    [topCover, bottomCover, leftCover, rightCover].forEach(cover => {
        if (cover && cover.parentNode) {
            cover.parentNode.removeChild(cover); // 确保要移除的元素存在且有父节点
        }
    });

    chrome.runtime.sendMessage({ action: "captureWindow" }, (response) => {
        createSidebar();
        if (response.error) {
            reject(response.error);
        } else {
            /* cropImage(response.screenshotUrl, selectedRegion2).then(croppedImageUrl => {
                setTimeout(() => {
                    chrome.runtime.sendMessage({ action: "capturedImage", dataUrl: croppedImageUrl });
                }, 1000); // 1000 毫秒 = 1 秒
            }).catch(error => {
                console.error(error);
            }); */

            const img = new Image();
            img.onload = function () {
                // 图片加载完成后，img.width 和 img.height 包含图片的原始宽度和高度
                const originalWidth = img.width;
                const originalHeight = img.height;

                // 定义新的尺寸（例如，将图像缩小到原始宽度和高度的一半）
                const targetWidth = originalWidth / pixelRatio;
                const targetHeight = originalHeight / pixelRatio;

                // 创建一个新的canvas元素，用于调整图像尺寸
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');

                // 将原始图像绘制到新的尺寸上
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                // 从canvas中获取调整尺寸后的图像URL
                const resizedImageUrl = canvas.toDataURL();
                //console.log(`Width: ${targetWidth}, Height: ${targetHeight}`);

                // 现在你可以在这里使用图片的宽度和高度了，例如传递到cropImage函数
                cropImage(resizedImageUrl, selectedRegion2).then(croppedImageUrl => {
                    setTimeout(() => {
                        chrome.runtime.sendMessage({ action: "capturedImage", dataUrl: croppedImageUrl });
                    }, 1000); // 1000 毫秒 = 1 秒
                }).catch(error => {
                    console.error(error);
                });
            };
            img.onerror = function () {
                // 处理图片加载失败的情况
                console.error("Failed to load image");
            };
            // 设置图片的src属性为response.screenshotUrl，这将开始加载图片
            img.src = response.screenshotUrl;
        }

    });

}

// 定义cropImage函数
function cropImage(imageUrl, selectedRegion) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // 如果图片来源于不同的域，需要设置此项
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 设置canvas的尺寸为选中区域的尺寸
            canvas.width = selectedRegion.width;
            canvas.height = selectedRegion.height;

            // 在canvas上绘制选中区域的图像
            ctx.drawImage(img, selectedRegion.x, selectedRegion.y, selectedRegion.width, selectedRegion.height, 0, 0, selectedRegion.width, selectedRegion.height);

            // 将canvas内容导出为DataURL
            const croppedImageUrl = canvas.toDataURL();

            // 解析Promise，返回裁剪后的图片DataURL
            resolve(croppedImageUrl);
        };
        img.onerror = function () {
            reject(new Error('Image loading or processing failed'));
        };
        img.src = imageUrl;
    });
}

function updateCovers(startX, startY, endX, endY) {
    const rectTop = Math.min(startY, endY);
    const rectLeft = Math.min(startX, endX);
    const rectWidth = Math.abs(endX - startX);
    const rectHeight = Math.abs(endY - startY);

    // 上覆盖层
    topCover.style.top = '0px';
    topCover.style.left = '0px';
    topCover.style.width = '100%';
    topCover.style.height = `${rectTop}px`;

    // 下覆盖层
    bottomCover.style.top = `${rectTop + rectHeight}px`;
    bottomCover.style.left = '0px';
    bottomCover.style.width = '100%';
    bottomCover.style.height = `${window.innerHeight - rectTop - rectHeight}px`;

    // 左覆盖层
    leftCover.style.top = `${rectTop}px`;
    leftCover.style.left = '0px';
    leftCover.style.width = `${rectLeft}px`;
    leftCover.style.height = `${rectHeight}px`;

    // 右覆盖层
    rightCover.style.top = `${rectTop}px`;
    rightCover.style.left = `${rectLeft + rectWidth}px`;
    rightCover.style.width = `${window.innerWidth - rectLeft - rectWidth}px`;
    rightCover.style.height = `${rectHeight}px`;
}




function showToast(message) {
    // 创建 toast 容器
    const toast = document.createElement('div');
    toast.textContent = message;
    // 设置样式以使其看起来像是一个 toast 消息
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px', // 或者根据你的 UI 来调整位置
        right: '20px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 10000, // 确保它在最上层
        animation: 'fadein 0.5s, fadeout 0.5s 2.5s', // 2.5秒后淡出
    });

    // 将 toast 添加到文档中
    document.body.appendChild(toast);

    // 在一段时间后移除 toast
    setTimeout(() => {
        toast.remove();
    }, 1000); // 3秒后移除
}

// 添加 CSS 动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadein {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  
    @keyframes fadeout {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
document.head.appendChild(style);
