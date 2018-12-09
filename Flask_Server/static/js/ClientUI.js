var input = document.getElementById("searchinput");
var resultSongs = new Array();
var w;

input.addEventListener("keyup", function (event) {
    event.preventDefault();
    if (event.keyCode == 13) {
        DoMySearch();
    }
});

/*
// get from server, stored in SONG_LIST
rawsong{
    song:{
        name:        (str)
        singer:      (str)
        interval:    <int>
        songmid:     (str)
        albummid:    (str)
        songurl:     (str)
    }
    owner:           (str)    点这首歌的用户名
}

// pass to setAudio() in lyricController.js
realsong{
    url:
    albumurl:
    lyric:
}

// searched song from getSongsFromSearch() in datasource.js
song{
    name:       song["songname"],
    singer:     singersstr,
    songmid:    song["songmid"],
    albummid:   song["albummid"],
    inttime:    song["interval"]
};

// send to server, pass to sendToServer_add() in SocketioClient.js
newsong:{
    name:        (str)
    singer:      (str)
    interval:    <int>
    songmid:     (str)
    albummid:    (str)
    songurl:     (str)
}
*/
function DoMySearch() {
    searchkey = document.getElementById('searchinput').value;
    if (searchkey != "") {
        document.getElementById('SearchResultList').innerHTML = "";
        resultSongs = getSongsFromSearch(searchkey);
        resultSongs.forEach(function (song, index) {
            document.getElementById('SearchResultList').innerHTML +=
                '<li class="result-list-item" onclick="clickitem(' + index + ')"><span><b>' + song.name + '</b></span> <span>' + song.singer + '</span></li>';
        });
    }
}

function showPlayOverlay() {
    document.getElementById('overlayblock').style.height = 'auto';
}

function initPlay() {
    document.getElementById('overlayblock').style.height = '0px';
    catchUpPlay();
}

function clickitem(index) {
    var song = resultSongs[index];
    $.get("/api/urlof/" + song.songmid, function (data) {
        var newsong = {
            'name': song.name,
            'singer': song.singer,
            'interval': song.inttime,
            'songmid': song.songmid,
            'albummid': song.albummid,
            'songurl': data
        }
        if (typeof(data) != "undefined") {
            sendToServer_add(newsong);   
        }
        else{
            console.log("定位音乐资源有误！");
        }
    });
}

function removesong() {
    // sendToServer_remove(index);
}

function puttopsong() {
    // sendToServer_puttop(index);
}

function playToggle() {
    if (audio.paused) {
        sendToServer_play();
    }
    else {
        sendToServer_pause();
    }
}

function switchNext() {
    wantSwitch();
}

/* 以下是客户端收到消息更新 UI 的 demo，在接收消息的函数里调用 */
function UIaddsong(_song) {
    let text = '<div class="msg_bbl"><b>' + _song.owner + '</b> ' + _song.song.name + _song.song.singer + '</div>';
    $('div.message_holder').append(text);
}

function UIputtop(index) {
    child = document.getElementById('holder').childNodes[index];
    document.getElementById('holder').removeChild(child);
    document.getElementById('holder').insertBefore(child, document.getElementById('holder').childNodes[0]);
}

function UIremove(index) {
    child = document.getElementById('holder').childNodes[index];
    document.getElementById('holder').removeChild(child);
}