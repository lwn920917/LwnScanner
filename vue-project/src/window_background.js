
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
    chrome.tabs.sendMessage(currentTab.id, { action: "captureScreen" }, function (response) {
      if (chrome.runtime.lastError) {
        // Handle the error, e.g., by logging it or showing a notification
        console.log("Error sending message: ", chrome.runtime.lastError.message);
      } else {
        // Handle the successful response if needed
        console.log("Message sent successfully", response);
      }
    });
  });
}



chrome.commands.onCommand.addListener((command) => {
  if (command === "lwn-screen") {
    console.log("screen key");
    lwnScreen();
  }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "capturedImage") {
    console.log("bg receive screen msg");
    const dataUrl = request.dataUrl; // 获取截图数据

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // 确保至少有一个活跃的标签页
      if (tabs.length > 0) {
        // 发送消息到活跃的标签页
        chrome.tabs.sendMessage(tabs[0].id, { action: "update-image", imageUrl: dataUrl });
      }
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "captureWindow") {
    // 使用 chrome.tabs.captureVisibleTab 获取当前标签页的截图
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
      if (chrome.runtime.lastError) {
        // 发送错误信息回 content_script.js
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        // 发送截图的 Data URL 回 content_script.js
        sendResponse({ screenshotUrl: dataUrl });
      }
    });

    // 返回 true 以表明将异步发送响应
    return true;
  }
});
