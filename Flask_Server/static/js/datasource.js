// this js file contains functions interact with qqmusic

RootURL = 'http://' + document.domain + ':' + location.port

function httpGet(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

function getCORSMusicUrl(songmid) {
    jsonobj = JSON.parse(httpGet(RootURL + "/api/key"));
    var key = jsonobj["key"];
    return "http://101.227.216.142/amobile.music.tc.qq.com/C100" + songmid + ".m4a?vkey=" + key + "&guid=3757070001&uid=0&fromtag=30";
}

function getLyric(songmid) {
    return httpGet(RootURL + '/api/lyric/' + songmid);
}

function getAlbumCover(albummid) {
    return "https://y.gtimg.cn/music/photo_new/T002R300x300M000" + albummid + ".jpg?max_age=2592000";
}

function getSongsFromSearch(searchkey) {
    // 存放歌曲信息
    var songarray = new Array();

    jsonobj = JSON.parse(httpGet(RootURL + "/api/search/" + searchkey));
    var list = jsonobj["data"]["song"]["list"];
    for (var index = 0; index < list.length; index++) {
        var song = list[index];

        var singersstr = "";
        var singers = song["singer"];
        for (var i = 0; i < singers.length; i++) {
            var singer = singers[i];
            singersstr += singer["name"];
        }

        songarray.push({
            name: song["songname"],
            singer: singersstr,
            songmid: song["songmid"],
            albummid: song["albummid"],
            inttime: song["interval"]
        });
    }

    return songarray;
}

function convertIntTimeToStr(inttime) {
    if (inttime % 60 > 9) {
        return (parseInt(song["interval"] / 60)).toString() + ":" + (song["interval"] % 60).toString();
    } else {
        return (parseInt(song["interval"] / 60)).toString() + ":0" + (song["interval"] % 60).toString();
    }
}