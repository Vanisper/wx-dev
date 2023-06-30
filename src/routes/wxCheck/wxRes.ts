export const wxResText = (ToUserName: string, FromUserName: string, Content: string, isJson?: boolean) => isJson ? {
    "ToUserName": ToUserName,
    "FromUserName": FromUserName,
    "CreateTime": Date.now(),
    "MsgType": "text",
    "Content": Content
} : `<xml>
<ToUserName><![CDATA[${ToUserName}]]></ToUserName>
<FromUserName><![CDATA[${FromUserName}]]></FromUserName>
<CreateTime>${Date.now()}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${Content}]]></Content>
</xml>`

export const wxResMusic = (ToUserName: string, FromUserName: string, Title: string, Description: string, MusicUrl: string, HQMusicUrl: string, ThumbMediaId: string, isJson?: boolean) => isJson ? {
    "ToUserName": ToUserName,
    "FromUserName": FromUserName,
    "CreateTime": Date.now(),
    "MsgType": "music",
    "Music": {
        "Title": Title,
        "Description": Description,
        "MusicUrl": MusicUrl,
        "HQMusicUrl": HQMusicUrl,
        "ThumbMediaId": ThumbMediaId,
    }
} : `<xml>
<ToUserName><![CDATA[${ToUserName}]]></ToUserName>
<FromUserName><![CDATA[${FromUserName}]]></FromUserName>
<CreateTime>${Date.now()}</CreateTime>
<MsgType><![CDATA[music]]></MsgType>
<Music>
<Title><![CDATA[${Title}]]></Title>
<Description><![CDATA[${Description}]]></Description>
<MusicUrl><![CDATA[${MusicUrl}]]></MusicUrl>
<HQMusicUrl><![CDATA[${HQMusicUrl}]]></HQMusicUrl>
<ThumbMediaId><![CDATA[${ThumbMediaId}]]></ThumbMediaId>
</Music>
</xml>`;