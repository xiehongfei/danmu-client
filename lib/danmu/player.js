var path = require("path");
var fs = require("fs");
var url = require("url");
var CommentFrame = require('./commentframe.js');
/**
 * 已经审核过的安全Url缓存
 * @type {Array}
 */
var safeUrl = [];
/**
 * 检测URL是否合法
 * @param  string content
 * @return bool        
 */
function checkUrlValidate(content) {
	var regex = config.image.regex;
	regex.lastIndex = 0;
	var ret = null;
	while ((ret = regex.exec(content)) !== null) {
		var unbelieveUrl = ret[2];
		if (safeUrl[unbelieveUrl]) continue; // 加载缓存
		var parsedUrl = url.parse(unbelieveUrl);
		if (parsedUrl.protocol) { // 如果是网络协议就检查白名单
			return (config.image.whitelist.indexOf(unbelieveUrl) >= 0);
		}
		var safePath = path.join("/", unbelieveUrl);
		var filePath = path.resolve("./", "." + safePath);
		var unsafePath = path.resolve(unbelieveUrl);
		if (filePath != unsafePath) return false; // 文件在上级目录或其他目录，判定为非法
		if (!fs.existsSync(unsafePath)) { // 文件不存在，判定为非法
			return false;
		}

	}
	return true;
}
/**
 * 弹幕播放器
 * @constructor
 * @param {Integer} insertElement
 * @param {DOMElement} danmuConfig
 */
function Player(insertElement, danmuConfig) {
	this.insertElement = null;
	//绘制canvas相关的组件
	this.canvas = null;
	this.frame = null;
	//存放解析好的弹幕内容
	this.danmus = [];
	this.config = danmuConfig;
}
/**
 * 初始化方法
 */
Player.prototype.setup = function (insertElement, elementId) {
	this.insertElement = document.querySelector(insertElement);
	var w = this.insertElement.offsetWidth; //控件的宽
	var h = this.insertElement.offsetHeight; //控件的高
	this.canvas = this.addCanvasElement(elementId, w, h);
	this.insertElement.parentNode.insertBefore(this.canvas, this.insertElement);
	var canvasContext = this.canvas.getContext("2d");
	this.frame = new CommentFrame(w, h, canvasContext);
};
/**
 * 控制弹幕
 * @param action
 */
Player.prototype.controlDanmu = function (action) {
	if (action == 'play') {
		this.frame.begin();
	} else if (action == 'stop') {
		this.frame.stop();
		this.frame.clearDanmu();
		this.frame.render();
	} else if (action == 'update') {
		this.addDanmu();
	}
};

/**
 * 创建canvas元素
 */
Player.prototype.addCanvasElement = function (elementId, width, height) {
	var e = window.document.createElement("canvas");
	e.id = elementId;
	e.style.position = "absolute";
	e.style.zIndex = "1000000";
	e.style.display = "block";
	e.width = width;
	e.height = height;
	return e;
};
/**
 * 将从服务器取得所有弹幕的内容，进行解析，放入this.danmus
 */
Player.prototype.parseDanmus = function (jsonResp) {
	var that = this;
	var nowTime = (new Date()).valueOf();

	this.danmus = [];
	jsonResp.forEach(function (danmu) {
		// 先检测图片弹幕
		if (config.display.image) {
			if (!checkUrlValidate(danmu.text)) return;
		}
		danmu.font = danmu.textStyle;
		danmu.lifeTime4TimeStamp = danmu.lifeTime * 1000 / 60;
		danmu.addTime = nowTime;
		danmu.height = parseInt(danmu.height);
		danmu.lifeTime = parseInt(danmu.lifeTime);
		that.danmus.push(danmu);
	});

};
/**
 * 弹幕精灵添加
 */
Player.prototype.addDanmu = function () {
	var that = this;
	this.danmus.forEach(function (info) {
		if (info.style == "custom") {
			that.frame.addCustomSprite(info);
		} else {
			that.frame.addSprite(info);
		}
	});
};
/**
 * 弹幕精灵删除
 */
Player.prototype.deleteDanmus = function (ids) {
	this.frame.deleteSprites(ids);
};
/**
 * 显示/隐藏弹幕的处理函数
 */
Player.prototype.toggleDanmu = function () {
	if (this.frame.visible) { //弹幕可见
		this.frame.clearDanmu(); //情况当前所有待渲染弹幕
		this.frame.render(); //重绘一帧空的屏幕
		this.frame.stop(); //停止Frame
		this.frame.visible = false; //设置弹幕标记为不可见
	} else { //弹幕隐藏
		this.frame.begin();
		this.frame.visible = true;
	}
};

module.exports = Player;