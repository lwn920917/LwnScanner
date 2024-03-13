let openedWindowId = null;

// 封装通用的提示函数
/* function showNotification(title, message) {
  // 发送消息给前端页面来显示通知
  chrome.runtime.sendMessage({ action: "show-notification", title: title, message: message });
} */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "capturedImage") {
    console.log("bg receive screen msg");
    const dataUrl = request.dataUrl; // 获取截图数据

    // 处理截图数据，例如创建或聚焦一个窗口来展示截图
    createOrFocusWindow(dataUrl);
  }
});

function lwnScreen() {
  // 首先，获取当前标签页
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var currentTab = tabs[0];
    if (!currentTab) {
      //showNotification("提示", "当前没有活动标签页，请打开一个网页后再试。");
      console.log("no live tab");
      return;
    }

    // 检查当前标签页的URL是否允许截图
    if (currentTab.url.startsWith("chrome://") || currentTab.url.startsWith("devtools://")) {
      //showNotification("提示", "当前页面不支持截图功能。");
      console.log("cur tab no support");
      return;
    }
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log("bg send screen msg");
      chrome.tabs.sendMessage(tabs[0].id, {action: "captureRegion"});
    });

    // 如果URL检查通过，执行截屏逻辑
    /* chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (screenshotUrl) {
      // 确保截屏成功
      if (chrome.runtime.lastError) {
        return;
      }
      // 截屏成功后继续之前的逻辑，确保传递screenshotUrl
      createOrFocusWindow(screenshotUrl);
    }); */
  });
}

function createOrFocusWindow(screenshotUrl) {
  if (openedWindowId !== null) {
    // 尝试聚焦已存在的窗口
    chrome.windows.update(openedWindowId, { focused: true }, () => {
      if (chrome.runtime.lastError) {
        // 如果窗口不存在，清除openedWindowId并创建新窗口
        openedWindowId = null;
        createWindow(screenshotUrl);
      } else {
        // 如果窗口存在，发送截屏URL更新事件
        sendUpdateImageMessage(screenshotUrl);
      }
    });
  } else {
    // 创建新窗口
    createWindow(screenshotUrl);
  }
}

function createWindow(screenshotUrl) {
  chrome.windows.create({
    url: chrome.runtime.getURL("index.html"),
    type: "popup",
    width: 600,
    height: 600
  }, function (window) {
    openedWindowId = window.id;
    // 获取屏幕宽度和高度
    chrome.system.display.getInfo(function (displayInfo) {
      const screenWidth = displayInfo[0].bounds.width;
      const screenHeight = displayInfo[0].bounds.height;

      // 计算窗口位置
      const windowLeft = screenWidth - 600;
      const windowTop = screenHeight - 600;
      // 设置窗口位置
      chrome.windows.update(window.id, {
        left: windowLeft,
        top: windowTop
      });
    });
    sendUpdateImageMessage(screenshotUrl);
  });
}

function sendUpdateImageMessage(screenshotUrl) {
  // 确保窗口中的Vue应用已经加载完成
  setTimeout(() => {
    chrome.tabs.query({ windowId: openedWindowId }, function (tabs) {
      // 发送消息到Vue应用的tab
      chrome.tabs.sendMessage(tabs[0].id, { action: "update-image", imageUrl: screenshotUrl });
    });
  }, 1000); // 延迟1秒发送，确保Vue应用加载完成，你可以根据需要调整这个时间
}


// 监听窗口关闭事件，如果是我们跟踪的窗口被关闭，清除openedWindowId
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === openedWindowId) {
    openedWindowId = null;
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "lwn-screen") {
    console.log("screen key");
    lwnScreen();
  }
});

chrome.action.onClicked.addListener((tab) => {
  // 检查是否已存在窗口，存在则尝试聚焦，否则创建新窗口
  if (openedWindowId !== null) {
    chrome.windows.update(openedWindowId, { focused: true }, () => {
      if (chrome.runtime.lastError) {
        // 如果窗口不存在，清除openedWindowId并创建新窗口
        openedWindowId = null;
        createOrFocusWindow();
      }
    });
  } else {
    createOrFocusWindow();
  }
});