var audio = document.getElementById('audio');
var lyricContainer = document.getElementById('lyricContainer');
var albumCover = document.getElementById('albumCover');
var lyric = null;

// 维护的歌单
var SONG_LIST = new Array();
var CACHE = {
    "startfrom": 0,
    "starttime": 0
};

function initSongPlaying(song, starttime, startfrom, isplaying) {
    // if the song is playing
    if (isplaying) {
            console.log('isplaying')
        if (setAudio(GetRealSong(song))) {
            // compute time offset to sync with other clients
            var clienttimestamp = Date.parse(new Date()) / 1000;
            var offset = startfrom + (clienttimestamp - starttime);
            console.log('offset');
            console.log(offset);
            console.log('song.song.interval');
            console.log(song.song.interval);
            if (offset < song.song.interval) {
                // some browser might block audio's autoplay property
                // let user interact with UI
                showPlayOverlay();
                // store data in cache
                CACHE.startfrom = startfrom;
                CACHE.starttime = starttime;
            }
            else {
                console.log('song in ktv is finished playing, client auto send switch to server');
                sendToServer_wantnext();
            }
        }
    }
    // the song is not playing
    else {
        if (setAudio(GetRealSong(song))) {
            // set time offset to sync with other clients
            audio.currentTime = startfrom;
        }
    }
}

// in case some browser block audio autoplay,so user need to click button to catch up with playing
function catchUpPlay() {
    var clienttimestamp = Date.parse(new Date()) / 1000;
    var offset = CACHE.startfrom + (clienttimestamp - CACHE.starttime);
    if (offset < audio.duration) {
        audio.currentTime = offset;
        PlayMusic(true);
    }
    else {
        sendToServer_wantnext();
    }
}

function initCandidateSongs(existlist) {
    // initial songlist data structure
    SONG_LIST = existlist;
    // initial songlist UI
    existlist.forEach(UIaddsong);
}

/*
realsong{
    url:
    albumurl:
    lyric:
}
 */
//control player
function setAudio(realsong) {
    console.log('setAudio');
    albumCover.src = realsong.albumurl;
    try {
        setLyric(realsong.lyric);   
    } catch (error) {
        console.log('歌词有误');
        console.log(realsong.lyric);
    }
    
    if (typeof (realsong.url) != "undefined") {
        audio.src = realsong.url;
        console.log('succ setAudio()')
        return true;
    }
    else {
        console.log('setAudio 定位url失败');
        return false;
    }
}

function GetRealSong(rawsong) {
    var albumurl = getAlbumCover(rawsong.song.albummid);
    var lyric = getLyric(rawsong.song.songmid);
    // var lyric = '';
    return {
        url: rawsong.song.songurl,
        albumurl: albumurl,
        lyric: lyric
    };
}

function PlayMusic(_play) {
    if (_play) {
        audio.play();
    }
    else {
        audio.pause();
    }
}

audio.onended = function () {
    sendToServer_wantnext();
}

function wantSwitch() {
    // check if there is candidate song remain
    if (SONG_LIST.length > 1) {
        sendToServer_switch();
    }
}

function switchSong() {
    // delete first(the song playing or finished playing)
    SONG_LIST.shift();
    // check if there is candidate song remain
    if (SONG_LIST.length > 0) {
        // set info of song
        if (setAudio(GetRealSong(SONG_LIST[0]))) {
            // play music
            PlayMusic(true);
        }
    }
    // update UI
    UIremove(0);
}

function addsong(song, owner) {
    SONG_LIST.push({
        'song': song,
        'owner': owner
    })
    UIaddsong({
        'song': song,
        'owner': owner
    });
    // add first song in list
    if (SONG_LIST.length == 1) {
        if (setAudio(GetRealSong(SONG_LIST[0]))) {
            // play music
            sendToServer_play();
        }
    }
}

function removesong(index) {
    SONG_LIST.splice(index, 1);
    UIremove(index);
}

function puttopsong(index) {
    var thesongarr = SONG_LIST.splice(index, 1);
    SONG_LIST.unshift(thesongarr[0]);
    UIputtop(index);
}

//sync the lyric
audio.addEventListener("timeupdate", function (e) {
    if (!lyric) return;
    for (var i = 0, l = lyric.length; i < l; i++) {
        if (audio.currentTime > lyric[i][0] - 0.50 /*preload the lyric by 0.50s*/) {
            //single line display mode
            // lyricContainer.textContent = lyric[i][1];
            //scroll mode
            var line = document.getElementById('line-' + i),
                prevLine = document.getElementById('line-' + (i > 0 ? i - 1 : i));
            prevLine.className = '';
            //randomize the color of the current line of the lyric
            line.className = 'current-line';
            lyricContainer.style.top = 130 - line.offsetTop + 'px';
        };
    };
});


function setLyric(rawlyric) {
    lyric = parseLyric(rawlyric);
    //display lyric to the page
    appendLyric(lyric);
}

function parseLyric(text) {
    //get each line from the text
    var lines = text.split('\n'),
        //this regex mathes the time [00.12.78]
        pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
        result = [];

    // Get offset from lyrics
    var offset = this.getOffset(text);

    //remove the last empty item
    lines[lines.length - 1].length === 0 && lines.pop();
    //display all content on the page
    lines.forEach(function (v, i, a) {
        var time = v.match(pattern),
            value = v.replace(pattern, '');
        time.forEach(function (v1, i1, a1) {
            //convert the [min:sec] to secs format then store into result
            var t = v1.slice(1, -1).split(':');
            result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]) + parseInt(offset) / 1000, value]);
        });
    });
    //sort the result by time
    result.sort(function (a, b) {
        return a[0] - b[0];
    });
    
    return result;
}

function appendLyric(lyric) {
    var that = this,
        lyricContainer = this.lyricContainer,
        fragment = document.createDocumentFragment();
    //clear the lyric container first
    lyricContainer.innerHTML = '';
    lyric.forEach(function (v, i, a) {
        var line = document.createElement('p');
        line.id = 'line-' + i;
        line.textContent = v[1];
        fragment.appendChild(line);
    });
    lyricContainer.appendChild(fragment);
}

function getOffset(text) {
    //Returns offset in miliseconds.
    var offset = 0;
    try {
        // Pattern matches [offset:1000]
        var offsetPattern = /\[offset:\-?\+?\d+\]/g,
            // Get only the first match.
            offset_line = text.match(offsetPattern)[0],
            // Get the second part of the offset.
            offset_str = offset_line.split(':')[1];
        // Convert it to Int.
        offset = parseInt(offset_str);
    } catch (err) {
        //alert("offset error: "+err.message);
        offset = 0;
    }
    return offset;
}