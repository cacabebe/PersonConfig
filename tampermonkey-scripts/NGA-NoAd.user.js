// ==UserScript==
// @name         NGA-NoAd
// @namespace    http://tampermonkey.net/
// @version      0.0.5
// @author       Githuboy
// @description  去除NGA论坛广告
// @license      MIT
// @require      https://cdn.staticfile.org/jquery/3.4.0/jquery.min.js
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @match        *://nga.178.com/*
// @grant       GM_addStyle
// @inject-into content
// @downloadURL https://update.greasyfork.org/scripts/430584/NGA-NoAd.user.js
// @updateURL https://update.greasyfork.org/scripts/430584/NGA-NoAd.meta.js
// ==/UserScript==

(function() {
    'use strict';
    var id =0;
    const _fixStyle = function(){
        GM_addStyle(".goodbad span[title]{color:inherit !important}")
    }
    var $ = window.jQuery||{};
    var findUrl = function(url){
        var idx = url.indexOf("?5");
        var len = 2;
        if(idx<0){
            idx = url.indexOf("?");
            len = 1;
        }
        if(idx<0){
            return "";
        }else{
            return url.substr(idx+len);
        }
    }
    //https://bbs.nga.cn/misc/adpage_insert_2.html?5https://bbs.nga.cn/read.php?tid=28126278
    //https://nga.178.com/misc/adpage_insert_2.html?https://nga.178.com/read.php?tid=35426260
    var url = window.location.href;
    if(url.includes("adpage")){
        var result = findUrl(url);
        if(result){
            window.location.href=result;
            return;
        }
    }
    //删除一个广告：入参可以是广告角标img或广告链接a，统一向上找到<a>再删除其外层容器
    var killAd = function(el){
        var a = $(el).is("a") ? $(el) : $(el).closest("a");
        if(a.length==0){
            $(el).remove();
            return;
        }
        var box = a.parent();
        if(box.length){
            box.remove();
        }else{
            a.remove();
        }
    };
    var task = function(){
        //静态资源域名已从img4.nga.178.com换成img4.nga.cn，改为按文件名模糊匹配，不再绑定域名
        var adImgs = $("img[src*='admark.png']");
        //兜底：即使角标图没加载出来，带ngaAds点击行为的广告图也是广告
        var adLinks = $("img[onclick*='ngaAds']");
        var adLength = adImgs.length + adLinks.length;
        if(adLength==0){
            clearInterval(id);
            setTimeout(function(){
                id = setInterval(task,100);
            },1500);
            return;
        }
        console.log("发现广告数量:"+adLength+",执行清理");
        adImgs.each((i,a)=>killAd(a));
        adLinks.each((i,a)=>killAd(a));
    };
    _fixStyle();
    id = setInterval(task,100);
    // Your code here...
})();
