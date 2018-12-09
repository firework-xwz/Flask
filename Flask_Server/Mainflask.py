from flask import Flask,render_template,jsonify
import dataGetter

app = Flask(__name__)

@app.route('/')
def hello_world():
    return render_template('KTVRoom.html')

@app.route('/api/urlof/<string:songmid>/', methods=['GET'])
def get_tasks(songmid):
    return dataGetter.getmusicuri(songmid)

@app.route('/api/key')
def get_key():
    return dataGetter.getkey()

@app.route('/api/search/<string:searchkey>/', methods=['GET'])
def get_search(searchkey):
    return dataGetter.getsearch(searchkey)

@app.route('/api/lyric/<string:songmid>/', methods=['GET'])
def get_lyric(songmid):
    return dataGetter.getLyric(songmid)

@app.route('/songs/<int:room_id>')
def index(room_id):
    return render_template('publicsongs.html', room_id=room_id)

@app.route('/<string:page>/')
def gopage(page):
    return render_template(page + '.html')

if __name__ == '__main__':
    app.run()
