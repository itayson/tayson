/* Tayson PS4 webkit - central firmware router */
(function () {
    "use strict";
    var statusEl = document.getElementById("msgs");
    var config = window.TaysonHostConfig;
    function setStatus(message, state) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.className = "status-text" + (state ? " " + state : "");
    }
    function readLocal(key) {
        try { return window.localStorage.getItem(key) || ""; } catch (e) { return ""; }
    }
    function writeLocal(key, value) {
        try { window.localStorage.setItem(key, String(value)); } catch (e) {}
    }
    function firmware() {
        var m=(navigator.userAgent||"").match(/PlayStation 4[ \/](\d+)\.(\d+)/i);
        return m ? m[1]+"."+m[2] : "";
    }
    function recovery(code, fw, family, detail) {
        var u="recovery.html?code="+encodeURIComponent(code);
        if(fw)u+="&fw="+encodeURIComponent(fw);
        if(family)u+="&family="+encodeURIComponent(family);
        if(detail)u+="&detail="+encodeURIComponent(detail);
        window.location.replace(u);
    }
    function start() {
        var fw, route, family, build, key, attempts;
        if(!config || !config.resolveRoute){setStatus("Host configuration is unavailable.","error");return;}
        fw=firmware();
        if(!fw){setStatus("This page is for PlayStation 4 only.","error");return;}
        route=config.resolveRoute(fw);
        if(!route){setStatus("PS4 "+fw+" — unsupported firmware.","error");return;}
        family=config.families[route.family];
        if(!family){setStatus("Firmware family configuration is missing.","error");return;}
        if(!route.verified){setStatus("PS4 "+fw+" detected · "+family.label+" is not enabled for automatic loading.","warning");return;}
        setStatus("PS4 "+fw+" detected · "+family.label,"success");
        build=readLocal(family.cacheKey);
        key=family.cacheKey+"_attempts";
        if(build!==family.cacheBuild){
            attempts=parseInt(readLocal(key),10)||0;
            if(attempts>=config.maxRepairAttempts){
                setStatus("Offline cache update failed repeatedly · opening recovery...","error");
                window.setTimeout(function(){recovery("CACHE_STALE",fw,route.family,"Expected "+family.cacheBuild+", found "+(build||"none"));},450);
                return;
            }
            writeLocal(key,attempts+1);
            window.setTimeout(function(){
                setStatus("Preparing "+family.label+" offline cache · attempt "+(attempts+1)+" of "+config.maxRepairAttempts+"...","loading");
                window.location.replace(family.cachePage);
            },500);
            return;
        }
        writeLocal(key,0);
        window.setTimeout(function(){setStatus("Loading "+family.label+"...","loading");window.location.replace(route.target);},650);
    }
    if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",start,false);}else{start();}
}());
