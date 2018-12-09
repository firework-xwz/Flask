from flask import Flask,render_template,jsonify,request
from flask_socketio import SocketIO, rooms
from flask_socketio import join_room, leave_room
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'HuangJinRong'

socketio = SocketIO(app)


'''
ROOM{'id':room}
room{
    songlist:       []
    ISFree:         bool
    CanControl      bool
    starttime:      int
    startfrom:      int
    ISPlaying:      bool
    members:        int
    reqcache:       int
}
'''

ROOM = {}
CLIENTS = {}

@app.route('/songs/<int:room_id>')
def index(room_id):
    return render_template('mytest.html', room_id=room_id)

'''
_song{
    song:{
        name:        (str)
        singer:      (str)
        interval:    <int>
        songmid:     (str)
        albummid:    (str)
    }
    owner:           (str)
}
'''
def addsong(data):
    ROOM[data['room']]['songlist'].append({'song':data['song'], 'owner':data['username']})
    print('add a song')


def remove(data):
    index = data['index']
    ROOM[data['room']]['songlist'].pop(index)
    print('removeed a song')

def puttop(data):
    song = ROOM[data['room']]['songlist'][data['index']]
    ROOM[data['room']]['songlist'].remove(song)
    ROOM[data['room']]['songlist'].insert(0,song)
    print('put a song top')

operations = {
    'add':addsong,
    'remove':remove,
    'puttop':puttop
}

'''
data{
    username:        (str)
    clinetid:        (str)
    room:            (str)
    usn:             <int>

    category:        (str)
    song: {
        name:        (str)
        singer:      (str)
        interval:    <int>
        songmid:     (str)
        albummid:    (str)
    }   
    index:           <int>
}
'''
@socketio.on('operate')
def on_operate(data):
    if ROOM[data['room']]['ISFree']:
        ROOM[data['room']]['ISFree'] = False
        try:
            # operate success
            operations[data['category']](data)
            socketio.send(data,room=data['room'])
            print(ROOM[data['room']]['songlist'])
        except:
            # operate failed
            socketio.emit('operatefail','error',room=data['clinetid'])
        ROOM[data['room']]['ISFree'] = True
    else:
        # someone else is operating counter
        socketio.emit('operatefail','busy',room=data['clinetid'])

def play(data):
    print('one client pressed play')
    # get time stamp when play music
    ROOM[data['room']]['starttime'] = int(time.time())
    ROOM[data['room']]['ISPlaying'] = True

def pause(data):
    print('one client pressed pause')
    # get time stamp when pause music
    ROOM[data['room']]['startfrom'] = data['playtime']
    ROOM[data['room']]['ISPlaying'] = False

def switch(data):
    print('one client switched next')
    # clients want to switch next song, remove the top song in server's song list
    ROOM[data['room']]['songlist'].pop(0)
    ROOM[data['room']]['starttime'] = int(time.time())
    ROOM[data['room']]['startfrom'] = 0
    print(ROOM[data['room']])

controls = [play,pause,switch]
'''
data{
    'room':         (str)
    'username':     (str)
    'category':     <int>
    'playtime':     <int>
}
'''
@socketio.on('control')
def on_control(data):
    if ROOM[data['room']]['CanControl']:
        ROOM[data['room']]['CanControl'] = False
        try:
            # control success
            controls[data['category']](data)
            socketio.emit('order',data,room=data['room'])
        except:
            # operate failed
            socketio.emit('operatefail','error',room=data['clinetid'])
        ROOM[data['room']]['CanControl'] = True
    else:
        # someone else is control audio
        socketio.emit('operatefail','操作太快',room=data['clinetid'])

@socketio.on('clientend')
def on_playend(data):
    print('client finished playing')
    room=data['room']
    ROOM[room]['reqcache'] += 1
    if ROOM[room]['reqcache'] > ROOM[room]['members']/3:
        # server switch next
        switch({'room':room})
        # clients switch next
        socketio.emit('order',{'category':2,'username':'auto'},room=room)

'''
ROOM{'id':room}
room{
    songlist:       []
    ISFree:         bool
    starttime:      int
    startfrom:      int
    members:        int
    reqcache:       int
}
'''
# used for client to join room he/she wants to join
@socketio.on('join')
def on_join(data):
    # get the room that client wants to join
    room=data['room']
    join_room(room)
    # if room not exist, create one
    if not ROOM.__contains__(room):
        ROOM[room] = {}
        ROOM[room]['songlist'] = []
        ROOM[room]['ISFree'] = True
        ROOM[room]['CanControl'] = True
        ROOM[room]['starttime'] = 0
        ROOM[room]['startfrom'] = 0
        ROOM[room]['ISPlaying'] = False
        ROOM[room]['members'] = 0
        ROOM[room]['reqcache'] = 0
        print('createroom')
        print(ROOM[room])
    # members +1
    ROOM[room]['members'] += 1
    # record new member's room
    CLIENTS[request.sid] = room
    # send list of the room to him/her
    socketio.emit('initsongs',{'list': ROOM[room]['songlist'],'starttime':ROOM[room]['starttime'],'startfrom':ROOM[room]['startfrom'],'ISPlaying':ROOM[room]['ISPlaying']},room=request.sid)
    print('init client' + str(request.sid))
    print({'list': ROOM[room]['songlist'],'starttime':ROOM[room]['starttime'],'startfrom':ROOM[room]['startfrom'],'ISPlaying':ROOM[room]['ISPlaying']})

@socketio.on('connect')
def test_connect():
    print(str(request.sid) + 'Client connected')

@socketio.on('disconnect')
def on_disconnect():
    # print(str(request.sid) + '\n\nClient disconnected!!! \n\n')
    # delete disconnected client from CLIENTS and update members number in room of the client
    room = CLIENTS.pop(request.sid)
    ROOM[room]['members'] -= 1
    print('\n\n' + str(ROOM[room]['members']) + '\n\n')


if __name__ == '__main__':
    socketio.run(app,host='0.0.0.0',port=8080)