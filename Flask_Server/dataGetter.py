import requests
import json
import base64

qualities = [("M800", ".mp3"),("C600", ".m4a"),("M500", ".mp3"),("C400", ".m4a"),("C200", ".m4a"),("C100", ".m4a")]

header = {
    'referer' : 'http://y.qq.com',
    'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3493.3 Safari/537.36'
}

def getmusicuri(songmid):
    try:
        # get value key
        # guid is a random number % 10000000000 (10 chars)
        msg = requests.get('https://c.y.qq.com/base/fcgi-bin/fcg_musicexpress.fcg?json=3&guid=3757070001&format=json', headers=header)

        key = json.loads(msg.text)['key']
        for quality in qualities:
            testurl = "https://dl.stream.qqmusic.qq.com/" + quality[0] + songmid + quality[1] + "?vkey=" + key + "&guid=3757070001&uid=0&fromtag=30";
            try:
                msg = requests.get(testurl, headers=header)
                if msg.status_code == 200:
                    return testurl
            except:
                pass
        return 'NoRes'
    except:
        return 'NoKey'

def getkey():
    return requests.get('https://c.y.qq.com/base/fcgi-bin/fcg_musicexpress.fcg?json=3&guid=3757070001&format=json', headers=header).text

def getsearch(searchkey):
    return requests.get('https://c.y.qq.com/soso/fcgi-bin/client_search_cp?cr=1&catZhida=1&n=20&w='+ searchkey).text.strip('callback()')

def getLyric(songmid):
    jsonstr = requests.get('https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?g_tk=5381&songmid=' + songmid,headers=header).text.strip('MusicJsonCallback()')
    lyricorign = base64.b64decode(json.loads(jsonstr)['lyric']).decode("utf-8")
    # print(lyricorign)
    return lyricorign[lyricorign.find('[00:'):]

# test songmid: 002WCV372JMZJw 001J5QJL1pRQYB

# print(getLyric('001J5QJL1pRQYB'))