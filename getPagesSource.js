chrome.runtime.sendMessage({
    action: "getSource",
    source: document.querySelector('html').innerHTML
});