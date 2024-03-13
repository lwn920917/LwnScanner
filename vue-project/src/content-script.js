console.log("content script ...");
let startX, startY, endX, endY;
let topCover, bottomCover, leftCover, rightCover;
let isCapturing = false;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "captureRegion") {
        console.log("content receive screen");
        createCovers();
    }
});

function createCovers() {
    // 创建四个覆盖层
    topCover = document.createElement('div');
    bottomCover = document.createElement('div');
    leftCover = document.createElement('div');
    rightCover = document.createElement('div');

    // 初始化覆盖层样式
    [topCover, bottomCover, leftCover, rightCover].forEach(cover => {
        cover.style.position = 'fixed';
        cover.style.backgroundColor = 'rgba(0,0,0,0.5)';
        cover.style.zIndex = '9999';
        document.body.appendChild(cover);
    });

    // 初始全屏覆盖
    updateCovers(0, 0, 0, 0);

    document.addEventListener('mousedown', startCapture);
}

function startCapture(e) {
    startX = e.clientX;
    startY = e.clientY;
    isCapturing = true; // 设置截屏状态为 true
    document.addEventListener('mousemove', resizeCapture);
    document.addEventListener('mouseup', endCapture);
}

function resizeCapture(e) {
    if (!isCapturing) return; // 如果不在截屏状态，则不执行后续操作
    endX = e.clientX;
    endY = e.clientY;
    updateCovers(startX, startY, endX, endY);
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

    captureRegion(selectedRegion);

    // 清理
    [topCover, bottomCover, leftCover, rightCover].forEach(cover => {
        if (cover && cover.parentNode) {
            cover.parentNode.removeChild(cover); // 确保要移除的元素存在且有父节点
        }
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

function captureRegion(region) {
    // 获取页面滚动条的位置
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;


    region.x = region.x + scrollX;
    region.y = region.y + scrollY;

    html2canvas(document.body, {
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height
    }).then(canvas => {
        // 检查生成的 canvas 是否有效
        if (canvas) {
            // 使用 blob 发送数据
            canvas.toBlob(blob => {
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = function () {
                        const dataUrl = reader.result;
                        // 发送数据到 background.js
                        chrome.runtime.sendMessage({ action: "capturedImage", dataUrl: dataUrl });
                    };
                    reader.readAsDataURL(blob);
                } else {
                    console.log("Failed to generate blob. No blob received.");
                }
            });
        } else {
            console.log("Failed to capture screenshot.");
        }
    }).catch(error => {
        console.log('html2canvas error:', error);
    });
}
