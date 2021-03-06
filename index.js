/* global panelWindow */
/* global global */

(function () {

    var windows = require('remote').getGlobal('windows');
    var coordinator = require('remote').getGlobal('coordinator');
    var path = require('path');
    var fs = require('fs');
    var shell = require('shell');
                windows.mainWindow.openDevTools({
                detach: true
            });
    var danmu = require("./lib/danmu");
    var listener = require("./lib/listener");
    var penetrate = require("./lib/penetrate");
    var crypto = require('crypto');
    var packageJson = require("./package.json");
    var isStart = false;

    var config = null;
    try {
        config = eval(fs.readFileSync(path.resolve('config.js'), "utf-8"));
    } catch (e) {
        alert("你的config.js修改有误，解析出错：\n" + e.stack.toString());
        windows.mainWindow.openDevTools({detach: true});
        throw e;
    } 

    global.config = config;

    function initFunction() {
        windows.mainWindow.setResizable(false); // Electron doesn't support both resizable and transparency 
        document.getElementById("message").remove();
        document.querySelector(".border").remove();
        document.querySelector("body").style.background = "transparent";

        listener.init(config);
        danmu.init(config, listener, document.getElementById("main-canvas"));
        penetrate.init();
        isStart = true;
    }

    function keydownFunction(e) {
        switch (e.keyCode) {
        case 13:
            if (!isStart) {
                initFunction();
                isStart = true;
            }
            break;
        case 116:
            e.preventDefault();
        break;
        case 112:
            shell.openExternal(packageJson.homepage);
            break;
        case 123:
            windows.mainWindow.openDevTools({
                detach: true
            });
            break;
        }
    }

    document.getElementById("client-version").innerHTML = packageJson.version;
    document.getElementById("client-homepage").innerHTML = packageJson.homepage;
    document.getElementById("client-author").innerHTML = packageJson.author;
    document.title = "DANMU Client - Client ID = " + crypto.createHash('md5').update(Math.random().toString()).digest('hex');
    window.addEventListener("keydown", keydownFunction, true);

})();
