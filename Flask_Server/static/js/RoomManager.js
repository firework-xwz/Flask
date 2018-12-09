// 请将 AppId 改为你自己的 AppId，否则无法本地测试
var appId = 'ajxUT4BNneoOSwLaQ7QBTYQb-gzGzoHsz';
var appKey = 'U1b62YJw5eI0aRj0QoUz3rpt';

AV.initialize(appId, appKey);

// 请换成你自己的一个房间的 conversation id（这是服务器端生成的）
var roomId;

// 每个客户端自定义的 id
var clientId = 'Manager';

// 创建实时通信实例
var realtime = new AV.Realtime({
    appId: appId,
    appKey: appKey,
    plugins: AV.TypedMessagesPlugin,
});
var client;

// 监听是否服务器连接成功
var firstFlag = true;

// 用来标记历史消息获取状态
var logFlag = false;

var loginBtn = document.getElementById('login-btn');
var inputName = document.getElementById('input-name');
var inputPassword = document.getElementById('input-password');
var inputRoomName = document.getElementById('input-roomname');
var createBtn = document.getElementById('create-btn');
var queryBtn = document.getElementById('query-btn');
var printWall = document.getElementById('print-wall');

// 拉取历史相关
// 最早一条消息的时间戳
var msgTime;

bindEvent(loginBtn, 'click', login);
bindEvent(queryBtn, 'click', queryConversations);
bindEvent(createBtn, 'click', createConversation);


bindEvent(document.body, 'keydown', function (e) {
    if (e.keyCode === 13) {
        if (firstFlag) {
            login();
        } else {
            sendMsg();
        }
    }
});

function createConversation() {
    var roomname = inputRoomName.value;
    if (roomname) {
        client.createConversation({
            name: roomname,
            // 创建暂态的聊天室（暂态聊天室支持无限人员聊天）
            transient: true,
        })
            .then(function (conversation) {
                roomId = conversation.id;
                showLog('创建新 Room 成功，id 是：', roomId);
            })
    }
}

function queryConversations() {
    var query = client.getQuery();
    console.log(client);

    query.withLastMessagesRefreshed().equalTo('tr', true).find().then(function (conversations) {
        console.log(conversations);
        conversations.forEach(function(conversation) {
            showLog(conversation._attributes.name);
        }, this);
    }).catch(console.error.bind(console));
}


function login() {
    showLog('正在登录');
    var val = inputName.value;
    if (val) {
        clientId = val;
    }
    if (!firstFlag) {
        client.close();
    }

    // 创建聊天客户端
    return AV.User.logIn(clientId, inputPassword.value)
        .then(function (user) {
            console.log(user);
            return realtime.createIMClient(user);
        })
        .then(function (c) {
            showLog('连接成功');
            firstFlag = false;
            client = c;
            client.on('disconnect', function () {
                showLog('[disconnect] 服务器连接已断开');
            });
            client.on('offline', function () {
                showLog('[offline] 离线（网络连接已断开）');
            });
            client.on('online', function () {
                showLog('[online] 已恢复在线');
            });
            client.on('schedule', function (attempt, time) {
                showLog(
                    '[schedule] ' +
                    time / 1000 +
                    's 后进行第 ' +
                    (attempt + 1) +
                    ' 次重连'
                );
            });
            client.on('retry', function (attempt) {
                showLog('[retry] 正在进行第 ' + (attempt + 1) + ' 次重连');
            });
            client.on('reconnect', function () {
                showLog('[reconnect] 重连成功');
            });
            client.on('reconnecterror', function () {
                showLog('[reconnecterror] 重连失败');
            });
        })
        .catch(function (err) {
            console.error(err);
            showLog('错误：' + err.message);
        });
}


Usernames = {
    _cache: {},
    get: function (id) {
        if (!this._cache[id]) {
            this._cache[id] = new AV.Query(AV.User)
                .get(id)
                .then(
                function (user) {
                    var username = user.getUsername();
                    this._cache[id] = username;
                    return username;
                }.bind(this)
                )
                .catch(
                function () {
                    this._cache[id] = id;
                    return id;
                }.bind(this)
                );
        }
        return this._cache[id];
    },
};


// 拉取历史
bindEvent(printWall, 'scroll', function (e) {
    if (printWall.scrollTop < 20) {
        getLog();
    }
});


// demo 中输出代码
function showLog(msg, data, isBefore) {
    if (data) {
        // console.log(msg, data);
        msg = msg + '<span class="strong">' + data + '</span>';
    }
    var p = document.createElement('p');
    p.innerHTML = msg;
    if (isBefore) {
        printWall.insertBefore(p, printWall.childNodes[0]);
    } else {
        printWall.appendChild(p);
    }
}

function encodeHTML(source) {
    return String(source)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\\/g, '&#92;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatTime(time) {
    var date = new Date(time);
    var month =
        date.getMonth() + 1 < 10
            ? '0' + (date.getMonth() + 1)
            : date.getMonth() + 1;
    var currentDate = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    var hh = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    var mm = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    var ss = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return (
        date.getFullYear() +
        '-' +
        month +
        '-' +
        currentDate +
        ' ' +
        hh +
        ':' +
        mm +
        ':' +
        ss
    );
}

function createLink(url) {
    return (
        '<a target="_blank" href="' +
        encodeHTML(url) +
        '">' +
        encodeHTML(url) +
        '</a>'
    );
}

function bindEvent(dom, eventName, fun) {
    if (window.addEventListener) {
        dom.addEventListener(eventName, fun);
    } else {
        dom.attachEvent('on' + eventName, fun);
    }
}
